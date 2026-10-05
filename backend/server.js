require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const hrRoutes = require("./routes/hrRoutes");
const emailRoutes = require("./routes/emailRoutes");

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ---- Core middleware ----
app.disable("x-powered-by");
app.use(helmet());

let frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
frontendUrl = frontendUrl.trim().replace(/\/+$/, "");
if (!frontendUrl.startsWith("http://") && !frontendUrl.startsWith("https://")) {
  frontendUrl = "https://" + frontendUrl;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === frontendUrl ||
        origin === "https://hiremind-frontend-gcki.onrender.com" ||
        origin.endsWith(".onrender.com")
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// ---- Rate limiting ----
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ---- Routes ----
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok", service: "hiremind-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/email", emailRoutes);

// ---- 404 for unknown API routes ----
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);

  if (err.message === "Only PDF files are allowed.") {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File exceeds the maximum upload size." });
  }

  return res.status(500).json({ message: "An unexpected server error occurred." });
});

const User = require("./models/User");

const seedDefaultAdmin = async () => {
  try {
    const adminEmail = "admin@hiremind.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: "HireMind Admin",
        email: adminEmail,
        password: "ChangeMe123!",
        role: "Admin",
      });
      console.log(`[Bootstrap] Created default admin account: ${adminEmail}`);
    }
  } catch (err) {
    console.error("[Bootstrap] Error checking/creating default admin:", err.message);
  }
};

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedDefaultAdmin();
  app.listen(PORT, () => {
    console.log(`[HireMind Backend] Running on http://localhost:${PORT}`);
  });
};

start();
