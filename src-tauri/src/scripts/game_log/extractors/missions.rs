use crate::scripts::game_log::extractors::{FileContext, GameLogStatExtractor, LineContext};
use crate::scripts::game_log::parse::parse_log_timestamp;
use crate::scripts::game_log::patterns::{
    classify_mission_completion, parse_end_mission, MissionOutcome,
};
use crate::scripts::game_log::snapshot::{GameStatsMissions, GameStatsSnapshot};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

const END_MISSION_DEDUP_SEC: f64 = 5.0;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct MissionsCacheState {
    completed: u32,
    abandoned: u32,
    failed: u32,
    last_end_ts: HashMap<String, f64>,
}

#[derive(Default)]
pub struct MissionsExtractor {
    completed: u32,
    abandoned: u32,
    failed: u32,
    last_end_ts: HashMap<String, f64>,
}

impl MissionsExtractor {
    pub fn new() -> Self {
        Self::default()
    }

    fn record_end(&mut self, mission_id: &str, completion_type: &str, ts: f64) {
        if let Some(&prev) = self.last_end_ts.get(mission_id) {
            if (ts - prev).abs() < END_MISSION_DEDUP_SEC {
                return;
            }
        }
        self.last_end_ts.insert(mission_id.to_string(), ts);

        match classify_mission_completion(completion_type) {
            Some(MissionOutcome::Completed) => self.completed += 1,
            Some(MissionOutcome::Abandoned) => self.abandoned += 1,
            Some(MissionOutcome::Failed) => self.failed += 1,
            None => {}
        }
    }
}

impl GameLogStatExtractor for MissionsExtractor {
    fn id(&self) -> &'static str {
        "missions"
    }

    fn reset(&mut self) {
        *self = Self::default();
    }

    fn on_line(&mut self, line: &str, ctx: &LineContext) {
        let Some(ev) = parse_end_mission(line) else {
            return;
        };
        let ts = ctx
            .line_ts
            .or_else(|| parse_log_timestamp(line))
            .unwrap_or(0.0);
        self.record_end(&ev.mission_id, &ev.completion_type, ts);
    }

    fn on_file_end(&mut self, _path: &Path, _ctx: &FileContext) {}

    fn contribute(&self, out: &mut GameStatsSnapshot) {
        out.missions = GameStatsMissions {
            completed: self.completed,
            abandoned: self.abandoned,
            failed: self.failed,
        };
    }

    fn merge_cached(&mut self, cached: &Value) {
        if let Ok(state) = serde_json::from_value::<MissionsCacheState>(cached.clone()) {
            self.completed = state.completed;
            self.abandoned = state.abandoned;
            self.failed = state.failed;
            self.last_end_ts = state.last_end_ts;
        }
    }

    fn export_cache(&self) -> Value {
        serde_json::to_value(MissionsCacheState {
            completed: self.completed,
            abandoned: self.abandoned,
            failed: self.failed,
            last_end_ts: self.last_end_ts.clone(),
        })
        .unwrap_or(Value::Null)
    }
}
