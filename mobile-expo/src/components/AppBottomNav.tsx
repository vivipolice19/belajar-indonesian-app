import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import type { RootStackParamList } from "../navigation/types";
import { design } from "../theme/designTokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const tabs: { name: keyof RootStackParamList; labelJa: string; labelId: string; icon: string }[] =
  [
    { name: "Home", labelJa: "ホーム", labelId: "Beranda", icon: "⌂" },
    { name: "WordCards", labelJa: "単語", labelId: "Kosakata", icon: "▤" },
    { name: "Sentences", labelJa: "文章", labelId: "Kalimat", icon: "≡" },
    { name: "MiniGame", labelJa: "ゲーム", labelId: "Game", icon: "◎" },
    { name: "Progress", labelJa: "進捗", labelId: "Progres", icon: "↗" },
  ];

export function AppBottomNav({ current }: { current: keyof RootStackParamList }) {
  const navigation = useNavigation<Nav>();
  const { mode } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((t) => {
        const active = current === t.name;
        const label = mode === "ja" ? t.labelJa : t.labelId;
        return (
          <Pressable
            key={t.name}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => navigation.navigate(t.name)}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{t.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: design.cardBorder,
    backgroundColor: design.card,
    paddingTop: 8,
    minHeight: 56,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  itemActive: { backgroundColor: "rgba(255, 94, 51, 0.12)" },
  icon: { fontSize: 16, color: design.mutedForeground },
  iconActive: { color: design.primary },
  label: { fontSize: 11, fontWeight: "700", color: design.mutedForeground },
  labelActive: { color: design.primary },
});
