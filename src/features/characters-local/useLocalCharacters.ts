import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStarCitizenVersions } from "@/shared/hooks/useStarCitizenVersions";
import { charactersService } from "@/features/characters-local/characters.service";
import {
  mergeCharacterScanResult,
  type CharacterRow,
} from "@/features/characters-local/characters.lib";
import { toastError } from "@/shared/lib/toastHelpers";

import { establishVersionOrder } from "@/features/translation/translation.lib";

export function useLocalCharacters() {
  const { paths: gamePaths, isLoading: pathsLoading } = useStarCitizenVersions();
  const [localCharacters, setLocalCharacters] = useState<CharacterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [versionOrder, setVersionOrder] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!gamePaths) return;
    setVersionOrder(establishVersionOrder(Object.keys(gamePaths.versions)));
  }, [gamePaths]);

  const scanLocalCharacters = useCallback(
    async (gamePath: string) => {
      try {
        const result = await charactersService.getInformations(gamePath);
        setLocalCharacters((prev) =>
          mergeCharacterScanResult(prev, result, gamePaths),
        );
      } catch {
        toastError(
          toast,
          "Erreur",
          "Impossible de récupérer les informations des personnages",
        );
      }
    },
    [toast, gamePaths],
  );

  const refreshLocalCharacters = useCallback(async () => {
    if (!gamePaths) return;
    setIsLoading(true);
    setLocalCharacters([]);
    const entries = Object.entries(gamePaths.versions)
      .filter(([, version]) => version?.path)
      .map(([, version]) => version!.path);
    await Promise.all(entries.map((path) => scanLocalCharacters(path)));
    setIsLoading(false);
  }, [gamePaths, scanLocalCharacters]);

  useEffect(() => {
    if (!gamePaths) return;

    const scanAllPaths = async () => {
      setIsLoading(true);
      const entries = Object.entries(gamePaths.versions)
        .filter(([, version]) => version?.path)
        .map(([, version]) => version!.path);

      for (const path of entries) {
        await scanLocalCharacters(path);
      }
      setIsLoading(false);
    };

    scanAllPaths();
  }, [gamePaths, scanLocalCharacters, toast]);

  return {
    gamePaths,
    pathsLoading,
    localCharacters,
    isLoading,
    versionOrder,
    refreshLocalCharacters,
  };
}
