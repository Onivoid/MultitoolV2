import { describe, expect, it } from "vitest";
import {
  aggregateLoadoutEntries,
  collectCompareLoadoutGroups,
  formatComponentClass,
  groupPortsByType,
  isExcludedLoadoutGroup,
  isPlaceholderLoadoutItem,
  portsWithEquippedItems,
} from "@/features/ships/ships.loadout.lib";

describe("ships.loadout.lib", () => {
  it("exclut les placeholders API", () => {
    expect(isPlaceholderLoadoutItem("<= PLACEHOLDER =>")).toBe(true);
    expect(isPlaceholderLoadoutItem("Bracer")).toBe(false);
  });

  it("portsWithEquippedItems ignore placeholders", () => {
    const ports = portsWithEquippedItems([
      { name: "a", itemName: "Bracer" },
      { name: "b", itemName: "<= PLACEHOLDER =>" },
      { name: "c", itemName: null },
    ]);

    expect(ports).toHaveLength(1);
    expect(ports[0]?.itemName).toBe("Bracer");
  });

  it("traduit les classes de composants", () => {
    expect(formatComponentClass("Industrial")).toBe("Industriel");
    expect(formatComponentClass("Military")).toBe("Militaire");
  });

  it("agrège les missiles identiques", () => {
    const missile = {
      itemName: "Ignite II Missile",
      itemManufacturer: "FireStorm Kinetics",
      itemTypeLabel: "Missile",
      itemSize: 2,
      itemGrade: "A",
    };

    const grouped = groupPortsByType([
      { name: "missile_01", ...missile },
      { name: "missile_02", ...missile },
      { name: "missile_03", ...missile },
      { name: "missile_04", ...missile },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.items).toHaveLength(1);
    expect(grouped[0]?.items[0]?.count).toBe(4);
    expect(grouped[0]?.items[0]?.port.itemName).toBe("Ignite II Missile");
  });

  it("agrège les composants identiques dans aggregateLoadoutEntries", () => {
    const entries = aggregateLoadoutEntries([
      {
        name: "hardpoint_cooler_left",
        itemName: "Bracer",
        itemClass: "Military",
        itemGrade: "C",
        itemSize: 1,
      },
      {
        name: "hardpoint_cooler_right",
        itemName: "Bracer",
        itemClass: "Military",
        itemGrade: "C",
        itemSize: 1,
      },
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.count).toBe(2);
  });

  it("masque les catégories non pertinentes", () => {
    const grouped = groupPortsByType([
      { name: "a", itemName: "Bracer", itemTypeLabel: "Cooler" },
      { name: "b", itemName: "HEAT", itemTypeLabel: "Cooler Controller" },
      { name: "c", itemName: "POWER", itemTypeLabel: "Energy Controller" },
      { name: "d", itemName: "Door", itemTypeLabel: "Door" },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.group).toBe("Cooler");
    expect(isExcludedLoadoutGroup("Shield Controller")).toBe(true);
    expect(isExcludedLoadoutGroup("Cooler")).toBe(false);
  });

  it("collectCompareLoadoutGroups aligne les catégories entre vaisseaux", () => {
    const groups = collectCompareLoadoutGroups([
      [{ name: "a", itemName: "Bracer", itemTypeLabel: "Cooler" }],
      [{ name: "b", itemName: "Snowfall", itemTypeLabel: "Cooler" }],
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.group).toBe("Cooler");
    expect(groups[0]?.itemsByShip[0]?.[0]?.port.itemName).toBe("Bracer");
    expect(groups[0]?.itemsByShip[1]?.[0]?.port.itemName).toBe("Snowfall");
  });
});
