import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";
import { getBuildInfo } from "@/utils/buildInfo";
import { getAppVersion } from "@/utils/version";
import openExternal from "@/utils/external";
import logger from "@/utils/logger";
import {
    updateService,
    type UpdateState,
} from "@/services/updateService";

interface UpdateInfo {
    version: string;
    notes: string;
    pub_date: string;
}

interface UseUpdaterConfig {
    checkOnStartup?: boolean;
    enableAutoUpdater?: boolean;
    githubRepo?: string;
}

const DEFAULT_GITHUB_REPO = "Onivoid/MultitoolV2";

export function useUpdater(config: UseUpdaterConfig = {}) {
    const {
        checkOnStartup = false,
        enableAutoUpdater = false,
        githubRepo = DEFAULT_GITHUB_REPO,
    } = config;

    const { toast } = useToast();

    const [serviceState, setServiceState] = useState<UpdateState>(
        updateService.getState(),
    );
    const [buildInfo, setBuildInfo] = useState<Awaited<
        ReturnType<typeof getBuildInfo>
    > | null>(null);
    const [currentVersion, setCurrentVersion] = useState<string>("");

    useEffect(() => {
        return updateService.subscribe(setServiceState);
    }, []);

    useEffect(() => {
        getBuildInfo()
            .then((info) => {
                setBuildInfo(info);
                setCurrentVersion(info.version || "");
            })
            .catch(logger.error);

        getAppVersion()
            .then((version) => setCurrentVersion(version || ""))
            .catch(logger.error);
    }, []);

    const getAutoUpdateSetting = useCallback(() => {
        return localStorage.getItem("autoUpdate") !== "false";
    }, []);

    const setAutoUpdateSetting = useCallback((enabled: boolean) => {
        localStorage.setItem("autoUpdate", enabled.toString());
    }, []);

    const getGitHubReleaseUrl = useCallback(
        (version?: string) => {
            if (version) {
                return `https://github.com/${githubRepo}/releases/tag/v${version}`;
            }
            return `https://github.com/${githubRepo}/releases/latest`;
        },
        [githubRepo],
    );

    const isUnsignedBuild = useCallback(() => {
        if (!buildInfo) return true;
        return !buildInfo.isSigned;
    }, [buildInfo]);

    const canUpdate = useCallback(() => {
        if (!buildInfo) return false;
        return (
            buildInfo.distribution !== "microsoft-store" &&
            buildInfo.canAutoUpdate
        );
    }, [buildInfo]);

    const updateInfo: UpdateInfo | null = serviceState.updateInfo
        ? {
              version: serviceState.updateInfo.version,
              notes: serviceState.updateInfo.body ?? "",
              pub_date: serviceState.updateInfo.date ?? new Date().toISOString(),
          }
        : null;

    const checkForUpdates = useCallback(
        async (silent = false) => {
            if (!canUpdate()) {
                if (!silent) {
                    const message =
                        buildInfo?.distribution === "microsoft-store"
                            ? "Les mises à jour sont gérées automatiquement par le Microsoft Store."
                            : "Les mises à jour automatiques ne sont pas supportées pour cette version.";
                    toast({
                        title: "Mises à jour non supportées",
                        description: message,
                        variant: "default",
                    });
                }
                return;
            }

            try {
                const update = await updateService.checkForUpdate(silent);
                if (!silent) {
                    if (update) {
                        toast({
                            title: `Mise à jour disponible: v${update.version}`,
                            description:
                                "Téléchargez et installez la mise à jour depuis cette page.",
                            variant: "default",
                        });
                    } else if (!serviceState.error) {
                        toast({
                            title: "Aucune mise à jour",
                            description:
                                "Vous utilisez déjà la dernière version.",
                            variant: "default",
                        });
                    }
                }
            } catch (error) {
                if (!silent) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Erreur inconnue";
                    toast({
                        title: "Erreur de vérification",
                        description: `Impossible de vérifier les mises à jour: ${errorMessage}`,
                        variant: "destructive",
                    });
                }
            }
        },
        [canUpdate, buildInfo, toast, serviceState.error],
    );

    const downloadUpdate = useCallback(async () => {
        if (!canUpdate()) {
            toast({
                title: "Téléchargement non supporté",
                description:
                    "Veuillez télécharger manuellement depuis GitHub ou le Microsoft Store.",
                variant: "destructive",
            });
            return;
        }

        const ok = await updateService.downloadUpdate();
        if (ok) {
            toast({
                title: "Mise à jour téléchargée",
                description: "Vous pouvez maintenant installer la mise à jour.",
                variant: "default",
            });
        } else if (serviceState.error) {
            toast({
                title: "Erreur de téléchargement",
                description: serviceState.error,
                variant: "destructive",
            });
        }
    }, [canUpdate, toast, serviceState.error]);

    const installUpdate = useCallback(async () => {
        if (!canUpdate()) return;
        try {
            await updateService.installAndRelaunch();
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Erreur inconnue";
            toast({
                title: "Erreur d'installation",
                description: errorMessage,
                variant: "destructive",
            });
        }
    }, [canUpdate, toast]);

    const downloadAndInstall = useCallback(async () => {
        if (!canUpdate()) return;
        try {
            await updateService.downloadAndInstall();
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Erreur inconnue";
            toast({
                title: "Erreur de mise à jour",
                description: errorMessage,
                variant: "destructive",
            });
        }
    }, [canUpdate, toast]);

    const openGitHubReleases = useCallback(async () => {
        try {
            await openExternal(
                getGitHubReleaseUrl(updateInfo?.version),
            );
        } catch {
            toast({
                title: "Erreur",
                description: "Impossible d'ouvrir le navigateur",
                variant: "destructive",
            });
        }
    }, [getGitHubReleaseUrl, updateInfo?.version, toast]);

    useEffect(() => {
        if (
            checkOnStartup &&
            getAutoUpdateSetting() &&
            enableAutoUpdater &&
            canUpdate()
        ) {
            const timer = setTimeout(() => {
                checkForUpdates(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [
        checkOnStartup,
        checkForUpdates,
        getAutoUpdateSetting,
        enableAutoUpdater,
        canUpdate,
    ]);

    const downloadProgress =
        serviceState.progress > 0 && serviceState.downloading
            ? Math.min(100, serviceState.progress)
            : serviceState.downloaded
              ? 100
              : 0;

    return {
        isChecking: serviceState.checking,
        updateAvailable: serviceState.available,
        updateInfo,
        isDownloading: serviceState.downloading,
        downloadProgress,
        error: serviceState.error,
        isInstalling: serviceState.installing,
        checkForUpdates,
        downloadUpdate,
        installUpdate,
        downloadAndInstall,
        openGitHubReleases,
        isUnsignedBuild: isUnsignedBuild(),
        autoUpdateEnabled: getAutoUpdateSetting(),
        setAutoUpdateEnabled: setAutoUpdateSetting,
        getGitHubReleaseUrl,
        canUpdate: canUpdate(),
        distribution: buildInfo?.distribution || "unknown",
        isPortable: buildInfo?.isPortable ?? false,
        currentVersion: currentVersion || "inconnue",
        latestVersion: updateInfo?.version ?? null,
        updateDownloaded: serviceState.downloaded,
    };
}
