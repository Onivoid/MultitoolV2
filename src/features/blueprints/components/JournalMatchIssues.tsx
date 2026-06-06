import { AlertCircle } from "lucide-react";
import type { JournalAmbiguousLink } from "@/features/blueprints/blueprints.match.lib";

export interface JournalMatchIssuesProps {
  unmatchedProductNames: string[];
  ambiguousLinks?: JournalAmbiguousLink[];
  /** IDs résolus mais absents du catalogue Wiki chargé. */
  missingCatalogIds?: string[];
  journalProductCount?: number;
  uniqueBlueprintIdCount?: number;
}

/**
 * Affiche les écarts journal ↔ encyclopédie (noms sans ID, IDs partagés, hors catalogue).
 */
export function JournalMatchIssues({
  unmatchedProductNames,
  ambiguousLinks = [],
  missingCatalogIds = [],
  journalProductCount = 0,
  uniqueBlueprintIdCount = 0,
}: JournalMatchIssuesProps) {
  const hasUnmatched = unmatchedProductNames.length > 0;
  const hasAmbiguous = ambiguousLinks.length > 0;
  const hasMissingIds = missingCatalogIds.length > 0;
  const surplusNames =
    journalProductCount > uniqueBlueprintIdCount
      ? journalProductCount - uniqueBlueprintIdCount
      : 0;

  if (!hasUnmatched && !hasAmbiguous && !hasMissingIds && surplusNames === 0) {
    return null;
  }

  const ambiguousNameCount = ambiguousLinks.reduce(
    (sum, g) => sum + g.productNames.length,
    0,
  );

  return (
    <section
      className="settings-section mx-3 mb-2 shrink-0 border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs"
      data-no-window-drag
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-100/95">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
        Liaison journal → encyclopédie
      </div>
      <p className="mb-2 leading-relaxed text-muted-foreground">
        Les noms du Game.log peuvent être en{" "}
        <strong className="text-foreground/90">français</strong> (jeu traduit) ou en{" "}
        <strong className="text-foreground/90">anglais</strong> (jeu non traduit) : les
        deux passent par PolyTool (<code className="text-[10px]">global.ini</code>{" "}
        FR/EN) puis le catalogue Wiki.
        {journalProductCount > 0 && uniqueBlueprintIdCount > 0 && (
          <>
            <br />
            <span className="text-foreground/90">
              {journalProductCount} noms distincts
            </span>{" "}
            dans le log →{" "}
            <span className="text-foreground/90">{uniqueBlueprintIdCount} IDs</span>{" "}
            <code className="text-[10px]">bp_craft_*</code> uniques.
            {surplusNames > 0 && (
              <>
                {" "}
                Écart de <strong className="text-amber-200">{surplusNames}</strong> :
                dans <code className="text-[10px]">gamelog_blueprints.json</code>,
                plusieurs noms FR partagent le même{" "}
                <code className="text-[10px]">catalogBlueprintId</code> (ancien matching
                trop large). Rechargez la page : matching via PolyTool (FR → EN) puis
                noms anglais du catalogue Wiki, avec réécriture des liaisons.
              </>
            )}
          </>
        )}
      </p>

      {hasUnmatched && (
        <div className="mb-2">
          <p className="mb-1 font-medium text-foreground/90">
            {unmatchedProductNames.length} nom
            {unmatchedProductNames.length > 1 ? "s" : ""} sans aucun ID :
          </p>
          <ul className="max-h-32 list-inside list-disc overflow-y-auto pl-1 text-foreground">
            {unmatchedProductNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {hasAmbiguous && (
        <div className="mb-2">
          <p className="mb-1 font-medium text-foreground/90">
            {ambiguousLinks.length} ID partagé
            {ambiguousLinks.length > 1 ? "s" : ""} par plusieurs noms (
            {ambiguousNameCount} entrées) — à vérifier :
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {ambiguousLinks.map((group) => (
              <li
                key={group.catalogBlueprintId}
                className="rounded border border-amber-500/20 bg-black/20 px-2 py-1.5"
              >
                <p className="mb-1 font-mono text-[10px] text-amber-200/90 break-all">
                  {group.catalogBlueprintId}
                </p>
                <ul className="list-inside list-disc text-foreground/95">
                  {group.productNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasMissingIds && (
        <div>
          <p className="mb-1 font-medium text-foreground/90">
            {missingCatalogIds.length} ID absent
            {missingCatalogIds.length > 1 ? "s" : ""} du catalogue Wiki :
          </p>
          <ul className="max-h-28 list-inside list-disc overflow-y-auto pl-1 font-mono text-[10px] text-foreground/80">
            {missingCatalogIds.map((id) => (
              <li key={id} className="break-all">
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
