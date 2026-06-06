/** Conteneur racine d'une page (occupe tout l'espace routeur). */
export const PAGE_ROOT = "flex h-full min-h-0 w-full flex-col";

/** Marge basse standard pour ne pas passer sous le dock (overlay fixed z-100). */
export const DOCK_SAFE_PADDING = "pb-20";

/** Zone scrollable interne d'une page (padding bas pour le dock en overlay). */
export const PAGE_SCROLL =
  "app-scroll-root min-h-0 flex-1 overflow-x-hidden overflow-y-auto w-full pb-20";

/** Centrage pour états vides / chargement. */
export const PAGE_CENTER =
  "flex min-h-0 flex-1 w-full flex-col items-center justify-center";
