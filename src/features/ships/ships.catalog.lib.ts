import type { VehicleSummary } from "@/features/ships/ships.types";

export const WIKI_PLACEHOLDER = "<= PLACEHOLDER =>";

export function isWikiPlaceholder(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  const upper = trimmed.toUpperCase();
  return upper.includes("PLACEHOLDER") || trimmed === WIKI_PLACEHOLDER;
}

const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  "flight-ready": "En vol",
  "in-concept": "En concept",
};

/** Libellés anglais pour le sélecteur de filtre Statut. */
const PRODUCTION_STATUS_FILTER_LABELS: Record<string, string> = {
  "flight-ready": "Flight Ready",
  "in-concept": "Concept",
};

/** Statuts toujours proposés dans le filtre, même absents du catalogue chargé. */
export const KNOWN_PRODUCTION_STATUSES = ["flight-ready", "in-concept"] as const;

const PRODUCTION_STATUS_ORDER = ["flight-ready", "in-concept"] as const;

export function canonicalProductionStatus(
  status: string | null | undefined,
): string | null {
  const trimmed = status?.trim();
  if (!trimmed || isWikiPlaceholder(trimmed)) return null;
  const normalized = trimmed.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  if (normalized === "flight-ready" || normalized === "flightready") {
    return "flight-ready";
  }
  if (normalized === "in-concept" || normalized === "inconcept") {
    return "in-concept";
  }
  return normalized;
}

export function formatProductionStatusLabel(
  status: string | null | undefined,
): string | null {
  const canonical = canonicalProductionStatus(status);
  if (!canonical) return null;
  return PRODUCTION_STATUS_LABELS[canonical] ?? canonical;
}

/** Libellé filtre Statut (anglais pour les statuts canoniques Wiki). */
export function formatProductionStatusFilterLabel(status: string): string {
  return PRODUCTION_STATUS_FILTER_LABELS[status] ?? status;
}

export function mergeProductionStatusFilterValues(catalogStatuses: string[]): string[] {
  const merged = new Set<string>(KNOWN_PRODUCTION_STATUSES);
  for (const status of catalogStatuses) {
    const canonical = canonicalProductionStatus(status);
    if (canonical) merged.add(canonical);
  }
  return sortProductionStatusValues([...merged]);
}

export function sortProductionStatusValues(statuses: string[]): string[] {
  return [...statuses].sort((a, b) => {
    const indexA = PRODUCTION_STATUS_ORDER.indexOf(
      a as (typeof PRODUCTION_STATUS_ORDER)[number],
    );
    const indexB = PRODUCTION_STATUS_ORDER.indexOf(
      b as (typeof PRODUCTION_STATUS_ORDER)[number],
    );
    const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
    if (rankA !== rankB) return rankA - rankB;
    return (
      formatProductionStatusLabel(a)?.localeCompare(
        formatProductionStatusLabel(b) ?? b,
        "fr",
      ) ?? 0
    );
  });
}

export function shipDisplayName(
  ship: Pick<VehicleSummary, "displayName" | "name">,
): string {
  const display = ship.displayName?.trim();
  if (display) return display;
  return ship.name;
}

export function humanizeSlugSuffix(suffix: string): string {
  switch (suffix) {
    case "gs":
      return "GS";
    case "bis2950":
      return "BIS 2950";
    case "showdown":
      return "Best In Show";
    case "exec-military":
      return "PYAM Exec Militaire";
    case "exec-stealth":
    case "exec-stealthindustrial":
      return "PYAM Exec Furtif";
    case "collector-military":
    case "collector-milt":
      return "Collector Militaire";
    case "collector-indust":
      return "Collector Industriel";
    case "collector-competition":
      return "Collector Compétition";
    case "tsg":
      return "TSG";
    case "fw-25":
      return "FW 25";
    case "plat":
      return "Platinum";
    case "pir":
      return "Pirate";
    default:
      return suffix
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export function variantLabelFromSlug(baseSlug: string, slug: string): string | null {
  if (slug === baseSlug) return null;
  const prefix = `${baseSlug}-`;
  if (!slug.startsWith(prefix)) return null;
  const suffix = slug.slice(prefix.length);
  if (!suffix) return null;
  return humanizeSlugSuffix(suffix);
}

export function sanitizeCatalogText(value: string | null | undefined): string | null {
  if (isWikiPlaceholder(value)) return null;
  return value?.trim() || null;
}
