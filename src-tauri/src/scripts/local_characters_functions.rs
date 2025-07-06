use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::command;
use tokio::process::Command;

#[derive(Serialize)]
pub struct LocalCharacterInfo {
    pub name: String,
    pub path: String,
    pub version: String,
}

#[derive(Serialize)]
struct Output {
    characters: Vec<LocalCharacterInfo>,
}

#[command]
pub fn get_character_informations(path: String) -> Result<String, String> {
    let base_path = Path::new(&path);
    let custom_characters_path = base_path
        .join("user")
        .join("client")
        .join("0")
        .join("customcharacters");

    let mut characters = Vec::new();

    match fs::read_dir(&custom_characters_path) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let path = entry.path();
                        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("chf") {
                            if let Some(file_name) = path.file_stem().and_then(|s| s.to_str()) {
                                let version = extract_version_from_path(&path);
                                
                                let character_info = LocalCharacterInfo {
                                    name: file_name.to_string(),
                                    path: path.to_string_lossy().to_string(),
                                    version,
                                };
                                characters.push(character_info);
                            }
                        }
                    }
                    Err(e) => {
                        println!("Erreur lors de la lecture de l'entrée: {}", e);
                    }
                }
            }
        }
        Err(e) => {
            return Err(format!(
                "Erreur lors de l'accès au répertoire {}: {}",
                custom_characters_path.display(),
                e
            ));
        }
    }

    let output = Output { characters };
    serde_json::to_string_pretty(&output)
        .map_err(|e| format!("Erreur lors de la sérialisation JSON: {}", e))
}

#[command]
pub fn delete_character(path: &str) -> bool {
    let path = Path::new(path);
    let result = if path.is_file() {
        fs::remove_file(path)
    } else {
        return false; // On ne supprime que les fichiers de personnages
    };
    
    match result {
        Ok(_) => true,
        Err(e) => {
            println!("Erreur lors de la suppression de {}: {}", path.display(), e);
            false
        }
    }
}

#[command]
pub async fn open_characters_folder(path: String) -> Result<bool, String> {
    let base_path = Path::new(&path);
    let custom_characters_path = base_path
        .join("user")
        .join("client")
        .join("0")
        .join("customcharacters");

    if !custom_characters_path.exists() {
        return Err(format!("Le dossier '{}' n'existe pas.", custom_characters_path.display()));
    }

    Command::new("explorer")
        .arg(&custom_characters_path)
        .spawn()
        .map_err(|e| format!("Erreur lors de l'ouverture du dossier : {}", e))?;
    
    Ok(true)
}

fn extract_version_from_path(path: &Path) -> String {
    let path_str = path.to_string_lossy();
    let components: Vec<&str> = path_str.split('\\').collect();
    
    for (i, component) in components.iter().enumerate() {
        if component == &"StarCitizen" && i + 1 < components.len() {
            return components[i + 1].to_string();
        }
    }
    
    "Unknown".to_string()
}
