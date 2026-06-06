import type { IngredientModifier } from "@/features/blueprints/blueprints.catalog.types";

const DEFAULT_SLIDER_MIN = 1;
const DEFAULT_SLIDER_MAX = 1000;
const DEFAULT_INITIAL = 500;

export function slotQualityBounds(group: {
  sliderMin?: number | null;
  sliderMax?: number | null;
  initialQuality?: number | null;
  options?: { minQuality?: number | null }[];
}): { min: number; max: number; initial: number } {
  const minOpt = group.options?.reduce(
    (m, o) => Math.max(m, o.minQuality ?? 0),
    0,
  );
  const min = Math.max(
    group.sliderMin ?? DEFAULT_SLIDER_MIN,
    minOpt ?? 0,
    DEFAULT_SLIDER_MIN,
  );
  let max = group.sliderMax ?? DEFAULT_SLIDER_MAX;
  const initial = group.initialQuality ?? DEFAULT_INITIAL;
  // Le curseur doit pouvoir monter au-dessus de la qualité de base (sinon tout reste à 0 %).
  max = Math.max(max, DEFAULT_SLIDER_MAX, initial + 1, min + 1);
  const initialClamped = clamp(initial, min, max);
  return {
    min,
    max,
    initial: initialClamped,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Interpolation linéaire du multiplicateur Wiki à une qualité donnée. */
export function modifierValueAtQuality(
  mod: IngredientModifier,
  quality: number,
): number | null {
  const qMin = mod.qualityMin ?? 0;
  const qMax = mod.qualityMax ?? 1000;
  const mMin = mod.modifierAtMinQuality;
  const mMax = mod.modifierAtMaxQuality;
  if (mMin == null || mMax == null || qMax <= qMin) return null;
  const t = clamp((quality - qMin) / (qMax - qMin), 0, 1);
  return mMin + t * (mMax - mMin);
}

export interface ModifierImpact {
  label: string;
  /** Variation en % par rapport à la qualité de base (initial). */
  percentVsBase: number;
  /** Texte affiché type Wiki. */
  display: string;
  isPositive: boolean;
  isNeutral: boolean;
}

/** Affichage signé type Wiki : +12.4 %, -8.0 %, 0 % */
export function formatSignedPercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10;
  if (Math.abs(rounded) < 0.05) return "0%";
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}

/**
 * Écart en % du multiplicateur par rapport à 100 % (valeur 1.0), comme l’UI Wiki.
 * À la qualité de base le multiplicateur vaut en général 1.0 → 0 %.
 */
export function computeModifierImpact(
  mod: IngredientModifier,
  quality: number,
  baseQuality: number,
): ModifierImpact | null {
  const current = modifierValueAtQuality(mod, quality);
  if (current == null) return null;

  const percentVsNominal = (current - 1) * 100;
  const atBase = modifierValueAtQuality(mod, baseQuality);
  const isNeutral =
    atBase != null && Math.abs(current - atBase) < 0.0001;

  if (isNeutral || Math.abs(percentVsNominal) < 0.05) {
    return {
      label: mod.label,
      percentVsBase: 0,
      display: "0%",
      isPositive: false,
      isNeutral: true,
    };
  }

  const favorable =
    mod.betterWhen === "lower"
      ? percentVsNominal < 0
      : percentVsNominal > 0;

  return {
    label: mod.label,
    percentVsBase: percentVsNominal,
    display: formatSignedPercent(percentVsNominal),
    isPositive: favorable,
    isNeutral: false,
  };
}

export function groupHasQualitySliders(group: {
  modifiers?: IngredientModifier[];
  sliderMin?: number | null;
  sliderMax?: number | null;
  initialQuality?: number | null;
}): boolean {
  return (
    (group.modifiers?.length ?? 0) > 0 &&
    (group.initialQuality != null ||
      group.sliderMin != null ||
      group.sliderMax != null)
  );
}
