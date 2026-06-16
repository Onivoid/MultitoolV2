import { describe, expect, it } from "vitest";
import {
  applyCatalogBadgeFilter,
  applyCatalogFilters,
  DEFAULT_CATALOG_FILTER_STATE,
  isCatalogBadgeFilterActive,
} from "@/features/blueprints/blueprints.catalog.filters";
import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";

const sample: BlueprintCatalogSummary[] = [
  {
    wikiUuid: "a",
    blueprintId: "bp_craft_test_a",
    nameEn: "Test Gun",
    nameFr: "Fusil test",
    locKey: null,
    category: "Weapon Gun",
    craftTimeSeconds: 100,
    tiers: 1,
    defaultOwned: false,
    version: null,
    classCode: "mili",
    size: 2,
    outputType: "WeaponGun",
    ingredientCount: 2,
    unlockingMissionsCount: 1,
    resourceUuids: ["res-1"],
    unlockSystems: ["Nyx"],
    unlockJurisdictions: ["Ungoverned"],
  },
  {
    wikiUuid: "b",
    blueprintId: "bp_craft_test_b",
    nameEn: "Default Item",
    nameFr: null,
    locKey: null,
    category: "Misc",
    craftTimeSeconds: 50,
    tiers: 1,
    defaultOwned: true,
    version: null,
    classCode: "civi",
    size: 1,
    outputType: "Misc",
    resourceUuids: ["res-2"],
    unlockSystems: ["Stanton"],
    unlockJurisdictions: [],
  },
];

describe("applyCatalogFilters", () => {
  it("filters by owned and resource", () => {
    const owned = new Set(["bp_craft_test_a"]);
    const state = {
      ...DEFAULT_CATALOG_FILTER_STATE,
      owned: "owned" as const,
      resourceUuid: "res-1",
    };
    const out = applyCatalogFilters(sample, state, owned);
    expect(out).toHaveLength(1);
    expect(out[0].blueprintId).toBe("bp_craft_test_a");
  });

  it("matches resource filter via aliases (ore + item uuid)", () => {
    const state = {
      ...DEFAULT_CATALOG_FILTER_STATE,
      resourceUuid: "ore-uuid",
      resourceUuidAliases: ["item-uuid"],
    };
    const catalog: BlueprintCatalogSummary[] = [
      {
        ...sample[0],
        blueprintId: "bp_with_ore",
        resourceUuids: ["ore-uuid"],
      },
      {
        ...sample[1],
        blueprintId: "bp_with_item",
        resourceUuids: ["item-uuid"],
      },
    ];
    const byOre = applyCatalogFilters(catalog, state, new Set());
    expect(byOre.map((b) => b.blueprintId).sort()).toEqual(
      ["bp_with_item", "bp_with_ore"].sort(),
    );
  });

  it("bascule un filtre taille via badge", () => {
    let state = DEFAULT_CATALOG_FILTER_STATE;
    state = applyCatalogBadgeFilter(state, { type: "size", size: 2 });
    expect(isCatalogBadgeFilterActive(state, { type: "size", size: 2 })).toBe(true);
    state = applyCatalogBadgeFilter(state, { type: "size", size: 2 });
    expect(state.sizes).toEqual([]);
  });

  it("filtre par grade", () => {
    const state = { ...DEFAULT_CATALOG_FILTER_STATE, grades: ["C"] };
    const catalog: BlueprintCatalogSummary[] = [
      { ...sample[0], blueprintId: "a", grade: "C", outputType: "PowerPlant" },
      { ...sample[1], blueprintId: "b", grade: "A", outputType: "Cooler" },
    ];
    const out = applyCatalogFilters(catalog, state, new Set());
    expect(out).toHaveLength(1);
    expect(out[0].grade).toBe("C");
  });

  it("filtre par token id armure", () => {
    const state = {
      ...DEFAULT_CATALOG_FILTER_STATE,
      idTokens: ["_heavy_"],
    };
    const catalog: BlueprintCatalogSummary[] = [
      { ...sample[0], blueprintId: "bp_heavy_legs" },
      { ...sample[1], blueprintId: "bp_light_legs" },
    ];
    const out = applyCatalogFilters(catalog, state, new Set());
    expect(out).toHaveLength(1);
    expect(out[0].blueprintId).toBe("bp_heavy_legs");
  });

  it("filtre par famille", () => {
    const state = {
      ...DEFAULT_CATALOG_FILTER_STATE,
      family: "ship_weapon" as const,
    };
    const catalog: BlueprintCatalogSummary[] = [
      { ...sample[0], family: "ship_weapon" },
      { ...sample[1], family: "other", outputType: "Misc" },
    ];
    const out = applyCatalogFilters(catalog, state, new Set());
    expect(out).toHaveLength(1);
    expect(out[0].blueprintId).toBe("bp_craft_test_a");
  });

  it("filters by contractor and mission type", () => {
    const catalog: BlueprintCatalogSummary[] = [
      {
        ...sample[0],
        blueprintId: "bp_a",
        unlockContractors: ["Foxwell"],
        unlockMissionTypes: ["Cargo"],
        unlockLawful: [true],
      },
      {
        ...sample[1],
        blueprintId: "bp_b",
        unlockContractors: ["Wikelo"],
        unlockMissionTypes: ["Mercenary"],
        unlockLawful: [false],
      },
    ];
    const byContractor = applyCatalogFilters(
      catalog,
      { ...DEFAULT_CATALOG_FILTER_STATE, contractors: ["Foxwell"] },
      new Set(),
    );
    expect(byContractor).toHaveLength(1);
    expect(byContractor[0].blueprintId).toBe("bp_a");

    const byType = applyCatalogFilters(
      catalog,
      { ...DEFAULT_CATALOG_FILTER_STATE, missionTypes: ["Mercenary"] },
      new Set(),
    );
    expect(byType[0].blueprintId).toBe("bp_b");

    const byLegal = applyCatalogFilters(
      catalog,
      { ...DEFAULT_CATALOG_FILTER_STATE, lawful: "illegal" },
      new Set(),
    );
    expect(byLegal[0].blueprintId).toBe("bp_b");
  });

  it("filters by star system", () => {
    const state = {
      ...DEFAULT_CATALOG_FILTER_STATE,
      starSystems: ["Nyx"],
    };
    const out = applyCatalogFilters(sample, state, new Set());
    expect(out.map((b) => b.blueprintId)).toEqual(["bp_craft_test_a"]);
  });
});
