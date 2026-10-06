const User = require("../models/User");
const { generateToken, setAuthCookie, clearAuthCookie } = require("../utils/generateToken");

// POST /api/auth/register
// Public registration is limited to the first bootstrap account. Additional
// accounts must be provisioned by an authenticated administration workflow.
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ message: "Name must be between 2 and 100 characters." });
    }

    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    const accountCount = await User.countDocuments();
    if (accountCount > 0) {
      return res.status(403).json({
        message: "Public registration is disabled. Ask an Admin to provision your account.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "Admin",
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({ user: user.toSafeObject(), token });
  } catch (err) {
    console.error("[register] error:", err.message);
    return res.status(500).json({ message: "Could not create account. Please try again." });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({ user: user.toSafeObject(), token });
  } catch (err) {
    console.error("[login] error:", err.message);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// POST /api/auth/users (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ message: "Name must be between 2 and 100 characters." });
    }
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }
    if (role && !["Admin", "HR"].includes(role)) {
      return res.status(400).json({ message: "Role must be Admin or HR." });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || "HR",
    });

    return res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    console.error("[createUser] error:", err.message);
    return res.status(500).json({ message: "Could not create account. Please try again." });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out successfully." });
};

// GET /api/auth/me
const me = async (req, res) => {
  return res.status(200).json({ user: req.user.toSafeObject() });
};

module.exports = { register, createUser, login, logout, me };
