import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SENTENCES_DATA, WORDS_DATA } from "../shared/types";

type LearnerMode = "ja" | "id";
type Deck = "words" | "sentences";
type Screen = "home" | "study" | "quiz" | "progress";
type Word = { id?: number; indonesian: string; japanese: string; category?: string };
type Sentence = {
  id?: number;
  indonesian: string;
  japanese: string;
  category?: string;
  context?: string;
};
type Progress = {
  wordsLearned: number[];
  wordsPronounced: number[];
  sentencesLearned: number[];
  sentencesPronounced: number[];
  quizzesCompleted: number;
};
type QuizState = {
  prompt: string;
  options: string[];
  answer: string;
  speak: "id-ID" | "ja-JP";
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  "https://belajar-indonesian-app.onrender.com";
const PROGRESS_KEY = "belajar_expo_progress_v1";
const INITIAL_PROGRESS: Progress = {
  wordsLearned: [],
  wordsPronounced: [],
  sentencesLearned: [],
  sentencesPronounced: [],
  quizzesCompleted: 0,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<LearnerMode>("ja");
  const [deck, setDeck] = useState<Deck>("words");
  const [progress, setProgress] = useState<Progress>(INITIAL_PROGRESS);
  const [isFlipped, setIsFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [theme, setTheme] = useState("日常会話");
  const [difficulty, setDifficulty] = useState("3");
  const [loading, setLoading] = useState(false);
  const [aiWords, setAiWords] = useState<Word[]>([]);
  const [aiSentences, setAiSentences] = useState<Sentence[]>([]);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState("");

  useEffect(() => {
    void (async () => {
      const raw = await AsyncStorage.getItem(PROGRESS_KEY);
      if (raw) {
        try {
          setProgress(JSON.parse(raw) as Progress);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const items = useMemo(() => {
    if (deck === "words") {
      return (aiWords.length ? aiWords : (WORDS_DATA as unknown as Word[])) as (Word | Sentence)[];
    }
    return (aiSentences.length ? aiSentences : (SENTENCES_DATA as unknown as Sentence[])) as (Word | Sentence)[];
  }, [deck, aiWords, aiSentences]);

  const current = items[index % Math.max(items.length, 1)] as Word | Sentence | undefined;
  const frontText =
    deck === "words"
      ? mode === "ja"
        ? (current as Word | undefined)?.indonesian
        : (current as Word | undefined)?.japanese
      : mode === "ja"
        ? (current as Sentence | undefined)?.indonesian
        : (current as Sentence | undefined)?.japanese;
  const backText =
    deck === "words"
      ? mode === "ja"
        ? (current as Word | undefined)?.japanese
        : (current as Word | undefined)?.indonesian
      : mode === "ja"
        ? (current as Sentence | undefined)?.japanese
        : (current as Sentence | undefined)?.indonesian;

  const updateProgress = (next: Progress) => setProgress(next);
  const rememberLearned = () => {
    if (!current?.id) return;
    if (deck === "words" && !progress.wordsLearned.includes(current.id)) {
      updateProgress({ ...progress, wordsLearned: [...progress.wordsLearned, current.id] });
    }
    if (deck === "sentences" && !progress.sentencesLearned.includes(current.id)) {
      updateProgress({
        ...progress,
        sentencesLearned: [...progress.sentencesLearned, current.id],
      });
    }
  };

  const speakTarget = () => {
    if (!current) return;
    const text = frontText || "";
    const language = mode === "ja" ? "id-ID" : "ja-JP";
    Speech.stop();
    Speech.speak(text, { language, rate: 0.95 });
    if (current.id) {
      if (deck === "words" && !progress.wordsPronounced.includes(current.id)) {
        updateProgress({
          ...progress,
          wordsPronounced: [...progress.wordsPronounced, current.id],
        });
      }
      if (deck === "sentences" && !progress.sentencesPronounced.includes(current.id)) {
        updateProgress({
          ...progress,
          sentencesPronounced: [...progress.sentencesPronounced, current.id],
        });
      }
    }
  };

  const next = () => {
    setIndex((v) => (items.length ? (v + 1) % items.length : 0));
    setIsFlipped(false);
  };
  const prev = () => {
    setIndex((v) => (items.length ? (v - 1 + items.length) % items.length : 0));
    setIsFlipped(false);
  };

  const generateAI = async () => {
    setError("");
    setLoading(true);
    setIsFlipped(false);
    setIndex(0);
    try {
      const path =
        deck === "words" ? "/api/generate/vocabulary" : "/api/generate/sentences";
      const body =
        deck === "words"
          ? { theme, difficulty: Number(difficulty), count: 8, learnerMode: mode }
          : {
              situation: theme,
              difficulty: Number(difficulty),
              count: 8,
              learnerMode: mode,
            };
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.messageJa || json?.messageId || "AI generation failed");
      }
      if (deck === "words") setAiWords(Array.isArray(json.words) ? json.words : []);
      else setAiSentences(Array.isArray(json.sentences) ? json.sentences : []);
    } catch (e: any) {
      setError(e?.message || "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = () => {
    const pool = deck === "words" ? (WORDS_DATA as unknown as Word[]) : (SENTENCES_DATA as unknown as Sentence[]);
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const others = pool
      .filter((x) => x !== picked)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    if (mode === "ja") {
      setQuiz({
        prompt: picked.indonesian,
        options: [...others.map((o) => o.japanese), picked.japanese].sort(
          () => Math.random() - 0.5,
        ),
        answer: picked.japanese,
        speak: "id-ID",
      });
    } else {
      setQuiz({
        prompt: picked.japanese,
        options: [...others.map((o) => o.indonesian), picked.indonesian].sort(
          () => Math.random() - 0.5,
        ),
        answer: picked.indonesian,
        speak: "ja-JP",
      });
    }
    setQuizFeedback("");
  };

  useEffect(() => {
    if (screen === "quiz" && !quiz) generateQuiz();
  }, [screen, deck, mode]);

  const answerQuiz = (choice: string) => {
    if (!quiz) return;
    const correct = choice === quiz.answer;
    setQuizFeedback(correct ? "Correct!" : `Miss: ${quiz.answer}`);
    setQuizCount((v) => v + 1);
    if (correct) {
      setQuizScore((v) => v + 1);
    }
    updateProgress({ ...progress, quizzesCompleted: progress.quizzesCompleted + 1 });
    setTimeout(generateQuiz, 500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Belajar Expo Preview</Text>
        <Text style={styles.subtitle}>
          既存版を残したまま比較できる Expo 移行ベース
        </Text>

        <View style={styles.row}>
          <Chip active={screen === "home"} onPress={() => setScreen("home")} label="Home" />
          <Chip active={screen === "study"} onPress={() => setScreen("study")} label="Study" />
          <Chip active={screen === "quiz"} onPress={() => setScreen("quiz")} label="Quiz" />
          <Chip active={screen === "progress"} onPress={() => setScreen("progress")} label="Progress" />
        </View>

        <View style={styles.row}>
          <Chip active={mode === "ja"} onPress={() => setMode("ja")} label="ja mode" />
          <Chip active={mode === "id"} onPress={() => setMode("id")} label="id mode" />
          <Chip active={deck === "words"} onPress={() => { setDeck("words"); setIndex(0); }} label="Words" />
          <Chip active={deck === "sentences"} onPress={() => { setDeck("sentences"); setIndex(0); }} label="Sentences" />
        </View>

        {screen === "home" ? (
          <View style={styles.panel}>
            <Text style={styles.h2}>現在の状態</Text>
            <Text style={styles.meta}>mode: {mode === "ja" ? "日本語話者" : "インドネシア語話者"}</Text>
            <Text style={styles.meta}>deck: {deck}</Text>
            <Text style={styles.meta}>学習済み単語: {progress.wordsLearned.length}</Text>
            <Text style={styles.meta}>学習済み文章: {progress.sentencesLearned.length}</Text>
            <Text style={styles.meta}>クイズ回数: {progress.quizzesCompleted}</Text>
          </View>
        ) : null}

        {screen === "study" ? (
          <>
            <View style={styles.aiBox}>
              <TextInput
                value={theme}
                onChangeText={setTheme}
                style={styles.input}
                placeholder={deck === "words" ? "テーマ" : "シチュエーション"}
              />
              <TextInput
                value={difficulty}
                onChangeText={setDifficulty}
                style={styles.inputSmall}
                keyboardType="number-pad"
                placeholder="1-9"
              />
              <Pressable style={styles.genButton} onPress={generateAI} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.genText}>AI生成</Text>
                )}
              </Pressable>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={styles.card}
              onPress={() => {
                setIsFlipped((v) => !v);
                rememberLearned();
              }}
            >
              <Text style={styles.cardLabel}>{isFlipped ? "裏面" : "表面"}</Text>
              <Text style={styles.cardText}>{isFlipped ? backText : frontText}</Text>
              <Text style={styles.cardHint}>タップで反転</Text>
            </Pressable>

            <View style={styles.row}>
              <Chip active={false} onPress={prev} label="Prev" />
              <Chip active={false} onPress={speakTarget} label="Speak" />
              <Chip active={false} onPress={next} label="Next" />
            </View>

            <Text style={styles.meta}>items: {items.length}</Text>
          </>
        ) : null}

        {screen === "quiz" ? (
          <View style={styles.panel}>
            <Text style={styles.h2}>Quiz</Text>
            {quiz ? (
              <>
                <Text style={styles.quizPrompt}>{quiz.prompt}</Text>
                <View style={styles.quizOptions}>
                  {quiz.options.map((option) => (
                    <Pressable
                      key={option}
                      style={styles.option}
                      onPress={() => answerQuiz(option)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.row}>
                  <Chip
                    active={false}
                    onPress={() => {
                      Speech.stop();
                      Speech.speak(quiz.prompt, { language: quiz.speak, rate: 0.95 });
                    }}
                    label="Speak prompt"
                  />
                  <Chip active={false} onPress={generateQuiz} label="Skip" />
                </View>
              </>
            ) : null}
            <Text style={styles.meta}>score: {quizScore} / {quizCount}</Text>
            {!!quizFeedback && <Text style={styles.meta}>{quizFeedback}</Text>}
          </View>
        ) : null}

        {screen === "progress" ? (
          <View style={styles.panel}>
            <Text style={styles.h2}>Progress</Text>
            <Text style={styles.meta}>Words learned: {progress.wordsLearned.length}</Text>
            <Text style={styles.meta}>Words spoken: {progress.wordsPronounced.length}</Text>
            <Text style={styles.meta}>Sentences learned: {progress.sentencesLearned.length}</Text>
            <Text style={styles.meta}>Sentences spoken: {progress.sentencesPronounced.length}</Text>
            <Text style={styles.meta}>Quizzes completed: {progress.quizzesCompleted}</Text>
            <Pressable
              style={[styles.genButton, { alignSelf: "flex-start" }]}
              onPress={() => setProgress(INITIAL_PROGRESS)}
            >
              <Text style={styles.genText}>Reset</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 16, gap: 14 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  subtitle: { color: "#334155" },
  panel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  h2: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { color: "#0f172a", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  aiBox: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputSmall: {
    width: 92,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  genButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 76,
    alignItems: "center",
  },
  genText: { color: "#fff", fontWeight: "700" },
  error: { color: "#b91c1c", fontWeight: "600" },
  card: {
    minHeight: 220,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  cardLabel: { color: "#64748b", fontSize: 12 },
  cardText: { fontSize: 27, textAlign: "center", fontWeight: "700", color: "#0f172a" },
  cardHint: { color: "#64748b", fontSize: 12 },
  meta: { color: "#475569", textAlign: "center" },
  quizPrompt: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 8,
  },
  quizOptions: { gap: 10 },
  option: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  optionText: { color: "#1e3a8a", fontWeight: "600" },
});
