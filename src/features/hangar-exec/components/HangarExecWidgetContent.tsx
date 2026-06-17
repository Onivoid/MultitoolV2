import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { hangarExecService } from "@/features/hangar-exec/hangarExec.service";
import { formatCountdown } from "@/features/hangar-exec/hangarExec.lib";
import type { HangarExecStatus } from "@/features/hangar-exec/hangarExec.types";
import { cn } from "@/lib/utils";

export function HangarExecWidgetContent() {
  const [status, setStatus] = useState<HangarExecStatus | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await hangarExecService.fetchStatus();
        if (!cancelled) {
          setStatus(response.status);
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
    const id = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
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

  if (!status) return null;

  const endsAt = new Date(status.nextChangeAt).getTime();
  const secondsRemaining = Math.max(0, Math.floor((endsAt - nowMs) / 1000));
  const isOnline = status.status === "ONLINE";

  return (
    <div className="px-3 py-3" data-no-window-drag>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-2 w-2 rounded-full",
            isOnline ? "bg-emerald-400" : "bg-red-400",
          )}
        />
        <span className="text-ui-secondary font-medium">
          {isOnline ? "PYAM en ligne" : "PYAM hors ligne"}
        </span>
      </div>
      <p className="text-ui-caption text-muted-foreground">
        Changement dans{" "}
        <span className="font-mono tabular-nums text-foreground">
          {formatCountdown(secondsRemaining)}
        </span>
      </p>
    </div>
  );
}
