import { motion } from 'framer-motion';
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { RemoteCharactersPresetsList, Row } from "@/types/charactersList";
import { CharacterCard } from '@/components/custom/character-card';
import logger from "@/utils/logger";
import { IconClock, IconDownload, IconHeart, IconSearch } from '@tabler/icons-react';

function CharactersPresetsList() {
    const { toast } = useToast();
    const [charactersPresets, setCharactersPresets] = useState<Row[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const hasInitialized = useRef(false);
    const [hasMore, setHasMore] = useState(true);
    const [sort, setSort] = useState<"latest" | "download">("latest");
    const orderRef = useRef<"latest" | "download">("latest");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const lastSearchTerm = useRef<string>("");

    const getCharacters = useCallback(
        async (
            nextPage?: number,
            newSearchTerm?: string,
            force = false
        ) => {
            if ((isLoading && !force) || !hasMore) return;
            setIsLoading(true);
            const pageToFetch = nextPage || page;
            const search = typeof newSearchTerm === "string" ? newSearchTerm : debouncedSearch;
            const orderToUse = orderRef.current;
            try {
                const result: any = await invoke("get_characters", {
                    page: pageToFetch,
                    orderType: orderRef.current,
                    search: search && search.length > 0 ? search : undefined,
                });
                logger.log('ORDER USED =>', orderToUse);
                logger.log("RESULT : Fetching characters presets...");
                logger.log(result);
                if (result?.tauriDebug) {
                    logger.log('TAURI DEBUG =>', result.tauriDebug);
                }
                const newRows = (result as RemoteCharactersPresetsList).body.rows;
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
                logger.error("Error fetching characters presets:", error);
                toast({
                    title: "Erreur de chargement",
                    description: "Impossible de récupérer les personnages. Veuillez réessayer plus tard.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [hasMore, page, debouncedSearch, isLoading]
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
            {/* Description d'en-tête */}
            <div className="flex flex-row my-4 gap-2">
                <div className="p-4 bg-primary/50 rounded-xl">
                    <IconDownload className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                    <p className="text-2xl font-bold">Personnages en Ligne</p>
                    <p className="text-muted-foreground">Liste de personnages téléchargeables, par la communauté de SC Characters</p>
                </div>
            </div>

            {/* Barre de recherche + Tri */}
            <div className="w-full flex flex-col md:flex-row md:items-center gap-3 my-4">
                <div className="relative w-full md:max-w-md">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher un personnage..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="border rounded pl-10 pr-4 py-2 w-full shadow bg-background/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {[
                        { key: 'latest' as const, label: 'Récents', icon: <IconClock size={20} /> },
                        { key: 'download' as const, label: 'Populaires', icon: <IconHeart size={20} /> },
                    ].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => {
                                orderRef.current = opt.key;
                                setSort(opt.key);
                                setCharactersPresets([]);
                                setPage(1);
                                setHasMore(true);
                                // Forcer la requête même si un chargement était en cours
                                getCharacters(1, debouncedSearch, true);
                            }}
                            className={`px-3 py-2.5 flex items-center gap-2 rounded border text-sm ${sort === opt.key ? 'bg-primary text-primary-foreground' : 'bg-background/30'}`}
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
                {charactersPresets.length === 0 && isLoading && Array.from({ length: 12 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="h-150 rounded bg-background/30 animate-pulse" />
                ))}
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
