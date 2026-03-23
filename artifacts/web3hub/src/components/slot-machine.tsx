import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n";

const SYMBOLS = ["🎰", "💎", "⭐", "🔥", "🌊", "⚡", "🎯", "🏆"];

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
      osc.frequency.value = 600 + Math.random() * 400;
      gain.gain.setValueAtTime(0.06, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
      osc.start(); osc.stop(ac.currentTime + 0.06);
    } catch {}
  }
  function playWin(amount: number) {
    try {
      const ac = getCtx();
      const freqs = amount >= 500 ? [523, 659, 784, 1047] : amount >= 200 ? [392, 523, 659] : [330, 440];
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

function Reel({ spinning, finalSymbol, delay }: { spinning: boolean; finalSymbol: string; delay: number }) {
  const [current, setCurrent] = useState(SYMBOLS[0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      const start = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setCurrent(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        }, 80);
      }, delay);
      return () => clearTimeout(start);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setCurrent(finalSymbol);
    }
  }, [spinning, finalSymbol, delay]);

  return (
    <div style={{
      width: 60, height: 60,
      background: "rgba(255,255,255,0.06)",
      border: "1.5px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 28,
    }}>
      {current}
    </div>
  );
}

interface SlotMachineProps {
  wallet: string;
  tokens: number;
  lastSlotPull: string | null;
  onSuccess: (newTokens: number, earned: number) => void;
}

export function SlotMachine({ wallet, tokens, lastSlotPull, onSuccess }: SlotMachineProps) {
  const { t } = useLang();
  const { playTick, playWin } = useAudio();

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ earned: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalSymbols, setFinalSymbols] = useState([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2], SYMBOLS[3]]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canPull = !lastSlotPull || Date.now() - new Date(lastSlotPull).getTime() >= 24 * 60 * 60 * 1000;

  let nextPullStr = "";
  if (!canPull && lastSlotPull) {
    const next = new Date(new Date(lastSlotPull).getTime() + 24 * 60 * 60 * 1000);
    const diff = next.getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    nextPullStr = `${h}h ${m}m`;
  }

  async function handlePull() {
    if (spinning || !canPull) return;
    setSpinning(true);
    setResult(null);
    setError(null);
    tickRef.current = setInterval(() => playTick(), 120);

    try {
      const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/web3hub$/, "") + "/api";
      const res = await fetch(`${API}/users/slot-pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();
      if (tickRef.current) clearInterval(tickRef.current);

      if (!data.success) {
        setSpinning(false);
        setError(data.message || t("slotCooldown"));
        return;
      }

      const syms = Array.from({ length: 4 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
      setFinalSymbols(syms);

      setTimeout(() => {
        setSpinning(false);
        setResult({ earned: data.earned });
        playWin(data.earned);
        onSuccess(data.tokens, data.earned);
      }, 2200);
    } catch {
      if (tickRef.current) clearInterval(tickRef.current);
      setSpinning(false);
      setError("Network error");
    }
  }

  const isDone = !canPull && !spinning;

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
          <div style={{ fontWeight: 700, fontSize: 20, color: "#f59e0b", lineHeight: 1.2 }}>{tokens.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: "rgba(245,158,11,0.6)" }}>$WBR</div>
        </div>
      </div>

      {/* Reels — only shown when not yet pulled today, or while spinning */}
      {(!isDone || spinning) && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
          <Reel spinning={spinning} finalSymbol={finalSymbols[0]} delay={0} />
          <Reel spinning={spinning} finalSymbol={finalSymbols[1]} delay={100} />
          <Reel spinning={spinning} finalSymbol={finalSymbols[2]} delay={200} />
          <Reel spinning={spinning} finalSymbol={finalSymbols[3]} delay={300} />
        </div>
      )}

      {/* Result (shown after successful pull, persists) */}
      {result && (
        <div style={{
          textAlign: "center",
          marginBottom: 12,
          padding: "8px 14px",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 8,
          color: "#f59e0b",
          fontWeight: 600,
          fontSize: 14,
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

      {/* Pull button — hidden once pulled today */}
      {!isDone && (
        <button
          onClick={handlePull}
          disabled={spinning}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 9, border: "none",
            background: spinning ? "rgba(255,255,255,0.08)" : "rgba(124,58,237,0.7)",
            color: "#fff", fontWeight: 600, fontSize: 14,
            cursor: spinning ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {spinning ? t("slotPulling") : t("slotPull")}
        </button>
      )}

      {/* Cooldown info after pull */}
      {isDone && (
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center" }}>
          <span>{t("slotCooldown")}</span>
          {nextPullStr && (
            <span style={{ marginLeft: 8, color: "var(--muted-foreground)" }}>
              · {t("slotNextPull").replace("{time}", nextPullStr)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
