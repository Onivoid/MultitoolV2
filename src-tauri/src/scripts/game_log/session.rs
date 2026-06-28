use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameSession {
    pub id: String,
    pub start_ts: f64,
    pub end_ts: f64,
    pub source: String,
}

/// Fusionne un intervalle pour une session (garde l'enveloppe la plus large).
pub fn merge_session_interval(
    sessions: &mut HashMap<String, GameSession>,
    id: String,
    start_ts: f64,
    end_ts: f64,
    source: String,
) {
    if end_ts < start_ts {
        return;
    }
    match sessions.get_mut(&id) {
        Some(s) => {
            s.start_ts = s.start_ts.min(start_ts);
            s.end_ts = s.end_ts.max(end_ts);
        }
        None => {
            sessions.insert(
                id.clone(),
                GameSession {
                    id,
                    start_ts,
                    end_ts,
                    source,
                },
            );
        }
    }
}

/// Somme des durées après fusion des intervalles qui se chevauchent (évite le double comptage).
pub fn total_playtime_seconds(sessions: &HashMap<String, GameSession>) -> f64 {
    let mut intervals: Vec<(f64, f64)> = sessions
        .values()
        .map(|s| (s.start_ts, s.end_ts))
        .filter(|(start, end)| end >= start)
        .collect();
    if intervals.is_empty() {
        return 0.0;
    }
    intervals.sort_by(|a, b| {
        a.0.partial_cmp(&b.0)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    let mut total = 0.0;
    let (mut cur_start, mut cur_end) = intervals[0];
    for (start, end) in intervals.into_iter().skip(1) {
        if start <= cur_end {
            cur_end = cur_end.max(end);
        } else {
            total += cur_end - cur_start;
            cur_start = start;
            cur_end = end;
        }
    }
    total += cur_end - cur_start;
    total
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn total_playtime_merges_overlapping_intervals() {
        let mut sessions = HashMap::new();
        merge_session_interval(&mut sessions, "a".into(), 0.0, 3600.0, "a.log".into());
        merge_session_interval(&mut sessions, "b".into(), 1800.0, 5400.0, "b.log".into());
        assert_eq!(total_playtime_seconds(&sessions), 5400.0);
    }

    #[test]
    fn total_playtime_sums_disjoint_intervals() {
        let mut sessions = HashMap::new();
        merge_session_interval(&mut sessions, "a".into(), 0.0, 3600.0, "a.log".into());
        merge_session_interval(&mut sessions, "b".into(), 7200.0, 10_800.0, "b.log".into());
        assert_eq!(total_playtime_seconds(&sessions), 7200.0);
    }
}
