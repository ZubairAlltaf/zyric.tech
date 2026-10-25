"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Check,
  Droplets,
  Minus,
  Flame,
  Circle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  dateStrOffset,
  inputCls,
  labelCls,
  selectTriggerCls,
  todayStr,
  uid,
  useLocalStorage,
} from "./hooks";

/* ------------------------------ Expense Tracker ---------------------------- */

interface Entry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
}

const EXPENSE_CATS = ["Food", "Transport", "Shopping", "Bills", "Health", "Education", "Other"];
const INCOME_CATS = ["Salary", "Business", "Freelance", "Gift", "Other"];
const CURRENCIES = ["$", "€", "£", "₨", "৳", "₹", "﷼"];

export function ExpenseTool() {
  const [entries, setEntries] = useLocalStorage<Entry[]>("expense-entries", []);
  const [currency, setCurrency] = useLocalStorage<string>("expense-currency", "$");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const totals = useMemo(() => {
    const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { income, expense, balance: income - expense };
  }, [entries]);

  const visible = useMemo(
    () =>
      [...entries]
        .filter((e) => filter === "all" || e.type === filter)
        .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)),
    [entries, filter]
  );

  const add = () => {
    const amt = Math.abs(Number(amount));
    if (!amt) return;
    setEntries([
      { id: uid(), type, amount: amt, category, note: note.trim(), date },
      ...entries,
    ]);
    setAmount("");
    setNote("");
  };

  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const fmt = (n: number) =>
    `${n < 0 ? "-" : ""}${currency}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> Income
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{fmt(totals.income)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <TrendingDown className="h-3.5 w-3.5 text-rose-400" aria-hidden /> Expenses
          </p>
          <p className="mt-1 text-xl font-bold text-rose-400">{fmt(totals.expense)}</p>
        </div>
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <Wallet className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> Balance
          </p>
          <p className={`mt-1 text-xl font-bold ${totals.balance < 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {fmt(totals.balance)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <div className="mb-4 flex gap-2" role="group" aria-label="Entry type">
          <button
            type="button"
            onClick={() => { setType("expense"); setCategory("Food"); }}
            aria-pressed={type === "expense"}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              type === "expense"
                ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            − Expense
          </button>
          <button
            type="button"
            onClick={() => { setType("income"); setCategory("Salary"); }}
            aria-pressed={type === "income"}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              type === "income"
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            + Income
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount" className={labelCls}>Amount</Label>
            <Input
              id="exp-amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                {cats.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-date" className={labelCls}>Date</Label>
            <Input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputCls} [color-scheme:dark]`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-note" className={labelCls}>Note (optional)</Label>
            <Input
              id="exp-note"
              placeholder="e.g. groceries"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            Currency
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 w-16 border-zinc-700 bg-zinc-900 text-zinc-200" aria-label="Currency symbol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={add}
            disabled={!Number(amount)}
            className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add entry
          </Button>
        </div>
      </div>

      <div className="flex gap-2" role="group" aria-label="Filter entries">
        {(["all", "income", "expense"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
              filter === f
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-10 text-center text-sm text-zinc-500">
            No entries yet — add your first income or expense above.
          </p>
        ) : (
          visible.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  e.type === "income"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {e.type === "income" ? (
                  <TrendingUp className="h-4 w-4" aria-hidden />
                ) : (
                  <TrendingDown className="h-4 w-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {e.category}
                  {e.note && <span className="font-normal text-zinc-500"> · {e.note}</span>}
                </p>
                <p className="text-xs text-zinc-500">{e.date}</p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  e.type === "income" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {e.type === "income" ? "+" : "−"}
                {fmt(e.amount)}
              </span>
              <button
                type="button"
                onClick={() => setEntries(entries.filter((x) => x.id !== e.id))}
                aria-label={`Delete ${e.category} entry`}
                className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Habit Tracker ------------------------------ */

interface Habit {
  id: string;
  name: string;
  dates: string[];
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

export function HabitTool() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const [name, setName] = useState("");
  const today = todayStr();
  const last7 = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dateStrOffset(i - 6)),
    []
  );

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setHabits([...habits, { id: uid(), name: n, dates: [] }]);
    setName("");
  };

  const toggle = (id: string, date: string) =>
    setHabits(
      habits.map((h) =>
        h.id === id
          ? {
              ...h,
              dates: h.dates.includes(date)
                ? h.dates.filter((d) => d !== date)
                : [...h.dates, date],
            }
          : h
      )
    );

  const doneToday = habits.filter((h) => h.dates.includes(today)).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New habit, e.g. Read 10 pages, Exercise, Pray…"
          aria-label="New habit name"
          className={`flex-1 ${inputCls}`}
        />
        <Button
          onClick={add}
          disabled={!name.trim()}
          className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-10 text-center text-sm text-zinc-500">
          No habits yet — add one above and check it off every day to build streaks.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-emerald-400">{doneToday}</span> of{" "}
            {habits.length} habits done today
            {doneToday === habits.length && habits.length > 0 ? " 🎉" : ""}
          </p>
          <div className="space-y-3">
            <div className="hidden items-center gap-2 px-4 sm:flex" aria-hidden>
              <span className="w-36 shrink-0" />
              {last7.map((d) => (
                <span key={d} className="w-9 text-center text-[10px] text-zinc-600">
                  {new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short" })}
                </span>
              ))}
              <span className="ml-auto text-[10px] text-zinc-600">Streak</span>
            </div>
            {habits.map((h) => {
              const streak = streakOf(h.dates);
              return (
                <div
                  key={h.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 sm:flex-nowrap"
                >
                  <div className="flex w-full items-center gap-2 sm:w-36 sm:shrink-0">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">
                      {h.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHabits(habits.filter((x) => x.id !== h.id))}
                      aria-label={`Delete habit ${h.name}`}
                      className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
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
                            done
                              ? "border-emerald-400 bg-emerald-500 text-zinc-950"
                              : "border-zinc-700 bg-zinc-900 text-zinc-600 hover:border-zinc-500"
                          } ${d === today ? "ring-1 ring-emerald-400/50 ring-offset-2 ring-offset-zinc-950" : ""}`}
                        >
                          {done ? (
                            <Check className="h-4 w-4" aria-hidden />
                          ) : (
                            <Circle className="h-3 w-3" aria-hidden />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-amber-400">
                    <Flame className="h-4 w-4" aria-hidden />
                    {streak}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------- To-Do List ------------------------------- */

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  createdAt: number;
}

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-600/40",
  medium: "bg-amber-500/15 text-amber-300 border-amber-600/40",
  high: "bg-rose-500/15 text-rose-300 border-rose-600/40",
};

export function TodoTool() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("todos", []);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [view, setView] = useState<"all" | "active" | "done">("all");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTasks([{ id: uid(), text: t, done: false, priority, createdAt: Date.now() }, ...tasks]);
    setText("");
  };

  const toggle = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  const visible = tasks.filter((t) =>
    view === "all" ? true : view === "active" ? !t.done : t.done
  );
  const activeCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="What needs to get done?"
          aria-label="New task"
          className={`flex-1 ${inputCls}`}
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
          <SelectTrigger className={`w-full sm:w-32 ${selectTriggerCls}`} aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={add}
          disabled={!text.trim()}
          className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "active", "done"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
              view === v
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {v}
            {v === "active" && activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        ))}
        {tasks.some((t) => t.done) && (
          <button
            type="button"
            onClick={() => setTasks(tasks.filter((t) => !t.done))}
            className="ml-auto text-xs text-zinc-500 underline decoration-dotted underline-offset-4 hover:text-rose-400"
          >
            Clear completed
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-10 text-center text-sm text-zinc-500">
            {view === "all" ? "Nothing here yet — add your first task above." : `No ${view} tasks.`}
          </p>
        ) : (
          visible.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => toggle(t.id)}
                aria-label={`Mark "${t.text}" as ${t.done ? "not done" : "done"}`}
                aria-pressed={t.done}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all ${
                  t.done
                    ? "border-emerald-400 bg-emerald-500 text-zinc-950"
                    : "border-zinc-600 text-transparent hover:border-emerald-500"
                }`}
              >
                <Check className="h-4 w-4" aria-hidden />
              </button>
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  t.done ? "text-zinc-500 line-through" : "text-zinc-100"
                }`}
              >
                {t.text}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLE[t.priority]}`}
              >
                {t.priority}
              </span>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label={`Delete task ${t.text}`}
                className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Water Tracker ----------------------------- */

interface WaterState {
  date: string;
  count: number;
  goal: number;
}

export function WaterTool() {
  const today = todayStr();
  const [state, setState] = useLocalStorage<WaterState>("water", {
    date: today,
    count: 0,
    goal: 8,
  });

  // reset for a new day (keep goal)
  const current =
    state.date === today ? state : { ...state, date: today, count: 0 };
  const set = (patch: Partial<WaterState>) =>
    setState({ ...current, ...patch });

  const pct = Math.min(100, Math.round((current.count / Math.max(1, current.goal)) * 100));
  const done = current.count >= current.goal;

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
          <Droplets
            className={`h-9 w-9 ${done ? "text-cyan-300" : "text-cyan-400"}`}
            aria-hidden
          />
        </div>
        <p className="text-4xl font-bold text-zinc-50">
          {current.count}
          <span className="text-lg text-zinc-500"> / {current.goal} glasses</span>
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          ≈ {(current.count * 0.25).toFixed(2)} L of {(current.goal * 0.25).toFixed(2)} L
          {done && " — goal reached! 💧"}
        </p>
        <div className="mt-5 space-y-2">
          <Progress
            value={pct}
            aria-label={`Daily water progress: ${pct}%`}
            className="h-2.5 bg-zinc-800 [&>div]:bg-cyan-400"
          />
          <p className="text-xs text-zinc-500">{pct}% of daily goal</p>
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => set({ count: Math.max(0, current.count - 1) })}
            aria-label="Remove one glass"
            className="h-11 w-11 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            onClick={() => set({ count: current.count + 1 })}
            className="h-12 rounded-full bg-cyan-500 px-8 text-base font-semibold text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-cyan-400"
          >
            + Drink a glass
          </Button>
        </div>
        <button
          type="button"
          onClick={() => set({ count: 0 })}
          className="mt-4 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <RotateCcw className="h-3 w-3" aria-hidden /> Reset today
        </button>
      </div>
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <Label htmlFor="water-goal" className={`${labelCls} whitespace-nowrap`}>
          Daily goal (glasses)
        </Label>
        <Input
          id="water-goal"
          type="number"
          min={1}
          max={30}
          value={current.goal}
          onChange={(e) =>
            set({ goal: Math.max(1, Math.min(30, Number(e.target.value) || 8)) })
          }
          className={`${inputCls} h-9 w-24`}
        />
      </div>
      <p className="mx-auto max-w-md text-center text-xs text-zinc-500">
        Counter resets automatically each day. Goal is saved on this device.
      </p>
    </div>
  );
}
