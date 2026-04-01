import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type JapaneseReadingDisplay = {
  kana: string;
  romaji: string;
  original: string;
  loading: boolean;
};

type Props = {
  reading: JapaneseReadingDisplay;
  kanaClassName?: string;
  romajiClassName?: string;
  wrapperClassName?: string;
  /** Show kanji line below hiragana when applicable (reference) */
  showOriginal?: boolean;
};

const HAN = /[\u4e00-\u9fff]/;

function norm(s: string) {
  return s.replace(/\s+/g, "").trim();
}

/**
 * Stack: [romaji furigana] → [hiragana MAIN] → [kanji reference below]
 * Never uses kanji as the large main line — only hiragana (or loading placeholder).
 */
export function JapaneseLearnerReading({
  reading,
  kanaClassName,
  romajiClassName,
  wrapperClassName,
  showOriginal = true,
}: Props) {
  const kana = reading.kana || "";
  const original = reading.original || "";

  const { hiraganaOk, showKanjiRef } = useMemo(() => {
    const ok = kana.trim().length > 0 && !HAN.test(kana);
    const originalHasKanji = HAN.test(original);
    const sameSurface = ok && norm(kana) === norm(original) && !originalHasKanji;
    const ref =
      showOriginal &&
      original.trim() &&
      !sameSurface &&
      (originalHasKanji || (ok && norm(kana) !== norm(original)));
    return { hiraganaOk: ok, showKanjiRef: Boolean(ref) };
  }, [kana, original, showOriginal]);

  return (
    <div className={cn("flex flex-col items-center gap-1 text-center", wrapperClassName)}>
      {/* ローマ字（フリガナ風・上） */}
      {reading.romaji ? (
        <span
          className={cn(
            "text-sm sm:text-base leading-tight text-muted-foreground tracking-wide font-semibold",
            romajiClassName,
          )}
        >
          {reading.romaji}
        </span>
      ) : null}

      {/* ひらがな（本文・最大）— 漢字はここに出さない */}
      {hiraganaOk ? (
        <span className={cn("font-bold text-foreground", kanaClassName)}>{kana}</span>
      ) : reading.loading ? (
        <span
          className={cn(
            "font-bold text-muted-foreground animate-pulse select-none",
            kanaClassName,
          )}
          aria-live="polite"
        >
          よみこみちゅう…
        </span>
      ) : (
        <span
          className={cn(
            "font-semibold text-muted-foreground text-sm sm:text-base",
            kanaClassName,
          )}
        >
          {original}
        </span>
      )}

      {/* 漢字は参考としてのみ（下・小さめ） */}
      {showKanjiRef ? (
        <span
          className="mt-1.5 text-sm sm:text-base text-muted-foreground font-normal tracking-wide"
          data-testid="kanji-reference"
        >
          {original}
        </span>
      ) : null}
    </div>
  );
}
