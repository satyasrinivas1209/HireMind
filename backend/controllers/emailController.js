const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const { encryptTokens, decryptTokens } = require("../utils/encryption");
const { runParsingPipeline, verdictFromScore } = require("./resumeController");
const { UPLOAD_DIR } = require("../middleware/upload");

const getOAuthClient = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// GET /api/email/auth  -> redirects HR user to Google's consent screen
const startAuth = async (req, res) => {
  try {
    const oauth2Client = getOAuthClient();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state: String(req.user._id), // ties the callback back to the logged-in HR user
    });
    return res.redirect(url);
  } catch (err) {
    console.error("[startAuth] error:", err.message);
    return res.status(500).json({ message: "Could not start Gmail authorization." });
  }
};

// GET /api/email/oauth2callback
const oauthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send("Missing authorization code.");
    }

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    const user = await User.findById(state);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { ciphertext, iv, authTag } = encryptTokens(tokens);
    user.gmailTokens = ciphertext;
    user.gmailTokensIV = iv;
    user.gmailTokensAuthTag = authTag;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL}/email-applications?connected=1`);
  } catch (err) {
    console.error("[oauthCallback] error:", err.message);
    return res.redirect(`${process.env.FRONTEND_URL}/email-applications?error=1`);
  }
};

// GET /api/email/status
const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+gmailTokens");
    return res.status(200).json({ connected: Boolean(user.gmailTokens) });
  } catch (err) {
    console.error("[getStatus] error:", err.message);
    return res.status(500).json({ message: "Could not check Gmail connection status." });
  }
};

const getAuthenticatedGmailClient = async (userId) => {
  const user = await User.findById(userId).select(
    "+gmailTokens +gmailTokensIV +gmailTokensAuthTag"
  );
  if (!user || !user.gmailTokens) {
    return null;
  }

  const tokens = decryptTokens(user.gmailTokens, user.gmailTokensIV, user.gmailTokensAuthTag);
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens);

  // Persist refreshed tokens transparently (never exposed to frontend)
  oauth2Client.on("tokens", async (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    const enc = encryptTokens(merged);
    user.gmailTokens = enc.ciphertext;
    user.gmailTokensIV = enc.iv;
    user.gmailTokensAuthTag = enc.authTag;
    await user.save();
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
};

const decodeBase64Url = (data) => Buffer.from(data, "base64").toString("utf8");

// GET /api/email/fetch — retrieves recent application emails, parses resume attachments
const fetchApplications = async (req, res) => {
  try {
    const gmail = await getAuthenticatedGmailClient(req.user._id);
    if (!gmail) {
      return res.status(400).json({ message: "Gmail is not connected. Please connect Gmail first." });
    }

    const { jobId } = req.query;
    const job = jobId ? await Job.findById(jobId) : await Job.findOne({ isActive: true });
    if (!job) {
      return res.status(400).json({ message: "No target job selected or available for matching." });
    }

    const list = await gmail.users.messages.list({
      userId: "me",
      q: "subject:(application OR resume OR job OR cv) has:attachment",
      maxResults: 15,
    });

    const messages = list.data.messages || [];
    const applications = [];

    for (const msg of messages) {
      try {
        const full = await gmail.users.messages.get({ userId: "me", id: msg.id });
        const headers = full.data.payload.headers || [];
        const from = headers.find((h) => h.name === "From")?.value || "Unknown";
        const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)";
        const date = headers.find((h) => h.name === "Date")?.value || null;

        const parts = full.data.payload.parts || [];
        const attachmentPart = parts.find(
          (p) => p.filename && p.filename.toLowerCase().endsWith(".pdf") && p.body?.attachmentId
        );

        if (!attachmentPart) {
          applications.push({
            messageId: msg.id,
            from,
            subject,
            date,
            hasResume: false,
            skills: [],
            experience: null,
            education: [],
            matchScore: null,
          });
          continue;
        }

        const attachment = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: msg.id,
          id: attachmentPart.body.attachmentId,
        });

        const buffer = Buffer.from(attachment.data.data, "base64");
        const tempPath = path.join(UPLOAD_DIR, `gmail-${msg.id}.pdf`);
        fs.writeFileSync(tempPath, buffer);

        let parsed;
        try {
          parsed = await runParsingPipeline({ filePath: tempPath, job });
        } catch (mlErr) {
          console.error(`[fetchApplications] ML error for ${msg.id}:`, mlErr.message);
          fs.unlink(tempPath, () => {});
          applications.push({
            messageId: msg.id,
            from,
            subject,
            date,
            hasResume: true,
            parseError: true,
            skills: [],
            experience: null,
            education: [],
            matchScore: null,
          });
          continue;
        }

        // Persist candidate record from email
        const emailMatch = from.match(/<(.+)>/);
        const candidateEmail = emailMatch ? emailMatch[1] : from;
        const candidateName = from.replace(/<.+>/, "").trim().replace(/"/g, "") || candidateEmail;

        const existing = await Resume.findOne({ email: candidateEmail, job: job._id });
        if (!existing) {
          await Resume.create({
            candidateName,
            email: candidateEmail,
            job: job._id,
            jobTitle: job.title,
            source: "Gmail",
            ...parsed,
          });
        }

        fs.unlink(tempPath, () => {});

        applications.push({
          messageId: msg.id,
          from,
          subject,
          date,
          hasResume: true,
          ...parsed,
        });
      } catch (innerErr) {
        console.error(`[fetchApplications] error processing message ${msg.id}:`, innerErr.message);
      }
    }

    return res.status(200).json({ applications, jobUsedForMatching: job.title });
  } catch (err) {
    console.error("[fetchApplications] error:", err.message);
    return res.status(502).json({
      message: "Could not fetch Gmail applications. Please reconnect Gmail and try again.",
    });
  }
};

module.exports = { startAuth, oauthCallback, getStatus, fetchApplications };
