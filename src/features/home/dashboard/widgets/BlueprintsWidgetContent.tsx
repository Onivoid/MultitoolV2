import { FolderSync, Play, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BlueprintsImportProgressDisplay } from "@/features/blueprints/components/BlueprintsImportProgressDisplay";
import { formatBlueprintOwner } from "@/features/blueprints/blueprints.lib";
import {
  formatBlueprintDateShort,
  truncateProductName,
} from "@/features/blueprints/blueprints.widget.lib";
import { useBlueprintsWidget } from "@/features/blueprints/hooks/useBlueprintsWidget";
import { getBlueprintKey } from "@/features/blueprints/components/BlueprintCard";
import { FeatureSearchField } from "@/shared/components/FeatureSearchField";
import {
  HOME_WIDGET_FOOTER,
  HOME_WIDGET_ROOT,
  HOME_WIDGET_SCROLL,
} from "@/features/home/dashboard/homeDashboard.ui";
import { cn } from "@/lib/utils";

export function BlueprintsWidgetContent() {
  const {
    watching,
    loading,
    error,
    busy,
    isImporting,
    progress,
    operationStartedAt,
    searchQuery,
    setSearchQuery,
    filteredBlueprints,
    totalCount,
    catalogTotal,
    ownedMatchedCount,
    toggleWatch,
    syncFromLogs,
  } = useBlueprintsWidget();

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
        className="flex shrink-0 items-center gap-2 border-b border-primary/6 px-3 py-2"
        data-no-window-drag
      >
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            watching ? "animate-pulse bg-primary" : "bg-muted-foreground/50",
          )}
          aria-hidden
        />
        <span className="text-ui-secondary min-w-0 flex-1 truncate text-muted-foreground">
          {watching ? "Surveillance active" : "Surveillance arrêtée"}
          <span className="text-foreground">
            {" "}
            · {totalCount} en journal
            {catalogTotal != null && (
              <>
                {" "}
                · {ownedMatchedCount}/{catalogTotal} encyclopédie
              </>
            )}
          </span>
        </span>
      </div>

      {showList && (
        <div
          className="shrink-0 border-b border-primary/6 px-3 py-2"
          data-no-window-drag
        >
          <FeatureSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un schéma…"
            className="h-8"
            inputClassName="h-7 text-xs"
          />
        </div>
      )}

      {isImporting && (
        <div
          className="shrink-0 border-b border-primary/6 px-3 py-2"
          data-no-window-drag
        >
          <BlueprintsImportProgressDisplay
            isImporting={isImporting}
            progress={progress}
            operationStartedAt={operationStartedAt}
            compact
          />
        </div>
      )}

      {!showList ? (
        <p className="px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          Aucun schéma enregistré. Démarrez la surveillance ou synchronisez depuis les
          logs.
        </p>
      ) : filteredBlueprints.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">
          Aucun résultat pour « {searchQuery.trim()} ».
        </p>
      ) : (
        <ul
          className={cn(HOME_WIDGET_SCROLL, "border-b border-primary/6")}
          data-no-window-drag
        >
          {filteredBlueprints.map((bp) => {
            const catalogId = bp.catalogBlueprintId?.trim().toLowerCase();
            const to = catalogId
              ? `/blueprints?blueprint=${encodeURIComponent(catalogId)}`
              : "/blueprints";
            return (
              <li
                key={getBlueprintKey(bp)}
                className="border-b border-primary/4 px-3 py-2 last:border-b-0"
              >
                <Link
                  to={to}
                  className="block rounded-sm transition-colors hover:bg-primary/5"
                >
                  <p className="truncate text-xs font-medium leading-snug">
                    {truncateProductName(bp.productName)}
                  </p>
                  <p className="text-ui-caption mt-0.5 truncate text-muted-foreground">
                    {formatBlueprintOwner(bp.owner)} · {formatBlueprintDateShort(bp.ts)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <footer
        className={cn(
          HOME_WIDGET_FOOTER,
          "settings-section-footer flex flex-wrap gap-2 px-3 py-2",
        )}
        data-no-window-drag
      >
        <Button
          type="button"
          variant={watching ? "outline" : "default"}
          size="sm"
          className="text-ui-secondary h-7 min-w-0 flex-1 gap-1 px-2"
          disabled={busy}
          onClick={() => void toggleWatch()}
        >
          {watching ? (
            <Square className="h-3 w-3 shrink-0" aria-hidden />
          ) : (
            <Play className="h-3 w-3 shrink-0" aria-hidden />
          )}
          {watching ? "Arrêter" : "Démarrer"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-ui-secondary h-7 min-w-0 flex-1 gap-1 px-2"
          disabled={busy}
          onClick={() => void syncFromLogs()}
        >
          <FolderSync className="h-3 w-3 shrink-0" aria-hidden />
          Sync
        </Button>
      </footer>

      {showList &&
        searchQuery.trim() === "" &&
        filteredBlueprints.length < totalCount && (
          <p className="text-ui-caption px-3 pb-2 text-center text-muted-foreground">
            <Link to="/blueprints" className="text-primary hover:underline">
              Voir les {totalCount} schémas
            </Link>
          </p>
        )}
    </div>
  );
}
