import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export interface ThemeSelected {
  primary_color: string;
}

export const themeService = {
  save: (data: ThemeSelected) =>
    invokeCommand<void>(TAURI_COMMANDS.saveThemeSelected, { data }),

  load: () => invokeCommand<ThemeSelected>(TAURI_COMMANDS.loadThemeSelected),
};
