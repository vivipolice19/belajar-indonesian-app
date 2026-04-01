export type CachedReading = { hiragana: string; romaji: string };
export type ReadingCache = Record<string, CachedReading>;

export const CACHE_KEY = "belajar_japanese_reading_cache_v2";
export const READING_CACHE_EVENT = "belajar:reading-cache-updated";

export function readCache(): ReadingCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as ReadingCache;
  } catch {
    // ignore
  }
  return {};
}

export function writeCache(cache: ReadingCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export function mergeReadingsIntoCache(
  entries: Record<string, Partial<CachedReading> | CachedReading | undefined>,
) {
  const cur = readCache();
  for (const [key, v] of Object.entries(entries)) {
    if (!key || !v) continue;
    const h = typeof v.hiragana === "string" ? v.hiragana : "";
    const r = typeof v.romaji === "string" ? v.romaji : "";
    if (h || r) cur[key] = { hiragana: h, romaji: r };
  }
  writeCache(cur);
  try {
    window.dispatchEvent(new CustomEvent(READING_CACHE_EVENT));
  } catch {
    // ignore
  }
}
