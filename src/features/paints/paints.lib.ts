import type { PaintSummary } from "@/features/paints/paints.types";

function pickString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ensureEventSources(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

export function normalizePaintSummary(raw: Record<string, unknown>): PaintSummary {
  return {
    uuid: String(raw.uuid ?? ""),
    name: String(raw.name ?? ""),
    nameFr: pickString(raw.nameFr ?? raw.name_fr),
    shipName: pickString(raw.shipName ?? raw.ship_name),
    manufacturerName: pickString(raw.manufacturerName ?? raw.manufacturer_name),
    manufacturerCode: pickString(raw.manufacturerCode ?? raw.manufacturer_code),
    eventSources: ensureEventSources(raw.eventSources ?? raw.event_sources),
    thumbnailUrl: pickString(raw.thumbnailUrl ?? raw.thumbnail_url),
    webUrl: pickString(raw.webUrl ?? raw.web_url),
    updatedAt: pickString(raw.updatedAt ?? raw.updated_at),
  };
}
