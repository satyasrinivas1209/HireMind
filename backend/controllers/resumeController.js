const fs = require("fs");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const { parseResume } = require("../utils/mlClient");

const safeUnlink = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.warn(`[resume] could not delete temp file ${filePath}: ${err.message}`);
  });
};

const verdictFromScore = (score) => {
  if (score >= 75) return "Strong Match";
  if (score >= 45) return "Moderate Match";
  return "Low Match";
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Shared pipeline: given a saved PDF path + target job, calls the ML service,
// computes matching/missing skills, and returns a Resume-shaped payload.
// Reused by both manual upload and Gmail application processing.
const runParsingPipeline = async ({ filePath, job }) => {
  const mlResult = await parseResume(filePath, job);

  const extractedSkills = Array.isArray(mlResult.skills) ? mlResult.skills : [];
  const requiredSkillsLower = (job.requiredSkills || []).map((s) => s.toLowerCase());
  const extractedSkillsLower = extractedSkills.map((s) => s.toLowerCase());

  const matchingSkills = (job.requiredSkills || []).filter((s) =>
    extractedSkillsLower.includes(s.toLowerCase())
  );
  const missingSkills = (job.requiredSkills || []).filter(
    (s) => !extractedSkillsLower.includes(s.toLowerCase())
  );

  const matchScore = Math.max(0, Math.min(100, Math.round(mlResult.matchScore ?? 0)));

  return {
    candidateName: mlResult.candidateName || "",
    email: mlResult.email || "",
    phone: mlResult.phone || "",
    skills: extractedSkills,
    experience: mlResult.experience || "Not specified",
    education: Array.isArray(mlResult.education) ? mlResult.education : [],
    matchingSkills,
    missingSkills,
    matchScore,
    verdict: verdictFromScore(matchScore),
  };
};

// POST /api/resume/upload
const uploadResume = async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "A PDF resume file is required." });
    }
    tempFilePath = req.file.path;

    const { candidateName, email, phone, jobId } = req.body;
    if (!jobId) {
      safeUnlink(tempFilePath);
      return res.status(400).json({ message: "Target job is required." });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      safeUnlink(tempFilePath);
      return res.status(404).json({ message: "Selected job could not be found." });
    }

    let parsed;
    try {
      parsed = await runParsingPipeline({ filePath: tempFilePath, job });
    } catch (mlErr) {
      console.error("[uploadResume] ML service error:", mlErr.message);
      safeUnlink(tempFilePath);
      return res.status(502).json({
        message:
          mlErr.message || "The resume parsing service is currently unavailable. Please try again shortly.",
      });
    }

    const originalName = req.file.originalname || "resume.pdf";
    const cleanFileName = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/\b(resume|cv|profile|document|final)\b/gi, "")
      .replace(/[_\-\.]+/g, " ")
      .trim();


    const finalCandidateName =
      candidateName ||
      parsed.candidateName ||
      (cleanFileName ? cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1) : "Candidate");

    const finalEmail =
      email ||
      parsed.email ||
      `${cleanFileName ? cleanFileName.toLowerCase().replace(/\s+/g, ".") : "candidate"}_${Date.now()}@candidate.local`;

    const finalPhone = phone || parsed.phone || "";

    const candidate = await Resume.create({
      candidateName: finalCandidateName,
      email: finalEmail,
      phone: finalPhone,
      job: job._id,
      jobTitle: job.title,
      source: "Manual Upload",
      skills: parsed.skills,
      experience: parsed.experience,
      education: parsed.education,
      matchingSkills: parsed.matchingSkills,
      missingSkills: parsed.missingSkills,
      matchScore: parsed.matchScore,
      verdict: parsed.verdict,
    });

    safeUnlink(tempFilePath);

    return res.status(201).json({ candidate });
  } catch (err) {
    console.error("[uploadResume] error:", err.message);
    if (tempFilePath) safeUnlink(tempFilePath);

    if (err.message === "Only PDF files are allowed.") {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File exceeds the 5 MB upload limit." });
    }
    return res.status(500).json({ message: "Could not process resume. Please try again." });
  }
};


// GET /api/resume  (supports ?search=&status=&sort=&jobId=)
const getResumes = async (req, res) => {
  try {
    const { search, status, sort, jobId } = req.query;
    const query = {};

    if (status && status !== "All") query.status = status;
    if (jobId) query.job = jobId;

    if (typeof search === "string" && search.trim()) {
      const regex = new RegExp(escapeRegExp(search.trim()), "i");
      query.$or = [{ candidateName: regex }, { skills: regex }, { email: regex }];
    }

    let sortSpec = { matchScore: -1 };
    if (sort === "lowest") sortSpec = { matchScore: 1 };
    else if (sort === "name_asc") sortSpec = { candidateName: 1 };
    else if (sort === "name_desc") sortSpec = { candidateName: -1 };
    else if (sort === "highest") sortSpec = { matchScore: -1 };

    const candidates = await Resume.find(query).sort(sortSpec).populate("job", "title");
    return res.status(200).json({ candidates });
  } catch (err) {
    console.error("[getResumes] error:", err.message);
    return res.status(500).json({ message: "Could not load candidates." });
  }
};

// GET /api/resume/:id
const getResumeById = async (req, res) => {
  try {
    const candidate = await Resume.findById(req.params.id).populate("job", "title requiredSkills");
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }
    return res.status(200).json({ candidate });
  } catch (err) {
    console.error("[getResumeById] error:", err.message);
    return res.status(500).json({ message: "Could not load candidate." });
  }
};

// PATCH /api/resume/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Shortlisted", "Interviewing", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const candidate = await Resume.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    candidate.status = status;
    await candidate.save();

    return res.status(200).json({ candidate });
  } catch (err) {
    console.error("[updateStatus] error:", err.message);
    return res.status(500).json({ message: "Could not update candidate status." });
  }
};

// GET /api/resume/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const candidates = await Resume.find();
    const totalCandidates = candidates.length;

    const shortlisted = candidates.filter((c) => c.status === "Shortlisted").length;
    const shortlistedPct = totalCandidates ? Math.round((shortlisted / totalCandidates) * 100) : 0;

    const avgMatchScore = totalCandidates
      ? Math.round(candidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / totalCandidates)
      : 0;

    const totalSkillsExtracted = candidates.reduce((sum, c) => sum + (c.skills?.length || 0), 0);

    const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    candidates.forEach((c) => {
      const s = c.matchScore || 0;
      if (s <= 20) buckets["0-20"]++;
      else if (s <= 40) buckets["21-40"]++;
      else if (s <= 60) buckets["41-60"]++;
      else if (s <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    });

    const statusDistribution = {
      Pending: candidates.filter((c) => c.status === "Pending").length,
      Shortlisted: shortlisted,
      Interviewing: candidates.filter((c) => c.status === "Interviewing").length,
      Rejected: candidates.filter((c) => c.status === "Rejected").length,
    };

    return res.status(200).json({
      totalCandidates,
      shortlisted,
      shortlistedPct,
      avgMatchScore,
      totalSkillsExtracted,
      matchScoreDistribution: buckets,
      statusDistribution,
    });
  } catch (err) {
    console.error("[getDashboardStats] error:", err.message);
    return res.status(500).json({ message: "Could not load dashboard metrics." });
  }
};

// PATCH /api/resume/bulk-status
const bulkUpdateStatus = async (req, res) => {
  try {
    const { candidateIds, status } = req.body;
    const validStatuses = ["Pending", "Shortlisted", "Interviewing", "Rejected"];

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: "candidateIds array is required." });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const result = await Resume.updateMany(
      { _id: { $in: candidateIds } },
      { $set: { status } }
    );

    return res.status(200).json({
      message: `Successfully updated ${result.modifiedCount} candidates to ${status}.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("[bulkUpdateStatus] error:", err.message);
    return res.status(500).json({ message: "Could not update candidate statuses." });
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResumeById,
  updateStatus,
  bulkUpdateStatus,
  getDashboardStats,
  runParsingPipeline, // exported for reuse by emailController
  verdictFromScore,
};

