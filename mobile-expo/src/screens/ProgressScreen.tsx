import { BookOpen, CheckCircle2, Download, MessageSquare, RotateCcw } from "lucide-react-native";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { API_BASE } from "../constants";
import { useApp } from "../context/AppContext";
import { design } from "../theme/designTokens";

export function ProgressScreen() {
  const { mode: learnerMode, progress, resetProgress } = useApp();

  const handleResetProgress = () => {
    Alert.alert(
      learnerMode === "ja" ? "進捗をリセットしますか？" : "Atur ulang kemajuan?",
      learnerMode === "ja"
        ? "この操作は取り消せません。すべての学習記録が削除されます。"
        : "Tindakan ini tidak bisa dibatalkan. Semua catatan akan dihapus.",
      [
        { text: learnerMode === "ja" ? "キャンセル" : "Batal", style: "cancel" },
        {
          text: learnerMode === "ja" ? "リセット" : "Atur ulang",
          style: "destructive",
          onPress: () => {
            resetProgress();
            Alert.alert(
              "",
              learnerMode === "ja"
                ? "すべての学習記録がリセットされました"
                : "Semua riwayat belajar telah dihapus.",
            );
          },
        },
      ],
    );
  };

  const stats = [
    {
      icon: BookOpen,
      labelJa: "学習した単語",
      labelId: "Kosakata yang dipelajari",
      value: progress.wordsLearned.length,
      testId: "stat-学習した単語",
    },
    {
      icon: MessageSquare,
      labelJa: "学習した文章",
      labelId: "Kalimat yang dipelajari",
      value: progress.sentencesLearned.length,
      testId: "stat-学習した文章",
    },
    {
      icon: CheckCircle2,
      labelJa: "クイズ完了数",
      labelId: "Kuis selesai",
      value: progress.quizzesCompleted,
      testId: "stat-クイズ完了数",
    },
  ];

  return (
    <View style={styles.page} testID="page-progress">
      <View style={styles.header}>
        <Text style={styles.title}>{learnerMode === "ja" ? "学習の進捗" : "Kemajuan belajar"}</Text>
        <Text style={styles.sub}>
          {learnerMode === "ja" ? "あなたの学習記録を確認しよう" : "Lihat catatan belajar Anda"}
        </Text>
      </View>

      {stats.map((stat) => {
        const Icon = stat.icon;
        const label = learnerMode === "ja" ? stat.labelJa : stat.labelId;
        return (
          <View key={stat.labelJa} style={styles.statCard} testID={stat.testId}>
            <View style={styles.statIconBg}>
              <Icon size={26} color={design.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          </View>
        );
      })}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{learnerMode === "ja" ? "学習履歴" : "Riwayat"}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>
            {learnerMode === "ja" ? "発音練習した単語" : "Kosakata latihan pengucapan"}
          </Text>
          <Text style={styles.bold} testID="text-words-pronounced">
            {progress.wordsPronounced.length}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>
            {learnerMode === "ja" ? "発音練習した文章" : "Kalimat latihan pengucapan"}
          </Text>
          <Text style={styles.bold} testID="text-sentences-pronounced">
            {progress.sentencesPronounced.length}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.outlineBtn}
        onPress={() => Linking.openURL(`${API_BASE.replace(/\/$/, "")}/api/download/project`)}
        testID="button-download-project"
      >
        <Download size={18} color={design.foreground} />
        <Text style={styles.outlineBtnTxt}>
          {learnerMode === "ja" ? "プロジェクトをZIPでダウンロード" : "Unduh proyek (ZIP)"}
        </Text>
      </Pressable>

      <Pressable style={styles.outlineBtn} onPress={handleResetProgress} testID="button-reset-progress">
        <RotateCcw size={18} color={design.foreground} />
        <Text style={styles.outlineBtnTxt}>
          {learnerMode === "ja" ? "進捗をリセット" : "Atur ulang kemajuan"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14 },
  header: { alignItems: "center", gap: 6, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700", color: design.foreground },
  sub: { fontSize: 14, color: design.mutedForeground, textAlign: "center" },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    padding: 16,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "hsla(12, 100%, 60%, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 26, fontWeight: "800", color: design.foreground },
  statLabel: { fontSize: 14, color: design.mutedForeground },
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    backgroundColor: design.card,
    padding: 16,
    gap: 12,
  },
  panelTitle: { fontSize: 17, fontWeight: "800", color: design.foreground, marginBottom: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muted: { color: design.mutedForeground },
  bold: { fontWeight: "800", fontSize: 16, color: design.foreground },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    paddingVertical: 14,
    backgroundColor: design.card,
  },
  outlineBtnTxt: { fontWeight: "700", color: design.foreground, fontSize: 15 },
});
