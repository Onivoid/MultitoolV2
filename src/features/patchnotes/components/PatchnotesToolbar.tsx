import { Github, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PATCHNOTES_GITHUB_URL,
  PATCHNOTES_REPO,
} from "@/features/patchnotes/patchnotes.lib";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { cn } from "@/lib/utils";

interface PatchnotesToolbarProps {
  releaseCount: number;
  isRefreshing: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export function PatchnotesToolbar({
  releaseCount,
  isRefreshing,
  isLoading,
  onRefresh,
}: PatchnotesToolbarProps) {
  return (
    <section
      className="settings-section mb-3 flex shrink-0 flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:items-center sm:justify-between"
      data-no-window-drag
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-medium">
          <Github className="h-3.5 w-3.5 text-primary" />
          {PATCHNOTES_REPO.owner}/{PATCHNOTES_REPO.name}
        </Badge>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Historique des versions publiées
          {releaseCount > 0 && (
            <span className="text-foreground/80">
              {" "}
              · {releaseCount} entrée{releaseCount > 1 ? "s" : ""}
            </span>
          )}
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 border-primary/20 bg-primary/10 px-3 text-xs font-medium shadow-none sm:text-sm"
          onClick={() => openExternalUrl(PATCHNOTES_GITHUB_URL)}
          data-no-window-drag
        >
          <Github className="h-4 w-4 shrink-0" />
          Voir sur GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 border-primary/20 bg-primary/10 px-3 text-xs font-medium shadow-none sm:text-sm"
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          data-no-window-drag
        >
          <RefreshCw
            className={cn("h-4 w-4 shrink-0", isRefreshing && "animate-spin")}
          />
          Rafraîchir
        </Button>
      </div>
    </section>
  );
}
