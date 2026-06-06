use regex::Regex;

/// Motifs de détection des systèmes solaires (extensible).
pub const STAR_SYSTEMS: &[(&str, &[&str])] = &[
    (
        "Pyro",
        &[
            "/pu/system/pyro/",
            "zone [pyro",
            "location[pyro",
            "ooc_pyro",
            "pyro1",
            "pyro2",
            "pyro3",
            "pyro4",
            "pyro5",
        ],
    ),
    (
        "Stanton",
        &[
            "/pu/system/stanton/",
            "zone [stanton",
            "location[stanton",
            "ooc_stanton",
        ],
    ),
    (
        "Nyx",
        &["/pu/system/nyx/", "zone [nyx", "location[nyx", "ooc_nyx"],
    ),
];

pub fn detect_star_system(line: &str) -> Option<&'static str> {
    let lower = line.to_ascii_lowercase();
    for (name, patterns) in STAR_SYSTEMS {
        if patterns.iter().any(|p| lower.contains(p)) {
            return Some(*name);
        }
    }
    None
}

/// Retire le suffixe numérique d'instance (`ORIG_m80_373414673624` → `ORIG_m80`).
/// Libellé boutique lisible (sans préfixe SCShop / SC_Shop, `_` → espaces).
pub fn normalize_shop_display_name(raw: &str) -> String {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let lower = trimmed.to_ascii_lowercase();
    let rest = if lower.starts_with("sc_shop") {
        trimmed.get(7..).unwrap_or("").trim_start()
    } else if lower.starts_with("scshop") {
        trimmed.get(6..).unwrap_or("").trim_start()
    } else {
        trimmed
    };
    let rest = rest.trim_start_matches(['_', ' ', '-']);
    let collapsed: String = rest
        .split('_')
        .flat_map(|part| part.split_whitespace())
        .collect::<Vec<_>>()
        .join(" ");
    if collapsed.is_empty() {
        trimmed.to_string()
    } else {
        collapsed
    }
}

pub fn normalize_vehicle_type(raw: &str) -> String {
    let raw = raw.trim();
    if let Some(pos) = raw.rfind('_') {
        let suffix = &raw[pos + 1..];
        if !suffix.is_empty() && suffix.chars().all(|c| c.is_ascii_digit()) {
            return raw[..pos].to_string();
        }
    }
    raw.to_string()
}

pub struct EndMissionEvent {
    pub mission_id: String,
    pub completion_type: String,
}

pub fn parse_end_mission(line: &str) -> Option<EndMissionEvent> {
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(
            r"(?:<EndMission>|<MissionEnded>).*MissionId\[([^\]]+)\].*CompletionType\[(\w+)\]",
        )
        .expect("end mission regex")
    });
    let caps = re.captures(line)?;
    Some(EndMissionEvent {
        mission_id: caps.get(1)?.as_str().trim().to_string(),
        completion_type: caps.get(2)?.as_str().trim().to_string(),
    })
}

pub fn classify_mission_completion(completion_type: &str) -> Option<MissionOutcome> {
    match completion_type {
        "Complete" => Some(MissionOutcome::Completed),
        "Abandon" => Some(MissionOutcome::Abandoned),
        "Fail" | "Failed" | "Incomplete" | "Cancelled" | "Canceled" => Some(MissionOutcome::Failed),
        _ => None,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MissionOutcome {
    Completed,
    Abandoned,
    Failed,
}

pub fn parse_blueprint_product(line: &str) -> Option<String> {
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(r"(?:Received Blueprint: (.+?):|Sch[eé]mas? reçus? : (.+?):)")
            .expect("blueprint regex")
    });
    let caps = re.captures(line)?;
    let name = caps.get(1).or_else(|| caps.get(2))?;
    let trimmed = name.as_str().trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

pub fn parse_vehicle_clear_driver(line: &str) -> Option<String> {
    if !line.contains("ClearDriver") || !line.contains("releasing control") {
        return None;
    }
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r"for '([^']+)'").expect("vehicle regex"));
    let caps = re.captures(line)?;
    Some(normalize_vehicle_type(caps.get(1)?.as_str()))
}

pub struct PilotingGrantEvent {
    pub ts: f64,
    pub ship_name: String,
    pub ship_id: String,
}

pub struct PilotingReleaseEvent {
    pub ts: f64,
    pub ship_name: String,
    pub ship_id: String,
}

pub struct PilotingStarmapEvent {
    pub ts: f64,
    pub ship_name: String,
    pub ship_id: String,
}

pub fn parse_piloting_grant(line: &str) -> Option<PilotingGrantEvent> {
    if !line.contains("granted control token") {
        return None;
    }
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(
            r"<(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)>[^\n]*granted control token for '([^']+)' \[(\d+)\]",
        )
        .expect("piloting grant regex")
    });
    let caps = re.captures(line)?;
    let ts = crate::scripts::game_log::parse::parse_log_timestamp(line)?;
    Some(PilotingGrantEvent {
        ts,
        ship_name: caps.get(2)?.as_str().to_string(),
        ship_id: caps.get(3)?.as_str().to_string(),
    })
}

pub fn parse_piloting_release(line: &str) -> Option<PilotingReleaseEvent> {
    if !line.contains("releasing control token") {
        return None;
    }
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(
            r"<(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)>[^\n]*releasing control token for '([^']+)' \[(\d+)\]",
        )
        .expect("piloting release regex")
    });
    let caps = re.captures(line)?;
    let ts = crate::scripts::game_log::parse::parse_log_timestamp(line)?;
    Some(PilotingReleaseEvent {
        ts,
        ship_name: caps.get(2)?.as_str().to_string(),
        ship_id: caps.get(3)?.as_str().to_string(),
    })
}

pub fn parse_piloting_starmap_no_route(line: &str) -> Option<PilotingStarmapEvent> {
    if !line.contains("GetStarmapRouteSegmentData") || !line.contains("No Route loaded") {
        return None;
    }
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(
            r"<(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)>[^\n]*\|\s*([A-Za-z0-9_]+)\[(\d+)\]\|CSCItemNavigation::GetStarmapRouteSegmentData\|No Route loaded!",
        )
        .expect("piloting starmap regex")
    });
    let caps = re.captures(line)?;
    let ts = crate::scripts::game_log::parse::parse_log_timestamp(line)?;
    Some(PilotingStarmapEvent {
        ts,
        ship_name: caps.get(2)?.as_str().to_string(),
        ship_id: caps.get(3)?.as_str().to_string(),
    })
}

pub struct ShopBuyRequest {
    pub ts: f64,
    pub shop_id: String,
    pub shop_name: String,
    pub kiosk_id: String,
    pub price: f64,
    pub item: String,
    pub qty: u32,
}

pub struct ShopBuyResponse {
    pub shop_id: String,
    pub shop_name: String,
    pub kiosk_id: String,
    pub success: bool,
    pub is_buying: bool,
}

pub fn parse_shop_buy_request(line: &str) -> Option<ShopBuyRequest> {
    if !line.contains("SendShopBuyRequest") {
        return None;
    }
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(
            r"<(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)>.*SendShopBuyRequest.*shopId\[(\d+)\].*shopName\[([^\]]*)\].*kioskId\[(\d+)\].*client_price\[(\d+(?:\.\d+)?)\].*itemName\[([^\]]*)\].*quantity\[(\d+)\]",
        )
        .expect("shop buy request regex")
    });
    let caps = re.captures(line)?;
    let ts = crate::scripts::game_log::parse::parse_log_timestamp(line)?;
    let qty: u32 = caps.get(7)?.as_str().parse().ok()?;
    let price: f64 = caps.get(5)?.as_str().parse().ok()?;
    Some(ShopBuyRequest {
        ts,
        shop_id: caps.get(2)?.as_str().to_string(),
        shop_name: caps.get(3)?.as_str().trim().to_string(),
        kiosk_id: caps.get(4)?.as_str().to_string(),
        price,
        item: caps.get(6)?.as_str().trim().to_string(),
        qty,
    })
}

pub fn parse_shop_buy_response(line: &str) -> Option<ShopBuyResponse> {
    if !line.contains("RmShopFlowResponse") {
        return None;
    }
    static RE: std::sync::OnceLock<Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(
            r"<(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)>.*RmShopFlowResponse.*shopId\[(\d+)\].*shopName\[([^\]]*)\].*kioskId\[(\d+)\].*result\[([^\]]+)\].*type\[([^\]]+)\]",
        )
        .expect("shop buy response regex")
    });
    let caps = re.captures(line)?;
    let result = caps.get(5)?.as_str().trim().to_ascii_lowercase();
    let flow_type = caps.get(6)?.as_str().trim().to_ascii_lowercase();
    Some(ShopBuyResponse {
        shop_id: caps.get(2)?.as_str().to_string(),
        shop_name: caps.get(3)?.as_str().trim().to_string(),
        kiosk_id: caps.get(4)?.as_str().to_string(),
        success: result == "success",
        is_buying: flow_type == "buying",
    })
}

/// Fusionne des intervalles [start, end] triés (chevauchement ou gap < 1s).
pub fn merge_time_intervals(mut intervals: Vec<(f64, f64)>) -> Vec<(f64, f64)> {
    const GAP_SEC: f64 = 1.0;
    if intervals.is_empty() {
        return intervals;
    }
    intervals.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));
    let mut merged = vec![intervals[0]];
    for (start, end) in intervals.into_iter().skip(1) {
        let last = merged.last_mut().unwrap();
        if start <= last.1 + GAP_SEC {
            last.1 = last.1.max(end);
        } else {
            merged.push((start, end));
        }
    }
    merged
}

pub fn total_seconds_from_intervals(intervals: &[(f64, f64)]) -> f64 {
    intervals.iter().map(|(s, e)| (e - s).max(0.0)).sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_vehicle_strips_instance_id() {
        assert_eq!(
            normalize_vehicle_type("ANVL_Lightning_F8C_123456789"),
            "ANVL_Lightning_F8C"
        );
        assert_eq!(normalize_vehicle_type("ORIG_m80_373414673624"), "ORIG_m80");
    }

    #[test]
    fn parse_end_mission_complete() {
        let line = r#"<2026-05-30T12:00:00.000Z> [Notice] <EndMission> MissionId[abc-def] CompletionType[Complete] Reason[Mission Ended]"#;
        let ev = parse_end_mission(line).unwrap();
        assert_eq!(ev.mission_id, "abc-def");
        assert_eq!(ev.completion_type, "Complete");
        assert_eq!(
            classify_mission_completion(&ev.completion_type),
            Some(MissionOutcome::Completed)
        );
    }

    #[test]
    fn parse_blueprint_fr() {
        let line = r#"Added notification "Schémas reçu : Chargeur Karna (30 cap): ""#;
        assert_eq!(
            parse_blueprint_product(line).as_deref(),
            Some("Chargeur Karna (30 cap)")
        );
    }

    #[test]
    fn detect_pyro_from_socpak() {
        let line = "Loading socpak /pu/system/pyro/pyro2.socpak";
        assert_eq!(detect_star_system(line), Some("Pyro"));
    }

    #[test]
    fn parse_vehicle_clear_driver_line() {
        let line =
            "CVehicleMovementBase::ClearDriver releasing control token for 'ORIG_m80_373414673624'";
        assert_eq!(
            parse_vehicle_clear_driver(line).as_deref(),
            Some("ORIG_m80")
        );
    }

    #[test]
    fn merge_intervals_overlapping() {
        let merged = merge_time_intervals(vec![(0.0, 10.0), (5.0, 15.0)]);
        assert_eq!(merged.len(), 1);
        assert!((total_seconds_from_intervals(&merged) - 15.0).abs() < 0.01);
    }

    #[test]
    fn normalize_shop_display_name_strips_prefix_and_underscores() {
        assert_eq!(
            normalize_shop_display_name("SCShop_Area18_AstroArmada"),
            "Area18 AstroArmada"
        );
        assert_eq!(
            normalize_shop_display_name("SC_Shop_NEW_Babbage"),
            "NEW Babbage"
        );
    }

    #[test]
    fn parse_shop_buy_flow() {
        let req = r#"<2026-01-15T10:00:00.000Z> SendShopBuyRequest shopId[1] shopName[Shop] kioskId[2] client_price[100] itemName[Item] quantity[1]"#;
        let req_parsed = parse_shop_buy_request(req).unwrap();
        assert_eq!(req_parsed.shop_id, "1");
        assert!((req_parsed.price - 100.0).abs() < 0.01);

        let resp = r#"<2026-01-15T10:00:01.000Z> RmShopFlowResponse shopId[1] shopName[Shop] kioskId[2] result[Success] type[Buying]"#;
        let resp_parsed = parse_shop_buy_response(resp).unwrap();
        assert!(resp_parsed.success);
        assert!(resp_parsed.is_buying);
    }

    #[test]
    fn parse_piloting_grant_line() {
        let line = r#"<2026-01-01T10:00:00.000Z> granted control token for 'ORIG_300i' [99]"#;
        let ev = parse_piloting_grant(line).unwrap();
        assert_eq!(ev.ship_name, "ORIG_300i");
        assert_eq!(ev.ship_id, "99");
    }
}
