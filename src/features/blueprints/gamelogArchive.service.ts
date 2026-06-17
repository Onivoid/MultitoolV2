import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export interface GamelogArchiveStatus {
  totalArchivedFiles: number;
  totalBytesArchived: number;
  verifiedCount: number;
  pendingCount: number;
  deletedFromGameCount: number;
  channels: string[];
  archiveDirectory: string;
}

export interface GamelogArchiveSyncResult {
  archived: number;
  deletedFromGame: number;
  pendingVerification: number;
  skippedAlreadyArchived: number;
  bytesFreed: number;
  channelsScanned: string[];
}

export const gamelogArchiveService = {
  getStatus: () =>
    invokeCommand<GamelogArchiveStatus>(TAURI_COMMANDS.getGamelogArchiveStatus),

  sync: () =>
    invokeCommand<GamelogArchiveSyncResult>(TAURI_COMMANDS.syncGamelogArchive),
};

export function formatArchiveBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} Go`;
  }
  if (bytes >= 1_048_576) {
    return `${Math.round(bytes / 1_048_576)} Mo`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }
  return `${bytes} o`;
}
