import type { GameStatsSpendingDay } from "@/features/game-stats/gameStats.types";

/** Libellé affiché pour une boutique (sans préfixe SCShop / SC_Shop, `_` → espaces). */
export function formatShopDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  let rest: string;
  if (lower.startsWith("sc_shop")) {
    rest = trimmed.slice(7).trimStart();
  } else if (lower.startsWith("scshop")) {
    rest = trimmed.slice(6).trimStart();
  } else {
    rest = trimmed;
  }
  rest = rest.replace(/^[_\s-]+/, "");
  const collapsed = rest
    .split("_")
    .flatMap((part) => part.split(/\s+/))
    .filter(Boolean)
    .join(" ");
  return collapsed || trimmed;
}

export type SpendingPeriodId = string;

export interface SpendingPeriodOption {
  id: SpendingPeriodId;
  label: string;
}

export interface SpendingChartPoint {
  date: string;
  spent: number;
  cumulative: number;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetweenInclusive(first: string, last: string): number {
  const a = parseIsoDate(first).getTime();
  const b = parseIsoDate(last).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m) {
    return yearMonth;
  }
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** @param resetAtPeriodStart si true, le 1er jour affiche un cumul à 0 (avant les dépenses du jour). */
function recomputeCumulative(
  days: GameStatsSpendingDay[],
  resetAtPeriodStart: boolean,
): SpendingChartPoint[] {
  let cumulative = 0;
  return days.map((d) => {
    if (resetAtPeriodStart) {
      const display = cumulative;
      cumulative += d.spent;
      return { date: d.date, spent: d.spent, cumulative: display };
    }
    cumulative += d.spent;
    return { date: d.date, spent: d.spent, cumulative };
  });
}

/** Options de période proposées selon l'étendue des données journalières. */
export function buildSpendingPeriodOptions(
  byDay: GameStatsSpendingDay[],
): SpendingPeriodOption[] {
  if (byDay.length < 2) {
    return [];
  }

  const sorted = [...byDay].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;
  const spanDays = daysBetweenInclusive(first, last);

  const options: SpendingPeriodOption[] = [{ id: "all", label: "Toute la période" }];

  if (spanDays >= 6) {
    options.push({ id: "7d", label: "7 derniers jours" });
  }
  if (spanDays >= 29) {
    options.push({ id: "30d", label: "30 derniers jours" });
  }
  if (spanDays >= 89) {
    options.push({ id: "90d", label: "90 derniers jours" });
  }
  if (spanDays >= 364) {
    options.push({ id: "365d", label: "12 derniers mois" });
  }

  const months = [...new Set(sorted.map((d) => d.date.slice(0, 7)))].sort();
  if (months.length >= 2) {
    for (const ym of months) {
      options.push({
        id: `month:${ym}`,
        label: formatMonthLabel(ym),
      });
    }
  }

  return options;
}

/** Filtre les jours et recalcule le cumul à partir de zéro sur la fenêtre choisie. */
export function sliceSpendingForPeriod(
  byDay: GameStatsSpendingDay[],
  periodId: SpendingPeriodId,
): SpendingChartPoint[] {
  const sorted = [...byDay].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return [];
  }

  const lastDate = parseIsoDate(sorted[sorted.length - 1].date);
  let filtered = sorted;

  if (periodId === "all") {
    filtered = sorted;
  } else if (periodId === "7d") {
    const min = isoFromDate(addUtcDays(lastDate, -6));
    filtered = sorted.filter((d) => d.date >= min);
  } else if (periodId === "30d") {
    const min = isoFromDate(addUtcDays(lastDate, -29));
    filtered = sorted.filter((d) => d.date >= min);
  } else if (periodId === "90d") {
    const min = isoFromDate(addUtcDays(lastDate, -89));
    filtered = sorted.filter((d) => d.date >= min);
  } else if (periodId === "365d") {
    const min = isoFromDate(addUtcDays(lastDate, -364));
    filtered = sorted.filter((d) => d.date >= min);
  } else if (periodId.startsWith("month:")) {
    const ym = periodId.slice("month:".length);
    filtered = sorted.filter((d) => d.date.startsWith(ym));
  }

  const resetAtStart = periodId !== "all";
  return recomputeCumulative(filtered, resetAtStart);
}
