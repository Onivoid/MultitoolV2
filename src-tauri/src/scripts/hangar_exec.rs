use chrono::{DateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::command;

const EXEC_APP_JS_URL: &str = "https://exec.xyxyll.com/app.js";
const USER_AGENT: &str = "MultitoolV2-HangarExec/2.0";
const STATUS_CACHE_TTL_SECS: u64 = 60;
const TERMINAL_TIMER_SECS: i64 = 30 * 60;

const CYCLE_DRIFT_MS: i64 = 226;
const DESIGN_ONLINE_MIN: i64 = 65;
const DESIGN_OFFLINE_MIN: i64 = 120;
const DESIGN_CYCLE_MIN: i64 = DESIGN_ONLINE_MIN + DESIGN_OFFLINE_MIN;
const DESIGN_ONLINE_MS: i64 = DESIGN_ONLINE_MIN * 60 * 1000;
const DESIGN_CYCLE_MS: i64 = DESIGN_CYCLE_MIN * 60 * 1000;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HangarExecStatus {
    pub status: String,
    pub next_change_at: String,
    pub seconds_remaining: i64,
    pub cycle_number: i64,
    pub initial_open_time: String,
    pub version_label: Option<String>,
    pub last_modified: Option<String>,
    pub source_url: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HangarExecScheduleEvent {
    pub event_type: String,
    pub at: String,
    pub cycle_number: i64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HangarExecStatusResponse {
    pub status: HangarExecStatus,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub upcoming: Vec<HangarExecScheduleEvent>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HangarTerminalPreset {
    pub id: String,
    pub label: String,
    pub location: String,
    pub timer_seconds: i64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HangarTerminalTimer {
    pub terminal_id: String,
    pub ends_at: String,
    pub seconds_remaining: i64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HangarExecTimersResponse {
    pub terminals: Vec<HangarTerminalPreset>,
    pub active_timers: Vec<HangarTerminalTimer>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct HangarExecTimersStore {
    timers: Vec<StoredTimer>,
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct StoredTimer {
    terminal_id: String,
    ends_at_ms: i64,
}

#[derive(Clone)]
struct HangarCycleConfig {
    initial_open_ms: i64,
    version_label: Option<String>,
    last_modified: Option<String>,
}

struct StatusCacheEntry {
    fetched_at: SystemTime,
    response: HangarExecStatusResponse,
}

static STATUS_CACHE: std::sync::Mutex<Option<StatusCacheEntry>> = std::sync::Mutex::new(None);

pub fn terminal_presets() -> Vec<HangarTerminalPreset> {
    vec![
        preset("checkmate-1", "Checkmate", "Tablette 1"),
        preset("checkmate-2", "Checkmate", "Tablette 2"),
        preset("checkmate-3", "Checkmate", "Tablette 3"),
        preset("obituary-4", "Obituary", "Tablette 4"),
        preset("obituary-7", "Obituary", "Tablette 7"),
        preset("ruin-5", "Ruin Station", "Tablette 5"),
        preset("ruin-6", "Ruin Station", "Tablette 6"),
        preset("pyam-red-3-4", "PYAM-SUPVISR", "Carte d'accès Rouge 3-4"),
        preset("pyam-red-3-5", "PYAM-SUPVISR", "Carte d'accès Rouge 3-5"),
    ]
}

fn preset(id: &str, location: &str, label: &str) -> HangarTerminalPreset {
    HangarTerminalPreset {
        id: id.to_string(),
        label: label.to_string(),
        location: location.to_string(),
        timer_seconds: TERMINAL_TIMER_SECS,
    }
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| format!("Impossible d'initialiser le client HTTP: {e}"))
}

fn timers_store_path() -> Option<PathBuf> {
    let dir = dirs::data_local_dir()?
        .join("multitool")
        .join("hangar_exec");
    fs::create_dir_all(&dir).ok()?;
    Some(dir.join("terminal_timers.json"))
}

fn load_timers_store() -> HangarExecTimersStore {
    let Some(path) = timers_store_path() else {
        return HangarExecTimersStore { timers: vec![] };
    };
    if !path.exists() {
        return HangarExecTimersStore { timers: vec![] };
    }
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or(HangarExecTimersStore { timers: vec![] })
}

fn save_timers_store(store: &HangarExecTimersStore) {
    if let Some(path) = timers_store_path() {
        if let Ok(bytes) = serde_json::to_vec(store) {
            let _ = fs::write(path, bytes);
        }
    }
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn ms_to_rfc3339(ms: i64) -> String {
    DateTime::<Utc>::from_timestamp_millis(ms)
        .map(|dt| dt.to_rfc3339())
        .unwrap_or_default()
}

fn parse_initial_open_time(app_js: &str) -> Result<i64, String> {
    let re =
        Regex::new(r"INITIAL_OPEN_TIME\s*=\s*new Date\('([^']+)'\)").map_err(|e| e.to_string())?;
    let caps = re
        .captures(app_js)
        .ok_or_else(|| "INITIAL_OPEN_TIME introuvable dans app.js".to_string())?;
    let raw = caps
        .get(1)
        .ok_or_else(|| "Date initiale illisible".to_string())?
        .as_str();
    let dt = DateTime::parse_from_rfc3339(raw)
        .or_else(|_| {
            let fmt = "%Y-%m-%dT%H:%M:%S%.3f%z";
            DateTime::parse_from_str(raw, fmt)
        })
        .map_err(|e| format!("Date initiale invalide: {e}"))?;
    Ok(dt.timestamp_millis())
}

fn parse_last_modified(app_js: &str) -> Option<String> {
    Regex::new(r"@lastModified\s+([0-9]{4}-[A-Za-z]{3}-[0-9]{2})")
        .ok()
        .and_then(|re| {
            re.captures(app_js)
                .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
        })
}

fn parse_version_label(app_js: &str) -> Option<String> {
    Regex::new(r"Updated [^f]+ for Star Citizen Patch ([^)]+)")
        .ok()
        .and_then(|re| {
            re.captures(app_js)
                .and_then(|c| c.get(1).map(|m| m.as_str().trim().to_string()))
        })
}

async fn fetch_exec_app_js() -> Result<String, String> {
    let client = http_client()?;
    let response = client
        .get(EXEC_APP_JS_URL)
        .send()
        .await
        .map_err(|e| format!("Erreur réseau exec.xyxyll.com: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("exec.xyxyll.com HTTP {}", response.status()));
    }
    response
        .text()
        .await
        .map_err(|e| format!("Lecture app.js: {e}"))
}

fn cycle_duration_ms() -> i64 {
    DESIGN_CYCLE_MS + CYCLE_DRIFT_MS
}

fn open_duration_ms() -> i64 {
    let cycle = cycle_duration_ms();
    ((cycle as f64) * (DESIGN_ONLINE_MS as f64) / (DESIGN_CYCLE_MS as f64)).round() as i64
}

fn close_duration_ms() -> i64 {
    cycle_duration_ms() - open_duration_ms()
}

fn next_status_change(now_ms: i64, initial_open_ms: i64) -> (String, i64) {
    let cycle = cycle_duration_ms();
    let open = open_duration_ms();
    let close = close_duration_ms();
    let elapsed = now_ms - initial_open_ms;
    let time_in_cycle = elapsed.rem_euclid(cycle);

    if time_in_cycle < open {
        let remaining = open - time_in_cycle;
        ("ONLINE".to_string(), now_ms + remaining)
    } else {
        let remaining_close = time_in_cycle - open;
        let remaining = close - remaining_close;
        ("OFFLINE".to_string(), now_ms + remaining)
    }
}

fn event_cycle_number(event_ms: i64, initial_open_ms: i64) -> i64 {
    let elapsed = event_ms - initial_open_ms;
    (elapsed / cycle_duration_ms()) + 55
}

fn build_schedule(now_ms: i64, initial_open_ms: i64, limit: usize) -> Vec<HangarExecScheduleEvent> {
    let open = open_duration_ms();
    let close = close_duration_ms();
    let (status, mut next_ms) = next_status_change(now_ms, initial_open_ms);
    let mut current_status = status;
    let mut events = Vec::new();
    let end_ms = now_ms + 3 * 24 * 60 * 60 * 1000;

    if current_status == "ONLINE" {
        events.push(HangarExecScheduleEvent {
            event_type: "Offline".to_string(),
            at: ms_to_rfc3339(next_ms),
            cycle_number: event_cycle_number(next_ms, initial_open_ms),
        });
        next_ms += close;
        current_status = "OFFLINE".to_string();
    } else {
        events.push(HangarExecScheduleEvent {
            event_type: "Online".to_string(),
            at: ms_to_rfc3339(next_ms),
            cycle_number: event_cycle_number(next_ms, initial_open_ms),
        });
        next_ms += open;
        current_status = "ONLINE".to_string();
    }

    while next_ms < end_ms && events.len() < limit {
        if current_status == "ONLINE" {
            events.push(HangarExecScheduleEvent {
                event_type: "Offline".to_string(),
                at: ms_to_rfc3339(next_ms),
                cycle_number: event_cycle_number(next_ms, initial_open_ms),
            });
            next_ms += close;
            current_status = "OFFLINE".to_string();
        } else {
            events.push(HangarExecScheduleEvent {
                event_type: "Online".to_string(),
                at: ms_to_rfc3339(next_ms),
                cycle_number: event_cycle_number(next_ms, initial_open_ms),
            });
            next_ms += open;
            current_status = "ONLINE".to_string();
        }
    }

    events
}

fn build_status_response(config: &HangarCycleConfig) -> HangarExecStatusResponse {
    let now = now_ms();
    let (status, next_change_ms) = next_status_change(now, config.initial_open_ms);
    let seconds_remaining = ((next_change_ms - now).max(0)) / 1000;

    HangarExecStatusResponse {
        status: HangarExecStatus {
            status,
            next_change_at: ms_to_rfc3339(next_change_ms),
            seconds_remaining,
            cycle_number: event_cycle_number(next_change_ms, config.initial_open_ms),
            initial_open_time: ms_to_rfc3339(config.initial_open_ms),
            version_label: config.version_label.clone(),
            last_modified: config.last_modified.clone(),
            source_url: EXEC_APP_JS_URL.to_string(),
        },
        upcoming: build_schedule(now, config.initial_open_ms, 12),
    }
}

async fn load_cycle_config() -> Result<HangarCycleConfig, String> {
    let app_js = fetch_exec_app_js().await?;
    let initial_open_ms = parse_initial_open_time(&app_js)?;
    Ok(HangarCycleConfig {
        initial_open_ms,
        version_label: parse_version_label(&app_js),
        last_modified: parse_last_modified(&app_js),
    })
}

fn active_timers_from_store() -> Vec<HangarTerminalTimer> {
    let now = now_ms();
    let store = load_timers_store();
    store
        .timers
        .into_iter()
        .filter_map(|t| {
            let remaining = (t.ends_at_ms - now) / 1000;
            if remaining <= 0 {
                None
            } else {
                Some(HangarTerminalTimer {
                    terminal_id: t.terminal_id,
                    ends_at: ms_to_rfc3339(t.ends_at_ms),
                    seconds_remaining: remaining,
                })
            }
        })
        .collect()
}

fn prune_and_save_timers(store: &mut HangarExecTimersStore) {
    let now = now_ms();
    store.timers.retain(|t| t.ends_at_ms > now);
    save_timers_store(store);
}

/// Statut PYAM Executive Hangar (source exec.xyxyll.com, cache 60 s).
#[command]
pub async fn hangar_exec_fetch_status() -> Result<HangarExecStatusResponse, String> {
    {
        let cache = STATUS_CACHE.lock().unwrap();
        if let Some(entry) = cache.as_ref() {
            if let Ok(elapsed) = entry.fetched_at.elapsed() {
                if elapsed < Duration::from_secs(STATUS_CACHE_TTL_SECS) {
                    return Ok(entry.response.clone());
                }
            }
        }
    }

    let config = load_cycle_config().await?;
    let response = build_status_response(&config);
    *STATUS_CACHE.lock().unwrap() = Some(StatusCacheEntry {
        fetched_at: SystemTime::now(),
        response: response.clone(),
    });
    Ok(response)
}

/// Démarre ou redémarre un minuteur terminal (30 min, persistant).
#[command]
pub async fn hangar_exec_start_timer(
    terminal_id: String,
) -> Result<HangarExecTimersResponse, String> {
    let valid = terminal_presets().iter().any(|t| t.id == terminal_id);
    if !valid {
        return Err(format!("Terminal inconnu: {terminal_id}"));
    }

    let mut store = load_timers_store();
    prune_and_save_timers(&mut store);
    let ends_at_ms = now_ms() + TERMINAL_TIMER_SECS * 1000;
    store.timers.retain(|t| t.terminal_id != terminal_id);
    store.timers.push(StoredTimer {
        terminal_id: terminal_id.clone(),
        ends_at_ms,
    });
    save_timers_store(&store);

    Ok(HangarExecTimersResponse {
        terminals: terminal_presets(),
        active_timers: active_timers_from_store(),
    })
}

/// Liste les terminaux prédéfinis et les minuteurs actifs.
#[command]
pub async fn hangar_exec_get_timers() -> Result<HangarExecTimersResponse, String> {
    let mut store = load_timers_store();
    prune_and_save_timers(&mut store);
    Ok(HangarExecTimersResponse {
        terminals: terminal_presets(),
        active_timers: active_timers_from_store(),
    })
}
