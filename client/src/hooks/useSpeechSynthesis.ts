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

    const defaultVoice = this.voices.find(v => v.default);
    if (defaultVoice) return defaultVoice;

    return this.voices[0] || null;
  }

  private executeSpeak(request: SpeechRequest): void {
    try {
      const utterance = new SpeechSynthesisUtterance(request.text);
      const selectedVoice = this.getBestVoice(request.lang);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = request.lang;
      }

      utterance.rate = request.rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
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

    if (this.voices.length > 0) {
      this.executeSpeak(request);
    } else {
      this.pendingRequests.push(request);
      
      const freshVoices = window.speechSynthesis.getVoices();
      if (freshVoices.length > 0) {
        this.voices = freshVoices;
        this.voicesLoaded = true;
        this.processPendingRequests();
      }
    }
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
      const voice = managerRef.current?.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = lang;
      }
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
      window.speechSynthesis.speak(utterance);
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
