import { describe, expect, it } from "vitest";
import {
  buildAmbiguousLinks,
  matchProductName,
  normalizeBlueprintName,
} from "@/features/blueprints/blueprints.match.lib";
import type { BlueprintEntry } from "@/features/blueprints/blueprints.lib";
import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";

const sampleCatalog: BlueprintCatalogSummary[] = [
  {
    wikiUuid: "00000000-0000-0000-0000-000000000001",
    blueprintId: "bp_craft_morozov_legs",
    nameEn: "Morozov-SH Legs",
    nameFr: "Jambes Morozov-SH Thule",
    locKey: null,
    category: "Personalgear / Legs",
    craftTimeSeconds: 60,
    tiers: 1,
    defaultOwned: false,
    version: null,
    classCode: "mili",
    size: null,
  },
];

describe("normalizeBlueprintName", () => {
  it("strip accents and punctuation", () => {
    expect(normalizeBlueprintName("Jambes Morozov-SH Thule")).toBe(
      "jambesmorozovshthule",
    );
  });
});

describe("buildAmbiguousLinks", () => {
  it("détecte plusieurs noms FR vers le même blueprint_id", () => {
    const entries: BlueprintEntry[] = [
      {
        owner: "Test",
        productName: "Chargeur A",
        ts: 1,
        catalogBlueprintId: "bp_craft_same_charger",
      },
      {
        owner: "Test",
        productName: "Chargeur B",
        ts: 2,
        catalogBlueprintId: "bp_craft_same_charger",
      },
      {
        owner: "Test",
        productName: "Pistolet X",
        ts: 3,
        catalogBlueprintId: "bp_craft_unique_gun",
      },
    ];
    const sampleByProduct = new Map(entries.map((e) => [e.productName, e] as const));
    const matchMap: Record<string, string> = {
      "Chargeur A": "bp_craft_same_charger",
      "Chargeur B": "bp_craft_same_charger",
      "Pistolet X": "bp_craft_unique_gun",
    };
    const links = buildAmbiguousLinks(
      ["Chargeur A", "Chargeur B", "Pistolet X"],
      sampleByProduct,
      matchMap,
    );
    expect(links).toHaveLength(1);
    expect(links[0]?.catalogBlueprintId).toBe("bp_craft_same_charger");
    expect(links[0]?.productNames).toEqual(["Chargeur A", "Chargeur B"]);
  });
});

describe("matchProductName", () => {
  it("matches French log name to catalog", () => {
    expect(matchProductName("Jambes Morozov-SH Thule", sampleCatalog)).toBe(
      "bp_craft_morozov_legs",
    );
  });

  it("matches English name", () => {
    expect(matchProductName("Morozov-SH Legs", sampleCatalog)).toBe(
      "bp_craft_morozov_legs",
    );
  });
});
