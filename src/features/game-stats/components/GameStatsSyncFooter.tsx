import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameStatsProgressDisplay } from "@/features/game-stats/components/GameStatsProgressDisplay";
import type {
  GameStatsLoadStatus,
  GameStatsScanProgress,
} from "@/features/game-stats/gameStats.types";
import { cn } from "@/lib/utils";

export interface GameStatsSyncFooterProps {
  status: GameStatsLoadStatus;
  progress: GameStatsScanProgress | null;
  operationStartedAt: number | null;
  onSync: () => void;
  disabled?: boolean;
}

export function GameStatsSyncFooter({
  status,
  progress,
  operationStartedAt,
  onSync,
  disabled,
}: GameStatsSyncFooterProps) {
  const busy =
    status === "loading" || status === "updating" || status === "syncing";

  return (
    <footer className="settings-section-footer flex flex-col gap-2 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <GameStatsProgressDisplay
          status={status}
          progress={progress}
          operationStartedAt={operationStartedAt}
          compact
          className={cn(!busy && "invisible")}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs"
          onClick={onSync}
          disabled={disabled || busy}
          data-no-window-drag
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Sync
        </Button>
      </div>
    </footer>
  );
}
