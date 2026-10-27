"use client";

/*
 * UNIT CONVERTER PRO — an 11-category converter built for real work.
 * Features: Length, Weight, Temperature, Data (decimal AND binary KiB/MiB),
 * Speed, Area, Volume, Time, Energy, Pressure, Angle; a convert-to-every-unit
 * grid with click-to-copy; precision control (auto / 0–8 decimals); swap;
 * smart formatting; recent-conversion history (localStorage, click to restore).
 */

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, History, Trash2 } from "lucide-react";
import { CopyButton, inputCls, labelCls, selectTriggerCls } from "./hooks";

interface Cat {
  key: string;
  label: string;
  units: Record<string, number>; // factor to base unit
  base: string;
  special?: "temp";
}

const CATS: Cat[] = [
  {
    key: "length", label: "Length", base: "m",
    units: {
      Kilometer: 1000, Meter: 1, Centimeter: 0.01, Millimeter: 0.001, Micrometer: 1e-6, Nanometer: 1e-9,
      Mile: 1609.344, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254, "Nautical mile": 1852, "Light-year": 9.4607304725808e15,
    },
  },
  {
    key: "weight", label: "Weight", base: "kg",
    units: {
      "Metric ton": 1000, Kilogram: 1, Gram: 0.001, Milligram: 1e-6, Microgram: 1e-9,
      "Imperial ton": 1016.0469088, "US ton": 907.18474, Stone: 6.35029318, Pound: 0.45359237, Ounce: 0.028349523125, Carat: 0.0002,
    },
  },
  { key: "temp", label: "Temperature", base: "°C", special: "temp", units: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 } },
  {
    key: "data", label: "Data", base: "B",
    units: {
      Bit: 0.125, Byte: 1,
      Kilobyte: 1e3, Kibibyte: 1024, Megabyte: 1e6, Mebibyte: 1048576,
      Gigabyte: 1e9, Gibibyte: 1073741824, Terabyte: 1e12, Tebibyte: 1099511627776, Petabyte: 1e15,
    },
  },
  {
    key: "speed", label: "Speed", base: "m/s",
    units: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, knot: 0.514444, "ft/s": 0.3048, Mach: 340.29, "Speed of light": 299792458 },
  },
  {
    key: "area", label: "Area", base: "m²",
    units: {
      "Square kilometer": 1e6, Hectare: 1e4, "Square meter": 1, "Square centimeter": 1e-4, "Square millimeter": 1e-6,
      "Square mile": 2589988.110336, Acre: 4046.8564224, "Square yard": 0.83612736, "Square foot": 0.09290304, "Square inch": 0.00064516,
    },
  },
  {
    key: "volume", label: "Volume", base: "L",
    units: {
      "Cubic meter": 1000, Liter: 1, Milliliter: 0.001,
      "US gallon": 3.785411784, "US quart": 0.946352946, "US pint": 0.473176473, "US cup": 0.2365882365, "US fl oz": 0.0295735295625,
      "Imperial gallon": 4.54609, "Imperial pint": 0.56826125, "Imperial fl oz": 0.0284130625,
      "Cubic foot": 28.316846592, "Cubic inch": 0.016387064,
    },
  },
  {
    key: "time", label: "Time", base: "s",
    units: {
      Nanosecond: 1e-9, Microsecond: 1e-6, Millisecond: 0.001, Second: 1, Minute: 60, Hour: 3600,
      Day: 86400, Week: 604800, Month: 2592000, Year: 31536000, Decade: 315360000, Century: 3153600000,
    },
  },
  {
    key: "energy", label: "Energy", base: "J",
    units: {
      Joule: 1, Kilojoule: 1000, Calorie: 4.184, Kilocalorie: 4184, "Watt-hour": 3600, "Kilowatt-hour": 3.6e6,
      Electronvolt: 1.602176634e-19, BTU: 1055.05585262, "Foot-pound": 1.3558179483314004,
    },
  },
  {
    key: "pressure", label: "Pressure", base: "Pa",
    units: { Pascal: 1, Kilopascal: 1000, Bar: 1e5, Millibar: 100, PSI: 6894.757293168, Atmosphere: 101325, Torr: 133.322368421, "mmHg": 133.322387415 },
  },
  {
    key: "angle", label: "Angle", base: "°",
    units: { Degree: 1, Radian: 57.29577951308232, Gradian: 0.9, Arcminute: 1 / 60, Arcsecond: 1 / 3600, Turn: 360 },
  },
];

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

const RECENT_KEY = "unitconv-recent";
interface Recent {
  cat: string;
  from: string;
  to: string;
  value: string;
}

function loadRecent(): Recent[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as Recent[]) : [];
  } catch {
    return [];
  }
}

export function UnitConverterTool() {
  const [catKey, setCatKey] = useState("length");
  const cat = CATS.find((c) => c.key === catKey) ?? CATS[0];
  const unitNames = Object.keys(cat.units);

  const [from, setFrom] = useState(unitNames[0]);
  const [to, setTo] = useState(unitNames[1] ?? unitNames[0]);
  const [value, setValue] = useState("1");
  const [precision, setPrecision] = useState("auto");
  const [recent, setRecent] = useState<Recent[]>([]);

  // one-time restore of recent conversions (async — mirrors useLocalStorage)
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setRecent(loadRecent());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pickCategory = (k: string) => {
    const c = CATS.find((x) => x.key === k);
    if (!c) return;
    setCatKey(k);
    const names = Object.keys(c.units);
    setFrom(names[0]);
    setTo(names[1] ?? names[0]);
  };

  const convert = (v: number, f: string, t: string): number => {
    if (cat.special === "temp") return tempFromC(tempToC(v, f), t);
    return (v * (cat.units[f] ?? 1)) / (cat.units[t] ?? 1);
  };

  const parsed = Number(value.replace(/,/g, ""));
  const valid = value.trim() !== "" && Number.isFinite(parsed);

  const pretty = (n: number): string => {
    if (!Number.isFinite(n)) return "—";
    if (precision === "auto") {
      const abs = Math.abs(n);
      const digits = abs !== 0 && abs < 0.001 ? 8 : abs < 1 ? 6 : abs < 1000 ? 4 : 2;
      return n.toLocaleString(undefined, { maximumFractionDigits: digits });
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: Number(precision), maximumFractionDigits: Number(precision) });
  };

  const result = valid ? convert(parsed, from, to) : null;

  const remember = () => {
    if (!valid) return;
    const entry: Recent = { cat: catKey, from, to, value };
    const next = [entry, ...recent.filter((r) => !(r.cat === catKey && r.from === from && r.to === to && r.value === value))].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const t = window.setTimeout(remember, 1200);
    return () => window.clearTimeout(t);
     
  }, [value, from, to, catKey]);

  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (result !== null) setValue(String(Number(result.toPrecision(12))));
  };

  return (
    <div className="space-y-5">
      {/* categories */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Measurement category">
        {CATS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pickCategory(c.key)}
            aria-pressed={catKey === c.key}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              catKey === c.key
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* main converter */}
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
        <button
          type="button"
          onClick={swap}
          aria-label="Swap units"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-emerald-500/60 hover:bg-zinc-800 hover:text-emerald-300"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </button>
        <div className="space-y-1.5">
          <Label className={labelCls}>To</Label>
          <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-900/70 px-3">
            <span className="truncate text-sm font-semibold text-emerald-400">
              {result !== null ? pretty(result) : "—"}
            </span>
            {result !== null && (
              <CopyButton text={String(result)} label="" className="h-6 w-6 shrink-0 border-0 bg-transparent px-0 hover:bg-zinc-800" />
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
          {parsed.toLocaleString()} {from} ={" "}
          <span className="font-semibold text-emerald-400">{pretty(result)} {to}</span>
          {!cat.special && (
            <span className="ml-2 text-xs text-zinc-500">
              (1 {from} = {pretty(convert(1, from, to))} {to})
            </span>
          )}
        </p>
      )}

      {/* all-units grid */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={labelCls}>{cat.label} — everything at once</p>
          <div className="flex items-center gap-2">
            <Label htmlFor="uc-prec" className="text-[11px] text-zinc-500">Precision</Label>
            <Select value={precision} onValueChange={setPrecision}>
              <SelectTrigger id="uc-prec" className="h-7 w-28 border-zinc-800 bg-zinc-900 text-xs text-zinc-300" aria-label="Decimal precision">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <SelectItem value="auto">Auto</SelectItem>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} decimals</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {unitNames.map((u) => {
            const v = valid ? convert(parsed, from, u) : null;
            const active = u === to;
            return (
              <div
                key={u}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  active ? "border-emerald-700/50 bg-emerald-950/20" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                }`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-[11px] ${active ? "text-emerald-400" : "text-zinc-500"}`}>{u}</p>
                  <p className="truncate font-mono text-sm tabular-nums text-zinc-100">{v !== null ? pretty(v) : "—"}</p>
                </div>
                {v !== null && (
                  <CopyButton
                    text={String(v)}
                    label=""
                    className="h-6 w-6 shrink-0 border-0 bg-transparent px-0 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* recent */}
      {recent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              <History className="h-3.5 w-3.5" aria-hidden /> Recent conversions
            </p>
            <button
              type="button"
              onClick={clearRecent}
              className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-red-400"
              aria-label="Clear conversion history"
            >
              <Trash2 className="h-3 w-3" aria-hidden /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((r, i) => {
              const rc = CATS.find((c) => c.key === r.cat);
              if (!rc) return null;
              const n = Number(r.value);
              const out = Number.isFinite(n) ? convertLocal(rc, n, r.from, r.to) : null;
              return (
                <button
                  key={`${r.cat}-${r.from}-${r.to}-${r.value}-${i}`}
                  type="button"
                  onClick={() => {
                    setCatKey(r.cat);
                    setFrom(r.from);
                    setTo(r.to);
                    setValue(r.value);
                  }}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                >
                  {r.value} {r.from} → {out !== null ? prettyLite(out) : "?"} {r.to}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Data includes both decimal (1 KB = 1,000 B) and binary units (1 KiB = 1,024 B) — the honest way to convert storage.
      </p>
    </div>
  );
}

/* helper for recent chips (no state access there) */
function convertLocal(cat: Cat, v: number, f: string, t: string): number {
  if (cat.special === "temp") return tempFromC(tempToC(v, f), t);
  return (v * (cat.units[f] ?? 1)) / (cat.units[t] ?? 1);
}
function prettyLite(n: number): string {
  const abs = Math.abs(n);
  const digits = abs !== 0 && abs < 0.001 ? 6 : abs < 1 ? 4 : abs < 1000 ? 3 : 1;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
