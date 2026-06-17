import { useCallback, useEffect, useState } from "react";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export function useBlueprintManualOwned() {
  const [manualOwnedIds, setManualOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const ids = await invokeCommand<string[]>(
        TAURI_COMMANDS.manualOwnedBlueprintsGet,
      );
      setManualOwnedIds(new Set(ids));
    } catch {
      setManualOwnedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleManualOwned = useCallback(async (blueprintId: string) => {
    const ids = await invokeCommand<string[]>(
      TAURI_COMMANDS.manualOwnedBlueprintToggle,
      {
        blueprintId,
      },
    );
    setManualOwnedIds(new Set(ids));
    return ids;
  }, []);

  const isManualOwned = useCallback(
    (blueprintId: string) => manualOwnedIds.has(blueprintId),
    [manualOwnedIds],
  );

  return {
    manualOwnedIds,
    loading,
    toggleManualOwned,
    isManualOwned,
    refresh,
  };
}
