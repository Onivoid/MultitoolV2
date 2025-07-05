use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::command;
use tokio::process::Command;

#[derive(Serialize)]
struct LocalCharacterInfo {
    name: String,
    path: String,
}

#[derive(Serialize)]
struct Output {
    characters: Vec<LocalCharacterInfo >,
}

#[command]
pub fn get_character_informations(path: String) -> String {
    let base_path = Path::new(&path);
    let custom_characters_path = format!("{:?}\\user\\client\\0\\customcharacters", base_path);

    let mut characters = Vec::new();

    match fs::read_dir(&custom_characters_path) {
        Ok(entries) => {
            for entry in entries {
                let entry = entry.expect("Erreur lors de la lecture de l'entrée");
                let path = entry.path();
                if path.is_dir() {
                    characters.push(get_character_info(&path));
                }
            }
        }
        Err(e) => {
            println!("Erreur lors de l'accès au répertoire {}: {}", custom_characters_path, e);
        }
    }

    let output = Output { characters };
    let json_output = serde_json::to_string_pretty(&output).expect("Erreur lors de la sérialisation en JSON");
    json_output
}

fn get_character_info(path: &Path) -> LocalCharacterInfo {
    let file_name = path.file_name().unwrap().to_string_lossy().to_string();
    let file_path = path.to_string_lossy().to_string();

    LocalCharacterInfo {
        name: file_name,
        path: file_path,
    }
}

#[command]
pub fn delete_character(path: &str) -> bool {
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
pub fn open_characters_folder(path: String) -> Result<bool, String> {
    let base_path = Path::new(&path);
    let custom_characters_path = format!("{:?}\\user\\client\\0\\customcharacters", base_path);

        // Vérifie si le chemin existe
        if std::path::Path::new(&custom_characters_path).exists() {
            // Ouvre le dossier dans l'explorateur de fichiers
            Command::new("explorer")
                .arg(&custom_characters_path)
                .spawn()
                .map_err(|e| format!("Erreur lors de l'ouverture du dossier : {}", e))?;
            Ok(true)
        } else {
            Err(format!("Le dossier '{}' n'existe pas.", custom_characters_path))
        }
}