import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Ensure consistent environment on Windows/PowerShell by setting NODE_ENV in-process.
process.env.NODE_ENV = "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

function run() {
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const child = spawn(cmd, ["tsx", "server/index.ts"], {
    stdio: "inherit",
    cwd: projectRoot,
    env: process.env,
    shell: true,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

run();

