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

    // Créer le répertoire s'il n'existe pas
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }

    // Nom du fichier de configuration
    let config_file = config_dir.join("translations_selected.json");
    Ok(config_file)
}

// Dans translation_preferences.rs

#[derive(Serialize, Deserialize)]
pub struct TranslationSetting {
    pub link: Option<String>,
    #[serde(rename = "settingsEN")]
    pub settings_en: bool,
}

// Implémentation de Default pour TranslationSetting
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

// Implémentation de Default pour TranslationsSelected
impl Default for TranslationsSelected {
    fn default() -> Self {
        Self(serde_json::json!({}))
    }
}

impl TranslationsSelected {
    /// Accède à la valeur JSON interne
    pub fn as_value(&self) -> &serde_json::Value {
        &self.0
    }
}

#[command]
pub fn save_translations_selected(
    app: tauri::AppHandle,
    data: TranslationsSelected,
) -> Result<(), String> {
    println!("Sauvegarde des préférences de traduction:");

    // Obtenir le chemin du fichier de configuration
    let config_path = get_config_file_path(app.path()).map_err(|e| e.to_string())?;

    // Convertir les données en JSON
    let json_data = serde_json::to_string(&data).map_err(|e| e.to_string())?;
    println!("JSON à sauvegarder: {}", json_data);

    // Écrire les données dans le fichier
    fs::write(config_path, json_data).map_err(|e| e.to_string())
}

#[command]
pub fn load_translations_selected(app: tauri::AppHandle) -> Result<TranslationsSelected, String> {
    let config_path = get_config_file_path(app.path()).map_err(|e| e.to_string())?;
    if !config_path.exists() {
        // Si le fichier n'existe pas, retourner des valeurs par défaut
        return Ok(TranslationsSelected::default());
    }

    // Lire le contenu du fichier
    let json_data = fs::read_to_string(config_path.clone()).map_err(|e| e.to_string())?;

    // Essayer de désérialiser dans le nouveau format
    match serde_json::from_str::<TranslationsSelected>(&json_data) {
        Ok(data) => {
            println!("Données chargées avec succès au format standard");
            Ok(data)
        }
        Err(e) => {
            println!("Erreur de désérialisation au format standard: {}", e);
            println!("Tentative de conversion depuis l'ancien format");

            // Si le format est ancien, essayer de le convertir
            let converted = convert_old_format(&json_data)?;

            // Sauvegarder immédiatement au nouveau format pour éviter de reconvertir à chaque fois
            // (cette étape est facultative mais recommandée)
            let new_json = serde_json::to_string(&converted).map_err(|e| e.to_string())?;
            fs::write(config_path, new_json).map_err(|e| e.to_string())?;

            println!("Données converties et sauvegardées au nouveau format");
            Ok(converted)
        }
    }
}

// Fonction pour convertir l'ancien format vers le nouveau
fn convert_old_format(json_str: &str) -> Result<TranslationsSelected, String> {
    println!("Tentative de conversion depuis l'ancien format...");

    // D'abord, essayons de voir si c'est déjà un objet JSON
    let new_data = TranslationsSelected::default();

    if let Ok(old_data) = serde_json::from_str::<serde_json::Value>(json_str) {
        return Ok(TranslationsSelected(old_data));
    }

    // Cas 2: Si c'est juste une chaîne URL unique (non entourée d'accolades JSON)
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

    // Cas 3: Dernier recours, essayer de parser comme une Value générique
    match serde_json::from_str::<serde_json::Value>(json_str) {
        Ok(old_data) => {
            if let Some(obj) = old_data.as_object() {
                // Créer un nouvel objet JSON pour stocker les données converties
                let mut new_json_obj = serde_json::Map::new();

                for (key, value) in obj {
                    // Si c'est une chaîne, c'était un ancien lien
                    if let Some(link_str) = value.as_str() {
                        // Créer un objet TranslationSetting en JSON
                        let setting_json = serde_json::json!({
                            "link": link_str,
                            "settingsEN": false
                        });

                        // L'ajouter directement à l'objet JSON avec la clé originale
                        new_json_obj.insert(key.clone(), setting_json);
                    }
                    // Si c'est déjà un objet avec la structure correcte, le garder tel quel
                    else if value.is_object() {
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

    // En cas d'échec de toutes les tentatives, retourner la structure par défaut
    println!("Toutes les tentatives de conversion ont échoué, utilisation des valeurs par défaut");
    Ok(new_data)
}
