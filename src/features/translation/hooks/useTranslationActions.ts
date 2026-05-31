import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { TranslationsChoosen } from "@/types/translation";
import { translationService } from "@/features/translation/translation.service";
import {
  createTranslationTimestamp,
  DEFAULT_TRANSLATION_LANG,
  extractTranslationLink,
} from "@/features/translation/translation.lib";
import { toFriendlyFsError } from "@/utils/fs-permissions";
import { detectDistribution } from "@/utils/buildInfo";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";
import type { useTranslationData } from "@/features/translation/hooks/useTranslationData";

type TranslationData = ReturnType<typeof useTranslationData>;

export function useTranslationActions(data: TranslationData) {
  const {
    paths,
    translationsSelected,
    setTranslationsSelected,
    checkTranslationsState,
    saveSelectedTranslations,
  } = data;

  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);

  const refreshVersionStates = useCallback(async () => {
    if (paths) {
      await checkTranslationsState(paths);
    }
    setLoadingButtonId(null);
  }, [paths, checkTranslationsState]);
  const { toast } = useToast();
  const distribution = detectDistribution();

  const handleInstallTranslation = useCallback(
    async (versionPath: string, version: string) => {
      if (!translationsSelected) {
        return;
      }

      setLoadingButtonId(`install-${version}`);

      const versionSettings =
        translationsSelected[version as keyof TranslationsChoosen];

      const installWithLink = async (link: string) => {
        const updatedTranslations = {
          ...translationsSelected,
          [version]: {
            link,
            settingsEN: false,
            lastUpdatedAt: createTranslationTimestamp(),
          },
        };
        setTranslationsSelected(updatedTranslations);
        await saveSelectedTranslations(updatedTranslations);
        await translationService.initFiles(versionPath, link, DEFAULT_TRANSLATION_LANG);
        toastSuccess(toast, `Traduction installée · ${version}`);
        await refreshVersionStates();
      };

      if (!versionSettings?.link) {
        try {
          const translationData = await translationService.getBySetting("settings-fr");
          const link = extractTranslationLink(translationData);
          if (link) {
            await installWithLink(link);
          } else {
            toastError(
              toast,
              "Installation impossible",
              "Lien de traduction introuvable.",
            );
            setLoadingButtonId(null);
          }
        } catch (error) {
          toastError(
            toast,
            "Installation impossible",
            toFriendlyFsError(error, { distribution }),
          );
          setLoadingButtonId(null);
        }
      } else {
        try {
          await translationService.initFiles(
            versionPath,
            versionSettings.link,
            DEFAULT_TRANSLATION_LANG,
          );
          const updatedTranslations = {
            ...translationsSelected,
            [version]: {
              ...versionSettings,
              lastUpdatedAt: createTranslationTimestamp(),
            },
          };
          setTranslationsSelected(updatedTranslations);
          await saveSelectedTranslations(updatedTranslations);
          toastSuccess(toast, `Traduction installée · ${version}`);
          await refreshVersionStates();
        } catch (error) {
          toastError(
            toast,
            "Installation impossible",
            toFriendlyFsError(error, { distribution }),
          );
          setLoadingButtonId(null);
        }
      }
    },
    [
      translationsSelected,
      toast,
      distribution,
      saveSelectedTranslations,
      refreshVersionStates,
      setTranslationsSelected,
    ],
  );

  const handleUpdateTranslation = useCallback(
    async (versionPath: string, translationLink: string, buttonId: string) => {
      setLoadingButtonId(`update-${buttonId}`);
      try {
        await translationService.update(
          versionPath,
          translationLink,
          DEFAULT_TRANSLATION_LANG,
        );
        if (translationsSelected) {
          const current = translationsSelected[buttonId as keyof TranslationsChoosen];
          const updatedTranslations = {
            ...translationsSelected,
            [buttonId]: {
              ...current,
              link: translationLink,
              settingsEN: current?.settingsEN ?? false,
              lastUpdatedAt: createTranslationTimestamp(),
            },
          };
          setTranslationsSelected(updatedTranslations);
          await saveSelectedTranslations(updatedTranslations);
        }
        toastSuccess(toast, `Mise à jour terminée · ${buttonId}`);
        await refreshVersionStates();
      } catch (error) {
        toastError(
          toast,
          "Mise à jour impossible",
          toFriendlyFsError(error, { distribution }),
        );
        setLoadingButtonId(null);
      }
    },
    [
      toast,
      refreshVersionStates,
      distribution,
      translationsSelected,
      saveSelectedTranslations,
      setTranslationsSelected,
    ],
  );

  return {
    loadingButtonId,
    setLoadingButtonId,
    handleInstallTranslation,
    handleUpdateTranslation,
  };
}
