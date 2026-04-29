import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { MascotIcon } from "./MascotIcon";
import { design } from "../theme/designTokens";

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useApp();
  const targetLabel =
    mode === "ja" ? "学習: インドネシア語" : "Belajar: Bahasa Jepang";

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.row}>
        <View style={styles.mascotSlot} accessibilityLabel="mascot">
          <MascotIcon size="sm" expression="happy" />
        </View>
        <View style={styles.center}>
          <Text style={styles.title}>Belajar</Text>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setMode("ja")}
              style={[styles.toggleBtn, mode === "ja" && styles.toggleBtnOn]}
            >
              <Text style={[styles.toggleTxt, mode === "ja" && styles.toggleTxtOn]}>
                日本語話者
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("id")}
              style={[styles.toggleBtn, mode === "id" && styles.toggleBtnOn]}
            >
              <Text style={[styles.toggleTxt, mode === "id" && styles.toggleTxtOn]}>
                Penutur ID
              </Text>
            </Pressable>
          </View>
          <Text style={styles.target}>{targetLabel}</Text>
        </View>
        <View style={styles.spacer} accessibilityLabel="header-spacer" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: design.card,
    borderBottomWidth: 1,
    borderBottomColor: design.cardBorder,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  mascotSlot: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", gap: 6 },
  spacer: { width: 40 },
  title: { fontSize: 20, fontWeight: "800", color: design.foreground },
  toggleRow: { flexDirection: "row", gap: 6 },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  toggleBtnOn: { backgroundColor: design.primary },
  toggleTxt: { fontSize: 11, fontWeight: "700", color: design.foreground },
  toggleTxtOn: { color: "#fff" },
  target: { fontSize: 10, color: design.mutedForeground },
});
