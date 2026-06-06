import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { blueprintsService } from "@/features/blueprints/blueprints.service";
import {
  type BlueprintEntry,
  type BlueprintSortKey,
  filterBlueprints,
  getUniqueOwners,
  loadBlueprintSortKey,
  saveBlueprintSortKey,
  sortBlueprints,
} from "@/features/blueprints/blueprints.lib";
import { useBlueprintsImport } from "@/features/blueprints/hooks/useBlueprintsImport";
import logger from "@/utils/logger";
import { toastError, toastSuccess, toastWarning } from "@/shared/lib/toastHelpers";

export function useBlueprints() {
  const { toast } = useToast();
  const {
    isImporting,
    progress: importProgress,
    operationStartedAt: importStartedAt,
    importFromLogbackups,
  } = useBlueprintsImport();
  const [blueprints, setBlueprints] = useState<BlueprintEntry[]>([]);
  const [status, setStatus] = useState<Awaited<
    ReturnType<typeof blueprintsService.getWatcherStatus>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingWatch, setIsTogglingWatch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [sortKey, setSortKey] = useState<BlueprintSortKey>(loadBlueprintSortKey);

  const handleSortChange = useCallback((key: BlueprintSortKey) => {
    setSortKey(key);
    saveBlueprintSortKey(key);
  }, []);

  const uniqueOwners = useMemo(() => getUniqueOwners(blueprints), [blueprints]);

  const filteredBlueprints = useMemo(
    () =>
      sortBlueprints(filterBlueprints(blueprints, searchQuery, ownerFilter), sortKey),
    [blueprints, searchQuery, ownerFilter, sortKey],
  );

  const loadData = useCallback(async (silent = false) => {
    try {
      const [store, watcherStatus] = await Promise.all([
        blueprintsService.loadStore(),
        blueprintsService.getWatcherStatus(),
      ]);
      setBlueprints(
        (store.blueprints ?? []).map((bp) => ({
          ...bp,
          owner: bp.owner ?? "",
        })),
      );
      setStatus(watcherStatus);
      if (!silent) {
        toastSuccess(
          toast,
          "Liste mise à jour",
          `${store.blueprints?.length ?? 0} blueprint(s)`,
        );
      }
    } catch (error) {
      logger.error("Erreur chargement blueprints:", error);
      toastError(toast, "Erreur", "Impossible de charger les blueprints");
    }
    // toast volontairement hors deps pour éviter une boucle de rechargement
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void loadData(true).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadData(false);
    setIsRefreshing(false);
  };

  const reloadStoreSilent = useCallback(() => loadData(true), [loadData]);

  const startWatch = async () => {
    setIsTogglingWatch(true);
    try {
      await blueprintsService.startWatcher();
      await loadData(true);
      toastSuccess(
        toast,
        "Surveillance démarrée",
        "Le Game.log LIVE est suivi en arrière-plan",
      );
    } catch (error) {
      toastError(toast, "Erreur", String(error));
    } finally {
      setIsTogglingWatch(false);
    }
  };

  const stopWatch = async () => {
    setIsTogglingWatch(true);
    try {
      await blueprintsService.stopWatcher();
      await loadData(true);
      toast({
        title: "Surveillance arrêtée",
        description: "La capture du Game.log est inactive",
      });
    } catch (error) {
      toastError(toast, "Erreur", String(error));
    } finally {
      setIsTogglingWatch(false);
    }
  };

  const importHistory = async () => {
    try {
      const result = await importFromLogbackups(true);
      await loadData(true);
      const errHint =
        result.filesFailed > 0
          ? ` — ${result.filesFailed} fichier(s) illisible(s)`
          : "";
      const pruneHint =
        result.removedWithoutOwner > 0
          ? ` — ${result.removedWithoutOwner} sans compte retiré(s)`
          : "";
      const pathHint = `LIVE : ${result.gameLogPath}`;
      toast({
        title:
          result.matchesFound > 0
            ? "Synchronisation terminée"
            : "Aucune occurrence dans les logs scannés",
        description:
          result.matchesFound > 0
            ? `${result.matchesFound} ligne(s), ${result.uniqueProductsFound} schéma(s) distinct(s) dans ${result.filesWithMatches}/${result.filesScanned} fichier(s) — ${result.imported} nouveau(x), ${result.total} au total${pruneHint}${errHint}`
            : `${result.filesScanned} fichier(s) scanné(s), 0 ligne « Schémas reçu » / « Received Blueprint ». ${pathHint}${errHint}. Recompilez l'app si vous venez de mettre à jour.`,
        variant: result.matchesFound > 0 ? "success" : "destructive",
      });
      if (result.readErrors.length > 0) {
        logger.error("Erreurs lecture logs:", result.readErrors);
      }
    } catch (error) {
      toastError(toast, "Synchronisation impossible", String(error));
    }
  };

  const exportBlueprints = async () => {
    if (blueprints.length === 0) {
      toastWarning(toast, "Rien à exporter", "Aucun blueprint enregistré.");
      return;
    }

    setIsExporting(true);
    try {
      const path = await blueprintsService.exportStore();
      if (path) {
        toastSuccess(toast, "Export terminé", path);
      }
    } catch (error) {
      toastError(toast, "Export impossible", String(error));
    } finally {
      setIsExporting(false);
    }
  };

  return {
    blueprints,
    status,
    isLoading,
    isRefreshing,
    isTogglingWatch,
    isImporting,
    importProgress,
    importStartedAt,
    isExporting,
    searchQuery,
    setSearchQuery,
    ownerFilter,
    setOwnerFilter,
    sortKey,
    handleSortChange,
    uniqueOwners,
    filteredBlueprints,
    refresh,
    reloadStoreSilent,
    startWatch,
    stopWatch,
    importHistory,
    exportBlueprints,
  };
}
