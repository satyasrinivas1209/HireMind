const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const rootDir = __dirname;
const mlDir = path.join(rootDir, "ml-service");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

let pythonCmd = "python app.py";
if (process.platform === "win32") {
  const venvPy = path.join(mlDir, "venv", "Scripts", "python.exe");
  if (fs.existsSync(venvPy)) pythonCmd = `${venvPy} app.py`;
} else {
  const venvPy = path.join(mlDir, "venv", "bin", "python");
  if (fs.existsSync(venvPy)) pythonCmd = `${venvPy} app.py`;
}

console.log("[HireMind] Starting ML Service (Port 5001)…");
spawn(process.platform === "win32" ? "cmd.exe" : "/bin/sh", [process.platform === "win32" ? "/c" : "-c", pythonCmd], {
  cwd: mlDir,
  stdio: "inherit",
});

console.log("[HireMind] Starting Backend API (Port 5000)…");
spawn(process.platform === "win32" ? "cmd.exe" : "/bin/sh", [process.platform === "win32" ? "/c" : "-c", "node server.js"], {
  cwd: backendDir,
  stdio: "inherit",
});

console.log("[HireMind] Starting Frontend UI (Port 5173)…");
spawn(process.platform === "win32" ? "cmd.exe" : "/bin/sh", [process.platform === "win32" ? "/c" : "-c", "npm run dev"], {
  cwd: frontendDir,
  stdio: "inherit",
});
