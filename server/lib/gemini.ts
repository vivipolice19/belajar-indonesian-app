import pRetry from "p-retry";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash"];

/** CJK Unified Ideographs — if hiragana output still contains these, re-prompt */
const HAN_REGEX = /[\u4e00-\u9fff]/;

function extractJsonText(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) return fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

function parseGeminiJson<T>(raw: string): T {
  const extracted = extractJsonText(raw);
  return JSON.parse(extracted) as T;
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}

async function generateJSON<T = any>(
  prompt: string,
  systemPrompt?: string,
  options?: { maxOutputTokens?: number },
): Promise<T> {
  const apiKey = getApiKey();
  const contents: any[] = [];
  
  if (systemPrompt) {
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    contents.push({
      role: "model", 
      parts: [{ text: "Understood. I will follow these instructions." }]
    });
  }
  
  contents.push({
    role: "user",
    parts: [{ text: prompt }]
  });

  let lastError: Error | null = null;
  for (const model of MODEL_FALLBACKS) {
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await pRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: options?.maxOutputTokens ?? 4000,
            },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      if (!data.candidates?.length) {
        const fb = data.promptFeedback || data.error || data;
        throw new Error(`Gemini returned no candidates: ${JSON.stringify(fb)}`);
      }
      const c0 = data.candidates[0];
      const reason = c0.finishReason;
      if (
        reason === "SAFETY" ||
        reason === "RECITATION" ||
        reason === "BLOCKLIST" ||
        reason === "PROHIBITED_CONTENT" ||
        reason === "SPII"
      ) {
        throw new Error(`Gemini finishReason: ${reason}`);
      }
      const text = (c0?.content?.parts || [])
        .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .join("\n")
        .trim();
      if (!text.trim()) {
        throw new Error("Gemini returned empty text");
      }
      return parseGeminiJson<T>(text);
      }, {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
      });
      return response;
    } catch (e: any) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}

interface VocabularyWord {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  pronunciation_guide?: string;
}

export type LearnerMode = "ja" | "id";

export async function generateVocabulary(
  theme: string,
  difficulty: number,
  count: number = 10,
  learnerMode: LearnerMode = "ja"
): Promise<VocabularyWord[]> {
  if (learnerMode === "ja") {
    const systemPrompt = `You are an expert Indonesian language teacher creating vocabulary for Japanese native speakers learning Indonesian.
Always respond with valid JSON only. No markdown fences.`;

    const userPrompt = `Generate ${count} Indonesian vocabulary words for the theme "${theme}" at difficulty level ${difficulty}/10.
Include words that are useful for daily conversation.

Return a JSON object with this structure:
{
  "words": [
    {
      "indonesian": "word in Indonesian",
      "japanese": "meaning or gloss in Japanese",
      "category": "${theme}",
      "difficulty": ${difficulty},
      "pronunciation_guide": "short pronunciation tips in Japanese for the Indonesian word"
    }
  ]
}`;

    const result = await generateJSON<{ words: VocabularyWord[] }>(userPrompt, systemPrompt);
    const words = result.words || [];
    if (!words.length) throw new Error("Empty vocabulary result");
    return words;
  }

  const systemPrompt = `You are an expert Japanese language teacher for Indonesian speakers learning Japanese.
Always respond with valid JSON only. No markdown fences.`;

  const userPrompt = `Generate ${count} Japanese vocabulary items for the theme "${theme}" (theme name may be in Japanese) at difficulty level ${difficulty}/10.
Use natural Japanese including kanji when appropriate for the level. Indonesian gloss must be clear.

Return a JSON object with this structure:
{
  "words": [
    {
      "japanese": "Japanese word or phrase (kanji ok)",
      "indonesian": "clear Indonesian meaning or gloss",
      "category": "${theme}",
      "difficulty": ${difficulty},
      "pronunciation_guide": "reading help in INDONESIAN only (e.g. romaji or how to read); do NOT write Japanese prose here"
    }
  ]
}`;

  const result = await generateJSON<{ words: VocabularyWord[] }>(userPrompt, systemPrompt);
  const words = result.words || [];
  if (!words.length) throw new Error("Empty vocabulary result");
  return words;
}

interface SentenceData {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  context?: string;
}

export async function generateSentences(
  situation: string,
  difficulty: number,
  count: number = 5,
  learnerMode: LearnerMode = "ja"
): Promise<SentenceData[]> {
  if (learnerMode === "ja") {
    const systemPrompt = `You are an expert Indonesian language teacher creating practical sentences for Japanese native speakers learning Indonesian.
Always respond with valid JSON only. No markdown fences.`;

    const userPrompt = `Generate ${count} Indonesian sentences for the situation "${situation}" at difficulty level ${difficulty}/10.
Focus on natural, everyday conversation.

Return a JSON object with this structure:
{
  "sentences": [
    {
      "indonesian": "sentence in Indonesian",
      "japanese": "natural Japanese translation",
      "category": "${situation}",
      "difficulty": ${difficulty},
      "context": "when to use this sentence (can be in Japanese)"
    }
  ]
}`;

    const result = await generateJSON<{ sentences: SentenceData[] }>(userPrompt, systemPrompt);
    const sentences = result.sentences || [];
    if (!sentences.length) throw new Error("Empty sentences result");
    return sentences;
  }

  const systemPrompt = `You are an expert Japanese language teacher for Indonesian speakers learning Japanese.
Always respond with valid JSON only. No markdown fences.`;

  const userPrompt = `Generate ${count} Japanese sentences for the situation "${situation}" at difficulty level ${difficulty}/10.
Sentences must be natural Japanese (kanji where appropriate). Provide accurate Indonesian translation/gloss.

Return a JSON object with this structure:
{
  "sentences": [
    {
      "japanese": "sentence in Japanese",
      "indonesian": "natural Indonesian meaning or translation",
      "category": "${situation}",
      "difficulty": ${difficulty},
      "context": "when to use (in INDONESIAN only)"
    }
  ]
}`;

  const result = await generateJSON<{ sentences: SentenceData[] }>(userPrompt, systemPrompt);
  const sentences = result.sentences || [];
  if (!sentences.length) throw new Error("Empty sentences result");
  return sentences;
}

interface TranslationResult {
  indonesian: string;
  japanese: string;
  grammar_explanation: string;
  usage_examples: Array<{
    indonesian: string;
    japanese: string;
  }>;
  pronunciation_guide: string;
  formality_level: string;
}

interface JapaneseReadingResult {
  original: string;
  hiragana: string;
  romaji: string;
}

export async function advancedTranslate(
  text: string,
  sourceLanguage: "japanese" | "indonesian",
  learnerMode: LearnerMode = "ja"
): Promise<TranslationResult> {
  const systemPrompt = `You are an expert language teacher specializing in Japanese-Indonesian translation.
Provide detailed explanations suitable for learners. Always respond with valid JSON only. No markdown fences.
grammar_explanation and pronunciation_guide MUST follow the language rules in each prompt (do not mix languages incorrectly).`;

  if (sourceLanguage === "japanese") {
    if (learnerMode === "ja") {
      const userPrompt = `Translate the following Japanese text to Indonesian and provide detailed learning information:
"${text}"

Return a JSON object with this structure:
{
  "indonesian": "Indonesian translation",
  "japanese": "Original Japanese text (unchanged)",
  "grammar_explanation": "Explain Indonesian grammar, word order, and phrasing in JAPANESE (for Japanese natives learning Indonesian).",
  "usage_examples": [
    {"indonesian": "Similar Indonesian example 1", "japanese": "その日本語訳"},
    {"indonesian": "Similar Indonesian example 2", "japanese": "その日本語訳"}
  ],
  "pronunciation_guide": "How to pronounce the Indonesian translation: use katakana where helpful, tips in JAPANESE",
  "formality_level": "casual/formal/neutral"
}`;
      return await generateJSON<TranslationResult>(userPrompt, systemPrompt);
    }
    const userPrompt = `Translate the following Japanese text to Indonesian and provide detailed learning information:
"${text}"

Return a JSON object with this structure:
{
  "indonesian": "Indonesian translation",
  "japanese": "Original Japanese text (unchanged)",
  "grammar_explanation": "Explain the Indonesian translation (grammar, word choice, register) entirely in INDONESIAN for Indonesian speakers studying Japanese.",
  "usage_examples": [
    {"indonesian": "Similar Indonesian example 1", "japanese": "その日本語訳"},
    {"indonesian": "Similar Indonesian example 2", "japanese": "その日本語訳"}
  ],
  "pronunciation_guide": "Indonesian pronunciation tips entirely in INDONESIAN",
  "formality_level": "casual/formal/neutral in English or Indonesian"
}`;
    return await generateJSON<TranslationResult>(userPrompt, systemPrompt);
  }

  if (learnerMode === "ja") {
    const userPrompt = `Translate the following Indonesian text to Japanese and provide detailed learning information:
"${text}"

Return a JSON object with this structure:
{
  "indonesian": "Original Indonesian text (unchanged)",
  "japanese": "Japanese translation",
  "grammar_explanation": "Explain Japanese grammar, particles, and sentence patterns in JAPANESE (for Japanese natives who input Indonesian to learn Japanese phrasing).",
  "usage_examples": [
    {"indonesian": "Similar Indonesian example 1", "japanese": "日本語の例文"},
    {"indonesian": "Similar Indonesian example 2", "japanese": "日本語の例文"}
  ],
  "pronunciation_guide": "Japanese pronunciation / reading notes in JAPANESE",
  "formality_level": "casual/formal/neutral"
}`;
    return await generateJSON<TranslationResult>(userPrompt, systemPrompt);
  }

  const userPrompt = `Translate the following Indonesian text to Japanese and provide detailed learning information:
"${text}"

Return a JSON object with this structure:
{
  "indonesian": "Original Indonesian text (unchanged)",
  "japanese": "Japanese translation",
  "grammar_explanation": "Explain Japanese grammar, particles, and patterns entirely in INDONESIAN (for Indonesian speakers learning Japanese).",
  "usage_examples": [
    {"indonesian": "Contoh dalam bahasa Indonesia", "japanese": "日本語の例文"},
    {"indonesian": "Contoh dalam bahasa Indonesia", "japanese": "日本語の例文"}
  ],
  "pronunciation_guide": "Japanese reading and pronunciation help entirely in INDONESIAN",
  "formality_level": "casual/formal/neutral"
}`;
  return await generateJSON<TranslationResult>(userPrompt, systemPrompt);
}

export async function generateJapaneseReading(text: string): Promise<JapaneseReadingResult> {
  const systemPrompt = `You convert Japanese learner text to hiragana and Hepburn romaji. Output valid JSON only. No markdown.
CRITICAL: the "hiragana" field must contain ZERO kanji — rewrite every kanji as hiragana.`;

  const runPrompt = (strict: boolean) => `Convert this Japanese text for learners while preserving punctuation:
"${text}"

Rules:
- "hiragana": ENTIRE phrase in hiragana only (no kanji, minimal katakana except loanwords). Keep 。、！？ and western digits.
- "romaji": Hepburn style matching the reading (spaces between words; ascii a-z)
${strict ? "- If any kanji remains in hiragana, you failed — convert ALL to hiragana.\n" : ""}
Return JSON:
{
  "original": ${JSON.stringify(text)},
  "hiragana": "...",
  "romaji": "..."
}`;

  let result = await generateJSON<JapaneseReadingResult>(runPrompt(false), systemPrompt);
  let hiragana = typeof result.hiragana === "string" ? result.hiragana : "";
  if (HAN_REGEX.test(hiragana)) {
    result = await generateJSON<JapaneseReadingResult>(runPrompt(true), systemPrompt);
    hiragana = typeof result.hiragana === "string" ? result.hiragana : hiragana;
  }

  return {
    original: result.original || text,
    hiragana: hiragana || text,
    romaji: typeof result.romaji === "string" ? result.romaji : "",
  };
}

/** One Gemini call for many phrases — use for static vocabulary prefetch (reduces API usage). Max 30. */
export async function generateJapaneseReadingsBatch(
  texts: string[],
): Promise<Record<string, { hiragana: string; romaji: string }>> {
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  if (!unique.length) return {};
  if (unique.length > 30) {
    throw new Error("batch size must be <= 30");
  }

  const systemPrompt = `You convert Japanese phrases to hiragana and Hepburn romaji for language learners.
Output valid JSON only. No markdown.
CRITICAL: every "hiragana" value must contain ZERO kanji — rewrite all kanji as hiragana.`;

  const list = unique.map((t, i) => `${i + 1}. ${JSON.stringify(t)}`).join("\n");
  const userPrompt = `Convert EACH phrase below. Preserve 。、！？ and digits. Romaji: Hepburn, ascii, spaces between words.

Phrases:
${list}

Return JSON:
{
  "items": [
    { "original": <exact string>, "hiragana": "hiragana only", "romaji": "romaji" }
  ]
}
The "items" array MUST have exactly ${unique.length} objects in the SAME ORDER as the numbered list above.`;

  const result = await generateJSON<{
    items: Array<{ original?: string; hiragana?: string; romaji?: string }>;
  }>(userPrompt, systemPrompt, { maxOutputTokens: 8192 });

  const out: Record<string, { hiragana: string; romaji: string }> = {};
  const items = result.items || [];

  for (let i = 0; i < unique.length; i++) {
    const orig = unique[i];
    const row = items[i];
    if (row && typeof row.hiragana === "string" && row.hiragana.trim()) {
      out[orig] = {
        hiragana: row.hiragana,
        romaji: typeof row.romaji === "string" ? row.romaji : "",
      };
    }
  }

  for (const row of items) {
    const o = typeof row?.original === "string" ? row.original : "";
    if (o && unique.includes(o) && typeof row.hiragana === "string" && row.hiragana.trim() && !out[o]) {
      out[o] = {
        hiragana: row.hiragana,
        romaji: typeof row.romaji === "string" ? row.romaji : "",
      };
    }
  }

  return out;
}

export async function testGeminiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = getApiKey();
    const url = `${GEMINI_API_URL}/${MODEL_FALLBACKS[0]}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Unknown error" };
  }
}
