# Guide de Gestion des Versions - MultitoolV2

## Présentation

Ce guide décrit le processus pour gérer les versions et publier une release GitHub (MSI + `latest.json` pour l’auto-update Tauri).

## Système de Versioning

MultitoolV2 utilise le **versioning sémantique** (SemVer) : `MAJOR.MINOR.PATCH`

### Fichiers de Version

Les versions doivent être **identiques** dans :

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

## Githooks (recommandé)

Inspiré du [Tauri-React-Boilerplate](https://github.com/Onivoid/Tauri-React-Boilerplate/tree/main/.githooks).

### Activation (une fois)

```powershell
.\scripts\setup-githooks.ps1
```

```bash
./scripts/setup-githooks.sh
```

Requiert **Git Bash** sur Windows pour exécuter `pre-commit` / `post-commit`.

### À chaque commit

1. `git commit` → saisie interactive de la nouvelle version (`X.Y.Z` > version actuelle)
2. Les trois fichiers de version sont mis à jour et stagés
3. `post-commit` crée le tag `vX.Y.Z` localement
4. Pousser le commit **et** le tag :

```bash
git push
git push origin vX.Y.Z
```

### Commit sans bump (docs, WIP)

```bash
git commit --no-verify -m "docs: ..."
```

## Vérification de cohérence

```bash
node scripts/check-version.js
```

Exécuté aussi en CI sur les pull requests (`.github/workflows/check-version.yml`).

## Processus de Release (GitHub)

### 1. Développement + bump via githooks

Commit avec bump de version → tag `vX.Y.Z` créé automatiquement.

### 2. Pousser le tag

```bash
git push origin vX.Y.Z
```

Le workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) :

1. Crée une **release draft** sur GitHub
2. Build Windows (standard, portable, MS Store) et upload des artefacts (dont `.msi` + `.msi.sig`)
3. Génère et uploade **`latest.json`** (`scripts/updater.mjs`)
4. Publie la release (`draft: false`)

### 3. Vérifier la release

Sur https://github.com/Onivoid/MultitoolV2/releases :

- `MultitoolV2-Installer.msi`
- `MultitoolV2-Installer.msi.sig`
- `latest.json`

Secrets requis : `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

### Build local (optionnel)

```powershell
.\scripts\build-release.ps1 -Type public
```

## Auto-update Tauri (utilisateurs MSI GitHub)

- Endpoint : `releases/latest/download/latest.json`
- Versions **portable** et **Microsoft Store** : pas d’updater Tauri intégré

## Microsoft Store

Le MSI Store est buildé par la CI ; le packaging MSIX et `broadFileSystemAccess` restent manuels — voir [`src-tauri/gen/windows/README.md`](src-tauri/gen/windows/README.md).

## Dépannage

### Versions désynchronisées

```bash
node scripts/check-version.js
```

Refaire un commit avec githooks ou corriger manuellement les trois fichiers puis recommitter.

### Tag manquant ou incorrect

```bash
git tag -d vX.Y.Z
git tag vX.Y.Z
git push origin vX.Y.Z --force
```

### Release sans latest.json

Vérifier que le job `publish-release` a réussi et que `MultitoolV2-Installer.msi.sig` est présent sur la release.
