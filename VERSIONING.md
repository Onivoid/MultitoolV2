# Guide de gestion des versions

Multitool suit le semver `MAJOR.MINOR.PATCH`, avec identifiants de pré-release optionnels (`-beta.N`, `-alpha.N`, `-rc.N`).

## Fichiers de version

Identiques et **sans préfixe `v`** :

- `package.json`
- `src-tauri/tauri.conf.json`

Exemples : `2.8.2`, `3.0.0-1` (bêta MSI-compatible)

Le préfixe `v` est réservé aux tags Git (`v2.8.2`, `v3.0.0-beta.1` pour l’affichage).  
**Important MSI** : `package.json` / `tauri.conf.json` utilisent une pré-release **numérique** (`3.0.0-1`), pas `3.0.0-beta.1` — limitation WiX/Tauri ([PR #6096](https://github.com/tauri-apps/tauri/pull/6096)).

Vérification :

```bash
node scripts/check-version.js
```

## Canaux de release

La config centrale est [`scripts/versioning/config.json`](scripts/versioning/config.json).

| Canal   | Version exemple   | GitHub        | `latest.json` (auto-update stable) |
|---------|-------------------|---------------|-------------------------------------|
| stable  | `3.0.0`           | release       | oui                                 |
| beta    | `3.0.0-1` + tag `v3.0.0-beta.1` | pre-release   | non                                 |
| alpha   | `3.0.0-alpha.1`   | pre-release   | non                                 |
| rc      | `3.0.0-rc.1`      | pre-release   | non                                 |

La CI déduit le canal **uniquement du tag** (`v3.0.0-beta.1` → beta). Pas besoin de modifier le workflow à chaque bêta.

Inspecter un tag :

```bash
node scripts/versioning/release-channel.mjs --tag v3.0.0-beta.1
```

Branches avec bump automatique (modifiable dans `config.json`) : `master`, `v3`, `V3`.

## Hooks Git

Les hooks ne bumpent la version **que sur les branches listées** dans `config.json`. Sur les autres branches, `git commit` se comporte normalement.

Activation : `pnpm install` ou `.\scripts\setup-githooks.ps1` (Git Bash requis sur Windows).

### Bump interactif

1. `git commit` → choix du **canal** (stable / beta / alpha / rc)
2. Saisie de la version de base `X.Y.Z` (+ numéro de pré-release si besoin)
3. `package.json` et `tauri.conf.json` mis à jour et stagés
4. `post-commit` crée le tag local (ex. `v3.0.0-beta.1` ; version fichiers `3.0.0-1`)
5. Pousser commit + tag :

```bash
git push
git push origin v3.0.0-beta.1
```

Le numéro `beta.N` suivant est **suggéré** à partir des tags Git existants.

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

1. Détection du canal (`scripts/versioning/release-channel.mjs`)
2. Draft release GitHub (`prerelease: true` si beta/alpha/rc)
3. Build Windows (MSI + portable + checksums)
4. Notes = message du commit tagué + section checksums SHA256
5. Publication (`make_latest` uniquement pour **stable**)
6. `latest.json` + validation **uniquement** pour **stable**
7. Vérification que la pre-release n’est pas devenue « Latest » sur GitHub

Secrets requis : `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

Artefacts attendus sur la release :

- `MultitoolV2-Installer.msi` + `.msi.sig`
- `MultitoolV2-Portable.exe`
- `latest.json` — **stable uniquement** (version nu `X.Y.Z`, URLs `…/releases/download/vX.Y.Z/…`)

## Build local

```powershell
.\scripts\build-release.ps1 -Type standard
```

## Dépannage

**Erreur MSI `pre-release identifier must be numeric-only`**

La version dans `package.json` / `tauri.conf.json` ne doit pas contenir `beta`, `alpha`, etc. Utiliser `3.0.0-1` (hook canal beta) et un tag Git `v3.0.0-beta.1` si vous voulez un libellé lisible.

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
