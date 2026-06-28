import { useEffect, useState } from "react";
import { formatCountdown } from "@/features/hangar-exec/hangarExec.lib";
import {
  pyamProgressPercent,
  pyamSegmentStates,
} from "@/features/hangar-exec/hangarExec.pyam.lib";
import type { HangarExecStatus } from "@/features/hangar-exec/hangarExec.types";
import { cn } from "@/lib/utils";

export interface PyamStatusHeroProps {
  status: HangarExecStatus;
}

export function PyamStatusHero({ status }: PyamStatusHeroProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const isOnline = status.status === "ONLINE";
  const endsAt = new Date(status.nextChangeAt).getTime();
  const secondsRemaining = Math.max(0, Math.floor((endsAt - nowMs) / 1000));
  const progress = pyamProgressPercent(isOnline, secondsRemaining);
  const segments = pyamSegmentStates(isOnline, progress);

  return (
    <section
      className={cn(
        "settings-section overflow-hidden border-2 p-4 transition-colors",
        isOnline
          ? "border-emerald-500/45 shadow-[0_0_32px_hsl(142_76%_36%/0.12)]"
          : "border-red-500/45 shadow-[0_0_32px_hsl(0_72%_51%/0.12)]",
      )}
      data-no-window-drag
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Hangar PYAM — Pyro
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold",
                isOnline
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-red-500/15 text-red-300",
              )}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400",
                )}
              />
              {isOnline ? "Hangar ouvert" : "Hangar fermé"}
            </span>
            <span className="text-xs text-muted-foreground">
              Cycle {status.cycleNumber}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
            {formatCountdown(secondsRemaining)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isOnline ? "Fermeture dans" : "Prochaine ouverture dans"}
          </p>
        </div>

        <div className="w-full min-w-[220px] max-w-md flex-1 space-y-3">
          <div className="h-3 overflow-hidden rounded-full bg-muted/40">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isOnline ? "bg-emerald-500" : "bg-red-500",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between gap-1">
            {segments.map((active, i) => (
              <span
                key={i}
                className={cn(
                  "h-3 flex-1 rounded-sm border",
                  active
                    ? isOnline
                      ? "border-emerald-400/60 bg-emerald-500/70"
                      : "border-red-400/60 bg-red-500/70"
                    : "border-border/40 bg-muted/20",
                )}
                aria-hidden
              />
            ))}
          </div>
          <p className="text-right text-[10px] tabular-nums text-muted-foreground">
            {progress}% du cycle {isOnline ? "d'ouverture" : "de fermeture"}
          </p>
        </div>
      </div>
    </section>
  );
}
