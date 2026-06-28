import { Badge } from "@/components/ui/badge";
import { formatComponentClass } from "@/features/ships/ships.loadout.lib";
import type { LoadoutEntry } from "@/features/ships/ships.types";
import { SHIP_MODAL_INNER } from "@/features/ships/ships.modal.lib";
import { cn } from "@/lib/utils";

export function LoadoutBadges({ entry }: { entry: LoadoutEntry }) {
  const { port } = entry;
  const classLabel = formatComponentClass(port.itemClass);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
      {classLabel && (
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
        >
          {classLabel}
        </Badge>
      )}
      {port.itemGrade && (
        <Badge
          variant="outline"
          className="h-5 border-border/40 px-1.5 text-[10px] tabular-nums text-muted-foreground"
        >
          {port.itemGrade}
        </Badge>
      )}
      {port.itemSize != null && (
        <Badge
          variant="outline"
          className="h-5 border-border/40 px-1.5 text-[10px] tabular-nums text-muted-foreground"
        >
          S{port.itemSize}
        </Badge>
      )}
    </div>
  );
}

export function LoadoutEntryRow({ entry }: { entry: LoadoutEntry }) {
  const { port, count } = entry;
  const meta = [port.itemManufacturer].filter(Boolean);

  return (
    <li className={cn(SHIP_MODAL_INNER, "px-2.5 py-2")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-snug text-foreground">
          {port.itemName}
          {count > 1 && (
            <span className="ml-1.5 font-medium text-muted-foreground">× {count}</span>
          )}
        </p>
        <LoadoutBadges entry={entry} />
      </div>
      {meta.length > 0 && (
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {meta.join(" · ")}
        </p>
      )}
    </li>
  );
}

export function LoadoutEntryList({ items }: { items: LoadoutEntry[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">—</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((entry, index) => (
        <LoadoutEntryRow key={`${entry.port.name}-${index}`} entry={entry} />
      ))}
    </ul>
  );
}
