"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock4, Binary, Landmark, Timer, Play, Pause, RotateCcw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stat, CopyButton, inputCls, labelCls } from "./hooks";

/* ------------------------------ Timestamp Converter -------------------------- */

function fmtDate(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relTime(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [86400000 * 365, "year"],
    [86400000 * 30, "month"],
    [86400000, "day"],
    [3600000, "hour"],
    [60000, "minute"],
    [1000, "second"],
  ];
  for (const [size, name] of units) {
    if (abs >= size) {
      const n = Math.floor(abs / size);
      return diff > 0 ? `in ${n} ${name}${n === 1 ? "" : "s"}` : `${n} ${name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

export function TimestampTool() {
  const [tsInput, setTsInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [now, setNow] = useState(() => Date.now());
  const [dtInput, setDtInput] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsed = useMemo(() => {
    const raw = tsInput.trim();
    if (!/^\d{10,13}$/.test(raw)) return null;
    const ms = raw.length >= 13 ? Number(raw) : Number(raw) * 1000;
    const d = new Date(ms);
    return Number.isFinite(d.getTime()) ? { ms, d } : null;
  }, [tsInput]);

  const dtParsed = useMemo(() => {
    if (!dtInput) return null;
    const d = new Date(dtInput);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [dtInput]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-400/80">Right now</p>
            <p className="font-mono text-lg font-bold text-zinc-50">{Math.floor(now / 1000)}</p>
            <p className="text-xs text-zinc-500">{fmtDate(new Date(now))}</p>
          </div>
          <CopyButton text={String(Math.floor(now / 1000))} label="Copy current timestamp" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Clock4 className="h-4 w-4 text-emerald-400" aria-hidden /> Timestamp → date
        </p>
        <div className="space-y-1.5">
          <Input
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            className={`${inputCls} font-mono`}
            placeholder="1735689600 or 1735689600000"
            aria-label="Unix timestamp"
          />
          {tsInput && !parsed && <p className="text-xs text-red-400">Enter 10 digits (seconds) or 13 digits (milliseconds).</p>}
        </div>
        {parsed && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Your local time</p>
                <p className="truncate text-sm text-zinc-100">{fmtDate(parsed.d)}</p>
              </div>
              <CopyButton text={fmtDate(parsed.d)} label="" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">UTC</p>
                <p className="truncate text-sm text-zinc-100">{parsed.d.toUTCString()}</p>
              </div>
              <CopyButton text={parsed.d.toUTCString()} label="" />
            </div>
            <p className="text-xs text-teal-400">{relTime(parsed.ms)}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Clock4 className="h-4 w-4 text-teal-400" aria-hidden /> Date → timestamp
        </p>
        <input
          type="datetime-local"
          value={dtInput}
          onChange={(e) => setDtInput(e.target.value)}
          className={`${inputCls} h-9 w-full rounded-md border bg-zinc-900 px-3 text-sm`}
          aria-label="Pick a date and time"
        />
        {dtParsed && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Seconds</p>
                <p className="font-mono text-sm text-zinc-100">{Math.floor(dtParsed.getTime() / 1000)}</p>
              </div>
              <CopyButton text={String(Math.floor(dtParsed.getTime() / 1000))} label="" />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Milliseconds</p>
                <p className="font-mono text-sm text-zinc-100">{dtParsed.getTime()}</p>
              </div>
              <CopyButton text={String(dtParsed.getTime())} label="" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Base Converter ---------------------------- */

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

function fromBase(value: string, base: number): bigint | null {
  const v = value.trim().toLowerCase().replace(/^0[xbo]/, "");
  if (!v) return null;
  let n = 0n;
  const b = BigInt(base);
  for (const ch of v) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) return null;
    n = n * b + BigInt(d);
  }
  return n;
}

function toBase(n: bigint, base: number): string {
  if (n === 0n) return "0";
  const b = BigInt(base);
  let out = "";
  while (n > 0n) {
    out = DIGITS[Number(n % b)] + out;
    n /= b;
  }
  return out;
}

export function BaseConverterTool() {
  const [value, setValue] = useState("255");
  const [base, setBase] = useState("10");

  const parsed = useMemo(() => {
    const b = Number(base);
    if (![2, 8, 10, 16, 36].includes(b)) return null;
    return fromBase(value, b);
  }, [value, base]);

  const badChars = useMemo(() => {
    if (parsed !== null) return false;
    return value.trim().length > 0;
  }, [parsed, value]);

  const targets = [
    { base: 2, label: "Binary (base 2)" },
    { base: 8, label: "Octal (base 8)" },
    { base: 10, label: "Decimal (base 10)" },
    { base: 16, label: "Hexadecimal (base 16)" },
    { base: 36, label: "Base 36" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label htmlFor="bc-val" className={labelCls}>Number</Label>
          <Input
            id="bc-val"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${inputCls} font-mono text-base`}
            placeholder="Enter a whole number"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-base" className={labelCls}>Input base</Label>
          <select
            id="bc-base"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className={`${inputCls} h-9 w-full rounded-md border bg-zinc-900 px-2.5 text-sm`}
          >
            <option value="2">Binary (2)</option>
            <option value="8">Octal (8)</option>
            <option value="10">Decimal (10)</option>
            <option value="16">Hex (16)</option>
            <option value="36">Base 36</option>
          </select>
        </div>
      </div>

      {badChars && (
        <p className="text-xs text-red-400">
          “{value.trim()}” contains characters that are not valid in base {base}.
        </p>
      )}

      {parsed !== null && (
        <div className="space-y-2">
          {targets.map((t) => {
            const out = toBase(parsed, t.base);
            return (
              <div key={t.base} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{t.label}</p>
                  <p className="truncate font-mono text-sm text-emerald-300">{out}</p>
                </div>
                <CopyButton text={out} label="" />
              </div>
            );
          })}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <Binary className="h-4 w-4 shrink-0 text-teal-400" aria-hidden />
            <p className="text-xs leading-relaxed text-zinc-500">
              Byte view: <span className="font-mono text-zinc-300">{parsed.toString(2).padStart(8, "0").slice(-32).replace(/(.{8})(?=.)/g, "$1 ")}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Roman Numerals ---------------------------- */

const ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export function RomanTool() {
  const [num, setNum] = useState("2026");
  const [roman, setRoman] = useState("");

  const toRomanOut = useMemo(() => {
    const n = Math.floor(Number(num));
    if (!Number.isFinite(n) || n < 1 || n > 3999) return null;
    let rest = n;
    let out = "";
    for (const [v, s] of ROMAN) {
      while (rest >= v) {
        out += s;
        rest -= v;
      }
    }
    return out;
  }, [num]);

  const fromRomanOut = useMemo(() => {
    const r = roman.trim().toUpperCase();
    if (!r) return null;
    if (!/^(?=[MDCLXVI])M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(r)) return null;
    const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < r.length; i++) {
      const cur = values[r[i]];
      const next = values[r[i + 1]] ?? 0;
      total += cur < next ? -cur : cur;
    }
    return total;
  }, [roman]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Landmark className="h-4 w-4 text-emerald-400" aria-hidden /> Number → Roman
          </p>
          <Input value={num} onChange={(e) => setNum(e.target.value)} className={`${inputCls} font-mono`} placeholder="1 – 3999" aria-label="Number to convert" />
          {toRomanOut ? (
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5">
              <p className="font-mono text-lg font-bold tracking-wider text-emerald-300">{toRomanOut}</p>
              <CopyButton text={toRomanOut} label="" />
            </div>
          ) : (
            num.trim() && <p className="text-xs text-red-400">Enter a whole number between 1 and 3999.</p>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Landmark className="h-4 w-4 text-teal-400" aria-hidden /> Roman → Number
          </p>
          <Input value={roman} onChange={(e) => setRoman(e.target.value)} className={`${inputCls} font-mono uppercase`} placeholder="MMXXVI" aria-label="Roman numeral" />
          {fromRomanOut !== null ? (
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5">
              <p className="font-mono text-lg font-bold text-teal-300">{fromRomanOut.toLocaleString()}</p>
              <CopyButton text={String(fromRomanOut)} label="" />
            </div>
          ) : (
            roman.trim() && <p className="text-xs text-red-400">That isn’t a valid Roman numeral (e.g. MCMXCIV).</p>
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-600">
        Roman numerals have no zero and can’t exceed 3,999 in standard form — that’s why years like 2026 work fine (MMXXVI) but 4,000 does not.
      </p>
    </div>
  );
}

/* --------------------------------- Countdown Timer -------------------------- */

export function CountdownTool() {
  const [total, setTotal] = useState(5 * 60);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [customMin, setCustomMin] = useState("7");
  const endRef = useRef<number>(0);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + remaining * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setDone(true);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!done) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = audioRef.current ?? new Ctx();
      audioRef.current = ctx;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.4 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.4 + 0.32);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.4);
        osc.stop(ctx.currentTime + i * 0.4 + 0.35);
      }
    } catch {
      /* audio blocked */
    }
  }, [done]);

  const setPreset = (mins: number) => {
    setRunning(false);
    setDone(false);
    setTotal(mins * 60);
    setRemaining(mins * 60);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  const PRESETS = [1, 3, 5, 10, 15, 25, 45];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 py-12 text-center">
        <div
          aria-hidden
          className="absolute bottom-0 left-0 h-full bg-emerald-500/10 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
        <p className={`relative font-mono text-7xl font-black tabular-nums tracking-tight ${done ? "text-emerald-400" : "text-zinc-50"}`}>
          {mm}:{ss}
        </p>
        <p className="relative mt-2 text-sm text-zinc-500">
          {done ? "Time is up — take a break!" : running ? "Counting down…" : remaining === total ? "Ready" : "Paused"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          onClick={() => {
            if (remaining <= 0) setRemaining(total);
            setDone(false);
            setRunning((r) => !r);
          }}
          className="min-w-28 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? "Pause" : remaining === total ? "Start" : "Resume"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setRunning(false);
            setDone(false);
            setRemaining(total);
          }}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Timer className="h-4 w-4 text-emerald-400" aria-hidden /> Quick presets
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPreset(m)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                total === m * 60
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="ct-min" className={labelCls}>Custom minutes</Label>
            <Input
              id="ct-min"
              type="number"
              min="0"
              max="600"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className={`${inputCls} w-28`}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setPreset(Math.max(0, Math.min(600, Number(customMin) || 0)))}
          >
            Set timer
          </Button>
        </div>
      </div>
    </div>
  );
}
