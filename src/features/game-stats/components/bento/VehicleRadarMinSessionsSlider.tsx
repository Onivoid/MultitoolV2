import { useMemo } from "react";
import {
  buildVehicleSessionTiers,
  VEHICLE_TIER_MIN_TOP,
} from "@/features/game-stats/gameStats.charts.lib";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";
import { cn } from "@/lib/utils";

export interface VehicleRadarMinSessionsSliderProps {
  snapshot: GameStatsSnapshot;
  tierIndex: number;
  onTierIndexChange: (index: number) => void;
  className?: string;
}

export function VehicleRadarMinSessionsSlider({
  snapshot,
  tierIndex,
  onTierIndexChange,
  className,
}: VehicleRadarMinSessionsSliderProps) {
  const tiers = useMemo(
    () => buildVehicleSessionTiers(snapshot),
    [snapshot],
  );

  const safeIndex = Math.max(0, Math.min(tierIndex, tiers.length - 1));
  const active = tiers[safeIndex];
  const maxIndex = Math.max(0, tiers.length - 1);
  const isStrictestTier = safeIndex === maxIndex;

  return (
    <div
      className={cn(
        "shrink-0 space-y-1.5 rounded-md border border-primary/8 bg-primary/3 px-2.5 py-2",
        className,
      )}
      data-no-window-drag
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <label htmlFor="vehicle-tier-index" className="text-muted-foreground">
          Palier (sessions min.)
        </label>
        <span className="font-medium tabular-nums text-foreground">
          ≥ {active.minSessions}
        </span>
      </div>
      <input
        id="vehicle-tier-index"
        type="range"
        min={0}
        max={maxIndex}
        step={1}
        value={safeIndex}
        onChange={(e) => onTierIndexChange(Number(e.target.value))}
        disabled={tiers.length <= 1}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/15 accent-primary disabled:opacity-50 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        aria-valuemin={0}
        aria-valuemax={maxIndex}
        aria-valuenow={safeIndex}
        aria-describedby="vehicle-tier-hint"
      />
      <p
        id="vehicle-tier-hint"
        className="text-[10px] leading-snug text-muted-foreground"
      >
        {active.vehicleCount > 0 ? (
          <>
            Palier {safeIndex + 1}/{tiers.length} —{" "}
            <span className="font-medium text-foreground">{active.vehicleCount}</span>{" "}
            vaisseau{active.vehicleCount > 1 ? "x" : ""} (≥ {active.minSessions} session
            {active.minSessions > 1 ? "s" : ""})
            {isStrictestTier && tiers.length >= VEHICLE_TIER_MIN_TOP ? (
              <> · palier max. (top {VEHICLE_TIER_MIN_TOP} minimum)</>
            ) : null}
          </>
        ) : (
          <>Aucun vaisseau à ce palier.</>
        )}
      </p>
    </div>
  );
}
