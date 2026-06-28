import type { LoadoutEntry, VehiclePortSummary } from "@/features/ships/ships.types";
import { isWikiPlaceholder } from "@/features/ships/ships.catalog.lib";

/** Catégories loadout masquées (contrôleurs, slots vides, équipement non pertinent). */
const EXCLUDED_LOADOUT_GROUPS = new Set(
  [
    "Door Controller",
    "Collider Controller",
    "Cooler Controller",
    "Door",
    "Comms Controller",
    "Flight Controller",
    "Fuel Tank",
    "Light Controller",
    "Misc",
    "Quantum Fuel Tank",
    "Relay",
    "Seat",
    "Seat Access",
    "Self Destruct",
    "Shield Controller",
    "Weapon Controller",
    "Energy Controller",
    "Missile Controller",
    "Fuel Controller",
    "Capacitor Assignment Controller",
    "Display",
    "Docking Collar",
    "Cargo Grid",
    "Landing System",
    "Main Thruster",
    "Manneuver Thruster",
  ].map(normalizeLoadoutGroupKey),
);

const COMPONENT_CLASS_FR: Record<string, string> = {
  Civilian: "Civil",
  Military: "Militaire",
  Industrial: "Industriel",
  Stealth: "Furtif",
  Competition: "Compétition",
};

export function normalizeLoadoutGroupKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isExcludedLoadoutGroup(group: string | null | undefined): boolean {
  const key = group?.trim();
  if (!key) return false;
  return EXCLUDED_LOADOUT_GROUPS.has(normalizeLoadoutGroupKey(key));
}

export function isPlaceholderLoadoutItem(itemName: string | null | undefined): boolean {
  return isWikiPlaceholder(itemName);
}

export function formatComponentClass(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return COMPONENT_CLASS_FR[trimmed] ?? trimmed;
}

export function portsWithEquippedItems(
  ports: VehiclePortSummary[],
): VehiclePortSummary[] {
  return ports.filter(
    (port) =>
      Boolean(port.itemName?.trim()) && !isPlaceholderLoadoutItem(port.itemName),
  );
}

function loadoutItemKey(port: VehiclePortSummary): string {
  return [
    port.itemName ?? "",
    port.itemManufacturer ?? "",
    port.itemGrade ?? "",
    port.itemClass ?? "",
    port.itemSize ?? "",
    port.itemTypeLabel ?? "",
  ].join("\0");
}

/** Regroupe les entrées identiques (missiles × N, paires de coolers, etc.). */
export function aggregateLoadoutEntries(ports: VehiclePortSummary[]): LoadoutEntry[] {
  const map = new Map<string, LoadoutEntry>();

  for (const port of ports) {
    const key = loadoutItemKey(port);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { port, count: 1 });
    }
  }

  return [...map.values()];
}

export function groupPortsByType(
  ports: VehiclePortSummary[],
): { group: string; items: LoadoutEntry[] }[] {
  const equipped = portsWithEquippedItems(ports);
  const map = new Map<string, VehiclePortSummary[]>();

  for (const port of equipped) {
    const group = port.itemTypeLabel?.trim() || port.categoryLabel?.trim() || "Autre";
    if (isExcludedLoadoutGroup(group)) continue;
    const list = map.get(group) ?? [];
    list.push(port);
    map.set(group, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([group, groupPorts]) => ({
      group,
      items: aggregateLoadoutEntries(groupPorts),
    }));
}

export function totalLoadoutItemCount(groups: { items: LoadoutEntry[] }[]): number {
  return groups.reduce(
    (sum, group) => sum + group.items.reduce((inner, item) => inner + item.count, 0),
    0,
  );
}

export interface CompareLoadoutGroup {
  group: string;
  itemsByShip: LoadoutEntry[][];
}

/** Union des catégories loadout sur plusieurs vaisseaux (pour le comparateur). */
export function collectCompareLoadoutGroups(
  portsByShip: VehiclePortSummary[][],
): CompareLoadoutGroup[] {
  const groupedByShip = portsByShip.map((ports) => groupPortsByType(ports));
  const groupNames = new Set<string>();

  for (const groups of groupedByShip) {
    for (const { group } of groups) {
      groupNames.add(group);
    }
  }

  return [...groupNames]
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((group) => ({
      group,
      itemsByShip: groupedByShip.map((groups) => {
        const match = groups.find((entry) => entry.group === group);
        return match?.items ?? [];
      }),
    }));
}
