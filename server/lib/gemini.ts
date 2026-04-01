import pRetry from "p-retry";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RESOURCE_EXHAUSTED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

async function generateJSON<T = any>(
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_URL}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

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

  const response = await pRetry(
    async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 4000,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return JSON.parse(text);
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      factor: 2,
      onFailedAttempt: (error) => {
        if (!isRateLimitError(error)) {
          throw error;
        }
      },
    }
  );

  return response;
}

interface VocabularyWord {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  pronunciation_guide?: string;
}

export async function generateVocabulary(
  theme: string,
  difficulty: number,
  count: number = 10
): Promise<VocabularyWord[]> {
  const systemPrompt = `You are an expert Indonesian language teacher creating vocabulary for Japanese learners. 
Always respond with valid JSON only.`;

  const userPrompt = `Generate ${count} Indonesian vocabulary words for the theme "${theme}" at difficulty level ${difficulty}/10.
Include words that are useful for daily conversation.

Return a JSON object with this structure:
{
  "words": [
    {
      "indonesian": "word in Indonesian",
      "japanese": "word meaning in Japanese",
      "category": "${theme}",
      "difficulty": ${difficulty},
      "pronunciation_guide": "pronunciation tips in Japanese if needed"
    }
  ]
}`;

  const result = await generateJSON<{ words: VocabularyWord[] }>(userPrompt, systemPrompt);
  return result.words || [];
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
  count: number = 5
): Promise<SentenceData[]> {
  const systemPrompt = `You are an expert Indonesian language teacher creating practical sentences for Japanese learners.
Always respond with valid JSON only.`;

  const userPrompt = `Generate ${count} Indonesian sentences for the situation "${situation}" at difficulty level ${difficulty}/10.
Focus on natural, everyday conversation.

Return a JSON object with this structure:
{
  "sentences": [
    {
      "indonesian": "sentence in Indonesian",
      "japanese": "sentence in Japanese",
      "category": "${situation}",
      "difficulty": ${difficulty},
      "context": "when to use this sentence"
    }
  ]
}`;

  const result = await generateJSON<{ sentences: SentenceData[] }>(userPrompt, systemPrompt);
  return result.sentences || [];
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
  sourceLanguage: "japanese" | "indonesian"
): Promise<TranslationResult> {
  const systemPrompt = `You are an expert language teacher specializing in Japanese-Indonesian translation.
Provide detailed explanations suitable for learners. Always respond with valid JSON only.`;

  if (sourceLanguage === "japanese") {
    // 日本語→インドネシア語: 日本語でインドネシア語の文法を解説
    const userPrompt = `Translate the following Japanese text to Indonesian and provide detailed learning information:
"${text}"

Return a JSON object with this structure:
{
  "indonesian": "Indonesian translation",
  "japanese": "Original Japanese text or Japanese translation",
  "grammar_explanation": "インドネシア語の文法解説を日本語で詳しく説明してください。インドネシア語の文法構造、語順、助詞や接辞の使い方などを日本語で解説します。",
  "usage_examples": [
    {"indonesian": "Similar Indonesian example 1", "japanese": "その日本語訳"},
    {"indonesian": "Similar Indonesian example 2", "japanese": "その日本語訳"}
  ],
  "pronunciation_guide": "インドネシア語の発音をカタカナと発音のコツを日本語で説明",
  "formality_level": "casual/formal/neutral"
}`;
    return await generateJSON<TranslationResult>(userPrompt, systemPrompt);
  } else {
    // インドネシア語→日本語: インドネシア語で日本語の文法を解説
    const userPrompt = `Translate the following Indonesian text to Japanese and provide detailed learning information:
"${text}"

Return a JSON object with this structure:
{
  "indonesian": "Original Indonesian text or Indonesian translation",
  "japanese": "Japanese translation",
  "grammar_explanation": "Jelaskan tata bahasa Jepang dalam bahasa Indonesia. Jelaskan struktur kalimat, partikel, bentuk kata kerja, dan penggunaan dalam bahasa Indonesia secara detail.",
  "usage_examples": [
    {"indonesian": "Contoh serupa dalam bahasa Indonesia", "japanese": "日本語の例文"},
    {"indonesian": "Contoh serupa dalam bahasa Indonesia", "japanese": "日本語の例文"}
  ],
  "pronunciation_guide": "Panduan pengucapan bahasa Jepang dalam bahasa Indonesia (cara baca, aksen, dll)",
  "formality_level": "casual/formal/neutral"
}`;
    return await generateJSON<TranslationResult>(userPrompt, systemPrompt);
  }
}

export async function generateJapaneseReading(text: string): Promise<JapaneseReadingResult> {
  const systemPrompt = `You are an assistant that converts Japanese text for language learners (hiragana + Hepburn-style romaji).
Return valid JSON only.`;

  const userPrompt = `Convert this Japanese text for learners while preserving punctuation:
"${text}"

Rules:
- "hiragana": full phrase in hiragana (keep 。、！？ and symbols)
- "romaji": Hepburn romanization matching the hiragana reading (spaces between words where natural, lowercase with macrons optional: ā ī ū ē ō or plain ascii)
- Do not include katakana in hiragana unless proper nouns require it

Return JSON:
{
  "original": "${text}",
  "hiragana": "...",
  "romaji": "..."
}`;

  const result = await generateJSON<JapaneseReadingResult>(userPrompt, systemPrompt);
  return {
    original: result.original || text,
    hiragana: result.hiragana || text,
    romaji: typeof result.romaji === "string" ? result.romaji : "",
  };
}

export async function testGeminiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = getApiKey();
    const url = `${GEMINI_API_URL}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

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
