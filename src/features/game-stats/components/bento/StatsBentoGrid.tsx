import { Skeleton } from "@/components/ui/skeleton";
import { StatsKpiTile } from "@/features/game-stats/components/bento/StatsKpiTile";
import { StatsLeftExplorerPanel } from "@/features/game-stats/components/bento/StatsLeftExplorerPanel";
import { getStatsPageKpiItems } from "@/features/game-stats/gameStats.charts.lib";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";

export interface StatsBentoGridProps {
  snapshot: GameStatsSnapshot;
}

export function StatsBentoGrid({ snapshot }: StatsBentoGridProps) {
  const kpiItems = getStatsPageKpiItems(snapshot);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:grid lg:grid-cols-12 lg:grid-rows-1"
      data-no-window-drag
    >
      <StatsLeftExplorerPanel
        snapshot={snapshot}
        className="min-h-0 flex-1 lg:col-span-8 lg:h-full"
      />

      <div className="flex max-h-[36vh] min-h-0 shrink-0 flex-col gap-2 overflow-y-auto lg:col-span-4 lg:max-h-none lg:h-full lg:shrink lg:gap-2 lg:pr-0.5">
        {kpiItems.map((item) => (
          <StatsKpiTile key={item.label} item={item} className="shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function StatsBentoGridSkeleton() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-12">
      <Skeleton className="min-h-[280px] lg:col-span-8 lg:h-full" />
      <div className="flex flex-col gap-2 lg:col-span-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 shrink-0" />
        ))}
      </div>
    </div>
  );
}
