import { describe, expect, it } from "vitest";
import {
  clampPercent,
  formatBytesAsGiB,
  formatMemoryPair,
  memoryUsagePercent,
} from "@/features/system-metrics/system-metrics.lib";

describe("formatBytesAsGiB", () => {
  it("formate en Go", () => {
    const s = formatBytesAsGiB(2 * 1024 ** 3);
    expect(s).toContain("Go");
    expect(s).toMatch(/2/);
  });
});

describe("formatMemoryPair", () => {
  it("affiche utilisé / total", () => {
    const pair = formatMemoryPair(8 * 1024 ** 3, 16 * 1024 ** 3);
    expect(pair).toContain("/");
  });
});

describe("clampPercent", () => {
  it("borne entre 0 et 100", () => {
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
  });
});

describe("memoryUsagePercent", () => {
  it("calcule le pourcentage RAM", () => {
    expect(memoryUsagePercent(8 * 1024 ** 3, 16 * 1024 ** 3)).toBe(50);
  });
});
