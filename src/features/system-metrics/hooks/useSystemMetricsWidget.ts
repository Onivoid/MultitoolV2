import { useCallback, useEffect, useState } from "react";
import { systemMetricsService } from "@/features/system-metrics/system-metrics.service";
import type { SystemMetricsSnapshot } from "@/features/system-metrics/system-metrics.types";

export const SYSTEM_METRICS_POLL_MS = 1500;

export function useSystemMetricsWidget() {
  const [snapshot, setSnapshot] = useState<SystemMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await systemMetricsService.getMetrics();
      setSnapshot(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      await fetchMetrics();
      if (!cancelled) {
        setLoading(false);
      }
    };

    void tick();
    const id = window.setInterval(() => {
      void fetchMetrics();
    }, SYSTEM_METRICS_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [fetchMetrics]);

  return {
    snapshot,
    loading,
    error,
  };
}
