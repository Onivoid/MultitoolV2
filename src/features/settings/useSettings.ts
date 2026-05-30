import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  settingsService,
  type BackgroundServiceConfig,
  type GamelogWatcherConfig,
} from "@/features/settings/settings.service";
import { toastError } from "@/shared/lib/toastHelpers";

export function useSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serviceRunning, setServiceRunning] = useState(false);
  const [config, setConfig] = useState<BackgroundServiceConfig>({
    enabled: false,
    check_interval_minutes: 5,
    language: "fr",
  });
  const [autoStartupEnabled, setAutoStartupEnabled] = useState(false);
  const [checkingAutoStartup, setCheckingAutoStartup] = useState(true);
  const [gamelogConfig, setGamelogConfig] = useState<GamelogWatcherConfig>({
    autoStart: false,
    enabled: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const loadedConfig = await settingsService.loadBackgroundConfig();
        setConfig(loadedConfig);
        setServiceRunning(loadedConfig.enabled);
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration:", error);
      }
      try {
        const loaded = await settingsService.loadGamelogConfig();
        setGamelogConfig(loaded);
      } catch (error) {
        console.error("Erreur chargement config gamelog watcher:", error);
      }
      try {
        const enabled = await settingsService.isAutoStartupEnabled();
        setAutoStartupEnabled(enabled);
      } catch (error) {
        console.error("Erreur lors de la vérification du démarrage auto:", error);
      } finally {
        setCheckingAutoStartup(false);
      }
    };
    load();
  }, []);

  const handleGamelogAutoStartToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const newConfig = { ...gamelogConfig, autoStart: checked };
      await settingsService.saveGamelogConfig(newConfig);
      setGamelogConfig(newConfig);
      toast({
        title: checked ? "Surveillance auto activée" : "Surveillance auto désactivée",
        description: checked
          ? "Le Game.log sera surveillé au lancement de Multitool"
          : "La surveillance ne démarrera plus automatiquement",
      });
    } catch (error) {
      toastError(toast, "Erreur", String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoStartupToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      if (checked) {
        await settingsService.enableAutoStartup();
        toast({
          title: "Démarrage automatique activé",
          description: "L'application se lancera au démarrage de Windows",
        });
      } else {
        await settingsService.disableAutoStartup();
        toast({
          title: "Démarrage automatique désactivé",
          description: "L'application ne se lancera plus automatiquement",
        });
      }
      setAutoStartupEnabled(checked);
    } catch (error) {
      toastError(
        toast,
        "Erreur",
        `Impossible de ${checked ? "activer" : "désactiver"} le démarrage automatique: ${error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const newConfig = { ...config, enabled: checked };
      await settingsService.saveBackgroundConfig(newConfig);
      await settingsService.setBackgroundConfig(newConfig);
      if (checked) {
        await settingsService.startBackgroundService();
        toast({
          title: "Service démarré",
          description: "Le service de mise à jour automatique est maintenant actif",
        });
      } else {
        await settingsService.stopBackgroundService();
        toast({
          title: "Service arrêté",
          description: "Le service de mise à jour automatique a été arrêté",
        });
      }
      setConfig(newConfig);
      setServiceRunning(checked);
    } catch (error) {
      toastError(
        toast,
        "Erreur",
        `Impossible de ${checked ? "démarrer" : "arrêter"} le service: ${error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIntervalChange = async (value: number) => {
    if (value < 5) {
      toastError(toast, "Intervalle invalide", "L'intervalle minimum est de 5 minutes");
      setConfig({ ...config, check_interval_minutes: 5 });
      return;
    }
    const newConfig = { ...config, check_interval_minutes: value };
    setConfig(newConfig);
    try {
      await settingsService.saveBackgroundConfig(newConfig);
      await settingsService.setBackgroundConfig(newConfig);
      toast({
        title: "Configuration mise à jour",
        description: `Intervalle de vérification: ${value} minute(s)`,
      });
    } catch (error) {
      toastError(
        toast,
        "Erreur",
        `Impossible de sauvegarder la configuration: ${error}`,
      );
    }
  };

  return {
    loading,
    serviceRunning,
    config,
    setConfig,
    autoStartupEnabled,
    checkingAutoStartup,
    gamelogConfig,
    handleGamelogAutoStartToggle,
    handleAutoStartupToggle,
    handleServiceToggle,
    handleIntervalChange,
  };
}
