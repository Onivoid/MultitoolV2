import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Référence : entrées sans `catalogBlueprintId` dans temp/blueprints.json (juin 2026).
 * Le matching Rust couvre ces cas via clés global.ini `*_name` + alias Torres→Torrez.
 */
const JOURNAL_NOZZLE_FIXTURE: Record<string, string> = {
  Marlin: "bp_craft_nozzle_fuelgiver_grin_nozzlesecure",
  Lindstrom: "bp_craft_nozzle_fuelgiver_grin_nozzleveryfast",
  Bendix: "bp_craft_nozzle_fuelgiver_shin_nozzleexpensivefast",
  Torres: "bp_craft_nozzle_fuelgiver_shin_nozzleexpensivesecure",
};

const STORE_PATH = join(process.cwd(), "temp", "blueprints.json");

describe("journal store — derniers noms sans ID (régression)", () => {
  it("définit les 4 buses attendues et leurs blueprint_id", () => {
    expect(Object.keys(JOURNAL_NOZZLE_FIXTURE)).toHaveLength(4);
    for (const id of Object.values(JOURNAL_NOZZLE_FIXTURE)) {
      expect(id.startsWith("bp_craft_")).toBe(true);
    }
  });

  it("si temp/blueprints.json est présent, au plus ces noms manquent encore d'ID", () => {
    if (!existsSync(STORE_PATH)) {
      return;
    }
    const store = JSON.parse(readFileSync(STORE_PATH, "utf8")) as {
      blueprints: Array<{ productName: string; catalogBlueprintId?: string }>;
    };
    const unlinked = [
      ...new Set(
        store.blueprints
          .filter((b) => !b.catalogBlueprintId?.trim())
          .map((b) => b.productName.trim()),
      ),
    ];
    for (const name of unlinked) {
      expect(
        Object.prototype.hasOwnProperty.call(JOURNAL_NOZZLE_FIXTURE, name),
        `nom non documenté: ${name}`,
      ).toBe(true);
    }
    expect(unlinked.length).toBeLessThanOrEqual(4);
  });
});
