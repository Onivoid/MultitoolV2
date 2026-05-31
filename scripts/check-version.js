#!/usr/bin/env node

/**
 * Script Node.js pour vérifier la cohérence des versions MultitoolV2
 * Usage: node scripts/check-version.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { parseVersion } from "./versioning/semver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function stripV(version) {
  return String(version || "").replace(/^v/i, "");
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    log("red", `❌ Erreur lors de la lecture de ${filePath}: ${error.message}`);
    return null;
  }
}

function runGitCommand(command) {
  try {
    return execSync(command, { encoding: "utf8", cwd: rootDir }).trim();
  } catch (error) {
    return null;
  }
}

function checkVersions() {
  log("green", "🔍 Vérification de la cohérence des versions...");
  log("green", "=".repeat(45));
  console.log("");

  const packageJsonPath = path.join(rootDir, "package.json");
  const tauriConfigPath = path.join(rootDir, "src-tauri", "tauri.conf.json");

  const packageJson = readJsonFile(packageJsonPath);
  const tauriConfig = readJsonFile(tauriConfigPath);

  if (!packageJson || !tauriConfig) {
    process.exit(1);
  }

  const packageVersion = stripV(packageJson.version);
  const tauriVersion = stripV(tauriConfig.version);

  log("cyan", "Versions trouvées :");
  log("white", `  package.json: ${packageVersion}`);
  log("white", `  tauri.conf.json: ${tauriVersion}`);
  console.log("");

  if (!parseVersion(packageVersion)) {
    log("red", `❌ Format de version invalide : ${packageVersion}`);
    log("white", "  Attendu : X.Y.Z ou X.Y.Z-beta.N (voir VERSIONING.md)");
    process.exit(1);
  }

  if (packageVersion === tauriVersion) {
    log("green", "✅ Toutes les versions sont cohérentes !");
    console.log("");
    log("green", `Version actuelle : ${packageVersion}`);
  } else {
    log("red", "❌ Incohérence détectée dans les versions !");
    console.log("");
    log(
      "yellow",
      `⚠️  package.json (${packageVersion}) ≠ tauri.conf.json (${tauriVersion})`,
    );
    log("yellow", "Pour corriger : alignez les deux fichiers manuellement,");
    log(
      "white",
      "  ou refaites un commit avec les githooks (voir scripts/setup-hooks.sh).",
    );
    log("white", "  Commit sans bump : git commit --no-verify");
    console.log("");
    process.exit(1);
  }

  console.log("");
  const gitStatus = runGitCommand("git status --porcelain");
  if (gitStatus && gitStatus.length > 0) {
    log("yellow", "⚠️  Changements non committés détectés :");
    log("gray", gitStatus);
  } else {
    log("green", "✅ Repository Git propre");
  }

  console.log("");
  log("cyan", "Informations Git :");

  const currentTag = runGitCommand("git describe --exact-match --tags HEAD 2>nul");
  const latestTag = runGitCommand("git describe --tags --abbrev=0 2>nul");

  if (currentTag) {
    log("white", `  Tag actuel : ${currentTag}`);
    const tagVersion = stripV(currentTag);
    if (tagVersion === packageVersion) {
      log("green", "  ✅ Tag correspond à la version");
    } else {
      log("yellow", "  ⚠️  Tag ne correspond pas à la version");
      log("gray", `     tag v${tagVersion} ≠ package ${packageVersion}`);
    }
  } else {
    log("gray", "  Pas de tag sur le commit actuel");
  }

  if (latestTag) {
    log("white", `  Dernier tag : ${latestTag}`);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("");
    log("cyan", "Script de vérification des versions MultitoolV2");
    log("cyan", "=============================================");
    console.log("");
    log("white", "Usage: node scripts/check-version.js");
    console.log("");
    log("yellow", "Ce script vérifie :");
    log("white", "  - La cohérence entre package.json et tauri.conf.json");
    log("white", "  - L'état du repository Git");
    log("white", "  - La correspondance des tags Git");
    console.log("");
    process.exit(0);
  }

  checkVersions();
}

main();
