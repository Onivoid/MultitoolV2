export type BlueprintsImportPhase =
  | "discovering_files"
  | "scanning_logs"
  | "merging"
  | "saving"
  | "done";

export interface BlueprintsImportProgress {
  phase: BlueprintsImportPhase | string;
  filesDone: number;
  filesTotal: number;
  currentFile?: string | null;
  percent: number;
}
