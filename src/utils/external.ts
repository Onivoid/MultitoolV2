import { invoke } from "@tauri-apps/api/core";

// Autorise https, http (si besoin), et schémas ms-windows-store
function isAllowedUrl(url: string): boolean {
    try {
        const u = new URL(url);
        if (
            u.protocol === "https:" ||
            u.protocol === "http:" ||
            url.startsWith("ms-windows-store://")
        ) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export async function openExternal(url: string): Promise<void> {
    if (!isAllowedUrl(url)) return;
    await invoke("open_external", { url });
}

export default openExternal;
