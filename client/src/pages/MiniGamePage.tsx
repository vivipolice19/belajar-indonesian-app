import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Trophy, Keyboard, Shuffle, ArrowLeft, Eye, EyeOff, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WORDS_DATA } from "@shared/types";
import { useLearner } from "@/hooks/useLearner";

type GameType = null | "typing" | "matching";
type MatchCard = { id: number; text: string; type: "indonesian" | "japanese"; matched: boolean };

export default function MiniGamePage() {
  const { mode: learnerMode } = useLearner();
  const [gameType, setGameType] = useState<GameType>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [typingWords, setTypingWords] = useState<typeof WORDS_DATA>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      handleGameEnd();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    if (gameType === "typing" && isPlaying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameType, isPlaying, currentWordIndex]);

  const handleGameEnd = () => {
    setIsPlaying(false);
    setGameComplete(true);
    toast({
      title: learnerMode === "ja" ? "ゲーム終了！" : "Permainan selesai!",
      description:
        learnerMode === "ja" ? `スコア: ${score}` : `Skor: ${score}`,
    });
  };

  const handleStartTyping = () => {
    const shuffled = [...WORDS_DATA].sort(() => Math.random() - 0.5);
    setTypingWords(shuffled);
    setCurrentWordIndex(0);
    setInputValue("");
    setCorrectCount(0);
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setGameComplete(false);
    setGameType("typing");
    setShowAnswer(false);
  };

  const handleStartMatching = () => {
    const selectedWords = [...WORDS_DATA].sort(() => Math.random() - 0.5).slice(0, 6);
    const cards: MatchCard[] = [];
    
    selectedWords.forEach((word, index) => {
      cards.push({
        id: index * 2,
        text: word.indonesian,
        type: "indonesian",
        matched: false,
      });
      cards.push({
        id: index * 2 + 1,
        text: word.japanese,
        type: "japanese",
        matched: false,
      });
    });
    
    setMatchCards(cards.sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setMatchedPairs(0);
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    setGameComplete(false);
    setGameType("matching");
  };

  const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const currentWord = typingWords[currentWordIndex];
    const ok =
      learnerMode === "ja"
        ? value.toLowerCase() === currentWord.indonesian.toLowerCase()
        : value.trim() === currentWord.japanese.trim();
    if (ok) {
      setScore((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
      toast({
        description: learnerMode === "ja" ? "正解！ +1" : "Benar! +1",
        duration: 1000,
      });
      
      if (currentWordIndex < typingWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setInputValue("");
        setShowAnswer(false);
      } else {
        handleGameEnd();
      }
    }
  };

  const handleCardClick = (cardId: number) => {
    if (!isPlaying || selectedCards.length >= 2) return;
    
    const card = matchCards.find(c => c.id === cardId);
    if (!card || card.matched || selectedCards.includes(cardId)) return;
    
    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);
    
    if (newSelected.length === 2) {
      const [first, second] = newSelected.map(id => matchCards.find(c => c.id === id)!);
      
      const firstWord = WORDS_DATA.find(w => 
        w.indonesian === first.text || w.japanese === first.text
      );
      const secondWord = WORDS_DATA.find(w => 
        w.indonesian === second.text || w.japanese === second.text
      );
      
      if (firstWord === secondWord && first.type !== second.type) {
        setTimeout(() => {
          setMatchCards(prev => prev.map(c => 
            c.id === first.id || c.id === second.id 
              ? { ...c, matched: true } 
              : c
          ));
          setScore((prev) => prev + 1);
          setMatchedPairs((prev) => prev + 1);
          setSelectedCards([]);
          
          if (matchedPairs + 1 === 6) {
            handleGameEnd();
          }
          
          toast({
            description: learnerMode === "ja" ? "正解！ +1" : "Benar! +1",
            duration: 1000,
          });
        }, 500);
      } else {
        setTimeout(() => {
          setSelectedCards([]);
          toast({
            description: learnerMode === "ja" ? "不正解" : "Salah",
            duration: 1000,
          });
        }, 1000);
      }
    }
  };

  const handleBackToMenu = () => {
    setGameType(null);
    setIsPlaying(false);
    setGameComplete(false);
    setScore(0);
    setShowAnswer(false);
  };

  const handleSkipWord = () => {
    if (currentWordIndex < typingWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setInputValue("");
      setShowAnswer(false);
      toast({
        description: learnerMode === "ja" ? "スキップしました" : "Dilewati",
        duration: 1000,
      });
    }
  };

  const toggleShowAnswer = () => {
    setShowAnswer((prev) => !prev);
  };

  const timePercentage = (timeLeft / 60) * 100;

  if (gameComplete) {
    return (
      <div className="p-4 space-y-6" data-testid="page-game-results">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToMenu}
          className="mb-2"
          data-testid="button-back-to-menu"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {learnerMode === "ja" ? "ゲーム選択に戻る" : "Kembali pilih permainan"}
        </Button>

        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {gameType === "typing"
              ? learnerMode === "ja"
                ? "タイピング完了！"
                : "Selesai mengetik!"
              : learnerMode === "ja"
                ? "ゲーム終了！"
                : "Permainan selesai!"}
          </h1>
          <div className="text-center space-y-2">
            <p className="text-4xl font-extrabold text-primary" data-testid="text-game-score">
              {score}
            </p>
            <p className="text-muted-foreground">
              {gameType === "typing"
                ? learnerMode === "ja"
                  ? "正解数"
                  : "Jawaban benar"
                : learnerMode === "ja"
                  ? "マッチング数"
                  : "Pasangan"}
            </p>
          </div>
        </div>

        <Button
          onClick={gameType === "typing" ? handleStartTyping : handleStartMatching}
          size="lg"
          className="w-full"
          data-testid="button-play-again"
        >
          {learnerMode === "ja" ? "もう一度プレイ" : "Main lagi"}
        </Button>
      </div>
    );
  }

  if (!gameType) {
    return (
      <div className="p-4 space-y-6" data-testid="page-game-select">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {learnerMode === "ja" ? "学習ゲーム" : "Permainan belajar"}
          </h1>
          <p className="text-muted-foreground">
            {learnerMode === "ja"
              ? "楽しみながらインドネシア語を学習しよう！"
              : "Belajar bahasa Jepang sambil bermain!"}
          </p>
        </div>

        <div className="space-y-4">
          <Card
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={handleStartTyping}
            data-testid="card-typing-game"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-chart-2/20 flex items-center justify-center">
                  <Keyboard className="w-8 h-8 text-chart-2" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {learnerMode === "ja" ? "タイピングゲーム" : "Ketik jawaban"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {learnerMode === "ja"
                      ? "日本語の意味を見て、インドネシア語を入力しよう"
                      : "Lihat bahasa Indonesia, ketik kosakata bahasa Jepang yang benar."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {learnerMode === "ja" ? "制限時間: 60秒" : "Batas waktu: 60 detik"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={handleStartMatching}
            data-testid="card-matching-game"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-chart-4/20 flex items-center justify-center">
                  <Shuffle className="w-8 h-8 text-chart-4" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {learnerMode === "ja" ? "マッチングゲーム" : "Cocokkan pasangan"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {learnerMode === "ja"
                      ? "インドネシア語と日本語の意味をペアにしよう"
                      : "Pasangkan arti bahasa Indonesia dan Jepang."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {learnerMode === "ja" ? "6組のペアを見つけよう" : "Temukan 6 pasang"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameType === "typing" && isPlaying) {
    const currentWord = typingWords[currentWordIndex];
    
    return (
      <div className="p-4 space-y-6" data-testid="page-typing-game">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {learnerMode === "ja" ? "タイピングゲーム" : "Ketik jawaban"}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMenu}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {learnerMode === "ja" ? "戻る" : "Kembali"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                {learnerMode === "ja" ? "残り時間" : "Sisa waktu"}
              </span>
              <span className="text-2xl font-bold text-foreground" data-testid="text-time-left">
                {learnerMode === "ja" ? `${timeLeft}秒` : `${timeLeft} dtk`}
              </span>
            </div>
            <Progress value={timePercentage} className="h-3" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              {learnerMode === "ja" ? "日本語の意味" : "Bahasa Indonesia"}
            </p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-japanese-prompt">
              {learnerMode === "ja" ? currentWord?.japanese : currentWord?.indonesian}
            </p>
            {showAnswer && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">
                  {learnerMode === "ja" ? "答え" : "Jawaban"}
                </p>
                <p className="text-2xl font-bold text-primary" data-testid="text-answer-display">
                  {learnerMode === "ja" ? currentWord?.indonesian : currentWord?.japanese}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {learnerMode === "ja"
                ? "インドネシア語を入力してください"
                : "Ketik kosakata bahasa Jepang yang benar"}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={toggleShowAnswer}
            className="flex-1"
            data-testid="button-toggle-answer"
          >
            {showAnswer ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                {learnerMode === "ja" ? "答えを隠す" : "Sembunyikan jawaban"}
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                {learnerMode === "ja" ? "答えを見る" : "Lihat jawaban"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSkipWord}
            disabled={currentWordIndex >= typingWords.length - 1}
            data-testid="button-skip"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            {learnerMode === "ja" ? "スキップ" : "Lewati"}
          </Button>
        </div>

        <div className="space-y-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleTypingInput}
            placeholder={learnerMode === "ja" ? "ここに入力..." : "Ketik di sini..."}
            className="text-center text-2xl h-14"
            data-testid="input-typing"
          />
          <p className="text-xs text-center text-muted-foreground">
            {learnerMode === "ja"
              ? "ヒント: 小文字で入力してください"
              : "Tips: untuk Indonesia gunakan huruf kecil; bahasa Jepang sesuai teks."}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {learnerMode === "ja" ? "正解数" : "Jawaban benar"}
            </p>
            <p className="text-4xl font-extrabold text-primary" data-testid="text-typing-score">
              {correctCount} / {typingWords.length}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameType === "matching" && isPlaying) {
    return (
      <div className="p-4 space-y-6" data-testid="page-matching-game">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {learnerMode === "ja" ? "マッチングゲーム" : "Cocokkan pasangan"}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMenu}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {learnerMode === "ja" ? "戻る" : "Kembali"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                {learnerMode === "ja" ? "残り時間" : "Sisa waktu"}
              </span>
              <span className="text-2xl font-bold text-foreground" data-testid="text-time-left">
                {learnerMode === "ja" ? `${timeLeft}秒` : `${timeLeft} dtk`}
              </span>
            </div>
            <Progress value={timePercentage} className="h-3" />
          </CardContent>
        </Card>

        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            {learnerMode === "ja" ? "マッチング数" : "Pasangan"}
          </p>
          <p className="text-3xl font-bold text-primary" data-testid="text-matching-score">
            {matchedPairs} / 6
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {matchCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.matched}
              className={`p-4 rounded-lg font-semibold text-center transition-all min-h-[80px] flex items-center justify-center ${
                card.matched
                  ? "bg-success/20 text-success border-2 border-success/50"
                  : selectedCards.includes(card.id)
                  ? "bg-primary/30 text-primary border-2 border-primary scale-95"
                  : card.type === "indonesian"
                  ? "bg-chart-2/20 text-foreground hover-elevate active-elevate-2"
                  : "bg-chart-4/20 text-foreground hover-elevate active-elevate-2"
              }`}
              data-testid={`match-card-${card.id}`}
            >
              <span className={card.text.length > 10 ? "text-sm" : "text-base"}>
                {card.text}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {learnerMode === "ja"
            ? "同じ意味のカードを2枚選んでペアにしよう"
            : "Pilih dua kartu artinya sama untuk memasangkan."}
        </p>
      </div>
    );
  }

  return null;
}
