import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronRight, GripVertical, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { HomeWidgetInstance } from "@/features/home/dashboard/homeDashboard.types";
import { getWidgetDefinition } from "@/features/home/dashboard/homeDashboard.registry";
import {
  clampWidgetPosition,
  MAX_WIDGET_HEIGHT_PX,
  MAX_WIDGET_WIDTH_PX,
  MIN_WIDGET_HEIGHT_PX,
  MIN_WIDGET_WIDTH_PX,
  resolveWidgetPosition,
  widgetHeight,
  widgetIntersectsLogo,
} from "@/features/home/dashboard/homeDashboard.lib";
import { useStaggeredWidgetMount } from "@/features/home/dashboard/useStaggeredWidgetMount";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface HomeWidgetShellProps {
  instance: HomeWidgetInstance;
  mountOrder: number;
  editMode: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  logoRef: React.RefObject<HTMLElement | null>;
  onPositionChange: (
    id: string,
    xPercent: number,
    yPercent: number,
    options?: { persist?: boolean },
  ) => void;
  onWidthChange: (id: string, widthPx: number) => void;
  onHeightChange: (id: string, heightPx: number) => void;
  onRemove: (id: string) => void;
}

export function HomeWidgetShell({
  instance,
  mountOrder,
  editMode,
  containerRef,
  logoRef,
  onPositionChange,
  onWidthChange,
  onHeightChange,
  onRemove,
}: HomeWidgetShellProps) {
  const definition = getWidgetDefinition(instance.type);
  const contentReady = useStaggeredWidgetMount(mountOrder);
  const widgetRef = useRef<HTMLDivElement>(null);
  const autoResolvedRef = useRef(false);
  const dragRef = useRef<{
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const resolvedHeightPx = (measured: number) =>
    widgetHeight(instance, measured);

  useEffect(() => {
    if (!contentReady || autoResolvedRef.current) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      const widgetEl = widgetRef.current;
      if (!container || !widgetEl) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      if (containerRect.width <= 0 || containerRect.height <= 0) {
        return;
      }
      const heightPx = resolvedHeightPx(widgetEl.offsetHeight);
      if (heightPx <= 0) {
        return;
      }
      const logoRect = logoRef.current?.getBoundingClientRect() ?? null;
      const resolved = resolveWidgetPosition(
        instance.xPercent,
        instance.yPercent,
        instance.widthPx,
        heightPx,
        containerRect,
        logoRect,
      );
      autoResolvedRef.current = true;
      if (
        Math.abs(resolved.xPercent - instance.xPercent) > 0.01 ||
        Math.abs(resolved.yPercent - instance.yPercent) > 0.01
      ) {
        onPositionChange(instance.id, resolved.xPercent, resolved.yPercent, {
          persist: false,
        });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [contentReady, instance.id]);

  const handleGripPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!containerRef.current || !widgetRef.current) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const widgetRect = widgetRef.current.getBoundingClientRect();
      dragRef.current = {
        offsetX: e.clientX - widgetRect.left,
        offsetY: e.clientY - widgetRect.top,
      };
      const gripEl = e.currentTarget;
      gripEl.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const container = containerRef.current;
        const widgetEl = widgetRef.current;
        if (!container || !widgetEl || !dragRef.current) {
          return;
        }
        const containerRect = container.getBoundingClientRect();
        const heightPx = resolvedHeightPx(widgetEl.offsetHeight);
        const leftPx = ev.clientX - containerRect.left - dragRef.current.offsetX;
        const topPx = ev.clientY - containerRect.top - dragRef.current.offsetY;
        const xPercent = (leftPx / containerRect.width) * 100;
        const yPercent = (topPx / containerRect.height) * 100;
        const clamped = clampWidgetPosition(
          xPercent,
          yPercent,
          instance.widthPx,
          heightPx,
          containerRect,
        );
        onPositionChange(instance.id, clamped.xPercent, clamped.yPercent);
      };

      const onUp = (ev: PointerEvent) => {
        const container = containerRef.current;
        const widgetEl = widgetRef.current;
        if (container && widgetEl && dragRef.current) {
          const containerRect = container.getBoundingClientRect();
          const heightPx = resolvedHeightPx(widgetEl.offsetHeight);
          const leftPx = ev.clientX - containerRect.left - dragRef.current.offsetX;
          const topPx = ev.clientY - containerRect.top - dragRef.current.offsetY;
          const xPercent = (leftPx / containerRect.width) * 100;
          const yPercent = (topPx / containerRect.height) * 100;
          const logoRect = logoRef.current?.getBoundingClientRect() ?? null;
          if (
            logoRect &&
            widgetIntersectsLogo(
              xPercent,
              yPercent,
              instance.widthPx,
              heightPx,
              containerRect,
              logoRect,
            )
          ) {
            const resolved = resolveWidgetPosition(
              xPercent,
              yPercent,
              instance.widthPx,
              heightPx,
              containerRect,
              logoRect,
              { randomAmongNearest: true },
            );
            onPositionChange(instance.id, resolved.xPercent, resolved.yPercent);
          }
        }
        if (gripEl.hasPointerCapture(ev.pointerId)) {
          gripEl.releasePointerCapture(ev.pointerId);
        }
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [containerRef, logoRef, instance.id, instance.widthPx, onPositionChange],
  );

  const handleResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!editMode) return;
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: instance.widthPx,
        startHeight: instance.heightPx ?? widgetRef.current?.offsetHeight ?? 200,
      };
      const handleEl = e.currentTarget;
      handleEl.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        if (!resizeRef.current) return;
        const deltaX = ev.clientX - resizeRef.current.startX;
        const deltaY = ev.clientY - resizeRef.current.startY;
        const nextWidth = Math.max(
          MIN_WIDGET_WIDTH_PX,
          Math.min(MAX_WIDGET_WIDTH_PX, resizeRef.current.startWidth + deltaX),
        );
        const nextHeight = Math.max(
          MIN_WIDGET_HEIGHT_PX,
          Math.min(MAX_WIDGET_HEIGHT_PX, resizeRef.current.startHeight + deltaY),
        );
        onWidthChange(instance.id, nextWidth);
        onHeightChange(instance.id, nextHeight);
      };

      const onUp = (ev: PointerEvent) => {
        if (handleEl.hasPointerCapture(ev.pointerId)) {
          handleEl.releasePointerCapture(ev.pointerId);
        }
        resizeRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [editMode, instance.id, instance.widthPx, instance.heightPx, onWidthChange, onHeightChange],
  );

  if (!definition) {
    return null;
  }

  const Icon = definition.icon;
  const Content = definition.Content;

  return (
    <div
      ref={widgetRef}
      className={cn(
        "pointer-events-auto absolute z-10 hidden md:block",
        editMode && "ring-1 ring-primary/25",
      )}
      style={{
        left: `${instance.xPercent}%`,
        top: `${instance.yPercent}%`,
        width: `min(${instance.widthPx}px, calc(100% - 1rem))`,
        ...(instance.heightPx
          ? { height: `${instance.heightPx}px`, maxHeight: `${instance.heightPx}px` }
          : {}),
      }}
      data-no-window-drag
      role="group"
      aria-label={definition.label}
    >
      <div
        className={cn(
          "settings-section relative flex flex-col overflow-hidden",
          instance.heightPx != null && "h-full",
        )}
      >
        <button
          type="button"
          className="absolute left-1 top-1 z-20 flex h-4 w-4 cursor-grab items-center justify-center rounded border border-primary/15 bg-background/80 text-muted-foreground hover:bg-primary/10 active:cursor-grabbing"
          aria-label={`Déplacer le widget ${definition.label}`}
          onPointerDown={handleGripPointerDown}
        >
          <GripVertical className="h-3 w-3" aria-hidden />
        </button>

        <header className="settings-section-header flex items-center gap-2 px-3 py-2 pl-7 pr-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
          </div>
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug">
            {definition.label}
          </h2>
          {editMode ? (
            <button
              type="button"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-destructive/30 bg-background/80 text-destructive hover:bg-destructive/10"
              aria-label={`Retirer le widget ${definition.label}`}
              onClick={() => onRemove(instance.id)}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          ) : (
            definition.headerRoute && <WidgetHeaderLink to={definition.headerRoute} />
          )}
        </header>
        {contentReady ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <Content />
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3 py-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {editMode && (
          <button
            type="button"
            className="absolute bottom-1 right-1 z-20 h-4 w-4 cursor-nwse-resize rounded-sm border border-primary/20 bg-background/80 hover:bg-primary/10"
            aria-label={`Redimensionner le widget ${definition.label}`}
            onPointerDown={handleResizePointerDown}
          />
        )}
      </div>
    </div>
  );
}

function WidgetHeaderLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="text-ui-secondary flex shrink-0 items-center gap-0.5 font-medium text-primary hover:underline"
    >
      Voir tout
      <ChevronRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}
