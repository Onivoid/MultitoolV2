import type { ChartConfig } from "@/components/ui/chart";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";

export type RadarCategoryId = "star_systems" | "vehicles" | "spending";

export interface RadarChartDatum {
  id: string;
  label: string;
  value: number;
  normalized: number;
  formattedValue: string;
}

export interface RadarBuildOptions {
  /** Seuil minimal de sessions (catégorie véhicules uniquement). */
  vehicleMinSessions?: number;
}

export interface RadarCategoryDefinition {
  id: RadarCategoryId;
  label: string;
  tileHint: string;
  chartColor?: string;
  buildData(
    snapshot: GameStatsSnapshot,
    options?: RadarBuildOptions,
  ): RadarChartDatum[];
}

export interface RadarCategoryResult {
  data: RadarChartDatum[];
  chartConfig: ChartConfig;
  tileHint: string;
  isEmpty: boolean;
  ariaLabel: string;
  vehicleCount?: number;
}
