import { GitCompare, Rocket, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatStat } from "@/features/ships/ships.lib";
import {
  formatProductionStatusLabel,
  isWikiPlaceholder,
  shipDisplayName,
} from "@/features/ships/ships.catalog.lib";
import {
  shipCompareSlot,
  shipStatGroupTitle,
  shipStatValue,
} from "@/features/ships/ships.ui";
import type { VehicleSummary } from "@/features/ships/ships.types";
import { formatAuecCompact } from "@/features/game-stats/gameStats.lib";
import { cn } from "@/lib/utils";

interface ShipCardProps {
  ship: VehicleSummary;
  compared: boolean;
  canAddCompare: boolean;
  onToggleCompare: (uuid: string) => void;
  onOpenDetail: (uuid: string) => void;
}

export function ShipCard({
  ship,
  compared,
  canAddCompare,
  onToggleCompare,
  onOpenDetail,
}: ShipCardProps) {
  const compareDisabled = !compared && !canAddCompare;

  return (
    <article
      className={cn(
        "settings-section group flex flex-col overflow-hidden transition-shadow",
        compared && "ring-1 ring-primary/40",
      )}
      data-no-window-drag
    >
      <button
        type="button"
        className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-primary/5 text-left"
        onClick={() => onOpenDetail(ship.uuid)}
      >
        {ship.thumbnailUrl ? (
          <img
            src={ship.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Rocket className="h-12 w-12 opacity-30" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
          <p className="line-clamp-2 text-base font-bold leading-tight">
            {shipDisplayName(ship)}
          </p>
          {ship.manufacturerName && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ship.manufacturerName}
            </p>
          )}
        </div>
        {formatProductionStatusLabel(ship.productionStatus) && (
          <Badge variant="secondary" className="absolute right-2 top-2 text-[10px]">
            {formatProductionStatusLabel(ship.productionStatus)}
          </Badge>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {ship.sizeClass != null && (
            <Badge variant="outline" className="text-[10px]">
              T{ship.sizeClass}
            </Badge>
          )}
          {ship.role && !isWikiPlaceholder(ship.role) && (
            <Badge variant="outline" className="text-[10px]">
              {ship.role}
            </Badge>
          )}
          {ship.career && !isWikiPlaceholder(ship.career) && (
            <Badge variant="secondary" className="text-[10px]">
              {ship.career}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatBlock label="Cargo" value={formatStat(ship.cargoCapacity, " SCU")} />
          <StatBlock label="SCM" value={formatStat(ship.speedScm)} />
          <StatBlock label="Boost" value={formatStat(ship.speedMax)} />
        </div>

        {(ship.purchaseMinPrice != null || ship.rentalMinPrice != null) && (
          <p className="text-xs text-muted-foreground">
            {ship.purchaseMinPrice != null && (
              <span>Achat {formatAuecCompact(ship.purchaseMinPrice)}</span>
            )}
            {ship.purchaseMinPrice != null && ship.rentalMinPrice != null && " · "}
            {ship.rentalMinPrice != null && (
              <span>Loc. {formatAuecCompact(ship.rentalMinPrice)}</span>
            )}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={() => onOpenDetail(ship.uuid)}
          >
            <Scale className="mr-1.5 h-3.5 w-3.5" />
            Fiche complète
          </Button>
          <button
            type="button"
            className={shipCompareSlot(compared, compareDisabled)}
            disabled={compareDisabled}
            onClick={() => onToggleCompare(ship.uuid)}
            title={compared ? "Retirer du VS" : "Comparer"}
          >
            <GitCompare className="h-3.5 w-3.5" />
            VS
          </button>
        </div>
      </div>
    </article>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
      <p className={shipStatGroupTitle()}>{label}</p>
      <p className={cn(shipStatValue(), "text-sm")}>{value}</p>
    </div>
  );
}
