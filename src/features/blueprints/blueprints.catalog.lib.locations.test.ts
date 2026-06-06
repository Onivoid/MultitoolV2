import { describe, expect, it } from "vitest";
import {
  formatLocationSpawnPercent,
  sortLocationsBySpawn,
} from "@/features/blueprints/blueprints.catalog.lib";
import type { IngredientLocationPreview } from "@/features/blueprints/blueprints.catalog.types";

describe("sortLocationsBySpawn", () => {
  it("trie par probabilité décroissante", () => {
    const input: IngredientLocationPreview[] = [
      { name: "B", system: null, locationType: null, spawnPercent: 10 },
      { name: "A", system: null, locationType: null, spawnPercent: 30 },
      { name: "C", system: null, locationType: null, spawnPercent: null },
    ];
    const out = sortLocationsBySpawn(input);
    expect(out.map((l) => l.name)).toEqual(["A", "B", "C"]);
  });
});

describe("formatLocationSpawnPercent", () => {
  it("formate un pourcentage entier", () => {
    expect(formatLocationSpawnPercent(20)).toBe("20%");
  });

  it("formate une décimale", () => {
    expect(formatLocationSpawnPercent(28.5)).toBe("28.5%");
  });
});
