use crate::scripts::gamepath::get_live_game_log_path_sync;
use chrono::{DateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::fs::{self, File};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;
use tauri::path::PathResolver;
use tauri::{command, AppHandle, Manager, Runtime};
use tauri::State;
use tauri_plugin_dialog::DialogExt;

const BLUEPRINT_CORRELATION_WINDOW_SEC: f64 = 5.0;
const TAIL_POLL_INTERVAL: Duration = Duration::from_millis(200);
const SCHEMA_VERSION: u32 = 2;
/// Nombre max de lignes parcourues pour trouver le handle au login.
const OWNER_SCAN_MAX_LINES: usize = 500;

// ---------------------------------------------------------------------------
// Persistence types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintEntry {
    /// Handle RSI du compte (ex. « Onivoid »).
    #[serde(default)]
    pub owner: String,
    pub product_name: String,
    pub ts: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mission_guid: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mission_debug_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mission_trigger: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintStoreFile {
    pub schema_version: u32,
    pub blueprints: Vec<BlueprintEntry>,
}

impl Default for BlueprintStoreFile {
    fn default() -> Self {
        Self {
            schema_version: SCHEMA_VERSION,
            blueprints: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GamelogWatcherConfig {
    #[serde(default)]
    pub auto_start: bool,
    #[serde(default)]
    pub enabled: bool,
}

impl Default for GamelogWatcherConfig {
    fn default() -> Self {
        Self {
            auto_start: false,
            enabled: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GamelogWatcherStatus {
    pub watching: bool,
    pub log_path: Option<String>,
    pub blueprint_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportBlueprintsResult {
    pub imported: usize,
    pub total: usize,
    pub files_scanned: usize,
    pub matches_found: usize,
    /// Fichiers contenant au moins une ligne « Schémas reçu » / « Received Blueprint ».
    pub files_with_matches: usize,
    /// Noms de produits distincts trouvés dans les logs (avant fusion JSON).
    pub unique_products_found: usize,
    pub files_failed: usize,
    pub log_directory: String,
    pub game_log_path: String,
    pub read_errors: Vec<String>,
    /// Entrées supprimées car sans handle (données v1 / import incomplet).
    pub removed_without_owner: usize,
}

// ---------------------------------------------------------------------------
// Config / store paths
// ---------------------------------------------------------------------------

fn ensure_config_dir(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let config_dir = path
        .app_config_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de configuration".to_string())?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    Ok(config_dir)
}

fn blueprints_file_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    Ok(ensure_config_dir(path)?.join("gamelog_blueprints.json"))
}

fn watcher_config_file_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    Ok(ensure_config_dir(path)?.join("gamelog_watcher.json"))
}

pub fn load_blueprint_store_sync(app: &AppHandle) -> Result<BlueprintStoreFile, String> {
    let file_path = blueprints_file_path(app.path())?;
    if !file_path.exists() {
        return Ok(BlueprintStoreFile::default());
    }
    let json = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

fn save_blueprint_store_sync(app: &AppHandle, store: &BlueprintStoreFile) -> Result<(), String> {
    let file_path = blueprints_file_path(app.path())?;
    let json = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    fs::write(file_path, json).map_err(|e| e.to_string())
}

fn blueprint_merge_key(entry: &BlueprintEntry) -> (String, String) {
    (entry.owner.clone(), entry.product_name.clone())
}

pub fn blueprint_has_owner(entry: &BlueprintEntry) -> bool {
    !entry.owner.trim().is_empty()
}

/// Retire les schémas sans handle RSI (legacy v1).
pub fn prune_blueprints_without_owner(
    blueprints: &[BlueprintEntry],
) -> (Vec<BlueprintEntry>, usize) {
    let before = blueprints.len();
    let kept: Vec<BlueprintEntry> = blueprints
        .iter()
        .filter(|e| blueprint_has_owner(e))
        .cloned()
        .collect();
    let removed = before - kept.len();
    (kept, removed)
}

pub fn prune_blueprint_store_sync(app: &AppHandle) -> Result<usize, String> {
    let mut store = load_blueprint_store_sync(app)?;
    let (pruned, removed) = prune_blueprints_without_owner(&store.blueprints);
    if removed == 0 {
        return Ok(0);
    }
    store.schema_version = SCHEMA_VERSION;
    store.blueprints = pruned;
    save_blueprint_store_sync(app, &store)?;
    Ok(removed)
}

/// Fusionne des entrées en gardant la première occurrence par `(owner, product_name)` (ts le plus ancien).
pub fn merge_blueprint_entries(
    existing: &[BlueprintEntry],
    incoming: &[BlueprintEntry],
) -> (Vec<BlueprintEntry>, usize) {
    let mut by_key: HashMap<(String, String), BlueprintEntry> = HashMap::new();
    for entry in existing {
        by_key.insert(blueprint_merge_key(entry), entry.clone());
    }
    let mut added = 0usize;
    for entry in incoming {
        let key = blueprint_merge_key(entry);
        match by_key.get(&key) {
            None => {
                by_key.insert(key, entry.clone());
                added += 1;
            }
            Some(current) if entry.ts < current.ts => {
                by_key.insert(key, entry.clone());
            }
            _ => {}
        }
    }
    let mut merged: Vec<BlueprintEntry> = by_key.into_values().collect();
    merged.sort_by(|a, b| b.ts.partial_cmp(&a.ts).unwrap_or(std::cmp::Ordering::Equal));
    (merged, added)
}

pub fn append_blueprints(app: &AppHandle, incoming: &[BlueprintEntry]) -> Result<usize, String> {
    let mut store = load_blueprint_store_sync(app)?;
    let (merged, added) = merge_blueprint_entries(&store.blueprints, incoming);
    store.schema_version = SCHEMA_VERSION;
    store.blueprints = merged;
    save_blueprint_store_sync(app, &store)?;
    Ok(added)
}

pub fn load_gamelog_watcher_config_sync(app: &AppHandle) -> Result<GamelogWatcherConfig, String> {
    let file_path = watcher_config_file_path(app.path())?;
    if !file_path.exists() {
        return Ok(GamelogWatcherConfig::default());
    }
    let json = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

pub fn save_gamelog_watcher_config_sync(
    app: &AppHandle,
    config: &GamelogWatcherConfig,
) -> Result<(), String> {
    let file_path = watcher_config_file_path(app.path())?;
    let json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(file_path, json).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Log parsing (port of watcher.py)
// ---------------------------------------------------------------------------

struct MissionEntry {
    debug_name: String,
}

struct ActiveMission {
    debug_name: String,
}

#[derive(Clone)]
struct MissionLifecycleEvent {
    trigger: String,
    guid: String,
    debug_name: String,
    ts: f64,
}

struct WatcherState {
    guid_map: HashMap<String, MissionEntry>,
    active: HashMap<String, ActiveMission>,
    recent_lifecycle: VecDeque<MissionLifecycleEvent>,
    owner: Option<String>,
}

impl WatcherState {
    fn new() -> Self {
        Self {
            guid_map: HashMap::new(),
            active: HashMap::new(),
            recent_lifecycle: VecDeque::with_capacity(32),
            owner: None,
        }
    }

    fn reset(&mut self) {
        self.guid_map.clear();
        self.active.clear();
        self.recent_lifecycle.clear();
        self.owner = None;
    }

    fn set_owner_from_content(&mut self, content: &str) {
        if let Some(handle) = extract_log_owner(content) {
            self.owner = Some(handle);
        }
    }

    fn try_update_owner_from_line(&mut self, line: &str) {
        if let Some(handle) = extract_log_owner_from_line(line) {
            self.owner = Some(handle);
        }
    }

    fn current_owner(&self) -> String {
        self.owner.clone().unwrap_or_default()
    }

    fn record_marker(&mut self, guid: &str, _generator: &str, contract: &str) {
        if !self.guid_map.contains_key(guid) {
            self.guid_map.insert(
                guid.to_string(),
                MissionEntry {
                    debug_name: contract.to_string(),
                },
            );
        }
    }

    fn record_accepted(&mut self, guid: &str, ts: f64) -> Option<()> {
        let entry = self.guid_map.get(guid)?;
        let debug_name = entry.debug_name.clone();
        self.active.insert(
            guid.to_string(),
            ActiveMission {
                debug_name: debug_name.clone(),
            },
        );
        self.recent_lifecycle.push_back(MissionLifecycleEvent {
            trigger: "accept".to_string(),
            guid: guid.to_string(),
            debug_name,
            ts,
        });
        if self.recent_lifecycle.len() > 32 {
            self.recent_lifecycle.pop_front();
        }
        Some(())
    }

    fn record_end(&mut self, guid: &str, completion: &str, ts: f64) {
        let active = self.active.remove(guid);
        if completion == "Complete" {
            let debug_name = active
                .as_ref()
                .map(|a| a.debug_name.clone())
                .or_else(|| {
                    self.guid_map
                        .get(guid)
                        .map(|e| e.debug_name.clone())
                })
                .unwrap_or_else(|| "?".to_string());
            self.recent_lifecycle.push_back(MissionLifecycleEvent {
                trigger: "complete".to_string(),
                guid: guid.to_string(),
                debug_name,
                ts,
            });
            if self.recent_lifecycle.len() > 32 {
                self.recent_lifecycle.pop_front();
            }
        }
    }

    fn correlate_blueprint(&self, ts: f64) -> Option<MissionLifecycleEvent> {
        let mut best: Option<&MissionLifecycleEvent> = None;
        let mut best_delta = BLUEPRINT_CORRELATION_WINDOW_SEC + 1.0;
        for e in &self.recent_lifecycle {
            let delta = ts - e.ts;
            if (0.0..=BLUEPRINT_CORRELATION_WINDOW_SEC).contains(&delta) && delta < best_delta {
                best = Some(e);
                best_delta = delta;
            }
        }
        best.cloned()
    }
}

fn parse_log_timestamp(line: &str) -> Option<f64> {
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r"<(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)>").unwrap());
    let caps = re.captures(line)?;
    let raw = caps.get(1)?.as_str().replace('Z', "+00:00");
    DateTime::parse_from_rfc3339(&raw)
        .ok()
        .map(|dt| dt.timestamp() as f64 + f64::from(dt.timestamp_subsec_micros()) / 1_000_000.0)
        .or_else(|| {
            chrono::NaiveDateTime::parse_from_str(&raw, "%Y-%m-%dT%H:%M:%S%.f%z")
                .ok()
                .map(|dt| dt.and_utc().timestamp() as f64)
        })
}

struct LogPatterns {
    marker: Regex,
    accepted: Regex,
    end_mission: Regex,
    /// EN / FR (communauté) : `(?:Received Blueprint|Schémas reçu) : (nom):`
    blueprint_reward: Regex,
}

impl LogPatterns {
    fn new() -> Self {
        Self {
            marker: Regex::new(
                r"CreateMarker.*missionId \[([^\]]+)\].*generator name \[([^\]]+)\].*contract \[([^\]]+)\]",
            )
            .expect("marker regex"),
            accepted: Regex::new(
                r#"(?i)Added notification "(?:Contract Accepted|Contrat accepté|CONTRAT ACCEPTÉ).*?MissionId: \[([^\]]+)\]"#,
            )
            .expect("accepted regex"),
            end_mission: Regex::new(
                r"<EndMission>.*MissionId\[([^\]]+)\].*CompletionType\[(\w+)\].*Reason\[([^\]]+)\]",
            )
            .expect("end mission regex"),
            blueprint_reward: Regex::new(
                r"(?:Received Blueprint: (.+?):|Sch[eé]mas? reçus? : (.+?):)",
            )
            .expect("blueprint reward regex"),
        }
    }
}

fn log_patterns() -> &'static LogPatterns {
    static PATTERNS: std::sync::OnceLock<LogPatterns> = std::sync::OnceLock::new();
    PATTERNS.get_or_init(LogPatterns::new)
}

fn extract_blueprint_product_name(line: &str, patterns: &LogPatterns) -> Option<String> {
    let caps = patterns.blueprint_reward.captures(line)?;
    let name = caps.get(1).or_else(|| caps.get(2))?;
    Some(name.as_str().trim().to_string())
}

fn handle_regex() -> &'static Regex {
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    RE.get_or_init(|| Regex::new(r"Handle\[([^\]]+)\]").expect("handle regex"))
}

fn nickname_regex() -> &'static Regex {
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    RE.get_or_init(|| Regex::new(r#"nickname="([^"]+)""#).expect("nickname regex"))
}

/// Extrait le handle RSI depuis une ligne de log (login legacy, réseau, etc.).
pub fn extract_log_owner_from_line(line: &str) -> Option<String> {
    if let Some(caps) = handle_regex().captures(line) {
        let handle = caps.get(1)?.as_str().trim();
        if !handle.is_empty() {
            return Some(handle.to_string());
        }
    }
    if let Some(caps) = nickname_regex().captures(line) {
        let nick = caps.get(1)?.as_str().trim();
        if !nick.is_empty() {
            return Some(nick.to_string());
        }
    }
    None
}

/// Extrait le handle RSI depuis le contenu d'un fichier log (scan login en tête de fichier).
pub fn extract_log_owner(content: &str) -> Option<String> {
    for (i, line) in content.lines().enumerate() {
        if i >= OWNER_SCAN_MAX_LINES {
            break;
        }
        if let Some(handle) = extract_log_owner_from_line(line) {
            return Some(handle);
        }
    }
    None
}

fn process_line(line: &str, state: &mut WatcherState) -> Option<BlueprintEntry> {
    let ts = parse_log_timestamp(line).unwrap_or_else(|| Utc::now().timestamp() as f64);
    let patterns = log_patterns();

    state.try_update_owner_from_line(line);

    if let Some(caps) = patterns.marker.captures(line) {
        state.record_marker(
            caps.get(1)?.as_str(),
            caps.get(2)?.as_str(),
            caps.get(3)?.as_str(),
        );
        return None;
    }

    if let Some(caps) = patterns.accepted.captures(line) {
        state.record_accepted(caps.get(1)?.as_str(), ts);
        return None;
    }

    if let Some(caps) = patterns.end_mission.captures(line) {
        state.record_end(caps.get(1)?.as_str(), caps.get(2)?.as_str(), ts);
        return None;
    }

    if let Some(product_name) = extract_blueprint_product_name(line, patterns) {
        let corr = state.correlate_blueprint(ts);
        return Some(BlueprintEntry {
            owner: state.current_owner(),
            product_name,
            ts,
            mission_guid: corr.as_ref().map(|c| c.guid.clone()),
            mission_debug_name: corr.as_ref().map(|c| c.debug_name.clone()),
            mission_trigger: corr.as_ref().map(|c| c.trigger.clone()),
        });
    }

    None
}

/// Lit un fichier log en UTF-8 permissif (évite les échecs silencieux sur octets invalides).
fn read_log_file_lossy(path: &Path) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| format!("Impossible de lire {}: {e}", path.display()))?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

/// Import historique : extrait tous les blueprints via le motif communautaire (sans corrélation mission).
fn scan_file_for_blueprints(path: &Path) -> Result<Vec<BlueprintEntry>, String> {
    let patterns = log_patterns();
    let mut blueprints = Vec::new();
    let content = read_log_file_lossy(path)?;
    let owner = extract_log_owner(&content).unwrap_or_default();
    for line in content.lines() {
        if line.is_empty() {
            continue;
        }
        if let Some(product_name) = extract_blueprint_product_name(line, patterns) {
            let ts = parse_log_timestamp(line).unwrap_or(0.0);
            blueprints.push(BlueprintEntry {
                owner: owner.clone(),
                product_name,
                ts,
                mission_guid: None,
                mission_debug_name: None,
                mission_trigger: None,
            });
        }
    }
    Ok(blueprints)
}

// ---------------------------------------------------------------------------
// Log tailer (blocking thread)
// ---------------------------------------------------------------------------

fn run_log_tailer(app: AppHandle, log_path: PathBuf, stop: Arc<AtomicBool>) {
    let mut state = WatcherState::new();
    let mut file: Option<File> = None;
    let mut last_size: u64 = 0;
    let mut buffer = Vec::new();
    let mut first_open = true;

    while !stop.load(Ordering::Relaxed) {
        let metadata = match fs::metadata(&log_path) {
            Ok(m) => m,
            Err(_) => {
                file = None;
                last_size = 0;
                buffer.clear();
                thread::sleep(Duration::from_secs(1));
                continue;
            }
        };

        let current_size = metadata.len();
        let rotated = file.is_none() || current_size < last_size;

        if rotated {
            if file.is_some() {
                state.reset();
            }
            if let Ok(content) = read_log_file_lossy(&log_path) {
                state.set_owner_from_content(&content);
            }
            match File::open(&log_path) {
                Ok(mut f) => {
                    if !first_open {
                        let _ = f.seek(SeekFrom::Start(0));
                    }
                    file = Some(f);
                    last_size = 0;
                    buffer.clear();
                    first_open = false;
                }
                Err(_) => {
                    file = None;
                    thread::sleep(Duration::from_secs(1));
                    continue;
                }
            }
        }

        let Some(f) = file.as_mut() else {
            thread::sleep(TAIL_POLL_INTERVAL);
            continue;
        };

        let mut chunk = Vec::new();
        match f.read_to_end(&mut chunk) {
            Ok(0) => {
                thread::sleep(TAIL_POLL_INTERVAL);
                continue;
            }
            Ok(_) => {}
            Err(e) => {
                eprintln!("[gamelog_watcher] read failed: {e}");
                thread::sleep(Duration::from_secs(1));
                continue;
            }
        }

        buffer.extend_from_slice(&chunk);
        while let Some(pos) = buffer.iter().rposition(|&b| b == b'\n') {
            let block = buffer.drain(..=pos).collect::<Vec<_>>();
            let text = String::from_utf8_lossy(&block);
            for line in text.lines() {
                if line.is_empty() {
                    continue;
                }
                if let Some(entry) = process_line(line, &mut state) {
                    if let Err(e) = append_blueprints(&app, &[entry]) {
                        eprintln!("[gamelog_watcher] failed to save blueprint: {e}");
                    }
                }
            }
        }
        last_size = current_size;
    }
}

// ---------------------------------------------------------------------------
// Watcher service state
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct GamelogWatcherState {
    pub is_running: Arc<Mutex<bool>>,
    stop_flag: Arc<Mutex<Option<Arc<AtomicBool>>>>,
    thread_handle: Arc<Mutex<Option<JoinHandle<()>>>>,
}

impl Default for GamelogWatcherState {
    fn default() -> Self {
        Self {
            is_running: Arc::new(Mutex::new(false)),
            stop_flag: Arc::new(Mutex::new(None)),
            thread_handle: Arc::new(Mutex::new(None)),
        }
    }
}

pub fn start_gamelog_watcher_internal(
    state: &GamelogWatcherState,
    app: AppHandle,
) -> Result<(), String> {
    {
        let running = state.is_running.lock().map_err(|e| e.to_string())?;
        if *running {
            return Err("La surveillance du Game.log est déjà active".to_string());
        }
    }

    let log_path = get_live_game_log_path_sync()?;
    let stop = Arc::new(AtomicBool::new(false));
    let stop_clone = Arc::clone(&stop);
    let app_clone = app.clone();

    let handle = thread::Builder::new()
        .name("gamelog-watcher".into())
        .spawn(move || run_log_tailer(app_clone, log_path, stop_clone))
        .map_err(|e| e.to_string())?;

    {
        let mut running = state.is_running.lock().map_err(|e| e.to_string())?;
        *running = true;
    }
    {
        let mut stop_guard = state.stop_flag.lock().map_err(|e| e.to_string())?;
        *stop_guard = Some(stop);
    }
    {
        let mut thread_guard = state.thread_handle.lock().map_err(|e| e.to_string())?;
        *thread_guard = Some(handle);
    }

    let mut config = load_gamelog_watcher_config_sync(&app)?;
    config.enabled = true;
    save_gamelog_watcher_config_sync(&app, &config)?;

    Ok(())
}

pub fn stop_gamelog_watcher_internal(
    state: &GamelogWatcherState,
    app: &AppHandle,
) -> Result<(), String> {
    {
        let running = state.is_running.lock().map_err(|e| e.to_string())?;
        if !*running {
            return Ok(());
        }
    }

    let stop = {
        let guard = state.stop_flag.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };
    if let Some(stop) = stop {
        stop.store(true, Ordering::Relaxed);
    }

    if let Ok(mut thread_guard) = state.thread_handle.lock() {
        if let Some(handle) = thread_guard.take() {
            let _ = handle.join();
        }
    }

    {
        let mut running = state.is_running.lock().map_err(|e| e.to_string())?;
        *running = false;
    }
    {
        let mut stop_guard = state.stop_flag.lock().map_err(|e| e.to_string())?;
        *stop_guard = None;
    }

    let mut config = load_gamelog_watcher_config_sync(app)?;
    config.enabled = false;
    save_gamelog_watcher_config_sync(app, &config)?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[command]
pub fn load_gamelog_blueprints(app: AppHandle) -> Result<BlueprintStoreFile, String> {
    load_blueprint_store_sync(&app)
}

#[command]
pub fn load_gamelog_watcher_config(app: AppHandle) -> Result<GamelogWatcherConfig, String> {
    load_gamelog_watcher_config_sync(&app)
}

#[command]
pub fn save_gamelog_watcher_config(
    app: AppHandle,
    config: GamelogWatcherConfig,
) -> Result<(), String> {
    save_gamelog_watcher_config_sync(&app, &config)
}

#[command]
pub fn get_gamelog_watcher_status(
    app: AppHandle,
    state: State<'_, GamelogWatcherState>,
) -> Result<GamelogWatcherStatus, String> {
    let watching = state
        .is_running
        .lock()
        .map(|r| *r)
        .map_err(|e| e.to_string())?;
    let log_path = get_live_game_log_path_sync()
        .ok()
        .map(|p| p.to_string_lossy().into_owned());
    let store = load_blueprint_store_sync(&app)?;
    Ok(GamelogWatcherStatus {
        watching,
        log_path,
        blueprint_count: store.blueprints.len(),
    })
}

#[command]
pub async fn start_gamelog_watcher(
    app: AppHandle,
    state: State<'_, GamelogWatcherState>,
) -> Result<(), String> {
    start_gamelog_watcher_internal(state.inner(), app)
}

#[command]
pub async fn stop_gamelog_watcher(
    app: AppHandle,
    state: State<'_, GamelogWatcherState>,
) -> Result<(), String> {
    stop_gamelog_watcher_internal(state.inner(), &app)
}

fn export_gamelog_blueprints_sync(app: &AppHandle) -> Result<Option<String>, String> {
    let store = load_blueprint_store_sync(app)?;
    let destination = app
        .dialog()
        .file()
        .set_title("Exporter les blueprints")
        .set_file_name("gamelog_blueprints.json")
        .add_filter("JSON", &["json"])
        .blocking_save_file();

    let Some(destination) = destination else {
        return Ok(None);
    };

    let path = destination
        .into_path()
        .map_err(|e| e.to_string())?;

    let json = serde_json::to_string_pretty(&store).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;

    Ok(Some(path.to_string_lossy().into_owned()))
}

#[command]
pub async fn export_gamelog_blueprints(app: AppHandle) -> Result<Option<String>, String> {
    tokio::task::spawn_blocking(move || export_gamelog_blueprints_sync(&app))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn import_blueprints_from_logbackups(
    app: AppHandle,
    include_current: Option<bool>,
) -> Result<ImportBlueprintsResult, String> {
    let include_current = include_current.unwrap_or(false);
    let game_log = get_live_game_log_path_sync()?;
    let game_log_path = game_log.display().to_string();
    let logbackups = game_log.parent().unwrap().join("logbackups");
    if !logbackups.is_dir() {
        return Err(format!(
            "Dossier logbackups introuvable : {}",
            logbackups.display()
        ));
    }

    let mut files: Vec<PathBuf> = fs::read_dir(&logbackups)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            p.is_file()
                && p.extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.eq_ignore_ascii_case("log"))
                    .unwrap_or(false)
        })
        .collect();
    files.sort();

    if include_current && game_log.is_file() {
        if !files.iter().any(|p| p == &game_log) {
            files.push(game_log.clone());
        }
    }

    if files.is_empty() {
        return Err(format!(
            "Aucun fichier .log dans logbackups ({}) ni Game.log ({})",
            logbackups.display(),
            game_log_path
        ));
    }

    let mut all_incoming = Vec::new();
    let mut read_errors = Vec::new();
    let mut files_failed = 0usize;
    let mut files_with_matches = 0usize;
    for path in &files {
        match scan_file_for_blueprints(path) {
            Ok(found) => {
                if !found.is_empty() {
                    files_with_matches += 1;
                    all_incoming.extend(found);
                }
            }
            Err(e) => {
                files_failed += 1;
                let name = path
                    .file_name()
                    .map(|n| n.to_string_lossy().into_owned())
                    .unwrap_or_else(|| path.display().to_string());
                read_errors.push(format!("{name}: {e}"));
            }
        }
    }

    let matches_found = all_incoming.len();
    let unique_products_found = all_incoming
        .iter()
        .map(|e| e.product_name.as_str())
        .collect::<HashSet<_>>()
        .len();
    let added = append_blueprints(&app, &all_incoming)?;
    let removed_without_owner = prune_blueprint_store_sync(&app)?;
    let store_after = load_blueprint_store_sync(&app)?;

    Ok(ImportBlueprintsResult {
        imported: added,
        total: store_after.blueprints.len(),
        files_scanned: files.len(),
        matches_found,
        files_with_matches,
        unique_products_found,
        files_failed,
        log_directory: logbackups.display().to_string(),
        game_log_path,
        read_errors: read_errors.into_iter().take(5).collect(),
        removed_without_owner,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_log_owner_from_legacy_login_line() {
        let line = r#"<2026-05-16T11:28:35.195Z> [Notice] <Legacy login response> [CIG-net] User Login Success - Handle[Onivoid] - Time[290632136] [Team_GameServices][Login]"#;
        assert_eq!(
            extract_log_owner_from_line(line).as_deref(),
            Some("Onivoid")
        );
    }

    #[test]
    fn extract_log_owner_from_nickname_line() {
        let line = r#"[Notice] <Channel Created> nickname="TestHandle" playerGEID=123"#;
        assert_eq!(
            extract_log_owner_from_line(line).as_deref(),
            Some("TestHandle")
        );
    }

    #[test]
    fn prune_blueprints_without_owner_removes_empty_handles() {
        let entries = vec![
            BlueprintEntry {
                owner: "Onivoid".to_string(),
                product_name: "A".to_string(),
                ts: 1.0,
                mission_guid: None,
                mission_debug_name: None,
                mission_trigger: None,
            },
            BlueprintEntry {
                owner: "".to_string(),
                product_name: "B".to_string(),
                ts: 2.0,
                mission_guid: None,
                mission_debug_name: None,
                mission_trigger: None,
            },
            BlueprintEntry {
                owner: "   ".to_string(),
                product_name: "C".to_string(),
                ts: 3.0,
                mission_guid: None,
                mission_debug_name: None,
                mission_trigger: None,
            },
        ];
        let (kept, removed) = prune_blueprints_without_owner(&entries);
        assert_eq!(kept.len(), 1);
        assert_eq!(removed, 2);
        assert_eq!(kept[0].product_name, "A");
    }

    #[test]
    fn merge_blueprint_entries_keeps_same_product_for_different_owners() {
        let existing = vec![BlueprintEntry {
            owner: "Alpha".to_string(),
            product_name: "Torse X".to_string(),
            ts: 100.0,
            mission_guid: None,
            mission_debug_name: None,
            mission_trigger: None,
        }];
        let incoming = vec![BlueprintEntry {
            owner: "Beta".to_string(),
            product_name: "Torse X".to_string(),
            ts: 200.0,
            mission_guid: None,
            mission_debug_name: None,
            mission_trigger: None,
        }];
        let (merged, added) = merge_blueprint_entries(&existing, &incoming);
        assert_eq!(merged.len(), 2);
        assert_eq!(added, 1);
        assert!(merged.iter().any(|e| e.owner == "Alpha"));
        assert!(merged.iter().any(|e| e.owner == "Beta"));
    }

    #[test]
    fn blueprint_reward_matches_french_notification_line() {
        let line = r#"<2026-05-16T11:56:52.707Z> [Notice] <SHUDEvent_OnNotification> Added notification "Schémas reçu : Jambes Morozov-SH Thule: " [41] to queue. New queue size: 2, MissionId: [00000000-0000-0000-0000-000000000000], ObjectiveId: []"#;
        let name = extract_blueprint_product_name(line, log_patterns()).unwrap();
        assert_eq!(name, "Jambes Morozov-SH Thule");
    }

    #[test]
    fn blueprint_reward_matches_english_notification_line() {
        let line = r#"Added notification "Received Blueprint: Morozov Legs: " [41] to queue"#;
        let name = extract_blueprint_product_name(line, log_patterns()).unwrap();
        assert_eq!(name, "Morozov Legs");
    }

    #[test]
    fn scan_blueprint_exemple_log_file() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../BlueprintExemple.log");
        let found = scan_file_for_blueprints(&path).expect("scan exemple");
        assert!(
            found
                .iter()
                .any(|e| e.product_name == "Jambes Morozov-SH Thule"),
            "expected Morozov blueprint, got: {:?}",
            found
                .iter()
                .map(|e| &e.product_name)
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn scan_examples_log_file() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../Examples.log");
        let found = scan_file_for_blueprints(&path).expect("scan examples");
        assert!(
            found.len() >= 3,
            "expected at least 3 blueprint lines, got {}: {:?}",
            found.len(),
            found.iter().map(|e| &e.product_name).collect::<Vec<_>>()
        );
        assert!(found.iter().any(|e| e.product_name == "Jambes Monde"));
        assert!(found.iter().any(|e| e.product_name == "Torse Antium Désert"));
        assert!(found.iter().any(|e| e.product_name == "Jambes Palatino Sunstone"));
    }

    /// Vérifie le scan sur l'installation LIVE réelle (ignoré si SC absent).
    #[test]
    fn scan_live_logbackups_when_installed() {
        let Ok(game_log) = get_live_game_log_path_sync() else {
            eprintln!("skip: LIVE non détecté");
            return;
        };
        let logbackups = game_log.parent().unwrap().join("logbackups");
        if !logbackups.is_dir() {
            eprintln!("skip: pas de dossier logbackups");
            return;
        }
        let mut total = 0usize;
        let mut files_with_hits = 0usize;
        let entries: Vec<_> = fs::read_dir(&logbackups)
            .ok()
            .into_iter()
            .flatten()
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| {
                p.is_file()
                    && p.extension()
                        .and_then(|e| e.to_str())
                        .map(|e| e.eq_ignore_ascii_case("log"))
                        .unwrap_or(false)
            })
            .collect();
        for path in &entries {
            if let Ok(found) = scan_file_for_blueprints(path) {
                if !found.is_empty() {
                    files_with_hits += 1;
                    total += found.len();
                }
            }
        }
        assert!(
            total > 0,
            "aucun schéma dans {} fichier(s) LIVE logbackups ({})",
            entries.len(),
            logbackups.display()
        );
        eprintln!(
            "LIVE: {} schéma(s) dans {}/{} fichier(s)",
            total,
            files_with_hits,
            entries.len()
        );
    }

    #[test]
    fn scan_game_build_backup_log_file() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../Game Build(11715810) 03 May 26 (11 44 39).log");
        if !path.exists() {
            eprintln!("skip: game build fixture not present");
            return;
        }
        let found = scan_file_for_blueprints(&path).expect("scan game build");
        assert!(
            found.iter().any(|e| e.product_name == "Torse Antium Désert"),
            "expected Torse Antium Désert, got {} entries: {:?}",
            found.len(),
            found
                .iter()
                .map(|e| &e.product_name)
                .collect::<Vec<_>>()
        );
        assert!(
            found
                .iter()
                .filter(|e| e.product_name == "Torse Antium Désert")
                .all(|e| e.owner == "Onivoid"),
            "expected owner Onivoid on game build entries, got: {:?}",
            found
                .iter()
                .map(|e| (&e.owner, &e.product_name))
                .collect::<Vec<_>>()
        );
    }
}
