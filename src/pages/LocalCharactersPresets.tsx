import { motion } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { columns, Character } from "@/components/custom/local-characters-presets/columns";
import { DataTable } from "@/components/custom/local-characters-presets/data-table";
import { useToast } from "@/hooks/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { GamePaths, isGamePaths } from "@/types/translation";
import { LocalCharactersResult } from "@/types/charactersList";

function LocalCharactersPresets() {
    const [localCharacters, setLocalCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingDot, setLoadingDot] = useState(0);
    const [gamePaths, setGamePaths] = useState<GamePaths | null>(null);
    const { toast } = useToast();

    const scanLocalCharacters = useCallback(async (gamePath: string) => {
        console.log("scanLocalCharacters called with path:", gamePath);
        try {
            const result: LocalCharactersResult = JSON.parse(
                await invoke("get_character_informations", { path: gamePath }),
            );

            setLocalCharacters(prev => {
                const newCharacters = result.characters.filter(
                    newChar => !prev.some(existingChar => existingChar.path === newChar.path)
                );
                return [...prev, ...newCharacters];
            });

            console.log("Personnages locaux récupérés:", result.characters);
        } catch (error) {
            console.error("Erreur lors du scan du cache:", error);
            toast({
                title: "Erreur",
                description: "Impossible de récupérer les informations des personnages",
                variant: "destructive",
            });
        }
    }, [toast]);

    const updateLocalCharacters = useCallback((pathToRemove: string) => {
        setLocalCharacters(prev =>
            prev.filter(character => character.path !== pathToRemove)
        );
    }, []);

    // Fonction pour rafraîchir complètement les données
    const refreshLocalCharacters = useCallback(async () => {
        if (!gamePaths) return;

        setIsLoading(true);
        setLocalCharacters([]); // Vider les données existantes

        const paths = Object.values(gamePaths.versions)
            .map(version => version?.path)
            .filter(Boolean);

        for (const path of paths) {
            await scanLocalCharacters(path);
        }
        setIsLoading(false);
    }, [gamePaths, scanLocalCharacters]);

    // Récupération des versions de jeu au chargement
    useEffect(() => {
        const getGameVersions = async () => {
            try {
                const versions = await invoke("get_star_citizen_versions");
                if (isGamePaths(versions)) {
                    console.log("Versions du jeu reçues:", versions);
                    setGamePaths(versions);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des versions:", error);
                toast({
                    title: "Erreur",
                    description: "Impossible de récupérer les versions de Star Citizen",
                    variant: "destructive",
                });
            }
        };

        getGameVersions();
    }, [toast]);

    // Scanner le cache quand les chemins sont disponibles
    useEffect(() => {
        if (!gamePaths) return;

        const scanAllPaths = async () => {
            const paths = Object.values(gamePaths.versions)
                .map(version => version?.path)
                .filter(Boolean);

            for (const path of paths) {
                await scanLocalCharacters(path);
            }
            setIsLoading(false);
        };

        scanAllPaths();
    }, [gamePaths, scanLocalCharacters]);

    // Animation des points de chargement
    useEffect(() => {
        if (!isLoading) return;

        const interval = setInterval(() => {
            setLoadingDot(prev => prev === 3 ? 0 : prev + 1);
        }, 500);

        return () => clearInterval(interval);
    }, [isLoading]);

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
            <div className="flex items-center gap-2 mb-4">
                <h1 className="text-2xl my-5">Gestionnaire de presets de Personnages</h1>
            </div>

            <DataTable
                columns={columns(toast, updateLocalCharacters, refreshLocalCharacters)}
                data={localCharacters}
            />
        </motion.div>
    );
}

export default LocalCharactersPresets;
