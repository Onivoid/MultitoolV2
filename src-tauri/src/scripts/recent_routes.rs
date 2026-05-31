use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::path::PathResolver;
use tauri::{command, AppHandle, Manager, Runtime};

/// Garder aligné avec `featuresRoutes` dans `navigation.config.tsx`.
pub const HOME_ELIGIBLE_ROUTES: &[&str] = &[
    "/traduction",
    "/cache",
    "/presets-local",
    "/presets-remote",
    "/blueprints",
    "/ships3d",
];

pub fn is_home_eligible_route(path: &str) -> bool {
    HOME_ELIGIBLE_ROUTES.contains(&path)
}

const SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RouteVisit {
    count: u32,
    last_visit: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecentRoutesStore {
    schema_version: u32,
    routes: HashMap<String, RouteVisit>,
}

impl Default for RecentRoutesStore {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA_VERSION,
            routes: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TopRouteEntry {
    pub path: String,
    pub count: u32,
    pub last_visit: i64,
}

fn ensure_config_dir(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let config_dir = path
        .app_config_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de configuration".to_string())?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    Ok(config_dir)
}

fn store_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    Ok(ensure_config_dir(path)?.join("recent_routes.json"))
}

fn load_store(path: &PathResolver<impl Runtime>) -> Result<RecentRoutesStore, String> {
    let file = store_path(path)?;
    if !file.exists() {
        return Ok(RecentRoutesStore::default());
    }
    let data = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

fn save_store(path: &PathResolver<impl Runtime>, store: &RecentRoutesStore) -> Result<(), String> {
    let file = store_path(path)?;
    let json = serde_json::to_string(store).map_err(|e| e.to_string())?;
    fs::write(file, json).map_err(|e| e.to_string())
}

#[command]
pub fn record_page_visit(app: AppHandle, path: String) -> Result<(), String> {
    if !is_home_eligible_route(&path) {
        return Ok(());
    }

    let now = chrono::Utc::now().timestamp();
    let resolver = app.path();
    let mut store = load_store(resolver)?;
    let entry = store.routes.entry(path).or_insert(RouteVisit {
        count: 0,
        last_visit: now,
    });
    entry.count = entry.count.saturating_add(1);
    entry.last_visit = now;
    save_store(resolver, &store)
}

#[command]
pub fn get_top_routes(app: AppHandle, limit: Option<u32>) -> Result<Vec<TopRouteEntry>, String> {
    let limit = limit.unwrap_or(3) as usize;
    let store = load_store(app.path())?;

    let mut entries: Vec<TopRouteEntry> = store
        .routes
        .into_iter()
        .filter(|(path, _)| is_home_eligible_route(path))
        .map(|(path, visit)| TopRouteEntry {
            path,
            count: visit.count,
            last_visit: visit.last_visit,
        })
        .collect();

    entries.sort_by(|a, b| {
        b.count
            .cmp(&a.count)
            .then_with(|| b.last_visit.cmp(&a.last_visit))
    });
    entries.truncate(limit);
    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eligible_routes_match_frontend_features() {
        let expected = [
            "/traduction",
            "/cache",
            "/presets-local",
            "/presets-remote",
            "/blueprints",
            "/ships3d",
        ];
        assert_eq!(HOME_ELIGIBLE_ROUTES, expected);
    }
}
