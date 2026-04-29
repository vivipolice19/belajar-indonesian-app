import { Search, Square, Volume2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SENTENCES_DATA, WORDS_DATA } from "../../../shared/types";
import { JapaneseLearnerReading } from "../components/JapaneseLearnerReading";
import { useApp } from "../context/AppContext";
import { useJapaneseReading } from "../hooks/useJapaneseReading";
import { speakAppLine, stopAppTts } from "../lib/appTts";
import { design } from "../theme/designTokens";

type Rate = 0.8 | 0.95 | 1.1;

type ResultRow = {
  type: "word" | "sentence";
  id: number;
  indonesian: string;
  japanese: string;
  category?: string;
};

function JapaneseAssistLine({ text, enabled }: { text: string; enabled: boolean }) {
  const reading = useJapaneseReading(text, enabled);
  if (!enabled) return <Text style={styles.jpLine}>{text}</Text>;
  return <JapaneseLearnerReading reading={reading} size="small" />;
}

export function TranslateScreen() {
  const { mode: learnerMode } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [speechRate, setSpeechRate] = useState<Rate>(0.95);
  const numericRate = useMemo(() => Number(speechRate), [speechRate]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const wordMatches = WORDS_DATA.filter((w) => w.japanese.toLowerCase().includes(query)).map(
      (word) => ({
        type: "word" as const,
        id: word.id,
        indonesian: word.indonesian,
        japanese: word.japanese,
        category: word.category,
      }),
    );
    const sentenceMatches = SENTENCES_DATA.filter((s) =>
      s.japanese.toLowerCase().includes(query),
    ).map((sentence) => ({
      type: "sentence" as const,
      id: sentence.id,
      indonesian: sentence.indonesian,
      japanese: sentence.japanese,
      category: sentence.category,
    }));
    const all = [...wordMatches, ...sentenceMatches];
    setResults(all);
    if (all.length === 0) {
      Alert.alert("", "該当する結果が見つかりませんでした");
    }
  };

  const pronounceText = (text: string, lang: "id-ID" | "ja-JP") => {
    void speakAppLine(text, lang, numericRate);
  };

  const pronounceByPhrases = (text: string, lang: "id-ID" | "ja-JP") => {
    const parts = text
      .replace(/\s+/g, " ")
      .split(/(?<=[。！？.!?])\s+|[\n\r]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    void (async () => {
      for (const p of parts) {
        await speakAppLine(p, lang, numericRate);
      }
    })();
  };

  return (
    <View style={styles.page}>
      <Text style={styles.cardTitleCenter}>日本語→インドネシア語翻訳</Text>
      <Text style={styles.cardSubCenter}>
        日本語を入力すると、学習した単語・文章から検索します
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
          placeholder="日本語を入力してください（例：こんにちは、ありがとう）"
          onSubmitEditing={handleSearch}
          testID="input-search"
        />
        <Pressable style={styles.searchBtn} onPress={handleSearch} testID="button-search">
          <Search size={18} color="#fff" />
          <Text style={styles.searchBtnTxt}>検索</Text>
        </Pressable>
      </View>

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>読み上げ速度</Text>
        <Pressable
          style={[styles.rateChip, speechRate === 0.8 && styles.rateChipOn]}
          onPress={() => setSpeechRate(0.8)}
        >
          <Text style={styles.rateChipTxt}>ゆっくり</Text>
        </Pressable>
        <Pressable
          style={[styles.rateChip, speechRate === 0.95 && styles.rateChipOn]}
          onPress={() => setSpeechRate(0.95)}
          testID="select-speech-rate"
        >
          <Text style={styles.rateChipTxt}>ふつう</Text>
        </Pressable>
        <Pressable
          style={[styles.rateChip, speechRate === 1.1 && styles.rateChipOn]}
          onPress={() => setSpeechRate(1.1)}
        >
          <Text style={styles.rateChipTxt}>はやい</Text>
        </Pressable>
        <Pressable style={styles.stopBtn} onPress={() => void stopAppTts()} testID="button-speech-stop">
          <Square size={16} color={design.foreground} />
          <Text style={styles.stopTxt}>停止</Text>
        </Pressable>
      </View>

      {results.length > 0 ? (
        <Text style={styles.resultHead}>検索結果: {results.length}件</Text>
      ) : null}

      {results.map((result, index) => (
        <View key={`${result.type}-${result.id}-${index}`} style={styles.resultCard} testID={`result-${result.type}-${result.id}`}>
          <View style={styles.badgeRow}>
            <View style={result.type === "word" ? styles.badgePri : styles.badgeSec}>
              <Text style={styles.badgePriTxt}>{result.type === "word" ? "単語" : "文章"}</Text>
            </View>
            {result.category ? (
              <View style={styles.badgeOutline}>
                <Text style={styles.badgeOutlineTxt}>{result.category}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.smallLabel}>日本語</Text>
          <View testID={`text-japanese-${result.id}`}>
            <JapaneseAssistLine text={result.japanese} enabled={learnerMode === "id"} />
          </View>
          <Text style={styles.smallLabel}>インドネシア語</Text>
          <Text style={styles.idResult} testID={`text-indonesian-${result.id}`}>
            {result.indonesian}
          </Text>
          <View style={styles.resultActions}>
            {learnerMode === "id" ? (
              <View style={styles.speechRow}>
                <Text style={styles.speechRowLab}>日本語</Text>
                <View style={styles.speechRowBtns}>
                  <Pressable
                    style={styles.iconAct}
                    onPress={() => pronounceText(result.japanese, "ja-JP")}
                    accessibilityLabel="日本語で読み上げ"
                    testID={`button-pronounce-ja-${result.id}`}
                  >
                    <Volume2 size={20} color={design.mutedForeground} />
                  </Pressable>
                  <Pressable
                    style={styles.phraseBtn}
                    onPress={() => pronounceByPhrases(result.japanese, "ja-JP")}
                    testID={`button-pronounce-phrases-ja-${result.id}`}
                  >
                    <Text style={styles.phraseBtnTxt}>文ごと</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View style={styles.speechRow}>
              <Text style={styles.speechRowLab}>インドネシア語</Text>
              <View style={styles.speechRowBtns}>
                <Pressable
                  style={styles.iconAct}
                  onPress={() => pronounceText(result.indonesian, "id-ID")}
                  testID={`button-pronounce-${result.id}`}
                >
                  <Volume2 size={20} color={design.primary} />
                </Pressable>
                <Pressable
                  style={styles.phraseBtn}
                  onPress={() => pronounceByPhrases(result.indonesian, "id-ID")}
                  testID={`button-pronounce-phrases-${result.id}`}
                >
                  <Text style={styles.phraseBtnTxt}>文ごと</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ))}

      {searchQuery.trim() && results.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTxt}>「{searchQuery}」に該当する単語・文章が見つかりませんでした</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  cardTitleCenter: { fontSize: 22, fontWeight: "800", color: design.foreground, textAlign: "center" },
  cardSubCenter: { fontSize: 14, color: design.mutedForeground, textAlign: "center", lineHeight: 20 },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: design.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: design.card,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: design.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchBtnTxt: { color: "#fff", fontWeight: "800" },
  rateRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  rateLabel: { fontSize: 13, color: design.mutedForeground },
  rateChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
  },
  rateChipOn: { borderColor: design.primary, backgroundColor: "hsla(12,100%,60%,0.12)" },
  rateChipTxt: { fontSize: 12, fontWeight: "700", color: design.foreground },
  stopBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: "auto" },
  stopTxt: { fontSize: 13, fontWeight: "600", color: design.foreground },
  resultHead: { fontWeight: "800", fontSize: 16, color: design.foreground },
  resultCard: {
    borderWidth: 1,
    borderColor: design.cardBorder,
    borderRadius: 12,
    padding: 16,
    backgroundColor: design.card,
    gap: 8,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgePri: { backgroundColor: design.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSec: { backgroundColor: "hsl(220, 15%, 35%)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePriTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  badgeOutline: {
    borderWidth: 1,
    borderColor: design.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeOutlineTxt: { fontSize: 12, color: design.foreground },
  smallLabel: { fontSize: 11, color: design.mutedForeground },
  jpLine: { fontSize: 16, color: design.foreground },
  idResult: { fontSize: 18, fontWeight: "800", color: design.primary },
  resultActions: { flexDirection: "column", gap: 10, marginTop: 4 },
  speechRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  speechRowLab: { fontSize: 12, fontWeight: "700", color: design.mutedForeground, minWidth: 96 },
  speechRowBtns: { flexDirection: "row", gap: 10, alignItems: "center", flex: 1 },
  iconAct: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: design.cardBorder },
  phraseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: design.cardBorder,
  },
  phraseBtnTxt: { fontWeight: "700", color: design.foreground },
  emptyCard: { padding: 24, alignItems: "center" },
  emptyTxt: { color: design.mutedForeground, textAlign: "center" },
});
