import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";

export type BlueprintFamily =
  | "armor"
  | "fps_weapon"
  | "ship_component"
  | "ship_weapon"
  | "mining"
  | "refuel"
  | "other";

/** Familles affichées dans le rail (hors « Autre » — ces items restent sous Tous). */
export const BLUEPRINT_FAMILIES: BlueprintFamily[] = [
  "armor",
  "fps_weapon",
  "ship_component",
  "ship_weapon",
  "mining",
  "refuel",
];

export const FAMILY_LABEL_FR: Record<BlueprintFamily, string> = {
  armor: "Armure",
  fps_weapon: "Armes FPS",
  ship_component: "Composants",
  ship_weapon: "Armes vaisseau",
  mining: "Mining",
  refuel: "Refuel",
  other: "Autre",
};

export function classifyBlueprintFamily(
  outputType: string | null | undefined,
): BlueprintFamily {
  const t = (outputType ?? "").trim();
  if (!t) return "other";
  if (t.startsWith("Char_Armor")) return "armor";
  if (t === "WeaponPersonal" || t === "WeaponAttachment") return "fps_weapon";
  if (t === "WeaponGun") return "ship_weapon";
  if (t === "WeaponMining") return "mining";
  if (t === "DockingCollar") return "refuel";
  if (t === "Misc") return "other";
  if (
    [
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
    ].includes(t) ||
    t.startsWith("Ship")
  ) {
    return "ship_component";
  }
  return "other";
}

export function resolveItemFamily(
  item: Pick<BlueprintCatalogSummary, "family" | "outputType" | "category">,
): BlueprintFamily {
  const raw = (item.family ?? "").trim() as BlueprintFamily;
  if (raw === "other" || BLUEPRINT_FAMILIES.includes(raw)) return raw;
  return classifyBlueprintFamily(item.outputType ?? item.category);
}

export function wikiItemsCategoryForFamily(family: BlueprintFamily): string | null {
  switch (family) {
    case "ship_component":
      return "vehicle-components";
    case "ship_weapon":
      return "vehicle-weapons";
    case "fps_weapon":
      return "weapons";
    case "armor":
      return "armor";
    case "mining":
      return "mining-modifiers";
    default:
      return null;
  }
}

export function isValidDescriptionValue(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (!v) return false;
  return !/^(undefined|null|none|n\/a|na)$/i.test(v);
}

export function descriptionDataValue(
  rows: { name: string; value: string }[] | undefined,
  key: string,
): string | null {
  if (!rows?.length) return null;
  const row = rows.find((r) => r.name.trim().toLowerCase() === key.toLowerCase());
  if (!row || !isValidDescriptionValue(row.value)) return null;
  return row.value.trim();
}
