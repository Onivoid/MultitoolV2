use chrono::DateTime;
use regex::Regex;
use std::path::Path;

/// Timestamp Unix (secondes, fraction incluse) depuis une ligne `<2026-05-03T09:44:46.779Z>`.
pub fn parse_log_timestamp(line: &str) -> Option<f64> {
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r"<(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)>").unwrap());
    let caps = re.captures(line)?;
    let raw = caps.get(1)?.as_str().replace('Z', "+00:00");
    DateTime::parse_from_rfc3339(&raw)
        .ok()
        .map(|dt| dt.timestamp() as f64 + f64::from(dt.timestamp_subsec_micros()) / 1_000_000.0)
        .or_else(|| {
            chrono::NaiveDateTime::parse_from_str(&raw, "%Y-%m-%dT%H:%M:%S%.f%z")
                .ok()
                .map(|dt| dt.and_utc().timestamp() as f64)
        })
}

/// Extrait l'UUID de session depuis `[Trace] @session: 'uuid'`.
pub fn parse_session_id(line: &str) -> Option<String> {
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r#"(?i)@session:\s*'([^']+)'"#).expect("session regex"));
    let caps = re.captures(line)?;
    let id = caps.get(1)?.as_str().trim();
    if id.is_empty() {
        None
    } else {
        Some(id.to_string())
    }
}

pub fn is_system_quit_line(line: &str) -> bool {
    line.contains("SystemQuit") || line.contains("System Fast Shutdown")
}

pub fn is_game_build_log(path: &Path) -> bool {
    path.file_name()
        .and_then(|n| n.to_str())
        .map(|n| n.starts_with("Game Build") && n.ends_with(".log"))
        .unwrap_or(false)
}
