import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { BlueprintMetaBadge } from "@/features/blueprints/components/BlueprintMetaBadge";
import {
  clamp,
  computeModifierImpact,
  groupHasQualitySliders,
  slotQualityBounds,
} from "@/features/blueprints/blueprints.craft-quality.lib";
import type {
  IngredientGroup,
  IngredientOption,
} from "@/features/blueprints/blueprints.catalog.types";
import { BP_INGREDIENT_CARD } from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";

export interface IngredientGroupCardProps {
  group: IngredientGroup;
  quality: number;
  onQualityChange: (value: number) => void;
  onResetQuality: () => void;
  onSelectOption?: (option: IngredientOption, group: IngredientGroup) => void;
  renderOptionExtra?: (option: IngredientOption, group: IngredientGroup) => ReactNode;
}

function formatQuantity(opt: IngredientOption): string {
  if (opt.quantityScu != null) return `${opt.quantityScu.toFixed(2)} SCU`;
  if (opt.quantity != null) return `${opt.quantity} items`;
  return "—";
}

export function IngredientGroupCard({
  group,
  quality,
  onQualityChange,
  onResetQuality,
  onSelectOption,
  renderOptionExtra,
}: IngredientGroupCardProps) {
  const bounds = useMemo(() => slotQualityBounds(group), [group]);
  const showSlider = groupHasQualitySliders(group);
  const impacts = useMemo(
    () =>
      (group.modifiers ?? [])
        .map((m) => computeModifierImpact(m, quality, bounds.initial))
        .filter((x): x is NonNullable<typeof x> => x != null),
    [group.modifiers, quality, bounds.initial],
  );

  const slotTitle = group.slotLabelFr || group.slot;

  return (
    <article className={cn(BP_INGREDIENT_CARD, "h-full min-h-0")} data-no-window-drag>
      <header className="mb-2 border-b border-primary/8 pb-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {slotTitle}
          {group.requiredCount != null && group.requiredCount > 1 && (
            <span className="ml-1 font-normal">×{group.requiredCount}</span>
          )}
        </p>
        <div className="mt-2 space-y-1.5">
          {group.options.map((opt, oi) => (
            <div key={`${opt.guid ?? opt.name}-${oi}`}>
              {renderOptionExtra ? (
                <div className="flex items-baseline justify-between gap-2 px-0.5 py-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {opt.nameFr || opt.name || opt.guid || "—"}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatQuantity(opt)}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-2 rounded-md px-0.5 py-0.5 text-left transition-colors hover:bg-primary/10"
                  onClick={() => onSelectOption?.(opt, group)}
                >
                  <span className="text-sm font-semibold text-primary hover:underline">
                    {opt.nameFr || opt.name || opt.guid || "—"}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatQuantity(opt)}
                  </span>
                </button>
              )}
              {renderOptionExtra?.(opt, group)}
            </div>
          ))}
        </div>
      </header>

      {showSlider && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">Qualité</span>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border/50 bg-background/40 px-2 py-0.5 text-xs font-medium tabular-nums">
                {Math.round(quality)}
              </span>
              {Math.round(quality) !== bounds.initial && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 border-primary/30 px-2 text-[10px] text-primary"
                  onClick={onResetQuality}
                >
                  Réinit. {bounds.initial}
                </Button>
              )}
            </div>
          </div>

          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={1}
            value={clamp(quality, bounds.min, bounds.max)}
            onChange={(e) => onQualityChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md"
            aria-label={`Qualité ${slotTitle}`}
            data-no-window-drag
          />

          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{bounds.min}</span>
            <span>Base {bounds.initial}</span>
            <span>{bounds.max}</span>
          </div>

          {impacts.length > 0 && (
            <div className="mt-auto space-y-1.5 pt-1">
              {impacts.map((imp) => (
                <div
                  key={imp.label}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/35 bg-background/20 px-2.5 py-2"
                >
                  <span className="text-xs text-muted-foreground">{imp.label}</span>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      imp.isNeutral && "text-muted-foreground",
                      !imp.isNeutral && imp.isPositive && "text-emerald-400",
                      !imp.isNeutral && !imp.isPositive && "text-red-400/90",
                    )}
                  >
                    {imp.display}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showSlider && (group.modifiers?.length ?? 0) > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 border-t border-primary/8 pt-2">
          {(group.modifiers ?? []).map((m, i) => (
            <BlueprintMetaBadge key={`${m.label}-${i}`}>{m.label}</BlueprintMetaBadge>
          ))}
        </div>
      )}
    </article>
  );
}
