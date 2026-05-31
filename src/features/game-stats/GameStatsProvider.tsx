import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyScanStatus,
  parseScanInProgressError,
} from "@/features/game-stats/gameStats.scan.lib";
import {
  gameStatsService,
  subscribeGameStatsScanFinished,
  subscribeGameStatsScanProgress,
} from "@/features/game-stats/gameStats.service";
import type {
  GameStatsLoadStatus,
  GameStatsScanProgress,
  GameStatsScanStatus,
  GameStatsSnapshot,
} from "@/features/game-stats/gameStats.types";

export interface GameStatsContextValue {
  snapshot: GameStatsSnapshot | null;
  status: GameStatsLoadStatus;
  error: string | null;
  progress: GameStatsScanProgress | null;
  operationStartedAt: number | null;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
  isBusy: boolean;
}

const GameStatsContext = createContext<GameStatsContextValue | null>(null);

export function GameStatsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<GameStatsSnapshot | null>(null);
  const [status, setStatus] = useState<GameStatsLoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<GameStatsScanProgress | null>(null);
  const [operationStartedAt, setOperationStartedAt] = useState<number | null>(
    null,
  );
  const snapshotRef = useRef(snapshot);
  const bootstrapDoneRef = useRef(false);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const attachToOngoingScan = useCallback((scan: GameStatsScanStatus) => {
    const applied = applyScanStatus(scan, snapshotRef.current !== null);
    setStatus(applied.status);
    setProgress(applied.progress ?? null);
    setOperationStartedAt(applied.operationStartedAt);
    setError(null);
  }, []);

  const clearBusyUi = useCallback(() => {
    setProgress(null);
    setOperationStartedAt(null);
  }, []);

  const runRefresh = useCallback(async () => {
    setError(null);
    const hasSnapshot = snapshotRef.current !== null;
    setStatus(hasSnapshot ? "updating" : "loading");
    setOperationStartedAt(Date.now());
    setProgress(null);

    try {
      const result = await gameStatsService.getStats();
      setSnapshot(result.snapshot);
      setStatus("idle");
      clearBusyUi();
    } catch (e) {
      const busy = parseScanInProgressError(e);
      if (busy?.inProgress) {
        attachToOngoingScan(busy);
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      clearBusyUi();
    }
  }, [attachToOngoingScan, clearBusyUi]);

  const bootstrap = useCallback(async () => {
    setError(null);
    try {
      const cached = await gameStatsService.getCached();
      if (cached) {
        setSnapshot(cached);
        snapshotRef.current = cached;
      }

      const scanStatus = await gameStatsService.checkScanStatus();
      if (scanStatus.inProgress) {
        attachToOngoingScan(scanStatus);
        return;
      }

      await runRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      clearBusyUi();
    }
  }, [attachToOngoingScan, clearBusyUi, runRefresh]);

  const refresh = useCallback(async () => {
    const scanStatus = await gameStatsService.checkScanStatus();
    if (scanStatus.inProgress) {
      attachToOngoingScan(scanStatus);
      return;
    }
    await runRefresh();
  }, [attachToOngoingScan, runRefresh]);

  const sync = useCallback(async () => {
    const scanStatus = await gameStatsService.checkScanStatus();
    if (scanStatus.inProgress) {
      attachToOngoingScan(scanStatus);
      return;
    }

    setError(null);
    setStatus("syncing");
    setOperationStartedAt(Date.now());
    setProgress(null);

    try {
      const fresh = await gameStatsService.sync();
      setSnapshot(fresh);
      setStatus("idle");
      clearBusyUi();
    } catch (e) {
      const busy = parseScanInProgressError(e);
      if (busy?.inProgress) {
        attachToOngoingScan(busy);
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      clearBusyUi();
    }
  }, [attachToOngoingScan, clearBusyUi]);

  useEffect(() => {
    if (bootstrapDoneRef.current) {
      return;
    }
    bootstrapDoneRef.current = true;

    let unlistenProgress: (() => void) | undefined;
    let unlistenFinished: (() => void) | undefined;

    void (async () => {
      unlistenProgress = await subscribeGameStatsScanProgress((payload) => {
        setProgress(payload);
      });
      unlistenFinished = await subscribeGameStatsScanFinished((payload) => {
        setSnapshot(payload);
        snapshotRef.current = payload;
        setStatus("idle");
        setError(null);
        clearBusyUi();
      });
      await bootstrap();
    })();

    return () => {
      unlistenProgress?.();
      unlistenFinished?.();
    };
  }, [bootstrap, clearBusyUi]);

  const isBusy =
    status === "loading" || status === "updating" || status === "syncing";

  return (
    <GameStatsContext.Provider
      value={{
        snapshot,
        status,
        error,
        progress,
        operationStartedAt,
        refresh,
        sync,
        isBusy,
      }}
    >
      {children}
    </GameStatsContext.Provider>
  );
}

export function useGameStats(): GameStatsContextValue {
  const ctx = useContext(GameStatsContext);
  if (!ctx) {
    throw new Error("useGameStats doit être utilisé dans GameStatsProvider");
  }
  return ctx;
}
