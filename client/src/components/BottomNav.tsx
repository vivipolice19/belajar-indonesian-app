import { Link, useLocation } from "wouter";
import { Home, BookOpen, BookText, Gamepad2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLearner } from "@/hooks/useLearner";

interface NavItem {
  path: string;
  icon: typeof Home;
  labelJa: string;
  labelId: string;
}

const navItems: NavItem[] = [
  { path: "/", icon: Home, labelJa: "ホーム", labelId: "Beranda" },
  { path: "/cards", icon: BookOpen, labelJa: "単語", labelId: "Kosakata" },
  { path: "/sentences", icon: BookText, labelJa: "文章", labelId: "Kalimat" },
  { path: "/game", icon: Gamepad2, labelJa: "ゲーム", labelId: "Game" },
  { path: "/progress", icon: TrendingUp, labelJa: "進捗", labelId: "Progres" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { mode } = useLearner();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-card-border shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          const label = mode === "ja" ? item.labelJa : item.labelId;
          
          return (
            <Link key={item.path} href={item.path} data-testid={`link-nav-${label}`}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-h-11 hover-elevate active-elevate-2",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
