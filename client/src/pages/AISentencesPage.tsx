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
import { difficultyLabel, situationDisplay } from "@/lib/bilingualLabels";

interface AISentence {
  indonesian: string;
  japanese: string;
  category: string;
  difficulty: number;
  context?: string;
}

const SITUATIONS = [
  "日常会話", "自己紹介", "挨拶", "飲食", "買い物", "質問",
  "旅行", "ホテル", "空港", "交通機関", "病院", "銀行",
  "郵便局", "レストラン", "カフェ", "ビジネス", "電話", "約束"
];

const DIFFICULTY_VALUES = [1, 3, 5, 7, 9] as const;

export default function AISentencesPage() {
  const [, setLocation] = useLocation();
  const [sentences, setSentences] = useState<AISentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [situation, setSituation] = useState("日常会話");
  const [difficulty, setDifficulty] = useState(3);
  const [showSettings, setShowSettings] = useState(true);
  const { toast } = useToast();
  const { mode: learnerMode } = useLearner();
  const { speakIndonesian, speakJapanese, isSupported: isSpeechSupported } = useSpeechSynthesis();
  const currentSentence = sentences[currentIndex];
  const jpReading = useJapaneseReading(
    currentSentence?.japanese || "",
    learnerMode === "id" && !!currentSentence,
  );

  const generateMutation = useMutation({
    mutationFn: async ({
      situation,
      difficulty,
    }: {
      situation: string;
      difficulty: number;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/generate/sentences",
        {
          situation,
          difficulty,
          count: 10,
          learnerMode,
        },
        { retries: 2, retryDelayMs: 900 },
      );
      return response.json();
    },
    onSuccess: (data) => {
      setSentences(data.sentences);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowSettings(false);
      toast({
        description:
          learnerMode === "ja"
            ? `${data.sentences.length}個の新しい文章を生成しました！`
            : `${data.sentences.length} kalimat baru dibuat.`,
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
    generateMutation.mutate({ situation, difficulty });
  };

  const handleCardClick = () => {
    if (!currentSentence) return;
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSentence) return;
    
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
      speakIndonesian(currentSentence.indonesian);
    } else {
      speakJapanese(currentSentence.japanese);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      handleGenerate();
    }
  };

  if (showSettings || sentences.length === 0) {
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
                {learnerMode === "ja" ? "AI無限文章学習" : "Kalimat AI tanpa batas"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {learnerMode === "ja"
                  ? "AIが無限に新しい文章を生成します"
                  : "AI membuat kalimat latihan bahasa Jepang baru secara terus-menerus."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="situation">
                  {learnerMode === "ja" ? "シチュエーション" : "Situasi"}
                </Label>
                <Select value={situation} onValueChange={setSituation}>
                  <SelectTrigger id="situation" data-testid="select-situation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITUATIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {situationDisplay(s, learnerMode)}
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
                    {learnerMode === "ja" ? "文章を生成" : "Buat kalimat"}
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
    <div className="p-4 space-y-6" data-testid="page-ai-sentences">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {learnerMode === "ja" ? "AI文章学習" : "Belajar kalimat AI"}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" data-testid="badge-category">
            {currentSentence.category}
          </Badge>
          <Badge variant="secondary">
            {learnerMode === "ja" ? "難易度" : "Kesulitan"} {currentSentence.difficulty}/10
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {learnerMode === "ja"
            ? `${currentIndex + 1} / ${sentences.length} （次の文章は自動生成）`
            : `${currentIndex + 1} / ${sentences.length} • set berikutnya otomatis`}
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
                    <div data-testid="text-japanese-sentence" className="w-full">
                      <JapaneseLearnerReading
                        reading={jpReading}
                        kanaClassName="text-2xl font-bold text-foreground leading-relaxed"
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
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    {learnerMode === "ja" ? "日本語訳" : "Bahasa Indonesia"}
                  </p>
                  {learnerMode === "ja" ? (
                    <p
                      className="text-2xl font-bold text-primary leading-relaxed"
                      data-testid="text-japanese-sentence"
                    >
                      {currentSentence.japanese}
                    </p>
                  ) : (
                    <p
                      className="text-2xl font-bold text-primary leading-relaxed"
                      data-testid="text-indonesian-sentence"
                    >
                      {currentSentence.indonesian}
                    </p>
                  )}
                </div>
                <div className="text-center space-y-1 w-full">
                  {learnerMode === "ja" ? (
                    <p className="text-base text-muted-foreground">{currentSentence.indonesian}</p>
                  ) : (
                    <div className="text-base text-muted-foreground space-y-0.5">
                      {jpReading.romaji ? (
                        <p className="text-sm sm:text-base tracking-wide font-medium">{jpReading.romaji}</p>
                      ) : null}
                      <p className="leading-relaxed">
                        {jpReading.kana}（{jpReading.original}）
                      </p>
                    </div>
                  )}
                  {currentSentence.context && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {learnerMode === "ja" ? "使用場面: " : "Konteks: "}
                      {currentSentence.context}
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
              {learnerMode === "ja" ? "新しい文章セットを生成" : "Buat set kalimat baru"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
