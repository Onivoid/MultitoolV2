import type { BuildInfo } from "@/utils/buildInfo";
import { detectDistribution } from "@/utils/buildInfo";

export function isProtectedPath(path: string): boolean {
    try {
        return /:\\Program Files( \(x86\))?\\/i.test(path);
    } catch {
        return false;
    }
}

export type FsErrorContext = {
    distribution?: BuildInfo["distribution"];
};

export function toFriendlyFsError(
    err: unknown,
    context?: FsErrorContext,
): string {
    const distribution = context?.distribution ?? detectDistribution();
    const msg = String(err ?? "");
    if (
        /Accès refusé|Access is denied|os error 5|Permission denied/i.test(msg)
    ) {
        if (distribution === "microsoft-store") {
            return (
                "Accès refusé. Version Microsoft Store : activez MultitoolV2 dans " +
                "Paramètres → Confidentialité et sécurité → Système de fichiers, puis réessayez."
            );
        }
        return "Accès refusé. Relancez l'application en administrateur ou installez le jeu en dehors de 'Program Files'.";
    }
    return msg;
}

export function getProtectedPathWarning(
    distribution?: BuildInfo["distribution"],
): string {
    const dist = distribution ?? detectDistribution();
    if (dist === "microsoft-store") {
        return (
            "Le jeu est dans Program Files. Sur la version Microsoft Store, vérifiez que " +
            "l'accès au système de fichiers est activé pour MultitoolV2 dans les paramètres Windows."
        );
    }
    return "Le jeu est dans Program Files. En cas d'erreur, relancez en administrateur ou installez-le ailleurs.";
}
