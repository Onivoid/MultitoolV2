import { BarChart3 } from "lucide-react";
import { GameStatsSyncFooter } from "@/features/game-stats/components/GameStatsSyncFooter";
import { formatStatsPeriod } from "@/features/game-stats/gameStats.lib";
import type {
  GameStatsLoadStatus,
  GameStatsScanProgress,
  GameStatsSnapshot,
} from "@/features/game-stats/gameStats.types";

export interface StatsPageToolbarProps {
  snapshot: GameStatsSnapshot | null;
  status: GameStatsLoadStatus;
  progress: GameStatsScanProgress | null;
  operationStartedAt: number | null;
  error: string | null;
  isBusy: boolean;
  onSync: () => void;
}

export function StatsPageToolbar({
  snapshot,
  status,
  progress,
  operationStartedAt,
  error,
  isBusy,
  onSync,
}: StatsPageToolbarProps) {
  return (
    <section
      className="settings-section mb-2 shrink-0 flex flex-col overflow-hidden"
      data-no-window-drag
    >
      <header className="settings-section-header flex items-center gap-2 px-3 py-2 pl-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10">
          <BarChart3 className="h-3.5 w-3.5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold leading-snug">Statistiques</h1>
          {snapshot?.period.label ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {formatStatsPeriod(snapshot)}
            </p>
          ) : null}
        </div>
      </header>
      {error ? <p className="px-3 py-2 text-xs text-destructive">{error}</p> : null}
      <GameStatsSyncFooter
        status={status}
        progress={progress}
        operationStartedAt={operationStartedAt}
        onSync={onSync}
        disabled={isBusy}
      />
    </section>
  );
}
