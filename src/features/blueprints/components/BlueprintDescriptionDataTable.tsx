import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type {
  DescriptionDataRow,
  SummaryPropertyRow,
} from "@/features/blueprints/blueprints.catalog.types";
import { bpDetailBlock } from "@/features/blueprints/blueprints.ui";

function BetterWhenIcon({ when }: { when: string | null }) {
  if (when === "higher") return <ArrowUp className="h-3 w-3 text-emerald-400" />;
  if (when === "lower") return <ArrowDown className="h-3 w-3 text-sky-400" />;
  if (when === "neutral") return <Minus className="h-3 w-3 text-muted-foreground" />;
  return null;
}

export interface BlueprintDescriptionDataTableProps {
  rows: DescriptionDataRow[];
  summaryProperties?: SummaryPropertyRow[];
}

export function BlueprintDescriptionDataTable({
  rows,
  summaryProperties = [],
}: BlueprintDescriptionDataTableProps) {
  if (rows.length === 0 && summaryProperties.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune donnée objet disponible pour ce blueprint.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <div className={bpDetailBlock()}>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Description Data
          </p>
          <dl className="divide-y divide-border/30">
            {rows.map((row) => (
              <div
                key={`${row.name}-${row.value}`}
                className="grid grid-cols-[minmax(0,42%)_1fr] gap-2 py-2 text-xs first:pt-0 last:pb-0"
              >
                <dt className="text-muted-foreground">{row.name}</dt>
                <dd className="font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {summaryProperties.length > 0 && (
        <div className={bpDetailBlock()}>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Axes craft (qualité matière)
          </p>
          <ul className="space-y-1.5 text-xs">
            {summaryProperties.map((p, i) => (
              <li
                key={`${p.label}-${i}`}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-muted-foreground">{p.label}</span>
                <span className="flex items-center gap-1 font-medium">
                  <BetterWhenIcon when={p.betterWhen} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
