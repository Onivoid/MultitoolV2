export interface VehicleSummary {
  uuid: string;
  name: string;
  slug: string;
  manufacturerName?: string | null;
  manufacturerCode?: string | null;
  sizeClass?: number | null;
  cargoCapacity?: number | null;
  speedScm?: number | null;
  speedMax?: number | null;
  crewMax?: number | null;
  health?: number | null;
  shieldHp?: number | null;
  pilotDps?: number | null;
  career?: string | null;
  role?: string | null;
  productionStatus?: string | null;
  className?: string | null;
  variantLabel?: string | null;
  displayName?: string | null;
  thumbnailUrl?: string | null;
  purchaseMinPrice?: number | null;
  rentalMinPrice?: number | null;
}

export interface VehicleDimensions {
  length?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface VehicleImage {
  source?: string | null;
  originalUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface VehicleUexLocation {
  name?: string | null;
  systemName?: string | null;
}

export interface VehicleUexPrice {
  priceBuy?: number | null;
  priceRent?: number | null;
  terminalName?: string | null;
  terminalCode?: string | null;
  location?: VehicleUexLocation | null;
  uexLink?: string | null;
}

export interface VehicleUexPrices {
  purchase: VehicleUexPrice[];
  rental: VehicleUexPrice[];
}

export interface VehiclePortSummary {
  name: string;
  categoryLabel?: string | null;
  itemName?: string | null;
  itemManufacturer?: string | null;
  itemTypeLabel?: string | null;
  itemSize?: number | null;
  itemGrade?: string | null;
  itemClass?: string | null;
  position?: string | null;
}

export interface LoadoutEntry {
  port: VehiclePortSummary;
  count: number;
}

export interface VehicleDetail extends VehicleSummary {
  dimensions: VehicleDimensions;
  descriptionFr?: string | null;
  descriptionEn?: string | null;
  gameName?: string | null;
  webUrl?: string | null;
  msrp?: number | null;
  pledgeUrl?: string | null;
  images: VehicleImage[];
  uexPrices: VehicleUexPrices;
  ports: VehiclePortSummary[];
}

export const MAX_COMPARE_SHIPS = 4;
