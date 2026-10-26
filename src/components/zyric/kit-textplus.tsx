"use client";

/* ==========================================================================
   KIT: TEXT PLUS — 14 unicode & text-wrangling machines.
   Every screen has its own composition: split panes, card grids, vertical
   lists, hero-stat rows. All conversion runs 100% client-side.
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  ALargeSmall,
  Binary,
  Bold,
  Castle,
  Eraser,
  EyeOff,
  FlipVertical2,
  Gamepad2,
  Grip,
  Rainbow,
  Repeat,
  Skull,
  Strikethrough,
  UnfoldVertical,
} from "lucide-react";
import {
  Area,
  BigStat,
  Btn,
  Check,
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
import { CopyButton } from "./hooks";
import type { ToolMeta } from "./tool-types";

/* ------------------------------ Unicode machinery -------------------------- */

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

type CharMap = Record<string, string>;

/** Build a char→char map by shifting each source string to a codepoint block. */
function makeMap(...blocks: [string, number][]): CharMap {
  const m: CharMap = {};
  for (const [set, start] of blocks) {
    for (let i = 0; i < set.length; i++) m[set[i]] = String.fromCodePoint(start + i);
  }
  return m;
}

/** Map known chars, pass everything else through untouched. */
function remap(s: string, m: CharMap): string {
  let out = "";
  for (const ch of s) out += m[ch] ?? ch;
  return out;
}

function perChar(s: string, f: (c: string) => string): string {
  return Array.from(s).map(f).join("");
}

/* Mathematical alphanumeric blocks (verified ranges): */
const F_BOLD_SERIF = makeMap([UPPER, 0x1d400], [LOWER, 0x1d41a], [DIGITS, 0x1d7ce]);
const F_BOLD_SANS = makeMap([UPPER, 0x1d5d4], [LOWER, 0x1d5ee], [DIGITS, 0x1d7ec]);
const F_BOLD_ITALIC: CharMap = {
  ...makeMap([UPPER, 0x1d468], [LOWER, 0x1d482], [DIGITS, 0x1d7ce]),
  h: "\u210E", // planck constant occupies italic-h's slot
};
const F_DOUBLE_STRUCK: CharMap = {
  ...makeMap([UPPER, 0x1d538], [LOWER, 0x1d552], [DIGITS, 0x1d7d8]),
  C: "\u2102", H: "\u210D", N: "\u2115", P: "\u2119", Q: "\u211A", R: "\u211D", Z: "\u2124",
};
const F_FRAKTUR: CharMap = {
  ...makeMap([UPPER, 0x1d504], [LOWER, 0x1d51e]),
  C: "\u212D", H: "\u210C", I: "\u2111", R: "\u211B", Z: "\u2128",
};
const F_FRAKTUR_BOLD = makeMap([UPPER, 0x1d56c], [LOWER, 0x1d586]);
const F_SCRIPT_BOLD = makeMap([UPPER, 0x1d4d0], [LOWER, 0x1d4ea]);

/* Phonetic small capitals (U+1D00 range + Latin Extended): */
const F_SMALL_CAPS: CharMap = {
  a: "\u1D00", b: "\u0299", c: "\u1D04", d: "\u1D05", e: "\u1D07", f: "\uA730",
  g: "\u0262", h: "\u029C", i: "\u026A", j: "\u1D0A", k: "\u1D0B", l: "\u1D0C",
  m: "\u1D0D", n: "\u0274", o: "\u1D0F", p: "\u1D18", q: "\uA7F4", r: "\u0280",
  s: "\uA731", t: "\u1D1B", u: "\u1D1C", v: "\u1D20", w: "\u1D21", x: "x",
  y: "\u028F", z: "\u1D22",
};

/* Superscript / subscript letterforms (gaps are real Unicode gaps): */
const F_SUPER: CharMap = {
  "0": "\u2070", "1": "\u00B9", "2": "\u00B2", "3": "\u00B3", "4": "\u2074",
  "5": "\u2075", "6": "\u2076", "7": "\u2077", "8": "\u2078", "9": "\u2079",
  "+": "\u207A", "-": "\u207B", "=": "\u207C", "(": "\u207D", ")": "\u207E",
  a: "\u1D43", b: "\u1D47", c: "\u1D9C", d: "\u1D48", e: "\u1D49", f: "\u1DA0",
  g: "\u1D4D", h: "\u02B0", i: "\u2071", j: "\u02B2", k: "\u1D4F", l: "\u02E1",
  m: "\u1D50", n: "\u207F", o: "\u1D52", p: "\u1D56", r: "\u02B3", s: "\u02E2",
  t: "\u1D57", u: "\u1D58", v: "\u1D5B", w: "\u02B7", x: "\u02E3", y: "\u02B8",
  z: "\u1DBB",
};
const F_SUB: CharMap = {
  "0": "\u2080", "1": "\u2081", "2": "\u2082", "3": "\u2083", "4": "\u2084",
  "5": "\u2085", "6": "\u2086", "7": "\u2087", "8": "\u2088", "9": "\u2089",
  "+": "\u208A", "-": "\u208B", "=": "\u208C", "(": "\u208D", ")": "\u208E",
  a: "\u2090", e: "\u2091", h: "\u2095", i: "\u1D62", j: "\u2C7C", k: "\u2096",
  l: "\u2097", m: "\u2098", n: "\u2099", o: "\u2092", p: "\u209A", r: "\u1D63",
  s: "\u209B", t: "\u209C", u: "\u1D64", v: "\u1D65", x: "\u2093",
};

/* Upside-down map (classic look, letters + digits + punctuation): */
const F_FLIP: CharMap = {
  a: "\u0250", b: "q", c: "\u0254", d: "p", e: "\u01DD", f: "\u025F", g: "\u0183",
  h: "\u0265", i: "\u1D09", j: "\u027E", k: "\u029E", l: "l", m: "\u026F", n: "u",
  o: "o", p: "d", q: "b", r: "\u0279", s: "s", t: "\u0287", u: "n", v: "\u028C",
  w: "\u028D", x: "x", y: "\u028E", z: "z",
  A: "\u2200", B: "\u15FA", C: "\u0186", D: "\u15E1", E: "\u018E", F: "\u2132",
  G: "\u2141", H: "H", I: "I", J: "\u017F", K: "\u029E", L: "\u02E5", M: "W",
  N: "N", O: "O", P: "\u0500", Q: "\u00D2", R: "\u1D1A", S: "S", T: "\u22A5",
  U: "\u2229", V: "\u039B", W: "M", X: "X", Y: "\u2144", Z: "Z",
  "0": "0", "1": "\u0196", "2": "\u1105", "3": "\u0190", "4": "\u3123",
  "5": "\u03DB", "6": "9", "7": "\u3125", "8": "8", "9": "6",
  ".": "\u02D9", ",": "'", "'": ",", '"': "\u201E", "!": "\u00A1", "?": "\u00BF",
  "[": "]", "]": "[", "(": ")", ")": "(", "{": "}", "}": "{", "<": ">", ">": "<",
  "&": "\u214B", "_": "\u203E", ";": "\u061B", "^": "\u2227",
};

/* Zalgo combining-mark pools (deterministic layout, random-feeling result): */
function rng(a: number, b: number): number[] {
  const r: number[] = [];
  for (let i = a; i <= b; i++) r.push(i);
  return r;
}
const Z_UP = [
  ...rng(0x0300, 0x0314), ...rng(0x033d, 0x0344), 0x0346, ...rng(0x034a, 0x034c),
  ...rng(0x0350, 0x0352), 0x0357, 0x035b, ...rng(0x0363, 0x036f), ...rng(0x0483, 0x0486),
  ...rng(0x0610, 0x0614), ...rng(0x064b, 0x0652), ...rng(0x06d6, 0x06dc),
  0x06df, 0x06e0, 0x06e1, 0x06e4, 0x0711,
];
const Z_MID = [
  0x0315, 0x031b, 0x0340, 0x0341, 0x0358, 0x0321, 0x0322, 0x0327, 0x0328,
  0x0334, 0x0335, 0x0336, 0x034f, 0x035c, 0x035d, 0x035e, 0x0360, 0x0362,
];
const Z_DOWN = [
  ...rng(0x0316, 0x0319), 0x031c, 0x0320, ...rng(0x0323, 0x0326), 0x0329,
  ...rng(0x032a, 0x0333), ...rng(0x0339, 0x033c), 0x0345, 0x0347, 0x0348,
  0x0349, 0x034d, 0x034e, ...rng(0x0353, 0x0356), 0x0359, 0x035a,
];

/** Stable pseudo-random in [0,1) from an integer seed — no Math.random drift. */
function rand01(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function zalgo(text: string, up: number, mid: number, down: number, seed: number): string {
  return Array.from(text).map((ch, i) => {
    if (/\s/.test(ch)) return ch;
    let out = ch;
    const add = (pool: number[], max: number, zone: number) => {
      const n = Math.round(rand01(seed * 977 + i * 131 + zone * 7) * max);
      for (let k = 0; k < n; k++) {
        const pick = Math.floor(rand01(seed * 613 + i * 57 + zone * 11 + k * 29) * pool.length);
        out += String.fromCodePoint(pool[Math.min(pool.length - 1, Math.max(0, pick))]);
      }
    };
    add(Z_UP, up, 0);
    add(Z_MID, mid, 1);
    add(Z_DOWN, down, 2);
    return out;
  }).join("");
}

/* Braille: letters defined by dot numbers → pattern glyph (U+2800 base). */
const BRAILLE_DOTS: Record<string, number[]> = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4],
  g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5], k: [1, 3],
  l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5], p: [1, 2, 3, 4],
  q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5],
  u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6],
  y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
};
const BRAILLE_DIGIT_SRC = "1234567890"; // → braille letters a…j under number sign
const BRAILLE_PUNCT: CharMap = {
  ".": "\u2832", ",": "\u2802", "?": "\u2839", "!": "\u2816", "'": "\u2804",
  '"': "\u2810", "-": "\u2824", ":": "\u2812", ";": "\u2806",
};
function dotsToChar(dots: number[]): string {
  return String.fromCodePoint(0x2800 + dots.reduce((a, d) => a + (1 << (d - 1)), 0));
}
function charToDots(glyph: string): number[] {
  const v = (glyph.codePointAt(0) ?? 0x2800) - 0x2800;
  return [1, 2, 3, 4, 5, 6, 7, 8].filter((d) => (v & (1 << (d - 1))) !== 0);
}
function toBraille(text: string): string {
  let out = "";
  let inNumber = false;
  for (const ch of text) {
    const lower = ch.toLowerCase();
    if (/[0-9]/.test(ch)) {
      if (!inNumber) out += "\u283C"; // number sign ⠼
      out += dotsToChar(BRAILLE_DOTS[BRAILLE_DIGIT_SRC[Number(ch)]]);
      inNumber = true;
      continue;
    }
    inNumber = false;
    if (BRAILLE_DOTS[lower]) {
      if (ch !== lower) out += "\u2820"; // capital sign ⠠
      out += dotsToChar(BRAILLE_DOTS[lower]);
    } else if (BRAILLE_PUNCT[ch]) {
      out += BRAILLE_PUNCT[ch];
    } else {
      out += ch === " " ? "\u2800" : ch;
    }
  }
  return out;
}

/* Leet maps — three escalating intensities: */
const LEET_LIGHT: CharMap = { a: "4", e: "3", g: "9", i: "1", o: "0", s: "5", t: "7", z: "2" };
const LEET_MAPS: Record<"light" | "mad" | "uber", CharMap> = {
  light: LEET_LIGHT,
  mad: { ...LEET_LIGHT, b: "8", c: "(", l: "|" },
  uber: {
    a: "4", b: "8", c: "(", d: "|)", e: "3", f: "|=", g: "9", h: "#", i: "1",
    j: "_]", k: "|<", l: "|", m: "/\\/\\/", n: "|\\|", o: "0", p: "|*", q: "(_,)",
    r: "|2", s: "5", t: "7", u: "|_|", v: "\\/", w: "\\/\\/", x: "><",
    y: "'/", z: "2",
  },
};

function coverage(m: CharMap): string {
  return `${LOWER.split("").filter((c) => m[c] !== undefined).length}/26 letters`;
}

/* ========================================================================== */
/* 1. Line Break Remover                                                      */
/* ========================================================================== */

export function LineBreakRemoverTool() {
  const A = accentOf(0);
  const [input, setInput] = useState(
    "This paragraph came out\nof a PDF or an email\nand breaks mid-sentence\non every single line."
  );
  const [join, setJoin] = useState<"space" | "comma" | "glue" | "custom">("space");
  const [custom, setCustom] = useState(" | ");
  const [collapse, setCollapse] = useState(true);
  const [dropBlanks, setDropBlanks] = useState(true);
  const inLines = useMemo(() => input.split(/\r\n|\r|\n/), [input]);
  const out = useMemo(() => {
    let lines = inLines;
    if (dropBlanks) lines = lines.filter((l) => l.trim() !== "");
    const j = join === "space" ? " " : join === "comma" ? ", " : join === "glue" ? "" : custom;
    let text = lines.join(j);
    if (collapse) text = text.replace(/[ \t]{2,}/g, " ");
    return text.trim();
  }, [inLines, join, custom, collapse, dropBlanks]);
  return (
    <div className="space-y-4">
      <Split
        left={<Area label="Broken text in" value={input} onChange={setInput} rows={11} placeholder="Paste wrapped text…" />}
        right={
          <div className="space-y-3">
            <Panel title="join lines with" accent={A}>
              <div className="space-y-3">
                <Seg
                  value={join}
                  onChange={setJoin}
                  accent={A}
                  options={[
                    { v: "space" as const, label: "Space" },
                    { v: "comma" as const, label: "Comma" },
                    { v: "glue" as const, label: "Glue" },
                    { v: "custom" as const, label: "Custom" },
                  ]}
                />
                {join === "custom" ? (
                  <Field label="Custom joiner" value={custom} onChange={setCustom} placeholder=" — " />
                ) : null}
                <div className="flex flex-col gap-2 pt-1">
                  <Check label="Remove blank lines" checked={dropBlanks} onChange={setDropBlanks} />
                  <Check label="Collapse multiple spaces" checked={collapse} onChange={setCollapse} />
                </div>
              </div>
            </Panel>
            <Grid cols={2}>
              <BigStat label="Lines in" value={inLines.length} accent="#52525b" />
              <BigStat label="Chars out" value={fmt(out.length)} accent={A} />
            </Grid>
            <Out label="flowing text" text={out} />
          </div>
        }
      />
      <Note>Glue mode fuses every line into one string — handy for un-breaking list items or joining wrapped URLs.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 2. Bold Text Generator                                                     */
/* ========================================================================== */

const BOLD_STYLES: { name: string; map: CharMap; blurb: string }[] = [
  { name: "Serif bold", map: F_BOLD_SERIF, blurb: "𝐌𝐚𝐭𝐡 𝐛𝐨𝐥𝐝 — the classic heavyweight for bios" },
  { name: "Sans bold", map: F_BOLD_SANS, blurb: "Clean chunky sans, reads well at small sizes" },
  { name: "Bold italic", map: F_BOLD_ITALIC, blurb: "Leaning weight, great for one-word statements" },
  { name: "Bold underlined", map: {}, blurb: "Serif bold with an underline baked into every glyph" },
];

export function BoldTextTool() {
  const A = accentOf(1);
  const [text, setText] = useState("bold moves only");
  const cards = useMemo(
    () =>
      BOLD_STYLES.map((s) => ({
        ...s,
        out: s.name === "Bold underlined" ? perChar(remap(text, F_BOLD_SERIF), (c) => c + "\u0332") : remap(text, s.map),
        sample: s.name === "Bold underlined" ? perChar("Abc 123", (c) => c + "\u0332") : remap("Abc 123", s.map),
      })),
    [text]
  );
  return (
    <div className="space-y-4">
      <Area label="Your text (works in IG / WhatsApp / X bios)" value={text} onChange={setText} rows={3} mono={false} placeholder="Type anything…" />
      <Grid cols={2}>
        {cards.map((c) => (
          <Panel key={c.name} title={c.name} accent={A} right={<CopyButton text={c.out} />}>
            <p className="min-w-0 break-words text-xl leading-relaxed text-zinc-100">
              {c.out || "—"}
            </p>
            <p className="mt-2 font-mono text-[11px] text-zinc-500">{c.sample}</p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-600">{c.blurb}</p>
          </Panel>
        ))}
      </Grid>
      <Note>
        These are real Unicode letterforms, not styled HTML — they survive copy-paste into apps that allow no formatting.
        Digits fall back to mathematical bold where italic bold digits don&apos;t exist.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 3. Tiny & Small Text                                                       */
/* ========================================================================== */

export function SmallTextTool() {
  const A = accentOf(2);
  const [text, setText] = useState("small type, big energy");
  const styles = useMemo(
    () => [
      { name: "Superscript ˢᵗʸˡᵉ", map: F_SUPER, label: "superscript" },
      { name: "Small caps", map: F_SMALL_CAPS, label: "small caps" },
      { name: "Subscript ᵤₙdₑᵣ", map: F_SUB, label: "subscript" },
    ],
    []
  );
  return (
    <div className="space-y-4">
      <Area label="Text to shrink" value={text} onChange={setText} rows={2} mono={false} placeholder="Type something…" />
      <div className="space-y-3">
        {styles.map((s) => {
          const out = remap(text.toLowerCase(), s.map);
          return (
            <Panel key={s.name} title={s.name} accent={A} right={<CopyButton text={out} />}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="min-w-0 break-words text-2xl leading-relaxed" style={{ color: A }}>
                  {out || "—"}
                </p>
                <Tag accent={A}>{coverage(s.map)}</Tag>
              </div>
              <p className="mt-2 font-mono text-[11px] text-zinc-500">{remap("abcdefghijklmnopqrstuvwxyz 0123456789", s.map)}</p>
            </Panel>
          );
        })}
      </div>
      <Note>
        Unicode simply has no superscript q and no subscript b, c, d, f, g, q, w, y, z — those letters pass through
        unchanged, which most bios hide well. Small caps map every letter; plain x stays x by design.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 4. Strikethrough Studio                                                    */
/* ========================================================================== */

export function StrikeStudioTool() {
  const A = accentOf(3);
  const [text, setText] = useState("cancel this whole thing");
  const [strike, setStrike] = useState(true);
  const [underline, setUnderline] = useState(false);
  const [slash, setSlash] = useState(false);
  const out = useMemo(
    () =>
      perChar(text, (c) => {
        let s = c;
        if (strike) s += "\u0336";
        if (slash) s += "\u0338";
        if (underline) s += "\u0332";
        return s;
      }),
    [text, strike, underline, slash]
  );
  const layers = [strike, slash, underline].filter(Boolean).length;
  return (
    <div className="space-y-4">
      <Panel title="live preview" accent={A} right={<Tag accent={A}>{layers} layer{layers === 1 ? "" : "s"}</Tag>}>
        <p className="min-w-0 break-words py-4 text-center text-4xl font-black leading-snug text-zinc-100">
          {out || "—"}
        </p>
      </Panel>
      <Row>
        <Check label="Strikethrough ̶" checked={strike} onChange={setStrike} />
        <Check label="Slash ̷" checked={slash} onChange={setSlash} />
        <Check label="Underline ̲" checked={underline} onChange={setUnderline} />
      </Row>
      <Split
        left={<Area label="Text" value={text} onChange={setText} rows={5} mono={false} />}
        right={<Out label="marked-up text" text={out} rows={5} />}
      />
      <Note>Layer all three at once for maximum destruction. Marks are combining characters, so the effect follows the text into any app.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 5. Upside Down Text                                                        */
/* ========================================================================== */

export function UpsideDownTool() {
  const A = accentOf(4);
  const [text, setText] = useState("flip mode engaged");
  const out = useMemo(() => remap(Array.from(text).reverse().join(""), F_FLIP), [text]);
  return (
    <div className="space-y-4">
      <Panel title="flipped output — read it upside down" accent={A} right={<CopyButton text={out} />}>
        <p className="min-w-0 break-words py-5 text-center text-4xl font-black leading-snug" style={{ color: A }}>
          {out || "—"}
        </p>
      </Panel>
      <Split
        left={<Area label="Normal text" value={text} onChange={setText} rows={4} mono={false} />}
        right={<Out label="reversed + flipped" text={out} rows={4} />}
      />
      <Note>
        Every glyph is swapped for its rotated twin (a→ɐ, e→ǝ, ?→¿) and the string is reversed, so the sentence reads
        correctly when the phone is upside down. Some rare letters have no flip and stay put.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 6. Vaporwave Text                                                          */
/* ========================================================================== */

export function VaporwaveTool() {
  const A = accentOf(5);
  const [text, setText] = useState("aesthetic vibes");
  const [gap, setGap] = useState(1);
  const [wideSpaces, setWideSpaces] = useState(true);
  const out = useMemo(() => {
    const fw = Array.from(text).map((c) => {
      if (c === " ") return wideSpaces ? "\u3000" : " ";
      const code = c.codePointAt(0) ?? 0;
      return code >= 0x21 && code <= 0x7e ? String.fromCodePoint(0xff01 + code - 0x21) : c;
    });
    return fw.join(" ".repeat(gap));
  }, [text, gap, wideSpaces]);
  return (
    <div className="space-y-4">
      <Panel title="ａｅｓｔｈｅｔｉｃ preview" accent={A} right={<CopyButton text={out} />}>
        <p
          className="min-w-0 break-all py-5 text-center text-3xl font-bold leading-relaxed"
          style={{ color: A, letterSpacing: gap > 0 ? "0.08em" : undefined }}
        >
          {out || "—"}
        </p>
      </Panel>
      <Row>
        <div className="min-w-48 flex-1">
          <Slider label="Space between letters" value={gap} onChange={setGap} min={0} max={3} accent={A} />
        </div>
        <Check label="Wide ideographic spaces" checked={wideSpaces} onChange={setWideSpaces} />
      </Row>
      <Split
        left={<Area label="Plain text" value={text} onChange={setText} rows={4} mono={false} />}
        right={<Out label="fullwidth text" text={out} rows={4} />}
      />
      <Note>
        ASCII is shifted into the fullwidth block (a→ａ, 0→０, U+FF01 range). Emoji and non-Latin letters pass through
        untouched, so ｖｉｂｅｓ mixed with 🌴 still work.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 7. Zalgo Glitch Text                                                       */
/* ========================================================================== */

export function ZalgoTool() {
  const A = accentOf(6);
  const [text, setText] = useState("do not read this");
  const [up, setUp] = useState(5);
  const [mid, setMid] = useState(1);
  const [down, setDown] = useState(3);
  const [seed, setSeed] = useState(1);
  const out = useMemo(() => zalgo(text, up, mid, down, seed), [text, up, mid, down, seed]);
  const marks = useMemo(() => Array.from(out).length - Array.from(text).length, [out, text]);
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Slider label="Above ☝️ chaos" value={up} onChange={setUp} min={0} max={10} accent={A} />
        <Slider label="Middle chaos" value={mid} onChange={setMid} min={0} max={10} accent={A} />
        <Slider label="Below 👇 chaos" value={down} onChange={setDown} min={0} max={10} accent={A} />
      </Grid>
      <Row>
        <Btn accent={A} onClick={() => setSeed((s) => s + 97)}>Reroll chaos</Btn>
        <Tag accent={A}>{fmt(marks)} marks attached</Tag>
        {up + mid + down === 0 ? <Tag accent="#52525b">currently harmless</Tag> : null}
      </Row>
      <Panel title="cursed preview" accent={A}>
        <p className="min-w-0 break-all py-4 text-2xl leading-loose text-zinc-100">{out || "—"}</p>
      </Panel>
      <Split
        left={<Area label="Innocent text" value={text} onChange={setText} rows={4} />}
        right={<Out label="cursed text" text={out} rows={4} />}
      />
      <Note>
        Combining diacritics stack on every letter — up to 10 layers per zone. Output is stable while you type;
        reroll for a new arrangement. At maximum intensity some renderers will weep. That is the point.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 8. Text ↔ Binary                                                           */
/* ========================================================================== */

export function TextBinaryTool() {
  const A = accentOf(7);
  const [dir, setDir] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("zyric");
  const result = useMemo(() => {
    if (dir === "encode") {
      const bytes = Array.from(new TextEncoder().encode(input));
      return { text: bytes.map((b) => b.toString(2).padStart(8, "0")).join(" "), bytes: bytes.length, dropped: 0 };
    }
    const bits = input.replace(/[^01]/g, "");
    const usable = bits.length - (bits.length % 8);
    const bytes: number[] = [];
    for (let i = 0; i < usable; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return {
      text: new TextDecoder("utf-8").decode(new Uint8Array(bytes)),
      bytes: bytes.length,
      dropped: bits.length % 8,
    };
  }, [dir, input]);
  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={dir}
          onChange={setDir}
          accent={A}
          options={[
            { v: "encode" as const, label: "Text → Binary" },
            { v: "decode" as const, label: "Binary → Text" },
          ]}
        />
        <Tag accent={A}>{dir === "encode" ? "UTF-8 bytes" : "8-bit groups"}</Tag>
      </Row>
      <Grid cols={3}>
        <BigStat label="Bytes" value={result.bytes} accent={A} />
        <BigStat label="Bits" value={fmt(result.bytes * 8)} accent="#52525b" />
        <BigStat label="Orphan bits ignored" value={result.dropped} accent={result.dropped ? "#FF8A7A" : "#52525b"} hint="decode keeps whole bytes" />
      </Grid>
      <Split
        left={
          <Area
            label={dir === "encode" ? "Text" : "Binary (spaces, commas, newlines all fine)"}
            value={input}
            onChange={setInput}
            rows={8}
            placeholder={dir === "encode" ? "Hello" : "01001000 01101001"}
          />
        }
        right={<Out label={dir === "encode" ? "binary" : "text"} text={result.text} rows={8} />}
      />
      <Note>Encoding is UTF-8, so emoji become multi-byte groups. Decoding skips stray characters and only reads complete 8-bit groups.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 9. Braille Translator                                                      */
/* ========================================================================== */

export function BrailleTool() {
  const A = accentOf(8);
  const [input, setInput] = useState("Hello World 123");
  const out = useMemo(() => toBraille(input), [input]);
  const chips = useMemo(() => {
    const list: { ch: string; glyph: string; dots: string }[] = [];
    for (const ch of Array.from(input)) {
      const lower = ch.toLowerCase();
      let glyph: string;
      let dots: number[] | null = null;
      if (/[0-9]/.test(ch)) {
        const letter = BRAILLE_DOTS[BRAILLE_DIGIT_SRC[Number(ch)]];
        glyph = dotsToChar(letter);
        dots = letter;
      } else if (BRAILLE_DOTS[lower]) {
        glyph = dotsToChar(BRAILLE_DOTS[lower]);
        dots = BRAILLE_DOTS[lower];
      } else if (BRAILLE_PUNCT[ch]) {
        glyph = BRAILLE_PUNCT[ch];
        dots = charToDots(glyph);
      } else if (ch === " ") {
        glyph = "\u2800";
        dots = [];
      } else {
        glyph = ch;
      }
      list.push({ ch, glyph, dots: dots ? dots.join("·") || "blank" : "n/a" });
      if (list.length >= 60) break;
    }
    return list;
  }, [input]);
  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Area label="English text" value={input} onChange={setInput} rows={6} mono={false} placeholder="Type letters, digits, punctuation…" />
            <Out label="braille ⠃⠗⠁⠊⠇⠇⠑" text={out} rows={5} />
          </div>
        }
        right={
          <Panel title="dot breakdown (per character)" accent={A}>
            <div className="flex max-w-full flex-wrap gap-1.5">
              {chips.map((c, i) => (
                <div key={i} className="flex max-w-full flex-col items-center rounded border border-zinc-800 bg-zinc-950/70 px-2 py-1.5">
                  <span className="font-mono text-[10px] text-zinc-500">{c.ch === " " ? "␣" : c.ch}</span>
                  <span className="py-0.5 text-xl" style={{ color: A }}>{c.glyph}</span>
                  <span className="font-mono text-[9px] text-zinc-600">{c.dots}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
              ⠠ = capital sign · ⠼ = number sign (digits reuse letters a–j) · ⠀ = blank cell for spaces
            </p>
          </Panel>
        }
      />
      <Note>Grade-1 English braille: each letter becomes one 6-dot cell, capitals take a leading ⠠ and digit runs start with ⠼.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 10. Text Repeater                                                          */
/* ========================================================================== */

export function TextRepeaterTool() {
  const A = accentOf(9);
  const [text, setText] = useState("zyric ");
  const [count, setCount] = useState(10);
  const [sep, setSep] = useState<"newline" | "space" | "comma" | "none">("newline");
  const [numbered, setNumbered] = useState(false);
  const out = useMemo(() => {
    const j = sep === "newline" ? "\n" : sep === "space" ? " " : sep === "comma" ? ", " : "";
    return Array.from({ length: count }, (_, i) => (numbered ? `${i + 1}. ${text}` : text)).join(j);
  }, [text, count, sep, numbered]);
  const bytes = useMemo(() => new TextEncoder().encode(out).length, [out]);
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <BigStat label="Copies" value={count} accent={A} />
        <BigStat label="Characters" value={fmt(out.length)} accent="#7FC8FF" />
        <BigStat label="Payload size" value={bytes > 1024 ? `${fmt(bytes / 1024)} KB` : `${fmt(bytes)} B`} accent="#5EE39A" />
      </Grid>
      <Row>
        <div className="min-w-48 flex-1">
          <Slider label="Repeat count" value={count} onChange={setCount} min={1} max={999} accent={A} suffix="×" />
        </div>
        <Seg
          value={sep}
          onChange={setSep}
          accent={A}
          options={[
            { v: "newline" as const, label: "Lines" },
            { v: "space" as const, label: "Spaces" },
            { v: "comma" as const, label: "Commas" },
            { v: "none" as const, label: "Glued" },
          ]}
        />
        <Check label="Number each copy" checked={numbered} onChange={setNumbered} />
      </Row>
      <Area label="Text to repeat" value={text} onChange={setText} rows={2} mono={false} />
      <Out label={`output — ${count} copies`} text={out} rows={10} />
      <Note>999 × long text gets heavy for some chat apps — watch the payload stat before you paste-bomb a group chat.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 11. Whitespace Cleaner                                                     */
/* ========================================================================== */

type CleanOpts = { trim: boolean; tabs: boolean; collapse: boolean; dropAll: boolean; squeeze: boolean };

function cleanWhitespace(src: string, o: CleanOpts): { text: string; fixes: { label: string; count: number }[] } {
  const fixes: { label: string; count: number }[] = [];
  let lines = src.split("\n");
  if (o.tabs) {
    let n = 0;
    lines = lines.map((l) => {
      const t = l.replace(/\t/g, "  ");
      if (t !== l) n++;
      return t;
    });
    if (n) fixes.push({ label: "lines with tabs → 2 spaces", count: n });
  }
  if (o.trim) {
    let n = 0;
    lines = lines.map((l) => {
      const t = l.trim();
      if (t !== l) n++;
      return t;
    });
    if (n) fixes.push({ label: "lines trimmed at edges", count: n });
  }
  if (o.collapse) {
    let n = 0;
    lines = lines.map((l) => {
      const c = l.replace(/ {2,}/g, " ");
      if (c !== l) n++;
      return c;
    });
    if (n) fixes.push({ label: "double spaces collapsed", count: n });
  }
  const blanks = lines.filter((l) => l.trim() === "").length;
  if (o.dropAll) {
    lines = lines.filter((l) => l.trim() !== "");
    if (blanks) fixes.push({ label: "empty lines removed", count: blanks });
  } else if (o.squeeze) {
    const kept: string[] = [];
    let n = 0;
    let prevBlank = false;
    for (const l of lines) {
      const b = l.trim() === "";
      if (b && prevBlank) {
        n++;
        continue;
      }
      kept.push(l);
      prevBlank = b;
    }
    while (kept.length && kept[0].trim() === "") {
      kept.shift();
      n++;
    }
    while (kept.length && kept[kept.length - 1].trim() === "") {
      kept.pop();
      n++;
    }
    lines = kept;
    if (n) fixes.push({ label: "extra blank lines squeezed", count: n });
  }
  return { text: lines.join("\n"), fixes };
}

export function WhitespaceCleanerTool() {
  const A = accentOf(10);
  const [input, setInput] = useState("  messy line one   \n\tline two has tabs\t\n\n\n   spaced   out  \nlast line   ");
  const [opts, setOpts] = useState<CleanOpts>({ trim: true, tabs: true, collapse: true, dropAll: false, squeeze: true });
  const setOpt = (k: keyof CleanOpts) => (v: boolean) => setOpts((o) => ({ ...o, [k]: v }));
  const result = useMemo(() => cleanWhitespace(input, opts), [input, opts]);
  const totalLines = input.split("\n").length;
  const fixed = result.fixes.reduce((a, f) => a + f.count, 0);
  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Area label="Messy paste" value={input} onChange={setInput} rows={9} />
            <Out label="clean output" text={result.text} rows={6} />
          </div>
        }
        right={
          <div className="space-y-3">
            <Panel title="fix report" accent={A} right={<Tag accent={A}>{result.fixes.length} kinds of mess</Tag>}>
              {result.fixes.length === 0 ? (
                <p className="py-2 text-sm text-zinc-500">✓ Already clean — nothing to fix.</p>
              ) : (
                <>
                  {result.fixes.map((f) => (
                    <KV key={f.label} k={f.label} v={`fixed ${f.count}`} accent={A} />
                  ))}
                  <div className="pt-3">
                    <Meter value={fixed} max={Math.max(1, totalLines)} accent={A} label="lines affected" right={`${Math.min(fixed, totalLines)}/${totalLines}`} />
                  </div>
                </>
              )}
            </Panel>
            <Panel title="fixes to apply" accent="#52525b">
              <div className="flex flex-col gap-2">
                <Check label="Trim each line" checked={opts.trim} onChange={setOpt("trim")} />
                <Check label="Tabs → 2 spaces" checked={opts.tabs} onChange={setOpt("tabs")} />
                <Check label="Collapse double spaces" checked={opts.collapse} onChange={setOpt("collapse")} />
                <Check label="Remove ALL empty lines" checked={opts.dropAll} onChange={setOpt("dropAll")} />
                <Check label="Squeeze blank runs to one" checked={opts.squeeze} onChange={setOpt("squeeze")} />
              </div>
            </Panel>
          </div>
        }
      />
      <Note>Fixes apply top-to-bottom: tabs first, then trims, then spacing, then blank-line handling. Paste code snippets too — indentation between lines survives.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 12. Leet Speak Translator                                                  */
/* ========================================================================== */

export function LeetSpeakTool() {
  const A = accentOf(11);
  const [level, setLevel] = useState<"light" | "mad" | "uber">("mad");
  const [text, setText] = useState("hack the planet");
  const out = useMemo(() => remap(text.toLowerCase(), LEET_MAPS[level]), [text, level]);
  const map = LEET_MAPS[level];
  return (
    <div className="space-y-4">
      <Panel title="1337 preview" accent={A} right={<Tag accent={A}>{level}</Tag>}>
        <p className="min-w-0 break-words py-4 text-center font-mono text-3xl font-black" style={{ color: A }}>
          {out || "—"}
        </p>
      </Panel>
      <Seg
        value={level}
        onChange={setLevel}
        accent={A}
        options={[
          { v: "light" as const, label: "Light" },
          { v: "mad" as const, label: "Mad" },
          { v: "uber" as const, label: "Über" },
        ]}
      />
      <Split
        left={<Area label="Plain text" value={text} onChange={setText} rows={5} mono={false} />}
        right={<Out label="leet text" text={out} rows={5} />}
      />
      <Panel title={`active substitutions — ${level}`} accent={A}>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(map).map(([k, v]) => (
            <Tag key={k} accent={A}>{`${k}→${v}`}</Tag>
          ))}
        </div>
      </Panel>
      <Note>Light swaps vowels only. Mad adds consonants. Über goes full multi-character gibberish — unreadable to boomers since 1989.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 13. Invisible Character                                                    */
/* ========================================================================== */

const GHOSTS: { name: string; cp: string; hex: string; use: string; tag: string }[] = [
  { name: "Zero-Width Space", cp: "\u200B", hex: "U+200B", use: "invisible separator inside names and bios", tag: "zwsp" },
  { name: "Zero-Width Non-Joiner", cp: "\u200C", hex: "U+200C", use: "stops letters and emoji from gluing together", tag: "anti-join" },
  { name: "Zero-Width Joiner", cp: "\u200D", hex: "U+200D", use: "glues emoji into combos like 👨‍👩‍👧", tag: "emoji glue" },
  { name: "Word Joiner", cp: "\u2060", hex: "U+2060", use: "invisible glue that prevents line breaks", tag: "no-break" },
  { name: "Braille Blank", cp: "\u2800", hex: "U+2800", use: "THE blank-name trick — survives fields that strip zero-width chars", tag: "free fire" },
  { name: "En Quad", cp: "\u2000", hex: "U+2000", use: "wide invisible space for stretching out text", tag: "wide gap" },
];

export function InvisibleCharTool() {
  const A = accentOf(0);
  const [pick, setPick] = useState<"200B" | "200C" | "200D" | "2060" | "2800" | "2000">("2800");
  const [copies, setCopies] = useState(10);
  const chosen = GHOSTS.find((g) => g.hex === `U+${pick}`) ?? GHOSTS[0];
  const out = chosen.cp.repeat(copies);
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        {GHOSTS.map((g) => (
          <Panel key={g.hex} title={g.hex} accent={g.hex === `U+${pick}` ? A : "#52525b"} right={<CopyButton text={g.cp} label="Copy 1" />}>
            <p className="font-mono text-sm text-zinc-400">[&nbsp;{g.cp}&nbsp;]</p>
            <p className="mt-1.5 text-sm font-bold text-zinc-100">{g.name}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{g.use}</p>
            <div className="mt-2"><Tag accent={g.hex === `U+${pick}` ? A : "#52525b"}>{g.tag}</Tag></div>
          </Panel>
        ))}
      </Grid>
      <Split
        left={
          <Panel title="generate a run of invisible characters" accent={A}>
            <div className="space-y-3">
              <Seg
                value={pick}
                onChange={setPick}
                accent={A}
                options={[
                  { v: "2800" as const, label: "⣿ Braille" },
                  { v: "200B" as const, label: "ZWSP" },
                  { v: "200C" as const, label: "ZWNJ" },
                  { v: "200D" as const, label: "ZWJ" },
                  { v: "2060" as const, label: "WJ" },
                  { v: "2000" as const, label: "Quad" },
                ]}
              />
              <Slider label="How many" value={copies} onChange={setCopies} min={1} max={100} accent={A} suffix="×" />
              <Out label={`${copies} × ${chosen.name} (looks empty — it isn't)`} text={out} />
            </div>
          </Panel>
        }
        right={
          <Panel title="how the blank-name trick works" accent="#FF9DE2">
            <div className="space-y-2 text-[11px] leading-relaxed text-zinc-400">
              <p><strong className="text-zinc-200">Instagram / TikTok display name:</strong> the name field rejects normal spaces but accepts U+2800 — paste one between words, or a run of them alone for a fully blank name.</p>
              <p><strong className="text-zinc-200">Free Fire / BGMI nickname:</strong> rename screens strip zero-width characters but let the braille blank through. Copy it from the ⣿ card above.</p>
              <p><strong className="text-zinc-200">Discord / WhatsApp status:</strong> a single U+2800 or ZWSP posts an apparently empty message.</p>
              <p><strong className="text-zinc-200">Mention-bait & footers:</strong> hide invisible separators between words so scrapers and casual copy-pasters get wrecked.</p>
              <p className="text-zinc-600">Nothing here is sent anywhere — the characters are generated in your browser and land on your clipboard.</p>
            </div>
          </Panel>
        }
      />
      <Note>Tip: paste into the target field with a long-press → Paste. If an app strips it, switch to Braille Blank — it is technically a braille pattern, not a space.</Note>
    </div>
  );
}

/* ========================================================================== */
/* 14. Gothic Font Generator                                                  */
/* ========================================================================== */

const GOTHIC_STYLES: { name: string; map: CharMap; blurb: string }[] = [
  { name: "Fraktur", map: F_FRAKTUR, blurb: "𝔗𝔥𝔢 old-german blackletter — instant guild energy" },
  { name: "Bold Fraktur", map: F_FRAKTUR_BOLD, blurb: "Heavier blackletter, holds up at small sizes" },
  { name: "Double-Struck", map: F_DOUBLE_STRUCK, blurb: "𝕆𝕦𝕥𝕝𝕚𝕟𝕖 math style — ℝ𝕖𝕒𝕝 sets use it natively" },
  { name: "Bold Script", map: F_SCRIPT_BOLD, blurb: "Fancy calligraphy weight for signatures" },
];

export function FrakturTool() {
  const A = accentOf(1);
  const [text, setText] = useState("gothic era");
  return (
    <div className="space-y-4">
      <Area label="Text to gothicize" value={text} onChange={setText} rows={2} mono={false} placeholder="Type anything…" />
      <div className="space-y-3">
        {GOTHIC_STYLES.map((s) => {
          const out = remap(text, s.map);
          return (
            <Panel key={s.name} title={s.name} accent={A} right={<CopyButton text={out} />}>
              <p className="min-w-0 break-words text-3xl leading-relaxed text-zinc-100">{out || "—"}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 font-mono text-[11px] text-zinc-500">{remap("AaGgZz 09", s.map)}</p>
                <p className="text-[10px] text-zinc-600">{s.blurb}</p>
              </div>
            </Panel>
          );
        })}
      </div>
      <Note>
        Fraktur styles carry no digits (numbers stay regular); double-struck includes its own 𝟘-𝟡 and the famous
        ℝ, ℤ, ℕ single-letter sets. All variants paste as plain Unicode text.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* Meta registry                                                              */
/* ========================================================================== */

export const textPlusMeta: ToolMeta[] = [
  {
    id: "remove-line-breaks",
    name: "Line Break Remover",
    description: "Unwrap PDF and email line breaks into clean flowing text in one click — no more manual joining.",
    category: "writing",
    icon: UnfoldVertical,
    keywords: "remove line breaks, join lines, unwrap text, pdf paste fix, newline remover, clean copied text, paragraph fixer",
    badge: "new",
    component: LineBreakRemoverTool,
  },
  {
    id: "bold-unicode",
    name: "Bold Text Generator",
    description: "Turn any text into bold unicode fonts that paste straight into Instagram, WhatsApp and X bios.",
    category: "writing",
    icon: Bold,
    keywords: "bold text generator, unicode bold, bold font for instagram, whatsapp bold text, bold bio font, fancy bold letters",
    badge: "new",
    component: BoldTextTool,
  },
  {
    id: "small-caps",
    name: "Tiny & Small Text",
    description: "Shrink your words with superscript, subscript and small-caps unicode built for bios and usernames.",
    category: "writing",
    icon: ALargeSmall,
    keywords: "small text generator, tiny text, superscript text, subscript letters, small caps font, instagram small bio text",
    badge: "new",
    component: SmallTextTool,
  },
  {
    id: "strike-text",
    name: "Strikethrough Studio",
    description: "Cross out, slash or underline any text with combining characters that work in every app.",
    category: "writing",
    icon: Strikethrough,
    keywords: "strikethrough text, strike through generator, crossed out text, underline unicode, slash text, discord strikethrough",
    badge: "new",
    component: StrikeStudioTool,
  },
  {
    id: "upside-down",
    name: "Upside Down Text",
    description: "Flip text upside down and reversed for usernames, bios and perfectly confusing chat messages.",
    category: "writing",
    icon: FlipVertical2,
    keywords: "upside down text, flip text generator, reverse text, flipped letters, backwards text, rotate username",
    badge: "new",
    component: UpsideDownTool,
  },
  {
    id: "vaporwave",
    name: "Vaporwave Text",
    description: "Convert text to fullwidth ａｅｓｔｈｅｔｉｃ letters with adjustable spacing between glyphs.",
    category: "writing",
    icon: Rainbow,
    keywords: "vaporwave text, fullwidth text, aesthetic font, a e s t h e t i c generator, wide text, fancy bio font",
    badge: "new",
    component: VaporwaveTool,
  },
  {
    id: "zalgo",
    name: "Zalgo Glitch Text",
    description: "Summon cursed glitch text with separate above, middle and below chaos dials you control.",
    category: "writing",
    icon: Skull,
    keywords: "zalgo text, glitch text generator, cursed text, corrupted font, creepy text, zalgo destroyer, h̷e̷l̷l̷o̷",
    badge: "new",
    component: ZalgoTool,
  },
  {
    id: "text-binary",
    name: "Text ↔ Binary",
    description: "Convert text to clean 8-bit binary groups and decode binary back — instantly, offline.",
    category: "writing",
    icon: Binary,
    keywords: "text to binary, binary translator, binary to text, 8-bit converter, ascii binary, binary code generator",
    badge: "new",
    component: TextBinaryTool,
  },
  {
    id: "braille",
    name: "Braille Translator",
    description: "Translate English into braille dot patterns with a per-letter dot breakdown you can actually learn from.",
    category: "writing",
    icon: Grip,
    keywords: "braille translator, english to braille, braille alphabet, braille dots, braille converter, braille generator",
    badge: "new",
    component: BrailleTool,
  },
  {
    id: "text-multiplier",
    name: "Text Repeater",
    description: "Repeat any text up to 999 times with separators and numbering, plus live size stats.",
    category: "writing",
    icon: Repeat,
    keywords: "text repeater, repeat text 100 times, spam text generator, copy paste repeater, message bomber, repeated words",
    badge: "new",
    component: TextRepeaterTool,
  },
  {
    id: "whitespace-cleaner",
    name: "Whitespace Cleaner",
    description: "Fix messy pastes — trims lines, kills double spaces and squeezes blank runs, with a fix report.",
    category: "writing",
    icon: Eraser,
    keywords: "whitespace remover, trim lines online, remove double spaces, delete empty lines, tab to space, clean pasted text",
    badge: "new",
    component: WhitespaceCleanerTool,
  },
  {
    id: "leet-speak",
    name: "Leet Speak Translator",
    description: "Translate text into 1337 speak with three escalating hacker intensity levels.",
    category: "writing",
    icon: Gamepad2,
    keywords: "leet speak translator, 1337 converter, hacker text, l33t generator, gamer tag font, leetspeak maker",
    badge: "new",
    component: LeetSpeakTool,
  },
  {
    id: "invisible-char",
    name: "Invisible Character",
    description: "Copy zero-width and blank characters that survive Instagram and Free Fire name fields.",
    category: "writing",
    icon: EyeOff,
    keywords: "invisible character, blank space copy paste, invisible name free fire, empty instagram name, zero width space, blank text, u+2800",
    badge: "new",
    component: InvisibleCharTool,
  },
  {
    id: "fraktur",
    name: "Gothic Font Generator",
    description: "Convert text to fraktur, double-struck and bold script gothic fonts for names and bios.",
    category: "writing",
    icon: Castle,
    keywords: "gothic font generator, fraktur text, blackletter font, old english text, double struck font, fancy gothic letters",
    badge: "new",
    component: FrakturTool,
  },
];
