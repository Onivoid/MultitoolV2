import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranslationLanguageToggleProps {
  settingsEN: boolean;
  loading: boolean;
  disabled: boolean;
  onChange: (settingsEN: boolean) => void;
}

export function TranslationLanguageToggle({
  settingsEN,
  loading,
  disabled,
  onChange,
}: TranslationLanguageToggleProps) {
  return (
    <div className="space-y-1.5" data-no-window-drag>
      <p className="text-sm font-medium">Langue des paramètres du jeu</p>
      <p className="text-xs text-muted-foreground">
        Détermine la langue des paramètres du jeu
      </p>

      {loading ? (
        <div className="flex h-9 items-center justify-center rounded-md border border-primary/12 bg-primary/5">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div
          className="grid grid-cols-2 gap-0.5 rounded-md border border-primary/12 bg-primary/5 p-0.5"
          data-no-window-drag
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            data-no-window-drag
            className={cn(
              "h-8 rounded-sm text-xs font-medium shadow-none",
              !settingsEN
                ? "bg-primary/25 text-foreground hover:bg-primary/25"
                : "text-muted-foreground hover:bg-primary/10",
            )}
            onClick={() => onChange(false)}
          >
            Français
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            data-no-window-drag
            className={cn(
              "h-8 rounded-sm text-xs font-medium shadow-none",
              settingsEN
                ? "bg-primary/25 text-foreground hover:bg-primary/25"
                : "text-muted-foreground hover:bg-primary/10",
            )}
            onClick={() => onChange(true)}
          >
            Anglais
          </Button>
        </div>
      )}
    </div>
  );
}
