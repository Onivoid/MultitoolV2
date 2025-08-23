# Scripts de Gestion des Versions

Ce dossier contient les scripts pour gérer les versions de MultitoolV2.

## 🚀 Scripts Node.js (Recommandés)

### update-version.js

Met à jour automatiquement les versions dans `package.json` et `tauri.conf.json`.

```bash
# Usage
node scripts/update-version.js <version>

# Exemple
node scripts/update-version.js 2.1.4
```

### check-version.js

Vérifie la cohérence des versions et l'état Git du repository.

```bash
# Usage
node scripts/check-version.js

# Aide
node scripts/check-version.js --help
```

## 📜 Scripts PowerShell (Legacy)

### update-version.ps1

Version PowerShell du script de mise à jour (peut causer des problèmes d'encodage JSON).

```powershell
.\scripts\update-version.ps1 -Version "2.1.4"
```

### check-version-safe.ps1

Version PowerShell du script de vérification.

```powershell
.\scripts\check-version-safe.ps1
```

## ✅ Avantages des Scripts Node.js

-   **Formatage JSON natif** : Évite les problèmes d'encodage PowerShell
-   **Cross-platform** : Fonctionne sur Windows, Linux, macOS
-   **Manipulation JSON fiable** : Préserve le formatage et l'encodage
-   **Gestion d'erreurs robuste** : Meilleure validation des données
-   **Couleurs dans la console** : Affichage plus clair

## 🔧 Workflow de Release Recommandé

```bash
# 1. Vérifier l'état actuel
node scripts/check-version.js

# 2. Mettre à jour la version
node scripts/update-version.js 2.1.4

# 3. Tester l'application
pnpm tauri dev

# 4. Committer et tagger
git add -A
git commit -m "chore: bump version to 2.1.4"
git tag v2.1.4
git push && git push --tags

# 5. Build de release
.\scripts\build-release.ps1 -Type public
```
