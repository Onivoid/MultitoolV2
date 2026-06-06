import type { BlueprintCatalogSummary } from "@/features/blueprints/blueprints.catalog.types";

let sessionCatalog: BlueprintCatalogSummary[] | null = null;
let inFlight: Promise<BlueprintCatalogSummary[]> | null = null;

/** Cache mémoire du catalogue pour la session (évite rechargements IPC). */
export function getSessionCatalog(): BlueprintCatalogSummary[] | null {
  return sessionCatalog;
}

export function setSessionCatalog(list: BlueprintCatalogSummary[]): void {
  sessionCatalog = list;
}

export function invalidateSessionCatalog(): void {
  sessionCatalog = null;
}

/** Déduplique les appels parallèles à `listFull`. */
export async function loadSessionCatalog(
  loader: () => Promise<BlueprintCatalogSummary[]>,
): Promise<BlueprintCatalogSummary[]> {
  if (sessionCatalog) {
    return sessionCatalog;
  }
  if (!inFlight) {
    inFlight = loader()
      .then((list) => {
        sessionCatalog = list;
        return list;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
