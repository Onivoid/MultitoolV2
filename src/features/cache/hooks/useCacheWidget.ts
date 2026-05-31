import { useCallback, useEffect, useMemo, useState } from "react";
import { cacheService, type CacheFolder } from "@/features/cache/cache.service";
import {
  CACHE_WIDGET_LIST_LIMIT,
  filterCacheFolders,
} from "@/features/cache/cache.widget.lib";
import { useCacheActions } from "@/features/cache/useCacheActions";

export function useCacheWidget() {
  const [folders, setFolders] = useState<CacheFolder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const clearAllFolders = useCallback((next: CacheFolder[]) => {
    setFolders(next);
  }, []);

  const { openFolder, clearAll, deleteFolder } = useCacheActions(clearAllFolders);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const result = await cacheService.getInformations();
      setFolders(result.folders);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadData().finally(() => setLoading(false));
  }, [loadData]);

  const filteredFolders = useMemo(() => {
    const folderList = folders ?? [];
    return filterCacheFolders(folderList, searchQuery).slice(
      0,
      CACHE_WIDGET_LIST_LIMIT,
    );
  }, [folders, searchQuery]);

  const totalCount = folders?.length ?? 0;

  const removeFolder = useCallback((path: string) => {
    setFolders((prev) => prev?.filter((f) => f.path !== path) ?? []);
  }, []);

  const handleOpenFolder = useCallback(async () => {
    setBusy(true);
    try {
      await openFolder();
    } finally {
      setBusy(false);
    }
  }, [openFolder]);

  const handleClearAll = useCallback(async () => {
    setBusy(true);
    try {
      await clearAll();
    } finally {
      setBusy(false);
    }
  }, [clearAll]);

  const handleDeleteFolder = useCallback(
    async (path: string) => {
      setBusy(true);
      try {
        await deleteFolder(path, removeFolder);
      } finally {
        setBusy(false);
      }
    },
    [deleteFolder, removeFolder],
  );

  return {
    loading,
    error,
    busy,
    searchQuery,
    setSearchQuery,
    filteredFolders,
    totalCount,
    openFolder: handleOpenFolder,
    clearAll: handleClearAll,
    deleteFolder: handleDeleteFolder,
  };
}
