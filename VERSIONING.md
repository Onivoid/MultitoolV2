# Guide de gestion des versions

Multitool suit le semver `MAJOR.MINOR.PATCH`.

## Fichiers de version

Identiques et **sans préfixe `v`** :

- `package.json`
- `src-tauri/tauri.conf.json`

Le préfixe `v` est réservé aux tags Git (`v2.8.2`) et à l’affichage.

Vérification :

```bash
node scripts/check-version.js
```

## Hooks Git (branche `master` uniquement)

Les hooks ne bumpent la version **que sur `master`**. Sur une branche feature, `git commit` se comporte normalement.

Activation : `pnpm install` ou `.\scripts\setup-githooks.ps1` (Git Bash requis sur Windows).

### Sur `master`

1. `git commit` → saisie de la nouvelle version (`X.Y.Z`, strictement > actuelle)
2. `package.json` et `tauri.conf.json` mis à jour et stagés
3. `post-commit` crée le tag local `vX.Y.Z`
4. Pousser commit + tag :

```bash
git push
git push origin vX.Y.Z
```

### Commit sans bump

```bash
git commit --no-verify -m "docs: …"
```

## Convention de message pour une release

Le corps de la release GitHub et les notes in-app (`latest.json` via `release.body`) proviennent du **message du commit pointé par le tag**.

Exemple de commit release sur `master` :

```
Release : v3.0.0

- Refonte DA V3 de toutes les pages
- Suppression du canal Microsoft Store
- Page Mises à jour avec changelog versionné
```

Ensuite : bump via hook → tag `v3.0.0` sur ce commit → `git push origin v3.0.0`.

La page Patchnotes n’affiche que les commits dont le sujet commence par `Release :`.

Fallback CI : si le message est vide, la release affiche `Release vX.Y.Z`.

## Processus CI release

Push d’un tag `v*` → [`.github/workflows/release.yml`](.github/workflows/release.yml) :

1. Draft release GitHub
2. Build Windows (MSI + portable + checksums)
3. Notes = message du commit tagué + section checksums SHA256
4. Publication + génération `latest.json` (`scripts/updater.mjs`)

Secrets requis : `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

Artefacts attendus sur la release :

- `MultitoolV2-Installer.msi` + `.msi.sig`
- `MultitoolV2-Portable.exe`
- `latest.json` (version nu `X.Y.Z`, URLs `…/releases/download/vX.Y.Z/…`)

## Build local

```powershell
.\scripts\build-release.ps1 -Type standard
```

## Dépannage

**Versions désynchronisées** — aligner les deux JSON puis recommitter.

**Affichage `vv2.X.X`** — retirer le `v` des fichiers de version.

**Tag incorrect**

```bash
git tag -d vX.Y.Z
git tag vX.Y.Z
git push origin vX.Y.Z --force
```

**Regénérer `latest.json` sans rebuild**

```bash
export GITHUB_TOKEN=…
export GITHUB_REPOSITORY=Onivoid/MultitoolV2
node scripts/updater.mjs vX.Y.Z
node scripts/validate-latest-json.mjs vX.Y.Z
```

**Cache patchnotes obsolète en dev** — supprimer le cache commits local après changements Rust sur `patchnote.rs`.

## Auto-update

- MSI GitHub : updater Tauri via `latest.json`
- Portable : téléchargement manuel depuis GitHub
