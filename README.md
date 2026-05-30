# MultitoolV2

Application desktop pour Star Citizen : traduction SCEFRA, cache, personnages locaux, blueprints gamelog, actualités RSI, patchnotes et mises à jour.

[![Release](https://img.shields.io/github/v/release/Onivoid/MultitoolV2?style=flat-square)](https://github.com/Onivoid/MultitoolV2/releases/latest)
[![License](https://img.shields.io/github/license/Onivoid/MultitoolV2?style=flat-square)](LICENSE)

Stack : Tauri 2 (Rust) + React + TypeScript + Vite.

## Téléchargement

Releases : https://github.com/Onivoid/MultitoolV2/releases

| Fichier                     | Usage                                                    |
| --------------------------- | -------------------------------------------------------- |
| `MultitoolV2-Portable.exe`  | Lance directement, sans installation                     |
| `MultitoolV2-Installer.msi` | Installation Windows + mises à jour auto (Tauri updater) |

Windows peut afficher un avertissement SmartScreen : l’app n’est pas signée. Voir [SECURITY.md](SECURITY.md) pour vérifier les checksums ou rebuilder.

## Fonctionnalités

- **Traduction** — installation / désinstallation SCEFRA
- **Cache** — nettoyage et ouverture du dossier Star Citizen
- **Personnages** — presets locaux et téléchargement depuis Star Citizen Characters
- **Blueprints** — suivi gamelog et import/export
- **Actualités & patchnotes** — flux GitHub du projet
- **Mises à jour** — changelog par version et updater intégré (MSI)

## Développement

```bash
git clone https://github.com/Onivoid/MultitoolV2.git
cd MultitoolV2
pnpm install
pnpm tauri dev
```

Détails : [CONTRIBUTING.md](CONTRIBUTING.md), [BUILD.md](BUILD.md).

## Liens

- [Discord](https://discord.com/invite/aUEEdMdS6j)
- [Issues](https://github.com/Onivoid/MultitoolV2/issues)
- [VERSIONING.md](VERSIONING.md) — releases et tags

## Licence

AGPL-3.0-or-later — voir [LICENSE](LICENSE).
