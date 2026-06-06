#!/usr/bin/env node
/**
 * After a prerelease publish, ensure GitHub "latest" still points elsewhere.
 *
 * Usage:
 *   GITHUB_REPOSITORY=owner/repo node scripts/versioning/verify-release-safety.mjs --tag v3.0.0-beta.1
 */

import { resolveReleaseMeta } from "./release-channel.mjs";

const tag = process.argv.includes("--tag")
  ? process.argv[process.argv.indexOf("--tag") + 1]
  : null;

if (!tag) {
  console.error(
    "Usage: node scripts/versioning/verify-release-safety.mjs --tag vX.Y.Z",
  );
  process.exit(1);
}

const meta = resolveReleaseMeta({ tag });
const [owner, repo] = (process.env.GITHUB_REPOSITORY || "Onivoid/MultitoolV2").split(
  "/",
);

async function apiGet(path) {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "multitoolv2-release-safety",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    throw new Error(`GET ${path} failed ${res.status}`);
  }
  return res.json();
}

async function main() {
  if (meta.publishUpdater) {
    console.log("Stable release — skipping latest-release safety check.");
    return;
  }

  console.log(`Verifying ${tag} (${meta.channel}) is not GitHub Latest…`);

  const latest = await apiGet(`/repos/${owner}/${repo}/releases/latest`);
  const normalizedTag = tag.startsWith("v") ? tag : `v${tag}`;
  if (latest.tag_name === normalizedTag) {
    console.error(`FAIL: ${normalizedTag} is marked as the repository Latest release.`);
    console.error("Stable users would receive this build via releases/latest.");
    process.exit(1);
  }

  if (!latest.prerelease && meta.prerelease) {
    console.log(
      `OK: Latest release remains ${latest.tag_name} (stable). Published ${normalizedTag} is prerelease.`,
    );
  } else {
    console.log(`OK: Latest release is ${latest.tag_name}, not ${normalizedTag}.`);
  }

  const manifestUrl = `https://github.com/${owner}/${repo}/releases/latest/download/latest.json`;
  const res = await fetch(manifestUrl, { redirect: "follow" });
  if (res.ok) {
    const json = await res.json();
    if (json.version === meta.version) {
      console.error(
        `FAIL: releases/latest/latest.json advertises v${json.version} (this prerelease).`,
      );
      process.exit(1);
    }
    console.log(
      `OK: releases/latest/latest.json still serves stable v${json.version}.`,
    );
  } else {
    console.warn(`Could not fetch ${manifestUrl} (${res.status}).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
