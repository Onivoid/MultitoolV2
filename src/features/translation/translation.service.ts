import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import type { TranslationsChoosen } from "@/types/translation";

export const translationService = {
  getTranslations: () => invokeCommand<unknown>(TAURI_COMMANDS.getTranslations),

  loadSelected: () =>
    invokeCommand<TranslationsChoosen>(TAURI_COMMANDS.loadTranslationsSelected),

  saveSelected: (data: TranslationsChoosen) =>
    invokeCommand<void>(TAURI_COMMANDS.saveTranslationsSelected, { data }),

  isGameTranslated: (path: string, lang: string) =>
    invokeCommand<boolean>(TAURI_COMMANDS.isGameTranslated, { path, lang }),

  isUpToDate: (path: string, translationLink: string, lang: string) =>
    invokeCommand<boolean>(TAURI_COMMANDS.isTranslationUpToDate, {
      path,
      translationLink,
      lang,
    }),

  getBySetting: (settingType: string) =>
    invokeCommand<unknown>(TAURI_COMMANDS.getTranslationBySetting, {
      settingType,
    }),

  initFiles: (path: string, translationLink: string, lang: string) =>
    invokeCommand<void>(TAURI_COMMANDS.initTranslationFiles, {
      path,
      translationLink,
      lang,
    }),

  update: (path: string, translationLink: string, lang: string) =>
    invokeCommand<void>(TAURI_COMMANDS.updateTranslation, {
      path,
      translationLink,
      lang,
    }),

  uninstall: (path: string) =>
    invokeCommand<void>(TAURI_COMMANDS.uninstallTranslation, { path }),
};
