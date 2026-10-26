"use client";

/* ==========================================================================
   SIGNATURE: BATCH FILE RENAMER — v2 "type the name you want"
   Primary flow: every queued file gets an editable name box — type ANY new
   name directly. Bulk helpers (find & replace, prefix, numbering, case)
   stay available but are optional, and matching can ignore letter case.
   Downloads are honest: a single file downloads itself under its new name,
   batches come as a ZIP; nothing claims "renamed" when it wasn't.
   100% client-side — files never leave the device.
   ========================================================================== */

import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  FileCog,
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelCls, inputCls } from "./hooks";

interface RenameRule {
  find: string;
  replaceWith: string;
  caseInsensitive: boolean;
  prefix: string;
  suffix: string;
  numbering: "none" | "dash" | "underscore";
  startAt: number;
  padding: number;
  casing: "none" | "lower" | "upper" | "kebab" | "snake";
  newExt: string;
  keepExt: boolean;
}

const DEFAULT_RULE: RenameRule = {
  find: "",
  replaceWith: "",
  caseInsensitive: true,
  prefix: "",
  suffix: "",
  numbering: "none",
  startAt: 1,
  padding: 2,
  casing: "none",
  newExt: "",
  keepExt: true,
};

interface QueuedFile {
  file: File;
  /** Manually typed full name. Empty/untouched = follow the bulk rules. */
  override: string;
}

/* ------------------------------ name engine ------------------------------- */

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyCasing(base: string, casing: RenameRule["casing"]): string {
  switch (casing) {
    case "lower":
      return base.toLowerCase();
    case "upper":
      return base.toUpperCase();
    case "kebab":
      return base.replace(/[\s_]+/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    case "snake":
      return base.replace(/[\s-]+/g, "_").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    default:
      return base;
  }
}

/** Split "photo.jpg" → ["photo", "jpg"]. Dotfiles like ".gitignore" have no ext. */
function splitExt(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot > 0) return { base: name.slice(0, dot), ext: name.slice(dot + 1) };
  return { base: name, ext: "" };
}

/** The bulk-rule suggestion for one file (used unless the user overrides it). */
function suggestName(name: string, rule: RenameRule, index: number): string {
  const { base, ext } = splitExt(name);
  let out = applyCasing(base, rule.casing);
  if (rule.find) {
    const flags = rule.caseInsensitive ? "gi" : "g";
    out = out.replace(new RegExp(escapeRe(rule.find), flags), rule.replaceWith);
  }
  out = rule.prefix + out;
  if (rule.numbering !== "none") {
    const sep = rule.numbering === "dash" ? "-" : "_";
    const num = String(rule.startAt + index).padStart(Math.max(1, rule.padding), "0");
    out = `${out}${sep}${num}`;
  }
  out = out + rule.suffix;
  const finalExt = rule.newExt.trim().replace(/^\.+/, "") || ext;
  return sanitizeName(finalExt ? `${out}.${finalExt}` : out);
}

/** Characters Windows/macOS/archivers choke on, plus control chars. */
const ILLEGAL = /[\\/:*?"<>|\u0000-\u001F]+/g;

/** Cross-platform safe: no \/:*?"<>|, no trailing dots/spaces, trimmed. */
function sanitizeName(raw: string): string {
  return raw
    .replace(ILLEGAL, "-")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .replace(/[ .]+$/, "");
}

/** Has the user typed an explicit extension like "trip.png"? */
const HAS_EXT = /\.[^.\s]{1,8}$/;

interface Resolved {
  name: string;
  manual: boolean;
  changed: boolean;
}

/** Final name for a queued file: manual override if typed, else suggestion. */
function resolveName(file: File, override: string, rule: RenameRule, index: number): Resolved {
  const manual = override.trim().length > 0;
  const suggested = suggestName(file.name, rule, index);
  let out = manual ? override : suggested;
  out = sanitizeName(out);
  if (!out) out = suggested; // user cleared the box into garbage — fall back

  if (manual && rule.keepExt && !HAS_EXT.test(out)) {
    const { ext } = splitExt(file.name);
    const wantExt = rule.newExt.trim().replace(/^\.+/, "") || ext;
    if (wantExt) out = `${out}.${wantExt}`;
  }
  return { name: out, manual, changed: out !== file.name };
}

/* --------------------------------- tool ----------------------------------- */

export function FileRenamerTool() {
  const [items, setItems] = useState<QueuedFile[]>([]);
  const [rule, setRule] = useState<RenameRule>(DEFAULT_RULE);
  const [busy, setBusy] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof RenameRule>(key: K, value: RenameRule[K]) =>
    setRule((r) => ({ ...r, [key]: value }));

  const plan = useMemo(() => {
    const seen = new Map<string, number>();
    return items.map((it, i) => {
      const r = resolveName(it.file, it.override, rule, i);
      const clash = (seen.get(r.name) ?? 0) + 1;
      seen.set(r.name, clash);
      return { ...it, ...r, clash: clash > 1 };
    });
  }, [items, rule]);

  /** How many files actually contain the find text? (0 → warn, don't lie) */
  const findMiss = useMemo(() => {
    if (!rule.find.trim() || items.length === 0) return false;
    const re = new RegExp(escapeRe(rule.find), rule.caseInsensitive ? "i" : "");
    return !items.some((it) => re.test(splitExt(it.file.name).base));
  }, [items, rule]);

  const changedCount = plan.filter((p) => p.changed).length;

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setItems((prev) => [...prev, ...Array.from(list).map((file) => ({ file, override: "" }))]);
    setDoneMsg("");
  };

  const setOverride = (i: number, v: string) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, override: v } : it)));

  const resetOne = (i: number) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, override: "" } : it)));

  const fillAll = () =>
    setItems((prev) =>
      prev.map((it, i) => ({ ...it, override: suggestName(it.file.name, rule, i) }))
    );

  /** One file → downloads immediately under its final new name. No ZIP. */
  const downloadOne = (p: { file: File; name: string }) => {
    const url = URL.createObjectURL(p.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = p.name; // ← the name the user chose, at download time
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const renameAndZip = async () => {
    if (plan.length === 0) return;
    setBusy(true);
    setDoneMsg("");
    try {
      const zip = new JSZip();
      const used = new Map<string, number>();
      let renamed = 0;
      for (const p of plan) {
        let name = p.name;
        const n = (used.get(name) ?? 0) + 1;
        used.set(name, n);
        if (n > 1) {
          const dot = name.lastIndexOf(".");
          name = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
        }
        zip.file(name, p.file);
        if (name !== p.file.name) renamed++;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "renamed-files.zip";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setDoneMsg(
        renamed > 0
          ? `ZIP downloaded — ${renamed} file${renamed !== 1 ? "s" : ""} renamed${plan.length - renamed > 0 ? `, ${plan.length - renamed} kept their name` : ""}. Unzip to see the new names.`
          : `ZIP downloaded — no names needed changing, files were packed as-is.`
      );
    } finally {
      setBusy(false);
    }
  };

  const downloadSingle = (p: { file: File; name: string }, index: number) => {
    downloadOne(p);
    setDoneMsg(`Downloaded as “${p.name}” — the name you typed, exactly.`);
    void index;
  };

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/40 p-6 text-center transition-colors hover:border-emerald-500/50"
      >
        <UploadCloud className="mx-auto h-8 w-8 text-emerald-400" aria-hidden />
        <p className="mt-2 text-sm font-medium text-zinc-200">Drop files here, or</p>
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} className="mt-2 border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300">
          Browse files
        </Button>
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
        <p className="mt-2 text-xs text-zinc-600">Files never leave your device — renaming happens in your browser.</p>
      </div>

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-100">{items.length}</span> file{items.length !== 1 ? "s" : ""} queued
              {" · "}
              <span className={changedCount > 0 ? "text-emerald-400" : "text-zinc-500"}>{changedCount} will be renamed</span>
              {changedCount === 0 && items.length > 0 && <span className="text-zinc-600"> — type a new name below or use the helpers</span>}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fillAll}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-emerald-300"
              >
                <Wand2 className="h-3.5 w-3.5" aria-hidden /> Fill all with suggestions
              </button>
              <button
                type="button"
                onClick={() => { setItems([]); setDoneMsg(""); }}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" aria-hidden /> Clear all
              </button>
            </div>
          </div>

          {findMiss && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                No filename contains “{rule.find}”. Check the spelling, or turn on <b>Ignore letter case</b> below.
                You can also just type the new name directly into any name box — no searching needed.
              </span>
            </p>
          )}

          {/* ---- name boxes: the primary interface ---- */}
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2">
            {plan.map((p, i) => (
              <div key={`${p.file.name}-${i}`} className={`rounded-xl border px-3 py-2.5 ${p.manual ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800"} ${i % 2 ? "bg-zinc-900/30" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="w-5 shrink-0 font-mono text-[10px] text-zinc-600">{i + 1}</span>
                  <p className="min-w-0 flex-1 truncate text-xs text-zinc-500">{p.file.name}</p>
                  <span className="shrink-0 font-mono text-[10px] text-zinc-600">{(p.file.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    title="Download this file with its new name now"
                    onClick={() => downloadSingle(p, i)}
                    className="shrink-0 rounded-md border border-zinc-700 p-1 text-zinc-400 transition-colors hover:border-emerald-500/60 hover:text-emerald-300"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    value={p.manual ? p.override : ""}
                    onChange={(e) => setOverride(i, e.target.value)}
                    placeholder={`new name — empty = auto: ${p.name}`}
                    className={`${inputCls} h-8 font-mono text-xs`}
                    aria-label={`New name for ${p.file.name}`}
                  />
                  {p.manual ? (
                    <button
                      type="button"
                      title="Back to the automatic name"
                      onClick={() => resetOne(i)}
                      className="shrink-0 rounded-md border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-emerald-500/60 hover:text-emerald-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-800 px-1.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-zinc-600">auto</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {p.changed ? (
                    <p className="min-w-0 truncate text-[11px] text-emerald-300">→ {p.name}</p>
                  ) : (
                    <p className="min-w-0 truncate text-[11px] text-zinc-600">stays the same</p>
                  )}
                  {p.clash && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-label="Name clash" />}
                </div>
              </div>
            ))}
          </div>

          {plan.some((p) => p.clash) && (
            <p className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Duplicate target names get “(2)”, “(3)”… appended automatically.
            </p>
          )}

          {/* ---- bulk helpers: optional ---- */}
          <details className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-zinc-300">
              Bulk helpers — find &amp; replace, prefixes, numbering, case <span className="text-xs text-zinc-600">(optional; empty name boxes follow these)</span>
            </summary>
            <div className="grid gap-4 px-4 pb-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-find" className={labelCls}>Find</Label>
                    <Input id="rn-find" value={rule.find} onChange={(e) => set("find", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="IMG" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-repl" className={labelCls}>Replace with</Label>
                    <Input id="rn-repl" value={rule.replaceWith} onChange={(e) => set("replaceWith", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="trip" />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={rule.caseInsensitive}
                    onChange={(e) => set("caseInsensitive", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-emerald-400"
                  />
                  Ignore letter case (img matches IMG)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-prefix" className={labelCls}>Prefix</Label>
                    <Input id="rn-prefix" value={rule.prefix} onChange={(e) => set("prefix", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="2026-" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-suffix" className={labelCls}>Suffix</Label>
                    <Input id="rn-suffix" value={rule.suffix} onChange={(e) => set("suffix", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="-final" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-numbering" className={labelCls}>Numbering</Label>
                    <Select value={rule.numbering} onValueChange={(v) => set("numbering", v as RenameRule["numbering"])}>
                      <SelectTrigger id="rn-numbering" className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="dash">name-01, name-02…</SelectItem>
                        <SelectItem value="underscore">name_01, name_02…</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {rule.numbering !== "none" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="rn-start" className={labelCls}>Start at</Label>
                          <Input id="rn-start" value={String(rule.startAt)} onChange={(e) => set("startAt", Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))} className={`${inputCls} font-mono text-xs`} inputMode="numeric" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="rn-pad" className={labelCls}>Padding</Label>
                          <Input id="rn-pad" value={String(rule.padding)} onChange={(e) => set("padding", Math.min(6, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} className={`${inputCls} font-mono text-xs`} inputMode="numeric" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-casing" className={labelCls}>Letter case</Label>
                    <Select value={rule.casing} onValueChange={(v) => set("casing", v as RenameRule["casing"])}>
                      <SelectTrigger id="rn-casing" className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                        <SelectItem value="none">Keep as is</SelectItem>
                        <SelectItem value="lower">lowercase</SelectItem>
                        <SelectItem value="upper">UPPERCASE</SelectItem>
                        <SelectItem value="kebab">kebab-case</SelectItem>
                        <SelectItem value="snake">snake_case</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-ext" className={labelCls}>Change ext</Label>
                    <Input id="rn-ext" value={rule.newExt} onChange={(e) => set("newExt", e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="jpg (optional)" />
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-zinc-300">
                  <input
                    type="checkbox"
                    checked={rule.keepExt}
                    onChange={(e) => set("keepExt", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-emerald-400"
                  />
                  <span>
                    Keep the original extension when I type a name without one
                    <span className="block text-zinc-600">Type “trip-01” → downloads as trip-01.jpg. Type your own extension to override it.</span>
                  </span>
                </label>
                <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
                  Unsafe characters (<span className="font-mono">\ / : * ? &quot; &lt; &gt; |</span>) are swapped for “-” automatically, so the
                  download works on Windows, macOS and inside ZIPs.
                </p>
              </div>
            </div>
          </details>

          <Button
            type="button"
            onClick={items.length === 1 ? () => downloadSingle(plan[0], 0) : renameAndZip}
            disabled={busy}
            className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden />{" "}
            {busy
              ? "Zipping…"
              : items.length === 1
                ? `Download renamed file${changedCount === 0 ? " (name unchanged)" : ""}`
                : `Download ZIP — ${items.length} file${items.length !== 1 ? "s" : ""}${changedCount === 0 ? " (no name changes)" : ""}`}
          </Button>
          {doneMsg && <p className="text-center text-sm text-emerald-400">{doneMsg}</p>}
        </>
      )}

      {items.length === 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <FileCog className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          <p className="text-sm leading-relaxed text-zinc-400">
            Type the new name directly in each file’s box — any name you want, no search-and-replace gymnastics. Need a whole
            folder renamed at once? Use the optional bulk helpers (<span className="font-mono text-xs">IMG_1024 → trip-01</span>) and
            every download carries the exact name shown in the preview. One file downloads on its own; batches come as a tidy ZIP.
          </p>
        </div>
      )}
    </div>
  );
}
