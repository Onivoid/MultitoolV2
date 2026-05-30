import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export interface BackgroundServiceConfig {
  enabled: boolean;
  check_interval_minutes: number;
  language: string;
}

export interface GamelogWatcherConfig {
  autoStart: boolean;
  enabled: boolean;
}

export const settingsService = {
  loadBackgroundConfig: () =>
    invokeCommand<BackgroundServiceConfig>(
      TAURI_COMMANDS.loadBackgroundServiceConfig,
    ),

  saveBackgroundConfig: (config: BackgroundServiceConfig) =>
    invokeCommand<void>(TAURI_COMMANDS.saveBackgroundServiceConfig, { config }),

  setBackgroundConfig: (config: BackgroundServiceConfig) =>
    invokeCommand<void>(TAURI_COMMANDS.setBackgroundServiceConfig, { config }),

  startBackgroundService: () =>
    invokeCommand<void>(TAURI_COMMANDS.startBackgroundService),

  stopBackgroundService: () =>
    invokeCommand<void>(TAURI_COMMANDS.stopBackgroundService),

  loadGamelogConfig: () =>
    invokeCommand<GamelogWatcherConfig>(TAURI_COMMANDS.loadGamelogWatcherConfig),

  saveGamelogConfig: (config: GamelogWatcherConfig) =>
    invokeCommand<void>(TAURI_COMMANDS.saveGamelogWatcherConfig, { config }),

  isAutoStartupEnabled: () =>
    invokeCommand<boolean>(TAURI_COMMANDS.isAutoStartupEnabled),

  enableAutoStartup: () => invokeCommand<void>(TAURI_COMMANDS.enableAutoStartup),

  disableAutoStartup: () => invokeCommand<void>(TAURI_COMMANDS.disableAutoStartup),
};
