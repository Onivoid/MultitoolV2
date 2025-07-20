# 🤝 Guide de Contribution - MultitoolV2

*Merci de votre intérêt pour contribuer à MultitoolV2 ! Ce guide vous aidera à commencer.*

---

## 🎯 Pourquoi Contribuer ?

- 🚀 **Améliorer l'expérience** des joueurs Star Citizen français
- 🧠 **Apprendre** des technologies modernes (React, Rust, Tauri)
- 🌟 **Être reconnu** dans la communauté open-source
- 💜 **Participer** à un projet français de qualité

---

## 📋 Table des Matières

- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [🎨 Types de Contributions](#-types-de-contributions)
- [🔧 Configuration du Développement](#-configuration-du-développement)
- [📝 Standards de Code](#-standards-de-code)
- [🐛 Rapporter des Bugs](#-rapporter-des-bugs)
- [💡 Proposer des Fonctionnalités](#-proposer-des-fonctionnalités)
- [🔀 Processus de Pull Request](#-processus-de-pull-request)
- [📚 Ressources Utiles](#-ressources-utiles)

---

## 🚀 Démarrage Rapide

### 1. **Setup Initial**
```bash
# Fork le projet sur GitHub
# Puis cloner votre fork
git clone https://github.com/VOTRE-USERNAME/MultitoolV2.git
cd MultitoolV2

# Ajouter le repository original comme remote
git remote add upstream https://github.com/Onivoid/MultitoolV2.git

# Installer les dépendances
pnpm install
```

### 2. **Première Contribution**
```bash
# Créer une branche pour votre feature
git checkout -b feature/ma-super-feature

# Faire vos modifications...

# Tester localement
pnpm tauri dev

# Committer et push
git add .
git commit -m "Add: Ma super fonctionnalité"
git push origin feature/ma-super-feature

# Créer une Pull Request sur GitHub
```

---

## 🎨 Types de Contributions

### 🐛 **Corrections de Bugs**
- Correction de bugs dans l'interface utilisateur
- Résolution de problèmes de performance
- Amélioration de la gestion d'erreurs
- **Priorité :** 🔥 Haute

### ✨ **Nouvelles Fonctionnalités**
- Nouveaux outils pour Star Citizen
- Améliorations de l'interface utilisateur
- Intégrations avec des services externes
- **Priorité :** ⭐ Moyenne

### 📚 **Documentation**
- Amélioration du README
- Ajout de commentaires dans le code
- Création de tutoriels
- **Priorité :** 📖 Moyenne

### 🌍 **Traductions**
- Support de nouvelles langues
- Amélioration des traductions existantes
- **Priorité :** 🌐 Basse

### 🎨 **Design & UX**
- Amélioration de l'interface utilisateur
- Nouvelles animations et transitions
- Optimisation de l'expérience utilisateur
- **Priorité :** 🎨 Moyenne

### ⚡ **Performance**
- Optimisation des builds
- Réduction de la taille des bundles
- Amélioration des temps de chargement
- **Priorité :** ⚡ Haute

---

## 🔧 Configuration du Développement

### Prérequis
Suivez le guide [BUILD.md](BUILD.md) pour installer tous les outils nécessaires.

### Structure du Projet
```
MultitoolV2/
├── src/                          # Frontend React
│   ├── components/               # Composants React
│   │   ├── custom/              # Composants spécifiques
│   │   ├── ui/                  # Composants UI génériques
│   │   └── utils/               # Utilitaires React
│   ├── hooks/                   # Hooks React personnalisés
│   ├── pages/                   # Pages de l'application
│   ├── stores/                  # State management (Zustand)
│   ├── types/                   # Types TypeScript
│   └── utils/                   # Utilitaires frontend
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   ├── scripts/            # Modules fonctionnels
│   │   ├── lib.rs              # Point d'entrée bibliothèque
│   │   └── main.rs             # Point d'entrée application
│   ├── capabilities/           # Permissions Tauri
│   ├── icons/                  # Icônes de l'application
│   └── target/                 # Artifacts de build Rust
├── .github/                      # GitHub Actions
├── scripts/                      # Scripts de build PowerShell
└── public/                       # Assets publics
```

### Environnement de Développement

#### Extensions VSCode Recommandées
```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Configuration Git Hooks
```bash
# Installer les hooks de pre-commit
npm install -g @commitlint/cli @commitlint/config-conventional
```

### Scripts de Développement
```bash
# Mode développement avec hot-reload
pnpm tauri dev

# Build de production
pnpm tauri build

# Linter et formatter
pnpm lint
pnpm format

# Tests (quand implémentés)
pnpm test
```

---

## 📝 Standards de Code

### 🎯 **Conventions Générales**

#### Messages de Commit
Le projet utilise la convention [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```bash
# Format : type(scope): description

# Types acceptés :
feat(ui): ajouter bouton de réinitialisation des paramètres
fix(cache): corriger le calcul de la taille du cache
docs(readme): mettre à jour les instructions d'installation
style(theme): ajuster les couleurs du mode sombre
refactor(api): restructurer les appels vers l'API SC
test(hooks): ajouter tests pour useUpdater
chore(deps): mettre à jour les dépendances
```

#### Nommage des Branches
```bash
# Convention : type/description-courte
feature/gestion-presets-avances
fix/cache-calculation-bug
docs/improve-build-instructions
refactor/api-error-handling
```

### ⚛️ **Frontend (React/TypeScript)**

#### Structure des Composants
```typescript
// Exemple : src/components/custom/MonComposant.tsx

import React from 'react';
import { ComponentProps } from '@/types/component';

interface MonComposantProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Composant pour [description de la fonctionnalité]
 * 
 * @param title - Le titre à afficher
 * @param onAction - Callback appelé lors de l'action
 */
export function MonComposant({ 
  title, 
  onAction, 
  className 
}: MonComposantProps) {
  return (
    <div className={`mon-composant ${className || ''}`}>
      <h2>{title}</h2>
      {onAction && (
        <button onClick={onAction}>
          Action
        </button>
      )}
    </div>
  );
}
```

#### Hooks Personnalisés
```typescript
// Exemple : src/hooks/useMonHook.ts

import { useState, useEffect } from 'react';

interface UseMonHookReturn {
  data: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook pour gérer [description de la fonctionnalité]
 * 
 * @param initialValue - Valeur initiale
 * @returns État et fonctions de gestion
 */
export function useMonHook(initialValue?: string[]): UseMonHookReturn {
  const [data, setData] = useState<string[]>(initialValue || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    // Logique de rechargement
  }, []);

  return { data, loading, error, refetch };
}
```

### 🦀 **Backend (Rust)**

#### Structure des Modules
```rust
// Exemple : src-tauri/src/scripts/mon_module.rs

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct MonStruct {
    pub id: String,
    pub nom: String,
    pub actif: bool,
}

/// Récupère la liste des éléments
/// 
/// # Erreurs
/// 
/// Retourne une erreur si le fichier de configuration n'est pas accessible
#[command]
pub async fn get_liste_elements() -> Result<Vec<MonStruct>, String> {
    // Implémentation
    Ok(vec![])
}

/// Sauvegarde un élément
/// 
/// # Arguments
/// 
/// * `element` - L'élément à sauvegarder
#[command]
pub async fn save_element(element: MonStruct) -> Result<(), String> {
    // Implémentation
    Ok(())
}
```

#### Gestion d'Erreurs
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MonErreur {
    #[error("Fichier non trouvé : {0}")]
    FichierNonTrouve(String),
    
    #[error("Erreur de sérialisation : {0}")]
    Serialisation(#[from] serde_json::Error),
    
    #[error("Erreur réseau : {0}")]
    Reseau(#[from] reqwest::Error),
}
```

### 🎨 **Styles (Tailwind CSS)**

#### Organisation des Classes
```typescript
// Mauvais
<div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-gray-700 hover:bg-gray-700 transition-colors">

// Bon - Grouper par catégorie
<div className={cn(
  // Layout
  "p-4 rounded-lg",
  // Colors
  "bg-gray-800 text-white border border-gray-700",
  // Effects
  "shadow-lg hover:bg-gray-700 transition-colors"
)}>
```

#### Composants UI Réutilisables
```typescript
// Créer des variantes avec class-variance-authority
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

---

## 🐛 Rapporter des Bugs

### Template d'Issue Bug
```markdown
## 🐛 Description du Bug

Décrivez clairement le problème rencontré.

## 🔄 Étapes pour Reproduire

1. Aller sur '...'
2. Cliquer sur '...'
3. Faire défiler jusqu'à '...'
4. Voir l'erreur

## ✅ Comportement Attendu

Décrivez ce qui devrait se passer.

## ❌ Comportement Actuel

Décrivez ce qui se passe réellement.

## 📷 Captures d'Écran

Si applicable, ajoutez des captures d'écran.

## 🖥️ Environnement

- OS: [ex. Windows 11]
- Version MultitoolV2: [ex. 2.0.0]
- Version Star Citizen: [ex. 3.21.0]

## ℹ️ Informations Supplémentaires

Tout autre contexte utile.
```

### Labels d'Issues
- 🐛 `bug` - Problème confirmé
- 🚨 `bug-critical` - Bug bloquant
- 🔍 `needs-investigation` - Nécessite investigation
- 👍 `good-first-issue` - Bon pour débuter
- 📚 `documentation` - Amélioration documentation
- ✨ `enhancement` - Nouvelle fonctionnalité
- 🏷️ `wontfix` - Ne sera pas corrigé

---

## 💡 Proposer des Fonctionnalités

### Template d'Issue Feature
```markdown
## 🚀 Fonctionnalité Demandée

Décrivez clairement la fonctionnalité souhaitée.

## 🎯 Problème Résolu

Quel problème cette fonctionnalité résout-elle ?

## 💡 Solution Proposée

Décrivez votre solution idéale.

## 🔄 Alternatives Considérées

Autres solutions envisagées.

## 📊 Impact Utilisateur

Qui bénéficierait de cette fonctionnalité ?

## 🛠️ Complexité Technique

Estimation de la difficulté d'implémentation.
```

### Priorisation des Features
1. **🔥 Critique** - Fonctionnalité essentielle
2. **⭐ Haute** - Très utile pour la majorité
3. **📊 Moyenne** - Utile pour certains cas
4. **💡 Basse** - Nice-to-have

---

## 🔀 Processus de Pull Request

### 1. **Préparation**
```bash
# Synchroniser avec upstream
git checkout main
git pull upstream main
git push origin main

# Créer une branche
git checkout -b feature/ma-feature
```

### 2. **Développement**
- ✅ Suivre les standards de code
- ✅ Tester localement
- ✅ Ajouter des commentaires si nécessaire
- ✅ Mettre à jour la documentation

### 3. **Tests Locaux**
```bash
# Vérifier que tout compile
pnpm tauri build

# Tester l'interface
pnpm tauri dev

# Vérifier le style
pnpm lint
pnpm format
```

### 4. **Template de Pull Request**
```markdown
## 📝 Description

Décrivez vos changements en détail.

## 🎯 Type de Changement

- [ ] 🐛 Correction de bug
- [ ] ✨ Nouvelle fonctionnalité
- [ ] 💥 Breaking change
- [ ] 📚 Documentation
- [ ] 🎨 Amélioration UI/UX

## 🧪 Tests

- [ ] Tests locaux passés
- [ ] Build de production réussi
- [ ] Interface testée manuellement

## 📷 Screenshots

Si changements visuels, ajoutez des captures.

## ✅ Checklist

- [ ] Code testé localement
- [ ] Documentation mise à jour
- [ ] Respect des conventions de code
- [ ] Pas de conflits de merge
```

### 5. **Review Process**

1. **Automated Checks** - GitHub Actions automatiques
2. **Code Review** - Review par un mainteneur
3. **Testing** - Tests fonctionnels si nécessaire
4. **Merge** - Fusion dans main après approbation

### Critères d'Acceptation
- ✅ Code conforme aux standards
- ✅ Fonctionnalité testée et fonctionnelle
- ✅ Documentation à jour
- ✅ Pas de régression introduite
- ✅ Performances acceptables

---

## 🏆 Reconnaissance des Contributeurs

### Hall of Fame
Les contributeurs sont reconnus dans :
- 📝 **README.md** - Section remerciements
- 🎉 **CHANGELOG.md** - Mentions dans les releases
- 💬 **Discord** - Rôle spécial contributeur
- 🐦 **Réseaux sociaux** - Mentions publiques

### Badges GitHub
![Contributeur](https://img.shields.io/badge/Contributeur-MultitoolV2-blue?style=for-the-badge)

---

## 📚 Ressources Utiles

### Documentation Technique
- **[Tauri Guides](https://tauri.app/v2/guides/)** - Documentation officielle Tauri
- **[React Docs](https://react.dev/)** - Documentation React moderne
- **[Rust Book](https://doc.rust-lang.org/book/)** - Apprendre Rust
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - Guide TypeScript

### Outils de Développement
- **[Rust Analyzer](https://rust-analyzer.github.io/)** - LSP pour Rust
- **[ES7+ React Snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)** - Snippets React
- **[Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)** - Autocomplétion Tailwind

### Communauté
- **[Discord Onisoft](https://discord.com/invite/aUEEdMdS6j)** - Support et discussions
- **[Discord Tauri](https://discord.com/invite/tauri)** - Support technique Tauri

---

## 🤔 Questions Fréquentes

### ❓ **Comment débuter si je suis nouveau en Rust ?**
Commencez par des tâches frontend (React/TypeScript) ou de documentation. Le Rust viendra naturellement !

### ❓ **Puis-je contribuer sans connaître Star Citizen ?**
Absolument ! Beaucoup de contributions (UI, performance, documentation) ne nécessitent pas de connaître le jeu.

### ❓ **Combien de temps prend une review ?**
Généralement 2-7 jours selon la complexité. Les petites corrections sont reviewées plus rapidement.

### ❓ **Que faire si ma PR est rejetée ?**
C'est normal ! Utilisez les commentaires pour améliorer et resoumettez. Chaque refus est une opportunité d'apprendre.

---

## 💌 Remerciements

**Merci de contribuer à MultitoolV2 !** 🎉

Chaque contribution, petite ou grande, fait la différence. Ensemble, participons à créer le meilleur outil pour la communauté Star Citizen française !

---

*Des questions ? Rejoignez le [Discord](https://discord.com/invite/aUEEdMdS6j) ou ouvrez une issue !* 💬 