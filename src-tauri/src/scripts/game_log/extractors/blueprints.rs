use crate::scripts::game_log::extractors::{FileContext, GameLogStatExtractor, LineContext};
use crate::scripts::game_log::patterns::parse_blueprint_product;
use crate::scripts::game_log::snapshot::{GameStatsBlueprints, GameStatsSnapshot};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashSet;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct BlueprintsCacheState {
    products: HashSet<String>,
}

#[derive(Default)]
pub struct BlueprintsExtractor {
    products: HashSet<String>,
}

impl BlueprintsExtractor {
    pub fn new() -> Self {
        Self::default()
    }
}

impl GameLogStatExtractor for BlueprintsExtractor {
    fn id(&self) -> &'static str {
        "blueprints"
    }

    fn reset(&mut self) {
        self.products.clear();
    }

    fn on_line(&mut self, line: &str, _ctx: &LineContext) {
        if let Some(name) = parse_blueprint_product(line) {
            self.products.insert(name);
        }
    }

    fn on_file_end(&mut self, _path: &Path, _ctx: &FileContext) {}

    fn contribute(&self, out: &mut GameStatsSnapshot) {
        out.blueprints = GameStatsBlueprints {
            total_unlocked: self.products.len() as u32,
        };
    }

    fn merge_cached(&mut self, cached: &Value) {
        if let Ok(state) = serde_json::from_value::<BlueprintsCacheState>(cached.clone()) {
            self.products = state.products;
        }
    }

    fn export_cache(&self) -> Value {
        serde_json::to_value(BlueprintsCacheState {
            products: self.products.clone(),
        })
        .unwrap_or(Value::Null)
    }
}
