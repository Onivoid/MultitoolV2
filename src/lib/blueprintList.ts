export interface BlueprintEntry {
    owner: string;
    productName: string;
    ts: number;
    missionGuid?: string | null;
    missionDebugName?: string | null;
    missionTrigger?: string | null;
}

export type BlueprintSortKey =
    | "dateDesc"
    | "dateAsc"
    | "nameAsc"
    | "nameDesc"
    | "ownerAsc"
    | "ownerDesc";

export const BLUEPRINT_SORT_STORAGE_KEY = "blueprints-sort";

export const BLUEPRINT_SORT_OPTIONS: { key: BlueprintSortKey; label: string }[] = [
    { key: "dateDesc", label: "Plus récents" },
    { key: "dateAsc", label: "Plus anciens" },
    { key: "nameAsc", label: "Nom A → Z" },
    { key: "nameDesc", label: "Nom Z → A" },
    { key: "ownerAsc", label: "Compte A → Z" },
    { key: "ownerDesc", label: "Compte Z → A" },
];

export const UNKNOWN_OWNER_LABEL = "Inconnu";

export function formatBlueprintOwner(owner: string): string {
    const trimmed = owner.trim();
    if (!trimmed) return UNKNOWN_OWNER_LABEL;
    return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function getBlueprintSortLabel(key: BlueprintSortKey): string {
    return BLUEPRINT_SORT_OPTIONS.find((o) => o.key === key)?.label ?? "Plus récents";
}

export function loadBlueprintSortKey(): BlueprintSortKey {
    try {
        const stored = localStorage.getItem(BLUEPRINT_SORT_STORAGE_KEY);
        if (stored && BLUEPRINT_SORT_OPTIONS.some((o) => o.key === stored)) {
            return stored as BlueprintSortKey;
        }
    } catch {
        /* ignore */
    }
    return "dateDesc";
}

export function saveBlueprintSortKey(key: BlueprintSortKey): void {
    try {
        localStorage.setItem(BLUEPRINT_SORT_STORAGE_KEY, key);
    } catch {
        /* ignore */
    }
}

export function getUniqueOwners(blueprints: BlueprintEntry[]): string[] {
    const owners = new Set<string>();
    for (const bp of blueprints) {
        const o = bp.owner?.trim() ?? "";
        if (o) owners.add(o);
    }
    return [...owners].sort((a, b) =>
        a.localeCompare(b, "fr", { sensitivity: "base" })
    );
}

export function filterBlueprints(
    blueprints: BlueprintEntry[],
    query: string,
    ownerFilter?: string
): BlueprintEntry[] {
    let result = blueprints;

    const owner = ownerFilter?.trim() ?? "";
    if (owner) {
        result = result.filter((bp) => (bp.owner?.trim() ?? "") === owner);
    }

    const q = query.trim().toLowerCase();
    if (!q) return result;

    return result.filter((bp) => {
        if (bp.productName.toLowerCase().includes(q)) return true;
        if (bp.owner?.toLowerCase().includes(q)) return true;
        if (formatBlueprintOwner(bp.owner).toLowerCase().includes(q)) return true;
        if (bp.missionDebugName?.toLowerCase().includes(q)) return true;
        if (bp.missionTrigger?.toLowerCase().includes(q)) return true;
        return false;
    });
}

export function sortBlueprints(
    blueprints: BlueprintEntry[],
    sortKey: BlueprintSortKey
): BlueprintEntry[] {
    const sorted = [...blueprints];
    switch (sortKey) {
        case "dateAsc":
            sorted.sort((a, b) => a.ts - b.ts);
            break;
        case "nameAsc":
            sorted.sort((a, b) =>
                a.productName.localeCompare(b.productName, "fr", { sensitivity: "base" })
            );
            break;
        case "nameDesc":
            sorted.sort((a, b) =>
                b.productName.localeCompare(a.productName, "fr", { sensitivity: "base" })
            );
            break;
        case "ownerAsc":
            sorted.sort((a, b) => {
                const byOwner = (a.owner || "").localeCompare(b.owner || "", "fr", {
                    sensitivity: "base",
                });
                if (byOwner !== 0) return byOwner;
                return a.productName.localeCompare(b.productName, "fr", {
                    sensitivity: "base",
                });
            });
            break;
        case "ownerDesc":
            sorted.sort((a, b) => {
                const byOwner = (b.owner || "").localeCompare(a.owner || "", "fr", {
                    sensitivity: "base",
                });
                if (byOwner !== 0) return byOwner;
                return a.productName.localeCompare(b.productName, "fr", {
                    sensitivity: "base",
                });
            });
            break;
        case "dateDesc":
        default:
            sorted.sort((a, b) => b.ts - a.ts);
            break;
    }
    return sorted;
}

export function formatBlueprintDate(ts: number): string {
    try {
        return new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(ts * 1000));
    } catch {
        return String(ts);
    }
}
