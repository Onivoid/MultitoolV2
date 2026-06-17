use crate::scripts::game_log::cache::{FileScanState, GameStatsCacheFile};
use crate::scripts::game_log::catalog::{list_game_log_files, GameLogFile};
use crate::scripts::game_log::extractors::{
    default_extractors, FileContext, GameLogStatExtractor, LineContext,
};
use crate::scripts::game_log::io::{read_from_offset, read_log_file_lossy};
use crate::scripts::game_log::parse::parse_log_timestamp;
use crate::scripts::game_log::progress::{file_basename, GameStatsScanProgress};
use crate::scripts::game_log::scan_state::GameStatsScanState;
use crate::scripts::game_log::snapshot::GameStatsSnapshot;
use std::path::Path;
use tauri::path::PathResolver;
use tauri::{AppHandle, Runtime};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScanMode {
    Full,
    Incremental,
}

fn path_key(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn should_scan_file(
    file: &GameLogFile,
    file_state: &std::collections::HashMap<String, FileScanState>,
    mode: ScanMode,
) -> bool {
    if mode == ScanMode::Full {
        return true;
    }
    let key = path_key(&file.path);
    match file_state.get(&key) {
        None => true,
        Some(prev) => prev.mtime_ms != file.mtime_ms || prev.size != file.size,
    }
}

fn process_lines(
    extractors: &mut [Box<dyn GameLogStatExtractor>],
    content: &str,
    file: &GameLogFile,
) {
    for line in content.lines() {
        if line.is_empty() {
            continue;
        }
        let line_ts = parse_log_timestamp(line);
        let ctx = LineContext {
            file_path: path_key(&file.path),
            is_game_build: file.is_game_build,
            line_ts,
        };
        for ext in extractors.iter_mut() {
            ext.on_line(line, &ctx);
        }
    }
}

fn scan_file(
    extractors: &mut [Box<dyn GameLogStatExtractor>],
    file: &GameLogFile,
    file_state: &mut std::collections::HashMap<String, FileScanState>,
    mode: ScanMode,
) -> Result<(), String> {
    let key = path_key(&file.path);
    let prev = file_state.get(&key).cloned();
    let mut start_offset = match mode {
        ScanMode::Full => 0,
        ScanMode::Incremental => prev.as_ref().map(|p| p.last_processed_offset).unwrap_or(0),
    };

    if let Some(p) = &prev {
        if file.size < p.last_processed_offset {
            start_offset = 0;
        }
    }

    let raw_content = if start_offset > 0 {
        read_from_offset(&file.path, start_offset)?
    } else {
        read_log_file_lossy(&file.path)?
    };

    if raw_content.is_empty() && start_offset > 0 {
        file_state.insert(
            key.clone(),
            FileScanState {
                mtime_ms: file.mtime_ms,
                size: file.size,
                last_processed_offset: file.size,
                last_processed_ts: prev.as_ref().map(|p| p.last_processed_ts).unwrap_or(0.0),
            },
        );
        return Ok(());
    }

    let content = if start_offset > 0 {
        raw_content
            .find('\n')
            .map(|i| &raw_content[i + 1..])
            .unwrap_or("")
            .to_string()
    } else {
        raw_content
    };

    if content.is_empty() {
        return Ok(());
    }

    process_lines(extractors, &content, file);

    let file_ctx = FileContext {
        file_path: key.clone(),
        is_game_build: file.is_game_build,
    };
    for ext in extractors.iter_mut() {
        ext.on_file_end(&file.path, &file_ctx);
    }

    let last_ts = content.lines().filter_map(parse_log_timestamp).fold(
        prev.as_ref().map(|p| p.last_processed_ts).unwrap_or(0.0),
        f64::max,
    );

    file_state.insert(
        key,
        FileScanState {
            mtime_ms: file.mtime_ms,
            size: file.size,
            last_processed_offset: file.size,
            last_processed_ts: last_ts,
        },
    );

    Ok(())
}

fn build_snapshot(extractors: &[Box<dyn GameLogStatExtractor>]) -> GameStatsSnapshot {
    let mut snapshot = GameStatsSnapshot {
        computed_at: chrono::Utc::now().timestamp(),
        ..GameStatsSnapshot::default()
    };
    for ext in extractors {
        ext.contribute(&mut snapshot);
    }
    snapshot
}

fn scan_percent(files_done: u32, files_total: u32) -> u8 {
    if files_total == 0 {
        return 90;
    }
    (5 + (files_done.saturating_mul(85) / files_total)).min(90) as u8
}

pub fn run_scan(
    path_resolver: &PathResolver<impl Runtime>,
    mode: ScanMode,
    app: Option<AppHandle>,
    scan_state: Option<&GameStatsScanState>,
) -> Result<GameStatsSnapshot, String> {
    GameStatsScanProgress::emit(
        app.as_ref(),
        scan_state,
        GameStatsScanProgress {
            phase: "discovering_logs".to_string(),
            files_done: 0,
            files_total: 0,
            current_file: None,
            percent: 2,
        },
    );

    let files = match &app {
        Some(handle) => list_game_log_files(handle)?,
        None => return Err("AppHandle requis pour lister les logs de jeu".to_string()),
    };
    let files_total = files.len() as u32;

    GameStatsScanProgress::emit(
        app.as_ref(),
        scan_state,
        GameStatsScanProgress {
            phase: "scanning_logs".to_string(),
            files_done: 0,
            files_total,
            current_file: None,
            percent: 5,
        },
    );
    let mut cache = match super::cache::load_cache(path_resolver)? {
        Some(c) if mode == ScanMode::Incremental => c,
        _ => GameStatsCacheFile::default(),
    };

    let mut extractors = default_extractors();

    if mode == ScanMode::Full {
        for ext in extractors.iter_mut() {
            ext.reset();
        }
        cache.file_state.clear();
        cache.extractor_state.clear();
    } else {
        for ext in extractors.iter_mut() {
            if let Some(state) = cache.extractor_state.get(ext.id()) {
                ext.merge_cached(state);
            }
        }
    }

    for (index, file) in files.iter().enumerate() {
        let files_done = index as u32;
        GameStatsScanProgress::emit(
            app.as_ref(),
            scan_state,
            GameStatsScanProgress {
                phase: "scanning_logs".to_string(),
                files_done,
                files_total,
                current_file: file_basename(&file.path),
                percent: scan_percent(files_done, files_total),
            },
        );

        if should_scan_file(file, &cache.file_state, mode) {
            scan_file(&mut extractors, file, &mut cache.file_state, mode)?;
        }

        GameStatsScanProgress::emit(
            app.as_ref(),
            scan_state,
            GameStatsScanProgress {
                phase: "scanning_logs".to_string(),
                files_done: files_done + 1,
                files_total,
                current_file: None,
                percent: scan_percent(files_done + 1, files_total),
            },
        );
    }

    cache.last_scanned_newest_mtime_ms = files.iter().map(|f| f.mtime_ms).max().unwrap_or(0);

    for ext in &extractors {
        cache
            .extractor_state
            .insert(ext.id().to_string(), ext.export_cache());
    }

    GameStatsScanProgress::emit(
        app.as_ref(),
        scan_state,
        GameStatsScanProgress {
            phase: "building_snapshot".to_string(),
            files_done: files_total,
            files_total,
            current_file: None,
            percent: 92,
        },
    );

    cache.snapshot = build_snapshot(&extractors);

    GameStatsScanProgress::emit(
        app.as_ref(),
        scan_state,
        GameStatsScanProgress {
            phase: "saving_cache".to_string(),
            files_done: files_total,
            files_total,
            current_file: None,
            percent: 97,
        },
    );

    super::cache::save_cache(path_resolver, &cache)?;

    GameStatsScanProgress::emit(
        app.as_ref(),
        scan_state,
        GameStatsScanProgress {
            phase: "done".to_string(),
            files_done: files_total,
            files_total,
            current_file: None,
            percent: 100,
        },
    );

    Ok(cache.snapshot)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scripts::game_log::extractors::{
        blueprints::BlueprintsExtractor, missions::MissionsExtractor, playtime::PlaytimeExtractor,
        star_systems::StarSystemsExtractor, vehicles::VehiclesExtractor,
    };
    use std::path::Path;

    #[test]
    fn playtime_fixture_session_duration() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../Game Build(11715810) 03 May 26 (11 44 39).log");
        if !path.exists() {
            eprintln!("skip: game build fixture not present");
            return;
        }

        let content = read_log_file_lossy(&path).expect("read fixture");
        let mut extractor = PlaytimeExtractor::new();
        for line in content.lines() {
            if line.is_empty() {
                continue;
            }
            let ctx = LineContext {
                file_path: path.display().to_string(),
                is_game_build: true,
                line_ts: parse_log_timestamp(line),
            };
            extractor.on_line(line, &ctx);
        }
        extractor.on_file_end(
            &path,
            &FileContext {
                file_path: path.display().to_string(),
                is_game_build: true,
            },
        );

        let mut snapshot = GameStatsSnapshot::default();
        extractor.contribute(&mut snapshot);

        assert!(
            snapshot.playtime.total_seconds > 20_000.0,
            "expected ~7h playtime, got {}s",
            snapshot.playtime.total_seconds
        );
        assert_eq!(snapshot.playtime.session_count, 1);
    }

    #[test]
    fn home_stats_extractors_on_synthetic_lines() {
        let lines = [
            r#"<2026-05-30T10:00:00.000Z> [Notice] <EndMission> MissionId[m1] CompletionType[Complete] Reason[Mission Ended]"#,
            r#"<2026-05-30T10:01:00.000Z> [Notice] <EndMission> MissionId[m2] CompletionType[Abandon] Reason[Player left]"#,
            r#"Added notification "Schémas reçu : Torse Artimex: ""#,
            "CVehicleMovementBase::ClearDriver releasing control token for 'ANVL_Lightning_F8C_999'",
            "CVehicleMovementBase::ClearDriver releasing control token for 'ANVL_Lightning_F8C_888'",
            "Loading socpak /pu/system/pyro/pyro2.socpak",
            "zone [pyro2 - Class(OrbitingObjectContainer)",
        ];

        let path = Path::new("synthetic.log");
        let file_ctx = FileContext {
            file_path: path.display().to_string(),
            is_game_build: false,
        };

        let mut missions = MissionsExtractor::new();
        let mut blueprints = BlueprintsExtractor::new();
        let mut vehicles = VehiclesExtractor::new();
        let mut systems = StarSystemsExtractor::new();

        for line in lines {
            let ctx = LineContext {
                file_path: path.display().to_string(),
                is_game_build: false,
                line_ts: parse_log_timestamp(line),
            };
            missions.on_line(line, &ctx);
            blueprints.on_line(line, &ctx);
            vehicles.on_line(line, &ctx);
            systems.on_line(line, &ctx);
        }

        missions.on_file_end(path, &file_ctx);
        blueprints.on_file_end(path, &file_ctx);
        vehicles.on_file_end(path, &file_ctx);
        systems.on_file_end(path, &file_ctx);

        let mut snapshot = GameStatsSnapshot::default();
        missions.contribute(&mut snapshot);
        blueprints.contribute(&mut snapshot);
        vehicles.contribute(&mut snapshot);
        systems.contribute(&mut snapshot);

        assert_eq!(snapshot.missions.completed, 1);
        assert_eq!(snapshot.missions.abandoned, 1);
        assert_eq!(snapshot.blueprints.total_unlocked, 1);
        assert_eq!(
            snapshot.vehicles.favorite.as_deref(),
            Some("ANVL_Lightning_F8C")
        );
        assert_eq!(snapshot.vehicles.favorite_count, 2);
        assert_eq!(snapshot.star_systems.favorite.as_deref(), Some("Pyro"));
        assert_eq!(snapshot.star_systems.favorite_count, 1);
    }
}
