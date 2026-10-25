"use client";

import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { FileCog, UploadCloud, Download, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelCls, inputCls } from "./hooks";

interface RenameRule {
  find: string;
  replaceWith: string;
  prefix: string;
  suffix: string;
  numbering: "none" | "dash" | "underscore";
  startAt: number;
  padding: number;
  casing: "none" | "lower" | "upper" | "kebab" | "snake";
  newExt: string;
}

const DEFAULT_RULE: RenameRule = {
  find: "",
  replaceWith: "",
  prefix: "",
  suffix: "",
  numbering: "none",
  startAt: 1,
  padding: 2,
  casing: "none",
  newExt: "",
};

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

function computeNewName(name: string, rule: RenameRule, index: number): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  let out = applyCasing(base, rule.casing);
  if (rule.find) out = out.split(rule.find).join(rule.replaceWith);
  out = rule.prefix + out;
  if (rule.numbering !== "none") {
    const sep = rule.numbering === "dash" ? "-" : "_";
    const num = String(rule.startAt + index).padStart(Math.max(1, rule.padding), "0");
    out = `${out}${sep}${num}`;
  }
  out = out + rule.suffix;
  const finalExt = rule.newExt.trim().replace(/^\.+/, "") || ext;
  return finalExt ? `${out}.${finalExt}` : out;
}

export function FileRenamerTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [rule, setRule] = useState<RenameRule>(DEFAULT_RULE);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const plan = useMemo(() => {
    const seen = new Map<string, number>();
    return files.map((f, i) => {
      const to = computeNewName(f.name, rule, i);
      const clash = (seen.get(to) ?? 0) + 1;
      seen.set(to, clash);
      return { file: f, to, clash: clash > 1 };
    });
  }, [files, rule]);

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    setDone(false);
  };

  const set = <K extends keyof RenameRule>(key: K, value: RenameRule[K]) => setRule((r) => ({ ...r, [key]: value }));

  const renameAndZip = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setDone(false);
    try {
      const zip = new JSZip();
      const used = new Map<string, number>();
      for (let i = 0; i < files.length; i++) {
        let name = computeNewName(files[i].name, rule, i);
        const n = (used.get(name) ?? 0) + 1;
        used.set(name, n);
        if (n > 1) {
          const dot = name.lastIndexOf(".");
          name = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
        }
        zip.file(name, files[i]);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "renamed-files.zip";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  const changedCount = plan.filter((p) => p.to !== p.file.name).length;

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
        <p className="mt-2 text-xs text-zinc-600">Files never leave your device — renaming and zipping happen in your browser.</p>
      </div>

      {files.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-100">{files.length}</span> file{files.length !== 1 ? "s" : ""} queued
              {changedCount > 0 && <> · <span className="text-emerald-400">{changedCount}</span> will be renamed</>}
            </p>
            <button
              type="button"
              onClick={() => { setFiles([]); setDone(false); }}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Clear all
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mono-kicker text-zinc-500">rename rules</p>
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
              <div className="space-y-1.5">
                <Label className={labelCls}>Numbering</Label>
                <Select value={rule.numbering} onValueChange={(v) => set("numbering", v as RenameRule["numbering"])}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="dash">name-01, name-02…</SelectItem>
                    <SelectItem value="underscore">name_01, name_02…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {rule.numbering !== "none" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-start" className={labelCls}>Start at</Label>
                    <Input id="rn-start" value={String(rule.startAt)} onChange={(e) => set("startAt", Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))} className={`${inputCls} font-mono text-xs`} inputMode="numeric" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rn-pad" className={labelCls}>Zero padding</Label>
                    <Input id="rn-pad" value={String(rule.padding)} onChange={(e) => set("padding", Math.min(6, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} className={`${inputCls} font-mono text-xs`} inputMode="numeric" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelCls}>Letter case</Label>
                  <Select value={rule.casing} onValueChange={(v) => set("casing", v as RenameRule["casing"])}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
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
            </div>

            <div className="space-y-3">
              <div className="max-h-80 overflow-auto rounded-2xl border border-zinc-800">
                {plan.map((p, i) => (
                  <div key={`${p.file.name}-${i}`} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i % 2 ? "bg-zinc-900/40" : "bg-zinc-900/70"}`}>
                    <span className="w-6 shrink-0 font-mono text-[11px] text-zinc-600">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-zinc-400">{p.file.name}</p>
                      {p.to !== p.file.name && <p className="truncate text-emerald-300">→ {p.to}</p>}
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-zinc-600">{(p.file.size / 1024).toFixed(1)} KB</span>
                    {p.clash ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-label="Name clash" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-zinc-700" aria-hidden />
                    )}
                  </div>
                ))}
              </div>
              {plan.some((p) => p.clash) && (
                <p className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Duplicate target names get “(2)”, “(3)”… appended automatically in the ZIP.
                </p>
              )}
              <Button type="button" onClick={renameAndZip} disabled={busy} className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-60">
                <Download className="h-4 w-4" aria-hidden /> {busy ? "Zipping…" : `Rename & download ZIP (${files.length})`}
              </Button>
              {done && (
                <p className="text-center text-sm text-emerald-400">ZIP downloaded — check your downloads folder.</p>
              )}
            </div>
          </div>
        </>
      )}

      {files.length === 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <FileCog className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          <p className="text-sm leading-relaxed text-zinc-400">
            Perfect for camera exports (<span className="font-mono text-xs">IMG_1024 → trip-01</span>), assignment batches, client
            assets and screenshots. Combine find &amp; replace, prefixes, numbering and letter case in one pass, preview every
            name, then download a tidy ZIP.
          </p>
        </div>
      )}
    </div>
  );
}
