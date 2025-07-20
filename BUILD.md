# 🔨 Guide de Build - MultitoolV2

_Instructions complètes pour compiler MultitoolV2 depuis le code source_

---

## 📋 Table des Matières

-   [🔧 Prérequis](#-prérequis)
-   [⚡ Installation Rapide](#-installation-rapide)
-   [🏗️ Types de Builds](#️-types-de-builds)
-   [📝 Scripts de Build](#-scripts-de-build)
-   [🐧 Build Cross-Platform](#-build-cross-platform)
-   [🛠️ Dépannage](#️-dépannage)
-   [⚡ Optimisations](#-optimisations)

---

## 🔧 Prérequis

### Système d'Exploitation

-   **Windows 10/11** (recommandé pour le développement principal)

### Outils Requis

#### 1. **Node.js & pnpm**

```bash
# Installer Node.js (v18+ requis)
# https://nodejs.org/

# Installer pnpm
npm install -g pnpm

# Vérifier les versions
node --version    # >= v18.0.0
pnpm --version    # >= 8.0.0
```

#### 2. **Rust & Cargo**

```bash
# Installer Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Redémarrer le terminal puis vérifier
rustc --version  # >= 1.70.0
cargo --version  # >= 1.70.0

# Ajouter les targets Windows (si sur Linux/macOS)
rustup target add x86_64-pc-windows-msvc
```

#### 3. **Outils Spécifiques Windows**

```powershell
# Installer Visual Studio Build Tools
# https://visualstudio.microsoft.com/fr/downloads/

# Installer WebView2 (pour développement)
# https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# Installer Windows SDK (requis pour builds MSI)
# https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
```

#### 4. **Git**

```bash
# Installer Git
# https://git-scm.com/downloads

git --version    # >= 2.30.0
```

---

## ⚡ Installation Rapide

### 1. **Clonage du Projet**

```bash
# Cloner le repository
git clone https://github.com/Onivoid/MultitoolV2.git
cd MultitoolV2

# Vérifier la branche
git branch -v
```

### 2. **Installation des Dépendances**

```bash
# Installer les dépendances frontend
pnpm install

# Installer Tauri CLI (si pas déjà fait)
pnpm add -D @tauri-apps/cli

# Vérifier l'installation
pnpm tauri --version
```

### 3. **Premier Build de Test**

```bash
# Mode développement (compilation rapide)
pnpm tauri dev

# Si succès, arrêter avec Ctrl+C et tester le build de production
pnpm tauri build
```

---

## 🏗️ Types de Builds

MultitoolV2 supporte plusieurs types de builds pour différents cas d'usage :

### 🎯 **Build Standard** _(Recommandé pour développement)_

```bash
# Via Tauri CLI
pnpm tauri build

# Via script PowerShell (Windows)
.\scripts\build-release.ps1 standard
```

**Caractéristiques :**

-   ✅ Build rapide
-   ✅ Bundle MSI + NSIS
-   ✅ Pour distribution GitHub
-   ⚠️ Non-signé (avertissement SmartScreen)

### 📦 **Build Portable** _(Recommandé pour utilisateurs)_

```bash
# Via script PowerShell uniquement
.\scripts\build-release.ps1 portable
```

**Caractéristiques :**

-   ✅ Exécutable standalone
-   ✅ Aucune installation requise
-   ✅ Pas d'avertissement SmartScreen
-   ✅ Configuration spéciale via `TAURI_ENV_PORTABLE`

### 🏪 **Build Microsoft Store**

```bash
# Via script PowerShell avec config spéciale
.\scripts\build-release.ps1 msix
```

**Prérequis :**

-   Fichier `src-tauri/tauri.microsoftstore.conf.json` configuré
-   Certificat Microsoft Store (pour publication)
-   WebView2 en mode offline installer

### 🚀 **Build Complet** _(Tous les types)_

```bash
# Build tout en une fois
.\scripts\build-release.ps1 all

# Build publics uniquement (pour CI/CD)
.\scripts\build-release.ps1 public
```

---

## 📝 Scripts de Build

### Script PowerShell Principal

Le script `scripts/build-release.ps1` automatise tout le processus :

```powershell
# Syntaxe complète
.\scripts\build-release.ps1 [Type] [-Clean] [-GenerateChecksums]

# Exemples
.\scripts\build-release.ps1 standard           # Build standard simple
.\scripts\build-release.ps1 portable -Clean    # Build portable avec nettoyage
.\scripts\build-release.ps1 all               # Tous les builds
.\scripts\build-release.ps1 public            # Builds publics (GitHub CI)
```

#### Paramètres Disponibles

| Paramètre            | Description         | Valeurs                                         |
| -------------------- | ------------------- | ----------------------------------------------- |
| `Type`               | Type de build       | `standard`, `portable`, `msix`, `all`, `public` |
| `-Clean`             | Nettoie avant build | `$true`/`$false`                                |
| `-GenerateChecksums` | Génère les SHA256   | `$true`/`$false` (défaut: `$true`)              |

### Variables d'Environnement

Le script utilise des variables d'environnement pour configurer les builds :

```powershell
# Build portable
$env:TAURI_ENV_PORTABLE = "true"
$env:TAURI_ENV_DISTRIBUTION = "github"

# Build Microsoft Store
$env:TAURI_ENV_MS_STORE = "true"

# Build standard
$env:TAURI_ENV_DISTRIBUTION = "github"
```

### Artefacts Générés

Après un build réussi, les artefacts sont organisés dans `builds/` :

```
builds/
├── portable/
│   └── MultitoolV2-Portable.exe
├── installer/
│   └── MultitoolV2-Installer.msi
├── MicrosoftStoreMSI/          # (si build MSIX)
│   └── MultitoolV2-MicrosoftStore.msi
└── checksums.txt               # SHA256 de tous les fichiers
```

---

### Configuration CI/CD

Pour GitHub Actions, voir `.github/workflows/release.yml` :

```yaml
- name: Build All Releases
  run: .\scripts\build-release.ps1 public
  env:
      TAURI_ENV_DISTRIBUTION: github
```

---

## 🛠️ Dépannage

### Problèmes Courants

#### ❌ **Erreur : "pnpm command not found"**

```bash
# Solution
npm install -g pnpm
# Ou redémarrer le terminal
```

#### ❌ **Erreur : "rustc not found"**

```bash
# Solution
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

#### ❌ **Erreur : "failed to run custom build command for webview2-com-sys"**

```bash
# Solution Windows : Installer Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/

# Solution Linux : Installer les dépendances système
sudo apt install build-essential libwebkit2gtk-4.0-dev libssl-dev
```

#### ❌ **Erreur : "Target not found x86_64-pc-windows-msvc"**

```bash
# Solution
rustup target add x86_64-pc-windows-msvc
```

#### ❌ **Build lent ou qui plante**

```bash
# Augmenter la mémoire disponible pour Rust
export CARGO_TARGET_DIR=/tmp/cargo-target

# Nettoyer le cache
cargo clean
rm -rf node_modules
pnpm install
```

### Logs de Debug

#### Mode Verbose Tauri

```bash
# Activer les logs détaillés
$env:RUST_LOG = "tauri=debug"
pnpm tauri build

# Linux/macOS
RUST_LOG=tauri=debug pnpm tauri build
```

#### Vérification des Dépendances

```bash
# Audit des vulnérabilités
pnpm audit

# Vérification Rust
cargo audit  # Nécessite: cargo install cargo-audit

# Versions installées
pnpm tauri info
```

### Nettoyage Complet

```bash
# Nettoyer tous les caches
rm -rf node_modules/
rm -rf src-tauri/target/
rm -rf dist/
rm -rf builds/

# Réinstaller
pnpm install
```

---

## ⚡ Optimisations

### Build de Production Optimisé

#### 1. **Configuration Rust (Cargo.toml)**

```toml
[profile.release]
opt-level = "z"      # Optimisation taille
lto = true           # Link Time Optimization
codegen-units = 1    # Meilleure optimisation
panic = "abort"      # Réduction de la taille
strip = true         # Suppression des symboles debug
```

#### 2. **Configuration Vite (vite.config.ts)**

```typescript
export default defineConfig({
    build: {
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                },
            },
        },
    },
});
```

### Réduction de la Taille

#### Bundle Analyzer

```bash
# Analyser la taille du bundle
pnpm build
npx vite-bundle-analyzer dist/
```

#### Optimisations Spécifiques

```bash
# Build avec optimisations maximales
pnpm tauri build --config src-tauri/tauri.production.conf.json
```

### Build Rapide pour Développement

```bash
# Mode debug avec hot-reload
pnpm tauri dev

# Build debug rapide (pas d'optimisations)
pnpm tauri build --debug
```

---

## 🎯 Configuration Avancée

### Fichiers de Configuration

#### `src-tauri/tauri.conf.json` - Configuration principale

```json
{
    "productName": "Multitool",
    "version": "2.0.0",
    "bundle": {
        "targets": ["msi", "nsis"]
    }
}
```

#### `src-tauri/tauri.portable.conf.json` - Build portable

```json
{
    "productName": "MultitoolV2-Portable",
    "bundle": {
        "targets": ["msi"]
    },
    "plugins": {
        "updater": {
            "active": false
        }
    }
}
```

#### `src-tauri/tauri.microsoftstore.conf.json` - Microsoft Store

```json
{
    "bundle": {
        "windows": {
            "webviewInstallMode": {
                "type": "offlineInstaller"
            }
        }
    }
}
```

### Scripts Package.json

```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "tauri": "tauri",
        "build:portable": "powershell -File scripts/build-release.ps1 portable",
        "build:all": "powershell -File scripts/build-release.ps1 all",
        "build:clean": "powershell -File scripts/build-release.ps1 all -Clean"
    }
}
```

---

## 📊 Benchmarks

### Tailles d'Artefacts

| Artefact                  | Taille Typique |
| ------------------------- | -------------- |
| MultitoolV2-Portable.exe  | ~15-20 MB      |
| MultitoolV2-Installer.msi | ~18-25 MB      |
| Archive complète          | ~40-60 MB      |

---

## 🔗 Ressources Utiles

### Documentation Officielle

-   **[Tauri Documentation](https://tauri.app/v2/guides/)** - Guide officiel Tauri v2
-   **[Rust Book](https://doc.rust-lang.org/book/)** - Apprendre Rust
-   **[React Documentation](https://react.dev/)** - Guide React moderne

### Outils de Développement

-   **[Tauri Studio](https://github.com/tauri-apps/tauri-studio)** - IDE visuel
-   **[Rust Analyzer](https://rust-analyzer.github.io/)** - LSP pour Rust
-   **[Vite DevTools](https://github.com/webfansplz/vite-plugin-vue-devtools)** - Outils de debug

### Communauté

-   **[Discord Tauri](https://discord.com/invite/tauri)** - Support officiel
-   **[Discord MultitoolV2](https://discord.com/invite/aUEEdMdS6j)** - Support projet

---

## 🏁 Prochaines Étapes

Une fois votre build réussi :

1. **✅ Tester l'application** - Vérifier toutes les fonctionnalités
2. **📦 Distribuer** - Utiliser les artefacts dans `builds/`
3. **🤝 Contribuer** - Partager vos améliorations via une Pull Request !

---

_Pour toute question sur le build, n'hésitez pas à ouvrir une issue sur GitHub ou rejoindre le [Discord](https://discord.com/invite/aUEEdMdS6j) !_ 🚀
