"use client";

import { useCallback, useRef, useState } from "react";
import {
  ImageDown,
  Scaling,
  FileCode2,
  Star,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Stat, inputCls, labelCls, CopyButton } from "./hooks";
import { fmtBytes } from "./signature-tools";

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      mime,
      quality
    );
  });
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

interface ImgResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  mime: string;
}

function useImageProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImgResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = useCallback(() => inputRef.current?.click(), []);

  const choose = (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
  };

  return { file, setFile, result, setResult, busy, setBusy, error, setError, inputRef, pick, choose };
}

function FilePickRow({
  file,
  onPick,
  onChoose,
  inputRef,
  label,
}: {
  file: File | null;
  onPick: () => void;
  onChoose: (f: File | undefined | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-4 transition-colors hover:border-zinc-500">
      <ImageDown className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">{file ? file.name : label}</p>
        <p className="text-xs text-zinc-500">{file ? fmtBytes(file.size) : "PNG, JPG, WebP — processed on your device"}</p>
      </div>
      <Button type="button" onClick={onPick} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
        {file ? "Change image" : "Choose image"}
      </Button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onChoose(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

/* ------------------------------- Image Compressor --------------------------- */

export function ImageCompressorTool() {
  const { file, result, setResult, busy, setBusy, error, setError, inputRef, choose } = useImageProcessor();
  const [quality, setQuality] = useState("70");
  const [format, setFormat] = useState("image/webp");

  const compress = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const blob = await canvasToBlob(canvas, format, Number(quality) / 100);
      setResult({ blob, url: URL.createObjectURL(blob), width: img.width, height: img.height, mime: format });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed");
    } finally {
      setBusy(false);
    }
  };

  const ext = format === "image/webp" ? "webp" : "jpg";

  return (
    <div className="space-y-4">
      <FilePickRow file={file} onPick={() => inputRef.current?.click()} onChoose={choose} inputRef={inputRef} label="Choose an image to shrink" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ic-q" className={labelCls}>Quality: {quality}%</Label>
          <input id="ic-q" type="range" min="10" max="95" step="5" value={quality} onChange={(e) => setQuality(e.target.value)} className="mt-2 h-2 w-full cursor-pointer accent-emerald-500" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ic-fmt" className={labelCls}>Output format</Label>
          <select id="ic-fmt" value={format} onChange={(e) => setFormat(e.target.value)} className={`${inputCls} h-9 w-full rounded-md border bg-zinc-900 px-2.5 text-sm`}>
            <option value="image/webp">WebP — smallest</option>
            <option value="image/jpeg">JPEG — universal</option>
          </select>
        </div>
      </div>

      <Button type="button" onClick={() => void compress()} disabled={!file || busy} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
        {busy ? "Compressing…" : "Compress"}
      </Button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && file && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Original" value={fmtBytes(file.size)} />
            <Stat label="Compressed" value={fmtBytes(result.blob.size)} />
            <Stat
              label="Saved"
              value={`${Math.max(0, Math.round((1 - result.blob.size / file.size) * 100))}%`}
              hint={`${result.width}×${result.height}`}
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <img src={result.url} alt="Compressed preview" className="mx-auto max-h-64 w-auto rounded-lg" />
          </div>
          <Button
            type="button"
            onClick={() => downloadBlob(result.blob, `${file.name.replace(/\.[^.]+$/, "")}-min.${ext}`)}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            <Download className="h-4 w-4" aria-hidden /> Download compressed ({fmtBytes(result.blob.size)})
          </Button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Image Resizer ---------------------------- */

const SIZE_PRESETS: { label: string; apply: (w: number, h: number) => [string, string] }[] = [
  { label: "25%", apply: (w, h) => [String(Math.round(w * 0.25)), String(Math.round(h * 0.25))] },
  { label: "50%", apply: (w, h) => [String(Math.round(w * 0.5)), String(Math.round(h * 0.5))] },
  { label: "Full HD (1920)", apply: (w, h) => ["1920", String(Math.round((1920 / w) * h))] },
  { label: "HD (1280)", apply: (w, h) => ["1280", String(Math.round((1280 / w) * h))] },
  { label: "Square 800", apply: () => ["800", "800"] },
  { label: "Thumbnail 300", apply: (w, h) => ["300", String(Math.round((300 / w) * h))] },
];

export function ImageResizerTool() {
  const { file, result, setResult, busy, setBusy, error, setError, inputRef, choose } = useImageProcessor();
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lock, setLock] = useState(true);
  const [fmt, setFmt] = useState("image/png");
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  const onChoose = async (f: File | undefined | null) => {
    choose(f);
    if (!f) return;
    try {
      const img = await loadBitmap(f);
      const w = "width" in img ? img.width : 0;
      const h = "height" in img ? img.height : 0;
      setNatural({ w, h });
      setWidth(String(w));
      setHeight(String(h));
    } catch {
      setError("Could not read this image");
    }
  };

  const resize = async () => {
    if (!file || !natural) return;
    const w = Math.max(1, Math.min(8000, Math.floor(Number(width) || 0)));
    const h = Math.max(1, Math.min(8000, Math.floor(Number(height) || 0)));
    if (!w || !h) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await canvasToBlob(canvas, fmt, 0.92);
      setResult({ blob, url: URL.createObjectURL(blob), width: w, height: h, mime: fmt });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resize failed");
    } finally {
      setBusy(false);
    }
  };

  const applyPct = (pct: number) => {
    if (!natural) return;
    setWidth(String(Math.round(natural.w * pct)));
    setHeight(String(Math.round(natural.h * pct)));
  };

  return (
    <div className="space-y-4">
      <FilePickRow file={file} onPick={() => inputRef.current?.click()} onChoose={(f) => void onChoose(f)} inputRef={inputRef} label="Choose an image to resize" />

      {natural && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  const [w, h] = p.apply(natural.w, natural.h);
                  setWidth(w);
                  setHeight(h);
                }}
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-600/50 hover:text-emerald-300"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="ir-w" className={labelCls}>Width (px)</Label>
              <Input id="ir-w" type="number" min="1" value={width} onChange={(e) => {
                setWidth(e.target.value);
                if (lock && natural) setHeight(String(Math.max(1, Math.round((Number(e.target.value) / natural.w) * natural.h))));
              }} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ir-h" className={labelCls}>Height (px)</Label>
              <Input id="ir-h" type="number" min="1" value={height} onChange={(e) => {
                setHeight(e.target.value);
                if (lock && natural) setWidth(String(Math.max(1, Math.round((Number(e.target.value) / natural.h) * natural.w))));
              }} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
              <Switch checked={lock} onCheckedChange={setLock} aria-label="Lock aspect ratio" /> Lock ratio
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ir-fmt" className={labelCls}>Format</Label>
            <select id="ir-fmt" value={fmt} onChange={(e) => setFmt(e.target.value)} className={`${inputCls} h-9 rounded-md border bg-zinc-900 px-2.5 text-sm`}>
              <option value="image/png">PNG — lossless</option>
              <option value="image/jpeg">JPEG — smaller</option>
              <option value="image/webp">WebP — smallest</option>
            </select>
          </div>

          <Button type="button" onClick={() => void resize()} disabled={busy} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-40">
            <Scaling className="h-4 w-4" aria-hidden /> {busy ? "Resizing…" : "Resize image"}
          </Button>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && file && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="New size" value={`${result.width}×${result.height}`} />
            <Stat label="Original" value={fmtBytes(file.size)} />
            <Stat label="New file" value={fmtBytes(result.blob.size)} />
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <img src={result.url} alt="Resized preview" className="mx-auto max-h-64 w-auto rounded-lg" />
          </div>
          <Button
            type="button"
            onClick={() => downloadBlob(result.blob, `${file.name.replace(/\.[^.]+$/, "")}-${result.width}x${result.height}.${fmt.split("/")[1]}`)}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            <Download className="h-4 w-4" aria-hidden /> Download resized image
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Image to Base64 ---------------------------- */

export function ImageBase64Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onChoose = (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setDataUrl(String(reader.result ?? ""));
    reader.readAsDataURL(f);
  };

  const imgTag = dataUrl ? `<img src="${dataUrl}" alt="" width="auto" />` : "";
  const cssBg = dataUrl ? `background-image: url("${dataUrl}");` : "";

  return (
    <div className="space-y-4">
      <FilePickRow file={file} onPick={() => inputRef.current?.click()} onChoose={onChoose} inputRef={inputRef} label="Choose an image to convert" />

      {file && dataUrl && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="File size" value={fmtBytes(file.size)} />
            <Stat label="Base64 size" value={fmtBytes(dataUrl.length)} />
            <Stat label="Overhead" value={`${Math.round((dataUrl.length / file.size - 1) * 100)}%`} hint="Base64 adds ~33%" />
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <img src={dataUrl} alt="Preview" className="mx-auto max-h-52 w-auto rounded-lg" />
          </div>

          {[
            { label: "Data URL", value: dataUrl, mono: true },
            { label: "HTML <img> tag", value: imgTag, mono: true },
            { label: "CSS background", value: cssBg, mono: true },
          ].map((blk) => (
            <div key={blk.label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{blk.label}</p>
                <CopyButton text={blk.value} label="Copy" />
              </div>
              <pre className="max-h-28 overflow-y-auto break-all whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-400">
                {blk.value.slice(0, 4000)}
                {blk.value.length > 4000 ? "\n… (copied version contains everything)" : ""}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Favicon Generator -------------------------- */

const FAV_SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 512];

export function FaviconTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pack, setPack] = useState<{ size: number; url: string }[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const generate = async (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    setError("");
    try {
      const img = await loadBitmap(f);
      const outs: { size: number; url: string }[] = [];
      for (const size of FAV_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        const side = Math.min("width" in img ? img.width : 0, "height" in img ? img.height : 0);
        const sx = ((img.width - side) / 2);
        const sy = ((img.height - side) / 2);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        outs.push({ size, url: canvas.toDataURL("image/png") });
      }
      setPack(outs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process this image");
    }
  };

  const downloadPng = (size: number) => {
    const a = document.createElement("a");
    a.href = pack.find((p) => p.size === size)?.url ?? "";
    a.download = `favicon-${size}x${size}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <FilePickRow file={file} onPick={() => inputRef.current?.click()} onChoose={(f) => void generate(f)} inputRef={inputRef} label="Choose a square logo (PNG/SVG best)" />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {pack.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {pack.map((p) => (
              <div key={p.size} className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <img src={p.url} alt={`${p.size}px favicon`} className="rounded bg-zinc-800" width={Math.min(p.size, 64)} height={Math.min(p.size, 64)} style={{ width: Math.min(p.size, 64), height: Math.min(p.size, 64) }} />
                <p className="text-[11px] text-zinc-500">{p.size}×{p.size}</p>
                <button
                  type="button"
                  onClick={() => downloadPng(p.size)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                >
                  <Download className="h-3 w-3" aria-hidden /> PNG
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Star className="h-4 w-4 text-amber-400" aria-hidden /> Put this in your &lt;head&gt;
            </p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950/60 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
{`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">`}
            </pre>
            <p className="mt-2 text-xs text-zinc-600">Tip: 32×32 covers browsers, 180×180 covers iOS home screens, 512×512 is the PWA/install size.</p>
          </div>
        </>
      )}
    </div>
  );
}
