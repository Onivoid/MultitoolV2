/**
 * Generates and uploads latest.json for the Tauri updater.
 *
 * Usage: node scripts/updater.mjs <tag>
 *
 * Reads release assets from the GitHub release, extracts signatures from
 * .sig files, builds canonical download URLs, and uploads latest.json.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const tag = process.argv[2];

if (!tag) {
  console.error("Usage: node scripts/updater.mjs <tag>");
  process.exit(1);
}
if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));
const version = String(pkg.version || "").replace(/^v/i, "");

const repoMatch = process.env.GITHUB_REPOSITORY || "Onivoid/MultitoolV2";
const [owner, repo] = repoMatch.split("/");

const baseUrl = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "multitoolv2-updater-script",
};

async function apiGet(path) {
  const res = await fetch(`${baseUrl}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function getReleaseByTag(tagName) {
  try {
    return await apiGet(`/repos/${owner}/${repo}/releases/tags/${tagName}`);
  } catch {
    const releases = await apiGet(`/repos/${owner}/${repo}/releases?per_page=20`);
    const found = releases.find((r) => r.tag_name === tagName);
    if (!found) throw new Error(`Release ${tagName} not found`);
    return found;
  }
}

async function getAssetContent(asset) {
  const res = await fetch(asset.url, {
    headers: { ...headers, Accept: "application/octet-stream" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Failed to download ${asset.name}: ${res.status}`);
  }
  return res.text();
}

async function uploadAsset(releaseId, name, content) {
  const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(name)}`;

  const existing = await apiGet(`/repos/${owner}/${repo}/releases/${releaseId}/assets`);
  const dup = existing.find((a) => a.name === name);
  if (dup) {
    await fetch(`${baseUrl}/repos/${owner}/${repo}/releases/assets/${dup.id}`, {
      method: "DELETE",
      headers,
    });
  }

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: content,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload ${name} failed ${res.status}: ${text}`);
  }
  return res.json();
}

function findAsset(assets, predicate) {
  return assets.find(predicate) ?? null;
}

/** Canonical GitHub release asset URL (avoids draft "untagged-…" URLs). */
function releaseDownloadUrl(tagName, fileName) {
  const encodedTag = encodeURIComponent(tagName);
  const encodedFile = encodeURIComponent(fileName);
  return `https://github.com/${owner}/${repo}/releases/download/${encodedTag}/${encodedFile}`;
}

async function main() {
  console.log(`Generating latest.json for ${tag} (v${version})`);

  const release = await getReleaseByTag(tag);
  const assets = release.assets;

  console.log(
    "Available assets:",
    assets.map((a) => a.name),
  );

  const platforms = {};

  for (const asset of assets) {
    const name = asset.name;

    if (!name.endsWith(".sig")) continue;

    const archiveName = name.slice(0, -4);
    const archiveAsset = findAsset(assets, (a) => a.name === archiveName);

    if (!archiveAsset) {
      console.warn(`  Archive not found for sig: ${name}, skipping`);
      continue;
    }

    const signature = await getAssetContent(asset);
    const apiUrl = archiveAsset.browser_download_url;
    if (apiUrl?.includes("/untagged-")) {
      console.warn(
        `  Warning: GitHub API returned draft URL for ${archiveName}; using canonical URL instead.`,
      );
    }
    const downloadUrl = releaseDownloadUrl(tag, archiveName);

    if (name.endsWith(".msi.sig")) {
      const arch = name.toLowerCase().includes("aarch64") ? "aarch64" : "x86_64";
      const key = `windows-${arch}`;
      if (!platforms[key]) {
        console.log(`  Windows MSI ${key}: ${archiveName}`);
        console.log(`    URL: ${downloadUrl}`);
        platforms[key] = {
          signature: signature.trim(),
          url: downloadUrl,
        };
      }
    }
  }

  if (Object.keys(platforms).length === 0) {
    console.error(
      "No updater platforms found. Upload MultitoolV2-Installer.msi and .msi.sig first.",
    );
    process.exit(1);
  }

  const latestJson = {
    version,
    notes: release.body || `Release ${tag}`,
    pub_date: release.published_at || new Date().toISOString(),
    platforms,
  };

  const jsonText = JSON.stringify(latestJson, null, 2);
  if (jsonText.includes("untagged-")) {
    console.error("latest.json still contains untagged URLs. Aborting upload.");
    process.exit(1);
  }

  console.log("\nGenerated latest.json:");
  console.log(jsonText);

  await uploadAsset(release.id, "latest.json", jsonText);
  console.log("\nlatest.json uploaded successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
