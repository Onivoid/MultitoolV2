import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type { SystemMetricsSnapshot } from "@/features/system-metrics/system-metrics.types";

export const systemMetricsService = {
  getMetrics: () =>
    invokeCommand<SystemMetricsSnapshot>(TAURI_COMMANDS.getSystemMetrics),
};
