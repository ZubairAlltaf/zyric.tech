"use client";

/* ==========================================================================
   KIT: DATA & FILES — 16 text/data crunchers. Spreadsheet-grade, zero upload.
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  Area,
  BigStat,
  Btn,
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

function parseRows(text: string, delim: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => l.split(delim).map((c) => c.trim()));
}

/* ------------------------------ 1. CSV → JSON ------------------------------ */

export function CsvToJsonTool() {
  const A = accentOf(0);
  const [text, setText] = useState("");
  const [delim, setDelim] = useState<"," | ";" | "\t" | "|">(",");
  const [headers, setHeaders] = useState(true);
  const out = useMemo(() => {
    const rows = parseRows(text, delim);
    if (!rows.length) return "";
    if (!headers) return JSON.stringify(rows, null, 2);
    const [head, ...body] = rows;
    return JSON.stringify(body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))), null, 2);
  }, [text, delim, headers]);
  const n = parseRows(text, delim).length;
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={delim} onChange={setDelim} accent={A} options={[{ v: "," as const, label: "Comma" }, { v: ";" as const, label: "Semicolon" }, { v: "\t" as const, label: "Tab" }, { v: "|" as const, label: "Pipe" }]} />
        <Seg value={headers ? "y" : "n"} onChange={(v) => setHeaders(v === "y")} accent={A} options={[{ v: "y", label: "First row = headers" }, { v: "n", label: "Raw rows" }]} />
        <Tag accent={A}>{n} lines</Tag>
      </Row>
      <Split left={<Area label="CSV data" value={text} onChange={setText} rows={9} placeholder={"name,city\nAna,Lisbon\nBo,Tokyo"} />} right={<Out label="JSON" text={out} />} />
    </div>
  );
}

/* ------------------------------ 2. JSON → CSV ------------------------------ */

export function JsonToCsvTool() {
  const A = accentOf(1);
  const [text, setText] = useState("");
  const out = useMemo(() => {
    try {
      const data = JSON.parse(text);
      const arr: Record<string, unknown>[] = Array.isArray(data) ? data : [data];
      if (!arr.length) return "";
      const cols = [...new Set(arr.flatMap((o) => Object.keys(o ?? {})))];
      const esc = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      return [cols.join(","), ...arr.map((o) => cols.map((c) => esc(o?.[c])).join(","))].join("\n");
    } catch {
      return "";
    }
  }, [text]);
  return (
    <div className="space-y-4">
      <Area label="JSON array of objects" value={text} onChange={setText} rows={8} placeholder='[{"name":"Ana","city":"Lisbon"}]' />
      <Out label="CSV" text={out} />
      <Note>Columns are the union of every object key. Nested objects flatten to [object Object] — reshape first for best results.</Note>
    </div>
  );
}

/* ------------------------------ 3. CSV cleaner ----------------------------- */

export function CsvCleanerTool() {
  const A = accentOf(2);
  const [text, setText] = useState("");
  const [dedupe, setDedupe] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(true);
  const result = useMemo(() => {
    let lines = text.split(/\r?\n/);
    const before = lines.length;
    if (dropEmpty) lines = lines.filter((l) => l.trim());
    if (dedupe) lines = [...new Set(lines)];
    lines = lines.map((l) => l.split(",").map((c) => c.trim()).join(","));
    return { out: lines.join("\n"), removed: before - lines.length };
  }, [text, dedupe, dropEmpty]);
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={dedupe ? "y" : "n"} onChange={(v) => setDedupe(v === "y")} accent={A} options={[{ v: "y", label: "Remove dupes" }, { v: "n", label: "Keep dupes" }]} />
        <Seg value={dropEmpty ? "y" : "n"} onChange={(v) => setDropEmpty(v === "y")} accent={A} options={[{ v: "y", label: "Drop empty" }, { v: "n", label: "Keep empty" }]} />
        <Tag accent={result.removed ? "#FF8A7A" : "#5EE39A"}>{result.removed} lines removed</Tag>
      </Row>
      <Split left={<Area label="Messy data" value={text} onChange={setText} rows={9} />} right={<Out label="cleaned" text={result.out} />} />
    </div>
  );
}

/* ------------------------------ 4. Transpose ------------------------------- */

export function TransposeTool() {
  const A = accentOf(3);
  const [text, setText] = useState("");
  const [delim, setDelim] = useState<"," | "\t" | "|">(",");
  const out = useMemo(() => {
    const rows = parseRows(text, delim);
    if (!rows.length) return "";
    const w = Math.max(...rows.map((r) => r.length));
    const grid = rows.map((r) => [...r, ...Array(w - r.length).fill("")]);
    return grid[0].map((_, i) => grid.map((r) => r[i]).join(delim === "\t" ? "\t" : delim)).join("\n");
  }, [text, delim]);
  return (
    <div className="space-y-4">
      <Seg value={delim} onChange={setDelim} accent={A} options={[{ v: "," as const, label: "Comma" }, { v: "\t" as const, label: "Tab" }, { v: "|" as const, label: "Pipe" }]} />
      <Split left={<Area label="Original (rows)" value={text} onChange={setText} rows={9} />} right={<Out label="Flipped (columns)" text={out} />} />
      <Note>Rows become columns, columns become rows — the spreadsheet move that takes 12 clicks, done in one paste.</Note>
    </div>
  );
}

/* ------------------------------ 5. Dedupe lines ---------------------------- */

export function DedupeTool() {
  const A = accentOf(4);
  const [text, setText] = useState("");
  const [trim, setTrim] = useState(true);
  const stats = useMemo(() => {
    let lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (trim) lines = lines.map((l) => l.trim());
    const seen = new Set<string>();
    const unique: string[] = [];
    let dupes = 0;
    for (const l of lines) {
      if (seen.has(l)) { dupes++; continue; }
      seen.add(l);
      unique.push(l);
    }
    return { out: unique.join("\n"), dupes, total: lines.length, kept: unique.length };
  }, [text, trim]);
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <BigStat label="Lines in" value={stats.total} accent={A} />
        <BigStat label="Duplicates killed" value={stats.dupes} accent="#FF8A7A" />
        <BigStat label="Unique kept" value={stats.kept} accent="#5EE39A" />
      </Grid>
      <Split left={<Area label="Input" value={text} onChange={setText} rows={9} />} right={<Out label="unique lines" text={stats.out} />} />
    </div>
  );
}

/* ------------------------------ 6. Sort lines ------------------------------ */

export function SortLinesTool() {
  const A = accentOf(5);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"az" | "za" | "num" | "len" | "shuffle">("az");
  const out = useMemo(() => {
    let lines = text.split(/\r?\n/).filter((l) => l.trim());
    switch (mode) {
      case "az": lines.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })); break;
      case "za": lines.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" })); break;
      case "num": lines.sort((x, y) => (parseFloat(y) || 0) - (parseFloat(x) || 0)); break;
      case "len": lines.sort((a, b) => b.length - a.length); break;
      case "shuffle": for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lines[i], lines[j]] = [lines[j], lines[i]]; } break;
    }
    return lines.join("\n");
  }, [text, mode]);
  return (
    <div className="space-y-4">
      <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "az" as const, label: "A → Z" }, { v: "za" as const, label: "Z → A" }, { v: "num" as const, label: "Numeric" }, { v: "len" as const, label: "By length" }, { v: "shuffle" as const, label: "Shuffle" }]} />
      <Split left={<Area label="Input" value={text} onChange={setText} rows={9} />} right={<Out label="sorted" text={out} />} />
      <Note>Natural sorting: item2 stays before item10 — the way humans expect.</Note>
    </div>
  );
}

/* ------------------------------ 7. Column extractor ------------------------ */

export function ColumnTool() {
  const A = accentOf(6);
  const [text, setText] = useState("");
  const [delim, setDelim] = useState<"," | "\t" | ";" | "|">(",");
  const [col, setCol] = useState(1);
  const out = useMemo(() => {
    return parseRows(text, delim)
      .map((r) => r[col - 1] ?? "")
      .filter((v) => v !== "")
      .join("\n");
  }, [text, delim, col]);
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={delim} onChange={setDelim} accent={A} options={[{ v: "," as const, label: "Comma" }, { v: "\t" as const, label: "Tab" }, { v: ";" as const, label: "Semicolon" }, { v: "|" as const, label: "Pipe" }]} />
        <Field label="Column #" value={col} onChange={(v) => setCol(Math.max(1, parseInt(v) || 1))} type="number" className="min-w-[110px]" />
      </Row>
      <Split left={<Area label="Paste table text" value={text} onChange={setText} rows={8} />} right={<Out label={`column ${col}`} text={out} />} />
    </div>
  );
}

/* ------------------------------ 8. Delimiter converter --------------------- */

export function DelimConvertTool() {
  const A = accentOf(7);
  const [text, setText] = useState("");
  const [from, setFrom] = useState<"," | "\t" | ";" | "|">(",");
  const [to, setTo] = useState<"," | "\t" | ";" | "|">("\t");
  const out = useMemo(() => {
    const rows = parseRows(text, from);
    const d = to === "\t" ? "\t" : to;
    return rows.map((r) => r.join(d)).join("\n");
  }, [text, from, to]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="From" value={from === "\t" ? "TAB" : from} onChange={() => {}} className="hidden" />
        <Seg value={from} onChange={setFrom} accent={A} options={[{ v: "," as const, label: "Comma" }, { v: "\t" as const, label: "Tab" }, { v: ";" as const, label: "Semicolon" }, { v: "|" as const, label: "Pipe" }]} />
        <span className="pb-2 font-mono text-xs text-zinc-500">→</span>
        <Seg value={to} onChange={setTo} accent="#5EE39A" options={[{ v: "," as const, label: "Comma" }, { v: "\t" as const, label: "Tab" }, { v: ";" as const, label: "Semicolon" }, { v: "|" as const, label: "Pipe" }]} />
      </Row>
      <Split left={<Area label="Input" value={text} onChange={setText} rows={8} />} right={<Out label="converted" text={out} />} />
    </div>
  );
}

/* ------------------------------ 9. Markdown table -------------------------- */

export function MdTableTool() {
  const A = accentOf(8);
  const [text, setText] = useState("");
  const [delim, setDelim] = useState<"," | "\t" | "|">(",");
  const out = useMemo(() => {
    const rows = parseRows(text, delim);
    if (!rows.length) return "";
    const head = rows[0];
    const body = rows.slice(1);
    const w = Math.max(head.length, ...body.map((r) => r.length));
    const pad = (r: string[]) => [...r, ...Array(w - r.length).fill("")].map((c) => c || " ");
    const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
    return [line(pad(head)), `| ${Array(w).fill("---").join(" | ")} |`, ...body.map((r) => line(pad(r)))].join("\n");
  }, [text, delim]);
  return (
    <div className="space-y-4">
      <Seg value={delim} onChange={setDelim} accent={A} options={[{ v: "," as const, label: "Comma" }, { v: "\t" as const, label: "Tab" }, { v: "|" as const, label: "Pipe" }]} />
      <Split left={<Area label="Raw rows" value={text} onChange={setText} rows={8} placeholder={"name,role\nAda,engineer\nGrace,admiral"} />} right={<Out label="markdown table" text={out} />} />
    </div>
  );
}

/* ------------------------------ 10. Number stats --------------------------- */

export function NumberStatsTool() {
  const A = accentOf(9);
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const nums = (text.match(/-?\d+\.?\d*/g) || []).map(Number);
    if (!nums.length) return null;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
    const counts = new Map<number, number>();
    for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
    const mode = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { n: nums.length, sum, mean, median, min: sorted[0], max: sorted[sorted.length - 1], sd: Math.sqrt(variance), mode: mode[1] > 1 ? `${mode[0]} (×${mode[1]})` : "—" };
  }, [text]);
  return (
    <div className="space-y-4">
      <Area label="Numbers anywhere in the text" value={text} onChange={setText} rows={5} placeholder="42, 17.5, -3, 99, 42" />
      {s ? (
        <>
          <Grid cols={4}>
            <BigStat label="Count" value={s.n} accent={A} />
            <BigStat label="Mean" value={Math.round(s.mean * 100) / 100} accent="#FF9DE2" />
            <BigStat label="Median" value={s.median} accent="#7FC8FF" />
            <BigStat label="Std dev" value={Math.round(s.sd * 100) / 100} accent="#5EE39A" />
          </Grid>
          <Panel title="full breakdown" accent={A}>
            <KV k="sum" v={s.sum} /><KV k="min" v={s.min} /><KV k="max" v={s.max} /><KV k="range" v={s.max - s.min} /><KV k="mode" v={s.mode} />
          </Panel>
        </>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Drop numbers in any format — stats assemble themselves…</p>
      )}
    </div>
  );
}

/* ------------------------------ 11. Anonymizer ----------------------------- */

export function AnonymizerTool() {
  const A = accentOf(10);
  const [text, setText] = useState("");
  const opts = { email: true, phone: true, card: true, ip: true };
  const result = useMemo(() => {
    let t = text;
    let n = 0;
    t = t.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, () => { n++; return "[EMAIL]"; });
    t = t.replace(/(\+?\d[\d\s().-]{7,}\d)/g, () => { n++; return "[PHONE]"; });
    t = t.replace(/\b(?:\d[ -]?){13,16}\b/g, () => { n++; return "[CARD]"; });
    t = t.replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, () => { n++; return "[IP]"; });
    return { out: t, n };
  }, [text]);
  void opts;
  return (
    <div className="space-y-4">
      <Row className="items-center">
        <Tag accent="#5EE39A">Masks: emails · phones · cards · IPs</Tag>
        <Tag accent={result.n ? "#FF8A7A" : A}>{result.n} items masked</Tag>
      </Row>
      <Split left={<Area label="Sensitive paste (stays in this tab)" value={text} onChange={setText} rows={8} placeholder="Contact ana@corp.com or +1 555 234 1122…" />} right={<Out label="scrubbed" text={result.out} />} />
      <Note>Everything runs on your device — the paste never touches a server. Masks are positional, so document shape survives.</Note>
    </div>
  );
}

/* ------------------------------ 12. Email extractor ------------------------ */

export function EmailExtractorTool() {
  const A = accentOf(11);
  const [text, setText] = useState("");
  const [dedupe, setDedupe] = useState(true);
  const emails = useMemo(() => {
    const found = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [];
    const list = dedupe ? [...new Set(found.map((e) => e.toLowerCase().replace(/\.$/, "")))] : found;
    return list;
  }, [text, dedupe]);
  return (
    <div className="space-y-4">
      <Seg value={dedupe ? "y" : "n"} onChange={(v) => setDedupe(v === "y")} accent={A} options={[{ v: "y", label: "Dedupe" }, { v: "n", label: "Raw" }]} />
      <Grid cols={3}>
        <BigStat label="Found" value={emails.length} accent={A} />
        <BigStat label="Domains" value={new Set(emails.map((e) => e.split("@")[1])).size} accent="#5EE39A" />
        <BigStat label="Characters" value={text.length} accent="#7FC8FF" />
      </Grid>
      <Split left={<Area label="Any messy text" value={text} onChange={setText} rows={8} />} right={<Out label="addresses" text={emails.join("\n")} />} />
    </div>
  );
}

/* ------------------------------ 13. URL extractor -------------------------- */

export function UrlExtractorTool() {
  const A = accentOf(0);
  const [text, setText] = useState("");
  const urls = useMemo(() => {
    const found = text.match(/https?:\/\/[^\s"'<>)\]]+/g) || [];
    return [...new Set(found)];
  }, [text]);
  const domains = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of urls) {
      try { const h = new URL(u).host; m.set(h, (m.get(h) || 0) + 1); } catch { /* skip */ }
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [urls]);
  return (
    <div className="space-y-4">
      <Split left={<Area label="Text with links" value={text} onChange={setText} rows={8} />} right={
        <div className="space-y-3">
          <Panel title={`domain census · ${domains.length}`} accent={A}>
            <div className="space-y-0.5">{domains.slice(0, 8).map(([d, n]) => <KV key={d} k={d} v={`×${n}`} accent={A} />)}{!domains.length && <p className="text-sm text-zinc-600">—</p>}</div>
          </Panel>
          <Out label="all urls" text={urls.join("\n")} />
        </div>
      } />
    </div>
  );
}

/* ------------------------------ 14. IP extractor --------------------------- */

export function IpExtractorTool() {
  const A = accentOf(1);
  const [text, setText] = useState("");
  const ips = useMemo(() => [...new Set(text.match(/\b\d{1,3}(\.\d{1,3}){3}\b/g) || [])].filter((ip) => ip.split(".").every((o) => parseInt(o) <= 255)), [text]);
  const classes = useMemo(() => {
    const c = { A: 0, B: 0, C: 0, other: 0 };
    for (const ip of ips) {
      const f = parseInt(ip.split(".")[0]);
      if (f < 128) c.A++; else if (f < 192) c.B++; else if (f < 224) c.C++; else c.other++;
    }
    return c;
  }, [ips]);
  return (
    <div className="space-y-4">
      <Grid cols={4}>
        <BigStat label="Class A" value={classes.A} accent={A} hint="1–126" />
        <BigStat label="Class B" value={classes.B} accent="#5EE39A" hint="128–191" />
        <BigStat label="Class C" value={classes.C} accent="#FF9DE2" hint="192–223" />
        <BigStat label="Total unique" value={ips.length} accent="#7FC8FF" />
      </Grid>
      <Split left={<Area label="Logs or text" value={text} onChange={setText} rows={8} />} right={<Out label="valid ipv4s" text={ips.join("\n")} />} />
    </div>
  );
}

/* ------------------------------ 15. Frequency cloud ------------------------ */

const CLOUD_STOP = new Set("the a an and or but in on at to for of with is are was were be been it its this that as by from i you he she we they my not no".split(" "));

export function FrequencyCloudTool() {
  const A = accentOf(2);
  const [text, setText] = useState("");
  const words = useMemo(() => {
    const freq = new Map<string, number>();
    for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []) {
      if (CLOUD_STOP.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  }, [text]);
  const max = words[0]?.[1] ?? 1;
  return (
    <div className="space-y-4">
      <Area label="Article, notes, transcript…" value={text} onChange={setText} rows={6} mono={false} />
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-zinc-800 bg-zinc-950/70 p-6" style={{ minHeight: 140 }}>
        {words.map(([w, n]) => (
          <span
            key={w}
            className="cursor-default font-black leading-tight transition-colors hover:brightness-125"
            title={`${w}: ${n}×`}
            style={{ fontSize: 14 + (n / max) * 26, color: n === max ? A : n > max / 2 ? "#d4d4d8" : "#71717a" }}
          >
            {w}
          </span>
        ))}
        {!words.length && <p className="text-sm text-zinc-600">Your word cloud blooms here…</p>}
      </div>
      <Note>Size = frequency. Stopwords removed. Hover any word for its exact count.</Note>
    </div>
  );
}

/* ------------------------------ 16. Random sample -------------------------- */

export function SampleRowsTool() {
  const A = accentOf(3);
  const [text, setText] = useState("");
  const [n, setN] = useState(5);
  const [seed, setSeed] = useState(0);
  const rows = useMemo(() => {
    void seed;
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const picked: string[] = [];
    const pool = [...lines];
    const take = Math.min(n, pool.length);
    for (let i = 0; i < take; i++) picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return picked;
  }, [text, n, seed]);
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Sample size" value={n} onChange={setN} min={1} max={50} accent={A} />
        <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Draw again</Btn>
      </Row>
      <Split left={<Area label="Rows (one per line)" value={text} onChange={setText} rows={9} />} right={
        <Panel title={`random ${Math.min(n, parseRows(text, ",").length)} of your rows`} accent={A}>
          <ol className="space-y-1.5">
            {rows.map((r, i) => (
              <li key={i} className="flex gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300">
                <span className="font-mono font-bold" style={{ color: A }}>{i + 1}.</span>
                <span className="min-w-0 break-all">{r}</span>
              </li>
            ))}
            {!rows.length && <li className="py-4 text-center text-sm text-zinc-600">Paste rows and draw…</li>}
          </ol>
        </Panel>
      } />
      <Note>Fair lottery: every row has an equal chance, no repeats. Great for giveaways, QA sampling, survey picks.</Note>
    </div>
  );
}