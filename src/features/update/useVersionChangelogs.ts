import { useMemo } from "react";
import {
  findChangelogForVersionWithFallback,
  PATCHNOTES_REPO,
} from "@/features/patchnotes/patchnotes.lib";
import { useLatestCommits } from "@/shared/hooks/useLatestCommits";

export function useVersionChangelogs(
  currentVersion: string,
  availableVersion?: string | null,
) {
  const { commits, isLoading, error } = useLatestCommits({
    owner: PATCHNOTES_REPO.owner,
    repo: PATCHNOTES_REPO.name,
  });

  const installedChangelog = useMemo(
    () => findChangelogForVersionWithFallback(commits, currentVersion),
    [commits, currentVersion],
  );

  const availableChangelog = useMemo(() => {
    if (!availableVersion) return null;
    return findChangelogForVersionWithFallback(commits, availableVersion);
  }, [commits, availableVersion]);

  return {
    installedChangelog,
    availableChangelog,
    isLoading,
    error,
  };
}
