# Instructions de Développement - MultitoolV2

## 📋 Vue d'ensemble du projet

**MultitoolV2** est une application desktop multiplateforme construite avec **Tauri v2** (Rust backend) et **React + TypeScript** (frontend). L'application permet de gérer les traductions du jeu Star Citizen avec des fonctionnalités avancées de gestion de cache, de personnages et de mises à jour automatiques.

## 🏗️ Architecture

### Stack Technique

#### Backend (Rust - Tauri)
- **Framework**: Tauri 2.x
- **Langage**: Rust (Edition 2021)
- **Async Runtime**: Tokio (full features)
- **HTTP Client**: reqwest (avec support JSON et blocking)
- **Sérialisation**: serde + serde_json
- **UI Effects**: window-vibrancy (effet acrylic sur Windows)
- **System Tray**: tray-icon (gestion de l'icône système)
- **Auto-launch**: auto-launch (démarrage automatique)
- **Image Processing**: image (pour les icônes)

#### Frontend (React + TypeScript)
- **Framework**: React 18.3+ avec TypeScript 5.7+
- **Build Tool**: Vite 5.4+
- **Routing**: React Router DOM 7.0+
- **State Management**: Zustand 5.0+
- **UI Components**: 
  - Radix UI (composants accessibles)
  - shadcn/ui (composants stylisés)
  - Lucide React (icônes)
  - Framer Motion (animations)
- **Styling**: TailwindCSS 3.4+ avec tailwindcss-animate
- **Tauri Plugins**: 
  - @tauri-apps/api
  - @tauri-apps/plugin-dialog
  - @tauri-apps/plugin-shell
  - @tauri-apps/plugin-updater

## 📁 Structure du Projet

```
MultitoolV2/
├── src/                          # Code source Frontend (React)
│   ├── components/               # Composants React réutilisables
│   ├── pages/                    # Pages de l'application
│   ├── stores/                   # Stores Zustand
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # Types TypeScript
│   ├── utils/                    # Fonctions utilitaires
│   └── assets/                   # Assets statiques
│
├── src-tauri/                    # Code source Backend (Rust)
│   ├── src/
│   │   ├── lib.rs               # Point d'entrée principal
│   │   ├── scripts/             # Modules fonctionnels
│   │   │   ├── mod.rs           # Déclaration des modules
│   │   │   ├── translation_functions.rs      # Gestion des traductions
│   │   │   ├── translation_preferences.rs    # Préférences de traduction
│   │   │   ├── translations_links.rs         # Liens de traduction
│   │   │   ├── cache_functions.rs            # Gestion du cache
│   │   │   ├── local_characters_functions.rs # Gestion des personnages
│   │   │   ├── presets_list_functions.rs     # Gestion des presets
│   │   │   ├── gamepath.rs                   # Détection des chemins du jeu
│   │   │   ├── patchnote.rs                  # Récupération des patchnotes
│   │   │   ├── theme_preferences.rs          # Préférences de thème
│   │   │   ├── background_service.rs         # Service de tâche de fond
│   │   │   ├── system_tray.rs                # Gestion du system tray
│   │   │   └── startup_manager.rs            # Gestion du démarrage auto
│   │   └── main.rs              # Entry point (minimal)
│   ├── Cargo.toml               # Dépendances Rust
│   ├── tauri.conf.json          # Configuration Tauri
│   └── icons/                   # Icônes de l'application
│
├── public/                       # Assets publics
├── package.json                  # Dépendances Node.js
├── tsconfig.json                 # Configuration TypeScript
├── tailwind.config.js            # Configuration TailwindCSS
└── vite.config.ts                # Configuration Vite

```

## 🎯 Conventions de Code

### Rust (Backend)

#### Organisation des Modules
- **Un fichier par fonctionnalité** dans `src/scripts/`
- Chaque module doit être déclaré dans `src/scripts/mod.rs`
- Utiliser `#[command]` pour exposer les fonctions au frontend
- Préfixer les fonctions par leur domaine (ex: `get_`, `save_`, `load_`, `is_`)

#### Style de Code
```rust
// ✅ BON: Fonction command bien structurée
#[command]
pub fn save_theme_selected(app: tauri::AppHandle, theme: String) -> Result<(), String> {
    let config_path = get_config_file_path(app.path())?;
    fs::write(config_path, theme).map_err(|e| e.to_string())
}

// ✅ BON: Gestion d'erreurs avec Result
pub fn get_config_file_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let config_dir = path.app_config_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de configuration".to_string())?;
    
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(config_dir.join("config.json"))
}

// ✅ BON: Utilisation de serde pour la sérialisation
#[derive(Serialize, Deserialize, Clone)]
pub struct TranslationSetting {
    pub link: Option<String>,
    #[serde(rename = "settingsEN")]
    pub settings_en: bool,
}
```

#### Gestion des Erreurs
- Toujours retourner `Result<T, String>` pour les commands
- Utiliser `.map_err(|e| e.to_string())` pour convertir les erreurs
- Messages d'erreur en français et descriptifs

#### Async/Await
- Utiliser `tokio` pour les opérations asynchrones
- Préférer `tokio::spawn` pour les tâches de fond
- Utiliser `reqwest::blocking` pour les requêtes HTTP simples dans les commands

### TypeScript/React (Frontend)

#### Organisation des Composants
```typescript
// ✅ BON: Composant fonctionnel avec TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg",
        variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'
      )}
    >
      {label}
    </button>
  );
};
```

#### Appels Tauri Commands
```typescript
// ✅ BON: Appel de command avec gestion d'erreur
import { invoke } from '@tauri-apps/api/core';

const saveTheme = async (theme: string) => {
  try {
    await invoke('save_theme_selected', { theme });
    toast.success('Thème sauvegardé');
  } catch (error) {
    toast.error(`Erreur: ${error}`);
  }
};
```

#### State Management (Zustand)
```typescript
// ✅ BON: Store Zustand typé
interface ThemeStore {
  theme: string;
  setTheme: (theme: string) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  loadTheme: async () => {
    const theme = await invoke<string>('load_theme_selected');
    set({ theme });
  },
}));
```

## 🔧 Workflow de Développement

### 1. Ajout d'une Nouvelle Fonctionnalité Backend

1. **Créer un nouveau module** dans `src-tauri/src/scripts/`
```rust
// src-tauri/src/scripts/ma_nouvelle_feature.rs
use tauri::command;

#[command]
pub fn ma_fonction(param: String) -> Result<String, String> {
    // Implémentation
    Ok(format!("Résultat: {}", param))
}
```

2. **Déclarer le module** dans `src-tauri/src/scripts/mod.rs`
```rust
pub mod ma_nouvelle_feature;
```

3. **Importer et enregistrer** dans `src-tauri/src/lib.rs`
```rust
use scripts::ma_nouvelle_feature::ma_fonction;

// Dans .invoke_handler()
.invoke_handler(tauri::generate_handler![
    // ... autres commands
    ma_fonction,
])
```

### 2. Ajout d'une Nouvelle Page Frontend

1. **Créer la page** dans `src/pages/`
```typescript
// src/pages/MaNouvellePage.tsx
export const MaNouvellePage = () => {
  return (
    <div className="p-6">
      <h1>Ma Nouvelle Page</h1>
    </div>
  );
};
```

2. **Ajouter la route** dans `src/App.tsx`
```typescript
<Route path="/ma-page" element={<MaNouvellePage />} />
```

### 3. Communication Frontend ↔ Backend

```typescript
// Frontend: Appel d'une command
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<string>('ma_fonction', { param: 'valeur' });
```

```rust
// Backend: Définition de la command
#[command]
pub fn ma_fonction(param: String) -> Result<String, String> {
    Ok(format!("Résultat: {}", param))
}
```

## 📦 Gestion des Dépendances

### Ajouter une Dépendance Rust
```bash
cd src-tauri
cargo add nom_de_la_crate
```

### Ajouter une Dépendance Node
```bash
pnpm add nom_du_package
# ou pour dev
pnpm add -D nom_du_package
```

## 🚀 Commandes Utiles

### Développement
```bash
# Lancer en mode dev (hot-reload)
pnpm tauri dev

# Build frontend uniquement
pnpm build

# Linter TypeScript
pnpm run lint
```

### Build Production
```bash
# Build complet (frontend + backend)
pnpm tauri build

# Build pour Windows Store
pnpm tauri build -- --config src-tauri/tauri.microsoftstore.conf.json

# Build version portable
pnpm tauri build -- --config src-tauri/tauri.portable.conf.json
```

### Tests
```bash
# Tests Rust
cd src-tauri && cargo test

# Tests Frontend
pnpm test
```

## 🎨 Styling avec TailwindCSS

### Classes Utilitaires Communes
```typescript
// Layout
className="flex items-center justify-between gap-4 p-6"

// Responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Dark mode
className="bg-white dark:bg-gray-900 text-black dark:text-white"

// Animations
className="transition-all duration-300 hover:scale-105"
```

### Utilisation de `cn()` (class-variance-authority)
```typescript
import { cn } from '@/lib/utils';

className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' && "primary-classes"
)}
```

## 🔐 Sécurité

### Bonnes Pratiques
- ✅ Toujours valider les entrées utilisateur côté backend
- ✅ Utiliser `Result<T, String>` pour la gestion d'erreurs
- ✅ Ne jamais exposer de chemins système sensibles
- ✅ Vérifier les permissions avant les opérations fichiers
- ✅ Utiliser `#[cfg(target_os = "windows")]` pour le code spécifique Windows

### Exemple de Validation
```rust
#[command]
pub fn delete_file(path: String) -> Result<(), String> {
    // Validation du chemin
    let path = Path::new(&path);
    if !path.exists() {
        return Err("Le fichier n'existe pas".to_string());
    }
    
    // Vérification de sécurité
    if path.to_str().unwrap().contains("..") {
        return Err("Chemin invalide".to_string());
    }
    
    fs::remove_file(path).map_err(|e| e.to_string())
}
```

## 📝 Documentation

### Documenter une Command Rust
```rust
/// Sauvegarde le thème sélectionné par l'utilisateur
///
/// # Arguments
/// * `app` - Handle de l'application Tauri
/// * `theme` - Nom du thème à sauvegarder
///
/// # Returns
/// * `Ok(())` si la sauvegarde réussit
/// * `Err(String)` avec un message d'erreur en cas d'échec
#[command]
pub fn save_theme_selected(app: tauri::AppHandle, theme: String) -> Result<(), String> {
    // ...
}
```

### Documenter un Composant React
```typescript
/**
 * Bouton personnalisé avec variantes
 * 
 * @param label - Texte du bouton
 * @param onClick - Fonction appelée au clic
 * @param variant - Style du bouton ('primary' | 'secondary')
 */
export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  // ...
};
```

## 🐛 Debugging

### Logs Rust
```rust
println!("Debug: {}", variable);
eprintln!("Error: {}", error);
```

### Logs Frontend
```typescript
console.log('Debug:', variable);
console.error('Error:', error);
```

### DevTools
- **Frontend**: F12 dans l'application
- **Backend**: Les logs Rust apparaissent dans le terminal

## 🔄 Gestion des Mises à Jour

L'application utilise `tauri-plugin-updater` pour les mises à jour automatiques.

### Configuration
- Fichier de configuration: `src-tauri/tauri.conf.json`
- Endpoint de mise à jour défini dans la configuration

## 📚 Ressources

### Documentation Officielle
- [Tauri v2 Docs](https://v2.tauri.app/)
- [React Docs](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)

### Crates Rust Importantes
- [tokio](https://tokio.rs/) - Async runtime
- [serde](https://serde.rs/) - Sérialisation
- [reqwest](https://docs.rs/reqwest/) - HTTP client
- [tray-icon](https://docs.rs/tray-icon/) - System tray
- [auto-launch](https://docs.rs/auto-launch/) - Auto-startup

## 🎯 Checklist pour une PR

- [ ] Le code compile sans warnings
- [ ] Les tests passent
- [ ] Le code suit les conventions établies
- [ ] La documentation est à jour
- [ ] Les erreurs sont gérées correctement
- [ ] Le code est testé sur Windows
- [ ] Les messages utilisateur sont en français
- [ ] Pas de `console.log` ou `println!` de debug

## 💡 Tips & Astuces

### Performance
- Utiliser `useMemo` et `useCallback` pour optimiser React
- Préférer `tokio::spawn` pour les tâches longues côté Rust
- Lazy load les composants lourds avec `React.lazy()`

### UX
- Toujours afficher un feedback utilisateur (toast, loading, etc.)
- Gérer les états de chargement
- Prévoir les cas d'erreur avec des messages clairs

### Maintenance
- Commenter le code complexe
- Utiliser des noms de variables descriptifs
- Garder les fonctions courtes et focalisées
- Éviter la duplication de code

---

**Dernière mise à jour**: 2025-01-21
**Version**: 2.1.12
