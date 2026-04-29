import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronLeft, ChevronRight, RefreshCw, Settings, Volume2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { JapaneseLearnerReading } from "../components/JapaneseLearnerReading";
import { useApp } from "../context/AppContext";
import { useJapaneseReading } from "../hooks/useJapaneseReading";
import { useAppSpeech } from "../hooks/useAppSpeech";
import { generateLocalAiWords } from "../lib/aiLocalGenerator";
import { difficultyLabel, themeDisplay } from "../lib/bilingualLabels";
import type { RootStackParamList } from "../navigation/types";
import { design } from "../theme/designTokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface AIWord {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  pronunciation_guide?: string;
}

const THEMES = [
  "挨拶", "数字", "家族", "色", "動物", "体", "天気", "時間",
  "飲食", "場所", "動詞", "形容詞", "感情", "交通", "買い物",
  "旅行", "ビジネス", "学校", "趣味", "自然",
];

const DIFFICULTY_VALUES = [1, 3, 5, 7, 9] as const;

export function AICardsScreen() {
  const navigation = useNavigation<Nav>();
  const { mode: learnerMode } = useApp();
  const [words, setWords] = useState<AIWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [theme, setTheme] = useState("挨拶");
  const [difficulty, setDifficulty] = useState(3);
  const [showSettings, setShowSettings] = useState(true);
  const [pending, setPending] = useState(false);
  const [picker, setPicker] = useState<null | "theme" | "difficulty">(null);

  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useAppSpeech();
  const currentWord = words[currentIndex];
  const jpReading = useJapaneseReading(
    currentWord?.japanese || "",
    learnerMode === "id" && !!currentWord,
  );

  const handleGenerate = async () => {
    setPending(true);
    try {
      const list = generateLocalAiWords(theme, difficulty, learnerMode, 10);
      setWords(list);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowSettings(false);
      Alert.alert(
        "",
        learnerMode === "ja"
          ? `${list.length}個の新しい単語を生成しました！`
          : `${list.length} kosakata baru dibuat.`,
      );
    } catch {
      Alert.alert(
        learnerMode === "ja" ? "エラー" : "Kesalahan",
        learnerMode === "ja"
          ? "単語生成に失敗しました。"
          : "Gagal membuat kosakata.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleSpeak = () => {
    if (!currentWord) return;
    if (!isSpeechSupported) {
      Alert.alert(
        "",
        learnerMode === "ja"
          ? "お使いのブラウザは音声機能に対応していません"
          : "Browser Anda tidak mendukung suara.",
      );
      return;
    }
    if (learnerMode === "ja") speakIndonesian(currentWord.indonesian);
    else {
      const k = jpReading.kana?.trim();
      speakJapanese(k && !jpReading.loading ? k : currentWord.japanese);
    }
  };

  if (showSettings || words.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.setupScroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.navigate("Home")} style={styles.backRow} testID="button-back">
          <Text style={styles.backTxt}>
            {learnerMode === "ja" ? "メニューへ戻る" : "Kembali ke menu"}
          </Text>
        </Pressable>

        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>
            {learnerMode === "ja" ? "AI無限単語カード" : "Kartu kosakata AI (tanpa batas)"}
          </Text>
          <Text style={styles.setupSub}>
            {learnerMode === "ja"
              ? "AIが無限に新しい単語を生成します"
              : "AI membuat kosakata baru tanpa henti untuk latihan bahasa Jepang."}
          </Text>

          <Text style={styles.fieldLabel}>{learnerMode === "ja" ? "テーマ" : "Tema"}</Text>
          <Pressable style={styles.selectTrigger} onPress={() => setPicker("theme")} testID="select-theme">
            <Text>{themeDisplay(theme, learnerMode)}</Text>
          </Pressable>

          <Text style={styles.fieldLabel}>{learnerMode === "ja" ? "難易度" : "Tingkat kesulitan"}</Text>
          <Pressable style={styles.selectTrigger} onPress={() => setPicker("difficulty")} testID="select-difficulty">
            <Text>{difficultyLabel(difficulty, learnerMode)}</Text>
          </Pressable>

          <Pressable
            style={[styles.genBtn, pending && styles.genBtnDisabled]}
            onPress={handleGenerate}
            disabled={pending}
            testID="button-generate"
          >
            {pending ? (
              <View style={styles.genRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.genTxt}>{learnerMode === "ja" ? "生成中..." : "Membuat..."}</Text>
              </View>
            ) : (
              <View style={styles.genRow}>
                <RefreshCw size={18} color="#fff" />
                <Text style={styles.genTxt}>{learnerMode === "ja" ? "単語を生成" : "Buat kosakata"}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Modal visible={picker !== null} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setPicker(null)}>
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <ScrollView>
                {picker === "theme"
                  ? THEMES.map((t) => (
                      <Pressable
                        key={t}
                        style={styles.modalItem}
                        onPress={() => {
                          setTheme(t);
                          setPicker(null);
                        }}
                      >
                        <Text>{themeDisplay(t, learnerMode)}</Text>
                      </Pressable>
                    ))
                  : DIFFICULTY_VALUES.map((v) => (
                      <Pressable
                        key={v}
                        style={styles.modalItem}
                        onPress={() => {
                          setDifficulty(v);
                          setPicker(null);
                        }}
                      >
                        <Text>{difficultyLabel(v, learnerMode)}</Text>
                      </Pressable>
                    ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    );
  }

  return (
    <View style={styles.page} testID="page-ai-cards">
      <View style={styles.header}>
        <Text style={styles.title}>{learnerMode === "ja" ? "AI単語カード" : "Kartu kosakata AI"}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgeOutline} testID="badge-category">
            <Text style={styles.badgeOutlineTxt}>{currentWord.category}</Text>
          </View>
          <View style={styles.badgeSec}>
            <Text style={styles.badgeSecTxt}>
              {learnerMode === "ja" ? "難易度" : "Kesulitan"} {currentWord.difficulty}/10
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {learnerMode === "ja"
            ? `${currentIndex + 1} / ${words.length} （次の単語は自動生成）`
            : `${currentIndex + 1} / ${words.length} • set berikutnya otomatis`}
        </Text>
      </View>

      <Pressable onPress={() => setIsFlipped(!isFlipped)} style={styles.card} testID="card-flashcard">
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
                <View style={styles.idBack}>
                  {jpReading.romaji ? (
                    <Text style={styles.romajiSm}>{jpReading.romaji}</Text>
                  ) : null}
                  <Text style={styles.kanaLine}>
                    {jpReading.kana}（{jpReading.original}）
                  </Text>
                </View>
              )}
              {currentWord.pronunciation_guide ? (
                <Text style={styles.pron}>
                  {learnerMode === "ja" ? "発音: " : "Panduan bunyi: "}
                  {currentWord.pronunciation_guide}
                </Text>
              ) : null}
            </View>
            <Text style={styles.hintXs}>
              {learnerMode === "ja" ? "カードをタップして戻る" : "Ketuk kartu untuk kembali"}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.toolbar}>
        <Pressable
          style={[styles.iconBtn, currentIndex === 0 && styles.iconDisabled]}
          onPress={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1);
              setIsFlipped(false);
            }
          }}
          disabled={currentIndex === 0}
          testID="button-previous"
        >
          <ChevronLeft size={22} color={design.foreground} />
        </Pressable>
        <Pressable style={[styles.iconBtn, styles.iconBtnPrimary]} onPress={handleSpeak} testID="button-speak">
          <Volume2 size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => setShowSettings(true)} testID="button-settings">
          <Settings size={22} color={design.foreground} />
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            if (currentIndex < words.length - 1) {
              setCurrentIndex(currentIndex + 1);
              setIsFlipped(false);
            } else {
              void handleGenerate();
            }
          }}
          testID="button-next"
        >
          <ChevronRight size={22} color={design.foreground} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.regenBtn, pending && styles.genBtnDisabled]}
        onPress={handleGenerate}
        disabled={pending}
        testID="button-regenerate"
      >
        {pending ? (
          <ActivityIndicator color={design.foreground} />
        ) : (
          <View style={styles.genRow}>
            <RefreshCw size={18} color={design.foreground} />
            <Text style={styles.regenTxt}>
              {learnerMode === "ja" ? "新しい単語セットを生成" : "Buat set kosakata baru"}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  setupScroll: { paddingBottom: 32, gap: 16 },
  backRow: { alignSelf: "flex-start", paddingVertical: 8 },
  backTxt: { color: design.primary, fontWeight: "600" },
  setupCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    padding: 24,
    gap: 16,
  },
  setupTitle: { fontSize: 22, fontWeight: "700", color: design.foreground, textAlign: "center" },
  setupSub: { fontSize: 14, color: design.mutedForeground, textAlign: "center", lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: design.foreground },
  selectTrigger: {
    borderWidth: 1,
    borderColor: design.cardBorder,
    borderRadius: 10,
    padding: 14,
    backgroundColor: design.background,
  },
  genBtn: {
    backgroundColor: design.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  genBtnDisabled: { opacity: 0.6 },
  genRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  genTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    maxHeight: "70%",
    backgroundColor: design.card,
    borderRadius: 12,
    paddingVertical: 8,
  },
  modalItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: design.cardBorder },
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
  badgeSec: { backgroundColor: "hsl(220, 15%, 92%)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeSecTxt: { fontSize: 12, fontWeight: "600", color: design.foreground },
  meta: { fontSize: 12, color: design.mutedForeground, textAlign: "center" },
  card: {
    minHeight: 320,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    padding: 24,
    elevation: 2,
  },
  cardInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  labelSm: {
    fontSize: 13,
    fontWeight: "600",
    color: design.mutedForeground,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  textIdLg: { fontSize: 32, fontWeight: "700", color: design.foreground, textAlign: "center" },
  textJpPrimary: { fontSize: 28, fontWeight: "700", color: design.primary, textAlign: "center" },
  textMutedLg: { fontSize: 18, color: design.mutedForeground },
  secondaryBlock: { alignItems: "center", gap: 8 },
  idBack: { alignItems: "center", gap: 4 },
  romajiSm: { fontSize: 14, fontWeight: "600", color: design.mutedForeground, letterSpacing: 0.3 },
  kanaLine: { fontSize: 18, color: design.mutedForeground, textAlign: "center" },
  pron: { fontSize: 14, color: design.mutedForeground, textAlign: "center" },
  hint: { fontSize: 14, color: design.mutedForeground, textAlign: "center" },
  hintXs: { fontSize: 12, color: design.mutedForeground, textAlign: "center" },
  toolbar: { flexDirection: "row", justifyContent: "center", gap: 16 },
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
  iconDisabled: { opacity: 0.35 },
  regenBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "hsl(220, 15%, 92%)",
  },
  regenTxt: { fontWeight: "700", color: design.foreground },
});
