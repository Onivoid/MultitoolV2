import { useEffect, useRef } from "react";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_CENTER, PAGE_SCROLL } from "@/shared/components/pageStyles";
import { CharacterCard } from "@/features/characters-remote/components/CharacterCard";
import { RemoteCharactersToolbar } from "@/features/characters-remote/components/RemoteCharactersToolbar";
import { useCharactersRemote } from "@/features/characters-remote/useCharactersRemote";

function CharacterCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="settings-section h-[400px] w-full max-w-md animate-pulse overflow-hidden"
      style={{ animationDelay: `${index * 40}ms` }}
    />
  );
}

export default function CharactersRemotePage() {
  const {
    charactersPresets,
    isLoading,
    hasMore,
    sort,
    searchTerm,
    setSearchTerm,
    fetchPage,
    changeSort,
  } = useCharactersRemote();

  const gridRef = useRef<HTMLDivElement>(null);
  const isInitialLoading = charactersPresets.length === 0 && isLoading;

  useEffect(() => {
    const handleScroll = () => {
      const el = gridRef.current;
      if (!el || isLoading || !hasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        fetchPage();
      }
    };

    const el = gridRef.current;
    el?.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [fetchPage, hasMore, isLoading]);

  if (isInitialLoading) {
    return (
      <PageMotion className="px-4 pt-2">
        <RemoteCharactersToolbar
          searchTerm={searchTerm}
          sort={sort}
          onSearchChange={setSearchTerm}
          onSortChange={changeSort}
        />
        <div
          className={`${PAGE_SCROLL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <CharacterCardSkeleton key={`skeleton-${i}`} index={i} />
          ))}
        </div>
      </PageMotion>
    );
  }

  return (
    <PageMotion className="flex min-h-0 flex-1 flex-col px-4 pt-2">
      <RemoteCharactersToolbar
        searchTerm={searchTerm}
        sort={sort}
        onSearchChange={setSearchTerm}
        onSortChange={changeSort}
      />

      {charactersPresets.length === 0 ? (
        <div className={`${PAGE_CENTER} pb-20`}>
          <div className="settings-section max-w-md px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Aucun personnage trouvé
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Essayez un autre terme de recherche ou changez le tri.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={gridRef}
          className={`${PAGE_SCROLL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}
        >
          {charactersPresets.map((character, index) => (
            <CharacterCard
              key={character.id}
              url={character.previewUrl}
              name={character.title}
              owner={character.user.name}
              characterid={character.id}
              downloads={character._count.characterDownloads}
              likes={character._count.characterLikes}
              dnaurl={character.dnaUrl}
              index={index}
            />
          ))}

          {isLoading && (
            <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
              Chargement…
            </p>
          )}
          {!hasMore && charactersPresets.length > 0 && (
            <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
              Fin du catalogue
            </p>
          )}
        </div>
      )}
    </PageMotion>
  );
}
