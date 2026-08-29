const Job = require("../models/Job");

const parseSkills = (skillsInput) => {
  if (Array.isArray(skillsInput)) return skillsInput.map((s) => s.trim()).filter(Boolean);
  if (typeof skillsInput === "string") {
    return skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// GET /api/jobs
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return res.status(200).json({ jobs });
  } catch (err) {
    console.error("[getJobs] error:", err.message);
    return res.status(500).json({ message: "Could not load jobs." });
  }
};

// POST /api/jobs (Admin only)
const createJob = async (req, res) => {
  try {
    const { title, description, requiredSkills, isActive } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Job title and description are required." });
    }

    const job = await Job.create({
      title,
      description,
      requiredSkills: parseSkills(requiredSkills),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user._id,
    });

    return res.status(201).json({ job });
  } catch (err) {
    console.error("[createJob] error:", err.message);
    return res.status(500).json({ message: "Could not create job." });
  }
};

// PUT /api/jobs/:id (Admin only)
const updateJob = async (req, res) => {
  try {
    const { title, description, requiredSkills, isActive } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (requiredSkills !== undefined) job.requiredSkills = parseSkills(requiredSkills);
    if (isActive !== undefined) job.isActive = Boolean(isActive);

    await job.save();
    return res.status(200).json({ job });
  } catch (err) {
    console.error("[updateJob] error:", err.message);
    return res.status(500).json({ message: "Could not update job." });
  }
};

// DELETE /api/jobs/:id (Admin only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }
    return res.status(200).json({ message: "Job deleted successfully." });
  } catch (err) {
    console.error("[deleteJob] error:", err.message);
    return res.status(500).json({ message: "Could not delete job." });
  }
};

module.exports = { getJobs, createJob, updateJob, deleteJob };
