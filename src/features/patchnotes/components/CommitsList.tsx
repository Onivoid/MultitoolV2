import { PatchnoteCard } from "@/features/patchnotes/components/PatchnoteCard";
import {
  filterPatchnotesReleaseCommits,
  PATCHNOTES_REPO,
} from "@/features/patchnotes/patchnotes.lib";
import { PAGE_SCROLL } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { useLatestCommits } from "@/shared/hooks/useLatestCommits";
import { useMemo } from "react";

/** @deprecated Utiliser PatchNotesPage ou PatchnoteCard directement */
export default function CommitsList() {
  const { commits, isLoading } = useLatestCommits({
    owner: PATCHNOTES_REPO.owner,
    repo: PATCHNOTES_REPO.name,
  });

  const releaseCommits = useMemo(
    () => filterPatchnotesReleaseCommits(commits),
    [commits],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <PageWaveLoader message="Chargement des patchnotes…" />
      </div>
    );
  }

  return (
    <div className={`${PAGE_SCROLL} flex flex-col gap-3 pb-4`}>
      {releaseCommits.map((commit, index) => (
        <PatchnoteCard key={`${commit.date}-${index}`} commit={commit} index={index} />
      ))}
    </div>
  );
}
