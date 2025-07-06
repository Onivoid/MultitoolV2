import { motion } from 'framer-motion';
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { RemoteCharactersPresetsList, Row } from "@/types/charactersList";
import { CharacterCard } from '@/components/custom/character-card';

function CharactersPresetsList() {
    const [charactersPresets, setCharactersPresets] = useState<Row[] | null>(null);
    const isFirstRender = useRef(true);

    const getCharacters = useCallback(async (page?: number, order_type?: string) => {
        if (!page) page = 1;
        if (!order_type) order_type = "download";

        try {
            const result: RemoteCharactersPresetsList = await invoke("get_characters", {
                page: page,
                orderType: order_type,
            });
            console.log("RESULT : Fetching characters presets...");
            console.log(result);
            setCharactersPresets(result.body.rows);
        } catch (error) {
            console.error("Error fetching characters presets:", error);
        }
    }, []); // Dépend uniquement de isLoading

    useEffect(() => {
        if (!charactersPresets && isFirstRender.current) {
            isFirstRender.current = false;
            console.log("START : Fetching characters presets...");
            getCharacters();
        } else if (charactersPresets) {
            console.log("END : Fetching characters presets...");
            console.log(charactersPresets);
        }
    }, [charactersPresets, getCharacters]);

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
            { charactersPresets ? (
                <div className="grid grid-cols-3 xl:grid-cols-5 gap-4 max-h-[calc(100vh-50px)] overflow-x-hidden">
                    {charactersPresets.map((character, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.2*index,
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
                    ))}
                </div>
            ) : null}
        </motion.div>
    );
}

export default CharactersPresetsList;
