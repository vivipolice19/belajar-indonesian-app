import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type ReadingCache = Record<string, string>;
const CACHE_KEY = "belajar_japanese_reading_cache_v1";

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
    if (parsed && typeof parsed === "object") return parsed;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setHiragana(toHiraganaLoose(text));
      return;
    }

    const cache = readCache();
    if (cache[text]) {
      setHiragana(cache[text]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    apiRequest("POST", "/api/japanese/reading", { text })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const next = typeof data?.hiragana === "string" ? data.hiragana : toHiraganaLoose(text);
        setHiragana(next);
        const current = readCache();
        current[text] = next;
        writeCache(current);
      })
      .catch(() => {
        if (!cancelled) setHiragana(toHiraganaLoose(text));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, text]);

  const display = useMemo(
    () => ({
      kana: hiragana,
      original: text,
      loading,
    }),
    [hiragana, text, loading]
  );

  return display;
}

