import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestCommits } from "@/shared/hooks/useLatestCommits";
import { PAGE_SCROLL } from "@/shared/components/pageStyles";

const REPO_OWNER = "Onivoid";
const REPO_NAME = "MultitoolV2";

export default function CommitsList() {
  const { commits, isLoading } = useLatestCommits({
    owner: REPO_OWNER,
    repo: REPO_NAME,
  });

  if (isLoading || !commits[0]) {
    return <Skeleton className="min-h-0 flex-1 w-full" />;
  }

  return (
    <ul
      className={`${PAGE_SCROLL} w-full rounded-xl bg-zinc-900/50 p-5`}
    >
      {commits.map((commit, index) => (
        <li key={index}>
          <p className="text-lg font-bold text-zinc-200">{commit.message}</p>
          <p className="mb-2 text-xs text-zinc-600">{commit.date}</p>
          <ul className="text-sm text-zinc-500">
            {commit.description?.split("\n").map((line, lineIndex) => (
              <li key={lineIndex}>{line}</li>
            ))}
          </ul>
          <Separator className="my-5 bg-foreground" />
        </li>
      ))}
    </ul>
  );
}
