import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { mergeReadingsIntoCache, readCache, subscribeReadingCache } from "../lib/japaneseReadingCache";
import { apiRequest } from "../lib/apiRequest";

export type ReadingState = {
  kana: string;
  romaji: string;
  original: string;
  loading: boolean;
};

function getCached(text: string): { hiragana: string; romaji: string } | undefined {
  const c = readCache()[text];
  if (!c?.hiragana?.trim()) return undefined;
  return { hiragana: c.hiragana, romaji: c.romaji || "" };
}

export function useJapaneseReading(text: string, enabled: boolean): ReadingState {
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
    void apiRequest("POST", "/api/japanese/reading", { text })
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
    return subscribeReadingCache(onCache);
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
