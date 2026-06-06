//! Métriques GPU NVIDIA via NVML (`nvml.dll` du pilote GeForce/Quadro).

use super::GpuMetrics;
use nvml_wrapper::Nvml;

pub fn collect_nvml_gpus() -> Vec<GpuMetrics> {
    let Ok(nvml) = Nvml::init() else {
        return Vec::new();
    };

    let Ok(count) = nvml.device_count() else {
        return Vec::new();
    };

    let mut gpus = Vec::new();
    for index in 0..count {
        let Ok(device) = nvml.device_by_index(index) else {
            continue;
        };

        let name = device
            .name()
            .unwrap_or_else(|_| format!("NVIDIA GPU {index}"));
        let utilization_percent = device
            .utilization_rates()
            .map(|u| u.gpu as f32)
            .unwrap_or(0.0);

        let (memory_used_bytes, memory_total_bytes) = device
            .memory_info()
            .ok()
            .map_or((None, None), |mem| (Some(mem.used), Some(mem.total)));

        gpus.push(GpuMetrics {
            name,
            utilization_percent,
            memory_used_bytes,
            memory_total_bytes,
        });
    }

    gpus
}
