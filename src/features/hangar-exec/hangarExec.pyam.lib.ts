/** Aligné sur `hangar_exec.rs` (65 min ouvert / 120 min fermé). */
export const PYAM_OPEN_SECONDS = 65 * 60;
export const PYAM_CLOSED_SECONDS = 120 * 60;
export const PYAM_CYCLE_SECONDS = PYAM_OPEN_SECONDS + PYAM_CLOSED_SECONDS;

export function pyamProgressPercent(
  isOnline: boolean,
  secondsRemaining: number,
): number {
  const phaseTotal = isOnline ? PYAM_OPEN_SECONDS : PYAM_CLOSED_SECONDS;
  if (phaseTotal <= 0) return 0;
  const elapsed = Math.max(0, phaseTotal - secondsRemaining);
  return Math.min(100, Math.round((elapsed / phaseTotal) * 100));
}

export function pyamSegmentStates(
  isOnline: boolean,
  progressPercent: number,
): boolean[] {
  const filled = Math.round((progressPercent / 100) * 5);
  return Array.from({ length: 5 }, (_, i) => (isOnline ? i < filled : i >= 5 - filled));
}
