import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Hammer, Loader2 } from "lucide-react";
import { BlueprintDetailTabs } from "@/features/blueprints/components/BlueprintDetailTabs";
import { BlueprintHeroCard } from "@/features/blueprints/components/BlueprintHeroCard";
import { BlueprintSectionHeader } from "@/features/blueprints/components/BlueprintSectionHeader";
import {
  BP_EMPTY_STATE,
  BP_SECTION,
  BP_SECTION_FOOTER,
} from "@/features/blueprints/blueprints.ui";
import { slotQualityBounds } from "@/features/blueprints/blueprints.craft-quality.lib";
import type {
  BlueprintCatalogDetail,
  IngredientGroup,
} from "@/features/blueprints/blueprints.catalog.types";
import { cn } from "@/lib/utils";

export interface BlueprintDetailPanelProps {
  detail: BlueprintCatalogDetail | null;
  isLoading: boolean;
  error: string | null;
  isOwned: boolean;
  selectedId: string | null;
  unlockDate?: number | null;
  onFilterByResource?: (ids: string[], label: string) => void;
  onFilterMission?: (
    missionUuid: string,
    title: string,
    blueprintIds: string[],
  ) => void;
  onSelectBlueprint?: (blueprintId: string) => void;
}

function ingredientGroupKey(group: IngredientGroup, index: number): string {
  return (group.slotKey ?? group.slot ?? `slot-${index}`).toUpperCase();
}

export function BlueprintDetailPanel({
  detail,
  isLoading,
  error,
  isOwned,
  selectedId,
  unlockDate,
  onFilterByResource,
  onFilterMission,
  onSelectBlueprint,
}: BlueprintDetailPanelProps) {
  const [qualityBySlot, setQualityBySlot] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!detail) {
      setQualityBySlot({});
      return;
    }
    const next: Record<string, number> = {};
    detail.ingredients.forEach((g, idx) => {
      const key = ingredientGroupKey(g, idx);
      next[key] = slotQualityBounds(g).initial;
    });
    setQualityBySlot(next);
  }, [detail?.blueprintId]);

  const title = useMemo(() => {
    if (!detail) return "Fiche blueprint";
    return detail.nameFr || detail.nameEn || detail.blueprintId;
  }, [detail]);

  if (selectedId == null) {
    return (
      <section className={cn(BP_SECTION, "min-h-0 flex-1")}>
        <BlueprintSectionHeader
          icon={Hammer}
          title="Fiche blueprint"
          subtitle="Sélectionne un blueprint dans le catalogue"
        />
        <div className={BP_EMPTY_STATE}>
          Sélectionne un blueprint dans le catalogue pour afficher le détail.
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className={cn(BP_SECTION, "min-h-0 flex-1")}>
        <BlueprintSectionHeader icon={Hammer} title="Fiche blueprint" />
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn(BP_SECTION, "min-h-0 flex-1")}>
        <BlueprintSectionHeader icon={Hammer} title="Fiche blueprint" />
        <div className={cn(BP_EMPTY_STATE, "flex flex-col items-center gap-2")}>
          <AlertCircle className="h-7 w-7 text-destructive" />
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!detail) return null;

  return (
    <section className={cn(BP_SECTION, "min-h-0 flex-1")}>
      <BlueprintSectionHeader
        icon={Hammer}
        title={title}
        subtitle={detail.blueprintId}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 pb-2 space-y-3">
        <BlueprintHeroCard
          detail={detail}
          isOwned={isOwned}
          unlockDate={unlockDate}
        />
        <BlueprintDetailTabs
          detail={detail}
          selectedId={selectedId}
          qualityBySlot={qualityBySlot}
          onQualityChange={(slotKey, value) =>
            setQualityBySlot((prev) => ({ ...prev, [slotKey]: value }))
          }
          onResetQuality={(slotKey, initial) =>
            setQualityBySlot((prev) => ({ ...prev, [slotKey]: initial }))
          }
          onFilterByResource={onFilterByResource}
          onFilterMission={onFilterMission}
          onSelectBlueprint={onSelectBlueprint}
        />
      </div>

      <footer className={BP_SECTION_FOOTER}>
        Star Citizen Wiki API · Description Data via items API
      </footer>
    </section>
  );
}
