use crate::scripts::game_log::snapshot::{GameStatsSnapshot, SNAPSHOT_SCHEMA_VERSION};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::path::PathResolver;
use tauri::Runtime;

pub const CACHE_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileScanState {
    pub mtime_ms: u64,
    pub size: u64,
    pub last_processed_offset: u64,
    pub last_processed_ts: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsCacheFile {
    pub schema_version: u32,
    pub snapshot: GameStatsSnapshot,
    pub extractor_state: HashMap<String, Value>,
    pub file_state: HashMap<String, FileScanState>,
    pub last_scanned_newest_mtime_ms: u64,
}

impl Default for GameStatsCacheFile {
    fn default() -> Self {
        Self {
            schema_version: CACHE_SCHEMA_VERSION,
            snapshot: GameStatsSnapshot::default(),
            extractor_state: HashMap::new(),
            file_state: HashMap::new(),
            last_scanned_newest_mtime_ms: 0,
        }
    }
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

pub fn cache_file_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    Ok(ensure_config_dir(path)?.join("game_stats_cache.json"))
}

pub fn load_cache(path: &PathResolver<impl Runtime>) -> Result<Option<GameStatsCacheFile>, String> {
    let file = cache_file_path(path)?;
    if !file.exists() {
        return Ok(None);
    }
    let data = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    let cache: GameStatsCacheFile = match serde_json::from_str(&data) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("game_stats_cache.json illisible, ignoré: {e}");
            return Ok(None);
        }
    };
    if cache.schema_version != CACHE_SCHEMA_VERSION {
        return Ok(None);
    }
    if cache.snapshot.schema_version != SNAPSHOT_SCHEMA_VERSION {
        return Ok(None);
    }
    Ok(Some(cache))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserialize_v1_snapshot_without_new_fields() {
        let json = r#"{
            "schemaVersion": 1,
            "snapshot": {
                "schemaVersion": 1,
                "computedAt": 1,
                "period": { "oldestBackupStartIso": null, "label": "test" },
                "playtime": { "totalSeconds": 100.0, "sessionCount": 1 }
            },
            "extractorState": {},
            "fileState": {},
            "lastScannedNewestMtimeMs": 0
        }"#;
        let cache: GameStatsCacheFile = serde_json::from_str(json).expect("parse v1 cache");
        assert_eq!(cache.snapshot.missions.completed, 0);
        assert_eq!(cache.snapshot.schema_version, 1);
    }
}

pub fn save_cache(
    path: &PathResolver<impl Runtime>,
    cache: &GameStatsCacheFile,
) -> Result<(), String> {
    let file = cache_file_path(path)?;
    let json = serde_json::to_string_pretty(cache).map_err(|e| e.to_string())?;
    fs::write(file, json).map_err(|e| e.to_string())
}
