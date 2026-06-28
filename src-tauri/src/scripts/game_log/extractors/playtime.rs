use crate::scripts::game_log::extractors::{FileContext, GameLogStatExtractor, LineContext};
use crate::scripts::game_log::parse::{is_system_quit_line, parse_log_timestamp, parse_session_id};
use crate::scripts::game_log::session::{
    merge_session_interval, total_playtime_seconds, GameSession,
};
use crate::scripts::game_log::snapshot::{
    iso_from_timestamp, period_label_from_iso, GameStatsSnapshot,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PlaytimeCacheState {
    sessions: HashMap<String, GameSession>,
    oldest_game_build_start_ts: Option<f64>,
    /// Dernier `@session` connu par fichier (scan incrémental du Game.log courant).
    #[serde(default)]
    file_session_ids: HashMap<String, String>,
}

#[derive(Debug, Default)]
struct FileScan {
    session_id: Option<String>,
    first_ts: Option<f64>,
    last_ts: Option<f64>,
    saw_quit: bool,
}

pub struct PlaytimeExtractor {
    sessions: HashMap<String, GameSession>,
    oldest_game_build_start_ts: Option<f64>,
    file_session_ids: HashMap<String, String>,
    current_file: FileScan,
}

impl PlaytimeExtractor {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            oldest_game_build_start_ts: None,
            file_session_ids: HashMap::new(),
            current_file: FileScan::default(),
        }
    }

    fn flush_current_file(&mut self, path: &Path, ctx: &FileContext) {
        let (Some(start), Some(end)) = (self.current_file.first_ts, self.current_file.last_ts)
        else {
            self.current_file = FileScan::default();
            return;
        };

        let path_key = ctx.file_path.clone();
        let source = path
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_else(|| path.display().to_string());

        if let Some(id) = &self.current_file.session_id {
            self.file_session_ids
                .insert(path_key.clone(), id.clone());
        }

        let fallback_id = format!("file:{path_key}");
        let session_id = self
            .current_file
            .session_id
            .clone()
            .or_else(|| self.file_session_ids.get(&path_key).cloned())
            .unwrap_or(fallback_id.clone());

        if session_id != fallback_id {
            self.sessions.remove(&fallback_id);
        }

        merge_session_interval(&mut self.sessions, session_id, start, end, source);

        if ctx.is_game_build {
            self.oldest_game_build_start_ts = Some(
                self.oldest_game_build_start_ts
                    .map(|o| o.min(start))
                    .unwrap_or(start),
            );
        }

        self.current_file = FileScan::default();
    }
}

impl GameLogStatExtractor for PlaytimeExtractor {
    fn id(&self) -> &'static str {
        "playtime"
    }

    fn reset(&mut self) {
        self.sessions.clear();
        self.oldest_game_build_start_ts = None;
        self.file_session_ids.clear();
        self.current_file = FileScan::default();
    }

    fn on_line(&mut self, line: &str, ctx: &LineContext) {
        if let Some(id) = parse_session_id(line) {
            self.current_file.session_id = Some(id);
        }

        let ts = ctx.line_ts.or_else(|| parse_log_timestamp(line));

        if let Some(ts) = ts {
            self.current_file.first_ts =
                Some(self.current_file.first_ts.map(|t| t.min(ts)).unwrap_or(ts));
            self.current_file.last_ts =
                Some(self.current_file.last_ts.map(|t| t.max(ts)).unwrap_or(ts));
        }

        if is_system_quit_line(line) {
            self.current_file.saw_quit = true;
        }
    }

    fn on_file_end(&mut self, path: &Path, ctx: &FileContext) {
        self.flush_current_file(path, ctx);
    }

    fn contribute(&self, out: &mut GameStatsSnapshot) {
        let oldest_iso = self.oldest_game_build_start_ts.map(iso_from_timestamp);
        out.period.oldest_backup_start_iso = oldest_iso.clone();
        out.period.label = period_label_from_iso(oldest_iso.as_deref());
        out.playtime.total_seconds = total_playtime_seconds(&self.sessions);
        out.playtime.session_count = self.sessions.len();
    }

    fn merge_cached(&mut self, cached: &Value) {
        if let Ok(state) = serde_json::from_value::<PlaytimeCacheState>(cached.clone()) {
            self.sessions = state.sessions;
            self.oldest_game_build_start_ts = state.oldest_game_build_start_ts;
            self.file_session_ids = state.file_session_ids;
        }
    }

    fn export_cache(&self) -> Value {
        serde_json::to_value(PlaytimeCacheState {
            sessions: self.sessions.clone(),
            oldest_game_build_start_ts: self.oldest_game_build_start_ts,
            file_session_ids: self.file_session_ids.clone(),
        })
        .unwrap_or(Value::Null)
    }
}
