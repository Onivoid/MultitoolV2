/**
 * Minimal semver 2.0 helpers (no external dependency).
 */

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export function parseVersion(raw) {
  const v = String(raw || "")
    .trim()
    .replace(/^v/i, "");
  const m = v.match(VERSION_RE);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
    raw: v,
  };
}

function compareIdentifiers(a, b) {
  const partsA = a.split(".");
  const partsB = b.split(".");
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i += 1) {
    const pa = partsA[i];
    const pb = partsB[i];
    if (pa === undefined) return -1;
    if (pb === undefined) return 1;
    const na = /^\d+$/.test(pa) ? Number(pa) : null;
    const nb = /^\d+$/.test(pb) ? Number(pb) : null;
    if (na !== null && nb !== null) {
      if (na !== nb) return na < nb ? -1 : 1;
    } else if (na !== null) return -1;
    else if (nb !== null) return 1;
    else if (pa !== pb) return pa < pb ? -1 : 1;
  }
  return 0;
}

/** @returns -1 | 0 | 1 */
export function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (!va || !vb) throw new Error(`Invalid version: ${!va ? a : b}`);

  for (const key of ["major", "minor", "patch"]) {
    if (va[key] !== vb[key]) return va[key] < vb[key] ? -1 : 1;
  }

  if (va.prerelease === vb.prerelease) return 0;
  if (va.prerelease === null) return 1;
  if (vb.prerelease === null) return -1;
  return compareIdentifiers(va.prerelease, vb.prerelease);
}

export function isGreaterThan(a, b) {
  return compareVersions(a, b) > 0;
}

export function formatVersion(base, channelConfig, prereleaseNumber) {
  const core = parseVersion(base);
  if (!core || core.prerelease) {
    throw new Error(`Invalid base version: ${base}`);
  }
  const id = channelConfig?.prereleaseId;
  if (!id) return core.raw;
  const n = Number(prereleaseNumber);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid prerelease number: ${prereleaseNumber}`);
  }
  // WiX/MSI (Tauri) : pré-release numérique uniquement — ex. 3.0.0-1, pas 3.0.0-beta.1
  if (channelConfig.msiNumericPrerelease) {
    return `${core.raw}-${n}`;
  }
  return `${core.raw}-${id}.${n}`;
}

/** Tag Git lisible (ex. v3.0.0-beta.1) quand la version MSI est 3.0.0-1. */
export function formatReleaseTag(base, channelConfig, prereleaseNumber) {
  const core = parseVersion(base);
  if (!core || core.prerelease) {
    throw new Error(`Invalid base version: ${base}`);
  }
  const id = channelConfig?.prereleaseId;
  if (!id) return `v${core.raw}`;
  const n = Number(prereleaseNumber);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid prerelease number: ${prereleaseNumber}`);
  }
  return `v${core.raw}-${id}.${n}`;
}
