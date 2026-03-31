import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Volume2, Shuffle } from "lucide-react";
import { SENTENCES_DATA } from "@shared/types";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useToast } from "@/hooks/use-toast";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

export default function SentencesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledSentences, setShuffledSentences] = useState([...SENTENCES_DATA]);
  const { progress, markSentenceLearned, markSentencePronounced } = useGameProgress();
  const { toast } = useToast();
  const { speakIndonesian, isSupported: isSpeechSupported } = useSpeechSynthesis();

  useEffect(() => {
    setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
  }, []);

  const currentSentence = shuffledSentences[currentIndex];

  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      if (!progress.sentencesLearned.includes(currentSentence.id)) {
        markSentenceLearned(currentSentence.id);
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
    
    speakIndonesian(currentSentence.indonesian);
    
    if (!progress.sentencesPronounced.includes(currentSentence.id)) {
      markSentencePronounced(currentSentence.id);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < 0) {
        setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
        return SENTENCES_DATA.length - 1;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= shuffledSentences.length) {
        setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
        return 0;
      }
      return newIndex;
    });
    setIsFlipped(false);
  };

  const handleShuffle = () => {
    setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    toast({
      description: "文章をシャッフルしました",
      duration: 1500,
    });
  };

  return (
    <div className="p-4 space-y-6" data-testid="page-sentences">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">文章学習</h1>
        <div className="flex items-center justify-center gap-2">
          {currentSentence.category && (
            <Badge variant="outline" data-testid="badge-category">
              {currentSentence.category}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          全{SENTENCES_DATA.length}文からランダム出題・無限ループ
        </p>
      </div>

      <div className="flex justify-center px-4">
        <Card
          className="w-full max-w-md min-h-[320px] cursor-pointer transition-all duration-200 hover-elevate active:scale-95"
          onClick={handleCardClick}
          data-testid="card-sentence"
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[320px] relative">
            {!isFlipped ? (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    インドネシア語の文章
                  </p>
                  <p className="text-2xl font-bold text-foreground leading-relaxed" data-testid="text-indonesian-sentence">
                    {currentSentence.indonesian}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  カードをタップして日本語訳を表示
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    日本語訳
                  </p>
                  <p className="text-2xl font-bold text-primary leading-relaxed" data-testid="text-japanese-sentence">
                    {currentSentence.japanese}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base text-muted-foreground">
                    {currentSentence.indonesian}
                  </p>
                  {currentSentence.category && (
                    <p className="text-xs text-muted-foreground">
                      ({currentSentence.category})
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
          data-testid="button-previous-sentence"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={handleSpeak}
          data-testid="button-speak-sentence"
        >
          <Volume2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleShuffle}
          data-testid="button-shuffle-sentence"
        >
          <Shuffle className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          data-testid="button-next-sentence"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
