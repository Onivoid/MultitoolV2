import { useCallback, useEffect, useState } from "react";
import { patchnotesService } from "@/features/patchnotes/patchnotes.service";
import type { Commit } from "@/types/commit";

interface UseLatestCommitsOptions {
  owner: string;
  repo: string;
  max?: number;
}

export function useLatestCommits({ owner, repo, max }: UseLatestCommitsOptions) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await patchnotesService.getLatestCommits(owner, repo);
      setCommits(max ? data.slice(0, max) : data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCommits([]);
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo, max]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { commits, isLoading, error, refresh };
}
