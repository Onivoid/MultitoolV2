import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  filterBlueprints,
  sortBlueprints,
  type BlueprintEntry,
} from "@/features/blueprints/blueprints.lib";
import { blueprintsService } from "@/features/blueprints/blueprints.service";
import type { GamelogWatcherStatus } from "@/features/blueprints/blueprints.service";
import { useBlueprintsImport } from "@/features/blueprints/hooks/useBlueprintsImport";
import { BLUEPRINT_WIDGET_LIST_LIMIT } from "@/features/blueprints/blueprints.widget.lib";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";

export function useBlueprintsWidget() {
  const { toast } = useToast();
  const [blueprints, setBlueprints] = useState<BlueprintEntry[]>([]);
  const [status, setStatus] = useState<GamelogWatcherStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingWatch, setIsTogglingWatch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    isImporting,
    progress,
    operationStartedAt,
    importFromLogbackups,
  } = useBlueprintsImport();

  const loadData = useCallback(async () => {
    setError(null);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadData().finally(() => setLoading(false));
  }, [loadData]);

  const filteredBlueprints = useMemo(() => {
    const filtered = filterBlueprints(blueprints, searchQuery);
    return sortBlueprints(filtered, "dateDesc").slice(0, BLUEPRINT_WIDGET_LIST_LIMIT);
  }, [blueprints, searchQuery]);

  const watching = status?.watching ?? false;
  const busy = isTogglingWatch || isImporting;

  const toggleWatch = useCallback(async () => {
    setIsTogglingWatch(true);
    try {
      if (watching) {
        await blueprintsService.stopWatcher();
        toast({
          title: "Surveillance arrêtée",
          description: "La capture du Game.log est inactive",
        });
      } else {
        await blueprintsService.startWatcher();
        toastSuccess(
          toast,
          "Surveillance démarrée",
          "Le Game.log LIVE est suivi en arrière-plan",
        );
      }
      await loadData();
    } catch (e) {
      toastError(toast, "Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setIsTogglingWatch(false);
    }
  }, [watching, loadData, toast]);

  const syncFromLogs = useCallback(async () => {
    try {
      const result = await importFromLogbackups(true);
      await loadData();
      if (result.matchesFound > 0) {
        toastSuccess(
          toast,
          "Synchronisation terminée",
          `${result.imported} nouveau(x) · ${result.total} au total`,
        );
      } else {
        toastError(
          toast,
          "Aucun schéma trouvé",
          `${result.filesScanned} fichier(s) scanné(s) sans occurrence.`,
        );
      }
    } catch (e) {
      toastError(
        toast,
        "Synchronisation impossible",
        e instanceof Error ? e.message : String(e),
      );
    }
  }, [importFromLogbackups, loadData, toast]);

  return {
    blueprints,
    watching,
    loading,
    error,
    busy,
    isTogglingWatch,
    isImporting,
    progress,
    operationStartedAt,
    searchQuery,
    setSearchQuery,
    filteredBlueprints,
    totalCount: blueprints.length,
    toggleWatch,
    syncFromLogs,
  };
}
