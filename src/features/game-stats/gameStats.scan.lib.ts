import type { GameStatsScanStatus } from "@/features/game-stats/gameStats.types";
import type { GameStatsLoadStatus } from "@/features/game-stats/gameStats.types";

const SCAN_IN_PROGRESS_CODE = "GAME_STATS_SCAN_IN_PROGRESS";

export function parseScanInProgressError(
  error: unknown,
): GameStatsScanStatus | null {
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw) as {
      code?: string;
      status?: GameStatsScanStatus;
    };
    if (parsed.code === SCAN_IN_PROGRESS_CODE && parsed.status) {
      return parsed.status;
    }
  } catch {
    // pas une erreur structurée
  }
  return null;
}

export function loadStatusFromScan(
  scan: GameStatsScanStatus,
  hasSnapshot: boolean,
): GameStatsLoadStatus {
  if (scan.kind === "sync") {
    return "syncing";
  }
  return hasSnapshot ? "updating" : "loading";
}

export function applyScanStatus(
  scan: GameStatsScanStatus,
  hasSnapshot: boolean,
): Pick<GameStatsScanStatus, "progress"> & {
  status: GameStatsLoadStatus;
  operationStartedAt: number | null;
} {
  return {
    status: loadStatusFromScan(scan, hasSnapshot),
    progress: scan.progress,
    operationStartedAt: scan.startedAtMs ?? Date.now(),
  };
}
