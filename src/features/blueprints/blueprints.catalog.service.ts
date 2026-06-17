import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import {
  ensureArray,
  ensureStringArray,
  normalizeBlueprintDetail,
  normalizeCatalogSummary,
  normalizeIngredientLocation,
} from "@/features/blueprints/blueprints.catalog.lib";
import type {
  BlueprintCatalogDetail,
  BlueprintCatalogFilters,
  BlueprintCatalogRevalidateResult,
  BlueprintCatalogSummary,
  IngredientLocationPreview,
  MissionDetailResult,
  WikiItemsFilters,
} from "@/features/blueprints/blueprints.catalog.types";
import {
  invalidateSessionCatalog,
  loadSessionCatalog,
  setSessionCatalog,
} from "@/features/blueprints/blueprints.catalog.cache";

async function fetchListFullNormalized(): Promise<BlueprintCatalogSummary[]> {
  const list = await invokeCommand<BlueprintCatalogSummary[]>(
    TAURI_COMMANDS.blueprintsCatalogListFull,
  );
  return ensureArray<BlueprintCatalogSummary>(list).map(normalizeCatalogSummary);
}

export const blueprintsCatalogService = {
  listFull: () => loadSessionCatalog(fetchListFullNormalized),

  listFullFresh: async () => {
    invalidateSessionCatalog();
    return fetchListFullNormalized().then((list) => {
      setSessionCatalog(list);
      return list;
    });
  },

  revalidate: async () => {
    const result = await invokeCommand<BlueprintCatalogRevalidateResult>(
      TAURI_COMMANDS.blueprintsCatalogRevalidate,
    );
    const list = ensureArray<BlueprintCatalogSummary>(result.list).map(
      normalizeCatalogSummary,
    );
    setSessionCatalog(list);
    return { ...result, list };
  },

  detail: async (blueprintId: string) => {
    const raw = await invokeCommand<BlueprintCatalogDetail>(
      TAURI_COMMANDS.blueprintCatalogDetail,
      { blueprintId },
    );
    return normalizeBlueprintDetail(raw);
  },

  refreshLocalization: () =>
    invokeCommand<void>(TAURI_COMMANDS.blueprintsCatalogRefreshLocalization),

  matchProducts: (productNames: string[]) =>
    invokeCommand<{
      matches: Record<string, string>;
      ambiguous: string[];
      matchedCount: number;
      requestedCount: number;
    }>(TAURI_COMMANDS.blueprintsCatalogMatchProducts, { productNames }),

  /** Fiches absentes du cache local (ex. débloqués récents). */
  supplementIds: async (blueprintIds: string[]) => {
    const list = await invokeCommand<BlueprintCatalogSummary[]>(
      TAURI_COMMANDS.blueprintsCatalogSupplementIds,
      { blueprintIds },
    );
    return ensureArray<BlueprintCatalogSummary>(list).map(normalizeCatalogSummary);
  },

  filters: () =>
    invokeCommand<BlueprintCatalogFilters>(TAURI_COMMANDS.blueprintsCatalogFilters),

  wikiItemsFilters: (category: string) =>
    invokeCommand<WikiItemsFilters>(TAURI_COMMANDS.wikiItemsFilters, { category }),

  missionDetail: async (missionUuid: string, directUnlockBlueprintId?: string) => {
    const raw = await invokeCommand<MissionDetailResult>(
      TAURI_COMMANDS.blueprintsMissionDetail,
      {
        missionUuid,
        directUnlockBlueprintId: directUnlockBlueprintId ?? null,
      },
    );
    return {
      ...raw,
      starSystems: ensureStringArray(raw.starSystems),
      jurisdictions: ensureStringArray(raw.jurisdictions),
      shareable: typeof raw.shareable === "boolean" ? raw.shareable : null,
      rankIndex: typeof raw.rankIndex === "number" ? raw.rankIndex : null,
      minStandingName: raw.minStandingName ?? null,
      minStandingReputation:
        typeof raw.minStandingReputation === "number"
          ? raw.minStandingReputation
          : null,
      missionType: raw.missionType ?? null,
      timeToCompleteMinutes:
        typeof raw.timeToCompleteMinutes === "number"
          ? raw.timeToCompleteMinutes
          : null,
      blueprintRewards: raw.blueprintRewards ?? [],
    };
  },

  ingredientLocations: async (commodityUuid: string) => {
    const list = await invokeCommand<IngredientLocationPreview[]>(
      TAURI_COMMANDS.ingredientLocations,
      { commodityUuid },
    );
    return ensureArray<IngredientLocationPreview>(list).map(
      normalizeIngredientLocation,
    );
  },
};
