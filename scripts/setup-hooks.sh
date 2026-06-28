#!/usr/bin/env bash
set -e

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/post-commit .githooks/pre-push
chmod +x scripts/pre-commit-checks.sh scripts/pre-push-checks.sh

echo "✓ Git hooks installed (.githooks/)"
