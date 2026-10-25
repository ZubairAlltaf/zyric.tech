"use client";

import { useEffect, useMemo, useState } from "react";
import { Regex, FileCode2, Braces, ListTree } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton, inputCls, labelCls } from "./hooks";
import { marked } from "marked";

/* -------------------------------- Hash Generator ---------------------------- */

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algo = (typeof ALGOS)[number];

export function HashTool() {
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [upper, setUpper] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      if (!text) {
        setHashes({});
        return;
      }
      const data = new TextEncoder().encode(text);
      const next: Record<string, string> = {};
      for (const algo of ALGOS) {
        try {
          const digest = await crypto.subtle.digest(algo, data);
          next[algo] = Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        } catch {
          next[algo] = "unavailable";
        }
      }
      if (!cancelled) setHashes(next);
    };
    void compute();
    return () => {
      cancelled = true;
    };
  }, [text]);

  const fmt = (h: string) => (upper ? h.toUpperCase() : h);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="hash-in" className={labelCls}>Text to hash</Label>
        <Textarea
          id="hash-in"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className={`${inputCls} font-mono text-xs`}
          placeholder="Anything — a password, a file's contents pasted, a transaction string…"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <Switch checked={upper} onCheckedChange={setUpper} aria-label="Uppercase output" /> UPPERCASE hashes
      </label>

      <div className="space-y-2">
        {ALGOS.map((algo) => (
          <div key={algo} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {algo} <span className="text-zinc-700">· {algo === "SHA-1" ? "legacy" : "secure"}</span>
              </p>
              <p className="break-all font-mono text-xs text-emerald-300">{hashes[algo] ? fmt(hashes[algo]) : "—"}</p>
            </div>
            {hashes[algo] && <CopyButton text={fmt(hashes[algo])} label="" />}
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-zinc-600">
        Hashes are computed with your browser’s native crypto engine. For password storage use a dedicated algorithm
        (bcrypt/argon2) — plain SHA hashes are for integrity checks and fingerprints, not password storage.
      </p>
    </div>
  );
}

/* --------------------------------- Regex Tester ----------------------------- */

const CHEATS: [string, string][] = [
  ["\\d+", "digits"],
  ["[a-z]+", "lowercase letters"],
  ["\\w+@\\w+\\.\\w+", "simple email"],
  ["^\\s*$", "empty line"],
  ["(19|20)\\d{2}", "year 1900–2099"],
];

export function RegexTool() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [testText, setTestText] = useState(
    "Contact ada@example.com or grace@navy.mil for details.\nInvalid: bob@@wrong"
  );

  const flagStr = useMemo(
    () => Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join(""),
    [flags]
  );

  const result = useMemo(() => {
    if (!pattern) return { error: "", matches: [] as { index: number; text: string; groups: string[] }[] };
    try {
      const re = new RegExp(pattern, flagStr.includes("g") ? flagStr : flagStr + "g");
      const matches: { index: number; text: string; groups: string[] }[] = [];
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(testText)) !== null && guard < 500) {
        matches.push({ index: m.index, text: m[0], groups: m.slice(1).map((g) => g ?? "") });
        if (m[0] === "") re.lastIndex++;
        guard++;
      }
      return { error: "", matches };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Invalid pattern", matches: [] };
    }
  }, [pattern, flagStr, testText]);

  const segments = useMemo(() => {
    if (result.error || result.matches.length === 0) return null;
    const segs: { text: string; hit: boolean }[] = [];
    let last = 0;
    for (const m of result.matches) {
      if (m.index > last) segs.push({ text: testText.slice(last, m.index), hit: false });
      segs.push({ text: m.text, hit: true });
      last = m.index + m.text.length;
    }
    if (last < testText.length) segs.push({ text: testText.slice(last), hit: false });
    return segs;
  }, [result, testText]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="re-pat" className={labelCls}>Regular expression</Label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg text-zinc-500">/</span>
          <Input
            id="re-pat"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className={`${inputCls} font-mono`}
            placeholder="\\d{3}-\\d{4}"
          />
          <span className="font-mono text-lg text-zinc-500">/{flagStr}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
          {(Object.keys(flags) as (keyof typeof flags)[]).map((f) => (
            <label key={f} className="flex items-center gap-2 font-mono text-sm text-zinc-300">
              <Switch checked={flags[f]} onCheckedChange={(v) => setFlags({ ...flags, [f]: v })} aria-label={`Flag ${f}`} />
              {f}
            </label>
          ))}
        </div>
      </div>

      {result.error && <p className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">Regex error: {result.error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="re-text" className={labelCls}>Test string</Label>
        <Textarea id="re-text" value={testText} onChange={(e) => setTestText(e.target.value)} rows={5} className={`${inputCls} font-mono text-xs`} />
      </div>

      {segments && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Regex className="h-4 w-4 text-emerald-400" aria-hidden /> {result.matches.length} match{result.matches.length === 1 ? "" : "es"}
          </p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-400">
            {segments.map((s, i) =>
              s.hit ? (
                <mark key={i} className="rounded bg-emerald-500/25 px-0.5 text-emerald-200">
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              )
            )}
          </pre>
          {result.matches.some((m) => m.groups.length > 0) && (
            <div className="mt-3 space-y-1.5 border-t border-zinc-800 pt-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <ListTree className="h-3 w-3" aria-hidden /> Capture groups
              </p>
              {result.matches.slice(0, 10).map((m, i) =>
                m.groups.length > 0 ? (
                  <p key={i} className="font-mono text-xs text-zinc-400">
                    #{i + 1} <span className="text-emerald-300">{m.text}</span> → {m.groups.map((g, gi) => `[${gi + 1}] “${g}”`).join("  ")}
                  </p>
                ) : null
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <Braces className="h-3 w-3" aria-hidden /> Quick patterns — click to try
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CHEATS.map(([p, label]) => (
            <button
              key={p}
              type="button"
              onClick={() => setPattern(p)}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-emerald-600/50 hover:text-emerald-300"
            >
              {p} <span className="text-zinc-600">({label})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Markdown Previewer ------------------------- */

const SAMPLE = `# Welcome to the previewer

Write **markdown** on the left, see *styled* text instantly.

## What you can do
- Lists, **bold**, _italic_, \`inline code\`
- [Links](https://zyric.tech) and tables

| Feature | Works offline |
| --- | --- |
| Formatting | yes |
| Privacy | 100% |

> Everything is rendered locally — nothing is uploaded.

1. Great for READMEs
2. Great for blog drafts
3. Great for docs
`;

export function MarkdownTool() {
  const [md, setMd] = useState(SAMPLE);

  const html = useMemo(() => {
    try {
      const raw = marked.parse(md, { async: false });
      return typeof raw === "string" ? raw : "";
    } catch {
      return "<p>Could not render this markdown.</p>";
    }
  }, [md]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="md-in" className={labelCls}>Markdown</Label>
            <button type="button" onClick={() => setMd("")} className="text-xs text-zinc-500 hover:text-zinc-300">
              Clear
            </button>
          </div>
          <Textarea id="md-in" value={md} onChange={(e) => setMd(e.target.value)} rows={18} className={`${inputCls} font-mono text-xs leading-relaxed`} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className={labelCls}>Preview</Label>
            <CopyButton text={html} label="Copy HTML" />
          </div>
          <div
            className="max-h-[32rem] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 text-sm leading-relaxed text-zinc-200 [&_a]:text-emerald-400 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-zinc-50 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-50 [&_h3]:mb-2 [&_h3]:font-semibold [&_hr]:border-zinc-800 [&_li]:ml-4 [&_ol]:list-decimal [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-xs [&_table]:w-full [&_td]:border-t [&_td]:border-zinc-800 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-zinc-700 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-zinc-600">
        <FileCode2 className="h-3.5 w-3.5" aria-hidden />
        Rendered with the open-source <span className="font-semibold text-zinc-400">marked</span> parser in your browser. Copy the HTML straight into your CMS or email.
      </p>
    </div>
  );
}
