import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry from "p-retry";

// Create OpenAI client with custom API key
function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    timeout: 30000,
  });
}

// Verify API key
export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || !apiKey.startsWith("sk-")) {
    return { valid: false, error: "APIキーは「sk-」で始まる必要があります" };
  }

  try {
    const client = createOpenAIClient(apiKey);
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5,
    });
    return { valid: true };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    
    if (errorMsg.includes("401") || errorMsg.includes("invalid_api_key")) {
      return { valid: false, error: "APIキーが無効です。正しいキーを入力してください。" };
    }
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      return { valid: false, error: "APIキーの使用量制限を超えています。OpenAIでクレジットを追加してください。" };
    }
    
    return { valid: false, error: errorMsg };
  }
}

// Test OpenAI connection (legacy - for server's own key)
export async function testOpenAIConnection(): Promise<{ success: boolean; error?: string }> {
  const serverKey = process.env.OPENAI_API_KEY;
  if (!serverKey) {
    return { success: false, error: "Server API key not configured" };
  }
  
  try {
    const client = createOpenAIClient(serverKey);
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 10,
    });
    return { success: true };
  } catch (error: any) {
    console.error("OpenAI connection test failed:", error?.message || error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Single prompt with JSON response
async function generateJSON<T = any>(
  apiKey: string,
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const client = createOpenAIClient(apiKey);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  
  messages.push({ role: "user", content: prompt });

  const response = await pRetry(
    async () => {
      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });
        
        const content = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw error;
      }
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      factor: 2,
    }
  );

  return response;
}

// Generate vocabulary words
interface VocabularyWord {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  pronunciation_guide?: string;
}

export async function generateVocabulary(
  apiKey: string,
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

  const result = await generateJSON<{ words: VocabularyWord[] }>(apiKey, userPrompt, systemPrompt);
  return result.words || [];
}

// Generate sentences
interface SentenceData {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  context?: string;
}

export async function generateSentences(
  apiKey: string,
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

  const result = await generateJSON<{ sentences: SentenceData[] }>(apiKey, userPrompt, systemPrompt);
  return result.sentences || [];
}

// Advanced translation with grammar explanation
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

export async function advancedTranslate(
  apiKey: string,
  text: string,
  sourceLanguage: "japanese" | "indonesian"
): Promise<TranslationResult> {
  const systemPrompt = `You are an expert language teacher specializing in Japanese-Indonesian translation.
Provide detailed explanations suitable for learners. Always respond with valid JSON only.`;

  const direction = sourceLanguage === "japanese" ? "日本語→インドネシア語" : "インドネシア語→日本語";
  
  const userPrompt = `Translate the following ${direction} and provide detailed learning information:
"${text}"

Return a JSON object with this structure:
{
  "indonesian": "Indonesian translation",
  "japanese": "Japanese translation",
  "grammar_explanation": "Detailed grammar explanation in Japanese",
  "usage_examples": [
    {"indonesian": "example 1", "japanese": "example 1 in Japanese"},
    {"indonesian": "example 2", "japanese": "example 2 in Japanese"}
  ],
  "pronunciation_guide": "How to pronounce in Japanese katakana or tips",
  "formality_level": "casual/formal/neutral"
}`;

  return await generateJSON<TranslationResult>(apiKey, userPrompt, systemPrompt);
}

// Generate custom quiz questions
interface QuizQuestion {
  question_indonesian: string;
  question_japanese: string;
  correct_answer: string;
  wrong_answers: string[];
  explanation: string;
  difficulty: number;
}

export async function generateQuizQuestions(
  apiKey: string,
  topic: string,
  difficulty: number,
  count: number = 5
): Promise<QuizQuestion[]> {
  const systemPrompt = `You are creating quiz questions for Indonesian language learners.
Always respond with valid JSON only.`;

  const userPrompt = `Generate ${count} multiple-choice quiz questions about ${topic} at difficulty ${difficulty}/10.
Each question should have 1 correct answer and 3 wrong answers.

Return a JSON object with this structure:
{
  "questions": [
    {
      "question_indonesian": "question in Indonesian",
      "question_japanese": "question in Japanese",
      "correct_answer": "correct answer",
      "wrong_answers": ["wrong1", "wrong2", "wrong3"],
      "explanation": "explanation in Japanese",
      "difficulty": ${difficulty}
    }
  ]
}`;

  const result = await generateJSON<{ questions: QuizQuestion[] }>(apiKey, userPrompt, systemPrompt);
  return result.questions || [];
}
