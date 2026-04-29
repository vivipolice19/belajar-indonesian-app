import { Platform } from "react-native";

/** Android の標準 TTS が `ja-JP` を無視・無音にすることがあるため `ja` に寄せる。 */
export function resolveExpoSpeechLanguage(lang: string): string {
  if (lang === "ja-JP" || lang === "ja") {
    return Platform.OS === "android" ? "ja" : "ja-JP";
  }
  return lang;
}
