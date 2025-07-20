use crate::scripts::gamepath::get_star_citizen_versions;
use regex::Regex;
use reqwest::blocking::Client;
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
                        if path.is_file()
                            && path.extension().and_then(|s| s.to_str()) == Some("chf")
                        {
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

    if !base_path.exists() {
        return Err(format!(
            "Le dossier '{}' n'existe pas.",
            base_path.display()
        ));
    }

    Command::new("explorer")
        .arg(&base_path)
        .spawn()
        .map_err(|e| format!("Erreur lors de l'ouverture du dossier : {}", e))?;

    Ok(true)
}

#[command]
pub fn duplicate_character(character_path: String) -> Result<bool, String> {
    let versions = get_star_citizen_versions();
    let source = Path::new(&character_path);

    if !source.exists() {
        return Err(format!("Le fichier '{}' n'existe pas.", character_path));
    }

    let file_name = match source.file_name() {
        Some(name) => name,
        None => return Err("Nom de fichier invalide".to_string()),
    };

    // Obtenir le répertoire parent du fichier source pour comparaison
    let source_dir = match source.parent() {
        Some(dir) => dir,
        None => return Err("Impossible de déterminer le répertoire source".to_string()),
    };

    for info in versions.versions.values() {
        let dest_dir = Path::new(&info.path)
            .join("user")
            .join("client")
            .join("0")
            .join("customcharacters");

        // Vérifier si le répertoire de destination est le même que celui du fichier source
        if dest_dir == source_dir {
            continue; // Ignorer ce répertoire et passer au suivant
        }

        if !dest_dir.exists() {
            if let Err(e) = fs::create_dir_all(&dest_dir) {
                return Err(format!(
                    "Erreur lors de la création du dossier '{}': {}",
                    dest_dir.display(),
                    e
                ));
            }
        }

        let dest_file = dest_dir.join(file_name);
        if let Err(e) = fs::copy(&source, dest_file) {
            return Err(format!(
                "Erreur lors de la copie vers '{}': {}",
                dest_dir.display(),
                e
            ));
        }
    }

    Ok(true)
}

#[command]
pub fn download_character(dna_url: String, title: String) -> Result<bool, String> {
    let versions = get_star_citizen_versions();
    let first = versions
        .versions
        .values()
        .next()
        .ok_or_else(|| "Aucune version de Star Citizen trouvée".to_string())?;

    let dest_dir = Path::new(&first.path)
        .join("user")
        .join("client")
        .join("0")
        .join("customcharacters");

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| {
            format!(
                "Erreur lors de la création du dossier '{}': {}",
                dest_dir.display(),
                e
            )
        })?;
    }

    let re = Regex::new(r#"[<>:"/\\|?*]"#).unwrap();
    let sanitized = re.replace_all(&title, "_");
    let file_path = dest_dir.join(format!("{}.chf", sanitized));

    let client = Client::new();
    let response = client
        .get(&dna_url)
        .send()
        .map_err(|e| format!("Erreur lors du téléchargement: {}", e))?;
    let bytes = response
        .bytes()
        .map_err(|e| format!("Erreur lors de la lecture de la réponse: {}", e))?;

    fs::write(&file_path, &bytes)
        .map_err(|e| format!("Erreur lors de l'écriture du fichier: {}", e))?;

    duplicate_character(file_path.to_string_lossy().to_string())?;
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
