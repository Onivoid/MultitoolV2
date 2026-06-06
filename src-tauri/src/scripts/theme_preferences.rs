use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;
use tauri::path::PathResolver;
use tauri::Manager;
use tauri::Runtime;

#[command]
fn get_theme_config_file_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let config_dir = path.app_config_dir().map_err(|_| {
        "Impossible d'obtenir le répertoire de configuration de l'application".to_string()
    })?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    let config_file = config_dir.join("theme_selected.json");
    Ok(config_file)
}

fn default_synthesis_color2() -> String {
    "#633189".to_string()
}

fn default_synthesis_speed() -> f32 {
    0.35
}

fn default_synthesis_glow_intensity() -> f32 {
    0.4
}

fn default_synthesis_distortion() -> f32 {
    0.7
}

fn default_synthesis_complexity() -> f32 {
    7.0
}

fn default_synthesis_flow_frequency() -> f32 {
    5.9
}

fn default_synthesis_scale() -> f32 {
    1.2
}

fn default_synthesis_contrast() -> f32 {
    1.25
}

fn default_overlay_opacity() -> f32 {
    0.48
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ThemeSelected {
    primary_color: String,
    #[serde(default = "default_synthesis_color2")]
    synthesis_color2: String,
    #[serde(default = "default_synthesis_speed")]
    synthesis_speed: f32,
    #[serde(default = "default_synthesis_glow_intensity")]
    synthesis_glow_intensity: f32,
    #[serde(default = "default_synthesis_distortion")]
    synthesis_distortion: f32,
    #[serde(default = "default_synthesis_complexity")]
    synthesis_complexity: f32,
    #[serde(default = "default_synthesis_flow_frequency")]
    synthesis_flow_frequency: f32,
    #[serde(default = "default_synthesis_scale")]
    synthesis_scale: f32,
    #[serde(default = "default_synthesis_contrast")]
    synthesis_contrast: f32,
    #[serde(default = "default_overlay_opacity")]
    overlay_opacity: f32,
}

/// Sauvegarde les préférences de thème dans un fichier JSON.
#[command]
pub fn save_theme_selected(app: tauri::AppHandle, data: ThemeSelected) -> Result<(), String> {
    let config_path = get_theme_config_file_path(app.path()).map_err(|e| e.to_string())?;
    let json_data = serde_json::to_string(&data).map_err(|e| e.to_string())?;
    fs::write(config_path, json_data).map_err(|e| e.to_string())
}

/// Charge les préférences de thème depuis un fichier JSON.
#[command]
pub fn load_theme_selected(app: tauri::AppHandle) -> Result<ThemeSelected, String> {
    let config_path = get_theme_config_file_path(app.path()).map_err(|e| e.to_string())?;
    if !config_path.exists() {
        return Ok(ThemeSelected {
            primary_color: "#6463b6".to_string(),
            synthesis_color2: default_synthesis_color2(),
            synthesis_speed: default_synthesis_speed(),
            synthesis_glow_intensity: default_synthesis_glow_intensity(),
            synthesis_distortion: default_synthesis_distortion(),
            synthesis_complexity: default_synthesis_complexity(),
            synthesis_flow_frequency: default_synthesis_flow_frequency(),
            synthesis_scale: default_synthesis_scale(),
            synthesis_contrast: default_synthesis_contrast(),
            overlay_opacity: default_overlay_opacity(),
        });
    }
    let json_data = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let data: ThemeSelected = serde_json::from_str(&json_data).map_err(|e| e.to_string())?;

    Ok(data)
}
