#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
echo "Githooks enabled: core.hooksPath = .githooks"
echo "Requires Git Bash on Windows for pre-commit / post-commit."
echo "Skip bump on a commit: git commit --no-verify"
