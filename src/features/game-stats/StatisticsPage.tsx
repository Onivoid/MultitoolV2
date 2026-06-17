import { Button } from "@/components/ui/button";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import {
  StatsBentoGrid,
  StatsBentoGridSkeleton,
} from "@/features/game-stats/components/bento/StatsBentoGrid";
import { GameStatsProgressDisplay } from "@/features/game-stats/components/GameStatsProgressDisplay";
import { StatsPageToolbar } from "@/features/game-stats/components/StatsPageToolbar";
import { snapshotHasHomeStats } from "@/features/game-stats/gameStats.lib";
import { useGameStats } from "@/features/game-stats/useGameStats";
import { useJournalOwnedBlueprintCount } from "@/features/game-stats/useJournalOwnedBlueprintCount";

export default function StatisticsPage() {
  const { snapshot, status, error, progress, operationStartedAt, sync, isBusy } =
    useGameStats();
  const journalBlueprintCount = useJournalOwnedBlueprintCount();
  const showSkeleton = status === "loading" && !snapshot;
  const hasStats = snapshotHasHomeStats(snapshot, journalBlueprintCount);

  return (
    <PageMotion className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 pt-2 pb-20">
      <StatsPageToolbar
        snapshot={snapshot}
        status={status}
        progress={progress}
        operationStartedAt={operationStartedAt}
        error={error}
        isBusy={isBusy}
        onSync={() => void sync()}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showSkeleton && <StatsBentoGridSkeleton />}

        {!showSkeleton && !hasStats && (
          <div className={`${PAGE_CENTER} pb-20`}>
            <section className="settings-section max-w-md px-6 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Aucune statistique détectée
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Lancez Star Citizen, jouez une session puis synchronisez les logs pour
                alimenter cette page.
              </p>
              {isBusy ? (
                <div className="mt-4 text-left">
                  <GameStatsProgressDisplay
                    status={status}
                    progress={progress}
                    operationStartedAt={operationStartedAt}
                  />
                </div>
              ) : (
                <Button type="button" className="mt-4" onClick={() => void sync()}>
                  Synchroniser
                </Button>
              )}
            </section>
          </div>
        )}

        {!showSkeleton && hasStats && snapshot && (
          <StatsBentoGrid
            snapshot={snapshot}
            journalUniqueCount={journalBlueprintCount}
          />
        )}
      </div>
    </PageMotion>
  );
}
