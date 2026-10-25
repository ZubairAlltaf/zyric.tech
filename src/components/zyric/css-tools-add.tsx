"use client";

import { useMemo, useState } from "react";
import { Box, Frame, Layers, Blend, Spline, Shuffle, Download, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CopyButton, labelCls, inputCls } from "./hooks";

/* Shared slider row */
function RangeRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className={labelCls}>{label}</Label>
        <span className="font-mono text-xs text-emerald-300">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-emerald-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(16,185,129,0.6)]"
        aria-label={label}
      />
    </div>
  );
}

function CodeOut({ code, multiline = false }: { code: string; multiline?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2">
        <span className="mono-kicker text-zinc-500">css output</span>
        <CopyButton text={code} label="Copy CSS" />
      </div>
      <pre
        className={`overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed text-emerald-300 ${
          multiline ? "whitespace-pre" : "whitespace-pre-wrap"
        }`}
      >
        {code}
      </pre>
    </div>
  );
}

/* ------------------------------ Box Shadow -------------------------------- */

const SHADOW_PRESETS = [
  { name: "Soft", x: 0, y: 12, blur: 32, spread: -8, color: "#000000", alpha: 0.45, inset: false },
  { name: "Card", x: 0, y: 4, blur: 14, spread: 0, color: "#000000", alpha: 0.35, inset: false },
  { name: "Glow", x: 0, y: 0, blur: 28, spread: 2, color: "#10b981", alpha: 0.55, inset: false },
  { name: "Hard", x: 6, y: 6, blur: 0, spread: 0, color: "#10b981", alpha: 1, inset: false },
  { name: "Inner", x: 0, y: 4, blur: 12, spread: -2, color: "#000000", alpha: 0.5, inset: true },
];

export function BoxShadowTool() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(12);
  const [blur, setBlur] = useState(32);
  const [spread, setSpread] = useState(-8);
  const [color, setColor] = useState("#000000");
  const [alpha, setAlpha] = useState(0.45);
  const [inset, setInset] = useState(false);

  const shadow = `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, alpha)}`;
  const css = `box-shadow: ${shadow};`;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <RangeRow label="Offset X" value={x} min={-40} max={40} unit="px" onChange={setX} />
          <RangeRow label="Offset Y" value={y} min={-40} max={40} unit="px" onChange={setY} />
          <RangeRow label="Blur" value={blur} min={0} max={100} unit="px" onChange={setBlur} />
          <RangeRow label="Spread" value={spread} min={-40} max={40} unit="px" onChange={setSpread} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelCls}>Color</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
              aria-label="Shadow color"
            />
          </div>
          <RangeRow label="Opacity" value={Math.round(alpha * 100)} min={0} max={100} unit="%" onChange={(v) => setAlpha(v / 100)} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5">
          <div>
            <p className="text-sm font-medium text-zinc-200">Inset shadow</p>
            <p className="text-xs text-zinc-500">Shadow inside the element</p>
          </div>
          <Switch checked={inset} onCheckedChange={setInset} aria-label="Toggle inset shadow" />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {SHADOW_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setX(p.x); setY(p.y); setBlur(p.blur); setSpread(p.spread);
                  setColor(p.color); setAlpha(p.alpha); setInset(p.inset);
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div
          className="dot-grid flex min-h-56 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8"
        >
          <div
            className="h-28 w-28 rounded-2xl border border-zinc-700 bg-zinc-800 transition-shadow duration-150"
            style={{ boxShadow: shadow }}
          />
        </div>
        <CodeOut code={css} />
      </div>
    </div>
  );
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})`;
}

/* --------------------------- Fancy Border Radius -------------------------- */

const RADIUS_PRESETS: { name: string; v: [number, number, number, number, number, number, number, number] }[] = [
  { name: "Blob", v: [60, 40, 30, 70, 70, 30, 30, 70] },
  { name: "Leaf", v: [0, 70, 0, 70, 70, 0, 70, 0] },
  { name: "Egg", v: [50, 50, 50, 50, 60, 60, 40, 40] },
  { name: "Pebble", v: [40, 60, 60, 40, 40, 60, 60, 40] },
  { name: "Ticket", v: [12, 12, 12, 12, 12, 12, 12, 12] },
];

export function FancyRadiusTool() {
  const [v, setV] = useState<[number, number, number, number, number, number, number, number]>([
    60, 40, 30, 70, 70, 30, 30, 70,
  ]);
  const set = (i: number, n: number) => setV((prev) => prev.map((p, j) => (j === i ? n : p)) as typeof prev);
  const css = `border-radius: ${v[0]}% ${v[1]}% ${v[2]}% ${v[3]}% / ${v[4]}% ${v[5]}% ${v[6]}% ${v[7]}%;`;

  const randomize = () => {
    const r = () => 15 + Math.round(Math.random() * 70);
    setV([r(), r(), r(), r(), r(), r(), r(), r()]);
  };

  const corners: { label: string; h: number; ih: number; iv: number }[] = [
    { label: "Top left", h: v[0], ih: 0, iv: 4 },
    { label: "Top right", h: v[1], ih: 1, iv: 5 },
    { label: "Bottom right", h: v[2], ih: 2, iv: 6 },
    { label: "Bottom left", h: v[3], ih: 3, iv: 7 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        {corners.map((c) => (
          <div key={c.label} className="space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <p className="text-xs font-medium text-zinc-300">{c.label}</p>
            <RangeRow label="Horizontal" value={c.h} min={0} max={100} unit="%" onChange={(n) => set(c.ih, n)} />
            <RangeRow label="Vertical" value={v[c.iv]} min={0} max={100} unit="%" onChange={(n) => set(c.iv, n)} />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={randomize} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
            <Shuffle className="h-3.5 w-3.5" aria-hidden /> Randomize
          </Button>
          {RADIUS_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setV([...p.v] as typeof v)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="dot-grid flex min-h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8">
          <div
            className="h-56 w-56 bg-gradient-to-br from-emerald-400 to-teal-600 transition-all duration-150"
            style={{ borderRadius: css.replace("border-radius: ", "").replace(";", "") }}
          />
        </div>
        <CodeOut code={css} />
      </div>
    </div>
  );
}

/* ------------------------------ Glassmorphism ----------------------------- */

export function GlassTool() {
  const [blur, setBlur] = useState(16);
  const [alpha, setAlpha] = useState(18);
  const [border, setBorder] = useState(30);
  const [saturation, setSaturation] = useState(140);
  const [radius, setRadius] = useState(20);
  const [tint, setTint] = useState("#ffffff");

  const glassStyle: React.CSSProperties = {
    backgroundColor: hexToRgba(tint, alpha / 100),
    backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
    border: `1px solid rgba(255, 255, 255, ${border / 100})`,
    borderRadius: `${radius}px`,
  };

  const css = `.glass {
  background: ${hexToRgba(tint, alpha / 100)};
  backdrop-filter: blur(${blur}px) saturate(${saturation}%);
  -webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
  border: 1px solid rgba(255, 255, 255, ${border / 100});
  border-radius: ${radius}px;
}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <RangeRow label="Backdrop blur" value={blur} min={0} max={40} unit="px" onChange={setBlur} />
        <RangeRow label="Fill opacity" value={alpha} min={0} max={80} unit="%" onChange={setAlpha} />
        <RangeRow label="Border opacity" value={border} min={0} max={100} unit="%" onChange={setBorder} />
        <RangeRow label="Saturation" value={saturation} min={100} max={250} unit="%" onChange={setSaturation} />
        <RangeRow label="Corner radius" value={radius} min={0} max={48} unit="px" onChange={setRadius} />
        <div className="space-y-1.5">
          <Label className={labelCls}>Tint</Label>
          <input
            type="color"
            value={tint}
            onChange={(e) => setTint(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
            aria-label="Glass tint color"
          />
        </div>
      </div>
      <div className="space-y-4">
        <div
          className="flex min-h-72 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 p-8"
          style={{
            background:
              "radial-gradient(circle at 25% 30%, #f472b6 0%, transparent 45%), radial-gradient(circle at 75% 25%, #38bdf8 0%, transparent 45%), radial-gradient(circle at 60% 80%, #34d399 0%, transparent 50%), radial-gradient(circle at 20% 75%, #fbbf24 0%, transparent 40%), #18181b",
          }}
        >
          <div style={glassStyle} className="flex h-36 w-full max-w-sm flex-col justify-between p-5 shadow-2xl">
            <span className="mono-kicker text-white/70">glass card</span>
            <div>
              <p className="font-display text-lg font-semibold text-white">Frosted panel</p>
              <p className="text-sm text-white/75">Backdrop blur makes anything behind it dreamy.</p>
            </div>
          </div>
        </div>
        <CodeOut code={css} multiline />
      </div>
    </div>
  );
}

/* --------------------------------- Blob ----------------------------------- */

function makeBlobPath(points = 7, wobble = 0.38, cx = 70, cy = 70, r = 58): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (Math.PI * 2 * i) / points - Math.PI / 2;
    const rad = r * (1 - wobble / 2 + Math.random() * wobble);
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + " Z";
}

const INITIAL_BLOB =
  "M 70.00 12.50 C 101.02 10.84, 128.16 32.06, 126.90 62.44 C 125.63 92.83, 99.51 122.30, 68.49 124.02 C 37.47 125.74, 11.79 101.55, 11.26 71.14 C 10.72 40.72, 38.98 14.16, 70.00 12.50 Z";

export function BlobTool() {
  const [d, setD] = useState(INITIAL_BLOB);
  const [fill, setFill] = useState("#10b981");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="280" height="280">
  <path d="${d}" fill="${fill}" />
</svg>`;

  const download = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blob.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className={labelCls}>Fill color</Label>
          <input
            type="color"
            value={fill}
            onChange={(e) => setFill(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
            aria-label="Blob fill color"
          />
        </div>
        <Button
          type="button"
          onClick={() => setD(makeBlobPath())}
          className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          <Shuffle className="h-4 w-4" aria-hidden /> Generate new blob
        </Button>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs leading-relaxed text-zinc-500">
          Organic shapes are generated fresh each time — nothing is stored. Download as SVG and drop it straight into
          your design tool or website.
        </div>
      </div>
      <div className="space-y-4">
        <div className="dot-grid flex min-h-72 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8">
          <svg viewBox="0 0 140 140" className="h-56 w-56" role="img" aria-label="Generated blob shape">
            <path d={d} fill={fill} />
          </svg>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2">
            <span className="mono-kicker text-zinc-500">svg output</span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={download} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
                <Download className="h-3.5 w-3.5" aria-hidden /> SVG
              </Button>
              <CopyButton text={svg} label="Copy SVG" />
            </div>
          </div>
          <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed text-emerald-300">{svg}</pre>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Cubic Bezier ------------------------------ */

const EASING_PRESETS: { name: string; v: [number, number, number, number] }[] = [
  { name: "Smooth", v: [0.4, 0, 0.2, 1] },
  { name: "Snappy", v: [0.2, 0, 0, 1] },
  { name: "Bounce", v: [0.68, -0.55, 0.265, 1.55] },
  { name: "Anticipate", v: [0.6, -0.28, 0.735, 0.045] },
  { name: "Ease-out", v: [0, 0, 0.58, 1] },
];

export function EasingTool() {
  const [x1, setX1] = useState(0.4);
  const [y1, setY1] = useState(0);
  const [x2, setX2] = useState(0.2);
  const [y2, setY2] = useState(1);
  const [duration, setDuration] = useState(1200);
  const [runKey, setRunKey] = useState(0);

  const bez = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;

  const curvePath = useMemo(() => {
    // SVG plot: 100x100 box, y flipped
    const sx = (x: number) => x * 100;
    const sy = (y: number) => 100 - y * 100;
    // extend view for overshoot values
    return `M 0 100 C ${sx(x1)} ${sy(y1)}, ${sx(x2)} ${sy(y2)}, 100 0`;
  }, [x1, y1, x2, y2]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <RangeRow label="X1" value={x1} min={0} max={1} step={0.01} onChange={setX1} />
          <RangeRow label="Y1" value={y1} min={-0.5} max={1.5} step={0.01} onChange={setY1} />
          <RangeRow label="X2" value={x2} min={0} max={1} step={0.01} onChange={setX2} />
          <RangeRow label="Y2" value={y2} min={-0.5} max={1.5} step={0.01} onChange={setY2} />
        </div>
        <RangeRow label="Preview duration" value={duration} min={300} max={3000} step={100} unit="ms" onChange={setDuration} />
        <div className="space-y-1.5">
          <Label className={labelCls}>Presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {EASING_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setX1(p.v[0]); setY1(p.v[1]); setX2(p.v[2]); setY2(p.v[3]);
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRunKey((k) => k + 1)}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300"
        >
          <Play className="h-3.5 w-3.5" aria-hidden /> Replay preview
        </Button>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="mono-kicker mb-3 text-zinc-500">curve</p>
            <svg viewBox="-12 -55 124 210" className="w-full" role="img" aria-label="Easing curve">
              <line x1="0" y1="100" x2="100" y2="0" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="0" y1="100" x2="0" y2="0" stroke="#52525b" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="100" y2="100" stroke="#52525b" strokeWidth="0.5" />
              <path d={curvePath} fill="none" stroke="#10b981" strokeWidth="2.5" />
              <circle cx={x1 * 100} cy={100 - y1 * 100} r="3.5" fill="#fbbf24" />
              <circle cx={x2 * 100} cy={100 - y2 * 100} r="3.5" fill="#fbbf24" />
            </svg>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="mono-kicker mb-3 text-zinc-500">motion preview</p>
            <div className="relative h-32 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
              <div
                key={runKey}
                className="absolute left-3 h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500"
                style={{
                  animation: `zyric-ease-demo ${duration}ms ${bez} infinite alternate`,
                }}
              />
            </div>
          </div>
        </div>
        <CodeOut code={`transition: transform ${duration}ms ${bez};`} />
      </div>
    </div>
  );
}
