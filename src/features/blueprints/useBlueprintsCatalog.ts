import { useCallback, useEffect, useMemo, useState } from "react";
import { buildCatalogSummaryFacets } from "@/features/blueprints/blueprints.catalog.lib";
import { blueprintsCatalogService } from "@/features/blueprints/blueprints.catalog.service";
import type {
  BlueprintCatalogDetail,
  BlueprintCatalogFilters,
  BlueprintCatalogSummary,
} from "@/features/blueprints/blueprints.catalog.types";
import logger from "@/utils/logger";

export function useBlueprintsCatalog() {
  const [catalog, setCatalog] = useState<BlueprintCatalogSummary[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [facets, setFacets] = useState<BlueprintCatalogFilters | null>(null);

  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BlueprintCatalogDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const catalogById = useMemo(() => {
    const map = new Map<string, BlueprintCatalogSummary>();
    for (const b of catalog) {
      map.set(b.blueprintId, b);
    }
    return map;
  }, [catalog]);

  const selectedSummary = useMemo(
    () => (selectedBlueprintId ? (catalogById.get(selectedBlueprintId) ?? null) : null),
    [selectedBlueprintId, catalogById],
  );

  const summaryFacets = useMemo(
    () => (catalog.length > 0 ? buildCatalogSummaryFacets(catalog) : null),
    [catalog],
  );

  const loadCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    try {
      const list = await blueprintsCatalogService.listFull();
      setCatalog(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setCatalogError(msg);
      logger.error("[blueprints] catalogue:", e);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  const revalidateCatalog = useCallback(async () => {
    setIsRevalidating(true);
    try {
      const result = await blueprintsCatalogService.revalidate();
      setCatalog(result.list);
      return result;
    } catch (e) {
      logger.warn("[blueprints] revalidate:", e);
      return null;
    } finally {
      setIsRevalidating(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
    void blueprintsCatalogService
      .filters()
      .then(setFacets)
      .catch((e) => {
        logger.warn("[blueprints] filters:", e);
      });
  }, [loadCatalog]);

  const loadDetail = useCallback(async (summary: BlueprintCatalogSummary) => {
    setIsLoadingDetail(true);
    setDetailError(null);
    setDetail(null);
    try {
      const d = await blueprintsCatalogService.detail(summary.blueprintId);
      setDetail(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setDetailError(msg);
      logger.error("[blueprints] detail:", e);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSummary) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    void loadDetail(selectedSummary);
  }, [selectedSummary, loadDetail]);

  const selectBlueprint = useCallback((blueprintId: string | null) => {
    setSelectedBlueprintId(blueprintId);
  }, []);

  const appendSummaries = useCallback((extra: BlueprintCatalogSummary[]) => {
    if (extra.length === 0) return;
    setCatalog((prev) => {
      const seen = new Set(prev.map((b) => b.blueprintId));
      const merged = [...prev];
      for (const item of extra) {
        if (!seen.has(item.blueprintId)) {
          seen.add(item.blueprintId);
          merged.push(item);
        }
      }
      merged.sort((a, b) => a.blueprintId.localeCompare(b.blueprintId));
      return merged;
    });
  }, []);

  return {
    catalog,
    catalogById,
    isLoadingCatalog,
    catalogError,
    isRevalidating,
    loadCatalog,
    revalidateCatalog,
    appendSummaries,
    selectedBlueprintId,
    selectedSummary,
    selectBlueprint,
    detail,
    isLoadingDetail,
    detailError,
    facets,
    summaryFacets,
  };
}
