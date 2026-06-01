import { describe, expect, it } from "vitest";
import {
  buildSpendingPeriodOptions,
  formatShopDisplayName,
  sliceSpendingForPeriod,
} from "@/features/game-stats/gameStats.spending.lib";
import type { GameStatsSpendingDay } from "@/features/game-stats/gameStats.types";

describe("formatShopDisplayName", () => {
  it("removes SCShop prefix and underscores", () => {
    expect(formatShopDisplayName("SCShop_Area18_AstroArmada")).toBe(
      "Area18 AstroArmada",
    );
  });

  it("handles SCShop without underscore after prefix", () => {
    expect(formatShopDisplayName("SCShopPortOlisar")).toBe("PortOlisar");
  });

  it("handles SC_Shop prefix", () => {
    expect(formatShopDisplayName("SC_Shop_Area18_CAS")).toBe("Area18 CAS");
  });
});

describe("spending period", () => {
  const byDay: GameStatsSpendingDay[] = [
    { date: "2025-01-01", spent: 100, cumulative: 100 },
    { date: "2025-01-15", spent: 50, cumulative: 150 },
    { date: "2025-02-01", spent: 200, cumulative: 350 },
  ];

  it("offers month options when multiple months", () => {
    const opts = buildSpendingPeriodOptions(byDay);
    expect(opts.some((o) => o.id === "month:2025-01")).toBe(true);
    expect(opts.some((o) => o.id === "month:2025-02")).toBe(true);
  });

  it("recomputes cumulative for month slice", () => {
    const points = sliceSpendingForPeriod(byDay, "month:2025-01");
    expect(points).toHaveLength(2);
    expect(points[0].cumulative).toBe(0);
    expect(points[1].cumulative).toBe(100);
  });

  it("keeps first-day cumulative for full period", () => {
    const points = sliceSpendingForPeriod(byDay, "all");
    expect(points[0].cumulative).toBe(100);
  });
});
