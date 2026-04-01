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
  showOriginal?: boolean;
};

const HAN = /[\u4e00-\u9fff]/;

function norm(s: string) {
  return s.replace(/\s+/g, "").trim();
}

/** Hiragana main line, romaji above, optional kanji in parentheses when distinct from kana */
export function JapaneseLearnerReading({
  reading,
  kanaClassName,
  romajiClassName,
  wrapperClassName,
  showOriginal = true,
}: Props) {
  const { mainText, showParen } = useMemo(() => {
    const kana = reading.kana || "";
    const original = reading.original || "";
    const kanaHasHan = HAN.test(kana);
    const dup =
      kana === original || (norm(kana) === norm(original) && norm(original).length > 0);
    if (kanaHasHan) {
      return { mainText: original || kana, showParen: false };
    }
    if (dup) {
      return { mainText: kana || original, showParen: false };
    }
    return {
      mainText: kana || original,
      showParen: Boolean(showOriginal && original.trim()),
    };
  }, [reading.kana, reading.original, showOriginal]);

  return (
    <div className={cn("flex flex-col items-center gap-0.5 text-center", wrapperClassName)}>
      {reading.romaji ? (
        <span
          className={cn(
            "text-base sm:text-lg leading-snug text-muted-foreground tracking-wide font-semibold",
            romajiClassName,
          )}
        >
          {reading.romaji}
        </span>
      ) : null}
      <span className={cn("font-bold", kanaClassName)}>{mainText}</span>
      {showParen ? (
        <span className="text-sm sm:text-base text-muted-foreground font-normal">
          （{reading.original}）
        </span>
      ) : null}
    </div>
  );
}
