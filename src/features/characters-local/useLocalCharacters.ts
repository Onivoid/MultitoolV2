import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStarCitizenVersions } from "@/shared/hooks/useStarCitizenVersions";
import { charactersService } from "@/features/characters-local/characters.service";
import {
  mergeCharacterScanResult,
  type CharacterRow,
} from "@/features/characters-local/characters.lib";
import { isProtectedPath } from "@/utils/fs-permissions";
import { toastError } from "@/shared/lib/toastHelpers";

export function useLocalCharacters() {
  const { paths: gamePaths, isLoading: pathsLoading } = useStarCitizenVersions();
  const [localCharacters, setLocalCharacters] = useState<CharacterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        if (isProtectedPath(path)) {
          toast({
            title: "Chemin protégé",
            description:
              "Le jeu est dans Program Files. En cas d'erreur, relancez en administrateur ou installez-le ailleurs.",
            variant: "warning",
            duration: 4000,
          });
        }
        await scanLocalCharacters(path);
      }
      setIsLoading(false);
    };

    scanAllPaths();
  }, [gamePaths, scanLocalCharacters, toast]);

  const availableVersions = useMemo(() => {
    const versions = localCharacters.flatMap((char) =>
      char.versions.map((v) => v.version),
    );
    return Array.from(new Set(versions)).sort();
  }, [localCharacters]);

  return {
    gamePaths,
    pathsLoading,
    localCharacters,
    isLoading,
    availableVersions,
    refreshLocalCharacters,
  };
}
