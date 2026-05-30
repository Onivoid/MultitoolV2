import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GamePaths, TranslationsChoosen } from "@/types/translation";
import { isGamePaths } from "@/types/translation";
import { translationService } from "@/features/translation/translation.service";
import {
  buildDefaultTranslationsState,
  createTranslationTimestamp,
  DEFAULT_TRANSLATION_LANG,
  establishVersionOrder,
  extractTranslationLink,
  hydrateGamePaths,
  resolveTranslationVersionStates,
} from "@/features/translation/translation.lib";
import { gamePathService } from "@/features/game-path/gamePath.service";
import {
  toFriendlyFsError,
} from "@/utils/fs-permissions";
import { detectDistribution } from "@/utils/buildInfo";
import logger from "@/utils/logger";
import {
  toastError,
  toastSuccess,
  toastWarning,
} from "@/shared/lib/toastHelpers";

export function useTranslation() {
  const [paths, setPaths] = useState<GamePaths | null>();
  const [versionOrder, setVersionOrder] = useState<string[]>([]);
  const [translationsSelected, setTranslationsSelected] =
    useState<TranslationsChoosen | null>(null);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { toast } = useToast();
  const distribution = detectDistribution();

  useEffect(() => {
    const fetchData = async () => {
      if (dataFetched) return;
      try {
        const versions = await gamePathService.getVersions();
        await translationService.getTranslations();
        const savedPrefs = await translationService.loadSelected();

        if (!isGamePaths(versions)) {
          return true;
        }

        logger.log("Versions du jeu reçues:", versions);

        const order = establishVersionOrder(Object.keys(versions.versions));

        const selected: TranslationsChoosen =
          savedPrefs && typeof savedPrefs === "object"
            ? savedPrefs
            : buildDefaultTranslationsState(versions);

        const resolvedPaths = await resolveTranslationVersionStates(
          versions,
          selected,
          order,
        );

        setVersionOrder(order);
        setPaths(resolvedPaths);
        setTranslationsSelected(selected);
        return true;
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setTranslationsSelected(buildDefaultTranslationsState(paths ?? null));
        return false;
      }
    };

    if (!dataFetched) {
      setDataFetched(true);
      fetchData()
        .then((ok) => {
          if (!ok) {
            toastError(
              toast,
              "Chargement impossible",
              "Les versions Star Citizen n'ont pas pu être détectées.",
            );
          }
        })
        .finally(() => setInitialLoadComplete(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSelectedTranslations = useCallback(
    async (newTranslationsSelected: TranslationsChoosen) => {
      await translationService.saveSelected(newTranslationsSelected);
    },
    [],
  );

  const checkTranslationsState = useCallback(
    async (gamePaths: GamePaths) => {
      if (!translationsSelected || versionOrder.length === 0) return;

      const resolvedPaths = await resolveTranslationVersionStates(
        gamePaths,
        translationsSelected,
        versionOrder,
      );

      setPaths((current) => {
        if (!current) return resolvedPaths;
        return hydrateGamePaths(current, resolvedPaths, versionOrder);
      });
      setLoadingButtonId(null);
    },
    [translationsSelected, versionOrder],
  );

  const handleInstallTranslation = useCallback(
    async (versionPath: string, version: string) => {
      if (!translationsSelected) return;

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
        await translationService.initFiles(
          versionPath,
          link,
          DEFAULT_TRANSLATION_LANG,
        );
        toastSuccess(toast, `Traduction installée · ${version}`);
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
          if (paths) await checkTranslationsState(paths);
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
      try {
        await translationService.update(
          versionPath,
          translationLink,
          DEFAULT_TRANSLATION_LANG,
        );
        if (translationsSelected) {
          const current =
            translationsSelected[buttonId as keyof TranslationsChoosen];
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
        if (paths) await checkTranslationsState(paths);
      } catch (error) {
        toastError(
          toast,
          "Mise à jour impossible",
          toFriendlyFsError(error, { distribution }),
        );
      } finally {
        setLoadingButtonId(null);
      }
    },
    [
      toast,
      paths,
      checkTranslationsState,
      distribution,
      translationsSelected,
      saveSelectedTranslations,
    ],
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
        toastError(
          toast,
          "Changement de langue impossible",
          String(error),
        );
      } finally {
        setLoadingButtonId(null);
      }
    },
    [translationsSelected, paths, saveSelectedTranslations, toast, versionOrder],
  );

  const handleUninstallTranslation = useCallback(
    async (versionPath: string) => {
      try {
        await translationService.uninstall(versionPath);
        toastSuccess(toast, "Traduction retirée");
        if (paths) await checkTranslationsState(paths);
      } catch (error) {
        toastError(
          toast,
          "Désinstallation impossible",
          toFriendlyFsError(error, { distribution }),
        );
      }
    },
    [toast, paths, checkTranslationsState, distribution],
  );

  useEffect(() => {
    if (!initialLoadComplete || !paths) return;

    const interval = setInterval(() => {
      checkTranslationsState(paths);
    }, 60000);

    return () => clearInterval(interval);
  }, [initialLoadComplete, paths, checkTranslationsState]);

  const hasVersions = paths && Object.entries(paths.versions)[0];

  return {
    paths,
    versionOrder,
    translationsSelected,
    loadingButtonId,
    setLoadingButtonId,
    hasVersions,
    initialLoadComplete,
    handleInstallTranslation,
    handleUpdateTranslation,
    handleSettingsToggle,
    handleUninstallTranslation,
  };
}
