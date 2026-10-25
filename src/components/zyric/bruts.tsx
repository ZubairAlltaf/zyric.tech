"use client";

import type { CategoryId } from "./registry";

/* --------------------------------------------------------------------------
   ZYRIC BRUT — shared sticker-brutalist primitives
   -------------------------------------------------------------------------- */

export const INK = "#141414";
export const PAPER = "#F3EFE6";

/** One loud color per category — the sticker palette. */
export const CAT_COLORS: Record<CategoryId, string> = {
  signature: "#FFD43B", // yellow
  css: "#FF9DE2", // pink
  notes: "#7FC8FF", // sky
  trackers: "#5EE39A", // mint
  calculators: "#FF7A3D", // orange
  converters: "#B9A6FF", // lavender
  time: "#C6F24E", // lime
  generators: "#4ECDC4", // teal
  media: "#FF8A7A", // coral
  web: "#FFB3C6", // rose
  business: "#F5D6A3", // tan
  random: "#FFFFFF", // white
};

export const BADGES: Record<string, { label: string; bg: string }> = {
  unique: { label: "SIGNATURE", bg: "#FFD43B" },
  new: { label: "NEW", bg: "#FF9DE2" },
  saved: { label: "AUTO-SAVES", bg: "#7FC8FF" },
  local: { label: "PRIVATE", bg: "#5EE39A" },
};

export const chipBase =
  "inline-flex items-center border-2 border-[#141414] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] leading-none";

export function BadgeChip({ badge }: { badge?: string }) {
  if (!badge || !BADGES[badge]) return null;
  const b = BADGES[badge];
  return (
    <span className={chipBase} style={{ background: b.bg }}>
      {b.label}
    </span>
  );
}

/* ------------------------------ Starburst ----------------------------------
   16-point sticker burst, generated deterministically (hydration-safe).
---------------------------------------------------------------------------- */

function burstPoints(spikes: number, R: number, r: number): string {
  const pts: string[] = [];
  const total = spikes * 2;
  for (let i = 0; i < total; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(50 + rad * Math.cos(a)).toFixed(2)},${(50 + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const BURST_PTS = burstPoints(14, 50, 38);

export function Burst({
  text,
  bg = "#FFD43B",
  fg = "#141414",
  size = 92,
  spin = false,
  className = "",
}: {
  text: string;
  bg?: string;
  fg?: string;
  size?: number;
  spin?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className={`absolute inset-0 h-full w-full ${spin ? "animate-spin-slow" : ""}`}
      >
        <polygon
          points={BURST_PTS}
          fill={bg}
          stroke="#141414"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="relative z-10 inline-block text-center font-brut uppercase leading-[1.08]"
        style={{
          fontSize: Math.max(8, size * 0.125),
          color: fg,
          transform: "rotate(-8deg)",
          width: size * 0.72,
          overflowWrap: "break-word",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ------------------------------ Stickers ----------------------------------- */

export function StickyNote({
  children,
  author,
  className = "",
  rotate = "-5deg",
  bg = "#FFD43B",
}: {
  children: React.ReactNode;
  author?: string;
  className?: string;
  rotate?: string;
  bg?: string;
}) {
  return (
    <div
      className={`brut-shadow-sm brut-lift relative border-2 border-[#141414] p-3 ${className}`}
      style={{ background: bg, transform: `rotate(${rotate})` }}
    >
      <p className="font-brut text-[13px] uppercase leading-snug text-[#141414]">{children}</p>
      {author ? (
        <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#141414]/60">
          — {author}
        </p>
      ) : null}
    </div>
  );
}

export function SpeechBubble({
  children,
  author,
  className = "",
  rotate = "2deg",
}: {
  children: React.ReactNode;
  author?: string;
  className?: string;
  rotate?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ transform: `rotate(${rotate})` }}>
      <div className="brut-shadow-sm brut-lift border-2 border-[#141414] bg-white p-3">
        <p className="font-brut text-[13px] uppercase leading-snug text-[#141414]">{children}</p>
        {author ? (
          <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#141414]/50">
            — {author}
          </p>
        ) : null}
      </div>
      <div
        className="absolute -bottom-[9px] left-6 h-4 w-4 border-b-2 border-l-2 border-[#141414] bg-white"
        style={{ transform: "rotate(-55deg) skewX(-10deg)" }}
      />
    </div>
  );
}

export function FrameSticker({
  lines,
  className = "",
  rotate = "3deg",
  bg = "#7FC8FF",
}: {
  lines: string[];
  className?: string;
  rotate?: string;
  bg?: string;
}) {
  return (
    <div
      className={`brut-shadow-sm brut-lift border-2 border-[#141414] px-3 py-2 ${className}`}
      style={{ background: bg, transform: `rotate(${rotate})` }}
    >
      {lines.map((l) => (
        <p
          key={l}
          className="font-brut text-[13px] uppercase leading-tight text-[#141414]"
        >
          {l}
        </p>
      ))}
    </div>
  );
}

/** Small square color bullet used in lists/menus. */
export function ColorDot({ color, className = "" }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 border-2 border-[#141414] ${className}`}
      style={{ background: color }}
    />
  );
}

/* --------------------------- Section heading ------------------------------- */

export function SectionHead({
  kicker,
  title,
  dark = false,
  accent = "#FFD43B",
  right,
}: {
  kicker: string;
  title: string;
  dark?: boolean;
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span
          className={`${chipBase} mb-3 inline-flex`}
          style={{ background: accent }}
        >
          {kicker}
        </span>
        <h2
          className={`font-brut text-4xl uppercase leading-[0.95] sm:text-5xl lg:text-6xl ${
            dark ? "text-stroke-cream" : "text-[#141414]"
          }`}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}
