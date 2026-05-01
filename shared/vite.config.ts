import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** Each build gets a new SW cache name so deployed users drop stale HTML/JS shells. */
function belajarSwCacheBustPlugin(): Plugin {
  return {
    name: "belajar-sw-cache-bust",
    // Use writeBundle so outDir definitely contains copied public/service-worker.js
    // (closeBundle + dist/public path failed on some CI environments).
    writeBundle(options) {
      try {
        const dir = options.dir;
        if (!dir) return;
        const sw = path.join(dir, "service-worker.js");
        if (!fs.existsSync(sw)) {
          console.warn(
            "[belajar-sw-cache-bust] missing file (skip):",
            sw,
          );
          return;
        }
        let body = fs.readFileSync(sw, "utf-8");
        const tag = `belajar-${Date.now()}`;
        const next = body.replace(
          /const CACHE_NAME = ['"][^'"]*['"]/,
          `const CACHE_NAME = '${tag}'`,
        );
        fs.writeFileSync(sw, next);
      } catch (e) {
        console.warn("[belajar-sw-cache-bust] skipped:", e);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    belajarSwCacheBustPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client", "src"),
      "@shared": path.resolve(projectRoot, "shared"),
      "@assets": path.resolve(projectRoot, "attached_assets"),
    },
  },
  root: path.resolve(projectRoot, "client"),
  build: {
    outDir: path.resolve(projectRoot, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
