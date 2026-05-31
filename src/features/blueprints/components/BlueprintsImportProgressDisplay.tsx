import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  formatBlueprintsImportDetail,
  getBlueprintsImportStepLabel,
} from "@/features/blueprints/blueprints.progress.lib";
import type { BlueprintsImportProgress } from "@/features/blueprints/blueprints.import.types";
import { useOperationElapsed } from "@/features/game-stats/hooks/useOperationElapsed";
import { cn } from "@/lib/utils";

export interface BlueprintsImportProgressDisplayProps {
  isImporting: boolean;
  progress: BlueprintsImportProgress | null;
  operationStartedAt: number | null;
  className?: string;
  compact?: boolean;
}

export function BlueprintsImportProgressDisplay({
  isImporting,
  progress,
  operationStartedAt,
  className,
  compact = false,
}: BlueprintsImportProgressDisplayProps) {
  const elapsedMs = useOperationElapsed(operationStartedAt, isImporting);
  const stepLabel = getBlueprintsImportStepLabel(progress);
  const detail = formatBlueprintsImportDetail(progress, elapsedMs);
  const percent = progress?.percent ?? 0;
  const showBar = isImporting && percent > 0;

  if (!isImporting) {
    return null;
  }

  return (
    <div
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
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
          aria-label="Progression de la synchronisation"
        />
      )}
      {detail && (
        <p className="text-[10px] tabular-nums text-muted-foreground/90">{detail}</p>
      )}
    </div>
  );
}
