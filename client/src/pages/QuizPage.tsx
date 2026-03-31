import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Trophy, BookOpen, BookText, Volume2 } from "lucide-react";
import { WORDS_DATA, SENTENCES_DATA, QuizQuestion, SentenceQuizQuestion } from "@shared/types";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useToast } from "@/hooks/use-toast";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cn } from "@/lib/utils";

type QuizMode = "words" | "sentences";
type Question = QuizQuestion | SentenceQuizQuestion;

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
  
  setTimeout(() => {
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    oscillator2.frequency.value = 1000;
    oscillator2.type = 'sine';
    gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator2.start(ctx.currentTime);
    oscillator2.stop(ctx.currentTime + 0.3);
  }, 100);
}

function playIncorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.value = 200;
  oscillator.type = 'sawtooth';
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
}

const RECENT_QUESTIONS_KEY = 'belajar_recent_questions';
const MAX_RECENT_QUESTIONS = 30;

function getRecentQuestions(mode: 'words' | 'sentences'): number[] {
  try {
    const stored = localStorage.getItem(`${RECENT_QUESTIONS_KEY}_${mode}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentQuestion(mode: 'words' | 'sentences', id: number) {
  try {
    const recent = getRecentQuestions(mode);
    const updated = [id, ...recent.filter(qid => qid !== id)].slice(0, MAX_RECENT_QUESTIONS);
    localStorage.setItem(`${RECENT_QUESTIONS_KEY}_${mode}`, JSON.stringify(updated));
  } catch {
  }
}

function generateSingleWordQuestion(): QuizQuestion {
  const recent = getRecentQuestions('words');
  let availableWords = WORDS_DATA.filter(w => !recent.includes(w.id));
  
  if (availableWords.length < 4) {
    availableWords = WORDS_DATA;
  }
  
  const word = availableWords[Math.floor(Math.random() * availableWords.length)];
  addRecentQuestion('words', word.id);
  
  const otherWords = WORDS_DATA.filter((w) => w.id !== word.id);
  const wrongAnswers = otherWords
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((w) => w.japanese);

  const options = [...wrongAnswers, word.japanese].sort(() => Math.random() - 0.5);

  return {
    word,
    options,
    correctAnswer: word.japanese,
  };
}

function generateSingleSentenceQuestion(): SentenceQuizQuestion | null {
  if (SENTENCES_DATA.length < 4) return null;
  
  const recent = getRecentQuestions('sentences');
  let availableSentences = SENTENCES_DATA.filter(s => !recent.includes(s.id));
  
  if (availableSentences.length < 4) {
    availableSentences = SENTENCES_DATA;
  }
  
  const sentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];
  addRecentQuestion('sentences', sentence.id);
  
  const otherSentences = SENTENCES_DATA.filter((s) => s.id !== sentence.id);
  const wrongAnswers = otherSentences
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((s) => s.japanese);

  const options = [...wrongAnswers, sentence.japanese].sort(() => Math.random() - 0.5);

  return {
    sentence,
    options,
    correctAnswer: sentence.japanese,
  };
}

export default function QuizPage() {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const { completeQuiz } = useGameProgress();
  const { toast } = useToast();
  const { speakIndonesian, isSupported: isSpeechSupported } = useSpeechSynthesis();

  const pronounceWord = (text: string) => {
    if (!isSpeechSupported) {
      toast({
        description: "お使いのブラウザは音声機能に対応していません",
        variant: "destructive",
      });
      return;
    }
    
    speakIndonesian(text);
  };

  const startWordQuiz = () => {
    setMode("words");
    setCurrentQuestion(generateSingleWordQuestion());
    setSelectedAnswer(null);
    setScore(0);
    setQuestionCount(0);
  };

  const startSentenceQuiz = () => {
    const question = generateSingleSentenceQuestion();
    if (!question) {
      toast({
        description: "文章データが不足しています",
        variant: "destructive",
      });
      return;
    }
    setMode("sentences");
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setScore(0);
    setQuestionCount(0);
  };

  const loadNextQuestion = () => {
    if (mode === "words") {
      setCurrentQuestion(generateSingleWordQuestion());
      setSelectedAnswer(null);
      setQuestionCount(prev => prev + 1);
    } else if (mode === "sentences") {
      const question = generateSingleSentenceQuestion();
      if (!question) {
        toast({
          description: "文章データが不足しています。メニューに戻ります。",
          variant: "destructive",
        });
        setTimeout(() => {
          handleBackToMenu();
        }, 1500);
        return;
      }
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setQuestionCount(prev => prev + 1);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || !currentQuestion) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      playCorrectSound();
      setScore((prev) => prev + 1);
      completeQuiz();
      toast({
        description: "正解！",
        duration: 1500,
      });
    } else {
      playIncorrectSound();
      toast({
        description: "不正解...",
        duration: 1500,
        variant: "destructive",
      });
    }

    setTimeout(() => {
      loadNextQuestion();
    }, 1500);
  };

  const handleBackToMenu = () => {
    setMode(null);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setScore(0);
    setQuestionCount(0);
  };

  if (mode === null) {
    return (
      <div className="p-4 space-y-6" data-testid="page-quiz-menu">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">クイズモード選択</h1>
          <p className="text-sm text-muted-foreground">
            クイズに挑戦しよう！
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="hover-elevate cursor-pointer active:scale-95 transition-all" onClick={startWordQuiz} data-testid="card-word-quiz">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">単語クイズ</h3>
                <p className="text-sm text-muted-foreground">
                  インドネシア語の単語の意味を答える（無限ループ）
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  各問題で音声発音が聞けます
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer active:scale-95 transition-all"
            onClick={startSentenceQuiz}
            data-testid="card-sentence-quiz"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <BookText className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">文章クイズ</h3>
                <p className="text-sm text-muted-foreground">
                  文章の意味を答える（無限ループ）
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  各問題で音声発音が聞けます
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">クイズを準備中...</p>
      </div>
    );
  }

  const questionText = 'word' in currentQuestion ? currentQuestion.word.indonesian : currentQuestion.sentence.indonesian;
  const questionLabel = mode === "words" ? "この単語の意味は？" : "この文章の意味は？";

  return (
    <div className="p-4 space-y-6" data-testid="page-quiz">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToMenu}
            data-testid="button-back"
          >
            ←
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {mode === "words" ? "単語クイズ" : "文章クイズ"}
          </h1>
        </div>
        <Badge variant="secondary" data-testid="text-question-count">
          問{questionCount + 1}問目 | スコア: {score}
        </Badge>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {questionLabel}
            </p>
            <p className={cn(
              "font-bold text-foreground text-center",
              mode === "words" ? "text-3xl" : "text-2xl leading-relaxed"
            )} data-testid="text-quiz-question">
              {questionText}
            </p>
          </div>
          
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => pronounceWord(questionText)}
              disabled={!isSpeechSupported}
              size="lg"
              className="gap-3 h-14 px-8 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
              data-testid="button-pronounce-quiz"
            >
              <Volume2 className="w-6 h-6" />
              {isSpeechSupported ? "発音を聞く" : "音声非対応"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentQuestion.correctAnswer;
          const showResult = selectedAnswer !== null;

          return (
            <Button
              key={index}
              variant="outline"
              size="lg"
              className={cn(
                "w-full h-auto py-4 text-lg font-semibold justify-start hover-elevate active-elevate-2",
                showResult && isCorrect && "bg-success/20 border-success text-success-foreground",
                showResult && isSelected && !isCorrect && "bg-destructive/20 border-destructive text-destructive-foreground"
              )}
              onClick={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== null}
              data-testid={`button-answer-${index}`}
            >
              <span className="flex-1 text-left">{option}</span>
              {showResult && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-success ml-2" />
              )}
              {showResult && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-destructive ml-2" />
              )}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <span className="font-semibold" data-testid="text-current-score">
            スコア: {score}
          </span>
        </div>
      </div>
    </div>
  );
}
