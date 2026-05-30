import { useToast } from "@/hooks/use-toast";
import { cacheService, type CacheFolder } from "@/features/cache/cache.service";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";

export function useCacheActions(onFoldersChange: (folders: CacheFolder[]) => void) {
  const { toast } = useToast();

  const openFolder = async () => {
    try {
      const res = await cacheService.openFolder();
      if (res) {
        toastSuccess(toast, "Dossier cache ouvert");
      }
    } catch (error) {
      toastError(toast, "Ouverture impossible", String(error));
    }
  };

  const clearAll = async () => {
    try {
      const res = await cacheService.clearAll();
      if (res) {
        onFoldersChange([]);
        toastSuccess(toast, "Cache vidé");
      }
    } catch (error) {
      toastError(toast, "Nettoyage impossible", String(error));
    }
  };

  const deleteFolder = async (path: string, onDeleted: (path: string) => void) => {
    try {
      const res = await cacheService.deleteFolder(path);
      if (res) {
        toastSuccess(toast, "Dossier supprimé");
        onDeleted(path);
      } else {
        toastError(
          toast,
          "Suppression impossible",
          "Le dossier n'a pas pu être retiré.",
        );
      }
    } catch (error) {
      toastError(toast, "Suppression impossible", String(error));
    }
  };

  return { openFolder, clearAll, deleteFolder };
}
