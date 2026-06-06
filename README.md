<p align="center">
  <img src="docs/header.png" alt="Multitool — interface principale" width="100%" />
</p>

<h1 align="center">Multitool</h1>

<p align="center">
  L'outil desktop pour Star Citizen — traduction, cache, personnages, blueprints, actualités et mises à jour.
</p>

<p align="center">
  <a href="https://github.com/Onivoid/MultitoolV2/releases/latest">
    <img src="https://img.shields.io/github/v/release/Onivoid/MultitoolV2?style=for-the-badge&logo=github&logoColor=white&label=Release" alt="Release" />
  </a>
  <a href="https://github.com/Onivoid/MultitoolV2/releases">
    <img src="https://img.shields.io/github/downloads/Onivoid/MultitoolV2/total?style=for-the-badge&logo=download&logoColor=white&label=Downloads" alt="Downloads" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/Onivoid/MultitoolV2?style=for-the-badge" alt="License" />
  </a>
  <a href="https://github.com/Onivoid/MultitoolV2/stargazers">
    <img src="https://img.shields.io/github/stars/Onivoid/MultitoolV2?style=for-the-badge&logo=star&logoColor=white&label=Stars" alt="Stars" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Rust-2021-orange?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-5-443F33?style=for-the-badge" alt="Zustand" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

---

## Présentation du logiciel

Tour rapide des pages : traduction, cache, personnages, blueprints, actualités, patchnotes et mises à jour — le tout depuis le dock en bas de l'écran.

https://github.com/user-attachments/assets/d89cce9a-6759-4ce3-96c0-1d2663edb44d

---

## Personnalisation du thème

Multitool ne se contente pas d'un thème sombre fixe. Dans **Paramètres → Apparence**, tu peux façonner l'interface en direct :

- **Couleur d'accent** — boutons, liens et surbrillances UI
- **Couleur secondaire du fond** — deuxième teinte du fond animé Synthesis
- **Fond animé** — opacité du voile, vitesse, lueur, distorsion, complexité, vagues, zoom et contraste
- **Restaurer le thème par défaut** — retour au preset d'origine en un clic

Les réglages sont persistés et s'appliquent immédiatement sur toutes les pages.

<p align="center">
  <img src="docs/demo-theme.png" alt="Paramètres d'apparence — couleurs et fond animé" width="100%" />
</p>

---

## Téléchargement

<p align="center">
  <a href="https://github.com/Onivoid/MultitoolV2/releases/latest">
    <img src="https://img.shields.io/badge/Télécharger-Release-2ea44f?style=for-the-badge&logo=github" alt="Télécharger la dernière release" />
  </a>
</p>

| Fichier                       | Usage                                                    |
| ----------------------------- | -------------------------------------------------------- |
| **`Multitool-Portable.exe`**  | Lance directement, sans installation                     |
| **`Multitool-Installer.msi`** | Installation Windows + mises à jour auto (Tauri updater) |

> Windows peut afficher un avertissement SmartScreen : l'app n'est pas signée. Voir [SECURITY.md](SECURITY.md) pour vérifier les checksums ou rebuilder vous-même.

---

## Fonctionnalités

|                             |                                                                |
| --------------------------- | -------------------------------------------------------------- |
| **Traduction**              | Installation / désinstallation SCEFRA                          |
| **Cache**                   | Nettoyage et ouverture du dossier Star Citizen                 |
| **Personnages**             | Presets locaux + téléchargement depuis Star Citizen Characters |
| **Blueprints**              | Suivi gamelog, import / export                                 |
| **Actualités & patchnotes** | Flux GitHub du projet                                          |
| **Mises à jour**            | Changelog par version + updater intégré (MSI)                  |

---

## Développement

```bash
git clone https://github.com/Onivoid/MultitoolV2.git
cd MultitoolV2
pnpm install
pnpm tauri dev
```

Guides : [CONTRIBUTING.md](CONTRIBUTING.md) · [BUILD.md](BUILD.md) · [VERSIONING.md](VERSIONING.md)

---

## Liens

<p align="center">
  <a href="https://discord.com/invite/aUEEdMdS6j">
    <img src="https://img.shields.io/badge/Discord-Rejoindre-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
  </a>
  <a href="https://github.com/Onivoid/MultitoolV2/issues">
    <img src="https://img.shields.io/badge/Issues-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Issues" />
  </a>
</p>

---

<p align="center">
  <sub>AGPL-3.0-or-later — voir <a href="LICENSE">LICENSE</a></sub>
</p>
