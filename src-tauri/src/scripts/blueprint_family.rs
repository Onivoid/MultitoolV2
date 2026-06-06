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
            if let Some(label) = output_type_label.filter(|s| !s.is_empty()) {
                push(&mut out, "type", label, "output_type");
            }
        }
        BlueprintFamily::Mining => {
            if let Some(sz) = size_label(description_data, size) {
                push(&mut out, "size", &sz, "size");
            }
            if let Some(label) = output_type_label.filter(|s| !s.is_empty()) {
                push(&mut out, "type", label, "output_type");
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
        BlueprintFamily::Other => {
            if let Some(label) = output_type_label.filter(|s| !s.is_empty()) {
                push(&mut out, "type", label, "output_type");
            }
        }
    }
    out
}

/// Badges catalogue légers (sans appel item) pour la liste.
pub fn build_summary_badges(
    family: BlueprintFamily,
    output_type: Option<&str>,
    output_type_label: Option<&str>,
    sub_type: Option<&str>,
    size: Option<u64>,
) -> Vec<CatalogBadge> {
    build_catalog_badges(family, output_type, output_type_label, sub_type, size, &[])
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
        .map(|s| s.to_string())
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
    }
}
