import { useLocalStorage } from './useLocalStorage';

export interface LearningProgress {
  wordsLearned: number[];
  wordsPronounced: number[];
  sentencesLearned: number[];
  sentencesPronounced: number[];
  quizzesCompleted: number;
}

const INITIAL_PROGRESS: LearningProgress = {
  wordsLearned: [],
  wordsPronounced: [],
  sentencesLearned: [],
  sentencesPronounced: [],
  quizzesCompleted: 0,
};

export function useGameProgress() {
  const [progress, setProgress] = useLocalStorage<LearningProgress>('belajar_progress', INITIAL_PROGRESS);

  const markWordLearned = (wordId: number) => {
    if (!progress.wordsLearned.includes(wordId)) {
      setProgress({
        ...progress,
        wordsLearned: [...progress.wordsLearned, wordId],
      });
    }
  };

  const markWordPronounced = (wordId: number) => {
    if (!progress.wordsPronounced.includes(wordId)) {
      setProgress({
        ...progress,
        wordsPronounced: [...progress.wordsPronounced, wordId],
      });
    }
  };

  const markSentenceLearned = (sentenceId: number) => {
    if (!progress.sentencesLearned.includes(sentenceId)) {
      setProgress({
        ...progress,
        sentencesLearned: [...progress.sentencesLearned, sentenceId],
      });
    }
  };

  const markSentencePronounced = (sentenceId: number) => {
    if (!progress.sentencesPronounced.includes(sentenceId)) {
      setProgress({
        ...progress,
        sentencesPronounced: [...progress.sentencesPronounced, sentenceId],
      });
    }
  };

  const completeQuiz = () => {
    setProgress({
      ...progress,
      quizzesCompleted: progress.quizzesCompleted + 1,
    });
  };

  const resetProgress = () => {
    setProgress(INITIAL_PROGRESS);
  };

  return {
    progress,
    markWordLearned,
    markWordPronounced,
    markSentenceLearned,
    markSentencePronounced,
    completeQuiz,
    resetProgress,
  };
}
