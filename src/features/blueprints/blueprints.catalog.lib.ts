import type {
  ApiCatalogBadge,
  BlueprintCatalogDetail,
  BlueprintCatalogSummary,
  BlueprintClassCode,
  BlueprintItemProfile,
  DescriptionDataRow,
  HeroStat,
  IngredientEnrichment,
  IngredientGroup,
  IngredientLocationPreview,
  IngredientOption,
  MissionInfo,
  SummaryPropertyRow,
} from "@/features/blueprints/blueprints.catalog.types";
import {
  classifyBlueprintFamily,
  type BlueprintFamily,
} from "@/features/blueprints/blueprints.taxonomy";
import {
  isUsefulOutputTypeLabel,
  isUsefulSubTypeLabel,
} from "@/features/blueprints/blueprints.taxonomy.reference";

export function formatCraftDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return "—";
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m || h) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

export function cleanScText(input: string | null | undefined): string {
  if (!input) return "";
  let out = input;
  out = out.replace(/<\/?EM\d+>/gi, "");
  out = out.replace(/~mission\(Location[^)]*\)/gi, "[Lieu]");
  out = out.replace(/~mission\(Destination[^)]*\)/gi, "[Destination]");
  out = out.replace(/~mission\(TargetName[^)]*\)/gi, "[Cible]");
  out = out.replace(/~mission\(StoreName[^)]*\)/gi, "[Magasin]");
  out = out.replace(/~mission\(System[^)]*\)/gi, "[Système]");
  out = out.replace(/~mission\([^)]+\)/g, "[…]");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

export function shortCategory(category: string | null | undefined): string {
  if (!category) return "—";
  const parts = category
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || category;
}

const CATEGORY_FR: Record<string, string> = {
  Shield: "Bouclier",
  Cooler: "Refroidisseur",
  Quantumdrive: "Moteur Quantum",
  Powerplant: "Réacteur",
  Radar: "Radar",
  Weapons: "Armes",
  Cannon: "Canon",
  Vehiclegear: "Équip. vaisseau",
  Personalgear: "Équip. perso",
  // Star Citizen Wiki `output.type_label` / types
  "Weapon Gun": "Arme",
  WeaponGun: "Arme",
  WeaponPersonal: "Arme personnelle",
  Char_Armor_Torso: "Armure (torse)",
  Char_Armor_Arms: "Armure (bras)",
  Char_Armor_Legs: "Armure (jambes)",
  Char_Armor_Helmet: "Casque",
  WeaponAttachment: "Accessoire d'arme",
  ShipWeapon: "Arme de vaisseau",
  ShipEngine: "Moteur",
  ShipShield: "Bouclier",
  ShipPowerPlant: "Réacteur",
  ShipCooler: "Refroidisseur",
  ShipQuantumDrive: "Moteur quantum",
  ShipRadar: "Radar",
  ShipMissile: "Missile",
  ShipTurret: "Tourelle",
  ShipMissileLauncher: "Lance-missiles",
  ShipSelfDestruct: "Autodestruction",
  ShipQuantumInterdictionGenerator: "QID",
  ShipSalvageModifier: "Salvage",
  ShipMiningModifier: "Mining",
  ShipTractorBeam: "Rayon tracteur",
  ShipGravDrive: "Grav drive",
  ShipWeaponController: "Contrôleur d'armes",
  ShipMissileRack: "Rack missiles",
  ShipWeaponMissile: "Missile embarqué",
  Misc: "Divers",
  QuantumInterdictionGenerator: "Générateur QID",
  TowingBeam: "Rayon de remorquage",
  EMP: "IEM",
  Bomb: "Bombe",
  Missile: "Missile",
};

export function categoryLabelFr(category: string | null | undefined): string {
  const key = shortCategory(category);
  return CATEGORY_FR[key] ?? key;
}

const CLASS_PREFIX_MAP: Record<string, BlueprintClassCode> = {
  Civ: "civi",
  Civi: "civi",
  Mil: "mili",
  Mili: "mili",
  Ind: "indu",
  Indu: "indu",
  Stl: "stlh",
  Stlh: "stlh",
  Cmp: "comp",
  Comp: "comp",
};

export function resolveBlueprintClass(
  b: BlueprintCatalogSummary,
): BlueprintClassCode | null {
  const code = b.classCode;
  if (
    code === "civi" ||
    code === "mili" ||
    code === "indu" ||
    code === "stlh" ||
    code === "comp"
  ) {
    return code;
  }
  const m = b.nameEn?.match(/^(Civ|Civi|Mil|Mili|Ind|Indu|Stl|Stlh|Cmp|Comp)\b/);
  if (m) return CLASS_PREFIX_MAP[m[1]] ?? null;
  return null;
}

export const CLASS_LABEL_FR: Record<BlueprintClassCode, string> = {
  civi: "Civil",
  mili: "Militaire",
  indu: "Industriel",
  stlh: "Furtif",
  comp: "Compétition",
};

/** Libellés badges catalogue (anglais, alignés armure / wiki). */
export const CLASS_LABEL_EN: Record<BlueprintClassCode, string> = {
  civi: "Civilian",
  mili: "Military",
  indu: "Industrial",
  stlh: "Stealth",
  comp: "Competition",
};

const OUTPUT_TYPE_BADGE_EN: Record<string, string> = {
  Shield: "Shield",
  Cooler: "Cooler",
  Quantumdrive: "Quantum drive",
  Powerplant: "Power plant",
  Radar: "Radar",
  Weapons: "Weapons",
  Cannon: "Cannon",
  "Weapon Gun": "Weapon",
  WeaponGun: "Weapon",
  WeaponPersonal: "Personal weapon",
  Char_Armor_Torso: "Torso",
  Char_Armor_Arms: "Arms",
  Char_Armor_Legs: "Legs",
  Char_Armor_Helmet: "Helmet",
  WeaponAttachment: "Weapon attachment",
  ShipWeapon: "Ship weapon",
  ShipEngine: "Engine",
  ShipShield: "Shield",
  ShipPowerPlant: "Power plant",
  ShipCooler: "Cooler",
  ShipQuantumDrive: "Quantum drive",
  ShipRadar: "Radar",
  ShipMissile: "Missile",
  ShipTurret: "Turret",
  ShipMissileLauncher: "Missile launcher",
  ShipSelfDestruct: "Self destruct",
  ShipQuantumInterdictionGenerator: "QID",
  ShipSalvageModifier: "Salvage mod",
  ShipMiningModifier: "Mining mod",
  ShipTractorBeam: "Tractor beam",
  ShipGravDrive: "Grav drive",
  ShipWeaponController: "Weapon controller",
  ShipMissileRack: "Missile rack",
  ShipWeaponMissile: "Ship missile",
  Vehiclegear: "Vehicle gear",
  Personalgear: "Personal gear",
};

/** Libellé court anglais pour badge type (pas le libellé FR du détail). */
export function outputTypeLabelEn(type: string | null | undefined): string | null {
  if (!type) return null;
  const key = type.includes("/") ? (type.split("/").pop() ?? type) : type;
  if (OUTPUT_TYPE_BADGE_EN[key]) return OUTPUT_TYPE_BADGE_EN[key];

  const armor = key.match(/^Char_Armor_(\w+)$/i);
  if (armor) {
    const slot = armor[1].toLowerCase();
    if (slot === "torso") return ARMOR_SLOT_BADGE.core;
    return ARMOR_SLOT_BADGE[slot] ?? null;
  }

  const human = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  if (human.length < 2 || /^misc$/i.test(human)) return null;
  return human;
}

export function rootSystem(locations: string | null | undefined): string | null {
  if (!locations) return null;
  const first = locations.split(/[,;|]/)[0]?.trim();
  if (!first) return null;
  const parts = first.split(/\s+/);
  return parts[0] || null;
}

export function catalogDisplayName(
  b: BlueprintCatalogSummary,
  lang: "fr" | "en" = "fr",
): string {
  if (lang === "fr") {
    return b.nameFr || b.nameEn || b.blueprintId;
  }
  return b.nameEn || b.nameFr || b.blueprintId;
}

const JURISDICTION_FR: Record<string, string> = {
  Ungoverned: "Non gouverné",
  UEE: "UEE",
  "Xi'an": "Xi'an",
  Banu: "Banu",
};

export function jurisdictionLabelFr(name: string): string {
  return JURISDICTION_FR[name] ?? name;
}

export type JurisdictionDisplayKind = "safe" | "hostile" | "plain";

export function jurisdictionDisplayKind(name: string): JurisdictionDisplayKind {
  const n = name.trim();
  if (n === "UEE") return "safe";
  if (n === "Ungoverned") return "hostile";
  return "plain";
}

export function outputTypeLabelFr(type: string | null | undefined): string {
  if (!type) return "—";
  const key = type.includes("/") ? (type.split("/").pop() ?? type) : type;
  return CATEGORY_FR[key] ?? key.replace(/_/g, " ");
}

const ARMOR_SLOT_BADGE: Record<string, string> = {
  helmet: "Helmet",
  legs: "Legs",
  arms: "Arms",
  core: "Torso",
  backpack: "Backpack",
  undersuit: "Undersuit",
  gloves: "Gloves",
  feet: "Feet",
};

export type CatalogRowBadgeKind =
  | "grade"
  | "size"
  | "tier"
  | "category"
  | "class"
  | "manufacturer"
  | "default";

/** Action de filtre déclenchée par un clic sur un badge catalogue. */
export type CatalogBadgeFilter =
  | { type: "size"; size: number }
  | { type: "grade"; letter: string }
  | { type: "manufacturer"; code: string }
  | { type: "outputType"; value: string }
  | { type: "outputTypeLabel"; label: string }
  | { type: "class"; code: BlueprintClassCode }
  | { type: "defaultOwned" }
  | { type: "idToken"; token: string }
  | { type: "tiers"; count: number };

/** Libellés anglais Wiki → code classe (badges `component_class`). */
const COMPONENT_CLASS_LABEL_TO_CODE: Record<string, BlueprintClassCode> = {
  Civilian: "civi",
  Civil: "civi",
  Military: "mili",
  Militaire: "mili",
  Industrial: "indu",
  Industriel: "indu",
  Stealth: "stlh",
  Furtif: "stlh",
  Competition: "comp",
  Compétition: "comp",
};

function componentClassCodeFromBadgeLabel(label: string): BlueprintClassCode | null {
  const direct = COMPONENT_CLASS_LABEL_TO_CODE[label.trim()];
  if (direct) return direct;
  const entry = Object.entries(CLASS_LABEL_EN).find(([, en]) => en === label.trim());
  return (entry?.[0] as BlueprintClassCode | undefined) ?? null;
}

const MANUFACTURER_LABELS: Record<string, string> = {
  AEGS: "Aegis Dynamics",
  AMRS: "Amon Reese",
  ANVL: "Anvil Aerospace",
  APAR: "Apocalypse Arms",
  ARGO: "Argo Astronautics",
  ASAS: "Ascension Astro",
  AOPOA: "Aopoa",
  BANU: "Banu",
  BASL: "Basilisk",
  BEHR: "Behring",
  CSGI: "Consolidated Outland",
  CRUS: "Crusader Industries",
  DRAK: "Drake Interplanetary",
  ESP: "Esprit de Corps",
  GMNI: "Gemini",
  GRIN: "Greycat Industrial",
  HRST: "Hurston Dynamics",
  KAST: "Kastak Arms",
  KSAR: "Kastak Arms",
  KBAR: "Klaus & Werner",
  KLWE: "Klaus & Werner",
  KRIG: "Kruger Intergalactic",
  MISC: "Musashi Industrial",
  ORIG: "Origin Jumpworks",
  QRT: "Quirinus Tech",
  RSI: "Roberts Space Industries",
  SHIN: "Shubin Interstellar",
  SHUBIN: "Shubin Interstellar",
  VNCL: "Vanduul",
  XIAN: "Xi'an",
};

export function manufacturerLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const key = code.trim().toUpperCase();
  return MANUFACTURER_LABELS[key] ?? key;
}

/** Types Wiki où `output.grade` (1–7) est le grade composant vaisseau — pas armure FPS / perso. */
const SHIP_COMPONENT_OUTPUT_TYPES = new Set([
  "PowerPlant",
  "Cooler",
  "Shield",
  "Radar",
  "QuantumDrive",
  "WeaponGun",
  "WeaponAttachment",
  "DockingCollar",
  "TractorBeam",
  "SalvageModifier",
  "SalvageHead",
  "WeaponMining",
  "QuantumInterdictionGenerator",
  "Missile",
  "Bomb",
  "EMP",
  "TowingBeam",
]);

export function isShipComponentOutputType(
  outputType: string | null | undefined,
): boolean {
  const t = (outputType ?? "").trim();
  if (!t || t.startsWith("Char_") || t === "WeaponPersonal") return false;
  if (SHIP_COMPONENT_OUTPUT_TYPES.has(t) || t.startsWith("Ship")) return true;
  return false;
}

function normalizeShipComponentGradeValue(
  grade: string | null | undefined,
): string | null {
  const g = (grade ?? "").trim();
  if (!g || /^(undefined|null|none|n\/a|na)$/i.test(g)) return null;
  const n = Number(g);
  if (Number.isInteger(n) && n >= 1 && n <= 7) {
    return String.fromCharCode("A".charCodeAt(0) + n - 1);
  }
  if (/^[A-G]$/i.test(g)) return g.toUpperCase();
  return null;
}

export function isValidCatalogGrade(
  grade: string | null | undefined,
  outputType?: string | null,
): grade is string {
  return normalizeCatalogGrade(grade, outputType) != null;
}

/** Grade badge : uniquement composants vaisseau ; 1–7 API → A–G. */
export function normalizeCatalogGrade(
  grade: string | null | undefined,
  outputType?: string | null,
): string | null {
  if (!isShipComponentOutputType(outputType)) return null;
  return normalizeShipComponentGradeValue(grade);
}

/** Libellé fabricant : nom Wiki / backend, sinon table, sinon code brut. */
export function catalogManufacturerLabel(
  summary: Pick<BlueprintCatalogSummary, "manufacturer" | "manufacturerName">,
): string | null {
  const name = (summary.manufacturerName ?? "").trim();
  if (name) return name;
  return manufacturerLabel(summary.manufacturer);
}

export interface CatalogSummaryFacet {
  value: string;
  label: string;
  count: number;
}

export interface CatalogSummaryFacets {
  grades: CatalogSummaryFacet[];
  classCodes: CatalogSummaryFacet[];
  outputTypeLabels: CatalogSummaryFacet[];
  manufacturers: CatalogSummaryFacet[];
  starSystems: CatalogSummaryFacet[];
  jurisdictions: CatalogSummaryFacet[];
  contractors: CatalogSummaryFacet[];
  missionTypes: CatalogSummaryFacet[];
}

/** Facettes dérivées du catalogue chargé (non fournies par l’API Wiki filters). */
export function buildCatalogSummaryFacets(
  catalog: BlueprintCatalogSummary[],
): CatalogSummaryFacets {
  const gradeCounts = new Map<string, number>();
  const classCounts = new Map<string, number>();
  const outputTypeLabelCounts = new Map<string, number>();
  const mfrCounts = new Map<string, { label: string; count: number }>();
  const systemCounts = new Map<string, number>();
  const jurisdictionCounts = new Map<string, number>();
  const contractorCounts = new Map<string, number>();
  const missionTypeCounts = new Map<string, number>();

  for (const raw of catalog) {
    const b = normalizeCatalogSummary(raw);
    const g = normalizeCatalogGrade(b.grade, b.outputType ?? b.category);
    if (g) {
      gradeCounts.set(g, (gradeCounts.get(g) ?? 0) + 1);
    }
    const cls = resolveBlueprintClass(b);
    if (cls) {
      classCounts.set(cls, (classCounts.get(cls) ?? 0) + 1);
    }
    const typeLabel = (b.outputTypeLabel ?? "").trim();
    if (typeLabel) {
      outputTypeLabelCounts.set(
        typeLabel,
        (outputTypeLabelCounts.get(typeLabel) ?? 0) + 1,
      );
    }
    const code = (b.manufacturer ?? "").trim().toUpperCase();
    if (code) {
      const label = catalogManufacturerLabel(b) ?? code;
      const prev = mfrCounts.get(code);
      mfrCounts.set(code, {
        label: prev?.label ?? label,
        count: (prev?.count ?? 0) + 1,
      });
    }
    for (const sys of b.unlockSystems ?? []) {
      systemCounts.set(sys, (systemCounts.get(sys) ?? 0) + 1);
    }
    for (const jur of b.unlockJurisdictions ?? []) {
      jurisdictionCounts.set(jur, (jurisdictionCounts.get(jur) ?? 0) + 1);
    }
    for (const c of b.unlockContractors ?? []) {
      contractorCounts.set(c, (contractorCounts.get(c) ?? 0) + 1);
    }
    for (const t of b.unlockMissionTypes ?? []) {
      missionTypeCounts.set(t, (missionTypeCounts.get(t) ?? 0) + 1);
    }
  }

  const facetList = (counts: Map<string, number>) =>
    [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([value, count]) => ({ value, label: value, count }));

  return {
    grades: [...gradeCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, count]) => ({ value, label: value, count })),
    classCodes: [...classCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, count]) => ({
        value,
        label: CLASS_LABEL_FR[value as BlueprintClassCode] ?? value,
        count,
      })),
    outputTypeLabels: [...outputTypeLabelCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([value, count]) => ({ value, label: value, count })),
    manufacturers: [...mfrCounts.entries()]
      .sort(([, a], [, b]) => a.label.localeCompare(b.label))
      .map(([value, { label, count }]) => ({ value, label, count })),
    starSystems: facetList(systemCounts),
    jurisdictions: facetList(jurisdictionCounts).map((f) => ({
      ...f,
      label: jurisdictionLabelFr(String(f.value)),
    })),
    contractors: facetList(contractorCounts),
    missionTypes: facetList(missionTypeCounts),
  };
}

export function normalizeCatalogSummary(
  b: BlueprintCatalogSummary,
): BlueprintCatalogSummary {
  const raw = b as BlueprintCatalogSummary & Record<string, unknown>;
  return {
    wikiUuid: String(b.wikiUuid ?? raw.wiki_uuid ?? ""),
    blueprintId: String(b.blueprintId ?? raw.blueprint_id ?? ""),
    nameEn: String(b.nameEn ?? raw.name_en ?? ""),
    nameFr: nullIfEmptyString(b.nameFr ?? raw.name_fr),
    locKey: nullIfEmptyString(b.locKey ?? raw.loc_key),
    category: nullIfEmptyString(b.category),
    craftTimeSeconds: asNumber(b.craftTimeSeconds ?? raw.craft_time_seconds),
    tiers:
      typeof b.tiers === "number"
        ? b.tiers
        : typeof raw.tiers === "number"
          ? raw.tiers
          : null,
    defaultOwned: Boolean(b.defaultOwned),
    version: nullIfEmptyString(b.version),
    classCode: nullIfEmptyString(b.classCode ?? raw.class_code),
    size:
      typeof b.size === "number"
        ? b.size
        : typeof raw.size === "number"
          ? raw.size
          : null,
    grade: normalizeCatalogGrade(
      nullIfEmptyString(b.grade ?? raw.grade) ?? undefined,
      nullIfEmptyString(b.outputType ?? raw.output_type) ??
        nullIfEmptyString(b.category),
    ),
    subType: nullIfEmptyString(b.subType ?? raw.sub_type),
    manufacturer: nullIfEmptyString(b.manufacturer),
    manufacturerName: nullIfEmptyString(
      b.manufacturerName ?? (raw.manufacturer_name as string | undefined),
    ),
    outputType: nullIfEmptyString(b.outputType ?? raw.output_type),
    ingredientCount: asNumber(b.ingredientCount ?? raw.ingredient_count),
    unlockingMissionsCount: asNumber(
      b.unlockingMissionsCount ?? raw.unlocking_missions_count,
    ),
    resourceUuids: ensureStringArray(b.resourceUuids ?? raw.resource_uuids),
    webUrl: nullIfEmptyString(b.webUrl ?? raw.web_url),
    unlockSystems: ensureStringArray(b.unlockSystems ?? raw.unlock_systems),
    unlockJurisdictions: ensureStringArray(
      b.unlockJurisdictions ?? raw.unlock_jurisdictions,
    ),
    unlockContractors: ensureStringArray(b.unlockContractors ?? raw.unlock_contractors),
    unlockMissionTypes: ensureStringArray(
      b.unlockMissionTypes ?? raw.unlock_mission_types,
    ),
    unlockLawful: ensureBooleanArray(b.unlockLawful ?? raw.unlock_lawful),
    family: normalizeFamily(b.family ?? raw.family),
    outputTypeLabel: nullIfEmptyString(
      b.outputTypeLabel ?? (raw.output_type_label as string | undefined),
    ),
    summaryBadges: normalizeApiBadges(b.summaryBadges ?? raw.summary_badges),
  };
}

function normalizeFamily(value: unknown): BlueprintFamily | null {
  const v = String(value ?? "").trim() as BlueprintFamily;
  if (
    v === "armor" ||
    v === "fps_weapon" ||
    v === "ship_component" ||
    v === "ship_weapon" ||
    v === "mining" ||
    v === "refuel" ||
    v === "other"
  ) {
    return v;
  }
  return null;
}

function normalizeApiBadges(raw: unknown): ApiCatalogBadge[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => {
      const row = b as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const key = String(row.key ?? label).trim();
      const kind = String(row.kind ?? "neutral").trim();
      if (!label) return null;
      return { key, label, kind };
    })
    .filter((x): x is ApiCatalogBadge => x != null);
}

function normalizeDescriptionData(raw: unknown): DescriptionDataRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      const row = r as Record<string, unknown>;
      const name = String(row.name ?? "").trim();
      const value = String(row.value ?? "").trim();
      if (!name || !value) return null;
      return { name, value };
    })
    .filter((x): x is DescriptionDataRow => x != null);
}

function normalizeItemProfile(raw: unknown): BlueprintItemProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  return {
    itemUuid: nullIfEmptyString(p.itemUuid ?? p.item_uuid),
    descriptionData: normalizeDescriptionData(p.descriptionData ?? p.description_data),
    manufacturerName: nullIfEmptyString(p.manufacturerName ?? p.manufacturer_name),
    size:
      typeof p.size === "number"
        ? p.size
        : typeof p.size === "string"
          ? Number(p.size) || null
          : null,
    imageUrl: nullIfEmptyString(p.imageUrl ?? p.image_url),
    classificationLabel: nullIfEmptyString(
      p.classificationLabel ?? p.classification_label,
    ),
    itemTypeLabel: nullIfEmptyString(p.itemTypeLabel ?? p.item_type_label),
  };
}

export interface CatalogRowBadge {
  key: string;
  label: string;
  kind: CatalogRowBadgeKind;
  filter: CatalogBadgeFilter | null;
}

function apiBadgeToRowBadge(
  b: ApiCatalogBadge,
  summary: BlueprintCatalogSummary,
): CatalogRowBadge {
  const kind = mapApiBadgeKind(b.kind);
  return {
    key: b.key,
    label: b.label,
    kind,
    filter: filterFromApiBadge(b, summary),
  };
}

function mapApiBadgeKind(kind: string): CatalogRowBadgeKind {
  switch (kind) {
    case "grade":
      return "grade";
    case "manufacturer":
    case "mfg":
      return "manufacturer";
    case "size":
      return "size";
    case "component_class":
    case "class":
    case "weapon_class":
      return "class";
    case "slot":
    case "armor_class":
    case "item_type":
    case "output_type":
    case "stat":
    default:
      return "category";
  }
}

function filterFromApiBadge(
  b: ApiCatalogBadge,
  summary: BlueprintCatalogSummary,
): CatalogBadgeFilter | null {
  switch (b.kind) {
    case "grade":
      return { type: "grade", letter: b.label.toUpperCase() };
    case "manufacturer":
    case "mfg": {
      const code = (summary.manufacturer ?? b.label).toUpperCase();
      return { type: "manufacturer", code };
    }
    case "size": {
      const n = Number(b.label.replace(/^S/i, ""));
      if (Number.isFinite(n) && n >= 1 && n <= 10) {
        return { type: "size", size: n };
      }
      return null;
    }
    case "armor_class":
      return { type: "idToken", token: `_${b.label.toLowerCase().split(" ")[0]}_` };
    case "slot": {
      const token = `_${b.label.toLowerCase()}_`;
      return { type: "idToken", token };
    }
    case "output_type":
      if (
        summary.family === "ship_component" &&
        summary.outputTypeLabel &&
        summary.outputTypeLabel === b.label
      ) {
        return { type: "outputTypeLabel", label: b.label };
      }
      if (summary.outputType) {
        return { type: "outputType", value: summary.outputType };
      }
      return null;
    case "component_class": {
      const code =
        componentClassCodeFromBadgeLabel(b.label) ?? resolveBlueprintClass(summary);
      return code ? { type: "class", code } : null;
    }
    default:
      return null;
  }
}

/** Badges compacts pour une ligne du catalogue (taxonomie API / backend). */
export function catalogRowBadges(item: BlueprintCatalogSummary): CatalogRowBadge[] {
  const summary = normalizeCatalogSummary(item);

  if (summary.summaryBadges && summary.summaryBadges.length > 0) {
    const out = summary.summaryBadges
      .map((b) => apiBadgeToRowBadge(b, summary))
      .filter((b) => b.kind !== "manufacturer");
    if (summary.defaultOwned) {
      out.push({
        key: "default-owned",
        label: "Default",
        kind: "default",
        filter: { type: "defaultOwned" },
      });
    }
    return out.slice(0, 8);
  }

  const family = summary.family ?? classifyBlueprintFamily(summary.outputType);
  const out: CatalogRowBadge[] = [];
  if (summary.outputTypeLabel && isUsefulOutputTypeLabel(summary.outputTypeLabel)) {
    const label = outputTypeLabelEn(summary.outputTypeLabel) ?? summary.outputTypeLabel;
    out.push({
      key: `family-${family}`,
      label,
      kind: "category",
      filter: summary.outputType
        ? { type: "outputType", value: summary.outputType }
        : null,
    });
  }
  if (family === "armor" && summary.subType && isUsefulSubTypeLabel(summary.subType)) {
    out.push({
      key: `subtype-${summary.subType}`,
      label: summary.subType,
      kind: "category",
      filter: null,
    });
  }
  if (summary.defaultOwned) {
    out.push({
      key: "default-owned",
      label: "Default",
      kind: "default",
      filter: { type: "defaultOwned" },
    });
  }
  return out.slice(0, 5);
}

export function modifierEffectLabel(m: {
  label: string;
  betterWhen: string | null;
  modifierAtMinQuality: number | null;
  modifierAtMaxQuality: number | null;
}): string {
  const min = m.modifierAtMinQuality;
  const max = m.modifierAtMaxQuality;
  if (min == null || max == null) return m.label;
  const pctMin = Math.round(min * 100);
  const pctMax = Math.round(max * 100);
  const dir =
    m.betterWhen === "higher"
      ? "↑ meilleure qualité"
      : m.betterWhen === "lower"
        ? "↓ meilleure qualité"
        : "";
  return `${m.label} : ${pctMin}% → ${pctMax}% ${dir}`.trim();
}

/** Identifiants à utiliser pour filtrer le catalogue (item + minerai lié). */
export function ingredientCatalogFilterIds(option: IngredientOption): string[] {
  const ids = new Set<string>();
  if (option.guid) ids.add(option.guid);
  if (option.oreUuid) ids.add(option.oreUuid);
  return [...ids];
}

/** UUID commodity pour l’API lieux (minerai). */
export function ingredientCommodityUuid(option: IngredientOption): string | null {
  return option.oreUuid ?? (option.kind === "resource" ? option.guid : null);
}

export function normalizeIngredientLocation(
  loc: IngredientLocationPreview,
): IngredientLocationPreview {
  const raw = loc as IngredientLocationPreview & { spawn_percent?: number | null };
  return {
    ...loc,
    spawnPercent: loc.spawnPercent ?? raw.spawn_percent ?? null,
  };
}

export function sortLocationsBySpawn(
  locations: IngredientLocationPreview[],
): IngredientLocationPreview[] {
  return [...locations].sort((a, b) => {
    const pa = a.spawnPercent;
    const pb = b.spawnPercent;
    if (pa != null && pb != null) {
      if (pb !== pa) return pb - pa;
    } else if (pb != null) return 1;
    else if (pa != null) return -1;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function formatLocationSpawnPercent(
  percent: number | null | undefined,
): string | null {
  if (percent == null || Number.isNaN(percent)) return null;
  const rounded = Math.round(percent * 10) / 10;
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}%`;
}

export function filterValueToString(value: string | number | boolean | null): string {
  if (value == null) return "";
  return String(value);
}

/** Serde peut omettre les tableaux vides : garantit toujours un tableau côté UI. */
export function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
}

function ensureBooleanArray(value: unknown): boolean[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is boolean => typeof v === "boolean");
}

export function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function nullIfEmptyString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

export function normalizeMissionInfo(m: MissionInfo): MissionInfo {
  const raw = m as MissionInfo & {
    star_systems?: string[];
    rank_index?: number | null;
    min_standing_name?: string | null;
    min_standing_reputation?: number | null;
  };
  return {
    ...m,
    starSystems: ensureStringArray(m.starSystems ?? raw.star_systems),
    jurisdictions: ensureStringArray(m.jurisdictions),
    shareable: typeof m.shareable === "boolean" ? m.shareable : null,
    rankIndex:
      typeof m.rankIndex === "number"
        ? m.rankIndex
        : typeof raw.rank_index === "number"
          ? raw.rank_index
          : null,
    minStandingName: nullIfEmptyString(m.minStandingName ?? raw.min_standing_name),
    minStandingReputation:
      typeof m.minStandingReputation === "number"
        ? m.minStandingReputation
        : typeof raw.min_standing_reputation === "number"
          ? raw.min_standing_reputation
          : null,
  };
}

export function normalizeIngredientEnrichment(
  e: IngredientEnrichment,
): IngredientEnrichment {
  const raw = e as IngredientEnrichment & {
    source_kind?: string;
    kind_label?: string | null;
    location_count?: number | null;
    refined_version_name?: string | null;
    description_short?: string | null;
    thumbnail_url?: string | null;
    location_preview?: IngredientEnrichment["locationPreview"];
    harvest_hints?: string[];
  };
  return {
    sourceKind: String(e.sourceKind ?? raw.source_kind ?? ""),
    tier: nullIfEmptyString(e.tier),
    rarity: nullIfEmptyString(e.rarity),
    kindLabel: nullIfEmptyString(e.kindLabel ?? raw.kind_label),
    methods: ensureStringArray(e.methods),
    systems: ensureStringArray(e.systems),
    harvestHints: ensureStringArray(e.harvestHints ?? raw.harvest_hints),
    locationPreview: sortLocationsBySpawn(
      (Array.isArray(e.locationPreview)
        ? e.locationPreview
        : Array.isArray(raw.location_preview)
          ? raw.location_preview
          : []
      ).map((loc) => normalizeIngredientLocation(loc as IngredientLocationPreview)),
    ),
    locationCount: asNumber(e.locationCount ?? raw.location_count),
    refinedVersionName: nullIfEmptyString(
      e.refinedVersionName ?? raw.refined_version_name,
    ),
    density:
      typeof e.density === "number"
        ? e.density
        : typeof raw.density === "number"
          ? raw.density
          : null,
    signature:
      typeof e.signature === "number"
        ? e.signature
        : typeof raw.signature === "number"
          ? raw.signature
          : null,
    descriptionShort: nullIfEmptyString(e.descriptionShort ?? raw.description_short),
    thumbnailUrl: nullIfEmptyString(e.thumbnailUrl ?? raw.thumbnail_url),
  };
}

export function normalizeIngredientOption(o: IngredientOption): IngredientOption {
  const raw = o as IngredientOption & Record<string, unknown>;
  return {
    kind: nullIfEmptyString(o.kind),
    guid: nullIfEmptyString(o.guid),
    oreUuid: nullIfEmptyString(o.oreUuid ?? raw.ore_uuid),
    name: String(o.name ?? raw.name ?? ""),
    nameFr: nullIfEmptyString(o.nameFr ?? raw.name_fr),
    locKey: nullIfEmptyString(o.locKey ?? raw.loc_key),
    quantityScu:
      typeof o.quantityScu === "number"
        ? o.quantityScu
        : typeof raw.quantity_scu === "number"
          ? raw.quantity_scu
          : null,
    quantity:
      typeof o.quantity === "number"
        ? o.quantity
        : typeof raw.quantity === "number"
          ? raw.quantity
          : null,
    minQuality:
      typeof o.minQuality === "number"
        ? o.minQuality
        : typeof raw.min_quality === "number"
          ? raw.min_quality
          : null,
    unit: nullIfEmptyString(o.unit),
    webUrl: nullIfEmptyString(o.webUrl ?? raw.web_url),
    apiLink: nullIfEmptyString(o.apiLink ?? raw.api_link),
    enrichment: o.enrichment ? normalizeIngredientEnrichment(o.enrichment) : null,
  };
}

export function normalizeIngredientGroup(g: IngredientGroup): IngredientGroup {
  const raw = g as IngredientGroup & {
    slot_key?: string | null;
    slot_loc_key?: string | null;
    slot_label_fr?: string | null;
    required_count?: number | null;
    slider_min?: number | null;
    slider_max?: number | null;
    initial_quality?: number | null;
  };
  return {
    slot: String(g.slot ?? "Slot"),
    slotKey: nullIfEmptyString(g.slotKey ?? raw.slot_key),
    slotLocKey: nullIfEmptyString(g.slotLocKey ?? raw.slot_loc_key),
    slotLabelFr: nullIfEmptyString(g.slotLabelFr ?? raw.slot_label_fr),
    requiredCount:
      typeof g.requiredCount === "number"
        ? g.requiredCount
        : typeof raw.required_count === "number"
          ? raw.required_count
          : null,
    modifiers: ensureArray(g.modifiers),
    options: ensureArray<IngredientOption>(g.options).map(normalizeIngredientOption),
    initialQuality:
      typeof (g.initialQuality ?? raw.initial_quality) === "number"
        ? (g.initialQuality ?? raw.initial_quality)
        : null,
    sliderMin:
      typeof (g.sliderMin ?? raw.slider_min) === "number"
        ? (g.sliderMin ?? raw.slider_min)
        : null,
    sliderMax:
      typeof (g.sliderMax ?? raw.slider_max) === "number"
        ? (g.sliderMax ?? raw.slider_max)
        : null,
  };
}

function normalizeHeroStats(raw: unknown): HeroStat[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const row = s as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const value = String(row.value ?? "").trim();
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((x): x is HeroStat => x != null);
}

function normalizeSummaryProperties(raw: unknown): SummaryPropertyRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const row = s as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      if (!label) return null;
      return {
        propertyKey: nullIfEmptyString(row.propertyKey ?? row.property_key),
        label,
        betterWhen: nullIfEmptyString(row.betterWhen ?? row.better_when),
      };
    })
    .filter((x): x is SummaryPropertyRow => x != null);
}

export function normalizeBlueprintDetail(
  detail: BlueprintCatalogDetail,
): BlueprintCatalogDetail {
  const raw = detail as BlueprintCatalogDetail & Record<string, unknown>;
  const summary = normalizeCatalogSummary(detail);
  return {
    ...summary,
    ingredients: ensureArray<IngredientGroup>(detail.ingredients).map(
      normalizeIngredientGroup,
    ),
    missions: ensureArray<MissionInfo>(detail.missions).map(normalizeMissionInfo),
    itemStats: detail.itemStats ?? null,
    dismantle: detail.dismantle
      ? {
          timeSeconds: detail.dismantle.timeSeconds ?? null,
          timeLabel: detail.dismantle.timeLabel ?? null,
          efficiency: detail.dismantle.efficiency ?? null,
          returns: ensureArray(detail.dismantle.returns),
        }
      : null,
    aspects: detail.aspects
      ? {
          hasInteractive: Boolean(detail.aspects.hasInteractive),
          slots: ensureArray(detail.aspects.slots),
        }
      : null,
    itemProfile: normalizeItemProfile(detail.itemProfile ?? raw.item_profile),
    heroStats: normalizeHeroStats(detail.heroStats ?? raw.hero_stats),
    catalogBadges: normalizeApiBadges(detail.catalogBadges ?? raw.catalog_badges),
    summaryProperties: normalizeSummaryProperties(
      detail.summaryProperties ?? raw.summary_properties,
    ),
  };
}
