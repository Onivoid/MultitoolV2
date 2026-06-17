import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { normalizePaintSummary } from "@/features/paints/paints.lib";
import type { PaintSummary } from "@/features/paints/paints.types";

export const paintsService = {
  async list(): Promise<PaintSummary[]> {
    const list = await invokeCommand<Record<string, unknown>[]>(
      TAURI_COMMANDS.paintsCatalogList,
    );
    return (list ?? []).map((item) => normalizePaintSummary(item));
  },
};
