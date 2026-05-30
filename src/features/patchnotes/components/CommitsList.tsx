import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLatestCommits } from "@/shared/hooks/useLatestCommits";

const REPO_OWNER = "Onivoid";
const REPO_NAME = "MultitoolV2";

export default function CommitsList() {
  const { commits, isLoading } = useLatestCommits({
    owner: REPO_OWNER,
    repo: REPO_NAME,
  });

  if (isLoading || !commits[0]) {
    return <Skeleton className="h-[calc(100vh-130px)]" />;
  }

  return (
    <div className="w-full">
      <ul className="overflow-y-scroll h-[calc(100vh-170px)] bg-zinc-900/50 p-5 rounded-xl w-full">
        {commits.map((commit, index) => (
          <li key={index}>
            <p className="text-lg font-bold text-zinc-200">{commit.message}</p>
            <p className="text-xs text-zinc-600 mb-2">{commit.date}</p>
            <ul className="text-sm text-zinc-500">
              {commit.description?.split("\n").map((line, lineIndex) => (
                <li key={lineIndex}>{line}</li>
              ))}
            </ul>
            <Separator className="my-5 bg-foreground" />
          </li>
        ))}
      </ul>
    </div>
  );
}
