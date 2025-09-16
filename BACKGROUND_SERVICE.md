# Background Service Feature

Cette nouvelle fonctionnalité ajoute un service en arrière-plan qui permet de maintenir automatiquement les traductions à jour.

## 🚀 Fonctionnalités

### Service en Arrière-Plan
- **Vérification automatique** : Le service vérifie périodiquement les mises à jour de traduction
- **Mise à jour automatique** : Installation automatique des nouvelles versions de traduction
- **Intervalle configurable** : Choisir la fréquence de vérification (par défaut 60 minutes)
- **Détection intelligente** : Ne vérifie que les versions avec traductions déjà installées

### Démarrage avec Windows
- **Démarrage automatique** : L'application peut se lancer automatiquement au démarrage de Windows
- **Mode minimisé** : Se lance directement dans la barre système (system tray)
- **Registre Windows** : Utilise les mécanismes standard de Windows pour l'auto-démarrage

### Barre Système (System Tray)
- **Icône dans la barre système** : L'application peut fonctionner en arrière-plan
- **Menu contextuel** : Clic droit pour afficher/masquer ou quitter l'application
- **Clic simple** : Clic gauche pour basculer entre afficher/masquer la fenêtre

## ⚙️ Configuration

### Accès aux Paramètres
1. Ouvrir l'application
2. Cliquer sur l'icône "Paramètres" en bas de la barre latérale
3. La section "Service en arrière-plan" apparaît dans la boîte de dialogue

### Options Disponibles
- **Activer le service en arrière-plan** : Active/désactive la surveillance automatique
- **Démarrer avec Windows** : Configure le lancement automatique au démarrage
- **Mise à jour automatique** : Active l'installation automatique des mises à jour
- **Intervalle de vérification** : Fréquence en minutes (minimum 1, maximum 1440)

## 🔧 Implémentation Technique

### Backend (Rust)
- **`BackgroundServiceState`** : Gestion de l'état du service
- **`SystemTray`** : Fonctionnalité de barre système (Windows uniquement)
- **Configuration persistante** : Sauvegarde dans `~/.multitool/background_service.json`
- **Intégration existante** : Utilise les fonctions de traduction existantes

### Frontend (React/TypeScript)
- **`BackgroundServiceSettings`** : Composant de configuration
- **Événements temps réel** : Notification des mises à jour via Tauri events
- **Interface intuitive** : Paramètres clairement organisés avec tooltips

## 🎯 Utilisation

### Activation du Service
1. Aller dans Paramètres > Service en arrière-plan
2. Activer "Service en arrière-plan"
3. Configurer l'intervalle de vérification désiré
4. Optionnellement activer "Mise à jour automatique"

### Démarrage avec Windows
1. Dans les paramètres, activer "Démarrer avec Windows"
2. L'application se lancera automatiquement au prochain redémarrage
3. Elle apparaîtra directement dans la barre système

### Notifications
- **Mises à jour réussies** : Toast vert avec confirmation
- **Erreurs** : Toast rouge avec détails de l'erreur
- **Logs** : Messages de débogage dans la console

## 📝 Notes Importantes

### Compatibilité
- **Barre système** : Disponible uniquement sur Windows
- **Auto-démarrage** : Disponible uniquement sur Windows
- **Service en arrière-plan** : Fonctionne sur toutes les plateformes

### Sécurité
- **Permissions** : Gestion automatique des chemins protégés (Program Files)
- **Configuration** : Stockage local sécurisé des préférences
- **Intégrité** : Vérification de l'intégrité des fichiers de traduction

### Performance
- **Optimisé** : Vérifications uniquement si des traductions sont installées
- **Non-bloquant** : Service asynchrone qui n'impacte pas l'interface
- **Configurable** : Intervalle ajustable selon les besoins de l'utilisateur

## 🔍 Débogage

### Vérifier l'État du Service
```javascript
// Dans la console du navigateur
tauri.invoke('get_background_service_config')
  .then(config => console.log('Config:', config))
```

### Logs du Service
Les messages du service apparaissent dans :
- Console du développement (npm run dev)
- Logs système de Windows (pour les erreurs critiques)

### Configuration Manuelle
Le fichier de configuration se trouve à :
```
%USERPROFILE%\.multitool\background_service.json
```