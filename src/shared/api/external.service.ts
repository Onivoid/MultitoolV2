import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export const externalService = {
  openUrl: (url: string) => invokeCommand<void>(TAURI_COMMANDS.openExternal, { url }),
};
