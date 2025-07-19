use tauri::command;

/*
    API URL : https://www.star-citizen-characters.com/api/heads?page=2&orderBy=latest
*/
#[command]
pub async fn get_characters(
    page: Option<u32>,
    order_type: Option<&str>,
    search: Option<&str>,
) -> Result<serde_json::Value, String> {
    let page = page.unwrap_or(1);
    let order_type = order_type.unwrap_or("latest");
    let mut url = format!(
        "https://www.star-citizen-characters.com/api/heads?page={}&orderBy={}",
        page, order_type
    );
    if let Some(search) = search {
        if !search.is_empty() {
            url.push_str(&format!("&search={}", urlencoding::encode(search)));
        }
    }
    let response = reqwest::get(url)
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(response)
}
