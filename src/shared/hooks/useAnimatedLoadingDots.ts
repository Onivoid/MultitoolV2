import { useEffect, useState } from "react";

export function useAnimatedLoadingDots(active: boolean, intervalMs = 500) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 0 : prev + 1));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [active, intervalMs]);

  return dotCount;
}
