use std::env;
use std::fs;
use std::path::Path;
use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
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
    if !path.is_empty() && !sc_install_paths.contains(&path.to_string()) {
        if !check_exists {
            sc_install_paths.push(path.to_string());
        } else {
            let exe_path = format!("{}\\Bin64\\StarCitizen.exe", path);
            let data_p4k_path = format!("{}\\Data.p4k", path);
            if Path::new(&exe_path).exists() && Path::new(&data_p4k_path).exists() {
                sc_install_paths.push(path.to_string());
            }
        }
    }
}

fn get_game_install_path(
    list_data: Vec<String>,
    check_exists: bool,
) -> Vec<String> {
    let mut sc_install_paths = Vec::new();

    // Expression régulière pour détecter les chemins avec des versions dynamiques
    let pattern = r"([a-zA-Z]:\\\\(?:[^\\\\]+\\\\)*StarCitizen\\\\[A-Za-z0-9_\\.\\@\\-]+)";
    let re = Regex::new(pattern).unwrap();

    for line in list_data.iter().rev() {
        for cap in re.captures_iter(line) {
            if let Some(matched_path) = cap.get(0) {
                check_and_add_path(
                    matched_path.as_str(),
                    check_exists,
                    &mut sc_install_paths,
                );
            }
        }
    }

    sc_install_paths
}

fn get_game_channel_id(install_path: &str) -> String {
    // Expression régulière pour capturer la version à la fin du chemin après "StarCitizen\\"
    let re = Regex::new(r"StarCitizen\\([A-Za-z0-9_\\.\\@-]+)$").unwrap();
    if let Some(cap) = re.captures(install_path) {
        if let Some(version) = cap.get(1) {
            return version.as_str().to_string();
        }
    }
    "UNKNOWN".to_string()
}
#[derive(Serialize)]
pub struct VersionInfo {
    pub path: String,
    pub translated: bool,
    pub up_to_date: bool,
}

#[derive(Serialize)]
pub struct VersionPaths {
    pub versions: HashMap<String, VersionInfo>,
}

#[command]
pub fn get_star_citizen_versions() -> VersionPaths {
    let log_lines = get_launcher_log_list();
    let sc_install_paths = get_game_install_path(log_lines, true);

    let mut versions = HashMap::new();
    for path in &sc_install_paths {
        let version = get_game_channel_id(path);
        if version != "UNKNOWN" && !versions.contains_key(&version) {
            versions.insert(version, VersionInfo {
                path: path.clone(),
                translated: false,
                up_to_date: false,
            });
        }
    }
    VersionPaths { versions }
}