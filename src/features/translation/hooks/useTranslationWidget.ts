import { useTranslationActions } from "@/features/translation/hooks/useTranslationActions";
import { useTranslationData } from "@/features/translation/hooks/useTranslationData";

export function useTranslationWidget() {
  const data = useTranslationData();
  const actions = useTranslationActions(data);

  return {
    paths: data.paths,
    versionOrder: data.versionOrder,
    translationsSelected: data.translationsSelected,
    loading: data.loading,
    error: data.error,
    hasVersions: data.hasVersions,
    loadingButtonId: actions.loadingButtonId,
    handleInstallTranslation: actions.handleInstallTranslation,
    handleUpdateTranslation: actions.handleUpdateTranslation,
  };
}
