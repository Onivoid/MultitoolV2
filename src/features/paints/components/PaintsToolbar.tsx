import { Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FeatureSearchField } from "@/shared/components/FeatureSearchField";
import { BlueprintFilterSelect } from "@/features/blueprints/components/BlueprintFilterSelect";
import { PAINTS_TOOLBAR, paintFilterChip } from "@/features/paints/paints.ui";
import { cn } from "@/lib/utils";

interface PaintsToolbarProps {
  totalCount: number;
  filteredCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  eventChips: string[];
  activeEvent: string | null;
  onToggleEvent: (event: string) => void;
  onSelectEvent: (event: string | null) => void;
  manufacturerOptions: string[];
  activeManufacturer: string | null;
  onSelectManufacturer: (value: string | null) => void;
  hideSkins: boolean;
  onHideSkinsChange: (value: boolean) => void;
}

export function PaintsToolbar({
  totalCount,
  filteredCount,
  search,
  onSearchChange,
  eventChips,
  activeEvent,
  onToggleEvent,
  onSelectEvent,
  manufacturerOptions,
  activeManufacturer,
  onSelectManufacturer,
  hideSkins,
  onHideSkinsChange,
}: PaintsToolbarProps) {
  return (
    <section className={PAINTS_TOOLBAR} data-no-window-drag>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-medium">
          <Palette className="h-3.5 w-3.5 text-primary" />
          Peintures
        </Badge>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Encyclopédie des livrées vaisseaux
          {totalCount > 0 && (
            <span className="text-foreground/80">
              {" "}
              ·{" "}
              {filteredCount === totalCount
                ? totalCount
                : `${filteredCount} / ${totalCount}`}
            </span>
          )}
        </span>
      </div>

      <FeatureSearchField
        value={search}
        onChange={onSearchChange}
        placeholder="Rechercher par vaisseau ou nom de peinture…"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        {manufacturerOptions.length > 0 && (
          <div className="min-w-[12rem] shrink-0 sm:w-56">
            <p className="mb-1 text-[10px] uppercase text-muted-foreground">Marque</p>
            <BlueprintFilterSelect
              value={activeManufacturer ?? "__all__"}
              onValueChange={(v) => onSelectManufacturer(v === "__all__" ? null : v)}
              options={[
                { value: "__all__", label: "Toutes les marques" },
                ...manufacturerOptions.map((name) => ({
                  value: name,
                  label: name,
                })),
              ]}
              className="w-full max-w-none"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pb-0.5">
          <Checkbox
            id="hide-skins"
            checked={hideSkins}
            onCheckedChange={(v) => onHideSkinsChange(v === true)}
            data-no-window-drag
          />
          <Label
            htmlFor="hide-skins"
            className="cursor-pointer text-xs text-muted-foreground"
          >
            Masquer les skins
          </Label>
        </div>
      </div>

      {eventChips.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-[12rem] shrink-0 sm:w-56">
            <p className="mb-1 text-[10px] uppercase text-muted-foreground">
              Événement
            </p>
            <BlueprintFilterSelect
              value={activeEvent ?? "__all__"}
              onValueChange={(v) => onSelectEvent(v === "__all__" ? null : v)}
              options={[
                { value: "__all__", label: "Tous les événements" },
                ...eventChips.map((event) => ({ value: event, label: event })),
              ]}
              className="w-full max-w-none"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {eventChips.map((event) => (
              <button
                key={event}
                type="button"
                className={cn(paintFilterChip(activeEvent === event))}
                onClick={() => onToggleEvent(event)}
                data-no-window-drag
              >
                {event}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
