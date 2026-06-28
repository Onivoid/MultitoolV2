import { Bookmark, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureSearchField } from "@/shared/components/FeatureSearchField";
import type { BlueprintOwnedFilter } from "@/features/blueprints/blueprints.catalog.types";
import { cn } from "@/lib/utils";

export interface BlueprintsCatalogTopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  ownedFilter: BlueprintOwnedFilter;
  onOwnedFilterChange: (f: BlueprintOwnedFilter) => void;
  advancedFilterCount?: number;
  onOpenAdvancedFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export function BlueprintsCatalogTopBar({
  searchQuery,
  onSearchChange,
  ownedFilter,
  onOwnedFilterChange,
  advancedFilterCount = 0,
  onOpenAdvancedFilters,
  filteredCount,
  totalCount,
}: BlueprintsCatalogTopBarProps) {
  return (
    <section
      className="settings-section shrink-0 space-y-3 px-3 py-3"
      data-no-window-drag
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <FeatureSearchField
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Rechercher un blueprint…"
          className="min-w-0 flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ToggleBtn
            active={ownedFilter === "owned"}
            onClick={() =>
              onOwnedFilterChange(ownedFilter === "owned" ? "all" : "owned")
            }
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            Possédés
          </ToggleBtn>
          <ToggleBtn
            active={ownedFilter === "wishlist"}
            onClick={() =>
              onOwnedFilterChange(
                ownedFilter === "wishlist" ? "all" : "wishlist",
              )
            }
            icon={<Bookmark className="h-3.5 w-3.5" />}
          >
            Liste de suivi
          </ToggleBtn>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 border-primary/20 bg-primary/10 text-xs",
              advancedFilterCount > 0 && "border-primary/40",
            )}
            onClick={onOpenAdvancedFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtres avancés
            {advancedFilterCount > 0 && (
              <span className="text-primary">({advancedFilterCount})</span>
            )}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        <span className="text-foreground/90">
          {filteredCount} / {totalCount}
        </span>{" "}
        blueprints affichés
      </p>
    </section>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn(
        "h-8 gap-1.5 text-xs",
        !active && "border-primary/20 bg-primary/5",
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </Button>
  );
}
