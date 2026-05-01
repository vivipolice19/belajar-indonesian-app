import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiRateLimitMiddleware } from "./lib/aiRateLimit";
import {
  sentencesCacheKey,
  sharedCacheGet,
  sharedCacheSet,
  sharedCacheTTL,
  translateCacheKey,
  vocabCacheKey,
} from "./lib/aiSharedCache";
import {
  advancedTranslate,
  generateJapaneseReading,
  generateJapaneseReadingsBatch,
  generateSentences,
  generateVocabulary,
  testGeminiConnection,
  type TranslationResult,
} from "./lib/gemini";
import {
  generateJapaneseReadingLocal,
  generateJapaneseReadingsBatchLocal,
} from "./lib/japaneseReadingLocal";
import { synthesizeToMp3Buffer } from "./lib/googleTranslateTts";
import { WORDS_DATA, SENTENCES_DATA } from "../shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  const aiRateLimit = aiRateLimitMiddleware();

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
  /** メッセージ中の「429ms」などで誤爆しないよう厳しめに判定 */
  const isGeminiQuotaError = (msg: string) => {
    const m = String(msg);
    if (/RESOURCE_EXHAUSTED/i.test(m)) return true;
    if (/Gemini API error:\s*429\b/i.test(m)) return true;
    if (/\b"code"\s*:\s*429\b/.test(m)) return true;
    if (/quota exceeded/i.test(m)) return true;
    return false;
  };
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

  app.post("/api/generate/vocabulary", aiRateLimit, async (req, res) => {
    try {
      const { theme, difficulty, count, learnerMode } = req.body;

      if (!theme || !difficulty) {
        return res.status(400).json({ error: "theme and difficulty are required" });
      }

      const mode = learnerMode === "id" ? "id" : "ja";
      const requested = count ? Number(count) : 10;
      const safeCount = Number.isFinite(requested)
        ? Math.max(1, Math.min(10, Math.floor(requested)))
        : 10;

      const vKey = vocabCacheKey(mode, String(theme).trim(), Number(difficulty));
      const memoWords = sharedCacheGet<Awaited<ReturnType<typeof generateVocabulary>>>(
        vKey,
        sharedCacheTTL.vocabSentences,
      );
      if (memoWords && memoWords.length >= safeCount) {
        return res.json({ words: memoWords.slice(0, safeCount) });
      }

      const attemptCounts = Array.from(
        new Set([safeCount, Math.min(6, safeCount), 4, 3].filter((n) => n >= 1)),
      );

      let words: Awaited<ReturnType<typeof generateVocabulary>> | null = null;
      let lastError: unknown = null;
      for (const n of attemptCounts) {
        try {
          const out = await generateVocabulary(theme, Number(difficulty), n, mode);
          if (Array.isArray(out) && out.length > 0) {
            words = out;
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }
      if (!words || words.length === 0) {
        throw lastError instanceof Error ? lastError : new Error("Empty vocabulary result");
      }

      if (words.length >= safeCount || words.length >= 8) {
        sharedCacheSet(vKey, words);
      }
      res.json({ words });
    } catch (error: any) {
      console.error("Vocabulary generation error:", error);
      const errorMsg = error?.message || "Failed to generate vocabulary";
      const requested = Number(req.body?.count ?? 10);
      const count = Number.isFinite(requested) ? Math.max(1, Math.min(10, Math.floor(requested))) : 10;
      const words = fallbackWords(String(req.body?.theme ?? ""), Number(req.body?.difficulty ?? 3), count);
      
      if (isGeminiQuotaError(errorMsg)) {
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
      res.json({
        words,
        fallback: true,
        fallbackReason: "error",
        warningJa: aiFail.messageJa,
        warningId: aiFail.messageId,
      });
    }
  });

  // AI-powered sentence generation
  app.post("/api/generate/sentences", aiRateLimit, async (req, res) => {
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

      const sKey = sentencesCacheKey(mode, String(situation).trim(), Number(difficulty));
      const memoSentences = sharedCacheGet<Awaited<ReturnType<typeof generateSentences>>>(
        sKey,
        sharedCacheTTL.vocabSentences,
      );
      if (memoSentences && memoSentences.length >= safeCount) {
        return res.json({ sentences: memoSentences.slice(0, safeCount) });
      }

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

      if (sentences.length >= safeCount || sentences.length >= 6) {
        sharedCacheSet(sKey, sentences);
      }
      res.json({ sentences });
    } catch (error: any) {
      console.error("Sentence generation error:", error);
      const errorMsg = error?.message || "Failed to generate sentences";
      const requested = Number(req.body?.count ?? 5);
      const count = Number.isFinite(requested) ? Math.max(1, Math.min(10, Math.floor(requested))) : 5;
      const sentences = fallbackSentences(String(req.body?.situation ?? ""), Number(req.body?.difficulty ?? 3), count);
      
      if (isGeminiQuotaError(errorMsg)) {
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
      res.json({
        sentences,
        fallback: true,
        fallbackReason: "error",
        warningJa: aiFail.messageJa,
        warningId: aiFail.messageId,
      });
    }
  });

  // Advanced translation with grammar explanations
  app.post("/api/translate/advanced", aiRateLimit, async (req, res) => {
    try {
      const { text, sourceLanguage } = req.body;
      
      if (!text || !sourceLanguage) {
        return res.status(400).json({ error: "text and sourceLanguage are required" });
      }
      
      if (sourceLanguage !== "japanese" && sourceLanguage !== "indonesian") {
        return res.status(400).json({ error: "sourceLanguage must be 'japanese' or 'indonesian'" });
      }

      const trimmed = String(text).trim().replace(/\s+/g, " ");
      if (trimmed.length < 1 || trimmed.length > 5000) {
        return res.status(400).json({ error: "text length must be between 1 and 5000 characters" });
      }
      
      const learnerMode = req.body.learnerMode === "id" ? "id" : "ja";
      const tKey = translateCacheKey(
        learnerMode,
        sourceLanguage as "japanese" | "indonesian",
        trimmed,
      );
      const memoT = sharedCacheGet<TranslationResult>(tKey, sharedCacheTTL.translate);
      if (memoT?.indonesian && memoT?.japanese && memoT?.grammar_explanation) {
        return res.json(memoT);
      }

      const result = await advancedTranslate(trimmed, sourceLanguage, learnerMode);
      sharedCacheSet(tKey, result);

      res.json(result);
    } catch (error: any) {
      console.error("Translation error:", error);
      const errorMsg = error?.message || "Failed to translate";
      
      if (isGeminiQuotaError(errorMsg)) {
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
      if (isGeminiQuotaError(errorMsg)) {
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
      if (isGeminiQuotaError(errorMsg)) {
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

  const httpServer = createServer(app);

  return httpServer;
}
