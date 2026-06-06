import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAuec, formatAuecCompact } from "@/features/game-stats/gameStats.lib";
import {
  buildSpendingPeriodOptions,
  sliceSpendingForPeriod,
  type SpendingPeriodId,
} from "@/features/game-stats/gameStats.spending.lib";
import type { GameStatsSnapshot } from "@/features/game-stats/gameStats.types";
import { cn } from "@/lib/utils";

const chartConfig = {
  cumulative: {
    label: "Cumul",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };

function formatAxisDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return isoDate;
}

function formatYAxisTick(v: number): string {
  return formatAuecCompact(v);
}

export interface StatsSpendingChartBodyProps {
  snapshot: GameStatsSnapshot;
  className?: string;
}

export function StatsSpendingChartBody({
  snapshot,
  className,
}: StatsSpendingChartBodyProps) {
  const byDay = snapshot.spending?.byDay ?? [];

  const periodOptions = useMemo(() => buildSpendingPeriodOptions(byDay), [byDay]);

  const [periodId, setPeriodId] = useState<SpendingPeriodId>("all");

  useEffect(() => {
    setPeriodId("all");
  }, [byDay]);

  const chartData = useMemo(() => {
    if (periodOptions.length === 0) {
      return [];
    }
    const id = periodOptions.some((o) => o.id === periodId) ? periodId : "all";
    return sliceSpendingForPeriod(byDay, id);
  }, [byDay, periodId, periodOptions]);

  const showPeriodSelect = periodOptions.length > 1;
  const effectivePeriodId = periodOptions.some((o) => o.id === periodId)
    ? periodId
    : "all";

  if (byDay.length < 2) {
    return (
      <div className={cn("flex min-h-[140px] flex-1 flex-col gap-2", className)}>
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-muted-foreground">
          {byDay.length === 0
            ? "Aucune dépense boutique détectée sur la période."
            : "Au moins deux jours avec des achats sont nécessaires pour afficher la courbe."}
        </div>
      </div>
    );
  }

  if (chartData.length < 2) {
    return (
      <div className={cn("flex min-h-[140px] flex-1 flex-col gap-2", className)}>
        {showPeriodSelect ? (
          <SpendingPeriodSelect
            value={effectivePeriodId}
            options={periodOptions}
            onChange={setPeriodId}
          />
        ) : null}
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-muted-foreground">
          Pas assez de données sur cette période (au moins 2 jours avec achats).
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
      {showPeriodSelect ? (
        <SpendingPeriodSelect
          value={effectivePeriodId}
          options={periodOptions}
          onChange={setPeriodId}
        />
      ) : null}

      <ChartContainer config={chartConfig} className="min-h-[140px] w-full flex-1">
        <AreaChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            fontSize={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={11}
            width={72}
            tickFormatter={formatYAxisTick}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatAuec(Number(value))}
                labelFormatter={(label) => String(label)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="var(--color-cumulative)"
            fill="var(--color-cumulative)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function SpendingPeriodSelect({
  value,
  options,
  onChange,
}: {
  value: SpendingPeriodId;
  options: ReturnType<typeof buildSpendingPeriodOptions>;
  onChange: (id: SpendingPeriodId) => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 px-0.5">
      <label
        htmlFor="spending-period-select"
        className="text-[11px] text-muted-foreground"
      >
        Période
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="spending-period-select"
          className="h-8 w-full max-w-[220px] text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
