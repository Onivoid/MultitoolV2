import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type {
  HangarExecStatusResponse,
  HangarExecTimersResponse,
} from "@/features/hangar-exec/hangarExec.types";

export const hangarExecService = {
  fetchStatus(): Promise<HangarExecStatusResponse> {
    return invokeCommand<HangarExecStatusResponse>(
      TAURI_COMMANDS.hangarExecFetchStatus,
    );
  },

  getTimers(): Promise<HangarExecTimersResponse> {
    return invokeCommand<HangarExecTimersResponse>(TAURI_COMMANDS.hangarExecGetTimers);
  },

  startTimer(terminalId: string): Promise<HangarExecTimersResponse> {
    return invokeCommand<HangarExecTimersResponse>(
      TAURI_COMMANDS.hangarExecStartTimer,
      {
        terminalId,
      },
    );
  },
};
