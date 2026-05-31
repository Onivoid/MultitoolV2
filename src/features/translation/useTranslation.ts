import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GamePaths, TranslationsChoosen } from "@/types/translation";
import { translationService } from "@/features/translation/translation.service";
import {
  DEFAULT_TRANSLATION_LANG,
  extractTranslationLink,
  hydrateGamePaths,
} from "@/features/translation/translation.lib";
import { toFriendlyFsError } from "@/utils/fs-permissions";
import { detectDistribution } from "@/utils/buildInfo";
import { toastError, toastSuccess, toastWarning } from "@/shared/lib/toastHelpers";
import { useTranslationActions } from "@/features/translation/hooks/useTranslationActions";
import { useTranslationData } from "@/features/translation/hooks/useTranslationData";

export function useTranslation() {
  const data = useTranslationData({
    toastOnMissingVersions: true,
    pollVersionStates: true,
  });
  const actions = useTranslationActions(data);
  const {
    paths,
    setPaths,
    versionOrder,
    translationsSelected,
    setTranslationsSelected,
    loading,
    hasVersions,
    saveSelectedTranslations,
  } = data;
  const { loadingButtonId, setLoadingButtonId, handleInstallTranslation, handleUpdateTranslation } =
    actions;

  const { toast } = useToast();
  const distribution = detectDistribution();

  const handleSettingsToggle = useCallback(
    async (version: string, settingsEN: boolean) => {
      if (!translationsSelected) {
        return;
      }

      const settingType = settingsEN ? "settings-en" : "settings-fr";
      setLoadingButtonId(`switch-${version}`);

      try {
        const translationData = await translationService.getBySetting(settingType);
        const link = extractTranslationLink(translationData);

        if (link) {
          const updatedTranslations = {
            ...translationsSelected,
            [version]: {
              ...translationsSelected[version as keyof TranslationsChoosen],
              link,
              settingsEN,
            },
          };
          setTranslationsSelected(updatedTranslations);
          await saveSelectedTranslations(updatedTranslations);

          const versionPath =
            paths?.versions[version as keyof GamePaths["versions"]]?.path;
          if (
            versionPath &&
            paths?.versions[version as keyof GamePaths["versions"]]?.translated
          ) {
            const isUpToDate = await translationService.isUpToDate(
              versionPath,
              link,
              DEFAULT_TRANSLATION_LANG,
            );
            if (paths && versionOrder.length > 0) {
              const updatedPaths = hydrateGamePaths(
                paths,
                {
                  versions: {
                    ...paths.versions,
                    [version]: {
                      ...paths.versions[version as keyof GamePaths["versions"]]!,
                      up_to_date: isUpToDate,
                    },
                  },
                },
                versionOrder,
              );
              setPaths(updatedPaths);
            }
            if (!isUpToDate) {
              toastWarning(
                toast,
                "Mise à jour requise",
                "Appliquez la mise à jour pour utiliser ce pack de paramètres.",
              );
            }
          }
        } else {
          toastError(
            toast,
            "Langue non disponible",
            "Impossible de charger ce pack de paramètres.",
          );
        }
      } catch (error) {
        toastError(toast, "Changement de langue impossible", String(error));
      } finally {
        setLoadingButtonId(null);
      }
    },
    [
      translationsSelected,
      paths,
      saveSelectedTranslations,
      toast,
      versionOrder,
      setPaths,
      setTranslationsSelected,
      setLoadingButtonId,
    ],
  );

  const handleUninstallTranslation = useCallback(
    async (versionPath: string) => {
      try {
        await translationService.uninstall(versionPath);
        toastSuccess(toast, "Traduction retirée");
        if (paths) {
          await data.checkTranslationsState(paths);
        }
      } catch (error) {
        toastError(
          toast,
          "Désinstallation impossible",
          toFriendlyFsError(error, { distribution }),
        );
      }
    },
    [toast, paths, data, distribution],
  );

  return {
    paths,
    versionOrder,
    translationsSelected,
    loadingButtonId,
    setLoadingButtonId,
    hasVersions,
    initialLoadComplete: !loading,
    handleInstallTranslation,
    handleUpdateTranslation,
    handleSettingsToggle,
    handleUninstallTranslation,
  };
}
