use crate::scripts::game_log::cache::load_cache;
use crate::scripts::game_log::engine::{run_scan, ScanMode};
use crate::scripts::game_log::scan_state::{
    GameStatsScanKind, GameStatsScanState, GameStatsScanStatus, GAME_STATS_SCAN_FINISHED_EVENT,
};
use crate::scripts::game_log::snapshot::GameStatsSnapshot;
use serde::Serialize;
use tauri::{command, AppHandle, Emitter, Manager, State};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsResponse {
    pub snapshot: GameStatsSnapshot,
    pub from_cache: bool,
}

const SCAN_IN_PROGRESS_CODE: &str = "GAME_STATS_SCAN_IN_PROGRESS";

fn scan_busy_error(status: GameStatsScanStatus) -> String {
    serde_json::json!({
        "code": SCAN_IN_PROGRESS_CODE,
        "status": status,
    })
    .to_string()
}

#[command]
pub fn get_game_stats_scan_status(
    state: State<'_, GameStatsScanState>,
) -> Result<GameStatsScanStatus, String> {
    Ok(state.status())
}

#[command]
pub async fn get_cached_game_stats(app: AppHandle) -> Result<Option<GameStatsSnapshot>, String> {
    let resolver = app.path().clone();
    tokio::task::spawn_blocking(move || Ok(load_cache(&resolver)?.map(|c| c.snapshot)))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn get_game_stats(
    app: AppHandle,
    _state: State<'_, GameStatsScanState>,
) -> Result<GameStatsResponse, String> {
    let app_handle = app.clone();
    let scan_state = (*app.state::<GameStatsScanState>()).clone();
    let resolver = app.path().clone();
    tokio::task::spawn_blocking(move || {
        if let Err(busy) = scan_state.try_begin(GameStatsScanKind::Load) {
            return Err(scan_busy_error(busy));
        }

        let result = (|| {
            let had_cache = load_cache(&resolver)?.is_some();
            let mode = if had_cache {
                ScanMode::Incremental
            } else {
                ScanMode::Full
            };
            let snapshot = run_scan(&resolver, mode, Some(app_handle.clone()), Some(&scan_state))?;
            Ok(GameStatsResponse {
                snapshot,
                from_cache: had_cache,
            })
        })();

        scan_state.finish();
        if let Ok(ref response) = result {
            let _ = app_handle.emit(GAME_STATS_SCAN_FINISHED_EVENT, &response.snapshot);
        }
        result
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn sync_game_stats(
    app: AppHandle,
    _state: State<'_, GameStatsScanState>,
) -> Result<GameStatsSnapshot, String> {
    let app_handle = app.clone();
    let scan_state = (*app.state::<GameStatsScanState>()).clone();
    let resolver = app.path().clone();
    tokio::task::spawn_blocking(move || {
        if let Err(busy) = scan_state.try_begin(GameStatsScanKind::Sync) {
            return Err(scan_busy_error(busy));
        }

        let result = run_scan(
            &resolver,
            ScanMode::Full,
            Some(app_handle.clone()),
            Some(&scan_state),
        );

        scan_state.finish();
        if let Ok(ref snapshot) = result {
            let _ = app_handle.emit(GAME_STATS_SCAN_FINISHED_EVENT, snapshot);
        }
        result
    })
    .await
    .map_err(|e| e.to_string())?
}
