import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getBuildInfo } from '@/utils/buildInfo';

interface UpdateInfo {
  version: string;
  notes: string;
  pub_date: string;
  signature?: string;
}

interface UseUpdaterState {
  isChecking: boolean;
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  isInstalling: boolean;
}

interface UseUpdaterConfig {
  checkOnStartup?: boolean;
  enableAutoUpdater?: boolean;
  githubRepo?: string;
}

const DEFAULT_GITHUB_REPO = 'Onivoid/MultitoolV2';

export function useUpdater(config: UseUpdaterConfig = {}) {
  const {
    checkOnStartup = false,
    enableAutoUpdater = true,
    githubRepo = DEFAULT_GITHUB_REPO
  } = config;

  const { toast } = useToast();

  const [state, setState] = useState<UseUpdaterState>({
    isChecking: false,
    updateAvailable: false,
    updateInfo: null,
    isDownloading: false,
    downloadProgress: 0,
    error: null,
    isInstalling: false
  });

  const [buildInfo, setBuildInfo] = useState<any>(null);

  // Charger les infos de build au démarrage
  useEffect(() => {
    getBuildInfo().then(setBuildInfo).catch(console.error);
  }, []);

  // Récupérer les préférences utilisateur depuis localStorage
  const getAutoUpdateSetting = useCallback(() => {
    return localStorage.getItem('autoUpdate') !== 'false'; // Opt-out par défaut
  }, []);

  const setAutoUpdateSetting = useCallback((enabled: boolean) => {
    localStorage.setItem('autoUpdate', enabled.toString());
  }, []);

  // Obtenir l'URL de la page de release GitHub
  const getGitHubReleaseUrl = useCallback((version?: string) => {
    if (version) {
      return `https://github.com/${githubRepo}/releases/tag/v${version}`;
    }
    return `https://github.com/${githubRepo}/releases/latest`;
  }, [githubRepo]);

  // Déterminer si c'est un build non-signé
  const isUnsignedBuild = useCallback(() => {
    if (!buildInfo) return true; // Par défaut, considérer non-signé
    return !buildInfo.isSigned;
  }, [buildInfo]);

  // Vérifier si les mises à jour sont supportées
  const canUpdate = useCallback(() => {
    if (!buildInfo) return false;
    // Microsoft Store gère ses propres mises à jour
    return buildInfo.distribution !== 'microsoft-store' && buildInfo.canAutoUpdate;
  }, [buildInfo]);

  // Vérifier les mises à jour
  const checkForUpdates = useCallback(async (silent = false) => {
    // Vérifier d'abord si les mises à jour sont supportées
    if (!canUpdate()) {
      if (!silent) {
        const message = buildInfo?.distribution === 'microsoft-store' 
          ? "Les mises à jour sont gérées automatiquement par le Microsoft Store."
          : "Les mises à jour automatiques ne sont pas supportées pour cette version.";
        
        toast({
          title: "Mises à jour non supportées",
          description: message,
          variant: "default"
        });
      }
      return;
    }

    if (!enableAutoUpdater) {
      if (!silent) {
        toast({
          title: "Auto-updater désactivé",
          description: "Les mises à jour automatiques sont désactivées. Téléchargez manuellement depuis GitHub.",
          variant: "default"
        });
      }
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Simulation d'une vérification en mode dev
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!silent) {
        toast({
          title: "Aucune mise à jour",
          description: "Vous utilisez déjà la dernière version.",
          variant: "default"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      if (!silent) {
        toast({
          title: "Erreur de vérification",
          description: `Impossible de vérifier les mises à jour: ${errorMessage}`,
          variant: "destructive"
        });
      }
    } finally {
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, [enableAutoUpdater, canUpdate, buildInfo, toast]);

  // Télécharger la mise à jour
  const downloadUpdate = useCallback(async () => {
    if (!canUpdate()) {
      toast({
        title: "Téléchargement non supporté",
        description: "Veuillez télécharger manuellement depuis GitHub ou le Microsoft Store.",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, isDownloading: true, downloadProgress: 0 }));

    try {
      // Simulation de téléchargement
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setState(prev => ({ ...prev, downloadProgress: i }));
      }

      setState(prev => ({ ...prev, isDownloading: false, isInstalling: true }));
      
      toast({
        title: "Simulation de mise à jour",
        description: "En production, l'application redémarrerait ici.",
        variant: "default"
      });

      // Reset après simulation
      setTimeout(() => {
        setState(prev => ({ ...prev, isInstalling: false }));
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ 
        ...prev, 
        isDownloading: false, 
        isInstalling: false,
        error: errorMessage 
      }));

      toast({
        title: "Erreur de téléchargement",
        description: `Échec du téléchargement: ${errorMessage}`,
        variant: "destructive"
      });
    }
  }, [canUpdate, toast]);

  // Ouvrir GitHub pour téléchargement manuel
  const openGitHubReleases = useCallback(async () => {
    try {
      window.open(getGitHubReleaseUrl(state.updateInfo?.version), '_blank');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le navigateur",
        variant: "destructive"
      });
    }
  }, [getGitHubReleaseUrl, state.updateInfo?.version, toast]);

  // Vérification au démarrage
  useEffect(() => {
    if (checkOnStartup && getAutoUpdateSetting() && enableAutoUpdater && canUpdate()) {
      // Attendre un peu après le démarrage
      const timer = setTimeout(() => {
        checkForUpdates(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [checkOnStartup, checkForUpdates, getAutoUpdateSetting, enableAutoUpdater, canUpdate]);

  return {
    ...state,
    checkForUpdates,
    downloadUpdate,
    openGitHubReleases,
    isUnsignedBuild: isUnsignedBuild(),
    autoUpdateEnabled: getAutoUpdateSetting(),
    setAutoUpdateEnabled: setAutoUpdateSetting,
    getGitHubReleaseUrl,
    canUpdate: canUpdate(),
    distribution: buildInfo?.distribution || 'unknown'
  };
} 