import { SENTENCES_DATA, WORDS_DATA } from "../../../shared/types";
import type { LearnerMode, Sentence, Word } from "../types";

type AIWord = {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  pronunciation_guide?: string;
};

type AISentence = {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  context?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function uniqueByKey<T>(list: T[], keyFn: (v: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of list) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

const THEME_TO_CATEGORIES: Record<string, string[]> = {
  挨拶: ["挨拶", "基本"],
  数字: ["数字", "時間"],
  家族: ["家族"],
  色: ["色"],
  動物: ["動物"],
  体: ["体"],
  天気: ["天気"],
  時間: ["時間"],
  飲食: ["飲食"],
  場所: ["場所", "旅行"],
  動詞: ["動詞", "日常会話"],
  形容詞: ["形容詞", "感情"],
  感情: ["感情"],
  交通: ["交通", "旅行"],
  買い物: ["買い物", "飲食"],
  旅行: ["旅行", "場所"],
  ビジネス: ["ビジネス", "仕事"],
  学校: ["学校", "職業"],
  趣味: ["趣味", "日常会話"],
  自然: ["自然", "天気"],
};

const SITUATION_TO_CATEGORIES: Record<string, string[]> = {
  日常会話: ["日常会話", "挨拶"],
  自己紹介: ["自己紹介", "挨拶"],
  挨拶: ["挨拶"],
  飲食: ["飲食"],
  買い物: ["買い物"],
  質問: ["質問", "依頼"],
  旅行: ["旅行", "交通"],
  ホテル: ["旅行", "場所"],
  空港: ["旅行", "交通"],
  交通機関: ["交通", "旅行"],
  病院: ["体", "日常会話"],
  銀行: ["基本", "買い物"],
  郵便局: ["場所", "日常会話"],
  レストラン: ["飲食", "買い物"],
  カフェ: ["飲食"],
  ビジネス: ["仕事", "ビジネス"],
  電話: ["日常会話", "質問"],
  約束: ["日常会話", "時間"],
};

function makePronGuide(word: Word, mode: LearnerMode): string {
  if (mode === "ja") {
    return `${word.indonesian} をゆっくり発音。語尾母音をはっきり。`;
  }
  return `Fokus pada bacaan Jepang: ${word.japanese}`;
}

export function generateLocalAiWords(
  theme: string,
  difficulty: number,
  learnerMode: LearnerMode,
  count: number = 10,
): AIWord[] {
  const categories = THEME_TO_CATEGORIES[theme] ?? [theme];
  const candidates = WORDS_DATA.filter((w) =>
    categories.includes(w.category || ""),
  );
  const pool = candidates.length ? candidates : WORDS_DATA;
  const list = shuffle(pool).slice(0, Math.max(1, count));
  const uniq = uniqueByKey(list, (w) => `${w.indonesian}|${w.japanese}`);
  return uniq.map((w) => ({
    indonesian: w.indonesian,
    japanese: w.japanese,
    category: w.category || theme,
    difficulty,
    pronunciation_guide: makePronGuide(w, learnerMode),
  }));
}

const JP_PATTERNS = [
  { id: "Saya suka X.", jp: "私はXが好きです。" },
  { id: "Ini X.", jp: "これはXです。" },
  { id: "Saya mau X.", jp: "私はXが欲しいです。" },
];

export function generateLocalAiSentences(
  situation: string,
  difficulty: number,
  _learnerMode: LearnerMode,
  count: number = 10,
): AISentence[] {
  const categories = SITUATION_TO_CATEGORIES[situation] ?? [situation];
  const sentencePool = SENTENCES_DATA.filter((s) =>
    categories.includes(s.category || ""),
  );
  const base = sentencePool.length ? shuffle(sentencePool) : shuffle(SENTENCES_DATA);
  const out: AISentence[] = [];

  for (const s of base) {
    out.push({
      indonesian: s.indonesian,
      japanese: s.japanese,
      category: s.category || situation,
      difficulty,
      context: s.category || situation,
    });
    if (out.length >= count) break;
  }

  // 補充: 単語を使った定型文でバリエーションを増やす
  if (out.length < count) {
    const wordPool = shuffle(
      WORDS_DATA.filter((w) => categories.includes(w.category || "")),
    );
    for (const w of wordPool) {
      const p = JP_PATTERNS[Math.floor(Math.random() * JP_PATTERNS.length)];
      out.push({
        indonesian: p.id.replace("X", w.indonesian),
        japanese: p.jp.replace("X", w.japanese),
        category: situation,
        difficulty,
        context: `${situation} / latihan pola`,
      });
      if (out.length >= count) break;
    }
  }

  return uniqueByKey(out, (s) => `${s.indonesian}|${s.japanese}`).slice(0, count);
}

