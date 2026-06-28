use crate::scripts::game_log::parse::is_game_build_log;
use crate::scripts::gamelog_archive::{
    list_archived_log_files, list_live_session_game_logs, list_recoverable_archive_sources,
    list_unarchived_logbackup_files, sync_logbackups_archive_sync, verified_archive_source_paths,
};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::AppHandle;

#[derive(Debug, Clone)]
pub struct GameLogFile {
    pub path: PathBuf,
    /// Log de session archivée (logbackups) — alimente la période « depuis le … ».
    pub is_game_build: bool,
    pub mtime_ms: u64,
    pub size: u64,
    /// Canal source (LIVE, HOTFIX) pour traçabilité.
    #[allow(dead_code)]
    pub channel: Option<String>,
}

fn file_meta(path: &Path) -> (u64, u64) {
    let meta = fs::metadata(path).ok();
    let mtime_ms = meta
        .as_ref()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let size = meta.map(|m| m.len()).unwrap_or(0);
    (mtime_ms, size)
}

fn is_log_file(path: &Path) -> bool {
    path.is_file()
        && path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case("log"))
            .unwrap_or(false)
}

fn path_dedup_key(path: &Path) -> String {
    path.to_string_lossy().to_ascii_lowercase()
}

fn try_push_file(
    files: &mut Vec<GameLogFile>,
    seen: &mut HashSet<String>,
    path: PathBuf,
    is_game_build: bool,
    channel: Option<String>,
) {
    if !is_log_file(&path) {
        return;
    }
    let key = path_dedup_key(&path);
    if !seen.insert(key) {
        return;
    }
    let (mtime_ms, size) = file_meta(&path);
    files.push(GameLogFile {
        path,
        is_game_build,
        mtime_ms,
        size,
        channel,
    });
}

/// Liste les logs de jeu pour les statistiques (corpus mergé LIVE + HOTFIX).
///
/// Sources :
/// - Archive locale Multitool (`gamelog_archive/files/`) — logbackups sauvegardés
/// - `logbackups/` du jeu non encore archivés (évite de perdre des heures avant sync)
/// - `Game.log` session courante par canal (intégration directe, non archivés)
pub fn list_game_log_files(app: &AppHandle) -> Result<Vec<GameLogFile>, String> {
    // Synchronise d'abord pour ne pas ignorer des logbackups pas encore copiés.
    let _ = sync_logbackups_archive_sync(app);

    let archived_sources = verified_archive_source_paths(app)?;
    let mut files: Vec<GameLogFile> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    for archived in list_archived_log_files(app)? {
        try_push_file(
            &mut files,
            &mut seen,
            archived.path,
            archived.is_game_build,
            Some(archived.channel),
        );
    }

    for pending in list_unarchived_logbackup_files(&archived_sources) {
        try_push_file(
            &mut files,
            &mut seen,
            pending.path,
            pending.is_game_build,
            Some(pending.channel),
        );
    }

    for recoverable in list_recoverable_archive_sources(app)? {
        eprintln!(
            "game_log: récupération playtime depuis source (copie archive absente): {}",
            recoverable.path.display()
        );
        try_push_file(
            &mut files,
            &mut seen,
            recoverable.path,
            recoverable.is_game_build,
            Some(recoverable.channel),
        );
    }

    for live in list_live_session_game_logs() {
        try_push_file(
            &mut files,
            &mut seen,
            live.path.clone(),
            false,
            Some(live.channel.clone()),
        );
    }

    // Fallback : Game Build à la racine des canaux (non encore dans logbackups)
    for (channel, install) in crate::scripts::gamelog_archive::detected_archive_channels() {
        if let Ok(entries) = fs::read_dir(&install) {
            for entry in entries.filter_map(|e| e.ok()) {
                let path = entry.path();
                if path.is_file() && is_game_build_log(&path) {
                    try_push_file(&mut files, &mut seen, path, true, Some(channel.clone()));
                }
            }
        }
    }

    files.sort_by_key(|a| a.mtime_ms);
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn path_dedup_key_is_case_insensitive() {
        let a = path_dedup_key(&PathBuf::from(r"C:\StarCitizen\logbackups\A.log"));
        let b = path_dedup_key(&PathBuf::from(r"c:\starcitizen\logbackups\a.log"));
        assert_eq!(a, b);
    }
}
