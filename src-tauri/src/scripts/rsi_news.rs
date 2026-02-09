use tauri::command;

const RSI_FEED_URL: &str = "https://leonick.se/feeds/rsi/json";

#[command]
pub async fn fetch_rsi_news() -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(RSI_FEED_URL)
        .header("User-Agent", "MultitoolV2")
        .send()
        .await
        .map_err(|e| format!("Erreur lors de la requête: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erreur HTTP: {}", response.status()));
    }

    response
        .text()
        .await
        .map_err(|e| format!("Erreur lors de la lecture de la réponse: {}", e))
}
