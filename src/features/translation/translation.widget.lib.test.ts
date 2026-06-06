import { describe, expect, it } from "vitest";
import { getWidgetAction } from "@/features/translation/translation.widget.lib";

describe("getWidgetAction", () => {
  it("propose l'installation si non traduit", () => {
    expect(getWidgetAction({ translated: false, up_to_date: false })).toBe("install");
  });

  it("propose la mise à jour si obsolète", () => {
    expect(getWidgetAction({ translated: true, up_to_date: false })).toBe("update");
  });

  it("n'affiche pas d'action si à jour", () => {
    expect(getWidgetAction({ translated: true, up_to_date: true })).toBeNull();
  });
});
