import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRequest {
  text: string;
  lang: string;
  rate: number;
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

  getBestVoice(lang: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null;

    const langLower = lang.toLowerCase();
    
    const exactMatch = this.voices.find(v => v.lang.toLowerCase() === langLower);
    if (exactMatch) return exactMatch;

    const langPrefix = lang.split("-")[0].toLowerCase();
    
    const prefixMatch = this.voices.find(v => 
      v.lang.toLowerCase().startsWith(langPrefix + "-") ||
      v.lang.toLowerCase() === langPrefix
    );
    if (prefixMatch) return prefixMatch;

    const containsMatch = this.voices.find(v => 
      v.lang.toLowerCase().includes(langPrefix)
    );
    if (containsMatch) return containsMatch;

    // Mobile / some engines expose ja-* under nonstandard names only.
    if (langPrefix === "ja") {
      const byName = this.voices.find((v) =>
        /japanese|日本|\bja\b|kyoko|nanami|sayaka|lollipop|yuna|keita|takumi|hiroto|haruka/i.test(
          v.name
        )
      );
      if (byName) return byName;
    }
    if (langPrefix === "id") {
      const byName = this.voices.find((v) =>
        /indonesian|indonesia|bahasa/i.test(v.name)
      );
      if (byName) return byName;
    }

    const defaultVoice = this.voices.find((v) => v.default);
    if (defaultVoice) return defaultVoice;

    return this.voices[0] || null;
  }

  /** True when the voice's BCP-47 tag clearly matches the requested language. */
  private voiceReasonablyMatches(voice: SpeechSynthesisVoice, lang: string): boolean {
    const langLower = lang.toLowerCase();
    const vl = voice.lang.toLowerCase();
    if (vl === langLower) return true;
    const prefix = lang.split("-")[0].toLowerCase();
    if (vl === prefix || vl.startsWith(prefix + "-")) return true;
    return vl.includes(prefix);
  }

  /**
   * Pick a voice but keep utterance.lang = requested lang when the voice tag
   * does not match (e.g. default en-US voice + ja-JP text). Overwriting lang
   * with the voice's locale was breaking Japanese on many desktops.
   */
  configureUtteranceVoice(utterance: SpeechSynthesisUtterance, lang: string): void {
    this.refreshVoicesFromEngine();
    const selectedVoice = this.getBestVoice(lang);
    utterance.lang = lang;
    if (!selectedVoice) return;
    utterance.voice = selectedVoice;
    if (this.voiceReasonablyMatches(selectedVoice, lang)) {
      utterance.lang = selectedVoice.lang;
    }
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
      const utterance = new SpeechSynthesisUtterance(request.text);
      this.configureUtteranceVoice(utterance, request.lang);

      utterance.rate = request.rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      const synth = window.speechSynthesis;
      if (typeof synth.resume === "function") {
        synth.resume();
      }
      // Unconditional cancel() before speak breaks playback on some Chromium/Edge builds.
      if (synth.speaking || synth.pending) {
        synth.cancel();
      }
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

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasVoices, setHasVoices] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const managerRef = useRef<SpeechSynthesisManager | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    managerRef.current = SpeechSynthesisManager.getInstance();
    setIsSupported(managerRef.current.getIsSupported());
    
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
    if (!managerRef.current) {
      managerRef.current = SpeechSynthesisManager.getInstance();
    }
    
    if (!managerRef.current.getIsSupported()) {
      return;
    }
    
    setIsSpeaking(true);
    managerRef.current.speak(text, lang, rate);
    
    setTimeout(() => setIsSpeaking(false), 2000);
  }, []);

  const speakIndonesian = useCallback((text: string) => {
    speak(text, "id-ID", 0.85);
  }, [speak]);

  const speakJapanese = useCallback((text: string) => {
    speak(text, "ja-JP", 0.95);
  }, [speak]);

  const speakByPhrases = useCallback((text: string, options?: { lang?: string; rate?: number }) => {
    if (typeof window === "undefined") return;
    if (!managerRef.current) {
      managerRef.current = SpeechSynthesisManager.getInstance();
    }
    if (!managerRef.current.getIsSupported()) return;

    const lang = options?.lang ?? "id-ID";
    const rate = options?.rate ?? 0.85;
    const phrases = splitIntoPhrases(text);
    if (phrases.length === 0) return;

    managerRef.current.cancel();
    setIsSpeaking(true);

    let idx = 0;
    const speakNext = () => {
      if (idx >= phrases.length) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(phrases[idx]);
      managerRef.current?.configureUtteranceVoice(utterance, lang);
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
      if (typeof synth.resume === "function") {
        synth.resume();
      }
      synth.speak(utterance);
    };

    speakNext();
  }, []);

  const cancel = useCallback(() => {
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
