import { describe, expect, it } from "vitest";
import { normalizePort, normalizeVehicleDetail } from "@/features/ships/ships.lib";

describe("ships.lib ports", () => {
  it("lit les champs aplatis renvoyés par Tauri (Rust)", () => {
    const port = normalizePort({
      name: "hardpoint_cooler_left",
      itemName: "Bracer",
      itemManufacturer: "Aegis Dynamics",
      itemTypeLabel: "Cooler",
      itemSize: 1,
      position: "left",
    });

    expect(port).toEqual({
      name: "hardpoint_cooler_left",
      categoryLabel: null,
      itemName: "Bracer",
      itemManufacturer: "Aegis Dynamics",
      itemTypeLabel: "Cooler",
      itemSize: 1,
      itemGrade: null,
      itemClass: null,
      position: "left",
    });
  });

  it("supporte le format Wiki imbriqué (legacy)", () => {
    const port = normalizePort({
      name: "hardpoint_shield_generator_left",
      category_label: "Shields",
      item: {
        name: "Bulwark",
        manufacturer: { name: "Basilisk" },
        type_label: "Shield",
        size: 1,
      },
    });

    expect(port?.itemName).toBe("Bulwark");
    expect(port?.itemManufacturer).toBe("Basilisk");
    expect(port?.itemTypeLabel).toBe("Shield");
    expect(port?.itemSize).toBe(1);
    expect(port?.categoryLabel).toBe("Shields");
  });

  it("lit equipped_item imbriqué (format Wiki brut)", () => {
    const port = normalizePort({
      name: "hardpoint_cooler_left",
      equipped_item: {
        name: "Bracer",
        manufacturer: { name: "Aegis Dynamics" },
        type_label: "Cooler",
        size: 1,
      },
      position: "left",
    });

    expect(port?.itemName).toBe("Bracer");
    expect(port?.itemManufacturer).toBe("Aegis Dynamics");
    expect(port?.itemTypeLabel).toBe("Cooler");
    expect(port?.itemSize).toBe(1);
  });

  it("lit grade et classe du composant", () => {
    const port = normalizePort({
      name: "hardpoint_cooler_left",
      equipped_item: {
        name: "Bracer",
        grade: "C",
        class: "Military",
        size: 1,
      },
    });

    expect(port?.itemGrade).toBe("C");
    expect(port?.itemClass).toBe("Military");
  });

  it("lit grade entier depuis l'API Wiki", () => {
    const port = normalizePort({
      name: "hardpoint_controller_energy",
      equipped_item: {
        name: "POWER",
        grade: 1,
      },
    });

    expect(port?.itemGrade).toBe("1");
  });

  it("retourne itemName null sans équipement", () => {
    const port = normalizePort({ name: "hardpoint_paint" });
    expect(port?.itemName).toBeNull();
  });

  it("normalise les ports dans normalizeVehicleDetail", () => {
    const detail = normalizeVehicleDetail({
      uuid: "test",
      name: "Test Ship",
      slug: "test",
      ports: [
        {
          name: "hardpoint_power_plant",
          itemName: "Endurance",
          itemManufacturer: "Juno Starwerk",
        },
      ],
    });

    expect(detail.ports).toHaveLength(1);
    expect(detail.ports[0]?.itemName).toBe("Endurance");
  });
});
