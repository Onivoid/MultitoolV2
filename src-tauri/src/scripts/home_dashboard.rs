use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::path::PathResolver;
use tauri::{command, AppHandle, Manager, Runtime};

const SCHEMA_VERSION: u32 = 2;
const DEFAULT_WIDGET_WIDTH_PX: u32 = 280;
const MIN_WIDGET_WIDTH_PX: u32 = 220;
const MAX_WIDGET_WIDTH_PX: u32 = 480;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HomeWidgetInstance {
    pub id: String,
    #[serde(rename = "type")]
    pub widget_type: String,
    pub x_percent: f64,
    pub y_percent: f64,
    pub width_px: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HomeDashboardLayout {
    pub schema_version: u32,
    pub widgets: Vec<HomeWidgetInstance>,
}

impl Default for HomeDashboardLayout {
    fn default() -> Self {
        Self::default_layout()
    }
}

impl HomeDashboardLayout {
    pub fn default_layout() -> Self {
        Self {
            schema_version: SCHEMA_VERSION,
            widgets: vec![
                HomeWidgetInstance {
                    id: "default-top-routes".to_string(),
                    widget_type: "top_routes".to_string(),
                    x_percent: 2.0,
                    y_percent: 38.0,
                    width_px: DEFAULT_WIDGET_WIDTH_PX,
                },
                HomeWidgetInstance {
                    id: "default-blueprints".to_string(),
                    widget_type: "blueprints".to_string(),
                    x_percent: 36.0,
                    y_percent: 38.0,
                    width_px: 300,
                },
                HomeWidgetInstance {
                    id: "default-sc-versions".to_string(),
                    widget_type: "sc_versions".to_string(),
                    x_percent: 70.0,
                    y_percent: 38.0,
                    width_px: DEFAULT_WIDGET_WIDTH_PX,
                },
            ],
        }
    }
}

fn ensure_config_dir(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let config_dir = path
        .app_config_dir()
        .map_err(|_| "Impossible d'obtenir le répertoire de configuration".to_string())?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    Ok(config_dir)
}

fn layout_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    Ok(ensure_config_dir(path)?.join("home_dashboard.json"))
}

fn clamp_widget_width(width_px: u32) -> u32 {
    width_px.clamp(MIN_WIDGET_WIDTH_PX, MAX_WIDGET_WIDTH_PX)
}

fn normalize_loaded_layout(
    path: &PathResolver<impl Runtime>,
    mut layout: HomeDashboardLayout,
) -> Result<HomeDashboardLayout, String> {
    if layout.widgets.is_empty() {
        return Ok(HomeDashboardLayout::default_layout());
    }
    if layout.schema_version != SCHEMA_VERSION {
        layout.schema_version = SCHEMA_VERSION;
        let _ = save_layout(path, &layout);
    }
    for widget in &mut layout.widgets {
        widget.width_px = clamp_widget_width(widget.width_px);
    }
    Ok(layout)
}

fn load_layout(path: &PathResolver<impl Runtime>) -> Result<HomeDashboardLayout, String> {
    let file = layout_path(path)?;
    if !file.exists() {
        return Ok(HomeDashboardLayout::default_layout());
    }
    let data = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    let layout: HomeDashboardLayout = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    normalize_loaded_layout(path, layout)
}

fn save_layout(
    path: &PathResolver<impl Runtime>,
    layout: &HomeDashboardLayout,
) -> Result<(), String> {
    let file = layout_path(path)?;
    let json = serde_json::to_string_pretty(layout).map_err(|e| e.to_string())?;
    fs::write(file, json).map_err(|e| e.to_string())
}

#[command]
pub fn get_home_dashboard(app: AppHandle) -> Result<HomeDashboardLayout, String> {
    let resolver = app.path();
    load_layout(resolver)
}

#[command]
pub fn save_home_dashboard(app: AppHandle, mut layout: HomeDashboardLayout) -> Result<(), String> {
    layout.schema_version = SCHEMA_VERSION;
    for widget in &mut layout.widgets {
        widget.width_px = clamp_widget_width(widget.width_px);
    }
    let resolver = app.path();
    save_layout(resolver, &layout)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_layout_has_three_widgets() {
        let layout = HomeDashboardLayout::default_layout();
        assert_eq!(layout.widgets.len(), 3);
        assert_eq!(layout.widgets[0].widget_type, "top_routes");
        assert_eq!(layout.widgets[1].widget_type, "blueprints");
        assert_eq!(layout.widgets[2].widget_type, "sc_versions");
    }

    #[test]
    fn layout_roundtrip_json() {
        let layout = HomeDashboardLayout::default_layout();
        let json = serde_json::to_string(&layout).unwrap();
        let parsed: HomeDashboardLayout = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.widgets.len(), layout.widgets.len());
    }

    #[test]
    fn empty_layout_serializes() {
        let layout = HomeDashboardLayout {
            schema_version: SCHEMA_VERSION,
            widgets: vec![],
        };
        let json = serde_json::to_string(&layout).unwrap();
        let parsed: HomeDashboardLayout = serde_json::from_str(&json).unwrap();
        assert!(parsed.widgets.is_empty());
    }

    #[test]
    fn empty_widgets_uses_default_layout() {
        let layout = HomeDashboardLayout {
            schema_version: 1,
            widgets: vec![],
        };
        assert!(layout.widgets.is_empty());
        assert_eq!(HomeDashboardLayout::default_layout().widgets.len(), 3);
    }

    #[test]
    fn legacy_schema_preserves_widgets_in_memory() {
        let legacy = HomeDashboardLayout {
            schema_version: 1,
            widgets: vec![HomeWidgetInstance {
                id: "user-widget".to_string(),
                widget_type: "game_stats".to_string(),
                x_percent: 10.0,
                y_percent: 20.0,
                width_px: 280,
            }],
        };
        assert_eq!(legacy.widgets.len(), 1);
        assert_eq!(legacy.widgets[0].widget_type, "game_stats");
    }
}
