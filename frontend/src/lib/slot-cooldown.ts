/**
 * Daily slot pull cooldown window.
 * - `0` = no cooldown (always allow pull) — testing / debugging.
 * - Production: set to `24 * 60 * 60 * 1000` (24h).
 */
export const SLOT_COOLDOWN_MS = 0;

export function canPullSlot(lastSlotPull: string | null | undefined): boolean {
  if (SLOT_COOLDOWN_MS <= 0) return true;
  if (lastSlotPull == null || String(lastSlotPull).trim() === "") return true;
  const t = new Date(lastSlotPull).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t >= SLOT_COOLDOWN_MS;
}
