"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Trash } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export type Folder = {
    name: string;
    weight: string;
    path: string;
};

export type CacheInfos = {
    folders: Folder[];
};

const deleteFolder = async (
    path: string,
    toast: any,
    updateCacheInfos: (path: string) => void,
) => {
    const res = await invoke("delete_folder", { path });
    if (res) {
        toast({
            title: "Dossier supprimé",
            description: `Le dossier ${path} a bien été supprimé.`,
            success: "true",
            duration: 3000,
            isClosable: true,
        });
        updateCacheInfos(path);
    } else {
        toast({
            title: "Erreur lors de la suppression",
            description: `Une erreur est survenue lors de la suppression du dossier ${path}.`,
            success: "true",
            duration: 3000,
            isClosable: true,
        });
    }
};

export const columns = (
    toast: any,
    updateCacheInfos: (path: string) => void,
): ColumnDef<Folder>[] => [
        {
            header: "Nom",
            accessorKey: "name",
        },
        {
            header: "Poids",
            accessorKey: "weight",
        },
        {
            header: " ",
            cell: ({ row }) => (
                <button
                    onClick={() =>
                        deleteFolder(row.original.path, toast, updateCacheInfos)
                    }>
                    <Trash
                        strokeWidth={3}
                        className="h-4 w-4 
                hover:text-red-500 hover:cursor-pointer"
                    />
                </button>
            ),
        },
    ];
