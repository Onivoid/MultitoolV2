import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { invokeCommand } from "@/shared/api/tauriClient";
import { TAURI_COMMANDS } from "@/shared/api/commands";
import { openExternalUrl } from "@/shared/lib/openExternal";
import { cn } from "@/lib/utils";

interface RsiSystemStatus {
  name: string;
  status: string;
  category: string;
}

interface RsiStatusFeed {
  overall: string;
  systems: RsiSystemStatus[];
}

const OVERALL_LABEL: Record<string, string> = {
  operational: "Opérationnel",
  maintenance: "Maintenance",
  degraded: "Dégradé",
  partial: "Partiel",
  major: "Incident majeur",
};

function overallClass(status: string): string {
  if (status === "operational") return "text-emerald-300";
  if (status === "maintenance") return "text-amber-300";
  return "text-red-300";
}

export function RsiStatusWidgetContent() {
  const [feed, setFeed] = useState<RsiStatusFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await invokeCommand<string>(TAURI_COMMANDS.fetchRsiStatusFeed);
        if (!cancelled) {
          setFeed(JSON.parse(raw) as RsiStatusFeed);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-3 py-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="px-3 py-2 text-ui-caption text-destructive">{error}</p>;
  }

  if (!feed) return null;

  const overall = feed.overall ?? "operational";
  const systems = (feed.systems ?? []).slice(0, 5);

  return (
    <div className="px-3 py-3" data-no-window-drag>
      <button
        type="button"
        className="text-ui-secondary mb-2 flex w-full items-center gap-2 text-left font-medium hover:underline"
        onClick={() =>
          void openExternalUrl("https://status.robertsspaceindustries.com/")
        }
      >
        {overall === "operational" ? (
          <CheckCircle2 className={cn("h-4 w-4", overallClass(overall))} />
        ) : (
          <AlertTriangle className={cn("h-4 w-4", overallClass(overall))} />
        )}
        <span className={overallClass(overall)}>
          {OVERALL_LABEL[overall] ?? overall}
        </span>
      </button>
      <ul className="space-y-1">
        {systems.map((s) => (
          <li
            key={s.name}
            className="text-ui-caption flex items-center justify-between gap-2 text-muted-foreground"
          >
            <span className="truncate">{s.name}</span>
            <span className={cn("shrink-0 tabular-nums", overallClass(s.status))}>
              {OVERALL_LABEL[s.status] ?? s.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
