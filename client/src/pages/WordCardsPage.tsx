import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Volume2, Shuffle } from "lucide-react";
import { WORDS_DATA } from "@shared/types";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useToast } from "@/hooks/use-toast";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

export default function WordCardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState([...WORDS_DATA]);
  const { progress, markWordLearned, markWordPronounced } = useGameProgress();
  const { toast } = useToast();
  const { speakIndonesian, isSupported: isSpeechSupported } = useSpeechSynthesis();

  useEffect(() => {
    setShuffledWords([...WORDS_DATA].sort(() => Math.random() - 0.5));
  }, []);

  const currentWord = shuffledWords[currentIndex];

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
    
    speakIndonesian(currentWord.indonesian);
    
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
        <h1 className="text-2xl font-bold text-foreground">単語カード</h1>
        <div className="flex items-center justify-center gap-2">
          {currentWord.category && (
            <Badge variant="outline" data-testid="badge-category">
              {currentWord.category}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          全{WORDS_DATA.length}語からランダム出題・無限ループ
        </p>
      </div>

      <div className="flex justify-center px-4">
        <Card
          className="w-full max-w-md min-h-[320px] cursor-pointer transition-all duration-200 hover-elevate active:scale-95"
          onClick={handleCardClick}
          data-testid="card-flashcard"
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[320px] relative">
            {!isFlipped ? (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    インドネシア語
                  </p>
                  <p className="text-4xl font-bold text-foreground" data-testid="text-indonesian">
                    {currentWord.indonesian}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  カードをタップして日本語の意味を表示
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    日本語の意味
                  </p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-japanese">
                    {currentWord.japanese}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg text-muted-foreground">
                    {currentWord.indonesian}
                  </p>
                  {currentWord.category && (
                    <p className="text-xs text-muted-foreground">
                      ({currentWord.category})
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  カードをタップして戻る
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
