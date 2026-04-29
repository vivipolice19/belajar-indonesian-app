import type { LearnerMode } from "../types";

export const THEME_LABEL_ID: Record<string, string> = {
  挨拶: "Salam",
  数字: "Angka",
  家族: "Keluarga",
  色: "Warna",
  動物: "Hewan",
  体: "Tubuh",
  天気: "Cuaca",
  時間: "Waktu",
  飲食: "Makan & minum",
  場所: "Tempat",
  動詞: "Kata kerja",
  形容詞: "Kata sifat",
  感情: "Perasaan",
  交通: "Transportasi",
  買い物: "Belanja",
  旅行: "Perjalanan",
  ビジネス: "Bisnis",
  学校: "Sekolah",
  趣味: "Hobi",
  自然: "Alam",
};

export const SITUATION_LABEL_ID: Record<string, string> = {
  日常会話: "Percakapan sehari-hari",
  自己紹介: "Perkenalan diri",
  挨拶: "Salam",
  飲食: "Makan & minum",
  買い物: "Belanja",
  質問: "Bertanya",
  旅行: "Perjalanan",
  ホテル: "Hotel",
  空港: "Bandara",
  交通機関: "Transportasi",
  病院: "Rumah sakit",
  銀行: "Bank",
  郵便局: "Kantor pos",
  レストラン: "Restoran",
  カフェ: "Kafe",
  ビジネス: "Bisnis",
  電話: "Telepon",
  約束: "Janji",
};

const DIFF: Record<number, { ja: string; id: string }> = {
  1: { ja: "超初級", id: "Sangat pemula" },
  3: { ja: "初級", id: "Pemula" },
  5: { ja: "中級", id: "Menengah" },
  7: { ja: "上級", id: "Lanjutan" },
  9: { ja: "超上級", id: "Sangat lanjutan" },
};

export function difficultyLabel(value: number, mode: LearnerMode): string {
  return DIFF[value]?.[mode === "ja" ? "ja" : "id"] ?? String(value);
}

export function themeDisplay(jaKey: string, mode: LearnerMode): string {
  return mode === "ja" ? jaKey : THEME_LABEL_ID[jaKey] ?? jaKey;
}

export function situationDisplay(jaKey: string, mode: LearnerMode): string {
  return mode === "ja" ? jaKey : SITUATION_LABEL_ID[jaKey] ?? jaKey;
}
