"use client";

/*
 * EXPENSE PRO — money tracker with real app depth.
 * Month navigation, per-category budgets with progress bars, category
 * breakdown chart, search + filters, inline entry editing, deep month stats,
 * CSV export + JSON backup/restore. Same storage keys as the legacy tool, so
 * existing entries carry over untouched.
 */

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import {
  inputCls,
  labelCls,
  selectTriggerCls,
  todayStr,
  uid,
  useLocalStorage,
} from "./hooks";

/* --------------------------------- Helpers -------------------------------- */

interface Entry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
}

const EXPENSE_CATS = ["Food", "Transport", "Shopping", "Bills", "Health", "Education", "Fun", "Other"];
const INCOME_CATS = ["Salary", "Business", "Freelance", "Gift", "Other"];
const CURRENCIES = ["$", "€", "£", "₨", "৳", "₹", "﷼"];

function ymNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function downloadFile(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeEntry(raw: unknown): Entry {
  const e = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    id: typeof e.id === "string" ? e.id : uid(),
    type: e.type === "income" ? "income" : "expense",
    amount: typeof e.amount === "number" && isFinite(e.amount) ? Math.abs(e.amount) : 0,
    category: typeof e.category === "string" ? e.category : "Other",
    note: typeof e.note === "string" ? e.note : "",
    date: typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : todayStr(),
  };
}

/* ------------------------------ Expense (main) ----------------------------- */

export function ExpenseTool() {
  const [entries, setEntries] = useLocalStorage<unknown[]>("expense-entries", []);
  const [budgets, setBudgets] = useLocalStorage<Record<string, number>>("expense-budgets", {});
  const [currency, setCurrency] = useLocalStorage<string>("expense-currency", "$");

  const [month, setMonth] = useState(ymNow);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Entry | null>(null);
  const [showBudgets, setShowBudgets] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const all = useMemo(() => (Array.isArray(entries) ? entries.map(normalizeEntry) : []), [entries]);
  const isThisMonth = month === ymNow();
  const monthEntries = useMemo(() => all.filter((e) => e.date.startsWith(month)), [all, month]);

  const fmt = (n: number) =>
    `${n < 0 ? "-" : ""}${currency}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const stats = useMemo(() => {
    const income = monthEntries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expense = monthEntries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const exp = monthEntries.filter((e) => e.type === "expense");
    const byCat = new Map<string, number>();
    exp.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    const biggest = [...exp].sort((a, b) => b.amount - a.amount)[0];
    const elapsed = isThisMonth ? new Date().getDate() : daysInMonth(month);
    const lifetimeBalance =
      all.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0) -
      all.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      byCat: [...byCat.entries()].sort((a, b) => b[1] - a[1]),
      top,
      biggest,
      avgDay: expense / Math.max(1, elapsed),
      lifetimeBalance,
    };
  }, [monthEntries, isThisMonth, month, all]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monthEntries
      .filter((e) => (filter === "all" ? true : e.type === filter))
      .filter((e) => (catFilter === "all" ? true : e.category === catFilter))
      .filter((e) => (q ? `${e.category} ${e.note}`.toLowerCase().includes(q) : true))
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  }, [monthEntries, filter, catFilter, query]);

  const add = () => {
    const amt = Math.abs(Number(amount));
    if (!amt) return;
    const entry: Entry = { id: uid(), type, amount: amt, category, note: note.trim(), date };
    setEntries([entry, ...all]);
    setAmount("");
    setNote("");
  };

  const startEdit = (e: Entry) => {
    setEditingId(e.id);
    setDraft({ ...e });
  };

  const saveEdit = () => {
    if (!draft) return;
    const amt = Math.abs(Number(draft.amount));
    if (!amt) return;
    setEntries(all.map((e) => (e.id === draft.id ? { ...draft, amount: amt } : e)));
    setEditingId(null);
    setDraft(null);
  };

  const exportCsv = () => {
    const rows = [
      "date,type,category,amount,note",
      ...all.map((e) =>
        [e.date, e.type, e.category, String(e.amount), `"${e.note.replace(/"/g, '""')}"`].join(",")
      ),
    ];
    downloadFile("zyric-expenses.csv", rows.join("\n"), "text/csv");
  };

  const exportJson = () => {
    downloadFile(
      "zyric-expenses-backup.json",
      JSON.stringify({ entries: all, budgets }, null, 2),
      "application/json"
    );
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { entries?: unknown[]; budgets?: Record<string, number> };
        const incoming = Array.isArray(parsed.entries) ? parsed.entries.map(normalizeEntry) : [];
        if (incoming.length) {
          setEntries(() => {
            const existing = all;
            const ids = new Set(existing.map((e) => e.id));
            return [...incoming.filter((e) => !ids.has(e.id)), ...existing];
          });
        }
        if (parsed.budgets && typeof parsed.budgets === "object") {
          setBudgets({ ...budgets, ...parsed.budgets });
        }
      } catch {
        /* invalid file — ignore */
      }
    };
    reader.readAsText(file);
  };

  const totalBudget = EXPENSE_CATS.reduce((s, c) => s + (budgets[c] ?? 0), 0);
  const maxCat = stats.byCat[0]?.[1] ?? 1;
  const statCard = "rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3";

  return (
    <div className="space-y-6">
      {/* month navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Previous month"
            className="h-8 w-8 rounded-lg border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold text-zinc-100">{monthLabel(month)}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Next month"
            className="h-8 w-8 rounded-lg border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          {!isThisMonth && (
            <button
              type="button"
              onClick={() => setMonth(ymNow())}
              className="ml-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
            >
              Today
            </button>
          )}
        </div>
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
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 hover:border-zinc-500 hover:text-zinc-300"
          >
            <Download className="h-3 w-3" aria-hidden /> CSV
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 hover:border-zinc-500 hover:text-zinc-300"
          >
            <Download className="h-3 w-3" aria-hidden /> Backup
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 hover:border-zinc-500 hover:text-zinc-300"
          >
            <Upload className="h-3 w-3" aria-hidden /> Restore
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import expense backup"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* month stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={statCard}>
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> Income
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{fmt(stats.income)}</p>
        </div>
        <div className={statCard}>
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <TrendingDown className="h-3.5 w-3.5 text-rose-400" aria-hidden /> Expenses
          </p>
          <p className="mt-1 text-xl font-bold text-rose-400">{fmt(stats.expense)}</p>
        </div>
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <Wallet className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> Balance (month)
          </p>
          <p className={`mt-1 text-xl font-bold ${stats.balance < 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {fmt(stats.balance)}
          </p>
        </div>
        <div className={statCard}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Avg / day</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">{fmt(stats.avgDay)}</p>
          <p className="text-[11px] text-zinc-500">
            {stats.top ? `Top: ${stats.top[0]} ${fmt(stats.top[1])}` : "no spending yet"}
          </p>
        </div>
      </div>

      {/* budgets */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
        <button
          type="button"
          onClick={() => setShowBudgets(!showBudgets)}
          aria-expanded={showBudgets}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-medium text-zinc-200">
            Monthly budgets
            {totalBudget > 0 && (
              <span className={`ml-2 text-xs font-normal ${stats.expense > totalBudget ? "text-rose-400" : "text-zinc-500"}`}>
                {fmt(stats.expense)} of {fmt(totalBudget)} used ({Math.min(999, Math.round((stats.expense / totalBudget) * 100))}%)
              </span>
            )}
          </span>
          <span className="text-xs text-zinc-500">{showBudgets ? "Hide" : "Set budgets"}</span>
        </button>
        {showBudgets && (
          <div className="space-y-3 border-t border-zinc-800 px-4 pb-4 pt-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {EXPENSE_CATS.map((c) => {
                const b = budgets[c] ?? 0;
                const spent = monthEntries.filter((e) => e.type === "expense" && e.category === c).reduce((s, e) => s + e.amount, 0);
                const pct = b > 0 ? Math.min(100, Math.round((spent / b) * 100)) : 0;
                const over = b > 0 && spent > b;
                return (
                  <div key={c} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-zinc-300">{c}</span>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        value={b || ""}
                        placeholder="0"
                        aria-label={`${c} budget`}
                        onChange={(e) => setBudgets({ ...budgets, [c]: Math.max(0, Number(e.target.value) || 0) })}
                        className="h-7 w-20 border-zinc-700 bg-zinc-900 px-1.5 text-right text-xs"
                      />
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${over ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${b > 0 ? pct : 0}%` }}
                      />
                    </div>
                    <p className={`mt-1 text-[10px] ${over ? "text-rose-400" : "text-zinc-500"}`}>
                      {fmt(spent)} spent{b > 0 ? ` / ${fmt(b)}` : " — no budget"}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-zinc-600">Budgets are monthly caps — they reset with the month navigation above.</p>
          </div>
        )}
      </div>

      {/* category breakdown */}
      {stats.byCat.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <p className="mb-3 text-sm font-medium text-zinc-200">Where the money went — {monthLabel(month)}</p>
          <div className="space-y-2">
            {stats.byCat.map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-xs text-zinc-400">{cat}</span>
                <div className="h-4 min-w-0 grow overflow-hidden rounded-md bg-zinc-800/70">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-emerald-600 to-emerald-400"
                    style={{ width: `${Math.max(4, Math.round((amt / maxCat) * 100))}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-semibold text-zinc-200">{fmt(amt)}</span>
                <span className="w-10 shrink-0 text-right text-[10px] text-zinc-500">
                  {Math.round((amt / Math.max(1, stats.expense)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* add entry */}
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
              onKeyDown={(e) => e.key === "Enter" && add()}
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
                {(type === "expense" ? EXPENSE_CATS : INCOME_CATS).map((c) => (
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
              onKeyDown={(e) => e.key === "Enter" && add()}
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end">
          <Button
            onClick={add}
            disabled={!Number(amount)}
            className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add entry
          </Button>
        </div>
      </div>

      {/* filters + list */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-36 grow sm:max-w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search note or category…"
            aria-label="Search entries"
            className="h-9 pl-9 text-sm"
          />
        </div>
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
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-8 w-36 text-xs" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
            <SelectItem value="all">All categories</SelectItem>
            {[...new Set(monthEntries.map((e) => e.category))].sort().map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-10 text-center text-sm text-zinc-500">
            No entries in {monthLabel(month)} yet — add your first one above.
          </p>
        ) : (
          visible.map((e) =>
            editingId === e.id && draft ? (
              <div key={e.id} className="rounded-xl border border-emerald-700/50 bg-emerald-950/10 p-3">
                <div className="grid gap-2 sm:grid-cols-4">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={draft.amount || ""}
                    aria-label="Edit amount"
                    onChange={(ev) => setDraft({ ...draft, amount: Number(ev.target.value) })}
                    className={`${inputCls} h-9 text-sm`}
                  />
                  <Select
                    value={draft.category}
                    onValueChange={(v) => setDraft({ ...draft, category: v })}
                  >
                    <SelectTrigger className={`h-9 ${selectTriggerCls}`} aria-label="Edit category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                      {(draft.type === "expense" ? EXPENSE_CATS : INCOME_CATS).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={draft.date}
                    aria-label="Edit date"
                    onChange={(ev) => setDraft({ ...draft, date: ev.target.value })}
                    className={`${inputCls} h-9 text-sm [color-scheme:dark]`}
                  />
                  <Input
                    value={draft.note}
                    placeholder="Note"
                    aria-label="Edit note"
                    onChange={(ev) => setDraft({ ...draft, note: ev.target.value })}
                    className={`${inputCls} h-9 text-sm`}
                  />
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setDraft(null); }} className="h-8 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                    <X className="h-3.5 w-3.5" aria-hidden /> Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdit} className="h-8 bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400">
                    <Check className="h-3.5 w-3.5" aria-hidden /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    e.type === "income" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {e.type === "income" ? <TrendingUp className="h-4 w-4" aria-hidden /> : <TrendingDown className="h-4 w-4" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {e.category}
                    {e.note && <span className="font-normal text-zinc-500"> · {e.note}</span>}
                  </p>
                  <p className="text-xs text-zinc-500">{e.date}</p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${e.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                  {e.type === "income" ? "+" : "−"}{fmt(e.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(e)}
                  aria-label={`Edit ${e.category} entry`}
                  className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setEntries(all.filter((x) => x.id !== e.id))}
                  aria-label={`Delete ${e.category} entry`}
                  className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )
          )
        )}
      </div>

      <p className="text-xs text-zinc-600">
        Lifetime balance: <span className={stats.lifetimeBalance < 0 ? "text-rose-400" : "text-emerald-400"}>{fmt(stats.lifetimeBalance)}</span> across {all.length} entries. Everything is stored on this device only.
      </p>
    </div>
  );
}
