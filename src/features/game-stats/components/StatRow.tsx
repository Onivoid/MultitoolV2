import { StatHintTooltip } from "@/features/game-stats/components/StatHintTooltip";

export interface StatRowProps {
  label: string;
  value: string;
  /** Texte affiché dans l’infobulle du bouton (?). */
  hint?: string;
}

export function StatRow({ label, value, hint }: StatRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
        <span className="truncate">{label}</span>
        {hint ? <StatHintTooltip label={label} hint={hint} /> : null}
      </span>
      <span className="max-w-[58%] shrink-0 truncate text-right font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}
