import type { CacheFolder } from "@/features/cache/cache.service";

/** Nombre max de dossiers affichés dans le widget (liste filtrée). */
export const CACHE_WIDGET_LIST_LIMIT = 8;

export function filterCacheFolders(
  folders: CacheFolder[],
  query: string,
): CacheFolder[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return folders;
  }
  return folders.filter(
    (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q),
  );
}
