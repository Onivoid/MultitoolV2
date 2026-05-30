import type { GamePaths, TranslationsChoosen } from "@/types/translation";

export const DEFAULT_TRANSLATION_LANG = "fr";

export function buildDefaultTranslationsState(
  paths: GamePaths | null,
): TranslationsChoosen {
  if (!paths) return {};
  const defaults: TranslationsChoosen = {};
  Object.keys(paths.versions).forEach((version) => {
    defaults[version] = { link: null, settingsEN: false };
  });
  return defaults;
}

/** Extrait un lien de traduction depuis la réponse Tauri (formats variables). */
export function extractTranslationLink(translationData: unknown): string | null {
  if (typeof translationData === "string") {
    return translationData;
  }
  if (typeof translationData === "object" && translationData !== null) {
    if ("link" in translationData && typeof translationData.link === "string") {
      return translationData.link;
    }
    if (Array.isArray(translationData)) {
      for (const item of translationData) {
        if (typeof item === "object" && item !== null && "link" in item) {
          const link = (item as { link: unknown }).link;
          if (typeof link === "string") return link;
        }
      }
    }
  }
  return null;
}
