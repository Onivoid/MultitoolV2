import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";
import type { CatalogSummaryFacet } from "@/features/blueprints/blueprints.catalog.lib";
import { resolveItemFamily, type BlueprintFamily } from "@/features/blueprints/blueprints.taxonomy";

const QUICK_OUTPUT_TYPE_LIMIT = 12;

export function showComponentQuickFilters(
  family: BlueprintFamily | "all",
): boolean {
  return family === "ship_component" || family === "ship_weapon";
}

export function buildQuickOutputTypeFacets(
  catalog: BlueprintCatalogSummary[],
  family: BlueprintFamily | "all",
  limit = QUICK_OUTPUT_TYPE_LIMIT,
): CatalogSummaryFacet[] {
  const counts = new Map<string, number>();

  for (const item of catalog) {
    if (family !== "all" && resolveItemFamily(item) !== family) continue;
    const label = (item.outputTypeLabel ?? "").trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, limit)
    .map(([value, count]) => ({ value, label: value, count }));
}

export function applyFamilyQuickFilterChange(
  state: import("@/features/blueprints/blueprints.catalog.filters").BlueprintCatalogFilterState,
  family: BlueprintFamily | "all",
) {
  const next = { ...state, family };
  if (showComponentQuickFilters(family)) {
    return { ...next, outputTypeLabels: [] };
  }
  return {
    ...next,
    sizes: [],
    classCodes: [],
    grades: [],
    outputTypeLabels: [],
  };
}
