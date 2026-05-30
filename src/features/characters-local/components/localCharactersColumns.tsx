"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Trash, Folder, FolderSync, Check, X } from "lucide-react";
import { PresetActionModal } from "@/features/characters-local/components/PresetActionModal";
import type { CharacterRow } from "@/features/characters-local/characters.lib";

export interface LocalCharacterActions {
  deleteCharacter: (path: string) => Promise<boolean>;
  duplicateCharacter: (path: string, onSuccess?: () => void) => Promise<void>;
  openCharactersFolder: (path: string) => Promise<void>;
  showDuplicateError: () => void;
}

export function buildLocalCharactersColumns(
  actions: LocalCharacterActions,
  refreshData?: () => void,
  availableVersions: string[] = [],
): ColumnDef<CharacterRow>[] {
  return [
    { header: "Nom", accessorKey: "name" },
    {
      header: "Versions du jeu",
      accessorKey: "versions",
      cell: ({ row }) => {
        const character = row.original;
        const chunked: string[][] = [];
        for (let i = 0; i < availableVersions.length; i += 3) {
          chunked.push(availableVersions.slice(i, i + 3));
        }
        return (
          <div className="flex gap-4">
            {chunked.map((group, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                {group.map((version) => {
                  const found = character.versions.find((v) => v.version === version);
                  const exists = found && found.path;
                  return (
                    <span key={version} className="flex items-center gap-1">
                      <span>{version}</span>
                      {exists ? (
                        <Check className="text-green-500 h-3 w-3" />
                      ) : (
                        <X className="text-red-500 h-3 w-3" />
                      )}
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
        const [pendingAction, setPendingAction] = useState<null | "delete" | "open">(
          null,
        );

        const handleModalConfirm = async (
          selectedVersions: { path: string }[],
        ) => {
          if (pendingAction === "delete") {
            for (const v of selectedVersions) {
              if (v.path) await actions.deleteCharacter(v.path);
            }
            if (refreshData) await refreshData();
          } else if (pendingAction === "open") {
            for (const v of selectedVersions) {
              if (v.path) await actions.openCharactersFolder(v.path);
            }
          }
        };

        return (
          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-row-reverse items-center gap-2">
              <span>Supprimer le personnage</span>
              <button
                type="button"
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
                type="button"
                onClick={() => {
                  const path = character.versions.find((v) => v.path)?.path;
                  if (path) {
                    actions.duplicateCharacter(path, refreshData);
                  } else {
                    actions.showDuplicateError();
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
                type="button"
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
              action={
                pendingAction === "delete" || pendingAction === "open"
                  ? pendingAction
                  : "open"
              }
              onConfirm={handleModalConfirm}
            />
          </div>
        );
      },
    },
  ];
}
