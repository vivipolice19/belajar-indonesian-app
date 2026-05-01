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
import { apiErrorMessage, apiRequest } from "../lib/apiRequest";
import { difficultyLabel, situationDisplay } from "../lib/bilingualLabels";
import type { RootStackParamList } from "../navigation/types";
import { design } from "../theme/designTokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface AISentence {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  context?: string;
}

const SITUATIONS = [
  "日常会話", "自己紹介", "挨拶", "飲食", "買い物", "質問",
  "旅行", "ホテル", "空港", "交通機関", "病院", "銀行",
  "郵便局", "レストラン", "カフェ", "ビジネス", "電話", "約束",
];

const DIFFICULTY_VALUES = [1, 3, 5, 7, 9] as const;

export function AISentencesScreen() {
  const navigation = useNavigation<Nav>();
  const { mode: learnerMode } = useApp();
  const [sentences, setSentences] = useState<AISentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [situation, setSituation] = useState("日常会話");
  const [difficulty, setDifficulty] = useState(3);
  const [showSettings, setShowSettings] = useState(true);
  const [pending, setPending] = useState(false);
  const [picker, setPicker] = useState<null | "situation" | "difficulty">(null);

  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useAppSpeech();
  const currentSentence = sentences[currentIndex];
  const jpReading = useJapaneseReading(
    currentSentence?.japanese || "",
    learnerMode === "id" && !!currentSentence,
  );

  const handleGenerate = async () => {
    setPending(true);
    try {
      const res = await apiRequest(
        "POST",
        "/api/generate/sentences",
        { situation, difficulty, count: 10, learnerMode },
        { retries: 3, retryDelayMs: 1100 },
      );
      const data = (await res.json()) as {
        sentences?: AISentence[];
        fallback?: boolean;
        warningJa?: string;
        warningId?: string;
      };
      const list = Array.isArray(data.sentences) ? data.sentences : [];
      if (list.length === 0) {
        Alert.alert(
          learnerMode === "ja" ? "生成できません" : "Gagal membuat",
          learnerMode === "ja"
            ? "文章が0件でした。ネット接続・APIのURL・サーバーのGEMINI_API_KEYを確認してください。"
            : "Tidak ada kalimat. Periksa jaringan, URL API, dan GEMINI_API_KEY di server.",
        );
        setShowSettings(true);
        return;
      }
      setSentences(list);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowSettings(false);
      const isFallback = Boolean(data?.fallback);
      const serverWarn =
        learnerMode === "ja"
          ? (typeof data.warningJa === "string" ? data.warningJa.trim() : "")
          : (typeof data.warningId === "string" ? data.warningId.trim() : "");
      if (isFallback) {
        const base =
          learnerMode === "ja"
            ? `学習データから${list.length}文を表示しています（AI生成ではありません）。`
            : `Menampilkan ${list.length} kalimat dari data latihan (bukan AI).`;
        Alert.alert(
          learnerMode === "ja" ? "AI生成に失敗しました" : "Gagal memakai AI",
          [serverWarn || null, base].filter(Boolean).join("\n\n"),
        );
      } else {
        Alert.alert(
          "",
          learnerMode === "ja"
            ? `${list.length}個の新しい文章を生成しました！`
            : `${list.length} kalimat baru dibuat.`,
        );
      }
    } catch (e) {
      Alert.alert(learnerMode === "ja" ? "エラー" : "Kesalahan", apiErrorMessage(e, learnerMode));
    } finally {
      setPending(false);
    }
  };

  const handleSpeak = () => {
    if (!currentSentence) return;
    if (!isSpeechSupported) {
      Alert.alert(
        "",
        learnerMode === "ja"
          ? "お使いのブラウザは音声機能に対応していません"
          : "Browser Anda tidak mendukung suara.",
      );
      return;
    }
    if (learnerMode === "ja") speakIndonesian(currentSentence.indonesian);
    else {
      const k = jpReading.kana?.trim();
      speakJapanese(k && !jpReading.loading ? k : currentSentence.japanese);
    }
  };

  if (showSettings || sentences.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.setupScroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.navigate("Home")} testID="button-back">
          <Text style={styles.backTxt}>
            {learnerMode === "ja" ? "メニューへ戻る" : "Kembali ke menu"}
          </Text>
        </Pressable>

        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>
            {learnerMode === "ja" ? "文章（AI生成）" : "Kalimat (AI)"}
          </Text>
          <Text style={styles.setupSub}>
            {learnerMode === "ja"
              ? "シチュエーションと難易度を選んで、新しい文を生成します。"
              : "Pilih situasi & tingkat, lalu buat kalimat baru."}
          </Text>

          <Pressable
            style={styles.basicLink}
            onPress={() => navigation.navigate("BasicSentences")}
            testID="link-basic-sentences"
          >
            <Text style={styles.basicLinkTxt}>
              {learnerMode === "ja"
                ? "学習データの固定文章だけを練習 →"
                : "Kalimat tetap dari data latihan →"}
            </Text>
          </Pressable>

          <Text style={styles.fieldLabel}>{learnerMode === "ja" ? "シチュエーション" : "Situasi"}</Text>
          <Pressable style={styles.selectTrigger} onPress={() => setPicker("situation")} testID="select-situation">
            <Text>{situationDisplay(situation, learnerMode)}</Text>
          </Pressable>

          <Text style={styles.fieldLabel}>{learnerMode === "ja" ? "難易度" : "Tingkat kesulitan"}</Text>
          <Pressable style={styles.selectTrigger} onPress={() => setPicker("difficulty")} testID="select-difficulty">
            <Text>{difficultyLabel(difficulty, learnerMode)}</Text>
          </Pressable>

          <Pressable style={[styles.genBtn, pending && styles.genBtnDisabled]} onPress={handleGenerate} disabled={pending} testID="button-generate">
            {pending ? (
              <View style={styles.genRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.genTxt}>{learnerMode === "ja" ? "生成中..." : "Membuat..."}</Text>
              </View>
            ) : (
              <View style={styles.genRow}>
                <RefreshCw size={18} color="#fff" />
                <Text style={styles.genTxt}>{learnerMode === "ja" ? "文章を生成" : "Buat kalimat"}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Modal visible={picker !== null} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setPicker(null)}>
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <ScrollView>
                {picker === "situation"
                  ? SITUATIONS.map((s) => (
                      <Pressable
                        key={s}
                        style={styles.modalItem}
                        onPress={() => {
                          setSituation(s);
                          setPicker(null);
                        }}
                      >
                        <Text>{situationDisplay(s, learnerMode)}</Text>
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
    <View style={styles.page} testID="page-ai-sentences">
      <View style={styles.header}>
        <Text style={styles.title}>{learnerMode === "ja" ? "文章" : "Kalimat"}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgeOutline} testID="badge-category">
            <Text style={styles.badgeOutlineTxt}>{currentSentence.category}</Text>
          </View>
          <View style={styles.badgeSec}>
            <Text style={styles.badgeSecTxt}>
              {learnerMode === "ja" ? "難易度" : "Kesulitan"} {currentSentence.difficulty}/10
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {learnerMode === "ja"
            ? `${currentIndex + 1} / ${sentences.length}（⚙でシチュ変更・再生成）`
            : `${currentIndex + 1} / ${sentences.length} • ⚙ ubah situasi / buat lagi`}
        </Text>
      </View>

      <Pressable onPress={() => setIsFlipped(!isFlipped)} style={styles.card} testID="card-sentence">
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
              <View testID="text-japanese-sentence" style={styles.wFull}>
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
              {learnerMode === "ja" ? "日本語訳" : "Bahasa Indonesia"}
            </Text>
            {learnerMode === "ja" ? (
              <Text style={styles.textJpPrimary} testID="text-japanese-sentence">
                {currentSentence.japanese}
              </Text>
            ) : (
              <Text style={styles.textJpPrimary} testID="text-indonesian-sentence">
                {currentSentence.indonesian}
              </Text>
            )}
            <View style={styles.secondaryBlock}>
              {learnerMode === "ja" ? (
                <Text style={styles.textMutedBase}>{currentSentence.indonesian}</Text>
              ) : (
                <View style={styles.idBack}>
                  {jpReading.romaji ? <Text style={styles.romajiSm}>{jpReading.romaji}</Text> : null}
                  <Text style={styles.kanaLine}>
                    {jpReading.kana}（{jpReading.original}）
                  </Text>
                </View>
              )}
              {currentSentence.context ? (
                <Text style={styles.ctx}>
                  {learnerMode === "ja" ? "使用場面: " : "Konteks: "}
                  {currentSentence.context}
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
            if (currentIndex < sentences.length - 1) {
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

      <Pressable style={[styles.regenBtn, pending && styles.genBtnDisabled]} onPress={handleGenerate} disabled={pending} testID="button-regenerate">
        {pending ? (
          <ActivityIndicator color={design.foreground} />
        ) : (
          <View style={styles.genRow}>
            <RefreshCw size={18} color={design.foreground} />
            <Text style={styles.regenTxt}>
              {learnerMode === "ja" ? "新しい文章セットを生成" : "Buat set kalimat baru"}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  setupScroll: { paddingBottom: 32, gap: 16 },
  backTxt: { color: design.primary, fontWeight: "600", paddingVertical: 8 },
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
  basicLink: {
    alignSelf: "stretch",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: design.primary,
    backgroundColor: "hsla(12, 100%, 60%, 0.1)",
  },
  basicLinkTxt: { color: design.primary, fontWeight: "700", fontSize: 14, textAlign: "center" },
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
  wFull: { width: "100%", alignItems: "center" },
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
  secondaryBlock: { alignItems: "center", gap: 8, width: "100%" },
  idBack: { alignItems: "center", gap: 4 },
  romajiSm: { fontSize: 14, fontWeight: "600", color: design.mutedForeground },
  kanaLine: { fontSize: 16, color: design.mutedForeground, textAlign: "center", lineHeight: 24 },
  ctx: { fontSize: 12, color: design.mutedForeground, textAlign: "center", marginTop: 4 },
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
