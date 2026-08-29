const express = require("express");
const router = express.Router();
const { startAuth, oauthCallback, getStatus, fetchApplications } = require("../controllers/emailController");
const protect = require("../middleware/auth");

// oauth2callback cannot require the cookie-based `protect` in the same way a normal
// XHR route would, since it's a top-level browser redirect from Google — but the
// user must already be logged into HireMind (cookie present) for the redirect to work.
router.get("/auth", protect, startAuth);
router.get("/oauth2callback", protect, oauthCallback);
router.get("/status", protect, getStatus);
router.get("/fetch", protect, fetchApplications);

module.exports = router;
