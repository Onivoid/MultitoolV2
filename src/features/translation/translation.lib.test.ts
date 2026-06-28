import { describe, expect, it } from "vitest";
import {
  canonicalVersionKey,
  isLiveVersionKey,
  isPublicReleaseVersionKey,
} from "@/features/translation/translation.lib";

describe("translation version keys", () => {
  it("canonicalise LIVE variants", () => {
    expect(canonicalVersionKey("StarCitizen/LIVE")).toBe("LIVE");
    expect(canonicalVersionKey("HOTFIX")).toBe("HOTFIX");
  });

  it("distingue LIVE et HOTFIX pour isLiveVersionKey", () => {
    expect(isLiveVersionKey("LIVE")).toBe(true);
    expect(isLiveVersionKey("HOTFIX")).toBe(false);
  });

  it("traite HOTFIX comme version publique", () => {
    expect(isPublicReleaseVersionKey("LIVE")).toBe(true);
    expect(isPublicReleaseVersionKey("HOTFIX")).toBe(true);
    expect(isPublicReleaseVersionKey("PTU")).toBe(false);
    expect(isPublicReleaseVersionKey("EPTU")).toBe(false);
  });
});
