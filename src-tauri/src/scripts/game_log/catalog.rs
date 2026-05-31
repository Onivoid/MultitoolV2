use crate::scripts::game_log::parse::is_game_build_log;
use crate::scripts::gamepath::get_live_game_log_path_sync;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct GameLogFile {
    pub path: PathBuf,
    /// Log de session archivée (Game Build, logbackups) — alimente la période « depuis le … ».
    pub is_game_build: bool,
    pub mtime_ms: u64,
    pub size: u64,
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
    });
}

/// Ajoute tous les `.log` d'un répertoire (ex. `logbackups`).
fn collect_logs_in_dir(
    files: &mut Vec<GameLogFile>,
    seen: &mut HashSet<String>,
    dir: &Path,
    is_game_build: bool,
) -> Result<(), String> {
    if !dir.is_dir() {
        return Ok(());
    }
    let mut entries: Vec<PathBuf> = fs::read_dir(dir)
        .map_err(|e| format!("Impossible de lire {}: {e}", dir.display()))?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| is_log_file(p))
        .collect();
    entries.sort();
    for path in entries {
        try_push_file(files, seen, path, is_game_build);
    }
    Ok(())
}

/// Liste les logs de jeu pour les statistiques (aligné sur l'import blueprints).
///
/// Sources :
/// - `logbackups/*.log` (archives RSI, comme [`import_blueprints_from_logbackups`])
/// - `Game Build(...).log` à la racine LIVE
/// - `Game.log` (session en cours, si présent)
pub fn list_game_log_files() -> Result<Vec<GameLogFile>, String> {
    let game_log = get_live_game_log_path_sync()?;
    let install_dir = game_log
        .parent()
        .ok_or_else(|| "Répertoire LIVE introuvable".to_string())?;

    let mut files: Vec<GameLogFile> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    let logbackups = install_dir.join("logbackups");
    collect_logs_in_dir(&mut files, &mut seen, &logbackups, true)?;

    if let Ok(entries) = fs::read_dir(install_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() && is_game_build_log(&path) {
                try_push_file(&mut files, &mut seen, path, true);
            }
        }
    }

    if game_log.is_file() {
        try_push_file(&mut files, &mut seen, game_log, false);
    }

    files.sort_by(|a, b| a.mtime_ms.cmp(&b.mtime_ms));
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
