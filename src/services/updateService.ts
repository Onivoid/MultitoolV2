/**
 * Service de mise à jour automatique
 *
 * Ce service gère la vérification, le téléchargement et l'installation
 * des mises à jour via GitHub Releases en utilisant tauri-plugin-updater.
 *
 * Fonctionnalités :
 * - Vérification automatique au démarrage
 * - Téléchargement silencieux en arrière-plan
 * - Gestion du mode démarrage automatique Windows (--minimized)
 * - Notifications système pour les mises à jour en tray
 * - Support des versions non signées (open-source)
 */

import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from "@tauri-apps/plugin-notification";
import { getBuildInfo } from "@/utils/buildInfo";
import logger from "@/utils/logger";

export interface UpdateProgress {
    event: "Started" | "Progress" | "Finished";
    data?: {
        contentLength?: number;
        chunkLength?: number;
    };
}

export interface UpdateState {
    checking: boolean;
    available: boolean;
    downloading: boolean;
    downloaded: boolean;
    installing: boolean;
    error: string | null;
    updateInfo: Update | null;
    progress: number;
}

export type UpdateStateListener = (state: UpdateState) => void;

class UpdateService {
    private state: UpdateState = {
        checking: false,
        available: false,
        downloading: false,
        downloaded: false,
        installing: false,
        error: null,
        updateInfo: null,
        progress: 0,
    };

    private listeners: Set<UpdateStateListener> = new Set();
    private updateInstance: Update | null = null;
    private isMinimizedStart: boolean = false;

    setMinimizedStart(minimized: boolean) {
        this.isMinimizedStart = minimized;
        logger.info(
            `Mode de démarrage: ${minimized ? "minimisé (tray)" : "normal"}`,
        );
    }

    subscribe(listener: UpdateStateListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach((listener) => listener({ ...this.state }));
    }

    private setState(partial: Partial<UpdateState>) {
        this.state = { ...this.state, ...partial };
        this.notifyListeners();
    }

    private async canUpdate(): Promise<boolean> {
        try {
            const buildInfo = await getBuildInfo();

            if (buildInfo.distribution === "microsoft-store") {
                logger.info(
                    "Version Microsoft Store détectée - mises à jour gérées par le Store",
                );
                return false;
            }

            return buildInfo.canAutoUpdate;
        } catch (error) {
            logger.error(
                "Erreur lors de la vérification de la distribution:",
                error,
            );
            return false;
        }
    }

    private async sendSystemNotification(title: string, body: string) {
        try {
            let permissionGranted = await isPermissionGranted();

            if (!permissionGranted) {
                const permission = await requestPermission();
                permissionGranted = permission === "granted";
            }

            if (permissionGranted) {
                await sendNotification({ title, body });
            }
        } catch (error) {
            logger.error("Erreur lors de l'envoi de la notification:", error);
        }
    }

    async checkForUpdate(silent: boolean = false): Promise<Update | null> {
        if (this.state.checking) {
            logger.warn("Vérification déjà en cours");
            return null;
        }

        const canUpdate = await this.canUpdate();
        if (!canUpdate) {
            if (!silent) {
                logger.info(
                    "Les mises à jour automatiques ne sont pas supportées pour cette version",
                );
            }
            return null;
        }

        this.setState({ checking: true, error: null });

        try {
            logger.info("Vérification des mises à jour...");

            const update = await check();

            if (update) {
                logger.info(
                    `Mise à jour disponible: ${update.version} (actuelle: ${update.currentVersion})`,
                );
                logger.info(`Date de publication: ${update.date}`);

                this.updateInstance = update;
                this.setState({
                    checking: false,
                    available: true,
                    updateInfo: update,
                });

                if (this.isMinimizedStart) {
                    await this.sendSystemNotification(
                        "Mise à jour disponible",
                        `MultitoolV2 v${update.version} est disponible. Le téléchargement va commencer automatiquement.`,
                    );
                }

                return update;
            } else {
                logger.info("Aucune mise à jour disponible");
                this.setState({ checking: false, available: false });
                return null;
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Erreur inconnue";
            logger.error(
                "Erreur lors de la vérification des mises à jour:",
                errorMessage,
            );

            this.setState({
                checking: false,
                error: errorMessage,
            });

            if (!silent) {
                throw error;
            }
            return null;
        }
    }

    async downloadUpdate(): Promise<boolean> {
        if (!this.updateInstance) {
            logger.error("Aucune mise à jour à télécharger");
            return false;
        }

        if (this.state.downloading || this.state.downloaded) {
            logger.warn("Téléchargement déjà en cours ou terminé");
            return this.state.downloaded;
        }

        this.setState({ downloading: true, progress: 0, error: null });

        try {
            logger.info("Début du téléchargement de la mise à jour...");

            await this.updateInstance.download((event) => {
                if (event.event === "Started") {
                    const size = event.data.contentLength || 0;
                    logger.info(
                        `Téléchargement démarré - Taille: ${(size / 1024 / 1024).toFixed(2)} MB`,
                    );
                } else if (event.event === "Progress") {
                    const chunk = event.data.chunkLength || 0;
                    const currentProgress = this.state.progress + chunk;
                    this.setState({ progress: currentProgress });
                } else if (event.event === "Finished") {
                    logger.info("Téléchargement terminé");
                }
            });

            this.setState({
                downloading: false,
                downloaded: true,
                progress: 100,
            });

            if (this.isMinimizedStart) {
                await this.sendSystemNotification(
                    "Mise à jour téléchargée",
                    "La mise à jour sera installée au prochain redémarrage de l'application.",
                );
            }

            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Erreur inconnue";
            logger.error("Erreur lors du téléchargement:", errorMessage);

            this.setState({
                downloading: false,
                downloaded: false,
                error: errorMessage,
            });

            return false;
        }
    }

    async installAndRelaunch(): Promise<void> {
        if (!this.updateInstance || !this.state.downloaded) {
            throw new Error("Aucune mise à jour téléchargée à installer");
        }

        this.setState({ installing: true, error: null });

        try {
            logger.info("Installation de la mise à jour...");

            await this.updateInstance.install();

            logger.info(
                "Mise à jour installée, redémarrage de l'application...",
            );

            await relaunch();
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Erreur inconnue";
            logger.error("Erreur lors de l'installation:", errorMessage);

            this.setState({
                installing: false,
                error: errorMessage,
            });

            throw error;
        }
    }

    async downloadAndInstall(): Promise<void> {
        if (!this.updateInstance) {
            throw new Error("Aucune mise à jour disponible");
        }

        this.setState({ downloading: true, progress: 0, error: null });

        try {
            logger.info("Téléchargement et installation de la mise à jour...");

            await this.updateInstance.downloadAndInstall((event) => {
                if (event.event === "Started") {
                    const size = event.data.contentLength || 0;
                    logger.info(
                        `Téléchargement démarré - Taille: ${(size / 1024 / 1024).toFixed(2)} MB`,
                    );
                } else if (event.event === "Progress") {
                    const chunk = event.data.chunkLength || 0;
                    const currentProgress = this.state.progress + chunk;
                    this.setState({ progress: currentProgress });
                } else if (event.event === "Finished") {
                    logger.info(
                        "Téléchargement terminé, installation en cours...",
                    );
                    this.setState({
                        downloading: false,
                        downloaded: true,
                        installing: true,
                    });
                }
            });

            logger.info("Mise à jour installée, redémarrage...");
            await relaunch();
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Erreur inconnue";
            logger.error(
                "Erreur lors du téléchargement/installation:",
                errorMessage,
            );

            this.setState({
                downloading: false,
                installing: false,
                error: errorMessage,
            });

            throw error;
        }
    }

    async autoUpdate(): Promise<void> {
        try {
            const update = await this.checkForUpdate(true);

            if (!update) {
                logger.info("Aucune mise à jour disponible");
                return;
            }

            const downloaded = await this.downloadUpdate();

            if (!downloaded) {
                logger.error("Échec du téléchargement de la mise à jour");
                return;
            }

            if (this.isMinimizedStart) {
                logger.info(
                    "Mode minimisé: mise à jour téléchargée, en attente d'installation",
                );
                return;
            }

            logger.info("Mise à jour prête à être installée");
        } catch (error) {
            logger.error(
                "Erreur lors du processus de mise à jour automatique:",
                error,
            );
        }
    }

    getState(): UpdateState {
        return { ...this.state };
    }

    reset() {
        this.updateInstance = null;
        this.setState({
            checking: false,
            available: false,
            downloading: false,
            downloaded: false,
            installing: false,
            error: null,
            updateInfo: null,
            progress: 0,
        });
    }
}

export const updateService = new UpdateService();
