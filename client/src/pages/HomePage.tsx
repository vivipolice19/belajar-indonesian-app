import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MascotIcon } from "@/components/MascotIcon";
import { BookOpen, Brain, Gamepad2, Languages, Sparkles, MessageSquare } from "lucide-react";
import { useLearner } from "@/hooks/useLearner";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { mode } = useLearner();

  const aiCards = [
    {
      titleJa: "AI無限単語カード",
      titleId: "Kartu kosakata AI (tanpa batas)",
      descriptionJa: "AIが無限に新しい単語を生成",
      descriptionId: "AI membuat kosakata baru tanpa henti",
      icon: Sparkles,
      path: "/ai-cards",
      color: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      titleJa: "AI無限文章学習",
      titleId: "Belajar kalimat AI (tanpa batas)",
      descriptionJa: "シチュエーション別に文章を自動生成",
      descriptionId: "AI membuat kalimat sesuai situasi",
      icon: MessageSquare,
      path: "/ai-sentences",
      color: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      titleJa: "AI高度翻訳",
      titleId: "Terjemahan AI tingkat lanjut",
      descriptionJa: "文法解説・用例付きの本格翻訳",
      descriptionId: "Terjemahan dengan penjelasan tata bahasa & contoh",
      icon: Languages,
      path: "/ai-translate",
      color: "bg-gradient-to-br from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-600 dark:text-green-400",
    },
  ];

  const actionCards = [
    {
      titleJa: "単語カード練習",
      titleId: "Latihan kartu kosakata",
      descriptionJa: "基本150語をフラッシュカードで学習",
      descriptionId: "150 kosakata dasar dengan kartu kilat",
      icon: BookOpen,
      path: "/cards",
      color: "bg-chart-3/10 hover:bg-chart-3/20",
      iconColor: "text-chart-3",
    },
    {
      titleJa: "クイズに挑戦",
      titleId: "Kuis pilihan ganda",
      descriptionJa: "4択クイズで理解度チェック",
      descriptionId: "Cek pemahaman dengan kuis 4 pilihan",
      icon: Brain,
      path: "/quiz",
      color: "bg-chart-2/10 hover:bg-chart-2/20",
      iconColor: "text-chart-2",
    },
    {
      titleJa: "学習ゲーム",
      titleId: "Game belajar",
      descriptionJa: "タイピング・マッチングゲームで楽しく学習",
      descriptionId: "Belajar dengan mengetik & mencocokkan",
      icon: Gamepad2,
      path: "/game",
      color: "bg-chart-4/10 hover:bg-chart-4/20",
      iconColor: "text-chart-4",
    },
  ];

  const aiSectionTitle = mode === "ja" ? "AI学習（無限コンテンツ）" : "Belajar AI (konten tak terbatas)";
  const basicSectionTitle = mode === "ja" ? "基本学習" : "Belajar dasar";

  return (
    <div className="p-4 space-y-6" data-testid="page-home">
      <div className="flex flex-col items-center py-6 space-y-3">
        <MascotIcon size="lg" expression="happy" />
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "ja" ? "Selamat datang!" : "Selamat datang! / ようこそ！"}
        </h1>
        <p className="text-muted-foreground text-center">
          {mode === "ja"
            ? "今日も一緒にインドネシア語を学びましょう！"
            : "今日は日本語を学びましょう！ / Ayo belajar bahasa Jepang hari ini!"}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-bold text-foreground">{aiSectionTitle}</h2>
        </div>
        {aiCards.map((card) => {
          const Icon = card.icon;
          const title = mode === "ja" ? card.titleJa : card.titleId;
          const description = mode === "ja" ? card.descriptionJa : card.descriptionId;
          return (
            <Card
              key={card.path}
              className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${card.color}`}
              onClick={() => setLocation(card.path)}
              data-testid={`card-ai-${card.path}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-card ${card.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground px-1">{basicSectionTitle}</h2>
        {actionCards.map((card) => {
          const Icon = card.icon;
          const title = mode === "ja" ? card.titleJa : card.titleId;
          const description = mode === "ja" ? card.descriptionJa : card.descriptionId;
          return (
            <Card
              key={card.path}
              className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${card.color}`}
              onClick={() => setLocation(card.path)}
              data-testid={`card-action-${card.path}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-card ${card.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
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
