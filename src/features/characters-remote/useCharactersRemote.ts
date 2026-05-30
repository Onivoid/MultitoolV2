import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  charactersRemoteService,
  type CharacterOrderType,
} from "@/features/characters-remote/charactersRemote.service";
import type { Row } from "@/types/charactersList";
import logger from "@/utils/logger";
import { toastError } from "@/shared/lib/toastHelpers";

export function useCharactersRemote() {
  const { toast } = useToast();
  const [charactersPresets, setCharactersPresets] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<CharacterOrderType>("latest");
  const orderRef = useRef<CharacterOrderType>("latest");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const lastSearchTerm = useRef("");

  const fetchPage = useCallback(
    async (nextPage?: number, newSearchTerm?: string, force = false) => {
      if ((isLoading && !force) || !hasMore) return;
      setIsLoading(true);
      const pageToFetch = nextPage || page;
      const search =
        typeof newSearchTerm === "string" ? newSearchTerm : debouncedSearch;

      try {
        const result = await charactersRemoteService.getCharacters({
          page: pageToFetch,
          orderType: orderRef.current,
          search: search && search.length > 0 ? search : undefined,
        });
        logger.log("ORDER USED =>", orderRef.current);
        if (result?.tauriDebug) {
          logger.log("TAURI DEBUG =>", result.tauriDebug);
        }
        const newRows = result.body.rows;
        if (newRows.length === 0) {
          setHasMore(false);
        } else {
          setCharactersPresets((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const filtered = newRows.filter((c) => !existingIds.has(c.id));
            return [...prev, ...filtered];
          });
          setPage(pageToFetch + 1);
        }
      } catch (error) {
        logger.error("Error fetching characters presets:", error);
        toastError(
          toast,
          "Erreur de chargement",
          "Impossible de récupérer les personnages. Veuillez réessayer plus tard.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [hasMore, page, debouncedSearch, isLoading, toast],
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const isInitialLoad =
      !hasInitialized.current && charactersPresets.length === 0 && !isLoading;
    const isSearchChanged = lastSearchTerm.current !== debouncedSearch;
    const isSearchCleared = debouncedSearch === "" && lastSearchTerm.current !== "";
    if (isInitialLoad || isSearchChanged || isSearchCleared) {
      hasInitialized.current = true;
      lastSearchTerm.current = debouncedSearch;
      setCharactersPresets([]);
      setPage(1);
      setHasMore(true);
      fetchPage(1, debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const changeSort = (key: CharacterOrderType) => {
    orderRef.current = key;
    setSort(key);
    setCharactersPresets([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1, debouncedSearch, true);
  };

  return {
    charactersPresets,
    isLoading,
    hasMore,
    sort,
    searchTerm,
    setSearchTerm,
    fetchPage,
    changeSort,
  };
}
