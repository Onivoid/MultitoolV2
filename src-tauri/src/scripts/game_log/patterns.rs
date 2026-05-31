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
}
