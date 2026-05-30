import { Button } from "@/components/ui/button";
import { FolderOpen, Trash2 } from "lucide-react";

interface CacheActionsMenuProps {
  onOpenFolder: () => void;
  onClearAll: () => void;
}

export default function CacheActionsMenu({
  onOpenFolder,
  onClearAll,
}: CacheActionsMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onOpenFolder}>
        <FolderOpen className="h-4 w-4 mr-2" />
        Ouvrir le dossier
      </Button>
      <Button variant="destructive" size="sm" onClick={onClearAll}>
        <Trash2 className="h-4 w-4 mr-2" />
        Nettoyer tout
      </Button>
    </div>
  );
}
