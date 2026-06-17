import { useCallback, useEffect, useRef, useState } from "react";
import type {
  HomeDashboardLayout,
  HomeWidgetInstance,
} from "@/features/home/dashboard/homeDashboard.types";
import {
  createWidgetInstance,
  defaultDashboardLayout,
  normalizeLayout,
} from "@/features/home/dashboard/homeDashboard.lib";
import type { HomeWidgetType } from "@/features/home/dashboard/homeDashboard.types";
import { homeDashboardService } from "@/features/home/dashboard/homeDashboard.service";

const SAVE_DEBOUNCE_MS = 400;

export function useHomeDashboard() {
  const [layout, setLayout] = useState<HomeDashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((next: HomeDashboardLayout) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      void homeDashboardService.save(next).catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
      });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const updateLayout = useCallback(
    (updater: (prev: HomeDashboardLayout) => HomeDashboardLayout) => {
      setLayout((prev) => {
        if (!prev) {
          return prev;
        }
        const next = normalizeLayout(updater(prev));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await homeDashboardService.load();
      setLayout(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLayout(defaultDashboardLayout());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [load]);

  const updateWidgetPosition = useCallback(
    (
      id: string,
      xPercent: number,
      yPercent: number,
      options?: { persist?: boolean },
    ) => {
      setLayout((prev) => {
        if (!prev) {
          return prev;
        }
        const next = normalizeLayout({
          ...prev,
          widgets: prev.widgets.map((w) =>
            w.id === id ? { ...w, xPercent, yPercent } : w,
          ),
        });
        if (options?.persist !== false) {
          persist(next);
        }
        return next;
      });
    },
    [persist],
  );

  const updateWidgetWidth = useCallback(
    (id: string, widthPx: number) => {
      updateLayout((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) => (w.id === id ? { ...w, widthPx } : w)),
      }));
    },
    [updateLayout],
  );

  const removeWidget = useCallback(
    (id: string) => {
      updateLayout((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== id),
      }));
    },
    [updateLayout],
  );

  const addWidget = useCallback(
    (type: HomeWidgetType) => {
      updateLayout((prev) => {
        if (prev.widgets.some((w) => w.type === type)) {
          return prev;
        }
        const instance = createWidgetInstance(type);
        return { ...prev, widgets: [...prev.widgets, instance] };
      });
    },
    [updateLayout],
  );

  const setWidgets = useCallback(
    (widgets: HomeWidgetInstance[]) => {
      updateLayout((prev) => ({ ...prev, widgets }));
    },
    [updateLayout],
  );

  return {
    layout,
    loading,
    error,
    editMode,
    setEditMode,
    updateWidgetPosition,
    updateWidgetWidth,
    removeWidget,
    addWidget,
    setWidgets,
    reload: load,
  };
}
