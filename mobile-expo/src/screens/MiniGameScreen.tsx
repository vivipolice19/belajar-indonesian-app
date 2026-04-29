import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { WORDS_DATA } from "../../../shared/types";
import { Chip } from "../components/Chip";
import { useApp } from "../context/AppContext";
import { colors } from "../theme";

type GameType = null | "typing" | "matching";
type MatchCard = { id: number; text: string; type: "indonesian" | "japanese"; matched: boolean };

export function MiniGameScreen() {
  const { mode } = useApp();
  const [gameType, setGameType] = useState<GameType>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [typingWords, setTypingWords] = useState<typeof WORDS_DATA>([]);
  const [showAnswer, setShowAnswer] = useState(false);

  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      handleGameEnd();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, timeLeft]);

  const handleGameEnd = () => {
    setIsPlaying(false);
    setGameComplete(true);
  };

  const handleStartTyping = () => {
    const shuffled = [...WORDS_DATA].sort(() => Math.random() - 0.5);
    setTypingWords(shuffled);
    setCurrentWordIndex(0);
    setInputValue("");
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setGameComplete(false);
    setGameType("typing");
    setShowAnswer(false);
  };

  const handleStartMatching = () => {
    const selectedWords = [...WORDS_DATA].sort(() => Math.random() - 0.5).slice(0, 6);
    const cards: MatchCard[] = [];
    selectedWords.forEach((word, index) => {
      cards.push({ id: index * 2, text: word.indonesian, type: "indonesian", matched: false });
      cards.push({ id: index * 2 + 1, text: word.japanese, type: "japanese", matched: false });
    });
    setMatchCards(cards.sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setMatchedPairs(0);
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setGameComplete(false);
    setGameType("matching");
  };

  const handleTypingChange = (value: string) => {
    setInputValue(value);
    const currentWord = typingWords[currentWordIndex];
    if (!currentWord) return;
    const ok =
      mode === "ja"
        ? value.toLowerCase() === currentWord.indonesian.toLowerCase()
        : value.trim() === currentWord.japanese.trim();
    if (ok) {
      setScore((s) => s + 1);
      if (currentWordIndex < typingWords.length - 1) {
        setCurrentWordIndex((i) => i + 1);
        setInputValue("");
        setShowAnswer(false);
      } else {
        handleGameEnd();
      }
    }
  };

  const handleCardPress = (cardId: number) => {
    if (!isPlaying || selectedCards.length >= 2) return;
    const card = matchCards.find((c) => c.id === cardId);
    if (!card || card.matched || selectedCards.includes(cardId)) return;
    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);
    if (newSelected.length === 2) {
      const [a, b] = newSelected.map((id) => matchCards.find((c) => c.id === id)!);
      const firstWord = WORDS_DATA.find((w) => w.indonesian === a.text || w.japanese === a.text);
      const secondWord = WORDS_DATA.find((w) => w.indonesian === b.text || w.japanese === b.text);
      if (firstWord && firstWord === secondWord && a.type !== b.type) {
        setTimeout(() => {
          setMatchCards((prev) =>
            prev.map((c) =>
              c.id === a.id || c.id === b.id ? { ...c, matched: true } : c,
            ),
          );
          setScore((s) => s + 1);
          setMatchedPairs((m) => {
            const next = m + 1;
            if (next >= 6) setTimeout(() => handleGameEnd(), 450);
            return next;
          });
          setSelectedCards([]);
        }, 400);
      } else {
        setTimeout(() => setSelectedCards([]), 700);
      }
    }
  };

  const backMenu = () => {
    setGameType(null);
    setIsPlaying(false);
    setGameComplete(false);
    setScore(0);
    setShowAnswer(false);
    setInputValue("");
  };

  const currentTyping = typingWords[currentWordIndex];

  if (gameComplete) {
    return (
      <View style={styles.centerPad}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.h1}>
          {gameType === "typing"
            ? mode === "ja"
              ? "タイピング完了！"
              : "Selesai mengetik!"
            : mode === "ja"
              ? "ゲーム終了！"
              : "Permainan selesai!"}
        </Text>
        <Text style={styles.scoreBig}>{score}</Text>
        <Chip active={false} onPress={backMenu} label={mode === "ja" ? "メニューへ" : "Menu"} />
        <Chip
          active={false}
          onPress={gameType === "typing" ? handleStartTyping : handleStartMatching}
          label={mode === "ja" ? "もう一度" : "Lagi"}
        />
      </View>
    );
  }

  if (!gameType) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.h2}>{mode === "ja" ? "学習ゲーム" : "Permainan belajar"}</Text>
        <Text style={styles.sub}>
          {mode === "ja"
            ? "タイピングまたはマッチングを選びましょう"
            : "Pilih mengetik atau mencocokkan"}
        </Text>
        <Pressable style={styles.menuBtn} onPress={handleStartTyping}>
          <Text style={styles.menuBtnTitle}>{mode === "ja" ? "タイピング" : "Mengetik"}</Text>
          <Text style={styles.menuBtnSub}>
            {mode === "ja" ? "インドネシア語を入力" : "Ketik teks yang benar"}
          </Text>
        </Pressable>
        <Pressable style={styles.menuBtn} onPress={handleStartMatching}>
          <Text style={styles.menuBtnTitle}>{mode === "ja" ? "マッチング" : "Mencocokkan"}</Text>
          <Text style={styles.menuBtnSub}>
            {mode === "ja" ? "語と訳を合わせる" : "Pasangkan pasangan"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (gameType === "typing" && currentTyping) {
    const prompt =
      mode === "ja" ? currentTyping.japanese : currentTyping.indonesian;
    const answerSide = mode === "ja" ? currentTyping.indonesian : currentTyping.japanese;
    const promptLabel =
      mode === "ja" ? "日本語の意味" : "Bahasa Indonesia";

    return (
      <View style={styles.wrap}>
        <View style={styles.timerRow}>
          <Text style={styles.timer}>
            {mode === "ja" ? "残り" : "Sisa"}: {timeLeft}s
          </Text>
          <Text style={styles.timer}>
            {mode === "ja" ? "スコア" : "Skor"}: {score}
          </Text>
        </View>
        <Text style={styles.promptLabel}>{promptLabel}</Text>
        <Text style={styles.prompt}>{prompt}</Text>
        {showAnswer ? <Text style={styles.answerHint}>{answerSide}</Text> : null}
        <Text style={styles.typeHint}>
          {mode === "ja"
            ? "インドネシア語を入力してください"
            : "Ketik kosakata bahasa Jepang yang benar"}
        </Text>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleTypingChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.row}>
          <Chip active={false} onPress={() => setShowAnswer((v) => !v)} label="Hint" />
          <Chip
            active={false}
            onPress={() => {
              if (currentWordIndex < typingWords.length - 1) {
                setCurrentWordIndex((i) => i + 1);
                setInputValue("");
                setShowAnswer(false);
              }
            }}
            label="Skip"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.timerRow}>
        <Text style={styles.timer}>
          {mode === "ja" ? "残り" : "Sisa"}: {timeLeft}s
        </Text>
        <Text style={styles.timer}>
          {mode === "ja" ? "スコア" : "Skor"}: {score}
        </Text>
      </View>
      <View style={styles.grid}>
        {matchCards.map((c) => {
          const selected = selectedCards.includes(c.id);
          return (
            <Pressable
              key={c.id}
              style={[
                styles.matchCell,
                c.matched && styles.matchCellWon,
                selected && styles.matchCellSel,
              ]}
              onPress={() => handleCardPress(c.id)}
              disabled={c.matched}
            >
              <Text style={styles.matchTxt}>{c.text}</Text>
            </Pressable>
          );
        })}
      </View>
      <Chip active={false} onPress={backMenu} label={mode === "ja" ? "やめる" : "Keluar"} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  centerPad: { alignItems: "center", gap: 16, paddingVertical: 24 },
  h2: { fontSize: 22, fontWeight: "800", color: colors.text },
  sub: { color: colors.subtext, lineHeight: 20 },
  h1: { fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
  trophy: { fontSize: 56 },
  scoreBig: { fontSize: 40, fontWeight: "900", color: colors.primary },
  menuBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    backgroundColor: colors.card,
    gap: 6,
  },
  menuBtnTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  menuBtnSub: { color: colors.subtext },
  timerRow: { flexDirection: "row", justifyContent: "space-between" },
  timer: { fontWeight: "800", color: colors.text },
  promptLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  prompt: { fontSize: 22, fontWeight: "800", textAlign: "center", color: colors.text },
  typeHint: { textAlign: "center", fontSize: 13, color: colors.subtext },
  answerHint: { textAlign: "center", color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  matchCell: {
    width: "47%",
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 10,
    justifyContent: "center",
  },
  matchCellSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  matchCellWon: { opacity: 0.35 },
  matchTxt: { textAlign: "center", fontWeight: "700", color: colors.text },
});
