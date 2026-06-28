/** Styles partagés pour les modales vaisseaux (overlay flou + panneau glass). */
export const SHIP_MODAL_OVERLAY = "bg-black/50 backdrop-blur-md dark:bg-black/65";

export const SHIP_MODAL_CONTENT =
  "glass-surface gap-0 overflow-hidden bg-background/50 p-0 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:shadow-black/30";

/** Titres de section (lisibles, accent discret plutôt que primary pur). */
export const SHIP_MODAL_SECTION_TITLE =
  "text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/90";

/** Titres de sous-groupe (ex. catégories loadout). */
export const SHIP_MODAL_GROUP_TITLE =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/90";

/** Carte / bloc conteneur — bordure neutre très légère. */
export const SHIP_MODAL_CARD =
  "rounded-lg border border-border/30 bg-foreground/[0.02] dark:border-white/[0.06] dark:bg-white/[0.03]";

/** Élément interne (ligne de composant, stat, prix…). */
export const SHIP_MODAL_INNER =
  "rounded-md border border-border/25 bg-foreground/[0.015] dark:border-white/[0.05] dark:bg-white/[0.02]";

/** Séparateurs horizontaux. */
export const SHIP_MODAL_DIVIDER = "border-border/25 dark:border-white/[0.06]";

/** Cellule sticky du tableau comparateur (glass, pas de fond opaque). */
export const SHIP_COMPARE_STICKY_CELL =
  "sticky left-0 z-10 bg-white/[0.1] backdrop-blur-md dark:bg-black/20";

/** Libellé de ligne dans le tableau comparateur. */
export const SHIP_COMPARE_ROW_LABEL = "text-xs font-medium text-foreground/90";

/** Valeur dans le tableau comparateur. */
export const SHIP_COMPARE_CELL_VALUE =
  "px-2 py-2 text-sm font-medium tabular-nums text-foreground";
