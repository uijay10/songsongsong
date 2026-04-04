/**
 * Daily slot pull cooldown window.
 * - `0` = no cooldown (always allow pull) — testing / debugging.
 * - Production: set `VITE_SLOT_COOLDOWN_MS=86400000` (24h) in the build env.
 */
function readCooldownMs(): number {
  const raw = import.meta.env.VITE_SLOT_COOLDOWN_MS;
  if (raw === undefined || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export const SLOT_COOLDOWN_MS = readCooldownMs();

export function canPullSlot(lastSlotPull: string | null | undefined): boolean {
  if (SLOT_COOLDOWN_MS <= 0) return true;
  if (lastSlotPull == null || String(lastSlotPull).trim() === "") return true;
  const t = new Date(lastSlotPull).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t >= SLOT_COOLDOWN_MS;
}
