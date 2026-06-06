/**
 * Resolve release channel from a git tag or package version.
 *
 * Usage:
 *   node scripts/versioning/release-channel.mjs --tag v3.0.0-beta.1
 *   node scripts/versioning/release-channel.mjs --version 3.0.0-beta.1 --github-output "$GITHUB_OUTPUT"
 */

import { readFileSync, appendFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseVersion } from "./semver.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, "config.json"), "utf8"));

function detectChannelFromLabel(raw) {
  const lower = String(raw || "").toLowerCase();
  if (/-beta(?:\.|$|-)/i.test(lower) || lower.includes(".beta.")) return "beta";
  if (/-alpha(?:\.|$|-)/i.test(lower) || lower.includes(".alpha.")) return "alpha";
  if (/-rc(?:\.|$|-)/i.test(lower)) return "rc";
  return null;
}

function detectChannelId(version) {
  const byLabel = detectChannelFromLabel(version);
  if (byLabel) return byLabel;

  const parsed = parseVersion(version);
  if (!parsed) return null;
  if (!parsed.prerelease) return "stable";

  const head = parsed.prerelease.split(".")[0];
  for (const [id, ch] of Object.entries(config.channels)) {
    if (ch.prereleaseId === head) return id;
  }

  // Version MSI 3.0.0-1 (pré-release purement numérique) → canal beta par convention
  if (/^\d+$/.test(head)) {
    const numericChannel = Object.entries(config.channels).find(
      ([, ch]) => ch.msiNumericPrerelease && ch.prereleaseId === "beta",
    );
    if (numericChannel) return numericChannel[0];
  }

  return "unknown";
}

export function resolveReleaseMeta({ tag, version }) {
  const rawVersion = String(version || tag || "")
    .trim()
    .replace(/^v/i, "");
  const channelId = detectChannelId(rawVersion);
  const channel = config.channels[channelId] ?? {
    label: "unknown",
    prerelease: true,
    publishUpdater: false,
    makeLatest: false,
  };

  const tagName = tag ? String(tag).trim() : rawVersion ? `v${rawVersion}` : "";

  const titlePrefix = channel.prerelease ? "Pre-release" : "Release";
  const releaseName = tagName ? `${titlePrefix} ${tagName}` : titlePrefix;

  return {
    channel: channelId,
    version: rawVersion,
    tag: tagName,
    prerelease: Boolean(channel.prerelease),
    publishUpdater: Boolean(channel.publishUpdater),
    makeLatest: channel.makeLatest === true,
    releaseName,
    updaterNote: channel.publishUpdater
      ? "MSI : mises à jour auto via latest.json (canal stable)"
      : "MSI : installation manuelle — pre-release, pas de canal stable",
  };
}

function writeGithubOutput(file, meta) {
  const lines = [
    `channel=${meta.channel}`,
    `version=${meta.version}`,
    `prerelease=${meta.prerelease}`,
    `publish_updater=${meta.publishUpdater}`,
    `make_latest=${meta.makeLatest}`,
    `release_name=${meta.releaseName}`,
    `updater_note=${meta.updaterNote}`,
  ];
  appendFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const args = process.argv.slice(2);
  let tag = null;
  let version = null;
  let githubOutput = null;

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--tag") tag = args[++i];
    else if (args[i] === "--version") version = args[++i];
    else if (args[i] === "--github-output") githubOutput = args[++i];
  }

  if (!tag && !version) {
    console.error(
      "Usage: node scripts/versioning/release-channel.mjs --tag vX.Y.Z [--github-output $GITHUB_OUTPUT]",
    );
    process.exit(1);
  }

  const meta = resolveReleaseMeta({ tag, version });
  if (meta.channel === "unknown") {
    console.error(
      `Unknown prerelease in version "${meta.version}". Allowed: ${Object.entries(
        config.channels,
      )
        .filter(([, c]) => c.prereleaseId)
        .map(([, c]) => c.prereleaseId)
        .join(", ")}`,
    );
    process.exit(1);
  }

  if (githubOutput) {
    writeGithubOutput(githubOutput, meta);
  } else {
    console.log(JSON.stringify(meta, null, 2));
  }
}

if (process.argv[1]?.endsWith("release-channel.mjs")) {
  main();
}
