use tauri::command;

/// Statut des serveurs RSI via l'API cState officielle.
#[command]
pub async fn fetch_rsi_status_feed() -> Result<String, String> {
    use serde_json::json;

    let client = reqwest::Client::new();
    let resp = client
        .get("https://status.robertsspaceindustries.com/index.json")
        .header("User-Agent", "Multitool")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Status fetch: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Status HTTP {}", resp.status()));
    }

    let body = resp.text().await.map_err(|e| format!("Status body: {e}"))?;
    let v: serde_json::Value =
        serde_json::from_str(&body).map_err(|e| format!("Status JSON: {e}"))?;

    let overall = v
        .get("summaryStatus")
        .and_then(|x| x.as_str())
        .unwrap_or("operational")
        .to_string();

    let mut systems_out: Vec<serde_json::Value> = Vec::new();
    if let Some(systems) = v.get("systems").and_then(|x| x.as_array()) {
        for s in systems {
            let name = s.get("name").and_then(|x| x.as_str()).unwrap_or("").to_string();
            let status = s
                .get("status")
                .and_then(|x| x.as_str())
                .unwrap_or("operational")
                .to_string();
            let category = s.get("category").and_then(|x| x.as_str()).unwrap_or("").to_string();

            let mut issues: Vec<serde_json::Value> = Vec::new();
            if let Some(arr) = s.get("unresolvedIssues").and_then(|x| x.as_array()) {
                for iss in arr {
                    issues.push(json!({
                        "title": iss.get("title").and_then(|x| x.as_str()).unwrap_or(""),
                        "severity": iss.get("severity").and_then(|x| x.as_str()).unwrap_or(""),
                        "permalink": iss.get("permalink").and_then(|x| x.as_str()).unwrap_or(""),
                    }));
                }
            }

            if name.is_empty() {
                continue;
            }
            systems_out.push(json!({
                "name": name,
                "status": status,
                "category": category,
                "issues": issues,
            }));
        }
    }

    let payload = json!({
        "overall": overall,
        "systems": systems_out,
    });

    serde_json::to_string(&payload).map_err(|e| e.to_string())
}
