const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

const setAuthCookie = (res, token) => {
  res.cookie(process.env.COOKIE_NAME || "hiremind_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 1000, // 1 hour, mirrors JWT_EXPIRES_IN default
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(process.env.COOKIE_NAME || "hiremind_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
};

module.exports = { generateToken, setAuthCookie, clearAuthCookie };
