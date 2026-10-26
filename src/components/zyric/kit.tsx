"use client";

/* ==========================================================================
   ZYRIC KIT — building blocks for the extended tool fleet.
   Dark machine-room aesthetic, one accent color per tool, zero repetition:
   every tool composes these atoms into its own bespoke screen.
   ========================================================================== */

import type { ReactNode } from "react";
import { CopyButton } from "./hooks";

/* ------------------------------ Accents ----------------------------------- */

export const ACCENTS = [
  "#FFD43B", // amber
  "#FF9DE2", // pink
  "#7FC8FF", // sky
  "#5EE39A", // mint
  "#FF7A3D", // orange
  "#B9A6FF", // lavender
  "#C6F24E", // lime
  "#4ECDC4", // teal
  "#FF8A7A", // coral
  "#FFB3C6", // rose
  "#F5D6A3", // sand
  "#9BFF8A", // green
] as const;

/** Deterministic accent pick — tool #n gets a unique hue. */
export function accentOf(i: number): string {
  return ACCENTS[i % ACCENTS.length];
}

/* ------------------------------ Layout ------------------------------------ */

export function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-end gap-3 ${className}`}>{children}</div>;
}

export function Grid({
  children,
  cols = 2,
  className = "",
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const map = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
  } as const;
  return <div className={`grid grid-cols-1 gap-3 ${map[cols]} ${className}`}>{children}</div>;
}

export function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

/* ------------------------------ Panels ------------------------------------ */

export function Panel({
  title,
  accent,
  children,
  className = "",
  right,
}: {
  title?: string;
  accent?: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 ${className}`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1.5">
          <span className="mono-kicker" style={accent ? { color: accent } : undefined}>
            {title}
          </span>
          {right}
        </header>
      ) : null}
      <div className="p-3">{children}</div>
    </section>
  );
}

/* ------------------------------ Inputs ------------------------------------ */

const baseInput =
  "w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  step,
  className = "",
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mono-kicker mb-1.5 block text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={baseInput}
      />
      {hint ? <span className="mt-1 block text-[10px] text-zinc-600">{hint}</span> : null}
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  rows = 6,
  mono = true,
  placeholder,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      {label ? (
        <span className="mono-kicker mb-1.5 block text-zinc-500">{label}</span>
      ) : null}
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={`${baseInput} resize-y leading-relaxed ${mono ? "font-mono text-xs" : ""}`}
      />
    </label>
  );
}

export function Seg<T extends string>({
  value,
  onChange,
  options,
  accent,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { v: T; label: string }[];
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-wrap gap-1 rounded-md border border-zinc-800 bg-zinc-950/60 p-1 ${className}`}
      role="tablist"
    >
      {options.map((o) => {
        const on = o.v === value;
        return (
          <button
            key={o.v}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.v)}
            className="rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors"
            style={
              on
                ? { background: accent ?? "#FFD43B", color: "#0a0a0a" }
                : { color: "#a1a1aa" }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  accent,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="mono-kicker text-zinc-500">{label}</span>
        <span className="font-mono text-xs font-bold" style={accent ? { color: accent } : undefined}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400"
        style={accent ? { accentColor: accent } : undefined}
      />
      {hint ? <p className="mt-0.5 text-[10px] text-zinc-600">{hint}</p> : null}
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-amber-400"
      />
      {label}
    </label>
  );
}

/* ------------------------------ Buttons ----------------------------------- */

export function Btn({
  children,
  onClick,
  accent = "#FFD43B",
  variant = "solid",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  accent?: string;
  variant?: "solid" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  const solid = { background: accent, color: "#0a0a0a" };
  const ghost = { borderColor: accent, color: accent };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        variant === "solid"
          ? "border-transparent hover:brightness-110 active:scale-[0.98]"
          : "bg-transparent hover:bg-white/5 active:scale-[0.98]"
      } ${className}`}
      style={variant === "solid" ? solid : { ...ghost, borderColor: `${accent}66` }}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Output ------------------------------------ */

export function Out({
  text,
  label = "output",
  rows,
  copy = true,
  className = "",
}: {
  text: string;
  label?: string;
  rows?: number;
  copy?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/80 ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 px-3 py-1.5">
        <span className="mono-kicker text-zinc-500">{label}</span>
        {copy ? <CopyButton text={text} /> : null}
      </div>
      <pre
        className="max-w-full px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-300"
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          maxHeight: rows ? rows * 22 + 20 : undefined,
          overflowY: rows ? "auto" : undefined,
        }}
      >
        {text || "—"}
      </pre>
    </div>
  );
}

/* ------------------------------ Display ----------------------------------- */

export function BigStat({
  label,
  value,
  unit,
  accent = "#FFD43B",
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <p className="mono-kicker text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-black leading-tight" style={{ color: accent }}>
        {value}
        {unit ? <span className="ml-1 text-sm font-bold text-zinc-500">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-zinc-600">{hint}</p> : null}
    </div>
  );
}

export function KV({ k, v, accent }: { k: string; v: ReactNode; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-800/60 py-1.5">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
        {k}
      </span>
      <span className="min-w-0 text-right text-sm font-semibold" style={accent ? { color: accent } : undefined}>
        {v}
      </span>
    </div>
  );
}

export function Meter({
  value,
  max = 100,
  accent = "#FFD43B",
  label,
  right,
}: {
  value: number;
  max?: number;
  accent?: string;
  label?: string;
  right?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="min-w-0">
      {label || right ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="mono-kicker text-zinc-500">{label}</span>
          <span className="font-mono text-[10px] font-bold text-zinc-400">{right}</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>
    </div>
  );
}

export function Tag({ children, accent = "#FFD43B" }: { children: ReactNode; accent?: string }) {
  return (
    <span
      className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
      style={{ borderColor: `${accent}55`, color: accent, background: `${accent}14` }}
    >
      {children}
    </span>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">{children}</p>
  );
}

/* ------------------------------ Helpers ----------------------------------- */

export function fmt(n: number, d = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: d });
}

export function money(n: number, cur = "$"): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs > 0 && abs < 1 ? 4 : 2;
  return `${cur}${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function pct(n: number, d = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(d)}%`;
}
