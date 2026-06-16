import type { BlueprintFamily } from "@/features/blueprints/blueprints.taxonomy";

export interface ApiCatalogBadge {
  key: string;
  label: string;
  kind: string;
}

export interface DescriptionDataRow {
  name: string;
  value: string;
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface SummaryPropertyRow {
  propertyKey: string | null;
  label: string;
  betterWhen: string | null;
}

export interface BlueprintItemProfile {
  itemUuid: string | null;
  descriptionData: DescriptionDataRow[];
  manufacturerName: string | null;
  size: number | null;
  imageUrl: string | null;
  classificationLabel: string | null;
  itemTypeLabel: string | null;
}

export interface BlueprintCatalogSummary {
  wikiUuid: string;
  blueprintId: string;
  nameEn: string;
  nameFr: string | null;
  locKey: string | null;
  category: string | null;
  craftTimeSeconds: number | null;
  tiers: number | null;
  defaultOwned: boolean;
  version: string | null;
  classCode: string | null;
  size: number | null;
  /** Grade objet (A–G). */
  grade?: string | null;
  subType?: string | null;
  /** Code fabricant (ex. KSAR, AMRS). */
  manufacturer?: string | null;
  /** Nom complet fabricant pour l’affichage. */
  manufacturerName?: string | null;
  outputType?: string | null;
  ingredientCount?: number | null;
  unlockingMissionsCount?: number | null;
  resourceUuids?: string[];
  webUrl?: string | null;
  unlockSystems?: string[];
  unlockJurisdictions?: string[];
  unlockContractors?: string[];
  unlockMissionTypes?: string[];
  unlockLawful?: boolean[];
  family?: BlueprintFamily | string | null;
  outputTypeLabel?: string | null;
  summaryBadges?: ApiCatalogBadge[];
}

export interface IngredientModifier {
  propertyKey: string | null;
  label: string;
  betterWhen: string | null;
  qualityMin: number | null;
  qualityMax: number | null;
  modifierAtMinQuality: number | null;
  modifierAtMaxQuality: number | null;
}

export interface IngredientLocationPreview {
  name: string;
  system: string | null;
  locationType: string | null;
  /** Probabilité de spawn / groupe à ce lieu (0–100), si fournie par le Wiki. */
  spawnPercent?: number | null;
}

export interface IngredientEnrichment {
  sourceKind: string;
  tier: string | null;
  rarity: string | null;
  kindLabel: string | null;
  methods: string[];
  systems: string[];
  locationPreview: IngredientLocationPreview[];
  locationCount: number | null;
  refinedVersionName: string | null;
  density: number | null;
  signature: number | null;
  descriptionShort: string | null;
  harvestHints: string[];
  thumbnailUrl: string | null;
}

export interface IngredientOption {
  kind: string | null;
  guid: string | null;
  oreUuid: string | null;
  name: string;
  nameFr: string | null;
  locKey: string | null;
  quantityScu: number | null;
  quantity: number | null;
  minQuality: number | null;
  unit: string | null;
  webUrl: string | null;
  apiLink: string | null;
  enrichment: IngredientEnrichment | null;
}

export interface IngredientGroup {
  slot: string;
  slotKey?: string | null;
  slotLocKey: string | null;
  slotLabelFr: string | null;
  requiredCount: number | null;
  modifiers: IngredientModifier[];
  options: IngredientOption[];
  initialQuality?: number | null;
  sliderMin?: number | null;
  sliderMax?: number | null;
}

export interface DismantleReturn {
  name: string;
  resourceUuid: string | null;
  quantityScu: number | null;
  webUrl: string | null;
}

export interface BlueprintDismantle {
  timeSeconds: number | null;
  timeLabel: string | null;
  efficiency: number | null;
  returns: DismantleReturn[];
}

export interface BlueprintAspectSlot {
  key: string;
  name: string;
  label: string;
  initialQuality: number | null;
  sliderMin: number | null;
  sliderMax: number | null;
  hasModifiers: boolean;
  modifiers?: IngredientModifier[];
}

export interface BlueprintAspectsSummary {
  hasInteractive: boolean;
  slots: BlueprintAspectSlot[];
}

export interface MissionInfo {
  missionId: number | null;
  missionUuid: string | null;
  nameRaw: string;
  nameFr: string | null;
  locKey: string | null;
  descriptionEn: string | null;
  descriptionFr: string | null;
  descriptionLocKey: string | null;
  contractor: string | null;
  missionType: string | null;
  category: string | null;
  lawful: boolean | null;
  notForRelease: boolean | null;
  dropChance: string | null;
  locations: string | null;
  timeToCompleteMinutes: number | null;
  minStandingName: string | null;
  minStandingReputation: number | null;
  standingReward: number | null;
  shareable: boolean | null;
  rankIndex: number | null;
  debugName: string | null;
  webUrl: string | null;
  starSystems: string[];
  jurisdictions: string[];
}

export interface MissionBlueprintReward {
  blueprintId: string | null;
  wikiUuid: string | null;
  nameEn: string;
  nameFr: string | null;
  isDirectUnlock: boolean;
}

export interface MissionDetailResult {
  missionUuid: string;
  title: string;
  starSystems: string[];
  jurisdictions: string[];
  illegal: boolean | null;
  faction: string | null;
  missionGiver: string | null;
  webUrl: string | null;
  shareable: boolean | null;
  rankIndex: number | null;
  minStandingName: string | null;
  minStandingReputation: number | null;
  missionType: string | null;
  timeToCompleteMinutes: number | null;
  blueprintRewards: MissionBlueprintReward[];
}

export interface BlueprintCatalogDetail extends BlueprintCatalogSummary {
  ingredients: IngredientGroup[];
  missions: MissionInfo[];
  itemStats: Record<string, unknown> | null;
  dismantle: BlueprintDismantle | null;
  aspects: BlueprintAspectsSummary | null;
  itemProfile?: BlueprintItemProfile | null;
  heroStats?: HeroStat[];
  catalogBadges?: ApiCatalogBadge[];
  summaryProperties?: SummaryPropertyRow[];
}

export interface BlueprintCatalogRevalidateResult {
  list: BlueprintCatalogSummary[];
  newCount: number;
  removedCount: number;
  changed: boolean;
}

export interface FilterValue {
  value: string | number | boolean | null;
  label: string;
  count: number;
}

export interface BlueprintCatalogFilters {
  outputType: FilterValue[];
  ingredientUuid: FilterValue[];
  resourceUuid: FilterValue[];
}

export interface WikiItemsFilters {
  category: string;
  type: FilterValue[];
  class: FilterValue[];
  grade: FilterValue[];
  size: FilterValue[];
  manufacturer: FilterValue[];
}

export type BlueprintOwnedFilter = "all" | "owned" | "not_owned" | "wishlist";

export type BlueprintClassCode = "civi" | "mili" | "indu" | "stlh" | "comp";

export type CatalogSortKey =
  | "nameFr"
  | "nameEn"
  | "craftTime"
  | "size"
  | "missions"
  | "unlockDate";
