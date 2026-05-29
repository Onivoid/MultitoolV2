# Packaging Microsoft Store (MSIX)

Workflow : build MSI Store → **MSIX Packaging Tool** → soumission Partner Center.

## Capability `broadFileSystemAccess`

1. Ouvrir le projet dans **MSIX Packaging Tool** (MSI `MultitoolV2-MicrosoftStore.msi`).
2. Éditer `Package.appxmanifest` → onglet **Capabilities** ou éditeur XML.
3. Ajouter le contenu de [`Package.appxmanifest.capabilities.snippet.xml`](./Package.appxmanifest.capabilities.snippet.xml) dans `<Capabilities>` (namespace `rescap` requis sur l’élément racine du manifeste si absent).
4. **Make Package** puis soumettre le `.msix`.

### Partner Center

Déclarer la capability restreinte **broadFileSystemAccess** avec une justification du type : *l’application modifie les fichiers de localisation du jeu Star Citizen dans le dossier d’installation choisi par l’utilisateur*.

### Côté utilisateur

Après installation : **Paramètres Windows → Confidentialité et sécurité → Système de fichiers** → activer **MultitoolV2**.
