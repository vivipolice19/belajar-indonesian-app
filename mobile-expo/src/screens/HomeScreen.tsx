import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Brain,
  Gamepad2,
  Languages,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { MascotIcon } from "../components/MascotIcon";
import type { RootStackParamList } from "../navigation/types";
import { design } from "../theme/designTokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type WebPath =
  | "/ai-cards"
  | "/ai-sentences"
  | "/ai-translate"
  | "/cards"
  | "/quiz"
  | "/game";

function screenForPath(path: WebPath): keyof RootStackParamList {
  switch (path) {
    case "/ai-cards":
      return "AICards";
    case "/ai-sentences":
      return "AISentences";
    case "/ai-translate":
      return "AdvancedTranslate";
    case "/cards":
      return "WordCards";
    case "/quiz":
      return "Quiz";
    case "/game":
      return "MiniGame";
  }
}

type AiCardDef = {
  titleJa: string;
  titleId: string;
  descriptionJa: string;
  descriptionId: string;
  path: WebPath;
  Icon: LucideIcon;
  gradient: readonly [string, string];
  iconColor: string;
};

type ActionCardDef = {
  titleJa: string;
  titleId: string;
  descriptionJa: string;
  descriptionId: string;
  path: WebPath;
  Icon: LucideIcon;
  tint: string;
  iconColor: string;
};

const aiCards: AiCardDef[] = [
  {
    titleJa: "AI無限単語カード",
    titleId: "Kartu kosakata AI (tanpa batas)",
    descriptionJa: "AIが無限に新しい単語を生成",
    descriptionId: "AI membuat kosakata baru tanpa henti",
    Icon: Sparkles,
    path: "/ai-cards",
    gradient: ["rgba(168, 85, 247, 0.12)", "rgba(236, 72, 153, 0.12)"] as const,
    iconColor: design.purple600,
  },
  {
    titleJa: "AI無限文章学習",
    titleId: "Belajar kalimat AI (tanpa batas)",
    descriptionJa: "シチュエーション別に文章を自動生成",
    descriptionId: "AI membuat kalimat sesuai situasi",
    Icon: MessageSquare,
    path: "/ai-sentences",
    gradient: ["rgba(59, 130, 246, 0.12)", "rgba(6, 182, 212, 0.12)"] as const,
    iconColor: design.blue600,
  },
  {
    titleJa: "AI高度翻訳",
    titleId: "Terjemahan AI tingkat lanjut",
    descriptionJa: "文法解説・用例付きの本格翻訳",
    descriptionId: "Terjemahan dengan penjelasan tata bahasa & contoh",
    Icon: Languages,
    path: "/ai-translate",
    gradient: ["rgba(34, 197, 94, 0.12)", "rgba(16, 185, 129, 0.12)"] as const,
    iconColor: design.green600,
  },
];

const actionCards: ActionCardDef[] = [
  {
    titleJa: "単語カード練習",
    titleId: "Latihan kartu kosakata",
    descriptionJa: "基本150語をフラッシュカードで学習",
    descriptionId: "150 kosakata dasar dengan kartu kilat",
    Icon: BookOpen,
    path: "/cards",
    tint: "rgba(14, 165, 233, 0.12)",
    iconColor: design.chart3,
  },
  {
    titleJa: "クイズに挑戦",
    titleId: "Kuis pilihan ganda",
    descriptionJa: "4択クイズで理解度チェック",
    descriptionId: "Cek pemahaman dengan kuis 4 pilihan",
    Icon: Brain,
    path: "/quiz",
    tint: "rgba(168, 85, 247, 0.12)",
    iconColor: design.chart2,
  },
  {
    titleJa: "学習ゲーム",
    titleId: "Game belajar",
    descriptionJa: "タイピング・マッチングゲームで楽しく学習",
    descriptionId: "Belajar dengan mengetik & mencocokkan",
    Icon: Gamepad2,
    path: "/game",
    tint: "rgba(234, 179, 8, 0.14)",
    iconColor: design.chart4,
  },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { mode } = useApp();

  const aiSectionTitle =
    mode === "ja" ? "AI学習（無限コンテンツ）" : "Belajar AI (konten tak terbatas)";
  const basicSectionTitle = mode === "ja" ? "基本学習" : "Belajar dasar";

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
        <View style={styles.sectionHeading}>
          <Sparkles size={20} color={design.purple600} strokeWidth={2.2} />
          <Text style={styles.sectionTitle}>{aiSectionTitle}</Text>
        </View>
        {aiCards.map((card) => {
          const Icon = card.Icon;
          const title = mode === "ja" ? card.titleJa : card.titleId;
          const description = mode === "ja" ? card.descriptionJa : card.descriptionId;
          return (
            <Pressable
              key={card.path}
              onPress={() => navigation.navigate(screenForPath(card.path))}
              testID={`card-ai-${card.path}`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <LinearGradient
                colors={[card.gradient[0], card.gradient[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardFrame}
              >
                <View style={styles.cardRow}>
                  <View style={styles.iconTile}>
                    <Icon size={24} color={card.iconColor} strokeWidth={2.2} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardDesc}>{description}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.basicHeading]}>{basicSectionTitle}</Text>
        {actionCards.map((card) => {
          const Icon = card.Icon;
          const title = mode === "ja" ? card.titleJa : card.titleId;
          const description = mode === "ja" ? card.descriptionJa : card.descriptionId;
          return (
            <Pressable
              key={card.path}
              onPress={() => navigation.navigate(screenForPath(card.path))}
              testID={`card-action-${card.path}`}
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
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  basicHeading: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: design.foreground,
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
