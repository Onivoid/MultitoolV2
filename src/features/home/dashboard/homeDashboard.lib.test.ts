import { describe, expect, it, vi } from "vitest";
import {
  clampWidgetPosition,
  resolveWidgetPosition,
  widgetIntersectsLogo,
} from "@/features/home/dashboard/homeDashboard.lib";

function domRect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("clampWidgetPosition", () => {
  const container = domRect(0, 0, 1000, 800);

  it("clamp le widget dans le conteneur sans logo", () => {
    const result = clampWidgetPosition(-10, -5, 280, 120, container);
    expect(result.xPercent).toBeGreaterThanOrEqual(0);
    expect(result.yPercent).toBeGreaterThanOrEqual(0);
  });

  it("autorise le chevauchement logo pendant le drag", () => {
    const logo = domRect(400, 300, 200, 200);
    const result = clampWidgetPosition(42, 40, 280, 120, container);
    expect(
      widgetIntersectsLogo(result.xPercent, result.yPercent, 280, 120, container, logo, 24),
    ).toBe(true);
  });
});

describe("resolveWidgetPosition", () => {
  const container = domRect(0, 0, 1000, 800);
  const logo = domRect(400, 300, 200, 200);

  it("repousse le widget hors de la zone logo", () => {
    const result = resolveWidgetPosition(42, 40, 280, 120, container, logo, {
      padding: 24,
    });
    const widgetLeft = (result.xPercent / 100) * container.width;
    const widgetTop = (result.yPercent / 100) * container.height;
    const obstacle = {
      left: logo.left - 24,
      top: logo.top - 24,
      right: logo.left + logo.width + 24,
      bottom: logo.top + logo.height + 24,
    };
    const overlaps =
      widgetLeft < obstacle.right &&
      widgetLeft + 280 > obstacle.left &&
      widgetTop < obstacle.bottom &&
      widgetTop + 120 > obstacle.top;
    expect(overlaps).toBe(false);
  });

  it("choisit aléatoirement parmi les positions valides les plus proches", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);
    const result = resolveWidgetPosition(42, 40, 280, 120, container, logo, {
      padding: 24,
      randomAmongNearest: true,
    });
    randomSpy.mockRestore();
    const widgetLeft = (result.xPercent / 100) * container.width;
    const widgetTop = (result.yPercent / 100) * container.height;
    const obstacle = {
      left: logo.left - 24,
      top: logo.top - 24,
      right: logo.left + logo.width + 24,
      bottom: logo.top + logo.height + 24,
    };
    const overlaps =
      widgetLeft < obstacle.right &&
      widgetLeft + 280 > obstacle.left &&
      widgetTop < obstacle.bottom &&
      widgetTop + 120 > obstacle.top;
    expect(overlaps).toBe(false);
  });
});
