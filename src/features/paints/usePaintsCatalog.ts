import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { paintsService } from "@/features/paints/paints.service";
import {
  isPaintSkin,
  resolvePaintManufacturer,
} from "@/features/paints/paints.lib";
import {
  PAINT_EVENT_CHIP_PRIORITY,
  type PaintSummary,
} from "@/features/paints/paints.types";
import logger from "@/utils/logger";
import { toastError } from "@/shared/lib/toastHelpers";

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function paintMatchesSearch(paint: PaintSummary, query: string): boolean {
  if (!query) return true;
  const manufacturer = resolvePaintManufacturer(paint);
  const haystack = [
    paint.name,
    paint.nameFr,
    paint.shipName,
    manufacturer.name,
    manufacturer.code,
    paint.manufacturerName,
    paint.manufacturerCode,
    ...paint.eventSources,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function paintMatchesEvent(paint: PaintSummary, event: string | null): boolean {
  if (!event) return true;
  const normalized = event.toLowerCase();
  if (
    paint.eventSources.some((e) => e.toLowerCase().includes(normalized)) ||
    paint.name.toLowerCase().includes(normalized)
  ) {
    return true;
  }
  if (event === "Limited") {
    return (
      paint.eventSources.some((e) => e.toLowerCase().includes("limited")) ||
      paint.name.toLowerCase().includes("limited")
    );
  }
  if (event === "Best in Show") {
    return (
      paint.eventSources.some((e) => e.toLowerCase().includes("best in show")) ||
      paint.name.toLowerCase().includes("best in show")
    );
  }
  if (event === "Concierge" || event === "CONCIERGE") {
    return (
      paint.eventSources.some((e) => e.toLowerCase().includes("concierge")) ||
      paint.name.toLowerCase().includes("concierge")
    );
  }
  return paint.eventSources.includes(event);
}

function paintMatchesManufacturer(
  paint: PaintSummary,
  manufacturer: string | null,
): boolean {
  if (!manufacturer) return true;
  const resolved = resolvePaintManufacturer(paint);
  return (
    resolved.name === manufacturer ||
    resolved.code === manufacturer ||
    paint.manufacturerName === manufacturer ||
    paint.manufacturerCode === manufacturer
  );
}

export function usePaintsCatalog() {
  const [paints, setPaints] = useState<PaintSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [activeManufacturer, setActiveManufacturer] = useState<string | null>(
    null,
  );
  const [hideSkins, setHideSkins] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await paintsService.list();
      setPaints(data);
    } catch (error) {
      logger.error("Erreur chargement peintures:", error);
      toastError(toast, "Erreur", "Impossible de charger le catalogue des peintures");
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const manufacturerOptions = useMemo(() => {
    const names = new Set<string>();
    for (const paint of paints) {
      const m = resolvePaintManufacturer(paint).name;
      if (m) names.add(m);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "fr"));
  }, [paints]);

  const eventChips = useMemo(() => {
    const fromData = new Set<string>();
    for (const paint of paints) {
      for (const event of paint.eventSources) {
        fromData.add(event);
      }
    }
    const ordered: string[] = [];
    for (const chip of PAINT_EVENT_CHIP_PRIORITY) {
      if (
        chip === "Limited" ||
        chip === "Best in Show" ||
        chip === "Concierge" ||
        chip === "CONCIERGE" ||
        fromData.has(chip) ||
        [...fromData].some((e) => e.toLowerCase() === chip.toLowerCase())
      ) {
        if (!ordered.some((o) => o.toLowerCase() === chip.toLowerCase())) {
          ordered.push(chip);
        }
      }
    }
    for (const event of [...fromData].sort()) {
      if (!ordered.some((o) => o.toLowerCase() === event.toLowerCase())) {
        ordered.push(event);
      }
    }
    return ordered;
  }, [paints]);

  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return paints.filter(
      (paint) =>
        paintMatchesSearch(paint, query) &&
        paintMatchesEvent(paint, activeEvent) &&
        paintMatchesManufacturer(paint, activeManufacturer) &&
        (!hideSkins || !isPaintSkin(paint)),
    );
  }, [paints, search, activeEvent, activeManufacturer, hideSkins]);

  const toggleEvent = (event: string) => {
    setActiveEvent((prev) => (prev === event ? null : event));
  };

  const selectEvent = (event: string | null) => {
    setActiveEvent(event);
  };

  return {
    paints: filtered,
    totalCount: paints.length,
    isLoading,
    search,
    setSearch,
    activeEvent,
    toggleEvent,
    selectEvent,
    eventChips,
    manufacturerOptions,
    activeManufacturer,
    setActiveManufacturer,
    hideSkins,
    setHideSkins,
  };
}
