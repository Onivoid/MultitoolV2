# Active les githooks du projet (bump version + tag automatique)
# Usage: .\scripts\setup-githooks.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    bash scripts/setup-hooks.sh
    Write-Host "Githooks actives: core.hooksPath = .githooks" -ForegroundColor Green
    Write-Host "pre-commit: typecheck, lint, prettier (+ rustfmt si .rs)" -ForegroundColor Gray
    Write-Host "pre-push: clippy + tests si src-tauri/ a change" -ForegroundColor Gray
    Write-Host "Requiert Git Bash (pre-commit / pre-push / post-commit)." -ForegroundColor Yellow
    Write-Host "Branches avec bump : voir scripts/versioning/config.json" -ForegroundColor Gray
    Write-Host "Commit sans checks: git commit --no-verify" -ForegroundColor Gray
    Write-Host "Push sans checks Rust: git push --no-verify" -ForegroundColor Gray
}
finally {
    Pop-Location
}
