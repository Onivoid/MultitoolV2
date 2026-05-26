import { ArrowUpDown, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    type BlueprintSortKey,
    getBlueprintSortLabel,
} from "@/lib/blueprintList";

const ALL_OWNERS_VALUE = "__all__";

interface BlueprintListToolbarProps {
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

export default function BlueprintListToolbar({
    searchQuery,
    onSearchChange,
    sortKey,
    onSortChange,
    ownerFilter,
    onOwnerFilterChange,
    availableOwners,
    filteredCount,
    totalCount,
}: BlueprintListToolbarProps) {
    const isFiltering =
        searchQuery.trim().length > 0 || ownerFilter.trim().length > 0;
    const countLabel =
        isFiltering && filteredCount !== totalCount
            ? `${filteredCount} / ${totalCount} schémas`
            : `${totalCount} schéma${totalCount !== 1 ? "s" : ""}`;

    const selectValue = ownerFilter.trim() || ALL_OWNERS_VALUE;

    return (
        <div className="mt-1 flex shrink-0 flex-col gap-3 pt-4 pr-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
                <Input
                    type="search"
                    placeholder="Rechercher un schéma…"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="border-border/60 bg-background/30 pl-10 pr-10"
                />
                {searchQuery.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        onClick={() => onSearchChange("")}
                        aria-label="Effacer la recherche"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
                {availableOwners.length > 0 && (
                    <Select
                        value={selectValue}
                        onValueChange={(v) =>
                            onOwnerFilterChange(
                                v === ALL_OWNERS_VALUE ? "" : v
                            )
                        }
                    >
                        <SelectTrigger
                            className="h-9 w-[min(100%,11rem)] gap-2 bg-background/30 sm:w-[11rem]"
                            aria-label="Filtrer par compte"
                        >
                            <User className="h-4 w-4 shrink-0 opacity-70" />
                            <SelectValue placeholder="Tous les comptes" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value={ALL_OWNERS_VALUE}>
                                Tous les comptes
                            </SelectItem>
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
                            className="gap-2 bg-background/30"
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
                            onValueChange={(v) =>
                                onSortChange(v as BlueprintSortKey)
                            }
                        >
                            {BLUEPRINT_SORT_OPTIONS.map((opt) => (
                                <DropdownMenuRadioItem
                                    key={opt.key}
                                    value={opt.key}
                                >
                                    {opt.label}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <span className="whitespace-nowrap text-sm text-muted-foreground">
                    {countLabel}
                </span>
            </div>
        </div>
    );
}
