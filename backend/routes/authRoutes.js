const express = require("express");
const router = express.Router();
const { register, createUser, login, logout, me } = require("../controllers/authController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

router.post("/register", register);
router.post("/users", protect, allowRoles("Admin"), createUser);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, me);

module.exports = router;
