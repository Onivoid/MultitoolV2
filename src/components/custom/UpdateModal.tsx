/**
 * Modal de mise à jour bloquant
 * 
 * Affiche une popup modale qui bloque toute interaction avec l'application
 * lorsqu'une mise à jour est prête à être installée.
 * 
 * Comportements :
 * - Affiche les informations de la nouvelle version
 * - Affiche les notes de version (release notes)
 * - Propose "Redémarrer maintenant" ou "Plus tard"
 * - Si "Plus tard", redemande dans 1 heure
 */

import { useEffect, useState } from 'react';
import { updateService, UpdateState } from '@/services/updateService';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import logger from '@/utils/logger';

interface UpdateModalProps {
    autoShow?: boolean;
}

export function UpdateModal({ autoShow = true }: UpdateModalProps) {
    const [updateState, setUpdateState] = useState<UpdateState>(updateService.getState());
    const [isOpen, setIsOpen] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [postponeCount, setPostponeCount] = useState(0);

    useEffect(() => {
        const unsubscribe = updateService.subscribe((state) => {
            setUpdateState(state);

            if (autoShow && state.downloaded && !state.installing) {
                setIsOpen(true);
            }
        });

        return unsubscribe;
    }, [autoShow]);

    useEffect(() => {
        if (postponeCount > 0) {
            const timer = setTimeout(() => {
                logger.info('Rappel de mise à jour après report');
                setIsOpen(true);
            }, 60 * 60 * 1000);

            return () => clearTimeout(timer);
        }
    }, [postponeCount]);

    const handleInstallNow = async () => {
        setIsInstalling(true);
        try {
            await updateService.installAndRelaunch();
        } catch (error) {
            logger.error('Erreur lors de l\'installation:', error);
            setIsInstalling(false);
        }
    };

    const handlePostpone = () => {
        setIsOpen(false);
        setPostponeCount(prev => prev + 1);
        logger.info('Mise à jour reportée, rappel dans 1 heure');
    };

    const formatReleaseNotes = (notes: string | undefined) => {
        if (!notes) return 'Aucune note de version disponible.';

        const truncated = notes.length > 500 ? notes.substring(0, 500) + '...' : notes;
        return truncated;
    };

    if (!updateState.downloaded) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!isInstalling) {
                setIsOpen(open);
            }
        }}>
            <DialogContent
                className="sm:max-w-[600px]"
                onPointerDownOutside={(e) => {
                    if (isInstalling) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (isInstalling) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Download className="h-6 w-6 text-primary" />
                        Mise à jour disponible
                    </DialogTitle>
                    <DialogDescription>
                        Une nouvelle version de MultitoolV2 est prête à être installée
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Informations de version */}
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Version actuelle</p>
                                <p className="text-lg font-semibold">
                                    v{updateState.updateInfo?.currentVersion || 'inconnue'}
                                </p>
                            </div>
                            <RefreshCw className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Nouvelle version</p>
                                <p className="text-lg font-semibold text-primary">
                                    v{updateState.updateInfo?.version || 'inconnue'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes de version */}
                    {updateState.updateInfo?.body && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Notes de version</h4>
                            <div className="h-[150px] overflow-y-auto rounded-lg border bg-muted/30 p-3">
                                <pre className="whitespace-pre-wrap text-xs">
                                    {formatReleaseNotes(updateState.updateInfo.body)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Barre de progression si installation en cours */}
                    {isInstalling && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Installation en cours...</span>
                            </div>
                            <Progress value={100} className="h-2" />
                        </div>
                    )}

                    {/* Avertissement si plusieurs reports */}
                    {postponeCount >= 2 && !isInstalling && (
                        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Mise à jour importante</p>
                                <p className="text-xs mt-1">
                                    Vous avez reporté cette mise à jour {postponeCount} fois.
                                    Il est recommandé de l'installer pour bénéficier des dernières améliorations et corrections.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Message d'information */}
                    <p className="text-xs text-muted-foreground">
                        L'application va redémarrer automatiquement après l'installation.
                        Vos paramètres et données seront conservés.
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    {!isInstalling && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handlePostpone}
                                className="gap-2"
                            >
                                <Clock className="h-4 w-4" />
                                Plus tard
                            </Button>
                            <Button
                                onClick={handleInstallNow}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Redémarrer maintenant
                            </Button>
                        </>
                    )}
                    {isInstalling && (
                        <Button disabled className="gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Installation en cours...
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
