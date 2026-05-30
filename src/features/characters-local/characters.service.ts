import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { parseJsonResponse } from "@/shared/lib/tauriResult";
import type { LocalCharactersResult } from "@/types/charactersList";

export const charactersService = {
  getInformations: async (path: string): Promise<LocalCharactersResult> => {
    const raw = await invokeCommand<string>(TAURI_COMMANDS.getCharacterInformations, {
      path,
    });
    return parseJsonResponse<LocalCharactersResult>(raw);
  },

  delete: (path: string) =>
    invokeCommand<string>(TAURI_COMMANDS.deleteCharacter, { path }),

  duplicate: (characterPath: string) =>
    invokeCommand<string>(TAURI_COMMANDS.duplicateCharacter, { characterPath }),

  openFolder: (path: string) =>
    invokeCommand<string>(TAURI_COMMANDS.openCharactersFolder, { path }),
};
