import { describe, expect, it } from "vitest";
import {
  formatDurationMs,
  formatProgressDetail,
} from "@/features/game-stats/gameStats.progress.lib";
import type { GameStatsScanProgress } from "@/features/game-stats/gameStats.types";

describe("formatDurationMs", () => {
  it("formate les secondes", () => {
    expect(formatDurationMs(12_000)).toBe("12 s");
  });

  it("formate minutes et secondes", () => {
    expect(formatDurationMs(83_000)).toBe("1 min 23 s");
  });
});

describe("formatProgressDetail", () => {
  it("combine pourcentage et temps écoulé", () => {
    const progress: GameStatsScanProgress = {
      phase: "scanning_logs",
      filesDone: 3,
      filesTotal: 10,
      percent: 50,
    };
    const detail = formatProgressDetail(progress, 60_000);
    expect(detail).toBe("50 % · 1 min");
    expect(detail).not.toContain("restantes");
  });
});
