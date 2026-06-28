//! Star Citizen Wiki API extensions: filters, mission index, ingredient enrichment.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;

use super::blueprints_catalog::{
    fetch_wiki_blueprint_by_uuid, http_client, is_mission_released_in_game,
    load_wiki_catalog_from_disk, normalize_bp_id_key, summary_from_wiki, BlueprintDetail,
    BlueprintSummary, IngredientEnrichment, IngredientLocationPreview, IngredientOption,
    MissionBlueprintReward, MissionDetailResult, MissionInfo, WIKI_API_BASE,
};
use tauri::command;

const USER_AGENT: &str = "MultitoolV2-Blueprints/2.0";

fn wiki_data_dir() -> Option<PathBuf> {
    let dir = dirs::data_local_dir()?.join("multitool").join("blueprints");
    fs::create_dir_all(&dir).ok()?;
    Some(dir)
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

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct FilterValue {
    pub value: Option<serde_json::Value>,
    pub label: String,
    pub count: u64,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintCatalogFilters {
    pub output_type: Vec<FilterValue>,
    pub ingredient_uuid: Vec<FilterValue>,
    pub resource_uuid: Vec<FilterValue>,
}

#[derive(Deserialize)]
struct WikiFiltersResponse {
    filters: WikiFiltersBody,
}

#[derive(Deserialize, Default)]
struct WikiFiltersBody {
    #[serde(rename = "output.type", default)]
    output_type: Vec<WikiFilterValue>,
    #[serde(rename = "ingredient.uuid", default)]
    ingredient_uuid: Vec<WikiFilterValue>,
    #[serde(rename = "resource.uuid", default)]
    resource_uuid: Vec<WikiFilterValue>,
}

#[derive(Deserialize, Default)]
struct WikiFilterValue {
    value: Option<serde_json::Value>,
    label: Option<String>,
    count: Option<u64>,
}

fn map_filter_values(raw: Vec<WikiFilterValue>) -> Vec<FilterValue> {
    raw.into_iter()
        .map(|v| FilterValue {
            value: v.value,
            label: v.label.unwrap_or_default(),
            count: v.count.unwrap_or(0),
        })
        .collect()
}

fn filters_cache_path() -> Option<PathBuf> {
    wiki_data_dir().map(|d| d.join("wiki_blueprints_filters.json"))
}

pub async fn fetch_blueprint_filters() -> Result<BlueprintCatalogFilters, String> {
    if let Some(path) = filters_cache_path() {
        if !is_cache_stale(&path, 7) {
            if let Ok(bytes) = fs::read(&path) {
                if let Ok(parsed) = serde_json::from_slice::<BlueprintCatalogFilters>(&bytes) {
                    return Ok(parsed);
                }
            }
        }
    }

    let url = format!("{WIKI_API_BASE}/api/blueprints/filters");
    let client = http_client()?;
    let response = client
        .get(&url)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .send()
        .await
        .map_err(|e| format!("Erreur reseau filters: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("Wiki filters HTTP {}", response.status()));
    }
    let raw: WikiFiltersResponse = response
        .json()
        .await
        .map_err(|e| format!("Wiki filters illisible: {e}"))?;
    let out = BlueprintCatalogFilters {
        output_type: map_filter_values(raw.filters.output_type),
        ingredient_uuid: map_filter_values(raw.filters.ingredient_uuid),
        resource_uuid: map_filter_values(raw.filters.resource_uuid),
    };
    if let Some(path) = filters_cache_path() {
        if let Ok(bytes) = serde_json::to_vec(&out) {
            let _ = fs::write(path, bytes);
        }
    }
    Ok(out)
}

// --- Unlock index ---

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct BpUnlockEntry {
    #[serde(default)]
    systems: Vec<String>,
    #[serde(default)]
    jurisdictions: Vec<String>,
    #[serde(default)]
    contractors: Vec<String>,
    #[serde(default)]
    mission_types: Vec<String>,
    #[serde(default)]
    lawful: Vec<bool>,
}

#[derive(Serialize, Deserialize, Default)]
struct UnlockIndexFile {
    entries: HashMap<String, BpUnlockEntry>,
}

fn unlock_index_path() -> Option<PathBuf> {
    wiki_data_dir().map(|d| d.join("wiki_bp_unlock_index.json"))
}

/// Indique si l'index unlock doit être (re)construit.
pub fn unlock_index_is_stale() -> bool {
    let Some(path) = unlock_index_path() else {
        return true;
    };
    is_cache_stale(&path, 7)
}

pub fn unlock_index_exists() -> bool {
    unlock_index_path().map(|p| p.is_file()).unwrap_or(false)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnlockIndexStatus {
    pub exists: bool,
    pub stale: bool,
}

#[command]
pub fn blueprints_unlock_index_status() -> UnlockIndexStatus {
    UnlockIndexStatus {
        exists: unlock_index_exists(),
        stale: unlock_index_is_stale(),
    }
}

pub fn merge_unlock_index(summaries: &mut [BlueprintSummary]) {
    let Some(path) = unlock_index_path() else {
        return;
    };
    let Ok(bytes) = fs::read(&path) else {
        return;
    };
    let Ok(index) = serde_json::from_slice::<UnlockIndexFile>(&bytes) else {
        return;
    };
    for s in summaries.iter_mut() {
        if let Some(e) = index.entries.get(&s.blueprint_id) {
            s.unlock_systems = e.systems.clone();
            s.unlock_jurisdictions = e.jurisdictions.clone();
            s.unlock_contractors = e.contractors.clone();
            s.unlock_mission_types = e.mission_types.clone();
            s.unlock_lawful = e.lawful.clone();
        }
    }
}

#[derive(Serialize, Deserialize, Default, Clone)]
struct MissionCacheFile {
    #[serde(default)]
    schema_version: u32,
    missions: HashMap<String, CachedMission>,
}

const MISSION_CACHE_SCHEMA_VERSION: u32 = 2;

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct CachedMission {
    title: String,
    star_systems: Vec<String>,
    jurisdictions: Vec<String>,
    illegal: Option<bool>,
    faction: Option<String>,
    mission_giver: Option<String>,
    web_url: Option<String>,
    blueprint_keys: Vec<String>,
    shareable: Option<bool>,
    rank_index: Option<i64>,
    min_standing_name: Option<String>,
    min_standing_reputation: Option<i64>,
    mission_type: Option<String>,
    reward_scope: Option<String>,
    time_to_complete_minutes: Option<f64>,
    released: Option<bool>,
    not_for_release: Option<bool>,
    work_in_progress: Option<bool>,
}

fn mission_cache_path() -> Option<PathBuf> {
    wiki_data_dir().map(|d| d.join("wiki_missions_cache.json"))
}

fn load_mission_cache() -> MissionCacheFile {
    let Some(path) = mission_cache_path() else {
        return MissionCacheFile::default();
    };
    let cache: MissionCacheFile = fs::read(&path)
        .ok()
        .and_then(|b| serde_json::from_slice(&b).ok())
        .unwrap_or_default();
    if cache.schema_version != MISSION_CACHE_SCHEMA_VERSION {
        return MissionCacheFile {
            schema_version: MISSION_CACHE_SCHEMA_VERSION,
            missions: HashMap::new(),
        };
    }
    cache
}

fn save_mission_cache(cache: &MissionCacheFile) {
    let Some(path) = mission_cache_path() else {
        return;
    };
    let mut to_write = cache.clone();
    to_write.schema_version = MISSION_CACHE_SCHEMA_VERSION;
    if let Ok(bytes) = serde_json::to_vec(&to_write) {
        let _ = fs::write(path, bytes);
    }
}

fn mission_release_flags_from_api(
    data: &serde_json::Value,
) -> (Option<bool>, Option<bool>, Option<bool>) {
    let mut released = data.get("released").and_then(|v| v.as_bool());
    let not_for_release = data.get("not_for_release").and_then(|v| v.as_bool());
    let work_in_progress = data.get("work_in_progress").and_then(|v| v.as_bool());
    if released.is_none() {
        if let Some(status) = data
            .get("release_status")
            .or_else(|| data.get("production_status"))
            .and_then(|v| v.as_str())
        {
            let upper = status.to_ascii_uppercase();
            if upper.contains("UNRELEASE") || upper == "WIP" || upper.contains("WORK_IN_PROGRESS")
            {
                released = Some(false);
            } else if upper.contains("RELEASE") {
                released = Some(true);
            }
        }
    }
    (released, not_for_release, work_in_progress)
}

fn cached_mission_has_release_flags(c: &CachedMission) -> bool {
    c.released.is_some() || c.not_for_release.is_some() || c.work_in_progress.is_some()
}

fn is_mission_released_from_cache(c: &CachedMission) -> bool {
    if c.not_for_release == Some(true) {
        return false;
    }
    if c.released == Some(false) {
        return false;
    }
    if c.work_in_progress == Some(true) {
        return false;
    }
    if c.released.is_none() && c.not_for_release.is_none() && c.work_in_progress.is_none() {
        return false;
    }
    true
}

fn normalize_system_name(s: &str) -> String {
    let t = s.trim();
    t.strip_suffix(" System")
        .or_else(|| t.strip_suffix(" system"))
        .unwrap_or(t)
        .to_string()
}

fn system_to_location_slug(system: &str) -> String {
    let base = normalize_system_name(system);
    let lower = base.to_ascii_lowercase();
    match lower.as_str() {
        "stanton" => "stanton-2".to_string(),
        "pyro" => "pyro-2".to_string(),
        "nyx" => "nyx-3".to_string(),
        _ => format!("{}-2", lower.replace(' ', "-")),
    }
}

async fn fetch_location_jurisdiction(system: &str) -> Option<String> {
    let slug = system_to_location_slug(system);
    let url = format!("{WIKI_API_BASE}/api/locations/{slug}");
    let client = http_client().ok()?;
    let response = client.get(&url).send().await.ok()?;
    if !response.status().is_success() {
        return None;
    }
    let json: serde_json::Value = response.json().await.ok()?;
    json.get("data")?
        .get("jurisdiction")?
        .get("name")?
        .as_str()
        .map(|s| s.to_string())
}

fn mission_uuid_from_url(url: &str) -> Option<String> {
    url.trim()
        .rsplit('/')
        .next()
        .filter(|s| !s.is_empty() && s.len() >= 32)
        .map(|s| s.to_string())
}

fn blueprint_uuid_from_link(link: &str) -> Option<String> {
    link.trim()
        .rsplit('/')
        .next()
        .filter(|s| !s.is_empty() && s.contains('-'))
        .map(|s| s.to_string())
}

async fn fetch_mission_cached(uuid: &str, cache: &mut MissionCacheFile) -> Option<CachedMission> {
    if let Some(m) = cache.missions.get(uuid) {
        if cached_mission_has_release_flags(m) {
            return Some(m.clone());
        }
    }
    let url = format!("{WIKI_API_BASE}/api/missions/{uuid}");
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
    let title = data
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Mission")
        .to_string();
    let star_systems: Vec<String> = data
        .get("star_systems")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|x| x.as_str().map(normalize_system_name))
                .collect()
        })
        .unwrap_or_default();
    let mut jurisdictions = Vec::new();
    for sys in &star_systems {
        if let Some(j) = fetch_location_jurisdiction(sys).await {
            if !jurisdictions.contains(&j) {
                jurisdictions.push(j);
            }
        }
    }
    let mut blueprint_keys = Vec::new();
    if let Some(pools) = data.get("blueprints").and_then(|v| v.as_array()) {
        for pool in pools {
            if let Some(items) = pool.get("items").and_then(|v| v.as_array()) {
                for item in items {
                    if let Some(link) = item.get("blueprint_link").and_then(|v| v.as_str()) {
                        if let Some(uuid) = blueprint_uuid_from_link(link) {
                            blueprint_keys.push(uuid);
                        }
                    }
                }
            }
        }
    }
    let (released, not_for_release, work_in_progress) = mission_release_flags_from_api(data);
    let entry = CachedMission {
        title,
        star_systems,
        jurisdictions,
        illegal: data.get("illegal").and_then(|v| v.as_bool()),
        faction: data
            .get("faction")
            .and_then(|f| f.get("name"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        mission_giver: data
            .get("mission_giver")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        web_url: data
            .get("web_url")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        blueprint_keys,
        shareable: data
            .get("shareable")
            .and_then(|v| v.as_bool())
            .or_else(|| data.get("is_shareable").and_then(|v| v.as_bool()))
            .or_else(|| data.get("coop_mission").and_then(|v| v.as_bool()))
            .or_else(|| data.get("is_coop").and_then(|v| v.as_bool()))
            .or_else(|| {
                data.get("mission_flags")
                    .and_then(|f| f.get("shareable"))
                    .and_then(|v| v.as_bool())
            }),
        rank_index: data.get("rank_index").and_then(|v| v.as_i64()),
        min_standing_name: data
            .get("min_standing")
            .and_then(|m| m.get("name"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .or_else(|| {
                data.get("min_standing_name")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            }),
        min_standing_reputation: data
            .get("min_standing")
            .and_then(|m| m.get("min_reputation"))
            .and_then(|v| v.as_i64())
            .or_else(|| data.get("min_standing_reputation").and_then(|v| v.as_i64())),
        mission_type: data
            .get("mission_type")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        reward_scope: data
            .get("reward_scope")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        time_to_complete_minutes: data
            .get("time_to_complete_minutes")
            .and_then(|v| v.as_f64()),
        released,
        not_for_release,
        work_in_progress,
    };
    cache.missions.insert(uuid.to_string(), entry.clone());
    Some(entry)
}

pub async fn build_unlock_index_background() {
    let Ok(blueprints) = load_wiki_catalog_from_disk() else {
        return;
    };
    let targets: Vec<_> = blueprints
        .iter()
        .filter(|b| b.unlocking_missions_count.unwrap_or(0) > 0)
        .collect();
    let mut mission_cache = load_mission_cache();
    let mut index_entries: HashMap<String, BpUnlockEntry> = HashMap::new();

    for bp in targets {
        let bp_id = normalize_bp_id_key(&bp.key);
        if let Ok(full) = fetch_wiki_blueprint_by_uuid(&bp.uuid).await {
            let mut systems = HashSet::new();
            let mut jurisdictions = HashSet::new();
            let mut contractors = HashSet::new();
            let mut mission_types = HashSet::new();
            let mut lawful_set = HashSet::new();
            for m in &full.unlocking_missions {
                if let Some(url) = &m.web_url {
                    if let Some(uuid) = mission_uuid_from_url(url) {
                        if let Some(cached) = fetch_mission_cached(&uuid, &mut mission_cache).await
                        {
                            if !is_mission_released_from_cache(&cached) {
                                continue;
                            }
                            for s in &cached.star_systems {
                                systems.insert(s.clone());
                            }
                            for j in &cached.jurisdictions {
                                jurisdictions.insert(j.clone());
                            }
                            if let Some(giver) = &cached.mission_giver {
                                contractors.insert(giver.clone());
                            }
                            if let Some(scope) = cached
                                .reward_scope
                                .as_ref()
                                .or(cached.mission_type.as_ref())
                            {
                                mission_types.insert(scope.clone());
                            }
                            if let Some(illegal) = cached.illegal {
                                lawful_set.insert(!illegal);
                            }
                        }
                    }
                }
                if let Some(debug) = &m.debug_name {
                    for token in debug.split('_') {
                        let lower = token.to_ascii_lowercase();
                        if matches!(lower.as_str(), "nyx" | "stanton" | "pyro") {
                            let norm = normalize_system_name(token);
                            systems.insert(norm);
                        }
                    }
                }
            }
            let has_meta = !systems.is_empty()
                || !jurisdictions.is_empty()
                || !contractors.is_empty()
                || !mission_types.is_empty()
                || !lawful_set.is_empty();
            if has_meta {
                let mut sys_vec: Vec<_> = systems.into_iter().collect();
                sys_vec.sort();
                let mut jur_vec: Vec<_> = jurisdictions.into_iter().collect();
                jur_vec.sort();
                let mut contractor_vec: Vec<_> = contractors.into_iter().collect();
                contractor_vec.sort();
                let mut mission_type_vec: Vec<_> = mission_types.into_iter().collect();
                mission_type_vec.sort();
                let mut lawful_vec: Vec<_> = lawful_set.into_iter().collect();
                lawful_vec.sort_by(|a, b| b.cmp(a));
                index_entries.insert(
                    bp_id,
                    BpUnlockEntry {
                        systems: sys_vec,
                        jurisdictions: jur_vec,
                        contractors: contractor_vec,
                        mission_types: mission_type_vec,
                        lawful: lawful_vec,
                    },
                );
            }
        }
        tokio::time::sleep(tokio::time::Duration::from_millis(80)).await;
    }

    save_mission_cache(&mission_cache);
    if let Some(path) = unlock_index_path() {
        let file = UnlockIndexFile {
            entries: index_entries,
        };
        if let Ok(bytes) = serde_json::to_vec(&file) {
            let _ = fs::write(path, bytes);
        }
    }
}

pub fn enrich_missions_from_cache(missions: &mut [MissionInfo]) {
    let cache = load_mission_cache();
    for m in missions.iter_mut() {
        let Some(uuid) = &m.mission_uuid else {
            continue;
        };
        if let Some(c) = cache.missions.get(uuid) {
            m.star_systems = c.star_systems.clone();
            m.jurisdictions = c.jurisdictions.clone();
            m.contractor = c.mission_giver.clone();
            m.lawful = c.illegal.map(|i| !i);
            m.mission_type = c
                .reward_scope
                .clone()
                .or(c.mission_type.clone())
                .or(m.mission_type.clone());
            m.shareable = c.shareable;
            m.rank_index = c.rank_index;
            m.min_standing_name = c.min_standing_name.clone();
            m.min_standing_reputation = c.min_standing_reputation;
            if let Some(mins) = c.time_to_complete_minutes {
                m.time_to_complete_minutes = Some(mins.round() as u64);
            }
            m.not_for_release = c.not_for_release;
            m.released = c.released;
            m.work_in_progress = c.work_in_progress;
        }
    }
}

// --- Ingredient enrichment ---

#[derive(Serialize, Deserialize, Default)]
struct IngredientCacheFile {
    entries: HashMap<String, IngredientEnrichment>,
}

fn ingredient_cache_path() -> Option<PathBuf> {
    wiki_data_dir().map(|d| d.join("wiki_ingredient_cache.json"))
}

fn load_ingredient_cache() -> IngredientCacheFile {
    let Some(path) = ingredient_cache_path() else {
        return IngredientCacheFile::default();
    };
    fs::read(&path)
        .ok()
        .and_then(|b| serde_json::from_slice(&b).ok())
        .unwrap_or_default()
}

fn save_ingredient_cache(cache: &IngredientCacheFile) {
    let Some(path) = ingredient_cache_path() else {
        return;
    };
    if let Ok(bytes) = serde_json::to_vec(cache) {
        let _ = fs::write(path, bytes);
    }
}

fn location_spawn_percent(loc: &serde_json::Value) -> Option<f64> {
    loc.get("group_probability_percent")
        .and_then(|v| v.as_f64())
        .or_else(|| {
            loc.get("relative_probability_percent")
                .and_then(|v| v.as_f64())
        })
        .or_else(|| {
            loc.get("group_probability")
                .and_then(|v| v.as_f64())
                .map(|p| p * 100.0)
        })
        .or_else(|| {
            loc.get("relative_probability")
                .and_then(|v| v.as_f64())
                .map(|p| p * 100.0)
        })
}

fn parse_commodity_location(loc: &serde_json::Value) -> Option<IngredientLocationPreview> {
    let name = loc
        .get("display_name")
        .or_else(|| loc.get("name"))
        .and_then(|v| v.as_str())
        .unwrap_or("—")
        .to_string();
    Some(IngredientLocationPreview {
        name,
        system: loc
            .get("system")
            .and_then(|v| v.as_str())
            .map(normalize_system_name),
        location_type: loc.get("type").and_then(|v| v.as_str()).map(String::from),
        spawn_percent: location_spawn_percent(loc),
    })
}

fn sort_locations_by_spawn(
    mut locations: Vec<IngredientLocationPreview>,
) -> Vec<IngredientLocationPreview> {
    locations.sort_by(|a, b| match (b.spawn_percent, a.spawn_percent) {
        (Some(pb), Some(pa)) => pb
            .partial_cmp(&pa)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.name.cmp(&b.name)),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => a.name.cmp(&b.name),
    });
    locations
}

fn truncate_desc(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        return s.to_string();
    }
    let mut out: String = s.chars().take(max).collect();
    out.push('…');
    out
}

async fn fetch_commodity_enrichment(uuid: &str) -> Option<IngredientEnrichment> {
    let url = format!("{WIKI_API_BASE}/api/commodities/{uuid}");
    let client = http_client().ok()?;
    let response = client.get(&url).send().await.ok()?;
    if !response.status().is_success() {
        return None;
    }
    let json: serde_json::Value = response.json().await.ok()?;
    let data = json.get("data")?;
    let locations = data.get("locations").and_then(|v| v.as_array());
    let location_count = locations.map(|a| a.len() as u64);
    let preview: Vec<IngredientLocationPreview> = locations
        .map(|arr| {
            let mut list: Vec<IngredientLocationPreview> =
                arr.iter().filter_map(parse_commodity_location).collect();
            list = sort_locations_by_spawn(list);
            list.into_iter().take(5).collect()
        })
        .unwrap_or_default();
    let systems: Vec<String> = data
        .get("systems")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|x| x.as_str().map(normalize_system_name))
                .collect()
        })
        .unwrap_or_default();
    let methods: Vec<String> = data
        .get("methods")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|x| x.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();
    let thumbnail_url = data
        .get("images")
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.first())
        .and_then(|img| img.get("thumbnail_url").and_then(|v| v.as_str()))
        .map(String::from);
    Some(IngredientEnrichment {
        source_kind: "commodity".to_string(),
        tier: data.get("tier").and_then(|v| v.as_str()).map(String::from),
        rarity: None,
        kind_label: data.get("kind").and_then(|v| v.as_str()).map(String::from),
        methods,
        systems,
        location_preview: preview,
        location_count,
        refined_version_name: data
            .get("refined_version")
            .and_then(|r| r.get("name"))
            .and_then(|v| v.as_str())
            .map(String::from),
        density: data.get("density_g_per_cc").and_then(|v| v.as_f64()),
        signature: data.get("signature").and_then(|v| v.as_i64()),
        description_short: data
            .get("description")
            .and_then(|v| v.as_str())
            .map(|s| truncate_desc(s, 200)),
        harvest_hints: Vec::new(),
        thumbnail_url,
    })
}

async fn fetch_item_enrichment(uuid: &str) -> Option<IngredientEnrichment> {
    let url = format!("{WIKI_API_BASE}/api/items/{uuid}");
    let client = http_client().ok()?;
    let response = client.get(&url).send().await.ok()?;
    if !response.status().is_success() {
        return None;
    }
    let json: serde_json::Value = response.json().await.ok()?;
    let data = json.get("data")?;
    let harvest_hints: Vec<String> = data
        .get("entity_tag_map")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|t| t.get("name").and_then(|v| v.as_str()).map(String::from))
                .collect()
        })
        .unwrap_or_default();
    let description_short = data
        .get("description")
        .and_then(|d| d.get("en_EN").or_else(|| d.get("fr_FR")))
        .and_then(|v| v.as_str())
        .map(|s| truncate_desc(s, 200));
    let thumbnail_url = data
        .get("images")
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.first())
        .and_then(|img| img.get("thumbnail_url").and_then(|v| v.as_str()))
        .map(String::from);
    let commodity_uuid = data
        .get("resource_container")
        .and_then(|rc| rc.get("default_composition"))
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.first())
        .and_then(|c| c.get("commodity"))
        .and_then(|c| c.get("uuid"))
        .and_then(|v| v.as_str());
    let mut enrichment = IngredientEnrichment {
        source_kind: "item".to_string(),
        tier: None,
        rarity: data
            .get("rarity")
            .and_then(|v| v.as_str())
            .map(String::from),
        kind_label: data
            .get("sub_type_label")
            .or_else(|| data.get("type_label"))
            .and_then(|v| v.as_str())
            .map(String::from),
        methods: Vec::new(),
        systems: Vec::new(),
        location_preview: Vec::new(),
        location_count: None,
        refined_version_name: None,
        density: None,
        signature: None,
        description_short,
        harvest_hints,
        thumbnail_url,
    };
    if let Some(c_uuid) = commodity_uuid {
        if let Some(comm) = fetch_commodity_enrichment(c_uuid).await {
            enrichment.systems = comm.systems;
            enrichment.location_preview = comm.location_preview;
            enrichment.location_count = comm.location_count;
            enrichment.methods = comm.methods;
            if enrichment.tier.is_none() {
                enrichment.tier = comm.tier;
            }
        }
    }
    Some(enrichment)
}

async fn enrich_option(opt: &mut IngredientOption, cache: &mut IngredientCacheFile) {
    let cache_key = if opt.kind.as_deref() == Some("resource") {
        opt.ore_uuid
            .clone()
            .or_else(|| opt.guid.clone())
            .map(|u| format!("commodity:{u}"))
    } else if opt.kind.as_deref() == Some("item") {
        opt.guid.clone().map(|u| format!("item:{u}"))
    } else {
        opt.guid.clone().map(|u| format!("commodity:{u}"))
    };
    let Some(key) = cache_key else {
        return;
    };
    if let Some(e) = cache.entries.get(&key) {
        opt.enrichment = Some(e.clone());
        return;
    }
    let enrichment = if key.starts_with("item:") {
        let uuid = key.strip_prefix("item:").unwrap_or("");
        fetch_item_enrichment(uuid).await
    } else {
        let uuid = key.strip_prefix("commodity:").unwrap_or("");
        fetch_commodity_enrichment(uuid).await
    };
    if let Some(e) = enrichment {
        cache.entries.insert(key, e.clone());
        opt.enrichment = Some(e);
    }
}

pub async fn enrich_blueprint_detail(detail: &mut BlueprintDetail) {
    let mut cache = load_ingredient_cache();
    for group in &mut detail.ingredients {
        for opt in &mut group.options {
            enrich_option(opt, &mut cache).await;
            tokio::time::sleep(tokio::time::Duration::from_millis(40)).await;
        }
    }
    save_ingredient_cache(&cache);

    let mut mission_cache = load_mission_cache();
    for m in &detail.missions {
        if let Some(uuid) = &m.mission_uuid {
            let _ = fetch_mission_cached(uuid, &mut mission_cache).await;
        }
    }
    save_mission_cache(&mission_cache);
    enrich_missions_from_cache(&mut detail.missions);
    detail.missions.retain(|m| is_mission_released_in_game(m));

    let mut systems: HashSet<String> = HashSet::new();
    let mut jurisdictions: HashSet<String> = HashSet::new();
    for m in &detail.missions {
        for s in &m.star_systems {
            systems.insert(s.clone());
        }
        for j in &m.jurisdictions {
            jurisdictions.insert(j.clone());
        }
    }
    let mut sys_vec: Vec<_> = systems.into_iter().collect();
    sys_vec.sort();
    let mut jur_vec: Vec<_> = jurisdictions.into_iter().collect();
    jur_vec.sort();
    detail.summary.unlock_systems = sys_vec;
    detail.summary.unlock_jurisdictions = jur_vec;
}

pub async fn fetch_mission_detail(
    mission_uuid: String,
    direct_unlock_blueprint_id: Option<String>,
) -> Result<MissionDetailResult, String> {
    let mut cache = load_mission_cache();
    let cached = fetch_mission_cached(&mission_uuid, &mut cache)
        .await
        .ok_or_else(|| "Mission introuvable".to_string())?;
    save_mission_cache(&cache);

    let direct_id = direct_unlock_blueprint_id
        .as_deref()
        .map(normalize_bp_id_key);

    let mut blueprint_rewards = Vec::new();
    for wiki_uuid in &cached.blueprint_keys {
        if let Ok(bp) = fetch_wiki_blueprint_by_uuid(wiki_uuid).await {
            let summary = summary_from_wiki(&bp);
            let is_direct = direct_id
                .as_ref()
                .map(|d| d == &summary.blueprint_id)
                .unwrap_or(false);
            blueprint_rewards.push(MissionBlueprintReward {
                blueprint_id: Some(summary.blueprint_id),
                wiki_uuid: Some(summary.wiki_uuid),
                name_en: summary.name_en,
                name_fr: summary.name_fr,
                is_direct_unlock: is_direct,
            });
        }
    }

    Ok(MissionDetailResult {
        mission_uuid,
        title: cached.title,
        star_systems: cached.star_systems,
        jurisdictions: cached.jurisdictions,
        illegal: cached.illegal,
        faction: cached.faction,
        mission_giver: cached.mission_giver,
        web_url: cached.web_url,
        shareable: cached.shareable,
        rank_index: cached.rank_index,
        min_standing_name: cached.min_standing_name,
        min_standing_reputation: cached.min_standing_reputation,
        mission_type: cached.reward_scope.clone().or(cached.mission_type.clone()),
        time_to_complete_minutes: cached.time_to_complete_minutes,
        blueprint_rewards,
    })
}

pub async fn fetch_ingredient_locations(
    commodity_uuid: String,
) -> Result<Vec<IngredientLocationPreview>, String> {
    if let Some(e) = load_ingredient_cache()
        .entries
        .get(&format!("commodity:{commodity_uuid}"))
    {
        if e.location_count.unwrap_or(0) <= e.location_preview.len() as u64 {
            return Ok(e.location_preview.clone());
        }
    }
    let url = format!("{WIKI_API_BASE}/api/commodities/{commodity_uuid}");
    let client = http_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erreur reseau: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("Commodity HTTP {}", response.status()));
    }
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Reponse illisible: {e}"))?;
    let out: Vec<IngredientLocationPreview> = json
        .get("data")
        .and_then(|d| d.get("locations"))
        .and_then(|v| v.as_array())
        .map(|arr| {
            let list: Vec<IngredientLocationPreview> =
                arr.iter().filter_map(parse_commodity_location).collect();
            sort_locations_by_spawn(list)
        })
        .unwrap_or_default();
    Ok(out)
}

#[command]
pub async fn blueprints_catalog_filters() -> Result<BlueprintCatalogFilters, String> {
    fetch_blueprint_filters().await
}

// --- Items filters cache (taxonomie Wiki par catégorie item) ---

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct WikiItemsFilters {
    pub category: String,
    pub r#type: Vec<FilterValue>,
    pub class: Vec<FilterValue>,
    pub grade: Vec<FilterValue>,
    pub size: Vec<FilterValue>,
    pub manufacturer: Vec<FilterValue>,
}

#[derive(Deserialize, Default)]
struct WikiItemsFiltersResponse {
    filters: WikiItemsFiltersBody,
}

#[derive(Deserialize, Default)]
struct WikiItemsFiltersBody {
    #[serde(rename = "type", default)]
    item_type: Vec<WikiFilterValue>,
    #[serde(default)]
    class: Vec<WikiFilterValue>,
    #[serde(default)]
    grade: Vec<WikiFilterValue>,
    #[serde(default)]
    size: Vec<WikiFilterValue>,
    #[serde(default)]
    manufacturer: Vec<WikiFilterValue>,
}

fn items_filters_cache_path(category: &str) -> Option<PathBuf> {
    let safe = category
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '_' })
        .collect::<String>();
    wiki_data_dir().map(|d| d.join(format!("wiki_items_filters_{safe}.json")))
}

pub async fn fetch_wiki_items_filters(category: &str) -> Result<WikiItemsFilters, String> {
    let cat = category.trim();
    if cat.is_empty() {
        return Err("Catégorie items vide".into());
    }
    if let Some(path) = items_filters_cache_path(cat) {
        if !is_cache_stale(&path, 7) {
            if let Ok(bytes) = fs::read(&path) {
                if let Ok(parsed) = serde_json::from_slice::<WikiItemsFilters>(&bytes) {
                    return Ok(parsed);
                }
            }
        }
    }

    let url = format!(
        "{WIKI_API_BASE}/api/items/filters?filter[category]={}",
        urlencoding::encode(cat)
    );
    let client = http_client()?;
    let response = client
        .get(&url)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .send()
        .await
        .map_err(|e| format!("Erreur reseau items/filters: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("Wiki items/filters HTTP {}", response.status()));
    }
    let raw: WikiItemsFiltersResponse = response
        .json()
        .await
        .map_err(|e| format!("Wiki items/filters illisible: {e}"))?;
    let out = WikiItemsFilters {
        category: cat.to_string(),
        r#type: map_filter_values(raw.filters.item_type),
        class: map_filter_values(raw.filters.class),
        grade: map_filter_values(raw.filters.grade),
        size: map_filter_values(raw.filters.size),
        manufacturer: map_filter_values(raw.filters.manufacturer),
    };
    if let Some(path) = items_filters_cache_path(cat) {
        if let Ok(bytes) = serde_json::to_vec(&out) {
            let _ = fs::write(path, bytes);
        }
    }
    Ok(out)
}

#[command]
pub async fn wiki_items_filters(category: String) -> Result<WikiItemsFilters, String> {
    fetch_wiki_items_filters(&category).await
}

#[command]
pub async fn blueprints_mission_detail(
    mission_uuid: String,
    direct_unlock_blueprint_id: Option<String>,
) -> Result<MissionDetailResult, String> {
    fetch_mission_detail(mission_uuid, direct_unlock_blueprint_id).await
}

#[command]
pub async fn ingredient_locations(
    commodity_uuid: String,
) -> Result<Vec<IngredientLocationPreview>, String> {
    fetch_ingredient_locations(commodity_uuid).await
}
