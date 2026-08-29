const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "temp_uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
  if (isPdfMime && isPdfExt) {
    return cb(null, true);
  }
  cb(new Error("Only PDF files are allowed."));
};

const maxSizeBytes = (parseInt(process.env.MAX_UPLOAD_MB, 10) || 5) * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeBytes },
});

module.exports = { upload, UPLOAD_DIR };
