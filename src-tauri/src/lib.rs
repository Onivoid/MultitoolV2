mod scripts;

use is_elevated::is_elevated;
use scripts::background_service::{
    get_background_service_config, load_background_service_config, save_background_service_config,
    set_background_service_config, start_background_service, start_background_service_internal,
    stop_background_service, BackgroundServiceState,
};
use scripts::cache_functions::{
    clear_cache, delete_folder, get_cache_informations, open_cache_folder,
};
use scripts::gamepath::get_star_citizen_versions;
use scripts::local_characters_functions::{
    delete_character, download_character, duplicate_character, get_character_informations,
    open_characters_folder,
};
use scripts::patchnote::get_latest_commits;
use scripts::presets_list_functions::get_characters;
use scripts::startup_manager::{
    disable_auto_startup, enable_auto_startup, is_auto_startup_enabled,
};
use scripts::system_tray::setup_system_tray;
use scripts::theme_preferences::{load_theme_selected, save_theme_selected};
use scripts::translation_functions::{
    init_translation_files, is_game_translated, is_translation_up_to_date, uninstall_translation,
    update_translation,
};
use scripts::translation_preferences::{load_translations_selected, save_translations_selected};
use scripts::translations_links::{get_translation_by_setting, get_translations};
use tauri::{command, Manager};
use tauri_plugin_shell::ShellExt;
use window_vibrancy::apply_acrylic;

#[command]
async fn open_external(url: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    match app_handle.shell().open(url, None) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
async fn restart_as_admin(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = exe
            .to_str()
            .ok_or_else(|| "Chemin exécutable invalide".to_string())?;

        // Vérifier si c'est une app Store (WindowsApps dans le chemin)
        if exe_str.contains("WindowsApps") {
            return Err("Les applications Microsoft Store ne peuvent pas être élevées en administrateur. Veuillez utiliser la version MSI ou portable.".to_string());
        }

        // Échapper les quotes pour PowerShell
        let escaped = exe_str.replace("'", "''");

        let result = Command::new("powershell")
            .creation_flags(CREATE_NO_WINDOW)
            .arg("-NoProfile")
            .arg("-WindowStyle")
            .arg("Hidden")
            .arg("-Command")
            .arg(format!(
                "Start-Process -FilePath '{}' -Verb RunAs",
                escaped
            ))
            .spawn();

        match result {
            Ok(_) => {
                // Attendre un peu pour que la nouvelle instance démarre
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                // Fermer l'application actuelle
                app.exit(0);
                Ok(())
            }
            Err(e) => {
                Err(format!("Erreur lors du redémarrage en administrateur: {}. Essayez de lancer l'application manuellement en tant qu'administrateur.", e))
            }
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Élévation non supportée sur cette plateforme".to_string())
    }
}

#[command]
fn is_running_as_admin() -> bool {
    #[cfg(target_os = "windows")]
    {
        is_elevated()
    }
    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

#[command]
fn can_elevate_privileges() -> bool {
    #[cfg(target_os = "windows")]
    {
        // Vérifier si c'est une app Microsoft Store
        if let Ok(exe) = std::env::current_exe() {
            if let Some(exe_str) = exe.to_str() {
                // Les apps Store sont dans WindowsApps et ne peuvent pas être élevées
                if exe_str.contains("WindowsApps") {
                    return false;
                }
            }
        }
        // Pour les autres types d'installation (portable, MSI), l'élévation est possible
        true
    }
    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("impossible de récupérer la fenêtre principale");

            #[cfg(target_os = "windows")]
            apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Impossible d'appliquer l'effet de blur sur Windows");

            // Initialiser l'état du service de fond
            let background_state = BackgroundServiceState::default();

            // Charger la configuration sauvegardée et l'appliquer
            match load_background_service_config(app.handle().clone()) {
                Ok(config) => {
                    // Mettre à jour l'état avec la config chargée
                    if let Ok(mut state_config) = background_state.config.lock() {
                        *state_config = config.clone();
                    }

                    // Démarrer le service de fond si activé
                    if config.enabled {
                        let app_handle_clone = app.handle().clone();
                        let state_clone = background_state.clone();

                        // Utiliser le runtime async de Tauri
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) =
                                start_background_service_internal(state_clone, app_handle_clone)
                                    .await
                            {
                                eprintln!("Échec du démarrage du service de fond: {}", e);
                            }
                        });
                    }
                }
                Err(e) => {
                    eprintln!("Échec du chargement de la config du service de fond: {}", e);
                }
            }

            app.manage(background_state);

            // Configurer le system tray
            if let Err(e) = setup_system_tray(&app.handle()) {
                eprintln!("Échec de la configuration du system tray: {}", e);
            }

            // Vérifier si l'app a été lancée avec le flag --minimized (depuis le démarrage)
            let args: Vec<String> = std::env::args().collect();
            if args.contains(&"--minimized".to_string()) {
                if let Err(e) = window.hide() {
                    eprintln!("Échec de la minimisation de la fenêtre au démarrage: {}", e);
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Empêcher la fermeture par défaut
                api.prevent_close();
                // Cacher la fenêtre dans le tray au lieu de la fermer
                if let Err(e) = window.hide() {
                    eprintln!("Échec de la minimisation dans le tray: {}", e);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            save_theme_selected,
            load_theme_selected,
            get_latest_commits,
            get_star_citizen_versions,
            is_game_translated,
            init_translation_files,
            is_translation_up_to_date,
            update_translation,
            uninstall_translation,
            save_translations_selected,
            load_translations_selected,
            get_translations,
            get_translation_by_setting,
            get_cache_informations,
            delete_folder,
            get_character_informations,
            delete_character,
            open_characters_folder,
            duplicate_character,
            download_character,
            get_characters,
            open_external,
            is_running_as_admin,
            can_elevate_privileges,
            restart_as_admin,
            clear_cache,
            open_cache_folder,
            get_background_service_config,
            set_background_service_config,
            start_background_service,
            stop_background_service,
            save_background_service_config,
            load_background_service_config,
            enable_auto_startup,
            disable_auto_startup,
            is_auto_startup_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
