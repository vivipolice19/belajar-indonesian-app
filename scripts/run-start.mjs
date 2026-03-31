import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Ensure consistent environment on Windows/PowerShell by setting NODE_ENV in-process.
process.env.NODE_ENV = "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const distIndex = path.resolve(projectRoot, "dist", "index.js");

function run() {
  const child = spawn(process.execPath, [distIndex], {
    stdio: "inherit",
    cwd: projectRoot,
    env: process.env,
    shell: false,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

run();

