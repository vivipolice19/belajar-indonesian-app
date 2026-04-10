import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRequest {
  text: string;
  lang: string;
  rate: number;
}

let playingServerAudio: HTMLAudioElement | null = null;

function stopServerAudio(): void {
  if (playingServerAudio) {
    playingServerAudio.pause();
    playingServerAudio.removeAttribute("src");
    playingServerAudio.load();
    playingServerAudio = null;
  }
}

async function playServerTts(text: string, langCode: "ja" | "id"): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/tts?${new URLSearchParams({ text, lang: langCode })}`,
    );
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.size) return false;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    playingServerAudio = audio;

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (playingServerAudio === audio) playingServerAudio = null;
      };
      audio.onended = () => {
        cleanup();
        resolve();
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error("audio playback error"));
      };
      void audio.play().catch((e) => {
        cleanup();
        reject(e);
      });
    });
    return true;
  } catch {
    return false;
  }
}

class SpeechSynthesisManager {
  private static instance: SpeechSynthesisManager | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private pendingRequests: SpeechRequest[] = [];
  private isSupported = false;
  private loadInterval: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;

  private constructor() {
    if (typeof window === "undefined") return;

    this.isSupported = "speechSynthesis" in window;
    if (!this.isSupported) return;

    this.loadVoices();

    window.speechSynthesis.onvoiceschanged = () => {
      this.loadVoices();
    };

    this.loadInterval = setInterval(() => {
      this.loadVoices();
    }, 100);
  }

  static getInstance(): SpeechSynthesisManager {
    if (!SpeechSynthesisManager.instance) {
      SpeechSynthesisManager.instance = new SpeechSynthesisManager();
    }
    return SpeechSynthesisManager.instance;
  }

  private loadVoices(): void {
    if (typeof window === "undefined" || !this.isSupported) return;

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      this.voices = availableVoices;

      if (!this.voicesLoaded) {
        this.voicesLoaded = true;

        if (this.loadInterval) {
          clearInterval(this.loadInterval);
          this.loadInterval = null;
        }
      }

      this.processPendingRequests();
    }
  }

  private processPendingRequests(): void {
    if (this.isProcessing || this.voices.length === 0 || this.pendingRequests.length === 0) {
      return;
    }

    this.isProcessing = true;

    const requests = [...this.pendingRequests];
    this.pendingRequests = [];

    for (const request of requests) {
      this.executeSpeak(request);
    }

    this.isProcessing = false;
  }

  refreshVoicesFromEngine(): void {
    if (typeof window === "undefined" || !this.isSupported) return;
    const roster = window.speechSynthesis.getVoices();
    if (roster.length > 0) {
      this.voices = roster;
      this.voicesLoaded = true;
    }
  }

  private executeSpeak(request: SpeechRequest): void {
    try {
      const trimmed = request.text?.trim();
      if (!trimmed) return;

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = request.lang;
      utterance.rate = request.rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      const synth = window.speechSynthesis;
      void synth.getVoices();
      if (typeof synth.resume === "function") {
        synth.resume();
      }

      if (synth.speaking || synth.pending) {
        synth.cancel();
      }

      utterance.onerror = (ev) => {
        console.warn("SpeechSynthesisUtterance error:", ev.error, request.lang);
      };

      synth.speak(utterance);
    } catch (error) {
      console.warn("Speech synthesis error:", error);
    }
  }

  getIsSupported(): boolean {
    return this.isSupported;
  }

  getHasVoices(): boolean {
    return this.voices.length > 0;
  }

  getVoicesLoaded(): boolean {
    return this.voicesLoaded;
  }

  speak(text: string, lang: string = "id-ID", rate: number = 0.85): void {
    if (!this.isSupported) return;

    const request: SpeechRequest = { text, lang, rate };

    this.refreshVoicesFromEngine();
    this.pendingRequests = [];
    this.executeSpeak(request);
  }

  cancel(): void {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
    this.pendingRequests = [];
  }
}

interface UseSpeechSynthesisReturn {
  speak: (text: string, lang?: string, rate?: number) => void;
  speakIndonesian: (text: string) => void;
  speakJapanese: (text: string) => void;
  speakByPhrases: (text: string, options?: { lang?: string; rate?: number }) => void;
  isSupported: boolean;
  isSpeaking: boolean;
  hasVoices: boolean;
  cancel: () => void;
}

function splitIntoPhrases(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？.!?])\s+|[\n\r]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function langToTtsCode(lang: string): "ja" | "id" {
  return lang.toLowerCase().startsWith("ja") ? "ja" : "id";
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasVoices, setHasVoices] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const managerRef = useRef<SpeechSynthesisManager | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    managerRef.current = SpeechSynthesisManager.getInstance();
    setIsSupported(
      typeof Audio !== "undefined" ||
        (managerRef.current && managerRef.current.getIsSupported()),
    );

    const checkVoices = () => {
      if (managerRef.current) {
        setHasVoices(managerRef.current.getHasVoices());
      }
    };

    checkVoices();
    const interval = setInterval(checkVoices, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const speak = useCallback((text: string, lang: string = "id-ID", rate: number = 0.85) => {
    if (typeof window === "undefined") return;

    void (async () => {
      stopServerAudio();
      managerRef.current?.cancel();

      const trimmed = text?.trim();
      if (!trimmed) return;

      setIsSpeaking(true);

      const code = langToTtsCode(lang);
      const serverOk = await playServerTts(trimmed, code);

      if (!serverOk && "speechSynthesis" in window) {
        if (!managerRef.current) {
          managerRef.current = SpeechSynthesisManager.getInstance();
        }
        managerRef.current.speak(trimmed, lang, rate);
      }

      setTimeout(() => setIsSpeaking(false), 5000);
    })();
  }, []);

  const speakIndonesian = useCallback((text: string) => {
    speak(text, "id-ID", 0.85);
  }, [speak]);

  const speakJapanese = useCallback((text: string) => {
    speak(text, "ja-JP", 0.95);
  }, [speak]);

  const speakByPhrases = useCallback((text: string, options?: { lang?: string; rate?: number }) => {
    if (typeof window === "undefined") return;

    void (async () => {
      if (!managerRef.current) {
        managerRef.current = SpeechSynthesisManager.getInstance();
      }

      const lang = options?.lang ?? "id-ID";
      const rate = options?.rate ?? 0.85;
      const phrases = splitIntoPhrases(text);
      if (phrases.length === 0) return;

      stopServerAudio();
      managerRef.current.cancel();
      setIsSpeaking(true);

      const code = langToTtsCode(lang);
      const joined = phrases.join(" ");
      const serverOk =
        joined.length > 0 && (await playServerTts(joined.slice(0, 2000), code));

      if (serverOk) {
        setIsSpeaking(false);
        return;
      }

      if ("speechSynthesis" in window) {
        let idx = 0;
        const speakNext = () => {
          if (idx >= phrases.length) {
            setIsSpeaking(false);
            return;
          }
          const phrase = phrases[idx];
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.lang = lang;
          utterance.rate = rate;
          utterance.pitch = 1;
          utterance.volume = 1;
          utterance.onend = () => {
            idx += 1;
            speakNext();
          };
          utterance.onerror = () => {
            idx += 1;
            speakNext();
          };
          const synth = window.speechSynthesis;
          void synth.getVoices();
          if (typeof synth.resume === "function") {
            synth.resume();
          }
          synth.speak(utterance);
        };
        speakNext();
      } else {
        setIsSpeaking(false);
      }
    })();
  }, []);

  const cancel = useCallback(() => {
    stopServerAudio();
    if (managerRef.current) {
      managerRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    speakIndonesian,
    speakJapanese,
    speakByPhrases,
    isSupported,
    isSpeaking,
    hasVoices,
    cancel,
  };
}
