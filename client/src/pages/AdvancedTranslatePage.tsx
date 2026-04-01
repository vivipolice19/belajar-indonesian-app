import { useMemo, useState } from "react";
import { ArrowLeft, Volume2, Languages, Loader2, ArrowLeftRight, Square } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, apiErrorMessage } from "@/lib/queryClient";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useLearner } from "@/hooks/useLearner";
import { useJapaneseReading } from "@/hooks/useJapaneseReading";
import { JapaneseLearnerReading } from "@/components/JapaneseLearnerReading";

interface TranslationResult {
  indonesian: string;
  japanese: string;
  grammar_explanation: string;
  usage_examples: Array<{
    indonesian: string;
    japanese: string;
  }>;
  pronunciation_guide: string;
  formality_level: string;
}

export default function AdvancedTranslatePage() {
  const [, setLocation] = useLocation();
  const [inputText, setInputText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<"japanese" | "indonesian">("japanese");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [speechRate, setSpeechRate] = useState<"0.8" | "0.95" | "1.1">("0.95");
  const { toast } = useToast();
  const { speak, isSupported: isSpeechSupported, cancel, speakByPhrases } = useSpeechSynthesis();
  const { mode: learnerMode } = useLearner();

  const numericRate = useMemo(() => Number(speechRate), [speechRate]);

  const translateMutation = useMutation({
    mutationFn: async ({
      text,
      sourceLanguage,
    }: {
      text: string;
      sourceLanguage: "japanese" | "indonesian";
    }) => {
      const response = await apiRequest("POST", "/api/translate/advanced", {
        text,
        sourceLanguage,
        learnerMode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        description: "翻訳が完了しました！",
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

  const handleTranslate = () => {
    if (!inputText.trim()) {
      toast({
        description: "テキストを入力してください",
        variant: "destructive",
      });
      return;
    }

    translateMutation.mutate({ text: inputText, sourceLanguage });
  };

  const handleSwapLanguage = () => {
    setSourceLanguage(sourceLanguage === "japanese" ? "indonesian" : "japanese");
    setInputText("");
    setResult(null);
    cancel();
  };

  const pronounceText = (text: string, lang: "id-ID" | "ja-JP") => {
    if (!isSpeechSupported) {
      toast({
        description: "お使いのブラウザは音声機能に対応していません",
        variant: "destructive",
      });
      return;
    }
    
    speak(text, lang, numericRate);
  };

  const pronounceByPhrases = (text: string, lang: "id-ID" | "ja-JP") => {
    if (!isSpeechSupported) {
      toast({
        description: "お使いのブラウザは音声機能に対応していません",
        variant: "destructive",
      });
      return;
    }
    speakByPhrases(text, { lang, rate: numericRate });
  };

  function JapaneseAssistText({ text }: { text: string }) {
    const reading = useJapaneseReading(text, learnerMode === "id");
    if (learnerMode !== "id") return <>{text}</>;
    return <JapaneseLearnerReading reading={reading} kanaClassName="text-xl font-semibold text-primary" />;
  }

  return (
    <div className="container mx-auto px-4 pb-4 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          メニューへ戻る
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Languages className="w-6 h-6" />
            AI高度翻訳
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Badge variant={sourceLanguage === "japanese" ? "default" : "outline"}>
              日本語
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapLanguage}
              data-testid="button-swap"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
            <Badge variant={sourceLanguage === "indonesian" ? "default" : "outline"}>
              インドネシア語
            </Badge>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            文法解説・用例・発音ガイド付きの高度な翻訳
          </p>
          
          <Textarea
            placeholder={sourceLanguage === "japanese" 
              ? "日本語のテキストを入力してください..." 
              : "Masukkan teks bahasa Indonesia..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[120px]"
            data-testid="input-translate"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">読み上げ速度</span>
              <Select value={speechRate} onValueChange={(v) => setSpeechRate(v as any)}>
                <SelectTrigger className="w-[140px]" data-testid="select-speech-rate">
                  <SelectValue placeholder="速度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.8">ゆっくり</SelectItem>
                  <SelectItem value="0.95">ふつう</SelectItem>
                  <SelectItem value="1.1">はやい</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              className="gap-2"
              data-testid="button-speech-stop"
            >
              <Square className="w-4 h-4" />
              停止
            </Button>
          </div>

          <Button 
            onClick={handleTranslate}
            disabled={translateMutation.isPending || !inputText.trim()}
            className="w-full"
            data-testid="button-translate"
          >
            {translateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                翻訳中...
              </>
            ) : (
              <>
                <Languages className="w-4 h-4 mr-2" />
                翻訳
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">翻訳結果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">インドネシア語</p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => pronounceText(result.indonesian, "id-ID")}
                      data-testid="button-pronounce-indonesian"
                      title="読み上げ"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => pronounceByPhrases(result.indonesian, "id-ID")}
                      data-testid="button-pronounce-indonesian-phrases"
                      title="文ごとに読み上げ"
                    >
                      文ごと
                    </Button>
                  </div>
                </div>
                <p className="text-xl font-semibold text-foreground" data-testid="text-indonesian">
                  {result.indonesian}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">日本語</p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => pronounceText(result.japanese, "ja-JP")}
                      data-testid="button-pronounce-japanese"
                      title="読み上げ"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => pronounceByPhrases(result.japanese, "ja-JP")}
                      data-testid="button-pronounce-japanese-phrases"
                      title="文ごとに読み上げ"
                    >
                      文ごと
                    </Button>
                  </div>
                </div>
                <p className="text-xl font-semibold text-primary" data-testid="text-japanese">
                  <JapaneseAssistText text={result.japanese} />
                </p>
              </div>

              <div className="flex gap-2">
                <Badge variant="secondary" data-testid="badge-formality">
                  {result.formality_level}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {learnerMode === "ja" ? "文法解説" : "Penjelasan tata bahasa"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line" data-testid="text-grammar">
                {result.grammar_explanation}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {learnerMode === "ja" ? "発音ガイド" : "Panduan pengucapan"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed" data-testid="text-pronunciation">
                {result.pronunciation_guide}
              </p>
            </CardContent>
          </Card>

          {result.usage_examples && result.usage_examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {learnerMode === "ja" ? "用例" : "Contoh"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.usage_examples.map((example, index) => (
                  <div key={index} className="space-y-2 pb-4 border-b last:border-b-0" data-testid={`example-${index}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{example.indonesian}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => pronounceText(example.indonesian, "id-ID")}
                          data-testid={`button-pronounce-example-${index}`}
                          title="読み上げ"
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => pronounceByPhrases(example.indonesian, "id-ID")}
                          data-testid={`button-pronounce-example-phrases-${index}`}
                          title="文ごとに読み上げ"
                        >
                          文ごと
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        <JapaneseAssistText text={example.japanese} />
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => pronounceText(example.japanese, "ja-JP")}
                          data-testid={`button-pronounce-example-japanese-${index}`}
                          title="読み上げ"
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
