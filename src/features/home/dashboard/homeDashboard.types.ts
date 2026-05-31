export type HomeWidgetType =
  | "top_routes"
  | "game_stats"
  | "translation"
  | "blueprints"
  | "cache"
  | "system_performance";

export interface HomeWidgetInstance {
  id: string;
  type: HomeWidgetType;
  xPercent: number;
  yPercent: number;
  widthPx: number;
}

export interface HomeDashboardLayout {
  schemaVersion: number;
  widgets: HomeWidgetInstance[];
}

export interface RectPx {
  left: number;
  top: number;
  width: number;
  height: number;
}
