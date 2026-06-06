use regex::Regex;
use serde::Serialize;
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;

fn get_log_file_path() -> Option<String> {
    if cfg!(target_os = "windows") {
        if let Ok(appdata) = env::var("APPDATA") {
            let rsi_launcher_path = format!("{appdata}\\rsilauncher");
            let log_file_path = format!("{rsi_launcher_path}\\logs\\log.log");
            return Some(log_file_path);
        }
    }
    None
}

fn get_launcher_log_list() -> Vec<String> {
    if let Some(log_file_path) = get_log_file_path() {
        if let Ok(contents) = fs::read_to_string(log_file_path) {
            return contents.lines().map(|s| s.to_string()).collect();
        }
    }
    Vec::new()
}

fn check_and_add_path(path: &str, check_exists: bool, sc_install_paths: &mut Vec<String>) {
    let path = path.replace("\\\\", "\\");
    let normalized_path = path.trim_end_matches('\\').to_string();

    if !normalized_path.is_empty()
        && !sc_install_paths
            .iter()
            .any(|existing_path| existing_path.trim_end_matches('\\') == normalized_path)
    {
        if !check_exists {
            sc_install_paths.push(normalized_path);
        } else {
            let exe_path = format!("{normalized_path}\\Bin64\\StarCitizen.exe");
            let data_p4k_path = format!("{normalized_path}\\Data.p4k");
            if Path::new(&exe_path).exists() && Path::new(&data_p4k_path).exists() {
                sc_install_paths.push(normalized_path);
            }
        }
    }
}

fn get_game_install_path(list_data: Vec<String>, check_exists: bool) -> Vec<String> {
    let mut sc_install_paths = Vec::new();

    let pattern = r"([a-zA-Z]:\\\\(?:[^\\\\]+\\\\)*StarCitizen\\\\[A-Za-z0-9_\\.\\@\\-]+)";
    let re = Regex::new(pattern).unwrap();

    for line in list_data.iter().rev() {
        for cap in re.captures_iter(line) {
            if let Some(matched_path) = cap.get(0) {
                check_and_add_path(matched_path.as_str(), check_exists, &mut sc_install_paths);
            }
        }
    }

    sc_install_paths
}

/// Normalise les séparateurs Windows / Unix avant analyse.
fn normalize_install_path(path: &str) -> String {
    path.replace('/', "\\").trim_end_matches('\\').to_string()
}

/// Extrait le segment de canal (dossier sous `StarCitizen\`).
pub fn get_game_channel_id(install_path: &str) -> String {
    let path = normalize_install_path(install_path);
    let upper = path.to_uppercase();

    if let Some(idx) = upper.rfind("STARCITIZEN\\") {
        let after = &path[idx + "STARCITIZEN\\".len()..];
        let segment = after
            .split('\\')
            .find(|s| !s.is_empty())
            .unwrap_or(after)
            .trim();
        if !segment.is_empty() {
            return segment.to_string();
        }
    }

    let re = Regex::new(r"(?i)StarCitizen[\\/]([A-Za-z0-9_\\.\\@\\-\\s]+)").unwrap();
    if let Some(cap) = re.captures(&path) {
        if let Some(version) = cap.get(1) {
            let segment = version
                .as_str()
                .split('\\')
                .next()
                .unwrap_or(version.as_str())
                .trim();
            if !segment.is_empty() {
                return segment.to_string();
            }
        }
    }

    "UNKNOWN".to_string()
}

/// Si LIVE est présent dans le nom de version ou le chemin, retourne la clé canonique `LIVE`.
pub fn canonicalize_version_key(raw_channel_id: &str, install_path: &str) -> String {
    if raw_channel_id == "UNKNOWN" {
        if install_path_indicates_live(install_path) {
            return "LIVE".to_string();
        }
        return "UNKNOWN".to_string();
    }
    if channel_id_indicates_live(raw_channel_id) || install_path_indicates_live(install_path) {
        return "LIVE".to_string();
    }
    raw_channel_id.to_string()
}

/// Le chemin d'installation pointe vers un dossier LIVE (segment ou sous-chaîne après StarCitizen).
pub fn install_path_indicates_live(install_path: &str) -> bool {
    let path = normalize_install_path(install_path);
    let upper = path.to_uppercase();
    if !upper.contains("STARCITIZEN") {
        return false;
    }

    if let Some(idx) = upper.rfind("STARCITIZEN\\") {
        for segment in path[idx + "STARCITIZEN\\".len()..].split('\\') {
            let seg = segment.trim();
            if !seg.is_empty() && channel_id_indicates_live(seg) {
                return true;
            }
        }
    }

    upper.contains("\\LIVE\\") || upper.ends_with("\\LIVE")
}

fn read_build_manifest_info(
    install_path: &str,
) -> (Option<String>, Option<String>, Option<String>) {
    let manifest_path = Path::new(install_path).join("build_manifest.id");
    let Ok(contents) = fs::read_to_string(manifest_path) else {
        return (None, None, None);
    };

    let Ok(json) = serde_json::from_str::<serde_json::Value>(&contents) else {
        return (None, None, None);
    };

    let data = json.get("Data").unwrap_or(&json);
    let clean = |value: Option<&serde_json::Value>| {
        value
            .and_then(|v| v.as_str())
            .map(str::trim)
            .filter(|v| !v.is_empty() && !v.eq_ignore_ascii_case("none"))
            .map(ToOwned::to_owned)
    };

    let build_number =
        clean(data.get("RequestedP4ChangeNum")).or_else(|| clean(data.get("BuildId")));
    let game_version = clean(data.get("Version"));
    let branch = clean(data.get("Branch"));

    (build_number, game_version, branch)
}

fn get_launcher_release_version(log_lines: &[String], channel: &str) -> Option<String> {
    let escaped_channel = regex::escape(channel);
    let version_pattern = r"([0-9]+(?:\.[0-9]+)+(?:[-.][A-Za-z0-9]+)*)";
    let patterns = [
        format!(r"(?i)\bSC\s+{escaped_channel}\s+{version_pattern}"),
        format!(r"(?i)\bStar Citizen\s+{escaped_channel}\s+{version_pattern}"),
    ];
    let regexes: Vec<Regex> = patterns
        .iter()
        .filter_map(|pattern| Regex::new(pattern).ok())
        .collect();

    for line in log_lines.iter().rev() {
        for re in &regexes {
            if let Some(cap) = re.captures(line) {
                if let Some(version) = cap.get(1) {
                    let version = version.as_str().trim();
                    if !version.is_empty() {
                        return Some(version.to_string());
                    }
                }
            }
        }
    }

    None
}

/// État de mise à jour du jeu (patch RSI) pour un canal installé.
#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub enum GameUpdateStatus {
    UpToDate,
    Outdated,
    Unknown,
}

fn normalize_sc_version_token(value: &str) -> String {
    let mut normalized = value.trim().to_lowercase().replace('_', "-");
    for suffix in ["-live", "-ptu", "-eptu", "-hotfix"] {
        if let Some(stripped) = normalized.strip_suffix(suffix) {
            normalized = stripped.to_string();
        }
    }
    normalized
}

fn sc_versions_match(installed: &str, latest: &str) -> bool {
    let a = normalize_sc_version_token(installed);
    let b = normalize_sc_version_token(latest);
    a == b || a.starts_with(&format!("{b}.")) || b.starts_with(&format!("{a}."))
}

/// Compare la version installée (`build_manifest.id`) à la dernière vue dans les logs RSI.
fn compute_game_update_status(
    release_version: &Option<String>,
    game_version: &Option<String>,
) -> GameUpdateStatus {
    let Some(latest) = release_version
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    else {
        return GameUpdateStatus::Unknown;
    };

    let Some(installed) = game_version
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    else {
        return GameUpdateStatus::Unknown;
    };

    if sc_versions_match(installed, latest) {
        GameUpdateStatus::UpToDate
    } else {
        GameUpdateStatus::Outdated
    }
}

/// Informations sur une version installée de Star Citizen.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionInfo {
    pub path: String,
    pub translated: bool,
    /// `true` si le patch installé correspond à la dernière version lue dans le launcher RSI.
    pub up_to_date: bool,
    pub game_update_status: GameUpdateStatus,
    pub release_version: Option<String>,
    pub build_number: Option<String>,
    pub game_version: Option<String>,
    pub branch: Option<String>,
}

/// Collection de toutes les versions de Star Citizen détectées.
#[derive(Serialize)]
pub struct VersionPaths {
    pub versions: HashMap<String, VersionInfo>,
}

/// Détecte et retourne toutes les versions installées de Star Citizen (travail bloquant).
/// Public pour usage depuis d'autres commandes sync (ex. local_characters).
pub fn get_star_citizen_versions_sync() -> VersionPaths {
    let log_lines = get_launcher_log_list();
    let sc_install_paths = get_game_install_path(log_lines.clone(), true);

    let mut versions = HashMap::new();
    for path in &sc_install_paths {
        let normalized_path = normalize_install_path(path);
        let raw_channel = get_game_channel_id(&normalized_path);
        let version = canonicalize_version_key(&raw_channel, &normalized_path);

        if version == "UNKNOWN" {
            continue;
        }

        // Fusionne les alias (ex. clé « StarCitizen/LIVE ») vers la clé canonique LIVE.
        let (build_number, game_version, branch) = read_build_manifest_info(&normalized_path);
        let release_version = get_launcher_release_version(&log_lines, &version);
        let game_update_status = compute_game_update_status(&release_version, &game_version);
        let up_to_date = game_update_status == GameUpdateStatus::UpToDate;
        let info = VersionInfo {
            path: normalized_path.clone(),
            translated: false,
            up_to_date,
            game_update_status,
            release_version,
            build_number,
            game_version,
            branch,
        };

        match versions.get(&version) {
            None => {
                versions.insert(version.clone(), info);
            }
            Some(existing) => {
                let prefer_new = version == "LIVE"
                    && (existing.path.to_uppercase().ends_with("\\LIVE")
                        || normalized_path.to_uppercase().ends_with("\\LIVE"))
                    && !existing.path.to_uppercase().ends_with("\\LIVE");
                if prefer_new {
                    versions.insert(version, info);
                }
            }
        }
    }
    VersionPaths { versions }
}

/// Détecte et retourne toutes les versions installées de Star Citizen.
///
/// Analyse les logs du launcher RSI pour trouver les chemins d'installation.
/// Exécuté hors du thread principal pour éviter les saccades au déplacement de la fenêtre.
#[command]
pub async fn get_star_citizen_versions() -> Result<VersionPaths, String> {
    tokio::task::spawn_blocking(get_star_citizen_versions_sync)
        .await
        .map_err(|e| e.to_string())
}

/// Canaux connus qui ne doivent pas être confondus avec LIVE (même si le nom contient « live »).
fn is_exclusive_non_live_channel(channel_id: &str) -> bool {
    let upper = channel_id.to_uppercase();
    matches!(
        upper.as_str(),
        "PTU" | "EPTU" | "HOTFIX" | "TECH-PREVIEW" | "TECH_PREVIEW"
    )
}

/// Indique si l'identifiant de canal correspond au LIVE (nom exact, segment, ou « StarCitizen/LIVE »).
pub fn channel_id_indicates_live(channel_id: &str) -> bool {
    if channel_id.is_empty() {
        return false;
    }
    let normalized = channel_id.replace('/', "\\");
    for segment in normalized.split('\\') {
        let seg = segment.trim();
        if seg.is_empty() {
            continue;
        }
        if is_exclusive_non_live_channel(seg) {
            continue;
        }
        let upper = seg.to_uppercase();
        if upper == "LIVE" || upper.contains("LIVE") {
            return true;
        }
    }
    false
}

/// Score de correspondance LIVE (plus petit = meilleur). `None` si ce n'est pas le canal LIVE.
fn live_channel_match_score(channel_id: &str) -> Option<u16> {
    if !channel_id_indicates_live(channel_id) {
        return None;
    }
    let upper = channel_id.to_uppercase();
    if upper == "LIVE" {
        return Some(0);
    }
    if upper.starts_with("LIVE") {
        return Some(100 + upper.len() as u16);
    }
    Some(1000 + upper.len() as u16)
}

/// Résout l'installation LIVE depuis la map des versions (même logique que la page Traduction).
///
/// Certaines installations ont un dossier canal renommé (ex. `LIVE_corrompu`) : on accepte toute
/// clé ou segment de chemin contenant « LIVE », en excluant PTU / EPTU / etc.
pub fn resolve_live_install_path_from_versions(
    versions: &HashMap<String, VersionInfo>,
) -> Option<String> {
    if let Some(info) = versions.get("LIVE") {
        return Some(info.path.clone());
    }

    let mut best: Option<(u16, String)> = None;

    for (key, info) in versions {
        if let Some(score) = live_channel_match_score(key) {
            consider_live_candidate(&mut best, score, &info.path);
        }
    }

    if best.is_none() {
        for info in versions.values() {
            let folder_id = get_game_channel_id(&info.path);
            if let Some(score) = live_channel_match_score(&folder_id) {
                consider_live_candidate(&mut best, score + 50, &info.path);
            }
        }
    }

    best.map(|(_, path)| path)
}

fn consider_live_candidate(best: &mut Option<(u16, String)>, score: u16, path: &str) {
    match best {
        None => *best = Some((score, path.to_string())),
        Some((best_score, _)) if score < *best_score => {
            *best = Some((score, path.to_string()));
        }
        _ => {}
    }
}

/// Retourne le chemin d'installation du canal LIVE, s'il est détecté.
pub fn get_live_install_path_sync() -> Result<String, String> {
    let versions = get_star_citizen_versions_sync();
    resolve_live_install_path_from_versions(&versions.versions).ok_or_else(|| {
        "Installation Star Citizen LIVE introuvable (canal contenant « LIVE »). Vérifiez que le jeu est installé.".to_string()
    })
}

/// Retourne le chemin attendu vers `Game.log` du canal LIVE (le fichier peut ne pas exister tant que le jeu n'a pas été lancé).
pub fn get_live_game_log_path_sync() -> Result<PathBuf, String> {
    let install_path = get_live_install_path_sync()?;
    Ok(Path::new(&install_path).join("Game.log"))
}

/// Commande Tauri : chemin du fichier Game.log (canal LIVE).
#[command]
pub async fn get_live_game_log_path() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        get_live_game_log_path_sync().map(|p| p.to_string_lossy().into_owned())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    fn info(path: &str) -> VersionInfo {
        VersionInfo {
            path: path.to_string(),
            translated: false,
            up_to_date: false,
            game_update_status: GameUpdateStatus::Unknown,
            release_version: None,
            build_number: None,
            game_version: None,
            branch: None,
        }
    }

    #[test]
    fn game_update_status_matches_normalized_versions() {
        assert_eq!(
            compute_game_update_status(&Some("4.0.1".to_string()), &Some("4.0.1-LIVE".to_string()),),
            GameUpdateStatus::UpToDate
        );
        assert_eq!(
            compute_game_update_status(&Some("4.0.2".to_string()), &Some("4.0.1".to_string()),),
            GameUpdateStatus::Outdated
        );
        assert_eq!(
            compute_game_update_status(&None, &Some("4.0.1".to_string())),
            GameUpdateStatus::Unknown
        );
    }

    #[test]
    fn resolve_live_prefers_exact_key() {
        let mut versions = HashMap::new();
        versions.insert(
            "LIVE_backup".to_string(),
            info(r"C:\StarCitizen\LIVE_backup"),
        );
        versions.insert("LIVE".to_string(), info(r"C:\StarCitizen\LIVE"));
        let resolved = resolve_live_install_path_from_versions(&versions).unwrap();
        assert!(resolved.ends_with("LIVE"));
        assert!(!resolved.ends_with("LIVE_backup"));
    }

    #[test]
    fn resolve_live_fuzzy_folder_name() {
        let mut versions = HashMap::new();
        versions.insert(
            "LIVE (1)".to_string(),
            info(r"C:\Games\StarCitizen\LIVE (1)"),
        );
        let resolved = resolve_live_install_path_from_versions(&versions).unwrap();
        assert!(resolved.contains("LIVE"));
    }

    #[test]
    fn resolve_live_ignores_ptu() {
        let mut versions = HashMap::new();
        versions.insert("PTU".to_string(), info(r"C:\StarCitizen\PTU"));
        assert!(resolve_live_install_path_from_versions(&versions).is_none());
    }

    #[test]
    fn channel_id_indicates_live_cases() {
        assert!(channel_id_indicates_live("LIVE"));
        assert!(channel_id_indicates_live("LIVE_old"));
        assert!(channel_id_indicates_live("StarCitizen/LIVE"));
        assert!(channel_id_indicates_live(r"StarCitizen\LIVE"));
        assert!(!channel_id_indicates_live("PTU"));
        assert!(!channel_id_indicates_live("EPTU"));
    }

    #[test]
    fn canonicalize_starcitizen_slash_live() {
        assert_eq!(
            canonicalize_version_key("StarCitizen/LIVE", r"C:\Games\StarCitizen\LIVE"),
            "LIVE"
        );
    }

    #[test]
    fn versions_map_uses_canonical_live_key() {
        let mut versions = HashMap::new();
        versions.insert(
            "LIVE".to_string(),
            info(r"C:\Program Files\Roberts Space Industries\StarCitizen\LIVE"),
        );
        let raw =
            get_game_channel_id(r"C:\Program Files\Roberts Space Industries\StarCitizen\LIVE");
        assert_eq!(
            canonicalize_version_key(&raw, r"C:\...\StarCitizen\LIVE"),
            "LIVE"
        );
        assert!(resolve_live_install_path_from_versions(&versions).is_some());
    }

    #[test]
    fn install_path_with_forward_slashes() {
        assert!(install_path_indicates_live("C:/Games/StarCitizen/LIVE"));
        assert_eq!(get_game_channel_id("C:/Games/StarCitizen/LIVE"), "LIVE");
    }
}
