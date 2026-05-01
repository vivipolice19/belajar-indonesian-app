import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronLeft, ChevronRight, Shuffle, Volume2 } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SENTENCES_DATA } from "../../../shared/types";
import { JapaneseLearnerReading } from "../components/JapaneseLearnerReading";
import { useApp } from "../context/AppContext";
import { useJapaneseReading } from "../hooks/useJapaneseReading";
import { useAppSpeech } from "../hooks/useAppSpeech";
import { prefetchJapaneseReadings } from "../lib/prefetchJapaneseReadings";
import type { RootStackParamList } from "../navigation/types";
import { design } from "../theme/designTokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SentencesScreen() {
  const navigation = useNavigation<Nav>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledSentences, setShuffledSentences] = useState([...SENTENCES_DATA]);
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedback, setFeedback] = useState("");

  const { mode: learnerMode, progress, markSentenceLearned, markSentencePronounced } = useApp();
  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useAppSpeech();
  const currentSentence = shuffledSentences[currentIndex];
  const jpReading = useJapaneseReading(currentSentence?.japanese || "", learnerMode === "id");

  useEffect(() => {
    setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
  }, []);

  const nearbyJapaneseTexts = useMemo(() => {
    if (learnerMode !== "id" || shuffledSentences.length === 0) return [];
    const windowSize = 8;
    const out: string[] = [];
    for (let i = 0; i < windowSize; i++) {
      const s = shuffledSentences[(currentIndex + i) % shuffledSentences.length];
      if (s?.japanese) out.push(s.japanese);
    }
    return out;
  }, [learnerMode, shuffledSentences, currentIndex]);

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
      if (!progress.sentencesLearned.includes(currentSentence.id)) {
        markSentenceLearned(currentSentence.id);
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
    if (learnerMode === "ja") speakIndonesian(currentSentence.indonesian);
    else {
      const k = jpReading.kana?.trim();
      speakJapanese(k && !jpReading.loading ? k : currentSentence.japanese);
    }
    if (!progress.sentencesPronounced.includes(currentSentence.id)) {
      markSentencePronounced(currentSentence.id);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < 0) {
        setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
        return SENTENCES_DATA.length - 1;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= shuffledSentences.length) {
        setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
        return 0;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleShuffle = () => {
    setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setFeedback(learnerMode === "ja" ? "文章をシャッフルしました" : "Kalimat diacak.");
    setTimeout(() => setFeedback(""), 1500);
  };

  return (
    <View style={styles.page} testID="page-sentences">
      <View style={styles.header}>
        <Text style={styles.title}>
          {learnerMode === "ja" ? "基本マスタ（固定文章）" : "Kalimat tetap (data)"}
        </Text>
        <Pressable style={styles.aiLink} onPress={() => navigation.navigate("Sentences")} testID="link-ai-sentences">
          <Text style={styles.aiLinkTxt}>
            {learnerMode === "ja" ? "シチュエーション別のAI生成へ →" : "Ke AI menurut situasi →"}
          </Text>
        </Pressable>
        <View style={styles.badgeRow}>
          {currentSentence.category ? (
            <View style={styles.badgeOutline} testID="badge-category">
              <Text style={styles.badgeOutlineTxt}>{currentSentence.category}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {learnerMode === "ja"
            ? `全${SENTENCES_DATA.length}文からランダム出題・無限ループ`
            : `${SENTENCES_DATA.length} kalimat • acak • tanpa batas`}
        </Text>
      </View>

      {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}

      <Pressable
        onPress={handleCardClick}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        testID="card-sentence"
      >
        {!isFlipped ? (
          <View style={styles.cardInner}>
            <Text style={styles.labelSm}>
              {learnerMode === "ja" ? "インドネシア語の文章" : "Kalimat bahasa Jepang"}
            </Text>
            {learnerMode === "ja" ? (
              <Text style={styles.textIdSentence} testID="text-indonesian-sentence">
                {currentSentence.indonesian}
              </Text>
            ) : (
              <View testID="text-japanese-sentence">
                <JapaneseLearnerReading reading={jpReading} size="medium" />
              </View>
            )}
            <Text style={styles.hint}>
              {learnerMode === "ja"
                ? "カードをタップして日本語訳を表示"
                : "Ketuk kartu untuk terjemahan bahasa Indonesia"}
            </Text>
          </View>
        ) : (
          <View style={styles.cardInner}>
            <Text style={styles.labelSm}>
              {learnerMode === "ja" ? "日本語訳" : "Terjemahan Indonesia"}
            </Text>
            <Text
              style={styles.textJpPrimary}
              testID={learnerMode === "ja" ? "text-japanese-sentence" : "text-indonesian-sentence"}
            >
              {learnerMode === "ja" ? currentSentence.japanese : currentSentence.indonesian}
            </Text>
            <View style={styles.secondaryBlock}>
              {learnerMode === "ja" ? (
                <Text style={styles.textMutedBase}>{currentSentence.indonesian}</Text>
              ) : (
                <JapaneseLearnerReading reading={jpReading} size="small" />
              )}
              {currentSentence.category ? (
                <Text style={styles.catSmall}>({currentSentence.category})</Text>
              ) : null}
            </View>
            <Text style={styles.hintXs}>
              {learnerMode === "ja" ? "カードをタップして戻る" : "Ketuk kartu untuk kembali"}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.toolbar}>
        <Pressable style={styles.iconBtn} onPress={handlePrevious} testID="button-previous-sentence">
          <ChevronLeft size={22} color={design.foreground} />
        </Pressable>
        <Pressable style={[styles.iconBtn, styles.iconBtnPrimary]} onPress={handleSpeak} testID="button-speak-sentence">
          <Volume2 size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleShuffle} testID="button-shuffle-sentence">
          <Shuffle size={22} color={design.foreground} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleNext} testID="button-next-sentence">
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
  aiLink: { alignSelf: "stretch", marginHorizontal: 8 },
  aiLinkTxt: { color: design.primary, fontWeight: "700", fontSize: 14, textAlign: "center" },
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
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  textIdSentence: {
    fontSize: 22,
    fontWeight: "700",
    color: design.foreground,
    textAlign: "center",
    lineHeight: 32,
  },
  textJpPrimary: {
    fontSize: 22,
    fontWeight: "700",
    color: design.primary,
    textAlign: "center",
    lineHeight: 32,
  },
  textMutedBase: { fontSize: 16, color: design.mutedForeground, textAlign: "center" },
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
