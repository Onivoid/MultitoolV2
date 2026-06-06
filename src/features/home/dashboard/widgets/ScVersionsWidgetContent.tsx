import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { cn } from "@/lib/utils";

type GameUpdateStatus = "upToDate" | "outdated" | "unknown";

interface VersionInfo {
  path: string;
  upToDate: boolean;
  gameUpdateStatus: GameUpdateStatus;
  releaseVersion?: string | null;
  buildNumber?: string | null;
  gameVersion?: string | null;
  branch?: string | null;
}

interface VersionPaths {
  versions: Record<string, VersionInfo>;
}

function formatInstalledVersion(info: VersionInfo): string | null {
  return info.gameVersion ?? info.releaseVersion ?? info.buildNumber ?? null;
}

function GameUpdateBadge({ status }: { status: GameUpdateStatus }) {
  if (status === "upToDate") {
    return (
      <Badge
        variant="default"
        className="h-5 shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-400"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        À jour
      </Badge>
    );
  }

  if (status === "outdated") {
    return (
      <Badge
        variant="secondary"
        className="h-5 shrink-0 gap-1 border-amber-500/30 bg-amber-500/15 px-1.5 text-[10px] text-amber-400"
      >
        <AlertCircle className="h-3 w-3" aria-hidden />
        Maj dispo
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="h-5 shrink-0 gap-1 px-1.5 text-[10px] text-muted-foreground"
    >
      <HelpCircle className="h-3 w-3" aria-hidden />
      Inconnu
    </Badge>
  );
}

export function ScVersionsWidgetContent() {
  const [paths, setPaths] = useState<VersionPaths | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await invokeCommand<VersionPaths>(
          TAURI_COMMANDS.getStarCitizenVersions,
        );
        if (!cancelled) setPaths(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="px-3 py-2 text-ui-caption text-destructive">{error}</p>;
  }

  const entries = Object.entries(paths?.versions ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  if (entries.length === 0) {
    return (
      <p className="px-3 py-3 text-ui-caption leading-relaxed text-muted-foreground">
        Aucune installation Star Citizen détectée.
      </p>
    );
  }

  return (
    <div data-no-window-drag>
      <ul className="max-h-[120px] overflow-y-auto">
        {entries.map(([channel, info]) => {
          const installed = formatInstalledVersion(info);
          const latest = info.releaseVersion;
          const showLatestHint =
            info.gameUpdateStatus === "outdated" && latest && installed !== latest;

          return (
            <li
              key={channel}
              className="flex items-center gap-2 border-b border-primary/6 px-3 py-2 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-ui-secondary truncate font-medium">{channel}</p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-[10px] leading-tight text-muted-foreground",
                    info.gameUpdateStatus === "upToDate" && "text-foreground/70",
                  )}
                >
                  {installed ? `Installé : ${installed}` : "Version installée inconnue"}
                  {showLatestHint ? ` → ${latest}` : null}
                </p>
              </div>
              <GameUpdateBadge status={info.gameUpdateStatus} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
