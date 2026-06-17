import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { hangarExecService } from "@/features/hangar-exec/hangarExec.service";
import type {
  HangarExecStatusResponse,
  HangarExecTimersResponse,
  HangarTerminalPreset,
  HangarTerminalTimer,
} from "@/features/hangar-exec/hangarExec.types";
import logger from "@/utils/logger";
import { toastError, toastSuccess } from "@/shared/lib/toastHelpers";

export function useHangarExec() {
  const [statusResponse, setStatusResponse] = useState<HangarExecStatusResponse | null>(
    null,
  );
  const [timersResponse, setTimersResponse] = useState<HangarExecTimersResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const [status, timers] = await Promise.all([
        hangarExecService.fetchStatus(),
        hangarExecService.getTimers(),
      ]);
      setStatusResponse(status);
      setTimersResponse(timers);
    } catch (error) {
      logger.error("Erreur Hangar Executive:", error);
      toastError(toast, "Erreur", "Impossible de charger le statut PYAM");
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
    const refreshId = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(refreshId);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeTimers = useMemo(() => {
    return (timersResponse?.activeTimers ?? [])
      .map((timer) => {
        const endsAt = new Date(timer.endsAt).getTime();
        const secondsRemaining = Math.max(0, Math.floor((endsAt - nowMs) / 1000));
        return { ...timer, secondsRemaining };
      })
      .filter((t) => t.secondsRemaining > 0);
  }, [timersResponse, nowMs]);

  const timerByTerminalId = useMemo(() => {
    const map = new Map<string, HangarTerminalTimer>();
    for (const timer of activeTimers) {
      map.set(timer.terminalId, timer);
    }
    return map;
  }, [activeTimers]);

  const status = useMemo(() => {
    if (!statusResponse) return null;
    const endsAt = new Date(statusResponse.status.nextChangeAt).getTime();
    const secondsRemaining = Math.max(0, Math.floor((endsAt - nowMs) / 1000));
    return { ...statusResponse.status, secondsRemaining };
  }, [statusResponse, nowMs]);

  const startTimer = async (terminal: HangarTerminalPreset) => {
    try {
      const response = await hangarExecService.startTimer(terminal.id);
      setTimersResponse(response);
      toastSuccess(toast, `Minuteur démarré — ${terminal.label}`);
    } catch (error) {
      logger.error("Erreur minuteur terminal:", error);
      toastError(toast, "Erreur", "Impossible de démarrer le minuteur");
    }
  };

  return {
    status,
    upcoming: statusResponse?.upcoming ?? [],
    terminals: timersResponse?.terminals ?? [],
    timerByTerminalId,
    isLoading,
    startTimer,
  };
}
