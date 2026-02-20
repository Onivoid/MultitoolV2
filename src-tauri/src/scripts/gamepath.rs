use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::Path;
use tauri::command;

fn get_log_file_path() -> Option<String> {
    if cfg!(target_os = "windows") {
        if let Ok(appdata) = env::var("APPDATA") {
            let rsi_launcher_path = format!("{}\\rsilauncher", appdata);
            let log_file_path = format!("{}\\logs\\log.log", rsi_launcher_path);
            return Some(log_file_path);
        }
    }
    None
}

fn get_launcher_log_list() -> Vec<String> {
    if let Some(log_file_path) = get_log_file_path() {
        if let Ok(contents) = fs::read_to_string(log_file_path) {
            return contents.lines().map(|s| s.to_string()).collect();
        }
    }
    Vec::new()
}

fn check_and_add_path(path: &str, check_exists: bool, sc_install_paths: &mut Vec<String>) {
    let path = path.replace("\\\\", "\\");
    let normalized_path = path.trim_end_matches('\\').to_string();

    if !normalized_path.is_empty()
        && !sc_install_paths
            .iter()
            .any(|existing_path| existing_path.trim_end_matches('\\') == normalized_path)
    {
        if !check_exists {
            sc_install_paths.push(normalized_path);
        } else {
            let exe_path = format!("{}\\Bin64\\StarCitizen.exe", normalized_path);
            let data_p4k_path = format!("{}\\Data.p4k", normalized_path);
            if Path::new(&exe_path).exists() && Path::new(&data_p4k_path).exists() {
                sc_install_paths.push(normalized_path);
            }
        }
    }
}

fn get_game_install_path(list_data: Vec<String>, check_exists: bool) -> Vec<String> {
    let mut sc_install_paths = Vec::new();

    let pattern = r"([a-zA-Z]:\\\\(?:[^\\\\]+\\\\)*StarCitizen\\\\[A-Za-z0-9_\\.\\@\\-]+)";
    let re = Regex::new(pattern).unwrap();

    for line in list_data.iter().rev() {
        for cap in re.captures_iter(line) {
            if let Some(matched_path) = cap.get(0) {
                check_and_add_path(matched_path.as_str(), check_exists, &mut sc_install_paths);
            }
        }
    }

    sc_install_paths
}

fn get_game_channel_id(install_path: &str) -> String {
    let re = Regex::new(r"StarCitizen\\([A-Za-z0-9_\\.\\@-]+)\\?$").unwrap();
    if let Some(cap) = re.captures(install_path) {
        if let Some(version) = cap.get(1) {
            let version_str = version.as_str();
            return version_str.trim_end_matches('\\').to_string();
        }
    }
    "UNKNOWN".to_string()
}

/// Informations sur une version installée de Star Citizen.
#[derive(Serialize)]
pub struct VersionInfo {
    pub path: String,
    pub translated: bool,
    pub up_to_date: bool,
}

/// Collection de toutes les versions de Star Citizen détectées.
#[derive(Serialize)]
pub struct VersionPaths {
    pub versions: HashMap<String, VersionInfo>,
}

/// Détecte et retourne toutes les versions installées de Star Citizen (travail bloquant).
/// Public pour usage depuis d'autres commandes sync (ex. local_characters).
pub fn get_star_citizen_versions_sync() -> VersionPaths {
    let log_lines = get_launcher_log_list();
    let sc_install_paths = get_game_install_path(log_lines, true);

    let mut versions = HashMap::new();
    for path in &sc_install_paths {
        let normalized_path = path.trim_end_matches('\\').to_string();
        let version = get_game_channel_id(&normalized_path);

        if version != "UNKNOWN" && !versions.contains_key(&version) {
            versions.insert(
                version,
                VersionInfo {
                    path: normalized_path,
                    translated: false,
                    up_to_date: false,
                },
            );
        }
    }
    VersionPaths { versions }
}

/// Détecte et retourne toutes les versions installées de Star Citizen.
///
/// Analyse les logs du launcher RSI pour trouver les chemins d'installation.
/// Exécuté hors du thread principal pour éviter les saccades au déplacement de la fenêtre.
#[command]
pub async fn get_star_citizen_versions() -> Result<VersionPaths, String> {
    tokio::task::spawn_blocking(get_star_citizen_versions_sync)
        .await
        .map_err(|e| e.to_string())
}
