import { describe, expect, it } from "vitest";
import { catalogRowBadges } from "@/features/blueprints/blueprints.catalog.lib";
import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";

const base: BlueprintCatalogSummary = {
  wikiUuid: "u",
  blueprintId: "bp_craft_qrt_specialist_heavy_legs_01_01_01",
  nameEn: "Legs",
  nameFr: "Jambes",
  locKey: null,
  category: "Char_Armor_Legs",
  craftTimeSeconds: 60,
  tiers: 2,
  defaultOwned: false,
  version: null,
  classCode: "mili",
  size: 3,
  outputType: "Char_Armor_Legs",
  family: "armor",
  outputTypeLabel: "Legs (Armor)",
  summaryBadges: [
    { key: "slot-legs", label: "Legs", kind: "slot" },
    { key: "armor-heavy", label: "Heavy armor", kind: "armor_class" },
  ],
};

describe("catalogRowBadges", () => {
  it("utilise les summaryBadges backend en priorité", () => {
    const badges = catalogRowBadges(base);
    const labels = badges.map((b) => b.label);
    expect(labels).toContain("Legs");
    expect(labels).toContain("Heavy armor");
    expect(labels).not.toContain("Military");
  });

  it("associe un filtre outputType depuis le badge slot", () => {
    const badges = catalogRowBadges({
      ...base,
      summaryBadges: [{ key: "type", label: "Legs (Armor)", kind: "output_type" }],
    });
    const legs = badges.find((b) => b.label === "Legs (Armor)");
    expect(legs?.filter).toEqual({
      type: "outputType",
      value: "Char_Armor_Legs",
    });
  });

  it("affiche le grade depuis summaryBadges composant", () => {
    const badges = catalogRowBadges({
      ...base,
      outputType: "PowerPlant",
      family: "ship_component",
      summaryBadges: [
        { key: "grade-a", label: "A", kind: "grade" },
        { key: "size-1", label: "S1", kind: "size" },
      ],
    });
    expect(badges.map((b) => b.label)).toContain("A");
    expect(badges.map((b) => b.label)).toContain("S1");
  });

  it("fallback outputTypeLabel sans summaryBadges", () => {
    const badges = catalogRowBadges({
      ...base,
      summaryBadges: [],
      outputTypeLabel: "Helmet (Armor)",
      outputType: "Char_Armor_Helmet",
    });
    expect(badges.map((b) => b.label)).toContain("Helmet (Armor)");
  });

  it("badges Citadel-like : shield, grade B, industrial, S2", () => {
    const badges = catalogRowBadges({
      ...base,
      blueprintId: "bp_craft_shld_basl_citadel_01_s2",
      nameEn: "Citadel",
      outputType: "Shield",
      family: "ship_component",
      classCode: "indu",
      grade: "B",
      size: 2,
      outputTypeLabel: "Shield Generator",
      summaryBadges: [
        { key: "type", label: "Shield Generator", kind: "output_type" },
        { key: "grade", label: "B", kind: "grade" },
        { key: "size", label: "S2", kind: "size" },
        { key: "class", label: "Industrial", kind: "component_class" },
        { key: "mfg", label: "Basilisk", kind: "manufacturer" },
      ],
    });
    const labels = badges.map((b) => b.label);
    expect(labels).toContain("Shield Generator");
    expect(labels).toContain("B");
    expect(labels).toContain("S2");
    expect(labels).toContain("Industrial");
    const industrial = badges.find((b) => b.label === "Industrial");
    expect(industrial?.filter).toEqual({ type: "class", code: "indu" });
    const grade = badges.find((b) => b.label === "B");
    expect(grade?.filter).toEqual({ type: "grade", letter: "B" });
  });
});
