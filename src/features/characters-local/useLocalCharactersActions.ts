import { useToast } from "@/hooks/use-toast";
import { charactersService } from "@/features/characters-local/characters.service";
import { toFriendlyFsError } from "@/utils/fs-permissions";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";

export function useLocalCharactersActions() {
  const { toast } = useToast();

  const deleteCharacter = async (path: string) => {
    try {
      const res = await charactersService.delete(path);
      if (res) {
        toastSuccess(toast, "Personnage supprimé");
        return true;
      }
      throw new Error("Suppression échouée");
    } catch (error) {
      toastError(toast, "Suppression impossible", toFriendlyFsError(error));
      return false;
    }
  };

  const duplicateCharacter = async (path: string, onSuccess?: () => void) => {
    try {
      const res = await charactersService.duplicate(path);
      if (res) {
        toastSuccess(toast, "Preset dupliqué");
        onSuccess?.();
      }
    } catch (error) {
      toastError(toast, "Duplication impossible", toFriendlyFsError(error));
    }
  };

  const openCharactersFolder = async (path: string) => {
    const folderPath = path.split("\\").slice(0, -1).join("\\");
    try {
      const res = await charactersService.openFolder(folderPath);
      if (res) {
        toastSuccess(toast, "Dossier ouvert");
      }
    } catch (error) {
      toastError(toast, "Ouverture impossible", toFriendlyFsError(error));
    }
  };

  const showDuplicateError = () => {
    toastError(toast, "Duplication impossible", "Aucun chemin de preset disponible.");
  };

  return {
    deleteCharacter,
    duplicateCharacter,
    openCharactersFolder,
    showDuplicateError,
  };
}
