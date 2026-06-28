use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::command;

pub(crate) const WIKI_API_BASE: &str = "https://api.star-citizen.wiki";
const USER_AGENT: &str = "MultitoolV2-Vehicles/2.0";
const CACHE_MAX_AGE_DAYS: u64 = 7;
const CACHE_SCHEMA_VERSION: u32 = 3;

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehicleSummary {
    pub uuid: String,
    pub name: String,
    pub slug: String,
    pub manufacturer_name: Option<String>,
    pub manufacturer_code: Option<String>,
    pub size_class: Option<u64>,
    pub cargo_capacity: Option<f64>,
    pub speed_scm: Option<f64>,
    pub speed_max: Option<f64>,
    pub crew_max: Option<u64>,
    pub health: Option<f64>,
    pub shield_hp: Option<f64>,
    pub pilot_dps: Option<f64>,
    pub career: Option<String>,
    pub role: Option<String>,
    pub production_status: Option<String>,
    pub class_name: Option<String>,
    pub variant_label: Option<String>,
    pub display_name: String,
    pub thumbnail_url: Option<String>,
    pub purchase_min_price: Option<u64>,
    pub rental_min_price: Option<u64>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehicleDimensions {
    pub length: Option<f64>,
    pub width: Option<f64>,
    pub height: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehicleImage {
    pub source: Option<String>,
    pub original_url: Option<String>,
    pub thumbnail_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehicleUexLocation {
    pub name: Option<String>,
    pub system_name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehicleUexPrice {
    pub price_buy: Option<u64>,
    pub price_rent: Option<u64>,
    pub terminal_name: Option<String>,
    pub terminal_code: Option<String>,
    pub location: Option<VehicleUexLocation>,
    pub uex_link: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehicleUexPrices {
    #[serde(default)]
    pub purchase: Vec<VehicleUexPrice>,
    #[serde(default)]
    pub rental: Vec<VehicleUexPrice>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehiclePortSummary {
    pub name: String,
    pub category_label: Option<String>,
    pub item_name: Option<String>,
    pub item_manufacturer: Option<String>,
    pub item_type_label: Option<String>,
    pub item_size: Option<u64>,
    pub item_grade: Option<String>,
    pub item_class: Option<String>,
    pub position: Option<String>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct VehicleDetail {
    #[serde(flatten)]
    pub summary: VehicleSummary,
    pub dimensions: VehicleDimensions,
    pub description_fr: Option<String>,
    pub description_en: Option<String>,
    pub game_name: Option<String>,
    pub web_url: Option<String>,
    pub msrp: Option<u64>,
    pub pledge_url: Option<String>,
    #[serde(default)]
    pub images: Vec<VehicleImage>,
    pub uex_prices: VehicleUexPrices,
    #[serde(default)]
    pub ports: Vec<VehiclePortSummary>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VehiclesCatalogCache {
    #[serde(default)]
    schema_version: u32,
    fetched_at: String,
    vehicles: Vec<VehicleSummary>,
}

#[derive(Deserialize)]
struct WikiPaginationMeta {
    last_page: u64,
}

#[derive(Deserialize)]
struct WikiVehicleListResponse {
    data: Vec<WikiVehicleItem>,
    meta: Option<WikiPaginationMeta>,
}

#[derive(Deserialize)]
struct WikiVehicleDetailResponse {
    data: WikiVehicleItem,
}

#[derive(Deserialize)]
struct WikiLocalizedText {
    #[serde(rename = "en_EN", alias = "en_en", default)]
    en_en: Option<String>,
    #[serde(rename = "fr_FR", alias = "fr_fr", default)]
    fr_fr: Option<String>,
}

#[derive(Deserialize)]
struct WikiManufacturer {
    name: Option<String>,
    code: Option<String>,
}

#[derive(Deserialize)]
struct WikiImage {
    source: Option<String>,
    original_url: Option<String>,
    thumbnail_url: Option<String>,
    thumbnail: Option<String>,
    url: Option<String>,
}

#[derive(Deserialize)]
struct WikiCrew {
    max: Option<u64>,
}

#[derive(Deserialize)]
struct WikiSpeed {
    scm: Option<f64>,
    max: Option<f64>,
}

#[derive(Deserialize)]
struct WikiDimension {
    length: Option<f64>,
    width: Option<f64>,
    beam: Option<f64>,
    height: Option<f64>,
}

#[derive(Deserialize)]
struct WikiWeaponry {
    pilot_dps: Option<f64>,
}

#[derive(Deserialize)]
struct WikiUexStarmapLocation {
    name: Option<String>,
    star_system_name: Option<String>,
}

#[derive(Deserialize)]
struct WikiUexPriceRow {
    price_buy: Option<u64>,
    price_rent: Option<u64>,
    terminal_name: Option<String>,
    terminal_code: Option<String>,
    starmap_location: Option<WikiUexStarmapLocation>,
    uex_link: Option<String>,
}

#[derive(Deserialize)]
struct WikiUexPrices {
    #[serde(default)]
    purchase: Vec<WikiUexPriceRow>,
    #[serde(default)]
    rental: Vec<WikiUexPriceRow>,
}

#[derive(Deserialize)]
struct WikiPortItem {
    name: Option<String>,
    category_label: Option<String>,
    type_label: Option<String>,
    position: Option<String>,
    equipped_item: Option<WikiPortItemRef>,
    #[serde(alias = "item")]
    item: Option<WikiPortItemRef>,
    ports: Option<Vec<WikiPortItem>>,
}

#[derive(Deserialize)]
struct WikiPortItemRef {
    name: Option<String>,
    manufacturer: Option<WikiManufacturer>,
    size: Option<u64>,
    type_label: Option<String>,
    #[serde(default, deserialize_with = "deserialize_optional_flexible_string")]
    grade: Option<String>,
    #[serde(
        default,
        rename = "class",
        deserialize_with = "deserialize_optional_flexible_string"
    )]
    item_class: Option<String>,
}

fn deserialize_optional_flexible_string<'de, D>(
    deserializer: D,
) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Option::<serde_json::Value>::deserialize(deserializer)?;
    Ok(match value {
        None | Some(serde_json::Value::Null) => None,
        Some(serde_json::Value::String(s)) => {
            let trimmed = s.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        }
        Some(serde_json::Value::Number(n)) => Some(n.to_string()),
        Some(serde_json::Value::Bool(b)) => Some(b.to_string()),
        Some(_) => None,
    })
}

#[derive(Deserialize)]
struct WikiVehicleItem {
    uuid: String,
    name: String,
    slug: Option<String>,
    class_name: Option<String>,
    game_name: Option<String>,
    manufacturer: Option<WikiManufacturer>,
    size_class: Option<u64>,
    cargo_capacity: Option<f64>,
    crew: Option<WikiCrew>,
    health: Option<f64>,
    shield_hp: Option<f64>,
    speed: Option<WikiSpeed>,
    weaponry: Option<WikiWeaponry>,
    career: Option<String>,
    role: Option<String>,
    production_status: Option<WikiLocalizedText>,
    images: Option<Vec<WikiImage>>,
    uex_prices: Option<WikiUexPrices>,
    dimension: Option<WikiDimension>,
    sizes: Option<WikiDimension>,
    description: Option<WikiLocalizedText>,
    web_url: Option<String>,
    msrp: Option<u64>,
    pledge_url: Option<String>,
    ports: Option<Vec<WikiPortItem>>,
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| format!("Impossible d'initialiser le client HTTP: {e}"))
}

fn vehicles_cache_path() -> Option<PathBuf> {
    let dir = dirs::data_local_dir()?.join("multitool").join("vehicles");
    fs::create_dir_all(&dir).ok()?;
    Some(dir.join("vehicles_catalog.json"))
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

fn sort_vehicles(vehicles: &mut [VehicleSummary]) {
    vehicles.sort_by(|a, b| {
        a.display_name
            .to_lowercase()
            .cmp(&b.display_name.to_lowercase())
            .then_with(|| a.uuid.cmp(&b.uuid))
    });
}

fn is_placeholder_str(value: &str) -> bool {
    let upper = value.to_ascii_uppercase();
    upper.contains("PLACEHOLDER") || value.trim() == "<= PLACEHOLDER =>"
}

fn sanitize_optional_text(value: Option<String>) -> Option<String> {
    value.filter(|text| !text.trim().is_empty() && !is_placeholder_str(text))
}

fn production_status_canonical(text: &Option<WikiLocalizedText>) -> Option<String> {
    let raw = text.as_ref().and_then(|t| {
        t.en_en
            .as_ref()
            .filter(|s| !s.is_empty())
            .or_else(|| t.fr_fr.as_ref().filter(|s| !s.is_empty()))
            .cloned()
    })?;
    if is_placeholder_str(&raw) {
        return None;
    }
    Some(raw.to_ascii_lowercase())
}

fn humanize_slug_suffix(suffix: &str) -> String {
    match suffix {
        "gs" => "GS".to_string(),
        "bis2950" => "BIS 2950".to_string(),
        "showdown" => "Best In Show".to_string(),
        "exec-military" => "PYAM Exec Militaire".to_string(),
        "exec-stealth" | "exec-stealthindustrial" => "PYAM Exec Furtif".to_string(),
        "collector-military" | "collector-milt" => "Collector Militaire".to_string(),
        "collector-indust" => "Collector Industriel".to_string(),
        "collector-competition" => "Collector Compétition".to_string(),
        "tsg" => "TSG".to_string(),
        "fw-25" => "FW 25".to_string(),
        "plat" => "Platinum".to_string(),
        "pir" => "Pirate".to_string(),
        other => other
            .split('-')
            .filter(|part| !part.is_empty())
            .map(|part| {
                let mut chars = part.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" "),
    }
}

fn variant_label_from_slug(base_slug: &str, slug: &str) -> Option<String> {
    if slug == base_slug {
        return None;
    }
    let prefix = format!("{base_slug}-");
    slug.strip_prefix(&prefix)
        .filter(|suffix| !suffix.is_empty())
        .map(humanize_slug_suffix)
}

fn variant_label_from_class_name(base_class: &str, class_name: &str) -> Option<String> {
    if class_name == base_class {
        return None;
    }
    let prefix = format!("{base_class}_");
    class_name
        .strip_prefix(&prefix)
        .filter(|suffix| !suffix.is_empty())
        .map(|suffix| humanize_slug_suffix(&suffix.to_ascii_lowercase().replace('_', "-")))
}

fn infer_variant_label_single(slug: &str, class_name: Option<&str>) -> Option<String> {
    const KNOWN_SUFFIXES: &[&str] = &[
        "-exec-military",
        "-exec-stealthindustrial",
        "-exec-stealth",
        "-collector-competition",
        "-collector-military",
        "-collector-milt",
        "-collector-indust",
        "-bis2950",
        "-showdown",
        "-fw-25",
        "-gs",
        "-plat",
        "-tsg",
        "-pir",
    ];

    for suffix in KNOWN_SUFFIXES {
        if slug.ends_with(suffix) {
            return Some(humanize_slug_suffix(&suffix.trim_start_matches('-')));
        }
    }

    if let Some(class_name) = class_name {
        if let Some((base, suffix)) = class_name.rsplit_once('_') {
            if !base.is_empty() && !suffix.is_empty() && suffix != class_name {
                return Some(humanize_slug_suffix(&suffix.to_ascii_lowercase()));
            }
        }
    }

    None
}

fn apply_variant_labels(vehicles: &mut [VehicleSummary]) {
    let mut groups: HashMap<String, Vec<usize>> = HashMap::new();
    for (index, vehicle) in vehicles.iter().enumerate() {
        groups.entry(vehicle.name.clone()).or_default().push(index);
    }

    for indices in groups.values() {
        if indices.len() <= 1 {
            if let Some(&index) = indices.first() {
                vehicles[index].display_name = vehicles[index].name.clone();
            }
            continue;
        }

        let base_slug = indices
            .iter()
            .map(|&index| vehicles[index].slug.as_str())
            .min_by_key(|slug| slug.len())
            .unwrap_or("")
            .to_string();
        let base_class = indices
            .iter()
            .filter_map(|&index| vehicles[index].class_name.as_deref())
            .min_by_key(|class_name| class_name.len())
            .map(str::to_string);

        for &index in indices {
            let label = variant_label_from_slug(&base_slug, &vehicles[index].slug).or_else(|| {
                base_class.as_ref().and_then(|base| {
                    vehicles[index]
                        .class_name
                        .as_deref()
                        .and_then(|class_name| variant_label_from_class_name(base, class_name))
                })
            });

            vehicles[index].variant_label = label.clone();
            vehicles[index].display_name = if let Some(label) = label {
                format!("{} ({label})", vehicles[index].name)
            } else {
                vehicles[index].name.clone()
            };
        }
    }
}

fn enrich_summary_display(summary: &mut VehicleSummary) {
    if let Ok(cached) = load_cache_from_disk() {
        if let Some(found) = cached.iter().find(|vehicle| vehicle.uuid == summary.uuid) {
            summary.class_name = found.class_name.clone();
            summary.variant_label = found.variant_label.clone();
            summary.display_name = found.display_name.clone();
            return;
        }
    }

    if let Some(label) =
        infer_variant_label_single(&summary.slug, summary.class_name.as_deref())
    {
        summary.variant_label = Some(label.clone());
        summary.display_name = format!("{} ({label})", summary.name);
    } else {
        summary.display_name = summary.name.clone();
    }
}

fn cache_is_fresh(cache: &VehiclesCatalogCache) -> bool {
    cache.schema_version == CACHE_SCHEMA_VERSION
}

fn load_cache_from_disk() -> Result<Vec<VehicleSummary>, String> {
    let path = vehicles_cache_path()
        .ok_or_else(|| "Impossible de résoudre le dossier cache vaisseaux.".to_string())?;
    if !path.exists() {
        return Err("Cache vaisseaux absent.".to_string());
    }
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let cache: VehiclesCatalogCache =
        serde_json::from_slice(&bytes).map_err(|e| format!("Cache vaisseaux illisible: {e}"))?;
    if !cache_is_fresh(&cache) {
        return Err("Cache vaisseaux obsolète.".to_string());
    }
    let mut vehicles = cache.vehicles;
    sort_vehicles(&mut vehicles);
    Ok(vehicles)
}

fn persist_cache(vehicles: &[VehicleSummary]) {
    if let Some(path) = vehicles_cache_path() {
        let cache = VehiclesCatalogCache {
            schema_version: CACHE_SCHEMA_VERSION,
            fetched_at: chrono::Utc::now().to_rfc3339(),
            vehicles: vehicles.to_vec(),
        };
        if let Ok(bytes) = serde_json::to_vec(&cache) {
            let _ = fs::write(path, bytes);
        }
    }
}

fn is_illustration_url(url: &str) -> bool {
    let lower = url.to_lowercase();
    lower.contains("illustration")
        || lower.contains("concept")
        || lower.contains("promo")
        || lower.contains("render")
        || lower.contains("over_")
        || lower.contains("_sale_")
}

fn image_url(img: &WikiImage) -> Option<String> {
    img.thumbnail_url
        .clone()
        .or_else(|| img.thumbnail.clone())
        .or_else(|| img.original_url.clone())
        .or_else(|| img.url.clone())
        .filter(|u| !u.is_empty())
}

fn pick_vehicle_thumbnail(images: Option<&Vec<WikiImage>>) -> Option<String> {
    let imgs = images?;
    let tools: Vec<&WikiImage> = imgs
        .iter()
        .filter(|img| img.source.as_deref() == Some("starcitizen.tools"))
        .collect();
    if !tools.is_empty() {
        if let Some(img) = tools
            .iter()
            .find(|img| img.original_url.as_ref().is_some_and(|u| is_illustration_url(u)))
        {
            return image_url(img);
        }
        return image_url(tools[0]);
    }
    imgs.iter().find_map(image_url)
}

fn min_price(rows: &[WikiUexPriceRow], field: fn(&WikiUexPriceRow) -> Option<u64>) -> Option<u64> {
    rows.iter().filter_map(field).min()
}

fn map_uex_row(row: &WikiUexPriceRow) -> VehicleUexPrice {
    VehicleUexPrice {
        price_buy: row.price_buy,
        price_rent: row.price_rent,
        terminal_name: row.terminal_name.clone(),
        terminal_code: row.terminal_code.clone(),
        location: row.starmap_location.as_ref().map(|loc| VehicleUexLocation {
            name: loc.name.clone(),
            system_name: loc.star_system_name.clone(),
        }),
        uex_link: row.uex_link.clone(),
    }
}

fn map_uex_prices(prices: &Option<WikiUexPrices>) -> VehicleUexPrices {
    let Some(prices) = prices else {
        return VehicleUexPrices::default();
    };
    VehicleUexPrices {
        purchase: prices.purchase.iter().map(map_uex_row).collect(),
        rental: prices.rental.iter().map(map_uex_row).collect(),
    }
}

fn summary_from_wiki(item: &WikiVehicleItem) -> VehicleSummary {
    let uex = item.uex_prices.as_ref();
    let name = item.name.clone();
    VehicleSummary {
        uuid: item.uuid.clone(),
        name: name.clone(),
        slug: item.slug.clone().unwrap_or_default(),
        manufacturer_name: item.manufacturer.as_ref().and_then(|m| m.name.clone()),
        manufacturer_code: item.manufacturer.as_ref().and_then(|m| m.code.clone()),
        size_class: item.size_class,
        cargo_capacity: item.cargo_capacity,
        speed_scm: item.speed.as_ref().and_then(|s| s.scm),
        speed_max: item.speed.as_ref().and_then(|s| s.max),
        crew_max: item.crew.as_ref().and_then(|c| c.max),
        health: item.health,
        shield_hp: item.shield_hp,
        pilot_dps: item.weaponry.as_ref().and_then(|w| w.pilot_dps),
        career: sanitize_optional_text(item.career.clone()),
        role: sanitize_optional_text(item.role.clone()),
        production_status: production_status_canonical(&item.production_status),
        class_name: sanitize_optional_text(item.class_name.clone()),
        variant_label: None,
        display_name: name,
        thumbnail_url: pick_vehicle_thumbnail(item.images.as_ref()),
        purchase_min_price: uex.and_then(|p| min_price(&p.purchase, |r| r.price_buy)),
        rental_min_price: uex.and_then(|p| min_price(&p.rental, |r| r.price_rent)),
    }
}

fn dimensions_from_wiki(item: &WikiVehicleItem) -> VehicleDimensions {
    let dim = item.dimension.as_ref().or(item.sizes.as_ref());
    VehicleDimensions {
        length: dim.and_then(|d| d.length),
        width: dim.and_then(|d| d.width.or(d.beam)),
        height: dim.and_then(|d| d.height),
    }
}

fn port_equipped_item(port: &WikiPortItem) -> Option<&WikiPortItemRef> {
    port.equipped_item
        .as_ref()
        .or(port.item.as_ref())
        .filter(|item| item.name.as_ref().is_some_and(|n| !n.is_empty()))
}

fn collect_ports_from_wiki(port: &WikiPortItem, out: &mut Vec<VehiclePortSummary>) {
    if port.name.as_deref() == Some("hardpoint_paint") {
        return;
    }

    if let Some(item) = port_equipped_item(port) {
        let slot_name = port
            .name
            .clone()
            .filter(|n| !n.is_empty())
            .unwrap_or_else(|| "slot".to_string());
        out.push(VehiclePortSummary {
            name: slot_name,
            category_label: port.category_label.clone(),
            item_name: item.name.clone(),
            item_manufacturer: item
                .manufacturer
                .as_ref()
                .and_then(|m| m.name.clone()),
            item_type_label: item
                .type_label
                .clone()
                .or_else(|| port.type_label.clone()),
            item_size: item.size,
            item_grade: item.grade.clone(),
            item_class: item.item_class.clone(),
            position: port.position.clone(),
        });
    }

    if let Some(children) = &port.ports {
        for child in children {
            collect_ports_from_wiki(child, out);
        }
    }
}

fn ports_from_wiki(ports: Option<&Vec<WikiPortItem>>) -> Vec<VehiclePortSummary> {
    let Some(ports) = ports else {
        return Vec::new();
    };
    let mut out = Vec::new();
    for port in ports {
        collect_ports_from_wiki(port, &mut out);
    }
    out
}

fn images_from_wiki(images: Option<&Vec<WikiImage>>) -> Vec<VehicleImage> {
    images
        .map(|imgs| {
            imgs.iter()
                .map(|img| VehicleImage {
                    source: img.source.clone(),
                    original_url: img.original_url.clone(),
                    thumbnail_url: image_url(img),
                })
                .collect()
        })
        .unwrap_or_default()
}

fn detail_from_wiki(item: WikiVehicleItem) -> VehicleDetail {
    let mut summary = summary_from_wiki(&item);
    enrich_summary_display(&mut summary);
    let dimensions = dimensions_from_wiki(&item);
    let uex_prices = map_uex_prices(&item.uex_prices);
    let ports = ports_from_wiki(item.ports.as_ref());
    let images = images_from_wiki(item.images.as_ref());
    VehicleDetail {
        summary,
        dimensions,
        description_fr: item
            .description
            .as_ref()
            .and_then(|d| d.fr_fr.clone().filter(|s| !s.is_empty())),
        description_en: item
            .description
            .as_ref()
            .and_then(|d| d.en_en.clone().filter(|s| !s.is_empty())),
        game_name: item.game_name,
        web_url: item.web_url,
        msrp: item.msrp,
        pledge_url: item.pledge_url,
        images,
        uex_prices,
        ports,
    }
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

async fn fetch_all_vehicles() -> Result<Vec<VehicleSummary>, String> {
    const PAGE_SIZE: u64 = 50;
    let first = fetch_vehicles_page(1, PAGE_SIZE).await?;
    let last_page = first.meta.as_ref().map(|m| m.last_page).unwrap_or(1).max(1);
    let mut all = first.data;
    for page in 2..=last_page {
        let resp = fetch_vehicles_page(page, PAGE_SIZE).await?;
        all.extend(resp.data);
    }
    let mut vehicles: Vec<VehicleSummary> = all.iter().map(summary_from_wiki).collect();
    apply_variant_labels(&mut vehicles);
    sort_vehicles(&mut vehicles);
    Ok(vehicles)
}

async fn fetch_vehicle_detail(uuid: &str) -> Result<WikiVehicleItem, String> {
    let url = format!("{WIKI_API_BASE}/api/vehicles/{uuid}?include=ports");
    let client = http_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erreur réseau vers Star Citizen Wiki (vehicle detail): {e}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "Star Citizen Wiki a renvoyé HTTP {} (vehicle {uuid})",
            response.status()
        ));
    }
    let raw: WikiVehicleDetailResponse = response
        .json()
        .await
        .map_err(|e| format!("Réponse Wiki /api/vehicles/{uuid} illisible: {e}"))?;
    Ok(raw.data)
}

async fn load_vehicles_catalog() -> Result<Vec<VehicleSummary>, String> {
    if let Some(path) = vehicles_cache_path() {
        if !is_cache_stale(&path, CACHE_MAX_AGE_DAYS) {
            if let Ok(vehicles) = load_cache_from_disk() {
                return Ok(vehicles);
            }
        }
    }

    match fetch_all_vehicles().await {
        Ok(vehicles) => {
            persist_cache(&vehicles);
            Ok(vehicles)
        }
        Err(e) => {
            if let Ok(cached) = load_cache_from_disk() {
                eprintln!("[vehicles] fetch Wiki échoué, cache local utilisé: {e}");
                Ok(cached)
            } else {
                Err(e)
            }
        }
    }
}

/// Liste le catalogue des vaisseaux (cache local 7 jours).
#[command]
pub async fn vehicles_catalog_list() -> Result<Vec<VehicleSummary>, String> {
    load_vehicles_catalog().await
}

/// Détail d'un vaisseau via Star Citizen Wiki (`GET /api/vehicles/{uuid}`).
#[command]
pub async fn vehicle_detail(uuid: String) -> Result<VehicleDetail, String> {
    let trimmed = uuid.trim();
    if trimmed.is_empty() {
        return Err("UUID vaisseau manquant.".to_string());
    }
    let item = fetch_vehicle_detail(trimmed).await?;
    Ok(detail_from_wiki(item))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ports_from_wiki_collects_nested_equipped_items() {
        let ports = vec![WikiPortItem {
            name: Some("Coolers".to_string()),
            category_label: Some("Coolers".to_string()),
            type_label: None,
            position: None,
            equipped_item: None,
            item: None,
            ports: Some(vec![WikiPortItem {
                name: Some("hardpoint_cooler_left".to_string()),
                category_label: None,
                type_label: Some("Cooler".to_string()),
                position: Some("left".to_string()),
                equipped_item: Some(WikiPortItemRef {
                    name: Some("Snowfall S01".to_string()),
                    manufacturer: Some(WikiManufacturer {
                        name: Some("Greycat".to_string()),
                        code: Some("GRT".to_string()),
                    }),
                    size: Some(1),
                    type_label: Some("Cooler".to_string()),
                    grade: Some("B".to_string()),
                    item_class: Some("Industrial".to_string()),
                }),
                item: None,
                ports: None,
            }]),
        }];

        let result = ports_from_wiki(Some(&ports));
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].item_name.as_deref(), Some("Snowfall S01"));
        assert_eq!(result[0].item_manufacturer.as_deref(), Some("Greycat"));
        assert_eq!(result[0].item_size, Some(1));
        assert_eq!(result[0].item_grade.as_deref(), Some("B"));
        assert_eq!(result[0].item_class.as_deref(), Some("Industrial"));
        assert_eq!(result[0].position.as_deref(), Some("left"));
    }

    #[test]
    fn wiki_port_item_ref_accepts_numeric_grade() {
        let item: WikiPortItemRef = serde_json::from_value(serde_json::json!({
            "name": "POWER",
            "grade": 1,
            "class": null
        }))
        .expect("grade entier doit être accepté");

        assert_eq!(item.grade.as_deref(), Some("1"));
        assert!(item.item_class.is_none());
    }

    #[test]
    fn summary_from_wiki_filters_placeholder_role() {
        let item = WikiVehicleItem {
            uuid: "test-uuid".to_string(),
            name: "Test Ship".to_string(),
            slug: Some("test-ship".to_string()),
            class_name: None,
            game_name: None,
            manufacturer: None,
            size_class: None,
            cargo_capacity: None,
            crew: None,
            health: None,
            shield_hp: None,
            speed: None,
            weaponry: None,
            career: None,
            role: Some("<= PLACEHOLDER =>".to_string()),
            production_status: None,
            images: None,
            uex_prices: None,
            dimension: None,
            sizes: None,
            description: None,
            web_url: None,
            msrp: None,
            pledge_url: None,
            ports: None,
        };

        let summary = summary_from_wiki(&item);
        assert!(summary.role.is_none());
        assert_eq!(summary.display_name, "Test Ship");
    }

    #[test]
    fn apply_variant_labels_disambiguates_hammerhead() {
        let mut vehicles = vec![
            VehicleSummary {
                uuid: "1".to_string(),
                name: "Hammerhead".to_string(),
                slug: "aegs-hammerhead".to_string(),
                class_name: Some("AEGS_Hammerhead".to_string()),
                display_name: "Hammerhead".to_string(),
                ..VehicleSummary::default()
            },
            VehicleSummary {
                uuid: "2".to_string(),
                name: "Hammerhead".to_string(),
                slug: "aegs-hammerhead-gs".to_string(),
                class_name: Some("AEGS_Hammerhead_GS".to_string()),
                display_name: "Hammerhead".to_string(),
                ..VehicleSummary::default()
            },
        ];

        apply_variant_labels(&mut vehicles);
        assert_eq!(vehicles[0].display_name, "Hammerhead");
        assert_eq!(vehicles[1].display_name, "Hammerhead (GS)");
        assert_eq!(vehicles[1].variant_label.as_deref(), Some("GS"));
    }

    #[test]
    fn production_status_canonical_normalizes_values() {
        let status = production_status_canonical(&Some(WikiLocalizedText {
            en_en: Some("flight-ready".to_string()),
            fr_fr: Some("flight-ready".to_string()),
        }));
        assert_eq!(status.as_deref(), Some("flight-ready"));
    }

    #[test]
    fn wiki_localized_text_deserializes_api_en_en_keys() {
        let text: WikiLocalizedText = serde_json::from_str(
            r#"{"en_EN":"flight-ready","de_DE":"Flugbereit","fr_FR":"flight-ready"}"#,
        )
        .expect("parse wiki localized text");
        assert_eq!(text.en_en.as_deref(), Some("flight-ready"));
        assert_eq!(text.fr_fr.as_deref(), Some("flight-ready"));
    }

    #[test]
    fn production_status_from_wiki_api_json() {
        let item: WikiVehicleItem = serde_json::from_str(
            r#"{
                "uuid":"u1",
                "name":"Test",
                "production_status":{"en_EN":"in-concept","fr_FR":"in-concept"}
            }"#,
        )
        .expect("parse vehicle");
        assert_eq!(
            production_status_canonical(&item.production_status).as_deref(),
            Some("in-concept")
        );
    }
}
