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
import { apiRequest, apiErrorMessage } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useLearner } from "@/hooks/useLearner";
import { useJapaneseReading } from "@/hooks/useJapaneseReading";
import { JapaneseLearnerReading } from "@/components/JapaneseLearnerReading";
import { difficultyLabel, themeDisplay } from "@/lib/bilingualLabels";

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

const DIFFICULTY_VALUES = [1, 3, 5, 7, 9] as const;

export default function AIWordCardsPage() {
  const [, setLocation] = useLocation();
  const [words, setWords] = useState<AIWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [theme, setTheme] = useState("挨拶");
  const [difficulty, setDifficulty] = useState(3);
  const [showSettings, setShowSettings] = useState(true);
  const { toast } = useToast();
  const { mode: learnerMode } = useLearner();
  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useSpeechSynthesis();
  const currentWord = words[currentIndex];
  const jpReading = useJapaneseReading(
    currentWord?.japanese || "",
    learnerMode === "id" && !!currentWord,
  );

  const generateMutation = useMutation({
    mutationFn: async ({
      theme,
      difficulty,
    }: {
      theme: string;
      difficulty: number;
    }) => {
      const response = await apiRequest("POST", "/api/generate/vocabulary", {
        theme,
        difficulty,
        count: 10,
        learnerMode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setWords(data.words);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowSettings(false);
      toast({
        description:
          learnerMode === "ja"
            ? `${data.words.length}個の新しい単語を生成しました！`
            : `${data.words.length} kosakata baru dibuat.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: learnerMode === "ja" ? "エラー" : "Kesalahan",
        description: apiErrorMessage(error, learnerMode),
        variant: "destructive",
      });
    },
  });

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
        description:
          learnerMode === "ja"
            ? "お使いのブラウザは音声機能に対応していません"
            : "Browser Anda tidak mendukung suara.",
        variant: "destructive",
      });
      return;
    }

    if (learnerMode === "ja") {
      if (!isFlipped) speakIndonesian(currentWord.indonesian);
      else speakJapanese(currentWord.japanese);
    } else {
      if (!isFlipped) speakJapanese(currentWord.japanese);
      else speakIndonesian(currentWord.indonesian);
    }
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
            {learnerMode === "ja" ? "メニューへ戻る" : "Kembali ke menu"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">
                {learnerMode === "ja" ? "AI無限単語カード" : "Kartu kosakata AI (tanpa batas)"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {learnerMode === "ja"
                  ? "AIが無限に新しい単語を生成します"
                  : "AI membuat kosakata baru tanpa henti untuk latihan bahasa Jepang."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">{learnerMode === "ja" ? "テーマ" : "Tema"}</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {themeDisplay(t, learnerMode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">{learnerMode === "ja" ? "難易度" : "Tingkat kesulitan"}</Label>
                <Select 
                  value={difficulty.toString()} 
                  onValueChange={(v) => setDifficulty(Number(v))}
                >
                  <SelectTrigger id="difficulty" data-testid="select-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_VALUES.map((v) => (
                      <SelectItem key={v} value={v.toString()}>
                        {difficultyLabel(v, learnerMode)}
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
                    {learnerMode === "ja" ? "生成中..." : "Membuat..."}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {learnerMode === "ja" ? "単語を生成" : "Buat kosakata"}
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
        <h1 className="text-2xl font-bold text-foreground">
          {learnerMode === "ja" ? "AI単語カード" : "Kartu kosakata AI"}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" data-testid="badge-category">
            {currentWord.category}
          </Badge>
          <Badge variant="secondary">
            {learnerMode === "ja" ? "難易度" : "Kesulitan"} {currentWord.difficulty}/10
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {learnerMode === "ja"
            ? `${currentIndex + 1} / ${words.length} （次の単語は自動生成）`
            : `${currentIndex + 1} / ${words.length} • set berikutnya otomatis`}
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
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    {learnerMode === "ja" ? "インドネシア語" : "Bahasa Jepang"}
                  </p>
                  {learnerMode === "ja" ? (
                    <p className="text-4xl font-bold text-foreground" data-testid="text-indonesian">
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
                    <div className="text-lg text-muted-foreground space-y-0.5">
                      {jpReading.romaji ? (
                        <p className="text-sm sm:text-base tracking-wide font-medium">{jpReading.romaji}</p>
                      ) : null}
                      <p>
                        {jpReading.kana}（{jpReading.original}）
                      </p>
                    </div>
                  )}
                  {currentWord.pronunciation_guide && (
                    <p className="text-sm text-muted-foreground">
                      {learnerMode === "ja" ? "発音: " : "Panduan bunyi: "}
                      {currentWord.pronunciation_guide}
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
          disabled={currentIndex === 0}
          data-testid="button-previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleSpeak}
          title={learnerMode === "ja" ? "発音を聞く" : "Dengarkan pengucapan"}
          data-testid="button-speak"
        >
          <Volume2 className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(true)}
          title={learnerMode === "ja" ? "設定" : "Pengaturan"}
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
              {learnerMode === "ja" ? "生成中..." : "Membuat..."}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              {learnerMode === "ja" ? "新しい単語セットを生成" : "Buat set kosakata baru"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
