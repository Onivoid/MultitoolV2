import { ExternalLink, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HangarExecStatus } from "@/features/hangar-exec/hangarExec.types";
import { formatCountdown } from "@/features/hangar-exec/hangarExec.lib";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { cn } from "@/lib/utils";

interface HangarExecToolbarProps {
  status: HangarExecStatus | null;
}

export function HangarExecToolbar({ status }: HangarExecToolbarProps) {
  const isOnline = status?.status === "ONLINE";

  return (
    <section
      className="settings-section mb-3 flex shrink-0 flex-col gap-3 overflow-hidden p-3"
      data-no-window-drag
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-medium">
            <Radio className="h-3.5 w-3.5 text-primary" />
            PYAM Executive
          </Badge>
          <span className="text-xs text-muted-foreground sm:text-sm">
            Hangars exécutifs Pyro · minuteurs terminaux
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-primary/20 bg-primary/10 text-xs"
          onClick={() => void openExternalUrl("https://exec.xyxyll.com/")}
          data-no-window-drag
        >
          <ExternalLink className="h-3.5 w-3.5" />
          exec.xyxyll.com
        </Button>
      </div>

      {status && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-primary/15 bg-primary/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-2.5 w-2.5 rounded-full",
                isOnline ? "bg-emerald-400" : "bg-red-400",
              )}
            />
            <span className="text-sm font-semibold">
              {isOnline ? "Hangars en ligne" : "Hangars hors ligne"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Prochain changement dans{" "}
            <span className="font-mono tabular-nums text-foreground">
              {formatCountdown(status.secondsRemaining)}
            </span>
            {status.cycleNumber > 0 && (
              <span className="ml-2">· Cycle {status.cycleNumber}</span>
            )}
          </span>
          {(status.versionLabel || status.lastModified) && (
            <span className="text-[11px] text-muted-foreground">
              {status.lastModified && `MAJ ${status.lastModified}`}
              {status.versionLabel && ` · Patch ${status.versionLabel}`}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
