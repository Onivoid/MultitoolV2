import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Download,
    ExternalLink,
    Shield,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Github
} from 'lucide-react';

interface UpdateInfo {
    version: string;
    notes: string;
    pub_date: string;
    signature?: string;
}

interface UpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    updateInfo: UpdateInfo | null;
    isDownloading: boolean;
    downloadProgress: number;
    isInstalling: boolean;
    isUnsignedBuild: boolean;
    autoUpdateEnabled: boolean;
    onAutoUpdateChange: (enabled: boolean) => void;
    onDownload: () => void;
    onOpenGitHub: () => void;
    onCheckUpdates: () => void;
    isChecking: boolean;
    error: string | null;
}

export function UpdateDialog({
    open,
    onOpenChange,
    updateInfo,
    isDownloading,
    downloadProgress,
    isInstalling,
    isUnsignedBuild,
    autoUpdateEnabled,
    onAutoUpdateChange,
    onDownload,
    onOpenGitHub,
    onCheckUpdates,
    isChecking,
    error
}: UpdateDialogProps) {
    const [showDetails, setShowDetails] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const SecurityWarningCard = () => (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="h-5 w-5" />
                    Build Non-signé
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                    Cette application n'est <strong>pas signée numériquement</strong> car les certificats
                    coûtent ~300€/an pour un projet gratuit et open-source.
                </p>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Windows SmartScreen peut afficher :
                    </p>
                    <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 ml-4">
                        <li>• "Application non reconnue"</li>
                        <li>• "Éditeur inconnu"</li>
                        <li>• "Voulez-vous vraiment exécuter ce fichier ?"</li>
                    </ul>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-md">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                        ✅ C'est normal et attendu !
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                        Cliquez sur "Informations complémentaires" → "Exécuter quand même"
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    const SecurityGuaranteesCard = () => (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Shield className="h-5 w-5" />
                    Garanties de Sécurité
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Code source ouvert
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                                Entièrement auditable sur GitHub
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Build reproductible
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                                Workflow GitHub Actions public
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Checksums SHA256
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                                Vérification d'intégrité fournie
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        {updateInfo ? `Mise à jour ${updateInfo.version}` : 'Vérification des mises à jour'}
                    </DialogTitle>
                    <DialogDescription>
                        {updateInfo
                            ? "Une nouvelle version est disponible"
                            : "Gérez les mises à jour de l'application"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Contrôles généraux */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Mises à jour automatiques</p>
                                    <p className="text-xs text-muted-foreground">
                                        Vérifier automatiquement les nouvelles versions
                                    </p>
                                </div>
                                <Switch
                                    checked={autoUpdateEnabled}
                                    onCheckedChange={onAutoUpdateChange}
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCheckUpdates}
                                    disabled={isChecking}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                                    {isChecking ? 'Vérification...' : 'Vérifier maintenant'}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenGitHub}
                                    className="flex items-center gap-2"
                                >
                                    <Github className="h-4 w-4" />
                                    Voir sur GitHub
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Erreur */}
                    {error && (
                        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Erreur</span>
                                </div>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Information sur la mise à jour */}
                    {updateInfo && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Version {updateInfo.version}</CardTitle>
                                        <Badge variant="secondary">
                                            {formatDate(updateInfo.pub_date)}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {updateInfo.notes && (
                                        <div className="space-y-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowDetails(!showDetails)}
                                                className="p-0 h-auto font-normal"
                                            >
                                                {showDetails ? 'Masquer' : 'Voir'} les notes de version
                                            </Button>
                                            {showDetails && (
                                                <div className="bg-muted p-3 rounded-md">
                                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                                        {updateInfo.notes}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Avertissements de sécurité pour builds non-signés */}
                            {isUnsignedBuild && (
                                <div className="space-y-3">
                                    <SecurityWarningCard />
                                    <SecurityGuaranteesCard />
                                </div>
                            )}

                            {/* Statut de téléchargement */}
                            {(isDownloading || isInstalling) && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">
                                                    {isInstalling ? 'Installation...' : 'Téléchargement...'}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {isInstalling ? 'Finalisation' : `${downloadProgress}%`}
                                                </span>
                                            </div>
                                            <Progress value={isInstalling ? 100 : downloadProgress} />
                                            {isInstalling && (
                                                <p className="text-xs text-muted-foreground">
                                                    L'application va redémarrer automatiquement
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
                    {updateInfo && !isDownloading && !isInstalling && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            {isUnsignedBuild && (
                                <Button
                                    variant="outline"
                                    onClick={onOpenGitHub}
                                    className="flex items-center gap-2 flex-1 sm:flex-initial"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Télécharger manuellement
                                </Button>
                            )}
                            <Button
                                onClick={onDownload}
                                className="flex items-center gap-2 flex-1 sm:flex-initial"
                                variant={isUnsignedBuild ? "secondary" : "default"}
                            >
                                <Download className="h-4 w-4" />
                                {isUnsignedBuild ? 'Télécharger (non-signé)' : 'Télécharger'}
                            </Button>
                        </div>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 