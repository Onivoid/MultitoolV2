mod scripts;

use scripts::theme_preferences::{save_theme_selected, load_theme_selected};
use scripts::patchnote::get_latest_commits;
use scripts::gamepath::get_star_citizen_versions;
use scripts::translation_functions::{is_game_translated, init_translation_files, is_translation_up_to_date, update_translation, uninstall_translation};
use scripts::translation_preferences::{save_translations_selected, load_translations_selected};
use scripts::translations_links::get_translations;
use window_vibrancy::apply_acrylic;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            
            let window = app.get_webview_window("main").expect("impossible de récupérer la fenêtre principale");

            #[cfg(target_os = "windows")]
            apply_acrylic(&window, Some((18, 18, 18, 125)))
                .expect("Impossible d'appliquer l'effet de blur sur Windows");
                
            Ok(())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
