//! Archive locale des `logbackups/` Star Citizen (LIVE + HOTFIX).
//! Le `Game.log` de session courante n'est pas copié — intégration directe via le watcher.

use crate::scripts::gamepath::get_star_citizen_versions_sync;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use tauri::path::PathResolver;
use tauri::{command, AppHandle, Manager, Runtime};

const MANIFEST_SCHEMA_VERSION: u32 = 1;
const ARCHIVE_CHANNELS: &[&str] = &["LIVE", "HOTFIX"];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GamelogArchiveConfig {
    /// Supprimer les fichiers source dans logbackups/ du jeu après vérification réussie.
    #[serde(default = "default_delete_after_verified")]
    pub delete_after_verified: bool,
}

fn default_delete_after_verified() -> bool {
    true
}

impl Default for GamelogArchiveConfig {
    fn default() -> Self {
        Self {
            delete_after_verified: default_delete_after_verified(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveManifestEntry {
    pub id: String,
    pub channel: String,
    pub source_path: String,
    pub original_name: String,
    pub archive_name: String,
    pub sha256: String,
    pub size: u64,
    pub source_mtime_ms: u64,
    pub archived_at_ms: u64,
    pub verified: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verify_error: Option<String>,
    pub deleted_from_game: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveManifest {
    pub schema_version: u32,
    pub entries: Vec<ArchiveManifestEntry>,
}

impl Default for ArchiveManifest {
    fn default() -> Self {
        Self {
            schema_version: MANIFEST_SCHEMA_VERSION,
            entries: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GamelogArchiveSyncResult {
    pub archived: u32,
    pub deleted_from_game: u32,
    pub pending_verification: u32,
    pub skipped_already_archived: u32,
    pub bytes_freed: u64,
    pub channels_scanned: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GamelogArchiveStatus {
    pub total_archived_files: u32,
    pub total_bytes_archived: u64,
    pub verified_count: u32,
    pub pending_count: u32,
    pub deleted_from_game_count: u32,
    pub channels: Vec<String>,
    pub archive_directory: String,
}

#[derive(Debug, Clone)]
pub struct ArchivedLogFile {
    pub path: PathBuf,
    pub channel: String,
    pub is_game_build: bool,
    pub mtime_ms: u64,
    #[allow(dead_code)]
    pub size: u64,
}

#[derive(Debug, Clone)]
pub struct LiveGameLogFile {
    pub path: PathBuf,
    pub channel: String,
    #[allow(dead_code)]
    pub mtime_ms: u64,
    #[allow(dead_code)]
    pub size: u64,
}

fn ensure_config_dir(resolver: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let dir = resolver
        .app_config_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de configuration".to_string())?;
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir)
}

fn ensure_archive_dir(resolver: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let dir = resolver
        .app_data_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de données".to_string())?
        .join("gamelog_archive")
        .join("files");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir.parent().unwrap().to_path_buf())
}

fn archive_files_dir(root: &Path) -> PathBuf {
    root.join("files")
}

fn config_path(resolver: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    Ok(ensure_config_dir(resolver)?.join("gamelog_archive.json"))
}

fn manifest_path(root: &Path) -> PathBuf {
    root.join("manifest.json")
}

pub fn load_archive_config_sync(app: &AppHandle) -> Result<GamelogArchiveConfig, String> {
    let path = config_path(app.path())?;
    if !path.exists() {
        return Ok(GamelogArchiveConfig::default());
    }
    let json = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

pub fn save_archive_config_sync(
    app: &AppHandle,
    config: &GamelogArchiveConfig,
) -> Result<(), String> {
    let path = config_path(app.path())?;
    let json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn load_manifest(root: &Path) -> Result<ArchiveManifest, String> {
    let path = manifest_path(root);
    if !path.exists() {
        return Ok(ArchiveManifest::default());
    }
    let json = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

fn save_manifest(root: &Path, manifest: &ArchiveManifest) -> Result<(), String> {
    let path = manifest_path(root);
    let json = serde_json::to_string_pretty(manifest).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn file_mtime_ms(path: &Path) -> u64 {
    fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 65536];
    loop {
        let n = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn sanitize_archive_name(channel: &str, original: &str) -> String {
    let base = original
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect::<String>();
    format!("{channel}__logbackups__{base}")
}

fn is_log_file(path: &Path) -> bool {
    path.is_file()
        && path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case("log"))
            .unwrap_or(false)
}

/// Canaux LIVE et HOTFIX détectés via le launcher RSI.
pub fn detected_archive_channels() -> Vec<(String, PathBuf)> {
    let versions = get_star_citizen_versions_sync();
    let mut out = Vec::new();
    for channel_key in ARCHIVE_CHANNELS {
        if let Some(info) = versions.versions.get(*channel_key) {
            out.push((channel_key.to_string(), PathBuf::from(&info.path)));
            continue;
        }
        // Recherche insensible à la casse
        for (key, info) in &versions.versions {
            if key.eq_ignore_ascii_case(channel_key) {
                out.push((channel_key.to_string(), PathBuf::from(&info.path)));
                break;
            }
        }
    }
    out
}

/// Chemins `Game.log` de session courante pour LIVE et HOTFIX (intégration directe).
pub fn list_live_session_game_logs() -> Vec<LiveGameLogFile> {
    let mut out = Vec::new();
    for (channel, install) in detected_archive_channels() {
        let path = install.join("Game.log");
        if path.is_file() {
            let (mtime_ms, size) = {
                let meta = fs::metadata(&path).ok();
                (file_mtime_ms(&path), meta.map(|m| m.len()).unwrap_or(0))
            };
            out.push(LiveGameLogFile {
                path,
                channel,
                mtime_ms,
                size,
            });
        }
    }
    out
}

/// Fichiers archivés (pool mergé LIVE + HOTFIX).
pub fn list_archived_log_files(app: &AppHandle) -> Result<Vec<ArchivedLogFile>, String> {
    let root = ensure_archive_dir(app.path())?;
    let manifest = load_manifest(&root)?;
    let files_dir = archive_files_dir(&root);
    let mut out = Vec::new();
    for entry in &manifest.entries {
        if !entry.verified {
            continue;
        }
        let path = files_dir.join(&entry.archive_name);
        if path.is_file() {
            out.push(ArchivedLogFile {
                path,
                channel: entry.channel.clone(),
                is_game_build: true,
                mtime_ms: entry.source_mtime_ms,
                size: entry.size,
            });
        }
    }
    out.sort_by_key(|f| f.mtime_ms);
    Ok(out)
}

/// Chemins source (`logbackups/…`) dont une copie vérifiée existe réellement sur disque.
pub fn verified_archive_source_paths(app: &AppHandle) -> Result<HashSet<String>, String> {
    let root = ensure_archive_dir(app.path())?;
    let manifest = load_manifest(&root)?;
    let files_dir = archive_files_dir(&root);
    Ok(manifest
        .entries
        .iter()
        .filter(|e| e.verified && files_dir.join(&e.archive_name).is_file())
        .map(|e| e.source_path.to_ascii_lowercase())
        .collect())
}

/// Fichiers source encore présents alors que la copie archive a disparu (récupération playtime).
pub fn list_recoverable_archive_sources(app: &AppHandle) -> Result<Vec<ArchivedLogFile>, String> {
    let root = ensure_archive_dir(app.path())?;
    let manifest = load_manifest(&root)?;
    let files_dir = archive_files_dir(&root);
    let mut out = Vec::new();
    for entry in &manifest.entries {
        if !entry.verified || files_dir.join(&entry.archive_name).is_file() {
            continue;
        }
        let source = PathBuf::from(&entry.source_path);
        if !is_log_file(&source) {
            continue;
        }
        out.push(ArchivedLogFile {
            path: source,
            channel: entry.channel.clone(),
            is_game_build: true,
            mtime_ms: entry.source_mtime_ms,
            size: fs::metadata(&entry.source_path)
                .map(|m| m.len())
                .unwrap_or(entry.size),
        });
    }
    out.sort_by_key(|f| f.mtime_ms);
    Ok(out)
}

/// Fichiers encore présents dans `logbackups/` du jeu mais pas encore archivés localement.
pub fn list_unarchived_logbackup_files(archived_sources: &HashSet<String>) -> Vec<ArchivedLogFile> {
    let mut out = Vec::new();
    for (channel, install) in detected_archive_channels() {
        let logbackups = install.join("logbackups");
        if !logbackups.is_dir() {
            continue;
        }

        let mut sources: Vec<PathBuf> = fs::read_dir(&logbackups)
            .ok()
            .into_iter()
            .flatten()
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| is_log_file(p))
            .collect();
        sources.sort();

        for source in sources {
            let source_str = source.to_string_lossy().into_owned();
            if archived_sources.contains(&source_str.to_ascii_lowercase()) {
                continue;
            }
            let mtime_ms = file_mtime_ms(&source);
            let size = fs::metadata(&source).map(|m| m.len()).unwrap_or(0);
            out.push(ArchivedLogFile {
                path: source,
                channel: channel.clone(),
                is_game_build: true,
                mtime_ms,
                size,
            });
        }
    }
    out.sort_by_key(|f| f.mtime_ms);
    out
}

fn find_manifest_entry<'a>(
    manifest: &'a ArchiveManifest,
    channel: &str,
    source_path: &str,
) -> Option<&'a ArchiveManifestEntry> {
    manifest.entries.iter().find(|e| {
        e.channel.eq_ignore_ascii_case(channel)
            && e.source_path.eq_ignore_ascii_case(source_path)
            && e.verified
    })
}

pub fn sync_logbackups_archive_sync(app: &AppHandle) -> Result<GamelogArchiveSyncResult, String> {
    let config = load_archive_config_sync(app)?;
    let root = ensure_archive_dir(app.path())?;
    let files_dir = archive_files_dir(&root);
    if !files_dir.exists() {
        fs::create_dir_all(&files_dir).map_err(|e| e.to_string())?;
    }

    let mut manifest = load_manifest(&root)?;
    let mut result = GamelogArchiveSyncResult {
        archived: 0,
        deleted_from_game: 0,
        pending_verification: 0,
        skipped_already_archived: 0,
        bytes_freed: 0,
        channels_scanned: Vec::new(),
    };

    let channels = detected_archive_channels();
    for (channel, install_path) in channels {
        result.channels_scanned.push(channel.clone());
        let logbackups = install_path.join("logbackups");
        if !logbackups.is_dir() {
            continue;
        }

        let mut sources: Vec<PathBuf> = fs::read_dir(&logbackups)
            .map_err(|e| e.to_string())?
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| is_log_file(p))
            .collect();
        sources.sort();

        for source in sources {
            let source_str = source.to_string_lossy().into_owned();
            if find_manifest_entry(&manifest, &channel, &source_str).is_some() {
                result.skipped_already_archived += 1;
                continue;
            }

            let original_name = source
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_else(|| "unknown.log".to_string());
            let archive_name = sanitize_archive_name(&channel, &original_name);
            let dest = files_dir.join(&archive_name);

            let source_size = fs::metadata(&source).map(|m| m.len()).unwrap_or(0);
            let source_hash = match sha256_file(&source) {
                Ok(h) => h,
                Err(e) => {
                    manifest.entries.push(ArchiveManifestEntry {
                        id: format!("{channel}__{original_name}"),
                        channel: channel.clone(),
                        source_path: source_str,
                        original_name: original_name.clone(),
                        archive_name: archive_name.clone(),
                        sha256: String::new(),
                        size: source_size,
                        source_mtime_ms: file_mtime_ms(&source),
                        archived_at_ms: chrono::Utc::now().timestamp_millis() as u64,
                        verified: false,
                        verify_error: Some(e),
                        deleted_from_game: false,
                    });
                    result.pending_verification += 1;
                    continue;
                }
            };

            if let Err(e) = fs::copy(&source, &dest) {
                manifest.entries.push(ArchiveManifestEntry {
                    id: format!("{channel}__{original_name}"),
                    channel: channel.clone(),
                    source_path: source_str,
                    original_name: original_name.clone(),
                    archive_name: archive_name.clone(),
                    sha256: source_hash,
                    size: source_size,
                    source_mtime_ms: file_mtime_ms(&source),
                    archived_at_ms: chrono::Utc::now().timestamp_millis() as u64,
                    verified: false,
                    verify_error: Some(e.to_string()),
                    deleted_from_game: false,
                });
                result.pending_verification += 1;
                continue;
            }

            let dest_size = fs::metadata(&dest).map(|m| m.len()).unwrap_or(0);
            let dest_hash = sha256_file(&dest)?;

            let verified = source_size == dest_size && source_hash == dest_hash;
            let verify_error = if verified {
                None
            } else {
                Some(format!(
                    "hash/size mismatch (src={source_size}/{source_hash}, dest={dest_size}/{dest_hash})"
                ))
            };

            let mut deleted_from_game = false;
            if verified && config.delete_after_verified && fs::remove_file(&source).is_ok() {
                deleted_from_game = true;
                result.deleted_from_game += 1;
                result.bytes_freed += source_size;
            }

            if verified {
                result.archived += 1;
            } else {
                result.pending_verification += 1;
                let _ = fs::remove_file(&dest);
            }

            manifest.entries.push(ArchiveManifestEntry {
                id: format!("{channel}__{original_name}"),
                channel: channel.clone(),
                source_path: source_str,
                original_name,
                archive_name,
                sha256: source_hash,
                size: source_size,
                source_mtime_ms: file_mtime_ms(&source),
                archived_at_ms: chrono::Utc::now().timestamp_millis() as u64,
                verified,
                verify_error,
                deleted_from_game,
            });
        }
    }

    manifest.schema_version = MANIFEST_SCHEMA_VERSION;
    save_manifest(&root, &manifest)?;
    Ok(result)
}

pub fn get_archive_status_sync(app: &AppHandle) -> Result<GamelogArchiveStatus, String> {
    let root = ensure_archive_dir(app.path())?;
    let manifest = load_manifest(&root)?;
    let channels: Vec<String> = manifest
        .entries
        .iter()
        .map(|e| e.channel.clone())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    let mut channels = channels;
    channels.sort();

    Ok(GamelogArchiveStatus {
        total_archived_files: manifest.entries.iter().filter(|e| e.verified).count() as u32,
        total_bytes_archived: manifest
            .entries
            .iter()
            .filter(|e| e.verified)
            .map(|e| e.size)
            .sum(),
        verified_count: manifest.entries.iter().filter(|e| e.verified).count() as u32,
        pending_count: manifest.entries.iter().filter(|e| !e.verified).count() as u32,
        deleted_from_game_count: manifest
            .entries
            .iter()
            .filter(|e| e.deleted_from_game)
            .count() as u32,
        channels,
        archive_directory: root.display().to_string(),
    })
}

#[command]
pub fn load_gamelog_archive_config(app: AppHandle) -> Result<GamelogArchiveConfig, String> {
    load_archive_config_sync(&app)
}

#[command]
pub fn save_gamelog_archive_config(
    app: AppHandle,
    config: GamelogArchiveConfig,
) -> Result<(), String> {
    save_archive_config_sync(&app, &config)
}

#[command]
pub async fn sync_gamelog_archive(app: AppHandle) -> Result<GamelogArchiveSyncResult, String> {
    tokio::task::spawn_blocking(move || sync_logbackups_archive_sync(&app))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn get_gamelog_archive_status(app: AppHandle) -> Result<GamelogArchiveStatus, String> {
    tokio::task::spawn_blocking(move || get_archive_status_sync(&app))
        .await
        .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_archive_name_replaces_spaces() {
        let name = sanitize_archive_name("LIVE", "Game Build 2025.log");
        assert!(name.starts_with("LIVE__logbackups__"));
        assert!(!name.contains(' '));
    }
}
