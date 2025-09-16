import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BackgroundServiceConfig {
    enabled: boolean;
    check_interval_minutes: number;
    auto_update: boolean;
    start_with_windows: boolean;
}

export function BackgroundServiceSettings() {
    const { toast } = useToast();
    const [config, setConfig] = useState<BackgroundServiceConfig>({
        enabled: false,
        check_interval_minutes: 60,
        auto_update: true,
        start_with_windows: false,
    });
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Load current configuration
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const currentConfig = await invoke<BackgroundServiceConfig>("get_background_service_config");
                setConfig(currentConfig);
            } catch (error) {
                console.error("Failed to load background service config:", error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger la configuration du service en arrière-plan.",
                    variant: "destructive",
                });
            } finally {
                setInitialLoad(false);
            }
        };

        loadConfig();
    }, [toast]);

    const saveConfig = async (newConfig: BackgroundServiceConfig) => {
        setLoading(true);
        try {
            await invoke("set_background_service_config", { config: newConfig });
            setConfig(newConfig);
            toast({
                title: "Configuration sauvegardée",
                description: "Les paramètres du service en arrière-plan ont été mis à jour.",
                variant: "success",
            });
        } catch (error) {
            console.error("Failed to save config:", error);
            toast({
                title: "Erreur",
                description: "Impossible de sauvegarder la configuration.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (enabled: boolean) => {
        const newConfig = { ...config, enabled };
        await saveConfig(newConfig);
    };

    const handleToggleAutoUpdate = async (auto_update: boolean) => {
        const newConfig = { ...config, auto_update };
        await saveConfig(newConfig);
    };

    const handleToggleStartWithWindows = async (start_with_windows: boolean) => {
        const newConfig = { ...config, start_with_windows };
        await saveConfig(newConfig);
    };

    const handleIntervalChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (isNaN(value) || value < 1) return;
        
        const newConfig = { ...config, check_interval_minutes: value };
        await saveConfig(newConfig);
    };

    if (initialLoad) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Service en arrière-plan</CardTitle>
                    <CardDescription>Chargement...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Service en arrière-plan</CardTitle>
                <CardDescription>
                    Configurez le service de mise à jour automatique des traductions
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <Label htmlFor="enabled" className="flex flex-col space-y-1">
                        <span>Activer le service en arrière-plan</span>
                        <span className="text-sm text-muted-foreground">
                            Le service vérifiera automatiquement les mises à jour de traduction
                        </span>
                    </Label>
                    <Switch
                        id="enabled"
                        checked={config.enabled}
                        onCheckedChange={handleToggleEnabled}
                        disabled={loading}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <Label htmlFor="start-with-windows" className="flex flex-col space-y-1">
                        <span>Démarrer avec Windows</span>
                        <span className="text-sm text-muted-foreground">
                            L'application sera lancée au démarrage de Windows (minimisée dans la barre système)
                        </span>
                    </Label>
                    <Switch
                        id="start-with-windows"
                        checked={config.start_with_windows}
                        onCheckedChange={handleToggleStartWithWindows}
                        disabled={loading}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <Label htmlFor="auto-update" className="flex flex-col space-y-1">
                        <span>Mise à jour automatique</span>
                        <span className="text-sm text-muted-foreground">
                            Installer automatiquement les mises à jour de traduction
                        </span>
                    </Label>
                    <Switch
                        id="auto-update"
                        checked={config.auto_update}
                        onCheckedChange={handleToggleAutoUpdate}
                        disabled={loading || !config.enabled}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <Label htmlFor="interval" className="flex flex-col space-y-1">
                        <span>Intervalle de vérification (minutes)</span>
                        <span className="text-sm text-muted-foreground">
                            Fréquence de vérification des mises à jour
                        </span>
                    </Label>
                    <Input
                        id="interval"
                        type="number"
                        min="1"
                        max="1440"
                        value={config.check_interval_minutes}
                        onChange={handleIntervalChange}
                        disabled={loading || !config.enabled}
                        className="w-20"
                    />
                </div>

                {config.enabled && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 Le service en arrière-plan ne fonctionne que si des traductions sont déjà installées.
                            Il vérifiera automatiquement les mises à jour et les installera selon vos préférences.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}