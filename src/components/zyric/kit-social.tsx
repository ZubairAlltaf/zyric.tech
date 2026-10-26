"use client";

/* ==========================================================================
   KIT: SOCIAL MEDIA STUDIO — 9 platform-native machines.
   Bio phone frames, canvas resizers, fold meters, grapheme-true counters.
   Every tool: own layout, own accent, own interaction model.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  AtSign,
  Crop,
  Download,
  Hash,
  Linkedin,
  MonitorPlay,
  Music2,
  Plus,
  Podcast,
  Repeat,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import JSZip from "jszip";
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
} from "./kit";
import type { ToolMeta } from "./tool-types";

/* ------------------------------ Shared helpers ---------------------------- */

type SegmenterLike = { segment(input: string): Iterable<{ segment: string }> };
let cachedSegmenter: SegmenterLike | null | undefined;

function getSegmenter(): SegmenterLike | null {
  if (cachedSegmenter !== undefined) return cachedSegmenter;
  cachedSegmenter = null;
  try {
    const Ctor = (Intl as unknown as {
      Segmenter?: new (locale?: string, opts?: { granularity: "grapheme" }) => SegmenterLike;
    }).Segmenter;
    if (typeof Ctor === "function") cachedSegmenter = new Ctor(undefined, { granularity: "grapheme" });
  } catch {
    cachedSegmenter = null;
  }
  return cachedSegmenter;
}

/** Grapheme-true length: 👨‍👩‍👧 = 1, é = 1. Intl.Segmenter when present, code points otherwise. */
function graphemes(s: string): number {
  const seg = getSegmenter();
  if (!seg) return [...s].length;
  const it = seg.segment(s)[Symbol.iterator]();
  let n = 0;
  while (!it.next().done) n++;
  return n;
}

function eachG(s: string): string[] {
  const seg = getSegmenter();
  if (!seg) return [...s];
  return Array.from(seg.segment(s), (d) => d.segment);
}

function sliceG(s: string, n: number): string {
  return eachG(s).slice(0, n).join("");
}

/* Unicode letterforms — the only inline emphasis that survives IG/LinkedIn post boxes. */
type UniStyle = "plain" | "bold" | "script" | "mono" | "italic" | "bolditalic";
const UNI_RANGES: Record<Exclude<UniStyle, "plain">, { up: number; lo: number; dg?: number }> = {
  bold: { up: 0x1d5d4, lo: 0x1d5ee, dg: 0x1d7ce }, // sans-serif bold
  script: { up: 0x1d4d0, lo: 0x1d4ea, dg: 0x1d7ce }, // bold script
  mono: { up: 0x1d670, lo: 0x1d68a, dg: 0x1d7f6 }, // monospace
  italic: { up: 0x1d434, lo: 0x1d44e }, // serif italic (h → ℎ U+210E)
  bolditalic: { up: 0x1d468, lo: 0x1d482, dg: 0x1d7ce },
};

function uniStyle(s: string, style: UniStyle): string {
  if (style === "plain") return s;
  const r = UNI_RANGES[style];
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    if (c >= 65 && c <= 90) out += String.fromCodePoint(r.up + c - 65);
    else if (c >= 97 && c <= 122) out += style === "italic" && ch === "h" ? "\u210e" : String.fromCodePoint(r.lo + c - 97);
    else if (r.dg !== undefined && c >= 48 && c <= 57) out += String.fromCodePoint(r.dg + c - 48);
    else out += ch;
  }
  return out;
}

const INVIS = "\u2800"; // blank braille cell — the classic IG invisible spacer
const URL_RE = /https?:\/\/\S+/g;
const TAG_RE = /#[^\s#@]+/g;
const EMOJI_RE = /\p{Extended_Pictographic}|\u20e3/u;
const ROSE = "#FF8A7A";

const INPUT_CLS =
  "w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600";

const CLAMP2: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

/** Smart trim at a word boundary, reserving one char for the ellipsis. */
function trimTo(s: string, max: number, count: (t: string) => number): string {
  if (count(s) <= max) return s;
  let cur = "";
  for (const w of s.split(/\s+/)) {
    if (!w) continue;
    const cand = cur ? `${cur} ${w}` : w;
    if (count(cand) + 1 > max) break;
    cur = cand;
  }
  if (!cur) {
    for (const g of eachG(s)) {
      if (count(cur + g) + 1 > max) break;
      cur += g;
    }
  }
  return `${cur}\u2026`;
}

/* ------------------------------ 1. Instagram Bio Studio -------------------- */

type BioLine = { id: number; text: string; style: UniStyle; spacer: boolean };
let bioUid = 0;
const BIO_OPTS = [
  { v: "plain", label: "Aa" },
  { v: "bold", label: "Bold" },
  { v: "script", label: "Script" },
  { v: "mono", label: "Mono" },
] as const;

function PhoneFrame({ name, username, bio, accent }: { name: string; username: string; bio: string; accent: string }) {
  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[2.2rem] border border-zinc-700 bg-zinc-900 p-2 shadow-xl shadow-black/50">
      <div className="rounded-[1.8rem] border border-zinc-800 bg-black px-4 pb-5 pt-3">
        <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500">
          <span>9:41</span>
          <span>zyric · 5G · 84%</span>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <div
            className="h-16 w-16 rounded-full"
            style={{ background: `conic-gradient(from 180deg, ${accent}, #FF9DE2, #7FC8FF, ${accent})` }}
          />
          <p className="mt-2 text-sm font-bold text-zinc-100">{name || "Your Name"}</p>
          <p className="text-[10px] text-zinc-500">{username ? `@${username}` : "@username"}</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 text-center">
          {(
            [
              ["128", "posts"],
              ["4,208", "followers"],
              ["312", "following"],
            ] as const
          ).map(([n, l]) => (
            <div key={l}>
              <p className="text-xs font-bold text-zinc-100">{n}</p>
              <p className="text-[9px] text-zinc-500">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 min-h-[3.5rem] whitespace-pre-wrap break-words text-[12px] leading-relaxed text-zinc-300">
          {bio || "Your bio renders here, styled line by line."}
        </p>
        <div className="mt-3 flex gap-1.5">
          <span className="flex-1 rounded-md py-1.5 text-center text-[10px] font-bold text-black" style={{ background: accent }}>
            Follow
          </span>
          <span className="flex-1 rounded-md border border-zinc-700 py-1.5 text-center text-[10px] font-bold text-zinc-300">
            Message
          </span>
        </div>
      </div>
    </div>
  );
}

export function IgBioStudio() {
  const A = accentOf(0);
  const [lines, setLines] = useState<BioLine[]>([
    { id: ++bioUid, text: "Building tiny tools at zyric.tech", style: "bold", spacer: false },
    { id: ++bioUid, text: "DMs open for collabs", style: "script", spacer: false },
  ]);
  const [name, setName] = useState("Zubair");
  const [username, setUsername] = useState("zubair.builds");

  const final = lines
    .flatMap((l) => [uniStyle(l.text, l.style), ...(l.spacer ? [INVIS] : [])])
    .join("\n");
  const count = graphemes(final);
  const over = count > 150;

  const patch = (id: number, p: Partial<BioLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  return (
    <Split
      left={<PhoneFrame name={name} username={username} bio={final} accent={A} />}
      right={
        <div className="space-y-3">
          <Grid cols={2}>
            <Field label="name" value={name} onChange={setName} placeholder="Your Name" />
            <Field label="username" value={username} onChange={setUsername} placeholder="handle" />
          </Grid>
          <Meter
            value={Math.min(count, 150)}
            max={150}
            accent={over ? ROSE : A}
            label="bio length · grapheme-true"
            right={`${count}/150`}
          />
          {over ? (
            <p className="text-[11px] font-bold text-rose-400">{count - 150} characters over — Instagram cuts the tail.</p>
          ) : null}
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={l.id} className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-kicker" style={{ color: A }}>{`line ${i + 1}`}</span>
                  <button
                    type="button"
                    aria-label="remove line"
                    onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                    className="text-zinc-600 transition-colors hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={l.text}
                  onChange={(e) => patch(l.id, { text: e.target.value })}
                  placeholder="this bio line…"
                  className={INPUT_CLS}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Seg value={l.style} onChange={(v) => patch(l.id, { style: v })} options={BIO_OPTS} accent={A} />
                  <Check label="invisible gap after" checked={l.spacer} onChange={(v) => patch(l.id, { spacer: v })} />
                </div>
              </div>
            ))}
          </div>
          <Row>
            <Btn
              accent={A}
              onClick={() => setLines((ls) => [...ls, { id: ++bioUid, text: "", style: "plain", spacer: false }])}
            >
              <Plus className="h-3.5 w-3.5" /> add line
            </Btn>
          </Row>
          <Out text={final} label="final bio — copy into Instagram" />
          <Note>
            U+2800 (a blank braille cell) fakes empty lines — Instagram strips plain blank ones. Styling rides on unicode
            letterforms, and the counter counts graphemes, so 👨‍👩‍👧 = 1 character, not 8.
          </Note>
        </div>
      }
    />
  );
}

/* ------------------------------ 2. One Image → Every Platform -------------- */

type FitMode = "crop" | "blur";
type Preset = { name: string; w: number; h: number };
const PRESETS: readonly Preset[] = [
  { name: "IG post", w: 1080, h: 1080 },
  { name: "IG portrait", w: 1080, h: 1350 },
  { name: "IG story", w: 1080, h: 1920 },
  { name: "X post", w: 1600, h: 900 },
  { name: "X header", w: 1500, h: 500 },
  { name: "YT banner", w: 2560, h: 1440 },
  { name: "YT thumbnail", w: 1280, h: 720 },
  { name: "LinkedIn banner", w: 1584, h: 396 },
  { name: "TikTok", w: 1080, h: 1920 },
];
const FIT_OPTS = [
  { v: "crop", label: "Crop center" },
  { v: "blur", label: "Blur pad" },
] as const;

function loadImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      resolve(im);
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    im.src = url;
  });
}

function renderInto(cv: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number, fit: FitMode) {
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  if (fit === "blur") {
    const s = Math.max(w / img.width, h / img.height);
    const bw = Math.ceil(w / s) + 2;
    const bh = Math.ceil(h / s) + 2;
    ctx.save();
    ctx.filter = `blur(${Math.min(60, Math.max(8, Math.round(w * 0.045)))}px)`;
    ctx.drawImage(img, (img.width - bw) / 2, (img.height - bh) / 2, bw, bh, 0, 0, w, h);
    ctx.restore();
    const f = Math.min(w / img.width, h / img.height);
    const fw = img.width * f;
    const fh = img.height * f;
    ctx.drawImage(img, (w - fw) / 2, (h - fh) / 2, fw, fh);
  } else {
    const s = Math.max(w / img.width, h / img.height);
    const sw = w / s;
    const sh = h / s;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
  }
}

function toBlobPng(cv: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    cv.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), "image/png");
  });
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function ResizerCard({ p, img, fit, accent, base }: { p: Preset; img: HTMLImageElement; fit: FitMode; accent: string; base: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const w = 208;
    const h = Math.max(1, Math.round((w * p.h) / p.w));
    renderInto(cv, img, w, h, fit);
  }, [img, fit, p]);
  const grab = async () => {
    const cv = document.createElement("canvas");
    renderInto(cv, img, p.w, p.h, fit);
    downloadBlob(await toBlobPng(cv), `${base}-${p.name.replace(/\s+/g, "-")}-${p.w}x${p.h}.png`);
  };
  return (
    <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
      <canvas ref={ref} className="mx-auto block h-auto w-full max-w-[208px] rounded border border-zinc-800 bg-zinc-950" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-zinc-200">{p.name}</p>
          <p className="font-mono text-[10px] text-zinc-500">{`${p.w}×${p.h}`}</p>
        </div>
        <Btn variant="ghost" accent={accent} onClick={() => void grab()} className="shrink-0">
          <Download className="h-3.5 w-3.5" />
        </Btn>
      </div>
    </div>
  );
}

export function SocialResizer() {
  const A = accentOf(1);
  const [img, setImg] = useState<{ el: HTMLImageElement; name: string } | null>(null);
  const [err, setErr] = useState("");
  const [fit, setFit] = useState<FitMode>("crop");
  const [busy, setBusy] = useState(false);
  const base = img ? img.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-") || "image" : "image";

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("That file isn't an image — JPG, PNG or WebP please.");
      return;
    }
    setErr("");
    loadImg(f)
      .then((el) => setImg({ el, name: f.name }))
      .catch(() => setErr("Could not decode that image."));
  };

  const zipAll = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      for (const p of PRESETS) {
        const cv = document.createElement("canvas");
        renderInto(cv, img.el, p.w, p.h, fit);
        zip.file(`${base}-${p.name.replace(/\s+/g, "-")}-${p.w}x${p.h}.png`, await toBlobPng(cv));
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), `${base}-every-platform.zip`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-6 text-center transition-colors hover:border-zinc-500">
        <Upload className="h-4 w-4 shrink-0" style={{ color: A }} />
        <span className="text-xs text-zinc-400">
          {img ? `Loaded: ${img.name} — pick another to swap` : "Upload one image — get every platform size out the other side"}
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {err ? <p className="text-[11px] font-bold text-rose-400">{err}</p> : null}
      <Row>
        <Seg value={fit} onChange={setFit} options={FIT_OPTS} accent={A} />
        {img ? (
          <>
            <KV k="source" v={`${img.el.naturalWidth}×${img.el.naturalHeight}`} />
            <Btn accent={A} onClick={() => void zipAll()} disabled={busy}>
              <Download className="h-3.5 w-3.5" /> {busy ? "Zipping 9 files…" : "ZIP all 9"}
            </Btn>
          </>
        ) : null}
      </Row>
      <Grid cols={3}>
        {PRESETS.map((p) =>
          img ? (
            <ResizerCard key={p.name} p={p} img={img.el} fit={fit} accent={A} base={base} />
          ) : (
            <div key={p.name} className="rounded-lg border border-dashed border-zinc-800 p-2">
              <div className="flex aspect-[4/3] items-center justify-center rounded bg-zinc-950/60 font-mono text-[10px] text-zinc-600">
                {`${p.w}×${p.h}`}
              </div>
              <p className="mt-2 text-center text-xs font-bold text-zinc-500">{p.name}</p>
            </div>
          )
        )}
      </Grid>
      <Note>
        Crop center keeps the middle of your frame; blur pad fits the whole image and fills the letterbox with a blurred copy —
        the trick story editors use. Everything renders in-canvas at full resolution; nothing leaves your browser.
      </Note>
    </div>
  );
}

/* ------------------------------ 3. YouTube Studio Checker ------------------ */

let pxCtx: CanvasRenderingContext2D | null | undefined;
function textPx(s: string): number {
  if (!s) return 0;
  if (typeof document === "undefined") return Math.round(s.length * 10.4);
  if (pxCtx === undefined) pxCtx = document.createElement("canvas").getContext("2d");
  if (!pxCtx) return Math.round(s.length * 10.4);
  pxCtx.font = '500 20px "Roboto", "Segoe UI", Arial, sans-serif';
  return Math.round(pxCtx.measureText(s).width);
}

export function YtStudioChecker() {
  const A = accentOf(2);
  const [title, setTitle] = useState("I rebuilt my studio for under $300 — full tour");
  const [desc, setDesc] = useState("Gear list, timestamps and the wallpaper are below.\n\nIn this video we…");
  const [tagsRaw, setTagsRaw] = useState("tech, studio tour, budget setup, desk setup, content creator");

  const titleG = graphemes(title);
  const px = textPx(title);
  const descG = graphemes(desc);
  const fold = sliceG(desc.trim(), 150);
  const tags = useMemo(() => tagsRaw.split(",").map((t) => t.trim()).filter(Boolean), [tagsRaw]);
  const tagsLen = tags.join(",").length;

  return (
    <div className="space-y-4">
      <Grid cols={4}>
        <BigStat label="title chars" value={`${titleG}/100`} accent={titleG > 100 ? ROSE : A} />
        <BigStat label="title pixel width" value={px} unit="px" accent={px > 700 ? ROSE : "#7FC8FF"} hint="results column ≈ 640px" />
        <BigStat label="description chars" value={`${descG}/5000`} accent={descG > 5000 ? ROSE : "#5EE39A"} />
        <BigStat label="tag budget" value={`${tagsLen}/500`} accent={tagsLen > 500 ? ROSE : "#B9A6FF"} />
      </Grid>

      <Panel
        title="title"
        accent={A}
        right={<Tag accent={titleG > 60 ? ROSE : A}>{titleG > 60 ? "may truncate on mobile" : "safe"}</Tag>}
      >
        <Field label="video title" value={title} onChange={setTitle} />
        <div className="mt-3">
          <Meter value={Math.min(px, 720)} max={720} accent={px > 700 ? ROSE : A} label="pixel width @ 20px semibold" right={`${px}px`} />
        </div>
        <Note>YouTube wraps titles after ~2 lines on desktop and clips hard on mobile — the first ~60 characters carry the click.</Note>
      </Panel>

      <Panel title="description" accent={A} right={<Tag accent={descG > 5000 ? ROSE : A}>{`${descG}/5000`}</Tag>}>
        <Area label="description" value={desc} onChange={setDesc} rows={5} />
        <p className="mono-kicker mt-3 text-zinc-500">above the fold — first 150 characters (before “…more”)</p>
        <div className="mt-1 rounded border border-zinc-800 bg-black/40 p-2.5 text-xs leading-relaxed">
          <span className="text-zinc-100">{fold || "—"}</span>
          {descG > 150 ? <span className="text-zinc-600"> …more</span> : null}
        </div>
        <Note>Links and calls-to-action buried past the fold are invisible on mobile — front-load them.</Note>
      </Panel>

      <Panel title="tags" accent={A} right={<Tag accent={tagsLen > 500 ? ROSE : A}>{`${tagsLen}/500`}</Tag>}>
        <Area label="comma-separated tags" value={tagsRaw} onChange={setTagsRaw} rows={2} placeholder="one keyword, next keyword, …" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <Tag key={`${t}-${i}`} accent={t.length > 100 ? ROSE : A}>
              {t.length > 24 ? `${t.slice(0, 24)}…` : t} · {t.length}
            </Tag>
          ))}
        </div>
        <div className="mt-3">
          <Meter value={Math.min(tagsLen, 500)} max={500} accent={tagsLen > 500 ? ROSE : A} label="total incl. commas" right={`${tagsLen}/500`} />
        </div>
        <Note>Commas count toward the 500-character budget; duplicates are ignored by YouTube but still eat budget.</Note>
      </Panel>

      <Panel title="search result preview" accent={A}>
        <div className="flex gap-3">
          <div className="relative aspect-video w-2/5 max-w-[168px] shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-zinc-800 to-zinc-900">
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <Youtube className="h-6 w-6" />
            </div>
            <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 font-mono text-[9px] text-zinc-300">12:34</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-zinc-100" style={CLAMP2}>
              {title || "Your video title"}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Your Channel · 24K views · 2 hours ago</p>
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500" style={CLAMP2}>
              {fold || "Description preview pulls from the first line…"}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------ 4. TikTok Caption Formatter ---------------- */

const TT_VIEW_OPTS = [
  { v: "posted", label: "Caption view" },
  { v: "search", label: "Search · collapsed" },
] as const;

export function TikTokFormatter() {
  const A = accentOf(3);
  const [text, setText] = useState(
    "POV: you automate the boring half of content day 👀\n\n#creator #zyric #techtok #automation"
  );
  const [view, setView] = useState<"posted" | "search">("posted");
  const [user, setUser] = useState("zubair.builds");

  const total = graphemes(text);
  const tags = text.match(TAG_RE) ?? [];
  const bodyG = graphemes(text.replace(TAG_RE, " "));
  const emoji = eachG(text).filter((g) => EMOJI_RE.test(g)).length;
  const over = total > 2200;
  const renderText = view === "search" ? text.replace(/\n+/g, " ") : text;

  return (
    <div className="space-y-4">
      <Grid cols={4}>
        <BigStat label="characters · graphemes" value={`${total}/2200`} accent={over ? ROSE : A} />
        <BigStat label="hashtags" value={tags.length} accent="#FF9DE2" hint="each # + word costs full chars" />
        <BigStat label="emoji" value={emoji} accent="#7FC8FF" hint="1 grapheme each" />
        <BigStat
          label="headroom"
          value={Math.max(0, 2200 - total)}
          accent="#5EE39A"
          hint={over ? `${total - 2200} over — cut tags first` : "characters left"}
        />
      </Grid>
      <Seg value={view} onChange={setView} options={TT_VIEW_OPTS} accent={A} />
      <Split
        left={
          <div className="space-y-3">
            <Area label="caption" value={text} onChange={setText} rows={7} mono={false} />
            <Field label="creator handle" value={user} onChange={setUser} placeholder="handle" />
            <Meter value={Math.min(bodyG, 2200)} max={2200} accent={A} label="caption body" right={`${bodyG}`} />
            <Meter value={Math.min(total - bodyG, 2200)} max={2200} accent="#FF9DE2" label="hashtags inline" right={`${total - bodyG}`} />
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 8).map((t, i) => (
                <Tag key={`${t}-${i}`} accent={A}>
                  {t}
                </Tag>
              ))}
              {tags.length > 8 ? <Tag accent="#a1a1aa">+{tags.length - 8} more</Tag> : null}
            </div>
            <Note>
              TikTok counts graphemes, not code points — the 👨‍👩‍👧‍👦 family is one character. Body and hashtag meters share the
              same 2200 budget; when you're over, cutting tags costs the least reach.
            </Note>
          </div>
        }
        right={
          <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-xl shadow-black/40">
            <div className="relative h-24 bg-gradient-to-br from-fuchsia-600/30 via-zinc-900 to-sky-600/20" />
            <div className="-mt-8 px-3">
              <div className="h-14 w-14 rounded-full border-2 border-black bg-gradient-to-tr from-pink-500 to-sky-400" />
              <p className="mt-1.5 text-sm font-bold text-zinc-100">@{user || "you"}</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words px-3 text-[12.5px] leading-relaxed text-zinc-200">
              {renderText.split(/(#[^\s#@]+)/g).map((part, i) =>
                part.startsWith("#") ? (
                  <span key={i} style={{ color: A }}>
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
              {view === "search" && total > 100 ? <span className="text-zinc-500"> … more</span> : null}
            </p>
            <p className="mt-2 border-t border-zinc-900 px-3 py-2 font-mono text-[10px] text-zinc-500">
              ♫ original sound — {user || "you"}
            </p>
            <div className="flex justify-between px-3 pb-3 pt-1 text-center text-[9px] text-zinc-400">
              {(
                [
                  ["♥", "48.2K"],
                  ["💬", "1,204"],
                  ["↗", "9,801"],
                ] as const
              ).map(([ic, n]) => (
                <div key={ic}>
                  <p className="text-base leading-none">{ic}</p>
                  <p className="mt-1">{n}</p>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}

/* ------------------------------ 5. Thumbnail Tester ------------------------ */

function ThumbBox({ url, dur, className = "" }: { url: string | null; dur: string; className?: string }) {
  return (
    <div className={`relative aspect-video shrink-0 overflow-hidden rounded-md bg-zinc-800 ${className}`}>
      {url ? (
        <img src={url} alt="thumbnail preview" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] text-zinc-600">thumbnail</div>
      )}
      <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 font-mono text-[9px] text-zinc-100">
        {dur || "0:00"}
      </span>
    </div>
  );
}

export function ThumbTester() {
  const A = accentOf(4);
  const [url, setUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("I built a browser-only toolbox in 7 days");
  const [dur, setDur] = useState("12:34");
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const onFile = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    if (url) URL.revokeObjectURL(url);
    setUrl(URL.createObjectURL(f));
  };

  const titleG = graphemes(title);
  const durOk = /^\d{1,2}:[0-5]\d$/.test(dur) || /^\d{1,2}:[0-5]\d:[0-5]\d$/.test(dur);
  const budgets = [
    { k: "grid card · 2 lines", n: 70 },
    { k: "sidebar row · 2 lines", n: 76 },
    { k: "mobile row · 2 lines", n: 58 },
  ];

  return (
    <div className="space-y-4">
      <Row>
        <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md border border-dashed border-zinc-700 bg-zinc-950/50 px-3 py-2 transition-colors hover:border-zinc-500">
          <Upload className="h-4 w-4 shrink-0" style={{ color: A }} />
          <span className="text-[11px] text-zinc-400">{url ? "Swap thumbnail" : "Upload 1280×720 thumbnail"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <Field label="video title" value={title} onChange={setTitle} className="min-w-[200px] flex-1" />
        <Field label="duration" value={dur} onChange={setDur} placeholder="12:34" className="w-24" />
      </Row>

      <Panel title="the bench — same thumb, three surfaces" accent={A}>
        <Grid cols={3}>
          <div>
            <p className="mono-kicker mb-2 text-zinc-500">grid · home</p>
            <div className="w-full max-w-[270px]">
              <ThumbBox url={url} dur={dur} />
              <p className="mt-1.5 text-[13px] font-semibold leading-snug text-zinc-100" style={CLAMP2}>
                {title || "Your title"}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Your Channel · 24K views · 2h</p>
            </div>
          </div>
          <div>
            <p className="mono-kicker mb-2 text-zinc-500">sidebar · watch page</p>
            <div className="flex w-full max-w-[280px] gap-2">
              <ThumbBox url={url} dur={dur} className="w-[112px]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug text-zinc-100" style={CLAMP2}>
                  {title || "Your title"}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500">Your Channel</p>
                <p className="text-[10px] text-zinc-600">24K · 2h</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mono-kicker mb-2 text-zinc-500">mobile · search</p>
            <div className="flex w-full max-w-[240px] gap-1.5">
              <ThumbBox url={url} dur={dur} className="w-[96px]" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold leading-tight text-zinc-100" style={CLAMP2}>
                  {title || "Your title"}
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-600">24K · 2h</p>
              </div>
            </div>
          </div>
        </Grid>
      </Panel>

      <Panel title="survival checklist" accent={A}>
        {budgets.map((b) => (
          <KV
            key={b.k}
            k={b.k}
            v={<Tag accent={titleG > b.n ? ROSE : A}>{`${titleG}/${b.n} ${titleG > b.n ? "truncates" : "fits"}`}</Tag>}
          />
        ))}
        <KV k="duration format" v={<Tag accent={durOk ? A : ROSE}>{durOk ? "mm:ss ok" : "use m:ss"}</Tag>} />
        <KV k="file size" v="under 2 MB · 1280×720" />
        <Note>
          Strong face, three-word contrast, and a title that still makes sense truncated — check all three surfaces before you
          publish; most clicks happen on the smallest one.
        </Note>
      </Panel>
    </div>
  );
}

/* ------------------------------ 6. Hashtag Splitter ------------------------ */

type JoinMode = "inline" | "lines";
const JOIN_OPTS = [
  { v: "inline", label: "Space-joined" },
  { v: "lines", label: "One per line" },
] as const;

export function HashtagSplitter() {
  const A = accentOf(5);
  const [raw, setRaw] = useState("#contentcreator #ContentCreator, techtok\n#automation #zyric #buildinpublic, #techtok #saas");
  const [per, setPer] = useState(30);
  const [join, setJoin] = useState<JoinMode>("inline");

  const parsed = useMemo(() => {
    const tokens = raw.split(/[\s,;]+/).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    const invalid: string[] = [];
    let dupes = 0;
    for (const t of tokens) {
      const clean = t.replace(/^#+/, "");
      if (!clean || !/^[\p{L}\p{N}_]+$/u.test(clean)) {
        invalid.push(t);
        continue;
      }
      const key = clean.toLowerCase();
      if (seen.has(key)) {
        dupes++;
        continue;
      }
      seen.add(key);
      unique.push(clean);
    }
    const blocks: string[][] = [];
    for (let i = 0; i < unique.length; i += per) blocks.push(unique.slice(i, i + per));
    return { unique, invalid, dupes, blocks };
  }, [raw, per]);

  const renderBlock = (b: string[]) => b.map((t) => `#${t}`).join(join === "inline" ? " " : "\n");
  const allText = parsed.blocks.map(renderBlock).join("\n\n");

  return (
    <Split
      left={
        <div className="space-y-3">
          <Area
            label="paste the hashtag blob — spaces, commas, newlines, duplicates all fine"
            value={raw}
            onChange={setRaw}
            rows={8}
          />
          <Grid cols={3}>
            <BigStat label="unique tags" value={parsed.unique.length} accent={A} />
            <BigStat label="dupes dropped" value={parsed.dupes} accent="#FF9DE2" />
            <BigStat label="skipped" value={parsed.invalid.length} accent={ROSE} hint="punctuation broke them" />
          </Grid>
          <Slider label="tags per block" value={per} onChange={setPer} min={5} max={60} step={5} suffix=" tags" accent={A} />
          <Seg value={join} onChange={setJoin} options={JOIN_OPTS} accent={A} />
          {parsed.invalid.length ? (
            <div className="flex flex-wrap gap-1.5">
              {parsed.invalid.slice(0, 10).map((t, i) => (
                <Tag key={`${t}-${i}`} accent={ROSE}>
                  {t}
                </Tag>
              ))}
            </div>
          ) : null}
          {parsed.unique.length > 30 ? (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2.5 text-[11px] leading-relaxed text-rose-300">
              {parsed.unique.length} unique tags — Instagram caps a caption at 30. Keep block 1 in the caption and drop block 2
              into the first comment (comment tags still surface in search).
            </div>
          ) : null}
        </div>
      }
      right={
        <div className="space-y-3">
          <Out text={allText} label="all blocks — copy in one go" rows={10} />
          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {parsed.blocks.map((b, i) => (
              <Out key={i} text={renderBlock(b)} label={`block ${i + 1} · ${b.length} tags`} />
            ))}
            {!parsed.blocks.length ? <p className="text-sm text-zinc-500">Paste tags on the left — blocks appear here.</p> : null}
          </div>
        </div>
      }
    />
  );
}

/* ------------------------------ 7. LinkedIn Post Formatter ----------------- */

type LineStyle = "plain" | "bold" | "italic" | "bolditalic";
let liUid = 0;
const LINK_OPTS = [
  { v: "plain", label: "Aa" },
  { v: "bold", label: "B" },
  { v: "italic", label: "I" },
  { v: "bolditalic", label: "B·I" },
] as const;

export function LinkedInFormatter() {
  const A = accentOf(6);
  const [lines, setLines] = useState<{ id: number; text: string; style: LineStyle }[]>(() => [
    { id: ++liUid, text: "Hot take: distribution beats product.", style: "bold" },
    { id: ++liUid, text: "We spent 6 months building. Nobody came.", style: "plain" },
  ]);

  const post = lines.map((l) => uniStyle(l.text, l.style)).join("\n");
  const total = graphemes(post);
  const over = total > 3000;
  const cut = total > 210;
  const fold = cut ? sliceG(post, 210) : post;
  const hidden = cut ? total - 210 : 0;

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Meter value={Math.min(total, 3000)} max={3000} accent={over ? ROSE : A} label="post length" right={`${total}/3000`} />
            {over ? <p className="text-[11px] font-bold text-rose-400">{total - 3000} characters over the LinkedIn cap.</p> : null}
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={l.id} className="rounded-md border-l-2 bg-zinc-950/60 p-2" style={{ borderColor: A }}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="mono-kicker" style={{ color: A }}>{`line ${i + 1}`}</span>
                    <button
                      type="button"
                      aria-label="remove line"
                      onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                      className="text-zinc-600 transition-colors hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    value={l.text}
                    onChange={(e) =>
                      setLines((ls) => ls.map((x) => (x.id === l.id ? { ...x, text: e.target.value } : x)))
                    }
                    placeholder="write one beat per line…"
                    className={INPUT_CLS}
                  />
                  <div className="mt-2">
                    <Seg
                      value={l.style}
                      onChange={(v) => setLines((ls) => ls.map((x) => (x.id === l.id ? { ...x, style: v } : x)))}
                      options={LINK_OPTS}
                      accent={A}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Row>
              <Btn
                accent={A}
                onClick={() => setLines((ls) => [...ls, { id: ++liUid, text: "", style: "plain" }])}
              >
                <Plus className="h-3.5 w-3.5" /> add line
              </Btn>
            </Row>
          </div>
        }
        right={
          <div className="space-y-3">
            <Panel title="the fold · first 210 characters" accent={A} right={<Tag accent={cut ? ROSE : A}>{cut ? `${hidden} hidden` : "all visible"}</Tag>}>
              <p className="text-[13px] leading-relaxed text-zinc-200">
                {fold || "—"}
                {cut ? <span className="text-zinc-500"> …see more</span> : null}
              </p>
              <Note>
                {cut
                  ? `${hidden} characters sit behind “see more” — the hook above the fold has to earn that click.`
                  : "The whole post fits above the fold."}
              </Note>
            </Panel>
            <div className="mx-auto w-full max-w-[280px] rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full" style={{ background: `linear-gradient(135deg, ${A}, #0a66c2)` }} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-zinc-100">
                    You <span className="font-normal text-zinc-500">· 1st</span>
                  </p>
                  <p className="text-[10px] text-zinc-500">12,480 followers · now</p>
                </div>
              </div>
              <p className="mt-2.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-zinc-100">
                {post || "Your post renders here, line by line."}
                {cut ? <span className="text-zinc-500"> …see more</span> : null}
              </p>
              <div className="mt-3 flex justify-between border-t border-zinc-800 pt-2 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                <span>Like</span>
                <span>Comment</span>
                <span>Repost</span>
              </div>
            </div>
          </div>
        }
      />
      <Note>
        LinkedIn has no native markdown — asterisks render as asterisks. Unicode letterforms are the only inline emphasis that
        survives the post box; one or two bold lines max, walls of styled text read as spam. Links in the body can throttle
        reach — the first comment is the safe harbour.
      </Note>
    </div>
  );
}

/* ------------------------------ 8. Podcast Show Notes Formatter ------------ */

const pad2 = (n: number) => String(n).padStart(2, "0");
function stampOf(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}
function durOf(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
}
type Chapter = { sec: number; title: string; dur: number | null };

export function PodcastNotesFormatter() {
  const A = accentOf(7);
  const [raw, setRaw] = useState(
    "00:00 Cold open — why client-side only\n3:45 The stack: Next.js, no backend\n14:02 Live demo: signature tool\n25:40 Scaling to 100k visits on a free tier\n38:15 Q&A + what ships next"
  );
  const [show, setShow] = useState("Ship It");
  const [episode, setEpisode] = useState("Ep. 12 — zyric.tech");
  const [guest, setGuest] = useState("");
  const [includeDur, setIncludeDur] = useState(true);

  const parsed = useMemo(() => {
    const chapters: Chapter[] = [];
    const notes: string[] = [];
    let last = -1;
    let order = true;
    for (const line of raw.split(/\n+/)) {
      const m = line.match(/^\s*[\[(]?\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[)\]]?\s*[-–—:.)]?\s*(.*)$/);
      const mm = m ? Number(m[2]) : 0;
      const ss = m ? Number(m[3]) : 0;
      if (m && mm <= 59 && ss <= 59) {
        const sec = (m[1] ? Number(m[1]) * 3600 : 0) + mm * 60 + ss;
        if (sec < last) order = false;
        last = sec;
        chapters.push({ sec, title: m[4].trim(), dur: null });
      } else if (line.trim()) {
        notes.push(line.trim());
      }
    }
    for (let i = 0; i < chapters.length; i++) {
      chapters[i].dur = i < chapters.length - 1 ? chapters[i + 1].sec - chapters[i].sec : null;
    }
    return { chapters, notes, order };
  }, [raw]);

  const md = useMemo(() => {
    const L: string[] = [`# ${show || "Show"} — ${episode || "Episode"}${guest ? ` (with ${guest})` : ""}`, ""];
    if (parsed.chapters.length) {
      L.push("## In this episode", "");
      for (const c of parsed.chapters) L.push(`- ${c.title || "Chapter"}`);
      L.push("", "## Timestamps", "");
      for (const c of parsed.chapters) {
        L.push(`${stampOf(c.sec)} ${c.title || "Chapter"}${includeDur && c.dur !== null ? ` (${durOf(c.dur)})` : ""}`);
      }
    } else {
      L.push("_No timestamps found — write lines like `04:31 Intro` and they become chapters._");
    }
    if (parsed.notes.length) {
      L.push("", "## Loose notes", "");
      for (const n of parsed.notes) L.push(`- ${n}`);
    }
    return L.join("\n");
  }, [show, episode, guest, includeDur, parsed]);

  return (
    <Split
      left={
        <div className="space-y-3">
          <Area
            label="paste rough notes — one timestamp per line, any format"
            value={raw}
            onChange={setRaw}
            rows={9}
          />
          <Grid cols={3}>
            <Field label="show" value={show} onChange={setShow} placeholder="Show name" />
            <Field label="episode" value={episode} onChange={setEpisode} placeholder="Ep. 12 — title" />
            <Field label="guest (optional)" value={guest} onChange={setGuest} placeholder="with Jane Doe" />
          </Grid>
          <Check label="include chapter durations" checked={includeDur} onChange={setIncludeDur} />
          {!parsed.order ? (
            <p className="text-[11px] font-bold text-rose-400">Timestamps are out of order somewhere — players sort strictly.</p>
          ) : null}
          <Note>
            Recognizes 4:31, 04:31 — Intro, (12:34) Topic and 1:04:31 Topic. Anything without a leading timestamp lands in
            “Loose notes” instead of being lost.
          </Note>
        </div>
      }
      right={
        <div className="space-y-3">
          <Panel title="chapter rail" accent={A} right={<Tag accent={A}>{`${parsed.chapters.length} chapters`}</Tag>}>
            {parsed.chapters.length ? (
              <ol className="relative space-y-2 border-l border-zinc-800 pl-4">
                {parsed.chapters.map((c, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full" style={{ background: A }} />
                    <span
                      className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
                      style={{ color: A, borderColor: `${A}55`, background: `${A}14` }}
                    >
                      {stampOf(c.sec)}
                    </span>
                    <span className="ml-2 text-xs text-zinc-300">{c.title || "—"}</span>
                    {includeDur && c.dur !== null ? (
                      <span className="ml-2 font-mono text-[10px] text-zinc-600">{durOf(c.dur)}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-zinc-500">No timestamp lines detected yet.</p>
            )}
          </Panel>
          <Out text={md} label="show notes markdown" rows={12} />
        </div>
      }
    />
  );
}

/* ------------------------------ 9. Caption Adapter ------------------------- */

type Adapter = {
  id: string;
  name: string;
  limit: number;
  tip: string;
  count: (s: string) => number;
  build: (c: string) => string;
};

const countX = (s: string): number => graphemes(s.replace(URL_RE, "x".repeat(23)));

function igAdapt(c: string): string {
  const tags = c.match(TAG_RE) ?? [];
  const body = c
    .replace(TAG_RE, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!tags.length) return trimTo(body, 2200, graphemes);
  const tagLine = tags.join(" ");
  const room = 2200 - graphemes(tagLine) - 8;
  const trimmed = room > 40 ? trimTo(body, room, graphemes) : "";
  return `${trimmed}\n.\n.\n.\n${tagLine}`;
}

const ADAPTERS: Adapter[] = [
  {
    id: "x",
    name: "X · 280",
    limit: 280,
    tip: "URLs count as 23 characters each (t.co) — the meter already applies that rule.",
    count: countX,
    build: (c) => trimTo(c, 280, countX),
  },
  {
    id: "ig",
    name: "Instagram · 2200",
    limit: 2200,
    tip: "Hashtags pulled below a dot-line spacer — the body stays clean, tags still index in search.",
    count: graphemes,
    build: igAdapt,
  },
  {
    id: "li",
    name: "LinkedIn · 3000",
    limit: 3000,
    tip: "The fold lands at ~210 characters — your first line must earn the “see more”. Links in the body throttle reach.",
    count: graphemes,
    build: (c) => trimTo(c, 3000, graphemes),
  },
  {
    id: "tt",
    name: "TikTok · 2200",
    limit: 2200,
    tip: "Tags stay inline where the algorithm reads them; emojis cost one character each.",
    count: graphemes,
    build: (c) => trimTo(c, 2200, graphemes),
  },
];

export function CaptionAdapter() {
  const A = accentOf(8);
  const [caption, setCaption] = useState(
    "We shipped 9 browser tools this week — zero uploads, zero servers, everything runs on your device ⚡ Read how: https://zyric.tech/blog #buildinpublic #indiehacker"
  );

  const total = graphemes(caption);
  const links = (caption.match(URL_RE) ?? []).length;
  const fits = ADAPTERS.filter((p) => p.count(caption) <= p.limit).length;

  return (
    <div className="space-y-4">
      <Area label="one caption, pasted once" value={caption} onChange={setCaption} rows={5} mono={false} />
      <Grid cols={3}>
        <BigStat label="original graphemes" value={total} accent={A} />
        <BigStat label="links found" value={links} accent="#7FC8FF" hint="X bills them as 23 chars" />
        <BigStat label="fits untrimmed" value={`${fits}/4`} accent={fits === 4 ? "#5EE39A" : "#FFB3C6"} />
      </Grid>
      <Grid cols={2}>
        {ADAPTERS.map((p) => {
          const out = caption.trim() ? p.build(caption) : "";
          const used = out ? p.count(out) : 0;
          const hot = used > p.limit * 0.9;
          return (
            <Panel
              key={p.id}
              title={p.name}
              accent={A}
              right={<Tag accent={hot ? ROSE : A}>{`${used}/${p.limit}`}</Tag>}
            >
              <Out text={out} label={`copy for ${p.name}`} rows={5} />
              <div className="mt-2">
                <Meter value={used} max={p.limit} accent={hot ? ROSE : A} label="budget" right={`${used}/${p.limit}`} />
              </div>
              <Note>{p.tip}</Note>
            </Panel>
          );
        })}
      </Grid>
      <Note>
        Trims happen at word boundaries with a single “…” — never mid-word. Each platform's quirks (t.co pricing, IG hashtag
        relocation, the LinkedIn fold) are applied before the character meter is read.
      </Note>
    </div>
  );
}

/* ------------------------------ Meta --------------------------------------- */

export const socialMeta: ToolMeta[] = [
  {
    id: "ig-bio",
    name: "Instagram Bio Studio",
    description: "Per-line unicode styling, invisible gaps and a live phone preview — 150 chars, counted true.",
    category: "web",
    icon: AtSign,
    keywords: "instagram bio fonts line breaks profile 150 characters unicode spacer",
    badge: "new",
    component: IgBioStudio,
  },
  {
    id: "social-resizer",
    name: "One Image → Every Platform",
    description: "Upload once, get 9 canvas-perfect crops — IG, X, YouTube, LinkedIn, TikTok — single or ZIP.",
    category: "web",
    icon: Crop,
    keywords: "resize image social media instagram youtube tiktok linkedin banner thumbnail crop zip cover",
    badge: "new",
    component: SocialResizer,
  },
  {
    id: "yt-checker",
    name: "YouTube Studio Checker",
    description: "Title pixel-width, the 150-char description fold and the 500-char tag budget, with a live SERP card.",
    category: "web",
    icon: Youtube,
    keywords: "youtube title description tags limit checker pixel width serp preview studio",
    badge: "new",
    component: YtStudioChecker,
  },
  {
    id: "tiktok-formatter",
    name: "TikTok Caption Formatter",
    description: "2200 grapheme-true counter, hashtag cost split and a For-You caption card preview.",
    category: "web",
    icon: Music2,
    keywords: "tiktok caption hashtags emoji counter 2200 characters formatter grapheme",
    badge: "new",
    component: TikTokFormatter,
  },
  {
    id: "thumb-tester",
    name: "Thumbnail Tester",
    description: "See one thumbnail survive the grid, the sidebar and the tiny mobile row — before you publish.",
    category: "web",
    icon: MonitorPlay,
    keywords: "youtube thumbnail tester preview grid sidebar mobile duration title click",
    badge: "new",
    component: ThumbTester,
  },
  {
    id: "hashtag-splitter",
    name: "Hashtag Splitter",
    description: "Paste a tag soup — get deduped, normalized, copy-ready blocks sized to the 30-tag IG cap.",
    category: "web",
    icon: Hash,
    keywords: "hashtag splitter dedupe instagram 30 tags blocks first comment normalize",
    badge: "new",
    component: HashtagSplitter,
  },
  {
    id: "linkedin-formatter",
    name: "LinkedIn Post Formatter",
    description: "Unicode bold/italic per line, 3000-char meter and the 210-character see-more fold preview.",
    category: "web",
    icon: Linkedin,
    keywords: "linkedin post formatter unicode bold italic hook 210 characters see more fold",
    badge: "new",
    component: LinkedInFormatter,
  },
  {
    id: "podcast-notes",
    name: "Podcast Show Notes Formatter",
    description: "Raw timestamps in — chapters, durations and an in-this-episode markdown template out.",
    category: "web",
    icon: Podcast,
    keywords: "podcast show notes timestamps chapters markdown formatter duration template",
    badge: "new",
    component: PodcastNotesFormatter,
  },
  {
    id: "caption-adapter",
    name: "Caption Adapter",
    description: "One caption, four platforms — smart word-boundary trims for X 280, IG 2200, LinkedIn 3000, TikTok 2200.",
    category: "web",
    icon: Repeat,
    keywords: "caption adapter cross post twitter instagram linkedin tiktok trim 280 2200 3000 word boundary",
    badge: "new",
    component: CaptionAdapter,
  },
];
