import type { GamePaths, TranslationsChoosen } from "@/types/translation";
import { cn } from "@/lib/utils";
import { translationService } from "@/features/translation/translation.service";

export const DEFAULT_TRANSLATION_LANG = "fr";

const lastUpdatedFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});

export function buildDefaultTranslationsState(
  paths: GamePaths | null,
): TranslationsChoosen {
  if (!paths) return {};
  const defaults: TranslationsChoosen = {};
  Object.keys(paths.versions).forEach((version) => {
    defaults[version] = { link: null, settingsEN: false };
  });
  return defaults;
}

export function createTranslationTimestamp(): string {
  return new Date().toISOString();
}

export function formatLastUpdated(
  iso: string | undefined,
  translated: boolean,
): string {
  if (iso) {
    try {
      return lastUpdatedFormatter.format(new Date(iso));
    } catch {
      return "—";
    }
  }
  return translated ? "—" : "Aucune installation effectuée";
}

export const TRANSLATION_CARD_WIDTH_CLASS = "w-[288px]";

export const TRANSLATION_LOAD_DELAY_MS = 3000;

const EXCLUSIVE_NON_LIVE = new Set(["PTU", "EPTU", "HOTFIX", "TECH-PREVIEW", "TECH_PREVIEW"]);

/**
 * Aligne les clés de version sur le backend : tout nom contenant « LIVE »
 * (ex. « StarCitizen/LIVE », « LIVE (1) ») devient « LIVE ».
 */
export function canonicalVersionKey(key: string): string {
  const upper = key.toUpperCase();
  if (EXCLUSIVE_NON_LIVE.has(upper)) {
    return key;
  }
  if (upper.includes("LIVE")) {
    return "LIVE";
  }
  return key;
}

export function isLiveVersionKey(key: string): boolean {
  return canonicalVersionKey(key) === "LIVE";
}

/** Réécrit les préférences sauvegardées vers les clés canoniques. */
export function canonicalizeTranslationsSelected(
  selected: TranslationsChoosen,
): TranslationsChoosen {
  const out: TranslationsChoosen = {};
  for (const [key, value] of Object.entries(selected)) {
    const canon = canonicalVersionKey(key);
    if (!out[canon]) {
      out[canon] = value;
    }
  }
  return out;
}

/** Ordre d'affichage préféré des canaux Star Citizen. */
export const CANONICAL_VERSION_ORDER = [
  "LIVE",
  "PTU",
  "EPTU",
  "TECH-Preview",
  "HOTFIX",
] as const;

export function establishVersionOrder(keys: string[]): string[] {
  const known = CANONICAL_VERSION_ORDER.filter((key) => keys.includes(key));
  const unknown = keys
    .filter(
      (key) =>
        !CANONICAL_VERSION_ORDER.includes(
          key as (typeof CANONICAL_VERSION_ORDER)[number],
        ),
    )
    .sort((a, b) => a.localeCompare(b, "fr"));
  return [...known, ...unknown];
}

export function normalizeGamePaths(
  gamePaths: GamePaths,
  versionOrder: string[],
): GamePaths {
  const versions: GamePaths["versions"] = {};

  for (const key of versionOrder) {
    const entry = gamePaths.versions[key];
    if (entry) versions[key] = entry;
  }

  for (const [key, entry] of Object.entries(gamePaths.versions)) {
    if (!versions[key]) versions[key] = entry;
  }

  return { versions };
}

export function hydrateGamePaths(
  current: GamePaths,
  resolved: GamePaths,
  versionOrder: string[],
): GamePaths {
  const versions: GamePaths["versions"] = { ...current.versions };

  for (const key of versionOrder) {
    const next = resolved.versions[key];
    if (next) versions[key] = next;
  }

  return normalizeGamePaths({ versions }, versionOrder);
}

export function getTranslationCardsLayoutClass(): string {
  return cn(
    "mx-auto flex w-full max-w-4xl flex-wrap content-start items-start justify-center gap-3",
  );
}

export async function resolveTranslationVersionStates(
  gamePaths: GamePaths,
  translationsSelected: TranslationsChoosen,
  versionOrder?: string[],
): Promise<GamePaths> {
  const order = versionOrder ?? establishVersionOrder(Object.keys(gamePaths.versions));
  const updatedPaths: GamePaths = {
    versions: { ...gamePaths.versions },
  };

  await Promise.all(
    order
      .filter((key) => gamePaths.versions[key])
      .map(async (key) => {
        const value = gamePaths.versions[key];
        const versionSettings = translationsSelected[key as keyof TranslationsChoosen];

        const translated = await translationService.isGameTranslated(
          value.path,
          DEFAULT_TRANSLATION_LANG,
        );

        const upToDate = versionSettings?.link
          ? await translationService.isUpToDate(
              value.path,
              versionSettings.link,
              DEFAULT_TRANSLATION_LANG,
            )
          : value.up_to_date;

        updatedPaths.versions[key] = {
          path: value.path,
          translated,
          up_to_date: upToDate,
        };
      }),
  );

  return normalizeGamePaths(updatedPaths, order);
}

/** Extrait un lien de traduction depuis la réponse Tauri (formats variables). */
export function extractTranslationLink(translationData: unknown): string | null {
  if (typeof translationData === "string") {
    return translationData;
  }
  if (typeof translationData === "object" && translationData !== null) {
    if ("link" in translationData && typeof translationData.link === "string") {
      return translationData.link;
    }
    if (Array.isArray(translationData)) {
      for (const item of translationData) {
        if (typeof item === "object" && item !== null && "link" in item) {
          const link = (item as { link: unknown }).link;
          if (typeof link === "string") return link;
        }
      }
    }
  }
  return null;
}
