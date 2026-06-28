import { describe, expect, it } from "vitest";
import {
  canonicalProductionStatus,
  formatProductionStatusFilterLabel,
  formatProductionStatusLabel,
  humanizeSlugSuffix,
  isWikiPlaceholder,
  mergeProductionStatusFilterValues,
  sortProductionStatusValues,
  variantLabelFromSlug,
} from "@/features/ships/ships.catalog.lib";

describe("ships.catalog.lib", () => {
  it("détecte les placeholders Wiki", () => {
    expect(isWikiPlaceholder("<= PLACEHOLDER =>")).toBe(true);
    expect(isWikiPlaceholder("Heavy Gunship")).toBe(false);
    expect(isWikiPlaceholder(null)).toBe(true);
  });

  it("humanise les suffixes de slug", () => {
    expect(humanizeSlugSuffix("gs")).toBe("GS");
    expect(humanizeSlugSuffix("bis2950")).toBe("BIS 2950");
  });

  it("dérive le libellé variante depuis le slug", () => {
    expect(variantLabelFromSlug("aegs-hammerhead", "aegs-hammerhead-gs")).toBe("GS");
    expect(variantLabelFromSlug("aegs-hammerhead", "aegs-hammerhead")).toBeNull();
  });

  it("canonicalise les variantes de statut Wiki", () => {
    expect(canonicalProductionStatus("flight-ready")).toBe("flight-ready");
    expect(canonicalProductionStatus("Flight Ready")).toBe("flight-ready");
    expect(canonicalProductionStatus("in-concept")).toBe("in-concept");
    expect(canonicalProductionStatus("In Concept")).toBe("in-concept");
    expect(canonicalProductionStatus("<= PLACEHOLDER =>")).toBeNull();
  });

  it("formate les statuts de production en français", () => {
    expect(formatProductionStatusLabel("flight-ready")).toBe("En vol");
    expect(formatProductionStatusLabel("in-concept")).toBe("En concept");
    expect(formatProductionStatusLabel("<= PLACEHOLDER =>")).toBeNull();
  });

  it("trie les statuts avec En vol en premier", () => {
    expect(sortProductionStatusValues(["in-concept", "flight-ready"])).toEqual([
      "flight-ready",
      "in-concept",
    ]);
  });

  it("inclut toujours Flight Ready et Concept dans les options de filtre", () => {
    expect(mergeProductionStatusFilterValues([])).toEqual([
      "flight-ready",
      "in-concept",
    ]);
    expect(formatProductionStatusFilterLabel("flight-ready")).toBe("Flight Ready");
    expect(formatProductionStatusFilterLabel("in-concept")).toBe("Concept");
  });
});
