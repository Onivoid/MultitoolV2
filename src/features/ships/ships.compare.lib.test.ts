import { describe, expect, it } from "vitest";
import { compareBestIndices } from "@/features/ships/ships.compare.lib";

describe("ships.compare.lib", () => {
  it("ne surligne pas quand toutes les valeurs sont identiques", () => {
    expect(compareBestIndices([100, 100, 100])).toEqual(new Set());
    expect(compareBestIndices([50, 50], { lowerIsBetter: true })).toEqual(new Set());
  });

  it("surligne le maximum quand les valeurs diffèrent", () => {
    expect(compareBestIndices([100, 120, 80])).toEqual(new Set([1]));
    expect(compareBestIndices([100, 120, 120])).toEqual(new Set([1, 2]));
  });

  it("surligne le minimum en mode lowerIsBetter", () => {
    expect(
      compareBestIndices([1_000_000, 800_000, 900_000], { lowerIsBetter: true }),
    ).toEqual(new Set([1]));
  });

  it("ignore les valeurs manquantes", () => {
    expect(compareBestIndices([null, 50, 50])).toEqual(new Set());
    expect(compareBestIndices([null, 40, 60])).toEqual(new Set([2]));
  });
});
