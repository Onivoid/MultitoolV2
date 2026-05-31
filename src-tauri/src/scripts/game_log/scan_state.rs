use crate::scripts::game_log::progress::GameStatsScanProgress;
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

pub const GAME_STATS_SCAN_FINISHED_EVENT: &str = "game-stats-scan-finished";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum GameStatsScanKind {
    Load,
    Sync,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStatsScanStatus {
    pub in_progress: bool,
    pub started_at_ms: Option<u64>,
    pub kind: Option<GameStatsScanKind>,
    pub progress: Option<GameStatsScanProgress>,
}

struct Inner {
    in_progress: bool,
    started_at_ms: Option<u64>,
    kind: Option<GameStatsScanKind>,
    last_progress: Option<GameStatsScanProgress>,
}

#[derive(Clone)]
pub struct GameStatsScanState {
    inner: Arc<Mutex<Inner>>,
}

impl Default for GameStatsScanState {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(Inner {
                in_progress: false,
                started_at_ms: None,
                kind: None,
                last_progress: None,
            })),
        }
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

impl GameStatsScanState {
    pub fn try_begin(&self, kind: GameStatsScanKind) -> Result<(), GameStatsScanStatus> {
        let mut guard = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        if guard.in_progress {
            return Err(self.status_from_guard(&guard));
        }
        guard.in_progress = true;
        guard.started_at_ms = Some(now_ms());
        guard.kind = Some(kind);
        guard.last_progress = None;
        Ok(())
    }

    pub fn record_progress(&self, progress: &GameStatsScanProgress) {
        if let Ok(mut guard) = self.inner.lock() {
            guard.last_progress = Some(progress.clone());
        }
    }

    pub fn finish(&self) {
        if let Ok(mut guard) = self.inner.lock() {
            guard.in_progress = false;
            guard.kind = None;
            guard.started_at_ms = None;
            guard.last_progress = None;
        }
    }

    pub fn status(&self) -> GameStatsScanStatus {
        self.inner
            .lock()
            .map(|guard| self.status_from_guard(&guard))
            .unwrap_or(GameStatsScanStatus {
                in_progress: false,
                started_at_ms: None,
                kind: None,
                progress: None,
            })
    }

    fn status_from_guard(&self, guard: &Inner) -> GameStatsScanStatus {
        GameStatsScanStatus {
            in_progress: guard.in_progress,
            started_at_ms: guard.started_at_ms,
            kind: guard.kind,
            progress: guard.last_progress.clone(),
        }
    }
}
