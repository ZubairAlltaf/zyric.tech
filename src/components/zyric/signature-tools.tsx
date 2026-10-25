"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileUp,
  ShieldAlert,
  FileCheck2,
  Download,
  ScanSearch,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Stat, inputCls, labelCls } from "./hooks";

/* ----------------------------- shared helpers ------------------------------ */

export function fmtBytes(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

function parseExtList(s: string): string[] {
  return s
    .split(/[,\s]+/)
    .map((x) => x.replace(/^\./, "").trim().toLowerCase())
    .filter(Boolean);
}

function downloadText(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function readSlice(file: File, start: number, end: number): Promise<Uint8Array> {
  const buf = await file.slice(start, end).arrayBuffer();
  return new Uint8Array(buf);
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function shannonEntropy(bytes: Uint8Array): number {
  const freq = new Array<number>(256).fill(0);
  for (let i = 0; i < bytes.length; i++) freq[bytes[i]]++;
  let H = 0;
  for (const f of freq) {
    if (f === 0) continue;
    const p = f / bytes.length;
    H -= p * Math.log2(p);
  }
  return H;
}

function hexAt(b: Uint8Array, offset: number, len: number): string {
  return Array.from(b.slice(offset, offset + len))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join(" ");
}

function asciiAt(b: Uint8Array, offset: number, len: number): string {
  return Array.from(b.slice(offset, offset + len))
    .map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : "·"))
    .join("");
}

/* --------------------------- File Submission Checker ------------------------ */

interface FileVerdict {
  name: string;
  size: number;
  ok: boolean;
  reasons: string[];
}

export function SubmissionCheckerTool() {
  const [required, setRequired] = useState("pdf");
  const [allowed, setAllowed] = useState("pdf, jpg, jpeg, png, docx");
  const [maxSize, setMaxSize] = useState("10");
  const [maxTotal, setMaxTotal] = useState("50");
  const [minFiles, setMinFiles] = useState("1");
  const [namePattern, setNamePattern] = useState("");
  const [noDupes, setNoDupes] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const verdicts: FileVerdict[] = useMemo(() => {
    const req = parseExtList(required);
    const allow = parseExtList(allowed);
    const maxB = (Number(maxSize) || 0) * 1024 * 1024;
    const maxTotB = (Number(maxTotal) || 0) * 1024 * 1024;
    let re: RegExp | null = null;
    if (namePattern.trim()) {
      try {
        re = new RegExp(namePattern.trim(), "i");
      } catch {
        re = null;
      }
    }
    const seen = new Set<string>();
    const results: FileVerdict[] = [];
    const preTotalFail = files.reduce((s, f) => s + f.size, 0) > maxTotB;

    for (const f of files) {
      const reasons: string[] = [];
      const ext = extOf(f.name);

      if (allow.length > 0 && !allow.includes(ext))
        reasons.push(`Extension “.${ext || "(none)"}” is not in the allowed list`);
      if (maxB > 0 && f.size > maxB)
        reasons.push(`Too large (${fmtBytes(f.size)} > limit ${fmtBytes(maxB)})`);
      if (f.size === 0) reasons.push("File is empty (0 bytes) — likely corrupted or not saved properly");
      if (re && !re.test(f.name))
        reasons.push(`Name doesn't match the required pattern “${namePattern.trim()}”`);
      const key = `${f.name.toLowerCase()}:${f.size}`;
      if (noDupes && seen.has(key)) reasons.push(`Duplicate of an earlier file with the same name & size`);
      seen.add(key);
      if (preTotalFail) reasons.push(`Batch exceeds the total size limit (${fmtBytes(maxTotB)})`);

      results.push({ name: f.name, size: f.size, ok: reasons.length === 0, reasons });
    }

    if (files.length < (Number(minFiles) || 1)) {
      for (const r of results) r.reasons.push(`Not enough files — this submission requires at least ${minFiles}`);
    }
    return results;
  }, [files, required, allowed, maxSize, maxTotal, minFiles, namePattern, noDupes]);

  const missingRequired = useMemo(() => {
    const req = parseExtList(required);
    if (files.length === 0 || req.length === 0) return [];
    return req.filter((r) => !files.some((f) => extOf(f.name) === r));
  }, [files, required]);

  const passed = verdicts.filter((v) => v.ok).length;
  const failed = verdicts.length - passed;
  const regexBad = namePattern.trim().length > 0;

  const report = useMemo(() => {
    const lines = [
      "# File Submission Report",
      "",
      `Checked: ${new Date().toLocaleString()}`,
      `Files: ${verdicts.length} · Passed: ${passed} · Failed: ${failed}`,
      "",
    ];
    for (const v of verdicts) {
      lines.push(`## ${v.ok ? "PASS" : "FAIL"} — ${v.name} (${fmtBytes(v.size)})`);
      if (v.reasons.length === 0) lines.push("- All checks passed");
      for (const r of v.reasons) lines.push(`- ${r}`);
      lines.push("");
    }
    return lines.join("\n");
  }, [verdicts, passed, failed]);

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    setFiles((prev) => [...prev, ...Array.from(fl)]);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sc-req" className={labelCls}>Required file types (one per file is checked)</Label>
          <Input id="sc-req" value={required} onChange={(e) => setRequired(e.target.value)} className={inputCls} placeholder="pdf" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-allow" className={labelCls}>Allowed extensions</Label>
          <Input id="sc-allow" value={allowed} onChange={(e) => setAllowed(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sc-max" className={labelCls}>Max size per file (MB)</Label>
            <Input id="sc-max" type="number" min="0" step="any" value={maxSize} onChange={(e) => setMaxSize(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sc-tot" className={labelCls}>Max total size (MB)</Label>
            <Input id="sc-tot" type="number" min="0" step="any" value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sc-min" className={labelCls}>Minimum number of files</Label>
          <Input id="sc-min" type="number" min="0" value={minFiles} onChange={(e) => setMinFiles(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sc-pat" className={labelCls}>Filename pattern (optional regex, e.g. ^Assignment1_)</Label>
          <Input id="sc-pat" value={namePattern} onChange={(e) => setNamePattern(e.target.value)} className={inputCls} placeholder="Leave empty to skip this check" />
          {regexBad && (() => {
            try {
              new RegExp(namePattern.trim(), "i");
              return null;
            } catch {
              return (
                <p className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3" aria-hidden /> Invalid regular expression — this check is skipped
                </p>
              );
            }
          })()}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium text-zinc-200">Flag duplicate files</p>
            <p className="text-xs text-zinc-500">Same filename and exact same size appearing twice</p>
          </div>
          <Switch checked={noDupes} onCheckedChange={setNoDupes} aria-label="Flag duplicate files" />
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Add files to check"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-500"
        }`}
      >
        <FileUp className="h-8 w-8 text-emerald-400" aria-hidden />
        <p className="text-sm font-medium text-zinc-200">Drop your submission files here or click to browse</p>
        <p className="text-xs text-zinc-500">Nothing is uploaded — file names &amp; sizes are checked on your device</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <>
          {missingRequired.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
              <span>
                <b>Missing required file{missingRequired.length === 1 ? "" : "s"}:</b> {missingRequired.map((m) => `.${m}`).join(", ")} — add{" "}
                {missingRequired.length === 1 ? "it" : "them"} before submitting.
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Files" value={String(files.length)} />
            <Stat label="Passed" value={String(passed)} />
            <Stat label="Failed" value={String(failed)} />
            <Stat label="Total size" value={fmtBytes(files.reduce((s, f) => s + f.size, 0))} />
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {verdicts.map((v, i) => (
              <div
                key={`${v.name}-${i}`}
                className={`rounded-xl border p-3.5 ${
                  v.ok ? "border-emerald-800/50 bg-emerald-950/20" : "border-red-900/50 bg-red-950/20"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {v.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{v.name}</p>
                    <p className="text-xs text-zinc-500">{fmtBytes(v.size)} · .{extOf(v.name) || "no extension"}</p>
                    {v.reasons.map((r, j) => (
                      <p key={j} className="mt-1 text-xs leading-relaxed text-red-300">{r}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => downloadText("submission-report.md", report, "text/markdown")}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              <Download className="h-4 w-4" aria-hidden /> Download pass/fail report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiles([])}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Clear files
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* --------------------------- Before-You-Open Inspector ---------------------- */

interface SigDef {
  name: string;
  exts: string[];
  test: (b: Uint8Array) => boolean;
  note?: string;
}

const SIGS: SigDef[] = [
  { name: "JPEG image", exts: ["jpg", "jpeg"], test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { name: "PNG image", exts: ["png"], test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { name: "GIF image", exts: ["gif"], test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  { name: "WebP image", exts: ["webp"], test: (b) => asciiAt(b, 0, 4) === "RIFF" && asciiAt(b, 8, 4) === "WEBP" },
  { name: "BMP image", exts: ["bmp"], test: (b) => b[0] === 0x42 && b[1] === 0x4d },
  { name: "ICO icon", exts: ["ico"], test: (b) => b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0 },
  { name: "PDF document", exts: ["pdf"], test: (b) => asciiAt(b, 0, 4) === "%PDF" },
  { name: "ZIP archive", exts: ["zip", "docx", "xlsx", "pptx", "jar", "apk", "odt", "ods"], note: "ZIP container — could also be DOCX, XLSX, PPTX, JAR or APK", test: (b) => b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5 || b[2] === 7) },
  { name: "RAR archive", exts: ["rar"], test: (b) => asciiAt(b, 0, 4) === "Rar!" },
  { name: "7-Zip archive", exts: ["7z"], test: (b) => b[0] === 0x37 && b[1] === 0x7a && b[2] === 0xbc && b[3] === 0xaf },
  { name: "GZIP archive", exts: ["gz", "tgz"], test: (b) => b[0] === 0x1f && b[1] === 0x8b },
  { name: "BZIP2 archive", exts: ["bz2"], test: (b) => b[0] === 0x42 && b[1] === 0x5a && b[2] === 0x68 },
  { name: "MP4 / MOV video", exts: ["mp4", "mov", "m4a"], test: (b) => asciiAt(b, 4, 4) === "ftyp" },
  { name: "WebM / MKV video", exts: ["webm", "mkv"], test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  { name: "AVI video", exts: ["avi"], test: (b) => asciiAt(b, 0, 4) === "RIFF" && asciiAt(b, 8, 4) === "AVI " },
  { name: "MP3 audio", exts: ["mp3"], test: (b) => asciiAt(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) },
  { name: "WAV audio", exts: ["wav"], test: (b) => asciiAt(b, 0, 4) === "RIFF" && asciiAt(b, 8, 4) === "WAVE" },
  { name: "OGG audio/video", exts: ["ogg", "opus"], test: (b) => asciiAt(b, 0, 4) === "OggS" },
  { name: "FLAC audio", exts: ["flac"], test: (b) => asciiAt(b, 0, 4) === "fLaC" },
  { name: "Windows executable", exts: ["exe", "dll", "sys"], note: "Program file — run only if you fully trust the source", test: (b) => b[0] === 0x4d && b[1] === 0x5a },
  { name: "Linux / macOS executable", exts: ["bin", "so", "elf"], note: "Native program file — do not run unless trusted", test: (b) => b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46 },
  { name: "SQLite database", exts: ["sqlite", "db"], test: (b) => asciiAt(b, 0, 6) === "SQLite" },
  { name: "RTF document", exts: ["rtf"], test: (b) => asciiAt(b, 0, 5) === "{\\rtf" },
  { name: "XML / SVG document", exts: ["xml", "svg"], test: (b) => /^\s*<\?xml|^\s*<svg/m.test(new TextDecoder().decode(b.slice(0, 256))) },
];

const TEXT_RISKY = /\.(exe|msi|bat|cmd|scr|vbs|ps1|sh|jar|lnk|reg|hta|iso|img|dll)$/i;

interface ZipEntry {
  name: string;
  size: number;
}

async function listZipEntries(file: File): Promise<ZipEntry[]> {
  const tailSize = Math.min(file.size, 65536);
  const tail = await readSlice(file, file.size - tailSize, file.size);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return [];
  const dv = new DataView(tail.buffer, tail.byteOffset);
  const count = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  if (cdOffset >= file.size || count === 0) return [];
  const cdSize = Math.min(dv.getUint32(eocd + 12, true) || 4 * 1024 * 1024, 4 * 1024 * 1024);
  const cd = await readSlice(file, cdOffset, Math.min(cdOffset + cdSize, file.size));
  const entries: ZipEntry[] = [];
  let p = 0;
  for (let i = 0; i < Math.min(count, 500); i++) {
    if (p + 46 > cd.length || cd[p] !== 0x50 || cd[p + 1] !== 0x4b || cd[p + 2] !== 0x01 || cd[p + 3] !== 0x02) break;
    const edv = new DataView(cd.buffer, cd.byteOffset);
    const nameLen = edv.getUint16(p + 28, true);
    const extraLen = edv.getUint16(p + 30, true);
    const commentLen = edv.getUint16(p + 32, true);
    const size = edv.getUint32(p + 24, true);
    const name = new TextDecoder().decode(cd.slice(p + 46, p + 46 + nameLen));
    entries.push({ name, size });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function looksLikeText(b: Uint8Array): boolean {
  const sample = b.slice(0, Math.min(b.length, 2048));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) suspicious++;
  }
  return suspicious / Math.max(sample.length, 1) < 0.05;
}

export function FileInspectorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    sig: SigDef | null;
    hexHead: string;
    asciiHead: string;
    hash: string;
    entropy: number;
    zip: ZipEntry[];
    textPreview: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(async (f: File) => {
    setBusy(true);
    setFile(f);
    try {
      const head = await readSlice(f, 0, Math.min(f.size, 65536));
      const sig = SIGS.find((s) => s.test(head)) ?? null;
      const hash = f.size <= 200 * 1024 * 1024 ? await sha256Hex(f).catch(() => "—") : "— file too large to hash —";
      const entropy = shannonEntropy(head);
      const zip = f.size > 100 ? await listZipEntries(f).catch(() => []) : [];
      const isText = !sig && looksLikeText(head);
      const textPreview = isText
        ? new TextDecoder().decode(head.slice(0, 1200)).replace(/\s+$/g, "")
        : "";
      setResult({
        sig,
        hexHead: hexAt(head, 0, 16),
        asciiHead: asciiAt(head, 0, 16),
        hash,
        entropy,
        zip,
        textPreview,
      });
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const declared = file ? extOf(file.name) : "";
  const sigExts = result?.sig?.exts ?? [];
  const matched = result?.sig ? sigExts.includes(declared) : false;
  const riskyName = file ? TEXT_RISKY.test(file.name) : false;
  const zipDanger = (result?.zip ?? []).filter((e) => /\.(exe|bat|cmd|scr|vbs|ps1|sh|msi|jar|js|vbe|wsf)$/i.test(e.name));
  const nestedArchives = (result?.zip ?? []).filter((e) => /\.(zip|rar|7z|gz|tar)$/i.test(e.name));

  return (
    <div className="space-y-5">
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a file to inspect"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-10 text-center transition-colors hover:border-zinc-500"
      >
        <ScanSearch className="h-8 w-8 text-emerald-400" aria-hidden />
        <p className="text-sm font-medium text-zinc-200">
          {busy ? "Inspecting…" : file ? file.name : "Drop any file here or click to inspect it — before you open it"}
        </p>
        <p className="text-xs text-zinc-500">Reads only the first bytes on your device · never uploaded · not an antivirus</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void analyze(f);
          }}
        />
      </div>

      {result && file && (
        <div className="space-y-4">
          <div
            className={`rounded-xl border p-4 ${
              result.sig
                ? matched
                  ? "border-emerald-800/50 bg-emerald-950/20"
                  : "border-amber-800/60 bg-amber-950/20"
                : "border-zinc-800 bg-zinc-900/40"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
              <div className="text-sm leading-relaxed text-zinc-200">
                {result.sig ? (
                  matched ? (
                    <>
                      This file really is a <b>{result.sig.name}</b>, which matches its “.{declared}” extension.
                      {result.sig.note && <span className="block text-xs text-amber-300">{result.sig.note}</span>}
                    </>
                  ) : (
                    <>
                      Careful: the extension says “.{declared || "none"}”, but the actual content is a{" "}
                      <b>{result.sig.name}</b> (works as: {sigExts.slice(0, 4).map((e) => `.${e}`).join(", ")}).{" "}
                      <span className="text-amber-300">Extension mismatch — treat with caution.</span>
                    </>
                  )
                ) : (
                  <>
                    No well-known signature found in the first bytes.{" "}
                    {result.textPreview
                      ? "The content looks like plain text, so the extension is probably right."
                      : "This may be an unknown, encrypted or corrupted format."}
                  </>
                )}
              </div>
            </div>
          </div>

          {riskyName && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-900/60 bg-red-950/20 p-4 text-sm text-red-200">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
              <span>
                <b>High-risk file type.</b> “.{extOf(file.name)}” files can execute code on your computer. Only open
                it if you fully trust where it came from.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Size" value={fmtBytes(file.size)} />
            <Stat label="Type" value={result.sig ? result.sig.name.split(" ")[0] : "Unknown"} />
            <Stat label="Entropy (head)" value={result.entropy.toFixed(2)} hint={result.entropy > 7.5 ? "very high — compressed or encrypted" : undefined} />
            <Stat label="Last modified" value={new Date(file.lastModified).toLocaleDateString()} />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">First 16 bytes (hex)</p>
            <p className="font-mono text-sm text-emerald-300">{result.hexHead}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{result.asciiHead}</p>
            <p className="mt-3 text-xs text-zinc-500">
              SHA-256 <span className="break-all font-mono text-zinc-300">{result.hash}</span>
            </p>
          </div>

          {result.zip.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Inside this archive — {result.zip.length} entr{result.zip.length === 1 ? "y" : "ies"} (max 500 shown)
              </p>
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {result.zip.map((e, i) => (
                  <p key={i} className="flex justify-between gap-3 font-mono text-xs text-zinc-300">
                    <span className="truncate">{e.name}</span>
                    <span className="shrink-0 text-zinc-500">{fmtBytes(e.size)}</span>
                  </p>
                ))}
              </div>
              {zipDanger.length > 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-red-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Contains {zipDanger.length} runnable file{zipDanger.length === 1 ? "" : "s"} ({zipDanger.slice(0, 3).map((e) => e.name).join(", ")}
                  {zipDanger.length > 3 ? "…" : ""}) — be careful before extracting.
                </p>
              )}
              {nestedArchives.length > 0 && (
                <p className="mt-1 text-xs text-amber-300">
                  Also contains {nestedArchives.length} nested archive{nestedArchives.length === 1 ? "" : "s"} — open those separately to inspect.
                </p>
              )}
            </div>
          )}

          {result.textPreview && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Text preview (first 1,200 characters)</p>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-300">
                {result.textPreview}
              </pre>
            </div>
          )}

          <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-xs leading-relaxed text-zinc-500">
            This inspector identifies file types, mismatches, hashes and archive contents locally. A clean result does
            <b> not </b> mean the file is safe — always scan untrusted downloads with a real antivirus.
          </p>
        </div>
      )}
    </div>
  );
}
