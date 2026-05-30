import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { CacheFolderCard } from "@/features/cache/components/CacheFolderCard";
import { CacheToolbar } from "@/features/cache/components/CacheToolbar";
import { useCache } from "@/features/cache/useCache";
import { useCacheActions } from "@/features/cache/useCacheActions";

export default function CachePage() {
  const { folders, isLoading, removeFolder, clearAllFolders } = useCache();
  const { openFolder, clearAll, deleteFolder } = useCacheActions(clearAllFolders);

  const folderList = folders ?? [];

  if (isLoading) {
    return (
      <PageMotion className="px-4">
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Analyse du cache Star Citizen…" />
        </div>
      </PageMotion>
    );
  }

  const handleDelete = (path: string) => {
    deleteFolder(path, removeFolder);
  };

  return (
    <PageMotion className="px-4">
      <div className={`${PAGE_CENTER} pb-20 pt-2`}>
        <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-col gap-3">
          <CacheToolbar
            folderCount={folderList.length}
            onOpenFolder={openFolder}
            onClearAll={clearAll}
          />

          {folderList.length > 0 ? (
            <section className="settings-section flex min-h-0 flex-col overflow-hidden">
              <header className="settings-section-header px-3 py-2 pl-3">
                <h2 className="text-sm font-semibold leading-tight">
                  Dossiers détectés
                </h2>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {folderList.length} dossier
                  {folderList.length > 1 ? "s" : ""} — poids par installation
                </p>
              </header>

              <div className="min-h-0 max-h-[min(28rem,calc(100vh-16rem))] overflow-x-hidden overflow-y-auto px-2 py-2">
                <div className="flex flex-col gap-2">
                  {folderList.map((folder, index) => (
                    <CacheFolderCard
                      key={folder.path}
                      folder={folder}
                      index={index}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="settings-section px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Cache vide
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aucun dossier cache n&apos;a été détecté pour le moment.
              </p>
            </section>
          )}
        </div>
      </div>
    </PageMotion>
  );
}
