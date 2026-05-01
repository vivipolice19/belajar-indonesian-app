import { createHash } from "crypto";

/** Cross-user memo for identical AI params — cuts Gemini calls under free quotas. */

const VOCAB_SENT_TTL_MS = Number(process.env.AI_SHARED_CACHE_TTL_MS ?? 45 * 60 * 1000);
const TRANSLATE_TTL_MS = Number(process.env.AI_TRANSLATE_CACHE_TTL_MS ?? 12 * 60 * 1000);
const MAX_ENTRIES = Math.max(200, Number(process.env.AI_SHARED_CACHE_MAX ?? 3500));

type Entry<T> = { at: number; value: T };

const store = new Map<string, Entry<unknown>>();

function prune(): void {
  if (store.size <= MAX_ENTRIES) return;
  const drop = Math.floor(store.size * 0.15);
  const keys = [...store.keys()].slice(0, drop);
  for (const k of keys) store.delete(k);
}

export function sharedCacheGet<T>(key: string, ttlMs: number): T | null {
  const e = store.get(key) as Entry<T> | undefined;
  if (!e) return null;
  if (Date.now() - e.at > ttlMs) {
    store.delete(key);
    return null;
  }
  return e.value;
}

export function sharedCacheSet<T>(key: string, value: T): void {
  store.set(key, { at: Date.now(), value });
  prune();
}

/** Count はキーに含めない — 再利用時はキャッシュ長が requested 以上なら先頭だけ返す */
export function vocabCacheKey(mode: "ja" | "id", theme: string, difficulty: number): string {
  const t = String(theme).slice(0, 80).trim().toLowerCase();
  const d = Math.max(1, Math.min(10, Math.floor(difficulty)));
  return `vocab:v2:${mode}:${d}:${t}`;
}

export function sentencesCacheKey(mode: "ja" | "id", situation: string, difficulty: number): string {
  const s = String(situation).slice(0, 80).trim().toLowerCase();
  const d = Math.max(1, Math.min(10, Math.floor(difficulty)));
  return `sent:v2:${mode}:${d}:${s}`;
}

export function translateCacheKey(
  learnerMode: "ja" | "id",
  sourceLanguage: "japanese" | "indonesian",
  text: string,
): string {
  const norm = text.trim().replace(/\s+/g, " ").slice(0, 4000);
  const h = createHash("sha256").update(`${learnerMode}\0${sourceLanguage}\0${norm}`).digest("hex");
  return `adv:v1:${h}`;
}

export const sharedCacheTTL = {
  vocabSentences: VOCAB_SENT_TTL_MS,
  translate: TRANSLATE_TTL_MS,
};
