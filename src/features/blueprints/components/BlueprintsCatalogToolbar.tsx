import { Filter, User } from "lucide-react";
import { FeatureSearchField } from "@/shared/components/FeatureSearchField";
import { BlueprintFilterSelect } from "@/features/blueprints/components/BlueprintFilterSelect";
import { formatBlueprintOwner } from "@/features/blueprints/blueprints.lib";
import type { BlueprintOwnedFilter } from "@/features/blueprints/blueprints.catalog.types";

const ALL_OWNERS_VALUE = "__all__";

const OWNED_FILTER_OPTIONS: { value: BlueprintOwnedFilter; label: string }[] = [
  { value: "all", label: "Tous les blueprints" },
  { value: "owned", label: "Débloqués (journal)" },
  { value: "not_owned", label: "Non débloqués" },
];

export interface BlueprintsCatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  ownedFilter: BlueprintOwnedFilter;
  onOwnedFilterChange: (f: BlueprintOwnedFilter) => void;
  filteredCount: number;
  totalCount: number;
  ownedCount: number;
  journalProductCount?: number;
  matchedProductCount?: number;
  uniqueBlueprintIdCount?: number;
  uniqueOwners?: string[];
  ownerFilter?: string;
  onOwnerFilterChange?: (owner: string) => void;
}

export function BlueprintsCatalogToolbar({
  searchQuery,
  onSearchChange,
  ownedFilter,
  onOwnedFilterChange,
  filteredCount,
  totalCount,
  ownedCount,
  journalProductCount,
  matchedProductCount,
  uniqueBlueprintIdCount,
  uniqueOwners = [],
  ownerFilter = "",
  onOwnerFilterChange,
}: BlueprintsCatalogToolbarProps) {
  const journalGap =
    journalProductCount != null &&
    uniqueBlueprintIdCount != null &&
    journalProductCount > uniqueBlueprintIdCount
      ? journalProductCount - uniqueBlueprintIdCount
      : 0;
  const unmatchedNames =
    journalProductCount != null &&
    matchedProductCount != null &&
    matchedProductCount < journalProductCount
      ? journalProductCount - matchedProductCount
      : 0;

  const ownerOptions = [
    { value: ALL_OWNERS_VALUE, label: "Tous les comptes" },
    ...uniqueOwners.map((o) => ({
      value: o,
      label: formatBlueprintOwner(o),
    })),
  ];

  return (
    <div
      className="flex shrink-0 flex-col gap-3 border-b border-primary/8 px-3 py-3"
      data-no-window-drag
    >
      <FeatureSearchField
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Rechercher un blueprint…"
        className="w-full"
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {uniqueOwners.length > 0 && onOwnerFilterChange && (
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Compte journal
            </p>
            <BlueprintFilterSelect
              value={ownerFilter.trim() || ALL_OWNERS_VALUE}
              onValueChange={(v) =>
                onOwnerFilterChange(v === ALL_OWNERS_VALUE ? "" : v)
              }
              options={ownerOptions}
              placeholder="Tous les comptes"
              icon={<User className="h-4 w-4 shrink-0 text-primary" />}
              ariaLabel="Filtrer par compte"
            />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Statut déblocage
          </p>
          <BlueprintFilterSelect
            value={ownedFilter}
            onValueChange={(v) => onOwnedFilterChange(v as BlueprintOwnedFilter)}
            options={OWNED_FILTER_OPTIONS}
            icon={<Filter className="h-4 w-4 shrink-0 text-primary" />}
            ariaLabel="Filtrer par statut déblocage"
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground tabular-nums">
        <span className="text-foreground/90">
          {filteredCount} / {totalCount}
        </span>{" "}
        affichés · {ownedCount} débloqués
        {journalProductCount != null && journalProductCount > 0 && (
          <>
            {" "}
            · {matchedProductCount ?? ownedCount}/{journalProductCount} noms journal
            {unmatchedNames > 0 && (
              <span className="text-amber-400/90"> ({unmatchedNames} sans ID)</span>
            )}
            {journalGap > 0 && (
              <span className="text-amber-400/90">
                {" "}
                · {uniqueBlueprintIdCount ?? ownedCount} IDs ({journalGap} doublon
                {journalGap > 1 ? "s" : ""})
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}
