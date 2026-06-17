import { ExternalLink, Filter, Loader2, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { JurisdictionBadge } from "@/features/blueprints/components/JurisdictionBadge";
import { LegalityBadge } from "@/features/blueprints/components/LegalityBadge";
import { SystemBadge } from "@/features/blueprints/components/SystemBadge";
import { blueprintsCatalogService } from "@/features/blueprints/blueprints.catalog.service";
import {
  BP_ACTION_BTN,
  bpCatalogRow,
  bpCatalogRowContext,
  bpSheetPanel,
} from "@/features/blueprints/blueprints.ui";
import type { MissionDetailResult } from "@/features/blueprints/blueprints.catalog.types";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface MissionExplorerBodyProps {
  active: boolean;
  missionUuid: string;
  missionTitle?: string;
  directUnlockBlueprintId?: string | null;
  ownedIds?: Set<string>;
  onSelectBlueprint: (blueprintId: string) => void;
  onFilterMission: (missionUuid: string, title: string, blueprintIds: string[]) => void;
  onClose?: () => void;
}

function missionRankLabel(detail: MissionDetailResult): string | null {
  if (detail.minStandingName) return detail.minStandingName;
  if (detail.rankIndex != null) return `Rang ${detail.rankIndex}`;
  return null;
}

export function MissionExplorerBody({
  active,
  missionUuid,
  missionTitle: _missionTitle,
  directUnlockBlueprintId,
  ownedIds,
  onSelectBlueprint,
  onFilterMission,
  onClose,
}: MissionExplorerBodyProps) {
  const [detail, setDetail] = useState<MissionDetailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !missionUuid) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await blueprintsCatalogService.missionDetail(
          missionUuid,
          directUnlockBlueprintId ?? undefined,
        );
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, missionUuid, directUnlockBlueprintId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="px-3 py-6 text-center text-sm text-destructive">{error}</p>;
  }

  if (!detail) return null;

  const rankLabel = missionRankLabel(detail);

  return (
    <div className={bpSheetPanel()}>
      <div className="flex flex-wrap gap-1.5">
        {(detail.starSystems ?? []).map((s, i) => (
          <SystemBadge key={`sys-${s}-${i}`} name={s} />
        ))}
        {(detail.jurisdictions ?? []).map((j, i) => (
          <JurisdictionBadge key={`jur-${j}-${i}`} name={j} />
        ))}
        <LegalityBadge illegal={detail.illegal} />
      </div>
      {detail.missionGiver && (
        <p className="text-xs text-muted-foreground">
          Donneur : {detail.missionGiver}
          {detail.faction && ` · ${detail.faction}`}
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {rankLabel && <span>Rang requis : {rankLabel}</span>}
        {detail.shareable != null ? (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            Partageable : {detail.shareable ? "Oui" : "Non"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground/80">
            <Users className="h-3 w-3" />
            Partageable : Inconnu
          </span>
        )}
        {detail.missionType && <span>Type : {detail.missionType}</span>}
        {detail.timeToCompleteMinutes != null && (
          <span>~{Math.round(detail.timeToCompleteMinutes)} min</span>
        )}
      </div>
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Blueprints récompense ({detail.blueprintRewards.length})
        </p>
        <div className="flex flex-col gap-2">
          {detail.blueprintRewards.map((bp, i) => {
            const id = bp.blueprintId;
            if (!id) return null;
            const owned = ownedIds?.has(id) ?? false;
            const isContext = bp.isDirectUnlock;
            const rowClass = owned
              ? bpCatalogRow(true)
              : isContext
                ? bpCatalogRowContext()
                : bpCatalogRow(false);
            return (
              <button
                key={`${id}-${i}`}
                type="button"
                onClick={() => {
                  onSelectBlueprint(id);
                  onClose?.();
                }}
                className={rowClass}
              >
                <p className="text-sm font-semibold leading-snug">
                  {owned && (
                    <Check
                      className="mr-1 inline h-3.5 w-3.5 text-primary"
                      aria-hidden
                    />
                  )}
                  {bp.nameFr || bp.nameEn}
                  {owned && (
                    <span className="ml-1.5 text-[10px] font-normal text-primary">
                      possédé
                    </span>
                  )}
                </p>
                {bp.nameFr && bp.nameEn !== bp.nameFr && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {bp.nameEn}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 border-t border-primary/8 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(BP_ACTION_BTN, "h-9")}
          onClick={() => {
            const ids = detail.blueprintRewards
              .map((b) => b.blueprintId)
              .filter((x): x is string => Boolean(x));
            onFilterMission(detail.missionUuid, detail.title, ids);
            onClose?.();
          }}
        >
          <Filter className="h-3.5 w-3.5" />
          Filtrer le catalogue
        </Button>
        {detail.webUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(BP_ACTION_BTN, "h-9")}
            onClick={() =>
              void invokeCommand(TAURI_COMMANDS.openExternal, { url: detail.webUrl })
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Wiki
          </Button>
        )}
      </div>
    </div>
  );
}

export function MissionExplorerIcon() {
  return <Trophy className="h-3.5 w-3.5 text-primary" />;
}

/** Titre affiché dans le panneau (avant chargement API). */
export function missionExplorerTitle(
  missionTitle: string | undefined,
  fallback = "Mission",
): string {
  return missionTitle?.trim() || fallback;
}
