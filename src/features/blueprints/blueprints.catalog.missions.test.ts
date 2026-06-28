import { describe, expect, it } from "vitest";
import {
  formatMissionMinStanding,
  isMissionReleasedInGame,
} from "@/features/blueprints/blueprints.catalog.lib";
import type { MissionInfo } from "@/features/blueprints/blueprints.catalog.types";

function mission(partial: Partial<MissionInfo>): MissionInfo {
  return {
    missionId: null,
    missionUuid: "uuid-1",
    nameRaw: "Test",
    nameFr: null,
    locKey: null,
    descriptionEn: null,
    descriptionFr: null,
    descriptionLocKey: null,
    contractor: null,
    missionType: null,
    category: null,
    lawful: null,
    notForRelease: null,
    released: null,
    workInProgress: null,
    dropChance: null,
    locations: null,
    timeToCompleteMinutes: null,
    minStandingName: null,
    minStandingReputation: null,
    standingReward: null,
    shareable: null,
    rankIndex: null,
    debugName: null,
    webUrl: null,
    starSystems: [],
    jurisdictions: [],
    ...partial,
  };
}

describe("isMissionReleasedInGame", () => {
  it("masque not_for_release", () => {
    expect(isMissionReleasedInGame(mission({ notForRelease: true }))).toBe(false);
  });

  it("masque released false", () => {
    expect(isMissionReleasedInGame(mission({ released: false }))).toBe(false);
  });

  it("masque work_in_progress", () => {
    expect(isMissionReleasedInGame(mission({ workInProgress: true }))).toBe(false);
  });

  it("masque si tous les flags sont absents", () => {
    expect(isMissionReleasedInGame(mission({}))).toBe(false);
  });

  it("affiche si released true", () => {
    expect(isMissionReleasedInGame(mission({ released: true }))).toBe(true);
  });

  it("affiche si not_for_release false explicite", () => {
    expect(
      isMissionReleasedInGame(mission({ notForRelease: false, released: null })),
    ).toBe(true);
  });
});

describe("formatMissionMinStanding", () => {
  it("combine rang et valeur numérique", () => {
    expect(
      formatMissionMinStanding({
        minStandingName: "Freelancer",
        minStandingReputation: 4500,
        rankIndex: null,
      }),
    ).toBe("Freelancer (4 500)");
  });

  it("retombe sur rankIndex sans nom", () => {
    expect(
      formatMissionMinStanding({
        minStandingName: null,
        minStandingReputation: null,
        rankIndex: 3,
      }),
    ).toBe("Rang 3");
  });
});
