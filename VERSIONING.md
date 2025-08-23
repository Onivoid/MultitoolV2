# Guide de Gestion des Versions - MultitoolV2

## 📋 Présentation

Ce guide décrit le processus standardisé pour gérer les versions de MultitoolV2, de la mise à jour des fichiers de configuration au déploiement final.

## 🎯 Système de Versioning

MultitoolV2 utilise le **versioning sémantique** (SemVer) : `MAJOR.MINOR.PATCH`

-   **MAJOR** : Changements incompatibles avec les versions précédentes
-   **MINOR** : Nouvelles fonctionnalités compatibles
-   **PATCH** : Corrections de bugs compatibles

### Fichiers de Version

Les versions sont maintenues dans :

-   `package.json` - Version du projet Node.js
-   `src-tauri/tauri.conf.json` - Version de l'application Tauri
-   Les deux doivent **toujours** être identiques

## 🛠️ Outils et Scripts

### 1. Vérifier la cohérence des versions

```bash
# Script Node.js (recommandé)
node scripts/check-version.js

# Ou script PowerShell (legacy)
.\scripts\check-version-safe.ps1
```

Ce script vérifie que toutes les versions sont cohérentes et affiche l'état du repository Git.

### 2. Mettre à jour la version

```bash
# Script Node.js (recommandé)
node scripts/update-version.js 2.1.4

# Ou script PowerShell (legacy)
.\scripts\update-version.ps1 -Version "2.1.4"
```

Ces scripts mettent automatiquement à jour tous les fichiers de configuration avec la nouvelle version.

### 3. Build de release

```powershell
.\scripts\build-release.ps1 -Type [standard|portable|msix|all|public]
```

## 📋 Processus de Release Complet

### Étape 1 : Préparation

```powershell
# Vérifier l'état actuel
.\scripts\check-version.ps1

# S'assurer que tous les changements sont committés
git status
```

### Étape 2 : Mise à jour de la version

```bash
# Script Node.js (recommandé)
node scripts/update-version.js X.Y.Z

# Ou script PowerShell (legacy)
.\scripts\update-version.ps1 -Version "X.Y.Z"
```

### Étape 3 : Tests

```bash
# Tester l'application en mode développement
pnpm tauri dev

# Optionnel : Build de test
pnpm tauri build
```

### Étape 4 : Commit et Tag

```powershell
# Committer les changements de version
git add -A
git commit -m "chore: bump version to X.Y.Z"

# Créer un tag
git tag vX.Y.Z

# Pousser les changements
git push && git push --tags
```

### Étape 5 : Build de Release

```powershell
# Build pour GitHub (standard + portable)
.\scripts\build-release.ps1 -Type public

# Ou build complet avec Microsoft Store
.\scripts\build-release.ps1 -Type all
```

### Étape 6 : Publication

-   Les builds sont automatiquement placés dans le dossier `builds/`
-   Créer une release GitHub avec les artifacts
-   Publier sur Microsoft Store si applicable

## 🔧 Architecture Technique

### Détection de Version Runtime

L'application utilise plusieurs méthodes pour détecter sa version :

1. **API Tauri** (`getVersion()`) - Version officielle depuis `tauri.conf.json`
2. **Variable d'environnement Vite** (`VITE_APP_VERSION`) - Pour l'affichage synchrone
3. **Utilitaires unifiés** dans `src/utils/version.ts`

### Fichiers Clés

-   `src/utils/version.ts` - Utilitaires de version centralisés
-   `src/utils/buildInfo.ts` - Informations sur le build et la distribution
-   `src/hooks/useUpdater.ts` - Hook pour la gestion des mises à jour
-   `vite.config.ts` - Configuration avec injection de version

## 🚨 Points d'Attention

### ⚠️ Avant Chaque Release

1. **Vérifier la cohérence** : `.\scripts\check-version.ps1`
2. **Tester l'application** : `pnpm tauri dev`
3. **Repository propre** : Pas de changements non committés
4. **Tests fonctionnels** : Vérifier les fonctionnalités principales

### ⚠️ Erreurs Communes

-   **Versions désynchronisées** : Toujours utiliser `update-version.ps1`
-   **Oubli de tag Git** : Nécessaire pour les releases GitHub
-   **Build sans clean** : Utiliser `-Clean` si nécessaire
-   **Permissions insuffisantes** : Exécuter PowerShell en administrateur si nécessaire

## 📱 Types de Distribution

-   **GitHub** : Version standard, non-signée, mises à jour manuelles
-   **Portable** : Version sans installation, non-signée
-   **Microsoft Store** : Version signée, mises à jour automatiques

## 📝 Exemple Complet

```powershell
# Vérification initiale
.\scripts\check-version.ps1

# Mise à jour vers 2.1.4
.\scripts\update-version.ps1 -Version "2.1.4"

# Tests
pnpm tauri dev  # Tester l'app

# Git workflow
git add -A
git commit -m "chore: bump version to 2.1.4"
git tag v2.1.4
git push && git push --tags

# Build et release
.\scripts\build-release.ps1 -Type public -Clean
```

## 🔍 Dépannage

### Problème de Version Incohérente

```powershell
# Forcer la resynchronisation
.\scripts\update-version.ps1 -Version "$(jq -r .version package.json)"
```

### Problème de Build

```powershell
# Clean build avec debug
.\scripts\build-release.ps1 -Type standard -Clean
```

### Problème de Tag Git

```powershell
# Supprimer et recréer un tag
git tag -d vX.Y.Z
git tag vX.Y.Z
git push --tags --force
```
