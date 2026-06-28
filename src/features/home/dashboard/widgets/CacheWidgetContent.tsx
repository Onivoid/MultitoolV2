import { FolderOpen, HardDrive, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCacheWidget } from "@/features/cache/hooks/useCacheWidget";
import { CACHE_WIDGET_LIST_LIMIT } from "@/features/cache/cache.widget.lib";
import { FeatureSearchField } from "@/shared/components/FeatureSearchField";
import {
  HOME_WIDGET_FOOTER,
  HOME_WIDGET_ROOT,
  HOME_WIDGET_SCROLL,
} from "@/features/home/dashboard/homeDashboard.ui";

export function CacheWidgetContent() {
  const {
    loading,
    error,
    busy,
    searchQuery,
    setSearchQuery,
    filteredFolders,
    totalCount,
    openFolder,
    clearAll,
    deleteFolder,
  } = useCacheWidget();

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="px-3 py-2 text-xs text-destructive">{error}</p>;
  }

  const showList = totalCount > 0;

  return (
    <div className={HOME_WIDGET_ROOT}>
      <div
        className="text-ui-secondary shrink-0 border-b border-primary/6 px-3 py-2 text-muted-foreground"
        data-no-window-drag
      >
        {showList ? (
          <>
            <span className="text-foreground">
              {totalCount} dossier{totalCount !== 1 ? "s" : ""}
            </span>{" "}
            cache détecté{totalCount !== 1 ? "s" : ""}
          </>
        ) : (
          "Aucun dossier cache détecté"
        )}
      </div>

      {showList && (
        <div
          className="shrink-0 border-b border-primary/6 px-3 py-2"
          data-no-window-drag
        >
          <FeatureSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un dossier…"
            className="h-8"
            inputClassName="h-7 text-xs"
          />
        </div>
      )}

      {!showList ? (
        <p className="px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          Lancez le jeu ou ouvrez le dossier cache depuis la page dédiée.
        </p>
      ) : filteredFolders.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">
          Aucun résultat pour « {searchQuery.trim()} ».
        </p>
      ) : (
        <ul
          className={`${HOME_WIDGET_SCROLL} border-b border-primary/6`}
          data-no-window-drag
        >
          {filteredFolders.map((folder) => (
            <li
              key={folder.path}
              className="flex items-center gap-2 border-b border-primary/4 px-3 py-2 last:border-b-0"
            >
              <HardDrive className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-snug">
                  {folder.name}
                </p>
                <p className="text-ui-caption truncate text-muted-foreground">
                  {folder.weight}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={busy}
                aria-label={`Supprimer ${folder.name}`}
                onClick={() => void deleteFolder(folder.path)}
                data-no-window-drag
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <footer
        className={`${HOME_WIDGET_FOOTER} settings-section-footer flex flex-wrap gap-2 px-3 py-2`}
        data-no-window-drag
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-ui-secondary h-7 min-w-0 flex-1 gap-1 px-2"
          disabled={busy}
          onClick={() => void openFolder()}
        >
          <FolderOpen className="h-3 w-3 shrink-0" aria-hidden />
          Ouvrir
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="text-ui-secondary h-7 min-w-0 flex-1 gap-1 px-2"
          disabled={busy || totalCount === 0}
          onClick={() => void clearAll()}
        >
          <Trash2 className="h-3 w-3 shrink-0" aria-hidden />
          Tout nettoyer
        </Button>
      </footer>

      {showList &&
        searchQuery.trim() === "" &&
        totalCount > CACHE_WIDGET_LIST_LIMIT && (
          <p className="text-ui-caption px-3 pb-2 text-center text-muted-foreground">
            <Link to="/cache" className="text-primary hover:underline">
              Voir les {totalCount} dossiers
            </Link>
          </p>
        )}
    </div>
  );
}
