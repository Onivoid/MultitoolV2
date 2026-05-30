import type { Commit } from "@/types/commit";
import { stripVersionPrefix } from "@/utils/version";

export const PATCHNOTES_REPO = {
  owner: "Onivoid",
  name: "Multitool",
} as const;

export const PATCHNOTES_GITHUB_URL = `https://github.com/${PATCHNOTES_REPO.owner}/${PATCHNOTES_REPO.name}`;

export interface VersionChangelog {
  version: string;
  releaseTitle: string;
  date: string;
  lines: string[];
  isFallback?: boolean;
}

export function getCommitMessage(commit: Commit): string {
  return String(commit.message);
}

export function getCommitDate(commit: Commit): string {
  return String(commit.date);
}

export function getCommitDescriptionLines(commit: Commit): string[] {
  const raw = commit.description ? String(commit.description) : "";
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Titre + corps du commit, découpés ligne par ligne pour l'affichage. */
export function getCommitDisplayLines(commit: Commit): string[] {
  const title = getCommitMessage(commit).trim();
  const descriptionLines = getCommitDescriptionLines(commit);

  if (descriptionLines.length > 0) {
    return title ? [title, ...descriptionLines] : descriptionLines;
  }

  return title
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getCommitBodyLines(commit: Commit): string[] {
  const lines = getCommitDisplayLines(commit);
  return lines.slice(1);
}

export function isPatchnotesReleaseCommit(message: string): boolean {
  return message.trim().startsWith("Release :");
}

export function filterPatchnotesReleaseCommits(commits: Commit[]): Commit[] {
  return commits.filter((commit) =>
    isPatchnotesReleaseCommit(getCommitMessage(commit)),
  );
}

export function isReleaseCommit(message: string): boolean {
  return isPatchnotesReleaseCommit(message);
}

export function extractVersionFromReleaseMessage(message: string): string | null {
  const match = message.match(/Release\s*:?\s*(?:.*?\s)?v?(\d+\.\d+(?:\.\d+)?)/i);
  return match?.[1] ?? null;
}

export function versionsMatch(versionA: string, versionB: string): boolean {
  return (
    stripVersionPrefix(versionA).toLowerCase() ===
    stripVersionPrefix(versionB).toLowerCase()
  );
}

/** Commits GitHub les plus récents en premier. */
export function findLatestReleaseVersion(commits: Commit[]): string | null {
  for (const commit of commits) {
    const message = getCommitMessage(commit);
    if (!isReleaseCommit(message)) continue;
    return extractVersionFromReleaseMessage(message);
  }
  return null;
}

export function findChangelogForVersion(
  commits: Commit[],
  targetVersion: string,
): VersionChangelog | null {
  const normalizedTarget = stripVersionPrefix(targetVersion).toLowerCase();
  if (!normalizedTarget || normalizedTarget === "dev") return null;

  let releaseMeta: Pick<VersionChangelog, "releaseTitle" | "date" | "version"> | null =
    null;
  let releaseCommit: Commit | null = null;
  const lines: string[] = [];

  for (const commit of commits) {
    const message = getCommitMessage(commit);

    if (isReleaseCommit(message)) {
      const releaseVersion = extractVersionFromReleaseMessage(message);

      if (!releaseMeta) {
        if (releaseVersion && releaseVersion.toLowerCase() === normalizedTarget) {
          releaseMeta = {
            version: releaseVersion,
            releaseTitle: message,
            date: getCommitDate(commit),
          };
          releaseCommit = commit;
        }
        continue;
      }

      break;
    }

    if (releaseMeta) {
      lines.push(...getCommitDisplayLines(commit));
    }
  }

  if (!releaseMeta) return null;

  const releaseNotes = releaseCommit ? getCommitBodyLines(releaseCommit) : [];
  if (releaseNotes.length > 0) {
    lines.push(...releaseNotes);
  }

  return {
    ...releaseMeta,
    lines,
    isFallback: false,
  };
}

export function findChangelogForVersionWithFallback(
  commits: Commit[],
  targetVersion: string,
): VersionChangelog | null {
  const exact = findChangelogForVersion(commits, targetVersion);
  if (exact) return exact;

  const latestVersion = findLatestReleaseVersion(commits);
  if (!latestVersion || versionsMatch(latestVersion, targetVersion)) {
    return null;
  }

  const fallback = findChangelogForVersion(commits, latestVersion);
  if (!fallback) return null;

  return { ...fallback, isFallback: true };
}
