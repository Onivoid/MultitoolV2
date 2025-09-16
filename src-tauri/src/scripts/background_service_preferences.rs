use std::fs;
use std::path::PathBuf;
use tauri::command;

use crate::scripts::background_service::BackgroundServiceConfig;

const CONFIG_FILE: &str = "background_service.json";

#[command]
pub fn save_background_service_config(config: BackgroundServiceConfig) -> Result<(), String> {
    let config_dir = get_config_dir()?;
    let config_path = config_dir.join(CONFIG_FILE);
    
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, json).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub fn load_background_service_config() -> Result<BackgroundServiceConfig, String> {
    let config_dir = get_config_dir()?;
    let config_path = config_dir.join(CONFIG_FILE);
    
    if !config_path.exists() {
        return Ok(BackgroundServiceConfig::default());
    }
    
    let content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: BackgroundServiceConfig = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    Ok(config)
}

fn get_config_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let config_dir = home.join(".multitool");
    
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(config_dir)
}