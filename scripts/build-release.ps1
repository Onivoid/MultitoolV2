# Script de build release pour MultitoolV2
# Usage: .\scripts\build-release.ps1 [-Type standard|portable|msix|all|public] [-Clean]
# public = standard + portable (pour GitHub releases publiques, sans Microsoft Store)

param(
    [Parameter(Position = 0)]
    [ValidateSet("standard", "portable", "msix", "all", "public")]
    [string]$Type = "standard",
    
    [switch]$Clean,
    [switch]$GenerateChecksums = $true
)

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "MultitoolV2 - Script de Build Release" -ForegroundColor Green
Write-Host "========================================"

# Verification prerequis
Write-Host "Verification des prerequis..." -ForegroundColor Yellow

# Verifier Node.js et pnpm
try {
    $nodeVersion = node --version
    $pnpmVersion = pnpm --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "pnpm: $pnpmVersion" -ForegroundColor Green
}
catch {
    Write-Error "Node.js ou pnpm non trouve. Installez Node.js et pnpm d'abord."
    exit 1
}

# Verifier Rust et Cargo
try {
    $rustVersion = rustc --version
    $cargoVersion = cargo --version
    Write-Host "Rust: $rustVersion" -ForegroundColor Green
    Write-Host "Cargo: $cargoVersion" -ForegroundColor Green
}
catch {
    Write-Error "Rust non trouve. Installez Rust d'abord"
    exit 1
}

# Verifier Tauri CLI
try {
    $tauriVersion = pnpm tauri --version
    Write-Host "Tauri CLI: $tauriVersion" -ForegroundColor Green
}
catch {
    Write-Host "Tauri CLI non trouve, installation..." -ForegroundColor Yellow
    pnpm add -D @tauri-apps/cli
}

# Verifier WiX Toolset pour la generation MSI (Windows)
if ($env:OS -match "Windows") {
    try {
        $wixVersion = wix --version
        Write-Host "WiX: $wixVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "WiX non trouve, tentative d'installation via dotnet tool..." -ForegroundColor Yellow
        try {
            dotnet tool install --global wix --version 4.* | Out-Null
            # Ajouter le dossier des outils dotnet au PATH pour la session courante si besoin
            $dotnetTools = Join-Path $env:USERPROFILE ".dotnet\tools"
            if (Test-Path $dotnetTools) {
                $env:PATH = "$dotnetTools;$env:PATH"
            }
            $wixVersion = wix --version
            Write-Host "WiX installe: $wixVersion" -ForegroundColor Green
        }
        catch {
            Write-Error "Echec de l'installation de WiX. Assurez-vous que .NET SDK est installe et reessayez."
            exit 1
        }
    }
}

# Clean si demande
if ($Clean) {
    Write-Host "Nettoyage des builds precedents..." -ForegroundColor Yellow
    if (Test-Path "src-tauri/target") {
        Remove-Item "src-tauri/target" -Recurse -Force
        Write-Host "Dossier target nettoye" -ForegroundColor Green
    }
    if (Test-Path "dist") {
        Remove-Item "dist" -Recurse -Force
        Write-Host "Dossier dist nettoye" -ForegroundColor Green
    }
}

# Installation des dependances
Write-Host "Installation des dependances..." -ForegroundColor Yellow
pnpm install

# Fonction de build
function Build-Version {
    param(
        [string]$BuildType,
        [string]$ConfigFile = "",
        [hashtable]$EnvVars = @{}
    )
    
    Write-Host "Build $BuildType..." -ForegroundColor Cyan
    
    # Definir les variables d'environnement
    foreach ($var in $EnvVars.GetEnumerator()) {
        Set-Item "env:$($var.Key)" $var.Value
        Write-Host "   $($var.Key) = $($var.Value)" -ForegroundColor DarkGray
    }
    
    try {
        $buildCmd = "pnpm tauri build --target x86_64-pc-windows-msvc"
        if ($ConfigFile) {
            $buildCmd += " --config $ConfigFile"
        }
        
        Write-Host "   Commande: $buildCmd" -ForegroundColor DarkGray
        
        # Executer la commande directement avec Invoke-Expression
        if ($ConfigFile) {
            $fullCmd = "pnpm tauri build --target x86_64-pc-windows-msvc --config `"$ConfigFile`""
        }
        else {
            $fullCmd = "pnpm tauri build --target x86_64-pc-windows-msvc"
        }
        
        Write-Host "   Execution: $fullCmd" -ForegroundColor DarkGray
        $exitCode = 0
        try {
            Invoke-Expression $fullCmd
            if ($LASTEXITCODE -ne 0) {
                $exitCode = $LASTEXITCODE
            }
        }
        catch {
            $exitCode = 1
        }
        
        if ($exitCode -eq 0) {
            Write-Host "Build $BuildType termine avec succes" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "Build $BuildType echoue avec le code $exitCode" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Erreur lors du build $BuildType : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        # Nettoyage des variables d'environnement
        foreach ($var in $EnvVars.Keys) {
            Remove-Item "env:$var" -ErrorAction SilentlyContinue
        }
    }
}

# Builds selon le type demande
$builds = @()
$bundlePath = "src-tauri/target/x86_64-pc-windows-msvc/release/bundle"

switch ($Type) {
    "standard" {
        # Utiliser les variables d'environnement existantes ou fallback
        $distribution = if ($env:TAURI_ENV_DISTRIBUTION) { $env:TAURI_ENV_DISTRIBUTION } else { "github" }
        $envVars = @{
            "TAURI_ENV_DISTRIBUTION" = $distribution
        }
        # S'assurer que MS_STORE et PORTABLE sont désactivés
        if ($env:TAURI_ENV_MS_STORE) { $envVars["TAURI_ENV_MS_STORE"] = $null }
        if ($env:TAURI_ENV_PORTABLE) { $envVars["TAURI_ENV_PORTABLE"] = $null }
        
        $success = Build-Version -BuildType "Standard (Non-signe)" -EnvVars $envVars
        if ($success) { $builds += "standard" }
    }
    
    "portable" {
        # Utiliser les variables d'environnement existantes ou fallback
        $distribution = if ($env:TAURI_ENV_DISTRIBUTION) { $env:TAURI_ENV_DISTRIBUTION } else { "github" }
        $portable = if ($env:TAURI_ENV_PORTABLE) { $env:TAURI_ENV_PORTABLE } else { "true" }
        $envVars = @{
            "TAURI_ENV_PORTABLE"     = $portable
            "TAURI_ENV_DISTRIBUTION" = $distribution
        }
        # S'assurer que MS_STORE est désactivé
        if ($env:TAURI_ENV_MS_STORE) { $envVars["TAURI_ENV_MS_STORE"] = $null }
        
        $success = Build-Version -BuildType "Portable" -ConfigFile "src-tauri/tauri.portable.conf.json" -EnvVars $envVars
        if ($success) { $builds += "portable" }
    }
    
    "msix" {
        # Utiliser les variables d'environnement existantes ou fallback
        $msStore = if ($env:TAURI_ENV_MS_STORE) { $env:TAURI_ENV_MS_STORE } else { "true" }
        $envVars = @{
            "TAURI_ENV_MS_STORE" = $msStore
        }
        # S'assurer que PORTABLE et DISTRIBUTION sont désactivés pour MS Store
        if ($env:TAURI_ENV_PORTABLE) { $envVars["TAURI_ENV_PORTABLE"] = $null }
        if ($env:TAURI_ENV_DISTRIBUTION) { $envVars["TAURI_ENV_DISTRIBUTION"] = $null }
        
        $success = Build-Version -BuildType "MSIX (Microsoft Store)" -ConfigFile "src-tauri/tauri.microsoftstore.conf.json" -EnvVars $envVars
        if ($success) { $builds += "msix" }
    }
    
    "all" {
        Write-Host "Build de toutes les versions..." -ForegroundColor Magenta
        
        # Standard
        $success1 = Build-Version -BuildType "Standard" -EnvVars @{ 
            "TAURI_ENV_DISTRIBUTION" = "github" 
        }
        if ($success1) { $builds += "standard" }
        
        # Portable
        $success2 = Build-Version -BuildType "Portable" -ConfigFile "src-tauri/tauri.portable.conf.json" -EnvVars @{
            "TAURI_ENV_PORTABLE"     = "true"
            "TAURI_ENV_DISTRIBUTION" = "github"
        }
        if ($success2) { $builds += "portable" }
        
        # MSIX
        $success3 = Build-Version -BuildType "MSIX" -ConfigFile "src-tauri/tauri.microsoftstore.conf.json" -EnvVars @{
            "TAURI_ENV_MS_STORE" = "true"
        }
        if ($success3) { $builds += "msix" }
    }
    
    "public" {
        Write-Host "Build des versions publiques (Standard + Portable - sans Microsoft Store)..." -ForegroundColor Magenta
        
        # Standard
        $success1 = Build-Version -BuildType "Standard" -EnvVars @{ 
            "TAURI_ENV_DISTRIBUTION" = "github" 
        }
        if ($success1) { $builds += "standard" }
        
        # Portable
        $success2 = Build-Version -BuildType "Portable" -ConfigFile "src-tauri/tauri.portable.conf.json" -EnvVars @{
            "TAURI_ENV_PORTABLE"     = "true"
            "TAURI_ENV_DISTRIBUTION" = "github"
        }
        if ($success2) { $builds += "portable" }
        
        Write-Host "Builds publiques termines (Microsoft Store exclu)" -ForegroundColor Green
    }
}

# Generation des checksums
if ($GenerateChecksums -and $builds.Count -gt 0) {
    Write-Host "Generation des checksums SHA256..." -ForegroundColor Yellow
    
    if (Test-Path $bundlePath) {
        Push-Location $bundlePath
        
        $checksumFile = "checksums.txt"
        if (Test-Path $checksumFile) {
            Remove-Item $checksumFile
        }
        
        $files = @()
        $files += Get-ChildItem -Path "msi\*.msi" -ErrorAction SilentlyContinue
        $files += Get-ChildItem -Path "nsis\*.exe" -ErrorAction SilentlyContinue  
        $files += Get-ChildItem -Path "*.zip" -ErrorAction SilentlyContinue
        $files += Get-ChildItem -Path "*.msix" -ErrorAction SilentlyContinue
        
        if ($files.Count -gt 0) {
            foreach ($file in $files) {
                $hash = Get-FileHash $file.FullName -Algorithm SHA256
                $line = "$($hash.Hash.ToLower())  $($file.Name)"
                Add-Content -Path $checksumFile -Value $line
                Write-Host "   $line" -ForegroundColor DarkGray
            }
            Write-Host "Checksums sauvegardes dans $bundlePath\$checksumFile" -ForegroundColor Green
        }
        else {
            Write-Host "Aucun fichier trouve pour les checksums" -ForegroundColor Yellow
        }
        
        Pop-Location
    }
}

# Rapport final
Write-Host ""
Write-Host "Build termine !" -ForegroundColor Green
Write-Host "=================="

if ($builds.Count -gt 0) {
    Write-Host "Builds reussis: $($builds -join ', ')" -ForegroundColor Green
    
    # Organisation des builds dans le dossier builds/
    Write-Host ""
    Write-Host "Organisation des builds..." -ForegroundColor Cyan
    
    # Créer la structure de dossiers
    $buildsDir = "builds"
    $portableDir = "$buildsDir/portable"
    $installerDir = "$buildsDir/installer" 
    $msStoreDir = "$buildsDir/MicrosoftStoreMSI"
    
    # Créer les dossiers s'ils n'existent pas
    @($buildsDir, $portableDir, $installerDir, $msStoreDir) | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
    
    # Copier les artifacts
    $exePath = "src-tauri/target/x86_64-pc-windows-msvc/release/sandbox.exe"
    $msiPath = "src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi"
    $checksumPath = "src-tauri/target/x86_64-pc-windows-msvc/release/bundle/checksums.txt"
    
    # 1. EXE Portable
    if (Test-Path $exePath) {
        Copy-Item $exePath "$portableDir/MultitoolV2-Portable.exe" -Force
        Write-Host "   Portable: MultitoolV2-Portable.exe" -ForegroundColor Green
    }
    
    # 2. MSI Installer(s)
    if (Test-Path $msiPath) {
        $msiStoreFound = $false
        $msiStandardFound = $false
        
        Get-ChildItem "$msiPath/*.msi" | ForEach-Object {
            Write-Host "   Analysing MSI: $($_.Name)" -ForegroundColor Cyan
            
            if ($_.Name -like "*MultitoolV2-Portable*") {
                # MSI Portable (ignoré - on utilise l'EXE portable)
                Write-Host "   • MSI Portable ignoré (utilisation de l'EXE portable)" -ForegroundColor Yellow
            }
            elseif (-not $msiStandardFound -and ($_.Name -match '^Multitool_.*\.msi$')) {
                # MSI Standard  
                Copy-Item $_.FullName "$installerDir/MultitoolV2-Installer.msi" -Force
                Write-Host "   • Installer MSI: MultitoolV2-Installer.msi" -ForegroundColor Green
                $msiStandardFound = $true
            }
            elseif (($builds -contains "msix") -and -not $msiStoreFound -and ($_.Name -match '^MultitoolV2_.*\.msi$')) {
                # MSI Microsoft Store (seulement si build MSIX demandé)
                Copy-Item $_.FullName "$msStoreDir/MultitoolV2-MicrosoftStore.msi" -Force
                Write-Host "   • Microsoft Store MSI: MultitoolV2-MicrosoftStore.msi" -ForegroundColor Green
                $msiStoreFound = $true
            }
            else {
                Write-Host "   • MSI ignoré: $($_.Name)" -ForegroundColor Gray
            }
        }
    }
    
    # 3. Checksums
    if (Test-Path $checksumPath) {
        Copy-Item $checksumPath "$buildsDir/checksums.txt" -Force
        Write-Host "   Checksums: checksums.txt" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Structure des builds:" -ForegroundColor Cyan
    Write-Host "builds/" -ForegroundColor White
    Write-Host "  +-- portable/" -ForegroundColor White
    Write-Host "      +-- MultitoolV2-Portable.exe" -ForegroundColor White
    Write-Host "  +-- installer/" -ForegroundColor White
    Write-Host "      +-- MultitoolV2-Installer.msi" -ForegroundColor White
    Write-Host "  +-- MicrosoftStoreMSI/" -ForegroundColor White
    Write-Host "      +-- MultitoolV2-MicrosoftStore.msi" -ForegroundColor White
    Write-Host "  +-- checksums.txt" -ForegroundColor White
    
    Write-Host ""
    Write-Host "ATTENTION - Builds non-signes" -ForegroundColor Yellow
    Write-Host "   Windows SmartScreen peut afficher un avertissement - c'est normal."
    Write-Host "   Utilisez la version portable pour eviter SmartScreen."
}
else {
    Write-Host "Aucun build reussi" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pour creer une release:" -ForegroundColor Cyan
Write-Host "   git tag v1.0.0 && git push origin v1.0.0" 