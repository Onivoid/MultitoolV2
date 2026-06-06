use crate::scripts::game_log::extractors::{FileContext, GameLogStatExtractor, LineContext};
use crate::scripts::game_log::patterns::{
    normalize_shop_display_name, parse_shop_buy_request, parse_shop_buy_response,
};
use crate::scripts::game_log::snapshot::{
    GameStatsSnapshot, GameStatsSpending, GameStatsSpendingDay, GameStatsSpendingShop,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet, VecDeque};
use std::path::Path;

const TOP_SHOPS: usize = 12;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PurchaseRecord {
    shop: String,
    item: String,
    price: f64,
    qty: u32,
    ts: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PendingRequest {
    shop_name: String,
    price: f64,
    qty: u32,
    item: String,
    ts: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct SpendingCacheState {
    purchases: Vec<PurchaseRecord>,
    seen_keys: HashSet<String>,
}

#[derive(Default)]
pub struct SpendingExtractor {
    purchases: Vec<PurchaseRecord>,
    seen_keys: HashSet<String>,
    pending: HashMap<(String, String), VecDeque<PendingRequest>>,
}

impl SpendingExtractor {
    pub fn new() -> Self {
        Self::default()
    }

    fn purchase_dedup_key(
        shop_id: &str,
        kiosk_id: &str,
        ts: f64,
        item: &str,
        price: f64,
        qty: u32,
    ) -> String {
        format!("{shop_id}:{kiosk_id}:{ts:.3}:{item}:{price}:{qty}")
    }
}

impl GameLogStatExtractor for SpendingExtractor {
    fn id(&self) -> &'static str {
        "spending"
    }

    fn reset(&mut self) {
        self.purchases.clear();
        self.seen_keys.clear();
        self.pending.clear();
    }

    fn on_line(&mut self, line: &str, ctx: &LineContext) {
        if let Some(req) = parse_shop_buy_request(line) {
            let key = (req.shop_id.clone(), req.kiosk_id.clone());
            self.pending
                .entry(key)
                .or_default()
                .push_back(PendingRequest {
                    shop_name: req.shop_name,
                    price: req.price,
                    qty: req.qty,
                    item: req.item,
                    ts: req.ts,
                });
            return;
        }

        if let Some(resp) = parse_shop_buy_response(line) {
            if !resp.success || !resp.is_buying {
                return;
            }
            let key = (resp.shop_id.clone(), resp.kiosk_id.clone());
            let Some(queue) = self.pending.get_mut(&key) else {
                return;
            };
            let Some(pending) = queue.pop_front() else {
                return;
            };
            let shop = if resp.shop_name.is_empty() {
                pending.shop_name
            } else {
                resp.shop_name
            };
            let dedup = Self::purchase_dedup_key(
                &resp.shop_id,
                &resp.kiosk_id,
                pending.ts,
                &pending.item,
                pending.price,
                pending.qty,
            );
            if !self.seen_keys.insert(dedup) {
                return;
            }
            self.purchases.push(PurchaseRecord {
                shop,
                item: pending.item,
                price: pending.price,
                qty: pending.qty,
                ts: pending.ts,
            });
            let _ = ctx;
        }
    }

    fn on_file_end(&mut self, _path: &Path, _ctx: &FileContext) {}

    fn contribute(&self, out: &mut GameStatsSnapshot) {
        let mut total_spent = 0.0;
        let purchase_count = self.purchases.len() as u32;
        let mut per_day: HashMap<String, f64> = HashMap::new();
        let mut per_shop: HashMap<String, (f64, u32)> = HashMap::new();

        for p in &self.purchases {
            let spent = p.price * f64::from(p.qty);
            total_spent += spent;
            let day = chrono::DateTime::from_timestamp(p.ts as i64, 0)
                .map(|dt| dt.format("%Y-%m-%d").to_string())
                .unwrap_or_default();
            if !day.is_empty() {
                *per_day.entry(day).or_insert(0.0) += spent;
            }
            let shop_key = normalize_shop_display_name(&p.shop);
            let entry = per_shop.entry(shop_key).or_insert((0.0, 0));
            entry.0 += spent;
            entry.1 += 1;
        }

        let mut days: Vec<(String, f64)> = per_day.into_iter().collect();
        days.sort_by(|a, b| a.0.cmp(&b.0));
        let mut cumulative = 0.0;
        let by_day: Vec<GameStatsSpendingDay> = days
            .into_iter()
            .map(|(date, spent)| {
                cumulative += spent;
                GameStatsSpendingDay {
                    date,
                    spent,
                    cumulative,
                }
            })
            .collect();

        let mut shops: Vec<(String, f64, u32)> = per_shop
            .into_iter()
            .map(|(shop, (total, count))| (shop, total, count))
            .collect();
        shops.sort_by(|a, b| {
            b.1.partial_cmp(&a.1)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.0.cmp(&b.0))
        });
        let by_shop: Vec<GameStatsSpendingShop> = shops
            .into_iter()
            .take(TOP_SHOPS)
            .map(
                |(shop, total_spent, purchase_count)| GameStatsSpendingShop {
                    shop,
                    total_spent,
                    purchase_count,
                },
            )
            .collect();

        out.spending = GameStatsSpending {
            total_spent,
            purchase_count,
            by_day,
            by_shop,
        };
    }

    fn merge_cached(&mut self, cached: &Value) {
        if let Ok(state) = serde_json::from_value::<SpendingCacheState>(cached.clone()) {
            self.purchases = state.purchases;
            self.seen_keys = state.seen_keys;
        }
    }

    fn export_cache(&self) -> Value {
        serde_json::to_value(SpendingCacheState {
            purchases: self.purchases.clone(),
            seen_keys: self.seen_keys.clone(),
        })
        .unwrap_or(Value::Null)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scripts::game_log::extractors::{FileContext, LineContext};

    fn line_ctx() -> LineContext {
        LineContext {
            file_path: "test.log".to_string(),
            is_game_build: false,
            line_ts: None,
        }
    }

    fn file_ctx() -> FileContext {
        FileContext {
            file_path: "test.log".to_string(),
            is_game_build: false,
        }
    }

    #[test]
    fn spending_pairs_request_and_response() {
        let mut ext = SpendingExtractor::new();
        let req = r#"<2026-01-15T10:00:00.000Z> SendShopBuyRequest shopId[1] shopName[Test Shop] kioskId[2] client_price[100] itemName[Widget] quantity[2]"#;
        let resp = r#"<2026-01-15T10:00:01.000Z> RmShopFlowResponse shopId[1] shopName[Test Shop] kioskId[2] result[Success] type[Buying]"#;
        ext.on_line(req, &line_ctx());
        ext.on_line(resp, &line_ctx());
        ext.on_file_end(Path::new("test.log"), &file_ctx());
        let mut snap = GameStatsSnapshot::default();
        ext.contribute(&mut snap);
        assert_eq!(snap.spending.purchase_count, 1);
        assert!((snap.spending.total_spent - 200.0).abs() < 0.01);
    }

    #[test]
    fn spending_dedup_on_resync() {
        let mut ext = SpendingExtractor::new();
        let req = r#"<2026-01-15T10:00:00.000Z> SendShopBuyRequest shopId[1] shopName[Shop] kioskId[2] client_price[50] itemName[A] quantity[1]"#;
        let resp = r#"<2026-01-15T10:00:01.000Z> RmShopFlowResponse shopId[1] shopName[Shop] kioskId[2] result[Success] type[Buying]"#;
        ext.on_line(req, &line_ctx());
        ext.on_line(resp, &line_ctx());
        ext.on_line(req, &line_ctx());
        ext.on_line(resp, &line_ctx());
        let mut snap = GameStatsSnapshot::default();
        ext.contribute(&mut snap);
        assert_eq!(snap.spending.purchase_count, 1);
    }
}
