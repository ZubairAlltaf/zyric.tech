"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpZA,
  ArrowDownWideNarrow,
  Shuffle,
  RotateCcw,
  ListFilter,
  Replace,
  ScanText,
  Link2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Stat, CopyButton, inputCls, labelCls } from "./hooks";

function downloadText(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------------- Text Sorter ------------------------------- */

type SortMode = "az" | "za" | "lenAsc" | "lenDesc" | "reverse" | "shuffle";

export function TextSorterTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<SortMode>("az");
  const [ci, setCi] = useState(true);
  const [dedupe, setDedupe] = useState(false);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [trim, setTrim] = useState(true);
  const [seed, setSeed] = useState(0);

  const output = useMemo(() => {
    let lines = text.split("\n");
    if (trim) lines = lines.map((l) => l.trim());
    if (dropEmpty) lines = lines.filter((l) => l.trim() !== "");
    if (dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const k = ci ? l.toLowerCase() : l;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    const cmpKey = (s: string) => (ci ? s.toLowerCase() : s);
    const sorted = [...lines];
    switch (mode) {
      case "az":
        sorted.sort((a, b) => cmpKey(a).localeCompare(cmpKey(b), undefined, { numeric: true }));
        break;
      case "za":
        sorted.sort((a, b) => cmpKey(b).localeCompare(cmpKey(a), undefined, { numeric: true }));
        break;
      case "lenAsc":
        sorted.sort((a, b) => a.length - b.length);
        break;
      case "lenDesc":
        sorted.sort((a, b) => b.length - a.length);
        break;
      case "reverse":
        sorted.reverse();
        break;
      case "shuffle":
        if (seed >= 0) {
          for (let i = sorted.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
          }
        }
        break;
    }
    return sorted.join("\n");
  }, [text, mode, ci, dedupe, dropEmpty, trim, seed]);

  const inCount = text.split("\n").filter((l) => l.trim() !== "").length;
  const outCount = output.split("\n").filter((l) => l.trim() !== "").length;

  const MODES: { id: SortMode; label: string; icon: React.ReactNode }[] = [
    { id: "az", label: "A → Z", icon: <ArrowDownAZ className="h-4 w-4" aria-hidden /> },
    { id: "za", label: "Z → A", icon: <ArrowUpZA className="h-4 w-4" aria-hidden /> },
    { id: "lenAsc", label: "Shortest first", icon: <ArrowDownWideNarrow className="h-4 w-4 rotate-180" aria-hidden /> },
    { id: "lenDesc", label: "Longest first", icon: <ArrowDownWideNarrow className="h-4 w-4" aria-hidden /> },
    { id: "reverse", label: "Reverse order", icon: <RotateCcw className="h-4 w-4" aria-hidden /> },
    { id: "shuffle", label: "Shuffle", icon: <Shuffle className="h-4 w-4" aria-hidden /> },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ts-in" className={labelCls}>Your list (one item per line)</Label>
        <Textarea id="ts-in" value={text} onChange={(e) => setText(e.target.value)} rows={7} className={`${inputCls} font-mono text-xs`} placeholder={"banana\napple\ncherry"} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); if (m.id === "shuffle") setSeed((s) => s + 1); }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m.id
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={ci} onCheckedChange={setCi} aria-label="Case-insensitive" /> Ignore case
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={dedupe} onCheckedChange={setDedupe} aria-label="Remove duplicates" /> Remove duplicates
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={dropEmpty} onCheckedChange={setDropEmpty} aria-label="Remove empty lines" /> Remove empty lines
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={trim} onCheckedChange={setTrim} aria-label="Trim whitespace" /> Trim spaces
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Lines in" value={String(inCount)} />
        <Stat label="Lines out" value={String(outCount)} />
        <Stat label="Removed" value={String(inCount - outCount)} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className={labelCls}>Sorted result</Label>
          {output && <CopyButton text={output} label="Copy result" />}
        </div>
        <Textarea readOnly value={output} rows={7} className={`${inputCls} font-mono text-xs`} />
      </div>

      {output && (
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadText("sorted-lines.txt", output)}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" aria-hidden /> Download as .txt
        </Button>
      )}
    </div>
  );
}

/* ------------------------------- Find & Replace ----------------------------- */

export function FindReplaceTool() {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);
  const [isRegex, setIsRegex] = useState(false);

  const { count, output, regexError } = useMemo(() => {
    if (!find || !text) return { count: 0, output: text, regexError: "" };
    try {
      const pattern = isRegex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wrapped = wholeWords ? `\\b(?:${pattern})\\b` : pattern;
      const re = new RegExp(wrapped, caseSensitive ? "g" : "gi");
      let n = 0;
      const out = text.replace(re, () => {
        n++;
        return replace;
      });
      return { count: n, output: out, regexError: "" };
    } catch (e) {
      return { count: 0, output: text, regexError: e instanceof Error ? e.message : "Invalid expression" };
    }
  }, [text, find, replace, caseSensitive, wholeWords, isRegex]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fr-text" className={labelCls}>Text</Label>
        <Textarea id="fr-text" value={text} onChange={(e) => setText(e.target.value)} rows={6} className={`${inputCls} font-mono text-xs`} placeholder="Paste the text you want to edit…" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fr-find" className={labelCls}>Find {isRegex ? "(regex)" : ""}</Label>
          <Input id="fr-find" value={find} onChange={(e) => setFind(e.target.value)} className={`${inputCls} font-mono text-sm`} placeholder={isRegex ? "\\d{4}-\\d{2}" : "old word"} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fr-replace" className={labelCls}>Replace with</Label>
          <Input id="fr-replace" value={replace} onChange={(e) => setReplace(e.target.value)} className={`${inputCls} font-mono text-sm`} placeholder="new word" />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={caseSensitive} onCheckedChange={setCaseSensitive} aria-label="Case sensitive" /> Case sensitive
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={wholeWords} onCheckedChange={setWholeWords} aria-label="Whole words only" /> Whole words only
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={isRegex} onCheckedChange={setIsRegex} aria-label="Regular expression mode" /> Regex mode
        </label>
      </div>

      {regexError && (
        <p className="text-xs text-red-400">Regex error: {regexError}</p>
      )}

      <div className="flex items-center gap-3">
        <span className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3.5 py-1.5 text-sm font-bold text-emerald-400">
          {find ? `${count} match${count === 1 ? "" : "es"}` : "Type something to find"}
        </span>
        {count > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={() => {
              setText(output);
              setFind("");
            }}
          >
            <Replace className="h-3.5 w-3.5" aria-hidden /> Apply to text
          </Button>
        )}
      </div>

      {text && find && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className={labelCls}>Preview</Label>
            <CopyButton text={output} label="Copy" />
          </div>
          <Textarea readOnly value={output} rows={6} className={`${inputCls} font-mono text-xs`} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Text Summarizer ----------------------------- */

const STOPWORDS = new Set(
  "a,an,and,are,as,at,be,by,for,from,has,he,her,his,how,i,in,is,it,its,of,on,or,that,the,this,to,was,were,will,with,you,your,we,our,they,their,them,not,but,have,had,do,does,did,can,could,should,would,about,into,over,after,before,more,most,other,such,only,own,same,so,than,too,very,just,also,been,being,if,when,where,which,who,whom,what,why,all,any,both,each,few,some,nor,own,then,there,these,those,up,out,down,off,again,further,once,here".split(",")
);

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/(?<=[.!?])\s+(?=[A-Z0-9"“'(])/g);
  return parts.filter((s) => s.trim().length > 0);
}

export function SummarizerTool() {
  const [text, setText] = useState("");
  const [ratio, setRatio] = useState("30");

  const result = useMemo(() => {
    const sentences = splitSentences(text);
    if (sentences.length < 3) return null;

    const freq = new Map<string, number>();
    for (const w of text.toLowerCase().match(/[a-z']{2,}/g) ?? []) {
      if (STOPWORDS.has(w)) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
    const maxFreq = Math.max(...freq.values(), 1);

    const scored = sentences.map((s, i) => {
      const words = (s.toLowerCase().match(/[a-z']{2,}/g) ?? []).filter((w) => !STOPWORDS.has(w));
      if (words.length === 0) return { s, i, score: 0 };
      let score = 0;
      for (const w of words) score += (freq.get(w) ?? 0) / maxFreq;
      score = score / Math.sqrt(words.length);
      if (i === 0) score *= 1.35;
      else if (i === 1) score *= 1.15;
      if (i === sentences.length - 1) score *= 1.1;
      return { s, i, score };
    });

    const target = Math.max(1, Math.min(sentences.length - 1, Math.round((sentences.length * (Number(ratio) || 30)) / 100)));
    const picked = [...scored].sort((a, b) => b.score - a.score).slice(0, target).sort((a, b) => a.i - b.i);
    const summary = picked.map((p) => p.s).join(" ");
    const origWords = (text.match(/\S+/g) ?? []).length;
    const sumWords = (summary.match(/\S+/g) ?? []).length;
    return { summary, origWords, sumWords, sentCount: sentences.length, picked: target };
  }, [text, ratio]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sum-in" className={labelCls}>Article, report or any long text</Label>
        <Textarea id="sum-in" value={text} onChange={(e) => setText(e.target.value)} rows={9} className={`${inputCls} text-sm leading-relaxed`} placeholder="Paste a few paragraphs…" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sum-ratio" className={labelCls}>Summary length</Label>
          <div className="flex items-center gap-3">
            <input
              id="sum-ratio"
              type="range"
              min="10"
              max="60"
              step="5"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              className="h-2 w-44 cursor-pointer accent-emerald-500"
            />
            <span className="w-10 text-sm font-semibold text-emerald-400">{ratio}%</span>
          </div>
        </div>
        {result && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3.5 py-2 text-xs font-semibold text-emerald-300">
            <ScanText className="h-3.5 w-3.5" aria-hidden />
            {result.picked} of {result.sentCount} sentences · {result.sumWords} / {result.origWords} words
          </span>
        )}
      </div>

      {result ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className={labelCls}>Summary</Label>
            <CopyButton text={result.summary} label="Copy summary" />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm leading-relaxed text-zinc-200">
            {result.summary}
          </div>
          <p className="text-xs text-zinc-600">
            Extractive summary — it picks the most important sentences and keeps the original wording. Works best on English text.
          </p>
        </div>
      ) : (
        text.trim().length > 0 && (
          <p className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-sm text-zinc-500">
            <ListFilter className="h-4 w-4 text-zinc-500" aria-hidden /> Paste at least 3 sentences to build a summary.
          </p>
        )
      )}
    </div>
  );
}

/* -------------------------------- Slug Generator ---------------------------- */

function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function SlugGeneratorTool() {
  const [text, setText] = useState("");

  const slugs = useMemo(() => {
    const base = deaccent(text.trim());
    if (!base) return [];
    const words = base
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, "")
      .split(/[\s_-]+/)
      .filter(Boolean);
    if (words.length === 0) return [];
    const kebab = words.join("-");
    return [
      { label: "kebab-case (URLs, blogs)", value: kebab },
      { label: "snake_case (Python, files)", value: words.join("_") },
      { label: "dot.case", value: words.join(".") },
      { label: "camelCase (JS variables)", value: words[0] + words.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join("") },
      { label: "PascalCase (components)", value: words.map((w) => w[0].toUpperCase() + w.slice(1)).join("") },
      { label: "UPPERCASE-CONST", value: words.join("_").toUpperCase() },
    ];
  }, [text]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sg-in" className={labelCls}>Title, filename or phrase</Label>
        <Input
          id="sg-in"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${inputCls} text-base`}
          placeholder="10 Amazing Blog Ideas for 2026!"
        />
        {text && (
          <p className="text-xs text-zinc-500">
            {slugs[0] ? `${slugs[0].value.length} characters for the URL slug` : "No usable characters found"}
            <Link2 className="ml-1 inline h-3 w-3" aria-hidden />
          </p>
        )}
      </div>

      <div className="space-y-2">
        {slugs.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{s.label}</p>
              <p className="truncate font-mono text-sm text-emerald-300">{s.value}</p>
            </div>
            <CopyButton text={s.value} label="" />
          </div>
        ))}
        {!text && (
          <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-10 text-center text-sm text-zinc-500">
            Type a title above — six developer-ready naming formats appear instantly, accents included (é → e).
          </p>
        )}
      </div>
    </div>
  );
}
