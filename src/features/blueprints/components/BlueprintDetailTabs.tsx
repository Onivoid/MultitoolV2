import { useState } from "react";
import { Hammer, Package, Recycle, Trophy, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlueprintDescriptionDataTable } from "@/features/blueprints/components/BlueprintDescriptionDataTable";
import { BlueprintIngredientExpand } from "@/features/blueprints/components/BlueprintIngredientExpand";
import { LegalityBadge } from "@/features/blueprints/components/LegalityBadge";
import { JurisdictionBadge } from "@/features/blueprints/components/JurisdictionBadge";
import { SystemBadge } from "@/features/blueprints/components/SystemBadge";
import { IngredientGroupCard } from "@/features/blueprints/components/IngredientGroupCard";
import { MissionExplorerBody } from "@/features/blueprints/components/MissionBlueprintExplorer";
import type { BlueprintCatalogDetail } from "@/features/blueprints/blueprints.catalog.types";
import { bpDetailBlock } from "@/features/blueprints/blueprints.ui";
import {
  cleanScText,
  formatCraftDuration,
} from "@/features/blueprints/blueprints.catalog.lib";
import {
  groupHasQualitySliders,
  slotQualityBounds,
} from "@/features/blueprints/blueprints.craft-quality.lib";
import type { IngredientGroup } from "@/features/blueprints/blueprints.catalog.types";

function ingredientGroupKey(group: IngredientGroup, index: number): string {
  return (group.slotKey ?? group.slot ?? `slot-${index}`).toUpperCase();
}

export interface BlueprintDetailTabsProps {
  detail: BlueprintCatalogDetail;
  selectedId: string | null;
  ownedIds?: Set<string>;
  qualityBySlot: Record<string, number>;
  onQualityChange: (slotKey: string, value: number) => void;
  onResetQuality: (slotKey: string, initial: number) => void;
  onFilterByResource?: (ids: string[], label: string) => void;
  onFilterMission?: (
    missionUuid: string,
    title: string,
    blueprintIds: string[],
  ) => void;
  onSelectBlueprint?: (blueprintId: string) => void;
}

export function BlueprintDetailTabs({
  detail,
  selectedId,
  ownedIds,
  qualityBySlot,
  onQualityChange,
  onResetQuality,
  onFilterByResource,
  onFilterMission,
  onSelectBlueprint,
}: BlueprintDetailTabsProps) {
  const [expandedMission, setExpandedMission] = useState<string | null>(null);

  const unlockSystems = [
    ...new Set([
      ...(detail.unlockSystems ?? []),
      ...detail.missions.flatMap((m) => m.starSystems ?? []),
    ]),
  ].sort();
  const unlockJurisdictions = [
    ...new Set([
      ...(detail.unlockJurisdictions ?? []),
      ...detail.missions.flatMap((m) => m.jurisdictions ?? []),
    ]),
  ].sort();

  return (
    <Tabs defaultValue="object" className="min-h-0 flex-1">
      <TabsList className="grid h-auto w-full grid-cols-4 gap-0.5 bg-primary/5 p-1">
        <TabsTrigger value="object" className="gap-1 text-xs">
          <Package className="h-3 w-3" />
          Détails
        </TabsTrigger>
        <TabsTrigger value="craft" className="gap-1 text-xs">
          <Hammer className="h-3 w-3" />
          Craft
        </TabsTrigger>
        <TabsTrigger value="unlock" className="gap-1 text-xs">
          <Trophy className="h-3 w-3" />
          Mission
        </TabsTrigger>
        <TabsTrigger value="recycle" className="gap-1 text-xs">
          <Recycle className="h-3 w-3" />
          Recyclage
        </TabsTrigger>
      </TabsList>

      <TabsContent value="object" className="mt-3 space-y-3">
        <BlueprintDescriptionDataTable
          rows={detail.itemProfile?.descriptionData ?? []}
          summaryProperties={detail.summaryProperties}
        />
      </TabsContent>

      <TabsContent value="craft" className="mt-3 space-y-3">
        {detail.ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun ingrédient listé.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detail.ingredients.map((grp, idx) => {
                const key = ingredientGroupKey(grp, idx);
                const bounds = slotQualityBounds(grp);
                const q = qualityBySlot[key] ?? bounds.initial;
                return (
                  <IngredientGroupCard
                    key={key}
                    group={grp}
                    quality={q}
                    onQualityChange={(value) => onQualityChange(key, value)}
                    onResetQuality={() => onResetQuality(key, bounds.initial)}
                    onSelectOption={() => {}}
                    renderOptionExtra={(opt) => (
                      <BlueprintIngredientExpand
                        option={opt}
                        group={grp}
                        onFilterByResource={onFilterByResource}
                      />
                    )}
                  />
                );
              })}
            </div>
            {detail.ingredients.some(groupHasQualitySliders) && (
              <p className="text-[10px] text-muted-foreground">
                Curseurs alignés sur Star Citizen Wiki · base 500 par slot
              </p>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="unlock" className="mt-3 space-y-3">
        {(unlockSystems.length > 0 || unlockJurisdictions.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {unlockSystems.map((sys) => (
              <SystemBadge key={sys} name={sys} />
            ))}
            {unlockJurisdictions.map((j) => (
              <JurisdictionBadge key={j} name={j} />
            ))}
          </div>
        )}
        {detail.missions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune mission de déblocage référencée.
          </p>
        ) : (
          <div className="space-y-2">
            {detail.missions.map((m, i) => {
              const missionName =
                cleanScText(m.nameFr || m.nameRaw) || m.nameRaw || "—";
              const uuid = m.missionUuid;
              const isOpen = uuid != null && expandedMission === uuid;
              return (
                <div key={uuid ?? `mission-${i}`} className={bpDetailBlock()}>
                  <button
                    type="button"
                    className="w-full text-left"
                    disabled={!uuid}
                    onClick={() => setExpandedMission(isOpen ? null : (uuid ?? null))}
                  >
                    <p className="font-medium text-sm">{missionName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                      {(m.starSystems ?? []).map((s) => (
                        <SystemBadge key={s} name={s} />
                      ))}
                      {(m.jurisdictions ?? []).map((j) => (
                        <JurisdictionBadge key={j} name={j} />
                      ))}
                      <LegalityBadge lawful={m.lawful} />
                      {m.contractor && <span>· {m.contractor}</span>}
                      {m.missionType && <span>· {m.missionType}</span>}
                      {m.minStandingName && <span>· Rang : {m.minStandingName}</span>}
                      {m.shareable != null ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {m.shareable ? "Partageable" : "Solo"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-muted-foreground/80">
                          <Users className="h-3 w-3" />
                          Partageable : Inconnu
                        </span>
                      )}
                      {m.dropChance && <span>· {m.dropChance}</span>}
                    </div>
                  </button>
                  {isOpen && uuid && (
                    <div className="mt-2 border-t border-border/30 pt-2">
                      <MissionExplorerBody
                        active
                        missionUuid={uuid}
                        missionTitle={missionName}
                        directUnlockBlueprintId={selectedId}
                        ownedIds={ownedIds}
                        onSelectBlueprint={(id) => {
                          onSelectBlueprint?.(id);
                          setExpandedMission(null);
                        }}
                        onFilterMission={(mu, title, ids) => {
                          onFilterMission?.(mu, title, ids);
                          setExpandedMission(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="recycle" className="mt-3">
        {!detail.dismantle ? (
          <p className="text-sm text-muted-foreground">
            Pas de données de démantèlement.
          </p>
        ) : (
          <div className={bpDetailBlock()}>
            <p className="text-xs text-muted-foreground">
              {detail.dismantle.timeLabel ??
                formatCraftDuration(detail.dismantle.timeSeconds)}
              {detail.dismantle.efficiency != null &&
                ` · ${Math.round(detail.dismantle.efficiency * 100)} % rendement`}
            </p>
            {detail.dismantle.returns.length > 0 && (
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-muted-foreground">
                    <th className="pb-1">Ressource</th>
                    <th className="pb-1 text-right">Quantité</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.dismantle.returns.map((r, ri) => (
                    <tr key={ri} className="border-t border-border/25">
                      <td className="py-1.5">{r.name}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {r.quantityScu != null
                          ? `${r.quantityScu.toFixed(3)} SCU`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
