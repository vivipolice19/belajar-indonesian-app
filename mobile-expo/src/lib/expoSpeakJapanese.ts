import * as Speech from "expo-speech";
import { Platform } from "react-native";

export function isExpoJapaneseLang(lang: string): boolean {
  const l = lang.toLowerCase();
  return l === "ja-jp" || l === "ja";
}

/** Android は `ja` 優先。`onError` で次のコードを試す。 */
const JA_TRY_ORDER: string[] = Platform.OS === "android" ? ["ja", "ja-JP"] : ["ja-JP", "ja"];

/**
 * expo-speech で日本語のみ複数ロケールを試す（`voice` は端末によって無音になるため使わない）。
 */
export function speakExpoJapanese(
  text: string,
  rate: number,
  lifecycle: { onDone: () => void },
): void {
  const trimmed = text.trim();
  if (!trimmed) {
    lifecycle.onDone();
    return;
  }
  let idx = 0;
  const tryNext = () => {
    if (idx >= JA_TRY_ORDER.length) {
      lifecycle.onDone();
      return;
    }
    const language = JA_TRY_ORDER[idx];
    idx += 1;
    Speech.speak(trimmed, {
      language,
      rate,
      volume: 1,
      pitch: 1,
      onDone: lifecycle.onDone,
      onStopped: lifecycle.onDone,
      onError: tryNext,
    });
  };
  tryNext();
}
