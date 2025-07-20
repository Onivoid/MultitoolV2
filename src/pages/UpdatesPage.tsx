import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdater } from '@/hooks/useUpdater';
import { Download, CheckCircle, Github } from 'lucide-react';

export default function UpdatesPage() {
    const [showDialog, setShowDialog] = useState(false);

    const updater = useUpdater({
        checkOnStartup: false,
        enableAutoUpdater: true,
        githubRepo: 'Onivoid/MultitoolV2'
    });

    const handleOpenGitHub = () => {
        window.open('https://github.com/Onivoid/MultitoolV2/releases', '_blank');
    };

    return (
        <div className="flex flex-col w-full h-full p-6 space-y-6 overflow-y-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Mises à jour</h1>
                <p className="text-muted-foreground">
                    Test de la page de mise à jour - Version simplifiée
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Version Actuelle
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="font-medium">MultitoolV2 v2.0.0</p>
                        <p className="text-sm text-muted-foreground">
                            Application à jour
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => updater.checkForUpdates(false)}
                            disabled={updater.isChecking}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {updater.isChecking ? 'Vérification...' : 'Vérifier les mises à jour'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleOpenGitHub}
                            className="flex items-center gap-2"
                        >
                            <Github className="h-4 w-4" />
                            GitHub
                        </Button>
                    </div>

                    {updater.error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                Erreur: {updater.error}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 