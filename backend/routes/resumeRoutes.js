const express = require("express");
const router = express.Router();
const {
  uploadResume,
  getResumes,
  getResumeById,
  updateStatus,
  bulkUpdateStatus,
  getDashboardStats,
} = require("../controllers/resumeController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const { upload } = require("../middleware/upload");

router.use(protect);

router.get("/dashboard/stats", getDashboardStats);
router.post("/upload", allowRoles("Admin", "HR"), upload.single("resume"), uploadResume);
router.patch("/bulk-status", allowRoles("Admin", "HR"), bulkUpdateStatus);
router.get("/", getResumes);
router.get("/:id", getResumeById);
router.patch("/:id/status", allowRoles("Admin", "HR"), updateStatus);

module.exports = router;

