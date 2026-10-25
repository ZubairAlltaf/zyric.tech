"use client";

import { useMemo, useState } from "react";
import { Pipette, Palette as PaletteIcon, Contrast, Sparkles, Shuffle, ArrowLeftRight, Save, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useLocalStorage, CopyButton, labelCls, inputCls } from "./hooks";

/* ------------------------------ color conversion ---------------------------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number] = [0, 0, 0];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 };
}

function luminance(r: number, g: number, b: number): number {
  const lin = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/* -------------------------------- Color Converter --------------------------- */

export function ColorConverterTool() {
  const [hex, setHex] = useState("#10b981");

  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  const tintsShades = useMemo(() => {
    if (!hsl) return [];
    const out: string[] = [];
    for (const l of [90, 80, 70, 60, 50, 40, 30, 20, 10]) {
      const { r, g, b } = hslToRgb(hsl.h, hsl.s, l);
      out.push(rgbToHex(r, g, b));
    }
    return out;
  }, [hsl]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <div className="space-y-1.5">
          <Label htmlFor="cc-hex" className={labelCls}>Hex color</Label>
          <Input id="cc-hex" value={hex} onChange={(e) => setHex(e.target.value)} className={`${inputCls} font-mono`} placeholder="#10b981" />
          {!rgb && hex.trim() && <p className="text-xs text-red-400">Use a hex like #10b981 or 10b981.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cc-picker" className={labelCls}>Pick</Label>
          <input
            id="cc-picker"
            type="color"
            value={rgb ? hex.replace(/^#/, "#").slice(0, 7) : "#10b981"}
            onChange={(e) => setHex(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
            aria-label="Pick a color"
          />
        </div>
      </div>

      {rgb && hsl && (
        <>
          <div className="flex h-24 items-end rounded-xl border border-zinc-800 p-3" style={{ backgroundColor: hex }}>
            <span className="rounded bg-zinc-950/60 px-2 py-1 font-mono text-xs text-zinc-100">{hex.toLowerCase()}</span>
          </div>

          {[
            { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
            { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
            { label: "CSS variable", value: `--brand: ${hex.toLowerCase()};` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{row.label}</p>
                <p className="truncate font-mono text-sm text-emerald-300">{row.value}</p>
              </div>
              <CopyButton text={row.value} label="" />
            </div>
          ))}

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              <Pipette className="h-3 w-3" aria-hidden /> Tints &amp; shades — click to copy
            </p>
            <div className="grid grid-cols-9 overflow-hidden rounded-xl border border-zinc-800">
              {tintsShades.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(t).catch(() => {})}
                  className="h-12 transition-transform hover:scale-[1.06]"
                  style={{ backgroundColor: t }}
                  title={t}
                  aria-label={`Copy ${t}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------- Palette Generator -------------------------- */

type Harmony = "analogous" | "complementary" | "triadic" | "tetradic" | "monochrome";

const HARMONIES: { id: Harmony; label: string }[] = [
  { id: "analogous", label: "Analogous" },
  { id: "complementary", label: "Complementary" },
  { id: "triadic", label: "Triadic" },
  { id: "tetradic", label: "Tetradic" },
  { id: "monochrome", label: "Monochrome" },
];

function buildPalette(h: number, harmony: Harmony): { h: number; s: number; l: number }[] {
  switch (harmony) {
    case "analogous":
      return [
        { h: (h + 330) % 360, s: 70, l: 55 },
        { h: (h + 350) % 360, s: 75, l: 60 },
        { h, s: 80, l: 50 },
        { h: (h + 20) % 360, s: 75, l: 45 },
        { h: (h + 40) % 360, s: 70, l: 40 },
      ];
    case "complementary":
      return [
        { h, s: 80, l: 50 },
        { h, s: 70, l: 65 },
        { h, s: 60, l: 35 },
        { h: (h + 180) % 360, s: 80, l: 50 },
        { h: (h + 180) % 360, s: 65, l: 70 },
      ];
    case "triadic":
      return [
        { h, s: 80, l: 50 },
        { h: (h + 120) % 360, s: 75, l: 55 },
        { h: (h + 240) % 360, s: 75, l: 55 },
        { h, s: 55, l: 80 },
        { h, s: 60, l: 25 },
      ];
    case "tetradic":
      return [
        { h, s: 80, l: 50 },
        { h: (h + 90) % 360, s: 75, l: 55 },
        { h: (h + 180) % 360, s: 75, l: 50 },
        { h: (h + 270) % 360, s: 75, l: 55 },
        { h, s: 45, l: 85 },
      ];
    case "monochrome":
      return [
        { h, s: 75, l: 85 },
        { h, s: 75, l: 65 },
        { h, s: 80, l: 50 },
        { h, s: 75, l: 35 },
        { h, s: 70, l: 20 },
      ];
  }
}

interface SavedPalette {
  id: string;
  colors: string[];
}

export function PaletteGeneratorTool() {
  const [hue, setHue] = useState(() => Math.floor(Math.random() * 360));
  const [harmony, setHarmony] = useState<Harmony>("analogous");
  const [saved, setSaved] = useLocalStorage<SavedPalette[]>("saved-palettes", []);

  const palette = useMemo(() => buildPalette(hue, harmony), [hue, harmony]);
  const hexes = palette.map(({ h, s, l }) => {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {HARMONIES.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setHarmony(h.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              harmony === h.id
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {h.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setHue(Math.floor(Math.random() * 360))} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
            <Shuffle className="h-3.5 w-3.5" aria-hidden /> Shuffle
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setSaved([{ id: `${Date.now()}`, colors: hexes }, ...saved].slice(0, 12))}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            <Save className="h-3.5 w-3.5" aria-hidden /> Save
          </Button>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="359"
        value={hue}
        onChange={(e) => setHue(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-emerald-500"
        aria-label="Base hue"
        style={{
          background: "linear-gradient(to right, hsl(0,80%,55%), hsl(60,80%,55%), hsl(120,80%,55%), hsl(180,80%,55%), hsl(240,80%,55%), hsl(300,80%,55%), hsl(359,80%,55%))",
        }}
      />

      <div className="grid grid-cols-5 overflow-hidden rounded-2xl border border-zinc-800">
        {hexes.map((hex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => navigator.clipboard?.writeText(hex).catch(() => {})}
            className="group flex h-32 flex-col justify-end p-2 transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: hex }}
            title={`Copy ${hex}`}
          >
            <span className="rounded bg-zinc-950/55 px-1.5 py-0.5 text-center font-mono text-[10px] text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100">
              {hex}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-500">Click any swatch to copy its hex code.</p>

      <div className="flex justify-center">
        <CopyButton text={hexes.join(", ")} label="Copy whole palette" />
      </div>

      {saved.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <PaletteIcon className="h-3 w-3" aria-hidden /> Saved palettes
          </p>
          {saved.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
              <div className="flex flex-1 overflow-hidden rounded-lg">
                {p.colors.map((c, i) => (
                  <div key={i} className="h-8 flex-1" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
              <CopyButton text={p.colors.join(", ")} label="" />
              <button
                type="button"
                aria-label="Delete palette"
                onClick={() => setSaved(saved.filter((s) => s.id !== p.id))}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Contrast Checker -------------------------- */

export function ContrastTool() {
  const [fg, setFg] = useState("#111827");
  const [bg, setBg] = useState("#a7f3d0");

  const ratio = useMemo(() => {
    const a = hexToRgb(fg);
    const b = hexToRgb(bg);
    if (!a || !b) return null;
    const l1 = luminance(a.r, a.g, a.b);
    const l2 = luminance(b.r, b.g, b.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }, [fg, bg]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Text color", value: fg, set: setFg },
          { label: "Background color", value: bg, set: setBg },
        ].map((f) => (
          <div key={f.label} className="space-y-1.5">
            <Label className={labelCls}>{f.label}</Label>
            <div className="flex gap-2">
              <Input value={f.value} onChange={(e) => f.set(e.target.value)} className={`${inputCls} font-mono`} />
              <input
                type="color"
                value={hexToRgb(f.value) ? f.value : "#000000"}
                onChange={(e) => f.set(e.target.value)}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
                aria-label={`${f.label} picker`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setFg(bg);
            setBg(fg);
          }}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden /> Swap colors
        </Button>
        {ratio !== null && (
          <span className="text-sm text-zinc-400">
            Contrast ratio <b className="text-emerald-400">{ratio.toFixed(2)}:1</b>
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 p-6 text-center" style={{ backgroundColor: bg }}>
        <p className="text-2xl font-bold" style={{ color: fg }}>Normal text preview — 18px</p>
        <p className="mt-2 text-base" style={{ color: fg }}>
          This is how body copy will look for your visitors.
        </p>
        <p className="mt-2 text-xs" style={{ color: fg }}>
          Small print, captions and footnotes also need to pass.
        </p>
      </div>

      <div className="space-y-2">
        <VerdictRow label="WCAG AA — normal text" need={4.5} ratio={ratio} />
        <VerdictRow label="WCAG AA — large text (18pt+)" need={3} ratio={ratio} />
        <VerdictRow label="WCAG AAA — normal text" need={7} ratio={ratio} />
        <VerdictRow label="WCAG AAA — large text" need={4.5} ratio={ratio} />
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600">
        <Contrast className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Accessible contrast is a legal requirement in many countries (ADA, EN 301 549) and an easy ranking win —
        search engines favor pages everyone can read.
      </p>
    </div>
  );
}

/* ------------------------------- Gradient Generator ------------------------- */

function VerdictRow({ label, need, ratio }: { label: string; need: number; ratio: number | null }) {
  const ok = ratio !== null && ratio >= need;
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${ok ? "border-emerald-800/50 bg-emerald-950/20" : "border-red-900/50 bg-red-950/20"}`}>
      <div>
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        <p className="text-xs text-zinc-500">requires {need}:1 or more</p>
      </div>
      <span className={`text-sm font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>
        {ratio === null ? "—" : `${ratio.toFixed(2)}:1 ${ok ? "✓" : "✗"}`}
      </span>
    </div>
  );
}

export function GradientTool() {
  const [c1, setC1] = useState("#0ea5e9");
  const [c2, setC2] = useState("#10b981");
  const [c3, setC3] = useState("#a3e635");
  const [useThird, setUseThird] = useState(false);
  const [angle, setAngle] = useState(120);
  const [type, setType] = useState<"linear" | "radial">("linear");

  const stops = useThird ? [c1, c2, c3] : [c1, c2];
  const css =
    type === "linear"
      ? `linear-gradient(${angle}deg, ${stops.join(", ")})`
      : `radial-gradient(circle at ${Math.round(Math.cos((angle * Math.PI) / 180) * 50 + 50)}% ${Math.round(Math.sin((angle * Math.PI) / 180) * 50 + 50)}%, ${stops.join(", ")})`;

  const randomize = () => {
    const rnd = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
    setC1(rnd());
    setC2(rnd());
    if (useThird) setC3(rnd());
    setAngle(Math.floor(Math.random() * 360));
  };

  return (
    <div className="space-y-4">
      <div className="h-48 rounded-2xl border border-zinc-800" style={{ background: css }} />

      <div className="flex flex-wrap items-center gap-3">
        {[
          { v: c1, set: setC1, label: "Color 1" },
          { v: c2, set: setC2, label: "Color 2" },
          ...(useThird ? [{ v: c3, set: setC3, label: "Color 3" }] : []),
        ].map((p) => (
          <label key={p.label} className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="color"
              value={p.v}
              onChange={(e) => p.set(e.target.value)}
              className="h-9 w-10 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
              aria-label={p.label}
            />
            <span className="font-mono text-xs text-zinc-400">{p.v}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex gap-1.5">
          {(["linear", "radial"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                type === t
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {type === "linear" && (
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            Angle <b className="text-emerald-400">{angle}°</b>
            <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="h-2 w-36 cursor-pointer accent-emerald-500" />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={useThird} onCheckedChange={setUseThird} aria-label="Use third color" /> Third color
        </label>
        <Button type="button" size="sm" variant="outline" onClick={randomize} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Surprise me
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="truncate font-mono text-xs text-emerald-300">background: {css};</p>
        <CopyButton text={`background: ${css};`} label="Copy CSS" />
      </div>
    </div>
  );
}
