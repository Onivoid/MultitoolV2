import { motion } from 'framer-motion';
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { RemoteCharactersPresetsList, Row } from "@/types/charactersList";
import { CharacterCard } from '@/components/custom/character-card';

function CharactersPresetsList() {
    const { toast } = useToast();
    const [charactersPresets, setCharactersPresets] = useState<Row[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const hasInitialized = useRef(false);
    const [hasMore, setHasMore] = useState(true);
    const orderType = useRef<string>("download");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const lastSearchTerm = useRef<string>("");

    const getCharacters = useCallback(
        async (nextPage?: number, newSearchTerm?: string) => {
            if (isLoading || !hasMore) return;
            setIsLoading(true);
            const pageToFetch = nextPage || page;
            const search = typeof newSearchTerm === "string" ? newSearchTerm : debouncedSearch;
            try {
                const result: RemoteCharactersPresetsList = await invoke("get_characters", {
                    page: pageToFetch,
                    orderType: orderType.current,
                    search: search && search.length > 0 ? search : undefined,
                });
                console.log("RESULT : Fetching characters presets...");
                console.log(result);
                const newRows = result.body.rows;
                if (newRows.length === 0) {
                    setHasMore(false);
                } else {
                    setCharactersPresets(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        const filtered = newRows.filter(c => !existingIds.has(c.id));
                        return [...prev, ...filtered];
                    });
                    setPage(pageToFetch + 1);
                }
            } catch (error) {
                console.error("Error fetching characters presets:", error);
                toast({
                    title: "Erreur de chargement",
                    description: "Impossible de récupérer les personnages. Veuillez réessayer plus tard.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [hasMore, page, debouncedSearch]
    );
    // Debounce de la recherche
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400);
        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    // Initial fetch ou changement de filtre
    useEffect(() => {
        // Refactor de la condition complexe pour plus de lisibilité
        const isInitialLoad = !hasInitialized.current && charactersPresets.length === 0 && !isLoading;
        const isSearchChanged = lastSearchTerm.current !== debouncedSearch;
        const isSearchCleared = debouncedSearch === "" && lastSearchTerm.current !== "";
        if (isInitialLoad || isSearchChanged || isSearchCleared) {
            hasInitialized.current = true;
            lastSearchTerm.current = debouncedSearch;
            setCharactersPresets([]);
            setPage(1);
            setHasMore(true);
            getCharacters(1, debouncedSearch);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const gridRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleScroll = () => {
            const el = gridRef.current;
            if (!el || isLoading || !hasMore) return;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
                getCharacters();
            }
        };
        const el = gridRef.current;
        if (el) {
            el.addEventListener("scroll", handleScroll);
        }
        return () => {
            if (el) el.removeEventListener("scroll", handleScroll);
        };
    }, [getCharacters, hasMore, isLoading]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01],
            }}
            className="flex w-full flex-col"
        >
            {/* Barre de recherche */}
            <div className="w-full flex justify-center items-center my-4">
                <input
                    type="text"
                    placeholder="Rechercher un personnage..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border rounded px-4 py-2 w-full max-w-md shadow bg-background/30"
                />
            </div>
            <div
                ref={gridRef}
                className="grid grid-cols-3 xl:grid-cols-5 gap-4 max-h-[calc(100vh-115px)] overflow-x-hidden overflow-y-auto"
            >
                {charactersPresets.map((character, index) => {
                    // On réinitialise le delay à chaque batch de 12
                    const batchSize = 12;
                    const batchIndex = index % batchSize;
                    return (
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.2 * batchIndex,
                                ease: [0, 0.71, 0.2, 1.01],
                            }}
                            className="flex w-full flex-col"
                            key={index}
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
        </motion.div>
    );
}

export default CharactersPresetsList;
