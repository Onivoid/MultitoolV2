import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { parseJsonResponse } from "@/shared/lib/tauriResult";

export interface CacheFolder {
  name: string;
  path: string;
  size: string;
}

export interface CacheInfos {
  folders: CacheFolder[];
}

export const cacheService = {
  getInformations: async (): Promise<CacheInfos> => {
    const raw = await invokeCommand<string>(TAURI_COMMANDS.getCacheInformations);
    return parseJsonResponse<CacheInfos>(raw);
  },

  deleteFolder: (path: string) =>
    invokeCommand<string>(TAURI_COMMANDS.deleteFolder, { path }),

  openFolder: () => invokeCommand<string>(TAURI_COMMANDS.openCacheFolder),

  clearAll: () => invokeCommand<string>(TAURI_COMMANDS.clearCache),
};
