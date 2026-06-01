import { TrendingUp } from "lucide-react";
import { StatsBentoTile } from "@/features/game-stats/components/bento/StatsBentoTile";
import { StatsSpendingChartBody } from "@/features/game-stats/components/bento/StatsSpendingChartBody";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";

export interface StatsSpendingChartTileProps {
  snapshot: GameStatsSnapshot;
  className?: string;
}

/** Tuile autonome (legacy) — la page Statistiques utilise {@link StatsLeftExplorerPanel}. */
export function StatsSpendingChartTile({
  snapshot,
  className,
}: StatsSpendingChartTileProps) {
  return (
    <StatsBentoTile
      title="Évolution des dépenses"
      icon={<TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />}
      hint="Dépenses cumulées par jour (achats boutique réussis dans les logs)."
      className={className}
      bodyClassName="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1"
    >
      <StatsSpendingChartBody snapshot={snapshot} className="flex-1" />
    </StatsBentoTile>
  );
}
