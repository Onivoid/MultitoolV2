import { FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CacheToolbarProps {
  folderCount: number;
  onOpenFolder: () => void;
  onClearAll: () => void;
}

export function CacheToolbar({
  folderCount,
  onOpenFolder,
  onClearAll,
}: CacheToolbarProps) {
  return (
    <section className="settings-section flex flex-col overflow-hidden">
      <header className="settings-section-header px-3 py-2 pl-3">
        <h2 className="text-sm font-semibold leading-tight">Actions</h2>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          Ouvrir le dossier cache ou supprimer son contenu
        </p>
      </header>

      <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:flex-1"
          data-no-window-drag
          onClick={onOpenFolder}
        >
          <FolderOpen className="mr-1.5 h-4 w-4" />
          Ouvrir le dossier
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="w-full sm:flex-1"
          data-no-window-drag
          onClick={onClearAll}
          disabled={folderCount === 0}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Tout nettoyer
        </Button>
      </div>

      <footer className="settings-section-footer px-3 py-2 text-xs text-muted-foreground">
        {folderCount > 0
          ? `${folderCount} dossier${folderCount > 1 ? "s" : ""} détecté${folderCount > 1 ? "s" : ""}`
          : "Aucun dossier cache détecté"}
      </footer>
    </section>
  );
}
