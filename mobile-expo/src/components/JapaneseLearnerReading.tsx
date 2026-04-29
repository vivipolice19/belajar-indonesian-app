import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ReadingState } from "../hooks/useJapaneseReading";
import { design } from "../theme/designTokens";

export type JapaneseReadingDisplay = ReadingState;

type Props = {
  reading: JapaneseReadingDisplay;
  kanaClassName?: never;
  romajiClassName?: never;
  /** "large" | "medium" | "small" — maps from web Tailwind sizes */
  size?: "large" | "medium" | "small";
  align?: "center" | "start";
  showOriginal?: boolean;
};

const HAN = /[\u4e00-\u9fff]/;

function norm(s: string) {
  return s.replace(/\s+/g, "").trim();
}

export function JapaneseLearnerReading({
  reading,
  size = "medium",
  align = "center",
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

  const kanaStyle = [
    styles.kanaBase,
    size === "large" && styles.kanaLg,
    size === "medium" && styles.kanaMd,
    size === "small" && styles.kanaSm,
    align === "start" && styles.alignStart,
  ];

  return (
    <View style={[styles.wrap, align === "start" && styles.wrapStart]}>
      {reading.romaji ? (
        <Text style={[styles.romaji, align === "start" && styles.alignStart]}>{reading.romaji}</Text>
      ) : null}

      {hiraganaOk ? (
        <Text style={kanaStyle}>{kana}</Text>
      ) : reading.loading ? (
        <Text style={[kanaStyle, styles.loading]} accessibilityLiveRegion="polite">
          よみこみちゅう…
        </Text>
      ) : (
        <Text style={styles.fallback}>よみがなじゅんびちゅう</Text>
      )}

      {showKanjiRef ? (
        <Text style={styles.kanjiRef} testID="kanji-reference">
          {original}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  wrapStart: { alignItems: "flex-start" },
  alignStart: { textAlign: "left", alignSelf: "stretch" },
  romaji: {
    fontSize: 15,
    fontWeight: "600",
    color: design.mutedForeground,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  kanaBase: { fontWeight: "700", color: design.foreground, textAlign: "center" },
  kanaLg: { fontSize: 32, lineHeight: 40 },
  kanaMd: { fontSize: 24, lineHeight: 32 },
  kanaSm: { fontSize: 18, lineHeight: 26 },
  loading: { color: design.mutedForeground },
  fallback: { fontSize: 15, fontWeight: "600", color: design.mutedForeground, textAlign: "center" },
  kanjiRef: {
    marginTop: 6,
    fontSize: 15,
    color: design.mutedForeground,
    textAlign: "center",
  },
});
