import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GamePaths, TranslationsChoosen } from "@/types/translation";
import { isGamePaths } from "@/types/translation";
import { translationService } from "@/features/translation/translation.service";
import {
  buildDefaultTranslationsState,
  canonicalizeTranslationsSelected,
  establishVersionOrder,
  hydrateGamePaths,
  resolveTranslationVersionStates,
} from "@/features/translation/translation.lib";
import { gamePathService } from "@/features/game-path/gamePath.service";
import logger from "@/utils/logger";
import { toastError } from "@/shared/lib/toastHelpers";

export interface UseTranslationDataOptions {
  /** Affiche un toast si aucune version SC n'est détectée (page traduction). */
  toastOnMissingVersions?: boolean;
  /** Rafraîchit l'état traduit / à jour toutes les 60 s (page traduction). */
  pollVersionStates?: boolean;
}

export function useTranslationData(options: UseTranslationDataOptions = {}) {
  const { toastOnMissingVersions = false, pollVersionStates = false } = options;
  const [paths, setPaths] = useState<GamePaths | null>(null);
  const [versionOrder, setVersionOrder] = useState<string[]>([]);
  const [translationsSelected, setTranslationsSelected] =
    useState<TranslationsChoosen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const versions = await gamePathService.getVersions();
      await translationService.getTranslations();
      const savedPrefs = await translationService.loadSelected();

      if (!isGamePaths(versions)) {
        setPaths(null);
        setVersionOrder([]);
        setTranslationsSelected(buildDefaultTranslationsState(null));
        if (toastOnMissingVersions) {
          toastError(
            toast,
            "Chargement impossible",
            "Les versions Star Citizen n'ont pas pu être détectées.",
          );
        }
        return;
      }

      logger.log("Versions du jeu reçues:", versions);

      const order = establishVersionOrder(Object.keys(versions.versions));
      const selected: TranslationsChoosen =
        savedPrefs && typeof savedPrefs === "object"
          ? canonicalizeTranslationsSelected(savedPrefs)
          : buildDefaultTranslationsState(versions);

      const resolvedPaths = await resolveTranslationVersionStates(
        versions,
        selected,
        order,
      );

      setVersionOrder(order);
      setPaths(resolvedPaths);
      setTranslationsSelected(selected);
    } catch (e) {
      console.error("Erreur lors du chargement des traductions:", e);
      setError(e instanceof Error ? e.message : String(e));
      setTranslationsSelected(buildDefaultTranslationsState(null));
    } finally {
      setLoading(false);
    }
  }, [toast, toastOnMissingVersions]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const checkTranslationsState = useCallback(
    async (gamePaths: GamePaths) => {
      if (!translationsSelected || versionOrder.length === 0) {
        return;
      }

      const resolvedPaths = await resolveTranslationVersionStates(
        gamePaths,
        translationsSelected,
        versionOrder,
      );

      setPaths((current) => {
        if (!current) {
          return resolvedPaths;
        }
        return hydrateGamePaths(current, resolvedPaths, versionOrder);
      });
    },
    [translationsSelected, versionOrder],
  );

  useEffect(() => {
    if (!pollVersionStates || loading || !paths) {
      return;
    }

    const interval = setInterval(() => {
      void checkTranslationsState(paths);
    }, 60_000);

    return () => clearInterval(interval);
  }, [pollVersionStates, loading, paths, checkTranslationsState]);

  const saveSelectedTranslations = useCallback(
    async (newTranslationsSelected: TranslationsChoosen) => {
      await translationService.saveSelected(newTranslationsSelected);
    },
    [],
  );

  const hasVersions = Boolean(paths && Object.keys(paths.versions).length > 0);

  return {
    paths,
    setPaths,
    versionOrder,
    translationsSelected,
    setTranslationsSelected,
    loading,
    error,
    hasVersions,
    refresh,
    checkTranslationsState,
    saveSelectedTranslations,
  };
}
