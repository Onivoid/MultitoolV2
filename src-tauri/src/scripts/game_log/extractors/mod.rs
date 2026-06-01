pub mod blueprints;
pub mod missions;
pub mod piloting;
pub mod playtime;
pub mod spending;
pub mod star_systems;
pub mod vehicles;

use crate::scripts::game_log::snapshot::GameStatsSnapshot;
use serde_json::Value;
use std::path::Path;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct LineContext {
    pub file_path: String,
    pub is_game_build: bool,
    pub line_ts: Option<f64>,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct FileContext {
    pub file_path: String,
    pub is_game_build: bool,
}

pub trait GameLogStatExtractor: Send {
    fn id(&self) -> &'static str;
    fn reset(&mut self);
    fn on_line(&mut self, line: &str, ctx: &LineContext);
    fn on_file_end(&mut self, path: &Path, ctx: &FileContext);
    fn contribute(&self, out: &mut GameStatsSnapshot);
    fn merge_cached(&mut self, cached: &Value);
    fn export_cache(&self) -> Value;
}

pub fn default_extractors() -> Vec<Box<dyn GameLogStatExtractor>> {
    vec![
        Box::new(playtime::PlaytimeExtractor::new()),
        Box::new(missions::MissionsExtractor::new()),
        Box::new(blueprints::BlueprintsExtractor::new()),
        Box::new(vehicles::VehiclesExtractor::new()),
        Box::new(star_systems::StarSystemsExtractor::new()),
        Box::new(piloting::PilotingExtractor::new()),
        Box::new(spending::SpendingExtractor::new()),
    ]
}
