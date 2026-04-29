import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import type { RootStackParamList } from "../navigation/types";
import { design } from "../theme/designTokens";
import { AppBottomNav } from "./AppBottomNav";
import { AppHeader } from "./AppHeader";

export function ScreenScaffold({
  routeName,
  scroll = true,
  children,
}: {
  routeName: keyof RootStackParamList;
  scroll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <AppHeader />
      {scroll ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
      <AppBottomNav current={routeName} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: design.background },
  body: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 96, flexGrow: 1 },
});
