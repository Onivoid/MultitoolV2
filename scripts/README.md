# Scripts Multitool

## Versioning

### Githooks

```powershell
.\scripts\setup-githooks.ps1
```

Activés aussi via `pnpm install` (`prepare`).

**Sur `master` uniquement** : à chaque `git commit`, bump interactif de `package.json` / `tauri.conf.json` + tag `vX.Y.Z` en `post-commit`.

Sur les autres branches : pas de prompt version.

Commit sans bump : `git commit --no-verify`

### check-version.js

```bash
node scripts/check-version.js
```

Vérifie la cohérence `package.json` ↔ `tauri.conf.json`. Exécuté en CI sur les PR vers `master`.

## Release / CI

### build-release.ps1

```powershell
$env:TAURI_ENV_DISTRIBUTION = "github"
.\scripts\build-release.ps1 standard
.\scripts\build-release.ps1 portable
```

Artefacts dans `builds/` (+ `checksums.txt`).

### Notes de release

Le workflow release lit le **message du commit tagué** (`git log -1`) et y ajoute les checksums. Rédigez ce message lors du commit release sur `master` (voir [VERSIONING.md](../VERSIONING.md)).

### updater.mjs

Génère `latest.json` pour tauri-plugin-updater (lit `release.body` sur GitHub).

```bash
GITHUB_TOKEN=... GITHUB_REPOSITORY=Onivoid/MultitoolV2 node scripts/updater.mjs v2.8.2
```

### validate-latest-json.mjs

Vérifie les URLs du manifeste (pas de `untagged-`, binaires accessibles).

```bash
GITHUB_REPOSITORY=Onivoid/MultitoolV2 node scripts/validate-latest-json.mjs v2.8.2
```

## Flux release

1. Sur `master` : commit avec message release → bump + tag `vX.Y.Z`
2. `git push` + `git push origin vX.Y.Z`
3. CI : draft → build → notes depuis le commit → publish → `latest.json`
