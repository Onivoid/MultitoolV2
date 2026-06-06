//! Enrichissement objet craftable via GET /api/items/{uuid} (description_data).

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use super::blueprint_family::{
    build_catalog_badges, build_hero_stats, classify_output_type, BlueprintFamily,
};
use super::blueprints_catalog::{http_client, BlueprintDetail, WIKI_API_BASE};

const USER_AGENT: &str = "MultitoolV2-Blueprints/2.0";

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct DescriptionDataRow {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintItemProfile {
    pub item_uuid: Option<String>,
    pub description_data: Vec<DescriptionDataRow>,
    pub manufacturer_name: Option<String>,
    pub size: Option<u64>,
    pub image_url: Option<String>,
    pub classification_label: Option<String>,
    pub item_type_label: Option<String>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct SummaryPropertyRow {
    pub property_key: Option<String>,
    pub label: String,
    pub better_when: Option<String>,
}

fn wiki_data_dir() -> Option<PathBuf> {
    let dir = dirs::data_local_dir()?.join("multitool").join("blueprints");
    fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

fn item_cache_path(uuid: &str) -> Option<PathBuf> {
    wiki_data_dir().map(|d| d.join(format!("item_{uuid}.json")))
}

fn is_cache_stale(path: &PathBuf, max_age_days: u64) -> bool {
    let Ok(meta) = fs::metadata(path) else {
        return true;
    };
    let Ok(modified) = meta.modified() else {
        return true;
    };
    let Ok(elapsed) = modified.elapsed() else {
        return true;
    };
    elapsed.as_secs() > max_age_days * 24 * 60 * 60
}

fn parse_description_data(raw: &serde_json::Value) -> Vec<DescriptionDataRow> {
    let Some(arr) = raw.as_array() else {
        return Vec::new();
    };
    arr.iter()
        .filter_map(|row| {
            let name = row.get("name").and_then(|v| v.as_str())?.trim();
            let value = row
                .get("value")
                .or_else(|| row.get("type"))
                .and_then(|v| v.as_str())?
                .trim();
            if name.is_empty() || value.is_empty() {
                return None;
            }
            let lower = value.to_ascii_lowercase();
            if matches!(lower.as_str(), "undefined" | "null" | "none") {
                return None;
            }
            Some(DescriptionDataRow {
                name: name.to_string(),
                value: value.to_string(),
            })
        })
        .collect()
}

fn parse_item_profile(uuid: &str, data: &serde_json::Value) -> BlueprintItemProfile {
    let manufacturer_name = data
        .get("manufacturer")
        .and_then(|m| m.get("name"))
        .and_then(|v| v.as_str())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let size = data.get("size").and_then(|v| v.as_u64());

    let image_url = data
        .get("images")
        .and_then(|imgs| imgs.as_array())
        .and_then(|arr| arr.first())
        .and_then(|img| img.get("url").or_else(|| img.get("thumbnail")))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    BlueprintItemProfile {
        item_uuid: Some(uuid.to_string()),
        description_data: parse_description_data(
            data.get("description_data").unwrap_or(&serde_json::Value::Null),
        ),
        manufacturer_name,
        size,
        image_url,
        classification_label: data
            .get("classification_label")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        item_type_label: data
            .get("type_label")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    }
}

pub async fn fetch_item_profile(item_uuid: &str) -> Option<BlueprintItemProfile> {
    let uuid = item_uuid.trim();
    if uuid.is_empty() {
        return None;
    }

    if let Some(path) = item_cache_path(uuid) {
        if !is_cache_stale(&path, 7) {
            if let Ok(bytes) = fs::read(&path) {
                if let Ok(data) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                    return Some(parse_item_profile(uuid, &data));
                }
            }
        }
    }

    let url = format!("{}/api/items/{}", WIKI_API_BASE, uuid);
    let client = http_client().ok()?;
    let response = client
        .get(&url)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .send()
        .await
        .ok()?;
    if !response.status().is_success() {
        return None;
    }
    let json: serde_json::Value = response.json().await.ok()?;
    let data = json.get("data")?;
    if let Some(path) = item_cache_path(uuid) {
        let _ = fs::write(&path, serde_json::to_vec(data).unwrap_or_default());
    }
    Some(parse_item_profile(uuid, data))
}

pub fn map_summary_properties(raw: &[serde_json::Value]) -> Vec<SummaryPropertyRow> {
    raw.iter()
        .filter_map(|v| {
            let obj = v.as_object()?;
            let label = obj
                .get("label")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            if label.is_empty() {
                return None;
            }
            Some(SummaryPropertyRow {
                property_key: obj
                    .get("property_key")
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string()),
                label,
                better_when: obj
                    .get("better_when")
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string()),
            })
        })
        .collect()
}

pub async fn enrich_detail_item(
    detail: &mut BlueprintDetail,
    output_item_uuid: Option<&str>,
    summary_properties_raw: &[serde_json::Value],
) {
    let output_type = detail.summary.output_type.as_deref();
    let family = classify_output_type(output_type);
    detail.family = Some(family.as_str().to_string());
    detail.summary_properties = map_summary_properties(summary_properties_raw);

    let profile = if let Some(uuid) = output_item_uuid {
        fetch_item_profile(uuid).await
    } else {
        None
    };

    if let Some(ref p) = profile {
        detail.item_profile = Some(p.clone());
        if detail.summary.manufacturer_name.is_none() {
            detail.summary.manufacturer_name = p.manufacturer_name.clone();
        }
        if detail.summary.size.is_none() {
            detail.summary.size = p.size;
        }
        if let Some(grade) = p
            .description_data
            .iter()
            .find(|r| r.name.eq_ignore_ascii_case("Grade"))
            .map(|r| r.value.trim().to_string())
            .filter(|g| !g.is_empty())
        {
            if family == BlueprintFamily::ShipComponent {
                detail.summary.grade = Some(grade);
            }
        }
    }

    let desc = profile
        .as_ref()
        .map(|p| p.description_data.as_slice())
        .unwrap_or(&[]);

    detail.hero_stats = build_hero_stats(family, desc);
    detail.catalog_badges = build_catalog_badges(
        family,
        output_type,
        detail.summary.output_type_label.as_deref(),
        detail.summary.sub_type.as_deref(),
        detail.summary.size,
        desc,
    );
}
