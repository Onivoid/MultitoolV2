import { useEffect, useRef, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "@/components/ui/button";
import { getBuildInfo } from "@/utils/buildInfo";
import { formatVersion } from "@/utils/version";

export function Updater() {
    const [update, setUpdate] = useState<Update | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const totalSize = useRef(0);
    const downloaded = useRef(0);

    useEffect(() => {
        getBuildInfo()
            .then((info) => {
                if (!info.canAutoUpdate) return;

                return check().then((u) => {
                    if (u?.available) {
                        setUpdate(u);
                    }
                });
            })
            .catch((err) => console.error("[Updater] check() failed:", err));
    }, []);

    async function downloadAndInstall() {
        if (!update) return;
        try {
            setDownloading(true);
            downloaded.current = 0;
            totalSize.current = 0;

            await update.downloadAndInstall((event) => {
                switch (event.event) {
                    case "Started":
                        totalSize.current = event.data.contentLength ?? 0;
                        setDownloadProgress(0);
                        break;
                    case "Progress":
                        downloaded.current += event.data.chunkLength;
                        if (totalSize.current > 0) {
                            setDownloadProgress(
                                Math.min(
                                    99,
                                    Math.round(
                                        (downloaded.current / totalSize.current) *
                                            100,
                                    ),
                                ),
                            );
                        }
                        break;
                    case "Finished":
                        setDownloadProgress(100);
                        break;
                }
            });

            await relaunch();
        } catch (error) {
            console.error("Failed to download and install update:", error);
            setDownloading(false);
        }
    }

    if (!update?.available || dismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg">
            <div className="flex flex-col gap-3">
                <div>
                    <h3 className="text-sm font-semibold">Mise à jour disponible</h3>
                    <p className="text-xs text-muted-foreground">
                        La version {formatVersion(update.version)} est disponible.
                    </p>
                </div>

                {downloading && (
                    <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                                className="h-2 rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                        <p className="text-center text-xs text-muted-foreground">
                            {downloadProgress}%
                        </p>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        onClick={downloadAndInstall}
                        disabled={downloading}
                        size="sm"
                        className="flex-1"
                    >
                        {downloading ? "Téléchargement..." : "Installer"}
                    </Button>
                    <Button
                        onClick={() => setDismissed(true)}
                        disabled={downloading}
                        variant="outline"
                        size="sm"
                    >
                        Plus tard
                    </Button>
                </div>
            </div>
        </div>
    );
}
