import { motion } from "framer-motion";
import { HardDrive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CacheFolder } from "@/features/cache/cache.service";

interface CacheFolderCardProps {
  folder: CacheFolder;
  index: number;
  onDelete: (path: string) => void;
}

export function CacheFolderCard({ folder, index, onDelete }: CacheFolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.06 + index * 0.04 }}
      className="settings-section flex items-center gap-3 overflow-hidden px-3 py-2.5"
      data-no-window-drag
    >
      <HardDrive className="h-4 w-4 shrink-0 text-primary/80" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{folder.name}</p>
        <p className="text-xs text-muted-foreground">{folder.weight}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        data-no-window-drag
        aria-label={`Supprimer ${folder.name}`}
        onClick={() => onDelete(folder.path)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
