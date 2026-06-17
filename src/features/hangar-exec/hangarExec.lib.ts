export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function groupTerminalsByLocation<T extends { location: string }>(
  terminals: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const terminal of terminals) {
    const list = map.get(terminal.location) ?? [];
    list.push(terminal);
    map.set(terminal.location, list);
  }
  return map;
}
