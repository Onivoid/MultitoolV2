import type { BlueprintEntry } from "@/features/blueprints/blueprints.lib";
import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";
import { blueprintsCatalogService } from "@/features/blueprints/blueprints.catalog.service";
import { blueprintsService } from "@/features/blueprints/blueprints.service";

/** Normalise un nom pour matching (fallback client léger). */
export function normalizeBlueprintName(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-_:.,/()]+/g, "")
    .trim();
}

/** Nom affiché : catalogue FR si l’ID est connu, sinon libellé brut du journal. */
export function formatJournalBlueprintName(
  entry: BlueprintEntry,
  catalogByBlueprintId: Map<string, BlueprintCatalogSummary>,
): string {
  const id = entry.catalogBlueprintId?.trim();
  if (id) {
    const row = catalogByBlueprintId.get(id);
    if (row?.nameFr?.trim()) return row.nameFr.trim();
    if (row?.nameEn?.trim()) return row.nameEn.trim();
  }
  return entry.productName.trim();
}

/** @deprecated Préférer `resolveOwnedBlueprintIds` (matching Rust + global.ini). */
export function matchProductName(
  productName: string,
  catalog: BlueprintCatalogSummary[],
): string | null {
  const target = normalizeBlueprintName(productName);
  if (!target) return null;

  for (const b of catalog) {
    if (
      normalizeBlueprintName(b.nameFr) === target ||
      normalizeBlueprintName(b.nameEn) === target
    ) {
      return b.blueprintId;
    }
  }

  for (const b of catalog) {
    const fr = normalizeBlueprintName(b.nameFr);
    const en = normalizeBlueprintName(b.nameEn);
    if (fr && (fr.includes(target) || target.includes(fr))) return b.blueprintId;
    if (en && (en.includes(target) || target.includes(en))) return b.blueprintId;
  }

  return null;
}

function filterJournalEntries(
  entries: BlueprintEntry[],
  ownerFilter?: string,
): BlueprintEntry[] {
  const owner = ownerFilter?.trim() ?? "";
  if (!owner) return entries;
  return entries.filter((e) => (e.owner?.trim() ?? "") === owner);
}

/** Noms de produits uniques issus du journal (après filtre compte). */
export function uniqueJournalProductNames(
  entries: BlueprintEntry[],
  ownerFilter?: string,
): string[] {
  const names = new Set<string>();
  for (const e of filterJournalEntries(entries, ownerFilter)) {
    const n = e.productName?.trim();
    if (n) names.add(n);
  }
  return [...names];
}

function resolveProductToBlueprintId(
  productName: string,
  entry: BlueprintEntry | undefined,
  matchMap: Record<string, string>,
): string | null {
  // Le matching catalogue (Rust) prime sur les IDs déjà persistés (souvent faux doublons).
  const fresh = matchMap[productName]?.trim();
  if (fresh) return fresh;
  return entry?.catalogBlueprintId?.trim() ?? null;
}

/**
 * Résout les schémas du journal vers des `blueprintId` via le moteur Rust
 * (alias catalogue + index global.ini + tokens), avec IDs déjà persistés.
 */
/** Plusieurs noms journal pointent vers le même `bp_craft_*` (souvent matching incorrect). */
export interface JournalAmbiguousLink {
  catalogBlueprintId: string;
  productNames: string[];
}

export interface OwnedResolveResult {
  blueprintIds: Set<string>;
  journalProductCount: number;
  matchedProductCount: number;
  /** Noms distincts du journal sans `catalogBlueprintId` (matching Rust + ini échoué). */
  unmatchedProductNames: string[];
  /** Groupes où 2+ noms FR partagent le même ID (écart noms journal vs IDs uniques). */
  ambiguousLinks: JournalAmbiguousLink[];
  /** Entrées journal mises à jour dans gamelog_blueprints.json. */
  persistedEntryCount: number;
}

export function buildAmbiguousLinks(
  uniqueNames: string[],
  sampleByProduct: Map<string, BlueprintEntry>,
  matchMap: Record<string, string>,
): JournalAmbiguousLink[] {
  const byId = new Map<string, string[]>();
  for (const name of uniqueNames) {
    const sample = sampleByProduct.get(name);
    const id = resolveProductToBlueprintId(name, sample, matchMap);
    if (!id) continue;
    const list = byId.get(id) ?? [];
    if (!list.includes(name)) list.push(name);
    byId.set(id, list);
  }
  return [...byId.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([catalogBlueprintId, productNames]) => ({
      catalogBlueprintId,
      productNames,
    }))
    .sort((a, b) => b.productNames.length - a.productNames.length);
}

export async function resolveOwnedBlueprintIds(
  entries: BlueprintEntry[],
  ownerFilter?: string,
): Promise<Set<string>> {
  const r = await resolveOwnedBlueprints(entries, ownerFilter);
  return r.blueprintIds;
}

export async function resolveOwnedBlueprints(
  entries: BlueprintEntry[],
  ownerFilter?: string,
  options?: { persistMatches?: boolean },
): Promise<OwnedResolveResult> {
  const filtered = filterJournalEntries(entries, ownerFilter);
  const uniqueNames = uniqueJournalProductNames(entries, ownerFilter);

  if (uniqueNames.length === 0) {
    return {
      blueprintIds: new Set(),
      journalProductCount: 0,
      matchedProductCount: 0,
      unmatchedProductNames: [],
      ambiguousLinks: [],
      persistedEntryCount: 0,
    };
  }

  const sampleByProduct = new Map<string, BlueprintEntry>();
  for (const e of filtered) {
    const n = e.productName?.trim();
    if (!n) continue;
    if (!sampleByProduct.has(n)) sampleByProduct.set(n, e);
  }

  let matchMap: Record<string, string> = {};
  let persistedEntryCount = 0;
  if (uniqueNames.length > 0) {
    const result = await blueprintsCatalogService.matchProducts(uniqueNames);
    matchMap = result.matches;
    if (options?.persistMatches !== false && Object.keys(matchMap).length > 0) {
      try {
        persistedEntryCount = await blueprintsService.saveCatalogMatches(
          matchMap,
          true,
        );
      } catch {
        /* persistance best-effort */
      }
    }
  }

  const ids = new Set<string>();
  for (const name of uniqueNames) {
    const sample = sampleByProduct.get(name);
    const id = resolveProductToBlueprintId(name, sample, matchMap);
    if (id) ids.add(id);
  }

  const unmatchedProductNames: string[] = [];
  let matchedProductCount = 0;
  for (const name of uniqueNames) {
    const sample = sampleByProduct.get(name);
    if (resolveProductToBlueprintId(name, sample, matchMap)) {
      matchedProductCount += 1;
    } else {
      unmatchedProductNames.push(name);
    }
  }

  const ambiguousLinks = buildAmbiguousLinks(uniqueNames, sampleByProduct, matchMap);

  return {
    blueprintIds: ids,
    journalProductCount: uniqueNames.length,
    matchedProductCount,
    unmatchedProductNames,
    ambiguousLinks,
    persistedEntryCount,
  };
}

/** Noms journal sans ID catalogue (pour overrides manuels futurs). */
export function listUnmatchedJournalProductNames(
  entries: BlueprintEntry[],
  ownerFilter?: string,
  matchMap: Record<string, string> = {},
): string[] {
  const out: string[] = [];
  for (const name of uniqueJournalProductNames(entries, ownerFilter)) {
    const sample = filterJournalEntries(entries, ownerFilter).find(
      (e) => e.productName.trim() === name,
    );
    if (!resolveProductToBlueprintId(name, sample, matchMap)) {
      out.push(name);
    }
  }
  return out;
}

export async function buildOwnedBlueprintIds(
  entries: BlueprintEntry[],
  _catalog?: BlueprintCatalogSummary[],
  ownerFilter?: string,
): Promise<Set<string>> {
  return resolveOwnedBlueprintIds(entries, ownerFilter);
}

export async function buildOwnedUnlockDates(
  entries: BlueprintEntry[],
  ownerFilter?: string,
): Promise<Map<string, number>> {
  const filtered = filterJournalEntries(entries, ownerFilter);
  const names = uniqueJournalProductNames(entries, ownerFilter);

  let matchMap: Record<string, string> = {};
  if (names.length > 0) {
    const result = await blueprintsCatalogService.matchProducts(names);
    matchMap = result.matches;
    if (Object.keys(matchMap).length > 0) {
      try {
        await blueprintsService.saveCatalogMatches(matchMap, true);
      } catch {
        /* best-effort */
      }
    }
  }

  const dates = new Map<string, number>();

  for (const entry of filtered) {
    const trimmed = entry.productName.trim();
    const id = matchMap[trimmed] ?? entry.catalogBlueprintId?.trim() ?? null;
    if (!id) continue;
    const prev = dates.get(id);
    if (prev === undefined || entry.ts < prev) {
      dates.set(id, entry.ts);
    }
  }
  return dates;
}
