import { describe, expect, it } from "vitest";
import { classifyBlueprintFamily } from "@/features/blueprints/blueprints.taxonomy";
import {
  expectedSummaryBadgeKinds,
  FAMILY_BADGE_SPECS,
  isGenericBadgeLabel,
  isUsefulOutputTypeLabel,
  isUsefulSubTypeLabel,
  referenceFamilyForWikiOutputType,
  SHIP_COMPONENT_TYPE_LABELS,
} from "@/features/blueprints/blueprints.taxonomy.reference";

describe("blueprints.taxonomy.reference", () => {
  it("referenceFamilyForWikiOutputType aligné sur classifyBlueprintFamily", () => {
    const cases: [string, ReturnType<typeof classifyBlueprintFamily>][] = [
      ["Char_Armor_Helmet", "armor"],
      ["WeaponPersonal", "fps_weapon"],
      ["WeaponGun", "ship_weapon"],
      ["PowerPlant", "ship_component"],
      ["WeaponMining", "mining"],
      ["DockingCollar", "refuel"],
      ["Misc", "other"],
      ["ShipEngine", "ship_component"],
    ];
    for (const [type, family] of cases) {
      expect(referenceFamilyForWikiOutputType(type)).toBe(family);
      expect(classifyBlueprintFamily(type)).toBe(family);
    }
  });

  it("ship_component a les 5 badges summary attendus", () => {
    expect(expectedSummaryBadgeKinds("ship_component")).toEqual([
      "output_type",
      "grade",
      "size",
      "component_class",
      "manufacturer",
    ]);
  });

  it("ship_weapon liste : size seulement", () => {
    expect(expectedSummaryBadgeKinds("ship_weapon")).toEqual(["size"]);
  });

  it("other n'a pas de badges summary", () => {
    expect(FAMILY_BADGE_SPECS.other).toHaveLength(0);
  });

  it("rejette les labels génériques", () => {
    expect(isGenericBadgeLabel("Medium")).toBe(true);
    expect(isGenericBadgeLabel("Weapon Gun")).toBe(true);
    expect(isGenericBadgeLabel("Shield Generator")).toBe(false);
    expect(isUsefulOutputTypeLabel("Medium")).toBe(false);
    expect(isUsefulOutputTypeLabel("Shield Generator")).toBe(true);
    expect(isUsefulSubTypeLabel("medium")).toBe(false);
    expect(isUsefulSubTypeLabel("Light Armor")).toBe(true);
  });

  it("SHIP_COMPONENT_TYPE_LABELS couvre les types principaux", () => {
    expect(SHIP_COMPONENT_TYPE_LABELS.PowerPlant).toBe("Power Plant");
    expect(SHIP_COMPONENT_TYPE_LABELS.Shield).toBe("Shield Generator");
  });
});
