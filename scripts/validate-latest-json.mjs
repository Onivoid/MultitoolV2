/**
 * Validates latest.json on a published GitHub release.
 *
 * Usage: node scripts/validate-latest-json.mjs <tag>
 *
 * Checks:
 * - No "untagged-" URLs in the manifest
 * - Each platform download URL returns HTTP 200 (HEAD)
 */

const tag = process.argv[2];

if (!tag) {
    console.error("Usage: node scripts/validate-latest-json.mjs <tag>");
    process.exit(1);
}

const repoMatch = process.env.GITHUB_REPOSITORY || "Onivoid/MultitoolV2";
const [owner, repo] = repoMatch.split("/");

const manifestUrl = `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/latest.json`;

async function main() {
    console.log(`Validating latest.json for ${tag}`);
    console.log(`  Manifest: ${manifestUrl}`);

    const res = await fetch(manifestUrl, { redirect: "follow" });
    if (!res.ok) {
        console.error(`Failed to fetch latest.json: ${res.status}`);
        process.exit(1);
    }

    const latest = await res.json();
    const text = JSON.stringify(latest);

    if (text.includes("untagged-")) {
        console.error("latest.json contains untagged draft URLs.");
        process.exit(1);
    }

    if (!latest.platforms || Object.keys(latest.platforms).length === 0) {
        console.error("latest.json has no platforms.");
        process.exit(1);
    }

    for (const [key, platform] of Object.entries(latest.platforms)) {
        const url = platform?.url;
        if (!url) {
            console.error(`Platform ${key} has no url.`);
            process.exit(1);
        }

        console.log(`  Checking ${key}: ${url}`);
        const head = await fetch(url, { method: "HEAD", redirect: "follow" });
        if (!head.ok) {
            console.error(`  ${key} URL returned ${head.status}`);
            process.exit(1);
        }
    }

    console.log("latest.json validation passed.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
