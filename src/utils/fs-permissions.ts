import type { BuildInfo } from "@/utils/buildInfo";

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
    _context?: FsErrorContext,
): string {
    const msg = String(err ?? "");
    if (
        /Accès refusé|Access is denied|os error 5|Permission denied/i.test(msg)
    ) {
        return "Accès refusé. Relancez l'application en administrateur ou installez le jeu en dehors de 'Program Files'.";
    }
    return msg;
}

export function getProtectedPathWarning(
    _distribution?: BuildInfo["distribution"],
): string {
    return "Le jeu est dans Program Files. En cas d'erreur, relancez en administrateur ou installez-le ailleurs.";
}
