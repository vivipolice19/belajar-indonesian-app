import { ChevronLeft, ChevronRight, Shuffle, Volume2 } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { WORDS_DATA } from "../../../shared/types";
import { JapaneseLearnerReading } from "../components/JapaneseLearnerReading";
import { useApp } from "../context/AppContext";
import { useJapaneseReading } from "../hooks/useJapaneseReading";
import { useAppSpeech } from "../hooks/useAppSpeech";
import { prefetchJapaneseReadings } from "../lib/prefetchJapaneseReadings";
import { design } from "../theme/designTokens";

export function WordCardsScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState([...WORDS_DATA]);
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedback, setFeedback] = useState("");

  const { mode: learnerMode, progress, markWordLearned, markWordPronounced } = useApp();
  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useAppSpeech();
  const currentWord = shuffledWords[currentIndex];
  const jpReading = useJapaneseReading(currentWord?.japanese || "", learnerMode === "id");

  useEffect(() => {
    setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
  }, []);

  const nearbyJapaneseTexts = useMemo(() => {
    if (learnerMode !== "id" || shuffledWords.length === 0) return [];
    const windowSize = 12;
    const out: string[] = [];
    for (let i = 0; i < windowSize; i++) {
      const w = shuffledWords[(currentIndex + i) % shuffledWords.length];
      if (w?.japanese) out.push(w.japanese);
    }
    return out;
  }, [learnerMode, shuffledWords, currentIndex]);

  useEffect(() => {
    if (learnerMode !== "id") return;
    if (prefetchTimer.current) clearTimeout(prefetchTimer.current);
    prefetchTimer.current = setTimeout(() => {
      void prefetchJapaneseReadings(nearbyJapaneseTexts);
    }, 250);
    return () => {
      if (prefetchTimer.current) clearTimeout(prefetchTimer.current);
    };
  }, [learnerMode, nearbyJapaneseTexts]);

  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      if (!progress.wordsLearned.includes(currentWord.id)) {
        markWordLearned(currentWord.id);
      }
    } else {
      setIsFlipped(false);
    }
  };

  const handleSpeak = () => {
    if (!isSpeechSupported) {
      Alert.alert("", learnerMode === "ja" ? "音声を利用できません" : "Suara tidak tersedia.");
      return;
    }
    if (learnerMode === "ja") speakIndonesian(currentWord.indonesian);
    else {
      const k = jpReading.kana?.trim();
      speakJapanese(k && !jpReading.loading ? k : currentWord.japanese);
    }
    if (!progress.wordsPronounced.includes(currentWord.id)) {
      markWordPronounced(currentWord.id);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < 0) {
        setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
        return WORDS_DATA.length - 1;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= shuffledWords.length) {
        setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
        return 0;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleShuffle = () => {
    setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setFeedback(learnerMode === "ja" ? "単語をシャッフルしました" : "Kosakata diacak.");
    setTimeout(() => setFeedback(""), 1500);
  };

  return (
    <View style={styles.page} testID="page-cards">
      <View style={styles.header}>
        <Text style={styles.title}>
          {learnerMode === "ja" ? "単語カード" : "Kartu kosakata"}
        </Text>
        <View style={styles.badgeRow}>
          {currentWord.category ? (
            <View style={styles.badgeOutline} testID="badge-category">
              <Text style={styles.badgeOutlineTxt}>{currentWord.category}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {learnerMode === "ja"
            ? `全${WORDS_DATA.length}語からランダム出題・無限ループ`
            : `${WORDS_DATA.length} kosakata • acak • tanpa batas`}
        </Text>
      </View>

      {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}

      <Pressable
        onPress={handleCardClick}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        testID="card-flashcard"
      >
        {!isFlipped ? (
          <View style={styles.cardInner}>
            <Text style={styles.labelSm}>
              {learnerMode === "ja" ? "インドネシア語" : "Bahasa Jepang"}
            </Text>
            {learnerMode === "ja" ? (
              <Text style={styles.textIdLg} testID="text-indonesian">
                {currentWord.indonesian}
              </Text>
            ) : (
              <View testID="text-japanese">
                <JapaneseLearnerReading reading={jpReading} size="large" />
              </View>
            )}
            <Text style={styles.hint}>
              {learnerMode === "ja"
                ? "カードをタップして日本語の意味を表示"
                : "Ketuk kartu untuk menampilkan bahasa Indonesia"}
            </Text>
          </View>
        ) : (
          <View style={styles.cardInner}>
            <Text style={styles.labelSm}>
              {learnerMode === "ja" ? "日本語の意味" : "Bahasa Indonesia"}
            </Text>
            <Text
              style={styles.textJpPrimary}
              testID={learnerMode === "ja" ? "text-japanese" : "text-indonesian"}
            >
              {learnerMode === "ja" ? currentWord.japanese : currentWord.indonesian}
            </Text>
            <View style={styles.secondaryBlock}>
              {learnerMode === "ja" ? (
                <Text style={styles.textMutedLg}>{currentWord.indonesian}</Text>
              ) : (
                <JapaneseLearnerReading reading={jpReading} size="medium" />
              )}
              {currentWord.category ? (
                <Text style={styles.catSmall}>({currentWord.category})</Text>
              ) : null}
            </View>
            <Text style={styles.hintXs}>
              {learnerMode === "ja" ? "カードをタップして戻る" : "Ketuk kartu untuk kembali"}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.toolbar}>
        <Pressable style={styles.iconBtn} onPress={handlePrevious} testID="button-previous">
          <ChevronLeft size={22} color={design.foreground} />
        </Pressable>
        <Pressable style={[styles.iconBtn, styles.iconBtnPrimary]} onPress={handleSpeak} testID="button-speak">
          <Volume2 size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleShuffle} testID="button-shuffle">
          <Shuffle size={22} color={design.foreground} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleNext} testID="button-next">
          <ChevronRight size={22} color={design.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24 },
  header: { alignItems: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "700", color: design.foreground },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  badgeOutline: {
    borderWidth: 1,
    borderColor: design.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOutlineTxt: { fontSize: 12, color: design.foreground },
  meta: { fontSize: 12, color: design.mutedForeground, textAlign: "center" },
  feedback: { textAlign: "center", color: design.green600, fontWeight: "600" },
  card: {
    minHeight: 320,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: { transform: [{ scale: 0.99 }] },
  cardInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  labelSm: {
    fontSize: 13,
    fontWeight: "600",
    color: design.mutedForeground,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  textIdLg: { fontSize: 32, fontWeight: "700", color: design.foreground, textAlign: "center" },
  textJpPrimary: { fontSize: 28, fontWeight: "700", color: design.primary, textAlign: "center" },
  textMutedLg: { fontSize: 18, color: design.mutedForeground, textAlign: "center" },
  secondaryBlock: { alignItems: "center", gap: 6, width: "100%" },
  catSmall: { fontSize: 12, color: design.mutedForeground },
  hint: { fontSize: 14, color: design.mutedForeground, textAlign: "center" },
  hintXs: { fontSize: 12, color: design.mutedForeground, textAlign: "center" },
  toolbar: { flexDirection: "row", justifyContent: "center", gap: 16, paddingHorizontal: 8 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPrimary: { backgroundColor: design.primary, borderColor: design.primary },
});
