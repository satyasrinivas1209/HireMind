const express = require("express");
const router = express.Router();
const { getJobs, createJob, updateJob, deleteJob } = require("../controllers/jobController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

router.use(protect);

router.get("/", getJobs);
router.post("/", allowRoles("Admin"), createJob);
router.put("/:id", allowRoles("Admin"), updateJob);
router.delete("/:id", allowRoles("Admin"), deleteJob);

module.exports = router;
