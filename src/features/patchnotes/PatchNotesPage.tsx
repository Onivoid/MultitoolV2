import { useMemo } from "react";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { PageWaveLoader } from "@/shared/components/PageWaveLoader";
import { PatchnoteCard } from "@/features/patchnotes/components/PatchnoteCard";
import { PatchnotesToolbar } from "@/features/patchnotes/components/PatchnotesToolbar";
import {
  filterPatchnotesReleaseCommits,
  PATCHNOTES_REPO,
} from "@/features/patchnotes/patchnotes.lib";
import { useLatestCommits } from "@/shared/hooks/useLatestCommits";

export default function PatchNotesPage() {
  const { commits, isLoading, isRefreshing, error, refresh } = useLatestCommits({
    owner: PATCHNOTES_REPO.owner,
    repo: PATCHNOTES_REPO.name,
  });

  const releaseCommits = useMemo(
    () => filterPatchnotesReleaseCommits(commits),
    [commits],
  );

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <PatchnotesToolbar
        releaseCount={releaseCommits.length}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      {isLoading ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <PageWaveLoader message="Chargement des patchnotes…" />
        </div>
      ) : error || releaseCommits.length === 0 ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <section className="settings-section max-w-md px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              {error ? "Impossible de charger les patchnotes" : "Aucune entrée"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {error ??
                "Aucune version n&apos;a été récupérée depuis GitHub pour le moment."}
            </p>
          </section>
        </div>
      ) : (
        <div className={`${PAGE_SCROLL} pb-20`}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {releaseCommits.map((commit, index) => (
              <PatchnoteCard
                key={`${commit.date}-${index}`}
                commit={commit}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </PageMotion>
  );
}
