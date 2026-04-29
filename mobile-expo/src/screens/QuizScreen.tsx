import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { BookOpen, BookText, CheckCircle2, Trophy, Volume2, XCircle } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SENTENCES_DATA, WORDS_DATA } from "../../../shared/types";
import { JapaneseLearnerReading } from "../components/JapaneseLearnerReading";
import { useApp } from "../context/AppContext";
import { useJapaneseReading } from "../hooks/useJapaneseReading";
import { useAppSpeech } from "../hooks/useAppSpeech";
import { design } from "../theme/designTokens";

type QuizMode = "words" | "sentences";

type DirectionalQuestion = {
  prompt: string;
  options: string[];
  correctAnswer: string;
  speakLang: "id-ID" | "ja-JP";
};

const RECENT_QUESTIONS_KEY = "belajar_recent_questions";
const MAX_RECENT_QUESTIONS = 30;

function JapaneseAssistText({
  text,
  enabled,
  size = "large",
}: {
  text: string;
  enabled: boolean;
  size?: "large" | "medium";
}) {
  const reading = useJapaneseReading(text, enabled);
  if (!enabled) return <Text style={size === "large" ? styles.qPlainLg : styles.qPlainMd}>{text}</Text>;
  return <JapaneseLearnerReading reading={reading} size={size === "large" ? "large" : "medium"} />;
}

export function QuizScreen() {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [directionalQuestion, setDirectionalQuestion] = useState<DirectionalQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [toastMsg, setToastMsg] = useState("");

  const recentRef = useRef<{ words: number[]; sentences: number[] }>({ words: [], sentences: [] });
  const { completeQuiz, mode: learnerMode } = useApp();
  const { speak, isSupported: isSpeechSupported } = useAppSpeech();

  const quizJaReadingEnabled =
    learnerMode === "id" && !!directionalQuestion && directionalQuestion.speakLang === "ja-JP";
  const quizPromptReading = useJapaneseReading(directionalQuestion?.prompt ?? "", quizJaReadingEnabled);

  useEffect(() => {
    void (async () => {
      const [w, s] = await Promise.all([
        AsyncStorage.getItem(`${RECENT_QUESTIONS_KEY}_words`),
        AsyncStorage.getItem(`${RECENT_QUESTIONS_KEY}_sentences`),
      ]);
      recentRef.current = {
        words: w ? (JSON.parse(w) as number[]) : [],
        sentences: s ? (JSON.parse(s) as number[]) : [],
      };
    })();
  }, []);

  const persistRecent = async (m: "words" | "sentences") => {
    const key = `${RECENT_QUESTIONS_KEY}_${m}`;
    const val = JSON.stringify(recentRef.current[m === "words" ? "words" : "sentences"]);
    await AsyncStorage.setItem(key, val);
  };

  const getRecentQuestions = (m: "words" | "sentences") =>
    m === "words" ? recentRef.current.words : recentRef.current.sentences;

  const addRecentQuestion = (m: "words" | "sentences", id: number) => {
    const k = m === "words" ? "words" : "sentences";
    const recent = recentRef.current[k];
    const updated = [id, ...recent.filter((qid) => qid !== id)].slice(0, MAX_RECENT_QUESTIONS);
    recentRef.current = { ...recentRef.current, [k]: updated };
    void persistRecent(m);
  };

  const generateDirectionalWordQuestion = (direction: "ja" | "id"): DirectionalQuestion => {
    const recent = getRecentQuestions("words");
    let availableWords = WORDS_DATA.filter((w) => !recent.includes(w.id));
    if (availableWords.length < 4) {
      availableWords = WORDS_DATA;
    }
    const word = availableWords[Math.floor(Math.random() * availableWords.length)];
    addRecentQuestion("words", word.id);

    if (direction === "ja") {
      const otherWords = WORDS_DATA.filter((w) => w.id !== word.id);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.japanese);
      const options = [...wrongAnswers, word.japanese].sort(() => Math.random() - 0.5);
      return {
        prompt: word.indonesian,
        options,
        correctAnswer: word.japanese,
        speakLang: "id-ID",
      };
    }

    const otherWords = WORDS_DATA.filter((w) => w.id !== word.id);
    const wrongAnswers = otherWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.indonesian);
    const options = [...wrongAnswers, word.indonesian].sort(() => Math.random() - 0.5);
    return {
      prompt: word.japanese,
      options,
      correctAnswer: word.indonesian,
      speakLang: "ja-JP",
    };
  };

  const generateDirectionalSentenceQuestion = (direction: "ja" | "id"): DirectionalQuestion | null => {
    if (SENTENCES_DATA.length < 4) return null;
    const recent = getRecentQuestions("sentences");
    let availableSentences = SENTENCES_DATA.filter((s) => !recent.includes(s.id));
    if (availableSentences.length < 4) {
      availableSentences = SENTENCES_DATA;
    }
    const sentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];
    addRecentQuestion("sentences", sentence.id);

    if (direction === "ja") {
      const otherSentences = SENTENCES_DATA.filter((s) => s.id !== sentence.id);
      const wrongAnswers = otherSentences
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((s) => s.japanese);
      const options = [...wrongAnswers, sentence.japanese].sort(() => Math.random() - 0.5);
      return {
        prompt: sentence.indonesian,
        options,
        correctAnswer: sentence.japanese,
        speakLang: "id-ID",
      };
    }

    const otherSentences = SENTENCES_DATA.filter((s) => s.id !== sentence.id);
    const wrongAnswers = otherSentences
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((s) => s.indonesian);
    const options = [...wrongAnswers, sentence.indonesian].sort(() => Math.random() - 0.5);
    return {
      prompt: sentence.japanese,
      options,
      correctAnswer: sentence.indonesian,
      speakLang: "ja-JP",
    };
  };

  const pronounceWord = (text: string, lang: "id-ID" | "ja-JP") => {
    if (!isSpeechSupported) {
      Alert.alert(
        "",
        learnerMode === "ja"
          ? "お使いのブラウザは音声機能に対応していません"
          : "Browser Anda tidak mendukung suara.",
      );
      return;
    }
    speak(text, lang, lang === "ja-JP" ? 0.95 : 0.85);
  };

  const startWordQuiz = () => {
    setMode("words");
    setDirectionalQuestion(generateDirectionalWordQuestion(learnerMode));
    setSelectedAnswer(null);
    setScore(0);
    setQuestionCount(0);
  };

  const startSentenceQuiz = () => {
    const q = generateDirectionalSentenceQuestion(learnerMode);
    if (!q) {
      Alert.alert(
        "",
        learnerMode === "ja" ? "文章データが不足しています" : "Data kalimat tidak cukup.",
      );
      return;
    }
    setMode("sentences");
    setDirectionalQuestion(q);
    setSelectedAnswer(null);
    setScore(0);
    setQuestionCount(0);
  };

  const loadNextQuestion = () => {
    if (mode === "words") {
      setDirectionalQuestion(generateDirectionalWordQuestion(learnerMode));
      setSelectedAnswer(null);
      setQuestionCount((prev) => prev + 1);
    } else if (mode === "sentences") {
      const next = generateDirectionalSentenceQuestion(learnerMode);
      if (!next) {
        Alert.alert(
          "",
          learnerMode === "ja"
            ? "文章データが不足しています。メニューに戻ります。"
            : "Data kalimat tidak cukup. Kembali ke menu.",
        );
        setTimeout(() => handleBackToMenu(), 1500);
        return;
      }
      setDirectionalQuestion(next);
      setSelectedAnswer(null);
      setQuestionCount((prev) => prev + 1);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || !directionalQuestion) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === directionalQuestion.correctAnswer;

    if (isCorrect) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore((prev) => prev + 1);
      completeQuiz();
      setToastMsg(learnerMode === "ja" ? "正解！" : "Benar!");
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToastMsg(learnerMode === "ja" ? "不正解..." : "Salah...");
    }

    setTimeout(() => {
      setToastMsg("");
      loadNextQuestion();
    }, 1500);
  };

  const handleBackToMenu = () => {
    setMode(null);
    setDirectionalQuestion(null);
    setSelectedAnswer(null);
    setScore(0);
    setQuestionCount(0);
  };

  if (mode === null) {
    return (
      <View style={styles.page} testID="page-quiz-menu">
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>
            {learnerMode === "ja" ? "クイズモード選択" : "Pilih mode kuis"}
          </Text>
          <Text style={styles.menuSub}>
            {learnerMode === "ja" ? "クイズに挑戦しよう！" : "Ayo latihan kuis!"}
          </Text>
        </View>

        <Pressable onPress={startWordQuiz} style={styles.modeCard} testID="card-word-quiz">
          <View style={styles.modeIconBg}>
            <BookOpen size={26} color={design.primary} />
          </View>
          <View style={styles.modeTextCol}>
            <Text style={styles.modeCardTitle}>
              {learnerMode === "ja" ? "単語クイズ" : "Kuis kosakata"}
            </Text>
            <Text style={styles.modeCardDesc}>
              {learnerMode === "ja"
                ? "インドネシア語の単語の意味を答える（無限ループ）"
                : "Jawab arti kosakata bahasa Jepang pilih bahasa Indonesia (tanpa batas)."}
            </Text>
            <View style={styles.volRow}>
              <Volume2 size={12} color={design.mutedForeground} />
              <Text style={styles.volHint}>
                {learnerMode === "ja"
                  ? "各問題で音声発音が聞けます"
                  : "Setiap soal bisa didengarkan pengucapannya"}
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable onPress={startSentenceQuiz} style={styles.modeCard} testID="card-sentence-quiz">
          <View style={[styles.modeIconBg, styles.modeIconBgAccent]}>
            <BookText size={26} color={design.accent} />
          </View>
          <View style={styles.modeTextCol}>
            <Text style={styles.modeCardTitle}>
              {learnerMode === "ja" ? "文章クイズ" : "Kuis kalimat"}
            </Text>
            <Text style={styles.modeCardDesc}>
              {learnerMode === "ja"
                ? "文章の意味を答える（無限ループ）"
                : "Jawab arti kalimat bahasa Jepang pilih bahasa Indonesia (tanpa batas)."}
            </Text>
            <View style={styles.volRow}>
              <Volume2 size={12} color={design.mutedForeground} />
              <Text style={styles.volHint}>
                {learnerMode === "ja"
                  ? "各問題で音声発音が聞けます"
                  : "Setiap soal bisa didengarkan pengucapannya"}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    );
  }

  if (!directionalQuestion) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.muted}>
          {learnerMode === "ja" ? "クイズを準備中..." : "Menyiapkan kuis..."}
        </Text>
      </View>
    );
  }

  const questionText = directionalQuestion.prompt;
  const isJapanesePrompt = learnerMode === "id" && directionalQuestion.speakLang === "ja-JP";
  const questionLabel =
    mode === "words"
      ? learnerMode === "ja"
        ? "この単語の意味は？"
        : "Arti kosakata Jepang ini?"
      : learnerMode === "ja"
        ? "この文章の意味は？"
        : "Arti kalimat Jepang ini?";

  return (
    <View style={styles.page} testID="page-quiz">
      {!!toastMsg && <Text style={styles.toast}>{toastMsg}</Text>}

      <View style={styles.quizTop}>
        <View style={styles.quizTopLeft}>
          <Pressable onPress={handleBackToMenu} style={styles.backGhost} testID="button-back">
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.quizTitle}>
            {mode === "words"
              ? learnerMode === "ja"
                ? "単語クイズ"
                : "Kuis kosakata"
              : learnerMode === "ja"
                ? "文章クイズ"
                : "Kuis kalimat"}
          </Text>
        </View>
        <View style={styles.badgeCount} testID="text-question-count">
          <Text style={styles.badgeCountTxt}>
            {learnerMode === "ja"
              ? `問${questionCount + 1}問目 | スコア: ${score}`
              : `Soal ${questionCount + 1} | Skor: ${score}`}
          </Text>
        </View>
      </View>

      <View style={styles.promptCard}>
        <Text style={styles.promptLabel}>{questionLabel}</Text>
        <View style={styles.promptBox} testID="text-quiz-question">
          <JapaneseAssistText
            text={questionText}
            enabled={isJapanesePrompt}
            size={mode === "words" ? "large" : "medium"}
          />
        </View>
        <Pressable
          style={styles.pronounceBig}
          onPress={() => {
            const k = quizPromptReading.kana?.trim();
            const utter =
              isJapanesePrompt && k && !quizPromptReading.loading ? k : questionText;
            pronounceWord(utter, directionalQuestion.speakLang);
          }}
          disabled={!isSpeechSupported}
          testID="button-pronounce-quiz"
        >
          <Volume2 size={24} color={design.foreground} />
          <Text style={styles.pronounceBigTxt}>
            {isSpeechSupported
              ? learnerMode === "ja"
                ? "発音を聞く"
                : "Dengarkan"
              : learnerMode === "ja"
                ? "音声非対応"
                : "Tanpa suara"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.optionsCol}>
        {directionalQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === directionalQuestion.correctAnswer;
          const showResult = selectedAnswer !== null;

          return (
            <Pressable
              key={`${option}-${index}`}
              style={[
                styles.optionBtn,
                showResult && isCorrect && styles.optionCorrect,
                showResult && isSelected && !isCorrect && styles.optionWrong,
              ]}
              onPress={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== null}
              testID={`button-answer-${index}`}
            >
              <Text style={styles.optionTxt} numberOfLines={4}>
                {option}
              </Text>
              {showResult && isCorrect ? (
                <CheckCircle2 size={22} color={design.success} style={styles.optIcon} />
              ) : null}
              {showResult && isSelected && !isCorrect ? (
                <XCircle size={22} color={design.destructive} style={styles.optIcon} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.scoreRow}>
        <Trophy size={20} color={design.accent} />
        <Text style={styles.scoreTxt} testID="text-current-score">
          {learnerMode === "ja" ? "スコア" : "Skor"}: {score}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 24 },
  toast: { textAlign: "center", fontWeight: "700", color: design.primary },
  menuHeader: { alignItems: "center", gap: 8 },
  menuTitle: { fontSize: 24, fontWeight: "700", color: design.foreground },
  menuSub: { fontSize: 14, color: design.mutedForeground },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    padding: 20,
  },
  modeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "hsla(12, 100%, 60%, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconBgAccent: { backgroundColor: "hsla(42, 100%, 65%, 0.2)" },
  modeTextCol: { flex: 1, gap: 6 },
  modeCardTitle: { fontSize: 18, fontWeight: "700", color: design.foreground },
  modeCardDesc: { fontSize: 14, color: design.mutedForeground, lineHeight: 20 },
  volRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  volHint: { fontSize: 11, color: design.mutedForeground },
  centerBox: { flex: 1, minHeight: 200, alignItems: "center", justifyContent: "center" },
  muted: { color: design.mutedForeground },
  quizTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quizTopLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  backGhost: { padding: 8 },
  backArrow: { fontSize: 20, color: design.foreground },
  quizTitle: { fontSize: 20, fontWeight: "700", color: design.foreground },
  badgeCount: {
    backgroundColor: "hsl(220, 15%, 92%)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeCountTxt: { fontSize: 12, fontWeight: "600", color: design.foreground },
  promptCard: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: "hsla(12, 100%, 60%, 0.08)",
    borderWidth: 1,
    borderColor: design.cardBorder,
    gap: 16,
  },
  promptLabel: { fontSize: 14, color: design.mutedForeground, marginBottom: 4 },
  promptBox: { alignItems: "center" },
  qPlainLg: { fontSize: 28, fontWeight: "700", color: design.foreground, textAlign: "center" },
  qPlainMd: { fontSize: 22, fontWeight: "700", color: design.foreground, textAlign: "center", lineHeight: 30 },
  pronounceBig: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: design.accent,
  },
  pronounceBigTxt: { fontSize: 17, fontWeight: "800", color: design.foreground },
  optionsCol: { gap: 12 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  optionCorrect: {
    backgroundColor: "hsla(142, 76%, 36%, 0.12)",
    borderColor: design.success,
  },
  optionWrong: {
    backgroundColor: "hsla(0, 72%, 51%, 0.1)",
    borderColor: design.destructive,
  },
  optionTxt: { flex: 1, fontSize: 17, fontWeight: "600", color: design.foreground },
  optIcon: { marginLeft: 8 },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  scoreTxt: { fontWeight: "700", color: design.foreground },
});
