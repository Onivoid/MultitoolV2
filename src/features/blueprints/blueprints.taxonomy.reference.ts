/**
 * Référence taxonomie Blueprints — familles, types Wiki, badges et labels attendus.
 *
 * Source de vérité documentaire pour le module Blueprints (alignée sur
 * `blueprint_family.rs` + `blueprints.taxonomy.ts`). À mettre à jour quand la
 * logique Rust/TS de classification ou de badges change.
 *
 * Voir aussi : `docs/blueprints-taxonomy.md`
 */

import type { BlueprintClassCode } from "@/features/blueprints/blueprints.catalog.types";
import {
  FAMILY_LABEL_FR,
  wikiItemsCategoryForFamily,
  type BlueprintFamily,
} from "@/features/blueprints/blueprints.taxonomy";

// ---------------------------------------------------------------------------
// Badge kinds (API Rust → UI)
// ---------------------------------------------------------------------------

/** Kinds émis par `build_summary_badges` / `build_catalog_badges` (Rust). */
export type ApiCatalogBadgeKind =
  | "slot"
  | "armor_class"
  | "item_type"
  | "weapon_class"
  | "output_type"
  | "grade"
  | "size"
  | "component_class"
  | "manufacturer"
  | "stat";

/** Kinds affichés côté ligne catalogue (`mapApiBadgeKind`). */
export type CatalogRowBadgeKind =
  | "grade"
  | "size"
  | "tier"
  | "category"
  | "class"
  | "manufacturer"
  | "default";

/** D’où provient la valeur d’un badge. */
export type BadgeValueSource =
  | "wiki.output.type"
  | "wiki.output.type_label"
  | "wiki.output.sub_type"
  | "wiki.output.grade"
  | "wiki.output_class + global.ini"
  | "blueprint_id (size segment)"
  | "wiki.manufacturer"
  | "item.description_data"
  | "computed";

/** Spécification d’un badge attendu pour une famille. */
export interface FamilyBadgeSpec {
  kind: ApiCatalogBadgeKind;
  /** Ordre d’affichage en liste (summary). */
  order: number;
  source: BadgeValueSource;
  /** Exemples de libellés valides (Wiki / jeu, EN). */
  exampleLabels: readonly string[];
  /** Labels génériques à ne jamais afficher pour ce kind. */
  rejectLabels?: readonly string[];
  /** Clic badge → filtre catalogue. */
  filterable: boolean;
  /** Présent en liste sans appel item (`build_summary_badges`). */
  inListSummary: boolean;
  /** Présent en détail avec `description_data` (`build_catalog_badges`). */
  inDetailOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Wiki `output.type` → famille Multitool
// ---------------------------------------------------------------------------

export const WIKI_OUTPUT_TYPE_BY_FAMILY = {
  armor: [
    "Char_Armor_Helmet",
    "Char_Armor_Torso",
    "Char_Armor_Arms",
    "Char_Armor_Legs",
    "Char_Armor_Backpack",
    "Char_Armor_Undersuit",
  ],
  fps_weapon: ["WeaponPersonal", "WeaponAttachment"],
  ship_weapon: ["WeaponGun"],
  mining: ["WeaponMining"],
  refuel: ["DockingCollar"],
  ship_component: [
    "PowerPlant",
    "Cooler",
    "Shield",
    "Radar",
    "QuantumDrive",
    "TractorBeam",
    "SalvageModifier",
    "SalvageHead",
    "QuantumInterdictionGenerator",
    "Missile",
    "Bomb",
    "EMP",
    "TowingBeam",
    // Préfixe Wiki : tout type commençant par `Ship` → composant vaisseau
    "Ship*",
  ],
  other: ["Misc", ""],
} as const satisfies Record<BlueprintFamily, readonly string[]>;

/** Slots armure : `output.type` → libellé badge slot (EN). */
export const ARMOR_SLOT_LABELS: Record<string, string> = {
  Char_Armor_Helmet: "Helmet",
  Char_Armor_Torso: "Torso",
  Char_Armor_Arms: "Arms",
  Char_Armor_Legs: "Legs",
  Char_Armor_Backpack: "Backpack",
  Char_Armor_Undersuit: "Undersuit",
};

/**
 * `output.type` composant vaisseau → `output.type_label` Wiki typique.
 * Utilisé pour valider les badges `output_type` (liste).
 */
export const SHIP_COMPONENT_TYPE_LABELS: Record<string, string> = {
  PowerPlant: "Power Plant",
  Cooler: "Cooler",
  Shield: "Shield Generator",
  Radar: "Radar",
  QuantumDrive: "Quantum Drive",
  TractorBeam: "Tractor Beam",
  SalvageModifier: "Salvage Modifier",
  SalvageHead: "Salvage Head",
  QuantumInterdictionGenerator: "Quantum Interdiction Generator",
  Missile: "Missile",
  Bomb: "Bomb",
  EMP: "EMP",
  TowingBeam: "Towing Beam",
};

/** Libellés `output.type_label` / sub_type trop génériques — jamais en badge. */
export const GENERIC_BADGE_LABELS = [
  "gun",
  "medium",
  "light",
  "heavy",
  "weapon gun",
  "weapon",
  "misc",
  "undefined",
  "null",
  "none",
  "standard",
  "normal",
  "default",
  "personal",
  "vehicle",
] as const;

export type GenericBadgeLabel = (typeof GENERIC_BADGE_LABELS)[number];

/** Codes classe composant (`classCode` / global.ini). */
export const CLASS_CODE_LABELS: Record<BlueprintClassCode, { en: string; fr: string }> =
  {
    civi: { en: "Civilian", fr: "Civil" },
    mili: { en: "Military", fr: "Militaire" },
    indu: { en: "Industrial", fr: "Industriel" },
    stlh: { en: "Stealth", fr: "Furtif" },
    comp: { en: "Competition", fr: "Compétition" },
  };

/** Grades composant vaisseau affichables (A–G ou 1–7 mappé en lettre). */
export const SHIP_COMPONENT_GRADES = ["A", "B", "C", "D", "E", "F", "G"] as const;

/** Tailles affichées en badge (`S1` … `S12`). */
export function sizeBadgeLabel(size: number): string {
  return `S${size}`;
}

// ---------------------------------------------------------------------------
// Badges attendus par famille
// ---------------------------------------------------------------------------

export const FAMILY_BADGE_SPECS: Record<BlueprintFamily, readonly FamilyBadgeSpec[]> = {
  armor: [
    {
      kind: "slot",
      order: 1,
      source: "wiki.output.type",
      exampleLabels: Object.values(ARMOR_SLOT_LABELS),
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "armor_class",
      order: 2,
      source: "item.description_data",
      exampleLabels: [
        "Light Armor",
        "Medium Armor",
        "Heavy Armor",
        "Light armor",
        "Medium armor",
        "Heavy armor",
      ],
      rejectLabels: ["medium", "light", "heavy"],
      filterable: false,
      inListSummary: true,
      inDetailOnly: false,
    },
    {
      kind: "stat",
      order: 3,
      source: "item.description_data",
      exampleLabels: ["30%", "35%"],
      filterable: false,
      inListSummary: false,
      inDetailOnly: true,
    },
  ],
  fps_weapon: [
    {
      kind: "size",
      order: 1,
      source: "blueprint_id (size segment)",
      exampleLabels: ["S1", "S2", "S3"],
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "item_type",
      order: 2,
      source: "item.description_data",
      exampleLabels: ["Pistol", "SMG", "Assault Rifle", "Sniper Rifle", "Shotgun"],
      filterable: false,
      inListSummary: false,
      inDetailOnly: true,
    },
    {
      kind: "weapon_class",
      order: 3,
      source: "item.description_data",
      exampleLabels: ["Class 1", "Class 2", "Class 3"],
      filterable: false,
      inListSummary: false,
      inDetailOnly: true,
    },
  ],
  ship_component: [
    {
      kind: "output_type",
      order: 1,
      source: "wiki.output.type_label",
      exampleLabels: Object.values(SHIP_COMPONENT_TYPE_LABELS),
      rejectLabels: [...GENERIC_BADGE_LABELS],
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "grade",
      order: 2,
      source: "wiki.output.grade",
      exampleLabels: [...SHIP_COMPONENT_GRADES],
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "size",
      order: 3,
      source: "blueprint_id (size segment)",
      exampleLabels: ["S1", "S2", "S3", "S4"],
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "component_class",
      order: 4,
      source: "wiki.output_class + global.ini",
      exampleLabels: Object.values(CLASS_CODE_LABELS).map((c) => c.en),
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "manufacturer",
      order: 5,
      source: "wiki.manufacturer",
      exampleLabels: ["Basilisk", "Aegis Dynamics", "Anvil Aerospace"],
      filterable: true,
      inListSummary: true,
    },
  ],
  ship_weapon: [
    {
      kind: "size",
      order: 1,
      source: "blueprint_id (size segment)",
      exampleLabels: ["S1", "S2", "S3", "S4", "S5"],
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "output_type",
      order: 2,
      source: "wiki.output.type_label",
      exampleLabels: [
        "Laser Cannon",
        "Ballistic Cannon",
        "Repeater",
        "Distortion Cannon",
      ],
      rejectLabels: [...GENERIC_BADGE_LABELS, "weapon gun"],
      filterable: true,
      inListSummary: false,
      inDetailOnly: true,
    },
  ],
  mining: [
    {
      kind: "size",
      order: 1,
      source: "blueprint_id (size segment)",
      exampleLabels: ["S1", "S2"],
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "output_type",
      order: 2,
      source: "wiki.output.type_label",
      exampleLabels: ["Mining Laser", "Mining Module"],
      filterable: true,
      inListSummary: true,
    },
  ],
  refuel: [
    {
      kind: "manufacturer",
      order: 1,
      source: "wiki.manufacturer",
      exampleLabels: ["Greycat Industrial", "Unknown"],
      filterable: true,
      inListSummary: true,
    },
    {
      kind: "item_type",
      order: 2,
      source: "item.description_data",
      exampleLabels: ["Docking Collar", "Fuel Nozzle"],
      filterable: false,
      inListSummary: false,
      inDetailOnly: true,
    },
  ],
  other: [],
};

/** Clés `description_data` pour hero stats / badges détail, par famille. */
export const HERO_STAT_KEYS_BY_FAMILY: Record<BlueprintFamily, readonly string[]> = {
  armor: ["Damage Reduction", "Radiation Protection", "Temp. Rating", "Item Type"],
  fps_weapon: ["Item Type", "Class", "Rate Of Fire", "Effective Range", "Manufacturer"],
  ship_component: ["Grade", "Size", "Class", "Manufacturer", "Item Type"],
  ship_weapon: ["Size", "Item Type", "Manufacturer", "Class"],
  mining: ["Laser Power", "Size", "Item Type", "Manufacturer"],
  refuel: ["Item Type", "Manufacturer"],
  other: ["Item Type", "Manufacturer", "Class"],
};

/** Labels `sub_type` trop génériques — jamais en badge armure. */
export const GENERIC_SUB_TYPE_LABELS = [
  "default",
  "standard",
  "none",
  "normal",
  "medium",
  "light",
  "heavy",
] as const;

/** Catégorie Wiki `items/filters` par famille (dérivé de `wikiItemsCategoryForFamily`). */
export const WIKI_ITEMS_CATEGORY_BY_FAMILY = {
  armor: wikiItemsCategoryForFamily("armor"),
  fps_weapon: wikiItemsCategoryForFamily("fps_weapon"),
  ship_component: wikiItemsCategoryForFamily("ship_component"),
  ship_weapon: wikiItemsCategoryForFamily("ship_weapon"),
  mining: wikiItemsCategoryForFamily("mining"),
  refuel: wikiItemsCategoryForFamily("refuel"),
  other: wikiItemsCategoryForFamily("other"),
} as const satisfies Record<BlueprintFamily, string | null>;

/** Libellés rail familles (UI) — `other` absent du rail. */
export type RailBlueprintFamily = Exclude<BlueprintFamily, "other">;

export function familyRailLabel(family: RailBlueprintFamily): string {
  return FAMILY_LABEL_FR[family];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isGenericBadgeLabel(label: string): boolean {
  const l = label.trim().toLowerCase();
  return (GENERIC_BADGE_LABELS as readonly string[]).includes(l);
}

/** `output.type_label` utilisable comme badge (longueur + pas générique). */
export function isUsefulOutputTypeLabel(label: string): boolean {
  const l = label.trim().toLowerCase();
  if (l.length < 3) return false;
  return !isGenericBadgeLabel(label);
}

/** `sub_type` utilisable comme badge armure. */
export function isUsefulSubTypeLabel(label: string): boolean {
  const l = label.trim().toLowerCase();
  return l.length > 1 && !(GENERIC_SUB_TYPE_LABELS as readonly string[]).includes(l);
}

/** Badges attendus en liste (summary) pour une famille, dans l’ordre d’affichage. */
export function expectedSummaryBadgeKinds(
  family: BlueprintFamily,
): ApiCatalogBadgeKind[] {
  return FAMILY_BADGE_SPECS[family]
    .filter((s) => s.inListSummary)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.kind);
}

/** Résout la famille attendue pour un `output.type` Wiki (miroir simplifié de la taxonomie). */
export function referenceFamilyForWikiOutputType(
  outputType: string | null | undefined,
): BlueprintFamily {
  const t = (outputType ?? "").trim();
  if (!t) return "other";
  for (const [family, types] of Object.entries(WIKI_OUTPUT_TYPE_BY_FAMILY) as [
    BlueprintFamily,
    readonly string[],
  ][]) {
    if (
      types.some(
        (pat) => pat === t || (pat.endsWith("*") && t.startsWith(pat.slice(0, -1))),
      )
    ) {
      return family;
    }
  }
  return "other";
}
