const express = require("express");
const router = express.Router();
const {
  startAuth,
  oauthCallback,
  getStatus,
  syncApplications,
  fetchApplications,
  disconnectEmail,
} = require("../controllers/emailController");
const protect = require("../middleware/auth");

router.get("/status", protect, getStatus);
router.get("/auth", protect, startAuth);
router.get("/callback", oauthCallback);
router.get("/oauth2callback", oauthCallback); // alias for backwards compatibility
router.post("/sync", protect, syncApplications);
router.get("/fetch", protect, fetchApplications); // alias for backwards compatibility
router.post("/disconnect", protect, disconnectEmail);

module.exports = router;
