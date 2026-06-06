use crate::scripts::gamepath::get_live_game_log_path_sync;
use serde::Serialize;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::command;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

const MAX_LOGBACKUP_FILES: usize = 40;
const MAX_LOG_FILE_BYTES: u64 = 100 * 1024 * 1024;

#[derive(Clone, Copy)]
enum TargetKind {
    File,
    DirAll,
    DirExt(&'static [&'static str]),
    GlobIni,
}

struct BackupTargetDef {
    key: &'static str,
    label: &'static str,
    rel: &'static str,
    kind: TargetKind,
}

const TARGETS: &[BackupTargetDef] = &[
    BackupTargetDef {
        key: "characters",
        label: "Personnages (.chf)",
        rel: "user/client/0/customcharacters",
        kind: TargetKind::DirExt(&[".chf"]),
    },
    BackupTargetDef {
        key: "power_presets",
        label: "Power presets",
        rel: "user/client/0/PowerPresets",
        kind: TargetKind::DirAll,
    },
    BackupTargetDef {
        key: "console_history",
        label: "Historique console",
        rel: "user/client/0/ConsoleHistory.txt",
        kind: TargetKind::File,
    },
    BackupTargetDef {
        key: "attributes_xml",
        label: "Attributes (réglages)",
        rel: "user/client/0/Profiles/default/attributes.xml",
        kind: TargetKind::File,
    },
    BackupTargetDef {
        key: "actionmaps_xml",
        label: "Contrôles (actionmaps)",
        rel: "user/client/0/Profiles/default/actionmaps.xml",
        kind: TargetKind::File,
    },
    BackupTargetDef {
        key: "reshade_ini",
        label: "ReShade (.ini)",
        rel: "Bin64",
        kind: TargetKind::GlobIni,
    },
    BackupTargetDef {
        key: "eac_splash",
        label: "EAC Splashscreen",
        rel: "EasyAntiCheat/SplashScreen.png",
        kind: TargetKind::File,
    },
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupTargetStatus {
    pub key: String,
    pub label: String,
    pub exists: bool,
    pub file_count: u64,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupExportResult {
    pub files_packed: u32,
    pub bytes_packed: u64,
    pub skipped: Vec<String>,
}

fn rel_path_unix(path: &Path, root: &Path) -> Option<String> {
    path.strip_prefix(root)
        .ok()
        .map(|p| p.to_string_lossy().replace('\\', "/"))
}

fn file_matches_ext(path: &Path, exts: &[&str]) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| {
            exts.iter()
                .any(|ext| e.eq_ignore_ascii_case(ext.trim_start_matches('.')))
        })
        .unwrap_or(false)
}

fn collect_files(
    install_root: &Path,
    target: &BackupTargetDef,
    out: &mut Vec<(PathBuf, String)>,
) {
    let abs = install_root.join(target.rel.replace('/', std::path::MAIN_SEPARATOR_STR));
    match target.kind {
        TargetKind::File => {
            if abs.is_file() {
                if let Some(arc) = rel_path_unix(&abs, install_root) {
                    out.push((abs, arc));
                }
            }
        }
        TargetKind::DirAll | TargetKind::DirExt(_) => {
            if !abs.is_dir() {
                return;
            }
            fn walk(
                dir: &Path,
                install_root: &Path,
                exts: Option<&[&str]>,
                out: &mut Vec<(PathBuf, String)>,
            ) {
                let Ok(read) = fs::read_dir(dir) else {
                    return;
                };
                for entry in read.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        walk(&path, install_root, exts, out);
                    } else if exts.is_none_or(|exts| file_matches_ext(&path, exts)) {
                        if let Some(arc) = rel_path_unix(&path, install_root) {
                            out.push((path, arc));
                        }
                    }
                }
            }
            let exts = match target.kind {
                TargetKind::DirExt(e) => Some(e),
                _ => None,
            };
            walk(&abs, install_root, exts, out);
        }
        TargetKind::GlobIni => {
            if !abs.is_dir() {
                return;
            }
            let Ok(read) = fs::read_dir(&abs) else {
                return;
            };
            for entry in read.flatten() {
                let path = entry.path();
                if path.is_file() && file_matches_ext(&path, &[".ini"]) {
                    if let Some(arc) = rel_path_unix(&path, install_root) {
                        out.push((path, arc));
                    }
                }
            }
        }
    }
}

fn scan_target(install_root: &Path, target: &BackupTargetDef) -> BackupTargetStatus {
    let mut files = Vec::new();
    collect_files(install_root, target, &mut files);
    let total_bytes: u64 = files
        .iter()
        .filter_map(|(p, _)| fs::metadata(p).ok().map(|m| m.len()))
        .sum();
    BackupTargetStatus {
        key: target.key.to_string(),
        label: target.label.to_string(),
        exists: !files.is_empty(),
        file_count: files.len() as u64,
        total_bytes,
    }
}

fn collect_optional_logs(
    _install_root: &Path,
    include_game_log: bool,
    include_log_backups: bool,
    out: &mut Vec<(PathBuf, String)>,
) {
    if !include_game_log && !include_log_backups {
        return;
    }

    let game_log = get_live_game_log_path_sync().ok();
    let log_dir = game_log
        .as_ref()
        .and_then(|p| Path::new(p).parent().map(|d| d.to_path_buf()));

    if include_game_log {
        if let Some(ref log_path) = game_log {
            let path = PathBuf::from(log_path);
            if path.is_file() {
                if let Ok(meta) = fs::metadata(&path) {
                    if meta.len() <= MAX_LOG_FILE_BYTES {
                        out.push((path, "logs/Game.log".to_string()));
                    }
                }
            }
        }
    }

    if include_log_backups {
        if let Some(dir) = log_dir {
            let backups = dir.join("logbackups");
            if backups.is_dir() {
                let Ok(read) = fs::read_dir(&backups) else {
                    return;
                };
                let mut entries: Vec<PathBuf> = read
                    .flatten()
                    .map(|e| e.path())
                    .filter(|p| p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("log"))
                    .collect();
                entries.sort_by(|a, b| b.cmp(a));
                for path in entries.into_iter().take(MAX_LOGBACKUP_FILES) {
                    if let Ok(meta) = fs::metadata(&path) {
                        if meta.len() > MAX_LOG_FILE_BYTES {
                            continue;
                        }
                    }
                    if let Some(name) = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .map(str::to_string)
                    {
                        out.push((path, format!("logs/logbackups/{name}")));
                    }
                }
            }
        }
    }
}

fn scan_log_targets(
    include_game_log: bool,
    include_log_backups: bool,
) -> Vec<BackupTargetStatus> {
    let mut statuses = Vec::new();
    if include_game_log {
        let exists = get_live_game_log_path_sync()
            .ok()
            .map(PathBuf::from)
            .filter(|p| p.is_file())
            .map(|p| fs::metadata(&p).ok().map(|m| m.len()).unwrap_or(0))
            .unwrap_or(0);
        statuses.push(BackupTargetStatus {
            key: "game_log".to_string(),
            label: "Game.log (session en cours)".to_string(),
            exists: exists > 0,
            file_count: if exists > 0 { 1 } else { 0 },
            total_bytes: exists,
        });
    }
    if include_log_backups {
        let mut count = 0u64;
        let mut bytes = 0u64;
        if let Ok(log_path) = get_live_game_log_path_sync() {
            let backups = PathBuf::from(&log_path)
                .parent()
                .map(|d| d.join("logbackups"));
            if let Some(dir) = backups.filter(|d| d.is_dir()) {
                if let Ok(read) = fs::read_dir(dir) {
                    for entry in read.flatten() {
                        let path = entry.path();
                        if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("log")
                        {
                            count += 1;
                            if let Ok(meta) = fs::metadata(&path) {
                                bytes += meta.len();
                            }
                        }
                    }
                }
            }
        }
        statuses.push(BackupTargetStatus {
            key: "log_backups".to_string(),
            label: "Archives logbackups".to_string(),
            exists: count > 0,
            file_count: count,
            total_bytes: bytes,
        });
    }
    statuses
}

pub fn list_game_config_backup_targets_sync(
    install_path: String,
    include_game_log: bool,
    include_log_backups: bool,
) -> Result<Vec<BackupTargetStatus>, String> {
    let root = PathBuf::from(install_path.trim());
    if !root.is_dir() {
        return Err(format!(
            "Dossier d'installation introuvable : {}",
            root.display()
        ));
    }
    let mut out: Vec<BackupTargetStatus> = TARGETS.iter().map(|t| scan_target(&root, t)).collect();
    out.extend(scan_log_targets(include_game_log, include_log_backups));
    Ok(out)
}

pub fn export_game_config_backup_sync(
    install_path: String,
    dest_zip_path: String,
    include_game_log: bool,
    include_log_backups: bool,
) -> Result<BackupExportResult, String> {
    let root = PathBuf::from(install_path.trim());
    if !root.is_dir() {
        return Err(format!(
            "Dossier d'installation introuvable : {}",
            root.display()
        ));
    }

    let mut files: Vec<(PathBuf, String)> = Vec::new();
    for target in TARGETS {
        collect_files(&root, target, &mut files);
    }
    collect_optional_logs(
        &root,
        include_game_log,
        include_log_backups,
        &mut files,
    );

    if files.is_empty() {
        return Err("Aucun fichier de configuration trouvé à exporter.".to_string());
    }

    let dest = PathBuf::from(dest_zip_path.trim());
    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let file = File::create(&dest).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options =
        SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let mut files_packed = 0u32;
    let mut bytes_packed = 0u64;
    let mut skipped = Vec::new();

    for (src, arc_name) in files {
        let mut buf = Vec::new();
        match File::open(&src).and_then(|mut f| f.read_to_end(&mut buf)) {
            Ok(_) => {
                if zip.start_file(arc_name, options).is_err() {
                    skipped.push(src.display().to_string());
                    continue;
                }
                if zip.write_all(&buf).is_err() {
                    skipped.push(src.display().to_string());
                    continue;
                }
                files_packed += 1;
                bytes_packed += buf.len() as u64;
            }
            Err(_) => skipped.push(src.display().to_string()),
        }
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(BackupExportResult {
        files_packed,
        bytes_packed,
        skipped,
    })
}

#[command]
pub async fn list_game_config_backup_targets(
    install_path: String,
    include_game_log: Option<bool>,
    include_log_backups: Option<bool>,
) -> Result<Vec<BackupTargetStatus>, String> {
    let include_game_log = include_game_log.unwrap_or(true);
    let include_log_backups = include_log_backups.unwrap_or(true);
    tokio::task::spawn_blocking(move || {
        list_game_config_backup_targets_sync(install_path, include_game_log, include_log_backups)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn export_game_config_backup(
    install_path: String,
    dest_zip_path: String,
    include_game_log: Option<bool>,
    include_log_backups: Option<bool>,
) -> Result<BackupExportResult, String> {
    let include_game_log = include_game_log.unwrap_or(true);
    let include_log_backups = include_log_backups.unwrap_or(true);
    tokio::task::spawn_blocking(move || {
        export_game_config_backup_sync(
            install_path,
            dest_zip_path,
            include_game_log,
            include_log_backups,
        )
    })
    .await
    .map_err(|e| e.to_string())?
}
