use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::path::PathResolver;
use tauri::Runtime;
use tauri::{command, Manager};

fn get_config_file_path(path: &PathResolver<impl Runtime>) -> Result<PathBuf, String> {
    let config_dir = path.app_config_dir().map_err(|_| {
        "Impossible d'obtenir le répertoire de configuration de l'application".to_string()
    })?;

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }

    let config_file = config_dir.join("translations_selected.json");
    Ok(config_file)
}

#[derive(Serialize, Deserialize)]
pub struct TranslationSetting {
    pub link: Option<String>,
    #[serde(rename = "settingsEN")]
    pub settings_en: bool,
}

impl Default for TranslationSetting {
    fn default() -> Self {
        Self {
            link: None,
            settings_en: false,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TranslationsSelected(serde_json::Value);

impl Default for TranslationsSelected {
    fn default() -> Self {
        Self(serde_json::json!({}))
    }
}

impl TranslationsSelected {
    pub fn as_value(&self) -> &serde_json::Value {
        &self.0
    }
}

/// Sauvegarde les préférences de traduction dans un fichier JSON.
#[command]
pub fn save_translations_selected(
    app: tauri::AppHandle,
    data: TranslationsSelected,
) -> Result<(), String> {
    println!("Sauvegarde des préférences de traduction:");

    let config_path = get_config_file_path(app.path()).map_err(|e| e.to_string())?;

    let json_data = serde_json::to_string(&data).map_err(|e| e.to_string())?;
    println!("JSON à sauvegarder: {}", json_data);

    fs::write(config_path, json_data).map_err(|e| e.to_string())
}

/// Charge les préférences de traduction depuis un fichier JSON.
#[command]
pub fn load_translations_selected(app: tauri::AppHandle) -> Result<TranslationsSelected, String> {
    let config_path = get_config_file_path(app.path()).map_err(|e| e.to_string())?;
    if !config_path.exists() {
        return Ok(TranslationsSelected::default());
    }

    let json_data = fs::read_to_string(config_path.clone()).map_err(|e| e.to_string())?;
    match serde_json::from_str::<TranslationsSelected>(&json_data) {
        Ok(data) => {
            println!("Données chargées avec succès au format standard");
            Ok(data)
        }
        Err(e) => {
            println!("Erreur de désérialisation au format standard: {}", e);
            println!("Tentative de conversion depuis l'ancien format");

            let converted = convert_old_format(&json_data)?;

            let new_json = serde_json::to_string(&converted).map_err(|e| e.to_string())?;
            fs::write(config_path, new_json).map_err(|e| e.to_string())?;

            println!("Données converties et sauvegardées au nouveau format");
            Ok(converted)
        }
    }
}

fn convert_old_format(json_str: &str) -> Result<TranslationsSelected, String> {
    println!("Tentative de conversion depuis l'ancien format...");

    // D'abord, essayons de voir si c'est déjà un objet JSON
    let new_data = TranslationsSelected::default();

    if let Ok(old_data) = serde_json::from_str::<serde_json::Value>(json_str) {
        return Ok(TranslationsSelected(old_data));
    }

    if !json_str.starts_with('{') && json_str.contains("github.com") {
        // C'est probablement juste une URL pour LIVE
        let json_value = serde_json::json!({
            "LIVE": {
                "link": json_str.trim_matches('"'),
                "settingsEN": false
            }
        });

        println!("Conversion réussie depuis une URL simple");
        return Ok(TranslationsSelected(json_value));
    }

    match serde_json::from_str::<serde_json::Value>(json_str) {
        Ok(old_data) => {
            if let Some(obj) = old_data.as_object() {
                let mut new_json_obj = serde_json::Map::new();

                for (key, value) in obj {
                    if let Some(link_str) = value.as_str() {
                        let setting_json = serde_json::json!({
                            "link": link_str,
                            "settingsEN": false
                        });

                        new_json_obj.insert(key.clone(), setting_json);
                    } else if value.is_object() {
                        new_json_obj.insert(key.clone(), value.clone());
                    }
                }

                println!("Conversion réussie depuis Value générique");
                return Ok(TranslationsSelected(serde_json::Value::Object(
                    new_json_obj,
                )));
            }
        }
        Err(e) => {
            println!("Échec de la conversion depuis Value générique: {}", e);
        }
    }

    println!("Toutes les tentatives de conversion ont échoué, utilisation des valeurs par défaut");
    Ok(new_data)
}
