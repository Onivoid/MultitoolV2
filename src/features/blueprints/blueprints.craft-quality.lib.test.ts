import { describe, expect, it } from "vitest";
import {
  computeModifierImpact,
  formatSignedPercent,
  modifierValueAtQuality,
  slotQualityBounds,
} from "@/features/blueprints/blueprints.craft-quality.lib";
import type { IngredientModifier } from "@/features/blueprints/blueprints.catalog.types";

const integrityMod: IngredientModifier = {
  propertyKey: "health_maxhealth",
  label: "Integrity",
  betterWhen: "higher",
  qualityMin: 0,
  qualityMax: 1000,
  modifierAtMinQuality: 0.9,
  modifierAtMaxQuality: 1.1,
};

describe("modifierValueAtQuality", () => {
  it("interpole à 500 comme base neutre", () => {
    expect(modifierValueAtQuality(integrityMod, 500)).toBeCloseTo(1.0, 5);
  });

  it("augmente vers max qualité", () => {
    expect(modifierValueAtQuality(integrityMod, 1000)).toBeCloseTo(1.1, 5);
  });
});

describe("formatSignedPercent", () => {
  it("préfixe + pour les valeurs positives", () => {
    expect(formatSignedPercent(6.2)).toBe("+6.2%");
  });

  it("garde le - pour les valeurs négatives", () => {
    expect(formatSignedPercent(-8)).toBe("-8%");
  });
});

describe("computeModifierImpact", () => {
  it("affiche + au-dessus de la qualité de base", () => {
    const impact = computeModifierImpact(integrityMod, 810, 500);
    expect(impact?.isPositive).toBe(true);
    expect(impact?.display).toBe("+6.2%");
    expect(impact?.percentVsBase).toBeGreaterThan(0);
  });

  it("neutre à la qualité initiale", () => {
    const impact = computeModifierImpact(integrityMod, 500, 500);
    expect(impact?.isNeutral).toBe(true);
    expect(impact?.display).toBe("0%");
  });

  it("affiche - sous la qualité de base", () => {
    const impact = computeModifierImpact(integrityMod, 200, 500);
    expect(impact?.display).toMatch(/^-/);
    expect(impact?.percentVsBase).toBeLessThan(0);
  });
});

describe("slotQualityBounds", () => {
  it("laisse monter le curseur au-dessus de la base 500", () => {
    const b = slotQualityBounds({
      initialQuality: 500,
      sliderMin: 1,
      sliderMax: 1000,
    });
    expect(b.max).toBeGreaterThan(b.initial);
    expect(b.max).toBe(1000);
  });
});
