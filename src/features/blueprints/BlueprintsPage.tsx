import {
  Loader2,
  RefreshCw,
  ScrollText,
  Play,
  Square,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import BlueprintListToolbar from "@/components/blueprints/BlueprintListToolbar";
import BlueprintRow from "@/components/blueprints/BlueprintRow";
import { useBlueprints } from "@/features/blueprints/useBlueprints";

export default function BlueprintsPage() {
  const vm = useBlueprints();
  const watching = vm.status?.watching ?? false;

  return (
    <PageMotion className="flex max-h-[calc(100vh-50px)] w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-4 pr-3">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            icon={<ScrollText className="h-6 w-6" />}
            title="Blueprints"
            description="Blueprints débloqués détectés depuis le Game.log Star Citizen (LIVE)"
          />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={vm.refresh}
              disabled={vm.isRefreshing || vm.isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${vm.isRefreshing ? "animate-spin" : ""}`}
              />
              Rafraîchir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={vm.importHistory}
              disabled={vm.isImporting || vm.isLoading}
            >
              {vm.isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <History className="mr-2 h-4 w-4" />
              )}
              Importer l'historique
            </Button>
            {watching ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={vm.stopWatch}
                disabled={vm.isTogglingWatch}
              >
                <Square className="mr-2 h-4 w-4" />
                Arrêter
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={vm.startWatch}
                disabled={vm.isTogglingWatch}
              >
                <Play className="mr-2 h-4 w-4" />
                Démarrer
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/30 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={watching ? "default" : "secondary"}>
              {watching ? "Surveillance active" : "Surveillance arrêtée"}
            </Badge>
            <span className="text-muted-foreground">
              {vm.status?.blueprintCount ?? 0} blueprint(s) enregistré(s)
            </span>
          </div>
          {vm.status?.logPath && (
            <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
              {vm.status.logPath}
            </p>
          )}
        </div>
      </div>

      {vm.isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : vm.blueprints.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
          <p>Aucun blueprint enregistré pour le moment.</p>
          <p className="text-sm">
            Démarrez la surveillance ou importez l'historique depuis les
            logbackups.
          </p>
        </div>
      ) : (
        <>
          <BlueprintListToolbar
            searchQuery={vm.searchQuery}
            onSearchChange={vm.setSearchQuery}
            sortKey={vm.sortKey}
            onSortChange={vm.handleSortChange}
            ownerFilter={vm.ownerFilter}
            onOwnerFilterChange={vm.setOwnerFilter}
            availableOwners={vm.uniqueOwners}
            filteredCount={vm.filteredBlueprints.length}
            totalCount={vm.blueprints.length}
          />

          {vm.filteredBlueprints.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
              <p>
                Aucun schéma pour «{" "}
                <span className="font-medium text-foreground">
                  {vm.searchQuery.trim()}
                </span>
                »
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  vm.setSearchQuery("");
                  vm.setOwnerFilter("");
                }}
              >
                Effacer les filtres
              </Button>
            </div>
          ) : (
            <div className="app-scroll-root min-h-0 flex-1 overflow-x-hidden overflow-y-auto mt-2 pb-4 pr-3">
              <div className="flex flex-col gap-2">
                {vm.filteredBlueprints.map((bp) => (
                  <BlueprintRow
                    key={`${bp.owner}-${bp.productName}-${bp.ts}`}
                    blueprint={bp}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageMotion>
  );
}
