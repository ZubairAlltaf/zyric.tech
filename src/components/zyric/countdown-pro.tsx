"use client";

/*
 * COUNTDOWN PRO — everything an online timer should do.
 * Features: H/M/S inputs + presets, custom label, live tab-title countdown,
 * SVG progress ring, finish-at clock time, sound picker (bell/chime/beeps/
 * silent) with volume + test, repeat/interval mode, +1 minute while running,
 * saved timer presets (localStorage), screen Wake Lock while running, and
 * full reload persistence (the countdown keeps running across refreshes).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlarmClock,
  Bell,
  BellOff,
  Bookmark,
  Music4,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Repeat,
  Save,
  Trash2,
  Volume2,
} from "lucide-react";
import { inputCls, labelCls, uid } from "./hooks";

/* ------------------------------- audio engine ------------------------------ */

type SoundId = "bell" | "chime" | "beeps" | "silent";

function playSound(kind: SoundId, volume: number) {
  if (kind === "silent" || volume <= 0) return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    const tone = (freq: number, at: number, dur: number, type: OscillatorType = "sine", peak = 0.5) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    };

    const t = ctx.currentTime + 0.05;
    if (kind === "bell") {
      tone(880, t, 1.6, "sine", 0.6);
      tone(1760, t, 1.1, "sine", 0.18); // harmonic shimmer
    } else if (kind === "chime") {
      tone(660, t, 0.5);
      tone(880, t + 0.35, 0.5);
      tone(1320, t + 0.7, 0.9);
    } else {
      for (let i = 0; i < 6; i++) tone(440, t + i * 0.22, 0.14, "square", 0.35);
    }
    // close the context after the sound finishes
    window.setTimeout(() => void ctx.close().catch(() => undefined), kind === "bell" ? 2200 : 2400);
  } catch {
    /* audio blocked */
  }
}

/* ------------------------------ persistence -------------------------------- */

const STATE_KEY = "countdown-pro-state";
const SAVED_KEY = "countdown-pro-saved";

interface SavedTimer {
  id: string;
  label: string;
  sec: number;
}

interface RunState {
  endEpoch: number;
  totalSec: number;
  label: string;
  repeat: boolean;
}

function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/* ------------------------------ wake lock ---------------------------------- */

interface WakeSentinel {
  release: () => Promise<void>;
}
type WakeNav = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeSentinel> } };

/* --------------------------------- component ------------------------------- */

const PRESETS: { label: string; sec: number }[] = [
  { label: "1 min", sec: 60 },
  { label: "3 min", sec: 180 },
  { label: "5 min", sec: 300 },
  { label: "10 min", sec: 600 },
  { label: "15 min", sec: 900 },
  { label: "25 min", sec: 1500 },
  { label: "45 min", sec: 2700 },
  { label: "1 hour", sec: 3600 },
];

const SOUNDS: { id: SoundId; label: string }[] = [
  { id: "bell", label: "Bell" },
  { id: "chime", label: "Chime" },
  { id: "beeps", label: "Beeps" },
  { id: "silent", label: "Silent" },
];

export function CountdownTool() {
  const [hydrated, setHydrated] = useState(false);
  const [total, setTotal] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [label, setLabel] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [sound, setSound] = useState<SoundId>("bell");
  const [volume, setVolume] = useState(0.7);
  const [finishAt, setFinishAt] = useState<string>("");
  const [saved, setSaved] = useState<SavedTimer[]>([]);
  const [h, setH] = useState("0");
  const [m, setM] = useState("5");
  const [s, setS] = useState("0");
  const [saveName, setSaveName] = useState("");

  const endRef = useRef<number>(0);
  const wakeRef = useRef<WakeSentinel | null>(null);
  const baseTitle = useRef<string>("");

  /* --------------------- one-time restore (survives reload) --------------- */
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const rs = loadJSON<RunState>(STATE_KEY);
      if (rs && rs.endEpoch > Date.now()) {
        setTotal(rs.totalSec);
        setLabel(rs.label);
        setRepeat(rs.repeat);
        setRemaining(Math.ceil((rs.endEpoch - Date.now()) / 1000));
        setRunning(true); // tick effect arms itself from `remaining`
      }
      setSaved(loadJSON<SavedTimer[]>(SAVED_KEY) ?? []);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------- ticking -------------------------------- */
  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + remaining * 1000;
    const d = new Date(endRef.current);
    setFinishAt(d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));

    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setDone(true);
      }
    }, 200);
    return () => clearInterval(id);
     
  }, [running]);

  /* --------------------------- alarm + repeat ------------------------------ */
  useEffect(() => {
    if (!done) return;
    playSound(sound, volume);
    if (repeat) {
      const t = window.setTimeout(() => {
        setDone(false);
        setRemaining(total);
        setRunning(true);
      }, 1500);
      return () => window.clearTimeout(t);
    }
  }, [done, sound, volume, repeat, total]);

  /* ---------------------------- tab title --------------------------------- */
  useEffect(() => {
    if (!baseTitle.current) baseTitle.current = document.title;
    if (!running) {
      document.title = baseTitle.current || document.title;
      return;
    }
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    document.title = `${mm}:${ss}${label ? ` · ${label}` : ""} — countdown`;
  }, [running, remaining, label]);

  /* ----------------------------- wake lock -------------------------------- */
  useEffect(() => {
    let cancelled = false;
    const nav = navigator as WakeNav;
    if (running && nav.wakeLock) {
      nav.wakeLock
        .request("screen")
        .then((sent) => {
          if (cancelled) void sent.release().catch(() => undefined);
          else wakeRef.current = sent;
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
      if (wakeRef.current) {
        void wakeRef.current.release().catch(() => undefined);
        wakeRef.current = null;
      }
    };
  }, [running]);

  /* --------------------------- persistence -------------------------------- */
  useEffect(() => {
    if (!hydrated) return;
    if (running) {
      const payload: RunState = { endEpoch: endRef.current, totalSec: total, label, repeat };
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem(STATE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [running, total, label, repeat, hydrated]);

  /* ------------------------------ actions --------------------------------- */
  const arm = useCallback((sec: number, startNow: boolean) => {
    const clamped = Math.max(1, Math.min(359999, Math.round(sec)));
    setTotal(clamped);
    setRemaining(clamped);
    setDone(false);
    setRunning(startNow);
  }, []);

  const pause = () => setRunning(false);

  const resume = () => {
    if (remaining <= 0) setRemaining(total);
    setDone(false);
    setRunning(true);
  };

  const addMinute = () => {
    if (running) {
      endRef.current += 60000;
      setTotal((t) => t + 60);
      setRemaining(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)));
    } else {
      arm(total + 60, false);
    }
  };

  const fromHMS = () => {
    const sec = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
    if (sec <= 0) return;
    arm(sec, false);
  };

  const savePreset = () => {
    const name = saveName.trim() || label.trim() || fmtShort(total);
    const entry: SavedTimer = { id: uid(), label: name, sec: total };
    const next = [entry, ...saved].slice(0, 12);
    setSaved(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSaveName("");
  };

  const deletePreset = (id: string) => {
    const next = saved.filter((sv) => sv.id !== id);
    setSaved(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  /* ------------------------------- render --------------------------------- */
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const hh = Math.floor(remaining / 3600);
  const pct = total > 0 ? remaining / total : 0;
  const urgent = running && remaining <= 10;

  const R = 88;
  const CIRC = 2 * Math.PI * R;

  const display = useMemo(
    () => (hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`),
    [hh, mm, ss]
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* dial */}
      <div className="relative mx-auto flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
          <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-zinc-800" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
            className={`transition-[stroke-dashoffset] duration-300 ${urgent ? "text-rose-500" : done ? "text-emerald-500" : "text-emerald-400"}`}
          />
        </svg>
        <div className={`relative text-center ${urgent ? "animate-pulse" : ""}`}>
          <p className={`font-mono text-5xl font-black tabular-nums tracking-tight sm:text-6xl ${done ? "text-emerald-400" : urgent ? "text-rose-400" : "text-zinc-50"}`}>
            {display}
          </p>
          <p className="mt-1 max-w-40 truncate text-xs text-zinc-500">
            {label || (done ? "time is up" : running ? "counting down" : remaining === total ? "ready" : "paused")}
          </p>
          {running && finishAt && (
            <p className="mt-0.5 text-[11px] text-zinc-600">finishes at {finishAt}</p>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={running ? pause : resume}
          className={`min-w-28 font-semibold ${running ? "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700" : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"}`}
        >
          {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? "Pause" : remaining === total ? "Start" : "Resume"}
        </Button>
        <Button variant="outline" onClick={addMinute} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
          <Plus className="h-4 w-4" aria-hidden /> 1 min
        </Button>
        <Button
          variant="outline"
          onClick={() => arm(total, false)}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset
        </Button>
      </div>

      {/* presets */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.sec}
              type="button"
              onClick={() => {
                setLabel(p.label === "1 hour" ? "" : p.label.replace(" min", "m"));
                arm(p.sec, false);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                total === p.sec
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* H/M/S + label */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:grid-cols-[repeat(3,64px)_1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="ct-h" className={labelCls}>Hours</Label>
            <Input id="ct-h" type="number" min="0" max="99" value={h} onChange={(e) => setH(e.target.value)} className={`${inputCls} h-9 text-center`} aria-label="Timer hours" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ct-m" className={labelCls}>Minutes</Label>
            <Input id="ct-m" type="number" min="0" max="59" value={m} onChange={(e) => setM(e.target.value)} className={`${inputCls} h-9 text-center`} aria-label="Timer minutes" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ct-s" className={labelCls}>Seconds</Label>
            <Input id="ct-s" type="number" min="0" max="59" value={s} onChange={(e) => setS(e.target.value)} className={`${inputCls} h-9 text-center`} aria-label="Timer seconds" />
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label htmlFor="ct-label" className={labelCls}>Label</Label>
            <Input id="ct-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Eggs, laundry…" className={`${inputCls} h-9`} />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-1">
            <Button variant="outline" size="sm" onClick={fromHMS} className="h-9 w-full border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 sm:w-auto">
              <AlarmClock className="h-3.5 w-3.5" aria-hidden /> Set
            </Button>
          </div>
        </div>
      </div>

      {/* sound + options */}
      <div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className={labelCls}>Alarm sound</p>
          <div className="flex flex-wrap gap-1.5">
            {SOUNDS.map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => setSound(snd.id)}
                aria-pressed={sound === snd.id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  sound === snd.id
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {snd.id === "silent" ? <BellOff className="h-3 w-3" aria-hidden /> : <Bell className="h-3 w-3" aria-hidden />}
                {snd.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 flex-1 accent-emerald-500"
              aria-label="Alarm volume"
            />
            <Button variant="outline" size="sm" onClick={() => playSound(sound, volume)} className="h-7 border-zinc-700 bg-zinc-900 px-2 text-[11px] text-zinc-300 hover:bg-zinc-800">
              <Music4 className="h-3 w-3" aria-hidden /> Test
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className={labelCls}>Behaviour</p>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">
            <span className="flex items-center gap-2">
              <Repeat className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> Repeat in a loop
              <span className="text-zinc-500">(intervals)</span>
            </span>
            <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="h-4 w-4 accent-emerald-500" aria-label="Repeat timer in a loop" />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">
            <span className="flex items-center gap-2">
              <Bookmark className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> Keep screen awake while running
            </span>
            <input type="checkbox" checked disabled readOnly className="h-4 w-4 accent-emerald-500" aria-label="Keep screen awake (automatic)" />
          </label>
          <p className="text-[11px] leading-relaxed text-zinc-600">
            The timer keeps counting across page reloads, and the remaining time shows in the tab title.
          </p>
        </div>
      </div>

      {/* saved timers */}
      <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="ct-save" className={labelCls}>Save current as preset</Label>
            <Input id="ct-save" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={label || fmtShort(total)} className={`${inputCls} h-9`} />
          </div>
          <Button variant="outline" size="sm" onClick={savePreset} className="h-9 border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
            <Save className="h-3.5 w-3.5" aria-hidden /> Save
          </Button>
        </div>
        {saved.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {saved.map((sv) => (
              <span
                key={sv.id}
                className="group flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-3 pr-1.5 text-xs text-zinc-300"
              >
                <button type="button" onClick={() => { setLabel(sv.label); arm(sv.sec, false); }} className="hover:text-emerald-300" aria-label={`Load timer ${sv.label}`}>
                  <span className="font-medium">{sv.label}</span>{" "}
                  <span className="font-mono text-zinc-500">{fmtShort(sv.sec)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deletePreset(sv.id)}
                  aria-label={`Delete preset ${sv.label}`}
                  className="rounded-full p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtShort(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0 && s > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
