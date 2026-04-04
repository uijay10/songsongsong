/** 与后端 `artifacts/api-server` slot-pull 的 24h 窗口一致 */
export const DEFAULT_SLOT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Daily slot pull cooldown window (must match server logic).
 * - 未设置或空：默认 24h（`DEFAULT_SLOT_COOLDOWN_MS`）。
 * - `0`：关闭前端冷却展示（仅本地/调试；服务端仍可能拒绝）。
 */
function readCooldownMs(): number {
  const raw = import.meta.env.VITE_SLOT_COOLDOWN_MS;
  if (raw === undefined || raw === "") return DEFAULT_SLOT_COOLDOWN_MS;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : DEFAULT_SLOT_COOLDOWN_MS;
}

export const SLOT_COOLDOWN_MS = readCooldownMs();

export function canPullSlot(lastSlotPull: string | null | undefined): boolean {
  if (SLOT_COOLDOWN_MS <= 0) return true;
  if (lastSlotPull == null || String(lastSlotPull).trim() === "") return true;
  const t = new Date(lastSlotPull).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t >= SLOT_COOLDOWN_MS;
}
