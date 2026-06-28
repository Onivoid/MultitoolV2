import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  clampPercent,
  formatGpuMemoryLabel,
  formatMemoryPair,
  getPrimaryGpu,
  memoryUsagePercent,
} from "@/features/system-metrics/system-metrics.lib";
import { useSystemMetricsWidget } from "@/features/system-metrics/hooks/useSystemMetricsWidget";
import {
  HOME_WIDGET_ROOT,
  HOME_WIDGET_SCROLL,
} from "@/features/home/dashboard/homeDashboard.ui";
import { cn } from "@/lib/utils";

function MetricRow({
  label,
  percent,
  detail,
  className,
}: {
  label: string;
  percent: number;
  detail: string;
  className?: string;
}) {
  const value = clampPercent(percent);

  return (
    <div className={cn("px-3 py-2", className)} data-no-window-drag>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-ui-secondary font-medium text-foreground">{label}</span>
        <span className="text-ui-secondary shrink-0 tabular-nums text-muted-foreground">
          {detail}
        </span>
      </div>
      <Progress
        value={value}
        className="h-1 w-full bg-primary/10"
        aria-label={`${label} : ${value} %`}
      />
    </div>
  );
}

export function PerformanceWidgetContent() {
  const { snapshot, loading, error } = useSystemMetricsWidget();

  if (loading && !snapshot) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error && !snapshot) {
    return <p className="px-3 py-2 text-xs text-destructive">{error}</p>;
  }

  if (!snapshot) {
    return (
      <p className="px-3 py-3 text-xs text-muted-foreground">
        Métriques indisponibles.
      </p>
    );
  }

  const gpu = getPrimaryGpu(snapshot.gpus);
  const ramPercent = memoryUsagePercent(
    snapshot.memoryUsedBytes,
    snapshot.memoryTotalBytes,
  );
  const ramDetail = formatMemoryPair(
    snapshot.memoryUsedBytes,
    snapshot.memoryTotalBytes,
  );

  return (
    <div className={`${HOME_WIDGET_ROOT} ${HOME_WIDGET_SCROLL} border-t border-primary/6`} data-no-window-drag>
      <MetricRow
        label="CPU"
        percent={snapshot.cpuUsagePercent}
        detail={`${clampPercent(snapshot.cpuUsagePercent)} %`}
      />
      {gpu ? (
        <MetricRow
          label="GPU"
          percent={gpu.utilizationPercent}
          detail={
            formatGpuMemoryLabel(gpu)
              ? `${clampPercent(gpu.utilizationPercent)} % · ${formatGpuMemoryLabel(gpu)}`
              : `${clampPercent(gpu.utilizationPercent)} %`
          }
          className="border-t border-primary/4"
        />
      ) : (
        <div
          className="text-ui-secondary border-t border-primary/4 px-3 py-2 text-muted-foreground"
          data-no-window-drag
        >
          GPU : indisponible sur cette machine
        </div>
      )}
      <MetricRow
        label="Mémoire"
        percent={ramPercent}
        detail={ramDetail}
        className="border-t border-primary/4"
      />
      {gpu && (
        <p
          className="text-ui-caption truncate border-t border-primary/4 px-3 py-1.5 text-muted-foreground"
          title={gpu.name}
        >
          {gpu.name}
        </p>
      )}
    </div>
  );
}
