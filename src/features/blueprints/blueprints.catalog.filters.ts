import type {
  BlueprintCatalogSummary,
  BlueprintOwnedFilter,
  BlueprintClassCode,
  CatalogSortKey,
} from "@/features/blueprints/blueprints.catalog.types";
import {
  catalogDisplayName,
  normalizeCatalogGrade,
  resolveBlueprintClass,
  type CatalogBadgeFilter,
} from "@/features/blueprints/blueprints.catalog.lib";
import {
  resolveItemFamily,
  type BlueprintFamily,
} from "@/features/blueprints/blueprints.taxonomy";

export interface BlueprintCatalogFilterState {
  query: string;
  owned: BlueprintOwnedFilter;
  outputTypes: string[];
  classCodes: BlueprintClassCode[];
  sizes: number[];
  grades: string[];
  manufacturerCodes: string[];
  defaultOwned: "all" | "yes" | "no";
  hasMissions: "all" | "yes" | "no";
  resourceUuid: string | null;
  /** UUIDs alternatifs (ex. minerai vs item) pour le filtre ingrédient. */
  resourceUuidAliases: string[];
  resourceFilterLabel: string | null;
  starSystems: string[];
  jurisdictions: string[];
  missionUuid: string | null;
  /** Sous-chaînes requises dans blueprintId (ex. _heavy_, _legs_). */
  idTokens: string[];
  /** Nombre de paliers craft Wiki (tiers.length). */
  tiersCount: number | null;
  family: BlueprintFamily | "all";
  sort: CatalogSortKey;
}

export const DEFAULT_CATALOG_FILTER_STATE: BlueprintCatalogFilterState = {
  query: "",
  owned: "all",
  outputTypes: [],
  classCodes: [],
  sizes: [],
  grades: [],
  manufacturerCodes: [],
  defaultOwned: "all",
  hasMissions: "all",
  resourceUuid: null,
  resourceUuidAliases: [],
  resourceFilterLabel: null,
  starSystems: [],
  jurisdictions: [],
  missionUuid: null,
  idTokens: [],
  tiersCount: null,
  family: "all",
  sort: "nameFr",
};

export function countActiveFilters(state: BlueprintCatalogFilterState): number {
  let n = 0;
  if (state.outputTypes.length) n += 1;
  if (state.classCodes.length) n += 1;
  if (state.sizes.length) n += 1;
  if (state.grades.length) n += 1;
  if (state.manufacturerCodes.length) n += 1;
  if (state.defaultOwned !== "all") n += 1;
  if (state.hasMissions !== "all") n += 1;
  if (state.resourceUuid) n += 1;
  if (state.starSystems.length) n += 1;
  if (state.jurisdictions.length) n += 1;
  if (state.missionUuid) n += 1;
  if (state.idTokens.length) n += 1;
  if (state.tiersCount != null) n += 1;
  if (state.family !== "all") n += 1;
  return n;
}

export function isCatalogBadgeFilterActive(
  state: BlueprintCatalogFilterState,
  filter: CatalogBadgeFilter,
): boolean {
  switch (filter.type) {
    case "size":
      return state.sizes.includes(filter.size);
    case "grade":
      return state.grades.includes(filter.letter);
    case "manufacturer":
      return state.manufacturerCodes.includes(filter.code);
    case "outputType":
      return state.outputTypes.includes(filter.value);
    case "class":
      return state.classCodes.includes(filter.code);
    case "defaultOwned":
      return state.defaultOwned === "yes";
    case "idToken":
      return state.idTokens.includes(filter.token);
    case "tiers":
      return state.tiersCount === filter.count;
  }
}

/** Bascule le filtre correspondant au badge (clic = activer / désactiver). */
export function applyCatalogBadgeFilter(
  state: BlueprintCatalogFilterState,
  filter: CatalogBadgeFilter,
): BlueprintCatalogFilterState {
  const active = isCatalogBadgeFilterActive(state, filter);

  switch (filter.type) {
    case "size": {
      const sizes = new Set(state.sizes);
      if (active) sizes.delete(filter.size);
      else sizes.add(filter.size);
      return { ...state, sizes: [...sizes].sort((a, b) => a - b) };
    }
    case "grade": {
      const grades = new Set(state.grades);
      if (active) grades.delete(filter.letter);
      else grades.add(filter.letter);
      return { ...state, grades: [...grades].sort() };
    }
    case "manufacturer": {
      const manufacturerCodes = new Set(state.manufacturerCodes);
      if (active) manufacturerCodes.delete(filter.code);
      else manufacturerCodes.add(filter.code);
      return { ...state, manufacturerCodes: [...manufacturerCodes].sort() };
    }
    case "outputType": {
      const outputTypes = new Set(state.outputTypes);
      if (active) outputTypes.delete(filter.value);
      else outputTypes.add(filter.value);
      return { ...state, outputTypes: [...outputTypes] };
    }
    case "class": {
      const classCodes = new Set(state.classCodes);
      if (active) classCodes.delete(filter.code);
      else classCodes.add(filter.code);
      return { ...state, classCodes: [...classCodes] };
    }
    case "defaultOwned":
      return {
        ...state,
        defaultOwned: active ? "all" : "yes",
      };
    case "idToken": {
      const idTokens = new Set(state.idTokens);
      if (active) idTokens.delete(filter.token);
      else idTokens.add(filter.token);
      return { ...state, idTokens: [...idTokens] };
    }
    case "tiers":
      return {
        ...state,
        tiersCount: active ? null : filter.count,
      };
  }
}

function matchesQuery(item: BlueprintCatalogSummary, q: string): boolean {
  if (!q) return true;
  const name = catalogDisplayName(item, "fr").toLowerCase();
  const nameEn = (item.nameEn ?? "").toLowerCase();
  const id = item.blueprintId.toLowerCase();
  const cat = (item.category ?? "").toLowerCase();
  return (
    name.includes(q) ||
    nameEn.includes(q) ||
    id.includes(q) ||
    cat.includes(q)
  );
}

function sortCatalog(
  items: BlueprintCatalogSummary[],
  sort: CatalogSortKey,
  unlockDates?: Map<string, number>,
): BlueprintCatalogSummary[] {
  const copy = [...items];
  copy.sort((a, b) => {
    switch (sort) {
      case "nameEn":
        return (a.nameEn || a.blueprintId).localeCompare(b.nameEn || b.blueprintId, "fr");
      case "craftTime":
        return (a.craftTimeSeconds ?? 0) - (b.craftTimeSeconds ?? 0);
      case "size":
        return (a.size ?? 0) - (b.size ?? 0);
      case "missions":
        return (
          (b.unlockingMissionsCount ?? 0) - (a.unlockingMissionsCount ?? 0)
        );
      case "unlockDate": {
        const ta = unlockDates?.get(a.blueprintId) ?? 0;
        const tb = unlockDates?.get(b.blueprintId) ?? 0;
        return tb - ta;
      }
      case "nameFr":
      default: {
        const na = catalogDisplayName(a, "fr");
        const nb = catalogDisplayName(b, "fr");
        return na.localeCompare(nb, "fr");
      }
    }
  });
  return copy;
}

export function applyCatalogFilters(
  catalog: BlueprintCatalogSummary[],
  state: BlueprintCatalogFilterState,
  ownedIds: Set<string>,
  missionBlueprintIds?: Set<string> | null,
  unlockDates?: Map<string, number>,
): BlueprintCatalogSummary[] {
  const q = state.query.trim().toLowerCase();
  let result = catalog.filter((b) => {
    if (state.owned === "owned" && !ownedIds.has(b.blueprintId)) return false;
    if (state.owned === "not_owned" && ownedIds.has(b.blueprintId)) return false;
    if (state.outputTypes.length > 0) {
      const t = b.outputType ?? b.category ?? "";
      if (!state.outputTypes.some((ot) => t === ot || (b.category ?? "").includes(ot))) {
        return false;
      }
    }
    if (state.classCodes.length > 0) {
      const cls = resolveBlueprintClass(b);
      if (!cls || !state.classCodes.includes(cls)) return false;
    }
    if (state.sizes.length > 0) {
      if (b.size == null || !state.sizes.includes(b.size)) return false;
    }
    if (state.grades.length > 0) {
      const g = normalizeCatalogGrade(
        b.grade,
        b.outputType ?? b.category,
      );
      if (!g || !state.grades.includes(g)) return false;
    }
    if (state.manufacturerCodes.length > 0) {
      const m = (b.manufacturer ?? "").trim().toUpperCase();
      if (!m || !state.manufacturerCodes.includes(m)) return false;
    }
    if (state.defaultOwned === "yes" && !b.defaultOwned) return false;
    if (state.defaultOwned === "no" && b.defaultOwned) return false;
    if (state.hasMissions === "yes" && !(b.unlockingMissionsCount && b.unlockingMissionsCount > 0)) {
      return false;
    }
    if (state.hasMissions === "no" && (b.unlockingMissionsCount ?? 0) > 0) {
      return false;
    }
    if (state.resourceUuid) {
      const want = new Set([
        state.resourceUuid,
        ...state.resourceUuidAliases,
      ]);
      const uuids = b.resourceUuids ?? [];
      if (!uuids.some((u) => want.has(u))) return false;
    }
    if (state.starSystems.length > 0) {
      const systems = b.unlockSystems ?? [];
      if (!state.starSystems.some((s) => systems.includes(s))) return false;
    }
    if (state.jurisdictions.length > 0) {
      const jurs = b.unlockJurisdictions ?? [];
      if (!state.jurisdictions.some((j) => jurs.includes(j))) return false;
    }
    if (state.missionUuid && missionBlueprintIds) {
      if (!missionBlueprintIds.has(b.blueprintId)) return false;
    }
    if (state.idTokens.length > 0) {
      const id = b.blueprintId.toLowerCase();
      if (!state.idTokens.every((tok) => id.includes(tok.toLowerCase()))) {
        return false;
      }
    }
    if (state.tiersCount != null) {
      if (b.tiers !== state.tiersCount) return false;
    }
    if (state.family !== "all" && resolveItemFamily(b) !== state.family) {
      return false;
    }
    return matchesQuery(b, q);
  });
  result = sortCatalog(result, state.sort, unlockDates);
  return result;
}
