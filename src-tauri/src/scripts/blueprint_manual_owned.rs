use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use tauri::path::PathResolver;
use tauri::{command, AppHandle, Manager, Runtime};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ManualOwnedFile {
    #[serde(default)]
    entries: Vec<ManualOwnedEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManualOwnedEntry {
    blueprint_id: String,
    marked_at_ms: u64,
}

fn store_path<R: Runtime>(resolver: &PathResolver<R>) -> Result<PathBuf, String> {
    let dir = resolver
        .app_config_dir()
        .map_err(|_| "Impossible de résoudre le dossier de configuration".to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("manual_owned_blueprints.json"))
}

fn load_store<R: Runtime>(resolver: &PathResolver<R>) -> Result<ManualOwnedFile, String> {
    let path = store_path(resolver)?;
    if !path.exists() {
        return Ok(ManualOwnedFile::default());
    }
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    serde_json::from_slice(&bytes).map_err(|e| e.to_string())
}

fn save_store<R: Runtime>(
    resolver: &PathResolver<R>,
    file: &ManualOwnedFile,
) -> Result<(), String> {
    let path = store_path(resolver)?;
    let bytes = serde_json::to_vec_pretty(file).map_err(|e| e.to_string())?;
    fs::write(path, bytes).map_err(|e| e.to_string())
}

#[command]
pub fn manual_owned_blueprints_get(app: AppHandle) -> Result<Vec<String>, String> {
    let file = load_store(app.path())?;
    Ok(file
        .entries
        .iter()
        .map(|e| e.blueprint_id.clone())
        .collect())
}

#[command]
pub fn manual_owned_blueprint_toggle(
    app: AppHandle,
    blueprint_id: String,
) -> Result<Vec<String>, String> {
    let id = blueprint_id.trim().to_ascii_lowercase();
    if id.is_empty() {
        return Err("ID blueprint invalide".to_string());
    }
    let mut file = load_store(app.path())?;
    let mut set: HashSet<String> = file
        .entries
        .iter()
        .map(|e| e.blueprint_id.clone())
        .collect();
    if set.contains(&id) {
        set.remove(&id);
    } else {
        set.insert(id);
    }
    let now = chrono::Utc::now().timestamp_millis() as u64;
    let mut entries: Vec<ManualOwnedEntry> = set
        .into_iter()
        .map(|blueprint_id| ManualOwnedEntry {
            blueprint_id,
            marked_at_ms: now,
        })
        .collect();
    entries.sort_by(|a, b| a.blueprint_id.cmp(&b.blueprint_id));
    let ids: Vec<String> = entries.iter().map(|e| e.blueprint_id.clone()).collect();
    file.entries = entries;
    save_store(app.path(), &file)?;
    Ok(ids)
}
