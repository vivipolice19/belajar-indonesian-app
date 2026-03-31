import { MascotIcon } from "./MascotIcon";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-card-border shadow-sm safe-area-inset-top">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0">
            <MascotIcon size="sm" expression="happy" data-testid="mascot-icon" />
          </div>
          
          <h1 className="text-xl font-bold text-foreground">
            Belajar
          </h1>
          
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
