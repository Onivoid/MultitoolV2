import { describe, expect, it } from "vitest";
import {
  applyFamilyQuickFilterChange,
  buildQuickOutputTypeFacets,
  showComponentQuickFilters,
} from "@/features/blueprints/blueprints.quickFilters.lib";
import { DEFAULT_CATALOG_FILTER_STATE } from "@/features/blueprints/blueprints.catalog.filters";
import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";

function summary(
  partial: Partial<BlueprintCatalogSummary> & Pick<BlueprintCatalogSummary, "blueprintId">,
): BlueprintCatalogSummary {
  return {
    blueprintId: partial.blueprintId,
    nameFr: partial.nameFr ?? partial.blueprintId,
    nameEn: partial.nameEn ?? partial.blueprintId,
    family: partial.family ?? "armor",
    outputTypeLabel: partial.outputTypeLabel ?? null,
    outputType: partial.outputType ?? null,
    category: partial.category ?? null,
  } as BlueprintCatalogSummary;
}

describe("blueprints.quickFilters.lib", () => {
  it("showComponentQuickFilters is true only for ship families", () => {
    expect(showComponentQuickFilters("ship_component")).toBe(true);
    expect(showComponentQuickFilters("ship_weapon")).toBe(true);
    expect(showComponentQuickFilters("armor")).toBe(false);
    expect(showComponentQuickFilters("all")).toBe(false);
  });

  it("buildQuickOutputTypeFacets filters by family", () => {
    const catalog = [
      summary({
        blueprintId: "a",
        family: "armor",
        outputTypeLabel: "Legs (Armor)",
      }),
      summary({
        blueprintId: "b",
        family: "ship_component",
        outputTypeLabel: "Cooler",
      }),
    ];
    const armorFacets = buildQuickOutputTypeFacets(catalog, "armor");
    expect(armorFacets).toHaveLength(1);
    expect(armorFacets[0]?.value).toBe("Legs (Armor)");
  });

  it("applyFamilyQuickFilterChange clears component filters when leaving ship families", () => {
    const state = {
      ...DEFAULT_CATALOG_FILTER_STATE,
      family: "ship_component" as const,
      sizes: [2],
      classCodes: ["civi"],
      grades: ["A"],
    };
    const next = applyFamilyQuickFilterChange(state, "armor");
    expect(next.sizes).toEqual([]);
    expect(next.classCodes).toEqual([]);
    expect(next.grades).toEqual([]);
    expect(next.family).toBe("armor");
  });
});
