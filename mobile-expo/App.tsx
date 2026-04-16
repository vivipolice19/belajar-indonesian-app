import { StatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import { useMemo, useState } from "react";
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

type LearnerMode = "ja" | "id";
type Deck = "words" | "sentences";

type Word = { indonesian: string; japanese: string; category: string };
type Sentence = {
  indonesian: string;
  japanese: string;
  category: string;
  context?: string;
};

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "https://belajar-indonesian-app.onrender.com";

const STATIC_WORDS: Word[] = [
  { indonesian: "Halo", japanese: "こんにちは", category: "挨拶" },
  { indonesian: "Terima kasih", japanese: "ありがとう", category: "挨拶" },
  { indonesian: "Sampai jumpa", japanese: "また会いましょう", category: "挨拶" },
  { indonesian: "Makan", japanese: "食べる", category: "日常" },
  { indonesian: "Minum", japanese: "飲む", category: "日常" },
];

const STATIC_SENTENCES: Sentence[] = [
  { indonesian: "Apa kabar?", japanese: "元気ですか？", category: "挨拶" },
  { indonesian: "Saya suka kopi.", japanese: "私はコーヒーが好きです。", category: "日常" },
  { indonesian: "Di mana stasiun?", japanese: "駅はどこですか？", category: "旅行" },
  { indonesian: "Berapa harganya?", japanese: "いくらですか？", category: "買い物" },
  { indonesian: "Tolong bantu saya.", japanese: "手伝ってください。", category: "日常" },
];

export default function App() {
  const [mode, setMode] = useState<LearnerMode>("ja");
  const [deck, setDeck] = useState<Deck>("words");
  const [isFlipped, setIsFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [theme, setTheme] = useState("日常会話");
  const [difficulty, setDifficulty] = useState("3");
  const [loading, setLoading] = useState(false);
  const [aiWords, setAiWords] = useState<Word[]>([]);
  const [aiSentences, setAiSentences] = useState<Sentence[]>([]);
  const [error, setError] = useState("");

  const usingAI = (deck === "words" ? aiWords : aiSentences).length > 0;
  const items = useMemo(() => {
    if (deck === "words") return (aiWords.length ? aiWords : STATIC_WORDS) as (Word | Sentence)[];
    return (aiSentences.length ? aiSentences : STATIC_SENTENCES) as (Word | Sentence)[];
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

  const speakTarget = () => {
    if (!current) return;
    const text = mode === "ja" ? frontText : frontText;
    const language = mode === "ja" ? "id-ID" : "ja-JP";
    Speech.stop();
    Speech.speak(text || "", { language, rate: 0.95 });
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
      const path = deck === "words" ? "/api/generate/vocabulary" : "/api/generate/sentences";
      const body =
        deck === "words"
          ? { theme, difficulty: Number(difficulty), count: 8, learnerMode: mode }
          : { situation: theme, difficulty: Number(difficulty), count: 8, learnerMode: mode };
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.messageJa || json?.messageId || "AI generation failed");
      if (deck === "words") setAiWords(Array.isArray(json.words) ? json.words : []);
      else setAiSentences(Array.isArray(json.sentences) ? json.sentences : []);
    } catch (e: any) {
      setError(e?.message || "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Belajar Native (Expo)</Text>
        <Text style={styles.subtitle}>mode: {mode === "ja" ? "日本語話者→インドネシア語学習" : "インドネシア語話者→日本語学習"}</Text>

        <View style={styles.row}>
          <Chip active={mode === "ja"} onPress={() => setMode("ja")} label="ja mode" />
          <Chip active={mode === "id"} onPress={() => setMode("id")} label="id mode" />
          <Chip active={deck === "words"} onPress={() => { setDeck("words"); setIndex(0); setIsFlipped(false); }} label="Words" />
          <Chip active={deck === "sentences"} onPress={() => { setDeck("sentences"); setIndex(0); setIsFlipped(false); }} label="Sentences" />
        </View>

        <View style={styles.aiBox}>
          <TextInput value={theme} onChangeText={setTheme} style={styles.input} placeholder={deck === "words" ? "テーマ" : "シチュエーション"} />
          <TextInput value={difficulty} onChangeText={setDifficulty} style={styles.inputSmall} keyboardType="number-pad" placeholder="難易度1-9" />
          <Pressable style={styles.genButton} onPress={generateAI} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.genText}>AI生成</Text>}
          </Pressable>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.card} onPress={() => setIsFlipped((v) => !v)}>
          <Text style={styles.cardLabel}>{isFlipped ? "裏面" : "表面"}</Text>
          <Text style={styles.cardText}>{isFlipped ? backText : frontText}</Text>
          <Text style={styles.cardHint}>タップで反転</Text>
        </Pressable>

        <View style={styles.row}>
          <Chip active={false} onPress={prev} label="Prev" />
          <Chip active={false} onPress={speakTarget} label="Speak" />
          <Chip active={false} onPress={next} label="Next" />
        </View>

        <Text style={styles.meta}>
          {usingAI ? "AIセット表示中" : "ローカルサンプル表示中"} / {items.length} items
        </Text>
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
});
