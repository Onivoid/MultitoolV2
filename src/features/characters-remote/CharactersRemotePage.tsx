import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { IconClock, IconDownload, IconHeart, IconSearch } from "@tabler/icons-react";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
import { PAGE_SCROLL } from "@/shared/components/pageStyles";
import { CharacterCard } from "@/features/characters-remote/components/CharacterCard";
import { useCharactersRemote } from "@/features/characters-remote/useCharactersRemote";

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

  useEffect(() => {
    const handleScroll = () => {
      const el = gridRef.current;
      if (!el || isLoading || !hasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        fetchPage();
      }
    };
    const el = gridRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => {
      if (el) el.removeEventListener("scroll", handleScroll);
    };
  }, [fetchPage, hasMore, isLoading]);

  return (
    <PageMotion className="px-4 pt-2">
      <PageHeader
        icon={<IconDownload className="h-6 w-6" />}
        title="Personnages en Ligne"
        description="Liste de personnages téléchargeables, par la communauté de SC Characters"
      />

      <div className="my-4 flex w-full shrink-0 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un personnage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border bg-background/30 py-2 pl-10 pr-4 shadow focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "latest" as const, label: "Récents", icon: <IconClock size={20} /> },
            { key: "download" as const, label: "Populaires", icon: <IconHeart size={20} /> },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => changeSort(opt.key)}
              className={`flex items-center gap-2 rounded border px-3 py-2.5 text-sm ${sort === opt.key ? "bg-primary text-primary-foreground" : "bg-background/30"}`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        className={`${PAGE_SCROLL} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}
      >
        {charactersPresets.length === 0 &&
          isLoading &&
          Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-150 animate-pulse rounded bg-background/30"
            />
          ))}
        {charactersPresets.map((character, index) => {
          const batchSize = 12;
          const batchIndex = index % batchSize;
          return (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2 * batchIndex,
                ease: [0, 0.71, 0.2, 1.01],
              }}
              className="flex w-full flex-col"
            >
              <CharacterCard
                url={character.previewUrl}
                name={character.title}
                owner={character.user.name}
                characterid={character.id}
                downloads={character._count.characterDownloads}
                likes={character._count.characterLikes}
                dnaurl={character.dnaUrl}
              />
            </motion.div>
          );
        })}
        {isLoading && (
          <div className="col-span-full py-4 text-center text-gray-500">
            Chargement...
          </div>
        )}
        {!hasMore && charactersPresets.length > 0 && (
          <div className="col-span-full py-4 text-center text-gray-400">
            Fin de la liste
          </div>
        )}
      </div>
    </PageMotion>
  );
}
