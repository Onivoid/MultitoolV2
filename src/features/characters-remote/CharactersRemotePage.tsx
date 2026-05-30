import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { IconClock, IconDownload, IconHeart, IconSearch } from "@tabler/icons-react";
import PageHeader from "@/shared/components/PageHeader";
import PageMotion from "@/shared/components/PageMotion";
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
    <PageMotion className="flex w-full flex-col">
      <PageHeader
        icon={<IconDownload className="h-6 w-6" />}
        title="Personnages en Ligne"
        description="Liste de personnages téléchargeables, par la communauté de SC Characters"
      />

      <div className="w-full flex flex-col md:flex-row md:items-center gap-3 my-4">
        <div className="relative w-full md:max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un personnage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded pl-10 pr-4 py-2 w-full shadow bg-background/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              className={`px-3 py-2.5 flex items-center gap-2 rounded border text-sm ${sort === opt.key ? "bg-primary text-primary-foreground" : "bg-background/30"}`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-4 xl:grid-cols-5 gap-4 max-h-[calc(100vh-115px)] overflow-x-hidden overflow-y-auto"
      >
        {charactersPresets.length === 0 &&
          isLoading &&
          Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-150 rounded bg-background/30 animate-pulse"
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
      </div>
      {isLoading && (
        <div className="w-full text-center py-4 text-gray-500">Chargement...</div>
      )}
      {!hasMore && (
        <div className="w-full text-center py-4 text-gray-400">Fin de la liste</div>
      )}
    </PageMotion>
  );
}
