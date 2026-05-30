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
import { formatVersion } from "@/utils/version";
import { openExternalUrl } from "@/shared/lib/openExternal";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_SCROLL } from "@/shared/components/pageStyles";
import { useUpdate } from "@/features/update/useUpdate";

export default function UpdatePage() {
  const {
    status,
    update,
    currentVersion,
    error,
    downloading,
    downloadProgress,
    buildInfo,
    canUseUpdater,
    runCheck,
    downloadAndInstall,
  } = useUpdate();

  return (
    <PageMotion className="px-4">
      <div className={`${PAGE_SCROLL} space-y-6 pb-4 pt-2`}>
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
                {currentVersion ? formatVersion(currentVersion) : "—"}
              </span>
            </div>

            {status === "available" && update && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Disponible</span>
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
                    Mise à jour disponible : {formatVersion(update.version)}
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
                  {downloading ? "Installation..." : "Installer et redémarrer"}
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
                    openExternalUrl(
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
                    openExternalUrl(
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
    </PageMotion>
  );
}
