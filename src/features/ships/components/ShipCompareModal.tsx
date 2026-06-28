import { Fragment } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ShipCompareLoadoutSection } from "@/features/ships/components/ShipCompareLoadoutSection";
import { compareBestIndices } from "@/features/ships/ships.compare.lib";
import { shipDisplayName } from "@/features/ships/ships.catalog.lib";
import { formatStat } from "@/features/ships/ships.lib";
import {
  SHIP_COMPARE_STICKY_CELL,
  SHIP_COMPARE_ROW_LABEL,
  SHIP_COMPARE_CELL_VALUE,
  SHIP_MODAL_CARD,
  SHIP_MODAL_CONTENT,
  SHIP_MODAL_DIVIDER,
  SHIP_MODAL_OVERLAY,
  SHIP_MODAL_SECTION_TITLE,
} from "@/features/ships/ships.modal.lib";
import { compareBestCell } from "@/features/ships/ships.ui";
import type { VehicleDetail, VehicleSummary } from "@/features/ships/ships.types";
import { formatAuecCompact } from "@/features/game-stats/gameStats.lib";
import { cn } from "@/lib/utils";

interface CompareRow {
  label: string;
  section: string;
  higherIsBetter?: boolean;
  lowerIsBetter?: boolean;
  getNumeric?: (ship: VehicleSummary, detail?: VehicleDetail) => number | null;
  getValue: (ship: VehicleSummary, detail?: VehicleDetail) => string;
}

const COMPARE_SECTIONS: { id: string; title: string; rows: CompareRow[] }[] = [
  {
    id: "mobility",
    title: "Mobilité",
    rows: [
      {
        label: "Cargo (SCU)",
        section: "mobility",
        higherIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.cargoCapacity ?? null,
        getValue: (s: VehicleSummary) => formatStat(s.cargoCapacity),
      },
      {
        label: "Vitesse SCM",
        section: "mobility",
        higherIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.speedScm ?? null,
        getValue: (s: VehicleSummary) => formatStat(s.speedScm, " m/s"),
      },
      {
        label: "Vitesse boost",
        section: "mobility",
        higherIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.speedMax ?? null,
        getValue: (s: VehicleSummary) => formatStat(s.speedMax, " m/s"),
      },
      {
        label: "Équipage max",
        section: "mobility",
        higherIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.crewMax ?? null,
        getValue: (s: VehicleSummary) => formatStat(s.crewMax),
      },
    ],
  },
  {
    id: "combat",
    title: "Combat & survie",
    rows: [
      {
        label: "Points de vie",
        section: "combat",
        higherIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.health ?? null,
        getValue: (s: VehicleSummary) => formatStat(s.health),
      },
      {
        label: "Bouclier",
        section: "combat",
        higherIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.shieldHp ?? null,
        getValue: (s: VehicleSummary) => formatStat(s.shieldHp),
      },
      {
        label: "DPS pilote",
        section: "combat",
        higherIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.pilotDps ?? null,
        getValue: (s: VehicleSummary) => formatStat(s.pilotDps),
      },
    ],
  },
  {
    id: "dimensions",
    title: "Dimensions",
    rows: [
      {
        label: "Longueur",
        section: "dimensions",
        getValue: (_s: VehicleSummary, d?: VehicleDetail) =>
          d ? formatStat(d.dimensions.length, " m") : "…",
      },
      {
        label: "Largeur",
        section: "dimensions",
        getValue: (_s: VehicleSummary, d?: VehicleDetail) =>
          d ? formatStat(d.dimensions.width, " m") : "…",
      },
      {
        label: "Hauteur",
        section: "dimensions",
        getValue: (_s: VehicleSummary, d?: VehicleDetail) =>
          d ? formatStat(d.dimensions.height, " m") : "…",
      },
    ],
  },
  {
    id: "economy",
    title: "Économie",
    rows: [
      {
        label: "Achat min.",
        section: "economy",
        lowerIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.purchaseMinPrice ?? null,
        getValue: (s: VehicleSummary) =>
          s.purchaseMinPrice != null ? formatAuecCompact(s.purchaseMinPrice) : "—",
      },
      {
        label: "Location min.",
        section: "economy",
        lowerIsBetter: true,
        getNumeric: (s: VehicleSummary) => s.rentalMinPrice ?? null,
        getValue: (s: VehicleSummary) =>
          s.rentalMinPrice != null ? formatAuecCompact(s.rentalMinPrice) : "—",
      },
    ],
  },
];

function bestIndices(
  ships: VehicleSummary[],
  details: Map<string, VehicleDetail>,
  row: CompareRow,
): Set<number> {
  if (!row.getNumeric) return new Set();
  const values = ships.map((ship) => row.getNumeric!(ship, details.get(ship.uuid)));
  return compareBestIndices(values, {
    lowerIsBetter: row.lowerIsBetter,
  });
}

interface ShipCompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ships: VehicleSummary[];
  details: Map<string, VehicleDetail>;
  onRemove: (uuid: string) => void;
  onClear: () => void;
  onOpenDetail: (uuid: string) => void;
}

export function ShipCompareModal({
  open,
  onOpenChange,
  ships,
  details,
  onRemove,
  onClear,
  onOpenDetail,
}: ShipCompareModalProps) {
  if (ships.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={SHIP_MODAL_OVERLAY}
        className={cn(
          SHIP_MODAL_CONTENT,
          "flex max-h-[92vh] max-w-[min(96vw,1400px)] flex-col",
        )}
        data-no-window-drag
      >
        <DialogHeader
          className={cn(
            "shrink-0 border-b px-6 py-4 text-left",
            SHIP_MODAL_DIVIDER,
            "bg-foreground/[0.02]",
          )}
        >
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle>Comparateur VS</DialogTitle>
              <DialogDescription>
                {ships.length} vaisseau{ships.length > 1 ? "x" : ""} — vert = meilleur
                lorsqu&apos;il y a une différence
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 text-xs"
              onClick={onClear}
            >
              Tout effacer
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          <div className={cn(SHIP_MODAL_CARD, "overflow-x-auto p-3")}>
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className={cn("border-b", SHIP_MODAL_DIVIDER)}>
                  <th
                    className={cn(SHIP_COMPARE_STICKY_CELL, "w-36 py-2 pr-3 text-left")}
                  />
                  {ships.map((ship) => {
                    const detailLoading = !details.has(ship.uuid);
                    return (
                      <th key={ship.uuid} className="min-w-[140px] px-2 py-2 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="relative h-16 overflow-hidden rounded-md bg-foreground/[0.03] ring-1 ring-border/30">
                            {ship.thumbnailUrl ? (
                              <img
                                src={ship.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded bg-background/80 p-0.5 backdrop-blur-sm"
                              onClick={() => onRemove(ship.uuid)}
                              aria-label={`Retirer ${shipDisplayName(ship)}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="text-left text-sm font-semibold leading-tight text-foreground hover:text-primary"
                            onClick={() => onOpenDetail(ship.uuid)}
                          >
                            {shipDisplayName(ship)}
                          </button>
                          {detailLoading && <Skeleton className="h-3 w-20" />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARE_SECTIONS.map((section) => (
                  <Fragment key={section.id}>
                    <tr>
                      <td
                        colSpan={ships.length + 1}
                        className={cn("pt-3 pb-1", SHIP_MODAL_SECTION_TITLE)}
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => {
                      const bests = bestIndices(ships, details, row);
                      return (
                        <tr
                          key={row.label}
                          className={cn("border-b", SHIP_MODAL_DIVIDER)}
                        >
                          <td
                            className={cn(
                              SHIP_COMPARE_STICKY_CELL,
                              SHIP_COMPARE_ROW_LABEL,
                              "py-2 pr-3",
                            )}
                          >
                            {row.label}
                          </td>
                          {ships.map((ship, index) => {
                            const detail = details.get(ship.uuid);
                            const value = row.getValue(ship, detail);
                            const loading =
                              section.id === "dimensions" && !detail && value === "…";
                            return (
                              <td
                                key={ship.uuid}
                                className={cn(
                                  SHIP_COMPARE_CELL_VALUE,
                                  bests.has(index) && compareBestCell(),
                                  value === "—" && "font-normal text-foreground/50",
                                )}
                              >
                                {loading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                ) : (
                                  value
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <ShipCompareLoadoutSection ships={ships} details={details} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
