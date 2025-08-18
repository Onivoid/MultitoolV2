"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Trash, Folder, FolderSync, Check, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { LocalCharacter as Character } from "@/types/charactersList";
import { useState } from "react";
import { PresetActionModal } from "./PresetActionModal";
import logger from "@/utils/logger";
import { toFriendlyFsError } from "@/utils/fs-permissions";
export type { Character };

const deleteCharacter = async (
    path: string,
    toast: any
) => {
    try {
        const res = await invoke("delete_character", { path });
        if (res) {
            toast({
                title: "Personnage supprimé",
                description: `Le personnage a bien été supprimé.`,
                variant: "success",
                duration: 3000,
            });
        } else {
            throw new Error("Suppression échouée");
        }
    } catch (error) {
        const description = toFriendlyFsError(error);
        toast({
            title: "Erreur lors de la suppression",
            description,
            variant: "destructive",
            duration: 4000,
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
                variant: "success",
                duration: 3000,
            });
            // Appeler le callback de succès
            onSuccess?.();
        }
    } catch (error) {
        toast({
            title: "Erreur lors de la duplication",
            description: toFriendlyFsError(error),
            variant: "destructive",
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
        logger.log("Chemin du dossier des personnages :", folderPath);
        const res = await invoke("open_characters_folder", { path: folderPath });
        if (res) {
            toast({
                title: "Dossier ouvert",
                description: "Le dossier des personnages a bien été ouvert.",
                variant: "success",
                duration: 3000,
            });
        }
    } catch (error) {
        toast({
            title: "Erreur lors de l'ouverture",
            description: toFriendlyFsError(error),
            variant: "destructive",
            duration: 3000,
        });
    }
};

export const columns = (
    toast: any,
    refreshData?: () => void,
    availableVersions: string[] = []
): ColumnDef<{ name: string; versions: { version: string; path: string }[]; }>[] => [
        {
            header: "Nom",
            accessorKey: "name",
        },
        {
            header: "Versions du jeu",
            accessorKey: "versions",
            cell: ({ row }) => {
                const allVersions: string[] = availableVersions;
                const character = row.original;
                // Découper en groupes de 3
                const chunked = [];
                for (let i = 0; i < allVersions.length; i += 3) {
                    chunked.push(allVersions.slice(i, i + 3));
                }
                return (
                    <div className="flex gap-4">
                        {chunked.map((group, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                                {group.map((version: string) => {
                                    const found = character.versions.find(v => v.version === version);
                                    const exists = found && found.path;
                                    return (
                                        <span key={version} className="flex items-center gap-1">
                                            <span>{version}</span>
                                            {exists
                                                ? <Check className="text-green-500 h-3 w-3" />
                                                : <X className="text-red-500 h-3 w-3" />}
                                        </span>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            header: "Actions",
            id: "actions",
            cell: ({ row }) => {
                const character = row.original;
                const [modalOpen, setModalOpen] = useState<false | "delete" | "open">(false);
                const [pendingAction, setPendingAction] = useState<null | "delete" | "open">(null);

                // Action à exécuter après sélection
                const handleModalConfirm = async (selectedVersions: any) => {
                    if (pendingAction === "delete") {
                        // Supprimer le preset dans chaque version sélectionnée
                        for (const v of selectedVersions) {
                            if (v.path) await deleteCharacter(v.path, toast);
                        }
                        // Rafraîchir la liste des personnages après suppression
                        if (typeof refreshData === "function") {
                            await refreshData();
                        }
                    } else if (pendingAction === "open") {
                        for (const v of selectedVersions) {
                            if (v.path) await handleOpenCharactersFolder(v.path, toast);
                        }
                    }
                };

                return (
                    <div className="flex flex-col items-start gap-2">
                        <div className="flex flex-row-reverse items-center gap-2">
                            <span>Supprimer le personnage</span>
                            <button
                                onClick={() => {
                                    setPendingAction("delete");
                                    setModalOpen("delete");
                                }}
                                aria-label="Supprimer le personnage"
                            >
                                <Trash
                                    strokeWidth={3}
                                    className="h-4 w-4 hover:text-red-500 hover:cursor-pointer"
                                />
                            </button>
                        </div>
                        <div className="flex flex-row-reverse items-center gap-2">
                            <span>Dupliquer le personnage</span>
                            <button
                                onClick={() => {
                                    const path = character.versions.find(v => v.path)?.path;
                                    if (path) {
                                        duplicateCharacter(path, toast, refreshData);
                                    } else {
                                        toast({
                                            title: "Erreur",
                                            description: "Impossible de dupliquer : aucun chemin disponible.",
                                            success: "false",
                                            duration: 3000,
                                        });
                                    }
                                }}
                                aria-label="Dupliquer le personnage"
                            >
                                <FolderSync
                                    strokeWidth={3}
                                    className="h-4 w-4 hover:text-primary hover:cursor-pointer"
                                />
                            </button>
                        </div>
                        <div className="flex flex-row-reverse items-center gap-2">
                            <span>Ouvrir le dossier des personnages</span>
                            <button
                                onClick={() => {
                                    setPendingAction("open");
                                    setModalOpen("open");
                                }}
                                aria-label="Ouvrir le dossier des personnages"
                            >
                                <Folder
                                    strokeWidth={3}
                                    className="h-4 w-4 hover:text-primary hover:cursor-pointer"
                                />
                            </button>
                        </div>
                        <PresetActionModal
                            open={!!modalOpen}
                            onClose={() => setModalOpen(false)}
                            characterName={character.name}
                            versions={character.versions}
                            action={pendingAction === "delete" || pendingAction === "open" ? pendingAction : "open"}
                            onConfirm={handleModalConfirm}
                        />
                    </div>
                );
            },
        },
    ];
