import { Timer, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HangarTerminalPreset } from "@/features/hangar-exec/hangarExec.types";
import { formatCountdown } from "@/features/hangar-exec/hangarExec.lib";
import { cn } from "@/lib/utils";

interface HangarTerminalCardProps {
  terminal: HangarTerminalPreset;
  secondsRemaining: number | null;
  onStart: () => void;
}

export function HangarTerminalCard({
  terminal,
  secondsRemaining,
  onStart,
}: HangarTerminalCardProps) {
  const active = secondsRemaining != null && secondsRemaining > 0;

  return (
    <article className="settings-section flex flex-col gap-3 p-3" data-no-window-drag>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{terminal.location}</p>
          <h3 className="text-sm font-semibold">{terminal.label}</h3>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          30 min
        </Badge>
      </div>

      <div
        className={cn(
          "flex items-center justify-between rounded-md border px-3 py-2",
          active
            ? "border-primary/30 bg-primary/10"
            : "border-border/40 bg-background/30",
        )}
      >
        <div className="flex items-center gap-2">
          <Timer
            className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")}
          />
          <span
            className={cn(
              "font-mono text-lg tabular-nums",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {active ? formatCountdown(secondsRemaining) : "--:--"}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant={active ? "secondary" : "default"}
          className="h-8 gap-1.5 text-xs"
          onClick={onStart}
          data-no-window-drag
        >
          <Play className="h-3.5 w-3.5" />
          {active ? "Relancer" : "Démarrer"}
        </Button>
      </div>
    </article>
  );
}
