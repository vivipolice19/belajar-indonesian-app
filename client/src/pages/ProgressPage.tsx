import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle2, Download, MessageSquare, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProgressPage() {
  const { progress, resetProgress } = useGameProgress();
  const { toast } = useToast();

  const handleResetProgress = () => {
    resetProgress();
    toast({
      title: "リセット完了",
      description: "すべての学習記録がリセットされました",
    });
  };

  const stats = [
    {
      icon: BookOpen,
      label: "学習した単語",
      value: progress.wordsLearned.length,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      icon: MessageSquare,
      label: "学習した文章",
      value: progress.sentencesLearned.length,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      icon: CheckCircle2,
      label: "クイズ完了数",
      value: progress.quizzesCompleted,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  return (
    <div className="p-4 space-y-6" data-testid="page-progress">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">学習の進捗</h1>
        <p className="text-muted-foreground">あなたの学習記録を確認しよう</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.label}`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">学習履歴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">発音練習した単語</span>
            <span className="font-semibold" data-testid="text-words-pronounced">
              {progress.wordsPronounced.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">発音練習した文章</span>
            <span className="font-semibold" data-testid="text-sentences-pronounced">
              {progress.sentencesPronounced.length}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        data-testid="button-download-project"
        onClick={() => {
          const a = document.createElement("a");
          a.href = "/api/download/project";
          a.download = "belajar-indonesian-app.zip";
          a.click();
        }}
      >
        <Download className="w-4 h-4 mr-2" />
        プロジェクトをZIPでダウンロード
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
            data-testid="button-reset-progress"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            進捗をリセット
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>進捗をリセットしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。すべての学習記録が削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetProgress}
              data-testid="button-confirm"
            >
              リセット
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
