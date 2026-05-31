import { describe, expect, it } from "vitest";
import { filterCacheFolders } from "@/features/cache/cache.widget.lib";
import type { CacheFolder } from "@/features/cache/cache.service";

const folders: CacheFolder[] = [
  { name: "LIVE", path: "C:\\SC\\LIVE", weight: "1,2 Go" },
  { name: "PTU", path: "D:\\Games\\PTU", weight: "800 Mo" },
];

describe("filterCacheFolders", () => {
  it("retourne tout si la requête est vide", () => {
    expect(filterCacheFolders(folders, "")).toHaveLength(2);
  });

  it("filtre par nom ou chemin", () => {
    expect(filterCacheFolders(folders, "ptu").map((f) => f.name)).toEqual(["PTU"]);
    expect(filterCacheFolders(folders, "games")).toHaveLength(1);
  });
});
