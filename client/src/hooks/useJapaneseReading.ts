import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type CachedEntry = { hiragana: string; romaji: string };
type ReadingCache = Record<string, CachedEntry>;
const CACHE_KEY = "belajar_japanese_reading_cache_v2";

function toHiraganaLoose(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function readCache(): ReadingCache {
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

function writeCache(cache: ReadingCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export function useJapaneseReading(text: string, enabled: boolean) {
  const [hiragana, setHiragana] = useState<string>(() => toHiraganaLoose(text));
  const [romaji, setRomaji] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setHiragana(toHiraganaLoose(text));
      setRomaji("");
      return;
    }

    const cache = readCache();
    if (cache[text]) {
      setHiragana(cache[text].hiragana);
      setRomaji(cache[text].romaji || "");
      return;
    }

    let cancelled = false;
    setLoading(true);
    apiRequest("POST", "/api/japanese/reading", { text })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const nextH =
          typeof data?.hiragana === "string" ? data.hiragana : toHiraganaLoose(text);
        const nextR = typeof data?.romaji === "string" ? data.romaji : "";
        setHiragana(nextH);
        setRomaji(nextR);
        const current = readCache();
        current[text] = { hiragana: nextH, romaji: nextR };
        writeCache(current);
      })
      .catch(() => {
        if (!cancelled) {
          setHiragana(toHiraganaLoose(text));
          setRomaji("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, text]);

  return useMemo(
    () => ({
      kana: hiragana,
      romaji,
      original: text,
      loading,
    }),
    [hiragana, romaji, text, loading]
  );
}
