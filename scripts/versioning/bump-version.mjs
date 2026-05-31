#!/usr/bin/env node
/**
 * Interactive version bump for githooks (package.json + tauri.conf.json).
 * Writes .git/BUMP_VERSION for post-commit tagging.
 */

import { readFileSync, writeFileSync, openSync, unlinkSync } from "fs";
import { createInterface } from "readline";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  parseVersion,
  isGreaterThan,
  formatVersion,
  formatReleaseTag,
} from "./semver.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "../..");
const config = JSON.parse(
  readFileSync(join(__dirname, "config.json"), "utf8"),
);

const PACKAGE_JSON = join(rootDir, "package.json");
const TAURI_CONF = join(rootDir, "src-tauri", "tauri.conf.json");
const BUMP_FILE = join(rootDir, ".git", "BUMP_VERSION");
const BUMP_TAG_FILE = join(rootDir, ".git", "BUMP_TAG");

function createPrompt() {
  try {
    const tty = openSync("/dev/tty", "r+");
    return createInterface({ input: tty, output: tty, terminal: true });
  } catch {
    return createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function readCurrentVersion() {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  return String(pkg.version || "").replace(/^v/i, "");
}

function suggestPrereleaseNumber(base, prereleaseId, msiNumericPrerelease) {
  const prefix = `v${base}-${prereleaseId}.`;
  const numericPrefix = `v${base}-`;
  let tags = [];
  try {
    const out = execSync(`git tag -l "v${base}*"`, {
      cwd: rootDir,
      encoding: "utf8",
    }).trim();
    tags = out ? out.split(/\r?\n/) : [];
  } catch {
    tags = [];
  }
  let max = 0;
  const baseEsc = base.replace(/\./g, "\\.");
  for (const tag of tags) {
    const labelMatch = tag.match(
      new RegExp(`^v${baseEsc}-${prereleaseId}\\.(\\d+)$`),
    );
    if (labelMatch) {
      max = Math.max(max, Number(labelMatch[1]));
      continue;
    }
    if (msiNumericPrerelease) {
      const numericMatch = tag.match(new RegExp(`^v${baseEsc}-(\\d+)$`));
      if (numericMatch) max = Math.max(max, Number(numericMatch[1]));
    }
  }
  return max + 1;
}

function applyVersion(version, gitTag) {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  pkg.version = version;
  writeFileSync(PACKAGE_JSON, `${JSON.stringify(pkg, null, 4)}\n`, "utf8");

  const conf = JSON.parse(readFileSync(TAURI_CONF, "utf8"));
  conf.version = version;
  writeFileSync(TAURI_CONF, `${JSON.stringify(conf, null, 4)}\n`, "utf8");

  execSync(`git add "${PACKAGE_JSON}" "${TAURI_CONF}"`, {
    cwd: rootDir,
    stdio: "inherit",
  });

  writeFileSync(BUMP_FILE, version, "utf8");
  if (gitTag) {
    writeFileSync(BUMP_TAG_FILE, gitTag, "utf8");
  } else {
    try {
      unlinkSync(BUMP_TAG_FILE);
    } catch {
      /* absent */
    }
  }
}

async function main() {
  const current = readCurrentVersion();
  const channelEntries = Object.entries(config.channels);
  const rl = createPrompt();

  console.log("");
  console.log("┌─────────────────────────────────────────┐");
  console.log("│ Version Bump Required                   │");
  console.log("├─────────────────────────────────────────┤");
  console.log(`│ Current version: v${current}`);
  console.log("└─────────────────────────────────────────┘");
  console.log("");
  console.log("Release channel:");
  channelEntries.forEach(([id, ch], i) => {
    console.log(`  ${i + 1}) ${id.padEnd(6)} — ${ch.label}`);
  });
  console.log("");

  const choice = await ask(rl, "Choice [1-4]: ");
  const idx = Number(choice) - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx >= channelEntries.length) {
    console.error("Invalid channel choice. Commit aborted.");
    rl.close();
    process.exit(1);
  }

  const [channelId, channelConfig] = channelEntries[idx];

  const baseInput = await ask(
    rl,
    channelConfig.prereleaseId
      ? `Base version X.Y.Z (current core > ${current.split("-")[0]}): `
      : `New version X.Y.Z (must be > ${current}): `,
  );

  const baseCore = baseInput.replace(/^v/i, "").split("-")[0];
  if (!parseVersion(baseCore) || parseVersion(baseCore).prerelease) {
    console.error(`Invalid version format: ${baseInput}`);
    rl.close();
    process.exit(1);
  }

  let newVersion;
  let gitTag = null;
  if (!channelConfig.prereleaseId) {
    newVersion = baseCore;
  } else {
    const suggested = suggestPrereleaseNumber(
      baseCore,
      channelConfig.prereleaseId,
      Boolean(channelConfig.msiNumericPrerelease),
    );
    const numInput = await ask(
      rl,
      `${channelConfig.prereleaseId} number [${suggested}]: `,
    );
    const num = numInput === "" ? suggested : Number(numInput);
    try {
      newVersion = formatVersion(baseCore, channelConfig, num);
      gitTag = formatReleaseTag(baseCore, channelConfig, num);
    } catch (err) {
      console.error(err.message);
      rl.close();
      process.exit(1);
    }
  }

  if (!isGreaterThan(newVersion, current)) {
    console.error(
      `Version '${newVersion}' must be greater than current '${current}'`,
    );
    rl.close();
    process.exit(1);
  }

  rl.close();

  applyVersion(newVersion, gitTag);

  console.log("");
  console.log(` ✓ Version ${newVersion} (${channelId})`);
  if (gitTag && gitTag !== `v${newVersion}`) {
    console.log(` ✓ Tag Git ${gitTag} (affichage) — MSI utilise ${newVersion}`);
  } else {
    console.log(` ✓ Tag ${gitTag ?? `v${newVersion}`} will be created in post-commit`);
  }
  if (!channelConfig.publishUpdater) {
    console.log("   → Pre-release: CI will not publish stable latest.json");
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
