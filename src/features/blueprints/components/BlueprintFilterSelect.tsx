import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const BP_FILTER_SELECT_TRIGGER = cn(
  "flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 text-left text-xs shadow-none transition-colors sm:text-sm",
  "hover:border-primary/35 hover:bg-primary/15",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
  "disabled:pointer-events-none disabled:opacity-50",
);

export interface BlueprintFilterSelectOption {
  value: string;
  label: string;
}

export interface BlueprintFilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: BlueprintFilterSelectOption[];
  placeholder?: string;
  icon?: ReactNode;
  ariaLabel?: string;
  className?: string;
  /** Barre de recherche dans le menu (auto si > 12 options). */
  searchable?: boolean;
}

export function BlueprintFilterSelect({
  value,
  onValueChange,
  options,
  placeholder = "Choisir…",
  icon,
  ariaLabel,
  className,
  searchable: searchableProp,
}: BlueprintFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const searchable = searchableProp ?? options.length > 12;

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(BP_FILTER_SELECT_TRIGGER, className)}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          data-no-window-drag
        >
          {icon}
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          "z-[200] w-[var(--radix-popover-trigger-width)] min-w-[12rem] max-w-[min(100vw-2rem,22rem)] p-0",
          "border-primary/20 bg-popover/95 shadow-lg backdrop-blur-sm",
        )}
        onOpenAutoFocus={(e) => {
          if (searchable) e.preventDefault();
        }}
        data-no-window-drag
      >
        {searchable && (
          <div className="border-b border-primary/10 p-2">
            <label className="flex h-9 items-center gap-2 rounded-md border border-border/50 bg-background/60 px-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                aria-label="Filtrer les options"
                data-no-window-drag
              />
            </label>
          </div>
        )}
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="max-h-[min(16rem,50vh)] overflow-y-auto overscroll-contain p-1"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
              Aucun résultat
            </li>
          ) : (
            filteredOptions.map((o) => {
              const isSelected = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors sm:text-sm",
                      "hover:bg-primary/12",
                      isSelected && "bg-primary/15 font-medium text-foreground",
                    )}
                    onClick={() => {
                      onValueChange(o.value);
                      handleOpenChange(false);
                    }}
                    data-no-window-drag
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0 text-primary",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 leading-snug">{o.label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
