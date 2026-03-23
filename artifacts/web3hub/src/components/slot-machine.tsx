import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n";

const SYMBOLS = ["🎰", "💎", "⭐", "🔥", "🌊", "⚡", "🎯", "🏆"];

function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  function getCtx() {
    if (!ctx.current) ctx.current = new AudioContext();
    return ctx.current;
  }
  function playTick() {
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.value = 600 + Math.random() * 400;
      gain.gain.setValueAtTime(0.08, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
      osc.start();
      osc.stop(ac.currentTime + 0.06);
    } catch {}
  }
  function playWin(amount: number) {
    try {
      const ac = getCtx();
      const freqs = amount >= 500 ? [523, 659, 784, 1047] : amount >= 200 ? [392, 523, 659] : [330, 440];
      freqs.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        const t = ac.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrent(finalSymbol);
    }
  }, [spinning, finalSymbol, delay]);

  return (
    <div
      style={{
        width: 64,
        height: 64,
        background: "rgba(255,255,255,0.08)",
        border: "2px solid rgba(255,255,255,0.18)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        transition: spinning ? "none" : "all 0.3s",
        boxShadow: spinning ? "0 0 12px rgba(251,191,36,0.4)" : "none",
      }}
    >
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
  const [result, setResult] = useState<{ earned: number; tokens: number } | null>(null);
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
        setResult({ earned: data.earned, tokens: data.tokens });
        playWin(data.earned);
        onSuccess(data.tokens, data.earned);
      }, 2200);
    } catch {
      if (tickRef.current) clearInterval(tickRef.current);
      setSpinning(false);
      setError("Network error");
    }
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(16,185,129,0.15) 100%)",
        border: "1.5px solid rgba(124,58,237,0.4)",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{t("slotTitle")}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{t("slotDesc")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t("tokenLabel")}</div>
          <div style={{ fontWeight: 700, fontSize: 22, color: "#fbbf24" }}>{tokens.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "rgba(251,191,36,0.7)" }}>$WBR</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
        <Reel spinning={spinning} finalSymbol={finalSymbols[0]} delay={0} />
        <Reel spinning={spinning} finalSymbol={finalSymbols[1]} delay={100} />
        <Reel spinning={spinning} finalSymbol={finalSymbols[2]} delay={200} />
        <Reel spinning={spinning} finalSymbol={finalSymbols[3]} delay={300} />
      </div>

      {result && (
        <div style={{
          textAlign: "center",
          marginBottom: 12,
          padding: "8px 16px",
          background: "rgba(251,191,36,0.15)",
          border: "1px solid rgba(251,191,36,0.4)",
          borderRadius: 8,
          color: "#fbbf24",
          fontWeight: 700,
          fontSize: 14,
        }}>
          {t("slotResult").replace("{amount}", result.earned.toLocaleString())}
        </div>
      )}

      {error && (
        <div style={{
          textAlign: "center",
          marginBottom: 12,
          padding: "8px 16px",
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8,
          color: "#f87171",
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handlePull}
        disabled={spinning || !canPull}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 10,
          border: "none",
          background: spinning
            ? "rgba(124,58,237,0.4)"
            : canPull
            ? "linear-gradient(90deg, #7c3aed, #10b981)"
            : "rgba(255,255,255,0.08)",
          color: canPull || spinning ? "#fff" : "rgba(255,255,255,0.35)",
          fontWeight: 700,
          fontSize: 14,
          cursor: spinning || !canPull ? "not-allowed" : "pointer",
          letterSpacing: "0.5px",
          transition: "all 0.2s",
        }}
      >
        {spinning ? t("slotPulling") : canPull ? t("slotPull") : t("slotCooldown")}
      </button>

      {!canPull && nextPullStr && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {t("slotNextPull").replace("{time}", nextPullStr)}
        </div>
      )}
    </div>
  );
}
