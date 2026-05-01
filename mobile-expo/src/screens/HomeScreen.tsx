import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  BookOpen,
  Brain,
  Gamepad2,
  Languages,
  MessageSquare,
  TrendingUp,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { MascotIcon } from "../components/MascotIcon";
import type { RootStackParamList } from "../navigation/types";
import { design } from "../theme/designTokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MainCard = {
  titleJa: string;
  titleId: string;
  descriptionJa: string;
  descriptionId: string;
  target: keyof RootStackParamList;
  Icon: LucideIcon;
  tint: string;
  iconColor: string;
};

const mainCards: MainCard[] = [
  {
    titleJa: "単語",
    titleId: "Kosakata",
    descriptionJa: "基本150語のマスターと、テーマ別のAI生成",
    descriptionId: "150 kosakata dasar + AI menurut tema",
    target: "WordCards",
    Icon: BookOpen,
    tint: "rgba(14, 165, 233, 0.12)",
    iconColor: design.chart3,
  },
  {
    titleJa: "文章",
    titleId: "Kalimat",
    descriptionJa: "学習データの文章と、シチュエーション別のAI生成",
    descriptionId: "Kalimat latihan + AI menurut situasi",
    target: "Sentences",
    Icon: MessageSquare,
    tint: "rgba(59, 130, 246, 0.12)",
    iconColor: design.blue600,
  },
  {
    titleJa: "高度な翻訳",
    titleId: "Terjemahan lanjutan",
    descriptionJa: "文法解説・用例付きの翻訳",
    descriptionId: "Terjemahan dengan tata bahasa & contoh",
    target: "AdvancedTranslate",
    Icon: Languages,
    tint: "rgba(34, 197, 94, 0.12)",
    iconColor: design.green600,
  },
  {
    titleJa: "クイズ",
    titleId: "Kuis",
    descriptionJa: "4択で理解度チェック",
    descriptionId: "Kuis pilihan ganda",
    target: "Quiz",
    Icon: Brain,
    tint: "rgba(168, 85, 247, 0.12)",
    iconColor: design.chart2,
  },
  {
    titleJa: "学習ゲーム",
    titleId: "Game belajar",
    descriptionJa: "タイピング・マッチング",
    descriptionId: "Mengetik & mencocokkan",
    target: "MiniGame",
    Icon: Gamepad2,
    tint: "rgba(234, 179, 8, 0.14)",
    iconColor: design.chart4,
  },
  {
    titleJa: "進捗",
    titleId: "Progres",
    descriptionJa: "学習記録・履歴の確認",
    descriptionId: "Lihat catatan dan riwayat belajar",
    target: "Progress",
    Icon: TrendingUp,
    tint: "rgba(16, 185, 129, 0.12)",
    iconColor: design.green600,
  },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { mode } = useApp();

  return (
    <View style={styles.page} testID="page-home">
      <View style={styles.hero}>
        <MascotIcon size="lg" expression="happy" />
        <Text style={styles.welcome}>
          {mode === "ja" ? "Selamat datang!" : "Selamat datang! / ようこそ！"}
        </Text>
        <Text style={styles.lead}>
          {mode === "ja"
            ? "今日も一緒にインドネシア語を学びましょう！"
            : "今日は日本語を学びましょう！ / Ayo belajar bahasa Jepang hari ini!"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {mode === "ja" ? "メニュー" : "Menu"}
        </Text>
        {mainCards.map((card) => {
          const Icon = card.Icon;
          const title = mode === "ja" ? card.titleJa : card.titleId;
          const description = mode === "ja" ? card.descriptionJa : card.descriptionId;
          return (
            <Pressable
              key={card.target}
              onPress={() => navigation.navigate(card.target)}
              testID={`card-home-${card.target}`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <View style={[styles.cardFrame, { backgroundColor: card.tint }]}>
                <View style={styles.cardRow}>
                  <View style={styles.iconTile}>
                    <Icon size={24} color={card.iconColor} strokeWidth={2.2} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardDesc}>{description}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 24,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  welcome: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: design.foreground,
    textAlign: "center",
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: design.mutedForeground,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: design.foreground,
    paddingHorizontal: 4,
  },
  cardFrame: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: design.cardBorder,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconTile: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: design.card,
  },
  cardTextCol: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: design.foreground,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: design.mutedForeground,
  },
  pressed: {
    opacity: 0.92,
  },
});
