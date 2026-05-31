use crate::scripts::game_log::extractors::{FileContext, GameLogStatExtractor, LineContext};
use crate::scripts::game_log::patterns::parse_vehicle_clear_driver;
use crate::scripts::game_log::snapshot::{
    GameStatsSnapshot, GameStatsVehicleEntry, GameStatsVehicles,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct VehiclesCacheState {
    board_counts: HashMap<String, u32>,
}

#[derive(Default)]
pub struct VehiclesExtractor {
    board_counts: HashMap<String, u32>,
}

impl VehiclesExtractor {
    pub fn new() -> Self {
        Self::default()
    }

    fn sorted_entries(&self) -> Vec<GameStatsVehicleEntry> {
        let mut entries: Vec<GameStatsVehicleEntry> = self
            .board_counts
            .iter()
            .map(|(vehicle_type, count)| GameStatsVehicleEntry {
                vehicle_type: vehicle_type.clone(),
                board_count: *count,
            })
            .collect();
        entries.sort_by(|a, b| {
            b.board_count
                .cmp(&a.board_count)
                .then_with(|| a.vehicle_type.cmp(&b.vehicle_type))
        });
        entries
    }
}

impl GameLogStatExtractor for VehiclesExtractor {
    fn id(&self) -> &'static str {
        "vehicles"
    }

    fn reset(&mut self) {
        self.board_counts.clear();
    }

    fn on_line(&mut self, line: &str, _ctx: &LineContext) {
        if let Some(vehicle_type) = parse_vehicle_clear_driver(line) {
            *self.board_counts.entry(vehicle_type).or_insert(0) += 1;
        }
    }

    fn on_file_end(&mut self, _path: &Path, _ctx: &FileContext) {}

    fn contribute(&self, out: &mut GameStatsSnapshot) {
        let entries = self.sorted_entries();
        let favorite = entries.first().map(|e| e.vehicle_type.clone());
        let favorite_count = entries.first().map(|e| e.board_count).unwrap_or(0);
        out.vehicles = GameStatsVehicles {
            entries,
            favorite,
            favorite_count,
        };
    }

    fn merge_cached(&mut self, cached: &Value) {
        if let Ok(state) = serde_json::from_value::<VehiclesCacheState>(cached.clone()) {
            self.board_counts = state.board_counts;
        }
    }

    fn export_cache(&self) -> Value {
        serde_json::to_value(VehiclesCacheState {
            board_counts: self.board_counts.clone(),
        })
        .unwrap_or(Value::Null)
    }
}
