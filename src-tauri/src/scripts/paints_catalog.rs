use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::command;

pub(crate) const WIKI_API_BASE: &str = "https://api.star-citizen.wiki";
const USER_AGENT: &str = "MultitoolV2-Paints/2.0";
const CACHE_MAX_AGE_DAYS: u64 = 7;
const CACHE_SCHEMA_VERSION: u32 = 3;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PaintSummary {
    pub uuid: String,
    pub name: String,
    pub name_fr: Option<String>,
    pub ship_name: Option<String>,
    pub manufacturer_name: Option<String>,
    pub manufacturer_code: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub event_sources: Vec<String>,
    pub thumbnail_url: Option<String>,
    pub image_url: Option<String>,
    pub description_en: Option<String>,
    #[serde(default)]
    pub is_base_variant: bool,
    pub web_url: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PaintsCatalogCache {
    #[serde(default)]
    schema_version: u32,
    fetched_at: String,
    paints: Vec<PaintSummary>,
}

#[derive(Deserialize)]
struct WikiPaginationMeta {
    last_page: u64,
}

#[derive(Deserialize)]
struct WikiItemsListResponse {
    data: Vec<WikiPaintItem>,
    meta: Option<WikiPaginationMeta>,
}

#[derive(Deserialize)]
struct WikiPaintItem {
    uuid: String,
    name: String,
    class_name: Option<String>,
    description: Option<WikiLocalizedText>,
    manufacturer: Option<WikiManufacturer>,
    #[serde(default, deserialize_with = "deserialize_string_list")]
    event_source: Vec<String>,
    tags: Option<Vec<String>>,
    required_tags: Option<Vec<String>>,
    images: Option<Vec<WikiImage>>,
    web_url: Option<String>,
    updated_at: Option<String>,
}

fn deserialize_string_list<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Option::<serde_json::Value>::deserialize(deserializer)?;
    Ok(match value {
        None | Some(serde_json::Value::Null) => Vec::new(),
        Some(serde_json::Value::Array(items)) => items
            .into_iter()
            .filter_map(|v| {
                v.as_str()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .map(str::to_string)
            })
            .collect(),
        Some(serde_json::Value::String(s)) => {
            let t = s.trim();
            if t.is_empty() {
                Vec::new()
            } else {
                vec![t.to_string()]
            }
        }
        Some(_) => Vec::new(),
    })
}

#[derive(Deserialize)]
struct WikiLocalizedText {
    fr_fr: Option<String>,
    en_en: Option<String>,
}

#[derive(Deserialize)]
struct WikiManufacturer {
    name: Option<String>,
    code: Option<String>,
}

#[derive(Deserialize)]
struct WikiImage {
    url: Option<String>,
    thumbnail: Option<String>,
    thumbnail_url: Option<String>,
    original_url: Option<String>,
}

#[derive(Deserialize)]
struct WikiVehicleListResponse {
    data: Vec<WikiVehicleRow>,
    meta: Option<WikiPaginationMeta>,
}

#[derive(Deserialize)]
struct WikiVehicleRow {
    slug: Option<String>,
    ports: Option<Vec<WikiVehiclePort>>,
    images: Option<Vec<WikiImage>>,
}

struct PaintShipMedia {
    thumbnail: String,
    slug: Option<String>,
}

#[derive(Deserialize)]
struct WikiVehiclePort {
    name: Option<String>,
    required_tags: Option<Vec<String>>,
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| format!("Impossible d'initialiser le client HTTP: {e}"))
}

fn paints_cache_path() -> Option<PathBuf> {
    let dir = dirs::data_local_dir()?.join("multitool").join("paints");
    fs::create_dir_all(&dir).ok()?;
    Some(dir.join("paints_catalog.json"))
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

fn sort_paints(paints: &mut [PaintSummary]) {
    paints.sort_by(|a, b| {
        b.updated_at
            .cmp(&a.updated_at)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
}

fn cache_is_fresh(cache: &PaintsCatalogCache) -> bool {
    cache.schema_version == CACHE_SCHEMA_VERSION
}

fn load_cache_from_disk() -> Result<Vec<PaintSummary>, String> {
    let path = paints_cache_path()
        .ok_or_else(|| "Impossible de résoudre le dossier cache peintures.".to_string())?;
    if !path.exists() {
        return Err("Cache peintures absent.".to_string());
    }
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let cache: PaintsCatalogCache =
        serde_json::from_slice(&bytes).map_err(|e| format!("Cache peintures illisible: {e}"))?;
    if !cache_is_fresh(&cache) {
        return Err("Cache peintures obsolète.".to_string());
    }
    let mut paints = cache.paints;
    sort_paints(&mut paints);
    Ok(paints)
}

fn persist_cache(paints: &[PaintSummary]) {
    if let Some(path) = paints_cache_path() {
        let cache = PaintsCatalogCache {
            schema_version: CACHE_SCHEMA_VERSION,
            fetched_at: chrono::Utc::now().to_rfc3339(),
            paints: paints.to_vec(),
        };
        if let Ok(bytes) = serde_json::to_vec(&cache) {
            let _ = fs::write(path, bytes);
        }
    }
}

fn extract_ship_name(item: &WikiPaintItem) -> Option<String> {
    let from_tag = item
        .required_tags
        .as_ref()
        .or(item.tags.as_ref())
        .and_then(|tags| {
            tags.iter()
                .find(|t| t.starts_with("Paint_") && !t.starts_with("@"))
                .map(|t| t.trim_start_matches("Paint_").to_string())
        });
    if from_tag.is_some() {
        return from_tag;
    }
    item.class_name.as_ref().and_then(|cn| {
        cn.strip_prefix("Paint_")
            .and_then(|rest| rest.split('_').next())
            .map(|s| s.to_string())
    })
}

fn pick_thumbnail(images: Option<&Vec<WikiImage>>) -> Option<String> {
    images.and_then(|imgs| {
        imgs.iter().find_map(|img| {
            img.thumbnail_url
                .clone()
                .or_else(|| img.thumbnail.clone())
                .or_else(|| img.url.clone())
                .or_else(|| img.original_url.clone())
                .filter(|u| !u.is_empty())
        })
    })
}

fn pick_full_image(images: Option<&Vec<WikiImage>>) -> Option<String> {
    images.and_then(|imgs| {
        imgs.iter().find_map(|img| {
            img.original_url
                .clone()
                .or_else(|| img.url.clone())
                .or_else(|| img.thumbnail_url.clone())
                .or_else(|| img.thumbnail.clone())
                .filter(|u| !u.is_empty())
        })
    })
}

fn media_tools_fallback(slug: &str) -> String {
    let normalized = slug.trim().to_lowercase().replace(' ', "-");
    format!("https://media.starcitizen.tools/auto/ship/{normalized}_side.jpg")
}

fn is_skin_paint(item: &WikiPaintItem) -> bool {
    if item
        .name
        .to_ascii_lowercase()
        .contains("skin")
    {
        return true;
    }
    let tags = item
        .tags
        .as_ref()
        .or(item.required_tags.as_ref());
    if let Some(tags) = tags {
        if tags.iter().any(|t| t.to_ascii_lowercase().contains("skin")) {
            return true;
        }
    }
    item.class_name
        .as_ref()
        .is_some_and(|cn| cn.to_ascii_lowercase().contains("skin"))
}

fn paint_port_tag(item: &WikiPaintItem) -> Option<String> {
    item.required_tags
        .as_ref()
        .or(item.tags.as_ref())
        .and_then(|tags| {
            tags.iter()
                .find(|t| t.starts_with("Paint_") && !t.starts_with("@"))
                .cloned()
        })
}

async fn fetch_vehicles_page(page: u64, page_size: u64) -> Result<WikiVehicleListResponse, String> {
    let url = format!("{WIKI_API_BASE}/api/vehicles?page[number]={page}&page[size]={page_size}");
    let client = http_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Star Citizen Wiki (vehicles): {e}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "Star Citizen Wiki a renvoyé HTTP {} (vehicles)",
            response.status()
        ));
    }
    response
        .json()
        .await
        .map_err(|e| format!("Réponse Wiki /api/vehicles illisible: {e}"))
}

async fn fetch_paint_port_media() -> Result<HashMap<String, PaintShipMedia>, String> {
    const PAGE_SIZE: u64 = 100;
    let first = fetch_vehicles_page(1, PAGE_SIZE).await?;
    let last_page = first.meta.as_ref().map(|m| m.last_page).unwrap_or(1).max(1);
    let mut vehicles = first.data;
    for page in 2..=last_page {
        let resp = fetch_vehicles_page(page, PAGE_SIZE).await?;
        vehicles.extend(resp.data);
    }

    let mut by_paint_tag = HashMap::new();
    for vehicle in vehicles {
        let thumbnail = pick_thumbnail(vehicle.images.as_ref());
        let Some(thumbnail) = thumbnail else {
            continue;
        };
        let slug = vehicle.slug.clone();
        let Some(ports) = vehicle.ports.as_ref() else {
            continue;
        };
        for port in ports {
            if port.name.as_deref() != Some("hardpoint_paint") {
                continue;
            }
            let Some(required_tags) = port.required_tags.as_ref() else {
                continue;
            };
            for tag in required_tags {
                if tag.starts_with("Paint_") {
                    by_paint_tag
                        .entry(tag.clone())
                        .or_insert_with(|| PaintShipMedia {
                            thumbnail: thumbnail.clone(),
                            slug: slug.clone(),
                        });
                }
            }
        }
    }
    Ok(by_paint_tag)
}

fn summary_from_wiki(
    item: WikiPaintItem,
    ship_media: &HashMap<String, PaintShipMedia>,
) -> PaintSummary {
    let ship_name = extract_ship_name(&item);
    let port_tag = paint_port_tag(&item);
    let port_media = port_tag.as_ref().and_then(|tag| ship_media.get(tag));

    let thumbnail_url = pick_thumbnail(item.images.as_ref()).or_else(|| {
        port_media.map(|m| m.thumbnail.clone())
    });
    let image_url = pick_full_image(item.images.as_ref())
        .or_else(|| port_media.map(|m| m.thumbnail.clone()))
        .or_else(|| {
            port_media
                .and_then(|m| m.slug.as_deref())
                .map(media_tools_fallback)
        });
    let description_en = item
        .description
        .as_ref()
        .and_then(|d| d.en_en.clone())
        .filter(|s| !s.is_empty());
    let is_base_variant = !is_skin_paint(&item);

    PaintSummary {
        uuid: item.uuid,
        name: item.name,
        name_fr: item
            .description
            .as_ref()
            .and_then(|d| d.fr_fr.clone())
            .filter(|s| !s.is_empty()),
        ship_name,
        manufacturer_name: item.manufacturer.as_ref().and_then(|m| m.name.clone()),
        manufacturer_code: item.manufacturer.as_ref().and_then(|m| m.code.clone()),
        event_sources: item.event_source,
        thumbnail_url,
        image_url,
        description_en,
        is_base_variant,
        web_url: item.web_url,
        updated_at: item.updated_at,
    }
}

async fn fetch_paints_page(page: u64, page_size: u64) -> Result<WikiItemsListResponse, String> {
    let url = format!(
        "{WIKI_API_BASE}/api/items?filter[type]=Paints&page[number]={page}&page[size]={page_size}"
    );
    let client = http_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Star Citizen Wiki: {e}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "Star Citizen Wiki a renvoyé HTTP {}",
            response.status()
        ));
    }
    response
        .json()
        .await
        .map_err(|e| format!("Réponse Wiki /api/items (Paints) illisible: {e}"))
}

async fn fetch_all_paints() -> Result<Vec<PaintSummary>, String> {
    const PAGE_SIZE: u64 = 200;
    let (first, ship_media) = tokio::try_join!(
        fetch_paints_page(1, PAGE_SIZE),
        fetch_paint_port_media()
    )?;
    let last_page = first.meta.as_ref().map(|m| m.last_page).unwrap_or(1).max(1);
    let mut all = first.data;
    for page in 2..=last_page {
        let resp = fetch_paints_page(page, PAGE_SIZE).await?;
        all.extend(resp.data);
    }
    let mut paints: Vec<PaintSummary> = all
        .into_iter()
        .map(|item| summary_from_wiki(item, &ship_media))
        .collect();
    sort_paints(&mut paints);
    Ok(paints)
}

async fn load_paints_catalog() -> Result<Vec<PaintSummary>, String> {
    if let Some(path) = paints_cache_path() {
        if !is_cache_stale(&path, CACHE_MAX_AGE_DAYS) {
            if let Ok(paints) = load_cache_from_disk() {
                return Ok(paints);
            }
        }
    }

    match fetch_all_paints().await {
        Ok(paints) => {
            persist_cache(&paints);
            Ok(paints)
        }
        Err(e) => {
            if let Ok(cached) = load_cache_from_disk() {
                eprintln!("[paints] fetch Wiki échoué, cache local utilisé: {e}");
                Ok(cached)
            } else {
                Err(e)
            }
        }
    }
}

/// Liste le catalogue des peintures vaisseaux (cache local 7 jours).
#[command]
pub async fn paints_catalog_list() -> Result<Vec<PaintSummary>, String> {
    load_paints_catalog().await
}
