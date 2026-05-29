#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
bash scripts/setup-hooks.sh
echo "Requires Git Bash on Windows for pre-commit / post-commit."
echo "Skip bump on a commit: git commit --no-verify"
