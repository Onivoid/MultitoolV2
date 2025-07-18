import { motion } from 'framer-motion';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { columns } from "@/components/custom/local-characters-presets/columns";
import { DataTable } from "@/components/custom/local-characters-presets/data-table";
import { useToast } from "@/hooks/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { GamePaths, isGamePaths } from "@/types/translation";
import { LocalCharactersResult } from "@/types/charactersList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function LocalCharactersPresets() {
    // Nouvelle structure : chaque personnage a une liste de versions et chemins associés
    type CharacterRow = {
        name: string;
        versions: { version: string; path: string }[];
        // Ajoute d'autres propriétés si besoin (ex: description, etc.)
    };
    const [localCharacters, setLocalCharacters] = useState<CharacterRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingDot, setLoadingDot] = useState(0);
    const [gamePaths, setGamePaths] = useState<GamePaths | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<string>("all"); // Nouveau state
    const { toast } = useToast();

    // On regroupe les personnages par identifiant unique (ex: path ou name)
    // Regroupe les personnages par nom et stocke les versions et chemins
    const scanLocalCharacters = useCallback(async (gamePath: string) => {
        try {
            const result: LocalCharactersResult = JSON.parse(
                await invoke("get_character_informations", { path: gamePath }),
            );

            setLocalCharacters(prev => {
                // Récupère toutes les versions connues
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
                // Ajoute les nouveaux
                result.characters.forEach(newChar => {
                    const key = newChar.name;
                    if (!map.has(key)) {
                        // Crée la structure avec toutes les versions, path vide
                        map.set(key, {
                            name: newChar.name,
                            versions: allVersions.map(version => ({
                                version,
                                path: version === newChar.version ? newChar.path : ""
                            }))
                        });
                    } else {
                        // Met à jour le path pour la version correspondante
                        const existing = map.get(key)!;
                        const idx = existing.versions.findIndex(v => v.version === newChar.version);
                        if (idx !== -1) {
                            // Si le path est vide, on le remplit
                            if (!existing.versions[idx].path) {
                                existing.versions[idx].path = newChar.path;
                            }
                        }
                    }
                });
                return Array.from(map.values());
            });
        } catch (error) {
            console.error("Erreur lors du scan du cache:", error);
            toast({
                title: "Erreur",
                description: "Impossible de récupérer les informations des personnages",
                variant: "destructive",
            });
        }
    }, [toast, gamePaths]);

    // Fonction pour rafraîchir complètement les données
    const refreshLocalCharacters = useCallback(async () => {
        if (!gamePaths) return;

        setIsLoading(true);
        setLocalCharacters([]); // Vider les données existantes

        const entries = Object.entries(gamePaths.versions)
            .filter(([_, version]) => version?.path)
            .map(([versionName, version]) => ({ versionName, path: version!.path }));

        await Promise.all(entries.map(({ path }) => scanLocalCharacters(path)));
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
            const entries = Object.entries(gamePaths.versions)
                .filter(([_, version]) => version?.path)
                .map(([versionName, version]) => ({ versionName, path: version!.path }));

            for (const { path } of entries) {
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

    // Filtrer les données selon la version sélectionnée
    const filteredCharacters = useMemo(() => {
        if (selectedVersion === "all") return localCharacters;
        return localCharacters.filter(character =>
            character.versions.some(v => v.version === selectedVersion)
        );
    }, [localCharacters, selectedVersion]);

    // Obtenir la liste des versions disponibles
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
            <div className="flex items-center gap-2 mb-4">
                <h1 className="text-2xl mt-5">Gestionnaire de presets de Personnages</h1>
            </div>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="w-48 mb-2 bg-background/50">
                    <SelectValue placeholder="Filtrer par version" />
                </SelectTrigger>
                <SelectContent className='bg-background/90'>
                    <SelectItem value="all">Toutes les versions</SelectItem>
                    {availableVersions.map(version => (
                        <SelectItem key={version} value={version}>
                            {version}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <DataTable
                columns={columns(toast, refreshLocalCharacters, availableVersions)}
                data={filteredCharacters} // Utiliser les données filtrées
            />
        </motion.div>
    );
}

export default LocalCharactersPresets;
