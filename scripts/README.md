# Scripts Multitool

## Versioning

### Githooks

```powershell
.\scripts\setup-githooks.ps1
```

Activés aussi via `pnpm install` (`prepare`).

**Sur les branches configurées** (`scripts/versioning/config.json`, ex. `master`, `v3`) : à chaque `git commit`, choix du canal (stable / beta / alpha / rc) + bump de `package.json` / `tauri.conf.json` + tag `v{version}` en `post-commit`.

Sur les autres branches : pas de prompt version.

Commit sans bump : `git commit --no-verify`

### Versioning (canaux + CI)

- [`scripts/versioning/config.json`](versioning/config.json) — branches et canaux
- [`scripts/versioning/bump-version.mjs`](versioning/bump-version.mjs) — prompt interactif (githooks)
- [`scripts/versioning/release-channel.mjs`](versioning/release-channel.mjs) — détection canal depuis le tag (CI)

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

1. Sur une branche de release (`master`, `v3`, …) : commit avec message release → bump (canal + version) + tag `vX.Y.Z` ou `vX.Y.Z-beta.N`
2. `git push` + `git push origin vX.Y.Z-beta.N`
3. CI : canal depuis le tag → draft → build → publish (pre-release si beta) → `latest.json` seulement si stable
