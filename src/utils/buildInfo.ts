import { getVersion } from "@tauri-apps/api/app";

export interface BuildInfo {
    version: string;
    distribution: "github" | "microsoft-store" | "unknown";
    isSigned: boolean;
    isPortable: boolean;
    canAutoUpdate: boolean;
    githubRepo: string;
}

export interface SecurityInfo {
    isUnsigned: boolean;
    expectsSmartScreenWarning: boolean;
    allowManualUpdates: boolean;
    allowAutoUpdates: boolean;
    downloadSourceUrl: string;
    checksumVerificationAvailable: boolean;
}

const DEFAULT_GITHUB_REPO = "Onivoid/MultitoolV2";

export function detectDistribution(): BuildInfo["distribution"] {
    if (process.env.TAURI_ENV_MS_STORE === "true") {
        return "microsoft-store";
    }

    if (process.env.TAURI_ENV_DISTRIBUTION === "github") {
        return "github";
    }

    if (process.env.TAURI_ENV_PORTABLE === "true") {
        return "github";
    }

    try {
        if (
            typeof window !== "undefined" &&
            window.location &&
            window.location.href.includes("WindowsApps")
        ) {
            return "microsoft-store";
        }

        if (
            typeof localStorage !== "undefined" &&
            localStorage.getItem("PORTABLE_MODE") === "true"
        ) {
            return "github";
        }

        return "github";
    } catch (error) {
        return "unknown";
    }
}

export function isBuildSigned(
    distribution: BuildInfo["distribution"]
): boolean {
    return distribution === "microsoft-store";
}

export function isPortableBuild(): boolean {
    return process.env.TAURI_ENV_PORTABLE === "true";
}

export function canAutoUpdate(
    distribution: BuildInfo["distribution"]
): boolean {
    return distribution === "github";
}

export function getDownloadUrl(
    distribution: BuildInfo["distribution"],
    repo: string = DEFAULT_GITHUB_REPO
): string {
    switch (distribution) {
        case "microsoft-store":
            return "ms-windows-store://pdp/?productid=PRODUCT_ID";
        case "github":
        default:
            return `https://github.com/${repo}/releases/latest`;
    }
}

export async function getBuildInfo(
    githubRepo: string = DEFAULT_GITHUB_REPO
): Promise<BuildInfo> {
    const distribution = detectDistribution();
    const version = await getVersion();

    return {
        version,
        distribution,
        isSigned: isBuildSigned(distribution),
        isPortable: isPortableBuild(),
        canAutoUpdate: canAutoUpdate(distribution),
        githubRepo,
    };
}

export async function getSecurityInfo(
    githubRepo: string = DEFAULT_GITHUB_REPO
): Promise<SecurityInfo> {
    const buildInfo = await getBuildInfo(githubRepo);

    return {
        isUnsigned: !buildInfo.isSigned,
        expectsSmartScreenWarning: !buildInfo.isSigned && !buildInfo.isPortable,
        allowManualUpdates: true,
        allowAutoUpdates:
            buildInfo.canAutoUpdate &&
            buildInfo.distribution !== "microsoft-store",
        downloadSourceUrl: getDownloadUrl(buildInfo.distribution, githubRepo),
        checksumVerificationAvailable: buildInfo.distribution === "github",
    };
}

export function getSecurityWarningMessage(buildInfo: BuildInfo): string | null {
    const { distribution, isPortable } = buildInfo;

    switch (distribution) {
        case "github":
            if (isPortable) {
                return "Cette version portable n'est pas signée numériquement mais ne devrait pas déclencher SmartScreen.";
            }
            return "Cette version provient de GitHub et n'est pas signée numériquement. Windows SmartScreen peut afficher un avertissement.";
        case "microsoft-store":
            return null;
        default:
            return "Source d'installation inconnue. Vérifiez l'origine de cette application.";
    }
}

export function getInstallationInstructions(buildInfo: BuildInfo): string[] {
    const { distribution, isPortable } = buildInfo;

    switch (distribution) {
        case "github":
            if (isPortable) {
                return [
                    "1. Téléchargez l'archive portable",
                    "2. Décompressez dans le dossier de votre choix",
                    "3. Lancez directement l'exécutable",
                ];
            }
            return [
                "1. Téléchargez le fichier depuis GitHub",
                "2. Si SmartScreen apparaît : 'Informations complémentaires' → 'Exécuter quand même'",
                "3. Suivez l'assistant d'installation",
            ];
        case "microsoft-store":
            return [
                "1. Recherchez 'MultitoolV2' dans le Microsoft Store",
                "2. Cliquez sur 'Installer'",
                "3. L'application sera automatiquement mise à jour",
            ];
        default:
            return ["Installation manuelle requise"];
    }
}

export async function shouldShowSecurityWarning(): Promise<boolean> {
    const hasSeenWarning =
        localStorage.getItem("security-warning-seen") === "true";
    if (hasSeenWarning) return false;

    const buildInfo = await getBuildInfo();
    return !buildInfo.isSigned;
}

export function storeBuildMetadata(buildInfo: BuildInfo): void {
    const metadata = {
        ...buildInfo,
        lastChecked: new Date().toISOString(),
    };

    try {
        localStorage.setItem("build-metadata", JSON.stringify(metadata));
    } catch {
        // Ignore localStorage errors
    }
}

export function getStoredBuildMetadata():
    | (BuildInfo & { lastChecked: string })
    | null {
    try {
        const stored = localStorage.getItem("build-metadata");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}
