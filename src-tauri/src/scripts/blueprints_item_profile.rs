//! Enrichissement objet craftable via GET /api/items/{uuid} (description_data).

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use super::blueprint_family::{
    build_catalog_badges, build_hero_stats, build_summary_badges, classify_output_type,
    BlueprintFamily,
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
            data.get("description_data")
                .unwrap_or(&serde_json::Value::Null),
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

    let url = format!("{WIKI_API_BASE}/api/items/{uuid}");
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

// --- Item meta index (liste catalogue enrichie depuis GET /api/items/{uuid}) ---

use super::blueprints_catalog::{
    load_wiki_catalog_from_disk, normalize_bp_id_key, BlueprintSummary,
};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct ItemMetaEntry {
    #[serde(default)]
    description_data: Vec<DescriptionDataRow>,
    grade: Option<String>,
    class_code: Option<String>,
    type_label: Option<String>,
}

#[derive(Serialize, Deserialize, Default)]
struct ItemMetaIndexFile {
    entries: HashMap<String, ItemMetaEntry>,
}

fn item_meta_index_path() -> Option<PathBuf> {
    wiki_data_dir().map(|d| d.join("wiki_item_meta_index.json"))
}

fn item_class_to_code(class: &str) -> Option<String> {
    match class.trim().to_ascii_lowercase().as_str() {
        "civilian" => Some("civi".into()),
        "military" => Some("mili".into()),
        "industrial" => Some("indu".into()),
        "stealth" => Some("stlh".into()),
        "competition" => Some("comp".into()),
        _ => None,
    }
}

fn normalize_item_grade(raw: &str) -> Option<String> {
    let t = raw.trim();
    if t.is_empty() {
        return None;
    }
    let lower = t.to_ascii_lowercase();
    if matches!(lower.as_str(), "undefined" | "null" | "none" | "n/a" | "na") {
        return None;
    }
    if let Ok(n) = t.parse::<u64>() {
        if (1..=7).contains(&n) {
            return Some(char::from(b'A' + (n as u8 - 1)).to_string());
        }
    }
    if t.len() == 1 {
        let c = t.chars().next().unwrap().to_ascii_uppercase();
        if ('A'..='G').contains(&c) {
            return Some(c.to_string());
        }
    }
    None
}

fn meta_from_profile(profile: &BlueprintItemProfile) -> ItemMetaEntry {
    let grade = profile
        .description_data
        .iter()
        .find(|r| r.name.eq_ignore_ascii_case("Grade"))
        .and_then(|r| normalize_item_grade(&r.value));
    let class_code = profile
        .description_data
        .iter()
        .find(|r| r.name.eq_ignore_ascii_case("Class"))
        .and_then(|r| item_class_to_code(&r.value));
    ItemMetaEntry {
        description_data: profile.description_data.clone(),
        grade,
        class_code,
        type_label: profile.item_type_label.clone(),
    }
}

fn meta_from_item_data(data: &serde_json::Value, profile: &BlueprintItemProfile) -> ItemMetaEntry {
    let mut meta = meta_from_profile(profile);
    if meta.grade.is_none() {
        meta.grade = data
            .get("grade")
            .and_then(|v| v.as_str())
            .and_then(normalize_item_grade);
    }
    if meta.class_code.is_none() {
        meta.class_code = data
            .get("class")
            .and_then(|v| v.as_str())
            .and_then(item_class_to_code);
    }
    if meta.type_label.is_none() {
        meta.type_label = data
            .get("type_label")
            .and_then(|v| v.as_str())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
    }
    meta
}

fn summary_needs_item_meta(summary: &BlueprintSummary) -> bool {
    if summary.family.as_deref() != Some("ship_component") {
        return false;
    }
    let has_grade = summary.grade.is_some()
        || summary
            .summary_badges
            .iter()
            .any(|b| b.kind == "grade");
    let has_class = summary.class_code.is_some()
        || summary
            .summary_badges
            .iter()
            .any(|b| b.kind == "component_class");
    !has_grade || !has_class
}

fn apply_item_meta(summary: &mut BlueprintSummary, meta: &ItemMetaEntry) {
    if summary.grade.is_none() {
        summary.grade = meta.grade.clone();
    }
    if summary.class_code.is_none() {
        summary.class_code = meta.class_code.clone();
    }
    if summary.output_type_label.is_none() {
        summary.output_type_label = meta.type_label.clone();
    }
    if summary.manufacturer_name.is_none() {
        if let Some(mfg) = meta
            .description_data
            .iter()
            .find(|r| r.name.eq_ignore_ascii_case("Manufacturer"))
            .map(|r| r.value.trim().to_string())
            .filter(|s| !s.is_empty())
        {
            summary.manufacturer_name = Some(mfg);
        }
    }

    let family = classify_output_type(summary.output_type.as_deref());
    if !meta.description_data.is_empty() {
        summary.summary_badges = build_catalog_badges(
            family,
            summary.output_type.as_deref(),
            summary.output_type_label.as_deref(),
            summary.sub_type.as_deref(),
            summary.size,
            &meta.description_data,
        );
    } else {
        summary.summary_badges = build_summary_badges(
            family,
            summary.output_type.as_deref(),
            summary.output_type_label.as_deref(),
            summary.sub_type.as_deref(),
            summary.size,
            super::blueprint_family::SummaryBadgeContext {
                grade: summary.grade.as_deref(),
                class_code: summary.class_code.as_deref(),
                manufacturer_name: summary.manufacturer_name.as_deref(),
            },
        );
    }
}

pub fn merge_item_meta_index(summaries: &mut [BlueprintSummary]) {
    let Some(path) = item_meta_index_path() else {
        return;
    };
    let Ok(bytes) = fs::read(&path) else {
        return;
    };
    let Ok(index) = serde_json::from_slice::<ItemMetaIndexFile>(&bytes) else {
        return;
    };
    for s in summaries.iter_mut() {
        if let Some(meta) = index.entries.get(&s.blueprint_id) {
            apply_item_meta(s, meta);
        }
    }
}

pub async fn build_item_meta_index_background() {
    let Ok(blueprints) = load_wiki_catalog_from_disk() else {
        return;
    };
    let targets: Vec<_> = blueprints
        .iter()
        .filter(|bp| {
            let summary = super::blueprints_catalog::summary_from_wiki(bp);
            summary_needs_item_meta(&summary)
        })
        .collect();

    let mut entries: HashMap<String, ItemMetaEntry> = item_meta_index_path()
        .and_then(|p| fs::read(&p).ok())
        .and_then(|b| serde_json::from_slice::<ItemMetaIndexFile>(&b).ok())
        .map(|f| f.entries)
        .unwrap_or_default();

    for bp in targets {
        let Some(uuid) = super::blueprints_catalog::wiki_output_item_uuid(bp) else {
            continue;
        };
        let bp_id = normalize_bp_id_key(&bp.key);
        if entries.contains_key(&bp_id) {
            continue;
        }
        if let Some(profile) = fetch_item_profile(&uuid).await {
            let meta = if let Some(path) = item_cache_path(&uuid) {
                if let Ok(bytes) = fs::read(&path) {
                    if let Ok(data) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                        meta_from_item_data(&data, &profile)
                    } else {
                        meta_from_profile(&profile)
                    }
                } else {
                    meta_from_profile(&profile)
                }
            } else {
                meta_from_profile(&profile)
            };
            if !meta.description_data.is_empty()
                || meta.grade.is_some()
                || meta.class_code.is_some()
            {
                entries.insert(bp_id, meta);
            }
        }
        tokio::time::sleep(tokio::time::Duration::from_millis(80)).await;
    }

    if let Some(path) = item_meta_index_path() {
        let file = ItemMetaIndexFile { entries };
        if let Ok(bytes) = serde_json::to_vec(&file) {
            let _ = fs::write(path, bytes);
        }
    }
}

#[cfg(test)]
mod item_meta_tests {
    use super::*;
    use crate::scripts::blueprint_family::BlueprintFamily;

    #[test]
    fn list_badges_match_detail_when_description_data_present() {
        let rows = vec![
            DescriptionDataRow {
                name: "Grade".into(),
                value: "B".into(),
            },
            DescriptionDataRow {
                name: "Class".into(),
                value: "Industrial".into(),
            },
            DescriptionDataRow {
                name: "Size".into(),
                value: "2".into(),
            },
        ];
        let list = build_summary_badges(
            BlueprintFamily::ShipComponent,
            Some("Shield"),
            Some("Shield Generator"),
            None,
            Some(2),
            super::super::blueprint_family::SummaryBadgeContext {
                grade: Some("B"),
                class_code: Some("indu"),
                manufacturer_name: None,
            },
        );
        let detail = build_catalog_badges(
            BlueprintFamily::ShipComponent,
            Some("Shield"),
            Some("Shield Generator"),
            None,
            Some(2),
            &rows,
        );
        for badge in &list {
            assert!(
                detail.iter().any(|d| d.kind == badge.kind && d.label == badge.label),
                "badge liste {} / {} absent du détail",
                badge.kind,
                badge.label
            );
        }
    }
}
