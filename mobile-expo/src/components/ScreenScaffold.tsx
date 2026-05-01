import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import { design } from "../theme/designTokens";
import { AppHeader } from "./AppHeader";

export function ScreenScaffold({
  scroll = true,
  children,
}: {
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: design.background },
  body: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28, flexGrow: 1 },
});
