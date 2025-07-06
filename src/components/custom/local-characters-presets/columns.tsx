"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Trash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export interface RemoteCharactersPresetsList {
    body: Body;
    path: string;
    query: string;
    cookies: any[];
}

export interface Body {
    hasPrevPage: boolean;
    hasNextPage: boolean;
    rows: Row[];
}

export interface Row {
    id: string;
    createdAt: Date;
    title: string;
    tags: any[];
    user: User;
    previewUrl: string;
    dnaUrl: string;
    _count: Count;
}

export interface Count {
    characterDownloads: number;
    characterLikes: number;
}

export interface User {
    id: string;
    name: string;
    image: string;
    starCitizenHandle: string;
}

// Renommé pour correspondre au type utilisé dans columns.tsx
export interface Character {
    name: string;
    path: string;
    version: string;
}

export interface LocalCharactersResult {
    characters: Character[];
}

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
