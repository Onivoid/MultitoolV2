import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestCommits } from "@/shared/hooks/useLatestCommits";

interface RecentPatchNotesProps {
  max?: number;
}

export function RecentPatchNotes({ max = 3 }: RecentPatchNotesProps) {
  const { commits, isLoading } = useLatestCommits({
    owner: "Onivoid",
    repo: "MultitoolV2",
    max,
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!commits.length) {
    return (
      <p className="text-sm text-muted-foreground">Aucun patchnote récent.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {commits.map((commit, index) => (
        <li key={index}>
          <p className="font-medium">{commit.message}</p>
          <p className="text-xs text-muted-foreground">{commit.date}</p>
          {index < commits.length - 1 && <Separator className="my-2" />}
        </li>
      ))}
    </ul>
  );
}
