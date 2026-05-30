import { useToast } from "@/hooks/use-toast";
import {
  cacheService,
  type CacheFolder,
} from "@/features/cache/cache.service";
import { toastLegacyError, toastLegacySuccess } from "@/shared/lib/toastHelpers";

export function useCacheActions(onFoldersChange: (folders: CacheFolder[]) => void) {
  const { toast } = useToast();

  const openFolder = async () => {
    try {
      const res = await cacheService.openFolder();
      if (res) {
        toastLegacySuccess(toast, "Dossier ouvert", "Le dossier du cache a bien été ouvert.");
      }
    } catch (error) {
      toastLegacyError(
        toast,
        "Erreur lors de l'ouverture",
        `Une erreur est survenue : ${error}`,
      );
    }
  };

  const clearAll = async () => {
    try {
      const res = await cacheService.clearAll();
      if (res) {
        onFoldersChange([]);
        toastLegacySuccess(toast, "Cache nettoyé", "Le cache a bien été nettoyé.");
      }
    } catch (error) {
      toastLegacyError(
        toast,
        "Erreur lors du nettoyage",
        `Une erreur est survenue : ${error}`,
      );
    }
  };

  const deleteFolder = async (path: string, onDeleted: (path: string) => void) => {
    try {
      const res = await cacheService.deleteFolder(path);
      if (res) {
        toastLegacySuccess(
          toast,
          "Dossier supprimé",
          `Le dossier ${path} a bien été supprimé.`,
        );
        onDeleted(path);
      } else {
        toastLegacySuccess(
          toast,
          "Erreur lors de la suppression",
          `Une erreur est survenue lors de la suppression du dossier ${path}.`,
        );
      }
    } catch (error) {
      toastLegacyError(
        toast,
        "Erreur lors de la suppression",
        `Une erreur est survenue : ${error}`,
      );
    }
  };

  return { openFolder, clearAll, deleteFolder };
}
