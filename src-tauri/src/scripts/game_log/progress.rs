use crate::scripts::game_log::scan_state::GameStatsScanState;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub const GAME_STATS_SCAN_PROGRESS_EVENT: &str = "game-stats-scan-progress";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsScanProgress {
    pub phase: String,
    pub files_done: u32,
    pub files_total: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_file: Option<String>,
    pub percent: u8,
}

impl GameStatsScanProgress {
    pub fn emit(app: Option<&AppHandle>, scan_state: Option<&GameStatsScanState>, progress: Self) {
        if let Some(state) = scan_state {
            state.record_progress(&progress);
        }
        if let Some(handle) = app {
            let _ = handle.emit(GAME_STATS_SCAN_PROGRESS_EVENT, &progress);
        }
    }
}

pub fn file_basename(path: &std::path::Path) -> Option<String> {
    path.file_name().map(|s| s.to_string_lossy().into_owned())
}
