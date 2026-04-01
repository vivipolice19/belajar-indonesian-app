import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const srcDir = path.resolve(projectRoot, "node_modules", "kuromoji", "dict");
const dstDir = path.resolve(projectRoot, "client", "public", "kuromoji");

function copyDirSync(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, dstPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

try {
  if (!fs.existsSync(srcDir)) {
    console.warn("[copy-kuromoji-dict] source dict not found:", srcDir);
    process.exit(0);
  }
  copyDirSync(srcDir, dstDir);
  console.log("[copy-kuromoji-dict] copied to", dstDir);
} catch (e) {
  console.warn("[copy-kuromoji-dict] failed:", e?.message || e);
  process.exit(0);
}

