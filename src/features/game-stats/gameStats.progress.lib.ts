import type {
  GameStatsLoadStatus,
  GameStatsScanProgress,
} from "@/features/game-stats/gameStats.types";

export const GAME_STATS_SCAN_PROGRESS_EVENT = "game-stats-scan-progress";
export const GAME_STATS_SCAN_FINISHED_EVENT = "game-stats-scan-finished";

/** Affiche une durée courte en français (ex. « 1 min 23 s »). */
export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours} h ${remMinutes} min` : `${hours} h`;
}

export function getProgressStepLabel(
  status: GameStatsLoadStatus,
  progress: GameStatsScanProgress | null,
): string {
  if (!progress) {
    switch (status) {
      case "loading":
        return "Préparation du chargement…";
      case "updating":
        return "Préparation de la mise à jour…";
      case "syncing":
        return "Préparation de la synchronisation…";
      default:
        return "";
    }
  }

  switch (progress.phase) {
    case "discovering_logs":
      return status === "syncing"
        ? "Recherche des journaux Star Citizen…"
        : "Localisation des fichiers logs…";
    case "scanning_logs":
      if (progress.filesTotal > 0) {
        const fileHint = progress.currentFile
          ? ` · ${truncateFileName(progress.currentFile)}`
          : "";
        return `Analyse des journaux (${progress.filesDone}/${progress.filesTotal})${fileHint}`;
      }
      return "Analyse des journaux de jeu…";
    case "building_snapshot":
      return "Calcul des statistiques…";
    case "saving_cache":
      return "Enregistrement des résultats…";
    case "done":
      return "Finalisation…";
    default:
      return "Traitement en cours…";
  }
}

export function formatProgressDetail(
  progress: GameStatsScanProgress | null,
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
