import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MascotIcon } from "@/components/MascotIcon";
import { BookOpen, Brain, Gamepad2, Languages, Sparkles, MessageSquare } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  const aiCards = [
    {
      title: "AI無限単語カード",
      description: "AIが無限に新しい単語を生成",
      icon: Sparkles,
      path: "/ai-cards",
      color: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "AI無限文章学習",
      description: "シチュエーション別に文章を自動生成",
      icon: MessageSquare,
      path: "/ai-sentences",
      color: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "AI高度翻訳",
      description: "文法解説・用例付きの本格翻訳",
      icon: Languages,
      path: "/ai-translate",
      color: "bg-gradient-to-br from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-600 dark:text-green-400",
    },
  ];

  const actionCards = [
    {
      title: "単語カード練習",
      description: "基本150語をフラッシュカードで学習",
      icon: BookOpen,
      path: "/cards",
      color: "bg-chart-3/10 hover:bg-chart-3/20",
      iconColor: "text-chart-3",
    },
    {
      title: "クイズに挑戦",
      description: "4択クイズで理解度チェック",
      icon: Brain,
      path: "/quiz",
      color: "bg-chart-2/10 hover:bg-chart-2/20",
      iconColor: "text-chart-2",
    },
    {
      title: "学習ゲーム",
      description: "タイピング・マッチングゲームで楽しく学習",
      icon: Gamepad2,
      path: "/game",
      color: "bg-chart-4/10 hover:bg-chart-4/20",
      iconColor: "text-chart-4",
    },
  ];

  return (
    <div className="p-4 space-y-6" data-testid="page-home">
      <div className="flex flex-col items-center py-6 space-y-3">
        <MascotIcon size="lg" expression="happy" />
        <h1 className="text-2xl font-bold text-foreground">
          Selamat datang!
        </h1>
        <p className="text-muted-foreground text-center">
          今日も一緒にインドネシア語を学びましょう！
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-bold text-foreground">
            AI学習（無限コンテンツ）
          </h2>
        </div>
        {aiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${card.color}`}
              onClick={() => setLocation(card.path)}
              data-testid={`card-ai-${card.title}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-card ${card.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground px-1">
          基本学習
        </h2>
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${card.color}`}
              onClick={() => setLocation(card.path)}
              data-testid={`card-action-${card.title}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-card ${card.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
