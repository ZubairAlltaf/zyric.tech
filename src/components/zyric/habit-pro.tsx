"use client";

/*
 * HABIT PRO — habit building with real depth.
 * Per-habit emoji + color + weekly target, 7-day circle view AND 30-day
 * heatmap, current streak + best streak + 30-day completion rate, inline
 * editing, archive with restore. Migrates the legacy {id,name,dates} format.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Flame,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { dateStrOffset, inputCls, todayStr, uid, useLocalStorage } from "./hooks";

/* --------------------------------- Model ---------------------------------- */

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: number;
  targetPerWeek: number;
  dates: string[];
  archived: boolean;
  createdAt: number;
}

const HABIT_COLORS = [
  { name: "Emerald", done: "border-emerald-400 bg-emerald-500 text-zinc-950", soft: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  { name: "Sky", done: "border-sky-400 bg-sky-500 text-zinc-950", soft: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
  { name: "Violet", done: "border-violet-400 bg-violet-500 text-zinc-950", soft: "bg-violet-500/15 text-violet-300 border-violet-500/40" },
  { name: "Amber", done: "border-amber-400 bg-amber-500 text-zinc-950", soft: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  { name: "Rose", done: "border-rose-400 bg-rose-500 text-zinc-950", soft: "bg-rose-500/15 text-rose-300 border-rose-500/40" },
  { name: "Teal", done: "border-teal-400 bg-teal-500 text-zinc-950", soft: "bg-teal-500/15 text-teal-300 border-teal-500/40" },
];

const EMOJIS = ["💪", "📚", "🧘", "🏃", "💧", "🌙", "🙏", "✍️", "🎸", "🥗", "🛏️", "🧹", "💻", "🎯", "☀️", "🧠"];

function normalizeHabit(raw: unknown): Habit {
  const h = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    id: typeof h.id === "string" ? h.id : uid(),
    name: typeof h.name === "string" ? h.name : "Habit",
    emoji: typeof h.emoji === "string" && h.emoji ? h.emoji : EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    color: typeof h.color === "number" ? Math.abs(h.color) % HABIT_COLORS.length : 0,
    targetPerWeek: typeof h.targetPerWeek === "number" ? Math.min(7, Math.max(1, h.targetPerWeek)) : 7,
    dates: Array.isArray(h.dates) ? (h.dates as unknown[]).filter((d): d is string => typeof d === "string") : [],
    archived: h.archived === true,
    createdAt: typeof h.createdAt === "number" ? h.createdAt : Date.now(),
  };
}

function streakOf(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  let cursor = new Date();
  if (!set.has(todayStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(todayStr(cursor))) return 0;
  }
  while (set.has(todayStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function bestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = new Date(`${d}T00:00`).getTime();
    if (prev !== null && t - prev === 86400000) run++;
    else run = 1;
    prev = t;
    best = Math.max(best, run);
  }
  return best;
}

/* ------------------------------- Habit (main) ------------------------------ */

export function HabitTool() {
  const [raw, setRaw] = useLocalStorage<unknown[]>("habits", []);
  const habits = useMemo(() => (Array.isArray(raw) ? raw.map(normalizeHabit) : []), [raw]);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(0);
  const [target, setTarget] = useState(7);
  const [view, setView] = useState<"week" | "heat">("week");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const today = todayStr();
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => dateStrOffset(i - 6)), []);
  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => dateStrOffset(i - 29)), []);

  const write = (updater: (hs: Habit[]) => Habit[]) =>
    setRaw((prev) => updater((Array.isArray(prev) ? prev : []).map(normalizeHabit)));

  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);
  const doneToday = active.filter((h) => h.dates.includes(today)).length;

  const add = () => {
    const n = name.trim();
    if (!n) return;
    write((hs) => [
      ...hs,
      { id: uid(), name: n, emoji, color, targetPerWeek: target, dates: [], archived: false, createdAt: Date.now() },
    ]);
    setName("");
    setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    setColor((c) => (c + 1) % HABIT_COLORS.length);
  };

  const toggle = (id: string, date: string) =>
    write((hs) =>
      hs.map((h) =>
        h.id === id
          ? { ...h, dates: h.dates.includes(date) ? h.dates.filter((d) => d !== date) : [...h.dates, date] }
          : h
      )
    );

  const saveEdit = () => {
    if (!draft) return;
    const clean: Habit = {
      ...draft,
      name: draft.name.trim() || draft.name,
      targetPerWeek: Math.min(7, Math.max(1, draft.targetPerWeek)),
    };
    write((hs) => hs.map((h) => (h.id === clean.id ? clean : h)));
    setEditingId(null);
    setDraft(null);
  };

  const statCard = "rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3";

  return (
    <div className="space-y-5">
      {/* summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Today</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {doneToday}<span className="text-sm text-zinc-500"> / {active.length}</span>
          </p>
          {active.length > 0 && doneToday === active.length && (
            <p className="text-[11px] text-emerald-400">All done — legend! 🔥</p>
          )}
        </div>
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Best current streak</p>
          <p className="mt-1 flex items-center gap-1 text-xl font-bold text-amber-400">
            <Flame className="h-5 w-5" aria-hidden />
            {active.length ? Math.max(0, ...active.map((h) => streakOf(h.dates))) : 0}
          </p>
        </div>
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">30-day check-ins</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {active.reduce((s, h) => s + h.dates.filter((d) => last30.includes(d)).length, 0)}
          </p>
        </div>
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Habits</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {active.length}
            {archived.length > 0 && <span className="ml-1 text-sm text-zinc-500">(+{archived.length} archived)</span>}
          </p>
        </div>
      </div>

      {/* add habit */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New habit, e.g. Read 10 pages, Exercise, Pray…"
            aria-label="New habit name"
            className={`flex-1 ${inputCls}`}
          />
          <Select value={String(target)} onValueChange={(v) => setTarget(Number(v))}>
            <SelectTrigger className="w-full text-sm sm:w-40" aria-label="Weekly target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {[1, 2, 3, 4, 5, 6, 7].map((t) => (
                <SelectItem key={t} value={String(t)}>{t}× per week</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={add}
            disabled={!name.trim()}
            className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add habit
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Icon</span>
          <div className="flex flex-wrap gap-1">
            {EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                aria-label={`Icon ${em}`}
                aria-pressed={emoji === em}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border text-sm transition-all ${
                  emoji === em ? "border-emerald-400/60 bg-emerald-500/15" : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
          <span className="ml-2 text-xs text-zinc-500">Color</span>
          <div className="flex gap-1.5">
            {HABIT_COLORS.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(i)}
                aria-label={`Color ${c.name}`}
                aria-pressed={color === i}
                className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                  color === i ? "border-zinc-100" : "border-transparent hover:border-zinc-600"
                }`}
              >
                <span className={`h-3.5 w-3.5 rounded-full ${c.done.split(" ")[1]}`} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* view toggle */}
      {active.length > 0 && (
        <div className="flex gap-1.5" role="group" aria-label="Habit view">
          {(["week", "heat"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                view === v
                  ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {v === "week" ? "Last 7 days" : "30-day heatmap"}
            </button>
          ))}
        </div>
      )}

      {/* habits */}
      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-10 text-center text-sm text-zinc-500">
          No habits yet — add one above, pick an icon and a weekly target, then check it off daily.
        </p>
      ) : (
        <div className="space-y-3">
          {active.map((h) => {
            const c = HABIT_COLORS[h.color % HABIT_COLORS.length];
            const streak = streakOf(h.dates);
            const best = bestStreak(h.dates);
            const done30 = h.dates.filter((d) => last30.includes(d)).length;
            const rate30 = Math.round((done30 / 30) * 100);
            const weekCount = h.dates.filter((d) => last7.includes(d)).length;
            const weekPct = Math.min(100, Math.round((weekCount / h.targetPerWeek) * 100));
            const isEditing = editingId === h.id && draft;
            return (
              <div key={h.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg ${c.soft}`} aria-hidden>
                    {h.emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">{h.name}</span>
                  <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
                    target {h.targetPerWeek}×/wk
                  </span>
                  <button
                    type="button"
                    onClick={() => { setEditingId(h.id); setDraft({ ...h }); }}
                    aria-label={`Edit habit ${h.name}`}
                    className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => write((hs) => hs.map((x) => (x.id === h.id ? { ...x, archived: true } : x)))}
                    aria-label={`Archive habit ${h.name}`}
                    className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => write((hs) => hs.filter((x) => x.id !== h.id))}
                    aria-label={`Delete habit ${h.name}`}
                    className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>

                {isEditing && draft ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        aria-label="Habit name"
                        className={`flex-1 ${inputCls} h-9 text-sm`}
                      />
                      <Select value={String(draft.targetPerWeek)} onValueChange={(v) => setDraft({ ...draft, targetPerWeek: Number(v) })}>
                        <SelectTrigger className="w-full text-sm sm:w-36" aria-label="Weekly target">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                          {[1, 2, 3, 4, 5, 6, 7].map((t) => (
                            <SelectItem key={t} value={String(t)}>{t}× per week</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setDraft(null); }} className="h-9 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                          <X className="h-3.5 w-3.5" aria-hidden /> Cancel
                        </Button>
                        <Button size="sm" onClick={saveEdit} className="h-9 bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400">
                          <Check className="h-3.5 w-3.5" aria-hidden /> Save
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-500">Icon</span>
                      {EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setDraft({ ...draft, emoji: em })}
                          aria-label={`Icon ${em}`}
                          aria-pressed={draft.emoji === em}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border text-sm transition-all ${
                            draft.emoji === em ? "border-emerald-400/60 bg-emerald-500/15" : "border-zinc-800 hover:border-zinc-600"
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                      <span className="ml-2 text-xs text-zinc-500">Color</span>
                      {HABIT_COLORS.map((cc, i) => (
                        <button
                          key={cc.name}
                          type="button"
                          onClick={() => setDraft({ ...draft, color: i })}
                          aria-label={`Color ${cc.name}`}
                          aria-pressed={draft.color === i}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                            draft.color === i ? "border-zinc-100" : "border-transparent hover:border-zinc-600"
                          }`}
                        >
                          <span className={`h-3.5 w-3.5 rounded-full ${cc.done.split(" ")[1]}`} aria-hidden />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : view === "week" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {last7.map((d) => {
                        const done = h.dates.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggle(h.id, d)}
                            aria-label={`${h.name} — ${d}: ${done ? "done" : "not done"}`}
                            aria-pressed={done}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                              done ? c.done : "border-zinc-700 bg-zinc-900 text-zinc-600 hover:border-zinc-500"
                            } ${d === today ? "ring-1 ring-emerald-400/50 ring-offset-2 ring-offset-zinc-950" : ""}`}
                          >
                            {done ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
                          </button>
                        );
                      })}
                    </div>
                    <span className="ml-auto flex items-center gap-3 text-xs">
                      <span className="text-zinc-500">
                        week <span className={`font-semibold ${weekPct >= 100 ? "text-emerald-400" : "text-zinc-300"}`}>{weekCount}/{h.targetPerWeek}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-sm font-semibold text-amber-400">
                        <Flame className="h-4 w-4" aria-hidden />
                        {streak}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-1" role="group" aria-label={`30-day history for ${h.name}`}>
                      {last30.map((d) => {
                        const done = h.dates.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggle(h.id, d)}
                            aria-label={`${h.name} — ${d}: ${done ? "done" : "not done"}`}
                            aria-pressed={done}
                            title={d}
                            className={`h-4 w-4 rounded-sm border transition-all ${
                              done
                                ? h.dates.includes(d) && d === today
                                  ? `${c.done} ring-1 ring-emerald-300/60`
                                  : c.done
                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1 text-sm font-semibold text-amber-400">
                        <Flame className="h-4 w-4" aria-hidden /> {streak} now · best {best}
                      </span>
                      <span>30-day rate <span className="font-semibold text-zinc-300">{rate30}%</span></span>
                      <span className="ml-auto">week {weekCount}/{h.targetPerWeek}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* archived */}
      {archived.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            aria-expanded={showArchived}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-zinc-400"
          >
            Archived habits ({archived.length})
            {showArchived ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
          </button>
          {showArchived && (
            <div className="space-y-2 border-t border-zinc-800 p-3">
              {archived.map((h) => (
                <div key={h.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                  <span className="text-base" aria-hidden>{h.emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-400">{h.name}</span>
                  <span className="text-xs text-zinc-600">{h.dates.length} check-ins</span>
                  <button
                    type="button"
                    onClick={() => write((hs) => hs.map((x) => (x.id === h.id ? { ...x, archived: false } : x)))}
                    aria-label={`Restore habit ${h.name}`}
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-emerald-400"
                  >
                    <ArchiveRestore className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => write((hs) => hs.filter((x) => x.id !== h.id))}
                    aria-label={`Delete habit ${h.name} forever`}
                    className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
