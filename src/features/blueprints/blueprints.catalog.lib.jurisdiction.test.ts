import { describe, expect, it } from "vitest";
import {
  jurisdictionDisplayKind,
  jurisdictionLabelFr,
} from "@/features/blueprints/blueprints.catalog.lib";

describe("jurisdictionDisplayKind", () => {
  it("UEE est safe", () => {
    expect(jurisdictionDisplayKind("UEE")).toBe("safe");
  });

  it("Ungoverned est hostile", () => {
    expect(jurisdictionDisplayKind("Ungoverned")).toBe("hostile");
  });

  it("Banu reste plain", () => {
    expect(jurisdictionDisplayKind("Banu")).toBe("plain");
    expect(jurisdictionLabelFr("Banu")).toBe("Banu");
  });
});
