// Run with: npm run seed
// Populates realistic demo jobs and candidates without duplicating sample records.
require("dotenv").config();
const mongoose = require("mongoose");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const User = require("../models/User");

const sampleJobs = [
  {
    title: "Senior Frontend Engineer",
    description:
      "Lead the frontend platform for a Bengaluru fintech product. Partner with product and design to ship fast, accessible interfaces for millions of customers.",
    requiredSkills: ["React", "Node", "JavaScript", "TypeScript", "CSS", "HTML", "Redux"],
    isActive: true,
  },
  {
    title: "Cloud DevOps Engineer - Hyderabad HealthTech",
    description:
      "Own secure cloud infrastructure and deployment automation for a Hyderabad health-tech platform handling sensitive patient workflows.",
    requiredSkills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Python", "Terraform"],
    isActive: true,
  },
  {
    title: "Product Data Scientist - Pune SaaS",
    description:
      "Use experimentation, statistics, and machine learning to improve customer retention and product discovery for a Pune-based B2B SaaS company.",
    requiredSkills: ["Python", "Machine Learning", "TensorFlow", "Pandas", "NumPy", "SQL"],
    isActive: true,
  },
  {
    title: "Backend Engineer - Chennai Logistics",
    description:
      "Build reliable APIs and event-driven services that optimize last-mile delivery operations across Indian cities.",
    requiredSkills: ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Docker", "REST API", "Kafka"],
    isActive: true,
  },
  {
    title: "People Analytics Manager - Mumbai",
    description:
      "Turn workforce data into practical recommendations for hiring, engagement, capability building, and retention across a growing Mumbai organization.",
    requiredSkills: ["Excel", "Power BI", "SQL", "Data Analysis", "Tableau", "Communication"],
    isActive: true,
  },
  {
    title: "Cybersecurity Analyst - New Delhi",
    description:
      "Monitor, investigate, and improve security controls for a high-growth technology company operating across India.",
    requiredSkills: ["Linux", "Python", "SQL", "AWS", "Jira", "REST API"],
    isActive: false,
  },
];

const sampleCandidates = [
  { name: "Ananya Sharma", email: "ananya.sharma.demo@hiremind.local", phone: "+91 98765 12001", job: sampleJobs[0].title, skills: ["React", "Node", "JavaScript", "TypeScript", "CSS", "HTML", "Redux"], experience: "6 years", education: ["Bachelor of Technology", "Computer Science"], status: "Shortlisted", score: 94 },
  { name: "Rohan Mehta", email: "rohan.mehta.demo@hiremind.local", phone: "+91 98100 12002", job: sampleJobs[0].title, skills: ["React", "JavaScript", "TypeScript", "HTML", "CSS"], experience: "4 years", education: ["Bachelor of Engineering", "Information Technology"], status: "Interviewing", score: 81 },
  { name: "Priya Nair", email: "priya.nair.demo@hiremind.local", phone: "+91 98470 12003", job: sampleJobs[1].title, skills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Python", "Terraform"], experience: "7 years", education: ["Master of Technology", "Computer Science"], status: "Shortlisted", score: 96 },
  { name: "Vikram Reddy", email: "vikram.reddy.demo@hiremind.local", phone: "+91 99080 12004", job: sampleJobs[1].title, skills: ["AWS", "Docker", "Linux", "Python"], experience: "3 years", education: ["Bachelor of Technology"], status: "Pending", score: 68 },
  { name: "Kavya Iyer", email: "kavya.iyer.demo@hiremind.local", phone: "+91 98840 12005", job: sampleJobs[2].title, skills: ["Python", "Machine Learning", "Pandas", "NumPy", "SQL", "TensorFlow"], experience: "5 years", education: ["Master of Science", "Data Science"], status: "Interviewing", score: 92 },
  { name: "Arjun Kapoor", email: "arjun.kapoor.demo@hiremind.local", phone: "+91 98110 12006", job: sampleJobs[2].title, skills: ["Python", "Pandas", "SQL", "Data Analysis"], experience: "2 years", education: ["Bachelor of Technology", "Computer Science"], status: "Pending", score: 63 },
  { name: "Sanjay Kumar", email: "sanjay.kumar.demo@hiremind.local", phone: "+91 98400 12007", job: sampleJobs[3].title, skills: ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Docker", "REST API", "Kafka"], experience: "8 years", education: ["Bachelor of Engineering", "Computer Science"], status: "Shortlisted", score: 95 },
  { name: "Meera Joshi", email: "meera.joshi.demo@hiremind.local", phone: "+91 98220 12008", job: sampleJobs[3].title, skills: ["Java", "Spring Boot", "PostgreSQL", "REST API"], experience: "4 years", education: ["Bachelor of Engineering"], status: "Rejected", score: 61 },
  { name: "Ishita Desai", email: "ishita.desai.demo@hiremind.local", phone: "+91 98200 12009", job: sampleJobs[4].title, skills: ["Excel", "Power BI", "SQL", "Data Analysis", "Communication"], experience: "6 years", education: ["Master of Business Administration"], status: "Interviewing", score: 89 },
  { name: "Aditya Verma", email: "aditya.verma.demo@hiremind.local", phone: "+91 98180 12010", job: sampleJobs[4].title, skills: ["Excel", "SQL", "Tableau", "Data Analysis"], experience: "3 years", education: ["Bachelor of Commerce"], status: "Pending", score: 74 },
  { name: "Nisha Thomas", email: "nisha.thomas.demo@hiremind.local", phone: "+91 98730 12011", job: sampleJobs[5].title, skills: ["Linux", "Python", "SQL", "AWS", "Jira", "REST API"], experience: "5 years", education: ["Bachelor of Technology", "Information Technology"], status: "Shortlisted", score: 91 },
  { name: "Rahul Bansal", email: "rahul.bansal.demo@hiremind.local", phone: "+91 98100 12012", job: sampleJobs[5].title, skills: ["Linux", "Python", "SQL", "Jira"], experience: "2 years", education: ["Bachelor of Computer Applications"], status: "Pending", score: 66 },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ role: "Admin" }).select("_id").lean();
    const jobIds = new Map();

    for (const sampleJob of sampleJobs) {
      const job = await Job.findOneAndUpdate(
        { title: sampleJob.title },
        { ...sampleJob, ...(admin ? { createdBy: admin._id } : {}) },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      jobIds.set(job.title, job._id);
    }

    for (const candidate of sampleCandidates) {
      const { name, email, phone, job, skills, experience, education, status, score } = candidate;
      const matchingSkills = skills.filter((skill) => sampleJobs.find((item) => item.title === job).requiredSkills.includes(skill));
      const requiredSkills = sampleJobs.find((item) => item.title === job).requiredSkills;
      await Resume.findOneAndUpdate(
        { email, job: jobIds.get(job), sampleData: true },
        {
          candidateName: name,
          email,
          phone,
          job: jobIds.get(job),
          jobTitle: job,
          skills,
          experience,
          education,
          matchingSkills,
          missingSkills: requiredSkills.filter((skill) => !matchingSkills.includes(skill)),
          matchScore: score,
          verdict: score >= 75 ? "Strong Match" : score >= 45 ? "Moderate Match" : "Low Match",
          status,
          source: "Manual Upload",
          sampleData: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`[seed] Upserted ${sampleJobs.length} sample jobs and ${sampleCandidates.length} sample candidates.`);
  } catch (err) {
    console.error("[seed] error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
