import { cn } from "@/lib/utils";

/** Section carte verre (aligné index.css `.settings-section`). */
export const BP_SECTION = "settings-section flex flex-col overflow-hidden";

export const BP_SECTION_HEADER =
  "settings-section-header flex items-start gap-2 px-3 py-2 pl-3";

export const BP_SECTION_FOOTER =
  "settings-section-footer px-3 py-2 text-[11px] text-muted-foreground";

export const BP_ICON_BOX =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10";

/** Toolbar page niveau (section autonome). */
export const BP_TOOLBAR =
  "settings-section flex shrink-0 flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:flex-wrap sm:items-center";

/** Barre d’outils à l’intérieur d’une section catalogue. */
export const BP_TOOLBAR_INNER =
  "flex shrink-0 flex-col gap-3 border-b border-primary/8 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center";

/** @deprecated Utiliser BlueprintFilterSelect / BP_FILTER_SELECT_TRIGGER */
export const BP_SELECT_TRIGGER =
  "h-10 border-primary/20 bg-primary/10 text-xs shadow-none sm:text-sm";

export const BP_ACTION_BTN =
  "h-10 shrink-0 gap-1.5 border-primary/20 bg-primary/10 px-3 text-xs font-medium shadow-none sm:text-sm";

export const BP_META_BADGE =
  "h-5 gap-1 px-1.5 text-[10px] font-normal border-primary/20 bg-primary/5";

export const BP_LIST_SCROLL =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2";

export const BP_EMPTY_STATE =
  "settings-section px-6 py-8 text-center text-sm text-muted-foreground";

export function bpFilterChip(active: boolean): string {
  return cn(
    "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
    active
      ? "border-primary/40 bg-primary/15 text-primary"
      : "border-border/50 bg-background/20 text-muted-foreground hover:border-primary/25 hover:text-foreground",
  );
}

export function bpCatalogRow(selected: boolean): string {
  return cn(
    "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
    selected
      ? "border-primary/40 bg-primary/10 shadow-[inset_3px_0_0_0_hsl(var(--primary)/0.55)]"
      : "border-border/35 bg-background/12 hover:border-primary/25 hover:bg-primary/5",
  );
}

/** Surbrillance contextuelle (BP d'origine dans l'explorateur mission) — distinct du style « possédé ». */
export function bpCatalogRowContext(): string {
  return cn(
    "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
    "border-amber-500/35 bg-amber-500/8 shadow-[inset_3px_0_0_0_hsl(var(--amber-500)/0.5)]",
    "hover:border-amber-500/45 hover:bg-amber-500/12",
  );
}

export function bpDetailBlock(): string {
  return "rounded-md border border-border/40 bg-background/15 px-2.5 py-2";
}

/** Carte ingrédient craft (grille type Wiki). */
export const BP_INGREDIENT_CARD =
  "settings-section flex flex-col overflow-hidden px-3 py-3";

export function bpSheetPanel(): string {
  return "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 text-sm";
}
