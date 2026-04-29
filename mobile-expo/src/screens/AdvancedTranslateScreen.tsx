import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ArrowLeft, ArrowLeftRight, Languages, Square, Volume2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { JapaneseLearnerReading } from "../components/JapaneseLearnerReading";
import { useApp } from "../context/AppContext";
import { useJapaneseReading } from "../hooks/useJapaneseReading";
import { useAppSpeech } from "../hooks/useAppSpeech";
import { advancedTranslateLocal } from "../lib/advancedTranslateLocal";
import { apiRequest } from "../lib/apiRequest";
import type { RootStackParamList } from "../navigation/types";
import type { TranslationResult } from "../types";
import { design } from "../theme/designTokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rate = "0.8" | "0.95" | "1.1";

function JapaneseAssistText({ text }: { text: string }) {
  const { mode: learnerMode } = useApp();
  const reading = useJapaneseReading(text, learnerMode === "id");
  if (learnerMode !== "id") return <Text style={styles.jpResult}>{text}</Text>;
  return <JapaneseLearnerReading reading={reading} size="small" />;
}

export function AdvancedTranslateScreen() {
  const navigation = useNavigation<Nav>();
  const { mode: learnerMode } = useApp();
  const [inputText, setInputText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<"japanese" | "indonesian">("japanese");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [speechRate, setSpeechRate] = useState<Rate>("0.95");
  const [pending, setPending] = useState(false);
  const [translateHint, setTranslateHint] = useState("");

  const { speak, cancel, speakByPhrases, isSupported: isSpeechSupported } = useAppSpeech();
  const numericRate = useMemo(() => Number(speechRate), [speechRate]);
  const t = learnerMode === "ja"
    ? {
        back: "メニューへ戻る",
        title: "AI高度翻訳",
        subtitle: "文法解説・用例・発音ガイド付きの高度な翻訳",
        langJa: "日本語",
        langId: "インドネシア語",
        placeholderJa: "日本語のテキストを入力してください...",
        placeholderId: "インドネシア語のテキストを入力してください...",
        speed: "読み上げ速度",
        slow: "ゆっくり",
        normal: "ふつう",
        fast: "はやい",
        stop: "停止",
        translate: "翻訳",
        translating: "翻訳中...",
        result: "翻訳結果",
        idLabel: "インドネシア語",
        jpLabel: "日本語",
      }
    : {
        back: "Kembali ke menu",
        title: "Terjemahan lanjutan AI",
        subtitle: "Terjemahan lengkap dengan tata bahasa, contoh, dan panduan pelafalan",
        langJa: "Bahasa Jepang",
        langId: "Bahasa Indonesia",
        placeholderJa: "Masukkan teks bahasa Jepang...",
        placeholderId: "Masukkan teks bahasa Indonesia...",
        speed: "Kecepatan suara",
        slow: "Lambat",
        normal: "Normal",
        fast: "Cepat",
        stop: "Hentikan",
        translate: "Terjemahkan",
        translating: "Menerjemahkan...",
        result: "Hasil terjemahan",
        idLabel: "Bahasa Indonesia",
        jpLabel: "Bahasa Jepang",
      };

  const norm = (s: string) => s.replace(/[。、「」！？!?,.\s]/g, "").toLowerCase().trim();

  const isAiResultUsable = (
    ai: TranslationResult,
    originalInput: string,
    source: "japanese" | "indonesian",
  ) => {
    if (!ai?.indonesian?.trim() || !ai?.japanese?.trim()) return false;
    if (source === "japanese") return norm(ai.japanese) === norm(originalInput);
    return norm(ai.indonesian) === norm(originalInput);
  };

  const fetchAiRefinement = async (
    text: string,
    source: "japanese" | "indonesian",
    mode: "ja" | "id",
  ): Promise<TranslationResult | null> => {
    const timeoutMs = 2800;
    const res = (await Promise.race([
      apiRequest(
        "POST",
        "/api/translate/advanced",
        { text, sourceLanguage: source, learnerMode: mode },
        { retries: 0, retryDelayMs: 250 },
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("ai_timeout")), timeoutMs),
      ),
    ])) as Response;

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    const ai = (await res.json()) as TranslationResult;
    return isAiResultUsable(ai, text, source) ? ai : null;
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      Alert.alert("", learnerMode === "ja" ? "テキストを入力してください" : "Masukkan teks terlebih dahulu.");
      return;
    }
    setPending(true);
    setTranslateHint("");
    try {
      const local = advancedTranslateLocal(inputText, sourceLanguage, learnerMode);
      setResult(local);
      setTranslateHint(
        learnerMode === "ja"
          ? "即時表示（ローカル）"
          : "Tampil cepat (lokal)",
      );

      try {
        const ai = await fetchAiRefinement(inputText, sourceLanguage, learnerMode);
        if (ai) {
          setResult(ai);
          setTranslateHint(
            learnerMode === "ja"
              ? "AIで精度更新済み"
              : "Disempurnakan AI",
          );
        } else {
          setTranslateHint(
            learnerMode === "ja"
              ? "ローカル結果を表示中（AI更新なし）"
              : "Menampilkan hasil lokal (tanpa pembaruan AI)",
          );
        }
      } catch {
        setTranslateHint(
          learnerMode === "ja"
            ? "ローカル結果を表示中（AI接続失敗）"
            : "Menampilkan hasil lokal (AI gagal tersambung)",
        );
      }
    } catch {
      Alert.alert(
        learnerMode === "ja" ? "エラー" : "Kesalahan",
        learnerMode === "ja"
          ? "ローカル翻訳に失敗しました。入力を変えて再試行してください。"
          : "Terjemahan lokal gagal. Coba ubah teks lalu ulangi.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleSwapLanguage = () => {
    setSourceLanguage(sourceLanguage === "japanese" ? "indonesian" : "japanese");
    setInputText("");
    setResult(null);
    cancel();
  };

  const pronounceText = (text: string, lang: "id-ID" | "ja-JP") => {
    if (!isSpeechSupported) {
      Alert.alert(
        "",
        learnerMode === "ja" ? "音声機能を利用できません" : "Fitur suara tidak tersedia.",
      );
      return;
    }
    speak(text, lang, numericRate);
  };

  const pronounceByPhrases = (text: string, lang: "id-ID" | "ja-JP") => {
    if (!isSpeechSupported) {
      Alert.alert(
        "",
        learnerMode === "ja" ? "音声機能を利用できません" : "Fitur suara tidak tersedia.",
      );
      return;
    }
    speakByPhrases(text, { lang, rate: numericRate });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => navigation.navigate("Home")} style={styles.backRow} testID="button-back">
        <ArrowLeft size={18} color={design.foreground} />
        <Text style={styles.backTxt}>{t.back}</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Languages size={22} color={design.foreground} />
          <Text style={styles.title}>{t.title}</Text>
        </View>
        <Text style={styles.subCenter}>{t.subtitle}</Text>
        {translateHint ? <Text style={styles.hintBar}>{translateHint}</Text> : null}

        <View style={styles.swapRow}>
          <View style={[styles.badge, sourceLanguage === "japanese" && styles.badgeOn]}>
            <Text style={[styles.badgeTxt, sourceLanguage === "japanese" && styles.badgeTxtOn]}>{t.langJa}</Text>
          </View>
          <Pressable onPress={handleSwapLanguage} style={styles.swapBtn} testID="button-swap">
            <ArrowLeftRight size={18} color={design.foreground} />
          </Pressable>
          <View style={[styles.badge, sourceLanguage === "indonesian" && styles.badgeOn]}>
            <Text style={[styles.badgeTxt, sourceLanguage === "indonesian" && styles.badgeTxtOn]}>
              {t.langId}
            </Text>
          </View>
        </View>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          style={styles.textarea}
          multiline
          placeholder={
            sourceLanguage === "japanese"
              ? t.placeholderJa
              : t.placeholderId
          }
          testID="input-translate"
        />

        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>{t.speed}</Text>
          <Pressable
            style={[styles.rateChip, speechRate === "0.8" && styles.rateChipOn]}
            onPress={() => setSpeechRate("0.8")}
          >
            <Text style={styles.rateChipTxt}>{t.slow}</Text>
          </Pressable>
          <Pressable
            style={[styles.rateChip, speechRate === "0.95" && styles.rateChipOn]}
            onPress={() => setSpeechRate("0.95")}
            testID="select-speech-rate"
          >
            <Text style={styles.rateChipTxt}>{t.normal}</Text>
          </Pressable>
          <Pressable
            style={[styles.rateChip, speechRate === "1.1" && styles.rateChipOn]}
            onPress={() => setSpeechRate("1.1")}
          >
            <Text style={styles.rateChipTxt}>{t.fast}</Text>
          </Pressable>
          <Pressable style={styles.stopBtn} onPress={cancel} testID="button-speech-stop">
            <Square size={16} color={design.foreground} />
            <Text style={styles.stopTxt}>{t.stop}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.translateBtn, pending && styles.disabled]}
          onPress={handleTranslate}
          disabled={pending || !inputText.trim()}
          testID="button-translate"
        >
          {pending ? (
            <View style={styles.rowCenter}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.translateBtnTxt}>{t.translating}</Text>
            </View>
          ) : (
            <View style={styles.rowCenter}>
              <Languages size={18} color="#fff" />
              <Text style={styles.translateBtnTxt}>{t.translate}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {result ? (
        <View style={styles.gapBlock}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.result}</Text>
            <View style={styles.block}>
              <View style={styles.labelRow}>
                <Text style={styles.smallLabel}>{t.idLabel}</Text>
                <View style={styles.miniActions}>
                  <Pressable onPress={() => pronounceText(result.indonesian, "id-ID")} testID="button-pronounce-indonesian">
                    <Volume2 size={18} color={design.primary} />
                  </Pressable>
                  <Pressable
                    style={styles.miniPhrase}
                    onPress={() => pronounceByPhrases(result.indonesian, "id-ID")}
                    testID="button-pronounce-indonesian-phrases"
                  >
                    <Text style={styles.miniPhraseTxt}>文ごと</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.idBig} testID="text-indonesian">
                {result.indonesian}
              </Text>
            </View>
            <View style={styles.block}>
              <View style={styles.labelRow}>
                <Text style={styles.smallLabel}>{t.jpLabel}</Text>
                <View style={styles.miniActions}>
                  <Pressable onPress={() => pronounceText(result.japanese, "ja-JP")} testID="button-pronounce-japanese">
                    <Volume2 size={18} color={design.primary} />
                  </Pressable>
                  <Pressable
                    style={styles.miniPhrase}
                    onPress={() => pronounceByPhrases(result.japanese, "ja-JP")}
                    testID="button-pronounce-japanese-phrases"
                  >
                    <Text style={styles.miniPhraseTxt}>文ごと</Text>
                  </Pressable>
                </View>
              </View>
              <View testID="text-japanese">
                <JapaneseAssistText text={result.japanese} />
              </View>
            </View>
            <View style={styles.formalityBadge} testID="badge-formality">
              <Text style={styles.formalityTxt}>{result.formality_level}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {learnerMode === "ja" ? "文法解説" : "Penjelasan tata bahasa"}
            </Text>
            <Text style={styles.bodyPre} testID="text-grammar">
              {result.grammar_explanation}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {learnerMode === "ja" ? "発音ガイド" : "Panduan pengucapan"}
            </Text>
            <Text style={styles.body} testID="text-pronunciation">
              {result.pronunciation_guide}
            </Text>
          </View>

          {result.usage_examples && result.usage_examples.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{learnerMode === "ja" ? "用例" : "Contoh"}</Text>
              {result.usage_examples.map((example, index) => (
                <View key={index} style={styles.example} testID={`example-${index}`}>
                  <View style={styles.exRow}>
                    <Text style={styles.exId}>{example.indonesian}</Text>
                    <View style={styles.miniActions}>
                      <Pressable
                        onPress={() => pronounceText(example.indonesian, "id-ID")}
                        testID={`button-pronounce-example-${index}`}
                      >
                        <Volume2 size={16} color={design.primary} />
                      </Pressable>
                      <Pressable
                        style={styles.miniPhrase}
                        onPress={() => pronounceByPhrases(example.indonesian, "id-ID")}
                        testID={`button-pronounce-example-phrases-${index}`}
                      >
                        <Text style={styles.miniPhraseTxt}>文ごと</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.exRow}>
                    <View style={styles.exJpWrap}>
                      <JapaneseAssistText text={example.japanese} />
                    </View>
                    <Pressable
                      onPress={() => pronounceText(example.japanese, "ja-JP")}
                      testID={`button-pronounce-example-japanese-${index}`}
                    >
                      <Volume2 size={16} color={design.primary} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32, gap: 16 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  backTxt: { fontSize: 15, fontWeight: "600", color: design.foreground },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    padding: 18,
    gap: 14,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "800", color: design.foreground },
  subCenter: { fontSize: 14, color: design.mutedForeground, textAlign: "center", lineHeight: 20 },
  hintBar: {
    alignSelf: "center",
    fontSize: 12,
    color: design.mutedForeground,
    backgroundColor: "hsl(220, 15%, 92%)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  swapRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: design.cardBorder,
  },
  badgeOn: { backgroundColor: design.primary, borderColor: design.primary },
  badgeTxt: { fontWeight: "700", color: design.foreground, fontSize: 13 },
  badgeTxtOn: { color: "#fff" },
  swapBtn: { padding: 8 },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: design.cardBorder,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 16,
    color: design.foreground,
    backgroundColor: design.background,
  },
  rateRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  rateLabel: { fontSize: 13, color: design.mutedForeground },
  rateChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: design.cardBorder,
  },
  rateChipOn: { borderColor: design.primary, backgroundColor: "hsla(12,100%,60%,0.12)" },
  rateChipTxt: { fontSize: 12, fontWeight: "700" },
  stopBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: "auto" },
  stopTxt: { fontSize: 13, fontWeight: "600" },
  translateBtn: {
    backgroundColor: design.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.55 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  translateBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  gapBlock: { gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: design.foreground },
  block: { gap: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallLabel: { fontSize: 13, color: design.mutedForeground },
  miniActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniPhrase: {
    borderWidth: 1,
    borderColor: design.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniPhraseTxt: { fontSize: 12, fontWeight: "700", color: design.foreground },
  idBig: { fontSize: 20, fontWeight: "700", color: design.foreground },
  jpResult: { fontSize: 18, fontWeight: "700", color: design.primary },
  formalityBadge: { alignSelf: "flex-start", backgroundColor: "hsl(220, 15%, 92%)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  formalityTxt: { fontSize: 12, fontWeight: "600", color: design.foreground },
  bodyPre: { fontSize: 14, color: design.foreground, lineHeight: 22 },
  body: { fontSize: 14, color: design.foreground, lineHeight: 22 },
  example: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: design.cardBorder, gap: 8 },
  exRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  exId: { flex: 1, fontSize: 14, fontWeight: "600", color: design.foreground },
  exJpWrap: { flex: 1 },
});
