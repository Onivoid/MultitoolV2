import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { filterPatchnotesReleaseCommits } from "@/features/patchnotes/patchnotes.lib";
import { useLatestCommits } from "@/shared/hooks/useLatestCommits";
import { useMemo } from "react";

interface RecentPatchNotesProps {
  max?: number;
}

export function RecentPatchNotes({ max = 3 }: RecentPatchNotesProps) {
  const { commits, isLoading } = useLatestCommits({
    owner: "Onivoid",
    repo: "MultitoolV2",
  });

  const releaseCommits = useMemo(
    () => filterPatchnotesReleaseCommits(commits).slice(0, max),
    [commits, max],
  );

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!releaseCommits.length) {
    return (
      <p className="text-sm text-muted-foreground">Aucun patchnote récent.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {releaseCommits.map((commit, index) => (
        <li key={index}>
          <p className="font-medium">{commit.message}</p>
          <p className="text-xs text-muted-foreground">{commit.date}</p>
          {index < releaseCommits.length - 1 && <Separator className="my-2" />}
        </li>
      ))}
    </ul>
  );
}
