"use client";

/* ==========================================================================
   KIT: IMAGE+ — 12 canvas-powered photo machines. 100% client-side:
   FileReader → canvas → toBlob → download. Nothing ever leaves the device.
   1 crop · 2 rotate/flip · 3 format convert · 4 grid split (zip)
   5 watermark · 6 meme · 7 round avatar · 8 OG card · 9 blur/pixelate
   10 palette eyedropper · 11 photo framer · 12 ascii art
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as RMouseEvent, PointerEvent as RPointerEvent } from "react";
import {
  Binary,
  CircleUser,
  Crop,
  Download,
  Eraser,
  Frame,
  Grid2X2,
  ImageDown,
  Laugh,
  Palette,
  Repeat,
  RotateCcw,
  RotateCw,
  Share2,
  Stamp,
  Upload,
  Wand2,
} from "lucide-react";
import {
  Area,
  BigStat,
  Btn,
  Check,
  Field,
  Grid,
  KV,
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
import JSZip from "jszip";

/* ------------------------------ shared helpers ----------------------------- */

type DrawSrc = HTMLImageElement | HTMLCanvasElement;
type Sel = { x: number; y: number; w: number; h: number };
type Rect = Sel;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("That file is not an image — pick a PNG, JPG or WebP."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode this image."));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), mime, quality),
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "image";
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Downscale an image into a capped canvas so previews stay cheap. */
function cappedCanvas(img: HTMLImageElement, maxDim: number): DrawSrc {
  const s = Math.min(1, maxDim / Math.max(img.width, img.height));
  if (s >= 1) return img;
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(img.width * s));
  cv.height = Math.max(1, Math.round(img.height * s));
  const ctx = cv.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
  }
  return cv;
}

/** Object-URL lifecycle: revoke on every change and on unmount. */
function useObjectUrl(blob: Blob | null): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

/** Shared upload state: decodes the picked file, guards errors, names it. */
function useImgFile() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const load = (f: File) => {
    setErr("");
    setFile(f);
    loadImage(f)
      .then((im) => {
        setImg(im);
        setFileName(f.name);
      })
      .catch((e: Error) => {
        setImg(null);
        setErr(e.message);
      });
  };
  return { file, img, fileName, err, setErr, load, setImg, setFileName };
}

function ErrNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <Note>
      <span className="font-mono font-bold" style={{ color: "#FF8A7A" }}>
        blocked //
      </span>{" "}
      {msg}
    </Note>
  );
}

function DropRow({
  fileName,
  sizeText,
  accent,
  onFile,
  label,
}: {
  fileName: string | null;
  sizeText?: string;
  accent: string;
  onFile: (f: File) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3 py-3"
        style={{ borderColor: `${accent}55`, background: `${accent}0a` }}
      >
        <ImageDown className="h-5 w-5 shrink-0" style={{ color: accent }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs text-zinc-300">{fileName ?? label}</p>
          <p className="text-[10px] text-zinc-600">
            {fileName ? sizeText || "\u00a0" : "PNG · JPG · WebP — processed on your device"}
          </p>
        </div>
        <Btn accent={accent} variant={fileName ? "ghost" : "solid"} onClick={() => ref.current?.click()}>
          <Upload className="h-3.5 w-3.5" aria-hidden /> {fileName ? "Change" : "Upload"}
        </Btn>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (!f.type.startsWith("image/")) {
              setErr(`"${f.name}" is not an image file — nothing was loaded.`);
              return;
            }
            setErr("");
            onFile(f);
          }}
        />
      </div>
      <ErrNote msg={err} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mono-kicker mb-1.5 block text-zinc-500">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-950/70 p-1"
      />
    </label>
  );
}

function Dl({ blob, filename, accent, label = "Download" }: { blob: Blob | null; filename: string; accent: string; label?: string }) {
  return (
    <Btn accent={accent} disabled={!blob} onClick={() => blob && download(blob, filename)}>
      <Download className="h-3.5 w-3.5" aria-hidden /> {label}
    </Btn>
  );
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (!cur || ctx.measureText(t).width <= maxW) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ------------------------------ 1. Image cropper --------------------------- */

const ASPECTS = [
  { v: "free", label: "Free", r: 0 },
  { v: "1:1", label: "1:1", r: 1 },
  { v: "4:5", label: "4:5", r: 4 / 5 },
  { v: "16:9", label: "16:9", r: 16 / 9 },
] as const;
type Aspect = (typeof ASPECTS)[number]["v"];

function fitSel(x: number, y: number, w: number, h: number, img: HTMLImageElement, ratio: number): Sel {
  x = Math.max(0, Math.min(x, img.width - 8));
  y = Math.max(0, Math.min(y, img.height - 8));
  const maxW = img.width - x;
  const maxH = img.height - y;
  if (ratio) {
    w = Math.min(Math.max(8, w), maxW);
    h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
  } else {
    w = Math.min(Math.max(8, w), maxW);
    h = Math.min(Math.max(8, h), maxH);
  }
  return { x, y, w, h };
}

function defaultSel(img: HTMLImageElement, ratio: number): Sel {
  const w0 = img.width * 0.8;
  const h0 = img.height * 0.8;
  if (ratio) {
    let w = w0;
    let h = w / ratio;
    if (h > h0) {
      h = h0;
      w = h * ratio;
    }
    return { x: (img.width - w) / 2, y: (img.height - h) / 2, w, h };
  }
  return { x: img.width * 0.1, y: img.height * 0.1, w: w0, h: h0 };
}

function paintCropPreview(cv: HTMLCanvasElement, src: DrawSrc, sel: Sel, k: number, accent: string) {
  cv.width = src.width;
  cv.height = src.height;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(src, 0, 0);
  const rx = sel.x * k;
  const ry = sel.y * k;
  const rw = sel.w * k;
  const rh = sel.h * k;
  ctx.fillStyle = "rgba(9,9,11,0.62)";
  ctx.fillRect(0, 0, cv.width, ry);
  ctx.fillRect(0, ry + rh, cv.width, cv.height - ry - rh);
  ctx.fillRect(0, ry, rx, rh);
  ctx.fillRect(rx + rw, ry, cv.width - rx - rw, rh);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, ry, rw, rh);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(rx + (rw * i) / 3, ry);
    ctx.lineTo(rx + (rw * i) / 3, ry + rh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx, ry + (rh * i) / 3);
    ctx.lineTo(rx + rw, ry + (rh * i) / 3);
    ctx.stroke();
  }
  ctx.fillStyle = accent;
  ctx.fillRect(rx + rw - 6, ry + rh - 6, 10, 10);
}

export function ImageCropperTool() {
  const A = accentOf(0);
  const { img, fileName, err, load } = useImgFile();
  const [aspect, setAspect] = useState<Aspect>("free");
  const [sel, setSel] = useState<Sel>({ x: 0, y: 0, w: 0, h: 0 });
  const [blob, setBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ mode: "move" | "resize" | "new"; sx: number; sy: number; orig: Sel } | null>(null);
  const url = useObjectUrl(blob);

  const preview = useMemo(() => (img ? cappedCanvas(img, 1100) : null), [img]);
  const k = img && preview ? preview.width / img.width : 1;
  const ratio = ASPECTS.find((a) => a.v === aspect)?.r ?? 0;

  useEffect(() => {
    if (img) setSel(defaultSel(img, 0));
  }, [img]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img || !preview) return;
    paintCropPreview(cv, preview, sel, k, A);
  }, [img, preview, sel, k, A]);

  const toImg = (e: RPointerEvent<HTMLCanvasElement>): { x: number; y: number; u: number } => {
    const cv = canvasRef.current;
    if (!cv) return { x: 0, y: 0, u: 1 };
    const r = cv.getBoundingClientRect();
    const f = Math.max(1, r.width);
    return { x: ((e.clientX - r.left) / f) * cv.width / k, y: ((e.clientY - r.top) / f) * cv.height / k, u: cv.width / f / k };
  };

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!img) return;
    const p = toImg(e);
    const hit = 14 * p.u;
    const corner = Math.abs(p.x - (sel.x + sel.w)) < hit && Math.abs(p.y - (sel.y + sel.h)) < hit;
    const inside = p.x >= sel.x && p.x <= sel.x + sel.w && p.y >= sel.y && p.y <= sel.y + sel.h;
    const mode = corner ? "resize" : inside ? "move" : "new";
    drag.current = { mode, sx: p.x, sy: p.y, orig: { ...sel } };
    if (mode === "new") setSel({ x: p.x, y: p.y, w: 0, h: 0 });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture unsupported — drag still works while held */
    }
  };

  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !img) return;
    const p = toImg(e);
    const dx = p.x - d.sx;
    const dy = p.y - d.sy;
    if (d.mode === "move") setSel(fitSel(d.orig.x + dx, d.orig.y + dy, d.orig.w, d.orig.h, img, 0));
    else if (d.mode === "resize") setSel(fitSel(d.orig.x, d.orig.y, d.orig.w + dx, d.orig.h + dy, img, ratio));
    else setSel(fitSel(Math.min(d.sx, p.x), Math.min(d.sy, p.y), Math.abs(dx), ratio ? Math.abs(dx) / ratio : Math.abs(dy), img, ratio));
  };

  const onUp = () => {
    drag.current = null;
  };

  const crop = async () => {
    if (!img || sel.w < 4 || sel.h < 4) return;
    const cv = document.createElement("canvas");
    cv.width = Math.round(sel.w);
    cv.height = Math.round(sel.h);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sel.x, sel.y, sel.w, sel.h, 0, 0, cv.width, cv.height);
    setBlob(await toBlob(cv, "image/png"));
  };

  const field = (label: string, key: "x" | "y" | "w" | "h") => (
    <Field
      label={label}
      type="number"
      value={Math.round(sel[key])}
      min={0}
      onChange={(v) =>
        setSel((p) =>
          !img ? p : key === "x" ? fitSel(num(v), p.y, p.w, p.h, img, 0)
          : key === "y" ? fitSel(p.x, num(v), p.w, p.h, img, 0)
          : key === "w" ? fitSel(p.x, p.y, num(v), ratio ? num(v) / ratio : p.h, img, ratio)
          : fitSel(p.x, p.y, ratio ? num(v) * ratio : p.w, num(v), img, ratio))
      }
    />
  );

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px source` : ""} accent={A} onFile={(f) => { setBlob(null); load(f); }} label="Drop a photo to crop" />
      <ErrNote msg={err} />
      {img && preview ? (
        <Split
          left={
            <Panel title="drag = select · corner dot = resize" accent={A}>
              <canvas
                ref={canvasRef}
                className="h-auto max-w-full cursor-crosshair touch-none"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
              />
            </Panel>
          }
          right={
            <div className="space-y-3">
              <Panel title="crop box" accent={A}>
                <Seg
                  value={aspect}
                  onChange={(v) => {
                    setAspect(v);
                    const r = ASPECTS.find((a) => a.v === v)?.r ?? 0;
                    if (r && img) setSel(defaultSel(img, r));
                  }}
                  accent={A}
                  options={ASPECTS.map(({ v, label }) => ({ v, label }))}
                />
                <Grid cols={2} className="mt-3">
                  {field("X", "x")}
                  {field("Y", "y")}
                  {field("W", "w")}
                  {field("H", "h")}
                </Grid>
                <Row className="mt-3">
                  <Tag accent={A}>{`${Math.round(sel.w)} × ${Math.round(sel.h)} px`}</Tag>
                  <Btn accent={A} onClick={() => void crop()} disabled={sel.w < 4 || sel.h < 4}>
                    <Crop className="h-3.5 w-3.5" aria-hidden /> Crop
                  </Btn>
                </Row>
              </Panel>
              {blob ? (
                <Panel title="result" accent={A} right={<Tag accent={A}>{fmtBytes(blob.size)}</Tag>}>
                  <img src={url} alt="Crop result" className="mx-auto max-h-56 w-auto rounded" />
                  <Row className="mt-3">
                    <Dl blob={blob} filename={`${baseName(fileName)}-crop.png`} accent={A} />
                  </Row>
                </Panel>
              ) : null}
              <Note>Selection coordinates map 1:1 to the original pixels, so a 1080×1350 request really exports 1080×1350.</Note>
            </div>
          }
        />
      ) : (
        <Note>Free-form drag or exact pixel values, with 1:1 / 4:5 / 16:9 presets for post formats.</Note>
      )}
    </div>
  );
}

/* ------------------------------ 2. Rotate & flip --------------------------- */

function rotDims(w: number, h: number, rad: number): [number, number] {
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return [Math.max(1, Math.round(w * c + h * s)), Math.max(1, Math.round(w * s + h * c))];
}

export function ImageRotateTool() {
  const A = accentOf(1);
  const { img, fileName, err, load } = useImgFile();
  const [quarter, setQuarter] = useState(0);
  const [free, setFree] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rad = ((quarter * 90 + free) * Math.PI) / 180;
  const [dw, dh] = img ? rotDims(img.width, img.height, rad) : [0, 0];

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img) return;
    const s = Math.min(1, 900 / Math.max(dw, dh));
    cv.width = Math.max(1, Math.round(dw * s));
    cv.height = Math.max(1, Math.round(dh * s));
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.translate(cv.width / 2, cv.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [img, rad, flipH, flipV, dw, dh]);

  const save = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const cv = document.createElement("canvas");
      const [W, H] = rotDims(img.width, img.height, rad);
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      download(await toBlob(cv, "image/png"), `${baseName(fileName)}-rotated.png`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px source` : ""} accent={A} onFile={load} label="Pick an image to spin" />
      <ErrNote msg={err} />
      {img ? (
        <>
          <Panel title="transform" accent={A}>
            <Row>
              <Btn variant="ghost" accent={A} onClick={() => setQuarter((q) => (q + 3) % 4)}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> −90°
              </Btn>
              <Btn variant="ghost" accent={A} onClick={() => setQuarter((q) => (q + 1) % 4)}>
                <RotateCw className="h-3.5 w-3.5" aria-hidden /> +90°
              </Btn>
              <span className="flex items-center gap-4 pb-1">
                <Check label="Flip H" checked={flipH} onChange={setFlipH} />
                <Check label="Flip V" checked={flipV} onChange={setFlipV} />
              </span>
            </Row>
            <div className="mt-3 max-w-[280px]">
              <Slider label="Free angle" value={free} onChange={setFree} min={-180} max={180} suffix="°" accent={A} />
            </div>
          </Panel>
          <KV k="output canvas" v={`${dw} × ${dh} px`} accent={A} />
          <Panel title="live preview" accent={A}>
            <canvas ref={canvasRef} className="mx-auto block h-auto max-w-full" style={{ maxHeight: 440 }} />
          </Panel>
          <Row>
            <Btn accent={A} onClick={() => void save()} disabled={busy}>
              <Download className="h-3.5 w-3.5" aria-hidden /> {busy ? "Rendering…" : "Download PNG"}
            </Btn>
          </Row>
          <Note>Quarter-turns are lossless pixel moves; the free-angle slider composes a rotated bounding box at full resolution on export.</Note>
        </>
      ) : (
        <Note>90° steps plus a −180°…180° dial, with independent horizontal and vertical mirrors.</Note>
      )}
    </div>
  );
}

/* ------------------------------ 3. Format converter ------------------------ */

const FMTS = [
  { v: "image/webp", label: "WebP" },
  { v: "image/jpeg", label: "JPEG" },
  { v: "image/png", label: "PNG" },
] as const;
type Fmt = (typeof FMTS)[number]["v"];

export function ImageConvertTool() {
  const A = accentOf(2);
  const { file, img, fileName, err, setErr, load } = useImgFile();
  const [fmt, setFmt] = useState<Fmt>("image/webp");
  const [q, setQ] = useState(80);
  const [out, setOut] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const url = useObjectUrl(out);

  const convert = async () => {
    if (!img) return;
    setBusy(true);
    setErr("");
    try {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      if (fmt === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cv.width, cv.height);
      }
      ctx.drawImage(img, 0, 0);
      setOut(await toBlob(cv, fmt, fmt === "image/png" ? undefined : q / 100));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setBusy(false);
    }
  };

  const saved = file && out ? (1 - out.size / file.size) * 100 : 0;
  const ext = fmt === "image/jpeg" ? "jpg" : fmt.split("/")[1];

  return (
    <div className="space-y-4">
      <DropRow fileName={file?.name ?? null} sizeText={file ? fmtBytes(file.size) : ""} accent={A} onFile={(f) => { setOut(null); load(f); }} label="Pick an image to re-encode" />
      <ErrNote msg={err} />
      {file && img ? (
        <>
          <Grid cols={3}>
            <BigStat label="original" value={fmtBytes(file.size)} accent="#52525b" hint={`${img.width} × ${img.height} · ${(file.type.split("/")[1] || "?").toUpperCase()}`} />
            <BigStat label={out ? "converted" : "target"} value={out ? fmtBytes(out.size) : FMTS.find((f) => f.v === fmt)?.label ?? "—"} accent={A} hint={out ? `${ext.toUpperCase()} · quality ${q}` : "pick a format below"} />
            <BigStat
              label={saved >= 0 ? "saved" : "grew by"}
              value={out ? `${Math.abs(saved).toFixed(1)}%` : "—"}
              accent={saved >= 0 ? "#5EE39A" : "#FF8A7A"}
              hint={out ? (saved >= 0 ? "smaller than the original" : "try WebP or a lower quality") : "run a conversion"}
            />
          </Grid>
          <Panel title="encoder" accent={A}>
            <Row>
              <Seg value={fmt} onChange={setFmt} accent={A} options={FMTS.map(({ v, label }) => ({ v, label }))} />
            </Row>
            {fmt !== "image/png" ? (
              <div className="mt-3 max-w-[280px]">
                <Slider label="Quality" value={q} onChange={setQ} min={10} max={100} suffix="%" accent={A} />
              </div>
            ) : null}
            <Row className="mt-3">
              <Btn accent={A} onClick={() => void convert()} disabled={busy}>
                <Repeat className="h-3.5 w-3.5" aria-hidden /> {busy ? "Encoding…" : "Convert"}
              </Btn>
              {out ? <Dl blob={out} filename={`${baseName(file.name)}.${ext}`} accent={A} /> : null}
            </Row>
          </Panel>
          {out ? (
            <Panel title="converted preview" accent={A} right={<Tag accent={A}>{ext.toUpperCase()}</Tag>}>
              <img src={url} alt="Converted result" className="mx-auto max-h-72 w-auto" />
            </Panel>
          ) : null}
          <Note>canvas.toBlob does the encoding in your browser. WebP usually wins on size; JPEG gets a white mat because it cannot store transparency.</Note>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ 4. Grid splitter --------------------------- */

function SplitTile({ src, n, r, c, onGrab }: { src: DrawSrc; n: number; r: number; c: number; onGrab: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const tw = Math.floor(src.width / n);
  const th = Math.floor(src.height / n);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = tw;
    cv.height = th;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, tw, th);
    ctx.drawImage(src, c * tw, r * th, tw, th, 0, 0, tw, th);
  }, [src, n, r, c, tw, th]);
  return (
    <button type="button" onClick={onGrab} className="group relative block min-w-0 overflow-hidden rounded border border-zinc-800 hover:border-zinc-500" title="Download this tile">
      <canvas ref={ref} className="h-auto w-full" />
      <span className="absolute right-1 top-1 rounded bg-zinc-950/80 px-1 py-0.5 font-mono text-[9px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
        #{r * n + c + 1}
      </span>
    </button>
  );
}

const GRID_OPTS = [
  { v: "2", label: "2 × 2" },
  { v: "3", label: "3 × 3" },
  { v: "4", label: "4 × 4" },
] as const;

export function ImageSplitterTool() {
  const A = accentOf(3);
  const { img, fileName, err, load } = useImgFile();
  const [nStr, setNStr] = useState<"2" | "3" | "4">("3");
  const [busy, setBusy] = useState(false);
  const n = Number(nStr);
  const src = useMemo(() => (img ? cappedCanvas(img, 2000) : null), [img]);
  const tw = src ? Math.floor(src.width / n) : 0;
  const th = src ? Math.floor(src.height / n) : 0;

  const tileCanvas = (r: number, c: number): HTMLCanvasElement | null => {
    if (!src) return null;
    const cv = document.createElement("canvas");
    cv.width = tw;
    cv.height = th;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(src, c * tw, r * th, tw, th, 0, 0, tw, th);
    return cv;
  };

  const grabTile = async (r: number, c: number) => {
    const cv = tileCanvas(r, c);
    if (!cv) return;
    download(await toBlob(cv, "image/png"), `tile-${r + 1}-${c + 1}.png`);
  };

  const zipAll = async () => {
    if (!src) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cv = tileCanvas(r, c);
          if (cv) zip.file(`tile-${r + 1}-${c + 1}.png`, await toBlob(cv, "image/png"));
        }
      }
      download(await zip.generateAsync({ type: "blob" }), `${baseName(fileName)}-grid-${n}x${n}.zip`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px` : ""} accent={A} onFile={load} label="Pick an image to slice" />
      <ErrNote msg={err} />
      {src ? (
        <>
          <Panel title="grid" accent={A}>
            <Row>
              <Seg value={nStr} onChange={setNStr} accent={A} options={GRID_OPTS} />
              <Tag accent={A}>{`${n * n} tiles · ${tw}×${th}px each`}</Tag>
              <Btn accent={A} onClick={() => void zipAll()} disabled={busy}>
                <Download className="h-3.5 w-3.5" aria-hidden /> {busy ? "Zipping…" : "Download all as ZIP"}
              </Btn>
            </Row>
          </Panel>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {Array.from({ length: n * n }, (_, i) => (
              <SplitTile key={i} src={src} n={n} r={Math.floor(i / n)} c={i % n} onGrab={() => void grabTile(Math.floor(i / n), i % n)} />
            ))}
          </div>
          <Note>Instagram grid posts: upload the tiles in order 1 → {n * n} (row by row). Your profile page reassembles the mosaic; the feed shows them one post at a time. Click any tile to grab it solo.</Note>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ 5. Watermark stamper ----------------------- */

type WMPos = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";
const WM_POS: { v: WMPos; label: string }[] = [
  { v: "tl", label: "TL" },
  { v: "tc", label: "TC" },
  { v: "tr", label: "TR" },
  { v: "ml", label: "ML" },
  { v: "mc", label: "MC" },
  { v: "mr", label: "MR" },
  { v: "bl", label: "BL" },
  { v: "bc", label: "BC" },
  { v: "br", label: "BR" },
];

function paintWatermark(ctx: CanvasRenderingContext2D, src: DrawSrc, W: number, H: number, o: { text: string; sizePct: number; opacity: number; pos: WMPos; tile: boolean }) {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(src, 0, 0, W, H);
  const text = o.text.trim();
  if (!text) return;
  const px = Math.max(10, Math.round((W * o.sizePct) / 100));
  ctx.save();
  ctx.globalAlpha = o.opacity;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = px / 5;
  ctx.font = `700 ${px}px Arial, sans-serif`;
  if (o.tile) {
    const stepX = Math.max(ctx.measureText(text).width + px * 2, px * 4);
    const stepY = px * 3.2;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 7);
    const R = Math.hypot(W, H) / 2 + Math.max(stepX, stepY);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let y = -R; y <= R; y += stepY) for (let x = -R; x <= R; x += stepX) ctx.fillText(text, x, y);
  } else {
    const v = o.pos[0] as "t" | "m" | "b";
    const h = o.pos[1] as "l" | "c" | "r";
    ctx.textAlign = h === "l" ? "left" : h === "c" ? "center" : "right";
    ctx.textBaseline = v === "t" ? "top" : v === "m" ? "middle" : "bottom";
    const pad = px * 0.6;
    const x = h === "l" ? pad : h === "c" ? W / 2 : W - pad;
    const y = v === "t" ? pad : v === "m" ? H / 2 : H - pad;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

export function WatermarkTool() {
  const A = accentOf(4);
  const { img, fileName, err, load } = useImgFile();
  const [text, setText] = useState("© zyric.tech");
  const [sizePct, setSizePct] = useState(6);
  const [opacity, setOpacity] = useState(70);
  const [pos, setPos] = useState<WMPos>("br");
  const [tile, setTile] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preview = useMemo(() => (img ? cappedCanvas(img, 900) : null), [img]);
  const opts = { text, sizePct, opacity: opacity / 100, pos, tile };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !preview) return;
    cv.width = preview.width;
    cv.height = preview.height;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    paintWatermark(ctx, preview, cv.width, cv.height, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, preview, text, sizePct, opacity, pos, tile]);

  const save = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      paintWatermark(ctx, img, cv.width, cv.height, opts);
      download(await toBlob(cv, "image/png"), `${baseName(fileName)}-watermarked.png`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px` : ""} accent={A} onFile={load} label="Pick an image to stamp" />
      <ErrNote msg={err} />
      {img && preview ? (
        <Split
          left={
            <Panel title="stamp" accent={A}>
              <Field label="Watermark text" value={text} onChange={setText} placeholder="© your studio" />
              <div className="mt-3 space-y-3">
                <Slider label="Font size" value={sizePct} onChange={setSizePct} min={2} max={18} suffix="% of width" accent={A} />
                <Slider label="Opacity" value={opacity} onChange={setOpacity} min={5} max={100} suffix="%" accent={A} />
              </div>
              <div className="mt-3">
                <span className="mono-kicker mb-1.5 block text-zinc-500">Position (9-grid)</span>
                <Seg value={pos} onChange={setPos} accent={A} options={WM_POS} />
              </div>
              <div className="mt-3">
                <Check label="Tile diagonally across the whole image" checked={tile} onChange={setTile} />
              </div>
              <KV k="rendered size" v={`${Math.round((preview.width * sizePct) / 100)} px @ preview scale`} accent={A} />
              <Row className="mt-3">
                <Btn accent={A} onClick={() => void save()} disabled={busy}>
                  <Stamp className="h-3.5 w-3.5" aria-hidden /> {busy ? "Stamping…" : "Download PNG"}
                </Btn>
              </Row>
            </Panel>
          }
          right={
            <Panel title="preview" accent={A} right={tile ? <Tag accent={A}>tiled</Tag> : undefined}>
              <canvas ref={canvasRef} className="h-auto w-full" />
            </Panel>
          }
        />
      ) : null}
    </div>
  );
}

/* ------------------------------ 6. Meme forge ------------------------------ */

function paintMeme(ctx: CanvasRenderingContext2D, src: DrawSrc, W: number, H: number, top: string, bottom: string) {
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(src, 0, 0, W, H);
  const zone = (raw: string, atTop: boolean) => {
    const text = raw.toUpperCase().trim();
    if (!text) return;
    let px = Math.round(W / 7);
    const maxW = W * 0.94;
    const font = (s: number) => {
      ctx.font = `900 ${s}px Impact, "Arial Black", sans-serif`;
    };
    font(px);
    let lines = wrapLines(ctx, text, maxW);
    while (lines.length > 3 && px > 14) {
      px = Math.round(px * 0.86);
      font(px);
      lines = wrapLines(ctx, text, maxW);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, px / 9);
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";
    const lh = px * 1.08;
    const startY = atTop ? px * 0.14 : H - lines.length * lh - px * 0.14;
    lines.forEach((ln, i) => {
      ctx.strokeText(ln, W / 2, startY + i * lh);
      ctx.fillText(ln, W / 2, startY + i * lh);
    });
  };
  zone(top, true);
  zone(bottom, false);
}

export function MemeTool() {
  const A = accentOf(5);
  const { img, fileName, err, load } = useImgFile();
  const [top, setTop] = useState("when the upload");
  const [bottom, setBottom] = useState("never leaves your device");
  const [fmt, setFmt] = useState<"jpg" | "png">("jpg");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preview = useMemo(() => (img ? cappedCanvas(img, 900) : null), [img]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !preview) return;
    cv.width = preview.width;
    cv.height = preview.height;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    paintMeme(ctx, preview, cv.width, cv.height, top, bottom);
  }, [preview, top, bottom]);

  const save = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      paintMeme(ctx, img, cv.width, cv.height, top, bottom);
      const blob = await toBlob(cv, fmt === "jpg" ? "image/jpeg" : "image/png", 0.92);
      download(blob, `${baseName(fileName)}-meme.${fmt}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px` : ""} accent={A} onFile={load} label="Pick a picture worth captioning" />
      <ErrNote msg={err} />
      {img && preview ? (
        <>
          <Panel title="preview · auto-fit impact" accent={A}>
            <canvas ref={canvasRef} className="mx-auto block h-auto max-w-full" style={{ maxHeight: 430 }} />
          </Panel>
          <Split
            left={<Field label="Top text" value={top} onChange={setTop} placeholder="SOMETHING CATCHY" />}
            right={<Field label="Bottom text" value={bottom} onChange={setBottom} placeholder="MORE CATCHY" />}
          />
          <Row>
            <Btn accent={A} onClick={() => void save()} disabled={busy}>
              <Laugh className="h-3.5 w-3.5" aria-hidden /> {busy ? "Forging…" : `Download ${fmt.toUpperCase()}`}
            </Btn>
            <Seg
              value={fmt}
              onChange={setFmt}
              accent={A}
              options={[
                { v: "jpg", label: "JPG" },
                { v: "png", label: "PNG" },
              ]}
            />
            <Tag accent={A}>font ≈ width ÷ 7 · auto-shrinks past 3 lines</Tag>
          </Row>
          <Note>Classic Impact style: forced uppercase, white fill, rounded black stroke. Long lines wrap and the font steps down until everything fits.</Note>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ 7. Round avatar maker ---------------------- */

export function AvatarMakerTool() {
  const A = accentOf(6);
  const OUT = 512;
  const { img, fileName, err, load } = useImgFile();
  const [ring, setRing] = useState(16);
  const [ringColor, setRingColor] = useState("#C6F24E");
  const [bgOn, setBgOn] = useState(false);
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img) return;
    cv.width = OUT;
    cv.height = OUT;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, OUT, OUT);
    if (bgOn) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, OUT, OUT);
    }
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2 - ring, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUT, OUT);
    ctx.restore();
    if (ring > 0) {
      ctx.beginPath();
      ctx.arc(OUT / 2, OUT / 2, OUT / 2 - ring / 2, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = ring;
      ctx.stroke();
    }
  }, [img, ring, ringColor, bgOn, bgColor]);

  const save = async () => {
    const cv = canvasRef.current;
    if (!cv) return;
    setBusy(true);
    try {
      download(await toBlob(cv, "image/png"), `${baseName(fileName) || "avatar"}-avatar.png`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px · center square used` : ""} accent={A} onFile={load} label="Pick a portrait or logo" />
      <ErrNote msg={err} />
      <Panel title="preview · 512 × 512 export" accent={A}>
        <div className="flex flex-col items-center gap-4 py-2">
          <canvas ref={canvasRef} className="h-56 w-56 max-w-full rounded-full border border-zinc-800 bg-zinc-950" />
          {img ? (
            <Btn accent={A} onClick={() => void save()} disabled={busy}>
              <Download className="h-3.5 w-3.5" aria-hidden /> {busy ? "Saving…" : "Download PNG"}
            </Btn>
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">circle crop · center square</p>
          )}
        </div>
      </Panel>
      <Grid cols={3}>
        <Slider label="Ring width" value={ring} onChange={setRing} min={0} max={48} suffix="px" accent={A} />
        <ColorField label="Ring color" value={ringColor} onChange={setRingColor} />
        <div className="space-y-2">
          <Check label="Fill background corners" checked={bgOn} onChange={setBgOn} />
          {bgOn ? <ColorField label="Background color" value={bgColor} onChange={setBgColor} /> : null}
        </div>
      </Grid>
      <Note>Exports a square 512px PNG — the corners stay transparent unless you fill a background, so it drops cleanly onto any avatar slot.</Note>
    </div>
  );
}

/* ------------------------------ 8. OG image generator ---------------------- */

function paintOg(ctx: CanvasRenderingContext2D, o: { title: string; subtitle: string; brand: string; accent: string; dark: boolean }) {
  const W = 1200;
  const H = 630;
  const bg = o.dark ? "#09090b" : "#fafafa";
  const fg = o.dark ? "#fafafa" : "#18181b";
  const mut = o.dark ? "#a1a1aa" : "#52525b";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = o.accent;
  ctx.fillRect(0, 0, 14, H);
  ctx.fillRect(80, 88, 40, 40);
  let size = 84;
  let lines: string[] = [];
  for (; size >= 40; size -= 4) {
    ctx.font = `800 ${size}px Arial, sans-serif`;
    lines = wrapLines(ctx, o.title.trim() || "Your headline here", W - 160).slice(0, 3);
    if (lines.length * size * 1.12 <= 270) break;
  }
  ctx.fillStyle = fg;
  ctx.textBaseline = "top";
  lines.forEach((ln, i) => ctx.fillText(ln, 80, 168 + i * size * 1.12));
  const after = 168 + lines.length * size * 1.12 + 24;
  ctx.font = "400 32px Arial, sans-serif";
  ctx.fillStyle = mut;
  wrapLines(ctx, o.subtitle.trim(), W - 160)
    .slice(0, 2)
    .forEach((ln, i) => ctx.fillText(ln, 80, after + i * 42));
  const bt = (o.brand.trim() || "zyric.tech").toUpperCase();
  ctx.font = "700 26px 'Courier New', monospace";
  const bw = ctx.measureText(bt).width;
  ctx.fillStyle = o.accent;
  ctx.fillRect(W - 80 - bw - 36, H - 90, 14, 36);
  ctx.fillStyle = o.dark ? "#d4d4d8" : "#3f3f46";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(bt, W - 80, H - 72);
  ctx.textAlign = "left";
}

export function OgImageTool() {
  const A = accentOf(7);
  const [title, setTitle] = useState("Tools that never phone home");
  const [subtitle, setSubtitle] = useState("12 canvas-powered image machines — crop, stamp, slice and remix, all inside the tab.");
  const [brand, setBrand] = useState("zyric.tech");
  const [accent, setAccent] = useState("#4ECDC4");
  const [dark, setDark] = useState(true);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = 1200;
    cv.height = 630;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    paintOg(ctx, { title, subtitle, brand, accent, dark });
  }, [title, subtitle, brand, accent, dark]);

  const save = async () => {
    const cv = canvasRef.current;
    if (!cv) return;
    setBusy(true);
    try {
      download(await toBlob(cv, "image/png"), "og-image.png");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="live preview · 1200 × 630" accent={A}>
            <canvas ref={canvasRef} className="h-auto w-full rounded" />
            <KV k="meta tag" v='<meta property="og:image" content="/og-image.png">' accent={A} />
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Panel title="card content" accent={A}>
              <Area label="Title" value={title} onChange={setTitle} rows={2} mono={false} />
              <div className="mt-3">
                <Area label="Subtitle" value={subtitle} onChange={setSubtitle} rows={2} mono={false} />
              </div>
              <div className="mt-3">
                <Field label="Corner brand tag" value={brand} onChange={setBrand} placeholder="yourdomain.com" />
              </div>
            </Panel>
            <Panel title="style" accent={A}>
              <Row>
                <ColorField label="Accent" value={accent} onChange={setAccent} />
                <Seg
                  value={dark ? "dark" : "light"}
                  onChange={(v) => setDark(v === "dark")}
                  accent={A}
                  options={[
                    { v: "dark", label: "Dark" },
                    { v: "light", label: "Light" },
                  ]}
                />
              </Row>
              <Row className="mt-3">
                <Btn accent={A} onClick={() => void save()} disabled={busy}>
                  <Share2 className="h-3.5 w-3.5" aria-hidden /> {busy ? "Rendering…" : "Download og-image.png"}
                </Btn>
              </Row>
            </Panel>
            <Note>The 1200×630 card is the size every platform crops for link previews. Title auto-shrinks to three lines; drop the PNG at your site root and point og:image at it.</Note>
          </div>
        }
      />
    </div>
  );
}

/* ------------------------------ 9. Blur & pixelate regions ----------------- */

function applyRegion(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cvW: number,
  cvH: number,
  k: number,
  r: Rect,
  mode: "blur" | "pixelate",
  strength: number,
) {
  const x = r.x * k;
  const y = r.y * k;
  const w = r.w * k;
  const h = r.h * k;
  if (w < 2 || h < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (mode === "pixelate") {
    const block = Math.max(2, Math.round(strength * k));
    const tw = Math.max(1, Math.round(w / block));
    const th = Math.max(1, Math.round(h / block));
    const tmp = document.createElement("canvas");
    tmp.width = tw;
    tmp.height = th;
    const tctx = tmp.getContext("2d");
    if (tctx) {
      tctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, tw, th);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, tw, th, x, y, w, h);
      ctx.imageSmoothingEnabled = true;
    }
  } else {
    ctx.filter = `blur(${Math.max(1, (strength * k) / 2)}px)`;
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, cvW, cvH);
    ctx.filter = "none";
  }
  ctx.restore();
}

function paintRedactPreview(cv: HTMLCanvasElement, src: DrawSrc, img: HTMLImageElement, rects: Rect[], draft: Rect | null, k: number, mode: "blur" | "pixelate", strength: number, accent: string) {
  cv.width = src.width;
  cv.height = src.height;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(src, 0, 0);
  for (const r of rects) applyRegion(ctx, img, cv.width, cv.height, k, r, mode, strength);
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = accent;
  for (const r of rects) ctx.strokeRect(r.x * k, r.y * k, r.w * k, r.h * k);
  if (draft) ctx.strokeRect(draft.x * k, draft.y * k, draft.w * k, draft.h * k);
  ctx.setLineDash([]);
}

function RegionList({ rects, onDelete }: { rects: Rect[]; onDelete: (i: number) => void }) {
  return (
    <div>
      {rects.map((r, i) => (
        <div key={`${i}-${r.x}-${r.y}`} className="flex items-center justify-between gap-2 border-b border-zinc-800/60 py-1.5">
          <span className="font-mono text-[10px] text-zinc-500">
            #{i + 1} · {Math.round(r.w)}×{Math.round(r.h)} @ {Math.round(r.x)},{Math.round(r.y)}
          </span>
          <button
            type="button"
            onClick={() => onDelete(i)}
            className="text-zinc-600 transition-colors hover:text-red-400"
            aria-label={`Remove region ${i + 1}`}
          >
            <Eraser className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

export function PixelateRegionTool() {
  const A = accentOf(8);
  const { img, fileName, err, load } = useImgFile();
  const [rects, setRects] = useState<Rect[]>([]);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [mode, setMode] = useState<"blur" | "pixelate">("pixelate");
  const [strength, setStrength] = useState(14);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<{ sx: number; sy: number } | null>(null);
  const draftRef = useRef<Rect | null>(null);
  const preview = useMemo(() => (img ? cappedCanvas(img, 1000) : null), [img]);
  const k = img && preview ? preview.width / img.width : 1;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img || !preview) return;
    paintRedactPreview(cv, preview, img, rects, draft, k, mode, strength, A);
  }, [img, preview, rects, draft, mode, strength, k, A]);

  const toImgPt = (e: RPointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const cv = canvasRef.current;
    if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / Math.max(1, r.width)) * cv.width / k,
      y: ((e.clientY - r.top) / Math.max(1, r.height)) * cv.height / k,
    };
  };

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!img) return;
    const p = toImgPt(e);
    drawing.current = { sx: p.x, sy: p.y };
    const r0 = { x: p.x, y: p.y, w: 0, h: 0 };
    draftRef.current = r0;
    setDraft(r0);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ok */
    }
  };

  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    const d = drawing.current;
    if (!d) return;
    const p = toImgPt(e);
    const r = { x: Math.min(d.sx, p.x), y: Math.min(d.sy, p.y), w: Math.abs(p.x - d.sx), h: Math.abs(p.y - d.sy) };
    draftRef.current = r;
    setDraft(r);
  };

  const onUp = () => {
    drawing.current = null;
    const d = draftRef.current;
    draftRef.current = null;
    setDraft(null);
    if (d && d.w >= 4 && d.h >= 4) setRects((p) => [...p, d]);
  };

  const save = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      for (const r of rects) applyRegion(ctx, img, cv.width, cv.height, 1, r, mode, strength);
      download(await toBlob(cv, "image/png"), `${baseName(fileName)}-redacted.png`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px` : ""} accent={A} onFile={(f) => { setRects([]); load(f); }} label="Pick an image to redact" />
      <ErrNote msg={err} />
      {img && preview ? (
        <Split
          left={
            <Panel title="drag to box a region" accent={A}>
              <canvas
                ref={canvasRef}
                className="h-auto max-w-full cursor-crosshair touch-none"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
              />
            </Panel>
          }
          right={
            <div className="space-y-3">
              <Panel title="pass" accent={A}>
                <Seg
                  value={mode}
                  onChange={setMode}
                  accent={A}
                  options={[
                    { v: "pixelate", label: "Pixelate" },
                    { v: "blur", label: "Blur" },
                  ]}
                />
                <div className="mt-3 max-w-[280px]">
                  <Slider label={mode === "pixelate" ? "Block size" : "Blur radius"} value={strength} onChange={setStrength} min={4} max={48} suffix="px" accent={A} />
                </div>
                <Row className="mt-3">
                  <Btn accent={A} onClick={() => void save()} disabled={busy || !rects.length}>
                    <Wand2 className="h-3.5 w-3.5" aria-hidden /> {busy ? "Rendering…" : "Download PNG"}
                  </Btn>
                </Row>
              </Panel>
              <Panel title={`regions · ${rects.length}`} accent={A}>
                {rects.length === 0 ? (
                  <p className="text-xs text-zinc-600">Drag on the image to box faces, plates or keys. One pass re-renders every region.</p>
                ) : (
                  <RegionList rects={rects} onDelete={(i) => setRects((p) => p.filter((_, j) => j !== i))} />
                )}
                {rects.length ? (
                  <Row className="mt-2">
                    <Btn variant="ghost" accent={A} onClick={() => setRects([])}>
                      <Eraser className="h-3.5 w-3.5" aria-hidden /> Clear all
                    </Btn>
                  </Row>
                ) : null}
              </Panel>
              <Note>Rectangles are stored in original pixel coordinates, so the exported PNG censors at full resolution — block size and radius scale with it.</Note>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

/* ------------------------------ 10. Photo color picker --------------------- */

function extractPalette(img: HTMLImageElement): { hex: string; share: number }[] {
  const s = Math.min(1, 220 / Math.max(img.width, img.height));
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(img.width * s));
  cv.height = Math.max(1, Math.round(img.height * s));
  const ctx = cv.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    total++;
    const key = ((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5);
    const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    b.n++;
    b.r += d[i];
    b.g += d[i + 1];
    b.b += d[i + 2];
    buckets.set(key, b);
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
    .map((b) => ({ hex: rgbHex(b.r / b.n, b.g / b.n, b.b / b.n), share: total ? b.n / total : 0 }));
}

function hexLum(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function Swatch({ p, copied, onCopy }: { p: { hex: string; share: number }; copied: boolean; onCopy: () => void }) {
  const light = hexLum(p.hex) > 140;
  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex h-20 min-w-0 flex-col items-center justify-center rounded-md border border-zinc-800 transition-transform hover:scale-[1.03]"
      style={{ background: p.hex }}
      title={`Copy ${p.hex.toUpperCase()}`}
    >
      <span className="font-mono text-[11px] font-bold" style={{ color: light ? "#0a0a0a" : "#fafafa" }}>
        {copied ? "COPIED" : p.hex.toUpperCase()}
      </span>
      <span className="font-mono text-[9px]" style={{ color: light ? "rgba(10,10,10,0.6)" : "rgba(250,250,250,0.6)" }}>
        {(p.share * 100).toFixed(1)}%
      </span>
    </button>
  );
}

function makeSampler(im: HTMLImageElement): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = im.width;
  cv.height = im.height;
  const ctx = cv.getContext("2d");
  if (ctx) ctx.drawImage(im, 0, 0);
  return cv;
}

export function PhotoPaletteTool() {
  const A = accentOf(9);
  const { img, fileName, err, setImg, setFileName, setErr } = useImgFile();
  const [palette, setPalette] = useState<{ hex: string; share: number }[]>([]);
  const [picked, setPicked] = useState("");
  const [copied, setCopied] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampler = useRef<HTMLCanvasElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preview = useMemo(() => (img ? cappedCanvas(img, 900) : null), [img]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !preview) return;
    cv.width = preview.width;
    cv.height = preview.height;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(preview, 0, 0);
  }, [preview]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onFile = (f: File) => {
    setErr("");
    setPicked("");
    setCopied("");
    loadImage(f)
      .then((im) => {
        setImg(im);
        setFileName(f.name);
        setPalette(extractPalette(im));
        sampler.current = makeSampler(im);
      })
      .catch((e: Error) => {
        setImg(null);
        setErr(e.message);
      });
  };

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase());
    } catch {
      /* clipboard blocked — value still shown below */
    }
    setCopied(hex);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 1400);
  };

  const onPick = (e: RMouseEvent<HTMLCanvasElement>) => {
    const cv = sampler.current;
    const pv = canvasRef.current;
    if (!cv || !pv) return;
    const r = pv.getBoundingClientRect();
    const x = Math.max(0, Math.min(cv.width - 1, Math.floor(((e.clientX - r.left) / Math.max(1, r.width)) * cv.width)));
    const y = Math.max(0, Math.min(cv.height - 1, Math.floor(((e.clientY - r.top) / Math.max(1, r.height)) * cv.height)));
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const d = ctx.getImageData(x, y, 1, 1).data;
    setPicked(rgbHex(d[0], d[1], d[2]));
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px` : ""} accent={A} onFile={onFile} label="Pick a photo to sample" />
      <ErrNote msg={err} />
      {img && preview ? (
        <>
          <Panel title="dominant palette · click a swatch to copy" accent={A}>
            <Grid cols={4}>
              {palette.map((p) => (
                <Swatch key={p.hex} p={p} copied={copied === p.hex} onCopy={() => void copyHex(p.hex)} />
              ))}
            </Grid>
          </Panel>
          <Split
            left={
              <Panel title="eyedropper · click the photo" accent={A}>
                <canvas ref={canvasRef} className="h-auto max-w-full cursor-crosshair" onClick={onPick} />
              </Panel>
            }
            right={
              <Panel title="picked pixel" accent={A}>
                {picked ? (
                  <>
                    <div className="flex h-24 items-center justify-center rounded-md border border-zinc-800" style={{ background: picked }}>
                      <span className="font-mono text-sm font-bold" style={{ color: hexLum(picked) > 140 ? "#0a0a0a" : "#fafafa" }}>
                        {picked.toUpperCase()}
                      </span>
                    </div>
                    <Row className="mt-3">
                      <Btn accent={A} onClick={() => void copyHex(picked)}>
                        {copied === picked ? "Copied!" : "Copy hex"}
                      </Btn>
                    </Row>
                  </>
                ) : (
                  <p className="text-xs text-zinc-600">Click anywhere on the photo to sample that exact pixel.</p>
                )}
                <KV k="source" v={fileName} />
                <KV k="palette" v={`${palette.length} buckets`} accent={A} />
              </Panel>
            }
          />
          <Note>Colors are quantized into 512 RGB buckets right on your device; each swatch shows its share of the image. Click-to-copy writes straight to your clipboard.</Note>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ 11. Photo framer --------------------------- */

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function paintFrame(cv: HTMLCanvasElement, src: DrawSrc, o: { bw: number; color: string; polaroid: boolean; rounded: boolean }) {
  const iw = src.width;
  const ih = src.height;
  const pad = Math.max(2, Math.round(o.bw));
  const bottom = o.polaroid ? pad * 3 : pad;
  const W = iw + pad * 2;
  const H = ih + pad + bottom;
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = o.color;
  if (o.rounded) {
    roundedPath(ctx, 0, 0, W, H, Math.min(34, pad + 6));
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, W, H);
  }
  if (o.rounded) {
    ctx.save();
    roundedPath(ctx, pad, pad, iw, ih, Math.max(0, Math.min(28, pad - 4)));
    ctx.clip();
    ctx.drawImage(src, pad, pad);
    ctx.restore();
  } else {
    ctx.drawImage(src, pad, pad);
  }
}

export function ImageFrameTool() {
  const A = accentOf(10);
  const { img, fileName, err, load } = useImgFile();
  const [style, setStyle] = useState<"solid" | "polaroid">("solid");
  const [bw, setBw] = useState(24);
  const [color, setColor] = useState("#fafafa");
  const [rounded, setRounded] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = useObjectUrl(blob);
  const preview = useMemo(() => (img ? cappedCanvas(img, 760) : null), [img]);
  const opts = { bw, color, polaroid: style === "polaroid", rounded };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img || !preview) return;
    paintFrame(cv, preview, { ...opts, bw: Math.max(2, bw * (preview.width / img.width)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, preview, style, bw, color, rounded]);

  const save = async () => {
    if (!img) return;
    const cv = document.createElement("canvas");
    paintFrame(cv, img, opts);
    setBlob(await toBlob(cv, "image/png"));
  };

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px` : ""} accent={A} onFile={(f) => { setBlob(null); load(f); }} label="Pick a photo to frame" />
      <ErrNote msg={err} />
      {img && preview ? (
        <>
          <Panel title="frame" accent={A}>
            <Row>
              <Seg
                value={style}
                onChange={setStyle}
                accent={A}
                options={[
                  { v: "solid", label: "Solid" },
                  { v: "polaroid", label: "Polaroid" },
                ]}
              />
              <div className="min-w-[180px] max-w-[280px] flex-1">
                <Slider label="Border width" value={bw} onChange={setBw} min={4} max={80} suffix="px" accent={A} />
              </div>
              <ColorField label="Border color" value={color} onChange={setColor} />
              <span className="pb-1">
                <Check label="Rounded" checked={rounded} onChange={setRounded} />
              </span>
            </Row>
            <KV k="export size" v={`${img.width + bw * 2} × ${img.height + bw + (style === "polaroid" ? bw * 3 : bw)} px`} accent={A} />
          </Panel>
          <Panel title="preview" accent={A}>
            <div className="rounded-lg bg-zinc-950/80 p-6">
              <canvas ref={canvasRef} className="mx-auto block h-auto max-w-full shadow-2xl" style={{ maxHeight: 420 }} />
            </div>
          </Panel>
          <Row>
            <Btn accent={A} onClick={() => void save()}>
              <Frame className="h-3.5 w-3.5" aria-hidden /> Render frame
            </Btn>
            {blob ? <Dl blob={blob} filename={`${baseName(fileName)}-framed.png`} accent={A} /> : null}
          </Row>
          <Note>Polaroid style thickens only the bottom edge, like the classic instant film. Rounded mode clips both the mat and the photo corners.</Note>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ 12. Image → ASCII -------------------------- */

const RAMP = " .:-=+*#%@";

export function ImageAsciiTool() {
  const A = accentOf(11);
  const { img, fileName, err, load } = useImgFile();
  const [cols, setCols] = useState(100);
  const [invert, setInvert] = useState(false);
  const thumbRef = useRef<HTMLCanvasElement>(null);

  const art = useMemo(() => {
    if (!img) return { text: "", rows: 0 };
    const rows = Math.max(1, Math.round((cols * img.height) / img.width / 2));
    const cv = document.createElement("canvas");
    cv.width = cols;
    cv.height = rows;
    const ctx = cv.getContext("2d");
    if (!ctx) return { text: "", rows: 0 };
    ctx.drawImage(img, 0, 0, cols, rows);
    const d = ctx.getImageData(0, 0, cols, rows).data;
    const out: string[] = [];
    for (let y = 0; y < rows; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        const idx = Math.round((invert ? 1 - lum : lum) * (RAMP.length - 1));
        line += RAMP[idx];
      }
      out.push(line);
    }
    return { text: out.join("\n"), rows };
  }, [img, cols, invert]);

  useEffect(() => {
    const cv = thumbRef.current;
    if (!cv || !img) return;
    const s = Math.min(1, 260 / Math.max(img.width, img.height));
    cv.width = Math.max(1, Math.round(img.width * s));
    cv.height = Math.max(1, Math.round(img.height * s));
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
  }, [img]);

  return (
    <div className="space-y-4">
      <DropRow fileName={fileName || null} sizeText={img ? `${img.width} × ${img.height} px` : ""} accent={A} onFile={load} label="Pick an image to rasterize into text" />
      <ErrNote msg={err} />
      {img ? (
        <>
          <Panel title="engine" accent={A}>
            <Row>
              <div className="min-w-[200px] max-w-[280px] flex-1">
                <Slider label="Columns" value={cols} onChange={setCols} min={40} max={160} accent={A} />
              </div>
              <Seg
                value={invert ? "invert" : "normal"}
                onChange={(v) => setInvert(v === "invert")}
                accent={A}
                options={[
                  { v: "normal", label: "Normal" },
                  { v: "invert", label: "Invert" },
                ]}
              />
              <canvas ref={thumbRef} className="h-auto max-w-[120px] rounded border border-zinc-800" />
            </Row>
            <KV k="grid" v={`${cols} × ${art.rows} chars`} accent={A} />
          </Panel>
          <Out label={`ascii · ${fileName}`} text={art.text} rows={24} />
          <Note>Downsampled to the column count, each cell becomes one character by luminance — spaces are highlights, @ is shadow. Use invert for dark backgrounds.</Note>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ meta registry ------------------------------ */

export const imagePlusMeta: ToolMeta[] = [
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Drag a crop box or type exact pixels — free, 1:1, 4:5 or 16:9 presets with live dimmed preview.",
    category: "media",
    icon: Crop,
    keywords: "crop trim cut aspect ratio select region pixels",
    badge: "new",
    component: ImageCropperTool,
  },
  {
    id: "image-rotate",
    name: "Rotate & Flip",
    description: "Quarter-turn buttons, a −180°…180° free-angle dial and H/V mirrors with a live canvas preview.",
    category: "media",
    icon: RotateCw,
    keywords: "rotate flip mirror turn angle degrees spin",
    badge: "new",
    component: ImageRotateTool,
  },
  {
    id: "image-convert",
    name: "Format Converter",
    description: "PNG ↔ JPEG ↔ WebP with a quality dial — before/after sizes and the savings % as big stats.",
    category: "media",
    icon: Repeat,
    keywords: "convert webp jpeg png format encode compress transcode",
    badge: "new",
    component: ImageConvertTool,
  },
  {
    id: "image-splitter",
    name: "Grid Splitter",
    description: "Slice a photo into 2×2, 3×3 or 4×4 tiles and grab them all as one ZIP — Instagram-grid ready.",
    category: "media",
    icon: Grid2X2,
    keywords: "split grid tiles instagram puzzle slice mosaic zip",
    badge: "new",
    component: ImageSplitterTool,
  },
  {
    id: "watermark",
    name: "Watermark Stamper",
    description: "Stamp text with size, opacity, 9-grid placement and diagonal tiling, rendered live on canvas.",
    category: "media",
    icon: Stamp,
    keywords: "watermark text stamp copyright tile opacity brand protect",
    badge: "new",
    component: WatermarkTool,
  },
  {
    id: "meme",
    name: "Meme Forge",
    description: "Classic top/bottom Impact captions with auto-fit sizing, white fill and rounded black stroke.",
    category: "media",
    icon: Laugh,
    keywords: "meme impact caption top bottom text funny generator",
    badge: "new",
    component: MemeTool,
  },
  {
    id: "avatar-maker",
    name: "Round Avatar Maker",
    description: "Center circle-crop with an adjustable colored ring and optional background — exports a crisp 512px PNG.",
    category: "media",
    icon: CircleUser,
    keywords: "avatar profile picture circle ring round pfp crop",
    badge: "new",
    component: AvatarMakerTool,
  },
  {
    id: "og-image",
    name: "OG Image Generator",
    description: "Compose a 1200×630 social card — title, subtitle, accent color, dark/light and brand tag, live preview.",
    category: "media",
    icon: Share2,
    keywords: "og image social preview twitter card seo share link 1200 630",
    badge: "new",
    component: OgImageTool,
  },
  {
    id: "pixelate-region",
    name: "Blur & Pixelate Regions",
    description: "Drag rectangles over faces or plates, then blur or mosaic every region in one pass — per-region removal list.",
    category: "media",
    icon: Wand2,
    keywords: "blur pixelate censor mosaic hide redact region face privacy",
    badge: "new",
    component: PixelateRegionTool,
  },
  {
    id: "photo-palette",
    name: "Photo Color Picker",
    description: "Extract the 8 dominant colors of any photo with share %, click to copy hex, or eyedrop one exact pixel.",
    category: "media",
    icon: Palette,
    keywords: "palette colors hex eyedropper pick dominant swatch sample",
    badge: "new",
    component: PhotoPaletteTool,
  },
  {
    id: "image-frame",
    name: "Photo Framer",
    description: "Add a solid or polaroid border with width, color and rounded corners — classic instant-film bottom edge.",
    category: "media",
    icon: Frame,
    keywords: "frame border polaroid mat rounded photo edge",
    badge: "new",
    component: ImageFrameTool,
  },
  {
    id: "image-ascii",
    name: "Image → ASCII Art",
    description: "Rasterize any photo into monospace ASCII — 40–160 column dial, invert toggle, one-click copy.",
    category: "media",
    icon: Binary,
    keywords: "ascii art text characters mono retro luminance convert",
    badge: "new",
    component: ImageAsciiTool,
  },
];
