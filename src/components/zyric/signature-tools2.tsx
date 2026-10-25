"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Info,
  Table2,
  FileDiff,
  Download,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Stat, inputCls, labelCls } from "./hooks";

/* ------------------------------ CSV utilities ------------------------------- */

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function toCSV(rows: string[][]): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const v = cell.trim();
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(",")
    )
    .join("\n");
}

const NUM_RE = /^-?[\d,]+(\.\d+)?%?$/;
const DATE_RE = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/;

type CellKind = "number" | "date" | "text";

function cellKind(v: string): CellKind {
  const t = v.trim();
  if (t === "") return "text";
  if (DATE_RE.test(t)) return "date";
  if (NUM_RE.test(t.replace(/^\$/, "£₹€¥"))) return "number";
  if (NUM_RE.test(t)) return "number";
  return "text";
}

function toNumber(v: string): number {
  return Number(v.trim().replace(/[$£₹€¥,%\s]/g, ""));
}

interface ColReport {
  name: string;
  empty: number;
  padded: number;
  numAsText: number;
  dates: { iso: number; local: number };
  kinds: Record<CellKind, number>;
  duplicates: number;
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

/* -------------------------- Spreadsheet Health Inspector -------------------- */

export function CsvInspectorTool() {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState("");
  const [keyCol, setKeyCol] = useState("0");
  const [raw, setRaw] = useState("");

  const load = (text: string, name: string) => {
    const parsed = parseCSV(text);
    setRows(parsed.length ? parsed : null);
    setFileName(name);
    setKeyCol("0");
  };

  const report = useMemo(() => {
    if (!rows || rows.length < 2) return null;
    const header = rows[0].map((h, i) => (h.trim() === `Column ${i + 1}` || h.trim() === "" ? `Column ${i + 1}` : h.trim()));
    const body = rows.slice(1);
    const cols = Math.max(rows[0].length, ...body.map((r) => r.length));

    const colReports: ColReport[] = [];
    const dupHeaderNames = header.filter((h, i) => header.indexOf(h) !== i);

    for (let c = 0; c < cols; c++) {
      const cr: ColReport = {
        name: header[c] ?? `Column ${c + 1}`,
        empty: 0,
        padded: 0,
        numAsText: 0,
        dates: { iso: 0, local: 0 },
        kinds: { number: 0, date: 0, text: 0 },
        duplicates: 0,
      };
      const seen = new Map<string, number>();
      for (const r of body) {
        const v = (r[c] ?? "").trim();
        if (v === "") {
          cr.empty++;
          continue;
        }
        if ((r[c] ?? "") !== v) cr.padded++;
        const k = cellKind(v);
        cr.kinds[k]++;
        if (k === "number" && (v.includes(",") || /[$£₹€¥%]/.test(v))) cr.numAsText++;
        if (k === "date") {
          if (/^\d{4}/.test(v)) cr.dates.iso++;
          else cr.dates.local++;
        }
        seen.set(v, (seen.get(v) ?? 0) + 1);
      }
      for (const n of seen.values()) if (n > 1) cr.duplicates += n - 1;
      colReports.push(cr);
    }

    const exactDupRows = new Set(body.map((r) => r.join("\u0001"))).size !== body.length;
    const emptyRows = body.filter((r) => r.every((c) => (c ?? "").trim() === "")).length;

    interface Issue {
      sev: "high" | "medium" | "info";
      msg: string;
    }
    const issues: Issue[] = [];
    if (dupHeaderNames.length)
      issues.push({ sev: "high", msg: `Duplicate column names: ${[...new Set(dupHeaderNames)].join(", ")} — many tools will misbehave.` });
    if (emptyRows) issues.push({ sev: "medium", msg: `${emptyRows} completely empty row${emptyRows === 1 ? "" : "s"} — safe to delete.` });
    if (exactDupRows) issues.push({ sev: "high", msg: `Exact duplicate rows detected — the same record appears more than once.` });

    const ki = Math.max(0, Math.min(Number(keyCol) || 0, cols - 1));
    const keyDups = colReports[ki]?.duplicates ?? 0;
    if (keyDups) issues.push({ sev: "high", msg: `Key column “${header[ki]}” has ${keyDups} duplicated value${keyDups === 1 ? "" : "s"} — IDs should be unique.` });

    for (const cr of colReports) {
      const total = body.length;
      const filled = total - cr.empty;
      if (filled === 0) {
        issues.push({ sev: "medium", msg: `Column “${cr.name}” is entirely empty.` });
        continue;
      }
      const dominant = (Object.entries(cr.kinds) as [CellKind, number][]).sort((a, b) => b[1] - a[1])[0][0];
      const other = filled - cr.kinds[dominant];
      if (dominant === "number" && cr.kinds.date > 0)
        issues.push({ sev: "high", msg: `Column “${cr.name}” mixes numbers and dates (${cr.kinds.date} date-like values) — formats will break on import.` });
      else if (dominant === "date" && cr.dates.iso > 0 && cr.dates.local > 0)
        issues.push({ sev: "high", msg: `Column “${cr.name}” mixes date formats: ${cr.dates.iso} ISO (2024-01-31) and ${cr.dates.local} local (31/01/2024) style.` });
      else if (other > 0 && other / filled > 0.05 && !(dominant === "text" && cr.kinds.text / filled > 0.9))
        issues.push({ sev: "medium", msg: `Column “${cr.name}” has mixed content — ${cr.kinds.number} number${cr.kinds.number === 1 ? "" : "s"}, ${cr.kinds.date} date${cr.kinds.date === 1 ? "" : "s"}, ${cr.kinds.text} text value${cr.kinds.text === 1 ? "" : "s"}.` });
      if (cr.kinds.number > 0 && cr.numAsText > 0)
        issues.push({ sev: "info", msg: `${cr.numAsText} value${cr.numAsText === 1 ? "" : "s"} in “${cr.name}” contain${cr.numAsText === 1 ? "s" : ""} currency symbols or thousand commas — clean them so spreadsheets treat them as numbers.` });
      if (cr.padded > 0)
        issues.push({ sev: "info", msg: `${cr.padded} cell${cr.padded === 1 ? "" : "s"} in “${cr.name}” have leading/trailing spaces — a top cause of broken lookups (VLOOKUP misses).` });
      if (cr.empty > 0 && cr.empty / total > 0.3)
        issues.push({ sev: "info", msg: `Column “${cr.name}” is ${Math.round((cr.empty / total) * 100)}% empty.` });
    }

    return { header, body, cols, colReports, issues, emptyRows };
  }, [rows, keyCol]);

  const cleaned = useMemo(() => {
    if (!report) return "";
    const out = [report.header];
    for (const r of report.body) {
      const trimmed = r.map((c) => (c ?? "").trim());
      if (trimmed.every((c) => c === "")) continue;
      out.push(trimmed);
    }
    return toCSV(out);
  }, [report]);

  if (!rows || !report) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-10 text-center">
          <Table2 className="h-8 w-8 text-emerald-400" aria-hidden />
          <p className="text-sm font-medium text-zinc-200">Load a CSV file to run the health check</p>
          <p className="max-w-md text-xs leading-relaxed text-zinc-500">
            Finds duplicate rows &amp; IDs, mixed types, broken dates, invisible spaces, empty cells and numbers stored
            as text — before they corrupt your import. Everything is processed on your device.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv,.tsv,.txt";
                input.onchange = () => {
                  const f = input.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => load(String(reader.result ?? ""), f.name);
                  reader.readAsText(f);
                };
                input.click();
              }}
            >
              Choose CSV file
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              onClick={() => load("name,join_date,salary\nAlice,2024-01-15,\"$3,500\"\nBob ,31/01/2024,4200\nBob,31/01/2024,4200\nCara,,\"$5,000\"\n,,\nDan,2024-03-1 5,3900", "demo.csv")}
            >
              Try a demo file
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="csv-paste" className={labelCls}>Or paste CSV text</Label>
          <Textarea
            id="csv-paste"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={6}
            className={`${inputCls} font-mono text-xs`}
            placeholder={"name,amount,date\nAlice,1200,2024-01-15"}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={() => raw.trim() && load(raw, "pasted-data.csv")}
          >
            Analyze pasted text
          </Button>
        </div>
      </div>
    );
  }

  const preview = [report.header, ...report.body.slice(0, 8)];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">
          <span className="font-semibold text-zinc-100">{fileName}</span> — {report.body.length} data rows ×{" "}
          {report.cols} columns
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          onClick={() => {
            setRows(null);
            setRaw("");
            setFileName("");
          }}
        >
          Load another file
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Data rows" value={String(report.body.length)} />
        <Stat label="Columns" value={String(report.cols)} />
        <Stat label="Issues found" value={String(report.issues.length)} />
        <Stat label="Empty rows" value={String(report.emptyRows)} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden /> Health report
        </p>
        {report.issues.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> No problems found — this file looks healthy.
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {report.issues.map((iss, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-zinc-300">
                {iss.sev === "high" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                ) : iss.sev === "medium" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden />
                )}
                <span>{iss.msg}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="csv-key" className={labelCls}>Duplicate-check column</Label>
            <select
              id="csv-key"
              value={keyCol}
              onChange={(e) => setKeyCol(e.target.value)}
              className={`${inputCls} h-9 rounded-md border bg-zinc-900 px-2.5 text-sm`}
            >
              {report.colReports.map((cr, i) => (
                <option key={i} value={String(i)}>
                  {cr.name}
                </option>
              ))}
            </select>
          </div>
          <p className="pb-2 text-xs text-zinc-500">
            {(report.colReports[Number(keyCol)]?.duplicates ?? 0)} duplicated value(s) in the selected column
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              {preview[0].map((h, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-300">
                  {h || `Column ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.slice(1).map((r, ri) => (
              <tr key={ri} className="border-b border-zinc-800/50 last:border-0">
                {preview[0].map((_, ci) => (
                  <td key={ci} className="max-w-48 truncate whitespace-nowrap px-3 py-1.5 text-zinc-400">
                    {r[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="-mt-3 text-xs text-zinc-600">Preview shows the first {Math.min(8, report.body.length)} rows.</p>

      <Button
        type="button"
        onClick={() => downloadText(fileName.replace(/\.csv$/i, "") + "-cleaned.csv", cleaned, "text/csv")}
        className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
      >
        <Download className="h-4 w-4" aria-hidden /> Download cleaned CSV (trimmed, empty rows removed)
      </Button>
    </div>
  );
}

/* ---------------------------- Document Change Explainer --------------------- */

type LineOp = { type: "same" | "add" | "del"; text: string; aIdx: number; bIdx: number };

function diffLines(aRaw: string[], bRaw: string[], norm: (s: string) => string): LineOp[] {
  const a = aRaw.map(norm);
  const b = bRaw.map(norm);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const n = midA.length;
  const m = midB.length;
  const pairs: [number, number][] = [];

  if (n === 0 || m === 0) {
    for (let i = 0; i < Math.max(n, m); i++) pairs.push([i < n ? i : -1, i < m ? i : -1]);
  } else if (n * m <= 490000) {
    const dp = new Uint32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i * (m + 1) + j] =
          midA[i] === midB[j]
            ? dp[(i + 1) * (m + 1) + j + 1] + 1
            : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + j + 1]);
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (midA[i] === midB[j]) {
        pairs.push([i, j]);
        i++;
        j++;
      } else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + j + 1]) {
        pairs.push([i, -1]);
        i++;
      } else {
        pairs.push([-1, j]);
        j++;
      }
    }
    while (i < n) {
      pairs.push([i, -1]);
      i++;
    }
    while (j < m) {
      pairs.push([-1, j]);
      j++;
    }
  } else {
    const minLen = Math.min(n, m);
    for (let i = 0; i < Math.max(n, m); i++) pairs.push([i < minLen ? i : -1, i < minLen ? i : -1]);
  }

  const ops: LineOp[] = [];
  for (let s = 0; s < start; s++) ops.push({ type: "same", text: aRaw[s], aIdx: s, bIdx: s });
  for (const [ai, bi] of pairs) {
    if (ai >= 0 && bi >= 0) ops.push({ type: "same", text: bRaw[start + bi], aIdx: start + ai, bIdx: start + bi });
    else if (ai >= 0) ops.push({ type: "del", text: aRaw[start + ai], aIdx: start + ai, bIdx: -1 });
    else ops.push({ type: "add", text: bRaw[start + bi], aIdx: -1, bIdx: start + bi });
  }
  for (let s = 0; s < aRaw.length - endA; s++)
    ops.push({ type: "same", text: aRaw[endA + s], aIdx: endA + s, bIdx: endB + s });
  return ops;
}

function wordTokens(s: string): string[] {
  return s.match(/\S+|\s+/g) ?? [];
}

function WordDiff({ oldLine, newLine }: { oldLine: string; newLine: string }) {
  const a = wordTokens(oldLine);
  const b = wordTokens(newLine);
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let sa = a.length;
  let sb = b.length;
  while (sa > p && sb > p && a[sa - 1] === b[sb - 1]) {
    sa--;
    sb--;
  }
  return (
    <div className="mt-1 space-y-0.5 border-l-2 border-amber-500/40 pl-2.5 text-xs leading-relaxed">
      <p className="break-words font-mono text-red-300/90">
        − {a.slice(0, p).map((t, i) => <span key={`k${i}`}>{t}</span>)}
        {a.slice(p, sa).map((t, i) => (
          <span key={`d${i}`} className="rounded bg-red-500/25 font-semibold">{t}</span>
        ))}
        {a.slice(sa).map((t, i) => <span key={`e${i}`}>{t}</span>)}
      </p>
      <p className="break-words font-mono text-emerald-300/90">
        + {b.slice(0, p).map((t, i) => <span key={`k${i}`}>{t}</span>)}
        {b.slice(p, sb).map((t, i) => (
          <span key={`d${i}`} className="rounded bg-emerald-500/25 font-semibold">{t}</span>
        ))}
        {b.slice(sb).map((t, i) => <span key={`e${i}`}>{t}</span>)}
      </p>
    </div>
  );
}

export function DocDiffTool() {
  const [orig, setOrig] = useState("");
  const [rev, setRev] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWs, setIgnoreWs] = useState(true);
  const [ran, setRan] = useState(false);

  const norm = useMemo(() => {
    const ws = (s: string) => (ignoreWs ? s.replace(/\s+/g, " ").trim() : s.replace(/\s+$/g, ""));
    return (s: string) => (ignoreCase ? ws(s).toLowerCase() : ws(s));
  }, [ignoreCase, ignoreWs]);

  const ops = useMemo(() => (ran ? diffLines(orig.split("\n"), rev.split("\n"), norm) : []), [ran, orig, rev, norm]);

  const added = ops.filter((o) => o.type === "add").length;
  const removed = ops.filter((o) => o.type === "del").length;

  const grouped = useMemo(() => {
    const groups: { kind: "same" | "change" | "add" | "del"; items: LineOp[] }[] = [];
    let i = 0;
    while (i < ops.length) {
      const op = ops[i];
      if (op.type !== "same") {
        const dels: LineOp[] = [];
        const adds: LineOp[] = [];
        while (i < ops.length && ops[i].type === "del") dels.push(ops[i++]);
        while (i < ops.length && ops[i].type === "add") adds.push(ops[i++]);
        if (dels.length === adds.length && dels.length > 0) groups.push({ kind: "change", items: [...dels, ...adds] });
        else {
          if (dels.length) groups.push({ kind: "del", items: dels });
          if (adds.length) groups.push({ kind: "add", items: adds });
        }
      } else {
        const items: LineOp[] = [];
        while (i < ops.length && ops[i].type === "same") items.push(ops[i++]);
        groups.push({ kind: "same", items });
      }
    }
    return groups;
  }, [ops]);

  const reportText = useMemo(() => {
    if (!ran) return "";
    const lines = [
      "# Document Change Report",
      "",
      `Generated: ${new Date().toLocaleString()}`,
      `Original: ${orig.split("\n").length} lines · Revised: ${rev.split("\n").length} lines`,
      `Lines added: ${added} · removed: ${removed}`,
      "",
    ];
    let delNo = 0;
    let addNo = 0;
    for (const op of ops) {
      if (op.type === "del") lines.push(`- L${++delNo}: ${op.text}`);
      else if (op.type === "add") lines.push(`+ L${++addNo}: ${op.text}`);
    }
    return lines.join("\n");
  }, [ran, ops, orig, rev, added, removed]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dd-orig" className={labelCls}>Original version</Label>
          <Textarea id="dd-orig" value={orig} onChange={(e) => setOrig(e.target.value)} rows={9} className={`${inputCls} font-mono text-xs`} placeholder="Paste the old contract, email, policy… anything" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-rev" className={labelCls}>Revised version</Label>
          <Textarea id="dd-rev" value={rev} onChange={(e) => setRev(e.target.value)} rows={9} className={`${inputCls} font-mono text-xs`} placeholder="Paste the new version here" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={ignoreWs} onCheckedChange={setIgnoreWs} aria-label="Ignore whitespace changes" />
          Ignore spacing changes
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={ignoreCase} onCheckedChange={setIgnoreCase} aria-label="Ignore letter case" />
          Ignore letter case
        </label>
        <Button
          type="button"
          onClick={() => setRan(true)}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          <ArrowRightLeft className="h-4 w-4" aria-hidden /> Compare versions
        </Button>
      </div>

      {ran && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Lines added" value={String(added)} />
            <Stat label="Lines removed" value={String(removed)} />
            <Stat label="Unchanged" value={String(ops.length - added - removed)} />
          </div>

          {added + removed === 0 ? (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-4 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> The two versions are identical under the current settings.
            </p>
          ) : (
            <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              {grouped.map((g, gi) => {
                if (g.kind === "same") {
                  const shown = g.items.length > 6 ? [...g.items.slice(0, 3), null, ...g.items.slice(-2)] : g.items;
                  return (
                    <div key={gi}>
                      {shown.map((op, i) =>
                        op === null ? (
                          <p key={i} className="px-2 py-0.5 text-center text-[11px] text-zinc-600">··· {g.items.length - 5} unchanged lines ···</p>
                        ) : (
                          <p key={i} className="break-words px-2 py-0.5 font-mono text-xs text-zinc-500">{op.text || " "}</p>
                        )
                      )}
                    </div>
                  );
                }
                if (g.kind === "change")
                  return (
                    <div key={gi} className="rounded-lg border border-amber-900/40 bg-amber-950/10 p-2.5">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Changed</p>
                      {g.items.slice(0, g.items.length / 2).map((op, i) => {
                        const partner = g.items[g.items.length / 2 + i];
                        return <WordDiff key={i} oldLine={op.text} newLine={partner.text} />;
                      })}
                    </div>
                  );
                return (
                  <div key={gi} className={`rounded-lg border p-2.5 ${g.kind === "add" ? "border-emerald-900/50 bg-emerald-950/10" : "border-red-900/50 bg-red-950/10"}`}>
                    <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${g.kind === "add" ? "text-emerald-400" : "text-red-400"}`}>
                      {g.kind === "add" ? "Added" : "Removed"}
                    </p>
                    {g.items.map((op, i) => (
                      <p key={i} className={`break-words font-mono text-xs ${g.kind === "add" ? "text-emerald-300/90" : "text-red-300/90"}`}>
                        {g.kind === "add" ? "+ " : "− "}
                        {op.text || " "}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={() => downloadText("change-report.md", reportText, "text/markdown")}
          >
            <FileDiff className="h-4 w-4" aria-hidden /> Download change report
          </Button>
        </div>
      )}
    </div>
  );
}
