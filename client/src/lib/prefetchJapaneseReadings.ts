import { apiRequest } from "@/lib/queryClient";
import { mergeReadingsIntoCache, readCache } from "@/lib/japaneseReadingCache";

const CHUNK = 20;

/**
 * Fetches hiragana/romaji for many strings in few API calls (batch), merges into localStorage cache.
 * Skips strings already cached. Fails silently on 429/network so per-word fallback can run.
 */
export async function prefetchJapaneseReadings(texts: string[]): Promise<void> {
  const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  const missing = unique.filter((t) => {
    const c = readCache()[t];
    return !c?.hiragana || !c.hiragana.trim();
  });
  if (!missing.length) return;

  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK);
    try {
      const res = await apiRequest("POST", "/api/japanese/readings/batch", {
        texts: chunk,
      });
      const data = (await res.json()) as {
        readings?: Record<string, { hiragana?: string; romaji?: string }>;
      };
      if (data.readings && typeof data.readings === "object") {
        mergeReadingsIntoCache(data.readings);
      }
    } catch {
      break;
    }
    if (i + CHUNK < missing.length) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}
