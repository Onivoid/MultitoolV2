import { useCallback, useEffect, useState } from "react";
import { gamePathService } from "@/features/game-path/gamePath.service";
import { GamePaths, isGamePaths } from "@/types/translation";
import logger from "@/utils/logger";

export function useStarCitizenVersions() {
  const [paths, setPaths] = useState<GamePaths | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const versions = await gamePathService.getVersions();
      if (isGamePaths(versions)) {
        logger.log("Versions du jeu reçues:", versions);
        setPaths(versions);
      } else {
        setPaths(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("Erreur lors de la récupération des versions:", e);
      setError(msg);
      setPaths(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { paths, isLoading, error, refresh, setPaths };
}
