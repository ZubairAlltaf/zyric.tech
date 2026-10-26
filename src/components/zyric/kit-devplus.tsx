"use client";

/* ==========================================================================
   KIT: DEV+ — 12 second-wave developer instruments.
   All client-side, zero network. Composes ./kit primitives into screens
   that each use a different composition (table-first, card grid, two-pane
   diff, stats-hero, stacked flow, drop-zone center stage…).
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
import {
  Binary,
  Braces,
  FileCode2,
  FileDigit,
  FileMinus,
  GitCompareArrows,
  Quote,
  Regex,
  Shrink,
  ShieldCheck,
  Table2,
  WholeWord,
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
  Split,
  Tag,
  accentOf,
  fmt,
  pct,
} from "./kit";
import type { ToolMeta } from "./tool-types";

/* ------------------------------ shared helpers ---------------------------- */

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function utf8Bytes(s: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s).length;
  return s.length; // unreachable in browsers — SSR safety net
}

function countGraphemes(s: string): number | null {
  if (typeof Intl === "undefined" || !("Segmenter" in Intl)) return null;
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  let n = 0;
  for (const _ of seg.segment(s)) n++;
  return n;
}

function ErrNote({ msg }: { msg: string }) {
  return (
    <p className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-mono text-xs leading-relaxed text-rose-300">
      {msg}
    </p>
  );
}

/** Tiny inline copy chip — keeps this file import-clean (kit Out already has CopyButton). */
function MiniCopy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(false), 1200);
    return () => clearTimeout(t);
  }, [ok]);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => setOk(true))
          .catch(() => setOk(false));
      }}
      className="shrink-0 rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
    >
      {ok ? "copied ✓" : "copy"}
    </button>
  );
}

/* ==========================================================================
   1. XML Formatter & Validator — two-pane: source+controls left, output+stats right
   ========================================================================== */

interface XmlNode {
  el?: { name: string; attrs: [string, string][] };
  text?: string;
  cdata?: string;
  comment?: string;
  pi?: string;
  kids?: XmlNode[];
}

const SAMPLE_XML = `<catalog lang="en">
  <book id="bk101" stock="3">
    <author>Gambardella, Matthew</author>
    <title>XML Developer Guide Vol 1</title>
    <price currency="USD">49.95</price>
  </book>
  <book id="bk102" stock="0" ebook="true">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
  </book>
</catalog>`;

function escXmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escXmlAttr(s: string): string {
  return escXmlText(s).replace(/"/g, "&quot;").replace(/\n/g, "&#10;").replace(/\t/g, "&#9;");
}

function fromDom(n: Node): XmlNode | null {
  if (n.nodeType === 3) return { text: n.nodeValue ?? "" };
  if (n.nodeType === 4) return { cdata: n.nodeValue ?? "" };
  if (n.nodeType === 8) return { comment: n.nodeValue ?? "" };
  if (n.nodeType === 7) return { pi: n.nodeValue ?? "" };
  if (n.nodeType !== 1) return null; // document / doctype / others
  const el = n as Element;
  const attrs: [string, string][] = Array.from(el.attributes).map((a) => [a.name, a.value]);
  const kids: XmlNode[] = [];
  for (const c of Array.from(el.childNodes)) {
    const x = fromDom(c);
    if (x) kids.push(x);
  }
  return { el: { name: el.tagName, attrs }, kids };
}

function xmlStats(n: XmlNode, depth: number): { elements: number; attrs: number; depth: number } {
  if (!n.el) return { elements: 0, attrs: 0, depth: 0 };
  let s = { elements: 1, attrs: n.el.attrs.length, depth };
  for (const k of n.kids ?? []) {
    const ks = xmlStats(k, depth + 1);
    s = { elements: s.elements + ks.elements, attrs: s.attrs + ks.attrs, depth: Math.max(s.depth, ks.depth) };
  }
  return s;
}

function prettyXml(n: XmlNode, ind: string, pad: string, out: string[]): void {
  if (n.text !== undefined) {
    const t = n.text.trim();
    if (t) out.push(ind + escXmlText(t));
    return;
  }
  if (n.cdata !== undefined) { out.push(ind + `<![CDATA[${n.cdata}]]>`); return; }
  if (n.comment !== undefined) { out.push(ind + `<!--${n.comment}-->`); return; }
  if (n.pi !== undefined) { out.push(ind + `<?${n.pi}?>`); return; }
  const el = n.el!;
  const attrs = el.attrs.map(([k, v]) => ` ${k}="${escXmlAttr(v)}"`).join("");
  const kids = n.kids ?? [];
  if (kids.length === 0) { out.push(ind + `<${el.name}${attrs}/>`); return; }
  if (kids.length === 1 && kids[0].text !== undefined) {
    out.push(ind + `<${el.name}${attrs}>${escXmlText(kids[0].text.trim())}</${el.name}>`);
    return;
  }
  out.push(ind + `<${el.name}${attrs}>`);
  for (const k of kids) prettyXml(k, ind + pad, pad, out);
  out.push(ind + `</${el.name}>`);
}

function miniXml(n: XmlNode, out: string[]): void {
  if (n.text !== undefined) {
    const t = n.text.trim();
    if (t) out.push(escXmlText(t));
    return;
  }
  if (n.cdata !== undefined) { out.push(`<![CDATA[${n.cdata}]]>`); return; }
  if (n.comment !== undefined) return; // comments die in minified output
  if (n.pi !== undefined) { out.push(`<?${n.pi}?>`); return; }
  const el = n.el!;
  const attrs = el.attrs.map(([k, v]) => ` ${k}="${escXmlAttr(v)}"`).join("");
  const kids = n.kids ?? [];
  if (kids.length === 0) { out.push(`<${el.name}${attrs}/>`); return; }
  if (kids.length === 1 && kids[0].text !== undefined) {
    out.push(`<${el.name}${attrs}>${escXmlText(kids[0].text.trim())}</${el.name}>`);
    return;
  }
  out.push(`<${el.name}${attrs}>`);
  for (const k of kids) miniXml(k, out);
  out.push(`</${el.name}>`);
}

export function XmlFormatterTool() {
  const A = accentOf(0);
  const [src, setSrc] = useState(SAMPLE_XML);
  const [mode, setMode] = useState<"pretty" | "minify">("pretty");
  const [indent, setIndent] = useState<"sp2" | "sp4" | "tab">("sp2");

  const parsed = useMemo(() => {
    if (!src.trim()) return null;
    try {
      const doc = new DOMParser().parseFromString(src, "application/xml");
      const perr = doc.getElementsByTagName("parsererror")[0];
      if (perr) {
        const msg = (perr.textContent ?? "Unparseable XML").replace(/\s+/g, " ").trim();
        return { ok: false as const, err: msg.slice(0, 260) };
      }
      const root = doc.documentElement;
      const node = root ? fromDom(root) : null;
      if (!node) return { ok: false as const, err: "No document element found." };
      const st = xmlStats(node, 1);
      const pad = indent === "tab" ? "\t" : indent === "sp4" ? "    " : "  ";
      const lines: string[] = [];
      if (mode === "pretty") prettyXml(node, "", pad, lines);
      else miniXml(node, lines);
      return { ok: true as const, out: lines.join(mode === "pretty" ? "\n" : ""), stats: st };
    } catch (e) {
      return { ok: false as const, err: e instanceof Error ? e.message : "Parse failed" };
    }
  }, [src, mode, indent]);

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Area label="XML source" value={src} onChange={setSrc} rows={12} placeholder="<root>…</root>" />
            <Row>
              <Seg
                value={mode}
                onChange={setMode}
                accent={A}
                options={[
                  { v: "pretty" as const, label: "Pretty" },
                  { v: "minify" as const, label: "Minify" },
                ]}
              />
              {mode === "pretty" ? (
                <Seg
                  value={indent}
                  onChange={setIndent}
                  accent={A}
                  options={[
                    { v: "sp2" as const, label: "2 sp" },
                    { v: "sp4" as const, label: "4 sp" },
                    { v: "tab" as const, label: "Tab" },
                  ]}
                />
              ) : null}
            </Row>
          </div>
        }
        right={
          <div className="space-y-3">
            {parsed && !parsed.ok ? <ErrNote msg={parsed.err} /> : null}
            {parsed && parsed.ok ? (
              <>
                <Grid cols={2}>
                  <BigStat label="Elements" value={fmt(parsed.stats.elements)} accent={A} hint="tag count" />
                  <BigStat label="Nest depth" value={parsed.stats.depth} accent="#7FC8FF" hint="deepest branch" />
                </Grid>
                <Out label={`xml · ${mode}`} text={parsed.out} rows={12} />
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1">
                  <KV k="attributes" v={fmt(parsed.stats.attrs)} accent={A} />
                  <KV k="bytes in / out" v={`${fmtBytes(utf8Bytes(src))} → ${fmtBytes(utf8Bytes(parsed.out))}`} />
                </div>
              </>
            ) : null}
            {!parsed ? <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-10 text-center text-sm text-zinc-600">Paste XML — it is parsed by your own browser DOM, nothing is uploaded.</p> : null}
          </div>
        }
      />
      <Note>Parse errors are the genuine message produced by your browser XML parser (line + column included). Comments survive pretty mode, are stripped in minify mode.</Note>
    </div>
  );
}

/* ==========================================================================
   2. CSS Minifier — stats-hero top, Split below
   ========================================================================== */

const SAMPLE_CSS = `/* theme tokens */
:root {
  --brand: #7c3aed;
  --radius: 8px;
}

.card {
  padding: 16px 24px;
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.card > .title {
  color: var(--brand);
  font-weight: 700;
}

@media (max-width: 600px) {
  .card { padding: 8px; }
}
`;

export function CssMinifierTool() {
  const A = accentOf(1);
  const [css, setCss] = useState(SAMPLE_CSS);

  const res = useMemo(() => {
    if (!css.trim()) return null;
    let t = css.replace(/\/\*[\s\S]*?\*\//g, ""); // comments
    t = t.replace(/\s+/g, " "); // collapse whitespace
    t = t.replace(/\s*([{}:;,>~+])\s*/g, "$1"); // tighten punctuation & selectors
    t = t.replace(/;}/g, "}"); // drop last semicolon in each block
    t = t.replace(/}/g, "}\n").trim(); // one rule per line for readability
    const before = utf8Bytes(css);
    const after = utf8Bytes(t);
    return { out: t, before, after, saved: before > 0 ? (1 - after / before) * 100 : 0 };
  }, [css]);

  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <BigStat label="Before" value={fmtBytes(res?.before ?? 0)} accent="#a1a1aa" />
        <BigStat label="After" value={fmtBytes(res?.after ?? 0)} accent={A} />
        <BigStat
          label="Saved"
          value={pct(res?.saved ?? 0)}
          accent={res && res.saved > 20 ? "#5EE39A" : A}
          hint="comments · whitespace · dead semicolons"
        />
      </Grid>
      <Split
        left={<Area label="CSS source" value={css} onChange={setCss} rows={12} placeholder=".rule { color: red }" />}
        right={<Out label="minified" text={res?.out ?? ""} rows={12} />}
      />
      <Note>
        This is a safe textual minifier: string contents are collapsed but never re-parsed, so quoted values like
        {" "}
        {`content: "a, b"`} keep their inner spaces intact. For production pair it with cssnano or lightningcss.
      </Note>
    </div>
  );
}

/* ==========================================================================
   3. String Escaper — control bar + two-pane convert, per-mode notes
   ========================================================================== */

type EscMode = "json" | "js" | "sql" | "url";

function escJsString(s: string): string {
  let o = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\\") o += "\\\\";
    else if (ch === "'") o += "\\'";
    else if (ch === '"') o += '\\"';
    else if (ch === "\n") o += "\\n";
    else if (ch === "\r") o += "\\r";
    else if (ch === "\t") o += "\\t";
    else if (ch === "\b") o += "\\b";
    else if (ch === "\f") o += "\\f";
    else if (ch === "\v") o += "\\v";
    else if (ch === "\0") o += "\\0";
    else if (cp < 32) o += "\\x" + cp.toString(16).padStart(2, "0");
    else o += ch;
  }
  return "'" + o + "'";
}

function unJsString(s: string): string {
  let t = s.trim();
  if (t.length >= 2 && ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"')))) {
    t = t.slice(1, -1);
  }
  return t.replace(/\\(u\{[0-9a-fA-F]{1,6}\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, g: string) => {
    if (g.startsWith("u{")) return String.fromCodePoint(parseInt(g.slice(2, -1), 16));
    if ((g[0] === "u" || g[0] === "x") && g.length > 1) return String.fromCharCode(parseInt(g.slice(1), 16));
    const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0" };
    if (g in map) return map[g];
    return g; // bare char — matches JS string semantics for unknown escapes
  });
}

export function StringEscaperTool() {
  const A = accentOf(2);
  const [mode, setMode] = useState<EscMode>("json");
  const [dir, setDir] = useState<"esc" | "un">("esc");
  const [input, setInput] = useState('He said "line 1\\nline 2" — 100% done & dusted');

  const res = useMemo<{ out: string; err: string | null }>(() => {
    if (!input) return { out: "", err: null };
    try {
      if (mode === "json") {
        return { out: dir === "esc" ? JSON.stringify(input) : (() => {
          const v: unknown = JSON.parse(input.trim());
          if (typeof v !== "string") throw new Error("Parsed value is not a string — paste a complete JSON string literal including its quotes.");
          return v;
        })(), err: null };
      }
      if (mode === "js") return { out: dir === "esc" ? escJsString(input) : unJsString(input), err: null };
      if (mode === "sql") {
        return {
          out: dir === "esc" ? "'" + input.replace(/'/g, "''") + "'" : input.trim().replace(/^'/, "").replace(/'$/, "").replace(/''/g, "'"),
          err: null,
        };
      }
      return { out: dir === "esc" ? encodeURIComponent(input) : decodeURIComponent(input.trim()), err: null };
    } catch (e) {
      return { out: "", err: e instanceof Error ? e.message : "Conversion failed" };
    }
  }, [input, mode, dir]);

  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={mode}
          onChange={setMode}
          accent={A}
          options={[
            { v: "json" as const, label: "JSON" },
            { v: "js" as const, label: "JS string" },
            { v: "sql" as const, label: "SQL literal" },
            { v: "url" as const, label: "URL" },
          ]}
        />
        <Seg
          value={dir}
          onChange={setDir}
          accent="#B9A6FF"
          options={[
            { v: "esc" as const, label: "Escape →" },
            { v: "un" as const, label: "← Unescape" },
          ]}
        />
      </Row>
      <Split
        left={<Area label={dir === "esc" ? "Raw text" : `${mode.toUpperCase()} escaped`} value={input} onChange={setInput} rows={8} />}
        right={<Out label={dir === "esc" ? `${mode} escaped` : "raw text"} text={res.out} rows={8} />}
      />
      {res.err ? <ErrNote msg={res.err} /> : null}
      {mode === "json" ? <Note>JSON.stringify escapes quotes, backslashes and control characters; unicode stays readable. Unescaping requires the full literal including surrounding double quotes.</Note> : null}
      {mode === "js" ? <Note>{"Emits a single-quoted JS literal. Understands \\n \\t \\x41 \\u0041 and \\u{1F600} when unescaping."}</Note> : null}
      {mode === "sql" ? (
        <p className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs leading-relaxed text-rose-300">
          Escaping quotes is NOT injection protection — doubling single quotes only stops a string from ending early.
          The only real defense is parameterized queries / prepared statements. This mode is for reading logs and
          hand-written fixtures, never for building SQL from user input.
        </p>
      ) : null}
      {mode === "url" ? <Note>{`encodeURIComponent keeps A-Z a-z 0-9 - _ . ! ~ * ' ( ) and escapes everything else — including / : ? & =, which is what you want inside one query value.`}</Note> : null}
    </div>
  );
}

/* ==========================================================================
   4. JSON → TypeScript Interfaces — input left, typed-output + stat rail right
   ========================================================================== */

const SAMPLE_JSON = `{
  "id": 42,
  "user": { "name": "Zubair", "tags": ["admin", "dev"], "active": true, "avatar": null },
  "orders": [
    { "orderId": "A-1", "total": 19.5, "items": [{ "sku": "TY-7", "qty": 2, "price": 9.75 }] }
  ]
}`;

interface GenCtx {
  defs: Map<string, string>;
  used: Set<string>;
  fields: number;
}

function pascalName(raw: string): string {
  const parts = raw.replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  let s = parts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
  if (/^[0-9]/.test(s)) s = "Key" + s;
  return s || "Item";
}

function singular(word: string): string {
  if (/ies$/i.test(word)) return word.replace(/ies$/i, "y");
  if (/ss$/i.test(word)) return word;
  if (/s$/i.test(word) && word.length > 3) return word.slice(0, -1);
  return word;
}

function uniqueName(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(base + i)) i++;
  return base + i;
}

function keyToken(k: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
}

function inferType(v: unknown, hint: string, ctx: GenCtx, depth: number, deepest: { d: number }): string {
  deepest.d = Math.max(deepest.d, depth);
  if (v === null) return "null";
  if (Array.isArray(v)) {
    if (v.length === 0) return "unknown[]";
    const hints = v.map((el) => inferType(el, singular(hint) || "Item", ctx, depth + 1, deepest));
    const uniq = [...new Set(hints)];
    return uniq.join(" | ") + "[]";
  }
  if (typeof v === "object") {
    const name = uniqueName(pascalName(singular(hint) || "Item"), ctx.used);
    ctx.used.add(name);
    const rec = v as Record<string, unknown>;
    const lines = Object.entries(rec).map(([k, val]) => {
      ctx.fields++;
      return `  ${keyToken(k)}: ${inferType(val, k, ctx, depth + 1, deepest)};`;
    });
    ctx.defs.set(name, lines.length ? lines.join("\n") : "  [key: string]: unknown;");
    return name;
  }
  return typeof v;
}

export function JsonToTsTool() {
  const A = accentOf(3);
  const [json, setJson] = useState(SAMPLE_JSON);
  const [rootName, setRootName] = useState("RootObject");

  const res = useMemo<{ out: string; interfaces: number; fields: number; depth: number } | { err: string } | null>(() => {
    if (!json.trim()) return null;
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Invalid JSON" };
    }
    const ctx: GenCtx = { defs: new Map(), used: new Set(), fields: 0 };
    const deepest = { d: 0 };
    const rootType = inferType(data, rootName || "RootObject", ctx, 0, deepest);
    const blocks = [...ctx.defs.entries()].map(([n, body]) => `export interface ${n} {\n${body}\n}`);
    const rootPascal = pascalName(rootName || "RootObject");
    if (!ctx.defs.has(rootPascal)) {
      blocks.unshift(`export type ${rootPascal} = ${rootType};`);
    }
    return { out: blocks.join("\n\n"), interfaces: ctx.defs.size, fields: ctx.fields, depth: deepest.d };
  }, [json, rootName]);

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Row>
              <Field label="Root interface name" value={rootName} onChange={setRootName} placeholder="RootObject" className="min-w-[180px] flex-1" />
              <Btn accent={A} onClick={() => { setJson(SAMPLE_JSON); setRootName("RootObject"); }}>Load sample</Btn>
            </Row>
            <Area label="JSON payload" value={json} onChange={setJson} rows={14} placeholder='{ "paste": "any JSON" }' />
          </div>
        }
        right={
          <div className="space-y-3">
            {res && "err" in res ? <ErrNote msg={res.err} /> : null}
            {res && "out" in res ? (
              <>
                <Grid cols={2}>
                  <BigStat label="Interfaces" value={res.interfaces} accent={A} hint="unique named types" />
                  <BigStat label="Fields" value={fmt(res.fields)} accent="#B9A6FF" hint="across all interfaces" />
                </Grid>
                <Out label="typescript" text={res.out} rows={14} />
                <KV k="max nesting" v={res.depth} accent="#7FC8FF" />
              </>
            ) : null}
            {!res ? <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-10 text-center text-sm text-zinc-600">Paste JSON — interfaces are inferred live: nested objects become named types, arrays become element or union types.</p> : null}
          </div>
        }
      />
      <Note>
        Naming: keys are PascalCased and singularized for element types (orders → Order, items → Item); collisions get
        numeric suffixes so every name is unique. Empty arrays degrade to unknown[], empty objects to an index signature,
        and arrays of mixed shapes become union types.
      </Note>
    </div>
  );
}

/* ==========================================================================
   5. MIME Type Lookup — table-first, click row to copy, category filter
   ========================================================================== */

type MimeCat = "text" | "image" | "video" | "audio" | "font" | "archive" | "doc" | "data" | "model" | "other";

const CAT_COLOR: Record<MimeCat, string> = {
  text: "#C6F24E",
  image: "#FF9DE2",
  video: "#7FC8FF",
  audio: "#FFB3C6",
  font: "#B9A6FF",
  archive: "#FF7A3D",
  doc: "#F5D6A3",
  data: "#4ECDC4",
  model: "#9BFF8A",
  other: "#a1a1aa",
};

const MIME_ROWS: [string, string, MimeCat][] = [
  ["html", "text/html", "text"], ["htm", "text/html", "text"], ["css", "text/css", "text"],
  ["js", "text/javascript", "text"], ["mjs", "text/javascript", "text"], ["txt", "text/plain", "text"],
  ["csv", "text/csv", "text"], ["tsv", "text/tab-separated-values", "text"], ["md", "text/markdown", "text"],
  ["ics", "text/calendar", "text"], ["vcf", "text/vcard", "text"], ["xml", "application/xml", "text"],
  ["json", "application/json", "text"], ["yaml", "application/yaml", "text"], ["toml", "application/toml", "text"],
  ["py", "text/x-python", "text"], ["sh", "application/x-sh", "text"], ["rtf", "application/rtf", "text"],
  ["sql", "application/sql", "text"],
  ["png", "image/png", "image"], ["jpg", "image/jpeg", "image"], ["jpeg", "image/jpeg", "image"],
  ["gif", "image/gif", "image"], ["webp", "image/webp", "image"], ["avif", "image/avif", "image"],
  ["svg", "image/svg+xml", "image"], ["ico", "image/x-icon", "image"], ["bmp", "image/bmp", "image"],
  ["tif", "image/tiff", "image"], ["heic", "image/heic", "image"], ["psd", "image/vnd.adobe.photoshop", "image"],
  ["mp4", "video/mp4", "video"], ["webm", "video/webm", "video"], ["mov", "video/quicktime", "video"],
  ["avi", "video/x-msvideo", "video"], ["mkv", "video/x-matroska", "video"], ["m4v", "video/x-m4v", "video"],
  ["ts", "video/mp2t", "video"], ["m3u8", "application/vnd.apple.mpegurl", "video"], ["ogv", "video/ogg", "video"],
  ["mp3", "audio/mpeg", "audio"], ["wav", "audio/wav", "audio"], ["ogg", "audio/ogg", "audio"],
  ["m4a", "audio/mp4", "audio"], ["flac", "audio/flac", "audio"], ["aac", "audio/aac", "audio"],
  ["opus", "audio/opus", "audio"], ["mid", "audio/midi", "audio"], ["weba", "audio/webm", "audio"],
  ["woff", "font/woff", "font"], ["woff2", "font/woff2", "font"], ["ttf", "font/ttf", "font"],
  ["otf", "font/otf", "font"], ["eot", "application/vnd.ms-fontobject", "font"],
  ["zip", "application/zip", "archive"], ["gz", "application/gzip", "archive"], ["tar", "application/x-tar", "archive"],
  ["rar", "application/vnd.rar", "archive"], ["7z", "application/x-7z-compressed", "archive"],
  ["bz2", "application/x-bzip2", "archive"],
  ["pdf", "application/pdf", "doc"], ["doc", "application/msword", "doc"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "doc"],
  ["xls", "application/vnd.ms-excel", "doc"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "doc"],
  ["ppt", "application/vnd.ms-powerpoint", "doc"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "doc"],
  ["odt", "application/vnd.oasis.opendocument.text", "doc"],
  ["ods", "application/vnd.oasis.opendocument.spreadsheet", "doc"],
  ["epub", "application/epub+zip", "doc"],
  ["jsonld", "application/ld+json", "data"], ["rss", "application/rss+xml", "data"],
  ["atom", "application/atom+xml", "data"], ["wasm", "application/wasm", "data"],
  ["bin", "application/octet-stream", "data"], ["apk", "application/vnd.android.package-archive", "data"],
  ["iso", "application/x-iso9660-image", "data"],
  ["glb", "model/gltf-binary", "model"], ["gltf", "model/gltf+json", "model"], ["obj", "model/obj", "model"],
  ["stl", "model/stl", "model"], ["usdz", "model/vnd.usdz+zip", "model"], ["dwg", "image/vnd.dwg", "model"],
  ["kml", "application/vnd.google-earth.kml+xml", "other"], ["dmg", "application/x-apple-diskimage", "other"],
  ["ps", "application/postscript", "other"],
];

const CATS: readonly { v: MimeCat | "all"; label: string }[] = [
  { v: "all", label: "All" },
  { v: "text", label: "Text" },
  { v: "image", label: "Image" },
  { v: "video", label: "Video" },
  { v: "audio", label: "Audio" },
  { v: "font", label: "Font" },
  { v: "archive", label: "Archive" },
  { v: "doc", label: "Doc" },
  { v: "data", label: "Data" },
  { v: "model", label: "Model" },
  { v: "other", label: "Other" },
];

export function MimeTableTool() {
  const A = accentOf(4);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<MimeCat | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  const rows = MIME_ROWS.filter(([ext, mime, c]) => {
    if (cat !== "all" && c !== cat) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return ext.includes(needle) || mime.toLowerCase().includes(needle);
  });

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Search extension or type" value={q} onChange={setQ} placeholder="svg, font, application/vnd…" className="min-w-[220px] flex-1" />
        <Seg value={cat} onChange={setCat} accent={A} options={CATS} />
      </Row>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">ext</th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">mime type — click row to copy</th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([ext, mime, c]) => (
              <tr
                key={ext}
                onClick={() => {
                  navigator.clipboard.writeText(mime).then(() => setCopied(ext)).catch(() => setCopied(null));
                }}
                className="cursor-pointer border-t border-zinc-800/70 hover:bg-zinc-900/60"
              >
                <td className="px-3 py-1.5 font-mono font-bold" style={{ color: copied === ext ? "#5EE39A" : A }}>
                  {copied === ext ? "✓ copied" : `.${ext}`}
                </td>
                <td className="break-all px-3 py-1.5 font-mono text-zinc-300">{mime}</td>
                <td className="px-3 py-1.5"><Tag accent={CAT_COLOR[c]}>{c}</Tag></td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-8 text-center text-zinc-600">No pair matches that filter.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] text-zinc-600">{MIME_ROWS.length} pairs · showing {rows.length}</p>
      <Note>Gotcha: .ts officially maps to video/mp2t (MPEG transport stream), so some CDNs serve your TypeScript bundle with a video content type — force the correct header server-side.</Note>
    </div>
  );
}

/* ==========================================================================
   6. HTTP Security Headers Guide — searchable card grid
   ========================================================================== */

interface HeaderCard {
  name: string;
  what: string;
  example: string;
  gotcha: string;
}

const HEADER_CARDS: HeaderCard[] = [
  {
    name: "Content-Security-Policy",
    what: "Whitelists where scripts, styles, images and frames may come from. The single strongest anti-XSS header — inline injection simply cannot execute if the policy forbids it.",
    example: "default-src 'self'; script-src 'self' https://cdn.zyric.tech; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'",
    gotcha: "'unsafe-inline' in script-src largely defeats the point. Roll out with Content-Security-Policy-Report-Only first so violations are reported, not blocked.",
  },
  {
    name: "Strict-Transport-Security",
    what: "Tells the browser to refuse plain HTTP for this host for the given duration — every http:// link is upgraded before a request leaves the machine.",
    example: "max-age=63072000; includeSubDomains; preload",
    gotcha: "The clock resets only while users visit over HTTPS. Set a long max-age BEFORE submitting to the preload list — once preloaded, reverting a subdomain to HTTP takes months.",
  },
  {
    name: "X-Frame-Options",
    what: "Stops your pages being embedded in someone else's iframe — the classic defense against clickjacking overlays that put an invisible button over a real one.",
    example: "DENY",
    gotcha: "Legacy but still worth sending: CSP frame-ancestors supersedes it, yet older browsers only read X-Frame-Options. Send both; use SAMEORIGIN if you embed yourself.",
  },
  {
    name: "X-Content-Type-Options",
    what: "One value, nosniff. Prevents browsers from MIME-sniffing a response and second-guessing the declared Content-Type — an attacker-supplied .jpg can no longer run as script.",
    example: "nosniff",
    gotcha: "It will break stylesheets and scripts served with a wrong or missing Content-Type. That is the feature: fix the server config, do not remove the header.",
  },
  {
    name: "Referrer-Policy",
    what: "Controls how much of your URL travels to other sites via the Referer header — full URL, origin only, or nothing at all.",
    example: "strict-origin-when-cross-origin",
    gotcha: "That is the modern default, but paths still leak within your own origin — and any page setting 'unsafe-url' sends full URLs everywhere, tokens in querystrings included.",
  },
  {
    name: "Permissions-Policy",
    what: "Declaratively disables powerful browser features — camera, microphone, geolocation, payment — for your page and which third-party origins may use them.",
    example: "camera=(), microphone=(), geolocation=(self \"https://maps.example.com\")",
    gotcha: "Renamed from Feature-Policy; modern browsers read Permissions-Policy, but some older ones still look for the old header name — sending both costs nothing.",
  },
  {
    name: "Access-Control-Allow-Origin",
    what: "The CORS gatekeeper: which origin may read this response from JavaScript. The browser blocks the read when the sending origin is not listed.",
    example: "https://app.zyric.tech",
    gotcha: "Wildcard * combined with Access-Control-Allow-Credentials: true is an invalid combo — browsers reject it. Never reflect the caller origin blindly either; that is CORS with no gate.",
  },
  {
    name: "Cache-Control",
    what: "The master switch for every cache between client and CDN: how long, where, and whether revalidation is required.",
    example: "public, max-age=31536000, immutable",
    gotcha: "immutable is only safe for fingerprinted filenames (app.a9f3c2.js). Pair with no-store on anything private — Authorization-protected responses are not cached by default, but proxies love a sloppy public directive.",
  },
  {
    name: "ETag",
    what: "A fingerprint for the response body. The browser stores it and sends If-None-Match next time; an identical fingerprint earns a 304 with an empty body.",
    example: "W/\"a3f2c9\"",
    gotcha: "Default Apache/NGINX ETags bake in inode and mtime — across a load-balanced cluster those differ, so 304s silently stop working. Set a consistent, content-based ETag yourself.",
  },
];

export function HttpHeadersTool() {
  const A = accentOf(5);
  const [q, setQ] = useState("");
  const rows = HEADER_CARDS.filter((h) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (h.name + " " + h.what + " " + h.gotcha).toLowerCase().includes(needle);
  });
  return (
    <div className="space-y-4">
      <Field label="Filter headers" value={q} onChange={setQ} placeholder="csp, cors, cache, sniffing…" />
      <Grid cols={2}>
        {rows.map((h, i) => (
          <div key={h.name} className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <code className="min-w-0 truncate font-mono text-sm font-bold" style={{ color: i % 2 ? "#7FC8FF" : A }}>{h.name}</code>
              <MiniCopy text={`${h.name}: ${h.example}`} />
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">{h.what}</p>
            <pre className="whitespace-pre-wrap break-all rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-zinc-300">{h.example}</pre>
            <p className="text-[11px] leading-relaxed text-[#FF8A7A]">⚠ {h.gotcha}</p>
          </div>
        ))}
        {rows.length === 0 ? <p className="col-span-full py-8 text-center text-sm text-zinc-600">No header matches that filter.</p> : null}
      </Grid>
      <Note>Copy chip grabs the full header line ready to paste into nginx / Vercel / Cloudflare config. Values are the recommended baseline — tighten CSP per app.</Note>
    </div>
  );
}

/* ==========================================================================
   7. Unicode Inspector — hero input + dense code-point table + \u encode/decode
   ========================================================================== */

const ASCII_NAMES: string[] = (() => {
  const names = [
    "NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "Backspace", "Horizontal tab", "Line feed", "Vertical tab",
    "Form feed", "Carriage return", "Shift out", "Shift in", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB",
    "CAN", "EM", "Substitute", "Escape", "FS", "GS", "RS", "US",
    "Space", "Exclamation mark", "Quotation mark", "Number sign", "Dollar sign", "Percent sign", "Ampersand",
    "Apostrophe", "Left parenthesis", "Right parenthesis", "Asterisk", "Plus sign", "Comma", "Hyphen-minus", "Full stop", "Slash",
  ];
  const digits = "zero one two three four five six seven eight nine".split(" ");
  for (const d of digits) names.push("Digit " + d);
  names.push("Colon", "Semicolon", "Less-than sign", "Equals sign", "Greater-than sign", "Question mark", "Commercial at");
  for (let i = 0; i < 26; i++) names.push("Capital " + String.fromCharCode(65 + i));
  names.push("Left square bracket", "Backslash", "Right square bracket", "Circumflex accent", "Low line", "Grave accent");
  for (let i = 0; i < 26; i++) names.push("Lowercase " + String.fromCharCode(97 + i));
  names.push("Left curly bracket", "Vertical line", "Right curly bracket", "Tilde", "Delete");
  return names; // 128 entries
})();

const BLOCKS: [number, number, string][] = [
  [0x80, 0xff, "Latin-1 Supplement"], [0x100, 0x17f, "Latin Extended-A"], [0x180, 0x24f, "Latin Extended-B"],
  [0x250, 0x2af, "IPA Extensions"], [0x370, 0x3ff, "Greek & Coptic"], [0x400, 0x4ff, "Cyrillic"],
  [0x590, 0x5ff, "Hebrew"], [0x600, 0x6ff, "Arabic"], [0x900, 0x97f, "Devanagari"], [0xe00, 0xe7f, "Thai"],
  [0x10a0, 0x10ff, "Georgian"], [0x1e00, 0x1eff, "Latin Extended Additional"], [0x2000, 0x206f, "General Punctuation"],
  [0x2070, 0x209f, "Superscripts & Subscripts"], [0x20a0, 0x20cf, "Currency Symbols"], [0x2100, 0x214f, "Letterlike Symbols"],
  [0x2190, 0x21ff, "Arrows"], [0x2200, 0x22ff, "Mathematical Operators"], [0x2300, 0x23ff, "Miscellaneous Technical"],
  [0x2500, 0x257f, "Box Drawing"], [0x2580, 0x259f, "Block Elements"], [0x25a0, 0x25ff, "Geometric Shapes"],
  [0x2600, 0x26ff, "Miscellaneous Symbols"], [0x2700, 0x27bf, "Dingbats"], [0x3000, 0x303f, "CJK Symbols & Punctuation"],
  [0x3040, 0x309f, "Hiragana"], [0x30a0, 0x30ff, "Katakana"], [0x4e00, 0x9fff, "CJK Unified Ideographs"],
  [0xac00, 0xd7af, "Hangul Syllables"], [0xf900, 0xfaff, "CJK Compatibility Ideographs"],
  [0xfe00, 0xfe0f, "Variation Selectors"], [0xff00, 0xffef, "Halfwidth & Fullwidth Forms"],
  [0x1d400, 0x1d7ff, "Mathematical Alphanumeric Symbols"], [0x1f300, 0x1f5ff, "Misc Symbols & Pictographs"],
  [0x1f600, 0x1f64f, "Emoticons (Emoji)"], [0x1f900, 0x1f9ff, "Supplemental Symbols & Pictographs"],
  [0x1fa70, 0x1faff, "Symbols & Pictographs Extended-A"],
];

const NAMED_ENTS: Record<number, string> = {
  0x26: "amp", 0x3c: "lt", 0x3e: "gt", 0x22: "quot", 0x27: "apos", 0xa0: "nbsp", 0xa9: "copy", 0xae: "reg",
  0x2122: "trade", 0x2026: "hellip", 0x2014: "mdash", 0x2013: "ndash", 0x2018: "lsquo", 0x2019: "rsquo",
  0x201c: "ldquo", 0x201d: "rdquo", 0xab: "laquo", 0xbb: "raquo", 0xb0: "deg", 0xb1: "plusmn", 0xd7: "times",
  0xf7: "divide", 0x20ac: "euro", 0xa3: "pound", 0xa5: "yen", 0xa2: "cent", 0xa7: "sect", 0xb6: "para",
  0xb7: "middot", 0x2190: "larr", 0x2191: "uarr", 0x2192: "rarr", 0x2193: "darr", 0x221e: "infin", 0x2260: "ne",
  0x2264: "le", 0x2265: "ge",
};

function cpName(cp: number): string {
  if (cp < 128) return ASCII_NAMES[cp];
  for (const [lo, hi, name] of BLOCKS) if (cp >= lo && cp <= hi) return name;
  return "—";
}

function cpEntity(cp: number): string {
  const named = NAMED_ENTS[cp];
  if (named) return `&${named};`;
  if (cp < 33 || cp > 126) return `&#x${cp.toString(16).toUpperCase().padStart(2, "0")};`;
  return "—";
}

function hex4(cp: number): string {
  return cp.toString(16).toUpperCase().padStart(4, "0");
}

function encodeU(s: string): string {
  let o = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\\") o += "\\\\";
    else if (cp >= 32 && cp < 127) o += ch;
    else if (cp <= 0xffff) o += "\\u" + hex4(cp);
    else {
      const h = cp - 0x10000;
      o += "\\u" + hex4(0xd800 + (h >> 10)) + "\\u" + hex4(0xdc00 + (h & 0x3ff));
    }
  }
  return o;
}

function decodeU(s: string): string {
  const braces = s.replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (_, h: string) => {
    const cp = parseInt(h, 16);
    return cp > 0x10ffff ? "\uFFFD" : String.fromCodePoint(cp);
  });
  return braces.replace(/(?:\\u[0-9a-fA-F]{4})+/g, (m) => {
    const codes = [...m.matchAll(/\\u([0-9a-fA-F]{4})/g)].map((x) => parseInt(x[1], 16));
    try {
      return String.fromCodePoint(...codes); // surrogate halves combine here
    } catch {
      return m;
    }
  });
}

export function UnicodeInspectorTool() {
  const A = accentOf(6);
  const [mode, setMode] = useState<"table" | "enc" | "dec">("table");
  const [text, setText] = useState("Zubair → زبیر ✓");

  const chars = useMemo(() => [...text].slice(0, 256), [text]);
  const cps = useMemo(() => [...text], [text]);
  const nonAscii = cps.filter((c) => (c.codePointAt(0) ?? 0) > 127).length;

  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={mode}
          onChange={setMode}
          accent={A}
          options={[
            { v: "table" as const, label: "Code-point table" },
            { v: "enc" as const, label: "Encode \\uXXXX" },
            { v: "dec" as const, label: "Decode \\uXXXX" },
          ]}
        />
        <Field label="Text" value={text} onChange={setText} placeholder="paste anything…" className="min-w-[200px] flex-1" />
      </Row>
      {mode === "table" ? (
        <>
          <Row className="items-center">
            <Tag accent={A}>{fmt(cps.length)} code points</Tag>
            <Tag accent="#7FC8FF">{fmt(new Set(cps).size)} unique</Tag>
            <Tag accent="#FF9DE2">{fmt(nonAscii)} non-ASCII</Tag>
          </Row>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80">
                <tr>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">glyph</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">dec</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">code point</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">entity</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">name / block</th>
                </tr>
              </thead>
              <tbody>
                {chars.map((ch, i) => {
                  const cp = ch.codePointAt(0) ?? 0;
                  const glyph = cp === 32 || cp === 160 ? "␠" : cp < 33 || cp === 127 ? "·" : ch;
                  return (
                    <tr key={i} className="border-t border-zinc-800/70 hover:bg-zinc-900/60">
                      <td className="px-3 py-1 font-mono text-base text-zinc-100">{glyph}</td>
                      <td className="px-3 py-1 font-mono text-zinc-500">{cp}</td>
                      <td className="px-3 py-1 font-mono font-bold" style={{ color: A }}>{`U+${hex4(cp)}`}</td>
                      <td className="px-3 py-1 font-mono text-zinc-400">{cpEntity(cp)}</td>
                      <td className="px-3 py-1 text-zinc-400">{cpName(cp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {cps.length > 256 ? <Note>Table capped at 256 code points — the remaining {fmt(cps.length - 256)} share the same model: dec, U+ hex, entity, name.</Note> : <Note>ASCII names are complete (0–127, every control included); beyond that rows show the Unicode block. ␠ marks a space, · a control character.</Note>}
        </>
      ) : (
        <Split
          left={<Area label={mode === "enc" ? "Raw text" : "\\uXXXX escapes"} value={text} onChange={setText} rows={8} />}
          right={<Out label={mode === "enc" ? "escaped" : "decoded"} text={mode === "enc" ? encodeU(text) : decodeU(text)} rows={8} copy={false} />}
        />
      )}
      {mode !== "table" ? <Note>{"Astral characters (emoji, rare hanzi) escape as UTF-16 surrogate pairs — two \\uXXXX halves — unless you paste them as \\u{1F600}, which decodes as one code point."}</Note> : null}
    </div>
  );
}

/* ==========================================================================
   8. File Hasher & Verifier — drop-zone center stage, verdict + workflow
   ========================================================================== */

const HASH_ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

export function FileHasherTool() {
  const A = accentOf(7);
  const [file, setFile] = useState<File | null>(null);
  const [algo, setAlgo] = useState<(typeof HASH_ALGOS)[number]>("SHA-256");
  const [hash, setHash] = useState("");
  const [ms, setMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expected, setExpected] = useState("");

  useEffect(() => {
    if (!file) return;
    if (typeof crypto === "undefined" || !crypto.subtle) {
      setErr("Web Crypto unavailable — open this page over HTTPS or localhost.");
      return;
    }
    let alive = true;
    setBusy(true);
    setHash("");
    setErr(null);
    const t0 = performance.now();
    void (async () => {
      try {
        const CHUNK = 4 * 1024 * 1024;
        const chunks: Uint8Array[] = [];
        for (let off = 0; off < file.size; off += CHUNK) {
          const buf = await file.slice(off, off + CHUNK).arrayBuffer(); // chunked read
          chunks.push(new Uint8Array(buf));
        }
        const all = new Uint8Array(file.size);
        let o = 0;
        for (const c of chunks) {
          all.set(c, o);
          o += c.length;
        }
        const dig = await crypto.subtle.digest(algo, all);
        const hex = Array.from(new Uint8Array(dig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (!alive) return;
        setHash(hex);
        setMs(performance.now() - t0);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "Digest failed");
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [file, algo]);

  const norm = expected.trim().toLowerCase().replace(/^sha-?\d{3}[:\s]*/i, "").replace(/\s+/g, "");
  const verdict = hash && norm ? (norm === hash ? "match" : "mismatch") : null;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950/70 px-4 py-10 text-center"
      >
        <FileDigit className="mb-3 h-10 w-10" style={{ color: A }} strokeWidth={1.5} />
        {file ? (
          <>
            <p className="max-w-full truncate font-mono text-sm font-bold text-zinc-100">{file.name}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{fmtBytes(file.size)} · drop another file to replace</p>
          </>
        ) : (
          <p className="max-w-full text-sm text-zinc-500">Drop a file here — or</p>
        )}
        <label className="mt-3 cursor-pointer rounded-md border px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition-all hover:bg-white/5"
          style={{ borderColor: `${A}66`, color: A }}>
          Choose file
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
        </label>
      </div>
      <Row>
        <Seg value={algo} onChange={setAlgo} accent={A} options={HASH_ALGOS.map((h) => ({ v: h, label: h }))} />
        {file ? <Btn accent="#FF8A7A" variant="ghost" onClick={() => { setFile(null); setHash(""); setErr(null); }}>Clear</Btn> : null}
        {busy ? <Tag accent="#FFD43B">HASHING…</Tag> : null}
      </Row>
      {err ? <ErrNote msg={err} /> : null}
      {hash ? (
        <>
          <Out label={`${algo} digest`} text={hash} />
          <Grid cols={3}>
            <BigStat label="Digest length" value={hash.length} unit="hex chars" accent={A} hint={`${(hash.length * 4) / 8}-bit hash`} />
            <BigStat label="Time" value={fmt(Math.round(ms))} unit="ms" accent="#7FC8FF" hint="read + digest, in-tab" />
            <BigStat label="Verdict" value={verdict === "match" ? "MATCH" : verdict === "mismatch" ? "MISMATCH" : "—"} accent={verdict === "match" ? "#5EE39A" : verdict === "mismatch" ? "#FF8A7A" : "#a1a1aa"} hint={verdict ? undefined : "paste expected hash below"} />
          </Grid>
          <Field label="Expected hash (from the download page / SUMS file)" value={expected} onChange={setExpected} placeholder="e.g. 9f86d081884c7d65… or sha256:9f86d081…" />
          {verdict ? (
            <Row className="items-center">
              <Tag accent={verdict === "match" ? "#5EE39A" : "#FF8A7A"}>{verdict === "match" ? "VERIFIED — BIT FOR BIT IDENTICAL" : "MISMATCH — CORRUPTED OR TAMPERED"}</Tag>
              {verdict === "mismatch" && norm.length !== hash.length ? <span className="font-mono text-[10px] text-zinc-600">hint: expected is {norm.length} chars, computed is {hash.length}</span> : null}
            </Row>
          ) : null}
        </>
      ) : null}
      <Panel title="verification ritual" accent={A}>
        <ol className="list-inside list-decimal space-y-1 text-xs leading-relaxed text-zinc-400">
          <li>Publisher ships the file plus a checksum line (SHA256SUMS, or a hash on the download page).</li>
          <li>You hash the downloaded file locally with the same algorithm — above, in your browser, no upload.</li>
          <li>Compare every character (case-insensitive): identical = the bytes you received are exactly the bytes that were published. One differing char = re-download.</li>
        </ol>
      </Panel>
      <Note>Files are read in 4 MB slices and digested with crypto.subtle — the native, constant-time implementation. SHA-1 stays listed because many legacy checksum files still use it, but prefer SHA-256 or stronger for anything you actually verify.</Note>
    </div>
  );
}

/* ==========================================================================
   9. HTML Minifier — stacked full-width flow: source → checks → stats → output
   ========================================================================== */

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- build: v2025.06 -->
    <title>Zyric Tools</title>
    <link rel="stylesheet" href="app.css">
  </head>
  <body>
    <div class="hero" data-role="banner">
      <h1>  Browser tools,   zero uploads  </h1>
      <p>Everything runs client-side.</p>
    </div>
    <!--[if lt IE 9]><script src="html5shiv.js"></script><![endif]-->
  </body>
</html>`;

export function HtmlMinifierTool() {
  const A = accentOf(8);
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [dropComments, setDropComments] = useState(true);
  const [dropQuotes, setDropQuotes] = useState(false);

  const res = useMemo(() => {
    if (!html.trim()) return null;
    const kept: string[] = [];
    let t = html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/g, (m) => {
      kept.push(m);
      return `\u0001${kept.length - 1}\u0001`; // preserve conditional comments
    });
    if (dropComments) t = t.replace(/<!--[\s\S]*?-->/g, "");
    t = t.replace(/\s+/g, " ");
    t = t.replace(/>\s+</g, "><").trim();
    if (dropQuotes) t = t.replace(/ ([a-zA-Z-]+)="([^"\s<>=]+)"/g, " $1=$2"); // safe: value has no spaces/quotes/angle brackets/=
    t = t.replace(/\u0001(\d+)\u0001/g, (_, i: string) => kept[Number(i)] ?? "");
    const before = utf8Bytes(html);
    const after = utf8Bytes(t);
    return { out: t, before, after, saved: before > 0 ? (1 - after / before) * 100 : 0 };
  }, [html, dropComments, dropQuotes]);

  return (
    <div className="space-y-4">
      <Area label="HTML source" value={html} onChange={setHtml} rows={10} placeholder="<!DOCTYPE html>…" />
      <Row>
        <Check label="Remove comments (keeps <!--[if …]-->)" checked={dropComments} onChange={setDropComments} />
        <Check label="Remove attribute quotes (safe values only)" checked={dropQuotes} onChange={setDropQuotes} />
      </Row>
      <Grid cols={3}>
        <BigStat label="Before" value={fmtBytes(res?.before ?? 0)} accent="#a1a1aa" />
        <BigStat label="After" value={fmtBytes(res?.after ?? 0)} accent={A} />
        <BigStat label="Saved" value={pct(res?.saved ?? 0)} accent={res && res.saved > 15 ? "#5EE39A" : A} hint="comments · inter-tag whitespace · quotes" />
      </Grid>
      <Out label="minified html" text={res?.out ?? ""} rows={9} />
      <Note>
        Inter-tag whitespace collapses (rendering is unchanged in normal flow), inline text spacing is preserved, and
        quote removal only touches attribute values that contain no spaces, quotes, equals or angle brackets — the same
        rule htmlminifier applies. Conditional comments survive so old-IE shims keep working.
      </Note>
    </div>
  );
}

/* ==========================================================================
   10. JSON Diff — two inputs on top, color-coded diff ledger below
   ========================================================================== */

type DiffKind = "add" | "del" | "chg";

interface DiffRow {
  path: string;
  kind: DiffKind;
  a: string;
  b: string;
  note?: string;
}

const DIFF_COLOR: Record<DiffKind, string> = { add: "#5EE39A", del: "#FF8A7A", chg: "#FFD43B" };
const MAX_DIFF_ROWS = 400;

function jShow(v: unknown): string {
  const s = JSON.stringify(v);
  if (s === undefined) return String(v);
  return s.length > 56 ? s.slice(0, 53) + "…" : s;
}

function jType(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function deepDiff(a: unknown, b: unknown, path: string, rows: DiffRow[], budget: { n: number }): void {
  if (budget.n <= 0) return;
  const ta = jType(a);
  const tb = jType(b);
  if (ta !== tb) {
    rows.push({ path, kind: "chg", a: jShow(a), b: jShow(b), note: `type ${ta} → ${tb}` });
    budget.n--;
    return;
  }
  if (ta === "array" && Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (budget.n <= 0) return;
      const p = `${path}[${i}]`;
      if (i >= b.length) { rows.push({ path: p, kind: "del", a: jShow(a[i]), b: "—" }); budget.n--; }
      else if (i >= a.length) { rows.push({ path: p, kind: "add", a: "—", b: jShow(b[i]) }); budget.n--; }
      else deepDiff(a[i], b[i], p, rows, budget);
    }
    return;
  }
  if (ta === "object") {
    const ra = a as Record<string, unknown>;
    const rb = b as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(ra), ...Object.keys(rb)])].sort();
    for (const k of keys) {
      if (budget.n <= 0) return;
      const p = `${path}.${k}`;
      if (!(k in rb)) { rows.push({ path: p, kind: "del", a: jShow(ra[k]), b: "—" }); budget.n--; }
      else if (!(k in ra)) { rows.push({ path: p, kind: "add", a: "—", b: jShow(rb[k]) }); budget.n--; }
      else deepDiff(ra[k], rb[k], p, rows, budget);
    }
    return;
  }
  if (!Object.is(a, b)) {
    rows.push({ path, kind: "chg", a: jShow(a), b: jShow(b) });
    budget.n--;
  }
}

const DIFF_A = `{
  "name": "zyric",
  "version": "1.4.0",
  "tools": ["xml", "json", "hash"],
  "meta": { "private": true, "license": "MIT" }
}`;

const DIFF_B = `{
  "name": "zyric",
  "version": "1.5.0",
  "tools": ["xml", "json", "hash", "mime"],
  "meta": { "private": false, "license": "MIT", "repo": "github.com/ZubairAlltaf/zyric.tech" }
}`;

export function JsonDiffTool() {
  const A = accentOf(9);
  const [ja, setJa] = useState(DIFF_A);
  const [jb, setJb] = useState(DIFF_B);

  const res = useMemo<{ rows: DiffRow[]; err: string | null }>(() => {
    if (!ja.trim() || !jb.trim()) return { rows: [], err: null };
    let a: unknown;
    let b: unknown;
    try {
      a = JSON.parse(ja);
    } catch (e) {
      return { rows: [], err: `Left side: ${e instanceof Error ? e.message : "invalid JSON"}` };
    }
    try {
      b = JSON.parse(jb);
    } catch (e) {
      return { rows: [], err: `Right side: ${e instanceof Error ? e.message : "invalid JSON"}` };
    }
    const rows: DiffRow[] = [];
    deepDiff(a, b, "$", rows, { n: MAX_DIFF_ROWS });
    return { rows, err: null };
  }, [ja, jb]);

  const adds = res.rows.filter((r) => r.kind === "add").length;
  const dels = res.rows.filter((r) => r.kind === "del").length;
  const chgs = res.rows.filter((r) => r.kind === "chg").length;

  return (
    <div className="space-y-4">
      <Split
        left={<Area label="JSON A (before)" value={ja} onChange={setJa} rows={8} />}
        right={<Area label="JSON B (after)" value={jb} onChange={setJb} rows={8} />}
      />
      {res.err ? <ErrNote msg={res.err} /> : null}
      <Row className="items-center">
        <Tag accent={DIFF_COLOR.add}>+{fmt(adds)} added</Tag>
        <Tag accent={DIFF_COLOR.del}>−{fmt(dels)} removed</Tag>
        <Tag accent={DIFF_COLOR.chg}>~{fmt(chgs)} changed</Tag>
        {res.rows.length >= MAX_DIFF_ROWS ? <Tag accent="#FF8A7A">CAPPED AT {MAX_DIFF_ROWS} ROWS</Tag> : null}
      </Row>
      {res.rows.length > 0 ? (
        <div className="space-y-1">
          {res.rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <span className="font-mono text-xs font-bold" style={{ color: DIFF_COLOR[r.kind] }}>
                {r.kind === "add" ? "+" : r.kind === "del" ? "−" : "~"} {r.path}
              </span>
              <span className="min-w-0 flex-1 break-all font-mono text-[11px] text-zinc-500">
                {r.kind === "add" ? <><span className="text-[#5EE39A]">{r.b}</span> (new)</> : r.kind === "del" ? <><span className="text-[#FF8A7A]">{r.a}</span> (gone)</> : <><span className="text-[#FF8A7A] line-through">{r.a}</span> → <span className="text-[#5EE39A]">{r.b}</span></>}
              </span>
              {r.note ? <Tag accent="#B9A6FF">{r.note}</Tag> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-10 text-center text-sm text-zinc-600">
          Two parsed JSON values appear above — differences render here as a ledger: additions in mint, removals in coral, changes in amber with paths like $meta.repo.
        </p>
      )}
      <Note>Deep, type-aware: replacing an object with a string, or an array with an object, is flagged as a type change rather than an add/remove storm. Object keys diff by name, array items by index.</Note>
    </div>
  );
}

/* ==========================================================================
   11. Byte Inspector — stats-hero + why-length-lies table + size KVs
   ========================================================================== */

interface Measure {
  g: number | null;
  cp: number;
  len: number;
  u8: number;
}

function measure(s: string): Measure {
  return { g: countGraphemes(s), cp: [...s].length, len: s.length, u8: utf8Bytes(s) };
}

const LIE_DEMOS: [string, string][] = [
  ["emoji family", "👨‍👩‍👧"],
  ["e + combining acute", "e\u0301"],
  ["plain ASCII", "A"],
];

export function ByteInspectorTool() {
  const A = accentOf(10);
  const [text, setText] = useState("Hi 👨‍👩‍👧!");

  const m = useMemo(() => measure(text), [text]);
  const b64 = m.u8 > 0 ? Math.ceil(m.u8 / 3) * 4 : 0;
  const overhead = m.u8 > 0 ? ((b64 - m.u8) / m.u8) * 100 : 0;

  return (
    <div className="space-y-4">
      <Area label="Paste text" value={text} onChange={setText} rows={4} />
      <Grid cols={4}>
        <BigStat label="JS .length" value={fmt(m.len)} accent="#FF8A7A" hint="UTF-16 code units" />
        <BigStat label="Code points" value={fmt(m.cp)} accent={A} hint="what Unicode counts" />
        <BigStat label="Graphemes" value={m.g === null ? "n/a" : fmt(m.g)} accent="#5EE39A" hint="what users see" />
        <BigStat label="UTF-8 bytes" value={fmt(m.u8)} unit="B" accent="#7FC8FF" hint="what the wire carries" />
      </Grid>
      <Split
        left={
          <Panel title="why .length lies" accent={A}>
            <div className="overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th className="py-1.5 pr-2 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">string</th>
                    <th className="py-1.5 pr-2 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">graphemes</th>
                    <th className="py-1.5 pr-2 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">code pts</th>
                    <th className="py-1.5 pr-2 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">.length</th>
                    <th className="py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500">utf-8 B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-zinc-800/70">
                    <td className="py-1.5 pr-2 font-mono text-zinc-300">{text.slice(0, 14) || "—"}</td>
                    <td className="py-1.5 pr-2 font-mono text-zinc-300">{m.g === null ? "?" : m.g}</td>
                    <td className="py-1.5 pr-2 font-mono text-zinc-300">{m.cp}</td>
                    <td className="py-1.5 pr-2 font-mono font-bold" style={{ color: m.len !== m.cp ? "#FFD43B" : "#a1a1aa" }}>{m.len}</td>
                    <td className="py-1.5 font-mono text-zinc-300">{m.u8}</td>
                  </tr>
                  {LIE_DEMOS.map(([label, s]) => {
                    const d = measure(s);
                    return (
                      <tr key={label} className="border-t border-zinc-800/70">
                        <td className="py-1.5 pr-2 text-zinc-500"><span className="mr-2 font-mono">{s.slice(0, 4)}</span>{label}</td>
                        <td className="py-1.5 pr-2 font-mono text-zinc-300">{d.g === null ? "?" : d.g}</td>
                        <td className="py-1.5 pr-2 font-mono text-zinc-300">{d.cp}</td>
                        <td className="py-1.5 pr-2 font-mono font-bold" style={{ color: d.len !== d.cp ? "#FFD43B" : "#a1a1aa" }}>{d.len}</td>
                        <td className="py-1.5 font-mono text-zinc-300">{d.u8}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        }
        right={
          <Panel title="wire sizes" accent="#7FC8FF">
            <KV k="UTF-8 bytes" v={`${fmt(m.u8)} B`} accent={A} />
            <KV k="UTF-16 (in-memory)" v={`${fmt(m.len * 2)} B (${fmt(m.len)} units × 2)`} />
            <KV k="base64 of UTF-8" v={`${fmt(b64)} chars`} accent="#B9A6FF" />
            <KV k="base64 overhead" v={pct(overhead)} accent={overhead > 33 ? "#FFD43B" : "#a1a1aa"} />
          </Panel>
        }
      />
      <Note>
        JS strings are sequences of UTF-16 code units, so .length counts 16-bit slots — not characters. The family emoji
        👨‍👩‍👧 is ONE glyph that costs 8 code units and 5 code points (man + ZWJ + woman + ZWJ + girl); é can be 2 units as
        e + combining accent. Sllicing by .length cuts through the middle of characters — use Intl.Segmenter for
        graphemes and [...str] for code points.
      </Note>
    </div>
  );
}

/* ==========================================================================
   12. Regex Cookbook — searchable cheat cards with a shared live highlighter
   ========================================================================== */

interface RegexCard {
  name: string;
  pattern: string;
  flags: string;
  why: string;
  sample: string;
}

const REGEX_CARDS: RegexCard[] = [
  { name: "Email (pragmatic)", pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+", flags: "g", why: "something@domain.tld. Deliberately loose — the fully RFC-compliant regex is a legendary monster; this catches every real-world address without false confidence.", sample: "ping team@zyric.tech or zubair+news@mail.co.uk, but me@@oops is not one" },
  { name: "URL", pattern: "https?://[^\\s<>\"']+", flags: "g", why: "http or https link up to the first space or angle bracket. Good enough for extracting links from prose or logs.", sample: "docs at https://zyric.tech/tools?x=1#c and http://old.example.com/a b" },
  { name: "Hex color", pattern: "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b", flags: "g", why: "#RGB or #RRGGBB. The {3} branch must come first — alternation is ordered, so #6 would otherwise match the long form only when it can.", sample: "palette: #FFD43B #7fc #ABCDEF #12 #5EE39A" },
  { name: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g", why: "Four dot-separated octets. It happily accepts 999.999.999.999 — validate 0–255 ranges in code, or use the stricter 25[0-5] octet pattern.", sample: "server 192.168.1.24 and 10.0.0.1, version 4.2.2 is not an IP" },
  { name: "Date YYYY-MM-DD", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g", why: "ISO 8601 with real month and day validation — rejects 2025-13-40. Still allows 2025-02-30; construct a Date to fully verify.", sample: "ship 2025-03-14, backup 2024-12-31, bogus 2025-13-05" },
  { name: "Strong password", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{12,}$", flags: "", why: "Four lookaheads each demand one character class somewhere in the string, then 12+ chars. Test with .test() on a single line — the anchors make it all-or-nothing.", sample: "Tr0ub4dor&3xyz passes, CorrectHorse1! passes, weakpass fails" },
  { name: "Slug", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", flags: "", why: "Lowercase words joined by single hyphens — the URL-safe identifier. Anchored, so a single stray space or double hyphen fails the whole match.", sample: "best-regex-cheatsheet, Nope_Caps, double--dash, ok-slug-42" },
  { name: "Duplicate words", pattern: "\\b(\\w+)\\s+\\1\\b", flags: "gi", why: "Backreference \\1 re-matches whatever group 1 captured — the classic proofreading detector for the the accidental repetition of words.", sample: "this this is the the classic proofreading trap for for editors" },
  { name: "Phone-ish (NANP)", pattern: "(?:\\+1[-. ]?)?(?:\\(\\d{3}\\)|\\d{3})[-. ]?\\d{3}[-. ]?\\d{4}", flags: "g", why: "US/Canada shapes: (555) 123-4567, 555-123-4567, +1 555 123 4567. Lenient by design — international phones are chaos; match locally, validate separately.", sample: "call +1 (555) 123-4567 or 555.987.6543 tonight, not 12-34" },
  { name: "HTML tag", pattern: "</?[a-zA-Z][^<>]*>", flags: "g", why: "Opening or closing tag with any attributes. Not a parser — for real HTML use the DOM; regex and nested markup famously do not mix.", sample: "<div class=\"x\">text</div> plus <br/> and <img src=\"a.png\">" },
  { name: "24-hour time", pattern: "\\b(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?\\b", flags: "g", why: "HH:MM with optional seconds, hour capped at 23 and minutes/seconds at 59 — 24:00 and 12:5 correctly fail.", sample: "standup 09:30, deploy 23:59:11, bogus 24:00 and 12:5" },
];

interface HiPart {
  t: string;
  hit: boolean;
}

function splitMatches(pattern: string, flags: string, input: string): HiPart[] | null {
  try {
    const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    const parts: HiPart[] = [];
    let last = 0;
    let guard = 0;
    re.lastIndex = 0;
    let m: RegExpExecArray | null = re.exec(input);
    while (m !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        if (re.lastIndex > input.length) break;
        m = re.exec(input);
        continue;
      }
      if (m.index > last) parts.push({ t: input.slice(last, m.index), hit: false });
      parts.push({ t: m[0], hit: true });
      last = m.index + m[0].length;
      if (++guard > 2000) break;
      m = re.exec(input);
    }
    if (last < input.length) parts.push({ t: input.slice(last), hit: false });
    return parts;
  } catch {
    return null;
  }
}

/** Shared highlighter — one component, restyled per card via accent + variant. */
function Hi({ pattern, flags, input, accent, variant }: { pattern: string; flags: string; input: string; accent: string; variant: "bg" | "under" }) {
  const parts = useMemo(() => splitMatches(pattern, flags, input), [pattern, flags, input]);
  if (parts === null) return <p className="font-mono text-[11px] text-[#FF8A7A]">invalid pattern</p>;
  const hits = parts.filter((p) => p.hit).length;
  return (
    <div className="min-w-0">
      <div className="whitespace-pre-wrap break-all rounded border border-zinc-800/70 bg-zinc-950/80 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-zinc-500">
        {parts.map((p, i) =>
          p.hit ? (
            <span
              key={i}
              style={variant === "bg" ? { background: `${accent}2e`, color: accent, borderRadius: 3, padding: "0 2px" } : { borderBottom: `2px solid ${accent}`, color: accent, fontWeight: 700 }}
            >
              {p.t}
            </span>
          ) : (
            <span key={i}>{p.t}</span>
          ),
        )}
      </div>
      <p className="mt-1 font-mono text-[10px] text-zinc-600">{hits > 0 ? `${hits} match${hits === 1 ? "" : "es"}` : "no matches"}</p>
    </div>
  );
}

function RegexCardView({ card, accent, variant }: { card: RegexCard; accent: string; variant: "bg" | "under" }) {
  const [test, setTest] = useState(card.sample);
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-bold text-zinc-100">{card.name}</p>
        <MiniCopy text={`/${card.pattern}/${card.flags}`} />
      </div>
      <code className="block break-all rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-[11px]" style={{ color: accent }}>
        /{card.pattern}/{card.flags}
      </code>
      <p className="text-[11px] leading-relaxed text-zinc-500">{card.why}</p>
      <Field label="test string" value={test} onChange={setTest} />
      <Hi pattern={card.pattern} flags={card.flags} input={test} accent={accent} variant={variant} />
    </div>
  );
}

const CARD_ACCENTS = ["#C6F24E", "#7FC8FF", "#FF9DE2", "#FFD43B", "#B9A6FF", "#5EE39A", "#FF8A7A", "#4ECDC4", "#FFB3C6", "#FF7A3D", "#F5D6A3"];

export function RegexCheatTool() {
  const A = accentOf(11);
  const [q, setQ] = useState("");
  const rows = REGEX_CARDS.filter((c) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (c.name + " " + c.pattern + " " + c.why).toLowerCase().includes(needle);
  });
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Filter recipes" value={q} onChange={setQ} placeholder="email, date, password, backreference…" className="min-w-[220px] flex-1" />
        <Tag accent={A}>{rows.length} / {REGEX_CARDS.length} recipes</Tag>
      </Row>
      <Grid cols={2}>
        {rows.map((c) => {
          const idx = REGEX_CARDS.indexOf(c);
          return <RegexCardView key={c.name} card={c} accent={CARD_ACCENTS[idx % CARD_ACCENTS.length]} variant={idx % 2 === 0 ? "bg" : "under"} />;
        })}
        {rows.length === 0 ? <p className="col-span-full py-8 text-center text-sm text-zinc-600">No recipe matches that filter.</p> : null}
      </Grid>
      <Note>
        Every card runs the pattern against your test string live with the shared highlighter — matches glow in the card
        accent (alternating fill and underline styles). Global flag is added automatically for highlighting; copy the
        chip for a ready-to-paste /pattern/flags literal.
      </Note>
    </div>
  );
}

/* ==========================================================================
   META — registry wiring
   ========================================================================== */

export const devPlusMeta: ToolMeta[] = [
  {
    id: "xml-formatter",
    name: "XML Formatter & Validator",
    description: "Pretty-print, minify and validate XML — real browser parse errors and tag stats",
    category: "devkit",
    icon: FileCode2,
    keywords: "xml, formatter, validator, pretty, minify, parsererror, tags, indent",
    badge: "new",
    component: XmlFormatterTool,
  },
  {
    id: "css-minifier",
    name: "CSS Minifier",
    description: "Strip comments, collapse whitespace, drop dead semicolons — with byte savings stats",
    category: "devkit",
    icon: Shrink,
    keywords: "css, minify, minifier, compress, whitespace, comments, bytes, savings",
    badge: "new",
    component: CssMinifierTool,
  },
  {
    id: "string-escaper",
    name: "String Escaper",
    description: "Escape/unescape between JSON, JS, SQL literals and URL components",
    category: "devkit",
    icon: Quote,
    keywords: "escape, unescape, json, javascript, sql, quote, url, encode, literal",
    badge: "new",
    component: StringEscaperTool,
  },
  {
    id: "json-to-ts",
    name: "JSON → TypeScript Interfaces",
    description: "Infer named TypeScript interfaces from any JSON with unique names and stats",
    category: "devkit",
    icon: Braces,
    keywords: "json, typescript, interfaces, types, infer, generate, dto, codegen",
    badge: "new",
    component: JsonToTsTool,
  },
  {
    id: "mime-table",
    name: "MIME Type Lookup",
    description: "Searchable extension ↔ MIME table — click a row to copy the content type",
    category: "devkit",
    icon: Table2,
    keywords: "mime, content-type, extension, file, table, lookup, http, header",
    badge: "new",
    component: MimeTableTool,
  },
  {
    id: "http-headers",
    name: "HTTP Security Headers Guide",
    description: "CSP, HSTS, CORS, cache cards — what each header does with copy-ready values and gotchas",
    category: "devkit",
    icon: ShieldCheck,
    keywords: "http, headers, security, csp, hsts, cors, cache-control, etag, referrer, permissions-policy",
    badge: "new",
    component: HttpHeadersTool,
  },
  {
    id: "unicode-lookup",
    name: "Unicode Inspector",
    description: "Per-character code points, entities, names and blocks — plus \\uXXXX encode/decode",
    category: "devkit",
    icon: WholeWord,
    keywords: "unicode, codepoint, hex, entity, ascii, block, name, uXXXX, escape, inspect",
    badge: "new",
    component: UnicodeInspectorTool,
  },
  {
    id: "file-hasher",
    name: "File Hasher & Verifier",
    description: "SHA-1/256/384/512 checksums of local files via Web Crypto, with expected-hash verdict",
    category: "devkit",
    icon: FileDigit,
    keywords: "hash, sha256, sha1, checksum, verify, file, digest, crypto, download, integrity",
    badge: "new",
    component: FileHasherTool,
  },
  {
    id: "html-minifier",
    name: "HTML Minifier",
    description: "Remove comments and inter-tag whitespace, optionally drop safe attribute quotes",
    category: "devkit",
    icon: FileMinus,
    keywords: "html, minify, minifier, compress, comments, whitespace, quotes, conditional",
    badge: "new",
    component: HtmlMinifierTool,
  },
  {
    id: "json-diff",
    name: "JSON Diff",
    description: "Deep, type-aware JSON comparison rendered as color-coded added/removed/changed rows",
    category: "devkit",
    icon: GitCompareArrows,
    keywords: "json, diff, compare, deep, changed, added, removed, path, merge",
    badge: "new",
    component: JsonDiffTool,
  },
  {
    id: "byte-inspector",
    name: "Byte Inspector",
    description: "Graphemes vs code points vs UTF-16 .length vs UTF-8/base64 wire sizes",
    category: "devkit",
    icon: Binary,
    keywords: "bytes, utf-8, utf-16, grapheme, codepoint, length, base64, encoding, emoji, segmenter",
    badge: "new",
    component: ByteInspectorTool,
  },
  {
    id: "regex-cheat",
    name: "Regex Cookbook",
    description: "Searchable pattern recipes with live mini-testers and match highlighting",
    category: "devkit",
    icon: Regex,
    keywords: "regex, regexp, patterns, cookbook, email, url, password, cheat, test, highlight",
    badge: "new",
    component: RegexCheatTool,
  },
];
