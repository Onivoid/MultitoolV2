import { motion } from 'framer-motion';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { columns } from "@/components/custom/local-characters-presets/columns";
import { DataTable } from "@/components/custom/local-characters-presets/data-table";
import { useToast } from "@/hooks/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { GamePaths, isGamePaths } from "@/types/translation";
import { LocalCharactersResult } from "@/types/charactersList";
import logger from "@/utils/logger";
import { isProtectedPath } from "@/utils/fs-permissions";
import PageHeader from '@/components/custom/PageHeader';
import { IconUsers } from '@tabler/icons-react';

/**
 * Page de gestion des presets de personnages locaux.
 * Permet de visualiser, dupliquer et gérer les personnages sauvegardés entre différentes versions du jeu.
 */
function LocalCharactersPresets() {
    type CharacterRow = {
        name: string;
        versions: { version: string; path: string }[];
    };
    const [localCharacters, setLocalCharacters] = useState<CharacterRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingDot, setLoadingDot] = useState(0);
    const [gamePaths, setGamePaths] = useState<GamePaths | null>(null);
    const { toast } = useToast();

    // On regroupe les personnages par identifiant unique (ex: path ou name)
    // Regroupe les personnages par nom et stocke les versions et chemins
    const scanLocalCharacters = useCallback(async (gamePath: string) => {
        try {
            const result: LocalCharactersResult = JSON.parse(
                await invoke("get_character_informations", { path: gamePath }),
            );

            setLocalCharacters(prev => {
                const allVersions = Object.keys(gamePaths?.versions || {});
                const map = new Map<string, CharacterRow>();
                // Ajoute les anciens
                prev.forEach(char => {
                    // On clone pour ne pas muter l'état
                    map.set(char.name, {
                        name: char.name,
                        versions: [...char.versions],
                    });
                });
                result.characters.forEach(newChar => {
                    const key = newChar.name;
                    if (!map.has(key)) {
                        map.set(key, {
                            name: newChar.name,
                            versions: allVersions.map(version => ({
                                version,
                                path: version === newChar.version ? newChar.path : ""
                            }))
                        });
                    } else {
                        const existing = map.get(key)!;
                        const idx = existing.versions.findIndex(v => v.version === newChar.version);
                        if (idx !== -1) {
                            if (!existing.versions[idx].path) {
                                existing.versions[idx].path = newChar.path;
                            }
                        }
                    }
                });
                return Array.from(map.values());
            });
        } catch (error) {
            /**
             * Affiche un toast d'erreur si la récupération des informations des personnages échoue.
             */
            toast({
                title: "Erreur",
                description: "Impossible de récupérer les informations des personnages",
                variant: "destructive",
            });
        }
    }, [toast, gamePaths]);

    /**
     * Fonction pour rafraîchir complètement les données.
     * @async
     */
    const refreshLocalCharacters = useCallback(async () => {
        if (!gamePaths) return;

        setIsLoading(true);
        setLocalCharacters([]);

        const entries = Object.entries(gamePaths.versions)
            .filter(([_, version]) => version?.path)
            .map(([versionName, version]) => ({ versionName, path: version!.path }));

        await Promise.all(entries.map(({ path }) => scanLocalCharacters(path)));
        setIsLoading(false);
    }, [gamePaths, scanLocalCharacters]);

    useEffect(() => {
        const getGameVersions = async () => {
            try {
                const versions = await invoke("get_star_citizen_versions");
                if (isGamePaths(versions)) {
                    logger.log("Versions du jeu reçues:", versions);
                    setGamePaths(versions);
                }
            } catch (error) {
                logger.error("Erreur lors de la récupération des versions:", error);
                toast({
                    title: "Erreur",
                    description: "Impossible de récupérer les versions de Star Citizen",
                    variant: "destructive",
                });
            }
        };

        getGameVersions();
    }, [toast]);

    useEffect(() => {
        if (!gamePaths) return;

        const scanAllPaths = async () => {
            const entries = Object.entries(gamePaths.versions)
                .filter(([_, version]) => version?.path)
                .map(([versionName, version]) => ({ versionName, path: version!.path }));

            for (const { path } of entries) {
                if (isProtectedPath(path)) {
                    toast({
                        title: "Chemin protégé",
                        description: "Le jeu est dans Program Files. En cas d'erreur, relancez en administrateur ou installez-le ailleurs.",
                        variant: "warning",
                        duration: 4000,
                    });
                }
                await scanLocalCharacters(path);
            }
            setIsLoading(false);
        };
        scanAllPaths();
    }, [gamePaths, scanLocalCharacters]);

    useEffect(() => {
        if (!isLoading) return;

        const interval = setInterval(() => {
            setLoadingDot(prev => prev === 3 ? 0 : prev + 1);
        }, 500);

        return () => clearInterval(interval);
    }, [isLoading]);

    const availableVersions = useMemo(() => {
        const versions = localCharacters.flatMap(char => char.versions.map(v => v.version));
        return Array.from(new Set(versions)).sort();
    }, [localCharacters]);


    if (!gamePaths) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Recherche des installations de Star Citizen...</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>
                    Récupération des données{" "}
                    {Array.from({ length: loadingDot }).map((_, i) => (
                        <span key={i}>.</span>
                    ))}
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0, 0.71, 0.2, 1.01],
            }}
            className="flex flex-col w-full max-h-[calc(100vh-50px)]"
        >
            <PageHeader
                icon={<IconUsers className="h-6 w-6" />}
                title="Gestionnaire de presets de Personnages"
                description="Gérez vos presets de personnages locaux"
            />

            <DataTable
                columns={columns(toast, refreshLocalCharacters, availableVersions)}
                data={localCharacters} // Utiliser les données filtrées
            />
        </motion.div>
    );
}

export default LocalCharactersPresets;
