import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  formatProgressDetail,
  getProgressStepLabel,
} from "@/features/game-stats/gameStats.progress.lib";
import { useOperationElapsed } from "@/features/game-stats/hooks/useOperationElapsed";
import type {
  GameStatsLoadStatus,
  GameStatsScanProgress,
} from "@/features/game-stats/gameStats.types";
import { cn } from "@/lib/utils";

export interface GameStatsProgressDisplayProps {
  status: GameStatsLoadStatus;
  progress: GameStatsScanProgress | null;
  operationStartedAt: number | null;
  className?: string;
  compact?: boolean;
}

export function GameStatsProgressDisplay({
  status,
  progress,
  operationStartedAt,
  className,
  compact = false,
}: GameStatsProgressDisplayProps) {
  const busy = status === "loading" || status === "updating" || status === "syncing";
  const elapsedMs = useOperationElapsed(operationStartedAt, busy);
  const stepLabel = getProgressStepLabel(status, progress);
  const detail = formatProgressDetail(progress, elapsedMs);
  const percent = progress?.percent ?? 0;
  const showBar = busy && percent > 0;

  if (!busy) {
    return null;
  }

  return (
    <div
      className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex min-w-0 items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <Loader2 className="mt-0.5 h-3 w-3 shrink-0 animate-spin" aria-hidden />
        <span className="min-w-0 break-words">{stepLabel}</span>
      </div>
      {showBar && (
        <Progress
          value={percent}
          className={cn("w-full bg-primary/10", compact ? "h-1" : "h-1.5")}
          aria-label="Progression"
        />
      )}
      {detail && (
        <p className="text-[10px] tabular-nums text-muted-foreground/90">{detail}</p>
      )}
    </div>
  );
}
