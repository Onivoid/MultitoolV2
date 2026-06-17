import { useEffect, useState } from "react";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { resolveOwnedBlueprints } from "@/features/blueprints/blueprints.match.lib";
import { blueprintsService } from "@/features/blueprints/blueprints.service";

/** Nombre d’IDs catalogue uniques (journal + possession manuelle). */
export function useJournalOwnedBlueprintCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCount = async () => {
      try {
        const [store, manualIds] = await Promise.all([
          blueprintsService.loadStore(),
          invokeCommand<string[]>(TAURI_COMMANDS.manualOwnedBlueprintsGet),
        ]);
        const resolved = await resolveOwnedBlueprints(store.blueprints);
        const merged = new Set(resolved.blueprintIds);
        for (const id of manualIds) merged.add(id);
        if (!cancelled) {
          setCount(merged.size);
        }
      } catch {
        if (!cancelled) setCount(null);
      }
    };

    const schedule = () => {
      if (!cancelled) void loadCount();
    };

    if (typeof requestIdleCallback !== "undefined") {
      const idleId = requestIdleCallback(schedule, { timeout: 3000 });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
      };
    }

    const timerId = window.setTimeout(schedule, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  return count;
}
