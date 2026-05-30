import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type { GamePaths } from "@/types/translation";

export const gamePathService = {
  getVersions: () =>
    invokeCommand<GamePaths>(TAURI_COMMANDS.getStarCitizenVersions),
};
