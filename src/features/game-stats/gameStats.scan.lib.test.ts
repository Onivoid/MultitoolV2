import { describe, expect, it } from "vitest";
import {
  applyScanStatus,
  parseScanInProgressError,
} from "@/features/game-stats/gameStats.scan.lib";

describe("parseScanInProgressError", () => {
  it("détecte un scan déjà en cours", () => {
    const status = {
      inProgress: true,
      startedAtMs: 1_000,
      kind: "sync" as const,
      progress: { phase: "scanning_logs", filesDone: 2, filesTotal: 10, percent: 20 },
    };
    const err = JSON.stringify({ code: "GAME_STATS_SCAN_IN_PROGRESS", status });
    expect(parseScanInProgressError(new Error(err))).toEqual(status);
  });
});

describe("applyScanStatus", () => {
  it("mappe un sync en cours", () => {
    const applied = applyScanStatus(
      { inProgress: true, startedAtMs: 500, kind: "sync", progress: null },
      true,
    );
    expect(applied.status).toBe("syncing");
    expect(applied.operationStartedAt).toBe(500);
  });
});
