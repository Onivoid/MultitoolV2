import { getVersion } from '@tauri-apps/api/app';

export interface BuildInfo {
  version: string;
  distribution: 'github' | 'microsoft-store' | 'portable' | 'unknown';
  isSigned: boolean;
  isPortable: boolean;
  canAutoUpdate: boolean;
  githubRepo: string;
  buildDate?: string;
  buildHash?: string;
}

export interface SecurityInfo {
  isUnsigned: boolean;
  expectsSmartScreenWarning: boolean;
  allowManualUpdates: boolean;
  allowAutoUpdates: boolean;
  downloadSourceUrl: string;
  checksumVerificationAvailable: boolean;
}

// Configuration par défaut
const DEFAULT_GITHUB_REPO = 'Onivoid/MultitoolV2'; // À remplacer par le vrai repo

/**
 * Détecte la source d'installation de l'application
 */
export function detectDistribution(): BuildInfo['distribution'] {
  // Vérifier les variables d'environnement injectées au build
  if (process.env.TAURI_ENV_MS_STORE === 'true') {
    return 'microsoft-store';
  }
  
  if (process.env.TAURI_ENV_PORTABLE === 'true') {
    return 'portable';
  }
  
  if (process.env.TAURI_ENV_DISTRIBUTION === 'github') {
    return 'github';
  }

  // Vérifications basées sur l'environnement d'exécution
  try {
    // Si l'app est dans un dossier Microsoft/WindowsApps, c'est probablement Store
    if (window.location.href.includes('WindowsApps')) {
      return 'microsoft-store';
    }
    
    // Si l'app a certaines propriétés spécifiques au portable
    if (localStorage.getItem('PORTABLE_MODE') === 'true') {
      return 'portable';
    }
    
    // Par défaut, considérer comme GitHub
    return 'github';
  } catch {
    return 'unknown';
  }
}

/**
 * Détermine si le build est signé numériquement
 */
export function isBuildSigned(distribution: BuildInfo['distribution']): boolean {
  // Seul Microsoft Store a des builds signés
  return distribution === 'microsoft-store';
}

/**
 * Détermine si les mises à jour automatiques sont supportées
 */
export function canAutoUpdate(distribution: BuildInfo['distribution']): boolean {
  // Microsoft Store gère ses propres mises à jour
  // GitHub et portable peuvent utiliser l'auto-updater
  return distribution === 'github' || distribution === 'portable';
}

/**
 * Obtient l'URL de téléchargement appropriée
 */
export function getDownloadUrl(distribution: BuildInfo['distribution'], repo: string = DEFAULT_GITHUB_REPO): string {
  switch (distribution) {
    case 'microsoft-store':
      return 'ms-windows-store://pdp/?productid=PRODUCT_ID'; // À remplacer par l'ID réel
    case 'github':
    case 'portable':
    default:
      return `https://github.com/${repo}/releases/latest`;
  }
}

/**
 * Obtient les informations complètes du build
 */
export async function getBuildInfo(githubRepo: string = DEFAULT_GITHUB_REPO): Promise<BuildInfo> {
  const distribution = detectDistribution();
  const version = await getVersion();
  
  return {
    version,
    distribution,
    isSigned: isBuildSigned(distribution),
    isPortable: distribution === 'portable',
    canAutoUpdate: canAutoUpdate(distribution),
    githubRepo,
    buildDate: process.env.TAURI_ENV_BUILD_DATE,
    buildHash: process.env.TAURI_ENV_BUILD_HASH
  };
}

/**
 * Obtient les informations de sécurité
 */
export async function getSecurityInfo(githubRepo: string = DEFAULT_GITHUB_REPO): Promise<SecurityInfo> {
  const buildInfo = await getBuildInfo(githubRepo);
  
  return {
    isUnsigned: !buildInfo.isSigned,
    expectsSmartScreenWarning: !buildInfo.isSigned && buildInfo.distribution !== 'portable',
    allowManualUpdates: true, // Toujours possible
    allowAutoUpdates: buildInfo.canAutoUpdate && buildInfo.distribution !== 'microsoft-store',
    downloadSourceUrl: getDownloadUrl(buildInfo.distribution, githubRepo),
    checksumVerificationAvailable: buildInfo.distribution === 'github' || buildInfo.distribution === 'portable'
  };
}

/**
 * Obtient le message d'avertissement approprié selon le build
 */
export function getSecurityWarningMessage(distribution: BuildInfo['distribution']): string | null {
  switch (distribution) {
    case 'github':
      return "Cette version provient de GitHub et n'est pas signée numériquement. Windows SmartScreen peut afficher un avertissement.";
    case 'portable':
      return "Cette version portable n'est pas signée numériquement mais ne devrait pas déclencher SmartScreen.";
    case 'microsoft-store':
      return null; // Pas d'avertissement pour Store
    default:
      return "Source d'installation inconnue. Vérifiez l'origine de cette application.";
  }
}

/**
 * Obtient les instructions d'installation selon le build
 */
export function getInstallationInstructions(distribution: BuildInfo['distribution']): string[] {
  switch (distribution) {
    case 'github':
      return [
        "1. Téléchargez le fichier depuis GitHub",
        "2. Si SmartScreen apparaît : 'Informations complémentaires' → 'Exécuter quand même'",
        "3. Suivez l'assistant d'installation"
      ];
    case 'portable':
      return [
        "1. Téléchargez l'archive portable",
        "2. Décompressez dans le dossier de votre choix",
        "3. Lancez directement l'exécutable"
      ];
    case 'microsoft-store':
      return [
        "1. Recherchez 'MultitoolV2' dans le Microsoft Store",
        "2. Cliquez sur 'Installer'",
        "3. L'application sera automatiquement mise à jour"
      ];
    default:
      return ["Installation manuelle requise"];
  }
}

/**
 * Vérifie si l'application doit afficher l'avertissement de sécurité
 */
export async function shouldShowSecurityWarning(): Promise<boolean> {
  const hasSeenWarning = localStorage.getItem('security-warning-seen') === 'true';
  if (hasSeenWarning) return false;
  
  const buildInfo = await getBuildInfo();
  // Afficher l'avertissement pour les builds non-signés uniquement
  return !buildInfo.isSigned;
}

/**
 * Stocke les métadonnées de build pour référence future
 */
export function storeBuildMetadata(buildInfo: BuildInfo): void {
  const metadata = {
    ...buildInfo,
    lastChecked: new Date().toISOString()
  };
  
  localStorage.setItem('build-metadata', JSON.stringify(metadata));
}

/**
 * Récupère les métadonnées de build stockées
 */
export function getStoredBuildMetadata(): (BuildInfo & { lastChecked: string }) | null {
  try {
    const stored = localStorage.getItem('build-metadata');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Compare deux versions (format semver basique)
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

/**
 * Utilitaire pour débugger les informations de build
 */
export async function debugBuildInfo(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;
  
  const buildInfo = await getBuildInfo();
  const securityInfo = await getSecurityInfo();
  
  console.group('🔍 Build Info Debug');
  console.log('Build Info:', buildInfo);
  console.log('Security Info:', securityInfo);
  console.log('Warning Message:', getSecurityWarningMessage(buildInfo.distribution));
  console.log('Installation Instructions:', getInstallationInstructions(buildInfo.distribution));
  console.groupEnd();
} 