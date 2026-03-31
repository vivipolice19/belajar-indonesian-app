import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Volume2, RefreshCw, Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AIWord {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  pronunciation_guide?: string;
}

const THEMES = [
  "挨拶", "数字", "家族", "色", "動物", "体", "天気", "時間",
  "飲食", "場所", "動詞", "形容詞", "感情", "交通", "買い物",
  "旅行", "ビジネス", "学校", "趣味", "自然"
];

const DIFFICULTIES = [
  { value: 1, label: "超初級" },
  { value: 3, label: "初級" },
  { value: 5, label: "中級" },
  { value: 7, label: "上級" },
  { value: 9, label: "超上級" }
];

export default function AIWordCardsPage() {
  const [, setLocation] = useLocation();
  const [words, setWords] = useState<AIWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [theme, setTheme] = useState("挨拶");
  const [difficulty, setDifficulty] = useState(3);
  const [showSettings, setShowSettings] = useState(true);
  const { toast } = useToast();
  const { speakIndonesian, isSupported: isSpeechSupported } = useSpeechSynthesis();

  const generateMutation = useMutation({
    mutationFn: async ({ theme, difficulty }: { theme: string; difficulty: number }) => {
      const response = await apiRequest(
        "POST",
        "/api/generate/vocabulary",
        { theme, difficulty, count: 10 }
      );
      return response.json();
    },
    onSuccess: (data) => {
      setWords(data.words);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowSettings(false);
      toast({
        description: `${data.words.length}個の新しい単語を生成しました！`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "単語の生成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const currentWord = words[currentIndex];

  const handleGenerate = () => {
    generateMutation.mutate({ theme, difficulty });
  };

  const handleCardClick = () => {
    if (!currentWord) return;
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;
    
    if (!isSpeechSupported) {
      toast({
        description: "お使いのブラウザは音声機能に対応していません",
        variant: "destructive",
      });
      return;
    }
    
    speakIndonesian(currentWord.indonesian);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      handleGenerate();
    }
  };

  if (showSettings || words.length === 0) {
    return (
      <div className="container mx-auto px-4 pb-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            メニューへ戻る
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">AI無限単語カード</h1>
              <p className="text-sm text-muted-foreground">
                AIが無限に新しい単語を生成します
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">テーマ</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">難易度</Label>
                <Select 
                  value={difficulty.toString()} 
                  onValueChange={(v) => setDifficulty(Number(v))}
                >
                  <SelectTrigger id="difficulty" data-testid="select-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    単語を生成
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6" data-testid="page-ai-cards">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">AI単語カード</h1>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" data-testid="badge-category">
            {currentWord.category}
          </Badge>
          <Badge variant="secondary">
            難易度 {currentWord.difficulty}/10
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {currentIndex + 1} / {words.length} （次の単語は自動生成）
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
                  {currentWord.pronunciation_guide && (
                    <p className="text-sm text-muted-foreground">
                      発音: {currentWord.pronunciation_guide}
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
          disabled={currentIndex === 0}
          data-testid="button-previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleSpeak}
          title="発音を聞く"
          data-testid="button-speak"
        >
          <Volume2 className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(true)}
          title="設定"
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          data-testid="button-next"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="text-center">
        <Button
          variant="secondary"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          data-testid="button-regenerate"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              新しい単語セットを生成
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
