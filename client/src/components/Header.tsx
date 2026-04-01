import { MascotIcon } from "./MascotIcon";
import { ThemeToggle } from "./ThemeToggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLearner } from "@/hooks/useLearner";

export function Header() {
  const { mode, setMode } = useLearner();
  const targetLabel = mode === "ja" ? "学習: インドネシア語" : "Belajar: Bahasa Jepang";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-card-border shadow-sm safe-area-inset-top">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0">
            <MascotIcon size="sm" expression="happy" data-testid="mascot-icon" />
          </div>
          
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground leading-none">
              Belajar
            </h1>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => {
                if (v === "ja" || v === "id") setMode(v);
              }}
              className="h-8"
              data-testid="toggle-learner"
            >
              <ToggleGroupItem value="ja" className="h-8 px-2 text-xs">
                日本語話者
              </ToggleGroupItem>
              <ToggleGroupItem value="id" className="h-8 px-2 text-xs">
                Penutur ID
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-[10px] text-muted-foreground leading-none">{targetLabel}</p>
          </div>
          
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
