"use client";

/*
 * WATER PRO — hydration tracker with a real memory.
 * Timestamped drink log with undo, custom cup size + quick-add volumes,
 * 7-day history chart, goal streaks, weekly totals. Migrates the legacy
 * {date,count,goal} format (old glasses become 250 ml entries).
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Minus,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { dateStrOffset, inputCls, labelCls, todayStr, useLocalStorage } from "./hooks";

/* --------------------------------- Model ---------------------------------- */

interface WaterState {
  day: string;
  drinks: number[]; // ml entries for the current day, chronological
  goalMl: number;
  cupMl: number;
  history: Record<string, number>; // day -> total ml
}

const DEFAULT_STATE: WaterState = { day: "", drinks: [], goalMl: 2000, cupMl: 250, history: {} };

function normalizeWater(raw: unknown): WaterState {
  const w = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  // legacy format: {date, count, goal} (goal in glasses)
  if (typeof w.count === "number" && !Array.isArray(w.drinks)) {
    const goalGlasses = typeof w.goal === "number" && w.goal > 0 ? w.goal : 8;
    return { ...DEFAULT_STATE, goalMl: goalGlasses * 250, cupMl: 250 };
  }
  return {
    day: typeof w.day === "string" ? w.day : "",
    drinks: Array.isArray(w.drinks) ? (w.drinks as unknown[]).filter((d): d is number => typeof d === "number") : [],
    goalMl: typeof w.goalMl === "number" && w.goalMl > 0 ? w.goalMl : 2000,
    cupMl: typeof w.cupMl === "number" && w.cupMl > 0 ? w.cupMl : 250,
    history:
      typeof w.history === "object" && w.history !== null
        ? Object.fromEntries(
            Object.entries(w.history as Record<string, unknown>).filter(
              (e): e is [string, number] => typeof e[1] === "number"
            )
          )
        : {},
  };
}

function dayTotalOf(state: WaterState, day: string): number {
  if (day === state.day) return state.drinks.reduce((s, v) => s + v, 0);
  return state.history[day] ?? 0;
}

/* ------------------------------- Water (main) ------------------------------ */

export function WaterTool() {
  const [state, setState] = useLocalStorage<WaterState>("water", DEFAULT_STATE);
  const [customMl, setCustomMl] = useState("");

  const today = todayStr();
  const current = useMemo(() => {
    const s = normalizeWater(state);
    if (s.day === today) return s;
    // roll over to a new day — archive yesterday's total
    const prevTotal = s.drinks.reduce((a, b) => a + b, 0);
    const history = { ...s.history };
    if (s.day && prevTotal > 0) history[s.day] = prevTotal;
    return { ...s, day: today, drinks: [], history };
  }, [state, today]);

  const set = (patch: Partial<WaterState>) => setState({ ...current, ...patch });

  const totalMl = current.drinks.reduce((s, v) => s + v, 0);
  const goal = current.goalMl;
  const pct = Math.min(100, Math.round((totalMl / Math.max(1, goal)) * 100));
  const done = totalMl >= goal;

  const addDrink = (ml: number) => {
    if (ml <= 0) return;
    set({ drinks: [...current.drinks, ml] });
  };

  const undoLast = () => set({ drinks: current.drinks.slice(0, -1) });

  // streak of goal-hitting days (ending today or yesterday)
  const streak = useMemo(() => {
    let s = 0;
    let cursor = 0;
    if (dayTotalOf(current, today) >= goal) cursor = 0;
    else cursor = -1;
    while (dayTotalOf(current, dateStrOffset(cursor)) >= goal && cursor > -365) {
      s++;
      cursor--;
    }
    return s;
  }, [current, goal, today]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => dateStrOffset(i - 6)), []);
  const weekTotals = week.map((d) => dayTotalOf(current, d));
  const weekSum = weekTotals.reduce((a, b) => a + b, 0);
  const weekMax = Math.max(goal, ...weekTotals);
  const weekDaysOnGoal = weekTotals.filter((t) => t >= goal).length;
  const weekAvg = weekSum / 7;

  const lastDrink = current.drinks.length ? current.drinks[current.drinks.length - 1] : 0;
  const goalL = (goal / 1000).toFixed(2);
  const totalL = (totalMl / 1000).toFixed(2);

  const ringR = 45;
  const circumference = 2 * Math.PI * ringR;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* today ring */}
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center sm:p-6">
          <div className="relative mx-auto mb-3 flex h-44 w-44 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r={ringR} fill="none" stroke="rgb(39 39 42)" strokeWidth="7" />
              <circle
                cx="50" cy="50" r={ringR} fill="none"
                stroke="rgb(34 211 238)"
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-zinc-50">{pct}%</span>
              <span className="text-[11px] uppercase tracking-widest text-zinc-500">of goal</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-50">
            {(totalMl / 1000).toFixed(2)}
            <span className="text-lg text-zinc-500"> / {goalL} L</span>
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {current.drinks.length} drink{current.drinks.length === 1 ? "" : "s"} today
            {done ? " — goal reached! 💧" : ` · ${(Math.max(0, goal - totalMl) / 1000).toFixed(2)} L to go`}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={undoLast}
              disabled={!current.drinks.length}
              aria-label="Undo last drink"
              className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              onClick={() => addDrink(current.cupMl)}
              className="h-12 rounded-full bg-cyan-500 px-6 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-cyan-400 sm:px-8 sm:text-base"
            >
              + Drink ({current.cupMl} ml)
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => set({ drinks: current.drinks.slice(0, -1) })}
              disabled={!current.drinks.length}
              aria-label="Remove last drink"
              className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          {/* quick add volumes */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {[200, 250, 330, 500, 750].map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => addDrink(ml)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  ml === current.cupMl
                    ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                    : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                +{ml}
              </button>
            ))}
            <span className="inline-flex items-center gap-1">
              <Input
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addDrink(Number(customMl));
                    setCustomMl("");
                  }
                }}
                placeholder="ml"
                aria-label="Custom volume in millilitres"
                inputMode="numeric"
                className="h-7 w-16 border-dashed border-zinc-700 bg-transparent px-2 text-center text-xs text-zinc-200 placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => { addDrink(Number(customMl)); setCustomMl(""); }}
                disabled={!Number(customMl)}
                aria-label="Add custom volume"
                className="rounded-md border border-zinc-700 p-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30"
              >
                <Check className="h-3 w-3" aria-hidden />
              </button>
            </span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            {streak > 0 && (
              <span className="text-cyan-300">🔥 {streak}-day goal streak</span>
            )}
            <button
              type="button"
              onClick={() => set({ drinks: [] })}
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300"
            >
              <RotateCcw className="h-3 w-3" aria-hidden /> Reset today
            </button>
          </div>
        </div>

        {/* week chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-200">Last 7 days</p>
            <p className="text-xs text-zinc-500">
              {weekDaysOnGoal}/7 on goal · avg {(weekAvg / 1000).toFixed(2)} L/day
            </p>
          </div>
          <div className="flex h-40 items-end justify-between gap-2">
            {week.map((d, i) => {
              const t = weekTotals[i];
              const h = Math.max(3, Math.round((t / weekMax) * 100));
              const hit = t >= goal && t > 0;
              return (
                <div key={d} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[9px] tabular-nums text-zinc-500">{t > 0 ? `${(t / 1000).toFixed(1)}` : ""}</span>
                  <div className="flex h-full w-full items-end overflow-hidden rounded-md bg-zinc-800/60">
                    <div
                      className={`w-full rounded-md transition-all ${hit ? "bg-cyan-400" : "bg-zinc-600"}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className={`text-[10px] ${d === today ? "font-semibold text-cyan-300" : "text-zinc-500"}`}>
                    {new Date(`${d}T00:00`).toLocaleDateString(undefined, { weekday: "narrow" })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* settings */}
          <div className="mt-5 grid gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="water-goal-ml" className={labelCls}>Daily goal (ml)</Label>
              <Input
                id="water-goal-ml"
                type="number"
                min={500}
                max={6000}
                step={100}
                value={current.goalMl}
                onChange={(e) => set({ goalMl: Math.min(6000, Math.max(500, Number(e.target.value) || 2000)) })}
                className={`${inputCls} h-9`}
              />
              <div className="flex gap-1">
                {[1500, 2000, 2500, 3000].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set({ goalMl: g })}
                    aria-label={`Set goal ${g} ml`}
                    className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                      current.goalMl === g
                        ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                    }`}
                  >
                    {g / 1000}L
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="water-cup-ml" className={labelCls}>Default cup (ml)</Label>
              <Input
                id="water-cup-ml"
                type="number"
                min={50}
                max={1500}
                step={10}
                value={current.cupMl}
                onChange={(e) => set({ cupMl: Math.min(1500, Math.max(50, Number(e.target.value) || 250)) })}
                className={`${inputCls} h-9`}
              />
              <p className="text-[10px] text-zinc-600">
                Used by the big drink button. One glass ≈ 250 ml.
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-zinc-600">
        Counter resets automatically each day and yesterday&apos;s total is kept in your history. Everything stays on this device.
      </p>
    </div>
  );
}
