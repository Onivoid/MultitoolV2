import { Skeleton } from "@/components/ui/skeleton";
import { GameStatsSyncFooter } from "@/features/game-stats/components/GameStatsSyncFooter";
import { StatSummaryList } from "@/features/game-stats/components/StatSummaryList";
import {
  formatStatsPeriod,
  getHomeSummaryItems,
  snapshotHasHomeStats,
} from "@/features/game-stats/gameStats.lib";
import { useGameStats } from "@/features/game-stats/useGameStats";
import { useJournalOwnedBlueprintCount } from "@/features/game-stats/useJournalOwnedBlueprintCount";
import {
  HOME_WIDGET_FOOTER,
  HOME_WIDGET_ROOT,
  HOME_WIDGET_SCROLL,
} from "@/features/home/dashboard/homeDashboard.ui";

export function GameStatsWidgetContent() {
  const { snapshot, status, error, progress, operationStartedAt, sync, isBusy } =
    useGameStats();
  const journalBlueprintCount = useJournalOwnedBlueprintCount();
  const items = getHomeSummaryItems(snapshot, journalBlueprintCount);
  const showSkeleton = status === "loading" && !snapshot;

  return (
    <div className={HOME_WIDGET_ROOT}>
      <div className={HOME_WIDGET_SCROLL}>
        {showSkeleton && (
          <div className="flex flex-col gap-2 px-3 py-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {error && !showSkeleton && (
          <p className="px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        {!error &&
          !showSkeleton &&
          !snapshotHasHomeStats(snapshot, journalBlueprintCount) && (
            <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Aucune statistique détectée dans les logs. Lancez le jeu puis
              synchronisez.
            </p>
          )}

        {!showSkeleton && items.length > 0 && (
          <>
            <StatSummaryList items={items} />
            {snapshot?.period.label && (
              <p className="text-ui-secondary border-t border-primary/6 px-3 pb-2 pt-1 text-muted-foreground">
                {formatStatsPeriod(snapshot)}
              </p>
            )}
          </>
        )}
      </div>

      <div className={HOME_WIDGET_FOOTER}>
        <GameStatsSyncFooter
          status={status}
          progress={progress}
          operationStartedAt={operationStartedAt}
          onSync={() => void sync()}
          disabled={isBusy}
        />
      </div>
    </div>
  );
}
