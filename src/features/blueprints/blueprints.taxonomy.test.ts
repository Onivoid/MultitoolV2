import { describe, expect, it } from "vitest";
import {
  classifyBlueprintFamily,
  descriptionDataValue,
} from "@/features/blueprints/blueprints.taxonomy";

describe("blueprints.taxonomy", () => {
  it("classifie armure et composant vaisseau", () => {
    expect(classifyBlueprintFamily("Char_Armor_Helmet")).toBe("armor");
    expect(classifyBlueprintFamily("PowerPlant")).toBe("ship_component");
    expect(classifyBlueprintFamily("WeaponPersonal")).toBe("fps_weapon");
    expect(classifyBlueprintFamily("Misc")).toBe("other");
  });

  it("lit description_data par clé", () => {
    const rows = [
      { name: "Grade", value: "A" },
      { name: "Damage Reduction", value: "30%" },
    ];
    expect(descriptionDataValue(rows, "Grade")).toBe("A");
    expect(descriptionDataValue(rows, "undefined")).toBeNull();
  });
});
