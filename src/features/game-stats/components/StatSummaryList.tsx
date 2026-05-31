import type { StatSummaryItem } from "@/features/game-stats/gameStats.types";
import { StatRow } from "@/features/game-stats/components/StatRow";

export interface StatSummaryListProps {
  items: StatSummaryItem[];
}

export function StatSummaryList({ items }: StatSummaryListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      {items.map((item) => (
        <StatRow
          key={item.label}
          label={item.label}
          value={item.value}
          hint={item.hint}
        />
      ))}
    </div>
  );
}
