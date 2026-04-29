import path from "path";
import kuromoji from "kuromoji";
import { toRomaji } from "wanakana";
import { normalizeLearnerRomaji } from "../../shared/romajiLearnerNormalize";

export type LocalReading = {
  original: string;
  hiragana: string;
  romaji: string;
};

type Token = {
  surface_form?: string;
  reading?: string;
  pos?: string;
};

let tokenizerPromise: Promise<kuromoji.Tokenizer<Token>> | null = null;

function kataToHira(input: string): string {
  return input.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

function ensureTokenizer(): Promise<kuromoji.Tokenizer<Token>> {
  if (tokenizerPromise) return tokenizerPromise;

  tokenizerPromise = new Promise((resolve, reject) => {
    const dictPath = path.resolve(process.cwd(), "node_modules", "kuromoji", "dict");
    kuromoji
      .builder({ dicPath: dictPath })
      .build((err, tokenizer) => {
        if (err || !tokenizer) {
          reject(err ?? new Error("failed to initialize kuromoji tokenizer"));
          return;
        }
        resolve(tokenizer as kuromoji.Tokenizer<Token>);
      });
  });

  return tokenizerPromise;
}

export async function generateJapaneseReadingLocal(text: string): Promise<LocalReading> {
  const tokenizer = await ensureTokenizer();
  const tokens = tokenizer.tokenize(text) as Token[];

  const hiraParts: string[] = [];
  const romajiParts: string[] = [];

  for (const t of tokens) {
    const surface = t.surface_form || "";
    const hasKanaReading = typeof t.reading === "string" && t.reading.trim().length > 0;
    const hira = hasKanaReading ? kataToHira(t.reading!) : kataToHira(surface);
    hiraParts.push(hira);

    if (hira.trim()) {
      romajiParts.push(toRomaji(hira));
    }
  }

  const hiragana = hiraParts.join("").replace(/\s+/g, " ").trim();
  const romajiRaw = romajiParts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const romaji = normalizeLearnerRomaji(romajiRaw);

  return {
    original: text,
    hiragana: hiragana || text,
    romaji,
  };
}

/**
 * Google translate_tts は「彼は」の助詞「は」を「ハ」と読むことがある。
 * 助詞と分かる表記だけを読みの仮名に寄せてから TTS に渡す（表示用テキストは変えない）。
 */
export async function normalizeJapaneseForGoogleTts(text: string): Promise<string> {
  const tokenizer = await ensureTokenizer();
  const tokens = tokenizer.tokenize(text) as Token[];
  let out = "";
  for (const t of tokens) {
    const surf = t.surface_form || "";
    const pos = String(t.pos || "");
    if (!surf) continue;
    if (surf === "は" && pos.includes("助詞")) {
      out += "わ";
    } else if (surf === "へ" && pos.includes("助詞")) {
      out += "え";
    } else if (surf === "を" && pos.includes("助詞")) {
      out += "お";
    } else {
      out += surf;
    }
  }
  return out || text;
}

export async function generateJapaneseReadingsBatchLocal(
  texts: string[],
): Promise<Record<string, { hiragana: string; romaji: string }>> {
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  const out: Record<string, { hiragana: string; romaji: string }> = {};

  for (const text of unique) {
    const r = await generateJapaneseReadingLocal(text);
    out[text] = { hiragana: r.hiragana, romaji: r.romaji };
  }
  return out;
}

