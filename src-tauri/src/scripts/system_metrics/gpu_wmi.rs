//! Métriques GPU via compteurs WMI Windows (repli si NVML / ADLX indisponibles).
#![cfg(windows)]

use super::GpuMetrics;
use serde::Deserialize;
use std::collections::{HashMap, HashSet};
use wmi::{COMLibrary, WMIConnection};

#[derive(Debug, Deserialize)]
struct GpuEngineRow {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "UtilizationPercentage")]
    utilization_percentage: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct GpuAdapterMemoryRow {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "DedicatedUsage")]
    dedicated_usage: Option<u64>,
    #[serde(rename = "SharedUsage")]
    shared_usage: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct VideoControllerRow {
    #[serde(rename = "Name")]
    name: Option<String>,
    #[serde(rename = "AdapterRAM")]
    adapter_ram: Option<u64>,
}

fn parse_phys_index(name: &str) -> Option<u32> {
    let marker = "_phys_";
    let idx = name.find(marker)? + marker.len();
    let rest = &name[idx..];
    let end = rest.find('_').unwrap_or(rest.len());
    rest[..end].parse().ok()
}

pub fn collect_wmi_gpus() -> Vec<GpuMetrics> {
    let com = match COMLibrary::new() {
        Ok(com) => com,
        Err(_) => return Vec::new(),
    };
    let wmi = match WMIConnection::new(com) {
        Ok(wmi) => wmi,
        Err(_) => return Vec::new(),
    };

    let engines: Vec<GpuEngineRow> = wmi
        .raw_query(
            "SELECT Name, UtilizationPercentage FROM Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine",
        )
        .unwrap_or_default();

    let mut util_by_phys: HashMap<u32, f32> = HashMap::new();
    for row in engines {
        let Some(phys) = parse_phys_index(&row.name) else {
            continue;
        };
        let util = row.utilization_percentage.unwrap_or(0) as f32;
        util_by_phys
            .entry(phys)
            .and_modify(|max| *max = max.max(util))
            .or_insert(util);
    }

    let memories: Vec<GpuAdapterMemoryRow> = wmi
        .raw_query(
            "SELECT Name, DedicatedUsage, SharedUsage FROM Win32_PerfFormattedData_GPUPerformanceCounters_GPUAdapterMemory",
        )
        .unwrap_or_default();

    let mut mem_by_phys: HashMap<u32, u64> = HashMap::new();
    for row in memories {
        let Some(phys) = parse_phys_index(&row.name) else {
            continue;
        };
        let dedicated = row.dedicated_usage.unwrap_or(0);
        let shared = row.shared_usage.unwrap_or(0);
        mem_by_phys.insert(phys, dedicated.saturating_add(shared));
    }

    let adapters: Vec<VideoControllerRow> = wmi
        .raw_query("SELECT Name, AdapterRAM FROM Win32_VideoController")
        .unwrap_or_default();

    let adapter_info: Vec<(String, u64)> = adapters
        .into_iter()
        .filter_map(|a| {
            let name = a.name.unwrap_or_default();
            let ram = a.adapter_ram?;
            if ram == 0 || name.to_lowercase().contains("virtual") {
                return None;
            }
            Some((name, ram))
        })
        .collect();

    if util_by_phys.is_empty() && mem_by_phys.is_empty() {
        return Vec::new();
    }

    let mut phys_ids: Vec<u32> = util_by_phys
        .keys()
        .chain(mem_by_phys.keys())
        .copied()
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    phys_ids.sort_unstable();

    phys_ids
        .into_iter()
        .enumerate()
        .map(|(index, phys)| {
            let utilization_percent = util_by_phys.get(&phys).copied().unwrap_or(0.0);
            let used_total = mem_by_phys.get(&phys).copied().unwrap_or(0);
            let memory_used_bytes = if used_total > 0 {
                Some(used_total)
            } else {
                None
            };
            let (display_name, memory_total_bytes) = adapter_info
                .get(index)
                .map(|(n, ram)| (n.clone(), Some(*ram)))
                .unwrap_or_else(|| (format!("GPU {index}"), None));

            GpuMetrics {
                name: display_name,
                utilization_percent,
                memory_used_bytes,
                memory_total_bytes,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::parse_phys_index;

    #[test]
    fn parse_phys_index_extracts_number() {
        assert_eq!(
            parse_phys_index("pid_1_luid_0_phys_2_eng_0_engtype_3D"),
            Some(2)
        );
        assert_eq!(
            parse_phys_index("luid_0x00000000_0x00012976_phys_0"),
            Some(0)
        );
    }
}
