//! Taxonomie craft Star Citizen — familles d'objets et badges cohérents avec le jeu.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BlueprintFamily {
    Armor,
    FpsWeapon,
    ShipComponent,
    ShipWeapon,
    Mining,
    Refuel,
    Other,
}

impl BlueprintFamily {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Armor => "armor",
            Self::FpsWeapon => "fps_weapon",
            Self::ShipComponent => "ship_component",
            Self::ShipWeapon => "ship_weapon",
            Self::Mining => "mining",
            Self::Refuel => "refuel",
            Self::Other => "other",
        }
    }
}

pub fn classify_output_type(output_type: Option<&str>) -> BlueprintFamily {
    let t = output_type.unwrap_or("").trim();
    if t.is_empty() {
        return BlueprintFamily::Other;
    }
    if t.starts_with("Char_Armor") {
        return BlueprintFamily::Armor;
    }
    if matches!(t, "WeaponPersonal" | "WeaponAttachment") {
        return BlueprintFamily::FpsWeapon;
    }
    if t == "WeaponGun" {
        return BlueprintFamily::ShipWeapon;
    }
    if t == "WeaponMining" {
        return BlueprintFamily::Mining;
    }
    if t == "DockingCollar" {
        return BlueprintFamily::Refuel;
    }
    if t == "Misc" {
        return BlueprintFamily::Other;
    }
    if matches!(
        t,
        "PowerPlant"
            | "Cooler"
            | "Shield"
            | "Radar"
            | "QuantumDrive"
            | "TractorBeam"
            | "SalvageModifier"
            | "SalvageHead"
            | "QuantumInterdictionGenerator"
            | "Missile"
            | "Bomb"
            | "EMP"
            | "TowingBeam"
    ) || t.starts_with("Ship")
    {
        return BlueprintFamily::ShipComponent;
    }
    BlueprintFamily::Other
}

pub fn is_useful_sub_type(sub_type: Option<&str>) -> Option<String> {
    let s = sub_type?.trim();
    if s.is_empty() {
        return None;
    }
    let lower = s.to_ascii_lowercase();
    if matches!(
        lower.as_str(),
        "undefined" | "null" | "none" | "default" | "standard" | "normal"
    ) {
        return None;
    }
    Some(s.to_string())
}

fn desc_value<'a>(
    rows: &'a [super::blueprints_item_profile::DescriptionDataRow],
    key: &str,
) -> Option<&'a str> {
    rows.iter().find_map(|r| {
        if r.name.trim().eq_ignore_ascii_case(key) {
            let v = r.value.trim();
            if v.is_empty()
                || matches!(
                    v.to_ascii_lowercase().as_str(),
                    "undefined" | "null" | "none" | "n/a"
                )
            {
                None
            } else {
                Some(v)
            }
        } else {
            None
        }
    })
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CatalogBadge {
    pub key: String,
    pub label: String,
    pub kind: String,
}

#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct HeroStat {
    pub label: String,
    pub value: String,
}

pub fn build_catalog_badges(
    family: BlueprintFamily,
    output_type: Option<&str>,
    output_type_label: Option<&str>,
    sub_type: Option<&str>,
    size: Option<u64>,
    description_data: &[super::blueprints_item_profile::DescriptionDataRow],
) -> Vec<CatalogBadge> {
    let mut out = Vec::new();
    let push = |out: &mut Vec<CatalogBadge>, key: &str, label: &str, kind: &str| {
        if label.trim().is_empty() {
            return;
        }
        out.push(CatalogBadge {
            key: key.to_string(),
            label: label.to_string(),
            kind: kind.to_string(),
        });
    };

    match family {
        BlueprintFamily::Armor => {
            if let Some(slot) = output_type.and_then(armor_slot_label) {
                push(&mut out, "slot", slot, "slot");
            }
            if let Some(item_type) = desc_value(description_data, "Item Type") {
                push(&mut out, "armor-class", item_type, "armor_class");
            } else if let Some(st) = is_useful_sub_type(sub_type) {
                push(&mut out, "armor-class", &st, "armor_class");
            }
            if let Some(dr) = desc_value(description_data, "Damage Reduction") {
                push(&mut out, "dr", dr, "stat");
            }
        }
        BlueprintFamily::FpsWeapon => {
            if let Some(item_type) = desc_value(description_data, "Item Type") {
                push(&mut out, "item-type", item_type, "item_type");
            }
            if let Some(class) = desc_value(description_data, "Class") {
                push(&mut out, "class", class, "weapon_class");
            }
            if let Some(sz) = size_label(description_data, size) {
                push(&mut out, "size", &sz, "size");
            }
        }
        BlueprintFamily::ShipComponent => {
            if let Some(label) = output_type_label {
                push_output_type_badge(&mut out, label);
            }
            if let Some(grade) = desc_value(description_data, "Grade") {
                push(&mut out, "grade", grade, "grade");
            }
            if let Some(sz) = size_label(description_data, size) {
                push(&mut out, "size", &sz, "size");
            }
            if let Some(class) = desc_value(description_data, "Class") {
                push(&mut out, "class", class, "component_class");
            }
            if let Some(mfg) = desc_value(description_data, "Manufacturer") {
                push(&mut out, "mfg", mfg, "manufacturer");
            }
        }
        BlueprintFamily::ShipWeapon => {
            if let Some(sz) = size_label(description_data, size) {
                push(&mut out, "size", &sz, "size");
            }
        }
        BlueprintFamily::Mining => {
            if let Some(sz) = size_label(description_data, size) {
                push(&mut out, "size", &sz, "size");
            }
            if let Some(label) = output_type_label {
                push_output_type_badge(&mut out, label);
            }
        }
        BlueprintFamily::Refuel => {
            if let Some(item_type) = desc_value(description_data, "Item Type") {
                push(&mut out, "item-type", item_type, "item_type");
            }
            if let Some(mfg) = desc_value(description_data, "Manufacturer") {
                push(&mut out, "mfg", mfg, "manufacturer");
            }
        }
        BlueprintFamily::Other => {}
    }
    out
}

/// Champs déjà résolus dans `summary_from_wiki` (sans `description_data` item).
#[derive(Clone, Copy, Default)]
pub struct SummaryBadgeContext<'a> {
    pub grade: Option<&'a str>,
    pub class_code: Option<&'a str>,
    pub manufacturer_name: Option<&'a str>,
}

fn class_code_display_label(code: &str) -> Option<&'static str> {
    match code.trim().to_ascii_lowercase().as_str() {
        "civi" => Some("Civilian"),
        "mili" => Some("Military"),
        "indu" => Some("Industrial"),
        "stlh" => Some("Stealth"),
        "comp" => Some("Competition"),
        _ => None,
    }
}

/// Libellés Wiki trop génériques pour un badge utile (ex. « Medium », « Gun »).
fn is_generic_output_type_label(label: &str) -> bool {
    let lower = label.trim().to_ascii_lowercase();
    if lower.len() < 3 {
        return true;
    }
    matches!(
        lower.as_str(),
        "gun"
            | "medium"
            | "light"
            | "heavy"
            | "weapon gun"
            | "weapon"
            | "misc"
            | "undefined"
            | "null"
            | "none"
            | "standard"
            | "normal"
            | "default"
            | "personal"
            | "vehicle"
    )
}

fn map_output_type_badge_label(label: &str) -> String {
    match label.trim() {
        "Weapon Gun" => "Weapon".to_string(),
        "WeaponPersonal" => "Personal weapon".to_string(),
        "WeaponAttachment" => "Weapon attachment".to_string(),
        other => other.to_string(),
    }
}

fn push_output_type_badge(out: &mut Vec<CatalogBadge>, label: &str) {
    if is_generic_output_type_label(label) {
        return;
    }
    let mapped = map_output_type_badge_label(label);
    if mapped.trim().is_empty() {
        return;
    }
    out.push(CatalogBadge {
        key: "type".to_string(),
        label: mapped,
        kind: "output_type".to_string(),
    });
}

/// Badges catalogue légers (sans appel item) pour la liste.
pub fn build_summary_badges(
    family: BlueprintFamily,
    output_type: Option<&str>,
    output_type_label: Option<&str>,
    sub_type: Option<&str>,
    size: Option<u64>,
    ctx: SummaryBadgeContext<'_>,
) -> Vec<CatalogBadge> {
    let mut out = Vec::new();
    let push = |out: &mut Vec<CatalogBadge>, key: &str, label: &str, kind: &str| {
        if label.trim().is_empty() {
            return;
        }
        out.push(CatalogBadge {
            key: key.to_string(),
            label: label.to_string(),
            kind: kind.to_string(),
        });
    };

    match family {
        BlueprintFamily::Armor => {
            if let Some(slot) = output_type.and_then(armor_slot_label) {
                push(&mut out, "slot", slot, "slot");
            }
            if let Some(st) = is_useful_sub_type(sub_type) {
                push(&mut out, "armor-class", &st, "armor_class");
            }
        }
        BlueprintFamily::FpsWeapon => {
            if let Some(sz) = size_label(&[], size) {
                push(&mut out, "size", &sz, "size");
            }
        }
        BlueprintFamily::ShipComponent => {
            if let Some(label) = output_type_label {
                push_output_type_badge(&mut out, label);
            }
            if let Some(grade) = ctx.grade {
                push(&mut out, "grade", grade, "grade");
            }
            if let Some(sz) = size_label(&[], size) {
                push(&mut out, "size", &sz, "size");
            }
            if let Some(code) = ctx.class_code.and_then(class_code_display_label) {
                push(&mut out, "class", code, "component_class");
            }
            if let Some(mfg) = ctx.manufacturer_name.filter(|s| !s.is_empty()) {
                push(&mut out, "mfg", mfg, "manufacturer");
            }
        }
        BlueprintFamily::ShipWeapon => {
            if let Some(sz) = size_label(&[], size) {
                push(&mut out, "size", &sz, "size");
            }
        }
        BlueprintFamily::Mining => {
            if let Some(sz) = size_label(&[], size) {
                push(&mut out, "size", &sz, "size");
            }
            if let Some(label) = output_type_label {
                push_output_type_badge(&mut out, label);
            }
        }
        BlueprintFamily::Refuel => {
            if let Some(mfg) = ctx.manufacturer_name.filter(|s| !s.is_empty()) {
                push(&mut out, "mfg", mfg, "manufacturer");
            }
        }
        BlueprintFamily::Other => {}
    }
    out
}

pub fn build_hero_stats(
    family: BlueprintFamily,
    description_data: &[super::blueprints_item_profile::DescriptionDataRow],
) -> Vec<HeroStat> {
    let keys: &[&str] = match family {
        BlueprintFamily::Armor => &[
            "Damage Reduction",
            "Radiation Protection",
            "Temp. Rating",
            "Item Type",
        ],
        BlueprintFamily::FpsWeapon => &[
            "Item Type",
            "Class",
            "Rate Of Fire",
            "Effective Range",
            "Manufacturer",
        ],
        BlueprintFamily::ShipComponent => &["Grade", "Size", "Class", "Manufacturer", "Item Type"],
        BlueprintFamily::ShipWeapon => &["Size", "Item Type", "Manufacturer", "Class"],
        BlueprintFamily::Mining => &["Laser Power", "Size", "Item Type", "Manufacturer"],
        BlueprintFamily::Refuel => &["Item Type", "Manufacturer"],
        BlueprintFamily::Other => &["Item Type", "Manufacturer", "Class"],
    };

    keys.iter()
        .filter_map(|k| {
            desc_value(description_data, k).map(|v| HeroStat {
                label: (*k).to_string(),
                value: v.to_string(),
            })
        })
        .take(4)
        .collect()
}

fn size_label(
    description_data: &[super::blueprints_item_profile::DescriptionDataRow],
    size: Option<u64>,
) -> Option<String> {
    desc_value(description_data, "Size")
        .map(|s| {
            if let Ok(n) = s.parse::<u64>() {
                format!("S{n}")
            } else {
                s.to_string()
            }
        })
        .or_else(|| size.map(|n| format!("S{n}")))
}

fn armor_slot_label(output_type: &str) -> Option<&'static str> {
    match output_type {
        "Char_Armor_Helmet" => Some("Helmet"),
        "Char_Armor_Torso" => Some("Torso"),
        "Char_Armor_Arms" => Some("Arms"),
        "Char_Armor_Legs" => Some("Legs"),
        "Char_Armor_Backpack" => Some("Backpack"),
        "Char_Armor_Undersuit" => Some("Undersuit"),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scripts::blueprints_item_profile::DescriptionDataRow;

    #[test]
    fn classifies_misc_as_other() {
        assert_eq!(classify_output_type(Some("Misc")), BlueprintFamily::Other);
    }

    #[test]
    fn classifies_armor_and_ship_component() {
        assert_eq!(
            classify_output_type(Some("Char_Armor_Helmet")),
            BlueprintFamily::Armor
        );
        assert_eq!(
            classify_output_type(Some("PowerPlant")),
            BlueprintFamily::ShipComponent
        );
    }

    #[test]
    fn ship_component_grade_from_description_data_only() {
        let rows = vec![
            DescriptionDataRow {
                name: "Grade".into(),
                value: "A".into(),
            },
            DescriptionDataRow {
                name: "Size".into(),
                value: "1".into(),
            },
        ];
        let badges = build_catalog_badges(
            BlueprintFamily::ShipComponent,
            Some("PowerPlant"),
            Some("Power Plant"),
            None,
            Some(1),
            &rows,
        );
        assert!(badges.iter().any(|b| b.label == "A" && b.kind == "grade"));
        assert!(badges
            .iter()
            .any(|b| b.label == "Power Plant" && b.kind == "output_type"));
    }

    #[test]
    fn ship_component_summary_badges_citadel_like() {
        let badges = build_summary_badges(
            BlueprintFamily::ShipComponent,
            Some("Shield"),
            Some("Shield Generator"),
            None,
            Some(2),
            SummaryBadgeContext {
                grade: Some("B"),
                class_code: Some("indu"),
                manufacturer_name: Some("Basilisk"),
            },
        );
        let kinds: Vec<_> = badges.iter().map(|b| b.kind.as_str()).collect();
        assert_eq!(
            kinds,
            vec![
                "output_type",
                "grade",
                "size",
                "component_class",
                "manufacturer"
            ]
        );
        assert!(badges.iter().any(|b| b.label == "Shield Generator"));
        assert!(badges.iter().any(|b| b.label == "B"));
        assert!(badges.iter().any(|b| b.label == "S2"));
        assert!(badges.iter().any(|b| b.label == "Industrial"));
    }

    #[test]
    fn generic_output_type_labels_are_omitted_from_badges() {
        let badges = build_summary_badges(
            BlueprintFamily::ShipWeapon,
            Some("WeaponGun"),
            Some("Medium"),
            Some("Gun"),
            Some(2),
            SummaryBadgeContext::default(),
        );
        assert!(!badges.iter().any(|b| b.kind == "output_type"));
        assert!(badges.iter().any(|b| b.label == "S2"));
    }

    #[test]
    fn generic_weapon_gun_label_omitted_from_badges() {
        let badges = build_summary_badges(
            BlueprintFamily::ShipComponent,
            Some("WeaponGun"),
            Some("Weapon Gun"),
            None,
            Some(1),
            SummaryBadgeContext::default(),
        );
        assert!(!badges.iter().any(|b| b.kind == "output_type"));
    }

    #[test]
    fn laser_cannon_label_kept_for_ship_component() {
        let badges = build_summary_badges(
            BlueprintFamily::ShipComponent,
            Some("WeaponGun"),
            Some("Laser Cannon"),
            None,
            Some(1),
            SummaryBadgeContext::default(),
        );
        assert!(badges
            .iter()
            .any(|b| b.label == "Laser Cannon" && b.kind == "output_type"));
    }
}
