import { describe, expect, it } from "vitest";
import { truncateProductName } from "@/features/blueprints/blueprints.widget.lib";

describe("truncateProductName", () => {
  it("tronque les noms longs", () => {
    const long = "A".repeat(50);
    expect(truncateProductName(long, 10).length).toBeLessThanOrEqual(10);
  });

  it("laisse les noms courts inchangés", () => {
    expect(truncateProductName("Short")).toBe("Short");
  });
});
