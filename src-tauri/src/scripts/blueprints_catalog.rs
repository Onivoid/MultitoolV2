use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::command;

use crate::scripts::gamepath::get_star_citizen_versions_sync;

pub(crate) const WIKI_API_BASE: &str = "https://api.star-citizen.wiki";
/// Official CIG global.ini files hosted by PolyTool (auto-synced from game data).
/// We pull from here instead of the user's local install so that translation
/// coverage is identical for all users regardless of which FR pack they have
/// installed (StarTrad, Circuspes, vanilla, none, etc.).
const POLYTOOL_GLOBAL_FR_URL: &str =
    "https://raw.githubusercontent.com/GerbyTV/PolyToolSC/main/global.ini";
const POLYTOOL_GLOBAL_EN_URL: &str =
    "https://raw.githubusercontent.com/GerbyTV/PolyToolSC/main/global_en.ini";
const USER_AGENT: &str = "MultitoolV2-Blueprints/2.0";

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintSummary {
    pub wiki_uuid: String,
    pub blueprint_id: String,
    pub name_en: String,
    pub name_fr: Option<String>,
    pub loc_key: Option<String>,
    pub category: Option<String>,
    pub craft_time_seconds: Option<u64>,
    pub tiers: Option<u64>,
    pub default_owned: bool,
    pub version: Option<String>,
    /// Class code resolved from global.ini description: civi/mili/indu/stlh/comp
    pub class_code: Option<String>,
    /// Component size (1-10) extracted from blueprint key or output metadata.
    pub size: Option<u64>,
    /// Grade composant vaisseau (A–G), issu de `output.grade` Wiki (1–7 → lettre) si type composant ship.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grade: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sub_type: Option<String>,
    /// Code fabricant (segment `bp_craft_{code}_…` ou segment reconnu dans l’ID).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub manufacturer: Option<String>,
    /// Nom affiché du fabricant (Wiki si dispo, sinon table de correspondance).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub manufacturer_name: Option<String>,
    /// Internal item class from Wiki `output_class` (used for global.ini matching).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub internal_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ingredient_count: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unlocking_missions_count: Option<u64>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resource_uuids: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub web_url: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub unlock_systems: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub unlock_jurisdictions: Vec<String>,
    /// Famille craft (armor, ship_component, fps_weapon…).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub family: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_type_label: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub summary_badges: Vec<super::blueprint_family::CatalogBadge>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct IngredientModifier {
    pub property_key: Option<String>,
    pub label: String,
    pub better_when: Option<String>,
    pub quality_min: Option<i64>,
    pub quality_max: Option<i64>,
    pub modifier_at_min_quality: Option<f64>,
    pub modifier_at_max_quality: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct IngredientLocationPreview {
    pub name: String,
    pub system: Option<String>,
    pub location_type: Option<String>,
    /// Probabilité de groupe à ce lieu (0–100), si fournie par l’API Wiki.
    pub spawn_percent: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct IngredientEnrichment {
    pub source_kind: String,
    pub tier: Option<String>,
    pub rarity: Option<String>,
    pub kind_label: Option<String>,
    #[serde(default)]
    pub methods: Vec<String>,
    #[serde(default)]
    pub systems: Vec<String>,
    #[serde(default)]
    pub location_preview: Vec<IngredientLocationPreview>,
    pub location_count: Option<u64>,
    pub refined_version_name: Option<String>,
    pub density: Option<f64>,
    pub signature: Option<i64>,
    pub description_short: Option<String>,
    #[serde(default)]
    pub harvest_hints: Vec<String>,
    pub thumbnail_url: Option<String>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct DismantleReturn {
    pub name: String,
    pub resource_uuid: Option<String>,
    pub quantity_scu: Option<f64>,
    pub web_url: Option<String>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintDismantle {
    pub time_seconds: Option<u64>,
    pub time_label: Option<String>,
    pub efficiency: Option<f64>,
    pub returns: Vec<DismantleReturn>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintAspectSlot {
    pub key: String,
    pub name: String,
    pub label: String,
    pub initial_quality: Option<u64>,
    pub slider_min: Option<u64>,
    pub slider_max: Option<u64>,
    pub has_modifiers: bool,
    #[serde(default)]
    pub modifiers: Vec<IngredientModifier>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintAspectsSummary {
    pub has_interactive: bool,
    pub slots: Vec<BlueprintAspectSlot>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MissionBlueprintReward {
    pub blueprint_id: Option<String>,
    pub wiki_uuid: Option<String>,
    pub name_en: String,
    pub name_fr: Option<String>,
    pub is_direct_unlock: bool,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MissionDetailResult {
    pub mission_uuid: String,
    pub title: String,
    pub star_systems: Vec<String>,
    pub jurisdictions: Vec<String>,
    pub illegal: Option<bool>,
    pub faction: Option<String>,
    pub mission_giver: Option<String>,
    pub web_url: Option<String>,
    pub blueprint_rewards: Vec<MissionBlueprintReward>,
}

/// Extracts size N from Wiki output metadata or blueprint_id pattern "_s01_" / "_s1_".
fn extract_size(blueprint_id: &str, category_name: Option<&str>) -> Option<u64> {
    if let Some(cn) = category_name {
        if let Some(idx) = cn.find('S') {
            let after = &cn[idx + 1..];
            let digits: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
            if let Ok(n) = digits.parse::<u64>() {
                return Some(n);
            }
        }
    }
    // Match "_s12_" or "_s12" at end
    let lower = blueprint_id.to_ascii_lowercase();
    let parts: Vec<&str> = lower.split('_').collect();
    for p in &parts {
        if let Some(rest) = p.strip_prefix('s') {
            if !rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit()) {
                if let Ok(n) = rest.parse::<u64>() {
                    return Some(n);
                }
            }
        }
    }
    None
}

/// Types Wiki pour lesquels `output.grade` (souvent 1–4) est le grade composant vaisseau.
fn is_ship_component_output_type(output_type: &str) -> bool {
    let t = output_type.trim();
    if t.is_empty() || t.starts_with("Char_") {
        return false;
    }
    if t == "WeaponPersonal" {
        return false;
    }
    matches!(
        t,
        "PowerPlant"
            | "Cooler"
            | "Shield"
            | "Radar"
            | "QuantumDrive"
            | "WeaponGun"
            | "WeaponAttachment"
            | "DockingCollar"
            | "TractorBeam"
            | "SalvageModifier"
            | "SalvageHead"
            | "WeaponMining"
            | "QuantumInterdictionGenerator"
            | "Missile"
            | "Bomb"
            | "EMP"
            | "TowingBeam"
    ) || t.starts_with("Ship")
}

/// Grade API (1–7 ou A–G) → lettre affichée ; ignore undefined / valeurs invalides.
fn normalize_ship_component_grade(raw: &str) -> Option<String> {
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

fn wiki_grade(bp: &WikiBlueprint) -> Option<String> {
    let output = bp.output.as_ref()?;
    let otype = output.r#type.as_deref()?;
    if !is_ship_component_output_type(otype) {
        return None;
    }
    output
        .grade
        .as_deref()
        .and_then(normalize_ship_component_grade)
}

fn wiki_sub_type(bp: &WikiBlueprint) -> Option<String> {
    bp.output.as_ref().and_then(|o| o.sub_type.clone())
}

/// Nom complet pour l’affichage catalogue (pas seulement le code 3–4 lettres).
fn manufacturer_display_name(code: &str) -> Option<String> {
    let c = code.trim().to_ascii_lowercase();
    if c.is_empty() {
        return None;
    }
    let name = match c.as_str() {
        "aegs" | "aegis" => "Aegis Dynamics",
        "amrs" | "amonreese" => "Amon Reese",
        "anvl" | "anvil" => "Anvil Aerospace",
        "apar" | "apocalypse" => "Apocalypse Arms",
        "argo" => "Argo Astronautics",
        "asas" => "Ascension Astro",
        "aopoa" => "Aopoa",
        "banu" => "Banu",
        "basl" | "basilisk" => "Basilisk",
        "behr" | "behring" => "Behring",
        "csgi" => "Consolidated Outland",
        "crus" | "crusader" => "Crusader Industries",
        "drak" | "drake" => "Drake Interplanetary",
        "esp" | "esprit" => "Esprit de Corps",
        "gmni" | "gemini" => "Gemini",
        "grin" | "greycat" | "gctec" => "Greycat Industrial",
        "hrst" | "hurston" => "Hurston Dynamics",
        "hrtd" => "Hurston Dynamics",
        "kast" | "ksar" | "kastak" => "Kastak Arms",
        "kbar" | "klwe" | "klauswerner" | "kw" => "Klaus & Werner",
        "krig" | "kruger" => "Kruger Intergalactic",
        "misc" | "musashi" => "Musashi Industrial",
        "orig" | "origin" => "Origin Jumpworks",
        "qrt" | "quirinus" => "Quirinus Tech",
        "rsi" => "Roberts Space Industries",
        "shubin" | "shin" => "Shubin Interstellar",
        "vncl" | "vndl" | "vnduul" | "vanduul" => "Vanduul",
        "xian" => "Xi'an",
        _ => return None,
    };
    Some(name.to_string())
}

fn manufacturer_code_from_id(blueprint_id: &str) -> Option<String> {
    let lower = blueprint_id.to_ascii_lowercase();
    if let Some(rest) = lower.strip_prefix("bp_craft_") {
        for segment in rest.split('_') {
            if classify_manufacturer(segment).is_some() {
                return Some(segment.to_ascii_uppercase());
            }
        }
    }
    let parts: Vec<&str> = lower.split('_').collect();
    if parts.len() >= 3 && parts[0] == "bp" && parts[1] == "craft" {
        let code = parts[2];
        if (2..=6).contains(&code.len()) && code.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Some(code.to_ascii_uppercase());
        }
    }
    None
}

fn wiki_manufacturer_name(bp: &WikiBlueprint) -> Option<String> {
    if let Some(o) = bp.output.as_ref() {
        if let Some(n) = &o.manufacturer_name {
            let t = n.trim();
            if !t.is_empty() {
                return Some(t.to_string());
            }
        }
        if let Some(m) = &o.manufacturer {
            if let Some(n) = &m.name {
                let t = n.trim();
                if !t.is_empty() {
                    return Some(t.to_string());
                }
            }
            if let Some(c) = &m.code {
                if let Some(n) = manufacturer_display_name(c) {
                    return Some(n);
                }
            }
        }
    }
    for prop in &bp.summary_properties {
        let Some(obj) = prop.as_object() else {
            continue;
        };
        for key in ["Manufacturer", "manufacturer", "manufacturer_name"] {
            if let Some(v) = obj.get(key) {
                if let Some(s) = v.as_str() {
                    let t = s.trim();
                    if !t.is_empty() {
                        return Some(t.to_string());
                    }
                }
            }
        }
    }
    None
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BlueprintDetail {
    #[serde(flatten)]
    pub summary: BlueprintSummary,
    pub ingredients: Vec<IngredientGroup>,
    pub missions: Vec<MissionInfo>,
    pub item_stats: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dismantle: Option<BlueprintDismantle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspects: Option<BlueprintAspectsSummary>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub family: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub item_profile: Option<super::blueprints_item_profile::BlueprintItemProfile>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub hero_stats: Vec<super::blueprint_family::HeroStat>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub catalog_badges: Vec<super::blueprint_family::CatalogBadge>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub summary_properties: Vec<super::blueprints_item_profile::SummaryPropertyRow>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct IngredientGroup {
    pub slot: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slot_key: Option<String>,
    pub slot_loc_key: Option<String>,
    pub slot_label_fr: Option<String>,
    pub required_count: Option<u64>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub modifiers: Vec<IngredientModifier>,
    pub options: Vec<IngredientOption>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_quality: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slider_min: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slider_max: Option<u64>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct IngredientOption {
    pub kind: Option<String>,
    pub guid: Option<String>,
    pub ore_uuid: Option<String>,
    pub name: String,
    pub name_fr: Option<String>,
    pub loc_key: Option<String>,
    pub quantity_scu: Option<f64>,
    pub quantity: Option<u64>,
    pub min_quality: Option<u64>,
    pub unit: Option<String>,
    pub web_url: Option<String>,
    pub api_link: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enrichment: Option<IngredientEnrichment>,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MissionInfo {
    pub mission_id: Option<u64>,
    pub mission_uuid: Option<String>,
    pub name_raw: String,
    pub name_fr: Option<String>,
    pub loc_key: Option<String>,
    pub description_en: Option<String>,
    pub description_fr: Option<String>,
    pub description_loc_key: Option<String>,
    pub contractor: Option<String>,
    pub mission_type: Option<String>,
    pub category: Option<String>,
    pub lawful: Option<bool>,
    pub not_for_release: Option<bool>,
    pub drop_chance: Option<String>,
    pub locations: Option<String>,
    pub time_to_complete_minutes: Option<u64>,
    pub min_standing_name: Option<String>,
    pub min_standing_reputation: Option<i64>,
    pub standing_reward: Option<i64>,
    pub debug_name: Option<String>,
    pub web_url: Option<String>,
    #[serde(default)]
    pub star_systems: Vec<String>,
    #[serde(default)]
    pub jurisdictions: Vec<String>,
}

// --- Star Citizen Wiki API types ---

#[derive(Deserialize, Serialize, Clone)]
struct WikiBlueprintListResponse {
    data: Vec<WikiBlueprint>,
    #[serde(default)]
    meta: Option<WikiPaginationMeta>,
}

#[derive(Deserialize, Serialize, Clone)]
struct WikiBlueprintDetailResponse {
    data: WikiBlueprint,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiPaginationMeta {
    #[serde(default)]
    current_page: u64,
    #[serde(default)]
    last_page: u64,
}

#[derive(Deserialize, Serialize, Clone)]
struct WikiCatalogCache {
    #[serde(default)]
    game_version: Option<String>,
    blueprints: Vec<WikiBlueprint>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
pub(crate) struct WikiBlueprint {
    pub(crate) uuid: String,
    pub(crate) key: String,
    #[serde(default)]
    output_name: Option<String>,
    #[serde(default)]
    output_class: Option<String>,
    #[serde(default)]
    craft_time_seconds: Option<u64>,
    #[serde(default)]
    is_available_by_default: Option<bool>,
    #[serde(default)]
    game_version: Option<String>,
    #[serde(default)]
    ingredient_count: Option<u64>,
    #[serde(default)]
    pub(crate) unlocking_missions_count: Option<u64>,
    #[serde(default)]
    ingredients: Vec<WikiIngredient>,
    #[serde(default)]
    output: Option<WikiBlueprintOutput>,
    #[serde(default)]
    requirement_groups: Vec<WikiRequirementGroup>,
    #[serde(default)]
    pub(crate) unlocking_missions: Vec<WikiUnlockingMission>,
    #[serde(default)]
    summary_properties: Vec<serde_json::Value>,
    #[serde(default)]
    tiers: Vec<WikiBlueprintTier>,
    #[serde(default)]
    web_url: Option<String>,
    #[serde(default)]
    dismantle_returns: Vec<WikiDismantleReturn>,
    #[serde(default)]
    dismantle: Option<WikiDismantle>,
    #[serde(default)]
    aspects: Option<serde_json::Value>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiDismantleReturn {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    resource_type_uuid: Option<String>,
    #[serde(default)]
    quantity_scu: Option<f64>,
    #[serde(default)]
    web_url: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiDismantle {
    #[serde(default)]
    time_seconds: Option<u64>,
    #[serde(default)]
    time_label: Option<String>,
    #[serde(default)]
    efficiency: Option<f64>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiManufacturerStub {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    code: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiBlueprintOutput {
    #[serde(default)]
    uuid: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    class: Option<String>,
    #[serde(default)]
    r#type: Option<String>,
    #[serde(default)]
    type_label: Option<String>,
    #[serde(default)]
    sub_type: Option<String>,
    #[serde(default)]
    grade: Option<String>,
    #[serde(default)]
    manufacturer_name: Option<String>,
    #[serde(default)]
    manufacturer: Option<WikiManufacturerStub>,
    #[serde(default)]
    item_web_url: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiIngredient {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    kind: Option<String>,
    #[serde(default)]
    resource_type_uuid: Option<String>,
    #[serde(default)]
    item_uuid: Option<String>,
    #[serde(default)]
    quantity_scu: Option<f64>,
    #[serde(default)]
    quantity: Option<f64>,
    #[serde(default)]
    web_url: Option<String>,
    #[serde(default)]
    link: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiQualityRange {
    #[serde(default)]
    min: Option<i64>,
    #[serde(default)]
    max: Option<i64>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiModifierRange {
    #[serde(rename = "at_min_quality", default)]
    at_min_quality: Option<f64>,
    #[serde(rename = "at_max_quality", default)]
    at_max_quality: Option<f64>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiModifier {
    #[serde(default)]
    property_key: Option<String>,
    #[serde(default)]
    label: Option<String>,
    #[serde(default)]
    better_when: Option<String>,
    #[serde(default)]
    quality_range: Option<WikiQualityRange>,
    #[serde(default)]
    modifier_range: Option<WikiModifierRange>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiRequirementGroup {
    #[serde(default)]
    key: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    required_count: Option<u64>,
    #[serde(default)]
    modifiers: Vec<WikiModifier>,
    #[serde(default)]
    children: Vec<WikiRequirementChild>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiRequirementChild {
    #[serde(default)]
    key: Option<String>,
    #[serde(default)]
    kind: Option<String>,
    #[serde(default)]
    uuid: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    ore_uuid: Option<String>,
    #[serde(default)]
    quantity_scu: Option<f64>,
    #[serde(default)]
    quantity: Option<f64>,
    #[serde(default)]
    min_quality: Option<u64>,
    #[serde(default)]
    modifiers: Vec<WikiModifier>,
    #[serde(default)]
    children: Vec<WikiRequirementChild>,
    #[serde(default)]
    web_url: Option<String>,
    #[serde(default)]
    link: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
pub(crate) struct WikiUnlockingMission {
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    pub(crate) debug_name: Option<String>,
    #[serde(default)]
    reward_scope: Option<String>,
    #[serde(default)]
    chance: Option<f64>,
    #[serde(default)]
    pub(crate) web_url: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Default)]
struct WikiBlueprintTier {
    #[serde(default)]
    tier_index: Option<u64>,
}

struct LocCache {
    fr: Option<HashMap<String, String>>,
    /// EN global.ini fallback, used when the user's FR pack misses a key.
    en: Option<HashMap<String, String>>,
    /// Map from lowercased item key → class code, extracted from global.ini descriptions.
    classes: Option<HashMap<String, String>>,
    version: Option<String>,
}

static LOC_CACHE: Mutex<LocCache> = Mutex::new(LocCache {
    fr: None,
    en: None,
    classes: None,
    version: None,
});

/// Libellé EN issu d'une clé global.ini appariée (FR journal → clé → EN).
#[derive(Clone)]
struct EnLabelPair {
    norm: String,
    raw: String,
}

struct CatalogMatchIndex {
    /// normalized display string → blueprint_id (first alias wins).
    exact: HashMap<String, String>,
    /// normalized global.ini item display value → blueprint_id.
    ini_value_to_id: HashMap<String, String>,
    /// Libellé FR normalisé (valeur global.ini) → libellés EN de la même clé.
    fr_display_to_en: HashMap<String, Vec<EnLabelPair>>,
    /// Noms anglais catalogue uniquement (Wiki `output_name` / name_en).
    en_exact: HashMap<String, String>,
    /// (blueprint_id, alias EN) pour scoring token journal→EN→catalogue.
    en_entries: Vec<(String, Vec<String>)>,
    /// (blueprint_id, alias list) pour token / partial scoring (FR + EN).
    entries: Vec<(String, Vec<String>)>,
}

static MATCH_INDEX: Mutex<Option<CatalogMatchIndex>> = Mutex::new(None);
static CATALOG_SUMMARIES: Mutex<Option<Vec<BlueprintSummary>>> = Mutex::new(None);
static BP_UUID_BY_ID: Mutex<Option<HashMap<String, String>>> = Mutex::new(None);

fn fold_char(c: char) -> Option<char> {
    let folded = match c {
        'à' | 'á' | 'â' | 'ã' | 'ä' | 'å' => 'a',
        'ç' => 'c',
        'è' | 'é' | 'ê' | 'ë' => 'e',
        'ì' | 'í' | 'î' | 'ï' => 'i',
        'ò' | 'ó' | 'ô' | 'õ' | 'ö' => 'o',
        'ù' | 'ú' | 'û' | 'ü' => 'u',
        'ý' | 'ÿ' => 'y',
        'œ' => 'o',
        'æ' => 'a',
        'ñ' => 'n',
        c if c.is_ascii_alphanumeric() => c,
        _ => return None,
    };
    Some(folded)
}

/// Same normalization as the frontend (accents, punctuation, spaces).
fn normalize_match_key(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        for lc in ch.to_lowercase() {
            if let Some(f) = fold_char(lc) {
                out.push(f);
            }
        }
    }
    out
}

/// Strips leading class/size tokens like `Mil/2/D` from legacy EN display names.
fn strip_en_class_prefix(name: &str) -> String {
    let parts: Vec<&str> = name.split_whitespace().collect();
    if parts.len() >= 2 {
        let first = parts[0];
        if first.contains('/') && first.len() <= 14 {
            return parts[1..].join(" ");
        }
    }
    name.trim().to_string()
}

const MATCH_STOP_WORDS: &[&str] = &[
    "de", "du", "des", "la", "le", "les", "en", "au", "aux", "the", "and", "of", "for",
    // Termes génériques FR (évite qu'un « Chargeur X » matche le premier « Chargeur » du catalogue).
    "chargeur", "batterie", "bras", "jambes", "torse", "casque", "fusil", "arme", "armes", "canon",
    "missile", "tourelle", "bouclier", "reacteur", "moteur", "cap", "capacite",
];

fn tokenize_words(s: &str) -> Vec<String> {
    let lower = s.to_lowercase();
    lower
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.len() >= 2 && !MATCH_STOP_WORDS.contains(w))
        .map(|w| w.to_string())
        .collect()
}

fn has_distinctive_token(s: &str) -> bool {
    tokenize_words(s).iter().any(|t| t.len() >= 3)
}

/// global.ini FR : valeur affichée → libellés EN (même clé dans global_en.ini).
fn build_fr_display_to_en(
    fr: &HashMap<String, String>,
    en: &HashMap<String, String>,
) -> HashMap<String, Vec<EnLabelPair>> {
    let mut out: HashMap<String, Vec<EnLabelPair>> = HashMap::with_capacity(fr.len() / 2);
    for (key, fr_val) in fr {
        let fr_trim = fr_val.trim();
        if fr_trim.is_empty() || !has_distinctive_token(fr_trim) {
            continue;
        }
        let fr_norm = normalize_match_key(fr_trim);
        if fr_norm.len() < 3 {
            continue;
        }
        let Some(en_val) = en.get(key) else {
            continue;
        };
        let en_trim = en_val.trim();
        if en_trim.is_empty() || !has_distinctive_token(en_trim) {
            continue;
        }
        let pair = EnLabelPair {
            norm: normalize_match_key(en_trim),
            raw: en_trim.to_string(),
        };
        let list = out.entry(fr_norm).or_default();
        if !list.iter().any(|p| p.norm == pair.norm) {
            list.push(pair);
        }
    }
    out
}

/// Index EN-only du catalogue (prioritaire après le pont PolyTool).
fn build_en_catalog_exact(summaries: &[BlueprintSummary]) -> HashMap<String, String> {
    let mut lookup = HashMap::with_capacity(summaries.len() * 2);
    for s in summaries {
        let stripped = strip_en_class_prefix(&s.name_en);
        for name in [s.name_en.as_str(), stripped.as_str()] {
            let norm = normalize_match_key(name);
            if norm.len() >= 3 {
                lookup.entry(norm).or_insert_with(|| s.blueprint_id.clone());
            }
        }
    }
    lookup
}

fn token_overlap_threshold(token_count: usize) -> f64 {
    if token_count >= 4 {
        0.5
    } else if token_count >= 3 {
        0.62
    } else {
        0.75
    }
}

fn best_token_match(target_tokens: &[String], entries: &[(String, Vec<String>)]) -> Option<String> {
    if target_tokens.len() < 2 {
        return None;
    }
    let threshold = token_overlap_threshold(target_tokens.len());
    let mut best: Option<(f64, String)> = None;
    for (id, aliases) in entries {
        for alias in aliases {
            let score = token_overlap_score(target_tokens, &tokenize_words(alias));
            if score >= threshold && best.as_ref().map(|(b, _)| score > *b).unwrap_or(true) {
                best = Some((score, id.clone()));
            }
        }
    }
    best.map(|(_, id)| id)
}

/// Journal FR → libellés EN (ini) → correspondance exacte ou token sur le catalogue EN.
fn match_via_en_bridge(target_fr_norm: &str, index: &CatalogMatchIndex) -> Option<String> {
    let en_labels = index.fr_display_to_en.get(target_fr_norm)?;
    for label in en_labels {
        if let Some(id) = index.en_exact.get(&label.norm) {
            return Some(id.clone());
        }
    }
    for label in en_labels {
        let tokens = tokenize_words(&label.raw);
        if let Some(id) = best_token_match(&tokens, &index.en_entries) {
            return Some(id);
        }
    }
    None
}

fn token_overlap_score(target_tokens: &[String], candidate_tokens: &[String]) -> f64 {
    if target_tokens.is_empty() {
        return 0.0;
    }
    let hits = target_tokens
        .iter()
        .filter(|t| {
            candidate_tokens
                .iter()
                .any(|c| c.contains(t.as_str()) || t.contains(c.as_str()))
        })
        .count();
    hits as f64 / target_tokens.len() as f64
}

fn push_alias(aliases: &mut Vec<String>, value: Option<String>) {
    if let Some(v) = value {
        let t = v.trim();
        if !t.is_empty() {
            aliases.push(t.to_string());
        }
    }
}

/// Suffixe d'objet extrait d'une clé global.ini (`item_namefoo` ou `foo_name` pour les composants).
fn ini_loc_key_to_item_suffix(key: &str) -> Option<&str> {
    if let Some(s) = key.strip_prefix("item_name") {
        if !s.is_empty() {
            return Some(s);
        }
    }
    if let Some(stem) = key.strip_suffix("_name") {
        if stem.is_empty() {
            return None;
        }
        // Évite noms de personnages / missions (ex. human_first_names_*)
        let lower = stem.to_ascii_lowercase();
        if lower.starts_with("human_")
            || lower.starts_with("uwc_")
            || lower.contains("firstname")
            || lower.contains("surname")
        {
            return None;
        }
        return Some(stem);
    }
    None
}

/// Lookup direct `item_name{suffix}` ou `{suffix}_name` (buses, etc.) dans les maps loc.
fn lookup_item_display_name(
    maps: &[Option<&HashMap<String, String>>],
    suffix: &str,
) -> Option<String> {
    let lower = suffix.to_ascii_lowercase();
    let keys = [format!("item_name{lower}"), format!("{lower}_name")];
    for key in &keys {
        for map in maps {
            let Some(m) = map else { continue };
            if let Some(v) = m.get(key) {
                let t = v.trim();
                if !t.is_empty() {
                    return Some(t.to_string());
                }
            }
        }
    }
    None
}

/// Corrige les libellés journal connus (faute / variante) avant matching.
fn normalize_log_product_name(name: &str) -> &str {
    match name.trim().to_ascii_lowercase().as_str() {
        "torres" => "Torrez",
        _ => name.trim(),
    }
}

fn append_ini_aliases(
    internal_name: Option<&str>,
    filename_root: &str,
    maps: &[Option<&HashMap<String, String>>],
    aliases: &mut Vec<String>,
) {
    push_alias(aliases, lookup_item_display_name(maps, filename_root));
    if let Some(internal) = internal_name {
        let lower = internal.to_ascii_lowercase();
        if lower != filename_root {
            push_alias(aliases, lookup_item_display_name(maps, &lower));
        }
    }
}

/// Fusionne deux maps global.ini : les clés de `overlay` écrasent `base` (priorité install locale).
fn merge_loc_maps(
    base: Option<HashMap<String, String>>,
    overlay: Option<HashMap<String, String>>,
) -> Option<HashMap<String, String>> {
    match (base, overlay) {
        (None, None) => None,
        (Some(b), None) => Some(b),
        (None, Some(o)) => Some(o),
        (Some(mut b), Some(o)) => {
            for (k, v) in o {
                b.insert(k, v);
            }
            Some(b)
        }
    }
}

fn find_blueprint_for_item_suffix(item: &str, summaries: &[BlueprintSummary]) -> Option<String> {
    let item_lower = item.to_ascii_lowercase();
    for s in summaries {
        if s.internal_name
            .as_deref()
            .map(|i| i.eq_ignore_ascii_case(&item_lower))
            == Some(true)
        {
            return Some(s.blueprint_id.clone());
        }
        let stem = s
            .blueprint_id
            .strip_prefix("bp_craft_")
            .unwrap_or(&s.blueprint_id);
        if stem == item_lower || stem.contains(&item_lower) || item_lower.contains(stem) {
            return Some(s.blueprint_id.clone());
        }
    }
    None
}

fn build_suffix_lookup(summaries: &[BlueprintSummary]) -> HashMap<String, String> {
    let mut lookup = HashMap::with_capacity(summaries.len() * 2);
    for s in summaries {
        let stem = s
            .blueprint_id
            .strip_prefix("bp_craft_")
            .unwrap_or(&s.blueprint_id)
            .to_ascii_lowercase();
        lookup
            .entry(stem.clone())
            .or_insert_with(|| s.blueprint_id.clone());
        if let Some(internal) = s.internal_name.as_ref() {
            let lower = internal.to_ascii_lowercase();
            lookup
                .entry(lower)
                .or_insert_with(|| s.blueprint_id.clone());
        }
    }
    lookup
}

fn resolve_item_suffix_to_blueprint(
    item_suffix: &str,
    suffix_lookup: &HashMap<String, String>,
    summaries: &[BlueprintSummary],
) -> Option<String> {
    let lower = item_suffix.to_ascii_lowercase();
    if let Some(id) = suffix_lookup.get(&lower) {
        return Some(id.clone());
    }
    find_blueprint_for_item_suffix(item_suffix, summaries)
}

/// Index O(1) libellé normalisé → blueprint (évite de scanner tout le catalogue par clé ini).
fn build_display_name_lookup(summaries: &[BlueprintSummary]) -> HashMap<String, String> {
    let mut lookup = HashMap::with_capacity(summaries.len() * 3);
    for s in summaries {
        let mut names: Vec<&str> = vec![&s.name_en];
        if let Some(fr) = s.name_fr.as_deref() {
            names.push(fr);
        }
        let stripped = strip_en_class_prefix(&s.name_en);
        names.push(stripped.as_str());
        for name in names {
            let norm = normalize_match_key(name);
            if norm.len() >= 3 {
                lookup.entry(norm).or_insert_with(|| s.blueprint_id.clone());
            }
        }
    }
    lookup
}

/// Builds the journal ↔ catalogue match index (lazy — not on list load).
fn rebuild_match_index(summaries: &[BlueprintSummary]) {
    let suffix_lookup = build_suffix_lookup(summaries);
    let display_lookup = build_display_name_lookup(summaries);
    let mut exact = HashMap::with_capacity(summaries.len() * 4);
    let mut ini_value_to_id = HashMap::with_capacity(40_000);
    let mut entries = Vec::with_capacity(summaries.len());

    // Ne pas garder LOC_CACHE verrouillé ici : list_full appelle lookup_fr en parallèle.
    let loc_maps: [Option<HashMap<String, String>>; 2] = {
        let cache = LOC_CACHE.lock().unwrap();
        [cache.fr.clone(), cache.en.clone()]
    };
    let loc_refs: [Option<&HashMap<String, String>>; 2] =
        [loc_maps[0].as_ref(), loc_maps[1].as_ref()];

    for map in loc_refs.into_iter().flatten() {
        for (key, value) in map {
            let Some(item_suffix) = ini_loc_key_to_item_suffix(key) else {
                continue;
            };
            let norm = normalize_match_key(value);
            if norm.len() < 3 || !has_distinctive_token(value) {
                continue;
            }
            let id = resolve_item_suffix_to_blueprint(item_suffix, &suffix_lookup, summaries)
                .or_else(|| display_lookup.get(&norm).cloned());
            if let Some(id) = id {
                ini_value_to_id.entry(norm).or_insert(id);
            }
        }
    }

    let fr_display_to_en = match (loc_maps[0].as_ref(), loc_maps[1].as_ref()) {
        (Some(fr), Some(en)) => build_fr_display_to_en(fr, en),
        _ => HashMap::new(),
    };
    let en_exact = build_en_catalog_exact(summaries);
    let mut en_entries = Vec::with_capacity(summaries.len());

    for s in summaries {
        let stem = s
            .blueprint_id
            .strip_prefix("bp_craft_")
            .unwrap_or(&s.blueprint_id)
            .to_string();
        let mut aliases = Vec::new();
        push_alias(&mut aliases, s.name_fr.clone());
        push_alias(&mut aliases, Some(s.name_en.clone()));
        push_alias(&mut aliases, Some(strip_en_class_prefix(&s.name_en)));
        append_ini_aliases(s.internal_name.as_deref(), &stem, &loc_refs, &mut aliases);

        let stripped_en = strip_en_class_prefix(&s.name_en);
        let mut en_only = Vec::new();
        push_alias(&mut en_only, Some(s.name_en.clone()));
        push_alias(&mut en_only, Some(stripped_en));
        if let Some(internal) = s.internal_name.as_deref() {
            if let Some(en_display) = lookup_item_display_name(&loc_refs, internal) {
                push_alias(&mut en_only, Some(en_display));
            }
        }

        let mut normalized_aliases = Vec::new();
        let mut normalized_en = Vec::new();
        for a in &aliases {
            let n = normalize_match_key(a);
            if n.len() >= 3 {
                normalized_aliases.push(n.clone());
                exact.entry(n).or_insert_with(|| s.blueprint_id.clone());
            }
        }
        for a in &en_only {
            let n = normalize_match_key(a);
            if n.len() >= 3 {
                normalized_en.push(n.clone());
            }
        }
        entries.push((s.blueprint_id.clone(), normalized_aliases));
        en_entries.push((s.blueprint_id.clone(), normalized_en));
    }

    let mut guard = MATCH_INDEX.lock().unwrap();
    *guard = Some(CatalogMatchIndex {
        exact,
        ini_value_to_id,
        fr_display_to_en,
        en_exact,
        en_entries,
        entries,
    });
}

fn ensure_match_index_built() -> Result<(), String> {
    if MATCH_INDEX.lock().unwrap().is_some() {
        return Ok(());
    }
    let summaries = CATALOG_SUMMARIES.lock().unwrap().clone().ok_or_else(|| {
        "Catalogue non chargé — ouvrez la page Blueprints après le chargement de la liste."
            .to_string()
    })?;
    if summaries.is_empty() {
        return Err("Catalogue vide.".to_string());
    }
    rebuild_match_index(&summaries);
    Ok(())
}

/// Résout un nom de produit issu du Game.log vers un `bp_craft_*`.
///
/// Le log peut être en **français** (client traduit) ou en **anglais** (jeu non traduit) :
/// - FR : alias catalogue FR, valeurs `global.ini` FR, pont FR→EN PolyTool, puis catalogue EN.
/// - EN : alias / `name_en` Wiki, valeurs `global_en.ini` (indexées dans `ini_value_to_id`), tokens EN.
fn match_product_to_blueprint(product_name: &str) -> Option<String> {
    let product_name = normalize_log_product_name(product_name);
    let target = normalize_match_key(product_name);
    if target.len() < 2 {
        return None;
    }
    let index = MATCH_INDEX.lock().unwrap();
    let index = index.as_ref()?;

    // Catalogue Wiki (name_fr + name_en) et libellés ini FR + EN normalisés.
    if let Some(id) = index.exact.get(&target) {
        return Some(id.clone());
    }
    if let Some(id) = index.ini_value_to_id.get(&target) {
        return Some(id.clone());
    }
    if let Some(id) = index.en_exact.get(&target) {
        return Some(id.clone());
    }

    // Journal FR : valeur affichée FR → clé ini → libellé EN → catalogue EN.
    if let Some(id) = match_via_en_bridge(&target, index) {
        return Some(id);
    }

    let target_tokens = tokenize_words(product_name);
    // Journal EN ou FR : scoring prioritaire sur les alias anglais du catalogue.
    if let Some(id) = best_token_match(&target_tokens, &index.en_entries) {
        return Some(id);
    }
    best_token_match(&target_tokens, &index.entries)
}

fn pick_live_install_path() -> Option<PathBuf> {
    let versions = get_star_citizen_versions_sync();
    let preferred = ["LIVE", "PTU", "EPTU", "TECH-PREVIEW"];
    for channel in preferred.iter() {
        if let Some(info) = versions.versions.get(*channel) {
            let path = PathBuf::from(&info.path);
            if path.join("Data.p4k").exists() {
                return Some(path);
            }
        }
    }
    versions.versions.into_iter().find_map(|(_, info)| {
        let path = PathBuf::from(&info.path);
        if path.join("Data.p4k").exists() {
            Some(path)
        } else {
            None
        }
    })
}

fn locale_file(install: &std::path::Path, locale_folder: &str) -> PathBuf {
    install
        .join("data")
        .join("Localization")
        .join(locale_folder)
        .join("global.ini")
}

fn parse_global_ini(path: &PathBuf) -> Option<HashMap<String, String>> {
    let raw = fs::read_to_string(path).ok()?;
    let mut map = HashMap::with_capacity(60_000);
    for line in raw.lines() {
        if line.is_empty() || line.starts_with(';') || line.starts_with('#') {
            continue;
        }
        let Some(eq_idx) = line.find('=') else {
            continue;
        };
        let raw_key = &line[..eq_idx];
        let value = line[eq_idx + 1..].trim();
        let key = raw_key
            .split(|c: char| c == ',' || c.is_whitespace())
            .next()
            .unwrap_or(raw_key)
            .trim()
            .to_ascii_lowercase();
        if key.is_empty() {
            continue;
        }
        map.entry(key).or_insert_with(|| value.to_string());
    }
    Some(map)
}

/// Extracts a `item_internal_name → class_code` map from a parsed global.ini.
/// Looks at item_DescXXX entries and extracts the class from the localized text:
/// EN "Class: Military", FR "Classe : Militaire".
fn build_class_map(loc_map: &HashMap<String, String>) -> HashMap<String, String> {
    let mut out = HashMap::with_capacity(900);
    for (key, value) in loc_map {
        if !key.starts_with("item_desc") {
            continue;
        }
        let item_key = match key.strip_prefix("item_desc") {
            Some(s) => s.to_string(),
            None => continue,
        };
        if item_key.is_empty() {
            continue;
        }
        if let Some(code) = normalize_class_from_text(value) {
            out.insert(item_key, code.to_string());
        }
    }
    out
}

/// Detects civi/mili/indu/stlh/comp from a localized description string.
/// Supports both EN ("Class: Military") and FR ("Classe : Militaire") variants.
fn normalize_class_from_text(text: &str) -> Option<&'static str> {
    let lower = text.to_ascii_lowercase();
    for marker in &["class:", "classe :", "classe:"] {
        if let Some(idx) = lower.find(marker) {
            let after = &lower[idx + marker.len()..];
            let token: String = after
                .trim_start()
                .chars()
                .take_while(|c| c.is_ascii_alphabetic() || *c == 'é' || *c == 'è' || *c == 'à')
                .collect();
            let normalized = match token.as_str() {
                "civilian" | "civil" | "civile" => Some("civi"),
                "military" | "militaire" => Some("mili"),
                "industrial" | "industriel" => Some("indu"),
                "stealth" | "furtif" | "discrétion" | "discretion" => Some("stlh"),
                "competition" | "compétition" => Some("comp"),
                _ => None,
            };
            if normalized.is_some() {
                return normalized;
            }
        }
    }
    None
}

fn ensure_loc_cache() -> Result<(), String> {
    let cache_key = "polytool".to_string();

    {
        let cache = LOC_CACHE.lock().unwrap();
        if cache.version.as_deref() == Some(&cache_key)
            && cache.fr.is_some()
            && cache.en.is_some()
            && cache.classes.is_some()
        {
            return Ok(());
        }
    }

    // 1) PolyTool global.ini (base canonique CIG, comme StarCaca).
    let mut fr_map = load_polytool_global("fr");
    let mut en_map = load_polytool_global("en");

    // 2) Fusion avec l'install locale : le FR du jeu (vanilla, StarTrad, Circuspes…)
    //    écrase PolyTool pour que le journal FR matche les mêmes libellés que les notifs.
    if let Some(install) = pick_live_install_path() {
        let local_fr = parse_global_ini(&locale_file(&install, "french_(france)"));
        fr_map = merge_loc_maps(fr_map, local_fr);
        if en_map.is_none() {
            en_map = parse_global_ini(&locale_file(&install, "english"));
        }
    }

    if fr_map.is_none() && en_map.is_none() {
        return Err(
            "Aucun global.ini disponible (ni PolyTool ni install locale). Lance l'app une fois en ligne pour le télécharger.".to_string(),
        );
    }

    // EN optionnel pour le matching ; évite de re-parser les ini à chaque appel.
    if en_map.is_none() {
        en_map = fr_map.clone();
    }

    let mut class_map = fr_map.as_ref().map(build_class_map).unwrap_or_default();
    if let Some(en) = en_map.as_ref() {
        for (k, v) in build_class_map(en) {
            class_map.entry(k).or_insert(v);
        }
    }

    let mut cache = LOC_CACHE.lock().unwrap();
    cache.fr = fr_map;
    cache.en = en_map;
    cache.classes = Some(class_map);
    cache.version = Some(cache_key);
    Ok(())
}

fn lookup_fr(key: &Option<String>) -> Option<String> {
    let key = key.as_ref()?;
    let lower = key.to_ascii_lowercase();
    let cache = LOC_CACHE.lock().unwrap();
    if let Some(v) = cache.fr.as_ref().and_then(|m| m.get(&lower)) {
        return Some(v.clone());
    }
    // Fallback to EN so the UI never shows an empty cell when FR is incomplete
    cache.en.as_ref().and_then(|m| m.get(&lower).cloned())
}

/// Lookup the class code (civi/mili/indu/stlh/comp) for an item.
/// Priority: global.ini description, then manufacturer mapping.
fn lookup_class(internal_name: &str) -> Option<String> {
    let lower = internal_name.to_ascii_lowercase();
    if let Some(v) = LOC_CACHE
        .lock()
        .unwrap()
        .classes
        .as_ref()
        .and_then(|m| m.get(&lower).cloned())
    {
        return Some(v);
    }
    manufacturer_class_from_id(&lower).map(|s| s.to_string())
}

/// Maps a manufacturer code (lowercase) to a default class orientation based on lore.
/// Only applied as a last-resort fallback when global.ini does not expose the class.
///
/// `bp_craft_*` key conventions (manufacturer segment) :
///   - `bp_craft_<mfg>_<weapon>_...`     ← armes ship & FPS (parts[0] = mfg)
///   - `bp_craft_<type>_<mfg>_...`       ← shields/coolers/QDs/radars/powerplants
///     (parts[0] = type prefix shld/powr/cool/qdrv/radr/etc.)
///   - `bp_craft_<weapon>_<mfg>_..._mag` ← FPS magazines (parts[0] = weapon kind, parts[1] = mfg)
///
/// On essaie parts[0] puis parts[1] et on retourne le 1er qui matche un fabricant connu.
fn manufacturer_class_from_id(id_lower: &str) -> Option<&'static str> {
    let rest = id_lower.strip_prefix("bp_craft_").unwrap_or(id_lower);
    let parts: Vec<&str> = rest.split('_').collect();
    if let Some(p0) = parts.first() {
        if let Some(cls) = classify_manufacturer(p0) {
            return Some(cls);
        }
    }
    if let Some(p1) = parts.get(1) {
        if let Some(cls) = classify_manufacturer(p1) {
            return Some(cls);
        }
    }
    None
}

fn classify_manufacturer(code: &str) -> Option<&'static str> {
    match code {
        // Military / weapons-focused (UEE-aligned)
        "aegs" | "aegis" => Some("mili"),
        "anvl" | "anvil" => Some("mili"),
        "behr" | "behring" => Some("mili"),
        "basl" | "basilisk" => Some("mili"),
        "gmni" | "gemini" => Some("mili"),
        "hrst" | "hurston" | "hrtd" => Some("mili"),
        "qrt" | "quirinus" => Some("mili"),
        "shin" | "shubin" => Some("indu"),
        "kast" | "kastak" | "ksar" => Some("mili"),
        "kbar" | "klwe" | "klauswerner" | "kw" => Some("mili"),
        "krig" | "kruger" => Some("mili"),
        // Civilian (recreational, exploration, comfort)
        "amrs" | "amonreese" => Some("civi"),
        "apar" | "apocalypse" => Some("civi"),
        "drak" | "drake" => Some("civi"),
        "misc" | "musashi" => Some("civi"),
        "orig" | "origin" => Some("civi"),
        "rsi" => Some("civi"),
        "csgi" => Some("civi"),
        // Industrial (mining, salvage, construction)
        "grin" | "greycat" | "gctec" => Some("indu"),
        "argo" => Some("indu"),
        "esp" | "esprit" => Some("indu"),
        // Aliens / not classified
        "banu" | "asas" | "aopoa" | "vncl" | "vndl" | "vnduul" | "vanduul" | "xian" => None,
        _ => None,
    }
}

pub(crate) fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .build()
        .map_err(|e| format!("Impossible d'initialiser le client HTTP: {e}"))
}

fn wiki_catalog_cache_path() -> Option<PathBuf> {
    let dir = dirs::data_local_dir()?.join("multitool").join("blueprints");
    fs::create_dir_all(&dir).ok()?;
    Some(dir.join("wiki_blueprints_list.json"))
}

pub(crate) fn normalize_bp_id_key(id: &str) -> String {
    id.to_ascii_lowercase()
}

fn loc_key_for_output_class(output_class: &str) -> String {
    format!("item_name{}", output_class.to_ascii_lowercase())
}

fn wiki_category(bp: &WikiBlueprint) -> Option<String> {
    bp.output
        .as_ref()
        .and_then(|o| o.type_label.clone().or_else(|| o.r#type.clone()))
}

fn wiki_output_class(bp: &WikiBlueprint) -> Option<String> {
    bp.output_class
        .clone()
        .or_else(|| bp.output.as_ref().and_then(|o| o.class.clone()))
}

fn wiki_name_en(bp: &WikiBlueprint) -> String {
    bp.output_name
        .clone()
        .or_else(|| bp.output.as_ref().and_then(|o| o.name.clone()))
        .unwrap_or_else(|| bp.key.clone())
}

fn wiki_tier_count(bp: &WikiBlueprint) -> Option<u64> {
    if bp.tiers.is_empty() {
        None
    } else {
        Some(bp.tiers.len() as u64)
    }
}

fn store_uuid_index(summaries: &[BlueprintSummary]) {
    let mut map = HashMap::with_capacity(summaries.len());
    for s in summaries {
        if !s.wiki_uuid.is_empty() {
            map.insert(normalize_bp_id_key(&s.blueprint_id), s.wiki_uuid.clone());
        }
    }
    *BP_UUID_BY_ID.lock().unwrap() = Some(map);
}

fn resolve_wiki_uuid(blueprint_id: &str) -> Option<String> {
    let key = normalize_bp_id_key(blueprint_id);
    BP_UUID_BY_ID
        .lock()
        .unwrap()
        .as_ref()
        .and_then(|m| m.get(&key).cloned())
}

fn insert_requirement_child_uuids(
    child: &WikiRequirementChild,
    set: &mut std::collections::HashSet<String>,
) {
    if let Some(u) = &child.uuid {
        if !u.is_empty() {
            set.insert(u.clone());
        }
    }
    if let Some(u) = &child.ore_uuid {
        if !u.is_empty() {
            set.insert(u.clone());
        }
    }
    for nested in &child.children {
        insert_requirement_child_uuids(nested, set);
    }
}

fn collect_resource_uuids(bp: &WikiBlueprint) -> Vec<String> {
    let mut set = std::collections::HashSet::new();
    for ing in &bp.ingredients {
        if let Some(u) = &ing.resource_type_uuid {
            set.insert(u.clone());
        }
        if let Some(u) = &ing.item_uuid {
            set.insert(u.clone());
        }
    }
    for group in &bp.requirement_groups {
        for child in &group.children {
            insert_requirement_child_uuids(child, &mut set);
        }
    }
    for ret in &bp.dismantle_returns {
        if let Some(u) = &ret.resource_type_uuid {
            set.insert(u.clone());
        }
    }
    let mut out: Vec<String> = set.into_iter().collect();
    out.sort();
    out
}

pub(crate) fn summary_from_wiki(bp: &WikiBlueprint) -> BlueprintSummary {
    let blueprint_id = normalize_bp_id_key(&bp.key);
    let output_class = wiki_output_class(bp);
    let internal_name = output_class.clone();
    let loc_key = output_class.as_ref().map(|c| loc_key_for_output_class(c));
    let class_code = output_class.as_deref().and_then(lookup_class);
    let size_hint = bp.output.as_ref().and_then(|o| o.sub_type.as_deref());
    let size = extract_size(&blueprint_id, size_hint);
    let sub_type = wiki_sub_type(bp);
    let manufacturer = manufacturer_code_from_id(&blueprint_id);
    let manufacturer_name = wiki_manufacturer_name(bp)
        .or_else(|| manufacturer.as_deref().and_then(manufacturer_display_name));
    let output_type = bp.output.as_ref().and_then(|o| o.r#type.clone());
    let output_type_label = bp.output.as_ref().and_then(|o| o.type_label.clone());
    let family = super::blueprint_family::classify_output_type(output_type.as_deref());
    let summary_badges = super::blueprint_family::build_summary_badges(
        family,
        output_type.as_deref(),
        output_type_label.as_deref(),
        sub_type.as_deref(),
        size,
    );
    BlueprintSummary {
        wiki_uuid: bp.uuid.clone(),
        blueprint_id,
        name_en: wiki_name_en(bp),
        name_fr: lookup_fr(&loc_key),
        loc_key,
        category: wiki_category(bp),
        craft_time_seconds: bp.craft_time_seconds,
        tiers: wiki_tier_count(bp),
        default_owned: bp.is_available_by_default.unwrap_or(false),
        version: bp.game_version.clone(),
        class_code,
        size,
        grade: wiki_grade(bp),
        sub_type,
        manufacturer,
        manufacturer_name,
        internal_name,
        output_type,
        ingredient_count: bp.ingredient_count,
        unlocking_missions_count: bp.unlocking_missions_count,
        resource_uuids: collect_resource_uuids(bp),
        web_url: bp.web_url.clone(),
        unlock_systems: Vec::new(),
        unlock_jurisdictions: Vec::new(),
        family: Some(family.as_str().to_string()),
        output_type_label,
        summary_badges,
    }
}

fn build_summaries_from_wiki(blueprints: &[WikiBlueprint]) -> Vec<BlueprintSummary> {
    let mut out: Vec<BlueprintSummary> = blueprints.iter().map(summary_from_wiki).collect();
    out.sort_by(|a, b| a.blueprint_id.cmp(&b.blueprint_id));
    *CATALOG_SUMMARIES.lock().unwrap() = Some(out.clone());
    store_uuid_index(&out);
    out
}

fn wiki_chance_label(chance: Option<f64>) -> Option<String> {
    chance.map(|c| {
        if c >= 1.0 {
            "100%".to_string()
        } else {
            format!("{}%", (c * 100.0).round())
        }
    })
}

fn map_wiki_modifiers(ms: &[WikiModifier]) -> Vec<IngredientModifier> {
    ms.iter()
        .map(|m| IngredientModifier {
            property_key: m.property_key.clone(),
            label: m.label.clone().unwrap_or_else(|| "—".to_string()),
            better_when: m.better_when.clone(),
            quality_min: m.quality_range.as_ref().and_then(|q| q.min),
            quality_max: m.quality_range.as_ref().and_then(|q| q.max),
            modifier_at_min_quality: m.modifier_range.as_ref().and_then(|r| r.at_min_quality),
            modifier_at_max_quality: m.modifier_range.as_ref().and_then(|r| r.at_max_quality),
        })
        .collect()
}

fn mission_uuid_from_web_url(url: &str) -> Option<String> {
    let trimmed = url.trim();
    trimmed
        .rsplit('/')
        .next()
        .filter(|s| !s.is_empty() && s.contains('-'))
        .map(|s| s.to_string())
}

fn wiki_child_to_option(child: WikiRequirementChild) -> IngredientOption {
    let guid = child.uuid.clone().or_else(|| child.name.clone());
    let qty = child.quantity.map(|q| q.round() as u64);
    let loc_key = child.name.as_ref().map(|n| {
        let lower = n.to_ascii_lowercase().replace(' ', "_");
        loc_key_for_output_class(&lower)
    });
    IngredientOption {
        kind: child.kind.clone(),
        guid,
        ore_uuid: child.ore_uuid.clone(),
        name: child.name.unwrap_or_default(),
        name_fr: lookup_fr(&loc_key),
        loc_key,
        quantity_scu: child.quantity_scu,
        quantity: qty,
        min_quality: child.min_quality,
        unit: child.kind.clone(),
        web_url: child.web_url.clone(),
        api_link: child.link.clone(),
        enrichment: None,
    }
}

fn flatten_wiki_children(children: Vec<WikiRequirementChild>) -> Vec<IngredientOption> {
    let mut out = Vec::new();
    for child in children {
        if child.kind.as_deref() == Some("group") {
            out.extend(flatten_wiki_children(child.children));
        } else {
            out.push(wiki_child_to_option(child));
        }
    }
    out
}

fn normalize_slot_key(key: &str) -> String {
    key.trim().to_ascii_uppercase()
}

fn merge_aspect_into_groups(
    groups: &mut [IngredientGroup],
    aspects: Option<&BlueprintAspectsSummary>,
) {
    let Some(summary) = aspects else {
        return;
    };
    for g in groups.iter_mut() {
        let gkey = g
            .slot_key
            .as_deref()
            .map(normalize_slot_key)
            .unwrap_or_else(|| normalize_slot_key(&g.slot));
        let aspect = summary
            .slots
            .iter()
            .find(|a| normalize_slot_key(&a.key) == gkey);
        if let Some(a) = aspect {
            g.initial_quality = a.initial_quality;
            g.slider_min = a.slider_min;
            g.slider_max = a.slider_max;
            if !a.modifiers.is_empty() {
                g.modifiers = a.modifiers.clone();
            }
        }
    }
}

fn map_wiki_requirement_groups(groups: Vec<WikiRequirementGroup>) -> Vec<IngredientGroup> {
    groups
        .into_iter()
        .map(|g| {
            let slot = g
                .name
                .clone()
                .or(g.key.clone())
                .unwrap_or_else(|| "Slot".to_string());
            IngredientGroup {
                slot: slot.clone(),
                slot_key: g.key.clone(),
                slot_loc_key: None,
                slot_label_fr: Some(slot),
                required_count: g.required_count,
                modifiers: map_wiki_modifiers(&g.modifiers),
                options: flatten_wiki_children(g.children),
                initial_quality: None,
                slider_min: None,
                slider_max: None,
            }
        })
        .collect()
}

fn map_wiki_flat_ingredients(ings: Vec<WikiIngredient>) -> Vec<IngredientGroup> {
    if ings.is_empty() {
        return vec![];
    }
    vec![IngredientGroup {
        slot: "Ingredients".to_string(),
        slot_key: None,
        slot_loc_key: None,
        slot_label_fr: None,
        required_count: None,
        modifiers: Vec::new(),
        initial_quality: None,
        slider_min: None,
        slider_max: None,
        options: ings
            .into_iter()
            .map(|i| {
                let guid = i.resource_type_uuid.clone().or(i.item_uuid.clone());
                let qty = i.quantity.map(|q| q.round() as u64);
                IngredientOption {
                    kind: i.kind.clone(),
                    guid,
                    ore_uuid: None,
                    name: i.name.unwrap_or_default(),
                    name_fr: None,
                    loc_key: None,
                    quantity_scu: i.quantity_scu,
                    quantity: qty,
                    min_quality: None,
                    unit: i.kind.clone(),
                    web_url: i.web_url.clone(),
                    api_link: i.link.clone(),
                    enrichment: None,
                }
            })
            .collect(),
    }]
}

fn map_wiki_ingredients(bp: &WikiBlueprint) -> Vec<IngredientGroup> {
    if !bp.requirement_groups.is_empty() {
        return map_wiki_requirement_groups(bp.requirement_groups.clone());
    }
    map_wiki_flat_ingredients(bp.ingredients.clone())
}

fn map_wiki_missions(ms: Vec<WikiUnlockingMission>) -> Vec<MissionInfo> {
    ms.into_iter()
        .map(|m| {
            let name_raw = m.title.clone().or(m.debug_name.clone()).unwrap_or_default();
            let mission_uuid = m.web_url.as_deref().and_then(mission_uuid_from_web_url);
            MissionInfo {
                mission_id: None,
                mission_uuid,
                name_raw,
                name_fr: m.title.clone(),
                loc_key: None,
                description_en: None,
                description_fr: None,
                description_loc_key: None,
                contractor: None,
                mission_type: m.reward_scope.clone(),
                category: None,
                lawful: None,
                not_for_release: None,
                drop_chance: wiki_chance_label(m.chance),
                locations: None,
                time_to_complete_minutes: None,
                min_standing_name: None,
                min_standing_reputation: None,
                standing_reward: None,
                debug_name: m.debug_name.clone(),
                web_url: m.web_url.clone(),
                star_systems: Vec::new(),
                jurisdictions: Vec::new(),
            }
        })
        .collect()
}

fn map_wiki_dismantle(bp: &WikiBlueprint) -> Option<BlueprintDismantle> {
    if bp.dismantle.is_none() && bp.dismantle_returns.is_empty() {
        return None;
    }
    let returns: Vec<DismantleReturn> = bp
        .dismantle_returns
        .iter()
        .map(|r| DismantleReturn {
            name: r.name.clone().unwrap_or_default(),
            resource_uuid: r.resource_type_uuid.clone(),
            quantity_scu: r.quantity_scu,
            web_url: r.web_url.clone(),
        })
        .collect();
    let d = bp.dismantle.as_ref();
    Some(BlueprintDismantle {
        time_seconds: d.and_then(|x| x.time_seconds),
        time_label: d.and_then(|x| x.time_label.clone()),
        efficiency: d.and_then(|x| x.efficiency),
        returns,
    })
}

fn parse_wiki_modifiers_json(value: Option<&serde_json::Value>) -> Vec<IngredientModifier> {
    let Some(arr) = value.and_then(|v| v.as_array()) else {
        return vec![];
    };
    arr.iter()
        .filter_map(|m| {
            let label = m.get("label").and_then(|v| v.as_str())?.to_string();
            let quality_range = m.get("quality_range");
            let modifier_range = m.get("modifier_range");
            Some(IngredientModifier {
                property_key: m
                    .get("property_key")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                label,
                better_when: m
                    .get("better_when")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                quality_min: quality_range
                    .and_then(|q| q.get("min"))
                    .and_then(|v| v.as_i64()),
                quality_max: quality_range
                    .and_then(|q| q.get("max"))
                    .and_then(|v| v.as_i64()),
                modifier_at_min_quality: modifier_range
                    .and_then(|r| r.get("at_min_quality"))
                    .and_then(|v| v.as_f64()),
                modifier_at_max_quality: modifier_range
                    .and_then(|r| r.get("at_max_quality"))
                    .and_then(|v| v.as_f64()),
            })
        })
        .collect()
}

fn map_wiki_aspects(raw: &serde_json::Value) -> Option<BlueprintAspectsSummary> {
    let aspects = raw.get("aspects")?.as_array()?;
    let has_interactive = raw
        .get("has_interactive_aspects")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let slots: Vec<BlueprintAspectSlot> = aspects
        .iter()
        .filter_map(|a| {
            let key = a.get("key")?.as_str()?.to_string();
            let name = a
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or(&key)
                .to_string();
            let modifiers = parse_wiki_modifiers_json(a.get("modifiers"));
            let label = modifiers
                .first()
                .map(|m| m.label.clone())
                .unwrap_or_else(|| name.clone());
            Some(BlueprintAspectSlot {
                key: key.clone(),
                name: name.clone(),
                label,
                initial_quality: a.get("initial_quality").and_then(|v| v.as_u64()),
                slider_min: a.get("slider_min").and_then(|v| v.as_u64()),
                slider_max: a.get("slider_max").and_then(|v| v.as_u64()),
                has_modifiers: a
                    .get("has_modifiers")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(!modifiers.is_empty()),
                modifiers,
            })
        })
        .collect();
    if slots.is_empty() && !has_interactive {
        return None;
    }
    Some(BlueprintAspectsSummary {
        has_interactive,
        slots,
    })
}

fn blueprint_detail_from_wiki(bp: WikiBlueprint) -> Result<BlueprintDetail, String> {
    ensure_loc_cache()?;
    let summary = summary_from_wiki(&bp);
    let aspects = bp.aspects.as_ref().and_then(map_wiki_aspects);
    let mut ingredients = map_wiki_ingredients(&bp);
    merge_aspect_into_groups(&mut ingredients, aspects.as_ref());
    let dismantle = map_wiki_dismantle(&bp);
    let missions = map_wiki_missions(bp.unlocking_missions);
    let item_stats = if bp.summary_properties.is_empty() {
        bp.output
            .as_ref()
            .map(|o| serde_json::to_value(o).unwrap_or_default())
    } else {
        Some(serde_json::json!({
            "summaryProperties": bp.summary_properties,
            "output": bp.output,
        }))
    };
    Ok(BlueprintDetail {
        summary,
        ingredients,
        missions,
        item_stats,
        dismantle,
        aspects,
        ..BlueprintDetail::default()
    })
}

fn polytool_global_cache_path(suffix: &str) -> Option<PathBuf> {
    let dir = dirs::data_local_dir()?.join("multitool").join("blueprints");
    fs::create_dir_all(&dir).ok()?;
    Some(dir.join(format!("polytool_global_{suffix}.ini")))
}

/// Returns true if `path` is missing or older than `max_age_days`.
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

async fn fetch_text(url: &str) -> Result<String, String> {
    let client = http_client()?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Erreur reseau {url}: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("{} HTTP {}", url, response.status()));
    }
    response
        .text()
        .await
        .map_err(|e| format!("Reponse {url} illisible: {e}"))
}

/// Fetches the latest PolyTool global.ini (FR or EN) to disk if cache is stale.
/// Cache lifetime: 7 days.
async fn ensure_polytool_global(suffix: &str, url: &str) {
    let Some(path) = polytool_global_cache_path(suffix) else {
        return;
    };
    if !is_cache_stale(&path, 7) {
        return;
    }
    match fetch_text(url).await {
        Ok(text) => {
            let _ = fs::write(&path, text);
        }
        Err(e) => {
            eprintln!("[blueprints] polytool {suffix} fetch failed: {e}");
        }
    }
}

/// Loads a parsed global.ini from PolyTool disk cache. Returns None if cache is missing.
fn load_polytool_global(suffix: &str) -> Option<HashMap<String, String>> {
    let path = polytool_global_cache_path(suffix)?;
    parse_global_ini(&path)
}

async fn prefetch_polytool_globals() {
    ensure_polytool_global("fr", POLYTOOL_GLOBAL_FR_URL).await;
    ensure_polytool_global("en", POLYTOOL_GLOBAL_EN_URL).await;
}

pub(crate) fn load_wiki_catalog_from_disk() -> Result<Vec<WikiBlueprint>, String> {
    let path = wiki_catalog_cache_path()
        .ok_or_else(|| "Impossible de résoudre le dossier cache blueprints.".to_string())?;
    if !path.exists() {
        return Err(
            "Cache Star Citizen Wiki absent — connectez-vous à Internet et ouvrez la page Blueprints."
                .to_string(),
        );
    }
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let cache: WikiCatalogCache =
        serde_json::from_slice(&bytes).map_err(|e| format!("Cache Wiki illisible: {e}"))?;
    Ok(cache.blueprints)
}

fn persist_wiki_catalog(blueprints: &[WikiBlueprint], game_version: Option<String>) {
    if let Some(path) = wiki_catalog_cache_path() {
        let cache = WikiCatalogCache {
            game_version,
            blueprints: blueprints.to_vec(),
        };
        if let Ok(bytes) = serde_json::to_vec(&cache) {
            let _ = fs::write(path, bytes);
        }
    }
}

async fn fetch_wiki_blueprints_page(
    page: u64,
    page_size: u64,
) -> Result<WikiBlueprintListResponse, String> {
    let url = format!("{WIKI_API_BASE}/api/blueprints?page[number]={page}&page[size]={page_size}");
    let client = http_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erreur reseau vers Star Citizen Wiki: {e}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "Star Citizen Wiki a renvoye HTTP {}",
            response.status()
        ));
    }
    response
        .json()
        .await
        .map_err(|e| format!("Reponse Wiki /api/blueprints illisible: {e}"))
}

/// Télécharge toutes les pages du catalogue Wiki (page[size]=200).
async fn fetch_wiki_catalog_all() -> Result<Vec<WikiBlueprint>, String> {
    const PAGE_SIZE: u64 = 200;
    let first = fetch_wiki_blueprints_page(1, PAGE_SIZE).await?;
    let last_page = first.meta.as_ref().map(|m| m.last_page).unwrap_or(1).max(1);
    let mut all = first.data;
    for page in 2..=last_page {
        let resp = fetch_wiki_blueprints_page(page, PAGE_SIZE).await?;
        all.extend(resp.data);
    }
    Ok(all)
}

async fn load_wiki_catalog_summaries() -> Result<Vec<BlueprintSummary>, String> {
    prefetch_polytool_globals().await;
    ensure_loc_cache()?;

    if let Some(path) = wiki_catalog_cache_path() {
        if !is_cache_stale(&path, 7) {
            if let Ok(blueprints) = load_wiki_catalog_from_disk() {
                return Ok(build_summaries_from_wiki(&blueprints));
            }
        }
    }

    let blueprints = match fetch_wiki_catalog_all().await {
        Ok(bps) => bps,
        Err(e) => {
            if let Ok(cached) = load_wiki_catalog_from_disk() {
                eprintln!("[blueprints] fetch Wiki echoue, cache local utilise: {e}");
                return Ok(build_summaries_from_wiki(&cached));
            }
            return Err(e);
        }
    };
    let game_version = blueprints.first().and_then(|b| b.game_version.clone());
    persist_wiki_catalog(&blueprints, game_version);
    Ok(build_summaries_from_wiki(&blueprints))
}

/// Encyclopédie complète via Star Citizen Wiki API (cache local 7 jours).
#[command]
pub async fn blueprints_catalog_list_full() -> Result<Vec<BlueprintSummary>, String> {
    let mut list = load_wiki_catalog_summaries().await?;
    super::blueprints_wiki_extended::merge_unlock_index(&mut list);
    Ok(list)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevalidateResult {
    pub list: Vec<BlueprintSummary>,
    pub new_count: u64,
    pub removed_count: u64,
    pub changed: bool,
}

/// Revalidation en arrière-plan : retélécharge le catalogue Wiki et calcule les deltas.
#[command]
pub async fn blueprints_catalog_revalidate() -> Result<RevalidateResult, String> {
    if let Some(path) = wiki_catalog_cache_path() {
        if !is_cache_stale(&path, 7) {
            if let Ok(blueprints) = load_wiki_catalog_from_disk() {
                let mut list = build_summaries_from_wiki(&blueprints);
                super::blueprints_wiki_extended::merge_unlock_index(&mut list);
                return Ok(RevalidateResult {
                    list,
                    new_count: 0,
                    removed_count: 0,
                    changed: false,
                });
            }
        }
    }

    prefetch_polytool_globals().await;
    ensure_loc_cache()?;

    let old_ids: std::collections::HashSet<String> = load_wiki_catalog_from_disk()
        .ok()
        .map(|bps| bps.iter().map(|b| normalize_bp_id_key(&b.key)).collect())
        .unwrap_or_default();

    let fresh = fetch_wiki_catalog_all().await?;
    let fresh_ids: std::collections::HashSet<String> =
        fresh.iter().map(|b| normalize_bp_id_key(&b.key)).collect();

    let new_count = fresh_ids.difference(&old_ids).count() as u64;
    let removed_count = old_ids.difference(&fresh_ids).count() as u64;
    let changed = new_count > 0 || removed_count > 0;

    let game_version = fresh.first().and_then(|b| b.game_version.clone());
    persist_wiki_catalog(&fresh, game_version);

    let mut list = build_summaries_from_wiki(&fresh);
    super::blueprints_wiki_extended::merge_unlock_index(&mut list);
    tauri::async_runtime::spawn(async {
        super::blueprints_wiki_extended::build_unlock_index_background().await;
    });
    Ok(RevalidateResult {
        list,
        new_count,
        removed_count,
        changed,
    })
}

pub(crate) async fn fetch_wiki_blueprint_by_uuid(uuid: &str) -> Result<WikiBlueprint, String> {
    let url = format!("{WIKI_API_BASE}/api/blueprints/{uuid}");
    let client = http_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erreur reseau: {e}"))?;
    if !response.status().is_success() {
        return Err(format!("Star Citizen Wiki HTTP {}", response.status()));
    }
    let raw: WikiBlueprintDetailResponse = response
        .json()
        .await
        .map_err(|e| format!("Reponse Wiki detail illisible: {e}"))?;
    Ok(raw.data)
}

async fn fetch_wiki_blueprint(blueprint_id: &str) -> Result<WikiBlueprint, String> {
    let trimmed = blueprint_id.trim();
    if trimmed.is_empty() {
        return Err("blueprint_id vide".to_string());
    }
    if let Some(uuid) = resolve_wiki_uuid(trimmed) {
        return fetch_wiki_blueprint_by_uuid(&uuid).await;
    }
    let key = normalize_bp_id_key(trimmed);
    if let Ok(blueprints) = load_wiki_catalog_from_disk() {
        if let Some(bp) = blueprints
            .iter()
            .find(|b| normalize_bp_id_key(&b.key) == key)
        {
            return fetch_wiki_blueprint_by_uuid(&bp.uuid).await;
        }
    }
    Err(format!(
        "Blueprint « {trimmed} » introuvable (chargez le catalogue ou reconnectez-vous)."
    ))
}

/// Ajoute des fiches manquantes (ex. débloqués journal) via l’API Wiki.
#[command]
pub async fn blueprints_catalog_supplement_ids(
    blueprint_ids: Vec<String>,
) -> Result<Vec<BlueprintSummary>, String> {
    ensure_loc_cache()?;
    let mut out = Vec::with_capacity(blueprint_ids.len());
    for id in blueprint_ids {
        let trimmed = id.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some(existing) = CATALOG_SUMMARIES.lock().unwrap().as_ref().and_then(|list| {
            list.iter()
                .find(|s| s.blueprint_id.eq_ignore_ascii_case(trimmed))
                .cloned()
        }) {
            out.push(existing);
            continue;
        }
        match fetch_wiki_blueprint(trimmed).await {
            Ok(bp) => out.push(summary_from_wiki(&bp)),
            Err(e) => eprintln!("[blueprints] supplement {trimmed}: {e}"),
        }
    }
    Ok(out)
}

/// Recette, ingrédients et missions via Star Citizen Wiki (`GET /api/blueprints/{uuid}`).
#[command]
pub async fn blueprint_catalog_detail(blueprint_id: String) -> Result<BlueprintDetail, String> {
    let bp = fetch_wiki_blueprint(&blueprint_id).await?;
    let output_item_uuid = bp.output.as_ref().and_then(|o| o.uuid.clone());
    let summary_properties = bp.summary_properties.clone();
    let mut detail = blueprint_detail_from_wiki(bp)?;
    super::blueprints_item_profile::enrich_detail_item(
        &mut detail,
        output_item_uuid.as_deref(),
        &summary_properties,
    )
    .await;
    super::blueprints_wiki_extended::enrich_blueprint_detail(&mut detail).await;
    Ok(detail)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchProductsResult {
    /// product_name (journal) → blueprint_id
    pub matches: HashMap<String, String>,
    pub matched_count: usize,
    pub requested_count: usize,
}

fn match_products_sync(product_names: Vec<String>) -> Result<MatchProductsResult, String> {
    ensure_loc_cache()?;
    if CATALOG_SUMMARIES.lock().unwrap().is_none() {
        if let Ok(blueprints) = load_wiki_catalog_from_disk() {
            let _ = build_summaries_from_wiki(&blueprints);
        }
    }
    ensure_match_index_built()?;
    let mut matches = HashMap::new();
    for name in &product_names {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some(id) = match_product_to_blueprint(trimmed) {
            matches.insert(trimmed.to_string(), id);
        }
    }
    Ok(MatchProductsResult {
        matched_count: matches.len(),
        requested_count: product_names.len(),
        matches,
    })
}

/// Résout les noms affichés du Game.log vers des `blueprint_id` catalogue.
#[command]
pub async fn blueprints_catalog_match_products(
    product_names: Vec<String>,
) -> Result<MatchProductsResult, String> {
    tokio::task::spawn_blocking(move || match_products_sync(product_names))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn blueprints_catalog_refresh_localization() -> Result<(), String> {
    if let Some(p) = polytool_global_cache_path("fr") {
        let _ = fs::remove_file(&p);
    }
    if let Some(p) = polytool_global_cache_path("en") {
        let _ = fs::remove_file(&p);
    }
    {
        let mut cache = LOC_CACHE.lock().unwrap();
        cache.fr = None;
        cache.en = None;
        cache.classes = None;
        cache.version = None;
    }
    prefetch_polytool_globals().await;
    *MATCH_INDEX.lock().unwrap() = None;
    if let Ok(blueprints) = load_wiki_catalog_from_disk() {
        let summaries = build_summaries_from_wiki(&blueprints);
        *CATALOG_SUMMARIES.lock().unwrap() = Some(summaries);
    } else {
        *CATALOG_SUMMARIES.lock().unwrap() = None;
    }
    ensure_loc_cache()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn find_blueprint_by_display_name(
        display: &str,
        summaries: &[BlueprintSummary],
    ) -> Option<String> {
        let norm = normalize_match_key(display);
        if norm.len() < 3 {
            return None;
        }
        for s in summaries {
            if let Some(fr) = s.name_fr.as_deref() {
                if normalize_match_key(fr) == norm {
                    return Some(s.blueprint_id.clone());
                }
            }
            if normalize_match_key(&s.name_en) == norm {
                return Some(s.blueprint_id.clone());
            }
            let stripped = strip_en_class_prefix(&s.name_en);
            if normalize_match_key(&stripped) == norm {
                return Some(s.blueprint_id.clone());
            }
        }

        let target_tokens = tokenize_words(display);
        if target_tokens.len() < 2 {
            return None;
        }
        let mut best: Option<(f64, String)> = None;
        for s in summaries {
            let stripped = strip_en_class_prefix(&s.name_en);
            let mut candidates: Vec<&str> = vec![&s.name_en, stripped.as_str()];
            if let Some(fr) = s.name_fr.as_deref() {
                candidates.push(fr);
            }
            for cand in candidates {
                let score = token_overlap_score(&target_tokens, &tokenize_words(cand));
                if score >= 0.55 && best.as_ref().map(|(b, _)| score > *b).unwrap_or(true) {
                    best = Some((score, s.blueprint_id.clone()));
                }
            }
        }
        best.map(|(_, id)| id)
    }

    /// Nécessite le réseau — vérifie l’API Wiki réelle.
    #[test]
    #[ignore = "appel réseau api.star-citizen.wiki"]
    fn fetch_wiki_blueprint_returns_detail() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let bp = rt
            .block_on(fetch_wiki_blueprint_by_uuid(
                "280f47b7-8434-410c-b854-380768fdccec",
            ))
            .expect("fetch");
        assert!(!bp.ingredients.is_empty());
        let detail = blueprint_detail_from_wiki(bp).expect("detail");
        assert!(!detail.ingredients.is_empty());
    }

    #[test]
    fn normalize_bp_id_key_lowercases_wiki_key() {
        assert_eq!(
            normalize_bp_id_key("BP_CRAFT_AMRS_LaserCannon_S1"),
            "bp_craft_amrs_lasercannon_s1"
        );
    }

    #[test]
    fn summary_from_wiki_maps_core_fields() {
        let bp = WikiBlueprint {
            uuid: "280f47b7-8434-410c-b854-380768fdccec".to_string(),
            key: "BP_CRAFT_AMRS_LaserCannon_S1".to_string(),
            output_name: Some("Omnisky III Cannon".to_string()),
            output_class: Some("amrs_lasercannon_s1".to_string()),
            craft_time_seconds: Some(540),
            is_available_by_default: Some(false),
            game_version: Some("4.8.0".to_string()),
            output: Some(WikiBlueprintOutput {
                type_label: Some("Weapon Gun".to_string()),
                ..WikiBlueprintOutput::default()
            }),
            ..WikiBlueprint::default()
        };
        let summary = summary_from_wiki(&bp);
        assert_eq!(summary.blueprint_id, "bp_craft_amrs_lasercannon_s1");
        assert_eq!(summary.wiki_uuid, "280f47b7-8434-410c-b854-380768fdccec");
        assert_eq!(summary.name_en, "Omnisky III Cannon");
        assert_eq!(summary.category.as_deref(), Some("Weapon Gun"));
        assert_eq!(
            summary.internal_name.as_deref(),
            Some("amrs_lasercannon_s1")
        );
    }

    #[test]
    fn match_journal_english_from_en_ini_and_catalog() {
        let fr = HashMap::new();
        let en = HashMap::from([(
            "item_nameksar_rifle_energy_01_mag".to_string(),
            "Karna Rifle Magazine (30 cap)".to_string(),
        )]);
        {
            let mut cache = LOC_CACHE.lock().unwrap();
            cache.fr = Some(fr);
            cache.en = Some(en);
            cache.classes = Some(HashMap::new());
            cache.version = Some("test".to_string());
        }

        let summaries = vec![BlueprintSummary {
            wiki_uuid: "a".to_string(),
            blueprint_id: "bp_craft_ksar_rifle_energy_01_mag".to_string(),
            name_en: "Karna Rifle Magazine (30 cap)".to_string(),
            name_fr: None,
            internal_name: Some("ksar_rifle_energy_01_mag".to_string()),
            ..BlueprintSummary::default()
        }];
        *CATALOG_SUMMARIES.lock().unwrap() = Some(summaries.clone());
        *MATCH_INDEX.lock().unwrap() = None;
        rebuild_match_index(&summaries);

        assert_eq!(
            match_product_to_blueprint("Karna Rifle Magazine (30 cap)").as_deref(),
            Some("bp_craft_ksar_rifle_energy_01_mag")
        );

        *MATCH_INDEX.lock().unwrap() = None;
        *CATALOG_SUMMARIES.lock().unwrap() = None;
        let mut cache = LOC_CACHE.lock().unwrap();
        cache.fr = None;
        cache.en = None;
        cache.version = None;
    }

    #[test]
    fn match_journal_fr_via_polytool_en_bridge() {
        let fr = HashMap::from([
            (
                "item_nameksar_rifle_energy_01_mag".to_string(),
                "Chargeur Karna (30 cap)".to_string(),
            ),
            (
                "item_namegmni_shotgun_ballistic_01_mag".to_string(),
                "Chargeur R97 (10 cap)".to_string(),
            ),
        ]);
        let en = HashMap::from([
            (
                "item_nameksar_rifle_energy_01_mag".to_string(),
                "Karna Rifle Magazine (30 cap)".to_string(),
            ),
            (
                "item_namegmni_shotgun_ballistic_01_mag".to_string(),
                "R97 Shotgun Magazine (10 cap)".to_string(),
            ),
        ]);
        {
            let mut cache = LOC_CACHE.lock().unwrap();
            cache.fr = Some(fr);
            cache.en = Some(en);
            cache.classes = Some(HashMap::new());
            cache.version = Some("test".to_string());
        }

        let summaries = vec![
            BlueprintSummary {
                wiki_uuid: "a".to_string(),
                blueprint_id: "bp_craft_ksar_rifle_energy_01_mag".to_string(),
                name_en: "Karna Rifle Magazine (30 cap)".to_string(),
                name_fr: Some("Chargeur Karna (30 cap)".to_string()),
                internal_name: Some("ksar_rifle_energy_01_mag".to_string()),
                ..BlueprintSummary::default()
            },
            BlueprintSummary {
                wiki_uuid: "b".to_string(),
                blueprint_id: "bp_craft_gmni_shotgun_ballistic_01_mag".to_string(),
                name_en: "R97 Shotgun Magazine (10 cap)".to_string(),
                name_fr: Some("Chargeur R97 (10 cap)".to_string()),
                internal_name: Some("gmni_shotgun_ballistic_01_mag".to_string()),
                ..BlueprintSummary::default()
            },
        ];
        *CATALOG_SUMMARIES.lock().unwrap() = Some(summaries.clone());
        *MATCH_INDEX.lock().unwrap() = None;
        rebuild_match_index(&summaries);

        assert_eq!(
            match_product_to_blueprint("Chargeur Karna (30 cap)").as_deref(),
            Some("bp_craft_ksar_rifle_energy_01_mag")
        );
        assert_eq!(
            match_product_to_blueprint("Chargeur R97 (10 cap)").as_deref(),
            Some("bp_craft_gmni_shotgun_ballistic_01_mag")
        );

        *MATCH_INDEX.lock().unwrap() = None;
        *CATALOG_SUMMARIES.lock().unwrap() = None;
        let mut cache = LOC_CACHE.lock().unwrap();
        cache.fr = None;
        cache.en = None;
        cache.version = None;
    }

    #[test]
    fn wiki_pagination_meta_parses_last_page() {
        let json = r#"{"data":[],"meta":{"current_page":1,"last_page":8}}"#;
        let resp: WikiBlueprintListResponse = serde_json::from_str(json).unwrap();
        assert_eq!(resp.meta.unwrap().last_page, 8);
    }

    #[test]
    fn ship_component_grade_numeric_to_letter() {
        assert_eq!(normalize_ship_component_grade("3").as_deref(), Some("C"));
        assert_eq!(normalize_ship_component_grade("1").as_deref(), Some("A"));
        assert_eq!(normalize_ship_component_grade("undefined"), None);
    }

    #[test]
    fn summary_grade_only_for_ship_components() {
        let armor = WikiBlueprint {
            uuid: "u".to_string(),
            key: "BP_CRAFT_qrt_specialist_heavy_arms_01".to_string(),
            output: Some(WikiBlueprintOutput {
                grade: Some("1".to_string()),
                r#type: Some("Char_Armor_Arms".to_string()),
                ..WikiBlueprintOutput::default()
            }),
            ..WikiBlueprint::default()
        };
        assert_eq!(summary_from_wiki(&armor).grade, None);

        let power = WikiBlueprint {
            uuid: "u2".to_string(),
            key: "BP_CRAFT_POWR_AMRS_S01_JS300_SCItem".to_string(),
            output: Some(WikiBlueprintOutput {
                grade: Some("1".to_string()),
                r#type: Some("PowerPlant".to_string()),
                ..WikiBlueprintOutput::default()
            }),
            ..WikiBlueprint::default()
        };
        assert_eq!(summary_from_wiki(&power).grade.as_deref(), Some("A"));
    }

    #[test]
    fn extract_size_from_category_name() {
        assert_eq!(extract_size("bp_craft_x", Some("Veh. Weapons S6")), Some(6));
    }

    #[test]
    fn summary_includes_manufacturer_name_from_code() {
        let bp = WikiBlueprint {
            uuid: "u".to_string(),
            key: "BP_CRAFT_ksar_armor_heavy_helmet_01".to_string(),
            ..WikiBlueprint::default()
        };
        let s = summary_from_wiki(&bp);
        assert_eq!(s.manufacturer.as_deref(), Some("KSAR"));
        assert_eq!(s.manufacturer_name.as_deref(), Some("Kastak Arms"));
    }

    #[test]
    fn manufacturer_code_finds_segment_after_type_prefix() {
        assert_eq!(
            manufacturer_code_from_id("bp_craft_powr_aegs_s01_charger").as_deref(),
            Some("AEGS")
        );
    }

    #[test]
    fn manufacturer_class_hurston_is_mili() {
        assert_eq!(
            manufacturer_class_from_id("bp_craft_hrst_something"),
            Some("mili")
        );
    }

    #[test]
    fn ini_loc_key_to_item_suffix_parses_component_name_keys() {
        assert_eq!(
            ini_loc_key_to_item_suffix("nozzle_fuelgiver_grin_nozzlesecure_name"),
            Some("nozzle_fuelgiver_grin_nozzlesecure")
        );
        assert_eq!(
            ini_loc_key_to_item_suffix("item_namenozzle_fuelgiver_grin_nozzlesecure"),
            Some("nozzle_fuelgiver_grin_nozzlesecure")
        );
        assert!(ini_loc_key_to_item_suffix("human_first_names_m_1423").is_none());
    }

    #[test]
    fn normalize_log_product_name_torres_to_torrez() {
        assert_eq!(normalize_log_product_name("Torres"), "Torrez");
    }

    #[test]
    fn match_fuel_nozzle_short_names_via_name_suffix_keys() {
        let fr = HashMap::from([
            (
                "nozzle_fuelgiver_grin_nozzlesecure_name".to_string(),
                "Marlin".to_string(),
            ),
            (
                "nozzle_fuelgiver_grin_nozzleveryfast_name".to_string(),
                "Lindstrom".to_string(),
            ),
            (
                "nozzle_fuelgiver_shin_nozzleexpensivefast_name".to_string(),
                "Bendix".to_string(),
            ),
            (
                "nozzle_fuelgiver_shin_nozzleexpensivesecure_name".to_string(),
                "Torrez".to_string(),
            ),
        ]);
        {
            let mut cache = LOC_CACHE.lock().unwrap();
            cache.fr = Some(fr);
            cache.en = Some(HashMap::new());
            cache.classes = Some(HashMap::new());
            cache.version = Some("test".to_string());
        }

        let summaries = vec![
            BlueprintSummary {
                blueprint_id: "bp_craft_nozzle_fuelgiver_grin_nozzlesecure".to_string(),
                name_en: "Marlin".to_string(),
                name_fr: Some("Marlin".to_string()),
                internal_name: Some("nozzle_fuelgiver_grin_nozzlesecure".to_string()),
                ..BlueprintSummary::default()
            },
            BlueprintSummary {
                blueprint_id: "bp_craft_nozzle_fuelgiver_grin_nozzleveryfast".to_string(),
                name_en: "Lindstrom".to_string(),
                name_fr: Some("Lindstrom".to_string()),
                internal_name: Some("nozzle_fuelgiver_grin_nozzleveryfast".to_string()),
                ..BlueprintSummary::default()
            },
            BlueprintSummary {
                blueprint_id: "bp_craft_nozzle_fuelgiver_shin_nozzleexpensivefast".to_string(),
                name_en: "Bendix".to_string(),
                name_fr: Some("Bendix".to_string()),
                internal_name: Some("nozzle_fuelgiver_shin_nozzleexpensivefast".to_string()),
                ..BlueprintSummary::default()
            },
            BlueprintSummary {
                blueprint_id: "bp_craft_nozzle_fuelgiver_shin_nozzleexpensivesecure".to_string(),
                name_en: "Torrez".to_string(),
                name_fr: Some("Torrez".to_string()),
                internal_name: Some("nozzle_fuelgiver_shin_nozzleexpensivesecure".to_string()),
                ..BlueprintSummary::default()
            },
        ];
        *CATALOG_SUMMARIES.lock().unwrap() = Some(summaries.clone());
        *MATCH_INDEX.lock().unwrap() = None;
        rebuild_match_index(&summaries);

        assert_eq!(
            match_product_to_blueprint("Marlin").as_deref(),
            Some("bp_craft_nozzle_fuelgiver_grin_nozzlesecure")
        );
        assert_eq!(
            match_product_to_blueprint("Lindstrom").as_deref(),
            Some("bp_craft_nozzle_fuelgiver_grin_nozzleveryfast")
        );
        assert_eq!(
            match_product_to_blueprint("Bendix").as_deref(),
            Some("bp_craft_nozzle_fuelgiver_shin_nozzleexpensivefast")
        );
        assert_eq!(
            match_product_to_blueprint("Torres").as_deref(),
            Some("bp_craft_nozzle_fuelgiver_shin_nozzleexpensivesecure")
        );

        *MATCH_INDEX.lock().unwrap() = None;
        *CATALOG_SUMMARIES.lock().unwrap() = None;
        let mut cache = LOC_CACHE.lock().unwrap();
        cache.fr = None;
        cache.en = None;
        cache.version = None;
    }

    #[test]
    fn find_blueprint_by_french_log_name_against_english_catalog() {
        let summaries = vec![BlueprintSummary {
            wiki_uuid: String::new(),
            blueprint_id: "bp_craft_lawson_mininglaser_s1".to_string(),
            name_en: "Lawson Mining Laser".to_string(),
            ..BlueprintSummary::default()
        }];
        let id = find_blueprint_by_display_name("Laser de minage Lawson", &summaries);
        assert_eq!(id.as_deref(), Some("bp_craft_lawson_mininglaser_s1"));
    }
}
