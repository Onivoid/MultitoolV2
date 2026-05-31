export type TranslationWidgetAction = "install" | "update" | null;

export interface TranslationVersionState {
  translated: boolean;
  up_to_date: boolean;
}

/** Action principale affichée sur une ligne du widget accueil. */
export function getWidgetAction(
  version: TranslationVersionState,
): TranslationWidgetAction {
  if (!version.translated) {
    return "install";
  }
  if (!version.up_to_date) {
    return "update";
  }
  return null;
}
