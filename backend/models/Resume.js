const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    candidateName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    jobTitle: { type: String }, // denormalized snapshot for fast display

    skills: { type: [String], default: [] },
    experience: { type: String, default: "Not specified" }, // normalized e.g. "3 years"
    education: { type: [String], default: [] },

    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },

    matchScore: { type: Number, default: 0, min: 0, max: 100 },
    verdict: {
      type: String,
      enum: ["Strong Match", "Moderate Match", "Low Match"],
      default: "Low Match",
    },

    status: {
      type: String,
      enum: ["Pending", "Shortlisted", "Interviewing", "Rejected"],
      default: "Pending",
    },

    source: { type: String, enum: ["Manual Upload", "Gmail"], default: "Manual Upload" },
      sampleData: { type: Boolean, default: false },
    filePath: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
