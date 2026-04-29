import { useMemo, useState } from "react";
import { ArrowLeft, Volume2, Search, Square } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { WORDS_DATA, SENTENCES_DATA } from "@shared/types";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useLearner } from "@/hooks/useLearner";
import { useJapaneseReading } from "@/hooks/useJapaneseReading";
import { JapaneseLearnerReading } from "@/components/JapaneseLearnerReading";

export default function TranslatePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{ type: 'word' | 'sentence'; id: number; indonesian: string; japanese: string; category?: string }[]>([]);
  const [speechRate, setSpeechRate] = useState<"0.8" | "0.95" | "1.1">("0.95");
  const { toast } = useToast();
  const { speak, isSupported: isSpeechSupported, cancel, speakByPhrases } = useSpeechSynthesis();
  const { mode: learnerMode } = useLearner();

  const numericRate = useMemo(() => Number(speechRate), [speechRate]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    const wordMatches = WORDS_DATA
      .filter(word => word.japanese.toLowerCase().includes(query))
      .map(word => ({
        type: 'word' as const,
        id: word.id,
        indonesian: word.indonesian,
        japanese: word.japanese,
        category: word.category,
      }));

    const sentenceMatches = SENTENCES_DATA
      .filter(sentence => sentence.japanese.toLowerCase().includes(query))
      .map(sentence => ({
        type: 'sentence' as const,
        id: sentence.id,
        indonesian: sentence.indonesian,
        japanese: sentence.japanese,
        category: sentence.category,
      }));

    const allResults = [...wordMatches, ...sentenceMatches];
    setResults(allResults);

    if (allResults.length === 0) {
      toast({
        description: "該当する結果が見つかりませんでした",
      });
    }
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
    return <JapaneseLearnerReading reading={reading} kanaClassName="text-base font-medium" />;
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto px-4 pb-4 max-w-2xl">
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
          <CardTitle className="text-2xl font-bold text-center">
            日本語→インドネシア語翻訳
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            日本語を入力すると、学習した単語・文章から検索します
          </p>
          
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="日本語を入力してください（例：こんにちは、ありがとう）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              data-testid="input-search"
            />
            <Button 
              onClick={handleSearch}
              className="gap-2"
              data-testid="button-search"
            >
              <Search className="w-4 h-4" />
              検索
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
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
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            検索結果: {results.length}件
          </h3>
          
          {results.map((result, index) => (
            <Card 
              key={`${result.type}-${result.id}-${index}`}
              className="hover-elevate"
              data-testid={`result-${result.type}-${result.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={result.type === 'word' ? 'default' : 'secondary'}>
                        {result.type === 'word' ? '単語' : '文章'}
                      </Badge>
                      {result.category && (
                        <Badge variant="outline">
                          {result.category}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">日本語</p>
                        <p className="text-base" data-testid={`text-japanese-${result.id}`}>
                          <JapaneseAssistText text={result.japanese} />
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">インドネシア語</p>
                        <p className="text-lg font-semibold text-primary" data-testid={`text-indonesian-${result.id}`}>
                          {result.indonesian}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 min-w-[120px]">
                    {learnerMode === "id" ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">日本語</span>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => pronounceText(result.japanese, "ja-JP")}
                            title="日本語で読み上げ"
                            data-testid={`button-pronounce-ja-${result.id}`}
                          >
                            <Volume2 className="w-5 h-5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pronounceByPhrases(result.japanese, "ja-JP")}
                            title="日本語を文ごとに読み上げ"
                            data-testid={`button-pronounce-phrases-ja-${result.id}`}
                          >
                            文ごと
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">インドネシア語</span>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => pronounceText(result.indonesian, "id-ID")}
                          title="発音を聞く"
                          data-testid={`button-pronounce-${result.id}`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pronounceByPhrases(result.indonesian, "id-ID")}
                          title="文ごとに読み上げ"
                          data-testid={`button-pronounce-phrases-${result.id}`}
                        >
                          文ごと
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchQuery && results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              「{searchQuery}」に該当する単語・文章が見つかりませんでした
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              別のキーワードで検索してみてください
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
