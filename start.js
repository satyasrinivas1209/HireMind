const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const runService = (name, command, args, cwd, env = {}) => {
  console.log(`[HireMind] Starting ${name}…`);
  const proc = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });

  proc.on("error", (err) => {
    console.error(`[HireMind] Error starting ${name}:`, err.message);
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[HireMind] ${name} exited with code ${code}`);
    }
  });

  return proc;
};

const main = () => {
  const rootDir = __dirname;
  const mlDir = path.join(rootDir, "ml-service");
  const backendDir = path.join(rootDir, "backend");
  const frontendDir = path.join(rootDir, "frontend");

  // Determine python executable path
  let pythonCmd = "python";
  if (process.platform === "win32") {
    const venvPy = path.join(mlDir, "venv", "Scripts", "python.exe");
    if (fs.existsSync(venvPy)) pythonCmd = `"${venvPy}"`;
  } else {
    const venvPy = path.join(mlDir, "venv", "bin", "python");
    if (fs.existsSync(venvPy)) pythonCmd = `"${venvPy}"`;
  }

  // 1. ML Service (Port 5001)
  runService("ML Service (Port 5001)", pythonCmd, ["app.py"], mlDir);

  // 2. Backend Service (Port 5000)
  runService("Backend API (Port 5000)", "node", ["server.js"], backendDir);

  // 3. Frontend Dev Server (Port 5173)
  runService("Frontend UI (Port 5173)", "npm", ["run", "dev"], frontendDir);
};

main();
