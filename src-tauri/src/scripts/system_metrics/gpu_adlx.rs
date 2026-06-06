//! Métriques GPU AMD via ADLX (bibliothèque du pilote Adrenalin).

use super::GpuMetrics;
use adlx::{gpu::Gpu1, helper::AdlxHelper, interface::Interface};

/// `IADLXGPUMetrics::GPUVRAM` est exprimé en mégaoctets.
fn vram_mb_to_bytes(mb: i32) -> Option<u64> {
    if mb <= 0 {
        return None;
    }
    Some((mb as u64).saturating_mul(1024 * 1024))
}

fn adlx_gpu_display_name(g1: &Gpu1, index: u32) -> String {
    if let Ok(name) = g1.name() {
        return name.to_owned();
    }
    if let Ok(name) = g1.product_name() {
        return name.to_owned();
    }
    format!("AMD GPU {index}")
}

pub fn collect_adlx_gpus() -> Vec<GpuMetrics> {
    let Ok(helper) = AdlxHelper::new() else {
        return Vec::new();
    };

    let system = helper.system();
    let Ok(perf) = system.performance_monitoring_services() else {
        return Vec::new();
    };

    let Ok(gpu_list) = system.gpus() else {
        return Vec::new();
    };

    let size = gpu_list.size();
    let mut gpus = Vec::new();

    for index in 0..size {
        let Ok(gpu) = gpu_list.at(index) else {
            continue;
        };

        let Ok(gpu1) = gpu.cast::<Gpu1>() else {
            continue;
        };

        let name = adlx_gpu_display_name(&gpu1, index);

        let Ok(metrics) = perf.current_gpu_metrics(&gpu) else {
            continue;
        };

        let utilization_percent = metrics.usage().ok().map(|u| u as f32).unwrap_or(0.0);
        let memory_used_bytes = metrics.vram().ok().and_then(vram_mb_to_bytes);

        gpus.push(GpuMetrics {
            name,
            utilization_percent,
            memory_used_bytes,
            memory_total_bytes: None,
        });
    }

    gpus
}
