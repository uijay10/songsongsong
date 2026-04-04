import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { canPullSlot, SLOT_COOLDOWN_MS } from "@/lib/slot-cooldown";

function formatRemainHms(ms: number): string {
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  function getCtx(): AudioContext {
    if (!ctx.current) ctx.current = new AudioContext();
    return ctx.current!;
  }
  function playTick() {
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = 400 + Math.random() * 200;
      gain.gain.setValueAtTime(0.04, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
      osc.start(); osc.stop(ac.currentTime + 0.05);
    } catch {}
  }
  function playWin(amount: number) {
    try {
      const ac = getCtx();
      const freqs = amount >= 701 ? [523, 659, 784, 1047] : amount >= 301 ? [392, 523, 659] : [330, 440];
      freqs.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.frequency.value = freq; osc.type = "sine";
        const t = ac.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t); osc.stop(t + 0.35);
      });
    } catch {}
  }
  return { playTick, playWin };
}

// Single digit reel
function DigitReel({ spinning, finalDigit, delay, speed }: {
  spinning: boolean;
  finalDigit: number;
  delay: number;
  speed: number; // ms per tick
}) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      const start = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setCurrent(d => (d + 1) % 10);
        }, speed);
      }, delay);
      return () => {
        clearTimeout(start);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrent(finalDigit);
    return undefined;
  }, [spinning, finalDigit, delay, speed]);

  return (
    <div style={{
      width: 56, height: 72,
      background: "rgba(255,255,255,0.06)",
      border: "1.5px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 36, fontWeight: 800,
      fontVariantNumeric: "tabular-nums",
      color: spinning ? "#a78bfa" : "#fbbf24",
      transition: spinning ? "none" : "color 0.4s",
      letterSpacing: 0,
      fontFamily: "monospace",
    }}>
      {current}
    </div>
  );
}

interface SlotMachineProps {
  wallet: string;
  tokens: number;
  lastSlotPull: string | null;
  /** 来自 GET /users/me，与接口一致时可消除「能点却不能抽」的假阳性 */
  canSlotPull?: boolean | null;
  nextSlotPullAt?: string | null;
  onSuccess: (newTokens: number, earned: number) => void;
}

const SPIN_DURATION = 5000; // 5 seconds

/** 接口拒绝（与「冷却条」区分，避免未开冷却 UI 时仍显示「今日已抽」） */
function slotApiDeniedText(raw: string | undefined, t: (key: string) => string): string {
  if (!raw || raw === "Already pulled today") return t("slotApiDenied");
  return raw;
}

export function SlotMachine({
  wallet,
  tokens,
  lastSlotPull,
  canSlotPull: canSlotPullServer,
  nextSlotPullAt: nextSlotPullAtServer,
  onSuccess,
}: SlotMachineProps) {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const { playTick, playWin } = useAudio();

  // Local token state so display updates immediately after winning,
  // without waiting for the parent query to refetch
  const [localTokens, setLocalTokens] = useState(tokens);
  useEffect(() => { setLocalTokens(tokens); }, [tokens]);

  const [spinning, setSpinning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [result, setResult] = useState<{ earned: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 4 digits representing the prize, e.g. 131 → [0,1,3,1]
  const [finalDigits, setFinalDigits] = useState([0, 0, 0, 0]);
  // reel speeds (fast early, slow near end)
  const [reelSpeed, setReelSpeed] = useState(60);
  const [cooldownRemainMs, setCooldownRemainMs] = useState(0);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clientCanPull = canPullSlot(lastSlotPull);
  const canPull =
    typeof canSlotPullServer === "boolean" ? canSlotPullServer : clientCanPull;

  useEffect(() => {
    setError(null);
  }, [lastSlotPull, wallet]);

  useEffect(() => {
    if (!canPull) setError(null);
  }, [canPull]);

  const cooldownEndMs =
    nextSlotPullAtServer && String(nextSlotPullAtServer).trim() !== ""
      ? (() => {
          const x = new Date(nextSlotPullAtServer).getTime();
          return Number.isNaN(x) ? null : x;
        })()
      : lastSlotPull && SLOT_COOLDOWN_MS > 0
        ? (() => {
            const t0 = new Date(lastSlotPull).getTime();
            return Number.isNaN(t0) ? null : t0 + SLOT_COOLDOWN_MS;
          })()
        : null;

  useEffect(() => {
    if (!cooldownEndMs || SLOT_COOLDOWN_MS <= 0 || canPull) {
      setCooldownRemainMs(0);
      return;
    }
    const tick = () => {
      setCooldownRemainMs(Math.max(0, cooldownEndMs - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownEndMs, canPull]);

  const nextPullStr = formatRemainHms(cooldownRemainMs);

  function stopAll() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }

  async function handlePull() {
    if (spinning || !canPull) return;
    setSpinning(true);
    setResult(null);
    setError(null);
    setCountdown(5);
    setReelSpeed(60);

    // Start sound ticks
    tickRef.current = setInterval(() => playTick(), 100);

    // Countdown timer
    let cd = 5;
    countdownRef.current = setInterval(() => {
      cd -= 1;
      setCountdown(cd);
      // Slow down reels near end
      if (cd === 2) setReelSpeed(120);
      if (cd === 1) setReelSpeed(220);
      if (cd <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);

    try {
      const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/web3hub$/, "") + "/api";
      const res = await fetch(`${API}/users/slot-pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const raw = await res.text();
      let data: { success?: boolean; message?: string; earned?: number; tokens?: number };
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        stopAll();
        setSpinning(false);
        setError(res.ok ? "Invalid response" : `Request failed (${res.status})`);
        return;
      }

      if (!res.ok) {
        stopAll();
        setSpinning(false);
        setError(
          data.message != null && data.message !== ""
            ? slotApiDeniedText(data.message, t)
            : `Request failed (${res.status})`,
        );
        void queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        return;
      }

      if (!data.success) {
        stopAll();
        setSpinning(false);
        setError(slotApiDeniedText(data.message, t));
        void queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        return;
      }

      const earned: number = data.earned ?? 0;
      // Pad to 4 digits
      const digits = String(earned).padStart(4, "0").split("").map(Number);
      setFinalDigits(digits);

      // Wait for 5s total spin then stop
      setTimeout(() => {
        stopAll();
        setSpinning(false);
        setResult({ earned });
        playWin(earned);
        setLocalTokens(data.tokens ?? 0);
        onSuccess(data.tokens ?? 0, earned);
      }, SPIN_DURATION);

    } catch {
      stopAll();
      setSpinning(false);
      setError("Network error");
    }
  }

  /** 仅当启用前端冷却且当前在冷却窗口内时显示「今日已抽」；`SLOT_COOLDOWN_MS===0` 时永不显示 */
  const showCooldownBanner = SLOT_COOLDOWN_MS > 0 && !canPull && !spinning;
  const showPullUi = !showCooldownBanner || spinning;

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "16px 20px",
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--foreground)" }}>{t("slotTitle")}</div>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{t("slotDesc")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{t("tokenLabel")}</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#f59e0b", lineHeight: 1.2 }}>{localTokens.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: "rgba(245,158,11,0.6)" }}>$WBR</div>
        </div>
      </div>

      {/* Number reels — shown only when spinning or not yet pulled */}
      {showPullUi && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
            <DigitReel spinning={spinning} finalDigit={finalDigits[0]} delay={0} speed={reelSpeed} />
            <DigitReel spinning={spinning} finalDigit={finalDigits[1]} delay={80} speed={reelSpeed} />
            <DigitReel spinning={spinning} finalDigit={finalDigits[2]} delay={160} speed={reelSpeed} />
            <DigitReel spinning={spinning} finalDigit={finalDigits[3]} delay={240} speed={reelSpeed} />
          </div>
          {spinning && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: "#a78bfa", fontWeight: 600 }}>
              {countdown}s
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          textAlign: "center", marginBottom: 12, padding: "8px 14px",
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 8, color: "#f59e0b", fontWeight: 600, fontSize: 14,
        }}>
          {t("slotResult").replace("{amount}", result.earned.toLocaleString())}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          textAlign: "center", marginBottom: 12, padding: "7px 14px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, color: "#f87171", fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {/* Pull button */}
      {showPullUi && (
        <button
          onClick={handlePull}
          disabled={spinning || !canPull}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 9, border: "none",
            background: spinning || !canPull ? "rgba(255,255,255,0.06)" : "rgba(124,58,237,0.7)",
            color: spinning || !canPull ? "rgba(255,255,255,0.4)" : "#fff",
            fontWeight: 600, fontSize: 14,
            cursor: spinning || !canPull ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {spinning ? t("slotPulling") : t("slotPull")}
        </button>
      )}

      {/* Cooldown */}
      {showCooldownBanner && (
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center" }}>
          <span>{t("slotCooldown")}</span>
          {nextPullStr && (
            <span style={{ marginLeft: 8 }}>
              · {t("slotNextPull").replace("{time}", nextPullStr)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
