/**
 * Fetches short MP3 clips from Google Translate's public TTS endpoint (server-side only).
 * Used when the browser's speechSynthesis is silent or missing voices.
 * Chunked: the endpoint rejects very long queries.
 */

import { normalizeJapaneseForGoogleTts } from "./japaneseReadingLocal";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const MAX_TOTAL = 2000;
const CHUNK = 160;

function looksLikeMp3(buf: Buffer): boolean {
  return buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

async function fetchOneChunk(q: string, tl: "ja" | "id"): Promise<Buffer> {
  const url = new URL("https://translate.google.com/translate_tts");
  url.searchParams.set("ie", "UTF-8");
  url.searchParams.set("client", "tw-ob");
  url.searchParams.set("tl", tl);
  url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA, Accept: "*/*" },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`TTS HTTP ${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (!looksLikeMp3(buf)) {
    throw new Error("TTS response not MP3");
  }
  return buf;
}

export async function synthesizeToMp3Buffer(
  text: string,
  tl: "ja" | "id",
): Promise<Buffer> {
  let clean = text.replace(/\s+/g, " ").trim().slice(0, MAX_TOTAL);
  if (!clean) {
    throw new Error("empty text");
  }

  if (tl === "ja") {
    try {
      clean = (await normalizeJapaneseForGoogleTts(clean)).trim().slice(0, MAX_TOTAL);
    } catch {
      /* keep original */
    }
    if (!clean) {
      throw new Error("empty text");
    }
  }

  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += CHUNK) {
    chunks.push(clean.slice(i, i + CHUNK));
  }

  const parts: Buffer[] = [];
  for (const q of chunks) {
    parts.push(await fetchOneChunk(q, tl));
  }

  return Buffer.concat(parts);
}
