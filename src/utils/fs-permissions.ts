export function isProtectedPath(path: string): boolean {
    try {
        return /:\\Program Files( \(x86\))?\\/i.test(path);
    } catch {
        return false;
    }
}

export function toFriendlyFsError(err: unknown): string {
    const msg = String(err ?? "");
    if (
        /Accès refusé|Access is denied|os error 5|Permission denied/i.test(msg)
    ) {
        return "Accès refusé. Relancez l'application en administrateur ou installez le jeu en dehors de 'Program Files'.";
    }
    return msg;
}
