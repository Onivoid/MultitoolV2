import { useCallback, useEffect, useState } from "react";
import { cacheService, type CacheFolder } from "@/features/cache/cache.service";

export function useCache() {
  const [folders, setFolders] = useState<CacheFolder[] | null>(null);

  const scan = useCallback(async () => {
    const result = await cacheService.getInformations();
    setFolders(result.folders);
  }, []);

  const removeFolder = useCallback((path: string) => {
    setFolders((prev) => prev?.filter((f) => f.path !== path) ?? null);
  }, []);

  const clearAllFolders = useCallback(() => {
    setFolders([]);
  }, []);

  useEffect(() => {
    if (!folders) {
      scan();
    }
  }, [folders, scan]);

  return {
    folders,
    isLoading: folders === null,
    scan,
    removeFolder,
    clearAllFolders,
  };
}
