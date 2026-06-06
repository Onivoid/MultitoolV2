mod scripts;

use scripts::background_service::{
    get_background_service_config, load_background_service_config, save_background_service_config,
    set_background_service_config, start_background_service, start_background_service_internal,
    stop_background_service, BackgroundServiceState,
};
use scripts::cache_functions::{
    clear_cache, delete_folder, get_cache_informations, open_cache_folder,
};
use scripts::game_log::{
    get_cached_game_stats, get_game_stats, get_game_stats_scan_status, sync_game_stats,
    GameStatsScanState,
};
use scripts::gamelog_watcher::load_gamelog_watcher_config_sync;
use scripts::gamelog_watcher::{
    export_gamelog_blueprints, get_gamelog_watcher_status, import_blueprints_from_logbackups,
    load_gamelog_blueprints, load_gamelog_watcher_config,
    save_gamelog_blueprint_catalog_matches, save_gamelog_watcher_config,
    start_gamelog_watcher, start_gamelog_watcher_internal, stop_gamelog_watcher,
    GamelogWatcherState,
};
use scripts::game_config_backup::{
    export_game_config_backup, list_game_config_backup_targets,
};
use scripts::blueprints_catalog::{
    blueprint_catalog_detail, blueprints_catalog_list_full, blueprints_catalog_match_products,
    blueprints_catalog_refresh_localization, blueprints_catalog_revalidate,
    blueprints_catalog_supplement_ids,
};
use scripts::blueprints_wiki_extended::{
    blueprints_catalog_filters, blueprints_mission_detail, ingredient_locations,
};
use scripts::gamepath::{get_live_game_log_path, get_star_citizen_versions};
use scripts::home_dashboard::{get_home_dashboard, save_home_dashboard};
use scripts::local_characters_functions::{
    delete_character, download_character, duplicate_character, get_character_informations,
    open_characters_folder,
};
use scripts::patchnote::get_latest_commits;
use scripts::presets_list_functions::get_characters;
use scripts::recent_routes::{get_top_routes, record_page_visit};
use scripts::onboarding::{
    complete_onboarding, get_onboarding_state, record_onboarding_attempt, reset_onboarding,
};
use scripts::rsi_news::fetch_rsi_news;
use scripts::rsi_status::fetch_rsi_status_feed;
use scripts::startup_manager::{
    disable_auto_startup, enable_auto_startup, is_auto_startup_enabled,
};
use scripts::system_metrics::get_system_metrics;
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

/// Ouvre une URL externe dans le navigateur par défaut du système.
#[command]
async fn open_external(url: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    match app_handle.shell().open(url, None) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

/// Vérifie si l'application a démarré en mode minimisé.
#[command]
fn is_minimized_start() -> bool {
    let args: Vec<String> = std::env::args().collect();
    args.contains(&"--minimized".to_string())
}

/// Point d'entrée principal de l'application Tauri.
///
/// Configure tous les plugins, gestionnaires de commandes et initialise l'état de l'application.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("impossible de récupérer la fenêtre principale");

            let background_state = BackgroundServiceState::default();
            match load_background_service_config(app.handle().clone()) {
                Ok(config) => {
                    if let Ok(mut state_config) = background_state.config.lock() {
                        *state_config = config.clone();
                    }

                    if config.enabled {
                        let app_handle_clone = app.handle().clone();
                        let state_clone = background_state.clone();

                        tauri::async_runtime::spawn(async move {
                            if let Err(e) =
                                start_background_service_internal(state_clone, app_handle_clone)
                                    .await
                            {
                                eprintln!("Échec du démarrage du service de fond: {e}");
                            }
                        });
                    }
                }
                Err(e) => {
                    eprintln!("Échec du chargement de la config du service de fond: {e}");
                }
            }

            app.manage(background_state);

            let gamelog_watcher_state = GamelogWatcherState::default();
            match load_gamelog_watcher_config_sync(app.handle()) {
                Ok(config) => {
                    if config.auto_start {
                        let app_handle_clone = app.handle().clone();
                        let state_clone = gamelog_watcher_state.clone();
                        if let Err(e) =
                            start_gamelog_watcher_internal(&state_clone, app_handle_clone)
                        {
                            eprintln!("Échec du démarrage du gamelog watcher: {e}");
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Échec du chargement de la config gamelog watcher: {e}");
                }
            }
            app.manage(gamelog_watcher_state);
            app.manage(GameStatsScanState::default());

            if let Err(e) = setup_system_tray(app.handle()) {
                eprintln!("Échec de la configuration du system tray: {e}");
            }

            let args: Vec<String> = std::env::args().collect();
            if args.contains(&"--minimized".to_string()) {
                if let Err(e) = window.hide() {
                    eprintln!("Échec de la minimisation de la fenêtre au démarrage: {e}");
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Err(e) = window.hide() {
                    eprintln!("Échec de la minimisation dans le tray: {e}");
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
            is_minimized_start,
            fetch_rsi_news,
            fetch_rsi_status_feed,
            get_onboarding_state,
            record_onboarding_attempt,
            complete_onboarding,
            reset_onboarding,
            get_live_game_log_path,
            load_gamelog_blueprints,
            save_gamelog_blueprint_catalog_matches,
            load_gamelog_watcher_config,
            save_gamelog_watcher_config,
            get_gamelog_watcher_status,
            start_gamelog_watcher,
            stop_gamelog_watcher,
            export_gamelog_blueprints,
            import_blueprints_from_logbackups,
            record_page_visit,
            get_top_routes,
            get_home_dashboard,
            save_home_dashboard,
            get_cached_game_stats,
            get_game_stats_scan_status,
            get_game_stats,
            sync_game_stats,
            get_system_metrics,
            list_game_config_backup_targets,
            export_game_config_backup,
            blueprints_catalog_list_full,
            blueprint_catalog_detail,
            blueprints_catalog_refresh_localization,
            blueprints_catalog_revalidate,
            blueprints_catalog_match_products,
            blueprints_catalog_supplement_ids,
            blueprints_catalog_filters,
            blueprints_mission_detail,
            ingredient_locations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
