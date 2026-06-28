import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadoutEntryRow } from "@/features/ships/components/LoadoutEntryList";
import { groupPortsByType, totalLoadoutItemCount } from "@/features/ships/ships.loadout.lib";
import type { VehiclePortSummary } from "@/features/ships/ships.types";
import {
  SHIP_MODAL_CARD,
  SHIP_MODAL_GROUP_TITLE,
  SHIP_MODAL_SECTION_TITLE,
} from "@/features/ships/ships.modal.lib";
import { cn } from "@/lib/utils";

interface ShipLoadoutPanelProps {
  ports: VehiclePortSummary[];
  loading?: boolean;
  columns?: 1 | 2 | 3;
  className?: string;
  emptyMessage?: string;
  showHeader?: boolean;
}

export function ShipLoadoutPanel({
  ports,
  loading = false,
  columns = 2,
  className,
  emptyMessage = "Données non disponibles (concept ou API).",
  showHeader = true,
}: ShipLoadoutPanelProps) {
  const groups = groupPortsByType(ports);
  const totalItems = totalLoadoutItemCount(groups);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de l&apos;équipement…
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={cn(SHIP_MODAL_CARD, "px-4 py-6 text-center text-xs text-muted-foreground")}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className={SHIP_MODAL_SECTION_TITLE}>
            Équipement d&apos;usine
          </h3>
          <Badge variant="secondary" className="text-[10px] tabular-nums">
            {totalItems} composant{totalItems > 1 ? "s" : ""}
          </Badge>
        </div>
      )}

      <div
        className={cn(
          "grid gap-3",
          columns === 1 && "grid-cols-1",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {groups.map(({ group, items }) => {
          const groupCount = items.reduce((sum, item) => sum + item.count, 0);
          return (
            <div key={group} className={cn(SHIP_MODAL_CARD, "p-3")}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className={SHIP_MODAL_GROUP_TITLE}>{group}</h4>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {groupCount}
                </span>
              </div>
              <ul className="space-y-2">
                {items.map((entry, index) => (
                  <LoadoutEntryRow key={`${entry.port.name}-${index}`} entry={entry} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
