"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Waves, Play, Pause, FerrisWheel, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage, labelCls, inputCls } from "./hooks";

/* ------------------------------- Focus Sounds ------------------------------ */

type NoiseType = "white" | "pink" | "brown";

function makeNoiseBuffer(ctx: AudioContext, type: NoiseType): AudioBuffer {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

const NOISE_INFO: { id: NoiseType; name: string; desc: string }[] = [
  { id: "white", name: "White", desc: "Steady hiss — masks chatter" },
  { id: "pink", name: "Pink", desc: "Soft rain-like balance" },
  { id: "brown", name: "Brown", desc: "Deep, rumbly roar" },
];

const TIMER_OPTIONS = [
  { label: "No timer", ms: 0 },
  { label: "15 min", ms: 15 * 60_000 },
  { label: "30 min", ms: 30 * 60_000 },
  { label: "60 min", ms: 60 * 60_000 },
];

export function FocusSoundsTool() {
  const [type, setType] = useState<NoiseType>("pink");
  const [volume, setVolume] = useState(35);
  const [playing, setPlaying] = useState(false);
  const [timerMs, setTimerMs] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; src: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const stopAtRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try {
        a.src.stop();
        void a.ctx.close();
      } catch {
        /* already stopped */
      }
      audioRef.current = null;
    }
    stopAtRef.current = null;
    setRemaining(null);
    setPlaying(false);
  }, []);

  const start = useCallback(
    (t: NoiseType) => {
      stop();
      const ctx = new AudioContext();
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx, t);
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = volume / 100;
      src.connect(gain).connect(ctx.destination);
      src.start();
      audioRef.current = { ctx, src, gain };
      stopAtRef.current = timerMs > 0 ? Date.now() + timerMs : null;
      setRemaining(stopAtRef.current ? timerMs : null);
      setPlaying(true);
    },
    [stop, volume, timerMs]
  );

  const changeType = (t: NoiseType) => {
    setType(t);
    if (playing) start(t);
  };

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.gain.gain.value = volume / 100;
  }, [volume]);

  // Countdown tick
  useEffect(() => {
    if (!playing || !stopAtRef.current) return;
    const id = setInterval(() => {
      const left = (stopAtRef.current ?? 0) - Date.now();
      if (left <= 0) {
        stop();
      } else {
        setRemaining(left);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [playing, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        try {
          a.src.stop();
          void a.ctx.close();
        } catch {
          /* ignore */
        }
        audioRef.current = null;
      }
    };
  }, []);

  const fmt = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {NOISE_INFO.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => changeType(n.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              type === n.id
                ? "border-emerald-500/60 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
            }`}
            aria-pressed={type === n.id}
          >
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold ${type === n.id ? "text-emerald-300" : "text-zinc-200"}`}>{n.name} noise</p>
              {type === n.id && <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{n.desc}</p>
            <div className="mt-3 flex h-6 items-end gap-0.5" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-sm ${playing && type === n.id ? "animate-pulse bg-emerald-500/80" : "bg-zinc-700"}`}
                  style={{ height: `${20 + Math.abs(Math.sin(i * 1.3)) * 80}%`, animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <Button
          type="button"
          size="icon"
          onClick={() => (playing ? stop() : start(type))}
          aria-label={playing ? "Stop sound" : "Play sound"}
          className="h-12 w-12 rounded-full bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
        >
          {playing ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="ml-0.5 h-5 w-5" aria-hidden />}
        </Button>
        <div className="min-w-40 flex-1 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label className={labelCls}>Volume</Label>
            <span className="font-mono text-xs text-emerald-300">{volume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
            aria-label="Volume"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Auto stop</Label>
          <div className="flex flex-wrap gap-1.5">
            {TIMER_OPTIONS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setTimerMs(t.ms);
                  stopAtRef.current = playing && t.ms > 0 ? Date.now() + t.ms : null;
                  setRemaining(playing && t.ms > 0 ? t.ms : null);
                  if (playing && t.ms === 0) stopAtRef.current = null;
                }}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  timerMs === t.ms
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {playing && remaining !== null && (
          <p className="font-mono text-sm text-emerald-300">{fmt(remaining)} left</p>
        )}
      </div>
      <p className="flex items-center gap-2 text-xs text-zinc-600">
        <Waves className="h-3.5 w-3.5" aria-hidden /> Sounds are synthesized on your device — no files, no streaming, works offline.
      </p>
    </div>
  );
}

/* ------------------------------- Decision Wheel ---------------------------- */

const WHEEL_COLORS = ["#10b981", "#0d9488", "#f59e0b", "#3f3f46", "#22d3ee", "#71717a", "#34d399", "#0ea5e9", "#a3a3a3", "#059669", "#d97706", "#52525b"];

export function DecisionWheelTool() {
  const [entriesText, setEntriesText] = useLocalStorage("wheel-entries", "Pizza\nSushi\nBurgers\nPasta\nSalad\nTacos");
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const rotation = useRef(0);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const entries = entriesText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;
    const list = entries.length > 0 ? entries : ["?"];
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation.current);
    const arc = (Math.PI * 2) / list.length;
    for (let i = 0; i < list.length; i++) {
      const a0 = i * arc - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a0, a0 + arc);
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 2;
      ctx.stroke();
      // label
      ctx.save();
      ctx.rotate(a0 + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fafafa";
      ctx.font = `600 ${list.length > 8 ? 15 : 18}px var(--font-geist-sans), sans-serif`;
      ctx.fillText(list[i].slice(0, 14), r - 14, 6);
      ctx.restore();
    }
    ctx.restore();
    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#fafafa";
    ctx.fill();
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [entries]);

  useEffect(() => {
    draw();
  }, [draw]);

  const spin = () => {
    if (spinning || entries.length < 2) return;
    setResult(null);
    setSpinning(true);
    const startRot = rotation.current;
    const target = startRot + Math.PI * 2 * 5 + Math.random() * Math.PI * 2;
    const dur = 3200;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      rotation.current = startRot + (target - startRot) * eased;
      draw();
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // winner: segment under the top pointer
        const list = entries.length > 0 ? entries : ["?"];
        const arc = (Math.PI * 2) / list.length;
        const normalized = ((Math.PI * 2 - ((rotation.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) + Math.PI / 2) % (Math.PI * 2);
        const idx = Math.floor(normalized / arc) % list.length;
        setResult(list[idx]);
        setSpinning(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2" aria-hidden>
            <div className="h-0 w-0 border-x-[10px] border-t-[18px] border-x-transparent border-t-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
          </div>
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="h-72 w-72 rounded-full border-4 border-zinc-800 shadow-[0_0_40px_rgba(16,185,129,0.12)] sm:h-80 sm:w-80"
            role="img"
            aria-label="Decision wheel"
          />
        </div>
        <Button type="button" onClick={spin} disabled={spinning || entries.length < 2} className="w-44 bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 disabled:opacity-50">
          <RotateCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} aria-hidden />
          {spinning ? "Spinning…" : "Spin the wheel"}
        </Button>
        {result && !spinning && (
          <div className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
            <p className="mono-kicker text-emerald-300">the wheel says</p>
            <p className="mt-1 font-display text-2xl font-bold text-zinc-50">{result}</p>
          </div>
        )}
        {entries.length < 2 && <p className="text-sm text-amber-400">Add at least 2 options to spin.</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="wheel-entries" className={labelCls}>Options (one per line)</Label>
          <span className="font-mono text-xs text-zinc-500">{entries.length}/12</span>
        </div>
        <Textarea
          id="wheel-entries"
          value={entriesText}
          onChange={(e) => setEntriesText(e.target.value)}
          className={`${inputCls} min-h-52 font-mono text-sm`}
          placeholder={"Pizza\nSushi\nBurgers"}
          aria-label="Wheel options"
        />
        <p className="flex items-center gap-1.5 text-xs text-zinc-600">
          <FerrisWheel className="h-3.5 w-3.5" aria-hidden /> Your options save in this browser automatically.
        </p>
      </div>
    </div>
  );
}
