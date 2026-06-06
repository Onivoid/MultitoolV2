import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type { BlueprintEntry } from "@/features/blueprints/blueprints.lib";

export interface BlueprintStoreFile {
  schemaVersion: number;
  blueprints: BlueprintEntry[];
}

export interface GamelogWatcherStatus {
  watching: boolean;
  logPath: string | null;
  blueprintCount: number;
}

export interface BlueprintImportResult {
  imported: number;
  total: number;
  filesScanned: number;
  matchesFound: number;
  filesWithMatches: number;
  uniqueProductsFound: number;
  filesFailed: number;
  logDirectory: string;
  gameLogPath: string;
  readErrors: string[];
  removedWithoutOwner: number;
}

export const blueprintsService = {
  loadStore: () =>
    invokeCommand<BlueprintStoreFile>(TAURI_COMMANDS.loadGamelogBlueprints),

  getWatcherStatus: () =>
    invokeCommand<GamelogWatcherStatus>(TAURI_COMMANDS.getGamelogWatcherStatus),

  startWatcher: () => invokeCommand<void>(TAURI_COMMANDS.startGamelogWatcher),

  stopWatcher: () => invokeCommand<void>(TAURI_COMMANDS.stopGamelogWatcher),

  importFromLogbackups: (includeCurrent = true) =>
    invokeCommand<BlueprintImportResult>(
      TAURI_COMMANDS.importBlueprintsFromLogbackups,
      { includeCurrent },
    ),

  exportStore: () =>
    invokeCommand<string | null>(TAURI_COMMANDS.exportGamelogBlueprints),

  /** Persiste productName → blueprintId dans gamelog_blueprints.json. */
  saveCatalogMatches: (matches: Record<string, string>, overwrite = false) =>
    invokeCommand<number>(TAURI_COMMANDS.saveGamelogBlueprintCatalogMatches, {
      matches,
      overwrite,
    }),
};
