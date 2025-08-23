#!/usr/bin/env node

/**
 * Script Node.js pour gérer les versions de MultitoolV2
 * Usage: node scripts/update-version.js <version>
 * Exemple: node scripts/update-version.js 2.1.4
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Couleurs pour la console
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateVersion(version) {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(version)) {
        log('red', '❌ Format de version invalide. Utilisez le format X.Y.Z (ex: 2.1.4)');
        process.exit(1);
    }
}

function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        log('red', `❌ Erreur lors de la lecture de ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

function writeJsonFile(filePath, data) {
    try {
        const content = JSON.stringify(data, null, 4);
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        log('red', `❌ Erreur lors de l'écriture de ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

function updateVersion(version) {
    log('green', `🚀 Mise à jour de la version vers ${version}...`);
    log('green', '='.repeat(50));

    // Chemins des fichiers
    const packageJsonPath = path.join(rootDir, 'package.json');
    const tauriConfigPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
    const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');

    // Vérifier que les fichiers existent
    if (!fs.existsSync(packageJsonPath)) {
        log('red', '❌ package.json non trouvé');
        process.exit(1);
    }

    if (!fs.existsSync(tauriConfigPath)) {
        log('red', '❌ tauri.conf.json non trouvé');
        process.exit(1);
    }

    if (!fs.existsSync(cargoTomlPath)) {
        log('red', '❌ Cargo.toml non trouvé');
        process.exit(1);
    }

    // Lire les fichiers JSON
    log('yellow', '📖 Lecture des fichiers...');
    const packageJson = readJsonFile(packageJsonPath);
    const tauriConfig = readJsonFile(tauriConfigPath);

    // Lire le Cargo.toml
    const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');

    // Sauvegarder les versions actuelles
    const oldPackageVersion = packageJson.version;
    const oldTauriVersion = tauriConfig.version;
    const cargoVersionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
    const oldCargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : 'non trouvée';

    log('cyan', `Version actuelle package.json: ${oldPackageVersion}`);
    log('cyan', `Version actuelle tauri.conf.json: ${oldTauriVersion}`);
    log('cyan', `Version actuelle Cargo.toml: ${oldCargoVersion}`);

    // Mettre à jour les versions
    log('yellow', '✏️  Mise à jour de package.json...');
    packageJson.version = version;
    writeJsonFile(packageJsonPath, packageJson);

    log('yellow', '✏️  Mise à jour de tauri.conf.json...');
    tauriConfig.version = version;
    writeJsonFile(tauriConfigPath, tauriConfig);

    log('yellow', '✏️  Mise à jour de Cargo.toml...');
    const updatedCargoContent = cargoContent.replace(
        /version\s*=\s*"[^"]+"/,
        `version = "${version}"`
    );
    fs.writeFileSync(cargoTomlPath, updatedCargoContent, 'utf8');

    // Vérification
    log('yellow', '🔍 Vérification des fichiers mis à jour...');
    const updatedPackage = readJsonFile(packageJsonPath);
    const updatedTauri = readJsonFile(tauriConfigPath);
    const finalCargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
    const updatedCargoVersionMatch = finalCargoContent.match(/version\s*=\s*"([^"]+)"/);
    const updatedCargoVersion = updatedCargoVersionMatch ? updatedCargoVersionMatch[1] : 'erreur';

    if (updatedPackage.version === version && 
        updatedTauri.version === version && 
        updatedCargoVersion === version) {
        log('green', '✅ Version mise à jour avec succès !');
        console.log('');
        log('cyan', 'Fichiers mis à jour :');
        log('white', `  - package.json: ${updatedPackage.version}`);
        log('white', `  - tauri.conf.json: ${updatedTauri.version}`);
        log('white', `  - Cargo.toml: ${updatedCargoVersion}`);
        console.log('');
        log('cyan', 'Étapes suivantes recommandées :');
        log('white', '  1. Vérifiez que l\'application fonctionne : pnpm tauri dev');
        log('white', `  2. Committez les changements : git add -A && git commit -m "chore: bump version to ${version}"`);
        log('white', `  3. Créez un tag : git tag v${version}`);
        log('white', '  4. Poussez les changements : git push && git push --tags');
        log('white', '  5. Lancez le build release : .\\scripts\\build-release.ps1');
    } else {
        log('red', '❌ Erreur lors de la vérification des versions');
        log('red', `Package: ${updatedPackage.version}, Tauri: ${updatedTauri.version}, Cargo: ${updatedCargoVersion}`);
        process.exit(1);
    }
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log('');
        log('cyan', 'Script de mise à jour des versions MultitoolV2');
        log('cyan', '==========================================');
        console.log('');
        log('white', 'Usage: node scripts/update-version.js <version>');
        log('white', 'Exemple: node scripts/update-version.js 2.1.4');
        console.log('');
        log('yellow', 'Ce script met à jour :');
        log('white', '  - package.json');
        log('white', '  - src-tauri/tauri.conf.json');
        console.log('');
        process.exit(0);
    }

    const version = args[0];
    validateVersion(version);
    updateVersion(version);
}

main();
