import { AlertCircle, X } from "lucide-react";
import type { JournalAmbiguousLink } from "@/features/blueprints/blueprints.match.lib";

export interface JournalMatchIssuesProps {
  unmatchedProductNames: string[];
  ambiguousLinks?: JournalAmbiguousLink[];
  /** IDs résolus mais absents du catalogue Wiki chargé. */
  missingCatalogIds?: string[];
  journalProductCount?: number;
  uniqueBlueprintIdCount?: number;
  /** Affiche en mode panneau complet (dans un Sheet). */
  fullPanel?: boolean;
  /** Ferme la bannière compacte. */
  onDismiss?: () => void;
  /** Ouvre le panneau de détails. */
  onOpen?: () => void;
}

/**
 * Bannière compacte 1 ligne → ouvre le Sheet de détails.
 */
export function JournalMatchIssuesBanner({
  unmatchedProductNames,
  ambiguousLinks = [],
  journalProductCount = 0,
  uniqueBlueprintIdCount = 0,
  onDismiss,
  onOpen,
}: JournalMatchIssuesProps) {
  const hasUnmatched = unmatchedProductNames.length > 0;
  const hasAmbiguous = ambiguousLinks.length > 0;
  const surplusNames =
    journalProductCount > uniqueBlueprintIdCount
      ? journalProductCount - uniqueBlueprintIdCount
      : 0;

  if (!hasUnmatched && !hasAmbiguous && surplusNames === 0) return null;

  const parts: string[] = [];
  if (hasUnmatched) parts.push(`${unmatchedProductNames.length} sans ID`);
  if (surplusNames > 0)
    parts.push(`${surplusNames} doublon${surplusNames > 1 ? "s" : ""}`);
  if (hasAmbiguous)
    parts.push(
      `${ambiguousLinks.length} ID ambigu${ambiguousLinks.length > 1 ? "s" : ""}`,
    );

  return (
    <div
      className="mx-3 mb-2 flex shrink-0 items-center gap-2 rounded border border-amber-500/30 bg-amber-500/8 px-2.5 py-1.5 text-xs"
      data-no-window-drag
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      <span className="min-w-0 flex-1 truncate text-amber-100/80">
        Liaison journal — {parts.join(" · ")}
      </span>
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 text-amber-300/80 underline-offset-2 hover:text-amber-200 hover:underline"
        >
          Détails
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Contenu complet affiché dans le Sheet de détails.
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

  const ambiguousNameCount = ambiguousLinks.reduce(
    (sum, g) => sum + g.productNames.length,
    0,
  );

  return (
    <div className="space-y-4 text-xs">
      <p className="leading-relaxed text-muted-foreground">
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
        <div>
          <p className="mb-1 font-medium text-foreground/90">
            {unmatchedProductNames.length} nom
            {unmatchedProductNames.length > 1 ? "s" : ""} sans aucun ID :
          </p>
          <ul className="max-h-40 list-inside list-disc overflow-y-auto pl-1 text-foreground">
            {unmatchedProductNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {hasAmbiguous && (
        <div>
          <p className="mb-1 font-medium text-foreground/90">
            {ambiguousLinks.length} ID partagé
            {ambiguousLinks.length > 1 ? "s" : ""} par plusieurs noms (
            {ambiguousNameCount} entrées) — à vérifier :
          </p>
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {ambiguousLinks.map((group) => (
              <li
                key={group.catalogBlueprintId}
                className="rounded border border-amber-500/20 bg-black/20 px-2 py-1.5"
              >
                <p className="mb-1 break-all font-mono text-[10px] text-amber-200/90">
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
          <ul className="max-h-32 list-inside list-disc overflow-y-auto pl-1 font-mono text-[10px] text-foreground/80">
            {missingCatalogIds.map((id) => (
              <li key={id} className="break-all">
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
