import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { RadarChartDatum } from "@/features/game-stats/gameStats.radar.types";

function truncateAxisLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) {
    return label;
  }
  return `${label.slice(0, maxLen - 1)}…`;
}

export interface StatsRadarChartProps {
  data: RadarChartDatum[];
  chartConfig: ChartConfig;
  emptyMessage?: string;
  className?: string;
  ariaLabel?: string;
  /** Libellés d’axes plus petits / tronqués (beaucoup de vaisseaux). */
  compactAxisLabels?: boolean;
}

export function StatsRadarChart({
  data,
  chartConfig,
  emptyMessage = "Aucune donnée pour cette catégorie.",
  className,
  ariaLabel,
  compactAxisLabels = false,
}: StatsRadarChartProps) {
  const isEmpty = data.length === 0 || data.every((d) => d.value === 0);
  const axisFontSize = compactAxisLabels ? 9 : 11;
  const axisMaxLen = compactAxisLabels ? 14 : 22;

  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground",
          className,
        )}
        role="status"
      >
        {emptyMessage}
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    axisLabel: d.label,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className={cn(
        "aspect-auto h-full min-h-0 w-full max-w-none [&_.recharts-responsive-container]:!h-full",
        className,
      )}
      aria-label={ariaLabel}
    >
      <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="88%">
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(_value, _name, item) => {
                const payload = item.payload as RadarChartDatum;
                return (
                  <span className="font-mono tabular-nums">
                    {payload.formattedValue}
                  </span>
                );
              }}
            />
          }
        />
        <PolarGrid stroke="hsl(var(--primary) / 0.12)" />
        <PolarAngleAxis
          dataKey="axisLabel"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: axisFontSize }}
          tickFormatter={(value) =>
            truncateAxisLabel(String(value), axisMaxLen)
          }
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 1]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="stat"
          dataKey="normalized"
          stroke="var(--color-stat)"
          fill="var(--color-stat)"
          fillOpacity={0.25}
          dot={{
            r: 3,
            fill: "var(--color-stat)",
            strokeWidth: 0,
          }}
        />
      </RechartsRadarChart>
    </ChartContainer>
  );
}
