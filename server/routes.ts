import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import archiver from "archiver";
import {
  generateVocabulary,
  generateSentences,
  advancedTranslate,
  testGeminiConnection,
} from "./lib/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test Gemini connection
  app.get("/api/test/gemini", async (req, res) => {
    const result = await testGeminiConnection();
    res.json(result);
  });

  // AI-powered vocabulary generation (no API key needed from client)
  app.post("/api/generate/vocabulary", async (req, res) => {
    try {
      const { theme, difficulty, count } = req.body;
      
      if (!theme || !difficulty) {
        return res.status(400).json({ error: "theme and difficulty are required" });
      }
      
      const words = await generateVocabulary(
        theme,
        Number(difficulty),
        count ? Number(count) : 10
      );
      
      res.json({ words });
    } catch (error: any) {
      console.error("Vocabulary generation error:", error);
      const errorMsg = error?.message || "Failed to generate vocabulary";
      
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json({ error: "本日のAI生成回数上限に達しました。明日また試してください。" });
      }
      
      res.status(500).json({ error: "AI生成に失敗しました。もう一度お試しください。" });
    }
  });

  // AI-powered sentence generation
  app.post("/api/generate/sentences", async (req, res) => {
    try {
      const { situation, difficulty, count } = req.body;
      
      if (!situation || !difficulty) {
        return res.status(400).json({ error: "situation and difficulty are required" });
      }
      
      const sentences = await generateSentences(
        situation,
        Number(difficulty),
        count ? Number(count) : 5
      );
      
      res.json({ sentences });
    } catch (error: any) {
      console.error("Sentence generation error:", error);
      const errorMsg = error?.message || "Failed to generate sentences";
      
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json({ error: "本日のAI生成回数上限に達しました。明日また試してください。" });
      }
      
      res.status(500).json({ error: "AI生成に失敗しました。もう一度お試しください。" });
    }
  });

  // Advanced translation with grammar explanations
  app.post("/api/translate/advanced", async (req, res) => {
    try {
      const { text, sourceLanguage } = req.body;
      
      if (!text || !sourceLanguage) {
        return res.status(400).json({ error: "text and sourceLanguage are required" });
      }
      
      if (sourceLanguage !== "japanese" && sourceLanguage !== "indonesian") {
        return res.status(400).json({ error: "sourceLanguage must be 'japanese' or 'indonesian'" });
      }
      
      const result = await advancedTranslate(text, sourceLanguage);
      
      res.json(result);
    } catch (error: any) {
      console.error("Translation error:", error);
      const errorMsg = error?.message || "Failed to translate";
      
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json({ error: "本日のAI生成回数上限に達しました。明日また試してください。" });
      }
      
      res.status(500).json({ error: "翻訳に失敗しました。もう一度お試しください。" });
    }
  });

  // Download project as ZIP
  app.get("/api/download/project", (req, res) => {
    const projectRoot = path.resolve(process.cwd());
    const zipName = "belajar-indonesian-app.zip";

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.status(500).end();
    });
    archive.pipe(res);

    const include = [
      "client",
      "server",
      "shared",
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      "tailwind.config.ts",
      "vite.config.ts",
      "postcss.config.js",
      "components.json",
      "drizzle.config.ts",
      "replit.md",
    ];

    const excludeDirs = new Set(["node_modules", ".git", "dist", ".local", ".cache", ".upm", ".agents"]);

    for (const item of include) {
      const fullPath = path.join(projectRoot, item);
      try {
        const fs = require("fs");
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          archive.glob("**/*", {
            cwd: fullPath,
            dot: true,
            ignore: [...excludeDirs].map((d) => `**/${d}/**`),
          }, { prefix: item });
        } else {
          archive.file(fullPath, { name: item });
        }
      } catch {
        // File/dir not found, skip
      }
    }

    archive.finalize();
  });

  const httpServer = createServer(app);

  return httpServer;
}
