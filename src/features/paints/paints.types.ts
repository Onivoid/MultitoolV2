export interface PaintSummary {
  uuid: string;
  name: string;
  nameFr?: string | null;
  shipName?: string | null;
  manufacturerName?: string | null;
  manufacturerCode?: string | null;
  eventSources: string[];
  thumbnailUrl?: string | null;
  webUrl?: string | null;
  updatedAt?: string | null;
}

export const PAINT_EVENT_CHIP_PRIORITY = [
  "Limited",
  "IAE",
  "Best in Show",
  "Concierge",
  "Invictus Launch Week",
  "Luminalia",
  "Red Festival",
  "Foundation Festival",
  "Faction Reward",
  "Contested Zone",
] as const;
