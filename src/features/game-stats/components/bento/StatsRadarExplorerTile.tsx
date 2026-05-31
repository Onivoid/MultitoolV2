import { useEffect, useMemo, useState } from "react";
import { Radar } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsBentoTile } from "@/features/game-stats/components/bento/StatsBentoTile";
import { VehicleRadarMinSessionsSlider } from "@/features/game-stats/components/bento/VehicleRadarMinSessionsSlider";
import { StatsRadarChart } from "@/features/game-stats/components/charts/StatsRadarChart";
import {
  buildRadarCategoryResult,
  buildVehicleSessionTiers,
  minSessionsForVehicleTierIndex,
  pickDefaultVehicleTierIndex,
  RADAR_CATEGORY_LIST,
} from "@/features/game-stats/gameStats.charts.lib";
import type { RadarCategoryId } from "@/features/game-stats/gameStats.radar.types";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";

export interface StatsRadarExplorerTileProps {
  snapshot: GameStatsSnapshot;
  className?: string;
}

export function StatsRadarExplorerTile({
  snapshot,
  className,
}: StatsRadarExplorerTileProps) {
  const [categoryId, setCategoryId] = useState<RadarCategoryId>("star_systems");

  const vehicleTiers = useMemo(
    () => buildVehicleSessionTiers(snapshot),
    [snapshot],
  );

  const [vehicleTierIndex, setVehicleTierIndex] = useState(() =>
    pickDefaultVehicleTierIndex(vehicleTiers),
  );

  useEffect(() => {
    setVehicleTierIndex(pickDefaultVehicleTierIndex(vehicleTiers));
  }, [vehicleTiers]);

  const vehicleMinSessions = minSessionsForVehicleTierIndex(
    vehicleTiers,
    vehicleTierIndex,
  );

  const active = useMemo(
    () =>
      buildRadarCategoryResult(
        snapshot,
        categoryId,
        categoryId === "vehicles" ? { vehicleMinSessions } : undefined,
      ),
    [snapshot, categoryId, vehicleMinSessions],
  );

  const activeLabel =
    RADAR_CATEGORY_LIST.find((c) => c.id === categoryId)?.label ?? categoryId;

  const emptyMessage =
    categoryId === "vehicles"
      ? `Aucun vaisseau à ce palier (≥ ${vehicleMinSessions} sessions). Choisissez un palier plus bas.`
      : `Aucune donnée « ${activeLabel} » sur la période.`;

  return (
    <StatsBentoTile
      title="Répartition"
      icon={<Radar className="h-3.5 w-3.5 text-primary" aria-hidden />}
      hint={active.tileHint}
      className={className}
      bodyClassName="flex min-h-0 flex-1 flex-col px-2 pb-1 pt-2"
    >
      <Tabs
        value={categoryId}
        onValueChange={(v) => setCategoryId(v as RadarCategoryId)}
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <TabsList className="grid h-9 w-full shrink-0 grid-cols-3 bg-primary/5">
          {RADAR_CATEGORY_LIST.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="text-xs data-[state=active]:bg-primary/15"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categoryId === "vehicles" ? (
          <VehicleRadarMinSessionsSlider
            snapshot={snapshot}
            tierIndex={vehicleTierIndex}
            onTierIndexChange={setVehicleTierIndex}
          />
        ) : null}

        <div className="relative min-h-0 flex-1">
          <StatsRadarChart
            key={`${categoryId}-${categoryId === "vehicles" ? vehicleTierIndex : ""}`}
            data={active.data}
            chartConfig={active.chartConfig}
            emptyMessage={emptyMessage}
            ariaLabel={active.ariaLabel}
            className="absolute inset-0 h-full w-full"
            compactAxisLabels={categoryId === "vehicles" && active.data.length > 8}
          />
        </div>
      </Tabs>
    </StatsBentoTile>
  );
}
