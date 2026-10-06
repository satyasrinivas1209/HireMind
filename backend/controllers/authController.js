const User = require("../models/User");
const { generateToken, setAuthCookie, clearAuthCookie } = require("../utils/generateToken");

// POST /api/auth/register (Public Sign Up)
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ message: "Name must be between 2 and 100 characters." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const accountCount = await User.countDocuments();
    const isFirstAccount = accountCount === 0;
    const role = isFirstAccount ? "Admin" : "HR";
    const isApproved = isFirstAccount; // Admin is auto-approved, public signups require Admin approval

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      isApproved,
    });

    if (isApproved) {
      const token = generateToken(user);
      setAuthCookie(res, token);
      return res.status(201).json({ user: user.toSafeObject(), token, message: "Account created successfully!" });
    }

    return res.status(201).json({
      message: "Registration submitted successfully! Your account is pending Admin approval before you can sign in.",
      pendingApproval: true,
    });
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

    if (user.role !== "Admin" && user.isApproved === false) {
      return res.status(403).json({
        message: "Your account is pending Admin approval. Please contact an Administrator.",
        pendingApproval: true,
      });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({ user: user.toSafeObject(), token });
  } catch (err) {
    console.error("[login] error:", err.message);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// GET /api/auth/users (Admin only: list all users including pending requests)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ users: users.map((u) => u.toSafeObject()) });
  } catch (err) {
    console.error("[getUsers] error:", err.message);
    return res.status(500).json({ message: "Could not retrieve users." });
  }
};

// POST /api/auth/users (Admin only: provision user with instant approval)
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

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || "HR",
      isApproved: true,
    });

    return res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    console.error("[createUser] error:", err.message);
    return res.status(500).json({ message: "Could not create account. Please try again." });
  }
};

// PATCH /api/auth/users/:id/approve (Admin only)
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    user.isApproved = true;
    await user.save();

    return res.status(200).json({ message: "User account approved successfully.", user: user.toSafeObject() });
  } catch (err) {
    console.error("[approveUser] error:", err.message);
    return res.status(500).json({ message: "Could not approve user account." });
  }
};

// DELETE /api/auth/users/:id (Admin only)
const deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    return res.status(200).json({ message: "User account deleted." });
  } catch (err) {
    console.error("[deleteUser] error:", err.message);
    return res.status(500).json({ message: "Could not delete user account." });
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

module.exports = { register, getUsers, createUser, approveUser, deleteUser, login, logout, me };
