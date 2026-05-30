import { invoke } from "@tauri-apps/api/core";
import type { TauriCommand } from "./commands";

export async function invokeCommand<T>(
  cmd: TauriCommand,
  args?: Record<string, unknown>,
): Promise<T> {
  return invoke<T>(cmd, args);
}
