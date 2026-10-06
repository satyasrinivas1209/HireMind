const express = require("express");
const router = express.Router();
const { register, getUsers, createUser, approveUser, deleteUser, login, logout, me } = require("../controllers/authController");
const protect = require("../middleware/auth");
const allowRoles = require("../middleware/role");

router.post("/register", register);
router.get("/users", protect, allowRoles("Admin"), getUsers);
router.post("/users", protect, allowRoles("Admin"), createUser);
router.patch("/users/:id/approve", protect, allowRoles("Admin"), approveUser);
router.delete("/users/:id", protect, allowRoles("Admin"), deleteUser);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, me);

module.exports = router;
