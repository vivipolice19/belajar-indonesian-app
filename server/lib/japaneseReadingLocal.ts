import path from "path";
import kuromoji from "kuromoji";
import { toRomaji } from "wanakana";

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
  const romaji = romajiParts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return {
    original: text,
    hiragana: hiragana || text,
    romaji,
  };
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

