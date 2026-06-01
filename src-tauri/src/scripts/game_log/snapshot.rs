use serde::{Deserialize, Serialize};

pub const SNAPSHOT_SCHEMA_VERSION: u32 = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsPeriod {
    pub oldest_backup_start_iso: Option<String>,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsPlaytime {
    pub total_seconds: f64,
    pub session_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsMissions {
    pub completed: u32,
    pub abandoned: u32,
    pub failed: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsBlueprints {
    pub total_unlocked: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsVehicleEntry {
    pub vehicle_type: String,
    pub board_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsVehicles {
    pub entries: Vec<GameStatsVehicleEntry>,
    pub favorite: Option<String>,
    pub favorite_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsStarSystemVisit {
    pub system: String,
    pub visit_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsStarSystems {
    pub visits: Vec<GameStatsStarSystemVisit>,
    pub favorite: Option<String>,
    pub favorite_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsPiloting {
    pub total_seconds: f64,
    pub interval_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsSpendingDay {
    pub date: String,
    pub spent: f64,
    pub cumulative: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsSpendingShop {
    pub shop: String,
    pub total_spent: f64,
    pub purchase_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsSpending {
    pub total_spent: f64,
    pub purchase_count: u32,
    pub by_day: Vec<GameStatsSpendingDay>,
    pub by_shop: Vec<GameStatsSpendingShop>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsSnapshot {
    pub schema_version: u32,
    pub computed_at: i64,
    pub period: GameStatsPeriod,
    pub playtime: GameStatsPlaytime,
    /// Champs v2 : absents des caches schéma 1 → valeurs par défaut à la lecture.
    #[serde(default)]
    pub missions: GameStatsMissions,
    #[serde(default)]
    pub blueprints: GameStatsBlueprints,
    #[serde(default)]
    pub vehicles: GameStatsVehicles,
    #[serde(default)]
    pub star_systems: GameStatsStarSystems,
    /// Champs v3
    #[serde(default)]
    pub piloting: GameStatsPiloting,
    #[serde(default)]
    pub spending: GameStatsSpending,
}

impl Default for GameStatsSnapshot {
    fn default() -> Self {
        Self {
            schema_version: SNAPSHOT_SCHEMA_VERSION,
            computed_at: 0,
            period: GameStatsPeriod {
                oldest_backup_start_iso: None,
                label: "Aucune donnée".to_string(),
            },
            playtime: GameStatsPlaytime {
                total_seconds: 0.0,
                session_count: 0,
            },
            missions: GameStatsMissions::default(),
            blueprints: GameStatsBlueprints::default(),
            vehicles: GameStatsVehicles::default(),
            star_systems: GameStatsStarSystems::default(),
            piloting: GameStatsPiloting::default(),
            spending: GameStatsSpending::default(),
        }
    }
}

pub fn period_label_from_iso(iso: Option<&str>) -> String {
    match iso {
        Some(d) => format!("depuis le {d}"),
        None => "période inconnue".to_string(),
    }
}

pub fn iso_from_timestamp(ts: f64) -> String {
    chrono::DateTime::from_timestamp(ts as i64, 0)
        .map(|dt| dt.format("%d/%m/%Y").to_string())
        .unwrap_or_else(|| "—".to_string())
}
