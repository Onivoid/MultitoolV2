import type {
  HomeDashboardLayout,
  HomeWidgetInstance,
  HomeWidgetType,
  RectPx,
} from "@/features/home/dashboard/homeDashboard.types";

export const DEFAULT_WIDGET_WIDTH_PX = 280;
export const MIN_WIDGET_WIDTH_PX = 220;
export const MAX_WIDGET_WIDTH_PX = 480;
export const MIN_WIDGET_HEIGHT_PX = 140;
export const MAX_WIDGET_HEIGHT_PX = 520;
export const DASHBOARD_SCHEMA_VERSION = 3;
export const LOGO_COLLISION_PADDING_PX = 24;

function widgetHeight(instance: HomeWidgetInstance, measuredPx: number): number {
  if (instance.heightPx != null && instance.heightPx > 0) {
    return Math.max(
      MIN_WIDGET_HEIGHT_PX,
      Math.min(MAX_WIDGET_HEIGHT_PX, instance.heightPx),
    );
  }
  return measuredPx;
}

export function createWidgetId(): string {
  return crypto.randomUUID();
}

export { widgetHeight };

export function defaultDashboardLayout(): HomeDashboardLayout {
  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    widgets: [
      {
        id: "default-top-routes",
        type: "top_routes",
        xPercent: 16,
        yPercent: 2,
        widthPx: 240,
        heightPx: 200,
      },
      {
        id: "default-translation",
        type: "translation",
        xPercent: 36,
        yPercent: 2,
        widthPx: 220,
        heightPx: 200,
      },
      {
        id: "default-hangar-exec",
        type: "hangar_exec",
        xPercent: 54,
        yPercent: 2,
        widthPx: 220,
        heightPx: 200,
      },
      {
        id: "default-sc-versions",
        type: "sc_versions",
        xPercent: 72,
        yPercent: 2,
        widthPx: 240,
        heightPx: 200,
      },
      {
        id: "default-rsi-status",
        type: "rsi_status",
        xPercent: 2,
        yPercent: 28,
        widthPx: 260,
        heightPx: 220,
      },
      {
        id: "default-blueprints",
        type: "blueprints",
        xPercent: 2,
        yPercent: 52,
        widthPx: 280,
        heightPx: 240,
      },
      {
        id: "default-cache",
        type: "cache",
        xPercent: 72,
        yPercent: 28,
        widthPx: 260,
        heightPx: 220,
      },
      {
        id: "default-game-stats",
        type: "game_stats",
        xPercent: 72,
        yPercent: 52,
        widthPx: 280,
        heightPx: 280,
      },
    ],
  };
}

export function normalizeLayout(layout: HomeDashboardLayout): HomeDashboardLayout {
  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    widgets: layout.widgets.map((w) => ({
      ...w,
      widthPx: Math.max(
        MIN_WIDGET_WIDTH_PX,
        Math.min(MAX_WIDGET_WIDTH_PX, w.widthPx || DEFAULT_WIDGET_WIDTH_PX),
      ),
      heightPx:
        w.heightPx != null
          ? Math.max(MIN_WIDGET_HEIGHT_PX, Math.min(MAX_WIDGET_HEIGHT_PX, w.heightPx))
          : undefined,
      xPercent: Math.max(0, Math.min(100, w.xPercent)),
      yPercent: Math.max(0, Math.min(100, w.yPercent)),
    })),
  };
}

function rectsIntersect(a: RectPx, b: RectPx): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

function expandRect(rect: RectPx, padding: number): RectPx {
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function widgetRectFromPercent(
  xPercent: number,
  yPercent: number,
  widthPx: number,
  heightPx: number,
  containerWidth: number,
  containerHeight: number,
): RectPx {
  const left = (xPercent / 100) * containerWidth;
  const top = (yPercent / 100) * containerHeight;
  return { left, top, width: widthPx, height: heightPx };
}

function percentFromWidgetRect(
  rect: RectPx,
  containerWidth: number,
  containerHeight: number,
): { xPercent: number; yPercent: number } {
  return {
    xPercent: (rect.left / containerWidth) * 100,
    yPercent: (rect.top / containerHeight) * 100,
  };
}

function clampToContainer(
  rect: RectPx,
  containerWidth: number,
  containerHeight: number,
): RectPx {
  return {
    left: clamp(rect.left, 0, Math.max(0, containerWidth - rect.width)),
    top: clamp(rect.top, 0, Math.max(0, containerHeight - rect.height)),
    width: rect.width,
    height: rect.height,
  };
}

export function logoObstacleInContainer(
  containerRect: DOMRect,
  logoRect: DOMRect,
  padding = LOGO_COLLISION_PADDING_PX,
): RectPx {
  return expandRect(
    {
      left: logoRect.left - containerRect.left,
      top: logoRect.top - containerRect.top,
      width: logoRect.width,
      height: logoRect.height,
    },
    padding,
  );
}

/** Limite la position au conteneur (sans repousser le logo). */
export function clampWidgetPosition(
  xPercent: number,
  yPercent: number,
  widthPx: number,
  heightPx: number,
  containerRect: DOMRect,
): { xPercent: number; yPercent: number } {
  const cw = containerRect.width;
  const ch = containerRect.height;
  if (cw <= 0 || ch <= 0) {
    return { xPercent, yPercent };
  }
  const widget = clampToContainer(
    widgetRectFromPercent(xPercent, yPercent, widthPx, heightPx, cw, ch),
    cw,
    ch,
  );
  return percentFromWidgetRect(widget, cw, ch);
}

export function widgetIntersectsLogo(
  xPercent: number,
  yPercent: number,
  widthPx: number,
  heightPx: number,
  containerRect: DOMRect,
  logoRect: DOMRect | null,
  padding = LOGO_COLLISION_PADDING_PX,
): boolean {
  if (!logoRect) {
    return false;
  }
  const cw = containerRect.width;
  const ch = containerRect.height;
  if (cw <= 0 || ch <= 0) {
    return false;
  }
  const widget = widgetRectFromPercent(xPercent, yPercent, widthPx, heightPx, cw, ch);
  const obstacle = logoObstacleInContainer(containerRect, logoRect, padding);
  return rectsIntersect(widget, obstacle);
}

export interface ResolveWidgetPositionOptions {
  /** Parmi les placements valides à distance minimale, en choisir un au hasard. */
  randomAmongNearest?: boolean;
  padding?: number;
}

/**
 * Repousse le widget hors de la zone logo si nécessaire.
 * Utiliser après un relâchement sur la hitbox logo (`randomAmongNearest`).
 */
export function resolveWidgetPosition(
  xPercent: number,
  yPercent: number,
  widthPx: number,
  heightPx: number,
  containerRect: DOMRect,
  logoRect: DOMRect | null,
  paddingOrOptions: number | ResolveWidgetPositionOptions = LOGO_COLLISION_PADDING_PX,
): { xPercent: number; yPercent: number } {
  const options: ResolveWidgetPositionOptions =
    typeof paddingOrOptions === "number"
      ? { padding: paddingOrOptions }
      : paddingOrOptions;
  const padding = options.padding ?? LOGO_COLLISION_PADDING_PX;

  const clamped = clampWidgetPosition(
    xPercent,
    yPercent,
    widthPx,
    heightPx,
    containerRect,
  );

  if (!logoRect) {
    return clamped;
  }

  const cw = containerRect.width;
  const ch = containerRect.height;
  const widget = widgetRectFromPercent(
    clamped.xPercent,
    clamped.yPercent,
    widthPx,
    heightPx,
    cw,
    ch,
  );
  const obstacle = logoObstacleInContainer(containerRect, logoRect, padding);

  if (!rectsIntersect(widget, obstacle)) {
    return clamped;
  }

  const candidates: RectPx[] = [
    {
      left: obstacle.left - widget.width,
      top: widget.top,
      width: widget.width,
      height: widget.height,
    },
    {
      left: obstacle.left + obstacle.width,
      top: widget.top,
      width: widget.width,
      height: widget.height,
    },
    {
      left: widget.left,
      top: obstacle.top - widget.height,
      width: widget.width,
      height: widget.height,
    },
    {
      left: widget.left,
      top: obstacle.top + obstacle.height,
      width: widget.width,
      height: widget.height,
    },
  ];

  const centerX = widget.left + widget.width / 2;
  const centerY = widget.top + widget.height / 2;

  const valid: { rect: RectPx; dist: number }[] = [];

  for (const candidate of candidates) {
    const placed = clampToContainer(candidate, cw, ch);
    if (rectsIntersect(placed, obstacle)) {
      continue;
    }
    const cx = placed.left + placed.width / 2;
    const cy = placed.top + placed.height / 2;
    valid.push({
      rect: placed,
      dist: (cx - centerX) ** 2 + (cy - centerY) ** 2,
    });
  }

  if (valid.length === 0) {
    return clamped;
  }

  const minDist = Math.min(...valid.map((v) => v.dist));
  const nearest = valid.filter((v) => v.dist <= minDist + 0.5);
  const pick = options.randomAmongNearest
    ? nearest[Math.floor(Math.random() * nearest.length)]!
    : nearest[0]!;

  return percentFromWidgetRect(pick.rect, cw, ch);
}

export function createWidgetInstance(type: HomeWidgetType): HomeWidgetInstance {
  return {
    id: createWidgetId(),
    type,
    xPercent: 10,
    yPercent: 20,
    widthPx: DEFAULT_WIDGET_WIDTH_PX,
  };
}
