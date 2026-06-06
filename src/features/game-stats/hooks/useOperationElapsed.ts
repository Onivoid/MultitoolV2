import { useEffect, useState } from "react";

/** Met à jour l’horloge chaque seconde pendant une opération longue. */
export function useOperationElapsed(startedAt: number | null, active: boolean): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active || startedAt === null) {
      setElapsedMs(0);
      return;
    }

    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active, startedAt]);

  return elapsedMs;
}
