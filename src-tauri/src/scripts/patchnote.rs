use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;
use tauri::path::PathResolver;
use tauri::Manager;
use tauri::Runtime;

#[derive(Serialize, Deserialize, Debug)]
pub struct Commit {
    message: String,
    description: Option<String>,
    date: String,
}

fn get_commit_cache_file_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let config_dir = path.app_config_dir().map_err(|_| {
        "Impossible d'obtenir le répertoire de configuration de l'application".to_string()
    })?;

    // Créer le répertoire s'il n'existe pas
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }

    // Nom du fichier de cache
    let cache_file = config_dir.join("commit_cache.json");
    Ok(cache_file)
}

fn save_commit_cache(app: tauri::AppHandle, data: &Vec<Commit>) -> Result<(), String> {
    let cache_path = get_commit_cache_file_path(app.path()).map_err(|e| e.to_string())?;

    let json_data = serde_json::to_string(data).map_err(|e| e.to_string())?;
    fs::write(cache_path, json_data).map_err(|e| e.to_string())
}

fn load_commit_cache(app: tauri::AppHandle) -> Result<Vec<Commit>, String> {
    let cache_path = get_commit_cache_file_path(app.path()).map_err(|e| e.to_string())?;

    if !cache_path.exists() {
        return Ok(Vec::new()); // Return an empty list if cache doesn't exist
    }

    let json_data = fs::read_to_string(&cache_path).map_err(|e| e.to_string())?;
    match serde_json::from_str::<Vec<Commit>>(&json_data) {
        Ok(data) => Ok(data),
        Err(e) => {
            // Log l'erreur et recréer le fichier de cache vide
            eprintln!("Cache de commits invalide: {e}");
            if let Err(remove_err) = fs::remove_file(&cache_path) {
                eprintln!("Impossible de supprimer le cache invalide: {remove_err}");
            }
            Ok(Vec::new())
        }
    }
}

#[command]
pub async fn get_latest_commits(
    app: tauri::AppHandle,
    owner: String,
    repo: String,
) -> Result<Vec<Commit>, String> {
    let url = format!("https://api.github.com/repos/{}/{}/commits", owner, repo);
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "request")
        .send()
        .await;

    match response {
        Ok(resp) if resp.status().is_success() => {
            let commits: Vec<serde_json::Value> = resp.json().await.map_err(|e| e.to_string())?;
            let keywords = ["Feat :", "Bugfix :", "Release :", "Refactoring :"];
            let commit_list: Vec<Commit> = commits
                .into_iter()
                .filter(|commit| {
                    let full_message = commit["commit"]["message"].as_str().unwrap_or("");
                    keywords
                        .iter()
                        .any(|&keyword| full_message.contains(keyword))
                })
                .map(|commit| {
                    let date_str = commit["commit"]["committer"]["date"].as_str().unwrap_or("");
                    let date = DateTime::parse_from_rfc3339(date_str)
                        .map(|dt| {
                            dt.with_timezone(&Utc)
                                .format("%Y-%m-%d | %H:%M:%S")
                                .to_string()
                        })
                        .unwrap_or_else(|_| "".to_string());
                    let full_message = commit["commit"]["message"]
                        .as_str()
                        .unwrap_or("")
                        .to_string();
                    let mut parts = full_message.splitn(2, "\n\n");
                    let message = parts.next().unwrap_or("").to_string();
                    let description = parts.next().map(|s| s.to_string());
                    Commit {
                        message,
                        description,
                        date,
                    }
                })
                .collect();
            save_commit_cache(app.clone(), &commit_list)?;
            Ok(commit_list)
        }
        Ok(resp) if resp.status() == 403 => {
            // API limitation, return cache
            load_commit_cache(app)
        }
        _ => {
            // Other error, return cache
            load_commit_cache(app)
        }
    }
}
