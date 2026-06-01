use serde::Serialize;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::command;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

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

pub fn list_game_config_backup_targets_sync(
    install_path: String,
) -> Result<Vec<BackupTargetStatus>, String> {
    let root = PathBuf::from(install_path.trim());
    if !root.is_dir() {
        return Err(format!(
            "Dossier d'installation introuvable : {}",
            root.display()
        ));
    }
    Ok(TARGETS.iter().map(|t| scan_target(&root, t)).collect())
}

pub fn export_game_config_backup_sync(
    install_path: String,
    dest_zip_path: String,
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
) -> Result<Vec<BackupTargetStatus>, String> {
    tokio::task::spawn_blocking(move || list_game_config_backup_targets_sync(install_path))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn export_game_config_backup(
    install_path: String,
    dest_zip_path: String,
) -> Result<BackupExportResult, String> {
    tokio::task::spawn_blocking(move || {
        export_game_config_backup_sync(install_path, dest_zip_path)
    })
    .await
    .map_err(|e| e.to_string())?
}
