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

pub fn total_playtime_seconds(sessions: &HashMap<String, GameSession>) -> f64 {
    sessions
        .values()
        .map(|s| (s.end_ts - s.start_ts).max(0.0))
        .sum()
}
