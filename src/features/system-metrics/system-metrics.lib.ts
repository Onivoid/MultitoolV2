import type { GpuMetrics } from "@/features/system-metrics/system-metrics.types";

const GIB = 1024 ** 3;

/** Affiche une taille en gibioctets (ex. « 18,2 Go »). */
export function formatBytesAsGiB(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  const gib = bytes / GIB;
  return `${gib.toLocaleString("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} Go`;
}

export function formatMemoryPair(usedBytes: number, totalBytes: number): string {
  return `${formatBytesAsGiB(usedBytes)} / ${formatBytesAsGiB(totalBytes)}`;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function memoryUsagePercent(usedBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) {
    return 0;
  }
  return clampPercent((usedBytes / totalBytes) * 100);
}

export function getPrimaryGpu(gpus: GpuMetrics[]): GpuMetrics | null {
  if (gpus.length === 0) {
    return null;
  }
  return gpus[0];
}

export function formatGpuMemoryLabel(gpu: GpuMetrics): string | null {
  if (gpu.memoryUsedBytes == null) {
    return null;
  }
  if (gpu.memoryTotalBytes != null && gpu.memoryTotalBytes > 0) {
    return formatMemoryPair(gpu.memoryUsedBytes, gpu.memoryTotalBytes);
  }
  return formatBytesAsGiB(gpu.memoryUsedBytes);
}
