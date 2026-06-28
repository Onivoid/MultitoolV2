import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { shipsService } from "@/features/ships/ships.service";
import {
  buildShipFacetOptions,
  EMPTY_SHIP_FACETS,
  shipMatchesFacets,
  type ShipFacetFilters,
} from "@/features/ships/components/ShipFiltersBar";
import { shipMatchesSearch } from "@/features/ships/ships.lib";
import {
  MAX_COMPARE_SHIPS,
  type VehicleDetail,
  type VehicleSummary,
} from "@/features/ships/ships.types";
import logger from "@/utils/logger";
import { toastError } from "@/shared/lib/toastHelpers";

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function useShipsCatalog() {
  const [ships, setShips] = useState<VehicleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [facetFilters, setFacetFilters] = useState<ShipFacetFilters>(EMPTY_SHIP_FACETS);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [detailUuid, setDetailUuid] = useState<string | null>(null);
  const [detail, setDetail] = useState<VehicleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [compareDetails, setCompareDetails] = useState<Map<string, VehicleDetail>>(
    new Map(),
  );
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await shipsService.list();
      setShips(data);
    } catch (error) {
      logger.error("Erreur chargement vaisseaux:", error);
      toastError(toast, "Erreur", "Impossible de charger le catalogue des vaisseaux");
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const shipsById = useMemo(() => {
    const map = new Map<string, VehicleSummary>();
    for (const ship of ships) map.set(ship.uuid, ship);
    return map;
  }, [ships]);

  const facetOptions = useMemo(() => buildShipFacetOptions(ships), [ships]);

  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return ships.filter(
      (ship) => shipMatchesSearch(ship, query) && shipMatchesFacets(ship, facetFilters),
    );
  }, [ships, search, facetFilters]);

  const compareShips = useMemo(
    () =>
      compareIds
        .map((id) => shipsById.get(id))
        .filter((s): s is VehicleSummary => s != null),
    [compareIds, shipsById],
  );

  const loadDetail = useCallback(
    async (uuid: string) => {
      setDetailLoading(true);
      setDetail(null);
      try {
        const data = await shipsService.detail(uuid);
        setDetail(data);
        return data;
      } catch (error) {
        logger.error("Erreur détail vaisseau:", error);
        toastError(toast, "Erreur", "Impossible de charger les détails du vaisseau");
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [toast],
  );

  const openDetail = useCallback(
    (uuid: string) => {
      setDetailUuid(uuid);
      void loadDetail(uuid);
    },
    [loadDetail],
  );

  const closeDetail = useCallback(() => {
    setDetailUuid(null);
    setDetail(null);
  }, []);

  useEffect(() => {
    setCompareDetails((prev) => {
      const next = new Map<string, VehicleDetail>();
      for (const id of compareIds) {
        const existing = prev.get(id);
        if (existing) next.set(id, existing);
      }
      return next.size === prev.size && compareIds.every((id) => prev.has(id))
        ? prev
        : next;
    });
  }, [compareIds]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      for (const id of compareIds) {
        if (cancelled) return;
        let alreadyLoaded = false;
        setCompareDetails((prev) => {
          alreadyLoaded = prev.has(id);
          return prev;
        });
        if (alreadyLoaded) continue;

        try {
          const data = await shipsService.detail(id);
          if (cancelled) return;
          setCompareDetails((prev) => {
            if (prev.has(id)) return prev;
            const next = new Map(prev);
            next.set(id, data);
            return next;
          });
        } catch (error) {
          logger.warn("Compare detail fetch failed:", id, error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [compareIds]);

  const toggleCompare = useCallback(
    (uuid: string) => {
      setCompareIds((prev) => {
        if (prev.includes(uuid)) {
          return prev.filter((id) => id !== uuid);
        }
        if (prev.length >= MAX_COMPARE_SHIPS) {
          toast({
            title: "Comparaison limitée",
            description: `Vous pouvez comparer au maximum ${MAX_COMPARE_SHIPS} vaisseaux.`,
          });
          return prev;
        }
        return [...prev, uuid];
      });
    },
    [toast],
  );

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setCompareDetails(new Map());
  }, []);

  const isCompared = useCallback(
    (uuid: string) => compareIds.includes(uuid),
    [compareIds],
  );

  return {
    ships: filtered,
    totalCount: ships.length,
    isLoading,
    search,
    setSearch,
    facetFilters,
    setFacetFilters,
    facetOptions,
    compareIds,
    compareShips,
    compareDetails,
    toggleCompare,
    clearCompare,
    isCompared,
    canAddCompare: compareIds.length < MAX_COMPARE_SHIPS,
    detailUuid,
    detail,
    detailLoading,
    openDetail,
    closeDetail,
  };
}
