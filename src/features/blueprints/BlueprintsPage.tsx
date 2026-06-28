import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PageMotion from "@/shared/components/PageMotion";
import { DOCK_SAFE_PADDING, PAGE_CENTER } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { BlueprintDetailPanel } from "@/features/blueprints/components/BlueprintDetailPanel";
import { BlueprintCatalogRow } from "@/features/blueprints/components/BlueprintCatalogRow";
import { BlueprintsCatalogTopBar } from "@/features/blueprints/components/BlueprintsCatalogTopBar";
import { BlueprintsQuickFilterBar } from "@/features/blueprints/components/BlueprintsQuickFilterBar";
import { BlueprintsCatalogToolbar } from "@/features/blueprints/components/BlueprintsCatalogToolbar";
import {
  JournalMatchIssues,
  JournalMatchIssuesBanner,
} from "@/features/blueprints/components/JournalMatchIssues";
import { BlueprintsStatusPanel } from "@/features/blueprints/components/BlueprintsStatusPanel";
import { getUniqueOwners } from "@/features/blueprints/blueprints.lib";
import {
  BP_EMPTY_STATE,
  BP_LIST_SCROLL,
  BP_SECTION,
} from "@/features/blueprints/blueprints.ui";
import { BlueprintSectionHeader } from "@/features/blueprints/components/BlueprintSectionHeader";
import { BookOpen } from "lucide-react";
import {
  buildOwnedUnlockDates,
  resolveOwnedBlueprints,
  type JournalAmbiguousLink,
} from "@/features/blueprints/blueprints.match.lib";
import { BlueprintsCatalogFilters } from "@/features/blueprints/components/BlueprintsCatalogFilters";
import { resolveItemFamily } from "@/features/blueprints/blueprints.taxonomy";
import type { BlueprintFamily } from "@/features/blueprints/blueprints.taxonomy";
import {
  applyCatalogBadgeFilter,
  applyCatalogFilters,
  countActiveFilters,
  DEFAULT_CATALOG_FILTER_STATE,
  type BlueprintCatalogFilterState,
} from "@/features/blueprints/blueprints.catalog.filters";
import type { BlueprintOwnedFilter } from "@/features/blueprints/blueprints.catalog.types";
import { useBlueprints } from "@/features/blueprints/useBlueprints";
import { blueprintsCatalogService } from "@/features/blueprints/blueprints.catalog.service";
import { useBlueprintsCatalog } from "@/features/blueprints/useBlueprintsCatalog";
import { useBlueprintWishlist } from "@/features/blueprints/hooks/useBlueprintWishlist";
import { useBlueprintManualOwned } from "@/features/blueprints/hooks/useBlueprintManualOwned";
import { cn } from "@/lib/utils";

export default function BlueprintsPage() {
  const [searchParams] = useSearchParams();
  const vm = useBlueprints();
  const catalogVm = useBlueprintsCatalog();
  const [catalogSearch, setCatalogSearch] = useState("");
  const [ownedFilter, setOwnedFilter] = useState<BlueprintOwnedFilter>("all");
  const [filterState, setFilterState] = useState<BlueprintCatalogFilterState>(
    DEFAULT_CATALOG_FILTER_STATE,
  );

  useEffect(() => {
    if (filterState.family === "other") {
      setFilterState((s) => ({ ...s, family: "all" }));
    }
  }, [filterState.family]);
  const [missionFilter, setMissionFilter] = useState<{
    uuid: string;
    title: string;
    blueprintIds: Set<string>;
  } | null>(null);
  const [issuesBannerDismissed, setIssuesBannerDismissed] = useState(false);
  const [issuesSheetOpen, setIssuesSheetOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const watching = vm.status?.watching ?? false;
  const uniqueOwners = useMemo(() => getUniqueOwners(vm.blueprints), [vm.blueprints]);

  const [journalOwnedIds, setJournalOwnedIds] = useState<Set<string>>(new Set());
  const { manualOwnedIds, toggleManualOwned, isManualOwned } =
    useBlueprintManualOwned();
  const ownedIds = useMemo(() => {
    const merged = new Set(journalOwnedIds);
    for (const id of manualOwnedIds) merged.add(id);
    return merged;
  }, [journalOwnedIds, manualOwnedIds]);
  const { wishlistIds, toggleWishlist, isWishlisted } = useBlueprintWishlist(ownedIds);
  const [unlockDates, setUnlockDates] = useState<Map<string, number>>(new Map());
  const [matchStats, setMatchStats] = useState<{
    journalProducts: number;
    matchedProducts: number;
    unmatchedProductNames: string[];
    ambiguousLinks: JournalAmbiguousLink[];
    missingCatalogIds: string[];
  }>({
    journalProducts: 0,
    matchedProducts: 0,
    unmatchedProductNames: [],
    ambiguousLinks: [],
    missingCatalogIds: [],
  });

  useEffect(() => {
    if (catalogVm.isLoadingCatalog || catalogVm.catalog.length === 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const owner = vm.ownerFilter || undefined;
      const [resolved, dates] = await Promise.all([
        resolveOwnedBlueprints(vm.blueprints, owner),
        buildOwnedUnlockDates(vm.blueprints, owner),
      ]);
      if (cancelled) return;
      if (resolved.persistedEntryCount > 0) {
        await vm.reloadStoreSilent();
        if (cancelled) return;
      }
      const missingCatalogIds = [...resolved.blueprintIds].filter(
        (id) => !catalogVm.catalogById.has(id),
      );
      setJournalOwnedIds(resolved.blueprintIds);
      setUnlockDates(dates);
      setMatchStats({
        journalProducts: resolved.journalProductCount,
        matchedProducts: resolved.matchedProductCount,
        unmatchedProductNames: resolved.unmatchedProductNames,
        ambiguousLinks: resolved.ambiguousLinks,
        missingCatalogIds,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    vm.blueprints,
    vm.ownerFilter,
    catalogVm.catalogById,
    catalogVm.isLoadingCatalog,
  ]);

  // Schémas journal absents du cache local : complément via API Wiki.
  useEffect(() => {
    if (catalogVm.isLoadingCatalog || ownedIds.size === 0) return;
    const missing = [...ownedIds].filter((id) => !catalogVm.catalogById.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    void blueprintsCatalogService.supplementIds(missing).then((extra) => {
      if (!cancelled && extra.length > 0) {
        catalogVm.appendSummaries(extra);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    ownedIds,
    catalogVm.catalogById,
    catalogVm.isLoadingCatalog,
    catalogVm.appendSummaries,
  ]);

  const filteredCatalog = useMemo(() => {
    const state: BlueprintCatalogFilterState = {
      ...filterState,
      query: catalogSearch,
      owned: ownedFilter,
      missionUuid: missionFilter?.uuid ?? null,
    };
    return applyCatalogFilters(
      catalogVm.catalog,
      state,
      ownedIds,
      missionFilter?.blueprintIds ?? null,
      unlockDates,
      wishlistIds,
    );
  }, [
    catalogVm.catalog,
    catalogSearch,
    ownedFilter,
    ownedIds,
    wishlistIds,
    unlockDates,
    filterState,
    missionFilter,
  ]);

  const familyCounts = useMemo(() => {
    const counts: Partial<Record<BlueprintFamily | "all", number>> = {
      all: catalogVm.catalog.length,
    };
    for (const item of catalogVm.catalog) {
      const fam = resolveItemFamily(item);
      counts[fam] = (counts[fam] ?? 0) + 1;
    }
    return counts;
  }, [catalogVm.catalog]);

  const deepLinkId = searchParams.get("blueprint")?.trim().toLowerCase() ?? null;
  useEffect(() => {
    if (!deepLinkId || catalogVm.isLoadingCatalog) return;
    if (catalogVm.catalogById.has(deepLinkId)) {
      catalogVm.selectBlueprint(deepLinkId);
    }
  }, [
    deepLinkId,
    catalogVm.isLoadingCatalog,
    catalogVm.catalogById,
    catalogVm.selectBlueprint,
  ]);

  const isPageLoading = catalogVm.isLoadingCatalog;
  const showCatalog = !isPageLoading && !catalogVm.catalogError;

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <div className="shrink-0">
        <BlueprintsStatusPanel
          status={vm.status}
          watching={watching}
          blueprintCount={vm.blueprints.length}
          isRefreshing={vm.isRefreshing || catalogVm.isRevalidating}
          isLoading={vm.isLoading}
          isImporting={vm.isImporting}
          importProgress={vm.importProgress}
          importStartedAt={vm.importStartedAt}
          isExporting={vm.isExporting}
          isTogglingWatch={vm.isTogglingWatch}
          onRefresh={() => {
            void vm.refresh();
            void catalogVm.revalidateCatalog();
          }}
          onImportHistory={vm.importHistory}
          onExport={vm.exportBlueprints}
          onStartWatch={vm.startWatch}
          onStopWatch={vm.stopWatch}
        />
      </div>

      {isPageLoading ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement du catalogue…" />
        </div>
      ) : catalogVm.catalogError ? (
        <div className={`${PAGE_CENTER} gap-3 pb-20`}>
          <section className="settings-section max-w-md px-6 py-8 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{catalogVm.catalogError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void catalogVm.loadCatalog()}
              data-no-window-drag
            >
              Réessayer
            </Button>
          </section>
        </div>
      ) : showCatalog ? (
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden",
            DOCK_SAFE_PADDING,
          )}
        >
          <BlueprintsCatalogTopBar
            searchQuery={catalogSearch}
            onSearchChange={setCatalogSearch}
            ownedFilter={ownedFilter}
            onOwnedFilterChange={setOwnedFilter}
            advancedFilterCount={countActiveFilters(filterState)}
            onOpenAdvancedFilters={() => setAdvancedFiltersOpen(true)}
            filteredCount={filteredCatalog.length}
            totalCount={catalogVm.catalog.length}
          />

          <BlueprintsCatalogFilters
            state={filterState}
            onChange={setFilterState}
            facets={catalogVm.facets}
            summaryFacets={catalogVm.summaryFacets}
            missionFilterTitle={missionFilter?.title ?? null}
            onClearMissionFilter={() => setMissionFilter(null)}
            filtersOpen={advancedFiltersOpen}
            onFiltersOpenChange={setAdvancedFiltersOpen}
            hideTrigger
          />

          <BlueprintsQuickFilterBar
            state={filterState}
            onChange={setFilterState}
            catalog={catalogVm.catalog}
            familyCounts={familyCounts}
          />

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,2.5fr)]">
            <section className={cn(BP_SECTION, "flex min-h-0 min-w-0 flex-col")}>
              <BlueprintSectionHeader
                icon={BookOpen}
                title="Liste des plans"
                subtitle="Badges cliquables · étoile liste de suivi"
              />
              <div className="shrink-0 border-b border-primary/8">
                <BlueprintsCatalogToolbar
                  compact
                  searchQuery=""
                  onSearchChange={() => undefined}
                  ownedFilter={ownedFilter}
                  onOwnedFilterChange={setOwnedFilter}
                  filteredCount={filteredCatalog.length}
                  totalCount={catalogVm.catalog.length}
                  ownedCount={ownedIds.size}
                  journalProductCount={matchStats.journalProducts}
                  matchedProductCount={matchStats.matchedProducts}
                  uniqueBlueprintIdCount={ownedIds.size}
                  unmatchedProductNamesCount={matchStats.unmatchedProductNames.length}
                  uniqueOwners={uniqueOwners}
                  ownerFilter={vm.ownerFilter}
                  onOwnerFilterChange={vm.setOwnerFilter}
                />
              </div>
              {!issuesBannerDismissed && (
                <JournalMatchIssuesBanner
                  unmatchedProductNames={matchStats.unmatchedProductNames}
                  ambiguousLinks={matchStats.ambiguousLinks}
                  journalProductCount={matchStats.journalProducts}
                  uniqueBlueprintIdCount={ownedIds.size}
                  onOpen={() => setIssuesSheetOpen(true)}
                  onDismiss={() => setIssuesBannerDismissed(true)}
                />
              )}
              <Sheet open={issuesSheetOpen} onOpenChange={setIssuesSheetOpen}>
                <SheetContent
                  side="right"
                  className="w-full max-w-md overflow-y-auto"
                  data-no-window-drag
                >
                  <SheetHeader className="mb-4">
                    <SheetTitle className="flex items-center gap-2 text-amber-300">
                      <AlertCircle className="h-4 w-4" />
                      Liaison journal → encyclopédie
                    </SheetTitle>
                  </SheetHeader>
                  <JournalMatchIssues
                    unmatchedProductNames={matchStats.unmatchedProductNames}
                    ambiguousLinks={matchStats.ambiguousLinks}
                    missingCatalogIds={matchStats.missingCatalogIds}
                    journalProductCount={matchStats.journalProducts}
                    uniqueBlueprintIdCount={ownedIds.size}
                  />
                </SheetContent>
              </Sheet>
              <div className={cn(BP_LIST_SCROLL, "min-h-0 flex-1")}>
                {filteredCatalog.length === 0 ? (
                  <div className={BP_EMPTY_STATE}>
                    <p className="font-medium text-foreground">Aucun résultat</p>
                    <p className="mt-1 text-xs">
                      Ajuste la recherche ou les filtres pour afficher des blueprints.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pb-2">
                    {filteredCatalog.map((item) => (
                      <BlueprintCatalogRow
                        key={item.blueprintId}
                        item={item}
                        selected={catalogVm.selectedBlueprintId === item.blueprintId}
                        isOwned={ownedIds.has(item.blueprintId)}
                        isManualOwned={isManualOwned(item.blueprintId)}
                        isWishlisted={isWishlisted(item.blueprintId)}
                        onToggleWishlist={() => void toggleWishlist(item.blueprintId)}
                        onToggleManualOwned={() =>
                          void toggleManualOwned(item.blueprintId)
                        }
                        unlockedAt={unlockDates.get(item.blueprintId)}
                        filterState={filterState}
                        onSelect={() => catalogVm.selectBlueprint(item.blueprintId)}
                        onBadgeFilter={(filter) =>
                          setFilterState((s) => applyCatalogBadgeFilter(s, filter))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="flex min-h-0 min-w-0 flex-col">
              <BlueprintDetailPanel
                selectedId={catalogVm.selectedBlueprintId}
                detail={catalogVm.detail}
                isLoading={catalogVm.isLoadingDetail}
                error={catalogVm.detailError}
                isOwned={
                  catalogVm.selectedBlueprintId != null &&
                  ownedIds.has(catalogVm.selectedBlueprintId)
                }
                isManualOwned={
                  catalogVm.selectedBlueprintId != null &&
                  isManualOwned(catalogVm.selectedBlueprintId)
                }
                isWishlisted={
                  catalogVm.selectedBlueprintId != null &&
                  isWishlisted(catalogVm.selectedBlueprintId)
                }
                onToggleWishlist={
                  catalogVm.selectedBlueprintId
                    ? () => void toggleWishlist(catalogVm.selectedBlueprintId!)
                    : undefined
                }
                onToggleManualOwned={
                  catalogVm.selectedBlueprintId
                    ? () => void toggleManualOwned(catalogVm.selectedBlueprintId!)
                    : undefined
                }
                ownedIds={ownedIds}
                unlockDate={
                  catalogVm.selectedBlueprintId != null
                    ? (unlockDates.get(catalogVm.selectedBlueprintId) ?? null)
                    : null
                }
                onSelectBlueprint={(id) => catalogVm.selectBlueprint(id)}
                onFilterByResource={(ids, label) => {
                  const [primary, ...aliases] = ids;
                  if (!primary) return;
                  setFilterState((s) => ({
                    ...s,
                    resourceUuid: primary,
                    resourceUuidAliases: aliases,
                    resourceFilterLabel: label,
                  }));
                }}
                onFilterMission={(uuid, title, ids) =>
                  setMissionFilter({
                    uuid,
                    title,
                    blueprintIds: new Set(ids),
                  })
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </PageMotion>
  );
}
