import { useToast } from "@/hooks/use-toast";
import { charactersService } from "@/features/characters-local/characters.service";
import { toFriendlyFsError } from "@/utils/fs-permissions";
import { toastError, toastSuccess, toastLegacyError } from "@/shared/lib/toastHelpers";

export function useLocalCharactersActions() {
  const { toast } = useToast();

  const deleteCharacter = async (path: string) => {
    try {
      const res = await charactersService.delete(path);
      if (res) {
        toastSuccess(toast, "Personnage supprimé", "Le personnage a bien été supprimé.");
        return true;
      }
      throw new Error("Suppression échouée");
    } catch (error) {
      toastError(toast, "Erreur lors de la suppression", toFriendlyFsError(error));
      return false;
    }
  };

  const duplicateCharacter = async (path: string, onSuccess?: () => void) => {
    try {
      const res = await charactersService.duplicate(path);
      if (res) {
        toastSuccess(
          toast,
          "Preset dupliqué",
          "Le preset a été copié sur toutes les versions.",
        );
        onSuccess?.();
      }
    } catch (error) {
      toastError(toast, "Erreur lors de la duplication", toFriendlyFsError(error));
    }
  };

  const openCharactersFolder = async (path: string) => {
    const folderPath = path.split("\\").slice(0, -1).join("\\");
    try {
      const res = await charactersService.openFolder(folderPath);
      if (res) {
        toastSuccess(
          toast,
          "Dossier ouvert",
          "Le dossier des personnages a bien été ouvert.",
        );
      }
    } catch (error) {
      toastError(toast, "Erreur lors de l'ouverture", toFriendlyFsError(error));
    }
  };

  const showDuplicateError = () => {
    toastLegacyError(
      toast,
      "Erreur",
      "Impossible de dupliquer : aucun chemin disponible.",
    );
  };

  return {
    deleteCharacter,
    duplicateCharacter,
    openCharactersFolder,
    showDuplicateError,
  };
}
