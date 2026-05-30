import { BrushCleaning } from "lucide-react";
import { DataTable } from "@/shared/components/DataTable";
import FetchingOverlay from "@/shared/components/FetchingOverlay";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import CacheActionsMenu from "@/features/cache/components/CacheActionsMenu";
import { buildCacheColumns } from "@/features/cache/components/cacheColumns";
import { useCache } from "@/features/cache/useCache";
import { useCacheActions } from "@/features/cache/useCacheActions";

export default function CachePage() {
  const { folders, isLoading, removeFolder, clearAllFolders } = useCache();
  const { openFolder, clearAll, deleteFolder } = useCacheActions(clearAllFolders);

  if (isLoading) {
    return <FetchingOverlay />;
  }

  const handleDelete = (path: string) => {
    deleteFolder(path, removeFolder);
  };

  return (
    <PageMotion className="gap-4 px-4 pt-2">
      <div className="flex shrink-0 items-center justify-between">
        <PageHeader
          icon={<BrushCleaning className="h-6 w-6" />}
          title="Gestionnaire du cache"
          description="Gérez et nettoyez les fichiers en cache de Star Citizen"
        />
        <CacheActionsMenu onOpenFolder={openFolder} onClearAll={clearAll} />
      </div>

      <DataTable
        columns={buildCacheColumns(handleDelete)}
        data={folders ?? []}
        emptyMessage="Le cache de Star Citizen est vide."
      />
    </PageMotion>
  );
}
