const Nylas = require("nylas");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const EmailConnection = require("../models/EmailConnection");
const { runParsingPipeline } = require("./resumeController");
const { UPLOAD_DIR } = require("../middleware/upload");

const getNylasClient = () => {
  const apiKey = process.env.NYLAS_API_KEY;
  if (!apiKey) {
    throw new Error("NYLAS_API_KEY environment variable is not configured.");
  }
  return new Nylas({
    apiKey,
    apiUri: process.env.NYLAS_API_URI || "https://api.us.nylas.com",
  });
};

// GET /api/email/status
const getStatus = async (req, res) => {
  try {
    const connection = await EmailConnection.findOne({ userId: req.user._id });
    if (!connection || connection.status !== "connected") {
      return res.status(200).json({ connected: false });
    }

    return res.status(200).json({
      connected: true,
      email: connection.email,
      provider: connection.provider || "Email",
      lastSyncedAt: connection.lastSyncedAt,
      status: connection.status,
    });
  } catch (err) {
    console.error("[getStatus] error:", err.message);
    return res.status(500).json({ message: "Could not check email connection status." });
  }
};

// GET /api/email/auth -> starts Nylas Hosted OAuth flow
const startAuth = async (req, res) => {
  try {
    const clientId = process.env.NYLAS_CLIENT_ID;
    const redirectUri = process.env.NYLAS_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error("[startAuth] Missing NYLAS_CLIENT_ID or NYLAS_REDIRECT_URI");
      return res.status(500).json({
        message: "Nylas OAuth configuration is missing on the server.",
      });
    }

    const nylas = getNylasClient();
    const authUrl = nylas.auth.urlForOAuth2({
      clientId,
      redirectUri,
      state: String(req.user._id),
    });

    return res.redirect(authUrl);
  } catch (err) {
    console.error("[startAuth] error:", err.message);
    return res.status(500).json({ message: "Could not start email authorization." });
  }
};

// GET /api/email/callback -> handles Nylas OAuth callback
const oauthCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (error || !code || !state) {
      console.warn("[oauthCallback] OAuth callback error or missing params:", error || "missing code/state");
      return res.redirect(`${frontendUrl}/email-applications?error=1`);
    }

    const user = await User.findById(state);
    if (!user) {
      console.warn("[oauthCallback] User not found for state ID:", state);
      return res.redirect(`${frontendUrl}/email-applications?error=invalid_user`);
    }

    const nylas = getNylasClient();
    const clientSecret = process.env.NYLAS_CLIENT_SECRET || process.env.NYLAS_API_KEY;
    const response = await nylas.auth.exchangeCodeForToken({
      clientSecret,
      clientId: process.env.NYLAS_CLIENT_ID,
      redirectUri: process.env.NYLAS_REDIRECT_URI,
      code,
    });

    const grantId = response.grantId || response.grant_id;
    const email = (response.email || user.email).toLowerCase();
    const provider = response.provider || "email";

    if (!grantId) {
      throw new Error("No grant ID returned from Nylas token exchange.");
    }

    await EmailConnection.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        grantId,
        email,
        provider,
        status: "connected",
        processedMessageIds: [], // reset on new connection so initial sync runs clean
      },
      { upsert: true, new: true }
    );

    return res.redirect(`${frontendUrl}/email-applications?connected=true`);
  } catch (err) {
    console.error("[oauthCallback] error:", err.message);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/email-applications?error=1`);
  }
};

// POST /api/email/sync -> scans inbox for application emails & processes resume attachments
const syncApplications = async (req, res) => {
  try {
    const connection = await EmailConnection.findOne({
      userId: req.user._id,
      status: "connected",
    });

    if (!connection || !connection.grantId) {
      return res
        .status(400)
        .json({ message: "No connected email account found. Please connect your email account." });
    }

    const { jobId } = req.body || {};
    const job = jobId ? await Job.findById(jobId) : await Job.findOne({ isActive: true });
    if (!job) {
      return res
        .status(400)
        .json({ message: "No target job selected or available for application matching." });
    }

    const nylas = getNylasClient();

    // Retrieve recent messages
    let messagesResponse;
    try {
      messagesResponse = await nylas.messages.list({
        identifier: connection.grantId,
        queryParams: {
          limit: 50,
        },
      });
    } catch (listErr) {
      console.error("[syncApplications] error fetching messages from Nylas:", listErr.message);
      return res.status(502).json({
        message: "Failed to connect to your email provider via Nylas. Please check your connection.",
      });
    }

    const messages = messagesResponse.data || messagesResponse || [];

    let emailsScanned = 0;
    let applicationsFound = 0;
    let resumesProcessed = 0;
    let newCandidates = 0;
    let duplicatesSkipped = 0;
    let errors = 0;

    const applicationKeywords = [
      "job application",
      "application for",
      "applying for",
      "resume",
      "cv",
      "candidate",
      "application",
      "career",
      "position",
      "role",
      "job",
    ];

    const processedSet = new Set(connection.processedMessageIds || []);

    for (const msg of messages) {
      emailsScanned++;

      const subject = (msg.subject || "").toLowerCase();
      const bodySnippet = (msg.body || msg.snippet || "").toLowerCase();
      const attachments = msg.attachments || [];

      // Check if message matches recruitment application criteria
      const matchesKeyword = applicationKeywords.some(
        (kw) => subject.includes(kw) || bodySnippet.includes(kw)
      );

      const supportedResumeAttachments = attachments.filter((att) => {
        const fn = (att.filename || "").toLowerCase();
        return fn.endsWith(".pdf") || fn.endsWith(".docx") || fn.endsWith(".doc");
      });

      const isApplicationEmail = matchesKeyword || supportedResumeAttachments.length > 0;

      if (!isApplicationEmail) {
        continue;
      }

      applicationsFound++;

      if (processedSet.has(msg.id)) {
        duplicatesSkipped++;
        continue;
      }

      let senderEmail = "unknown@candidate.local";
      let senderName = "Applicant";

      if (Array.isArray(msg.from) && msg.from.length > 0) {
        senderEmail = msg.from[0].email || senderEmail;
        senderName = msg.from[0].name || senderEmail;
      }

      if (supportedResumeAttachments.length === 0) {
        processedSet.add(msg.id);
        continue;
      }

      // Process resume attachments
      let processedSuccessfully = false;
      for (const attachment of supportedResumeAttachments) {
        const safeExt = path.extname(attachment.filename).toLowerCase() || ".pdf";
        const tempFileName = `nylas-${msg.id}-${Date.now()}${safeExt}`;
        const tempPath = path.join(UPLOAD_DIR, tempFileName);

        try {
          const fileBytes = await nylas.attachments.downloadBytes({
            identifier: connection.grantId,
            attachmentId: attachment.id,
            queryParams: {
              messageId: msg.id,
            },
          });

          fs.writeFileSync(tempPath, Buffer.from(fileBytes));

          let parsed;
          try {
            parsed = await runParsingPipeline({ filePath: tempPath, job });
            resumesProcessed++;
            processedSuccessfully = true;
          } catch (mlErr) {
            console.error(`[syncApplications] ML parse error for message ${msg.id}:`, mlErr.message);
            errors++;
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            continue;
          }

          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

          const finalCandidateEmail = parsed.email || senderEmail;
          const finalCandidateName = parsed.candidateName || senderName;

          const existingCandidate = await Resume.findOne({
            email: finalCandidateEmail,
            job: job._id,
          });

          if (existingCandidate) {
            duplicatesSkipped++;
          } else {
            await Resume.create({
              candidateName: finalCandidateName,
              email: finalCandidateEmail,
              phone: parsed.phone || "",
              job: job._id,
              jobTitle: job.title,
              source: "Nylas Email",
              skills: parsed.skills || [],
              experience: parsed.experience || "Not specified",
              education: parsed.education || [],
              matchingSkills: parsed.matchingSkills || [],
              missingSkills: parsed.missingSkills || [],
              matchScore: parsed.matchScore || 0,
              verdict: parsed.verdict || "Low Match",
            });
            newCandidates++;
          }
        } catch (attErr) {
          console.error(`[syncApplications] Attachment error for msg ${msg.id}:`, attErr.message);
          errors++;
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      }

      if (processedSuccessfully) {
        processedSet.add(msg.id);
      }
    }

    // Save updated connection stats
    connection.processedMessageIds = Array.from(processedSet);
    connection.lastSyncedAt = new Date();
    await connection.save();

    // Fetch candidate records created from email sync
    const importedResumes = await Resume.find({
      job: job._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      emailsScanned,
      applicationsFound,
      resumesProcessed,
      newCandidates,
      duplicatesSkipped,
      errors,
      jobUsedForMatching: job.title,
      applications: importedResumes,
    });
  } catch (err) {
    console.error("[syncApplications] error:", err.message);
    return res.status(500).json({ message: "Could not sync applications. Please try again." });
  }
};

// POST /api/email/disconnect -> disconnects Nylas email integration securely
const disconnectEmail = async (req, res) => {
  try {
    const connection = await EmailConnection.findOne({ userId: req.user._id });
    if (!connection) {
      return res.status(200).json({ message: "No active email connection to disconnect." });
    }

    try {
      const nylas = getNylasClient();
      await nylas.grants.destroy({ identifier: connection.grantId });
    } catch (nylasErr) {
      console.warn("[disconnectEmail] Could not revoke grant at Nylas:", nylasErr.message);
    }

    connection.status = "disconnected";
    await connection.save();

    return res.status(200).json({ message: "Email account disconnected successfully." });
  } catch (err) {
    console.error("[disconnectEmail] error:", err.message);
    return res.status(500).json({ message: "Could not disconnect email connection." });
  }
};

module.exports = {
  startAuth,
  oauthCallback,
  getStatus,
  syncApplications,
  fetchApplications: syncApplications,
  disconnectEmail,
};
