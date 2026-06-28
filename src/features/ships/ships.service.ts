import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import {
  normalizeVehicleDetail,
  normalizeVehicleSummary,
} from "@/features/ships/ships.lib";
import type { VehicleDetail, VehicleSummary } from "@/features/ships/ships.types";

export const shipsService = {
  async list(): Promise<VehicleSummary[]> {
    const list = await invokeCommand<Record<string, unknown>[]>(
      TAURI_COMMANDS.vehiclesCatalogList,
    );
    return (list ?? []).map((item) => normalizeVehicleSummary(item));
  },

  async detail(uuid: string): Promise<VehicleDetail> {
    const raw = await invokeCommand<Record<string, unknown>>(
      TAURI_COMMANDS.vehicleDetail,
      { uuid },
    );
    return normalizeVehicleDetail(raw);
  },
};
