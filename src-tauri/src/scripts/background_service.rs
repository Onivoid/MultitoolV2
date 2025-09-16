use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{command, AppHandle, Emitter};
use tokio::time::sleep;
use serde::{Deserialize, Serialize};
#[cfg(target_os = "windows")]
use auto_launch::AutoLaunch;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundServiceConfig {
    pub enabled: bool,
    pub check_interval_minutes: u64,
    pub auto_update: bool,
    pub start_with_windows: bool,
}

impl Default for BackgroundServiceConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            check_interval_minutes: 60, // 1 hour by default
            auto_update: true,
            start_with_windows: false,
        }
    }
}

pub struct BackgroundServiceState {
    pub config: Arc<Mutex<BackgroundServiceConfig>>,
    pub is_running: Arc<Mutex<bool>>,
}

impl Default for BackgroundServiceState {
    fn default() -> Self {
        Self {
            config: Arc::new(Mutex::new(BackgroundServiceConfig::default())),
            is_running: Arc::new(Mutex::new(false)),
        }
    }
}

#[command]
pub async fn get_background_service_config(
    state: tauri::State<'_, BackgroundServiceState>,
) -> Result<BackgroundServiceConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

#[command]
pub async fn set_background_service_config(
    config: BackgroundServiceConfig,
    state: tauri::State<'_, BackgroundServiceState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Update the config
    {
        let mut current_config = state.config.lock().map_err(|e| e.to_string())?;
        *current_config = config.clone();
    }

    // Handle Windows startup setting
    if let Err(e) = set_windows_startup(config.start_with_windows).await {
        eprintln!("Failed to set Windows startup: {}", e);
    }

    // Restart the background service if config changed
    if config.enabled {
        start_background_service(state, app_handle).await?;
    } else {
        stop_background_service(state).await?;
    }

    Ok(())
}

#[command] 
pub async fn start_background_service(
    state: tauri::State<'_, BackgroundServiceState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut is_running = state.is_running.lock().map_err(|e| e.to_string())?;
    
    if *is_running {
        return Ok(()); // Already running
    }
    
    *is_running = true;
    drop(is_running); // Release the lock before starting the async task
    
    let state_clone = {
        let inner = state.inner();
        Arc::new(BackgroundServiceState {
            config: inner.config.clone(),
            is_running: inner.is_running.clone(),
        })
    };
    let app_handle_clone = app_handle.clone();
    
    tokio::spawn(async move {
        background_translation_checker(state_clone, app_handle_clone).await;
    });
    
    Ok(())
}

#[command]
pub async fn stop_background_service(
    state: tauri::State<'_, BackgroundServiceState>,
) -> Result<(), String> {
    let mut is_running = state.is_running.lock().map_err(|e| e.to_string())?;
    *is_running = false;
    Ok(())
}

async fn background_translation_checker(
    state: Arc<BackgroundServiceState>,
    app_handle: AppHandle,
) {
    loop {
        let (should_continue, interval_minutes) = {
            let is_running = state.is_running.lock().unwrap();
            let config = state.config.lock().unwrap();
            (*is_running, config.check_interval_minutes)
        };
        
        if !should_continue {
            break;
        }
        
        // Check for translation updates
        if let Err(e) = check_and_update_translations(&app_handle).await {
            eprintln!("Background translation check failed: {}", e);
        }
        
        // Wait for the configured interval
        sleep(Duration::from_secs(interval_minutes * 60)).await;
    }
}

async fn check_and_update_translations(app_handle: &AppHandle) -> Result<(), String> {
    use crate::scripts::translation_functions::{is_game_translated, is_translation_up_to_date, update_translation};
    use crate::scripts::gamepath::get_star_citizen_versions;
    use crate::scripts::translation_preferences::load_translations_selected;
    
    println!("Background: Starting translation check...");
    
    // Get game paths
    let game_paths = match get_star_citizen_versions() {
        Ok(paths) => paths,
        Err(e) => {
            eprintln!("Background: Failed to get game paths: {}", e);
            return Err(e);
        }
    };
    
    // Get translation preferences
    let translation_prefs = match load_translations_selected() {
        Ok(prefs) => prefs,
        Err(e) => {
            eprintln!("Background: Failed to load translation preferences: {}", e);
            return Ok(()); // Not an error if no preferences are set
        }
    };
    
    // Check each version
    for (version_key, version_data) in game_paths.versions.iter() {
        if let Some(version_prefs) = translation_prefs.get(version_key) {
            if let Some(link) = &version_prefs.link {
                // Check if translation is installed
                let is_translated = is_game_translated(version_data.path.clone(), "fr".to_string());
                
                if is_translated {
                    // Check if translation is up to date
                    let is_up_to_date = is_translation_up_to_date(
                        version_data.path.clone(), 
                        link.clone(), 
                        "fr".to_string()
                    );
                    
                    if !is_up_to_date {
                        println!("Background: Translation update available for {}", version_key);
                        
                        // Update translation
                        match update_translation(version_data.path.clone(), "fr".to_string(), link.clone()) {
                            Ok(_) => {
                                println!("Background: Successfully updated translation for {}", version_key);
                                
                                // Emit event to notify frontend
                                let _ = app_handle.emit("translation_updated", serde_json::json!({
                                    "version": version_key,
                                    "success": true
                                }));
                            },
                            Err(e) => {
                                eprintln!("Background: Failed to update translation for {}: {}", version_key, e);
                                
                                // Emit event to notify frontend
                                let _ = app_handle.emit("translation_updated", serde_json::json!({
                                    "version": version_key,
                                    "success": false,
                                    "error": e
                                }));
                            }
                        }
                    } else {
                        println!("Background: Translation for {} is up to date", version_key);
                    }
                }
            }
        }
    }
    
    println!("Background: Translation check completed");
    Ok(())
}

async fn set_windows_startup(enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
        let app_name = "MultitoolV2";
        
        let auto_launch = AutoLaunch::new(app_name, exe_path.to_str().unwrap(), &["--minimized"]);
        
        if enable {
            auto_launch.enable().map_err(|e| e.to_string())?;
        } else {
            auto_launch.disable().map_err(|e| e.to_string())?;
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        if enable {
            return Err("Auto-startup is only supported on Windows".to_string());
        }
    }
    
    Ok(())
}

#[command]
pub async fn is_auto_startup_enabled() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
        let app_name = "MultitoolV2";
        
        let auto_launch = AutoLaunch::new(app_name, exe_path.to_str().unwrap(), &["--minimized"]);
        auto_launch.is_enabled().map_err(|e| e.to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok(false)
}