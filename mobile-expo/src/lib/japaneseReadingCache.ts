import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeLearnerRomaji } from "../../../shared/romajiLearnerNormalize";

export type CachedReading = { hiragana: string; romaji: string };
export type ReadingCache = Record<string, CachedReading>;

export const CACHE_KEY = "belajar_japanese_reading_cache_v3";

let memoryCache: ReadingCache = {};
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function readCache(): ReadingCache {
  return memoryCache;
}

export function subscribeReadingCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function hydrateReadingCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      memoryCache = {};
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      memoryCache = parsed as ReadingCache;
    }
  } catch {
    memoryCache = {};
  }
}

async function persistCache() {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
  } catch {
    /* ignore */
  }
}

export function mergeReadingsIntoCache(
  entries: Record<string, Partial<CachedReading> | CachedReading | undefined>,
) {
  const cur = { ...memoryCache };
  for (const [key, v] of Object.entries(entries)) {
    if (!key || !v) continue;
    const h = typeof v.hiragana === "string" ? v.hiragana : "";
    const r = typeof v.romaji === "string" ? v.romaji : "";
    if (h || r) cur[key] = { hiragana: h, romaji: normalizeLearnerRomaji(r) };
  }
  memoryCache = cur;
  void persistCache();
  notify();
}
