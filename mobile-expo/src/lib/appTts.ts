import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as Speech from "expo-speech";
import { API_BASE } from "../constants";
import { isExpoJapaneseLang, speakExpoJapanese } from "./expoSpeakJapanese";
import { resolveExpoSpeechLanguage } from "./resolveExpoSpeechLanguage";

let serverSound: Audio.Sound | null = null;
let audioModeConfigured = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    staysActiveInBackground: false,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioModeConfigured = true;
}

function buildTtsUri(text: string, serverLang: "ja" | "id"): string {
  const base = API_BASE.replace(/\/$/, "");
  const q = text.replace(/\s+/g, " ").trim().slice(0, 2000);
  return `${base}/api/tts?${new URLSearchParams({ text: q, lang: serverLang })}`;
}

function waitPlaybackDone(sound: Audio.Sound, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(true), timeoutMs);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        if ("error" in status && status.error) {
          clearTimeout(to);
          resolve(false);
        }
        return;
      }
      if (status.didJustFinish) {
        clearTimeout(to);
        resolve(true);
      }
    });
  });
}

async function speakLocalFallback(text: string, lang: string, rate: number): Promise<void> {
  if (isExpoJapaneseLang(lang)) {
    await new Promise<void>((res) => speakExpoJapanese(text, rate, { onDone: () => res() }));
    return;
  }
  await new Promise<void>((res) => {
    Speech.speak(text, {
      language: resolveExpoSpeechLanguage(lang),
      rate,
      onDone: () => res(),
      onStopped: () => res(),
      onError: () => res(),
    });
  });
}

/** ネットワーク TTS（Web と同じ `/api/tts`）→ 失敗時のみ端末 TTS。 */
export async function speakAppLine(text: string, lang: string, rate: number): Promise<void> {
  const trimmed = text?.trim();
  if (!trimmed) return;

  await stopAppTts();
  await ensureAudioMode();

  const serverLang: "ja" | "id" = isExpoJapaneseLang(lang) ? "ja" : "id";
  const uri = buildTtsUri(trimmed, serverLang);

  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1.0 });
    serverSound = sound;
    const ok = await waitPlaybackDone(sound, 120_000);
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore */
    }
    serverSound = null;
    if (ok) return;
  } catch {
    serverSound = null;
  }

  await speakLocalFallback(trimmed, lang, rate);
}

export async function stopAppTts(): Promise<void> {
  Speech.stop();
  if (serverSound) {
    const s = serverSound;
    serverSound = null;
    try {
      await s.stopAsync();
    } catch {
      /* ignore */
    }
    try {
      await s.unloadAsync();
    } catch {
      /* ignore */
    }
  }
}
