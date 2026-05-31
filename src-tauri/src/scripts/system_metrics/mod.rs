#[cfg(windows)]
mod gpu_adlx;
#[cfg(windows)]
mod gpu_nvml;
#[cfg(windows)]
mod gpu_wmi;

use once_cell::sync::Lazy;
use serde::Serialize;
use std::sync::Mutex;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tauri::command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuMetrics {
    pub name: String,
    pub utilization_percent: f32,
    pub memory_used_bytes: Option<u64>,
    pub memory_total_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemMetricsSnapshot {
    pub cpu_usage_percent: f32,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
    pub gpus: Vec<GpuMetrics>,
}

static SYSTEM: Lazy<Mutex<System>> = Lazy::new(|| {
    Mutex::new(System::new_with_specifics(
        RefreshKind::nothing()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    ))
});

fn collect_cpu_and_memory() -> Result<(f32, u64, u64), String> {
    let mut sys = SYSTEM
        .lock()
        .map_err(|e| format!("Verrou métriques système: {e}"))?;

    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu = sys.global_cpu_usage();
    let used = sys.used_memory();
    let total = sys.total_memory();

    Ok((cpu, used, total))
}

/// Ordre : pilotes constructeur (NVML, ADLX) puis compteurs Windows (WMI).
#[cfg(windows)]
fn collect_gpu_metrics_windows() -> Vec<GpuMetrics> {
    let nvml = gpu_nvml::collect_nvml_gpus();
    if !nvml.is_empty() {
        return nvml;
    }

    let adlx = gpu_adlx::collect_adlx_gpus();
    if !adlx.is_empty() {
        return adlx;
    }

    gpu_wmi::collect_wmi_gpus()
}

#[cfg(not(windows))]
fn collect_gpu_metrics_windows() -> Vec<GpuMetrics> {
    Vec::new()
}

fn pick_primary_gpu(gpus: Vec<GpuMetrics>) -> Vec<GpuMetrics> {
    if gpus.len() <= 1 {
        return gpus;
    }
    gpus.into_iter()
        .max_by(|a, b| {
            a.utilization_percent
                .partial_cmp(&b.utilization_percent)
                .unwrap_or(std::cmp::Ordering::Equal)
        })
        .map(|g| vec![g])
        .unwrap_or_default()
}

pub fn get_system_metrics_inner() -> Result<SystemMetricsSnapshot, String> {
    let (cpu_usage_percent, memory_used_bytes, memory_total_bytes) = collect_cpu_and_memory()?;
    let gpus = pick_primary_gpu(collect_gpu_metrics_windows());

    Ok(SystemMetricsSnapshot {
        cpu_usage_percent,
        memory_used_bytes,
        memory_total_bytes,
        gpus,
    })
}

/// Métriques système (CPU, RAM, GPU) pour le widget accueil.
#[command]
pub fn get_system_metrics() -> Result<SystemMetricsSnapshot, String> {
    get_system_metrics_inner()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(windows)]
    fn live_snapshot_has_memory() {
        let snap = get_system_metrics_inner().expect("métriques");
        assert!(snap.memory_total_bytes > 0);
    }

    #[test]
    #[cfg(windows)]
    fn live_snapshot_has_gpu_when_nvml_present() {
        if nvml_wrapper::Nvml::init().is_err() {
            return;
        }
        let snap = get_system_metrics_inner().expect("métriques");
        assert!(
            !snap.gpus.is_empty(),
            "NVML disponible mais aucune métrique GPU renvoyée"
        );
    }

    #[test]
    fn snapshot_serializes_camel_case() {
        let snap = SystemMetricsSnapshot {
            cpu_usage_percent: 12.5,
            memory_used_bytes: 8_000_000_000,
            memory_total_bytes: 16_000_000_000,
            gpus: vec![GpuMetrics {
                name: "GPU 0".into(),
                utilization_percent: 40.0,
                memory_used_bytes: Some(2_000_000_000),
                memory_total_bytes: Some(8_000_000_000),
            }],
        };
        let json = serde_json::to_string(&snap).unwrap();
        assert!(json.contains("cpuUsagePercent"));
        assert!(json.contains("memoryUsedBytes"));
    }
}
