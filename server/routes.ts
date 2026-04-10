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
  generateJapaneseReading,
  generateJapaneseReadingsBatch,
} from "./lib/gemini";
import {
  generateJapaneseReadingLocal,
  generateJapaneseReadingsBatchLocal,
} from "./lib/japaneseReadingLocal";
import { synthesizeToMp3Buffer } from "./lib/googleTranslateTts";
import { WORDS_DATA, SENTENCES_DATA } from "../shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test Gemini connection
  app.get("/api/test/gemini", async (req, res) => {
    const result = await testGeminiConnection();
    res.json(result);
  });

  /** MP3 audio for read-aloud when browser speechSynthesis is silent (server-side TTS proxy). */
  app.get("/api/tts", async (req, res) => {
    const text = String(req.query.text ?? "").trim();
    const lang = String(req.query.lang ?? "id").toLowerCase();
    const tl: "ja" | "id" = lang === "ja" ? "ja" : "id";
    if (!text || text.length > 2000) {
      return res.status(400).json({ error: "bad_request" });
    }
    try {
      const buf = await synthesizeToMp3Buffer(text, tl);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "private, max-age=300");
      res.send(buf);
    } catch (e) {
      console.error("[api/tts]", e);
      res.status(502).json({ error: "tts_unavailable" });
    }
  });

  // AI-powered vocabulary generation (no API key needed from client)
  const aiLimit = {
    messageJa: "本日のAI生成回数上限に達しました。明日また試してください。",
    messageId: "Batas pemakaian AI hari ini tercapai. Coba lagi besok.",
  };
  const aiFail = {
    messageJa: "AI生成に失敗しました。もう一度お試しください。",
    messageId:
      "Gagal membuat konten AI. Periksa GEMINI_API_KEY di server atau coba lagi.",
  };
  const isQuotaLike = (msg: string) =>
    /RESOURCE_EXHAUSTED|Gemini API error:\s*429|(?:^|\D)429(?:\D|$)/i.test(msg);
  const pickRandom = <T,>(arr: T[], n: number): T[] =>
    [...arr].sort(() => Math.random() - 0.5).slice(0, Math.max(1, n));
  const fallbackWords = (
    theme: string,
    difficulty: number,
    count: number,
  ) => {
    const maxLv = Math.max(1, Math.min(10, Math.floor(difficulty)));
    const pool = WORDS_DATA.filter(
      (w) => (w.category?.includes(theme) ?? false) || w.requiredLevel <= maxLv,
    );
    const selected = pickRandom(pool.length ? pool : WORDS_DATA, count);
    return selected.map((w) => ({
      indonesian: w.indonesian,
      japanese: w.japanese,
      category: w.category || theme,
      difficulty: maxLv,
      pronunciation_guide: "",
    }));
  };
  const fallbackSentences = (
    situation: string,
    difficulty: number,
    count: number,
  ) => {
    const maxLv = Math.max(1, Math.min(10, Math.floor(difficulty)));
    const pool = SENTENCES_DATA.filter(
      (s) => (s.category?.includes(situation) ?? false) || s.requiredLevel <= maxLv,
    );
    const selected = pickRandom(pool.length ? pool : SENTENCES_DATA, count);
    return selected.map((s) => ({
      indonesian: s.indonesian,
      japanese: s.japanese,
      category: s.category || situation,
      difficulty: maxLv,
      context: "fallback-local",
    }));
  };

  app.post("/api/generate/vocabulary", async (req, res) => {
    try {
      const { theme, difficulty, count, learnerMode } = req.body;
      
      if (!theme || !difficulty) {
        return res.status(400).json({ error: "theme and difficulty are required" });
      }
      
      const mode = learnerMode === "id" ? "id" : "ja";
      const words = await generateVocabulary(
        theme,
        Number(difficulty),
        count ? Number(count) : 10,
        mode
      );
      
      res.json({ words });
    } catch (error: any) {
      console.error("Vocabulary generation error:", error);
      const errorMsg = error?.message || "Failed to generate vocabulary";
      const requested = Number(req.body?.count ?? 10);
      const count = Number.isFinite(requested) ? Math.max(1, Math.min(10, Math.floor(requested))) : 10;
      const words = fallbackWords(String(req.body?.theme ?? ""), Number(req.body?.difficulty ?? 3), count);
      
      if (isQuotaLike(errorMsg)) {
        return res.json({
          words,
          fallback: true,
          fallbackReason: "quota",
          warningJa: aiLimit.messageJa,
          warningId: aiLimit.messageId,
        });
      }
      if (errorMsg.includes("GEMINI_API_KEY")) {
        return res.status(503).json({
          messageJa: "サーバーに GEMINI_API_KEY が設定されていません。",
          messageId: "GEMINI_API_KEY belum disetel di server.",
        });
      }
      res.json({ words, fallback: true, fallbackReason: "error" });
    }
  });

  // AI-powered sentence generation
  app.post("/api/generate/sentences", async (req, res) => {
    try {
      const { situation, difficulty, count, learnerMode } = req.body;
      
      if (!situation || !difficulty) {
        return res.status(400).json({ error: "situation and difficulty are required" });
      }
      
      const mode = learnerMode === "id" ? "id" : "ja";
      const requested = count ? Number(count) : 5;
      const safeCount = Number.isFinite(requested)
        ? Math.max(1, Math.min(10, Math.floor(requested)))
        : 5;
      const attemptCounts = Array.from(
        new Set([safeCount, Math.min(6, safeCount), 4, 3].filter((n) => n >= 1)),
      );

      let sentences: Awaited<ReturnType<typeof generateSentences>> | null = null;
      let lastError: unknown = null;
      for (const n of attemptCounts) {
        try {
          const out = await generateSentences(
            situation,
            Number(difficulty),
            n,
            mode
          );
          if (Array.isArray(out) && out.length > 0) {
            sentences = out;
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }
      if (!sentences || sentences.length === 0) {
        throw (lastError instanceof Error ? lastError : new Error("Empty sentences result"));
      }
      
      res.json({ sentences });
    } catch (error: any) {
      console.error("Sentence generation error:", error);
      const errorMsg = error?.message || "Failed to generate sentences";
      const requested = Number(req.body?.count ?? 5);
      const count = Number.isFinite(requested) ? Math.max(1, Math.min(10, Math.floor(requested))) : 5;
      const sentences = fallbackSentences(String(req.body?.situation ?? ""), Number(req.body?.difficulty ?? 3), count);
      
      if (isQuotaLike(errorMsg)) {
        return res.json({
          sentences,
          fallback: true,
          fallbackReason: "quota",
          warningJa: aiLimit.messageJa,
          warningId: aiLimit.messageId,
        });
      }
      if (errorMsg.includes("GEMINI_API_KEY")) {
        return res.status(503).json({
          messageJa: "サーバーに GEMINI_API_KEY が設定されていません。",
          messageId: "GEMINI_API_KEY belum disetel di server.",
        });
      }
      res.json({ sentences, fallback: true, fallbackReason: "error" });
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
      
      const learnerMode = req.body.learnerMode === "id" ? "id" : "ja";
      const result = await advancedTranslate(text, sourceLanguage, learnerMode);
      
      res.json(result);
    } catch (error: any) {
      console.error("Translation error:", error);
      const errorMsg = error?.message || "Failed to translate";
      
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json(aiLimit);
      }
      
      res.status(500).json({
        messageJa: "翻訳に失敗しました。もう一度お試しください。",
        messageId: "Terjemahan gagal. Coba lagi.",
      });
    }
  });

  // Batch readings for static vocabulary / sentences (fewer round-trips than per-word)
  app.post("/api/japanese/readings/batch", async (req, res) => {
    try {
      const { texts } = req.body;
      if (!Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: "texts must be a non-empty array" });
      }
      const slice = texts
        .slice(0, 30)
        .map((t: unknown) => String(t).trim())
        .filter(Boolean);
      let readings: Record<string, { hiragana: string; romaji: string }>;
      try {
        readings = await generateJapaneseReadingsBatchLocal(slice);
      } catch {
        readings = await generateJapaneseReadingsBatch(slice);
      }
      res.json({ readings });
    } catch (error: any) {
      console.error("Japanese batch reading error:", error);
      const errorMsg = error?.message || "";
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json(aiLimit);
      }
      if (errorMsg.includes("GEMINI_API_KEY")) {
        return res.status(503).json({
          messageJa: "サーバーに GEMINI_API_KEY が設定されていません。",
          messageId: "GEMINI_API_KEY belum disetel di server.",
        });
      }
      res.status(500).json({
        messageJa: "読み仮名の一括生成に失敗しました。",
        messageId: "Gagal memuat bacaan (batch). Coba lagi.",
      });
    }
  });

  // Japanese reading helper (hiragana + original)
  app.post("/api/japanese/reading", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }
      let result;
      try {
        result = await generateJapaneseReadingLocal(text);
      } catch {
        result = await generateJapaneseReading(text);
      }
      res.json(result);
    } catch (error: any) {
      console.error("Japanese reading error:", error);
      const errorMsg = error?.message || "Failed to generate japanese reading";
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        return res.status(429).json(aiLimit);
      }
      if (errorMsg.includes("GEMINI_API_KEY")) {
        return res.status(503).json({
          messageJa: "サーバーに GEMINI_API_KEY が設定されていません。",
          messageId: "GEMINI_API_KEY belum disetel di server.",
        });
      }
      res.status(500).json({
        messageJa: "読み仮名の生成に失敗しました。",
        messageId: "Gagal membuat bacaan hiragana. Coba lagi.",
      });
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
