import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Github,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Update } from "@tauri-apps/plugin-updater";
import type { CheckStatus } from "@/features/update/useUpdate";
import type { VersionChangelog } from "@/features/patchnotes/patchnotes.lib";
import { VersionChangelogBlock } from "@/features/update/components/VersionChangelogBlock";
import type { BuildInfo } from "@/utils/buildInfo";
import { formatVersion } from "@/utils/version";
import { openExternalUrl } from "@/shared/lib/openExternal";
import {
  getGithubReleasesUrl,
  getStatusBadgeVariant,
  getStatusLabel,
} from "@/features/update/update.lib";
import { cn } from "@/lib/utils";

interface UpdatePanelProps {
  status: CheckStatus;
  update: Update | null;
  currentVersion: string;
  error: string;
  downloading: boolean;
  downloadProgress: number;
  buildInfo: BuildInfo;
  canUseUpdater: boolean;
  installedChangelog: VersionChangelog | null;
  availableChangelog: VersionChangelog | null;
  changelogsLoading: boolean;
  onCheck: () => void;
  onDownloadAndInstall: () => void;
}

function StatusMessage({
  status,
  error,
  update,
  buildInfo,
  canUseUpdater,
}: Pick<
  UpdatePanelProps,
  "status" | "error" | "update" | "buildInfo" | "canUseUpdater"
>) {
  if (status === "unsupported") {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        {buildInfo.isPortable
          ? "La version portable ne prend pas en charge l'updater intégré. Téléchargez une nouvelle version sur GitHub."
          : "Les mises à jour automatiques ne sont pas disponibles pour cette installation."}
      </p>
    );
  }

  if (status === "idle" && canUseUpdater) {
    return (
      <p className="text-sm text-muted-foreground">
        Lancez une vérification pour détecter une nouvelle version.
      </p>
    );
  }

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
        Vérification en cours…
      </div>
    );
  }

  if (status === "up-to-date") {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <CheckCircle className="h-4 w-4 shrink-0" />
        Vous utilisez la dernière version disponible.
      </div>
    );
  }

  if (status === "available" && update) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Version {formatVersion(update.version)} prête à installer
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          Échec de la vérification ou de l&apos;installation
        </div>
        {error && (
          <p className="break-all rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return null;
}

export function UpdatePanel({
  status,
  update,
  currentVersion,
  error,
  downloading,
  downloadProgress,
  buildInfo,
  canUseUpdater,
  installedChangelog,
  availableChangelog,
  changelogsLoading,
  onCheck,
  onDownloadAndInstall,
}: UpdatePanelProps) {
  const showInstalledChangelog =
    installedChangelog &&
    (status !== "available" ||
      !availableChangelog ||
      installedChangelog.version !== availableChangelog.version);

  const showAvailableChangelog = status === "available" && availableChangelog;

  const showUpdaterBody = status === "available" && update?.body && !availableChangelog;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="settings-section mx-auto flex w-full max-w-lg flex-col overflow-hidden"
      data-no-window-drag
    >
      <div className="space-y-3 px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusBadgeVariant(status)} className="text-[11px]">
            {getStatusLabel(status)}
          </Badge>
        </div>

        <div className="space-y-1.5 rounded-md border border-primary/12 bg-primary/5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Installée</span>
            <span className="font-mono font-semibold">
              {currentVersion ? formatVersion(currentVersion) : "—"}
            </span>
          </div>
          {status === "available" && update && (
            <div className="flex items-center justify-between gap-3 border-t border-primary/10 pt-2 text-sm">
              <span className="text-muted-foreground">Disponible</span>
              <span className="font-mono font-semibold text-primary">
                {formatVersion(update.version)}
              </span>
            </div>
          )}
        </div>

        {showInstalledChangelog && (
          <VersionChangelogBlock changelog={installedChangelog} />
        )}

        {showAvailableChangelog && (
          <VersionChangelogBlock changelog={availableChangelog} variant="available" />
        )}

        {showUpdaterBody && (
          <div className="rounded-md border border-primary/12 bg-primary/5 px-3 py-2.5">
            <div className="max-h-28 overflow-y-auto pr-1" data-no-window-drag>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {update.body}
              </p>
            </div>
          </div>
        )}

        {changelogsLoading && !installedChangelog && !availableChangelog && (
          <p className="text-xs text-muted-foreground">
            Chargement des notes de version…
          </p>
        )}

        <StatusMessage
          status={status}
          error={error}
          update={update}
          buildInfo={buildInfo}
          canUseUpdater={canUseUpdater}
        />

        {downloading && (
          <div className="space-y-2">
            <Progress value={downloadProgress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">
              Téléchargement {downloadProgress}%
            </p>
          </div>
        )}
      </div>

      <footer className="settings-section-footer flex flex-wrap gap-2 px-3 py-3">
        {canUseUpdater &&
          (status === "available" ? (
            <Button
              type="button"
              className="h-10 flex-1 gap-1.5 text-sm"
              disabled={downloading}
              onClick={onDownloadAndInstall}
              data-no-window-drag
            >
              <Download className="h-4 w-4 shrink-0" />
              {downloading ? "Installation…" : "Installer et redémarrer"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 flex-1 gap-1.5 border-primary/20 bg-primary/10 text-sm shadow-none",
              )}
              disabled={status === "checking" || downloading}
              onClick={onCheck}
              data-no-window-drag
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 shrink-0",
                  status === "checking" && "animate-spin",
                )}
              />
              Vérifier les mises à jour
            </Button>
          ))}
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-1.5 border-primary/20 bg-primary/10 text-sm shadow-none sm:flex-1"
          onClick={() => openExternalUrl(getGithubReleasesUrl(buildInfo.githubRepo))}
          data-no-window-drag
        >
          <Github className="h-4 w-4 shrink-0" />
          Voir sur GitHub
        </Button>
      </footer>
    </motion.section>
  );
}
