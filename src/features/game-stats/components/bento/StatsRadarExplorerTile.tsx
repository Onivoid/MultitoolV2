import { Radar } from "lucide-react";
import { StatsBentoTile } from "@/features/game-stats/components/bento/StatsBentoTile";
import { StatsRadarExplorerBody } from "@/features/game-stats/components/bento/StatsRadarExplorerBody";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";

export interface StatsRadarExplorerTileProps {
  snapshot: GameStatsSnapshot;
  className?: string;
}

/** Tuile autonome (legacy) — la page Statistiques utilise {@link StatsLeftExplorerPanel}. */
export function StatsRadarExplorerTile({
  snapshot,
  className,
}: StatsRadarExplorerTileProps) {
  return (
    <StatsBentoTile
      title="Répartition"
      icon={<Radar className="h-3.5 w-3.5 text-primary" aria-hidden />}
      hint="Systèmes, véhicules et dépenses par boutique."
      className={className}
      bodyClassName="flex min-h-0 flex-1 flex-col px-2 pb-1 pt-2"
    >
      <StatsRadarExplorerBody snapshot={snapshot} />
    </StatsBentoTile>
  );
}
