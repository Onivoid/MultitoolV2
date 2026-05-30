import { ArrowUpDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureSearchField } from "@/shared/components/FeatureSearchField";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BLUEPRINT_SORT_OPTIONS,
  formatBlueprintOwner,
  getBlueprintSortLabel,
  type BlueprintSortKey,
} from "@/features/blueprints/blueprints.lib";

const ALL_OWNERS_VALUE = "__all__";

interface BlueprintsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortKey: BlueprintSortKey;
  onSortChange: (key: BlueprintSortKey) => void;
  ownerFilter: string;
  onOwnerFilterChange: (owner: string) => void;
  availableOwners: string[];
  filteredCount: number;
  totalCount: number;
}

export function BlueprintsToolbar({
  searchQuery,
  onSearchChange,
  sortKey,
  onSortChange,
  ownerFilter,
  onOwnerFilterChange,
  availableOwners,
  filteredCount,
  totalCount,
}: BlueprintsToolbarProps) {
  const isFiltering =
    searchQuery.trim().length > 0 || ownerFilter.trim().length > 0;
  const countLabel =
    isFiltering && filteredCount !== totalCount
      ? `${filteredCount} / ${totalCount} schémas`
      : `${totalCount} schéma${totalCount !== 1 ? "s" : ""}`;

  const selectValue = ownerFilter.trim() || ALL_OWNERS_VALUE;

  return (
    <section
      className="settings-section my-3 flex w-full shrink-0 flex-col gap-3 overflow-hidden p-3 lg:flex-row lg:items-center"
      data-no-window-drag
    >
      <div className="min-w-0 flex-1 lg:max-w-lg">
        <FeatureSearchField
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Rechercher un schéma…"
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:ml-auto">
        {availableOwners.length > 0 && (
          <Select
            value={selectValue}
            onValueChange={(v) =>
              onOwnerFilterChange(v === ALL_OWNERS_VALUE ? "" : v)
            }
          >
            <SelectTrigger
              className={cn(
                "h-10 w-full justify-start gap-2 border-primary/20 bg-primary/10 px-2 shadow-none sm:w-[11rem]",
                "[&>span]:line-clamp-none [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:text-left",
                "[&>svg:last-child]:ml-auto [&>svg:last-child]:shrink-0",
              )}
              aria-label="Filtrer par compte"
              data-no-window-drag
            >
              <User className="h-4 w-4 shrink-0 text-primary" />
              <SelectValue placeholder="Tous les comptes" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={ALL_OWNERS_VALUE}>Tous les comptes</SelectItem>
              {availableOwners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {formatBlueprintOwner(owner)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 gap-2 border-primary/20 bg-primary/10 px-3 text-xs font-medium shadow-none sm:text-sm",
              )}
              data-no-window-drag
            >
              <ArrowUpDown className="h-4 w-4 shrink-0" />
              <span className="max-w-[140px] truncate sm:max-w-none">
                {getBlueprintSortLabel(sortKey)}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuRadioGroup
              value={sortKey}
              onValueChange={(v) => onSortChange(v as BlueprintSortKey)}
            >
              {BLUEPRINT_SORT_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.key} value={opt.key}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {countLabel}
        </span>
      </div>
    </section>
  );
}
