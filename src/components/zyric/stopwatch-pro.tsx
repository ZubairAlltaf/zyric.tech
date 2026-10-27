"use client";

/*
 * STOPWATCH PRO — a real stopwatch, not a toy timer.
 * Features: hour-capable display, laps with split + total, best/worst lap
 * highlighting, per-lap copy, copy-all, CSV/TXT export, clear laps,
 * keyboard shortcuts (Space / L / R), and run-state persistence — the clock
 * keeps counting across page reloads while running (stored start epoch).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Download,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
} from "lucide-react";
import { CopyButton } from "./hooks";

interface LapEntry {
  id: number;
  total: number; // ms at lap press
  split: number; // ms since previous lap
}

const STORE_KEY = "stopwatch-pro-state";

interface Persisted {
  running: boolean;
  startEpoch: number; // Date.now() when current run segment started
  accum: number; // ms accumulated before this segment
  laps: LapEntry[];
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Persisted;
    if (typeof p.startEpoch !== "number" || !Array.isArray(p.laps)) return null;
    return p;
  } catch {
    return null;
  }
}

function fmt(ms: number, withHours = true): string {
  const cs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const cc = String(cs).padStart(2, "0");
  if (withHours && h > 0) return `${h}:${mm}:${ss}.${cc}`;
  return `${mm}:${ss}.${cc}`;
}

export function StopwatchTool() {
  const [hydrated, setHydrated] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const [laps, setLaps] = useState<LapEntry[]>([]);

  const startRef = useRef(0);
  const accumRef = useRef(0);
  const lapIdRef = useRef(0);

  // one-time restore — a running stopwatch keeps counting across reloads
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const p = loadPersisted();
      if (p) {
        const now = p.running ? p.accum + (Date.now() - p.startEpoch) : p.accum;
        accumRef.current = now;
        lapIdRef.current = p.laps.length;
        setElapsed(now);
        setLaps(p.laps);
        setRunning(p.running); // resumes ticking through the run effect below
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // persist while running — survives reload
  useEffect(() => {
    if (!hydrated) return;
    if (running) {
      // convert performance.now() origin to wall-clock epoch so reload math works
      const epoch = Date.now() - (performance.now() - startRef.current);
      const payload: Persisted = {
        running: true,
        startEpoch: epoch,
        accum: accumRef.current,
        laps,
      };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(payload));
      } catch {
        /* storage full — ignore */
      }
    } else {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [running, laps, hydrated]);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const id = setInterval(() => {
      setElapsed(accumRef.current + (performance.now() - startRef.current));
    }, 33);
    return () => {
      accumRef.current += performance.now() - startRef.current;
      clearInterval(id);
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    accumRef.current = 0;
    lapIdRef.current = 0;
  };

  const lap = () => {
    if (!running && elapsed === 0) return;
    const prev = laps[0]?.total ?? 0;
    lapIdRef.current += 1;
    setLaps([{ id: lapIdRef.current, total: elapsed, split: elapsed - prev }, ...laps]);
  };

  // keyboard shortcuts — ignored while typing in inputs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        lap();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
     
  }, [laps, elapsed]);

  const bestWorst = useMemo(() => {
    if (laps.length < 2) return { best: -1, worst: -1 };
    const splits = laps.map((l) => l.split);
    const best = Math.min(...splits);
    const worst = Math.max(...splits);
    return {
      best: laps.find((l) => l.split === best)?.id ?? -1,
      worst: laps.find((l) => l.split === worst)?.id ?? -1,
    };
  }, [laps]);

  const exportLaps = (kind: "csv" | "txt") => {
    const rows = [...laps].reverse();
    let body: string;
    if (kind === "csv") {
      body = "Lap,Split,Total\n" + rows.map((l) => `${l.id},${fmt(l.split)},${fmt(l.total)}`).join("\n");
    } else {
      body = "STOPWATCH — Zyric\n\n" + rows.map((l) => `Lap ${l.id}  +${fmt(l.split)}  (${fmt(l.total)})`).join("\n");
    }
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.download = `stopwatch-laps.${kind}`;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyAll = [...laps].reverse().map((l) => `Lap ${l.id}: +${fmt(l.split)} (total ${fmt(l.total)})`).join("\n");

  const hasHours = Math.floor(elapsed / 3600000) > 0;
  const avgSplit = laps.length ? laps.reduce((s, l) => s + l.split, 0) / laps.length : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p
          className={`font-mono font-bold tabular-nums text-zinc-50 ${hasHours ? "text-5xl sm:text-6xl" : "text-6xl sm:text-7xl"}`}
          aria-live="off"
        >
          {fmt(elapsed)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
          {running ? "running" : elapsed > 0 ? "paused" : "ready"} · {laps.length} lap{laps.length === 1 ? "" : "s"}
          {laps.length > 0 && ` · avg split ${fmt(avgSplit)}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => setRunning(!running)}
          size="lg"
          className={`min-w-32 font-semibold ${
            running
              ? "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              : "bg-emerald-500 text-zinc-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
          }`}
        >
          {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
        </Button>
        <Button
          variant="outline"
          onClick={lap}
          disabled={!running}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-40"
        >
          <Flag className="h-4 w-4" aria-hidden /> Lap
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          aria-label="Reset stopwatch"
          disabled={elapsed === 0 && laps.length === 0}
          className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <p className="text-center text-xs text-zinc-600">
        Shortcuts: <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">Space</kbd> start/pause ·{" "}
        <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">L</kbd> lap ·{" "}
        <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">R</kbd> reset
        {running && " · keeps counting even if you reload the page"}
      </p>

      {laps.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Trophy className="h-4 w-4 text-amber-400" aria-hidden /> Laps
              <span className="text-xs font-normal text-zinc-500">best in green, slowest in red</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={copyAll} label="Copy all" className="h-8 text-xs" />
              <Button variant="outline" size="sm" onClick={() => exportLaps("csv")} className="h-8 border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
                <Download className="h-3.5 w-3.5" aria-hidden /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportLaps("txt")} className="h-8 border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
                <Download className="h-3.5 w-3.5" aria-hidden /> TXT
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLaps([])} className="h-8 border-zinc-700 bg-zinc-900 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear
              </Button>
            </div>
          </div>

          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {laps.map((l) => {
              const isBest = l.id === bestWorst.best;
              const isWorst = l.id === bestWorst.worst;
              return (
                <div
                  key={l.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm ${
                    isBest
                      ? "border-emerald-700/50 bg-emerald-950/30"
                      : isWorst
                        ? "border-rose-900/50 bg-rose-950/20"
                        : "border-zinc-800 bg-zinc-900/40"
                  }`}
                >
                  <span className="w-16 shrink-0 text-zinc-500">Lap {l.id}</span>
                  <span className={`w-24 shrink-0 truncate font-mono text-xs ${isBest ? "text-emerald-400" : isWorst ? "text-rose-400" : "text-zinc-500"}`}>
                    {isBest ? "best" : isWorst ? "slowest" : ""}
                  </span>
                  <span className="flex-1 text-right font-mono tabular-nums text-zinc-300">+{fmt(l.split)}</span>
                  <span className="w-24 text-right font-mono tabular-nums text-zinc-100">{fmt(l.total)}</span>
                  <CopyButton text={`Lap ${l.id}: +${fmt(l.split)} (total ${fmt(l.total)})`} label="" className="h-7 w-7 shrink-0 border-0 bg-transparent px-0 hover:bg-zinc-800" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {laps.length === 0 && elapsed === 0 && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-6 text-center text-xs text-zinc-500">
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Laps appear here with split times — press L (or the Lap button) while running.
        </div>
      )}
    </div>
  );
}
