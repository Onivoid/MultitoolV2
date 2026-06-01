import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export interface BackupTargetStatus {
  key: string;
  label: string;
  exists: boolean;
  fileCount: number;
  totalBytes: number;
}

export interface BackupExportResult {
  filesPacked: number;
  bytesPacked: number;
  skipped: string[];
}

export const gameConfigBackupService = {
  listTargets: (installPath: string) =>
    invokeCommand<BackupTargetStatus[]>(
      TAURI_COMMANDS.listGameConfigBackupTargets,
      { installPath },
    ),

  exportZip: (installPath: string, destZipPath: string) =>
    invokeCommand<BackupExportResult>(TAURI_COMMANDS.exportGameConfigBackup, {
      installPath,
      destZipPath,
    }),
};
