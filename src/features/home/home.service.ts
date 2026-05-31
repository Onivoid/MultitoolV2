import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export interface TopRouteEntry {
  path: string;
  count: number;
  lastVisit: number;
}

export const homeService = {
  recordPageVisit: (path: string) =>
    invokeCommand<void>(TAURI_COMMANDS.recordPageVisit, { path }),

  getTopRoutes: (limit = 3) =>
    invokeCommand<TopRouteEntry[]>(TAURI_COMMANDS.getTopRoutes, { limit }),
};
