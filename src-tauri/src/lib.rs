mod scripts;

use scripts::theme_preferences::{save_theme_selected, load_theme_selected};
use scripts::patchnote::get_latest_commits;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            save_theme_selected,
            load_theme_selected,
            get_latest_commits
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
