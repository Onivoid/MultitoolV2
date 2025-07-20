# 🛡️ Politique de Sécurité - MultitoolV2

*Votre sécurité est la priorité. Ce document explique l'approche transparente de la sécurité.*

---

## 📋 Table des Matières

- [🔓 Modèle de Sécurité Open-Source](#-modèle-de-sécurité-open-source)
- [🔍 Vérification de Sécurité](#-vérification-de-sécurité)
- [🔐 Garanties & Limitations](#-garanties--limitations)
- [🚨 Signalement de Vulnérabilités](#-signalement-de-vulnérabilités)
- [🔧 Bonnes Pratiques Utilisateur](#-bonnes-pratiques-utilisateur)
- [🏗️ Sécurité de Développement](#️-sécurité-de-développement)
- [📊 Comparaison avec Autres Solutions](#-comparaison-avec-autres-solutions)
- [❓ Questions Fréquentes](#-questions-fréquentes)

---

## 🔓 Modèle de Sécurité Open-Source

MultitoolV2 adopte un modèle de sécurité basé sur la **transparence totale** plutôt que sur la signature numérique traditionnelle.

### 💡 Philosophie : Sécurité par Transparence

Au lieu de vous demander de faire confiance aveuglément, ce projet vous donne tous les outils pour **vérifier** sa sécurité :

| 🔓 **Cette Approche** | 🔒 **Approche Traditionnelle** |
|----------------------|------------------------------|
| 📖 Code 100% public | 🔒 Code fermé propriétaire |
| 🔍 Builds auditables | ❓ Processus opaque |
| 🆓 Gratuit & ouvert | 💰 Payant ou freemium |
| 👥 Communauté active | 📞 Support client limité |
| 🛠️ Vous pouvez rebuilder | ⚠️ Confiance aveugle requise |

### 🤔 Pourquoi pas de signature numérique ?

Les certificats de signature coûtent **300-500€/an** et nécessitent une structure d'entreprise. Pour un projet **personnel, gratuit et open-source**, ce coût va à l'encontre de cette philosophie.

**Le choix :** Investir ce temps et ces ressources dans :
- 📖 **Documentation complète**
- 🤝 **Support communautaire**
- 🔍 **Transparence maximale**

---

## 🔍 Vérification de Sécurité

### 1. 📖 **Audit du Code Source**

**Tout est public et auditable :**

```bash
# Cloner et examiner le code
git clone https://github.com/Onivoid/MultitoolV2.git
cd MultitoolV2

# Historique complet des modifications
git log --oneline --graph --all

# Examiner les dépendances
pnpm audit                    # Frontend
cargo audit                   # Backend (install: cargo install cargo-audit)

# Analyser la structure
tree -I "target|node_modules|dist"
```

### 2. 🏗️ **Vérification des Builds**

**Tous les builds sont reproductibles et publics :**

#### GitHub Actions Workflow
- **Fichier :** [`.github/workflows/release.yml`](.github/workflows/release.yml)
- **Logs publics :** Chaque build entièrement tracé
- **Environnement isolé :** Containers GitHub sans accès externe
- **Artifacts vérifiables :** Checksums SHA256 automatiques

#### Reproduire un Build Localement
```bash
# Installer les prérequis (voir BUILD.md)
pnpm install

# Build identique à la production
.\scripts\build-release.ps1 public

# Comparer vos checksums avec ceux de la release
```

### 3. 🔐 **Vérification d'Intégrité**

**Chaque fichier téléchargé peut être vérifié :**

#### Windows (PowerShell)
```powershell
# Calculer le checksum
Get-FileHash .\MultitoolV2-Portable.exe -Algorithm SHA256

# Comparer avec celui fourni dans la release GitHub
# Le checksum doit correspondre EXACTEMENT
```

### 4. 🌐 **Vérification Réseau**

**Surveillez les communications (optionnel) :**

```bash
# Windows : Monitoring réseau
netstat -an | findstr 1420    # Port de développement
Resource Monitor > Network   # Interface graphique

# Linux : Surveillance trafic
sudo netstat -tuln | grep LISTEN
sudo ss -tulnp | grep tauri
```

---

## 🔐 Garanties & Limitations

### ✅ **Ce qui est GARANTI**

| Garantie | Preuve | Comment Vérifier |
|----------|--------|------------------|
| **Code source public** | GitHub repository | Cloner et auditer |
| **Builds reproductibles** | GitHub Actions | Logs publics + rebuild local |
| **Aucune télémétrie** | Code auditable | Chercher "fetch", "xhr", "request" |
| **Aucune donnée collectée** | Pas de serveurs | Aucun endpoint externe |
| **Checksums fournis** | Fichier checksums.txt | Vérification SHA256 |
| **Communauté transparente** | Issues/Discussions publiques | GitHub + Discord |

### ⚠️ **Ce qui ne peut PAS être garanti**

| Limitation | Raison | Alternative |
|------------|--------|-------------|
| **Signature numérique** | Coût prohibitif (300€/an) | Vérification manuelle des checksums |
| **Réputation EV** | Pas de certificat Extended Validation | Audit du code source |
| **Whitelist antivirus** | Apps non-signées souvent flaggées | Rapport de faux positif à votre AV |
| **Protection contre modifications** | Pas de signature cryptographique | Rebuilder depuis le source |

---

## 🚨 Signalement de Vulnérabilités

### 🔒 **Divulgation Responsable**

La sécurité est prise au sérieux. Si vous découvrez une vulnérabilité :

#### 1. **NE PAS** créer d'issue publique

Cela pourrait exposer d'autres utilisateurs au risque.

#### 2. **Contact en privé**

```
💬 Discord : Message privé à @Onivoid ou via le Discord Onisoft
```

#### 3. **Informations à inclure**

```markdown
## Vulnérabilité Découverte

**Type :** [XSS, Injection, Déni de service, etc.]
**Sévérité :** [Critique/Haute/Moyenne/Basse]
**Composant :** [Frontend/Backend/Build/Autre]

## Description
[Description claire du problème]

## Étapes de Reproduction
1. Étape 1
2. Étape 2
3. Résultat obtenu

## Impact Potentiel
[Qui est affecté et comment ?]

## Solution Suggérée
[Si vous en avez une]
```

### ⏱️ **Processus de Résolution**

| Étape | Délai | Description |
|-------|-------|-------------|
| **Accusé de réception** | 48h | Confirmation de réception |
| **Évaluation initiale** | 7 jours | Analyse de l'impact et priorité |
| **Développement correctif** | 14-30 jours | Selon complexité |
| **Tests & validation** | 3-7 jours | Tests approfondis |
| **Release sécurisée** | 1-2 jours | Publication de la correction |
| **Disclosure publique** | 7 jours après | Publication des détails |

### 🏆 **Hall of Fame Sécurité**

Je reconnais publiquement les chercheurs en sécurité responsables :

- **[Nom]** - Découverte vulnérabilité critique - *Janvier 2025*
- **[Votre nom pourrait être ici !]**

---

## 🔧 Bonnes Pratiques Utilisateur

### 📥 **Installation Sécurisée**

#### ✅ **Téléchargement Sûr**
1. **Source unique :** Uniquement depuis [GitHub Releases officiel](https://github.com/Onivoid/MultitoolV2/releases)
2. **Vérification URL :** Confirmer `https://github.com/Onivoid/MultitoolV2`
3. **Latest Release :** Préférer la version la plus récente
4. **Checksums :** Toujours vérifier l'intégrité

#### ❌ **Sources à Éviter**
- Sites de téléchargement tiers (En dehors du domaine `*.onivoid.fr` ou `*.onisoft.dev`)
- Liens raccourcis ou suspects
- Versions "modifiées" ou "crackées"
- Torrents ou réseaux P2P

#### 🔐 **Vérification Post-Téléchargement**
```powershell
# 1. Vérifier la signature (si disponible un jour)
Get-AuthenticodeSignature .\MultitoolV2-Portable.exe

# 2. Calculer et vérifier le checksum
$hash = Get-FileHash .\MultitoolV2-Portable.exe -Algorithm SHA256
Write-Host "Votre checksum : $($hash.Hash)"
Write-Host "Comparez avec celui de la release GitHub"

# 3. Scanner avec Windows Defender
.\MultitoolV2-Portable.exe | Out-Null  # Premier scan automatique
```

### 🛡️ **Utilisation Sécurisée**

#### 🔒 **Principe de Moindre Privilège**
- Exécuter en tant qu'utilisateur standard (pas administrateur)
- Accorder uniquement les permissions demandées
- Surveiller les accès réseau si critique

#### 🔄 **Mises à Jour**
- Activer les notifications de nouvelles releases
- Vérifier régulièrement les nouveautés
- Lire le CHANGELOG avant mise à jour

#### 📊 **Surveillance (Optionnelle)**
Pour les environnements critiques :
```bash
# Surveiller l'activité réseau
netstat -an | findstr MultitoolV2

# Monitoring des fichiers modifiés
# (utilisez des outils comme Process Monitor)

# Vérifier les certificats de connexion
# (si l'app fait des requêtes HTTPS)
```

---

## 🏗️ Sécurité de Développement

### 🔒 **Environnement de Build Sécurisé**

#### GitHub Actions - Isolation Complète
```yaml
# Configuration sécurisée (.github/workflows/release.yml)
runs-on: windows-latest        # Environnement isolé et éphémère
permissions:
  contents: read               # Lecture seule du code
  actions: read               # Lecture des actions
  security-events: write      # Écriture événements sécurité

env:
  CARGO_TERM_COLOR: always    # Variables contrôlées
  # Aucune variable secrète exposée
```

#### Checksums Automatiques
```powershell
# Génération automatique des checksums
foreach ($file in $artifacts) {
    $hash = Get-FileHash $file -Algorithm SHA256
    "$($hash.Hash.ToLower())  $($file.Name)" | Out-File checksums.txt -Append
}
```

### 🔐 **Gestion des Dépendances**

#### Lock Files - Versions Figées
```json
// pnpm-lock.yaml - Frontend
{
  "version": "8.0",
  "dependencies": {
    "react": "18.2.0",    // Versions exactes
    "typescript": "5.0.2"  // Pas de mise à jour automatique
  }
}
```

```toml
# Cargo.lock - Backend  
[[package]]
name = "serde"
version = "1.0.152"      # Version exacte verrouillée
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "bb7d1f0d3021d347a83e556fc4683dea2ea09d87bccdf88ff5c12545d89d5efb"
```

#### Audit de Sécurité Régulier
```bash
# Audit automatique lors de chaque build
pnpm audit --audit-level high
cargo audit --deny warnings

# Rapport de vulnérabilités
npm audit report --json > security-report.json
```


#### Analyse Statique
```bash
# Clippy pour Rust (linter sécurité)
cargo clippy -- -D warnings

# ESLint pour TypeScript
pnpm lint --max-warnings 0
```

---

## 📊 Comparaison avec Autres Solutions

### 🔍 **Matrice de Sécurité**

| Aspect | MultitoolV2 | App Signée Fermée | App Open-Source Signée | App Fermée Gratuite |
|--------|-------------|-------------------|------------------------|---------------------|
| **Code Source** | ✅ 100% Public | ❌ Fermé | ✅ Public | ❌ Fermé |
| **Build Process** | ✅ 100% Public | ❌ Opaque | ⚠️ Partiellement | ❌ Opaque |
| **Signature** | ❌ Non | ✅ Oui | ✅ Oui | ⚠️ Parfois |
| **Auditabilité** | ✅ Complète | ❌ Impossible | ✅ Complète | ❌ Impossible |
| **Transparence** | ✅ Totale | ❌ Aucune | ✅ Totale | ❌ Aucune |
| **Reproductibilité** | ✅ Complète | ❌ Impossible | ⚠️ Partielle | ❌ Impossible |
| **Coût** | ✅ Gratuit | 💰 Souvent payant | ✅ Gratuit | ⚠️ Freemium |
| **Mises à jour** | ✅ Transparentes | ❓ Opaques | ✅ Transparentes | ❓ Opaques |

### 💭 **Analyse de Risque**

#### MultitoolV2 (Non-signé, Open-Source)
```
✅ Avantages Sécurité
├─ Code 100% auditable
├─ Builds reproductibles  
├─ Communauté vigilante
├─ Checksums vérifiables
└─ Aucune télémétrie cachée

⚠️ Inconvénients
├─ Avertissements Windows
├─ Possible faux positifs AV
├─ Nécessite vérification manuelle
└─ Confiance basée sur transparence
```

#### App Fermée Signée Traditionnelle
```
✅ Avantages Apparents
├─ Signature validée
├─ Pas d'avertissement Windows
├─ Réputation établie
└─ Support commercial

❌ Risques Cachés  
├─ Code non auditable
├─ Télémétrie potentielle
├─ Backdoors possibles
├─ Modèle économique opaque
└─ Confiance aveugle requise
```

---

## ❓ Questions Fréquentes

### 🤔 **Mon antivirus détecte l'application, est-ce normal ?**

**Oui, c'est possible et attendu.** 

**Pourquoi ça arrive :**
- Applications non-signées = plus de false positifs
- Algorithmes heuristiques parfois trop sensibles
- Nouveaux binaires sans "réputation" établie

**Comment vérifier si c'est légitime :**
1. 🔍 **Source :** Téléchargé depuis GitHub officiel ?
2. 🔐 **Checksum :** Correspond-il exactement ?
3. 👥 **Communauté :** D'autres rapportent-ils le même ?
4. 📖 **Code :** Auditez le source si vous savez programmer

**Que faire :**
```bash
# 1. Vérifier le checksum
Get-FileHash .\fichier.exe -Algorithm SHA256

# 2. Rapporter un faux positif à votre antivirus
# Chaque éditeur AV a un processus de rapport

# 3. Utiliser VirusTotal pour une seconde opinion
# https://www.virustotal.com/
```

### 🔒 **Comment être SÛR que l'application n'est pas malveillante ?**

**La sécurité absolue n'existe pas, mais vous pouvez être confiant :**

#### 🔍 **Niveau 1 : Vérification Rapide (5 min)**
```bash
✅ Source officielle (GitHub Onivoid/MultitoolV2)
✅ Checksum SHA256 correspond
✅ Pas de rapports de malware communautaires
✅ Activité GitHub récente et cohérente
```

#### 🔍 **Niveau 2 : Audit Partiel (30 min)**
```bash
✅ Parcourir le code source principal
✅ Vérifier les dépendances dans package.json/Cargo.toml
✅ Lire les issues/discussions récentes
✅ Tester dans un environnement isolé/VM
```

#### 🔍 **Niveau 3 : Audit Complet (plusieurs heures)**
```bash
✅ Audit complet du code source
✅ Rebuild local et comparaison des binaires
✅ Analyse du trafic réseau pendant utilisation
✅ Tests de sécurité approfondis
```

### 💰 **Pourquoi ne pas payer pour un certificat ?**

**C'est une question de priorités et de philosophie :**

#### 💸 **Coût Réel**
- **Certificat Standard :** 150-300€/an
- **Certificat EV (Extended Validation) :** 400-800€/an
- **Infrastructure :** Serveurs, maintenance, renouvellement
- **Temps :** Démarches administratives, validation

#### 🎯 **Mon Choix**
Ce budget et ce temps, je préfère l'investir dans :
- 👨‍💻 **Le Développement :** Plus de fonctionnalités
- 📖 **La Documentation :** Guides complets
- 🤝 **Le Support :** Aide communautaire
- 🔍 **La Transparence :** Open-source total

#### 🔮 **Futur Possible**
- **Sponsoring :** Si des sponsors couvrent les frais

### 🔮 **L'application sera-t-elle un jour signée ?**

**Plusieurs scénarios possibles :**

#### 🏪 **Microsoft Store (Déjà mis en place)**
- ✅ **Signature automatique** par Microsoft
- ✅ **Gratuit** pour le développeur
- ✅ **Aucun avertissement** pour les utilisateurs

#### 💰 **Certificat payant (si financement)**
- 🤝 **Sponsors/Donations :** Financement communautaire
- 🏢 **Partenariat :** Collaboration avec une entreprise

#### 🏛️ **Organisation/Fondation**
- 🤝 **Intégration** dans une fondation open-source
- 📜 **Certification** par une autorité reconnue
- 🌍 **Écosystème** plus large de projets

**En attendant :** Mon modèle de transparence totale reste le plus sûr pour un projet de cette taille.

---

## 📞 Contact Sécurité

### 🚨 **Urgence Sécurité**
```
💬 Message privé Discord : Message privé à @Onivoid
💬 Discord : https://discord.com/invite/aUEEdMdS6j

### 💬 **Questions Générales**
```
🐛 GitHub Issues : Questions publiques de sécurité
💬 Discord : https://discord.com/invite/aUEEdMdS6j
📝 Discussions : https://github.com/Onivoid/MultitoolV2/discussions
```

### 📚 **Ressources Supplémentaires**
- **[BUILD.md](BUILD.md)** - Instructions de compilation sécurisée
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Standards de sécurité du code
- **[CHANGELOG.md](CHANGELOG.md)** - Historique des correctifs de sécurité

---

<div align="center">

## 🛡️ **"La sécurité par la transparence, pas par l'obscurité"**

*La philosophie est qu'un système ouvert et auditable est plus sûr qu'un système fermé "de confiance".*

**Votre sécurité = Transparence totale + Votre vigilance éclairée**

---

[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen?style=for-the-badge)](https://github.com/Onivoid/MultitoolV2)
[![Auditable](https://img.shields.io/badge/Code-Auditable-blue?style=for-the-badge)](https://github.com/Onivoid/MultitoolV2)
[![Community](https://img.shields.io/badge/Community-Driven-orange?style=for-the-badge)](https://discord.com/invite/aUEEdMdS6j)

</div> 