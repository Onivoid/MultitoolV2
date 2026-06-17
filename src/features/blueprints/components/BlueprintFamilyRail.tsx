import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BLUEPRINT_FAMILIES,
  FAMILY_LABEL_FR,
  type BlueprintFamily,
} from "@/features/blueprints/blueprints.taxonomy";
import { bpFilterChip } from "@/features/blueprints/blueprints.ui";
import { cn } from "@/lib/utils";

const SCROLL_STEP_PX = 140;

export interface BlueprintFamilyRailProps {
  value: BlueprintFamily | "all";
  onChange: (family: BlueprintFamily | "all") => void;
  counts?: Partial<Record<BlueprintFamily | "all", number>>;
}

export function BlueprintFamilyRail({
  value,
  onChange,
  counts,
}: BlueprintFamilyRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const items: { id: BlueprintFamily | "all"; label: string }[] = [
    { id: "all", label: "Tous" },
    ...BLUEPRINT_FAMILIES.map((f) => ({ id: f, label: FAMILY_LABEL_FR[f] })),
  ];

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateScrollState, items.length]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-0.5" data-no-window-drag>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground"
        disabled={!canScrollLeft}
        aria-label="Catégories précédentes"
        onClick={() => scrollBy(-SCROLL_STEP_PX)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain pb-0.5"
        data-no-window-drag
      >
        {items.map((item) => {
          const active = value === item.id;
          const count = counts?.[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (active && item.id !== "all") {
                  onChange("all");
                } else {
                  onChange(item.id);
                }
              }}
              className={cn(bpFilterChip(active), "shrink-0 whitespace-nowrap")}
            >
              {item.label}
              {count != null && count > 0 && (
                <span className="ml-1 tabular-nums opacity-75">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground"
        disabled={!canScrollRight}
        aria-label="Catégories suivantes"
        onClick={() => scrollBy(SCROLL_STEP_PX)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
