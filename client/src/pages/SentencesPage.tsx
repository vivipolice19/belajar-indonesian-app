import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Volume2, Shuffle } from "lucide-react";
import { SENTENCES_DATA } from "@shared/types";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useToast } from "@/hooks/use-toast";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useLearner } from "@/hooks/useLearner";
import { useJapaneseReading } from "@/hooks/useJapaneseReading";
import { JapaneseLearnerReading } from "@/components/JapaneseLearnerReading";
import { prefetchJapaneseReadings } from "@/lib/prefetchJapaneseReadings";

export default function SentencesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledSentences, setShuffledSentences] = useState([...SENTENCES_DATA]);
  const prefetchTimer = useRef<number | null>(null);
  const { progress, markSentenceLearned, markSentencePronounced } = useGameProgress();
  const { toast } = useToast();
  const { mode: learnerMode } = useLearner();
  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useSpeechSynthesis();
  const currentSentence = shuffledSentences[currentIndex];
  const jpReading = useJapaneseReading(currentSentence?.japanese || "", learnerMode === "id");

  useEffect(() => {
    setShuffledSentences([...SENTENCES_DATA].sort(() => Math.random() - 0.5));
  }, []);

  const nearbyJapaneseTexts = useMemo(() => {
    if (learnerMode !== "id" || shuffledSentences.length === 0) return [];
    const windowSize = 8;
    const out: string[] = [];
    for (let i = 0; i < windowSize; i++) {
      const s = shuffledSentences[(currentIndex + i) % shuffledSentences.length];
      if (s?.japanese) out.push(s.japanese);
    }
    return out;
  }, [learnerMode, shuffledSentences, currentIndex]);

  useEffect(() => {
    if (learnerMode !== "id") return;
    if (prefetchTimer.current) {
      window.clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
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
    
    if (learnerMode === "ja") {
      speakIndonesian(currentSentence.indonesian);
    } else {
      speakJapanese(currentSentence.japanese);
    }
    
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
        <h1 className="text-2xl font-bold text-foreground">
          {learnerMode === "ja" ? "文章学習" : "Belajar kalimat"}
        </h1>
        <div className="flex items-center justify-center gap-2">
          {currentSentence.category && (
            <Badge variant="outline" data-testid="badge-category">
              {currentSentence.category}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {learnerMode === "ja"
            ? `全${SENTENCES_DATA.length}文からランダム出題・無限ループ`
            : `${SENTENCES_DATA.length} kalimat • acak • tanpa batas`}
        </p>
      </div>

      <div className="flex justify-center px-4">
        <Card
          className="w-full max-w-md min-h-[320px] cursor-pointer transition-transform duration-75 ease-out hover-elevate active:scale-[0.99]"
          onClick={handleCardClick}
          data-testid="card-sentence"
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[320px] relative">
            {!isFlipped ? (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    {learnerMode === "ja" ? "インドネシア語の文章" : "Kalimat bahasa Jepang"}
                  </p>
                  {learnerMode === "ja" ? (
                    <p
                      className="text-2xl font-bold text-foreground leading-relaxed"
                      data-testid="text-indonesian-sentence"
                    >
                      {currentSentence.indonesian}
                    </p>
                  ) : (
                    <div data-testid="text-japanese-sentence">
                      <JapaneseLearnerReading
                        reading={jpReading}
                        kanaClassName="text-2xl text-foreground leading-relaxed"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {learnerMode === "ja"
                    ? "カードをタップして日本語訳を表示"
                    : "Ketuk kartu untuk terjemahan bahasa Indonesia"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    {learnerMode === "ja" ? "日本語訳" : "Terjemahan Indonesia"}
                  </p>
                  <p
                    className="text-2xl font-bold text-primary leading-relaxed"
                    data-testid={learnerMode === "ja" ? "text-japanese-sentence" : "text-indonesian-sentence"}
                  >
                    {learnerMode === "ja" ? currentSentence.japanese : currentSentence.indonesian}
                  </p>
                </div>
                <div className="text-center space-y-1 w-full">
                  {learnerMode === "ja" ? (
                    <p className="text-base text-muted-foreground">{currentSentence.indonesian}</p>
                  ) : (
                    <div className="w-full flex justify-center px-1">
                      <JapaneseLearnerReading
                        reading={jpReading}
                        kanaClassName="text-xl font-semibold text-primary leading-relaxed"
                      />
                    </div>
                  )}
                  {currentSentence.category && (
                    <p className="text-xs text-muted-foreground">
                      ({currentSentence.category})
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
