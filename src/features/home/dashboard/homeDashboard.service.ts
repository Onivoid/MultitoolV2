import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type { HomeDashboardLayout } from "@/features/home/dashboard/homeDashboard.types";
import {
  defaultDashboardLayout,
  normalizeLayout,
} from "@/features/home/dashboard/homeDashboard.lib";

export const homeDashboardService = {
  load: async (): Promise<HomeDashboardLayout> => {
    const layout = await invokeCommand<HomeDashboardLayout>(
      TAURI_COMMANDS.getHomeDashboard,
    );
    if (!layout.widgets?.length) {
      return normalizeLayout(defaultDashboardLayout());
    }
    return normalizeLayout(layout);
  },

  save: async (layout: HomeDashboardLayout): Promise<void> => {
    await invokeCommand(TAURI_COMMANDS.saveHomeDashboard, {
      layout: normalizeLayout(layout),
    });
  },
};
