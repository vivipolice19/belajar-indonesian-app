import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

/** Each build gets a new SW cache name so deployed users drop stale HTML/JS shells. */
function belajarSwCacheBustPlugin() {
  return {
    name: "belajar-sw-cache-bust",
    closeBundle() {
      const sw = path.resolve(
        import.meta.dirname,
        "dist",
        "public",
        "service-worker.js",
      );
      if (!fs.existsSync(sw)) return;
      let body = fs.readFileSync(sw, "utf-8");
      const tag = `belajar-${Date.now()}`;
      body = body.replace(
        /const CACHE_NAME = '[^']*'/,
        `const CACHE_NAME = '${tag}'`,
      );
      fs.writeFileSync(sw, body);
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
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
