import type {
  VehicleDetail,
  VehicleDimensions,
  VehicleImage,
  VehiclePortSummary,
  VehicleSummary,
  VehicleUexPrice,
  VehicleUexPrices,
} from "@/features/ships/ships.types";
import {
  canonicalProductionStatus,
  isWikiPlaceholder,
  sanitizeCatalogText,
} from "@/features/ships/ships.catalog.lib";

function pickString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickFlexibleString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(Math.round(value)) : String(value);
  }
  return pickString(value);
}

function pickInt(value: unknown): number | null {
  const n = pickNumber(value);
  return n == null ? null : Math.round(n);
}

function normalizeDimensions(raw: Record<string, unknown> | undefined): VehicleDimensions {
  if (!raw) return {};
  return {
    length: pickNumber(raw.length),
    width: pickNumber(raw.width ?? raw.beam),
    height: pickNumber(raw.height),
  };
}

function normalizeUexLocation(raw: unknown): VehicleUexPrice["location"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    name: pickString(o.name),
    systemName: pickString(o.systemName ?? o.system_name),
  };
}

function normalizeUexPrice(raw: unknown): VehicleUexPrice {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    priceBuy: pickInt(o.priceBuy ?? o.price_buy),
    priceRent: pickInt(o.priceRent ?? o.price_rent),
    terminalName: pickString(o.terminalName ?? o.terminal_name),
    terminalCode: pickString(o.terminalCode ?? o.terminal_code),
    location: normalizeUexLocation(o.location ?? o.starmap_location),
    uexLink: pickString(o.uexLink ?? o.uex_link),
  };
}

function normalizeUexPrices(raw: unknown): VehicleUexPrices {
  if (!raw || typeof raw !== "object") {
    return { purchase: [], rental: [] };
  }
  const o = raw as Record<string, unknown>;
  const purchase = Array.isArray(o.purchase)
    ? o.purchase.map(normalizeUexPrice)
    : [];
  const rental = Array.isArray(o.rental) ? o.rental.map(normalizeUexPrice) : [];
  return { purchase, rental };
}

function normalizeImage(raw: unknown): VehicleImage {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    source: pickString(o.source),
    originalUrl: pickString(o.originalUrl ?? o.original_url),
    thumbnailUrl: pickString(o.thumbnailUrl ?? o.thumbnail_url),
  };
}

function nestedItemRecord(raw: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of ["equippedItem", "equipped_item", "item"] as const) {
    const value = raw[key];
    if (value && typeof value === "object") {
      return value as Record<string, unknown>;
    }
  }
  return null;
}

export function normalizePort(raw: unknown): VehiclePortSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = pickString(o.name);
  if (!name) return null;

  const nested = nestedItemRecord(o);
  const nestedMfr =
    nested?.manufacturer && typeof nested.manufacturer === "object"
      ? (nested.manufacturer as Record<string, unknown>)
      : null;

  return {
    name,
    categoryLabel: pickString(o.categoryLabel ?? o.category_label),
    itemName:
      pickString(o.itemName ?? o.item_name) ?? pickString(nested?.name),
    itemManufacturer:
      pickString(o.itemManufacturer ?? o.item_manufacturer) ??
      pickString(nestedMfr?.name),
    itemTypeLabel:
      pickString(o.itemTypeLabel ?? o.item_type_label) ??
      pickString(nested?.typeLabel ?? nested?.type_label),
    itemSize:
      pickInt(o.itemSize ?? o.item_size) ?? pickInt(nested?.size),
    itemGrade:
      pickFlexibleString(o.itemGrade ?? o.item_grade) ??
      pickFlexibleString(nested?.grade),
    itemClass:
      pickFlexibleString(o.itemClass ?? o.item_class) ??
      pickFlexibleString(nested?.class ?? nested?.item_class),
    position: pickString(o.position),
  };
}

export function normalizeVehicleSummary(raw: Record<string, unknown>): VehicleSummary {
  const name = String(raw.name ?? "");
  const displayName =
    sanitizeCatalogText(pickString(raw.displayName ?? raw.display_name)) ?? name;

  return {
    uuid: String(raw.uuid ?? ""),
    name,
    slug: String(raw.slug ?? ""),
    manufacturerName: sanitizeCatalogText(
      pickString(raw.manufacturerName ?? raw.manufacturer_name),
    ),
    manufacturerCode: sanitizeCatalogText(
      pickString(raw.manufacturerCode ?? raw.manufacturer_code),
    ),
    sizeClass: pickInt(raw.sizeClass ?? raw.size_class),
    cargoCapacity: pickNumber(raw.cargoCapacity ?? raw.cargo_capacity),
    speedScm: pickNumber(raw.speedScm ?? raw.speed_scm),
    speedMax: pickNumber(raw.speedMax ?? raw.speed_max),
    crewMax: pickInt(raw.crewMax ?? raw.crew_max),
    health: pickNumber(raw.health),
    shieldHp: pickNumber(raw.shieldHp ?? raw.shield_hp),
    pilotDps: pickNumber(raw.pilotDps ?? raw.pilot_dps),
    career: sanitizeCatalogText(pickString(raw.career)),
    role: sanitizeCatalogText(pickString(raw.role)),
    productionStatus: canonicalProductionStatus(
      pickString(raw.productionStatus ?? raw.production_status),
    ),
    className: sanitizeCatalogText(pickString(raw.className ?? raw.class_name)),
    variantLabel: sanitizeCatalogText(pickString(raw.variantLabel ?? raw.variant_label)),
    displayName,
    thumbnailUrl: pickString(raw.thumbnailUrl ?? raw.thumbnail_url),
    purchaseMinPrice: pickInt(raw.purchaseMinPrice ?? raw.purchase_min_price),
    rentalMinPrice: pickInt(raw.rentalMinPrice ?? raw.rental_min_price),
  };
}

export function normalizeVehicleDetail(raw: Record<string, unknown>): VehicleDetail {
  const summary = normalizeVehicleSummary(raw);
  const dimsRaw =
    raw.dimensions && typeof raw.dimensions === "object"
      ? (raw.dimensions as Record<string, unknown>)
      : undefined;
  const images = Array.isArray(raw.images)
    ? raw.images.map(normalizeImage).filter((img) => img.originalUrl || img.thumbnailUrl)
    : [];
  const ports = Array.isArray(raw.ports)
    ? raw.ports.map(normalizePort).filter((p): p is VehiclePortSummary => p != null)
    : [];
  return {
    ...summary,
    dimensions: normalizeDimensions(dimsRaw),
    descriptionFr: pickString(raw.descriptionFr ?? raw.description_fr),
    descriptionEn: pickString(raw.descriptionEn ?? raw.description_en),
    gameName: pickString(raw.gameName ?? raw.game_name),
    webUrl: pickString(raw.webUrl ?? raw.web_url),
    msrp: pickInt(raw.msrp),
    pledgeUrl: pickString(raw.pledgeUrl ?? raw.pledge_url),
    images,
    uexPrices: normalizeUexPrices(raw.uexPrices ?? raw.uex_prices),
    ports,
  };
}

export function formatStat(value: number | null | undefined, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("fr-FR")}${suffix}`;
}

export function shipMatchesSearch(ship: VehicleSummary, query: string): boolean {
  if (!query) return true;
  const haystack = [
    ship.name,
    ship.displayName,
    ship.variantLabel,
    ship.className,
    ship.slug,
    ship.manufacturerName,
    ship.manufacturerCode,
    ship.career,
    ship.role,
    ship.productionStatus,
  ]
    .filter((value) => value && !isWikiPlaceholder(value))
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}
