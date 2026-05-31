import { useCallback, useEffect, useState } from "react";
import { homeService, type TopRouteEntry } from "@/features/home/home.service";

export function useTopRoutes(limit = 3) {
  const [routes, setRoutes] = useState<TopRouteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const top = await homeService.getTopRoutes(limit);
      setRoutes(top);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { routes, loading, reload };
}
