import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Volume2, Shuffle } from "lucide-react";
import { WORDS_DATA } from "@shared/types";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useToast } from "@/hooks/use-toast";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useLearner } from "@/hooks/useLearner";
import { useJapaneseReading } from "@/hooks/useJapaneseReading";
import { JapaneseLearnerReading } from "@/components/JapaneseLearnerReading";
import { prefetchJapaneseReadings } from "@/lib/prefetchJapaneseReadings";

export default function WordCardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState([...WORDS_DATA]);
  const prefetchTimer = useRef<number | null>(null);
  const { progress, markWordLearned, markWordPronounced } = useGameProgress();
  const { toast } = useToast();
  const { mode: learnerMode } = useLearner();
  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useSpeechSynthesis();
  const currentWord = shuffledWords[currentIndex];
  const jpReading = useJapaneseReading(currentWord?.japanese || "", learnerMode === "id");

  useEffect(() => {
    setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
  }, []);

  const nearbyJapaneseTexts = useMemo(() => {
    if (learnerMode !== "id" || shuffledWords.length === 0) return [];
    const windowSize = 12;
    const out: string[] = [];
    for (let i = 0; i < windowSize; i++) {
      const w = shuffledWords[(currentIndex + i) % shuffledWords.length];
      if (w?.japanese) out.push(w.japanese);
    }
    return out;
  }, [learnerMode, shuffledWords, currentIndex]);

  useEffect(() => {
    if (learnerMode !== "id") return;
    if (prefetchTimer.current) {
      window.clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
    // Defer slightly so the current card render isn't blocked.
    prefetchTimer.current = window.setTimeout(() => {
      void prefetchJapaneseReadings(nearbyJapaneseTexts);
    }, 250);
    return () => {
      if (prefetchTimer.current) {
        window.clearTimeout(prefetchTimer.current);
        prefetchTimer.current = null;
      }
    };
  }, [learnerMode, nearbyJapaneseTexts]);

  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      if (!progress.wordsLearned.includes(currentWord.id)) {
        markWordLearned(currentWord.id);
      }
    } else {
      setIsFlipped(false);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isSpeechSupported) {
      toast({
        description: "お使いのブラウザは音声機能に対応していません",
        variant: "destructive",
      });
      return;
    }
    
    if (learnerMode === "ja") {
      speakIndonesian(currentWord.indonesian);
    } else {
      speakJapanese(currentWord.japanese);
    }
    
    if (!progress.wordsPronounced.includes(currentWord.id)) {
      markWordPronounced(currentWord.id);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < 0) {
        setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
        return WORDS_DATA.length - 1;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= shuffledWords.length) {
        setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
        return 0;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleShuffle = () => {
    setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    toast({
      description: "単語をシャッフルしました",
      duration: 1500,
    });
  };

  return (
    <div className="p-4 space-y-6" data-testid="page-cards">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {learnerMode === "ja" ? "単語カード" : "Kartu kosakata"}
        </h1>
        <div className="flex items-center justify-center gap-2">
          {currentWord.category && (
            <Badge variant="outline" data-testid="badge-category">
              {currentWord.category}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {learnerMode === "ja"
            ? `全${WORDS_DATA.length}語からランダム出題・無限ループ`
            : `${WORDS_DATA.length} kosakata • acak • tanpa batas`}
        </p>
      </div>

      <div className="flex justify-center px-4">
        <Card
          className="w-full max-w-md min-h-[320px] cursor-pointer transition-transform duration-75 ease-out hover-elevate active:scale-[0.99]"
          onClick={handleCardClick}
          data-testid="card-flashcard"
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[320px] relative">
            {!isFlipped ? (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    {learnerMode === "ja" ? "インドネシア語" : "Bahasa Jepang"}
                  </p>
                  {learnerMode === "ja" ? (
                    <p
                      className="text-4xl font-bold text-foreground"
                      data-testid="text-indonesian"
                    >
                      {currentWord.indonesian}
                    </p>
                  ) : (
                    <div data-testid="text-japanese">
                      <JapaneseLearnerReading
                        reading={jpReading}
                        kanaClassName="text-4xl text-foreground"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {learnerMode === "ja"
                    ? "カードをタップして日本語の意味を表示"
                    : "Ketuk kartu untuk menampilkan bahasa Indonesia"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    {learnerMode === "ja" ? "日本語の意味" : "Bahasa Indonesia"}
                  </p>
                  <p
                    className="text-3xl font-bold text-primary"
                    data-testid={learnerMode === "ja" ? "text-japanese" : "text-indonesian"}
                  >
                    {learnerMode === "ja" ? currentWord.japanese : currentWord.indonesian}
                  </p>
                </div>
                <div className="text-center space-y-1 w-full">
                  {learnerMode === "ja" ? (
                    <p className="text-lg text-muted-foreground">{currentWord.indonesian}</p>
                  ) : (
                    <div className="w-full flex justify-center px-1">
                      <JapaneseLearnerReading
                        reading={jpReading}
                        kanaClassName="text-2xl font-semibold text-primary leading-snug"
                      />
                    </div>
                  )}
                  {currentWord.category && (
                    <p className="text-xs text-muted-foreground">
                      ({currentWord.category})
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {learnerMode === "ja" ? "カードをタップして戻る" : "Ketuk kartu untuk kembali"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-4 px-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          data-testid="button-previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={handleSpeak}
          data-testid="button-speak"
        >
          <Volume2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleShuffle}
          data-testid="button-shuffle"
        >
          <Shuffle className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          data-testid="button-next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
