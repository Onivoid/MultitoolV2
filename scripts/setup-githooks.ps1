# Active les githooks du projet (bump version + tag automatique)
# Usage: .\scripts\setup-githooks.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    bash scripts/setup-hooks.sh
    Write-Host "Githooks actives: core.hooksPath = .githooks" -ForegroundColor Green
    Write-Host "Requiert Git Bash pour pre-commit / post-commit (canal stable/beta/rc)." -ForegroundColor Yellow
    Write-Host "Branches avec bump : voir scripts/versioning/config.json" -ForegroundColor Gray
    Write-Host "Commit sans bump: git commit --no-verify" -ForegroundColor Gray
}
finally {
    Pop-Location
}
