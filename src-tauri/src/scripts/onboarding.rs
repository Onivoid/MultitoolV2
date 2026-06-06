use serde::{Deserialize, Serialize};
use std::fs;
use tauri::command;
use tauri::Manager;

const FILE_NAME: &str = "onboarding.json";

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingState {
    pub onboarding_done: bool,
    #[serde(default)]
    pub attempts: u32,
    #[serde(default)]
    pub was_completed: bool,
}

fn config_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?;
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir.join(FILE_NAME))
}

fn read_state(app: &tauri::AppHandle) -> OnboardingState {
    let path = match config_path(app) {
        Ok(p) => p,
        Err(_) => return OnboardingState::default(),
    };
    if !path.exists() {
        return OnboardingState::default();
    }
    fs::read_to_string(&path)
        .ok()
        .and_then(|raw| serde_json::from_str::<OnboardingState>(&raw).ok())
        .unwrap_or_default()
}

fn write_state(app: &tauri::AppHandle, state: &OnboardingState) -> Result<(), String> {
    let path = config_path(app)?;
    let json = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[command]
pub fn get_onboarding_state(app: tauri::AppHandle) -> Result<OnboardingState, String> {
    Ok(read_state(&app))
}

#[command]
pub fn record_onboarding_attempt(app: tauri::AppHandle) -> Result<OnboardingState, String> {
    let mut state = read_state(&app);
    state.attempts = state.attempts.saturating_add(1);
    write_state(&app, &state)?;
    Ok(state)
}

#[command]
pub fn complete_onboarding(app: tauri::AppHandle) -> Result<(), String> {
    let mut state = read_state(&app);
    state.onboarding_done = true;
    state.was_completed = true;
    write_state(&app, &state)
}

#[command]
pub fn reset_onboarding(app: tauri::AppHandle) -> Result<(), String> {
    let mut state = read_state(&app);
    state.onboarding_done = false;
    write_state(&app, &state)
}
