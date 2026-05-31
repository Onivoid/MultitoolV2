import { FileDown, Loader2, Play, RefreshCw, Square, FolderSync } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BlueprintsImportProgressDisplay } from "@/features/blueprints/components/BlueprintsImportProgressDisplay";
import type { GamelogWatcherStatus } from "@/features/blueprints/blueprints.service";
import type { BlueprintsImportProgress } from "@/features/blueprints/blueprints.import.types";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BlueprintsStatusPanelProps {
  status: GamelogWatcherStatus | null;
  watching: boolean;
  blueprintCount: number;
  isRefreshing: boolean;
  isLoading: boolean;
  isImporting: boolean;
  importProgress: BlueprintsImportProgress | null;
  importStartedAt: number | null;
  isExporting: boolean;
  isTogglingWatch: boolean;
  onRefresh: () => void;
  onImportHistory: () => void;
  onExport: () => void;
  onStartWatch: () => void;
  onStopWatch: () => void;
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant = "outline",
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "outline" | "destructive" | "default";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={cn(
        "h-9 shrink-0 gap-1.5 px-3 text-xs font-medium shadow-none sm:text-sm",
        variant === "outline" &&
          "border-primary/20 bg-primary/10 text-foreground hover:bg-primary/20",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      data-no-window-drag
    >
      {children}
      {label}
    </Button>
  );
}

export function BlueprintsStatusPanel({
  status,
  watching,
  blueprintCount,
  isRefreshing,
  isLoading,
  isImporting,
  importProgress,
  importStartedAt,
  isExporting,
  isTogglingWatch,
  onRefresh,
  onImportHistory,
  onExport,
  onStartWatch,
  onStopWatch,
}: BlueprintsStatusPanelProps) {
  const logPath = status?.logPath;

  return (
    <section
      className="settings-section mb-3 flex flex-col gap-3 overflow-hidden p-3 lg:flex-row lg:items-center lg:justify-between"
      data-no-window-drag
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge
              variant={watching ? "default" : "secondary"}
              className="gap-1.5 px-2.5 py-1 text-xs font-medium"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  watching
                    ? "bg-primary-foreground animate-pulse"
                    : "bg-muted-foreground/60",
                )}
                aria-hidden
              />
              {watching ? "Surveillance active" : "Surveillance arrêtée"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {blueprintCount} schéma{blueprintCount !== 1 ? "s" : ""}
            </span>
          </div>
        </TooltipTrigger>
        {logPath && (
          <TooltipContent side="bottom" className="max-w-sm font-mono text-[11px]">
            {logPath}
          </TooltipContent>
        )}
      </Tooltip>

      {isImporting && (
        <BlueprintsImportProgressDisplay
          isImporting={isImporting}
          progress={importProgress}
          operationStartedAt={importStartedAt}
          className="w-full lg:max-w-md"
        />
      )}

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <ActionButton
          label="Rafraîchir"
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw
            className={cn("h-4 w-4 shrink-0", isRefreshing && "animate-spin")}
          />
        </ActionButton>

        <ActionButton
          label="Synchroniser"
          onClick={onImportHistory}
          disabled={isImporting || isLoading}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <FolderSync className="h-4 w-4 shrink-0" />
          )}
        </ActionButton>

        <ActionButton
          label="Exporter"
          onClick={onExport}
          disabled={isExporting || isLoading || blueprintCount === 0}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 shrink-0" />
          )}
        </ActionButton>

        {watching ? (
          <ActionButton
            label="Arrêter"
            onClick={onStopWatch}
            disabled={isTogglingWatch}
            variant="destructive"
          >
            <Square className="h-4 w-4 shrink-0" />
          </ActionButton>
        ) : (
          <ActionButton
            label="Démarrer"
            onClick={onStartWatch}
            disabled={isTogglingWatch}
            variant="default"
          >
            <Play className="h-4 w-4 shrink-0" />
          </ActionButton>
        )}
      </div>
    </section>
  );
}
