import { getVersion } from "@tauri-apps/api/app";

/**
 * Récupère la version de l'application de manière unified
 * Utilise l'API Tauri pour obtenir la version réelle de l'app compilée
 */
export async function getAppVersion(): Promise<string> {
  try {
    return await getVersion();
  } catch {
    // Fallback sur la variable d'environnement Vite en dev
    return import.meta.env.VITE_APP_VERSION || "dev";
  }
}

/**
 * Récupère la version depuis les variables d'environnement Vite (pour le layout)
 * Utilisé pour l'affichage immédiat sans async
 */
export function getAppVersionSync(): string {
  return import.meta.env.VITE_APP_VERSION || "dev";
}

/**
 * Formate la version pour l'affichage
 */
export function formatVersion(version: string): string {
  if (!version || version === "dev") return "Dev";
  const bare = version.replace(/^v/i, "");
  return `v${bare}`;
}

/** Semver sans préfixe v (fichiers, tags Git, latest.json). */
export function stripVersionPrefix(version: string): string {
  return version.replace(/^v/i, "");
}

/**
 * Compare deux versions (format semver)
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split(".").map(Number);
  const v2Parts = version2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
}
