import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  LEARNER_MODE_STORAGE_KEY,
  LEGACY_LEARNER_MODE_STORAGE_KEY,
  LEGACY_PROGRESS_STORAGE_KEY,
  PROGRESS_STORAGE_KEY,
} from "../constants";
import { hydrateReadingCache } from "../lib/japaneseReadingCache";
import type { LearnerMode, ProgressState } from "../types";

const INITIAL_PROGRESS: ProgressState = {
  wordsLearned: [],
  wordsPronounced: [],
  sentencesLearned: [],
  sentencesPronounced: [],
  quizzesCompleted: 0,
};

type AppContextValue = {
  mode: LearnerMode;
  setMode: (m: LearnerMode) => void;
  progress: ProgressState;
  setProgress: Dispatch<SetStateAction<ProgressState>>;
  resetProgress: () => void;
  markWordLearned: (wordId: number) => void;
  markWordPronounced: (wordId: number) => void;
  markSentenceLearned: (sentenceId: number) => void;
  markSentencePronounced: (sentenceId: number) => void;
  completeQuiz: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

async function migrateLegacyStorage(): Promise<void> {
  try {
    const [curP, legP, curM, legM] = await Promise.all([
      AsyncStorage.getItem(PROGRESS_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY),
      AsyncStorage.getItem(LEARNER_MODE_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_LEARNER_MODE_STORAGE_KEY),
    ]);
    if (!curP && legP) {
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, legP);
      await AsyncStorage.removeItem(LEGACY_PROGRESS_STORAGE_KEY);
    }
    if (!curM && legM && (legM === "ja" || legM === "id")) {
      await AsyncStorage.setItem(LEARNER_MODE_STORAGE_KEY, legM);
      await AsyncStorage.removeItem(LEGACY_LEARNER_MODE_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<LearnerMode>("ja");
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      await migrateLegacyStorage();
      await hydrateReadingCache();
      const rawProgress = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      const rawMode = await AsyncStorage.getItem(LEARNER_MODE_STORAGE_KEY);
      if (rawProgress) {
        try {
          setProgress(JSON.parse(rawProgress) as ProgressState);
        } catch {
          /* ignore */
        }
      }
      if (rawMode === "ja" || rawMode === "id") {
        setModeState(rawMode);
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  const setMode = useCallback((m: LearnerMode) => {
    setModeState(m);
    void AsyncStorage.setItem(LEARNER_MODE_STORAGE_KEY, m);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
  }, []);

  const markWordLearned = useCallback((wordId: number) => {
    setProgress((p) =>
      p.wordsLearned.includes(wordId)
        ? p
        : { ...p, wordsLearned: [...p.wordsLearned, wordId] },
    );
  }, []);

  const markWordPronounced = useCallback((wordId: number) => {
    setProgress((p) =>
      p.wordsPronounced.includes(wordId)
        ? p
        : { ...p, wordsPronounced: [...p.wordsPronounced, wordId] },
    );
  }, []);

  const markSentenceLearned = useCallback((sentenceId: number) => {
    setProgress((p) =>
      p.sentencesLearned.includes(sentenceId)
        ? p
        : { ...p, sentencesLearned: [...p.sentencesLearned, sentenceId] },
    );
  }, []);

  const markSentencePronounced = useCallback((sentenceId: number) => {
    setProgress((p) =>
      p.sentencesPronounced.includes(sentenceId)
        ? p
        : { ...p, sentencesPronounced: [...p.sentencesPronounced, sentenceId] },
    );
  }, []);

  const completeQuiz = useCallback(() => {
    setProgress((p) => ({ ...p, quizzesCompleted: p.quizzesCompleted + 1 }));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      progress,
      setProgress,
      resetProgress,
      markWordLearned,
      markWordPronounced,
      markSentenceLearned,
      markSentencePronounced,
      completeQuiz,
    }),
    [
      mode,
      setMode,
      progress,
      resetProgress,
      markWordLearned,
      markWordPronounced,
      markSentenceLearned,
      markSentencePronounced,
      completeQuiz,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
