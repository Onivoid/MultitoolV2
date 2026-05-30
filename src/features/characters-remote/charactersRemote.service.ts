import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type { RemoteCharactersPresetsList } from "@/types/charactersList";

export type CharacterOrderType = "latest" | "download";

export const charactersRemoteService = {
  getCharacters: (params: {
    page: number;
    orderType: CharacterOrderType;
    search?: string;
  }) =>
    invokeCommand<RemoteCharactersPresetsList & { tauriDebug?: unknown }>(
      TAURI_COMMANDS.getCharacters,
      {
        page: params.page,
        orderType: params.orderType,
        search: params.search,
      },
    ),

  download: (dnaUrl: string, title: string) =>
    invokeCommand<string>(TAURI_COMMANDS.downloadCharacter, {
      dnaUrl,
      title,
    }),
};
