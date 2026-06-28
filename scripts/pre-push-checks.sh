#!/usr/bin/env bash
# Clippy + tests Rust (plus lent — avant push, pas à chaque commit).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if git rev-parse '@{u}' >/dev/null 2>&1; then
  RANGE='@{u}..HEAD'
else
  echo "▶ pre-push — pas de branche distante, skip checks Rust"
  exit 0
fi

CHANGED="$(git diff --name-only "$RANGE" 2>/dev/null || true)"

if ! echo "$CHANGED" | grep -qE '^src-tauri/'; then
  echo "▶ pre-push — aucun changement src-tauri/, skip checks Rust"
  exit 0
fi

echo "▶ pre-push — clippy + tests Rust…"
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml -- --test-threads=1

echo "✓ pre-push — OK"
