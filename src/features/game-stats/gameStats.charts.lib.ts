import type { ChartConfig } from "@/components/ui/chart";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";
import {
  formatPlaytime,
  formatVehicleTypeLabel,
} from "@/features/game-stats/gameStats.lib";
import type { StatSummaryItem } from "@/features/game-stats/gameStats.types";
import type {
  RadarBuildOptions,
  RadarCategoryDefinition,
  RadarCategoryId,
  RadarCategoryResult,
  RadarChartDatum,
} from "@/features/game-stats/gameStats.radar.types";

export const KNOWN_STAR_SYSTEMS = ["Pyro", "Stanton", "Nyx"] as const;

/** Seuil par défaut visé au chargement (palier le plus proche dans les données). */
export const VEHICLE_MIN_SESSIONS_DEFAULT = 10;

/** Dernier palier du curseur : au moins ce nombre de vaisseaux sur le radar. */
export const VEHICLE_TIER_MIN_TOP = 3;

export interface VehicleSessionTier {
  minSessions: number;
  vehicleCount: number;
}

export function normalizeRadarValues(
  values: number[],
): { normalized: number[]; max: number } {
  const max = Math.max(0, ...values);
  if (max === 0) {
    return { normalized: values.map(() => 0), max: 0 };
  }
  return {
    max,
    normalized: values.map((v) => v / max),
  };
}

export function toRadarData(
  items: { id: string; label: string; value: number; formattedValue: string }[],
): RadarChartDatum[] {
  const values = items.map((i) => i.value);
  const { normalized } = normalizeRadarValues(values);
  return items.map((item, index) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    normalized: normalized[index] ?? 0,
    formattedValue: item.formattedValue,
  }));
}

function buildStarSystemsData(snapshot: GameStatsSnapshot): RadarChartDatum[] {
  const visitMap = new Map(
    snapshot.starSystems.visits.map((v) => [v.system, v.visitCount]),
  );
  return toRadarData(
    KNOWN_STAR_SYSTEMS.map((system) => {
      const count = visitMap.get(system) ?? 0;
      return {
        id: system.toLowerCase(),
        label: system,
        value: count,
        formattedValue: `${count} visite${count !== 1 ? "s" : ""}`,
      };
    }),
  );
}

/**
 * Paliers du curseur véhicules : seuils issus des `boardCount` réels du cache.
 * Le palier le plus strict (dernier) garde au moins {@link VEHICLE_TIER_MIN_TOP} vaisseaux.
 */
export function buildVehicleSessionTiers(
  snapshot: GameStatsSnapshot,
): VehicleSessionTier[] {
  const entries = [...snapshot.vehicles.entries].sort(
    (a, b) => b.boardCount - a.boardCount,
  );

  if (entries.length === 0) {
    return [{ minSessions: 1, vehicleCount: 0 }];
  }

  const uniqueAsc = [...new Set(entries.map((e) => e.boardCount))].sort(
    (a, b) => a - b,
  );

  const maxThreshold =
    entries.length >= VEHICLE_TIER_MIN_TOP
      ? entries[VEHICLE_TIER_MIN_TOP - 1].boardCount
      : uniqueAsc[uniqueAsc.length - 1];

  const tiers: VehicleSessionTier[] = [];
  for (const minSessions of uniqueAsc) {
    if (minSessions > maxThreshold) {
      continue;
    }
    const vehicleCount = entries.filter(
      (e) => e.boardCount >= minSessions,
    ).length;
    if (
      entries.length < VEHICLE_TIER_MIN_TOP ||
      vehicleCount >= VEHICLE_TIER_MIN_TOP
    ) {
      tiers.push({ minSessions, vehicleCount });
    }
  }

  if (tiers.length === 0) {
    return [{ minSessions: 1, vehicleCount: entries.length }];
  }

  return tiers;
}

/** Index du palier par défaut (proche de 10 sessions si possible). */
export function pickDefaultVehicleTierIndex(tiers: VehicleSessionTier[]): number {
  if (tiers.length === 0) {
    return 0;
  }
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < tiers.length; i++) {
    const dist = Math.abs(tiers[i].minSessions - VEHICLE_MIN_SESSIONS_DEFAULT);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function minSessionsForVehicleTierIndex(
  tiers: VehicleSessionTier[],
  tierIndex: number,
): number {
  const clamped = Math.max(0, Math.min(tierIndex, tiers.length - 1));
  return tiers[clamped]?.minSessions ?? 1;
}

function buildVehiclesData(
  snapshot: GameStatsSnapshot,
  minSessions: number = VEHICLE_MIN_SESSIONS_DEFAULT,
): RadarChartDatum[] {
  const filtered = [...snapshot.vehicles.entries]
    .filter((e) => e.boardCount >= minSessions)
    .sort((a, b) => b.boardCount - a.boardCount);

  return toRadarData(
    filtered.map((entry) => {
      const label = formatVehicleTypeLabel(entry.vehicleType);
      const count = entry.boardCount;
      return {
        id: entry.vehicleType,
        label,
        value: count,
        formattedValue: `${count} session${count !== 1 ? "s" : ""}`,
      };
    }),
  );
}

function buildMissionsData(snapshot: GameStatsSnapshot): RadarChartDatum[] {
  const { completed, abandoned, failed } = snapshot.missions;
  return toRadarData([
    {
      id: "completed",
      label: "Terminées",
      value: completed,
      formattedValue: String(completed),
    },
    {
      id: "abandoned",
      label: "Abandonnées",
      value: abandoned,
      formattedValue: String(abandoned),
    },
    {
      id: "failed",
      label: "Échouées",
      value: failed,
      formattedValue: String(failed),
    },
  ]);
}

const RADAR_CATEGORIES: RadarCategoryDefinition[] = [
  {
    id: "star_systems",
    label: "Systèmes",
    tileHint:
      "Répartition des visites par système stellaire. Une visite est comptée lorsque les logs indiquent un passage vers Pyro, Stanton ou Nyx depuis un autre système (ou une zone inconnue) — pas chaque action dans le système.",
    buildData: buildStarSystemsData,
  },
  {
    id: "vehicles",
    label: "Véhicules",
    tileHint:
      "Tous les vaisseaux ayant au moins le nombre minimal de sessions choisi (sorties de siège pilote dans les logs, ClearDriver). Ajustez le curseur pour élargir ou restreindre la liste. Les véhicules ennemis ne sont pas pris en compte.",
    chartColor: "hsl(var(--chart-2))",
    buildData: (snapshot, options) =>
      buildVehiclesData(
        snapshot,
        options?.vehicleMinSessions ?? VEHICLE_MIN_SESSIONS_DEFAULT,
      ),
  },
  {
    id: "missions",
    label: "Missions",
    tileHint:
      "Répartition des fins de mission détectées dans les logs : terminées, abandonnées ou échouées (CompletionType).",
    chartColor: "hsl(var(--chart-3))",
    buildData: buildMissionsData,
  },
];

export const RADAR_CATEGORY_LIST = RADAR_CATEGORIES;

export function getRadarCategory(
  id: RadarCategoryId,
): RadarCategoryDefinition | undefined {
  return RADAR_CATEGORIES.find((c) => c.id === id);
}

function defaultChartConfig(color?: string): ChartConfig {
  return {
    stat: {
      label: "Valeur",
      color: color ?? "hsl(var(--chart-1))",
    },
  };
}

export function buildRadarCategoryResult(
  snapshot: GameStatsSnapshot,
  categoryId: RadarCategoryId,
  options?: RadarBuildOptions,
): RadarCategoryResult {
  const category = getRadarCategory(categoryId);
  if (!category) {
    return {
      data: [],
      chartConfig: defaultChartConfig(),
      tileHint: "",
      isEmpty: true,
      ariaLabel: "Catégorie inconnue",
      vehicleCount: 0,
    };
  }

  const data = category.buildData(snapshot, options);
  const isEmpty = data.length === 0 || data.every((d) => d.value === 0);
  const ariaLabel = data
    .map((d) => `${d.label} : ${d.formattedValue}`)
    .join(", ");

  return {
    data,
    chartConfig: defaultChartConfig(category.chartColor),
    tileHint: category.tileHint,
    isEmpty,
    ariaLabel: `${category.label} — ${ariaLabel}`,
    vehicleCount: categoryId === "vehicles" ? data.length : undefined,
  };
}

/** Tuiles KPI détaillées pour la page (inclut missions séparées même à 0 si d'autres stats existent). */
export function getStatsPageKpiItems(
  snapshot: GameStatsSnapshot | null,
): StatSummaryItem[] {
  if (!snapshot) {
    return [];
  }

  const items: StatSummaryItem[] = [];

  if (snapshot.playtime.totalSeconds > 0) {
    items.push({
      label: "Temps de jeu",
      value: formatPlaytime(snapshot.playtime.totalSeconds),
    });
  }

  if (snapshot.playtime.sessionCount > 0) {
    items.push({
      label: "Sessions",
      value: String(snapshot.playtime.sessionCount),
    });
  }

  const { missions } = snapshot;
  if (
    missions.completed > 0 ||
    missions.abandoned > 0 ||
    missions.failed > 0
  ) {
    items.push({
      label: "Missions terminées",
      value: String(missions.completed),
    });
    items.push({
      label: "Missions abandonnées",
      value: String(missions.abandoned),
    });
    items.push({
      label: "Missions échouées",
      value: String(missions.failed),
    });
  }

  if (snapshot.blueprints.totalUnlocked > 0) {
    items.push({
      label: "Schémas débloqués",
      value: String(snapshot.blueprints.totalUnlocked),
    });
  }

  if (snapshot.vehicles.favorite && snapshot.vehicles.favoriteCount > 0) {
    const vehicleLabel = formatVehicleTypeLabel(snapshot.vehicles.favorite);
    const sessions = snapshot.vehicles.favoriteCount;
    items.push({
      label: "Véhicule favori",
      value: vehicleLabel,
      hint: `Vaisseau le plus souvent utilisé selon vos logs. Chaque sortie de siège pilote compte comme une session (${sessions} pour ${vehicleLabel}).`,
    });
  }

  if (snapshot.starSystems.favorite && snapshot.starSystems.favoriteCount > 0) {
    const system = snapshot.starSystems.favorite;
    const visits = snapshot.starSystems.favoriteCount;
    items.push({
      label: "Système favori",
      value: system,
      hint: `Système le plus visité. Comptage des entrées détectées dans les logs (${visits} pour ${system}).`,
    });
  }

  return items;
}

// Re-export for tests
export { buildStarSystemsData, buildMissionsData };
