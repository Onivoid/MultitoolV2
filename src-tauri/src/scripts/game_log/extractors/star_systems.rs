use crate::scripts::game_log::extractors::{FileContext, GameLogStatExtractor, LineContext};
use crate::scripts::game_log::patterns::detect_star_system;
use crate::scripts::game_log::snapshot::{
    GameStatsSnapshot, GameStatsStarSystemVisit, GameStatsStarSystems,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct StarSystemsCacheState {
    visits: HashMap<String, u32>,
    current_system: Option<String>,
}

#[derive(Default)]
pub struct StarSystemsExtractor {
    visits: HashMap<String, u32>,
    current_system: Option<String>,
}

impl StarSystemsExtractor {
    pub fn new() -> Self {
        Self::default()
    }

    fn enter_system(&mut self, system: &str) {
        if self.current_system.as_deref() == Some(system) {
            return;
        }
        *self.visits.entry(system.to_string()).or_insert(0) += 1;
        self.current_system = Some(system.to_string());
    }

    fn sorted_visits(&self) -> Vec<GameStatsStarSystemVisit> {
        let mut visits: Vec<GameStatsStarSystemVisit> = self
            .visits
            .iter()
            .map(|(system, count)| GameStatsStarSystemVisit {
                system: system.clone(),
                visit_count: *count,
            })
            .collect();
        visits.sort_by(|a, b| {
            b.visit_count
                .cmp(&a.visit_count)
                .then_with(|| a.system.cmp(&b.system))
        });
        visits
    }
}

impl GameLogStatExtractor for StarSystemsExtractor {
    fn id(&self) -> &'static str {
        "star_systems"
    }

    fn reset(&mut self) {
        *self = Self::default();
    }

    fn on_line(&mut self, line: &str, _ctx: &LineContext) {
        if let Some(system) = detect_star_system(line) {
            self.enter_system(system);
        }
    }

    fn on_file_end(&mut self, _path: &Path, _ctx: &FileContext) {}

    fn contribute(&self, out: &mut GameStatsSnapshot) {
        let visits = self.sorted_visits();
        let favorite = visits.first().map(|v| v.system.clone());
        let favorite_count = visits.first().map(|v| v.visit_count).unwrap_or(0);
        out.star_systems = GameStatsStarSystems {
            visits,
            favorite,
            favorite_count,
        };
    }

    fn merge_cached(&mut self, cached: &Value) {
        if let Ok(state) = serde_json::from_value::<StarSystemsCacheState>(cached.clone()) {
            self.visits = state.visits;
            self.current_system = state.current_system;
        }
    }

    fn export_cache(&self) -> Value {
        serde_json::to_value(StarSystemsCacheState {
            visits: self.visits.clone(),
            current_system: self.current_system.clone(),
        })
        .unwrap_or(Value::Null)
    }
}
