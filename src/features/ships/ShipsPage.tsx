import { useState } from "react";
import { GitCompare, Rocket, Search } from "lucide-react";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShipCard } from "@/features/ships/components/ShipCard";
import { ShipCompareModal } from "@/features/ships/components/ShipCompareModal";
import { ShipDetailModal } from "@/features/ships/components/ShipDetailModal";
import { ShipFiltersBar } from "@/features/ships/components/ShipFiltersBar";
import {
  SHIPS_COMPARE_BANNER,
  SHIPS_GRID,
  SHIPS_TOOLBAR,
} from "@/features/ships/ships.ui";
import { useShipsCatalog } from "@/features/ships/useShipsCatalog";
import { cn } from "@/lib/utils";

export default function ShipsPage() {
  const vm = useShipsCatalog();
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const compareCount = vm.compareShips.length;

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <section className={SHIPS_TOOLBAR}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold">Vaisseaux</h1>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Catalogue Wiki Star Citizen — stats, prix UEX et comparateur jusqu&apos;à
              4 vaisseaux.
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {vm.isLoading ? (
              "Chargement…"
            ) : (
              <>
                <span className="font-medium text-foreground">{vm.ships.length}</span>
                <span> / {vm.totalCount} vaisseaux</span>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={vm.search}
            onChange={(e) => vm.setSearch(e.target.value)}
            placeholder="Rechercher un vaisseau, fabricant, rôle…"
            className="h-10 pl-10"
            data-no-window-drag
          />
        </div>

        <ShipFiltersBar
          facets={vm.facetFilters}
          onChange={vm.setFacetFilters}
          options={vm.facetOptions}
        />
      </section>

      {compareCount > 0 && (
        <section
          className={cn(
            SHIPS_COMPARE_BANNER,
            compareCount >= 2 && "ring-1 ring-primary/40",
          )}
          data-no-window-drag
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {compareCount} vaisseau{compareCount > 1 ? "x" : ""} sélectionné
                {compareCount > 1 ? "s" : ""} pour comparaison
              </p>
              <p className="text-xs text-muted-foreground">
                Ajoutez jusqu&apos;à 4 vaisseaux via le bouton VS sur les cartes.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => vm.clearCompare()}
              >
                Vider la sélection
              </Button>
              <Button
                type="button"
                size="default"
                className="h-9 gap-2"
                onClick={() => setCompareModalOpen(true)}
              >
                <GitCompare className="h-4 w-4" />
                Comparer ({compareCount})
              </Button>
            </div>
          </div>
        </section>
      )}

      {vm.isLoading ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement du catalogue des vaisseaux…" />
        </div>
      ) : vm.totalCount === 0 ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <section className="settings-section max-w-md px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Catalogue vide</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Le catalogue n&apos;a pas pu être chargé ou est vide.
            </p>
          </section>
        </div>
      ) : vm.ships.length === 0 ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <section className="settings-section max-w-md px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Aucun vaisseau trouvé</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Essayez d&apos;autres termes ou retirez les filtres.
            </p>
          </section>
        </div>
      ) : (
        <div className={`${PAGE_SCROLL} pb-20`}>
          <div className={SHIPS_GRID}>
            {vm.ships.map((ship) => (
              <ShipCard
                key={ship.uuid}
                ship={ship}
                compared={vm.isCompared(ship.uuid)}
                canAddCompare={vm.canAddCompare}
                onToggleCompare={vm.toggleCompare}
                onOpenDetail={vm.openDetail}
              />
            ))}
          </div>
        </div>
      )}

      <ShipCompareModal
        open={compareModalOpen && compareCount > 0}
        onOpenChange={setCompareModalOpen}
        ships={vm.compareShips}
        details={vm.compareDetails}
        onRemove={vm.toggleCompare}
        onClear={() => {
          vm.clearCompare();
          setCompareModalOpen(false);
        }}
        onOpenDetail={(uuid) => {
          setCompareModalOpen(false);
          vm.openDetail(uuid);
        }}
      />

      <ShipDetailModal
        open={vm.detailUuid != null}
        loading={vm.detailLoading}
        detail={vm.detail}
        onClose={vm.closeDetail}
        onAddCompare={
          vm.detailUuid && !vm.isCompared(vm.detailUuid)
            ? () => vm.toggleCompare(vm.detailUuid!)
            : undefined
        }
      />
    </PageMotion>
  );
}
