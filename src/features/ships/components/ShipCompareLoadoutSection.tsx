import { ChevronRight, Loader2 } from "lucide-react";
import { LoadoutEntryList } from "@/features/ships/components/LoadoutEntryList";
import { shipDisplayName } from "@/features/ships/ships.catalog.lib";
import {
  collectCompareLoadoutGroups,
  totalLoadoutItemCount,
} from "@/features/ships/ships.loadout.lib";
import type { VehicleDetail, VehicleSummary } from "@/features/ships/ships.types";
import {
  SHIP_MODAL_CARD,
  SHIP_MODAL_DIVIDER,
  SHIP_MODAL_GROUP_TITLE,
  SHIP_MODAL_SECTION_TITLE,
} from "@/features/ships/ships.modal.lib";
import { cn } from "@/lib/utils";

interface ShipCompareLoadoutSectionProps {
  ships: VehicleSummary[];
  details: Map<string, VehicleDetail>;
}

export function ShipCompareLoadoutSection({
  ships,
  details,
}: ShipCompareLoadoutSectionProps) {
  const allLoaded = ships.every((ship) => details.has(ship.uuid));
  const portsByShip = ships.map((ship) => details.get(ship.uuid)?.ports ?? []);
  const compareGroups = collectCompareLoadoutGroups(portsByShip);
  const totalItems = totalLoadoutItemCount(
    compareGroups.map((group) => ({ items: group.itemsByShip.flat() })),
  );

  if (!allLoaded) {
    return (
      <section className={cn("mt-6 border-t pt-5", SHIP_MODAL_DIVIDER)}>
        <h3 className={cn("mb-4", SHIP_MODAL_SECTION_TITLE)}>
          Équipement d&apos;usine
        </h3>
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de l&apos;équipement…
        </div>
      </section>
    );
  }

  if (compareGroups.length === 0) {
    return (
      <section className={cn("mt-6 border-t pt-5", SHIP_MODAL_DIVIDER)}>
        <h3 className={cn("mb-4", SHIP_MODAL_SECTION_TITLE)}>
          Équipement d&apos;usine
        </h3>
        <p className="text-xs text-muted-foreground">Équipement non disponible.</p>
      </section>
    );
  }

  const columnClass =
    ships.length >= 4
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      : ships.length === 3
        ? "grid-cols-1 md:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className={cn("mt-6 border-t pt-5", SHIP_MODAL_DIVIDER)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className={SHIP_MODAL_SECTION_TITLE}>Équipement d&apos;usine</h3>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {totalItems} composant{totalItems > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {compareGroups.map(({ group, itemsByShip }) => {
          const groupCount = itemsByShip.reduce(
            (sum, items) => sum + items.reduce((inner, item) => inner + item.count, 0),
            0,
          );

          return (
            <details key={group} className={cn(SHIP_MODAL_CARD, "group p-3")}>
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center justify-between gap-3",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  <span className={SHIP_MODAL_GROUP_TITLE}>{group}</span>
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {groupCount}
                </span>
              </summary>

              <div
                className={cn(
                  "mt-3 grid gap-3 border-t border-border/20 pt-3",
                  columnClass,
                )}
              >
                {ships.map((ship, index) => (
                  <div key={ship.uuid} className="min-w-0">
                    <p className="mb-2 truncate text-[11px] font-semibold text-foreground/80">
                      {shipDisplayName(ship)}
                    </p>
                    <LoadoutEntryList items={itemsByShip[index] ?? []} />
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
