import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    Code,
    Download,
    Github,
    ExternalLink,
    Heart
} from 'lucide-react';

/**
 * Interface pour les props du composant SecurityWarning.
 */
interface SecurityWarningProps {
    /**
     * Fonction appelée lorsque l'utilisateur clique sur "Continuer".
     */
    onContinue: () => void;
}

/**
 * Dialogue d'avertissement de sécurité pour les builds non-signés.
 * Informe l'utilisateur des avertissements Windows SmartScreen attendus et des garanties de sécurité.
 */
export function SecurityWarning({ onContinue }: SecurityWarningProps) {
    const [open, setOpen] = useState(false);
    const [understood, setUnderstood] = useState(false);
    const [neverShowAgain, setNeverShowAgain] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);

    /**
     * Initialisation du composant.
     * Vérifie si l'avertissement de sécurité doit être affiché.
     */
    useEffect(() => {
        const init = async () => {
            try {
                const { shouldShowSecurityWarning } = await import('@/utils/buildInfo');
                const show = await shouldShowSecurityWarning();
                setShouldShow(show);
                const hasSeenWarning = localStorage.getItem('security-warning-seen');
                if (show && !hasSeenWarning) {
                    setOpen(true);
                }
            } catch {
                setShouldShow(false);
            }
        };
        void init();
    }, []);

    /**
     * Gestion de la poursuite de l'utilisation de l'application.
     */
    const handleContinue = () => {
        if (neverShowAgain) {
            localStorage.setItem('security-warning-seen', 'true');
        }
        setOpen(false);
        onContinue();
    };

    /**
     * Gestion de la fermeture du dialogue.
     */
    const handleDismiss = () => {
        localStorage.setItem('security-warning-seen', 'true');
        setOpen(false);
        onContinue();
    };

    if (!shouldShow) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-6 w-6 text-blue-600" />
                        Bienvenue dans MultitoolV2
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Application open-source gratuite avec modèle de sécurité transparent
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Avertissement principal */}
                    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                                <AlertTriangle className="h-5 w-5" />
                                Information Importante - Application Non-signée
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                                        Pourquoi pas de signature numérique ?
                                    </h4>
                                    <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                                        <li>• Certificat de code : ~300€/an</li>
                                        <li>• Projet gratuit et open-source</li>
                                        <li>• Préférence pour la transparence totale</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                                        Conséquences attendues :
                                    </h4>
                                    <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                                        <li>• Windows SmartScreen peut alerter</li>
                                        <li>• Antivirus : faux positifs possibles</li>
                                        <li>• "Éditeur inconnu" dans les propriétés</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-md">
                                <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                                    Si Windows SmartScreen apparaît :
                                </p>
                                <p className="text-sm text-orange-600 dark:text-orange-400">
                                    1. Cliquez sur "Informations complémentaires"<br />
                                    2. Puis "Exécuter quand même"<br />
                                    3. C'est normal pour une app non-signée !
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Garanties de sécurité */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                    <CheckCircle className="h-5 w-5" />
                                    Garanties de Sécurité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <Code className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
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
                                    <Github className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
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
                                    <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                            Checksums SHA256
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                            Vérification d'intégrité fournie
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                                    <Download className="h-5 w-5" />
                                    Options d'Installation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Recommandé
                                        </Badge>
                                        <span className="text-sm font-medium">Version Portable</span>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                        Aucune installation, pas d'avertissement SmartScreen
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Alternative</Badge>
                                        <span className="text-sm font-medium">Microsoft Store</span>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                        Version signée par Microsoft (si disponible)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Standard</Badge>
                                        <span className="text-sm font-medium">Installer GitHub</span>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                        Avertissement SmartScreen attendu
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Modèle économique transparent */}
                    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                                <Heart className="h-5 w-5" />
                                Pourquoi Gratuit et Open-Source ?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="text-purple-700 dark:text-purple-300">
                                    <strong>Passion :</strong> Projet développé par amour du code et de la communauté
                                </div>
                                <div className="text-purple-700 dark:text-purple-300">
                                    <strong>Transparence :</strong> Chaque ligne de code est publique et auditable
                                </div>
                                <div className="text-purple-700 dark:text-purple-300">
                                    <strong>Éthique :</strong> Aucune collecte de données, aucune publicité
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Liens utiles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ExternalLink className="h-5 w-5" />
                                Liens Utiles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Vérification et Transparence</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Code source sur GitHub</li>
                                        <li>• Historique des builds publics</li>
                                        <li>• Checksums SHA256 des releases</li>
                                        <li>• Workflow de build transparent</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium">Support et Communauté</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Issues GitHub pour les bugs</li>
                                        <li>• Discussions pour les suggestions</li>
                                        <li>• Wiki avec documentation</li>
                                        <li>• Releases avec notes détaillées</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Confirmation */}
                    <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="understood"
                                        checked={understood}
                                        onCheckedChange={(checked) => setUnderstood(checked === true)}
                                    />
                                    <label htmlFor="understood" className="text-sm leading-relaxed">
                                        Je comprends que cette application est <strong>non-signée</strong> et que
                                        Windows peut afficher des avertissements de sécurité. J'accepte d'utiliser
                                        cette application open-source à mes propres risques.
                                    </label>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="never-show"
                                        checked={neverShowAgain}
                                        onCheckedChange={(checked) => setNeverShowAgain(checked === true)}
                                    />
                                    <label htmlFor="never-show" className="text-sm text-muted-foreground">
                                        Ne plus afficher cet avertissement
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
                    <Button
                        variant="outline"
                        onClick={handleDismiss}
                        className="flex items-center gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Fermer et aller sur GitHub
                    </Button>
                    <Button
                        onClick={handleContinue}
                        disabled={!understood}
                        className="flex items-center gap-2"
                    >
                        <CheckCircle className="h-4 w-4" />
                        Continuer avec l'application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 