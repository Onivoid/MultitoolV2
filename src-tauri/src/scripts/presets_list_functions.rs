use serde_json::Value;
use tauri::command;

/// Récupère une liste de personnages depuis l'API Star Citizen Characters.
///
/// Supporte la pagination, le tri et la recherche.
#[command]
pub async fn get_characters(
    page: Option<u32>,
    order_type: Option<String>,
    search: Option<String>,
) -> Result<serde_json::Value, String> {
    let page = page.unwrap_or(1);
    let order = order_type.as_deref().unwrap_or("latest");
    let search_q = search.unwrap_or_default();

    let mut url = format!(
        "https://www.star-citizen-characters.com/api/heads?page={}&orderBy={}",
        page, order
    );
    if !search_q.is_empty() {
        url.push_str(&format!("&search={}", urlencoding::encode(&search_q)));
    }

    let resp: Value = reqwest::get(url)
        .await
        .map_err(|e| e.to_string())?
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    Ok(resp)
}
