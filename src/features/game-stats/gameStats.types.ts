export interface GameStatsPeriod {
  oldestBackupStartIso: string | null;
  label: string;
}

export interface GameStatsPlaytime {
  totalSeconds: number;
  sessionCount: number;
}

export interface GameStatsMissions {
  completed: number;
  abandoned: number;
  failed: number;
}

export interface GameStatsBlueprints {
  totalUnlocked: number;
}

export interface GameStatsVehicleEntry {
  vehicleType: string;
  boardCount: number;
}

export interface GameStatsVehicles {
  entries: GameStatsVehicleEntry[];
  favorite: string | null;
  favoriteCount: number;
}

export interface GameStatsStarSystemVisit {
  system: string;
  visitCount: number;
}

export interface GameStatsStarSystems {
  visits: GameStatsStarSystemVisit[];
  favorite: string | null;
  favoriteCount: number;
}

export interface GameStatsSnapshot {
  schemaVersion: number;
  computedAt: number;
  period: GameStatsPeriod;
  playtime: GameStatsPlaytime;
  missions: GameStatsMissions;
  blueprints: GameStatsBlueprints;
  vehicles: GameStatsVehicles;
  starSystems: GameStatsStarSystems;
}

export interface GameStatsResponse {
  snapshot: GameStatsSnapshot;
  fromCache: boolean;
}

export type GameStatsLoadStatus =
  | "idle"
  | "loading"
  | "updating"
  | "syncing"
  | "error";

export type GameStatsScanKind = "load" | "sync";

export interface GameStatsScanStatus {
  inProgress: boolean;
  startedAtMs: number | null;
  kind: GameStatsScanKind | null;
  progress: GameStatsScanProgress | null;
}

export type GameStatsScanPhase =
  | "discovering_logs"
  | "scanning_logs"
  | "building_snapshot"
  | "saving_cache"
  | "done";

export interface GameStatsScanProgress {
  phase: GameStatsScanPhase | string;
  filesDone: number;
  filesTotal: number;
  currentFile?: string | null;
  percent: number;
}

export interface StatSummaryItem {
  label: string;
  value: string;
  /** Info-bulle optionnelle (ex. méthode de calcul). */
  hint?: string;
}
