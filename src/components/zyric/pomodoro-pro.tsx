"use client";

/*
 * POMODORO PRO — a focus studio.
 * Fully customizable focus/short/long durations + long-break cadence, current
 * task label, persistent session log with today/week/all-time stats, completion
 * chime (WebAudio, optional), optional auto-start of the next phase. The ring
 * visual carries over from the classic timer.
 */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Brain,
} from "lucide-react";
import { dateStrOffset, inputCls, labelCls, todayStr, useLocalStorage } from "./hooks";

/* --------------------------------- Model ---------------------------------- */

interface PomoSettings {
  focus: number;
  short: number;
  long: number;
  every: number;
  autoStart: boolean;
  sound: boolean;
}

interface PomoSession {
  ts: number;
  mins: number;
  task: string;
}

const DEFAULT_SETTINGS: PomoSettings = {
  focus: 25,
  short: 5,
  long: 15,
  every: 4,
  autoStart: false,
  sound: true,
};

function normalizeSettings(raw: unknown): PomoSettings {
  const s = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const clamp = (v: unknown, lo: number, hi: number, dflt: number) =>
    typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : dflt;
  return {
    focus: clamp(s.focus, 1, 120, 25),
    short: clamp(s.short, 1, 60, 5),
    long: clamp(s.long, 1, 90, 15),
    every: clamp(s.every, 2, 8, 4),
    autoStart: s.autoStart === true,
    sound: s.sound !== false,
  };
}

function beep() {
  try {
    const ctx = new AudioContext();
    const freqs = [880, 1108.7, 1318.5];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.2);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    /* audio blocked — silent fallback */
  }
}

type Mode = "focus" | "short" | "long";

/* ------------------------------ Pomodoro (main) ----------------------------- */

export function PomodoroTool() {
  const [rawSettings, setRawSettings] = useLocalStorage<unknown>("pomodoro-settings", DEFAULT_SETTINGS);
  const settings = useMemo(() => normalizeSettings(rawSettings), [rawSettings]);
  const [sessions, setSessions] = useLocalStorage<PomoSession[]>("pomodoro-log", []);
  const [task, setTask] = useLocalStorage<string>("pomodoro-task", "");

  const [mode, setMode] = useState<Mode>("focus");
  const [left, setLeft] = useState(settings.focus * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0); // focus sessions since last long break
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<PomoSettings>(settings);

  const today = todayStr();
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => dateStrOffset(i - 6)), []);

  const durations: Record<Mode, number> = {
    focus: settings.focus,
    short: settings.short,
    long: settings.long,
  };

  // main timer loop — deadline-based so it never drifts
  useEffect(() => {
    if (!running) return;
    const deadline = Date.now() + left * 1000;
    const id = setInterval(() => {
      const rem = Math.round((deadline - Date.now()) / 1000);
      if (rem > 0) {
        setLeft(rem);
        return;
      }
      // phase finished
      if (mode === "focus") {
        setSessions((prev) =>
          [...prev, { ts: Date.now(), mins: settings.focus, task: task.trim().slice(0, 80) }].slice(-1000)
        );
        if (settings.sound) beep();
        const nextCycle = cycle + 1;
        setCycle(nextCycle);
        const next: Mode = nextCycle % Math.max(2, settings.every) === 0 ? "long" : "short";
        setMode(next);
        setLeft(durations[next] * 60);
        if (!settings.autoStart) setRunning(false);
      } else {
        if (settings.sound) beep();
        setMode("focus");
        setLeft(durations.focus * 60);
        if (!settings.autoStart) setRunning(false);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, left, mode, cycle, settings, task]);

  const pick = (m: Mode) => {
    setRunning(false);
    setMode(m);
    setLeft(durations[m] * 60);
  };

  const reset = () => {
    setRunning(false);
    setLeft(durations[mode] * 60);
  };

  const skip = () => {
    setRunning(false);
    if (mode === "focus") {
      setSessions((prev) =>
        [...prev, { ts: Date.now(), mins: settings.focus, task: task.trim().slice(0, 80) }].slice(-1000)
      );
      const nextCycle = cycle + 1;
      setCycle(nextCycle);
      const next: Mode = nextCycle % Math.max(2, settings.every) === 0 ? "long" : "short";
      setMode(next);
      setLeft(durations[next] * 60);
    } else {
      setMode("focus");
      setLeft(durations.focus * 60);
    }
  };

  const applySettings = () => {
    const clean = normalizeSettings(draft);
    setRawSettings(clean);
    setRunning(false);
    setMode("focus");
    setLeft(clean.focus * 60);
    setCycle(0);
    setShowSettings(false);
  };

  const stats = useMemo(() => {
    const focusSessions = sessions.filter((s) => typeof s.ts === "number" && typeof s.mins === "number");
    const todayList = focusSessions.filter((s) => todayStr(new Date(s.ts)) === today);
    const weekList = focusSessions.filter((s) => weekDays.includes(todayStr(new Date(s.ts))));
    return {
      todayCount: todayList.length,
      todayMins: todayList.reduce((a, s) => a + s.mins, 0),
      weekCount: weekList.length,
      weekMins: weekList.reduce((a, s) => a + s.mins, 0),
      allCount: focusSessions.length,
      allMins: focusSessions.reduce((a, s) => a + s.mins, 0),
      recent: [...focusSessions].reverse().slice(0, 5),
    };
  }, [sessions, today, weekDays]);

  const total = durations[mode] * 60;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = total > 0 ? ((total - left) / total) * 100 : 0;

  const MODE_DEFS: { id: Mode; label: string; icon: typeof Brain }[] = [
    { id: "focus", label: "Focus", icon: Brain },
    { id: "short", label: "Short break", icon: Coffee },
    { id: "long", label: "Long break", icon: Coffee },
  ];

  const statCard = "rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3";

  return (
    <div className="space-y-6">
      {/* current task */}
      <Input
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="What are you focusing on? (optional)"
        aria-label="Current focus task"
        className={`mx-auto max-w-md text-center text-sm ${inputCls}`}
      />

      {/* mode pills */}
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Pomodoro mode">
        {MODE_DEFS.map((m) => {
          const ModeIcon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m.id)}
              aria-pressed={mode === m.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                mode === m.id
                  ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              <ModeIcon className="h-3.5 w-3.5" aria-hidden />
              {m.label} · {durations[m.id]}m
            </button>
          );
        })}
      </div>

      {/* ring */}
      <div className="mx-auto max-w-xs text-center">
        <div className="relative mx-auto mb-4 flex h-56 w-56 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(39 39 42)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={mode === "focus" ? "rgb(52 211 153)" : "rgb(45 212 191)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-bold tabular-nums text-zinc-50">
              {mm}:{ss}
            </span>
            <span className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
              {mode === "focus" ? "Focus" : mode === "short" ? "Short break" : "Long break"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => setRunning(!running)}
            size="lg"
            className={`min-w-36 font-semibold ${
              running
                ? "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                : "bg-emerald-500 text-zinc-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
            }`}
          >
            {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {running ? "Pause" : left === total ? "Start" : "Resume"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            aria-label="Reset timer"
            className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={skip}
            aria-label="Skip to next phase (focus sessions count as completed)"
            className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <SkipForward className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          🍅 Session <span className="font-semibold text-emerald-400">{cycle % Math.max(2, settings.every) || (cycle > 0 ? Math.max(2, settings.every) : 0)}</span> of {settings.every} before a long break
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {settings.focus} min focus → {settings.short} min break; long break {settings.long} min every {settings.every}th session.
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Today</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{stats.todayCount} 🍅</p>
          <p className="text-[11px] text-zinc-500">{stats.todayMins} focus minutes</p>
        </div>
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">This week</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">{stats.weekCount}</p>
          <p className="text-[11px] text-zinc-500">{stats.weekMins} focus minutes</p>
        </div>
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">All time</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">{stats.allCount}</p>
          <p className="text-[11px] text-zinc-500">{(stats.allMins / 60).toFixed(1)} focused hours</p>
        </div>
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Recent sessions</p>
          <div className="mt-1 space-y-0.5">
            {stats.recent.length === 0 ? (
              <p className="text-[11px] text-zinc-500">No sessions yet</p>
            ) : (
              stats.recent.map((s) => (
                <p key={s.ts} className="truncate text-[11px] text-zinc-400">
                  {new Date(s.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {s.mins}m{s.task ? ` · ${s.task}` : ""}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* settings */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <button
          type="button"
          onClick={() => { setShowSettings(!showSettings); setDraft(settings); }}
          aria-expanded={showSettings}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-200"
        >
          Timer settings
          <span className="text-xs font-normal text-zinc-500">{showSettings ? "Hide" : "Customize durations & behavior"}</span>
        </button>
        {showSettings && (
          <div className="space-y-4 border-t border-zinc-800 px-4 pb-4 pt-3">
            <div className="grid gap-3 sm:grid-cols-4">
              {([
                { key: "focus", label: "Focus (min)", max: 120 },
                { key: "short", label: "Short break", max: 60 },
                { key: "long", label: "Long break", max: 90 },
                { key: "every", label: "Long break every ×", max: 8 },
              ] as const).map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`pomo-${f.key}`} className={labelCls}>{f.label}</Label>
                  <Input
                    id={`pomo-${f.key}`}
                    type="number"
                    min={1}
                    max={f.max}
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: Number(e.target.value) || 1 })}
                    className={`${inputCls} h-9`}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={draft.autoStart}
                  onChange={(e) => setDraft({ ...draft, autoStart: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
                />
                Auto-start next phase
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={draft.sound}
                  onChange={(e) => setDraft({ ...draft, sound: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
                />
                Play chime when a phase ends
              </label>
            </div>
            <div className="flex justify-end">
              <Button onClick={applySettings} className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400">
                <Check className="h-4 w-4" aria-hidden /> Apply & reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
