import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type { Commit } from "@/types/commit";

export const patchnotesService = {
  getLatestCommits: async (owner: string, repo: string): Promise<Commit[]> => {
    const response = await invokeCommand<Commit[]>(TAURI_COMMANDS.getLatestCommits, {
      owner,
      repo,
    });
    return response ?? [];
  },
};
