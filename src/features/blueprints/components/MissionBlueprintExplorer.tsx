import { ExternalLink, Filter, Loader2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import { JurisdictionBadge } from "@/features/blueprints/components/JurisdictionBadge";
import { blueprintsCatalogService } from "@/features/blueprints/blueprints.catalog.service";
import {
  BP_ACTION_BTN,
  bpCatalogRow,
  bpSheetPanel,
} from "@/features/blueprints/blueprints.ui";
import type { MissionDetailResult } from "@/features/blueprints/blueprints.catalog.types";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { cn } from "@/lib/utils";

export interface MissionExplorerBodyProps {
  active: boolean;
  missionUuid: string;
  missionTitle?: string;
  directUnlockBlueprintId?: string | null;
  onSelectBlueprint: (blueprintId: string) => void;
  onFilterMission: (missionUuid: string, title: string, blueprintIds: string[]) => void;
  onClose?: () => void;
}

export function MissionExplorerBody({
  active,
  missionUuid,
  missionTitle: _missionTitle,
  directUnlockBlueprintId,
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

  return (
    <div className={bpSheetPanel()}>
      <div className="flex flex-wrap gap-1.5">
        {(detail.starSystems ?? []).map((s, i) => (
          <BlueprintMetaBadge key={`sys-${s}-${i}`} variant="system">
            {s}
          </BlueprintMetaBadge>
        ))}
        {(detail.jurisdictions ?? []).map((j, i) => (
          <JurisdictionBadge key={`jur-${j}-${i}`} name={j} />
        ))}
      </div>
      {detail.missionGiver && (
        <p className="text-xs text-muted-foreground">
          Donneur : {detail.missionGiver}
          {detail.faction && ` · ${detail.faction}`}
        </p>
      )}
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Blueprints récompense ({detail.blueprintRewards.length})
        </p>
        <div className="flex flex-col gap-2">
          {detail.blueprintRewards.map((bp, i) => {
            const id = bp.blueprintId;
            if (!id) return null;
            return (
              <button
                key={`${id}-${i}`}
                type="button"
                onClick={() => {
                  onSelectBlueprint(id);
                  onClose?.();
                }}
                className={bpCatalogRow(bp.isDirectUnlock)}
              >
                <p className="text-sm font-semibold leading-snug">
                  {bp.nameFr || bp.nameEn}
                  {bp.isDirectUnlock && (
                    <span className="ml-1.5 text-[10px] font-normal text-primary">
                      unlock direct
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
