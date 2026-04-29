export type LearnerMode = "ja" | "id";

export type ProgressState = {
  wordsLearned: number[];
  wordsPronounced: number[];
  sentencesLearned: number[];
  sentencesPronounced: number[];
  quizzesCompleted: number;
};

export type Word = {
  id?: number;
  indonesian: string;
  japanese: string;
  category?: string;
};

export type Sentence = {
  id?: number;
  indonesian: string;
  japanese: string;
  category?: string;
  context?: string;
};

export type QuizState = {
  prompt: string;
  options: string[];
  answer: string;
  speak: "id-ID" | "ja-JP";
};

export type SourceLanguage = "japanese" | "indonesian";

export type TranslationResult = {
  indonesian: string;
  japanese: string;
  grammar_explanation: string;
  usage_examples: Array<{ indonesian: string; japanese: string }>;
  pronunciation_guide: string;
  formality_level: string;
};
