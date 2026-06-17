import { cn } from "@/lib/utils";

export const PAINTS_TOOLBAR =
  "settings-section mb-3 flex shrink-0 flex-col gap-3 overflow-hidden p-3";

export const PAINTS_GRID =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function paintFilterChip(active: boolean): string {
  return cn(
    "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
    active
      ? "border-primary/40 bg-primary/15 text-primary"
      : "border-border/50 bg-background/20 text-muted-foreground hover:border-primary/25 hover:text-foreground",
  );
}
