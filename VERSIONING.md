# Guide de Gestion des Versions - MultitoolV2

## Présentation

Ce guide décrit le processus pour gérer les versions et publier une release GitHub (MSI + `latest.json` pour l’auto-update Tauri).

## Système de Versioning

MultitoolV2 utilise le **versioning sémantique** (SemVer) : `MAJOR.MINOR.PATCH`

### Fichiers de Version

Les versions doivent être **identiques** dans :

- `package.json`
- `src-tauri/tauri.conf.json`

Utiliser **uniquement** `X.Y.Z` dans ces fichiers (sans préfixe `v`). Le préfixe `v` est réservé aux **tags Git** (`v2.7.6`) et à l’affichage utilisateur.

## Githooks (recommandé)

Inspiré du [Tauri-React-Boilerplate](https://github.com/Onivoid/Tauri-React-Boilerplate/tree/main/.githooks).

### Activation

Les hooks s’activent automatiquement après `pnpm install` (`prepare` → `scripts/setup-hooks.sh`).

Manuel :

```powershell
.\scripts\setup-githooks.ps1
```

```bash
./scripts/setup-githooks.sh
```

Requiert **Git Bash** sur Windows pour exécuter `pre-commit` / `post-commit`.

### À chaque commit

1. `git commit` → saisie interactive de la nouvelle version (`X.Y.Z` ou `vX.Y.Z` > version actuelle)
2. `package.json` et `tauri.conf.json` sont mis à jour et stagés
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
2. Build Windows (standard, portable) et upload des artefacts (dont `.msi` + `.msi.sig`)
3. Publie la release (`draft: false`)
4. Génère et uploade **`latest.json`** (`scripts/updater.mjs`, URLs canoniques)
5. Valide le manifeste (`scripts/validate-latest-json.mjs`)

### 3. Vérifier la release

Sur https://github.com/Onivoid/MultitoolV2/releases :

- `MultitoolV2-Installer.msi`
- `MultitoolV2-Installer.msi.sig`
- `latest.json` (champ `"version"` en semver nu, ex. `"2.8.1"`)
- Dans `latest.json`, les URLs doivent être du type `…/releases/download/vX.Y.Z/MultitoolV2-Installer.msi` (jamais `untagged-…`)

Secrets requis : `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

### Build local (optionnel)

```powershell
.\scripts\build-release.ps1 -Type public
```

## Auto-update Tauri (utilisateurs MSI GitHub)

- Endpoint : `releases/latest/download/latest.json`
- Version **portable** : pas d'updater Tauri intégré (téléchargement manuel sur GitHub)

## Dépannage

### Versions désynchronisées

```bash
node scripts/check-version.js
```

Aligner `package.json` et `tauri.conf.json`, ou refaire un commit avec les githooks.

### Affichage `vv2.X.X`

Les fichiers de version ne doivent pas contenir de préfixe `v`. Corriger les JSON puis recommitter.

### Tag manquant ou incorrect

```bash
git tag -d vX.Y.Z
git tag vX.Y.Z
git push origin vX.Y.Z --force
```

### Release sans latest.json

Vérifier que le job `publish-release` a réussi et que `MultitoolV2-Installer.msi.sig` est présent sur la release.

### Mise à jour échoue au téléchargement (prod)

1. Télécharger le manifeste :

   ```bash
   curl -sL "https://github.com/Onivoid/MultitoolV2/releases/latest/download/latest.json"
   ```

2. Si une URL contient `/untagged-`, le manifeste a été généré sur une release encore en brouillon. Regénérer après publication (voir ci-dessous).

3. Tester l’URL MSI du JSON :

   ```bash
   curl -sI "https://github.com/Onivoid/MultitoolV2/releases/download/vX.Y.Z/MultitoolV2-Installer.msi"
   ```

   Attendu : `HTTP/2 200` ou `302` suivi de `200`.

### Regénérer latest.json sur une release déjà publiée (one-shot)

Utile pour corriger une release existante (ex. `v2.8.1`) sans rebuild complet :

```bash
# Token avec scope repo (ou GITHUB_TOKEN en CI)
export GITHUB_TOKEN=ghp_...
export GITHUB_REPOSITORY=Onivoid/MultitoolV2

node scripts/updater.mjs v2.8.1
node scripts/validate-latest-json.mjs v2.8.1
```

La release doit déjà être **publiée** (`draft: false`) et contenir `MultitoolV2-Installer.msi` + `.msi.sig`.
