import { getVersion } from "@tauri-apps/api/app";

export interface BuildInfo {
  version: string;
  distribution: "github" | "unknown";
  isPortable: boolean;
  canAutoUpdate: boolean;
  githubRepo: string;
}

const DEFAULT_GITHUB_REPO = "Onivoid/MultitoolV2";

export function detectDistribution(): BuildInfo["distribution"] {
  if (process.env.TAURI_ENV_DISTRIBUTION === "github") {
    return "github";
  }

  if (process.env.TAURI_ENV_PORTABLE === "true") {
    return "github";
  }

  try {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem("PORTABLE_MODE") === "true"
    ) {
      return "github";
    }

    return "github";
  } catch {
    return "unknown";
  }
}

export function isPortableBuild(): boolean {
  return process.env.TAURI_ENV_PORTABLE === "true";
}

export function canAutoUpdate(distribution: BuildInfo["distribution"]): boolean {
  return distribution === "github" && !isPortableBuild();
}

export async function getBuildInfo(
  githubRepo: string = DEFAULT_GITHUB_REPO,
): Promise<BuildInfo> {
  const distribution = detectDistribution();
  const version = await getVersion();
  const isPortable = isPortableBuild();

  return {
    version,
    distribution,
    isPortable,
    canAutoUpdate: canAutoUpdate(distribution),
    githubRepo,
  };
}
