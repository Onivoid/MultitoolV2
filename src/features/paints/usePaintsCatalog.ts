import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { paintsService } from "@/features/paints/paints.service";
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
  const haystack = [
    paint.name,
    paint.nameFr,
    paint.shipName,
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
  if (event === "Concierge") {
    return (
      paint.eventSources.some((e) => e.toLowerCase().includes("concierge")) ||
      paint.name.toLowerCase().includes("concierge")
    );
  }
  return paint.eventSources.includes(event);
}

export function usePaintsCatalog() {
  const [paints, setPaints] = useState<PaintSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
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
        fromData.has(chip)
      ) {
        ordered.push(chip);
      }
    }
    for (const event of [...fromData].sort()) {
      if (!ordered.includes(event)) ordered.push(event);
    }
    return ordered;
  }, [paints]);

  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return paints.filter(
      (paint) =>
        paintMatchesSearch(paint, query) && paintMatchesEvent(paint, activeEvent),
    );
  }, [paints, search, activeEvent]);

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
  };
}
