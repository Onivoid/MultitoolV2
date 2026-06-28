#!/usr/bin/env bash
# Vérifications alignées sur la CI frontend + rustfmt (rapide).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STAGED="$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)"

echo "▶ pre-commit — contrôles qualité…"

if echo "$STAGED" | grep -qE '^src-tauri/.*\.rs$'; then
  echo "  • cargo fmt --check (fichiers .rs indexés)"
  cargo fmt --check --manifest-path src-tauri/Cargo.toml
fi

if echo "$STAGED" | grep -qE '\.(ts|tsx|js|jsx|json|md|css)$'; then
  echo "  • pnpm typecheck"
  pnpm typecheck
  echo "  • pnpm lint"
  pnpm lint
  echo "  • pnpm format:check"
  pnpm format:check
elif echo "$STAGED" | grep -qE '^src-tauri/.*\.rs$'; then
  : # Rust seul : fmt déjà fait
else
  echo "  • (aucun fichier TS/TSX/JSON/MD indexé — checks frontend ignorés)"
fi

echo "✓ pre-commit — OK"
