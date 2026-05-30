import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { parseJsonResponse } from "@/shared/lib/tauriResult";

export interface CacheFolder {
  name: string;
  path: string;
  /** Poids formaté renvoyé par Tauri (`weight` dans le JSON Rust). */
  weight: string;
}

interface CacheFolderRaw {
  name: string;
  path: string;
  weight?: string;
  size?: string;
}

export interface CacheInfos {
  folders: CacheFolder[];
}

function normalizeCacheFolder(folder: CacheFolderRaw): CacheFolder {
  return {
    name: folder.name,
    path: folder.path,
    weight: folder.weight ?? folder.size ?? "—",
  };
}

export const cacheService = {
  getInformations: async (): Promise<CacheInfos> => {
    const raw = await invokeCommand<string>(TAURI_COMMANDS.getCacheInformations);
    const parsed = parseJsonResponse<{ folders: CacheFolderRaw[] }>(raw);
    return {
      folders: parsed.folders.map(normalizeCacheFolder),
    };
  },

  deleteFolder: (path: string) =>
    invokeCommand<string>(TAURI_COMMANDS.deleteFolder, { path }),

  openFolder: () => invokeCommand<string>(TAURI_COMMANDS.openCacheFolder),

  clearAll: () => invokeCommand<string>(TAURI_COMMANDS.clearCache),
};
