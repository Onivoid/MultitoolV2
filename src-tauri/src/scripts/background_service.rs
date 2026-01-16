use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{command, AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tokio::time::sleep;

use crate::scripts::gamepath::get_star_citizen_versions;
use crate::scripts::translation_functions::{
    is_game_translated, is_translation_up_to_date_async, update_translation_async,
};
use crate::scripts::translation_preferences::load_translations_selected;

/// Configuration du service de tâche de fond pour la vérification automatique des mises à jour de traduction.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundServiceConfig {
    pub enabled: bool,
    pub check_interval_minutes: u64,
    pub language: String,
}

impl Default for BackgroundServiceConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            check_interval_minutes: 5,
            language: "fr".to_string(),
        }
    }
}

/// État partagé du service de tâche de fond.
#[derive(Clone)]
pub struct BackgroundServiceState {
    pub config: Arc<Mutex<BackgroundServiceConfig>>,
    pub is_running: Arc<Mutex<bool>>,
    pub cancel_token: Arc<Mutex<Option<tokio::sync::oneshot::Sender<()>>>>,
}

impl Default for BackgroundServiceState {
    fn default() -> Self {
        Self {
            config: Arc::new(Mutex::new(BackgroundServiceConfig::default())),
            is_running: Arc::new(Mutex::new(false)),
            cancel_token: Arc::new(Mutex::new(None)),
        }
    }
}

/// Récupère la configuration actuelle du service de tâche de fond.
#[command]
pub fn get_background_service_config(
    state: tauri::State<BackgroundServiceState>,
) -> Result<BackgroundServiceConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

/// Met à jour la configuration du service de tâche de fond.
#[command]
pub fn set_background_service_config(
    state: tauri::State<BackgroundServiceState>,
    config: BackgroundServiceConfig,
) -> Result<(), String> {
    let mut current_config = state.config.lock().map_err(|e| e.to_string())?;
    *current_config = config;
    Ok(())
}

/// Démarre le service de tâche de fond en interne.
///
/// # Erreurs
///
/// Retourne une erreur si le service est déjà en cours d'exécution.
pub async fn start_background_service_internal(
    state: BackgroundServiceState,
    app: AppHandle,
) -> Result<(), String> {
    {
        let is_running = state.is_running.lock().map_err(|e| e.to_string())?;
        if *is_running {
            return Err("Le service est déjà en cours d'exécution".to_string());
        }
    }

    {
        let mut is_running = state.is_running.lock().map_err(|e| e.to_string())?;
        *is_running = true;
    }

    let (cancel_tx, cancel_rx) = tokio::sync::oneshot::channel();
    {
        let mut cancel_token = state.cancel_token.lock().map_err(|e| e.to_string())?;
        *cancel_token = Some(cancel_tx);
    }

    let state_clone = state.clone();
    let app_clone = app.clone();
    tokio::spawn(async move {
        run_background_service(state_clone, app_clone, cancel_rx).await;
    });

    Ok(())
}

/// Démarre le service de tâche de fond.
#[command]
pub async fn start_background_service(
    state: tauri::State<'_, BackgroundServiceState>,
    app: AppHandle,
) -> Result<(), String> {
    start_background_service_internal(state.inner().clone(), app).await
}

/// Arrête le service de tâche de fond.
#[command]
pub async fn stop_background_service(
    state: tauri::State<'_, BackgroundServiceState>,
) -> Result<(), String> {
    {
        let is_running = state.is_running.lock().map_err(|e| e.to_string())?;
        if !*is_running {
            return Err("Le service n'est pas en cours d'exécution".to_string());
        }
    }

    {
        let mut cancel_token = state.cancel_token.lock().map_err(|e| e.to_string())?;
        if let Some(tx) = cancel_token.take() {
            let _ = tx.send(());
        }
    }
    {
        let mut is_running = state.is_running.lock().map_err(|e| e.to_string())?;
        *is_running = false;
    }

    Ok(())
}

async fn run_background_service(
    state: BackgroundServiceState,
    app: AppHandle,
    mut cancel_rx: tokio::sync::oneshot::Receiver<()>,
) {
    println!("[Background Service] Démarrage du service de tâche de fond");

    loop {
        let config = {
            let config_lock = state.config.lock().unwrap();
            config_lock.clone()
        };

        if !config.enabled {
            println!("[Background Service] Service désactivé, arrêt...");
            break;
        }

        if let Err(e) = check_and_update_translations(&app, &config.language).await {
            eprintln!("[Background Service] Erreur lors de la vérification: {}", e);
        }

        let interval = Duration::from_secs(config.check_interval_minutes * 60);

        tokio::select! {
            _ = sleep(interval) => {}
            _ = &mut cancel_rx => {
                println!("[Background Service] Signal d'arrêt reçu");
                break;
            }
        }
    }

    // Marquer le service comme arrêté
    {
        let mut is_running = state.is_running.lock().unwrap();
        *is_running = false;
    }

    println!("[Background Service] Service arrêté");
}

async fn check_and_update_translations(app: &AppHandle, lang: &str) -> Result<(), String> {
    println!("[Background Service] Vérification des mises à jour de traduction...");
    let version_paths = get_star_citizen_versions();
    if version_paths.versions.is_empty() {
        println!("[Background Service] Aucune version du jeu trouvée");
        return Ok(());
    }
    let translations_selected = load_translations_selected(app.clone())?;
    let translations_obj = translations_selected
        .as_value()
        .as_object()
        .ok_or_else(|| "Format de traduction invalide".to_string())?;

    let mut updates_count = 0;
    for (version_name, version_info) in version_paths.versions {
        let version_path = version_info.path.clone();
        if let Some(translation_setting) = translations_obj.get(&version_name) {
            if let Some(link) = translation_setting.get("link").and_then(|v| v.as_str()) {
                if is_game_translated(version_path.clone(), lang.to_string()) {
                    if !is_translation_up_to_date_async(
                        version_path.clone(),
                        link.to_string(),
                        lang.to_string(),
                    )
                    .await
                    {
                        println!(
                            "[Background Service] Mise à jour disponible pour {}",
                            version_name
                        );
                        match update_translation_async(
                            version_path.clone(),
                            lang.to_string(),
                            link.to_string(),
                        )
                        .await
                        {
                            Ok(_) => {
                                println!(
                                    "[Background Service] Traduction mise à jour pour {}",
                                    version_name
                                );
                                updates_count += 1;
                                match app.notification()
                                    .builder()
                                    .title("Traduction mise à jour")
                                    .body(format!("La traduction {} a été mise à jour avec succès", version_name))
                                    .show() {
                                    Ok(_) => println!("[Background Service] Notification envoyée avec succès"),
                                    Err(e) => eprintln!("[Background Service] Erreur lors de l'envoi de la notification: {}", e),
                                }
                            }
                            Err(e) => {
                                eprintln!(
                                    "[Background Service] Erreur lors de la mise à jour de {}: {}",
                                    version_name, e
                                );
                            }
                        }
                    } else {
                        println!("[Background Service] {} est à jour", version_name);
                    }
                } else {
                    println!(
                        "[Background Service] Traduction non installée pour {}",
                        version_name
                    );
                }
            }
        }
    }

    if updates_count > 0 {
        println!(
            "[Background Service] {} traduction(s) mise(s) à jour",
            updates_count
        );
    } else {
        println!("[Background Service] Toutes les traductions sont à jour");
    }

    Ok(())
}

/// Sauvegarde la configuration du service de tâche de fond dans un fichier JSON.
#[command]
pub fn save_background_service_config(
    app: AppHandle,
    config: BackgroundServiceConfig,
) -> Result<(), String> {
    use std::fs;

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de configuration".to_string())?;

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }

    let config_file = config_dir.join("background_service.json");
    let json_data = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(config_file, json_data).map_err(|e| e.to_string())
}

/// Charge la configuration du service de tâche de fond depuis un fichier JSON.
#[command]
pub fn load_background_service_config(app: AppHandle) -> Result<BackgroundServiceConfig, String> {
    use std::fs;

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de configuration".to_string())?;

    let config_file = config_dir.join("background_service.json");

    if !config_file.exists() {
        return Ok(BackgroundServiceConfig::default());
    }

    let json_data = fs::read_to_string(config_file).map_err(|e| e.to_string())?;
    serde_json::from_str(&json_data).map_err(|e| e.to_string())
}
