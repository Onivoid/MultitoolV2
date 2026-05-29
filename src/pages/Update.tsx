import { useEffect, useRef, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Download,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    Store,
    Github,
} from "lucide-react";
import { getBuildInfo, type BuildInfo } from "@/utils/buildInfo";
import { formatVersion } from "@/utils/version";
import openExternal from "@/utils/external";

type CheckStatus = "idle" | "checking" | "available" | "up-to-date" | "error" | "unsupported";

export default function UpdatePage() {
    const [status, setStatus] = useState<CheckStatus>("idle");
    const [update, setUpdate] = useState<Update | null>(null);
    const [currentVersion, setCurrentVersion] = useState("");
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
    const totalSize = useRef(0);
    const downloaded = useRef(0);

    useEffect(() => {
        getVersion().then(setCurrentVersion).catch(() => {});
        getBuildInfo()
            .then(async (info) => {
                setBuildInfo(info);
                if (!info.canAutoUpdate) {
                    setStatus("unsupported");
                    return;
                }
                await runCheck();
            })
            .catch(() => setStatus("error"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function runCheck() {
        const info = buildInfo ?? (await getBuildInfo());
        if (!info.canAutoUpdate) {
            setStatus("unsupported");
            return;
        }

        setStatus("checking");
        setError("");
        setUpdate(null);
        try {
            const u = await check();
            if (u?.available) {
                setUpdate(u);
                setStatus("available");
            } else {
                setStatus("up-to-date");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
            setStatus("error");
        }
    }

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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
            setStatus("error");
            setDownloading(false);
        }
    }

    const canUseUpdater = buildInfo?.canAutoUpdate ?? false;

    return (
        <div className="flex h-full w-full flex-col space-y-6 overflow-y-auto p-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Mises à jour</h1>
                <p className="text-muted-foreground">
                    Vérifiez et installez les mises à jour de MultitoolV2
                </p>
            </div>

            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        {buildInfo?.distribution === "microsoft-store" ? (
                            <Store className="h-5 w-5" />
                        ) : (
                            <Github className="h-5 w-5" />
                        )}
                        Version actuelle
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Installée</span>
                        <span className="font-mono text-sm font-semibold">
                            {currentVersion
                                ? formatVersion(currentVersion)
                                : "—"}
                        </span>
                    </div>

                    {status === "available" && update && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Disponible
                            </span>
                            <span className="font-mono text-sm font-semibold text-primary">
                                {formatVersion(update.version)}
                            </span>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        {status === "unsupported" && (
                            <p className="text-sm text-muted-foreground">
                                {buildInfo?.distribution === "microsoft-store"
                                    ? "Les mises à jour sont gérées par le Microsoft Store."
                                    : "Les mises à jour automatiques ne sont pas disponibles pour cette version."}
                            </p>
                        )}

                        {status === "idle" && canUseUpdater && (
                            <p className="text-sm text-muted-foreground">
                                Cliquez sur « Vérifier » pour rechercher une mise à jour.
                            </p>
                        )}

                        {status === "checking" && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Vérification en cours...
                            </div>
                        )}

                        {status === "up-to-date" && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Vous êtes à jour.
                            </div>
                        )}

                        {status === "available" && update && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-primary">
                                    <AlertCircle className="h-4 w-4" />
                                    Mise à jour disponible :{" "}
                                    {formatVersion(update.version)}
                                </div>
                                {update.body && (
                                    <p className="whitespace-pre-wrap rounded bg-muted p-2 text-xs text-muted-foreground">
                                        {update.body}
                                    </p>
                                )}
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <XCircle className="h-4 w-4" />
                                    Échec de la vérification
                                </div>
                                {error && (
                                    <p className="break-all rounded bg-destructive/10 p-2 font-mono text-xs text-destructive">
                                        {error}
                                    </p>
                                )}
                            </div>
                        )}
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
                                Téléchargement {downloadProgress}%
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                        {canUseUpdater && status === "available" ? (
                            <Button
                                onClick={downloadAndInstall}
                                disabled={downloading}
                                className="flex-1"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {downloading
                                    ? "Installation..."
                                    : "Installer et redémarrer"}
                            </Button>
                        ) : canUseUpdater ? (
                            <Button
                                onClick={runCheck}
                                disabled={status === "checking"}
                                variant="outline"
                                className="flex-1"
                            >
                                <RefreshCw
                                    className={`mr-2 h-4 w-4 ${status === "checking" ? "animate-spin" : ""}`}
                                />
                                Vérifier les mises à jour
                            </Button>
                        ) : null}

                        {buildInfo?.distribution === "microsoft-store" ? (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    openExternal(
                                        "ms-windows-store://pdp/?productid=YourProductId",
                                    )
                                }
                            >
                                <Store className="mr-2 h-4 w-4" />
                                Ouvrir le Store
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    openExternal(
                                        `https://github.com/${buildInfo?.githubRepo ?? "Onivoid/MultitoolV2"}/releases`,
                                    )
                                }
                            >
                                <Github className="mr-2 h-4 w-4" />
                                Voir sur GitHub
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
