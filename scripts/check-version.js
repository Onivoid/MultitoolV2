#!/usr/bin/env node

/**
 * Script Node.js pour vérifier la cohérence des versions MultitoolV2
 * Usage: node scripts/check-version.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Couleurs pour la console
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        log('red', `❌ Erreur lors de la lecture de ${filePath}: ${error.message}`);
        return null;
    }
}

function runGitCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', cwd: rootDir }).trim();
    } catch (error) {
        return null;
    }
}

function checkVersions() {
    log('green', '🔍 Vérification de la cohérence des versions...');
    log('green', '='.repeat(45));
    console.log('');

    // Chemins des fichiers
    const packageJsonPath = path.join(rootDir, 'package.json');
    const tauriConfigPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
    const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');

    // Lire les versions
    const packageJson = readJsonFile(packageJsonPath);
    const tauriConfig = readJsonFile(tauriConfigPath);

    if (!packageJson || !tauriConfig) {
        process.exit(1);
    }

    // Lire la version du Cargo.toml
    let cargoVersion = 'non trouvée';
    try {
        const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
        const cargoVersionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
        cargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : 'non trouvée';
    } catch (error) {
        log('yellow', '⚠️  Impossible de lire Cargo.toml');
    }

    const packageVersion = packageJson.version;
    const tauriVersion = tauriConfig.version;

    log('cyan', 'Versions trouvées :');
    log('white', `  package.json: ${packageVersion}`);
    log('white', `  tauri.conf.json: ${tauriVersion}`);
    log('white', `  Cargo.toml: ${cargoVersion}`);
    console.log('');

    // Vérifier la cohérence
    if (packageVersion === tauriVersion && tauriVersion === cargoVersion) {
        log('green', '✅ Toutes les versions sont cohérentes !');
        console.log('');
        log('green', `Version actuelle : ${packageVersion}`);
    } else {
        log('red', '❌ Incohérence détectée dans les versions !');
        console.log('');
        if (packageVersion !== tauriVersion) {
            log('yellow', `⚠️  package.json (${packageVersion}) ≠ tauri.conf.json (${tauriVersion})`);
        }
        if (tauriVersion !== cargoVersion) {
            log('yellow', `⚠️  tauri.conf.json (${tauriVersion}) ≠ Cargo.toml (${cargoVersion})`);
        }
        log('yellow', 'Pour corriger : alignez les trois fichiers manuellement,');
        log('white', '  ou refaites un commit avec les githooks (voir scripts/setup-githooks.ps1).');
        log('white', '  Commit sans bump : git commit --no-verify');
        console.log('');
        process.exit(1);
    }

    // Vérifier Git status
    console.log('');
    const gitStatus = runGitCommand('git status --porcelain');
    if (gitStatus && gitStatus.length > 0) {
        log('yellow', '⚠️  Changements non committés détectés :');
        log('gray', gitStatus);
    } else {
        log('green', '✅ Repository Git propre');
    }

    // Vérifier les tags Git
    console.log('');
    log('cyan', 'Informations Git :');
    
    const currentTag = runGitCommand('git describe --exact-match --tags HEAD 2>nul');
    const latestTag = runGitCommand('git describe --tags --abbrev=0 2>nul');
    
    if (currentTag) {
        log('white', `  Tag actuel : ${currentTag}`);
        if (currentTag === `v${packageVersion}`) {
            log('green', '  ✅ Tag correspond à la version');
        } else {
            log('yellow', '  ⚠️  Tag ne correspond pas à la version');
        }
    } else {
        log('gray', '  Pas de tag sur le commit actuel');
    }
    
    if (latestTag) {
        log('white', `  Dernier tag : ${latestTag}`);
    }
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('');
        log('cyan', 'Script de vérification des versions MultitoolV2');
        log('cyan', '=============================================');
        console.log('');
        log('white', 'Usage: node scripts/check-version.js');
        console.log('');
        log('yellow', 'Ce script vérifie :');
        log('white', '  - La cohérence entre package.json, tauri.conf.json et Cargo.toml');
        log('white', '  - L\'état du repository Git');
        log('white', '  - La correspondance des tags Git');
        console.log('');
        process.exit(0);
    }

    checkVersions();
}

main();
