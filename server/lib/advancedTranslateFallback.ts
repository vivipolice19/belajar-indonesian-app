import { SENTENCES_DATA, WORDS_DATA } from "../../shared/types";
import type { LearnerMode } from "./gemini";

type SourceLanguage = "japanese" | "indonesian";

export type TranslationResultLike = {
  indonesian: string;
  japanese: string;
  grammar_explanation: string;
  usage_examples: Array<{ indonesian: string; japanese: string }>;
  pronunciation_guide: string;
  formality_level: string;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[。、「」！？!?,.\s]/g, "")
    .trim();
}

function bySource(text: string, sourceLanguage: SourceLanguage) {
  const key = norm(text);
  if (!key) return { sentence: null as (typeof SENTENCES_DATA)[number] | null, word: null as (typeof WORDS_DATA)[number] | null };
  if (sourceLanguage === "japanese") {
    const sentence = SENTENCES_DATA.find((s) => norm(s.japanese) === key) ?? null;
    if (sentence) return { sentence, word: null };
    const word = WORDS_DATA.find((w) => norm(w.japanese) === key) ?? null;
    return { sentence: null, word };
  }
  const sentence = SENTENCES_DATA.find((s) => norm(s.indonesian) === key) ?? null;
  if (sentence) return { sentence, word: null };
  const word = WORDS_DATA.find((w) => norm(w.indonesian) === key) ?? null;
  return { sentence: null, word };
}

function usageFromCategory(category?: string) {
  const pool = category
    ? SENTENCES_DATA.filter((s) => s.category === category)
    : SENTENCES_DATA;
  return pool.slice(0, 2).map((s) => ({
    indonesian: s.indonesian,
    japanese: s.japanese,
  }));
}

function localizedGuide(learnerMode: LearnerMode, sourceLanguage: SourceLanguage): {
  grammar: string;
  pron: string;
} {
  if (learnerMode === "ja") {
    return {
      grammar:
        sourceLanguage === "japanese"
          ? "辞書データの一致から翻訳しました。短文の定型表現は高精度です。必要なら表現を少し変えて再翻訳してください。"
          : "辞書データの一致から翻訳しました。入力文に近い定型表現を優先しています。",
      pron:
        sourceLanguage === "japanese"
          ? "インドネシア語は語末母音をはっきり発音すると通じやすいです。"
          : "日本語は助詞（は/を/へ）と語尾の丁寧さを意識してください。",
    };
  }
  return {
    grammar:
      sourceLanguage === "japanese"
        ? "Terjemahan ini diambil dari data pembelajaran internal (kecocokan pasti). Cocok untuk kalimat dasar yang umum."
        : "Terjemahan ini diambil dari data pembelajaran internal (kecocokan pasti).",
    pron:
      sourceLanguage === "japanese"
        ? "Fokuskan pelafalan vokal akhir agar pengucapan bahasa Indonesia lebih natural."
        : "Perhatikan partikel Jepang (wa/o/e) dan akhiran kalimat.",
  };
}

export function buildAdvancedTranslateFallback(
  text: string,
  sourceLanguage: SourceLanguage,
  learnerMode: LearnerMode,
): TranslationResultLike {
  const { sentence, word } = bySource(text, sourceLanguage);
  const guide = localizedGuide(learnerMode, sourceLanguage);

  if (sentence) {
    return {
      indonesian: sentence.indonesian,
      japanese: sentence.japanese,
      grammar_explanation: guide.grammar,
      usage_examples: usageFromCategory(sentence.category),
      pronunciation_guide: guide.pron,
      formality_level: "neutral",
    };
  }

  if (word) {
    const usage = SENTENCES_DATA.filter((s) =>
      sourceLanguage === "japanese"
        ? s.japanese.includes(word.japanese)
        : s.indonesian.toLowerCase().includes(word.indonesian.toLowerCase()),
    )
      .slice(0, 2)
      .map((s) => ({ indonesian: s.indonesian, japanese: s.japanese }));

    return {
      indonesian: word.indonesian,
      japanese: word.japanese,
      grammar_explanation: guide.grammar,
      usage_examples: usage.length ? usage : usageFromCategory(word.category),
      pronunciation_guide: guide.pron,
      formality_level: "neutral",
    };
  }

  // Last-resort fallback: keep app flowing even if AI quota exceeded.
  return {
    indonesian: sourceLanguage === "japanese" ? text : "Terjemahan tidak tersedia saat ini.",
    japanese: sourceLanguage === "indonesian" ? text : "翻訳は現在利用できません。",
    grammar_explanation:
      learnerMode === "ja"
        ? "AIの上限または接続制限のため、現在は詳細解説を生成できません。しばらくして再試行してください。"
        : "Karena batas AI atau koneksi, penjelasan detail belum tersedia saat ini. Silakan coba lagi nanti.",
    usage_examples: usageFromCategory(undefined),
    pronunciation_guide:
      learnerMode === "ja"
        ? "音声練習は可能です。ネットワーク回復後に再翻訳すると詳細が更新されます。"
        : "Latihan suara tetap bisa dipakai. Setelah jaringan normal, ulangi terjemahan untuk detail yang lebih baik.",
    formality_level: "neutral",
  };
}

