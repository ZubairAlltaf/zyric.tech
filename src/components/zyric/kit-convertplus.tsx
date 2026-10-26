"use client";

/* ==========================================================================
   KIT: CONVERT PLUS — 12 precision converters with real charts & real math.
   Shoe / clothing / paper / data / download / bitrate / PPI / fuel /
   pressure / energy / angle / ring. Every screen composes the kit atoms
   differently: rulers, ladders, discs, log-meters, analogy cards.
   ========================================================================== */

import { useState } from "react";
import {
  Activity,
  BookOpen,
  Compass,
  Download,
  Film,
  FileStack,
  Footprints,
  Fuel,
  Gamepad2,
  Gauge,
  Gem,
  HardDrive,
  Image,
  Monitor,
  Music,
  Shirt,
  Video,
  Zap,
} from "lucide-react";
import {
  BigStat,
  Field,
  Grid,
  KV,
  Meter,
  Note,
  Out,
  Panel,
  Row,
  Seg,
  Slider,
  Split,
  Tag,
  accentOf,
  fmt,
} from "./kit";
import type { ToolMeta } from "./tool-types";

/* ------------------------------ shared helpers ---------------------------- */

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const roundHalf = (n: number): number => Math.round(n * 2) / 2;

/** 3661 → "1 h 01 m" · 94 → "1 m 34 s" */
function humanTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  if (sec < 60) return `${fmt(sec, sec < 10 ? 1 : 0)} s`;
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return `${m} m ${String(Math.round(sec - m * 60)).padStart(2, "0")} s`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return `${h} h ${String(Math.round((sec - h * 3600) / 60)).padStart(2, "0")} m`;
  }
  const d = Math.floor(sec / 86400);
  return `${fmt(d)} d ${Math.round((sec - d * 86400) / 3600)} h`;
}

/** analogy counter: 1234 → "1,234" · 3.2 → "3.2" · 0.3 → "0.3" */
function smartCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 100) return fmt(Math.round(n), 0);
  if (n >= 10) return fmt(n, 1);
  return fmt(n, 2);
}

/* ------------------------------ 1. Shoe size ------------------------------ */

type Who = "men" | "women" | "kids";
type ShoeUnit = "cm" | "us" | "uk" | "eu";

const WHO_OPTS: readonly { v: Who; label: string }[] = [
  { v: "men", label: "Men" },
  { v: "women", label: "Women" },
  { v: "kids", label: "Kids" },
];
const SHOE_UNIT_OPTS: readonly { v: ShoeUnit; label: string }[] = [
  { v: "cm", label: "cm length" },
  { v: "us", label: "US" },
  { v: "uk", label: "UK" },
  { v: "eu", label: "EU" },
];

/* Model (internally consistent, matches the standard published cm→size charts):
   US men = cm − 18 · US women = cm − 17 · UK = US − 1 (men) / − 2 (women)
   EU (Paris points) = 1.5·(cm + 1.5) · big-kids Y sizes equal men's US. */
function shoeSizes(cm: number) {
  const usM = roundHalf(cm - 18);
  const usW = roundHalf(cm - 17);
  const eu = roundHalf(1.5 * (cm + 1.5));
  return {
    men: { us: usM, uk: usM - 1, eu },
    women: { us: usW, uk: usW - 2, eu },
    kids: { us: usM, uk: usM - 1, eu },
  };
}

function cmFromSize(input: number, who: Who, unit: ShoeUnit): number {
  if (unit === "cm") return input;
  if (unit === "eu") return input / 1.5 - 1.5;
  if (unit === "uk") return input + 19;
  return who === "women" ? input + 17 : input + 18;
}

const RULER_LO = 19;
const RULER_HI = 32;

export function ShoeSizeTool() {
  const A = accentOf(0);
  const [who, setWho] = useState<Who>("men");
  const [unit, setUnit] = useState<ShoeUnit>("cm");
  const [val, setVal] = useState("26");
  const cm = cmFromSize(num(val), who, unit);
  const s = shoeSizes(cm);
  const own = s[who];
  const pos = Math.min(100, Math.max(0, ((cm - RULER_LO) / (RULER_HI - RULER_LO)) * 100));
  const rows = Array.from({ length: 5 }, (_, i) => Math.round(cm) - 2 + i);
  return (
    <div className="space-y-4">
      <Row>
        <Field label={`Your ${unit === "cm" ? "foot length" : `${who} ${unit.toUpperCase()} size`}`} value={val} onChange={setVal} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={SHOE_UNIT_OPTS} />
        <Seg value={who} onChange={setWho} accent={A} options={WHO_OPTS} />
      </Row>
      <div className="flex flex-wrap items-center gap-2">
        <Tag accent={A}>US {own.us}</Tag>
        <Tag accent={A}>UK {own.uk}</Tag>
        <Tag accent={A}>EU {own.eu}</Tag>
        <Tag>{fmt(cm, 1)} cm foot</Tag>
      </div>
      {/* size ruler */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 pb-3 pt-8">
        <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800">
          {[20, 22, 24, 26, 28, 30, 32].map((t) => (
            <div key={t} className="absolute top-0 h-3 w-px bg-zinc-600" style={{ left: `${((t - RULER_LO) / (RULER_HI - RULER_LO)) * 100}%` }}>
              <span className="absolute left-1/2 top-4 -translate-x-1/2 font-mono text-[9px] text-zinc-600">{t}</span>
            </div>
          ))}
          <div className="absolute -top-2 h-7 w-1.5 rounded-full shadow-lg" style={{ left: `calc(${pos}% - 3px)`, background: A }}>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-bold" style={{ color: A }}>{fmt(cm, 1)} cm</span>
          </div>
        </div>
        <p className="mt-7 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-600">mondo point — where your foot lands</p>
      </div>
      <Panel title="same foot, three sizing worlds" accent={A}>
        {(["men", "women", "kids"] as Who[]).map((w) => (
          <KV key={w} k={w} v={`US ${s[w].us} · UK ${s[w].uk} · EU ${s[w].eu}`} accent={w === who ? A : undefined} />
        ))}
      </Panel>
      <Panel title="walk-in chart around your length" accent={A}>
        <div className="grid grid-cols-4 gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          <span>foot</span><span>US men</span><span>US women</span><span>EU</span>
        </div>
        {rows.map((c) => {
          const r = shoeSizes(c);
          const hit = c === Math.round(cm);
          return (
            <div key={c} className={`grid grid-cols-4 gap-1 border-b border-zinc-800/60 py-1.5 font-mono text-xs ${hit ? "font-bold" : ""}`} style={hit ? { color: A } : { color: "#a1a1aa" }}>
              <span>{c} cm</span><span>{r.men.us}</span><span>{r.women.us}</span><span>{r.men.eu}</span>
            </div>
          );
        })}
      </Panel>
      <Note>Kids (Y) sizes share the men&apos;s last — a 7Y is literally a men&apos;s 7. Below US 1Y (foot ≈ 19.5 cm) you&apos;re in toddler territory, where every brand invents its own scale. Measure feet at day&apos;s end, standing, heel to wall.</Note>
    </div>
  );
}

/* ------------------------------ 2. Clothing size -------------------------- */

type Fit = "men" | "women";
type Band = [number, number];

const SIZE_NAMES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

type BandKey = "chest" | "waist" | "hip";

const MEN_BANDS: Record<BandKey, Band[]> = {
  chest: [[78, 88], [88, 96], [96, 104], [104, 112], [112, 120], [120, 132]],
  waist: [[66, 76], [76, 84], [84, 92], [92, 100], [100, 108], [108, 120]],
  hip: [[82, 90], [90, 96], [96, 104], [104, 112], [112, 120], [120, 130]],
};
const WOMEN_BANDS: Record<BandKey, Band[]> = {
  chest: [[78, 82], [82, 86], [86, 92], [92, 98], [98, 106], [106, 116]],
  waist: [[60, 64], [64, 68], [68, 74], [74, 80], [80, 88], [88, 98]],
  hip: [[84, 88], [88, 92], [92, 98], [98, 104], [104, 112], [112, 122]],
};

function sizeOf(v: number, bands: Band[]): { idx: number; inBand: number } {
  for (let i = 0; i < bands.length; i++) {
    const [lo, hi] = bands[i];
    if (v < hi || i === bands.length - 1) {
      const clamped = Math.min(Math.max(v, lo), hi);
      return { idx: i, inBand: ((clamped - lo) / (hi - lo)) * 100 };
    }
  }
  return { idx: bands.length - 1, inBand: 100 };
}

export function ClothingSizeTool() {
  const A = accentOf(1);
  const [fit, setFit] = useState<Fit>("men");
  const [chest, setChest] = useState("96");
  const [waist, setWaist] = useState("82");
  const [hip, setHip] = useState("98");
  const bands = fit === "men" ? MEN_BANDS : WOMEN_BANDS;
  const reads = [
    { name: "chest", v: num(chest), r: sizeOf(num(chest), bands.chest) },
    { name: "waist", v: num(waist), r: sizeOf(num(waist), bands.waist) },
    ...(fit === "women" ? [{ name: "hip", v: num(hip), r: sizeOf(num(hip), bands.hip) }] : []),
  ];
  const overall = Math.max(...reads.map((m) => m.r.idx));
  const driver = reads.find((m) => m.r.idx === overall);
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={fit} onChange={setFit} accent={A} options={[{ v: "men" as const, label: "Men's cut" }, { v: "women" as const, label: "Women's cut" }]} />
      </Row>
      <Row>
        <Field label="Chest (cm)" value={chest} onChange={setChest} type="number" className="flex-1" />
        <Field label="Waist (cm)" value={waist} onChange={setWaist} type="number" className="flex-1" />
        {fit === "women" ? <Field label="Hip (cm)" value={hip} onChange={setHip} type="number" className="flex-1" /> : null}
      </Row>
      {/* hero */}
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">your size</p>
        <p className="mt-1 font-brut text-6xl" style={{ color: A }}>{SIZE_NAMES[overall]}</p>
        <p className="mt-1 font-mono text-[11px] text-zinc-500">
          {reads.map((m) => `${m.name} ${SIZE_NAMES[m.r.idx]}`).join(" · ")} — fit your largest
        </p>
      </div>
      <Split
        left={
          <Panel title="position inside the band" accent={A}>
            {reads.map((m) => (
              <div key={m.name} className="mb-3 last:mb-0">
                <Meter value={m.r.inBand} max={100} accent={m.r.idx === overall ? A : "#52525b"} label={`${m.name} — ${SIZE_NAMES[m.r.idx]}`} right={`${fmt(m.v, 1)} cm · ${Math.round(m.r.inBand)}% through`} />
              </div>
            ))}
            {driver ? <Note>Your {driver.name} is the biggest constraint — buy for it, tailor the rest.</Note> : null}
          </Panel>
        }
        right={
          <Panel title={`${fit}'s chart (cm, body measurements)`} accent={A}>
            <div className="grid grid-cols-4 gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              <span>size</span><span>chest</span><span>waist</span>{fit === "women" ? <span>hip</span> : <span>—</span>}
            </div>
            {SIZE_NAMES.map((n, i) => (
              <div key={n} className={`grid grid-cols-4 gap-1 border-b border-zinc-800/60 py-1.5 font-mono text-xs ${i === overall ? "font-bold" : "text-zinc-400"}`} style={i === overall ? { color: A } : undefined}>
                <span>{n}</span>
                <span>{bands.chest[i][0]}–{bands.chest[i][1]}</span>
                <span>{bands.waist[i][0]}–{bands.waist[i][1]}</span>
                <span>{fit === "women" ? `${bands.hip[i][0]}–${bands.hip[i][1]}` : "·"}</span>
              </div>
            ))}
          </Panel>
        }
      />
      <Note>Vanity sizing is real: today&apos;s M often matches a 1990s L, and &quot;one size&quot; means nobody measured. These bands follow body measurements (not garment), which is how EU/US charts are cut — when between sizes, size up for knits, down for wovens.</Note>
    </div>
  );
}

/* ------------------------------ 3. Paper sizes ---------------------------- */

const A_SIZES: Band[] = [[841, 1189], [594, 841], [420, 594], [297, 420], [210, 297], [148, 210], [105, 148], [74, 105], [52, 74], [37, 52], [26, 37]];
const B_SIZES: Band[] = [[1000, 1414], [707, 1000], [500, 707], [353, 500], [250, 353], [176, 250], [125, 176], [88, 125], [62, 88], [44, 62], [31, 44]];

export function PaperSizeTool() {
  const A = accentOf(2);
  const [family, setFamily] = useState<"A" | "B">("A");
  const [idx, setIdx] = useState(4);
  const [gsm, setGsm] = useState("80");
  const SIZES = family === "A" ? A_SIZES : B_SIZES;
  const [w, h] = SIZES[idx];
  const sel = `${family}${idx}`;
  const areaM2 = (w * h) / 1e6;
  const gSheet = num(gsm) * areaM2;
  const scale = 190 / h;
  const ladder = Array.from({ length: 4 }, (_, k) => Math.min(10, idx + k))
    .filter((j, i, arr) => arr.indexOf(j) === i)
    .map((j) => {
      const [lw, lh] = SIZES[j];
      return { n: `${family}${j}`, w: lw * scale, h: lh * scale, j };
    });
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={family} onChange={setFamily} accent={A} options={[{ v: "A" as const, label: "A-series" }, { v: "B" as const, label: "B-series" }]} />
        <div className="min-w-[180px] flex-1"><Slider label="Format" value={idx} onChange={setIdx} min={0} max={10} suffix={` → ${sel}`} accent={A} /></div>
      </Row>
      <Split
        left={
          <Panel title="full table — mm · inches · sheets per m²" accent={A}>
            <div className="max-h-72 overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                <span>size</span><span>mm</span><span>inches</span><span>per m²</span>
              </div>
              {(["A", "B"] as const).flatMap((f) =>
                (f === "A" ? A_SIZES : B_SIZES).map((d, i) => {
                  const on = `${f}${i}` === sel;
                  return (
                    <div key={`${f}${i}`} className={`grid grid-cols-4 gap-1 border-b border-zinc-800/60 py-1.5 font-mono text-xs ${on ? "font-bold" : "text-zinc-400"}`} style={on ? { color: A } : undefined}>
                      <span>{f}{i}</span>
                      <span>{d[0]} × {d[1]}</span>
                      <span>{fmt(d[0] / 25.4, 2)} × {fmt(d[1] / 25.4, 2)}</span>
                      <span>{fmt(1e6 / (d[0] * d[1]), 1)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        }
        right={
          <div className="space-y-4">
            <Panel title="to-scale ladder — each step halves the sheet" accent={A}>
              <div className="flex min-h-[210px] items-end justify-center gap-4">
                {ladder.map((b) => (
                  <div key={b.n} className="flex flex-col items-center gap-1.5">
                    <div className="rounded-sm border-2" style={{ width: b.w, height: b.h, borderColor: b.j === idx ? A : "#3f3f46", background: b.j === idx ? `${A}1f` : "transparent" }} />
                    <span className="font-mono text-[10px]" style={{ color: b.j === idx ? A : "#71717a" }}>{b.n}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center font-mono text-[10px] text-zinc-600">{w} × {h} mm selected</p>
            </Panel>
            <Panel title="paper weight — from gsm" accent={A}>
              <Row>
                <Field label="Grammage (gsm)" value={gsm} onChange={setGsm} type="number" className="flex-1" />
                <Tag accent={A}>{sel} · {fmt(areaM2, 4)} m²</Tag>
              </Row>
              <Grid cols={3} className="mt-3">
                <BigStat label="one sheet" value={fmt(gSheet, 1)} unit="g" accent={A} />
                <BigStat label="100 sheets" value={fmt(gSheet * 100 / 1000, 2)} unit="kg" accent="#7FC8FF" />
                <BigStat label="500-sheet ream" value={fmt(gSheet * 500 / 1000, 2)} unit="kg" accent="#5EE39A" />
              </Grid>
            </Panel>
          </div>
        }
      />
      <Note>The √2 magic: fold any sheet in half and you land on the next size exactly — that&apos;s why A0 (841 × 1189 mm) is precisely 1 m². And yes, 80 gsm A4 really is 5 g a sheet, so the office ream weighs 2.5 kg.</Note>
    </div>
  );
}

/* ------------------------------ 4. Data size ------------------------------ */

type DUnit = "B" | "KB" | "MB" | "GB" | "TB";

const D_OPTS: readonly { v: DUnit; label: string }[] = [
  { v: "B", label: "B" }, { v: "KB", label: "KB" }, { v: "MB", label: "MB" }, { v: "GB", label: "GB" }, { v: "TB", label: "TB" },
];
const D_INDEX: Record<DUnit, number> = { B: 0, KB: 1, MB: 2, GB: 3, TB: 4 };

export function DataSizeTool() {
  const A = accentOf(3);
  const [val, setVal] = useState("8");
  const [unit, setUnit] = useState<DUnit>("GB");
  const [scale, setScale] = useState<"si" | "bin">("si");
  const k = D_INDEX[unit];
  const bytes = num(val) * (scale === "si" ? 1000 ** k : 1024 ** k);
  const ladder: [string, number][] = [["TB", 1e12], ["GB", 1e9], ["MB", 1e6], ["KB", 1e3], ["B", 1]];
  let autoU = "B";
  let autoV = bytes;
  for (const [u, m] of ladder) {
    if (bytes >= m) { autoU = u; autoV = bytes / m; break; }
  }
  const bin = (p: number) => bytes / 1024 ** p;
  const analogies: { icon: typeof Image; label: string; bytes: number; what: string }[] = [
    { icon: Image, label: "photos (12 MP JPEG)", bytes: 4e6, what: "photo" },
    { icon: Music, label: "songs (4 min, 160 kbps)", bytes: 4.8e6, what: "song" },
    { icon: Film, label: "1080p movies", bytes: 4e9, what: "HD movie" },
    { icon: Gamepad2, label: "AAA game installs", bytes: 70e9, what: "game" },
    { icon: BookOpen, label: "ebooks (300 pages)", bytes: 2e6, what: "ebook" },
    { icon: Video, label: "minutes of 1080p stream (9 Mbps)", bytes: 67.5e6, what: "minute" },
  ];
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Size — type in any unit" value={val} onChange={setVal} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={D_OPTS} />
        <Seg value={scale} onChange={setScale} accent={A} options={[{ v: "si" as const, label: "SI ×1000" }, { v: "bin" as const, label: "Binary ×1024" }]} />
      </Row>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-3">
        <p className="mono-kicker text-zinc-500">reads as</p>
        <p className="font-brut text-3xl" style={{ color: A }}>{fmt(autoV, 2)}<span className="ml-1 text-base text-zinc-500">{autoU}</span></p>
        <p className="font-mono text-[10px] text-zinc-600">= {fmt(bytes, 0)} bytes exactly</p>
      </div>
      <Grid cols={3}>
        {analogies.map((an) => (
          <div key={an.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <an.icon className="h-4 w-4" style={{ color: A }} />
            <p className="mt-1.5 font-brut text-2xl" style={{ color: A }}>{smartCount(bytes / an.bytes)}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{an.what}s</p>
            <p className="mt-1 text-[10px] text-zinc-600">{an.label}</p>
          </div>
        ))}
      </Grid>
      <Split
        left={
          <Panel title="decimal — SI, what drive makers bill you" accent={A}>
            <KV k="bytes" v={fmt(bytes, 0)} accent={A} />
            <KV k="KB" v={fmt(bytes / 1e3, 2)} />
            <KV k="MB" v={fmt(bytes / 1e6, 3)} />
            <KV k="GB" v={fmt(bytes / 1e9, 4)} />
            <KV k="TB" v={fmt(bytes / 1e12, 6)} />
          </Panel>
        }
        right={
          <Panel title="binary — IEC, what your OS shows" accent={A}>
            <KV k="bytes" v={fmt(bytes, 0)} accent={A} />
            <KV k="KiB" v={fmt(bin(1), 2)} />
            <KV k="MiB" v={fmt(bin(2), 3)} />
            <KV k="GiB" v={fmt(bin(3), 4)} />
            <KV k="TiB" v={fmt(bin(4), 6)} />
            <KV k="gigabits (Gb, ISP-speak)" v={fmt((bytes * 8) / 1e9, 2)} />
          </Panel>
        }
      />
      <Note>Drive makers count in TB (10¹² bytes); Windows shows TiB (2⁴⁰) — that&apos;s why a &quot;1 TB&quot; drive reports 931 GB. Nobody stole your files, it&apos;s just two definitions of the same word.</Note>
    </div>
  );
}

/* ------------------------------ 5. Download time -------------------------- */

type TSizeUnit = "KB" | "MB" | "GB" | "TB";
type TSpeedUnit = "kbps" | "Mbps" | "Gbps";

const SPEED_PRESETS: [string, number][] = [
  ["Dial-up 56k", 0.056], ["3G", 2], ["ADSL", 8], ["4G LTE", 20], ["Starlink", 100], ["5G", 200], ["Fiber 1 Gb", 1000],
];

export function DownloadTimeTool() {
  const A = accentOf(4);
  const [sizeVal, setSizeVal] = useState("45");
  const [sizeUnit, setSizeUnit] = useState<TSizeUnit>("GB");
  const [speedVal, setSpeedVal] = useState("100");
  const [speedUnit, setSpeedUnit] = useState<TSpeedUnit>("Mbps");
  const sizePow = { KB: 3, MB: 6, GB: 9, TB: 12 }[sizeUnit];
  const speedPow = { kbps: 3, Mbps: 6, Gbps: 9 }[speedUnit];
  const bytes = num(sizeVal) * 10 ** sizePow;
  const bps = num(speedVal) * 10 ** speedPow;
  const sec = bytes > 0 && bps > 0 ? (bytes * 8) / bps : 0;
  const breakdown: [string, number][] = [["1 GB", 1e9], ["10 GB", 1e10], ["50 GB", 5e10], ["100 GB", 1e11]];
  const summary = `${fmt(num(sizeVal), 2)} ${sizeUnit} @ ${fmt(num(speedVal), 2)} ${speedUnit} → ${humanTime(sec)} (${fmt(sec, 0)} s)\n` +
    breakdown.map(([l, b]) => `${l} → ${humanTime((b * 8) / bps)}`).join(" · ");
  return (
    <div className="space-y-4">
      <Row>
        <Field label="File size" value={sizeVal} onChange={setSizeVal} type="number" className="flex-1" />
        <Seg value={sizeUnit} onChange={setSizeUnit} accent={A} options={[{ v: "KB" as const, label: "KB" }, { v: "MB" as const, label: "MB" }, { v: "GB" as const, label: "GB" }, { v: "TB" as const, label: "TB" }]} />
        <Field label="Connection speed" value={speedVal} onChange={setSpeedVal} type="number" className="flex-1" />
        <Seg value={speedUnit} onChange={setSpeedUnit} accent={A} options={[{ v: "kbps" as const, label: "kbps" }, { v: "Mbps" as const, label: "Mbps" }, { v: "Gbps" as const, label: "Gbps" }]} />
      </Row>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 py-7 text-center">
        <p className="mono-kicker text-zinc-500">your download finishes in</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{humanTime(sec)}</p>
        <p className="mt-1 font-mono text-[11px] text-zinc-500">{fmt(num(sizeVal), 2)} {sizeUnit} · {fmt(num(speedVal), 2)} {speedUnit} sustained · {fmt(bytes / (bps / 8) / 1e6, 1)} MB/s effective</p>
      </div>
      <Grid cols={4}>
        {breakdown.map(([l, b]) => (
          <BigStat key={l} label={`how long for ${l}`} value={humanTime((b * 8) / bps)} accent={l === "10 GB" ? A : "#52525b"} />
        ))}
      </Grid>
      <Panel title="every connection, same file — log-scale bars" accent={A}>
        {SPEED_PRESETS.map(([name, mbps]) => {
          const t = (bytes * 8) / (mbps * 1e6);
          return (
            <div key={name} className="mb-2.5 last:mb-0">
              <Meter value={Math.log10(Math.max(1, t))} max={8} accent={mbps === bps / 1e6 ? A : "#52525b"} label={name} right={`${fmt(mbps, mbps < 1 ? 3 : 0)} Mbps · ${humanTime(t)}`} />
            </div>
          );
        })}
      </Panel>
      <Out label="copy-paste summary" text={summary} rows={3} />
      <Note>8 bits to a byte — ISPs sell megabits, browsers download megabytes, divide by 8. Real Wi-Fi delivers roughly half the box number, and distance hurts.</Note>
    </div>
  );
}

/* ------------------------------ 6. Bitrate & file size -------------------- */

type BMode = "size" | "bit";

const QUALITY_PRESETS: [string, number][] = [["480p", 2], ["720p", 5], ["1080p", 8], ["1440p", 16], ["4K", 35]];

function verdict(mbps: number): string {
  if (mbps <= 0) return "—";
  if (mbps < 3) return "VHS-ish";
  if (mbps < 6) return "DVD-ish";
  if (mbps < 12) return "clean HD";
  if (mbps < 25) return "crisp Full HD";
  return "4K territory";
}

export function BitrateTool() {
  const A = accentOf(5);
  const [mode, setMode] = useState<BMode>("size");
  const [minutes, setMinutes] = useState(22);
  const [bitrate, setBitrate] = useState("8");
  const [size, setSize] = useState("1.32");
  const mbps = num(bitrate);
  const sizeGB = mode === "size" ? (mbps * 60 * minutes) / 8 / 1000 : num(size);
  const solvedMbps = mode === "bit" ? (num(size) * 1000 * 8) / (60 * minutes) : mbps;
  const maxLadder = Math.max(...QUALITY_PRESETS.map(([, p]) => (p * 60 * minutes) / 8 / 1000), 0.001);
  return (
    <div className="space-y-4">
      <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "size" as const, label: "Duration + bitrate → size" }, { v: "bit" as const, label: "Size + duration → bitrate" }]} />
      <Row>
        <div className="min-w-[200px] flex-1"><Slider label="Duration (minutes)" value={minutes} onChange={setMinutes} min={1} max={240} suffix=" min" accent={A} /></div>
        {mode === "size" ? (
          <Field label="Video bitrate (Mbps)" value={bitrate} onChange={setBitrate} type="number" className="flex-1" />
        ) : (
          <Field label="File size (GB)" value={size} onChange={setSize} type="number" className="flex-1" />
        )}
      </Row>
      {mode === "size" ? (
        <Seg
          value={String(mbps)}
          onChange={(v) => setBitrate(v)}
          accent={A}
          options={QUALITY_PRESETS.map(([l, p]) => ({ v: String(p), label: `${l} · ${p} Mbps` }))}
        />
      ) : null}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 py-7 text-center">
        <p className="mono-kicker text-zinc-500">{mode === "size" ? `${minutes} min at ${fmt(mbps, 2)} Mbps weighs` : `${fmt(num(size), 2)} GB over ${minutes} min needs`}</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>
          {mode === "size" ? fmt(sizeGB, 2) : fmt(solvedMbps, 2)}
          <span className="ml-2 text-lg text-zinc-500">{mode === "size" ? "GB" : "Mbps"}</span>
        </p>
        <p className="mt-1 font-mono text-[11px] text-zinc-500">
          {mode === "size" ? `= ${fmt(sizeGB * 1000, 0)} MB · ${fmt(sizeGB * 8, 1)} gigabits` : `quality: ${verdict(solvedMbps)}`}
        </p>
      </div>
      <Split
        left={
          <Panel title="the bitrate ladder — whole video, this duration" accent={A}>
            {QUALITY_PRESETS.map(([label, p]) => {
              const gb = (p * 60 * minutes) / 8 / 1000;
              return (
                <div key={label} className="mb-2 flex items-center gap-2 last:mb-0">
                  <span className="w-14 shrink-0 font-mono text-[10px] uppercase text-zinc-500">{label}</span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full" style={{ width: `${(gb / maxLadder) * 100}%`, background: p === mbps ? A : "#3f3f46" }} />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-[10px] text-zinc-400">{fmt(gb, 2)} GB</span>
                </div>
              );
            })}
          </Panel>
        }
        right={
          <Panel title="at this bitrate, per unit time" accent={A}>
            <KV k="per second" v={`${fmt(solvedMbps / 8 / 1000, 4)} GB/s`} />
            <KV k="per minute" v={`${fmt((solvedMbps * 60) / 8 / 1000, 3)} GB/min`} />
            <KV k="per hour" v={`${fmt((solvedMbps * 3600) / 8 / 1000, 2)} GB/h`} accent={A} />
            <KV k="one-hour video" v={`${fmt((solvedMbps * 3600) / 8 / 1000, 2)} GB`} />
            <KV k="total bits" v={mode === "size" ? `${fmt(sizeGB * 8, 2)} Gb` : `${fmt((solvedMbps * 60 * minutes) / 1000, 2)} Gb`} />
            <KV k="quality verdict" v={verdict(solvedMbps)} accent={A} />
          </Panel>
        }
      />
      <Note>Sizes assume video-only — add ~0.2 Mbps for stereo audio. Streaming platforms use variable bitrate, so real files wobble ±10% around these numbers.</Note>
    </div>
  );
}

/* ------------------------------ 7. Screen PPI ----------------------------- */

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}
const ppiOf = (w: number, h: number, d: number): number => Math.hypot(w, h) / Math.max(d, 0.01);

const RATIO_CANDS: [number, number, string][] = [
  [1, 1, "1:1 square"], [4, 3, "4:3 classic"], [3, 2, "3:2 photo"], [5, 4, "5:4"],
  [16, 10, "16:10 laptop"], [16, 9, "16:9 widescreen"], [19.5, 9, "19.5:9 phone"],
  [21, 9, "21:9 ultrawide"], [32, 9, "32:9 superwide"],
];

const DEVICES: [string, number, number, number][] = [
  ["iPhone 15 Pro · 6.1″", 1179, 2556, 6.1],
  ["Galaxy S24 · 6.2″", 1080, 2340, 6.2],
  ["iPad Air · 10.9″", 2360, 1640, 10.9],
  ["MacBook Air 13 · 13.6″", 2560, 1664, 13.6],
  ['Monitor 24″ 1080p', 1920, 1080, 24],
  ['Monitor 27″ 1440p', 2560, 1440, 27],
  ['Monitor 27″ 4K', 3840, 2160, 27],
  ['TV 65″ 4K', 3840, 2160, 65],
];

export function PpiTool() {
  const A = accentOf(6);
  const [pw, setPw] = useState("3024");
  const [ph, setPh] = useState("1964");
  const [diag, setDiag] = useState("14.2");
  const W = num(pw);
  const H = num(ph);
  const D = num(diag);
  const ppi = ppiOf(W, H, D);
  const diagPx = Math.hypot(W, H);
  const g = gcd(W, H) || 1;
  const ratio = W / H;
  let best = RATIO_CANDS[0];
  let bestDiff = Infinity;
  for (const c of RATIO_CANDS) {
    const diff = Math.abs(Math.log(ratio) - Math.log(c[0] / c[1]));
    if (diff < bestDiff) { bestDiff = diff; best = c; }
  }
  const ratioLabel = bestDiff < 0.03 ? best[2] : `≈ ${best[2]} (exact ${W / g}:${H / g})`;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Width (px)" value={pw} onChange={setPw} type="number" className="flex-1" />
        <Field label="Height (px)" value={ph} onChange={setPh} type="number" className="flex-1" />
        <Field label="Diagonal (inches)" value={diag} onChange={setDiag} type="number" className="flex-1" />
      </Row>
      <Grid cols={4}>
        <BigStat label="pixel density" value={fmt(ppi, 1)} unit="ppi" accent={A} hint="pixels per inch" />
        <BigStat label="total pixels" value={fmt((W * H) / 1e6, 2)} unit="MP" accent="#7FC8FF" hint={`${fmt(W * H, 0)} dots`} />
        <BigStat label="dot pitch" value={fmt(25.4 / ppi, 3)} unit="mm" accent="#5EE39A" hint="pixel-to-pixel" />
        <BigStat label="aspect ratio" value={best[2].split(" ")[0]} accent="#FF9DE2" hint={ratioLabel} />
      </Grid>
      <Panel title="physical panel size" accent={A}>
        <Grid cols={2}>
          <KV k="width" v={`${fmt((D * W) / diagPx, 2)} in · ${fmt((D * W) / diagPx * 2.54, 1)} cm`} />
          <KV k="height" v={`${fmt((D * H) / diagPx, 2)} in · ${fmt((D * H) / diagPx * 2.54, 1)} cm`} />
          <KV k="diagonal" v={`${fmt(D, 2)} in · ${fmt(D * 2.54, 1)} cm`} accent={A} />
          <KV k="area" v={`${fmt(((D * W) / diagPx) * ((D * H) / diagPx), 1)} in²`} />
        </Grid>
      </Panel>
      <Panel title="your eyes vs the crowd — density meter" accent={A}>
        <div className="mb-2.5">
          <Meter value={Math.min(ppi, 500)} max={500} accent={A} label="▲ your screen" right={`${fmt(ppi, 1)} ppi`} />
        </div>
        {DEVICES.map(([name, w, h, d]) => {
          const p = ppiOf(w, h, d);
          return (
            <div key={name} className="mb-2.5 last:mb-0">
              <Meter value={p} max={500} accent="#52525b" label={name} right={`${fmt(p, 0)} ppi`} />
            </div>
          );
        })}
      </Panel>
      <Note>PPI only matters at viewing distance: a 65″ 4K TV at 3 m looks as sharp as a 460 ppi phone in your hand — both resolve about 1 arcminute per pixel.</Note>
    </div>
  );
}

/* ------------------------------ 8. Fuel economy --------------------------- */

type FUnit = "mpgus" | "mpguk" | "l100" | "kmpl";

const F_OPTS: readonly { v: FUnit; label: string }[] = [
  { v: "mpgus", label: "MPG US" }, { v: "mpguk", label: "MPG UK" }, { v: "l100", label: "L/100km" }, { v: "kmpl", label: "km/L" },
];

export function FuelEconomyTool() {
  const A = accentOf(7);
  const [val, setVal] = useState("7");
  const [unit, setUnit] = useState<FUnit>("l100");
  const [price, setPrice] = useState("1.65");
  const v = num(val);
  const kmpl = unit === "mpgus" ? v * 0.425144 : unit === "mpguk" ? v * 0.354006 : unit === "l100" ? 100 / Math.max(v, 0.001) : v;
  const l100 = 100 / Math.max(kmpl, 0.0001);
  const cost100 = l100 * num(price);
  const eff = Math.min(100, Math.max(0, ((16 - l100) / 13) * 100));
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Consumption — type in any unit" value={val} onChange={setVal} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={F_OPTS} />
      </Row>
      <Grid cols={4}>
        <BigStat label="liters per 100 km" value={fmt(l100, 2)} accent={unit === "l100" ? A : "#52525b"} hint="EU standard" />
        <BigStat label="kilometers per liter" value={fmt(kmpl, 2)} accent={unit === "kmpl" ? A : "#52525b"} hint="= L/100" />
        <BigStat label="miles per gallon (US)" value={fmt(kmpl / 0.425144, 2)} accent={unit === "mpgus" ? A : "#52525b"} hint="3.785 L gallon" />
        <BigStat label="miles per gallon (UK)" value={fmt(kmpl / 0.354006, 2)} accent={unit === "mpguk" ? A : "#52525b"} hint="4.546 L gallon" />
      </Grid>
      <Panel title="efficiency at a glance — greener is further right" accent={A}>
        <Meter value={eff} max={100} accent={A} label="ballpark scale (2 → 16 L/100km)" right={`${fmt(l100, 2)} L/100km`} />
        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-600">
          <span>hybrid</span><span>compact</span><span>crossover</span><span>V8 truck</span>
        </div>
      </Panel>
      <Panel title="what it costs to move you" accent={A}>
        <Row>
          <Field label="Fuel price (per liter)" value={price} onChange={setPrice} type="number" className="flex-1" />
          <Tag accent={A}>tank math below</Tag>
        </Row>
        <Grid cols={2} className="mt-3">
          <KV k="per 100 km" v={fmt(cost100, 2)} accent={A} />
          <KV k="per 10 km (the school run)" v={fmt(cost100 / 10, 2)} />
          <KV k="per km" v={fmt(cost100 / 100, 3)} />
          <KV k="range on a 50 L tank" v={`${fmt((50 / l100) * 100, 0)} km`} />
        </Grid>
      </Panel>
      <Note>L/100km is the honest unit — it&apos;s linear, so 5 → 6 is the same fuel jump as 10 → 11. MPG flatters guzzlers. And a US gallon is 3.785 L vs the UK&apos;s 4.546 L, which is why 40 MPG UK is only 33 MPG US.</Note>
    </div>
  );
}

/* ------------------------------ 9. Pressure ------------------------------- */

type PUnit = "psi" | "bar" | "kPa" | "MPa" | "atm" | "mmHg" | "Torr";

const P_FACTORS: Record<PUnit, number> = {
  psi: 6894.757, bar: 1e5, kPa: 1e3, MPa: 1e6, atm: 101325, mmHg: 133.322, Torr: 101325 / 760,
};
const P_OPTS = (Object.keys(P_FACTORS) as PUnit[]).map((u) => ({ v: u, label: u }));

const P_REFS: [string, number][] = [
  ["Basketball", 8], ["Sea-level atmosphere", 14.696], ["Car tire", 32], ["Road-bike tire", 60],
  ["Espresso machine (9 bar)", 130.5], ["Fire hose", 150], ["Scuba tank", 3000],
];

export function PressureTool() {
  const A = accentOf(8);
  const [val, setVal] = useState("32");
  const [unit, setUnit] = useState<PUnit>("psi");
  const pa = num(val) * P_FACTORS[unit];
  const inUnit = (u: PUnit) => fmt(pa / P_FACTORS[u], pa / P_FACTORS[u] >= 100 ? 1 : 3);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Pressure — type in any unit" value={val} onChange={setVal} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={P_OPTS} />
      </Row>
      <Grid cols={3}>
        <BigStat label="bar" value={inUnit("bar")} accent={unit === "bar" ? A : "#52525b"} />
        <BigStat label="psi" value={inUnit("psi")} accent={unit === "psi" ? A : "#52525b"} />
        <BigStat label="MPa" value={inUnit("MPa")} accent={unit === "MPa" ? A : "#52525b"} />
      </Grid>
      <Split
        left={
          <Panel title="all seven units" accent={A}>
            {(Object.keys(P_FACTORS) as PUnit[]).map((u) => (
              <KV key={u} k={u} v={inUnit(u)} accent={u === unit ? A : undefined} />
            ))}
            <KV k="pascals (base)" v={fmt(pa, 1)} />
          </Panel>
        }
        right={
          <Panel title="pressure of real things — log scale" accent={A}>
            <div className="mb-3">
              <Meter value={Math.log10(Math.max(1, pa / P_FACTORS.psi))} max={Math.log10(5000)} accent={A} label="▲ your reading" right={`${inUnit(unit)} ${unit}`} />
            </div>
            {P_REFS.map(([name, psi]) => (
              <div key={name} className="mb-2.5 last:mb-0">
                <Meter value={Math.log10(psi)} max={Math.log10(5000)} accent="#52525b" label={name} right={`${fmt(psi / P_FACTORS.psi, psi < 100 ? 1 : 0)} psi · ${fmt(psi / P_FACTORS[unit], 2)} ${unit}`} />
              </div>
            ))}
          </Panel>
        }
      />
      <Note>Torr and mmHg differ only in the fifth decimal (760 Torr = 1 atm exactly) — medicine rounds them together. Gauges read psi &quot;gauge&quot;, i.e. above atmospheric; add 14.7 psi for absolute. Your car tire is ~2.2 bar, not 32.</Note>
    </div>
  );
}

/* ------------------------------ 10. Energy -------------------------------- */

type EUnit = "J" | "kJ" | "cal" | "kcal" | "Wh" | "kWh" | "BTU";

const E_FACTORS: Record<EUnit, number> = {
  J: 1, kJ: 1e3, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, BTU: 1055.06,
};
const E_OPTS = (Object.keys(E_FACTORS) as EUnit[]).map((u) => ({ v: u, label: u }));

export function EnergyTool() {
  const A = accentOf(9);
  const [val, setVal] = useState("2000");
  const [unit, setUnit] = useState<EUnit>("kcal");
  const j = num(val) * E_FACTORS[unit];
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Energy — type in any unit" value={val} onChange={setVal} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={E_OPTS} />
      </Row>
      <Grid cols={3}>
        <BigStat label="joules" value={fmt(j, 0)} unit="J" accent={unit === "J" ? A : "#52525b"} />
        <BigStat label="food calories" value={fmt(j / 4184, 1)} unit="kcal" accent={unit === "kcal" ? A : "#52525b"} hint="the Cal on labels" />
        <BigStat label="kilowatt-hours" value={fmt(j / 3.6e6, 3)} unit="kWh" accent={unit === "kWh" ? A : "#52525b"} hint="what your meter bills" />
      </Grid>
      <Split
        left={
          <Panel title="all seven units" accent={A}>
            {(Object.keys(E_FACTORS) as EUnit[]).map((u) => (
              <KV key={u} k={u} v={fmt(j / E_FACTORS[u], j / E_FACTORS[u] >= 100 ? 1 : 3)} accent={u === unit ? A : undefined} />
            ))}
          </Panel>
        }
        right={
          <Panel title="in real life, that much energy…" accent={A}>
            <KV k="charges a phone" v={`${smartCount(j / 54000)} ×`} accent={A} />
            <KV k="boils a kettle (1 L from 20 °C)" v={`${smartCount(j / 432000)} ×`} />
            <KV k="runs a laptop" v={`${fmt(j / 180000, 1)} h`} />
            <KV k="lights a 10 W LED" v={`${fmt(j / 36000, 1)} h`} />
            <KV k="bananas (105 kcal each)" v={`${smartCount(j / 439320)} ×`} />
            <KV k="1 BTU = heat 1 lb water by 1 °F" v={`${fmt(j / 1055.06, 2)} BTU`} />
          </Panel>
        }
      />
      <Note>1 kcal = 4184 J = 1.163 Wh — a candy bar stores about 0.29 kWh, and your body idles through ~2.3 kWh a day. You are a 100-watt machine that runs on snacks.</Note>
    </div>
  );
}

/* ------------------------------ 11. Angle --------------------------------- */

type AUnit = "deg" | "rad" | "grad" | "turn" | "arcmin" | "arcsec";

const ANG_FACTORS: Record<AUnit, number> = {
  deg: 1, rad: 180 / Math.PI, grad: 0.9, turn: 360, arcmin: 1 / 60, arcsec: 1 / 3600,
};
const ANG_OPTS = (Object.keys(ANG_FACTORS) as AUnit[]).map((u) => ({ v: u, label: u }));

function piFraction(deg: number): string | null {
  if (deg <= 0 || deg > 720) return null;
  const target = deg / 180;
  for (let d = 1; d <= 12; d++) {
    const n = Math.round(target * d);
    if (n > 0 && Math.abs(target - n / d) < 1e-4) {
      const head = n === 1 ? "π" : `${n}π`;
      return d === 1 ? head : `${head}/${d}`;
    }
  }
  return null;
}

export function AngleTool() {
  const A = accentOf(10);
  const [val, setVal] = useState("90");
  const [unit, setUnit] = useState<AUnit>("deg");
  const deg = num(val) * ANG_FACTORS[unit];
  const sweep = ((deg % 360) + 360) % 360;
  const frac = piFraction(deg);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Angle — type in any unit" value={val} onChange={setVal} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={ANG_OPTS} />
      </Row>
      <Split
        left={
          <Panel title="the disc — sweep filled from 12 o'clock" accent={A}>
            <div className="flex justify-center py-4">
              <div className="relative h-44 w-44">
                <div className="h-44 w-44 rounded-full" style={{ background: `conic-gradient(${A} ${sweep}deg, #27272a 0deg)` }} />
                <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-800 bg-zinc-900" />
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] text-zinc-600">0°</span>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[9px] text-zinc-600">90°</span>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] text-zinc-600">180°</span>
                <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[9px] text-zinc-600">270°</span>
              </div>
            </div>
            <KV k="of a full turn" v={fmt((deg / 360) * 100, 2) + " %"} accent={A} />
          </Panel>
        }
        right={
          <div className="space-y-4">
            <Panel title="exact π fraction (classic angles)" accent={A}>
              <div className="flex min-h-[72px] items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/60">
                {frac ? (
                  <p className="font-brut text-4xl" style={{ color: A }}>{frac}</p>
                ) : (
                  <p className="font-mono text-xs text-zinc-600">no clean π fraction within 1/12 steps — that&apos;s fine, most angles aren&apos;t special</p>
                )}
              </div>
              <Note>{frac ? `Exactly ${fmt(deg, 4)}° — the kind of angle that shows up on exams.` : "π fractions live at multiples of 15°; everything else is decimal radians territory."}</Note>
            </Panel>
            <Panel title="all six units" accent={A}>
              <div className="grid grid-cols-2 gap-x-6">
                {(Object.keys(ANG_FACTORS) as AUnit[]).map((u) => (
                  <KV key={u} k={u} v={fmt(deg / ANG_FACTORS[u], Math.abs(deg / ANG_FACTORS[u]) < 100 ? 4 : 2)} accent={u === unit ? A : undefined} />
                ))}
              </div>
            </Panel>
          </div>
        }
      />
      <Note>Radians are the honest unit — arc length is simply radius × angle, which is why calculus refuses anything else. Gradians (400 per turn) survive in French surveying and old Casio calculators.</Note>
    </div>
  );
}

/* ------------------------------ 12. Ring size ----------------------------- */

type RUnit = "dia" | "circ" | "us" | "eu";

const UK_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const R_OPTS: readonly { v: RUnit; label: string }[] = [
  { v: "dia", label: "⌀ diameter mm" }, { v: "circ", label: "circumference mm" }, { v: "us", label: "US size" }, { v: "eu", label: "EU (ISO)" },
];

export function RingSizeTool() {
  const A = accentOf(11);
  const [val, setVal] = useState("17.35");
  const [unit, setUnit] = useState<RUnit>("dia");
  const v = num(val);
  const circ = unit === "dia" ? v * Math.PI : unit === "us" ? v * 2.55 + 36.5 : v;
  const dia = circ / Math.PI;
  const usExact = (circ - 36.5) / 2.55;
  const us = roundHalf(usExact);
  const ukIdx = Math.round(usExact * 2);
  const uk = ukIdx >= 1 && ukIdx <= UK_LETTERS.length ? UK_LETTERS[ukIdx - 1] + (ukIdx % 2 ? "½" : "") : "—";
  const jp = Math.round(2 * usExact - 1);
  const px = Math.min(110, Math.max(24, dia * 3.78));
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Ring measurement" value={val} onChange={setVal} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={R_OPTS} />
      </Row>
      <Split
        left={
          <Panel title="true-size preview (≈ 96 dpi screens)" accent={A}>
            <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 py-2">
              <div className="flex items-center justify-center rounded-full border-[3px]" style={{ width: px, height: px, borderColor: A }}>
                <div className="rounded-full border border-dashed border-zinc-700" style={{ width: Math.max(8, px - 14), height: Math.max(8, px - 14) }} />
              </div>
              <p className="font-mono text-[10px] text-zinc-500">inner ⌀ {fmt(dia, 2)} mm · circumference {fmt(circ, 1)} mm</p>
            </div>
            <div className="flex justify-center gap-2">
              <Tag accent={A}>US {us}</Tag>
              <Tag accent={A}>UK {uk}</Tag>
              <Tag accent={A}>EU {roundHalf(circ)}</Tag>
            </div>
          </Panel>
        }
        right={
          <Panel title="one ring, four systems" accent={A}>
            <KV k="US / Canada" v={fmt(us, 1)} accent={A} />
            <KV k="UK / Australia (letter)" v={uk} />
            <KV k="EU — ISO 8653 (= circumference mm)" v={fmt(roundHalf(circ), 1)} />
            <KV k="Japan / China" v={`${jp}`} />
            <KV k="inner diameter" v={`${fmt(dia, 2)} mm`} />
            <KV k="inner circumference" v={`${fmt(circ, 1)} mm`} accent={A} />
            <Note>US scale: each size = 2.55 mm of circumference. EU size is literally the circumference in mm — no lookup table needed.</Note>
          </Panel>
        }
      />
      <Note>The string trick: wrap a thin strip of paper snugly around the finger, mark where it overlaps, lay it flat and measure in mm — that length is the circumference (and, helpfully, the EU size). Measure at day&apos;s end when fingers are biggest, and size over knuckles, not the base.</Note>
    </div>
  );
}

/* ------------------------------ meta -------------------------------------- */

export const convertPlusMeta: ToolMeta[] = [
  {
    id: "shoe-size",
    name: "Shoe Size Converter",
    description: "Foot length to US, EU and UK sizes across men, women and kids — with a to-scale ruler and walk-in chart.",
    category: "converters",
    icon: Footprints,
    keywords: "shoe size converter foot length cm us eu uk men women kids mondo brannock",
    badge: "new",
    component: ShoeSizeTool,
  },
  {
    id: "clothing-size",
    name: "Clothing Size Guide",
    description: "Chest, waist and hip in cm → XS–XXL for men or women, with band-position meters and vanity-sizing notes.",
    category: "converters",
    icon: Shirt,
    keywords: "clothing size guide chest waist hip xs s m l xl xxl men women measurements fit",
    badge: "new",
    component: ClothingSizeTool,
  },
  {
    id: "paper-size",
    name: "Paper Size Explorer",
    description: "A-series and B-series paper in mm and inches, a to-scale ladder, sheets-per-m² and gsm paper weight math.",
    category: "converters",
    icon: FileStack,
    keywords: "paper size a4 a3 a0 b5 iso 216 mm inches gsm weight sheets ream",
    badge: "new",
    component: PaperSizeTool,
  },
  {
    id: "data-size",
    name: "Data Size Converter",
    description: "Type a size in any unit — bytes to terabytes in SI and binary, with real-world analogies from photos to games.",
    category: "converters",
    icon: HardDrive,
    keywords: "data size converter bytes kb mb gb tb kib gib bits storage binary decimal",
    badge: "new",
    component: DataSizeTool,
  },
  {
    id: "download-time",
    name: "Download Time Calculator",
    description: "File size × connection speed → time, benchmarked from dial-up to 5G and fiber, with a 10 GB breakdown.",
    category: "converters",
    icon: Download,
    keywords: "download time calculator file size connection speed mbps gbps dial-up 5g fiber bandwidth",
    badge: "new",
    component: DownloadTimeTool,
  },
  {
    id: "bitrate",
    name: "Bitrate & File Size",
    description: "Solve the missing piece: duration + bitrate → file size, or size + duration → bitrate, with quality presets.",
    category: "converters",
    icon: Activity,
    keywords: "bitrate file size video 480p 720p 1080p 4k mbps encoding duration recording",
    badge: "new",
    component: BitrateTool,
  },
  {
    id: "ppi",
    name: "Screen PPI Calculator",
    description: "Pixels plus diagonal → PPI, megapixels, dot pitch and aspect ratio, compared against real phones and monitors.",
    category: "converters",
    icon: Monitor,
    keywords: "ppi calculator pixel density screen resolution monitor phone display aspect ratio dot pitch",
    badge: "new",
    component: PpiTool,
  },
  {
    id: "fuel-economy",
    name: "Fuel Economy Converter",
    description: "MPG US ↔ MPG UK ↔ L/100km ↔ km/L in any direction, with an efficiency meter and cost-per-100-km math.",
    category: "converters",
    icon: Fuel,
    keywords: "fuel economy converter mpg l/100km kilometers per liter gas petrol consumption cost",
    badge: "new",
    component: FuelEconomyTool,
  },
  {
    id: "pressure",
    name: "Pressure Converter",
    description: "psi, bar, kPa, MPa, atm, mmHg and Torr from one smart input, with tire-to-scuba reference bars.",
    category: "converters",
    icon: Gauge,
    keywords: "pressure converter psi bar kpa mpa atm mmhg torr pascal tire scuba",
    badge: "new",
    component: PressureTool,
  },
  {
    id: "energy",
    name: "Energy Converter",
    description: "Joules, calories, watt-hours and BTUs in one field — food energy meets electricity with everyday examples.",
    category: "converters",
    icon: Zap,
    keywords: "energy converter joules calories kcal watt hours kwh btu food electricity",
    badge: "new",
    component: EnergyTool,
  },
  {
    id: "angle",
    name: "Angle Converter",
    description: "Degrees, radians, gradians, turns and arc-seconds — with exact π fractions for the classic angles.",
    category: "converters",
    icon: Compass,
    keywords: "angle converter degrees radians gradians turns arcminutes arcseconds pi fraction",
    badge: "new",
    component: AngleTool,
  },
  {
    id: "ring-size",
    name: "Ring Size Converter",
    description: "Ring size from diameter or circumference mm → US, EU (ISO), UK letters and JP — with a true-size preview circle.",
    category: "converters",
    icon: Gem,
    keywords: "ring size converter diameter circumference us eu uk japanese iso 8653 jewelry",
    badge: "new",
    component: RingSizeTool,
  },
];
