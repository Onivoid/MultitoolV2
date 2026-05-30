import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GamePaths, TranslationsChoosen } from "@/types/translation";
import { isGamePaths } from "@/types/translation";
import { translationService } from "@/features/translation/translation.service";
import {
  buildDefaultTranslationsState,
  DEFAULT_TRANSLATION_LANG,
  extractTranslationLink,
} from "@/features/translation/translation.lib";
import { gamePathService } from "@/features/game-path/gamePath.service";
import {
  getProtectedPathWarning,
  isProtectedPath,
  toFriendlyFsError,
} from "@/utils/fs-permissions";
import { detectDistribution } from "@/utils/buildInfo";
import logger from "@/utils/logger";
import {
  toastLegacyError,
  toastLegacySuccess,
  toastError,
  toastSuccess,
} from "@/shared/lib/toastHelpers";

export function useTranslation() {
  const [paths, setPaths] = useState<GamePaths | null>();
  const [earlyChecked, setEarlyChecked] = useState(false);
  const [translationsSelected, setTranslationsSelected] =
    useState<TranslationsChoosen | null>(null);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const { toast } = useToast();
  const distribution = detectDistribution();

  useEffect(() => {
    const fetchData = async () => {
      if (dataFetched) return;
      try {
        const versions = await gamePathService.getVersions();
        if (isGamePaths(versions)) {
          logger.log("Versions du jeu reçues:", versions);
          setPaths(versions);
        }

        await translationService.getTranslations();
        const savedPrefs = await translationService.loadSelected();
        if (savedPrefs && typeof savedPrefs === "object") {
          setTranslationsSelected(savedPrefs);
        } else if (isGamePaths(versions)) {
          setTranslationsSelected(buildDefaultTranslationsState(versions));
        }
        return true;
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setTranslationsSelected(buildDefaultTranslationsState(paths ?? null));
        return false;
      }
    };

    if (!dataFetched) {
      setDataFetched(true);
      fetchData().then((ok) => {
        if (ok) {
          toastLegacySuccess(
            toast,
            "Données chargées",
            "Les données de traduction ont été chargées avec succès.",
          );
        } else {
          toastLegacyError(
            toast,
            "Erreur lors du chargement des données",
            "Une erreur est survenue lors du chargement des données.",
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSelectedTranslations = useCallback(
    async (newTranslationsSelected: TranslationsChoosen) => {
      try {
        await translationService.saveSelected(newTranslationsSelected);
        toastLegacySuccess(
          toast,
          "Préférences de traduction sauvegardées",
          "Les préférences de traduction ont été sauvegardées avec succès.",
        );
      } catch (error) {
        toastLegacyError(
          toast,
          "Erreur lors de la sauvegarde des données",
          `Une erreur est survenue lors de la sauvegarde des données : ${error}`,
        );
      }
    },
    [toast],
  );

  const checkTranslationsState = useCallback(
    async (gamePaths: GamePaths) => {
      if (!translationsSelected) return;

      const updatedPaths = { ...gamePaths };
      await Promise.all(
        Object.entries(gamePaths.versions).map(async ([key, value]) => {
          const versionSettings =
            translationsSelected[key as keyof TranslationsChoosen];

          const translated = await translationService.isGameTranslated(
            value.path,
            DEFAULT_TRANSLATION_LANG,
          );

          const upToDate =
            versionSettings && versionSettings.link
              ? await translationService.isUpToDate(
                  value.path,
                  versionSettings.link,
                  DEFAULT_TRANSLATION_LANG,
                )
              : value.up_to_date;

          updatedPaths.versions[key as keyof GamePaths["versions"]] = {
            path: value.path,
            translated,
            up_to_date: upToDate,
          };
        }),
      );

      setPaths(updatedPaths);
      setLoadingButtonId(null);
    },
    [translationsSelected],
  );

  const handleInstallTranslation = useCallback(
    async (versionPath: string, version: string) => {
      if (!translationsSelected) return;

      setLoadingButtonId(`install-${version}`);
      if (isProtectedPath(versionPath)) {
        toast({
          title: "Chemin protégé",
          description: getProtectedPathWarning(distribution),
          variant: "warning",
          duration: 5000,
        });
      }

      const versionSettings =
        translationsSelected[version as keyof TranslationsChoosen];

      const installWithLink = async (link: string) => {
        const updatedTranslations = {
          ...translationsSelected,
          [version]: { link, settingsEN: false },
        };
        setTranslationsSelected(updatedTranslations);
        await saveSelectedTranslations(updatedTranslations);
        await translationService.initFiles(
          versionPath,
          link,
          DEFAULT_TRANSLATION_LANG,
        );
        toastSuccess(toast, "Traduction installée", "La traduction a été installée avec succès.");
        if (paths) await checkTranslationsState(paths);
      };

      if (!versionSettings?.link) {
        try {
          const translationData =
            await translationService.getBySetting("settings-fr");
          const link = extractTranslationLink(translationData);
          if (link) {
            await installWithLink(link);
          } else {
            toastLegacyError(
              toast,
              "Erreur d'installation",
              "Impossible de récupérer le lien de traduction.",
            );
            setLoadingButtonId(null);
          }
        } catch (error) {
          toastError(
            toast,
            "Erreur d'installation",
            `Erreur: ${toFriendlyFsError(error, { distribution })}`,
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
          toastSuccess(toast, "Traduction installée", "La traduction a été installée avec succès.");
          if (paths) await checkTranslationsState(paths);
        } catch (error) {
          toastError(
            toast,
            "Erreur d'installation",
            `Erreur: ${toFriendlyFsError(error, { distribution })}`,
          );
          setLoadingButtonId(null);
        }
      }
    },
    [
      translationsSelected,
      paths,
      toast,
      distribution,
      saveSelectedTranslations,
      checkTranslationsState,
    ],
  );

  const handleUpdateTranslation = useCallback(
    async (versionPath: string, translationLink: string, buttonId: string) => {
      setLoadingButtonId(`update-${buttonId}`);
      if (isProtectedPath(versionPath)) {
        toast({
          title: "Chemin protégé",
          description: getProtectedPathWarning(distribution),
          variant: "warning",
          duration: 5000,
        });
      }
      try {
        await translationService.update(
          versionPath,
          translationLink,
          DEFAULT_TRANSLATION_LANG,
        );
        toastSuccess(
          toast,
          "Traduction mise à jour",
          "La traduction a été mise à jour avec succès.",
        );
        if (paths) await checkTranslationsState(paths);
      } catch (error) {
        toastError(
          toast,
          "Erreur de mise à jour",
          `Erreur: ${toFriendlyFsError(error, { distribution })}`,
        );
      } finally {
        setLoadingButtonId(null);
      }
    },
    [toast, paths, checkTranslationsState, distribution],
  );

  const handleSettingsToggle = useCallback(
    async (version: string, settingsEN: boolean) => {
      if (!translationsSelected) return;

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
            if (paths) {
              const updatedPaths = { ...paths };
              const current =
                updatedPaths.versions[version as keyof GamePaths["versions"]];
              if (current) {
                updatedPaths.versions[version as keyof GamePaths["versions"]] = {
                  ...current,
                  up_to_date: isUpToDate,
                };
                setPaths(updatedPaths);
              }
            }
            if (!isUpToDate) {
              toastLegacyError(
                toast,
                "Traduction obsolète",
                "La traduction doit être mise à jour pour correspondre à cette configuration.",
              );
            } else {
              toastLegacySuccess(
                toast,
                "Paramètres modifiés",
                "Vous pouvez mettre à jour la traduction pour appliquer les nouveaux paramètres.",
              );
            }
          }
        } else {
          toastLegacyError(
            toast,
            "Erreur de configuration",
            "Impossible de récupérer les informations de traduction.",
          );
        }
      } catch (error) {
        toastLegacyError(
          toast,
          "Erreur de configuration",
          `Une erreur est survenue: ${error}`,
        );
      } finally {
        setLoadingButtonId(null);
      }
    },
    [translationsSelected, paths, saveSelectedTranslations, toast],
  );

  const handleUninstallTranslation = useCallback(
    async (versionPath: string) => {
      try {
        await translationService.uninstall(versionPath);
        toastSuccess(
          toast,
          "Traduction désinstallée",
          "La traduction a été désinstallée avec succès.",
        );
        if (paths) await checkTranslationsState(paths);
      } catch (error) {
        toastLegacyError(
          toast,
          "Erreur de désinstallation",
          `Erreur: ${toFriendlyFsError(error, { distribution })}`,
        );
      }
    },
    [toast, paths, checkTranslationsState, distribution],
  );

  useEffect(() => {
    const checkState = async () => {
      if (!paths) return;
      await checkTranslationsState(paths);
      setEarlyChecked(true);
    };
    if (!earlyChecked) checkState();

    const interval = setInterval(() => {
      if (paths) checkTranslationsState(paths);
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths]);

  useEffect(() => {
    if (translationsSelected && paths) {
      checkTranslationsState(paths);
    }
  }, [translationsSelected, paths, checkTranslationsState]);

  const hasVersions = paths && Object.entries(paths.versions)[0];

  return {
    paths,
    translationsSelected,
    loadingButtonId,
    setLoadingButtonId,
    hasVersions,
    handleInstallTranslation,
    handleUpdateTranslation,
    handleSettingsToggle,
    handleUninstallTranslation,
  };
}
