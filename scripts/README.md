# Scripts MultitoolV2

## Versioning

### Githooks (recommandé)

```powershell
.\scripts\setup-githooks.ps1
```

```bash
./scripts/setup-hooks.sh
```

Activés aussi via `pnpm install` (`prepare`).

À chaque `git commit` : bump interactif de `package.json` et `tauri.conf.json` + tag `vX.Y.Z` en `post-commit`.

Commit sans bump : `git commit --no-verify`

### check-version.js

Vérifie la cohérence entre `package.json` et `tauri.conf.json`, plus l’état Git.

```bash
node scripts/check-version.js
node scripts/check-version.js --help
```

## Release / CI

### build-release.ps1

```powershell
.\scripts\build-release.ps1 standard
.\scripts\build-release.ps1 portable
.\scripts\build-release.ps1 msix
.\scripts\build-release.ps1 public
```

### updater.mjs

Génère `latest.json` pour tauri-plugin-updater (utilisé par la CI après upload des artefacts). La version est lue depuis `package.json` (semver sans `v`).

```bash
GITHUB_TOKEN=... GITHUB_REPOSITORY=Onivoid/MultitoolV2 node scripts/updater.mjs v2.7.3
```

## Flux release GitHub

1. Githooks : commit + tag `vX.Y.Z`
2. `git push` + `git push origin vX.Y.Z`
3. CI : draft → build → `latest.json` → publish
