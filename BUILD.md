# Build Multitool

Guide Windows uniquement (cible du projet).

## Prérequis

- Windows 10/11
- Node.js 22+, pnpm 10+ (`corepack enable` ou `npm i -g pnpm`)
- Rust stable (`rustup` + target `x86_64-pc-windows-msvc`)
- Visual Studio Build Tools (C++ desktop)
- WebView2 Runtime (souvent déjà installé)
- Git + Git Bash (hooks)

Pour les builds MSI en local : WiX 5 (`dotnet tool install --global wix --version 5.0.2`).

## Setup

```powershell
git clone https://github.com/Onivoid/MultitoolV2.git
cd MultitoolV2
pnpm install
```

## Développement

```powershell
pnpm tauri dev
```

Checks qualité (alignés CI) :

```powershell
pnpm typecheck
pnpm lint
pnpm format:check
pnpm lint:rust
```

## Build release

Script principal :

```powershell
# MSI GitHub (updater + signature si clés définies)
$env:TAURI_ENV_DISTRIBUTION = "github"
.\scripts\build-release.ps1 standard

# Portable
$env:TAURI_ENV_PORTABLE = "true"
$env:TAURI_ENV_DISTRIBUTION = "github"
.\scripts\build-release.ps1 portable
```

Artefacts dans `builds/` :

- `builds/installer/Multitool-Installer.msi` (+ `.msi.sig` si signing)
- `builds/portable/Multitool-Portable.exe`
- `builds/checksums.txt`

Build Tauri direct (sans script) :

```powershell
pnpm tauri build
```

## Signature Tauri (releases officielles)

Variables d’environnement pour `createUpdaterArtifacts` :

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

Utilisées en CI GitHub ; optionnelles en local.

## Dépannage

**Versions désynchronisées**

```powershell
node scripts/check-version.js
```

Aligner `package.json` et `src-tauri/tauri.conf.json` (semver `X.Y.Z`, sans préfixe `v`).

**Patchnotes / cache commits obsolète**

Après changements Rust sur `patchnote.rs`, supprimez le cache local si les commits affichés semblent anciens (fichier dans le répertoire config de l’app).

**WiX / MSI**

Vérifiez `wix --version` et que le SDK Windows est installé.

**Clippy / fmt**

```powershell
cd src-tauri
cargo fmt
cargo clippy -- -D warnings
cargo test
```

Voir aussi [scripts/README.md](scripts/README.md) et [VERSIONING.md](VERSIONING.md).
