import { Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
