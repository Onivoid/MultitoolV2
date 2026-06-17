import { useEffect, useState } from "react";

const STAGGER_MS = 72;
const STAGGER_CAP_MS = 960;

/** Étale le montage du contenu des widgets pour éviter un pic IPC/réseau au lancement. */
export function useStaggeredWidgetMount(order: number): boolean {
  const [ready, setReady] = useState(order <= 0);

  useEffect(() => {
    if (order <= 0) {
      return;
    }
    const delay = Math.min(order * STAGGER_MS, STAGGER_CAP_MS);
    const id = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(id);
  }, [order]);

  return ready;
}
