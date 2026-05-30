<div align="center">

# 🚀 MultitoolV2

_L'outil tout-en-un ultime pour Star Citizen_

[![Release](https://img.shields.io/github/v/release/Onivoid/MultitoolV2?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Onivoid/MultitoolV2/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/Onivoid/MultitoolV2/total?style=for-the-badge&logo=download&logoColor=white)](https://github.com/Onivoid/MultitoolV2/releases)
[![License](https://img.shields.io/github/license/Onivoid/MultitoolV2?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Onivoid/MultitoolV2?style=for-the-badge&logo=star&logoColor=white)](https://github.com/Onivoid/MultitoolV2/stargazers)

---

**MultitoolV2** est une application desktop moderne et gratuite qui regroupe des outils pour les joueurs de Star Citizen. Développée avec les technologies les plus récentes, elle offre une interface intuitive et de nombreuses fonctionnalités pour améliorer votre expérience de jeu.

</div>

## ✨ Fonctionnalités

### 🌍 **Traduction**

- Installation de la traduction française pour Star Citizen (SCEFRA Uniquement)
- Vérification des mises à jour des traductions
- Désinstallation propre en un clic

### 🧹 **Gestion du Cache**

- Nettoyage du cache Star Citizen
- Analyse de l'espace disque utilisé
- Ouverture rapide des dossiers système

### 👥 **Gestion des Personnages**

- **Presets locaux** : Gestion, Duplication et Suppression de vos personnages
- **Presets en ligne** : Téléchargement depuis Star Citizen Characters
- Duplication et organisation des presets
- Prévisualisation des personnages (Image fournies par Star Citizen Characters)

### 📋 **Patchnotes & Suivi**

- Suivi en temps réel des mises à jour du projet
- Historique des commits et changements
- Notifications automatiques des nouvelles versions

### 🎨 **Interface Moderne**

- **Personnalisation** : Couleurs et thèmes personnalisables
- **Navigation fluide** : Sidebar avec accès rapide
- **Transparence** : Effets visuels modernes (Windows)

---

## 📥 Installation

### 🏆 **RECOMMANDÉ - Version Portable**

_Aucune installation, aucun avertissement Windows_

```bash
1. Téléchargez MultitoolV2-Portable.exe
2. Lancez directement le fichier
3. Profitez ! ✨
```

### 💾 **Installation Standard (MSI)**

_Installation système classique_

```bash
1. Téléchargez MultitoolV2-Installer.msi
2. Si SmartScreen : "Plus d'infos" → "Exécuter quand même"
3. Suivez l'assistant d'installation
```

---

## ⚠️ Sécurité & Transparence

### 🔓 **Pourquoi "Application non-signée" ?**

Cette application est **100% gratuite et open-source**. Les certificats de signature coûtent ~300€/an, ce qui va à l'encontre de la philosophie de gratuité totale.

**Au lieu d'une signature payante, ce projet offre :**

| ✅ **Ce Modèle**             | ❌ **Apps Fermées**  |
| ---------------------------- | -------------------- |
| 🔍 **Code source public**    | 🔒 Code fermé        |
| 🏗️ **Builds reproductibles** | ❓ Processus opaque  |
| 🛡️ **Checksums SHA256**      | ⚠️ Confiance aveugle |
| 👥 **Communauté active**     | 📞 Support payant    |
| 🆓 **Gratuit à vie**         | 💰 Modèle freemium   |

### 🔐 **Vérifications de Sécurité**

```powershell
# Vérifier l'intégrité du fichier téléchargé
Get-FileHash MultitoolV2-Portable.exe -Algorithm SHA256

# Comparer avec le checksum fourni dans la release
```

**Garanties :**

- ✅ Code source entièrement auditable
- ✅ Builds GitHub Actions publics
- ✅ Aucune collecte de données personnelles
- ✅ Aucune communication réseau non documentée

---

## 🛠️ Technologies

<div align="center">

| Frontend                                                                                                                | Backend                                                                                            | Build & Deploy                                                                                                                | Qualité                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)                      | ![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)    | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white) | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)       | ![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=black) | ![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?style=for-the-badge&logo=powershell&logoColor=white)             | ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)             |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) | ![Tokio](https://img.shields.io/badge/Tokio-000000?style=for-the-badge&logo=rust&logoColor=white)  | ![npm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)                                | ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)       |

</div>

---

## 🚀 Démarrage Rapide

### Pour les Utilisateurs

```bash
# Télécharger et lancer
curl -L -o MultitoolV2.exe https://github.com/Onivoid/MultitoolV2/releases/latest/download/MultitoolV2-Portable.exe
.\MultitoolV2.exe
```

> Vous pouvez aussi tout simplement télécharger depuis le site web ou les Github Releases

### Pour les Développeurs

```bash
# Cloner le projet
git clone https://github.com/Onivoid/MultitoolV2.git
cd MultitoolV2

# Installer les dépendances
pnpm install

# Lancer en développement
pnpm tauri dev

# Build de production
pnpm tauri build
```

👀 **Pour les instructions de build détaillées :** [BUILD.md](BUILD.md)

---

## 🌟 Captures d'Écran

<div align="center">

### Interface Principale

![Interface principale](https://via.placeholder.com/800x500/1a1a1a/ffffff?text=Interface+Moderne+MultitoolV2)

### Gestion des Traductions

![Traductions](https://via.placeholder.com/800x500/2563eb/ffffff?text=Système+de+Traduction+Automatisé)

### Gestion des Personnages

![Personnages](https://via.placeholder.com/800x500/7c3aed/ffffff?text=Presets+de+Personnages)

</div>

---

## 📊 Statistiques

<div align="center">

![GitHub language count](https://img.shields.io/github/languages/count/Onivoid/MultitoolV2?style=for-the-badge)
![GitHub top language](https://img.shields.io/github/languages/top/Onivoid/MultitoolV2?style=for-the-badge)
![GitHub code size](https://img.shields.io/github/languages/code-size/Onivoid/MultitoolV2?style=for-the-badge)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Onivoid/MultitoolV2?style=for-the-badge)

</div>

---

## 💬 Communauté & Support

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/invite/aUEEdMdS6j)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@onivoid)
[![Twitch](https://img.shields.io/badge/Twitch-9146FF?style=for-the-badge&logo=twitch&logoColor=white)](https://www.twitch.tv/onivoid_)

</div>

### 🤝 Partenaires

- **[SCEFRA](https://discord.com/invite/DccQN8BN2V)** - Traductions françaises de Star Citizen

---

### Services Externes Utilisés

- **[Star Citizen Characters](https://www.star-citizen-characters.com/)** - Base de données de presets

---

## 🤝 Contribution

### Comment contribuer ?

1. 🍴 **Fork** le projet
2. 🌿 **Créez** votre branche feature (`git checkout -b feature/AmazingFeature`)
3. 💾 **Committez** vos changements (`git commit -m 'Add: Amazing Feature'`)
4. 📤 **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. 🔀 **Ouvrez** une Pull Request

📖 **Guide détaillé :** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 Licence

Ce projet est sous licence **[GNU AGPL v3](https://www.gnu.org/licenses/agpl-3.0.html)** (ou version ultérieure) — voir le fichier [LICENSE](LICENSE) pour le texte intégral.

En résumé : vous pouvez utiliser, modifier et redistribuer ce logiciel à condition de **publier le code source** de vos modifications sous la même licence, y compris si vous proposez une version accessible via un réseau (clause Affero). Les dépendances tierces restent soumises à leurs propres licences.

---

## ❤️ Remerciements

<div align="center">

**Développé avec 💜 par [Onivoid](https://github.com/Onivoid)**

_Un grand merci à la communauté Star Citizen française et aux contributeurs qui participent à ce projet !_

[![Contributors](https://img.shields.io/github/contributors/Onivoid/MultitoolV2?style=for-the-badge)](https://github.com/Onivoid/MultitoolV2/graphs/contributors)

---

### 🌟 Si ce projet vous aide, n'hésitez pas à lui donner une étoile !

[![Star History Chart](https://api.star-history.com/svg?repos=Onivoid/MultitoolV2&type=Date)](https://star-history.com/#Onivoid/MultitoolV2&Date)

</div>
