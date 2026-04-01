import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import {
  mergeReadingsIntoCache,
  READING_CACHE_EVENT,
  readCache,
} from "@/lib/japaneseReadingCache";
import { getLocalJapaneseReading } from "@/lib/localJapaneseReading";

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
      setHiragana(toHiraganaLoose(text));
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

    setHiragana(toHiraganaLoose(text));
    setRomaji("");

    let cancelled = false;
    setLoading(true);
    // Prefer local conversion (no API usage). Fallback to server when it fails.
    getLocalJapaneseReading(text)
      .then(({ hiragana: h, romaji: r }) => {
        if (cancelled) return;
        const nextH = typeof h === "string" && h.trim() ? h : toHiraganaLoose(text);
        const nextR = typeof r === "string" ? r : "";
        setHiragana(nextH);
        setRomaji(nextR);
        mergeReadingsIntoCache({ [text]: { hiragana: nextH, romaji: nextR } });
      })
      .catch(() => {
        apiRequest("POST", "/api/japanese/reading", { text })
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;
            const nextH =
              typeof data?.hiragana === "string"
                ? data.hiragana
                : toHiraganaLoose(text);
            const nextR = typeof data?.romaji === "string" ? data.romaji : "";
            setHiragana(nextH);
            setRomaji(nextR);
            mergeReadingsIntoCache({ [text]: { hiragana: nextH, romaji: nextR } });
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
        return;
      })
      .finally(() => {
        // If local succeeded, clear loading here.
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
