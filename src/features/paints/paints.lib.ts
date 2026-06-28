/** Corrections fabricant quand l’API Wiki est erronée (clé = tag Paint_* ou uuid). */
import type { PaintSummary } from "@/features/paints/paints.types";

export const PAINT_MANUFACTURER_OVERRIDES: Record<
  string,
  { manufacturerName: string; manufacturerCode?: string }
> = {
  Paint_Clipper: {
    manufacturerName: "Drake Interplanetary",
    manufacturerCode: "DRAK",
  },
};

const TITLE_SUFFIX_RE = /\s+(Paint|Livery|Skin)$/i;

export function cleanPaintTitle(name: string): string {
  return name.replace(TITLE_SUFFIX_RE, "").trim() || name;
}

export function isPaintSkin(paint: {
  name: string;
  isBaseVariant?: boolean | null;
}): boolean {
  if (paint.isBaseVariant === false) return true;
  if (paint.isBaseVariant === true) return false;
  return /\bskin\b/i.test(paint.name);
}

export function resolvePaintManufacturer(paint: {
  uuid: string;
  name: string;
  manufacturerName?: string | null;
  manufacturerCode?: string | null;
  shipName?: string | null;
}): { name: string | null; code: string | null } {
  const tagKey = paint.shipName ? `Paint_${paint.shipName}` : null;
  const override =
    PAINT_MANUFACTURER_OVERRIDES[paint.uuid] ??
    (tagKey ? PAINT_MANUFACTURER_OVERRIDES[tagKey] : undefined);

  if (override) {
    return {
      name: override.manufacturerName,
      code: override.manufacturerCode ?? paint.manufacturerCode ?? null,
    };
  }

  return {
    name: paint.manufacturerName ?? null,
    code: paint.manufacturerCode ?? null,
  };
}

export function paintDisplayTitle(paint: {
  name: string;
  nameFr?: string | null;
}): string {
  const raw = paint.nameFr?.trim() || paint.name;
  return cleanPaintTitle(raw);
}

export function normalizePaintSummary(raw: Record<string, unknown>): PaintSummary {
  return {
    uuid: String(raw.uuid ?? ""),
    name: String(raw.name ?? ""),
    nameFr: (raw.nameFr as string | null | undefined) ?? null,
    shipName: (raw.shipName as string | null | undefined) ?? null,
    manufacturerName: (raw.manufacturerName as string | null | undefined) ?? null,
    manufacturerCode: (raw.manufacturerCode as string | null | undefined) ?? null,
    eventSources: Array.isArray(raw.eventSources) ? (raw.eventSources as string[]) : [],
    thumbnailUrl: (raw.thumbnailUrl as string | null | undefined) ?? null,
    imageUrl: (raw.imageUrl as string | null | undefined) ?? null,
    descriptionEn: (raw.descriptionEn as string | null | undefined) ?? null,
    isBaseVariant: raw.isBaseVariant === undefined ? true : Boolean(raw.isBaseVariant),
    webUrl: (raw.webUrl as string | null | undefined) ?? null,
    updatedAt: (raw.updatedAt as string | null | undefined) ?? null,
  };
}
