import { Button } from "@/components/ui/button";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import {
  BlueprintCard,
  getBlueprintKey,
} from "@/features/blueprints/components/BlueprintCard";
import { BlueprintsStatusPanel } from "@/features/blueprints/components/BlueprintsStatusPanel";
import { BlueprintsToolbar } from "@/features/blueprints/components/BlueprintsToolbar";
import { useBlueprints } from "@/features/blueprints/useBlueprints";

const BLUEPRINT_GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

export default function BlueprintsPage() {
  const vm = useBlueprints();
  const watching = vm.status?.watching ?? false;

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <BlueprintsStatusPanel
        status={vm.status}
        watching={watching}
        blueprintCount={vm.blueprints.length}
        isRefreshing={vm.isRefreshing}
        isLoading={vm.isLoading}
        isImporting={vm.isImporting}
        importProgress={vm.importProgress}
        importStartedAt={vm.importStartedAt}
        isExporting={vm.isExporting}
        isTogglingWatch={vm.isTogglingWatch}
        onRefresh={vm.refresh}
        onImportHistory={vm.importHistory}
        onExport={vm.exportBlueprints}
        onStartWatch={vm.startWatch}
        onStopWatch={vm.stopWatch}
      />

      {vm.isLoading ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement des blueprints…" />
        </div>
      ) : vm.blueprints.length === 0 ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <section className="settings-section max-w-md px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Aucun blueprint enregistré
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Démarrez la surveillance ou synchronisez depuis les logbackups Star
              Citizen.
            </p>
          </section>
        </div>
      ) : (
        <>
          <BlueprintsToolbar
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
            <div className={`${PAGE_CENTER} gap-3 pb-20`}>
              <section className="settings-section max-w-md px-6 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun schéma pour «{" "}
                  <span className="font-medium text-foreground">
                    {vm.searchQuery.trim()}
                  </span>
                  »
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    vm.setSearchQuery("");
                    vm.setOwnerFilter("");
                  }}
                  data-no-window-drag
                >
                  Effacer les filtres
                </Button>
              </section>
            </div>
          ) : (
            <div className={`${PAGE_SCROLL} pb-20`}>
              <div className={BLUEPRINT_GRID_CLASS}>
                {vm.filteredBlueprints.map((blueprint, index) => (
                  <BlueprintCard
                    key={getBlueprintKey(blueprint)}
                    blueprint={blueprint}
                    index={index}
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
