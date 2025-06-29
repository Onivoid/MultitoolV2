use serde::Serialize;
use std::env;
use std::fs;
use std::path::Path;
use tauri::command;
use tokio::process::Command;

#[derive(Serialize)]
struct FolderInfo {
    name: String,
    weight: String,
    path: String,
}

#[derive(Serialize)]
struct Output {
    folders: Vec<FolderInfo>,
}

#[command]
pub fn get_cache_informations() -> String {
    let appdata = env::var("LOCALAPPDATA").expect("Impossible de lire la variable d'environnement APPDATA");
    let star_citizen_path = format!("{}\\Star Citizen", appdata);

    let mut folders = Vec::new();

    match fs::read_dir(&star_citizen_path) {
        Ok(entries) => {
            for entry in entries {
                let entry = entry.expect("Erreur lors de la lecture de l'entrée");
                let path = entry.path();
                if path.is_dir() {
                    folders.push(get_folder_info(&path));
                }
            }
        }
        Err(e) => {
            println!("Erreur lors de l'accès au répertoire {}: {}", star_citizen_path, e);
        }
    }

    let output = Output { folders };
    let json_output = serde_json::to_string_pretty(&output).expect("Erreur lors de la sérialisation en JSON");
    json_output
}

fn get_folder_info(path: &Path) -> FolderInfo {
    let folder_name = path.file_name().unwrap().to_string_lossy().to_string();
    let folder_weight = get_weight(path);
    let folder_path = path.to_string_lossy().to_string();

    FolderInfo {
        name: folder_name,
        weight: folder_weight,
        path: folder_path,
    }
}

fn get_weight(path: &Path) -> String {
    let mut total_size = 0;

    if path.is_dir() {
        for entry in fs::read_dir(path).expect("Impossible de lire le répertoire") {
            let entry = entry.expect("Erreur lors de la lecture de l'entrée");
            let path = entry.path();
            if path.is_file() {
                total_size += fs::metadata(&path).expect("Impossible de lire les métadonnées").len();
            } else if path.is_dir() {
                total_size += get_folder_size(&path);
            }
        }
    }

    let size_in_megabytes = total_size as f64 / 1_048_576.0;
    format!("{:.0} Mo", size_in_megabytes)
}

fn get_folder_size(path: &Path) -> u64 {
    let mut total_size = 0;

    for entry in fs::read_dir(path).expect("Impossible de lire le répertoire") {
        let entry = entry.expect("Erreur lors de la lecture de l'entrée");
        let path = entry.path();
        if path.is_file() {
            total_size += fs::metadata(&path).expect("Impossible de lire les métadonnées").len();
        } else if path.is_dir() {
            total_size += get_folder_size(&path);
        }
    }

    total_size
}

#[command]
pub fn delete_folder(path: &str) -> bool {
    let path = Path::new(path);
    if path.is_dir() {
        match fs::remove_dir_all(path) {
            Ok(_) => true,
            Err(_) => false,
        }
    } else {
        match fs::remove_file(path) {
            Ok(_) => true,
            Err(_) => false,
        }
    }
}

#[command] 
pub fn clear_cache() -> bool {
    let appdata = env::var("LOCALAPPDATA").expect("Impossible de lire la variable d'environnement APPDATA");
    let star_citizen_path = format!("{}\\Star Citizen", appdata);

    if let Ok(entries) = fs::read_dir(&star_citizen_path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_dir() {
                    if let Err(_) = fs::remove_dir_all(&path) {
                        return false;
                    }
                } else {
                    if let Err(_) = fs::remove_file(&path) {
                        return false;
                    }
                }
            }
        }
        true
    } else {
        false
    }
}

#[command]
pub fn open_cache_folder() -> Result<bool, String> {
    let appdata = env::var("LOCALAPPDATA").expect("Impossible de lire la variable d'environnement APPDATA");
    let star_citizen_path = format!("{}\\Star Citizen", appdata);

        // Vérifie si le chemin existe
        if std::path::Path::new(&star_citizen_path).exists() {
            // Ouvre le dossier dans l'explorateur de fichiers
            Command::new("explorer")
                .arg(&star_citizen_path)
                .spawn()
                .map_err(|e| format!("Erreur lors de l'ouverture du dossier : {}", e))?;
            Ok(true)
        } else {
            Err(format!("Le dossier '{}' n'existe pas.", star_citizen_path))
        }
}