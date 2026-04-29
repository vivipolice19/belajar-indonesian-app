import { SENTENCES_DATA, WORDS_DATA } from "../../../shared/types";
import type { LearnerMode, TranslationResult } from "../types";

type SourceLanguage = "japanese" | "indonesian";

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[。、「」！？!?,.\s]/g, "")
    .trim();
}

function overlapScore(a: string, b: string): number {
  if (!a || !b) return 0;
  let score = 0;
  for (const ch of a) {
    if (b.includes(ch)) score += 1;
  }
  return score;
}

function pickSentence(text: string, sourceLanguage: SourceLanguage) {
  const key = norm(text);
  const direct =
    sourceLanguage === "japanese"
      ? SENTENCES_DATA.find((s) => norm(s.japanese) === key)
      : SENTENCES_DATA.find((s) => norm(s.indonesian) === key);
  if (direct) return direct;

  const scored = SENTENCES_DATA.map((s) => {
    const src = sourceLanguage === "japanese" ? norm(s.japanese) : norm(s.indonesian);
    return { s, score: overlapScore(key, src) };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].s : null;
}

function pickWord(text: string, sourceLanguage: SourceLanguage) {
  const key = norm(text);
  const direct =
    sourceLanguage === "japanese"
      ? WORDS_DATA.find((w) => norm(w.japanese) === key)
      : WORDS_DATA.find((w) => norm(w.indonesian) === key);
  if (direct) return direct;

  const scored = WORDS_DATA.map((w) => {
    const src = sourceLanguage === "japanese" ? norm(w.japanese) : norm(w.indonesian);
    return { w, score: overlapScore(key, src) };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].w : null;
}

function byCategoryExamples(category?: string): Array<{ indonesian: string; japanese: string }> {
  const list = category
    ? SENTENCES_DATA.filter((s) => s.category === category)
    : SENTENCES_DATA;
  return list.slice(0, 2).map((s) => ({ indonesian: s.indonesian, japanese: s.japanese }));
}

function localGuide(learnerMode: LearnerMode, sourceLanguage: SourceLanguage) {
  if (learnerMode === "ja") {
    return {
      grammar:
        sourceLanguage === "japanese"
          ? "ローカル辞書の一致結果です。短文・定型文は高精度で翻訳します。"
          : "ローカル辞書の一致結果です。入力に近い日本語表現を優先しています。",
      pron:
        sourceLanguage === "japanese"
          ? "インドネシア語は母音をはっきり発音すると通じやすくなります。"
          : "日本語は助詞と語尾の丁寧さを意識すると自然です。",
    };
  }
  return {
    grammar:
      sourceLanguage === "japanese"
        ? "Terjemahan memakai data lokal (offline). Kalimat dasar dan pola umum akurat."
        : "Terjemahan memakai data lokal (offline) dengan pola kalimat yang paling dekat.",
    pron:
      sourceLanguage === "japanese"
        ? "Ucapkan vokal bahasa Indonesia dengan jelas pada akhir kata."
        : "Perhatikan partikel Jepang (wa/o/e) dan bentuk kalimat sopan.",
  };
}

export function advancedTranslateLocal(
  text: string,
  sourceLanguage: SourceLanguage,
  learnerMode: LearnerMode,
): TranslationResult {
  const sentence = pickSentence(text, sourceLanguage);
  const word = pickWord(text, sourceLanguage);
  const guide = localGuide(learnerMode, sourceLanguage);

  if (sentence) {
    return {
      indonesian: sentence.indonesian,
      japanese: sentence.japanese,
      grammar_explanation: guide.grammar,
      usage_examples: byCategoryExamples(sentence.category),
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
      usage_examples: usage.length ? usage : byCategoryExamples(word.category),
      pronunciation_guide: guide.pron,
      formality_level: "neutral",
    };
  }

  return {
    indonesian: sourceLanguage === "japanese" ? text : "（辞書にないため原文を表示）",
    japanese: sourceLanguage === "indonesian" ? text : "（ローカル辞書に未登録です）",
    grammar_explanation:
      learnerMode === "ja"
        ? "入力文がローカル辞書に見つからないため、簡易表示に切り替えました。"
        : "Kalimat belum ada di kamus lokal, jadi ditampilkan dalam mode sederhana.",
    usage_examples: byCategoryExamples(undefined),
    pronunciation_guide:
      learnerMode === "ja"
        ? "語彙カードと文章カードで近い表現を探すと精度が上がります。"
        : "Cari ungkapan serupa di kartu kosakata/kalimat untuk hasil yang lebih tepat.",
    formality_level: "neutral",
  };
}

