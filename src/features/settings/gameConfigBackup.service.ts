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

export interface BackupOptions {
  includeGameLog?: boolean;
  includeLogBackups?: boolean;
}

export const gameConfigBackupService = {
  listTargets: (installPath: string, options: BackupOptions = {}) =>
    invokeCommand<BackupTargetStatus[]>(
      TAURI_COMMANDS.listGameConfigBackupTargets,
      {
        installPath,
        includeGameLog: options.includeGameLog ?? true,
        includeLogBackups: options.includeLogBackups ?? true,
      },
    ),

  exportZip: (
    installPath: string,
    destZipPath: string,
    options: BackupOptions = {},
  ) =>
    invokeCommand<BackupExportResult>(TAURI_COMMANDS.exportGameConfigBackup, {
      installPath,
      destZipPath,
      includeGameLog: options.includeGameLog ?? true,
      includeLogBackups: options.includeLogBackups ?? true,
    }),
};
