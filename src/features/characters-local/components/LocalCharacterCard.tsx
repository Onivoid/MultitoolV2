import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Folder, FolderSync, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PresetActionModal } from "@/features/characters-local/components/PresetActionModal";
import type { CharacterRow } from "@/features/characters-local/characters.lib";
import type { LocalCharacterActions } from "@/features/characters-local/components/localCharacterActions";
import { FEATURE_CARD_WIDTH_CLASS } from "@/shared/components/pageLayout";
import { cn } from "@/lib/utils";

interface LocalCharacterCardProps {
  character: CharacterRow;
  versionOrder: string[];
  index: number;
  actions: LocalCharacterActions;
  onRefresh?: () => void;
}

export function LocalCharacterCard({
  character,
  versionOrder,
  index,
  actions,
  onRefresh,
}: LocalCharacterCardProps) {
  const [openModalOpen, setOpenModalOpen] = useState(false);

  const presentCount = character.versions.filter((v) => v.path).length;
  const totalCount = versionOrder.length;

  const modalVersions = versionOrder.map((version) => {
    const found = character.versions.find((v) => v.version === version);
    return { version, path: found?.path ?? "" };
  });

  const handleDeleteAll = async () => {
    for (const v of character.versions) {
      if (v.path) await actions.deleteCharacter(v.path);
    }
    if (onRefresh) await onRefresh();
  };

  const handleOpenConfirm = async (
    selectedVersions: { path: string; version: string }[],
  ) => {
    for (const v of selectedVersions) {
      if (v.path) await actions.openCharactersFolder(v.path);
    }
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 + index * 0.06 }}
        className={cn(
          "settings-section flex shrink-0 flex-col overflow-hidden",
          FEATURE_CARD_WIDTH_CLASS,
        )}
        data-no-window-drag
      >
        <header className="settings-section-header flex items-center justify-between gap-2 px-3 py-2 pl-3">
          <h3 className="truncate text-sm font-semibold leading-tight">
            {character.name}
          </h3>
          <Badge variant="outline" className="shrink-0 text-[11px]">
            {presentCount}/{totalCount || presentCount}
          </Badge>
        </header>

        <div className="space-y-3 px-3 py-3">
          <div className="flex flex-wrap gap-1.5">
            {versionOrder.map((version) => {
              const found = character.versions.find((v) => v.version === version);
              const exists = Boolean(found?.path);
              return (
                <span
                  key={version}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]",
                    exists
                      ? "border-primary/20 bg-primary/10 text-foreground"
                      : "border-primary/8 bg-primary/3 text-muted-foreground",
                  )}
                >
                  {exists ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <X className="h-3 w-3 opacity-60" />
                  )}
                  {version}
                </span>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              data-no-window-drag
              onClick={() => {
                const path = character.versions.find((v) => v.path)?.path;
                if (path) {
                  actions.duplicateCharacter(path, onRefresh);
                } else {
                  actions.showDuplicateError();
                }
              }}
            >
              <FolderSync className="mr-1.5 h-4 w-4" />
              Dupliquer
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              data-no-window-drag
              onClick={() => setOpenModalOpen(true)}
            >
              <Folder className="mr-1.5 h-4 w-4" />
              Ouvrir le dossier
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full"
              data-no-window-drag
              onClick={handleDeleteAll}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </motion.article>

      <PresetActionModal
        open={openModalOpen}
        onClose={() => setOpenModalOpen(false)}
        characterName={character.name}
        versions={modalVersions}
        action="open"
        onConfirm={handleOpenConfirm}
      />
    </>
  );
}
