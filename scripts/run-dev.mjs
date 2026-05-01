import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Ensure consistent environment on Windows/PowerShell by setting NODE_ENV in-process.
process.env.NODE_ENV = "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

function run() {
  const tsxBin = path.resolve(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsx.cmd" : "tsx"
  );

  const child = spawn(tsxBin, ["server/index.ts"], {
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

