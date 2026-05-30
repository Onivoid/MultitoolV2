import type { GamePaths } from "@/types/translation";
import type { LocalCharactersResult } from "@/types/charactersList";

export type CharacterRow = {
  name: string;
  versions: { version: string; path: string }[];
};

export function mergeCharacterScanResult(
  prev: CharacterRow[],
  result: LocalCharactersResult,
  gamePaths: GamePaths | null,
): CharacterRow[] {
  const allVersions = Object.keys(gamePaths?.versions || {});
  const map = new Map<string, CharacterRow>();

  prev.forEach((char) => {
    map.set(char.name, {
      name: char.name,
      versions: [...char.versions],
    });
  });

  result.characters.forEach((newChar) => {
    const key = newChar.name;
    if (!map.has(key)) {
      map.set(key, {
        name: newChar.name,
        versions: allVersions.map((version) => ({
          version,
          path: version === newChar.version ? newChar.path : "",
        })),
      });
    } else {
      const existing = map.get(key)!;
      const idx = existing.versions.findIndex((v) => v.version === newChar.version);
      if (idx !== -1 && !existing.versions[idx].path) {
        existing.versions[idx].path = newChar.path;
      }
    }
  });

  return Array.from(map.values());
}
