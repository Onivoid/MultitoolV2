import { cn } from "@/lib/utils";

export const SHIPS_TOOLBAR =
  "settings-section mb-3 flex shrink-0 flex-col gap-3 overflow-hidden p-4";

export const SHIPS_GRID =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

export const SHIPS_COMPARE_BANNER =
  "sticky top-0 z-30 shrink-0 border border-primary/30 bg-primary/10 px-4 py-3 shadow-sm backdrop-blur-sm";

export function shipCompareSlot(active: boolean, disabled: boolean): string {
  return cn(
    "inline-flex items-center justify-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
    disabled && "cursor-not-allowed opacity-40",
    active
      ? "border-primary bg-primary/20 text-primary"
      : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground",
  );
}

export function shipStatGroupTitle(): string {
  return "text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";
}

export function shipStatValue(emphasis = false): string {
  return cn(
    "text-sm font-semibold tabular-nums",
    emphasis ? "text-primary" : "text-foreground",
  );
}

export function shipStatLabel(): string {
  return "text-[11px] text-muted-foreground";
}

export function compareBestCell(): string {
  return "rounded-md bg-emerald-500/15 font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
}
