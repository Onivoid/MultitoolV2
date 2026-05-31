export interface GpuMetrics {
  name: string;
  utilizationPercent: number;
  memoryUsedBytes: number | null;
  memoryTotalBytes: number | null;
}

export interface SystemMetricsSnapshot {
  cpuUsagePercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  gpus: GpuMetrics[];
}
