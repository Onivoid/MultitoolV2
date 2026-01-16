use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::command;

/// Récupère la liste de toutes les traductions disponibles depuis l'API.
#[command]
pub async fn get_translations() -> Result<Value, String> {
    let response = reqwest::get("https://multitool.onivoid.fr/api/translations")
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(response)
}

#[derive(Serialize, Deserialize)]
pub struct TranslationLink {
    pub link: String,
}

/// Récupère le lien de traduction pour un type de version spécifique.
#[command]
pub async fn get_translation_by_setting(setting_type: String) -> Result<Value, String> {
    println!("Requesting translation for setting type: {}", setting_type);
    let url = format!(
        "https://multitool.onivoid.fr/api/translations/{}",
        setting_type
    );
    println!("URL: {}", url);

    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;

    let status = response.status();
    println!("Response status: {}", status);

    if !status.is_success() {
        return Err(format!("API returned error status: {}", status));
    }

    let text = response.text().await.map_err(|e| e.to_string())?;
    println!("Response body: {}", text);

    if text.starts_with('"') && text.ends_with('"') {
        let clean_url = text.trim_matches('"');
        return Ok(serde_json::json!({
            "link": clean_url
        }));
    }

    let json_result = serde_json::from_str::<Value>(&text);
    match json_result {
        Ok(json) => Ok(json),
        Err(e) => {
            println!("Error parsing JSON: {}", e);
            Ok(serde_json::json!({
                "link": text
            }))
        }
    }
}
