import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import {
  mergeReadingsIntoCache,
  READING_CACHE_EVENT,
  readCache,
} from "@/lib/japaneseReadingCache";

function toHiraganaLoose(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

function getCached(text: string): { hiragana: string; romaji: string } | undefined {
  const c = readCache()[text];
  if (!c?.hiragana?.trim()) return undefined;
  return { hiragana: c.hiragana, romaji: c.romaji || "" };
}

export function useJapaneseReading(text: string, enabled: boolean) {
  const [hiragana, setHiragana] = useState("");
  const [romaji, setRomaji] = useState("");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    if (!enabled || !text) {
      setHiragana("");
      setRomaji("");
      setLoading(false);
      return;
    }

    const hit = getCached(text);
    if (hit) {
      setHiragana(hit.hiragana);
      setRomaji(hit.romaji);
      setLoading(false);
      return;
    }

    setHiragana("");
    setRomaji("");

    let cancelled = false;
    setLoading(true);
    apiRequest("POST", "/api/japanese/reading", { text })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const nextH = typeof data?.hiragana === "string" ? data.hiragana : "";
        const nextR = typeof data?.romaji === "string" ? data.romaji : "";
        setHiragana(nextH);
        setRomaji(nextR);
        if (nextH.trim()) {
          mergeReadingsIntoCache({ [text]: { hiragana: nextH, romaji: nextR } });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHiragana("");
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

  useEffect(() => {
    if (!enabled || !text) return;
    const onCache = () => {
      const h = getCached(text);
      if (h) {
        setHiragana(h.hiragana);
        setRomaji(h.romaji);
        setLoading(false);
      }
    };
    window.addEventListener(READING_CACHE_EVENT, onCache);
    return () => window.removeEventListener(READING_CACHE_EVENT, onCache);
  }, [enabled, text]);

  return useMemo(
    () => ({
      kana: hiragana,
      romaji,
      original: text,
      loading,
    }),
    [hiragana, romaji, text, loading],
  );
}
