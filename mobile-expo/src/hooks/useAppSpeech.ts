import { useCallback, useState } from "react";
import { isExpoJapaneseLang } from "../lib/expoSpeakJapanese";
import { speakAppLine, stopAppTts } from "../lib/appTts";

function splitIntoPhrases(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？.!?])\s+|[\n\r]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function useAppSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cancel = useCallback(() => {
    void stopAppTts();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, lang: string = "id-ID", rate: number = 0.85) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    void (async () => {
      setIsSpeaking(true);
      try {
        await speakAppLine(trimmed, lang, rate);
      } finally {
        setIsSpeaking(false);
      }
    })();
  }, []);

  const speakIndonesian = useCallback(
    (t: string) => {
      speak(t, "id-ID", 0.85);
    },
    [speak],
  );

  const speakJapanese = useCallback(
    (t: string) => {
      speak(t, "ja-JP", 0.95);
    },
    [speak],
  );

  const speakByPhrases = useCallback(
    (text: string, options?: { lang?: string; rate?: number }) => {
      const lang = options?.lang ?? "id-ID";
      const rate = options?.rate ?? 0.85;
      const phrases = splitIntoPhrases(text);
      if (!phrases.length) return;
      void (async () => {
        setIsSpeaking(true);
        try {
          for (const p of phrases) {
            await speakAppLine(p, lang, rate);
          }
        } finally {
          setIsSpeaking(false);
        }
      })();
    },
    [],
  );

  return {
    speak,
    speakIndonesian,
    speakJapanese,
    speakByPhrases,
    isSupported: true,
    isSpeaking,
    hasVoices: true,
    cancel,
  };
}
