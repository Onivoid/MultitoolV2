pub mod cache;
pub mod catalog;
pub mod commands;
pub mod engine;
pub mod extractors;
pub mod io;
pub mod parse;
pub mod patterns;
pub mod progress;
pub mod scan_state;
pub mod session;
pub mod snapshot;

pub use commands::{
    get_cached_game_stats, get_game_stats, get_game_stats_scan_status, sync_game_stats,
};
pub use scan_state::GameStatsScanState;
