import { ExternalLink, FlaskConical, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import { blueprintsCatalogService } from "@/features/blueprints/blueprints.catalog.service";
import {
  formatLocationSpawnPercent,
  ingredientCatalogFilterIds,
  ingredientCommodityUuid,
  modifierEffectLabel,
  normalizeIngredientOption,
} from "@/features/blueprints/blueprints.catalog.lib";
import type { IngredientLocationPreview } from "@/features/blueprints/blueprints.catalog.types";
import {
  BP_ACTION_BTN,
  bpDetailBlock,
  bpSheetPanel,
} from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";
import type {
  IngredientGroup,
  IngredientOption,
} from "@/features/blueprints/blueprints.catalog.types";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";

export interface IngredientInspectorBodyProps {
  active: boolean;
  option: IngredientOption;
  group: IngredientGroup | null;
  onFilterByResource?: (ids: string[], label: string) => void;
  onClose?: () => void;
}

export function IngredientInspectorBody({
  active,
  option,
  group,
  onFilterByResource,
  onClose,
}: IngredientInspectorBodyProps) {
  const opt = normalizeIngredientOption(option);
  const [allLocations, setAllLocations] = useState<IngredientLocationPreview[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const commodityUuid = ingredientCommodityUuid(opt);
  const filterIds = ingredientCatalogFilterIds(opt);

  useEffect(() => {
    if (!active || !commodityUuid) {
      setAllLocations([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingLoc(true);
      try {
        const locs = await blueprintsCatalogService.ingredientLocations(commodityUuid);
        if (!cancelled) {
          setAllLocations(Array.isArray(locs) ? locs : []);
        }
      } catch {
        if (!cancelled) setAllLocations([]);
      } finally {
        if (!cancelled) setLoadingLoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, commodityUuid]);

  const e = opt.enrichment;
  const methods = e?.methods ?? [];
  const harvestHints = e?.harvestHints ?? [];
  const systems = e?.systems ?? [];
  const locationPreview = e?.locationPreview ?? [];
  const locations: IngredientLocationPreview[] =
    allLocations.length > 0 ? allLocations : locationPreview;

  return (
    <div className={bpSheetPanel()}>
      {group && (
        <div className={bpDetailBlock()}>
          <p className="text-[10px] uppercase text-muted-foreground">Slot craft</p>
          <p className="font-medium">{group.slotLabelFr || group.slot}</p>
          {opt.minQuality != null && (
            <p className="text-xs text-muted-foreground">
              Qualité minimale : {opt.minQuality}
            </p>
          )}
        </div>
      )}
      <div className={bpDetailBlock()}>
        <p className="text-[10px] uppercase text-muted-foreground">Quantité</p>
        <p className="tabular-nums text-foreground">
          {opt.quantityScu != null
            ? `${opt.quantityScu.toFixed(2)} SCU`
            : opt.quantity != null
              ? `× ${opt.quantity}`
              : "—"}
        </p>
      </div>
      {group && (group.modifiers?.length ?? 0) > 0 && (
        <div className={bpDetailBlock()}>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">
            Effets qualité (slot)
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {(group.modifiers ?? []).map((m, i) => (
              <li key={i}>{modifierEffectLabel(m)}</li>
            ))}
          </ul>
        </div>
      )}
      {e && (
        <div className={bpDetailBlock()}>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {e.tier && <BlueprintMetaBadge>{e.tier}</BlueprintMetaBadge>}
            {e.rarity && <BlueprintMetaBadge>{e.rarity}</BlueprintMetaBadge>}
            {e.kindLabel && <BlueprintMetaBadge>{e.kindLabel}</BlueprintMetaBadge>}
          </div>
          {methods.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Méthodes : {methods.join(", ")}
            </p>
          )}
          {e.descriptionShort && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {e.descriptionShort}
            </p>
          )}
          {harvestHints.length > 0 && (
            <p className="mt-1 text-xs text-foreground/90">
              Indices : {harvestHints.slice(0, 8).join(", ")}
            </p>
          )}
        </div>
      )}
      {systems.length > 0 && (
        <div className={bpDetailBlock()}>
          <p className="mb-1.5 text-[10px] uppercase text-muted-foreground">Systèmes</p>
          <div className="flex flex-wrap gap-1">
            {systems.map((s, i) => (
              <BlueprintMetaBadge key={`${s}-${i}`} variant="system" icon={MapPin}>
                {s}
              </BlueprintMetaBadge>
            ))}
          </div>
        </div>
      )}
      {locations.length > 0 && (
        <div className={bpDetailBlock()}>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">
            Lieux ({e?.locationCount ?? locations.length})
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
            {locations.map((loc, i) => {
              const pct = formatLocationSpawnPercent(loc.spawnPercent);
              return (
                <li
                  key={i}
                  className="flex justify-between gap-2 text-muted-foreground"
                >
                  <span className="min-w-0">
                    {loc.name}
                    {loc.system && ` · ${loc.system}`}
                    {loc.locationType && ` (${loc.locationType})`}
                  </span>
                  {pct && (
                    <span className="shrink-0 tabular-nums font-medium text-foreground/80">
                      {pct}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {loadingLoc && (
            <p className="mt-1 text-[10px] text-muted-foreground">Chargement…</p>
          )}
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-2 border-t border-primary/8 pt-3">
        {opt.webUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(BP_ACTION_BTN, "h-9")}
            onClick={() =>
              void invokeCommand(TAURI_COMMANDS.openExternal, { url: opt.webUrl })
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Wiki
          </Button>
        )}
        {filterIds.length > 0 && onFilterByResource && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(BP_ACTION_BTN, "h-9")}
            onClick={() => {
              const label = opt.nameFr || opt.name || opt.guid || "Ingrédient";
              onFilterByResource(filterIds, label);
              onClose?.();
            }}
          >
            Filtrer le catalogue
          </Button>
        )}
      </div>
    </div>
  );
}

/** Icône pour le panneau latéral ingrédient. */
export function IngredientInspectorIcon() {
  return <FlaskConical className="h-3.5 w-3.5 text-primary" />;
}
