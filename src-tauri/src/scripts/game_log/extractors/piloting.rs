use crate::scripts::game_log::extractors::{FileContext, GameLogStatExtractor, LineContext};
use crate::scripts::game_log::parse::parse_log_timestamp;
use crate::scripts::game_log::patterns::{
    merge_time_intervals, parse_piloting_grant, parse_piloting_release,
    parse_piloting_starmap_no_route, total_seconds_from_intervals,
};
use crate::scripts::game_log::snapshot::{GameStatsPiloting, GameStatsSnapshot};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct PilotingKey {
    ship_name: String,
    ship_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct PilotingFileState {
    open: HashMap<PilotingKey, f64>,
    starmap_since_release: HashMap<String, (f64, String)>,
    last_release: HashMap<String, f64>,
    last_ts: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct PilotingCacheState {
    intervals: Vec<(f64, f64)>,
    open_by_file: HashMap<String, PilotingFileState>,
}

#[derive(Default)]
pub struct PilotingExtractor {
    intervals: Vec<(f64, f64)>,
    open_by_file: HashMap<String, PilotingFileState>,
    current_file: Option<String>,
}

impl PilotingExtractor {
    pub fn new() -> Self {
        Self::default()
    }

    fn file_state_mut(&mut self, file_path: &str) -> &mut PilotingFileState {
        if self.current_file.as_deref() != Some(file_path) {
            self.current_file = Some(file_path.to_string());
        }
        self.open_by_file
            .entry(file_path.to_string())
            .or_default()
    }

    fn push_interval(&mut self, start: f64, end: f64) {
        if end > start {
            self.intervals.push((start, end));
        }
    }

    fn handle_grant(&mut self, file_path: &str, ship_name: String, ship_id: String, ts: f64) {
        let file = self.file_state_mut(file_path);
        file.last_ts = Some(file.last_ts.map(|t| t.max(ts)).unwrap_or(ts));
        let key = PilotingKey {
            ship_name,
            ship_id,
        };
        file.open.insert(key, ts);
    }

    fn handle_release(&mut self, file_path: &str, ship_name: String, ship_id: String, ts: f64) {
        let key = PilotingKey {
            ship_name,
            ship_id: ship_id.clone(),
        };
        let interval_start = {
            let file = self.file_state_mut(file_path);
            file.last_ts = Some(file.last_ts.map(|t| t.max(ts)).unwrap_or(ts));
            file.open
                .remove(&key)
                .or_else(|| file.starmap_since_release.remove(&ship_id).map(|(s, _)| s))
        };
        if let Some(start) = interval_start {
            self.push_interval(start, ts);
        }
        let file = self.file_state_mut(file_path);
        file.last_release.insert(ship_id, ts);
    }

    fn handle_starmap(&mut self, file_path: &str, ship_name: String, ship_id: String, ts: f64) {
        let file = self.file_state_mut(file_path);
        file.last_ts = Some(file.last_ts.map(|t| t.max(ts)).unwrap_or(ts));
        let last_rel = file.last_release.get(&ship_id).copied();
        let should_track = last_rel.is_none_or(|rel| ts > rel);
        if should_track && !file.starmap_since_release.contains_key(&ship_id) {
            file.starmap_since_release
                .insert(ship_id, (ts, ship_name));
        }
    }

    fn flush_file(&mut self, file_path: &str) {
        let Some(mut file) = self.open_by_file.remove(file_path) else {
            return;
        };
        let end_ts = file.last_ts.unwrap_or(0.0);
        if end_ts <= 0.0 {
            self.open_by_file.insert(file_path.to_string(), file);
            return;
        }
        for (_key, start) in file.open.drain() {
            self.push_interval(start, end_ts);
        }
        file.starmap_since_release.clear();
        file.last_release.clear();
    }
}

impl GameLogStatExtractor for PilotingExtractor {
    fn id(&self) -> &'static str {
        "piloting"
    }

    fn reset(&mut self) {
        self.intervals.clear();
        self.open_by_file.clear();
        self.current_file = None;
    }

    fn on_line(&mut self, line: &str, ctx: &LineContext) {
        let file_path = &ctx.file_path;
        self.file_state_mut(file_path);

        if let Some(ev) = parse_piloting_grant(line) {
            self.handle_grant(file_path, ev.ship_name, ev.ship_id, ev.ts);
            return;
        }
        if let Some(ev) = parse_piloting_release(line) {
            self.handle_release(file_path, ev.ship_name, ev.ship_id, ev.ts);
            return;
        }
        if let Some(ev) = parse_piloting_starmap_no_route(line) {
            self.handle_starmap(file_path, ev.ship_name, ev.ship_id, ev.ts);
            return;
        }

        if let Some(ts) = ctx.line_ts.or_else(|| parse_log_timestamp(line)) {
            let file = self.file_state_mut(file_path);
            file.last_ts = Some(file.last_ts.map(|t| t.max(ts)).unwrap_or(ts));
        }
    }

    fn on_file_end(&mut self, path: &Path, ctx: &FileContext) {
        let file_path = ctx.file_path.clone();
        let to_close: Vec<(PilotingKey, f64, f64)> = self
            .open_by_file
            .get(&file_path)
            .and_then(|file| {
                file.last_ts.map(|end_ts| {
                    file.open
                        .iter()
                        .map(|(k, &start)| (k.clone(), start, end_ts))
                        .collect()
                })
            })
            .unwrap_or_default();
        for (key, start, end) in to_close {
            self.push_interval(start, end);
            if let Some(file) = self.open_by_file.get_mut(&file_path) {
                file.open.remove(&key);
            }
        }
        self.flush_file(&file_path);
        let _ = path;
        self.current_file = None;
    }

    fn contribute(&self, out: &mut GameStatsSnapshot) {
        let merged = merge_time_intervals(self.intervals.clone());
        let total_seconds = total_seconds_from_intervals(&merged);
        out.piloting = GameStatsPiloting {
            total_seconds,
            interval_count: merged.len(),
        };
    }

    fn merge_cached(&mut self, cached: &Value) {
        if let Ok(state) = serde_json::from_value::<PilotingCacheState>(cached.clone()) {
            self.intervals = state.intervals;
            self.open_by_file = state.open_by_file;
        }
    }

    fn export_cache(&self) -> Value {
        serde_json::to_value(PilotingCacheState {
            intervals: self.intervals.clone(),
            open_by_file: self.open_by_file.clone(),
        })
        .unwrap_or(Value::Null)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scripts::game_log::extractors::{FileContext, LineContext};

    fn ctx(path: &str) -> LineContext {
        LineContext {
            file_path: path.to_string(),
            is_game_build: false,
            line_ts: None,
        }
    }

    fn fctx(path: &str) -> FileContext {
        FileContext {
            file_path: path.to_string(),
            is_game_build: false,
        }
    }

    #[test]
    fn piloting_grant_and_release() {
        let mut ext = PilotingExtractor::new();
        let grant = r#"<2026-01-01T10:00:00.000Z> granted control token for 'ORIG_300i' [42]"#;
        let release = r#"<2026-01-01T11:00:00.000Z> releasing control token for 'ORIG_300i' [42]"#;
        ext.on_line(grant, &ctx("a.log"));
        ext.on_line(release, &ctx("a.log"));
        ext.on_file_end(Path::new("a.log"), &fctx("a.log"));
        let mut snap = GameStatsSnapshot::default();
        ext.contribute(&mut snap);
        assert!((snap.piloting.total_seconds - 3600.0).abs() < 1.0);
        assert_eq!(snap.piloting.interval_count, 1);
    }

    #[test]
    fn piloting_closes_open_at_file_end() {
        let mut ext = PilotingExtractor::new();
        let grant = r#"<2026-01-01T10:00:00.000Z> granted control token for 'ANVL_Hornet' [7]"#;
        let later = r#"<2026-01-01T12:30:00.000Z> some other log line"#;
        ext.on_line(grant, &ctx("b.log"));
        ext.on_line(later, &ctx("b.log"));
        ext.on_file_end(Path::new("b.log"), &fctx("b.log"));
        let mut snap = GameStatsSnapshot::default();
        ext.contribute(&mut snap);
        assert!(snap.piloting.total_seconds > 0.0);
    }
}
