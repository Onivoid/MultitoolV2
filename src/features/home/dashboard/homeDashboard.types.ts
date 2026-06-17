export type HomeWidgetType =
  | "top_routes"
  | "game_stats"
  | "translation"
  | "blueprints"
  | "cache"
  | "system_performance"
  | "news"
  | "rsi_status"
  | "sc_versions"
  | "hangar_exec";

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
