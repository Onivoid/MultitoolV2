import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatHintTooltip } from "@/features/game-stats/components/StatHintTooltip";

export interface StatsBentoTileProps {
  title: string;
  icon?: ReactNode;
  hint?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function StatsBentoTile({
  title,
  icon,
  hint,
  children,
  className,
  bodyClassName,
}: StatsBentoTileProps) {
  return (
    <section
      className={cn(
        "settings-section flex h-full min-h-0 flex-col overflow-hidden",
        className,
      )}
      data-no-window-drag
    >
      <header className="settings-section-header flex items-center gap-2 px-3 py-2 pl-3">
        {icon ? (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10">
            {icon}
          </div>
        ) : null}
        <h2 className="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold leading-snug">
          <span className="truncate">{title}</span>
          {hint ? <StatHintTooltip label={title} hint={hint} /> : null}
        </h2>
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
