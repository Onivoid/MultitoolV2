import { StatHintTooltip } from "@/features/game-stats/components/StatHintTooltip";
import type { StatSummaryItem } from "@/features/game-stats/gameStats.types";
import { cn } from "@/lib/utils";

export interface StatsKpiTileProps {
  item: StatSummaryItem;
  className?: string;
}

export function StatsKpiTile({ item, className }: StatsKpiTileProps) {
  return (
    <section
      className={cn(
        "settings-section flex flex-col justify-center px-3 py-2",
        className,
      )}
      data-no-window-drag
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{item.label}</span>
          {item.hint ? <StatHintTooltip label={item.label} hint={item.hint} /> : null}
        </span>
      </div>
      <p className="mt-0.5 truncate text-base font-semibold tabular-nums leading-tight">
        {item.value}
      </p>
    </section>
  );
}
