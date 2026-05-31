import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { BLUEPRINTS_IMPORT_PROGRESS_EVENT } from "@/features/blueprints/blueprints.progress.lib";
import type { BlueprintsImportProgress } from "@/features/blueprints/blueprints.import.types";
import {
  blueprintsService,
  type BlueprintImportResult,
} from "@/features/blueprints/blueprints.service";

export function useBlueprintsImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<BlueprintsImportProgress | null>(null);
  const [operationStartedAt, setOperationStartedAt] = useState<number | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    void listen<BlueprintsImportProgress>(BLUEPRINTS_IMPORT_PROGRESS_EVENT, (event) => {
      setProgress(event.payload);
    }).then((unlisten) => {
      unlistenRef.current = unlisten;
    });
    return () => {
      unlistenRef.current?.();
    };
  }, []);

  const importFromLogbackups = useCallback(
    async (includeCurrent = true): Promise<BlueprintImportResult> => {
      setIsImporting(true);
      setOperationStartedAt(Date.now());
      setProgress(null);
      try {
        return await blueprintsService.importFromLogbackups(includeCurrent);
      } finally {
        setIsImporting(false);
        setProgress(null);
        setOperationStartedAt(null);
      }
    },
    [],
  );

  return {
    isImporting,
    progress,
    operationStartedAt,
    importFromLogbackups,
  };
}
