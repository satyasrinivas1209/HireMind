// Usage: allowRoles("Admin") or allowRoles("Admin", "HR")
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden. This action requires one of the following roles: ${roles.join(", ")}.`,
      });
    }
    next();
  };
};

module.exports = allowRoles;
