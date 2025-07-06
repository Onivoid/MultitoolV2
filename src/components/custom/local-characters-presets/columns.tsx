"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Trash, Folder, FolderSync } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { LocalCharacter as Character } from "@/types/charactersList";
export type { Character };

const deleteCharacter = async (
    path: string,
    toast: any
) => {
    const res = await invoke("delete_character", { path });
    if (res) {
        toast({
            title: "Personnage supprimé",
            description: `Le personnage a bien été supprimé.`,
            success: "true",
            duration: 3000,
            isClosable: true,
        });
    } else {
        toast({
            title: "Erreur lors de la suppression",
            description: `Une erreur est survenue lors de la suppression du personnage.`,
            success: "true",
            duration: 3000,
            isClosable: true,
        });
    }
};

const duplicateCharacter = async (
    path: string,
    toast: any,
    onSuccess?: () => void // Ajouter un callback optionnel
) => {
    try {
        const res = await invoke("duplicate_character", { characterPath: path });
        if (res) {
            toast({
                title: "Preset dupliqué",
                description: "Le preset a été copié sur toutes les versions.",
                success: "true",
                duration: 3000,
            });
            // Appeler le callback de succès
            onSuccess?.();
        }
    } catch (error) {
        toast({
            title: "Erreur lors de la duplication",
            description: `Une erreur est survenue : ${error}`,
            success: "false",
            duration: 3000,
        });
    }
};

const handleOpenCharactersFolder = async (
    path: string,
    toast: any
) => {
    const folderPath = path.split('\\').slice(0, -1).join('\\');
    try {
        console.log("Chemin du dossier des personnages :", folderPath);
        const res = await invoke("open_characters_folder", { path: folderPath });
        if (res) {
            toast({
                title: "Dossier ouvert",
                description: "Le dossier des personnages a bien été ouvert.",
                success: "true",
                duration: 3000,
            });
        }
    } catch (error) {
        toast({
            title: "Erreur lors de l'ouverture",
            description: `Une erreur est survenue : ${error}`,
            success: "false",
            duration: 3000,
        });
    }
};

export const columns = (
    toast: any,
    updateLocalCharacters: (path: string) => void,
    refreshData?: () => void // Ajouter le paramètre de refresh
): ColumnDef<Character>[] => [
        {
            header: "Nom",
            accessorKey: "name",
        },
        {
            header: "Version du jeu",
            accessorKey: "version",
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <>
                    <button
                        onClick={() =>
                            deleteCharacter(row.original.path, toast)
                                .then(() => updateLocalCharacters(row.original.path))
                        }
                        aria-label="Supprimer le personnage"
                    >
                        <Trash
                            strokeWidth={3}
                            className="h-4 w-4 hover:text-red-500 hover:cursor-pointer"
                        />
                    </button>
                    <button
                        onClick={() =>
                            duplicateCharacter(
                                row.original.path,
                                toast,
                                refreshData
                            )
                        }
                        aria-label="Dupliquer le personnage"
                    >
                        <FolderSync
                            strokeWidth={3}
                            className="h-4 w-4 hover:text-primary hover:cursor-pointer ml-2"
                        />
                    </button>
                    <button
                        onClick={() =>
                            handleOpenCharactersFolder(row.original.path, toast)
                        }
                        aria-label="Ouvrir le dossier des personnages"
                    >
                        <Folder
                            strokeWidth={3}
                            className="h-4 w-4 hover:text-primary hover:cursor-pointer ml-2"
                        />
                    </button>
                </>
            ),
        },
    ];
