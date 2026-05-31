import { formatDurationMs } from "@/features/game-stats/gameStats.progress.lib";
import type { BlueprintsImportProgress } from "@/features/blueprints/blueprints.import.types";

export const BLUEPRINTS_IMPORT_PROGRESS_EVENT = "blueprints-import-progress";

export function getBlueprintsImportStepLabel(
  progress: BlueprintsImportProgress | null,
): string {
  if (!progress) {
    return "Préparation de la synchronisation…";
  }

  switch (progress.phase) {
    case "discovering_files":
      return "Recherche des fichiers logs…";
    case "scanning_logs":
      if (progress.filesTotal > 0) {
        const fileHint = progress.currentFile
          ? ` · ${truncateFileName(progress.currentFile)}`
          : "";
        return `Analyse des journaux (${progress.filesDone}/${progress.filesTotal})${fileHint}`;
      }
      return "Analyse des journaux…";
    case "merging":
      return "Fusion des schémas détectés…";
    case "saving":
      return "Enregistrement…";
    case "done":
      return "Finalisation…";
    default:
      return "Synchronisation en cours…";
  }
}

export function formatBlueprintsImportDetail(
  progress: BlueprintsImportProgress | null,
  elapsedMs: number,
): string | null {
  if (!progress) {
    return elapsedMs > 0 ? formatDurationMs(elapsedMs) : null;
  }

  const parts: string[] = [];
  if (progress.percent > 0) {
    parts.push(`${progress.percent} %`);
  }
  if (elapsedMs > 0) {
    parts.push(formatDurationMs(elapsedMs));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function truncateFileName(name: string, max = 28): string {
  if (name.length <= max) {
    return name;
  }
  return `…${name.slice(-(max - 1))}`;
}
