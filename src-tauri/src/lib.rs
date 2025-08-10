mod scripts;

use is_elevated::is_elevated;
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
async fn restart_as_admin() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = exe
            .to_str()
            .ok_or_else(|| "Chemin exécutable invalide".to_string())?;
        // Échapper les quotes pour PowerShell
        let escaped = exe_str.replace("'", "''");
        Command::new("powershell")
            .creation_flags(CREATE_NO_WINDOW)
            .arg("-NoProfile")
            .arg("-WindowStyle")
            .arg("Hidden")
            .arg("-Command")
            .arg(format!(
                "Start-Process -FilePath '{}' -Verb RunAs -WindowStyle Hidden",
                escaped
            ))
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("impossible de récupérer la fenêtre principale");

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
            restart_as_admin,
            clear_cache,
            open_cache_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
