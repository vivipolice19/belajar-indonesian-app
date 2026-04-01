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

/** Hiragana main line, romaji as furigana-style above, optional kanji in parentheses */
export function JapaneseLearnerReading({
  reading,
  kanaClassName,
  romajiClassName,
  wrapperClassName,
  showOriginal = true,
}: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5 text-center", wrapperClassName)}>
      {reading.romaji ? (
        <span className={cn("text-sm sm:text-base leading-snug text-muted-foreground tracking-wide font-medium", romajiClassName)}>
          {reading.romaji}
        </span>
      ) : null}
      <span className={cn("font-bold", kanaClassName)}>{reading.kana}</span>
      {showOriginal ? (
        <span className="text-sm text-muted-foreground">（{reading.original}）</span>
      ) : null}
    </div>
  );
}
