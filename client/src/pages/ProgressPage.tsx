import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useToast } from "@/hooks/use-toast";
import { useLearner } from "@/hooks/useLearner";
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
  const { mode: learnerMode } = useLearner();

  const handleResetProgress = () => {
    resetProgress();
    toast({
      title: learnerMode === "ja" ? "リセット完了" : "Penyetelan selesai",
      description:
        learnerMode === "ja"
          ? "すべての学習記録がリセットされました"
          : "Semua riwayat belajar telah dihapus.",
    });
  };

  const stats = [
    {
      icon: BookOpen,
      labelJa: "学習した単語",
      labelId: "Kosakata yang dipelajari",
      value: progress.wordsLearned.length,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      icon: MessageSquare,
      labelJa: "学習した文章",
      labelId: "Kalimat yang dipelajari",
      value: progress.sentencesLearned.length,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      icon: CheckCircle2,
      labelJa: "クイズ完了数",
      labelId: "Kuis selesai",
      value: progress.quizzesCompleted,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  return (
    <div className="p-4 space-y-6" data-testid="page-progress">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {learnerMode === "ja" ? "学習の進捗" : "Kemajuan belajar"}
        </h1>
        <p className="text-muted-foreground">
          {learnerMode === "ja" ? "あなたの学習記録を確認しよう" : "Lihat catatan belajar Anda"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const label = learnerMode === "ja" ? stat.labelJa : stat.labelId;
          return (
            <Card key={stat.labelJa}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.labelJa}`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {label}
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
          <CardTitle className="text-lg">
            {learnerMode === "ja" ? "学習履歴" : "Riwayat"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {learnerMode === "ja" ? "発音練習した単語" : "Kosakata latihan pengucapan"}
            </span>
            <span className="font-semibold" data-testid="text-words-pronounced">
              {progress.wordsPronounced.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {learnerMode === "ja" ? "発音練習した文章" : "Kalimat latihan pengucapan"}
            </span>
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
        {learnerMode === "ja" ? "プロジェクトをZIPでダウンロード" : "Unduh proyek (ZIP)"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
            data-testid="button-reset-progress"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {learnerMode === "ja" ? "進捗をリセット" : "Atur ulang kemajuan"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {learnerMode === "ja" ? "進捗をリセットしますか？" : "Atur ulang kemajuan?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {learnerMode === "ja"
                ? "この操作は取り消せません。すべての学習記録が削除されます。"
                : "Tindakan ini tidak bisa dibatalkan. Semua catatan akan dihapus."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel">
              {learnerMode === "ja" ? "キャンセル" : "Batal"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetProgress}
              data-testid="button-confirm"
            >
              {learnerMode === "ja" ? "リセット" : "Atur ulang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
