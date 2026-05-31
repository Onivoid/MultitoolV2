import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  GAME_STATS_SCAN_FINISHED_EVENT,
  GAME_STATS_SCAN_PROGRESS_EVENT,
} from "@/features/game-stats/gameStats.progress.lib";
import type {
  GameStatsResponse,
  GameStatsScanProgress,
  GameStatsScanStatus,
  GameStatsSnapshot,
} from "@/features/game-stats/gameStats.types";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export async function subscribeGameStatsScanProgress(
  onProgress: (progress: GameStatsScanProgress) => void,
): Promise<UnlistenFn> {
  return listen<GameStatsScanProgress>(GAME_STATS_SCAN_PROGRESS_EVENT, (event) => {
    onProgress(event.payload);
  });
}

export async function subscribeGameStatsScanFinished(
  onFinished: (snapshot: GameStatsSnapshot) => void,
): Promise<UnlistenFn> {
  return listen<GameStatsSnapshot>(GAME_STATS_SCAN_FINISHED_EVENT, (event) => {
    onFinished(event.payload);
  });
}

export const gameStatsService = {
  getCached: () =>
    invokeCommand<GameStatsSnapshot | null>(TAURI_COMMANDS.getCachedGameStats),

  checkScanStatus: () =>
    invokeCommand<GameStatsScanStatus>(TAURI_COMMANDS.getGameStatsScanStatus),

  getStats: () => invokeCommand<GameStatsResponse>(TAURI_COMMANDS.getGameStats),

  sync: () => invokeCommand<GameStatsSnapshot>(TAURI_COMMANDS.syncGameStats),
};
