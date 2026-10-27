"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ArrowLeftRight,
  Pause,
  Play,
  RotateCcw,
  Flag,
} from "lucide-react";
import { inputCls, labelCls, selectTriggerCls, CopyButton } from "./hooks";

/* ------------------------------ Unit Converter ----------------------------- */

const UNITS: Record<string, { label: string; units: Record<string, number> }> = {
  Length: {
    label: "Length",
    units: {
      Kilometer: 1000, Meter: 1, Centimeter: 0.01, Millimeter: 0.001,
      Mile: 1609.344, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254,
    },
  },
  Weight: {
    label: "Weight",
    units: {
      Kilogram: 1, Gram: 0.001, Milligram: 0.000001, "Metric ton": 1000,
      Pound: 0.45359237, Ounce: 0.028349523,
    },
  },
  Data: {
    label: "Data (decimal)",
    units: {
      Terabyte: 1e6, Gigabyte: 1e3, Megabyte: 1, Kilobyte: 1e-3, Byte: 1e-6,
    },
  },
  Speed: {
    label: "Speed",
    units: {
      "m/s": 1, "km/h": 0.2777778, mph: 0.44704, knot: 0.5144444, "ft/s": 0.3048,
    },
  },
};

function tempToC(v: number, u: string) {
  if (u === "Celsius") return v;
  if (u === "Fahrenheit") return (v - 32) * (5 / 9);
  return v - 273.15;
}
function tempFromC(c: number, u: string) {
  if (u === "Celsius") return c;
  if (u === "Fahrenheit") return c * (9 / 5) + 32;
  return c + 273.15;
}
const TEMP_UNITS = ["Celsius", "Fahrenheit", "Kelvin"];

export function UnitConverterTool() {
  const [cat, setCat] = useState("Length");
  const isTemp = cat === "Temperature";
  const unitNames = isTemp ? TEMP_UNITS : Object.keys(UNITS[cat].units);
  const [from, setFrom] = useState(unitNames[0]);
  const [to, setTo] = useState(unitNames[1]);
  const [value, setValue] = useState("1");

  // switching category resets units via the click handler (not an effect)
  const pickCategory = (c: string) => {
    setCat(c);
    const names = c === "Temperature" ? TEMP_UNITS : Object.keys(UNITS[c].units);
    setFrom(names[0]);
    setTo(names[1] ?? names[0]);
  };

  const result = useMemo(() => {
    const v = Number(value);
    if (!Number.isFinite(v) || !from || !to) return null;
    let out: number;
    if (isTemp) {
      out = tempFromC(tempToC(v, from), to);
    } else {
      const f = UNITS[cat].units[from] ?? 1;
      const t = UNITS[cat].units[to] ?? 1;
      out = (v * f) / t;
    }
    return out;
  }, [value, from, to, cat, isTemp]);

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (result !== null) setValue(String(Number(result.toFixed(10))));
  };

  const pretty = (n: number) => {
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    const digits = abs !== 0 && abs < 0.001 ? 8 : abs < 1 ? 6 : abs < 1000 ? 4 : 2;
    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Measurement category">
        {[...Object.keys(UNITS), "Temperature"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pickCategory(c)}
            aria-pressed={cat === c}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              cat === c
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {c === "Temperature" ? "Temperature" : UNITS[c].label}
          </button>
        ))}
      </div>

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="uc-from" className={labelCls}>From</Label>
          <Input
            id="uc-from"
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputCls}
          />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="Convert from unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {unitNames.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap units"
          className="mb-0.5 h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/60 hover:bg-zinc-800 hover:text-emerald-300"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </Button>
        <div className="space-y-1.5">
          <Label className={labelCls}>To</Label>
          <div className="flex h-9 items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-3">
            {result !== null ? (
              <span className="truncate text-sm font-semibold text-emerald-400">{pretty(result)}</span>
            ) : (
              <span className="text-sm text-zinc-600">—</span>
            )}
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="Convert to unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {unitNames.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {result !== null && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center text-sm text-zinc-300">
          {Number(value).toLocaleString()} {from} ={" "}
          <span className="font-semibold text-emerald-400">
            {pretty(result)} {to}
          </span>
          <CopyButton
            text={String(result)}
            label="Copy"
            className="ml-3 h-7 border-0 bg-transparent px-2 text-xs text-zinc-500 hover:bg-zinc-800"
          />
        </p>
      )}
      <p className="text-xs text-zinc-500">Data units use decimal (SI) multiples: 1 GB = 1,000 MB.</p>
    </div>
  );
}

/* ---------------------------- Currency Converter --------------------------- */

const RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, PKR: 278, BDT: 120, INR: 84,
  JPY: 150, CAD: 1.36, AUD: 1.52, SAR: 3.75, AED: 3.67, CNY: 7.2,
};
const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", PKR: "₨", BDT: "৳", INR: "₹",
  JPY: "¥", CAD: "C$", AUD: "A$", SAR: "﷼", AED: "د.إ", CNY: "¥",
};

export function CurrencyTool() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("PKR");

  const result = useMemo(() => {
    const v = Number(amount);
    if (!Number.isFinite(v)) return null;
    const f = RATES[from], t = RATES[to];
    return (v / f) * t;
  }, [amount, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-5">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="cur-amt" className={labelCls}>Amount</Label>
          <Input
            id="cur-amt"
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
          />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="From currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {Object.keys(RATES).map((c) => (
                <SelectItem key={c} value={c}>
                  {SYMBOLS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap currencies"
          className="mb-0.5 h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/60 hover:bg-zinc-800 hover:text-emerald-300"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </Button>
        <div className="space-y-1.5">
          <Label className={labelCls}>Converted</Label>
          <div className="flex h-9 items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-3">
            {result !== null ? (
              <span className="truncate text-sm font-semibold text-emerald-400">
                {SYMBOLS[to]} {result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-sm text-zinc-600">—</span>
            )}
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="To currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {Object.keys(RATES).map((c) => (
                <SelectItem key={c} value={c}>
                  {SYMBOLS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {result !== null && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center text-sm text-zinc-300">
          {SYMBOLS[from]}{Number(amount).toLocaleString()} {from} ={" "}
          <span className="font-semibold text-emerald-400">
            {SYMBOLS[to]}{result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}
          </span>
          <span className="ml-2 text-xs text-zinc-500">
            (1 {from} ≈ {(RATES[to] / RATES[from]).toFixed(4)} {to})
          </span>
        </div>
      )}
      <p className="text-xs text-zinc-500">
        Offline reference rates for quick estimates — not live market rates. For exact figures
        (transfers, invoicing), check a live source.
      </p>
    </div>
  );
}

/* --------------------------------- Stopwatch -------------------------------- */

export function StopwatchTool() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const accumRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const id = setInterval(() => {
      setElapsed(accumRef.current + (performance.now() - startRef.current));
    }, 47);
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
  };

  const fmt = (ms: number) => {
    const cs = Math.floor(ms / 10) % 100;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  const lap = () => setLaps([elapsed, ...laps]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <p
        className="text-center font-mono text-6xl font-bold tabular-nums text-zinc-50"
        aria-live="off"
      >
        {fmt(elapsed)}
      </p>
      <div className="flex items-center justify-center gap-3">
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
          {running ? "Stop" : elapsed > 0 ? "Resume" : "Start"}
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
          className="h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {laps.length > 0 && (
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {laps.map((l, i) => {
            const idx = laps.length - i;
            const prev = laps[i + 1] ?? 0;
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm"
              >
                <span className="text-zinc-500">Lap {idx}</span>
                <span className="font-mono tabular-nums text-zinc-300">+{fmt(l - prev)}</span>
                <span className="font-mono tabular-nums text-zinc-100">{fmt(l)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
