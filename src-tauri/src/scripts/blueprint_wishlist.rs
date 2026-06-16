use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use tauri::path::PathResolver;
use tauri::{command, AppHandle, Manager, Runtime};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct WishlistFile {
    #[serde(default)]
    blueprint_ids: Vec<String>,
}

fn wishlist_path<R: Runtime>(resolver: &PathResolver<R>) -> Result<PathBuf, String> {
    let dir = resolver
        .app_config_dir()
        .map_err(|_| "Impossible de résoudre le dossier de configuration".to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("blueprint_wishlist.json"))
}

fn load_wishlist<R: Runtime>(resolver: &PathResolver<R>) -> Result<WishlistFile, String> {
    let path = wishlist_path(resolver)?;
    if !path.exists() {
        return Ok(WishlistFile::default());
    }
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    serde_json::from_slice(&bytes).map_err(|e| e.to_string())
}

fn save_wishlist<R: Runtime>(resolver: &PathResolver<R>, file: &WishlistFile) -> Result<(), String> {
    let path = wishlist_path(resolver)?;
    let bytes = serde_json::to_vec_pretty(file).map_err(|e| e.to_string())?;
    fs::write(path, bytes).map_err(|e| e.to_string())
}

#[command]
pub fn blueprint_wishlist_get(app: AppHandle) -> Result<Vec<String>, String> {
    let file = load_wishlist(app.path())?;
    Ok(file.blueprint_ids)
}

#[command]
pub fn blueprint_wishlist_toggle(app: AppHandle, blueprint_id: String) -> Result<Vec<String>, String> {
    let id = blueprint_id.trim().to_ascii_lowercase();
    if id.is_empty() {
        return Err("ID blueprint invalide".to_string());
    }
    let mut file = load_wishlist(app.path())?;
    let mut set: HashSet<String> = file.blueprint_ids.into_iter().collect();
    if set.contains(&id) {
        set.remove(&id);
    } else {
        set.insert(id);
    }
    let mut ids: Vec<_> = set.into_iter().collect();
    ids.sort();
    file.blueprint_ids = ids.clone();
    save_wishlist(app.path(), &file)?;
    Ok(ids)
}

#[command]
pub fn blueprint_wishlist_prune(
    app: AppHandle,
    owned_blueprint_ids: Vec<String>,
) -> Result<Vec<String>, String> {
    let owned: HashSet<String> = owned_blueprint_ids
        .into_iter()
        .map(|s| s.trim().to_ascii_lowercase())
        .filter(|s| !s.is_empty())
        .collect();
    let mut file = load_wishlist(app.path())?;
    file.blueprint_ids.retain(|id| !owned.contains(id));
    let ids = file.blueprint_ids.clone();
    save_wishlist(app.path(), &file)?;
    Ok(ids)
}
