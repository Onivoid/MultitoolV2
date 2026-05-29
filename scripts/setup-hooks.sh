#!/usr/bin/env bash
set -e

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/post-commit

echo "✓ Git hooks installed (.githooks/)"
