"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Trash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { LocalCharacter as Character } from "@/types/charactersList";
export type { Character };

const deleteCharacter = async (
    path: string,
    toast: any,
    updateCacheInfos: (path: string) => void,
) => {
    const res = await invoke("delete_character", { path });
    if (res) {
        toast({
            title: "Personnage supprimé",
            description: `Le personnage a bien été supprimé.`,
            success: true,
            duration: 3000,
            isClosable: true,
        });
        updateCacheInfos(path);
    } else {
        toast({
            title: "Erreur lors de la suppression",
            description: `Une erreur est survenue lors de la suppression du personnage.`,
            success: false,
            duration: 3000,
            isClosable: true,
        });
    }
};

export const columns = (
    toast: any,
    updateCacheInfos: (path: string) => void,
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
        header: "Chemin",
        accessorKey: "path",
    },
    {
        header: " ",
        cell: ({ row }) => (
            <button
                onClick={() =>
                    deleteCharacter(row.original.path, toast, updateCacheInfos)
                }
                aria-label="Supprimer le personnage"
            >
                <Trash
                    strokeWidth={3}
                    className="h-4 w-4 hover:text-red-500 hover:cursor-pointer"
                />
            </button>
        ),
    },
];
