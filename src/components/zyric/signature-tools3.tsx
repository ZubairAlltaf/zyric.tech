"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  Upload,
  PackageCheck,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Stat, uid, useLocalStorage, dateStrOffset, inputCls, labelCls, CopyButton } from "./hooks";

function downloadText(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------ Expiry Calendar ----------------------------- */

interface ExpiryItem {
  id: string;
  name: string;
  category: string;
  date: string;
  warnDays: number;
}

const EXPIRY_CATS = ["Warranty", "Domain", "Subscription", "Insurance", "License", "Passport / ID", "Certificate", "Membership", "Other"];

function daysUntil(date: string): number {
  const target = new Date(date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export function ExpiryCalendarTool() {
  const [items, setItems] = useLocalStorage<ExpiryItem[]>("expiry-items", []);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(EXPIRY_CATS[0]);
  const [date, setDate] = useState(dateStrOffset(30));
  const [warnDays, setWarnDays] = useState("30");
  const [filter, setFilter] = useState("All");

  const enriched = useMemo(() => {
    return items
      .map((it) => ({ ...it, days: daysUntil(it.date) }))
      .sort((a, b) => a.days - b.days);
  }, [items]);

  const visible = filter === "All" ? enriched : enriched.filter((i) => i.category === filter);
  const expired = enriched.filter((i) => i.days < 0).length;
  const urgent = enriched.filter((i) => i.days >= 0 && i.days <= i.warnDays).length;

  const add = () => {
    if (!name.trim() || !date) return;
    setItems([...items, { id: uid(), name: name.trim(), category, date, warnDays: Math.max(0, Number(warnDays) || 0) }]);
    setName("");
  };

  const exportIcs = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//zyric.tech//Expiry Calendar//EN"];
    for (const it of items) {
      const ymd = it.date.replace(/-/g, "");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${it.id}@zyric.tech`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd}`,
        `SUMMARY:${it.name.replace(/[,;\\]/g, " ")} (${it.category})`,
        `DESCRIPTION:Renews/expires today. Set by zyric.tech Expiry Calendar.`,
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");
    downloadText("zyric-expiry-calendar.ics", lines.join("\r\n"), "text/calendar");
  };

  const statusOf = (days: number, warn: number): { label: string; cls: string } => {
    if (days < 0) return { label: `expired ${-days} day${-days === 1 ? "" : "s"} ago`, cls: "border-red-900/60 bg-red-950/20" };
    if (days === 0) return { label: "expires today", cls: "border-red-900/60 bg-red-950/20" };
    if (days <= warn) return { label: `${days} day${days === 1 ? "" : "s"} left`, cls: "border-amber-800/60 bg-amber-950/20" };
    if (days <= warn * 2) return { label: `${days} days left`, cls: "border-teal-800/50 bg-teal-950/10" };
    return { label: `${days} days left`, cls: "border-zinc-800 bg-zinc-900/40" };
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="exp-name" className={labelCls}>What expires?</Label>
          <Input id="exp-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className={inputCls} placeholder="Domain renewal, car insurance…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-cat" className={labelCls}>Category</Label>
          <select id="exp-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} h-9 w-full rounded-md border bg-zinc-900 px-2.5 text-sm`}>
            {EXPIRY_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-date" className={labelCls}>Expiry date</Label>
          <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <Button type="button" onClick={add} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
          <Plus className="h-4 w-4" aria-hidden /> Add
        </Button>
        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="exp-warn" className={labelCls}>Warn me this many days before (applies to new items)</Label>
          <Input id="exp-warn" type="number" min="0" value={warnDays} onChange={(e) => setWarnDays(e.target.value)} className={`${inputCls} w-40`} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Tracked" value={String(items.length)} />
        <Stat label="Expired" value={String(expired)} />
        <Stat label="Need attention" value={String(urgent)} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["All", ...EXPIRY_CATS].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === c
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center text-sm text-zinc-500">
          Nothing tracked yet. Add warranties, domains, subscriptions and IDs so nothing quietly lapses again.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((it) => {
            const st = statusOf(it.days, it.warnDays);
            return (
              <div key={it.id} className={`flex items-center gap-3 rounded-xl border p-3.5 ${st.cls}`}>
                <CalendarClock className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{it.name}</p>
                  <p className="text-xs text-zinc-500">
                    {it.category} · {new Date(it.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${it.days < 0 ? "text-red-400" : it.days <= it.warnDays ? "text-amber-400" : "text-zinc-400"}`}>
                  {st.label}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${it.name}`}
                  onClick={() => setItems(items.filter((x) => x.id !== it.id))}
                  className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportIcs} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
            <Download className="h-4 w-4" aria-hidden /> Export as .ics calendar file
          </Button>
          <p className="pt-2 text-xs text-zinc-500">Import the .ics into Google Calendar, Apple Calendar or Outlook for real reminders.</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Handover Pack Builder ------------------------- */

interface Template {
  label: string;
  groups: { title: string; items: string[] }[];
}

const HANDOVER_TEMPLATES: Template[] = [
  {
    label: "Website",
    groups: [
      { title: "Source & access", items: ["Final source code (zipped or repo invitation sent)", "Hosting control panel / dashboard access", "Domain registrar account access or transfer", "DNS records documented"] },
      { title: "Content & assets", items: ["All images and fonts with licenses", "Logo source files", "Content export (pages, posts)"] },
      { title: "Technical", items: ["SSL certificate status & renewal date", "Deployment / update instructions", "Backup location & restore steps", "Analytics or tracking codes listed"] },
      { title: "Wrap-up", items: ["Final invoice & payment confirmed", "Support period & contact agreed"] },
    ],
  },
  {
    label: "Web App",
    groups: [
      { title: "Source & access", items: ["Repository access (owner role transferred)", "Environment variables documented (.env example)", "Database access / credentials vault", "Third-party API keys & accounts", "Admin panel credentials"] },
      { title: "Technical", items: ["Deployment pipeline / CI explained", "Staging & production URLs listed", "Dependencies & runtime versions documented", "Backup schedule & restore test done", "Error monitoring handed over"] },
      { title: "Documentation", items: ["README with local setup steps", "Architecture overview", "Known issues & technical debt list"] },
      { title: "Wrap-up", items: ["Final invoice & payment confirmed", "Warranty / support window agreed"] },
    ],
  },
  {
    label: "Mobile App",
    groups: [
      { title: "Store & signing", items: ["App Store / Play Console ownership transferred", "Signing keys & keystore delivered securely", "Release certificates documented"] },
      { title: "Source & access", items: ["Repository access transferred", "Push notification & analytics accounts", "API endpoints & keys documented"] },
      { title: "Technical", items: ["Build & release instructions", "Minimum OS versions & device support list", "Crash reporting handed over"] },
      { title: "Wrap-up", items: ["Final invoice & payment confirmed", "Update policy agreed"] },
    ],
  },
  {
    label: "API / Backend",
    groups: [
      { title: "Source & access", items: ["Repository access transferred", "Server / cloud console access", "Database credentials & connection strings", "Secrets moved to client's vault"] },
      { title: "Technical", items: ["API documentation (endpoints, auth, limits)", "Environments & config documented", "Monitoring / alerts handed over", "Rate limits & quotas noted", "Data retention & backup policy"] },
      { title: "Documentation", items: ["Postman collection / OpenAPI spec", "Runbook for common failures"] },
      { title: "Wrap-up", items: ["Final invoice & payment confirmed", "On-call / support terms agreed"] },
    ],
  },
  {
    label: "Automation / Script",
    groups: [
      { title: "Source & access", items: ["Script files & latest version delivered", "Service accounts / credentials documented", "Scheduler or trigger access (cron, webhook)"] },
      { title: "Technical", items: ["Runtime & dependencies listed", "Input/output locations documented", "Failure behaviour & retry logic explained", "Logging location & retention"] },
      { title: "Wrap-up", items: ["Final invoice & payment confirmed", "Change procedure agreed"] },
    ],
  },
];

export function HandoverBuilderTool() {
  const [type, setType] = useState(0);
  const [doneRaw, setDoneRaw] = useLocalStorage<string[]>("handover-done", []);
  const done = useMemo(() => new Set(doneRaw), [doneRaw]);
  const setDone = (s: Set<string>) => setDoneRaw([...s]);
  const [project, setProject] = useState("");
  const [client, setClient] = useState("");
  const [stack, setStack] = useState("");
  const [repo, setRepo] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [notes, setNotes] = useState("");

  const template = HANDOVER_TEMPLATES[type];
  const key = (gi: number, ii: number) => `${type}:${gi}:${ii}`;
  const allKeys = template.groups.flatMap((g, gi) => g.items.map((_, ii) => key(gi, ii)));
  const doneCount = allKeys.filter((k) => done.has(k)).length;

  const toggle = (k: string) => {
    const next = new Set(done);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setDone(next);
  };

  const readme = () => {
    const lines: string[] = [
      `# ${project || "Project"} — Handover Pack`,
      "",
      `**Client:** ${client || "—"}  `,
      `**Date:** ${new Date().toLocaleDateString()}  `,
      `**Project type:** ${template.label}`,
      stack ? `**Tech stack:** ${stack}` : "",
      repo ? `**Repository:** ${repo}` : "",
      liveUrl ? `**Live:** ${liveUrl}` : "",
      "",
      "## Handover checklist",
      "",
    ].filter(Boolean);

    for (const g of template.groups) {
      lines.push(`### ${g.title}`, "");
      for (const item of g.items) {
        const k = key(template.groups.indexOf(g), g.items.indexOf(item));
        lines.push(`- [${done.has(k) ? "x" : " "}] ${item}`);
      }
      lines.push("");
    }
    if (notes.trim()) lines.push("## Handover notes", "", notes.trim(), "");
    lines.push("---", "", `Completion: ${doneCount}/${allKeys.length} items confirmed.`, "Generated with zyric.tech Project Handover Pack Builder.");
    return lines.join("\n");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {HANDOVER_TEMPLATES.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setType(i)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              type === i
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ho-project" className={labelCls}>Project name</Label>
          <Input id="ho-project" value={project} onChange={(e) => setProject(e.target.value)} className={inputCls} placeholder="Acme website redesign" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ho-client" className={labelCls}>Client</Label>
          <Input id="ho-client" value={client} onChange={(e) => setClient(e.target.value)} className={inputCls} placeholder="Acme Ltd" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ho-stack" className={labelCls}>Tech stack</Label>
          <Input id="ho-stack" value={stack} onChange={(e) => setStack(e.target.value)} className={inputCls} placeholder="Next.js, Postgres, Vercel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ho-repo" className={labelCls}>Repository URL</Label>
          <Input id="ho-repo" value={repo} onChange={(e) => setRepo(e.target.value)} className={inputCls} placeholder="https://github.com/…" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ho-live" className={labelCls}>Live URL</Label>
          <Input id="ho-live" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} className={inputCls} placeholder="https://…" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <PackageCheck className="h-4 w-4 text-emerald-400" aria-hidden /> Deliverables checklist
          </p>
          <span className="text-xs font-semibold text-emerald-400">{doneCount} / {allKeys.length}</span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${allKeys.length ? (doneCount / allKeys.length) * 100 : 0}%` }} />
        </div>
        <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
          {template.groups.map((g, gi) => (
            <div key={gi}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.title}</p>
              <div className="space-y-1">
                {g.items.map((item, ii) => {
                  const k = key(gi, ii);
                  const checked = done.has(k);
                  return (
                    <label key={ii} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-800/50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(k)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
                      />
                      <span className={checked ? "text-zinc-500 line-through" : "text-zinc-300"}>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ho-notes" className={labelCls}>Handover notes (goes into the README)</Label>
        <Textarea id="ho-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} placeholder="Credentials are in the shared vault… hosting renews in March…" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => downloadText(`${(project || "handover").toLowerCase().replace(/\s+/g, "-")}-readme.md`, readme(), "text/markdown")}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          <Download className="h-4 w-4" aria-hidden /> Download handover README
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadText("handover-checklist.json", JSON.stringify({ project, client, stack, repo, liveUrl, notes, type, done: [...done] }, null, 2), "application/json")}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          <Upload className="h-4 w-4" aria-hidden /> Save checklist as JSON
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Privacy Scrubber --------------------------- */

interface Finding {
  type: string;
  value: string;
  start: number;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

const SCRUB_PATTERNS: { type: string; re: RegExp; validate?: (v: string) => boolean }[] = [
  { type: "Email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { type: "Phone", re: /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g, validate: (v) => v.replace(/\D/g, "").length >= 9 && v.replace(/\D/g, "").length <= 15 },
  { type: "Card number", re: /\b(?:\d[ -]*?){13,19}\b/g, validate: (v) => luhnValid(v.replace(/\D/g, "")) },
  { type: "IBAN", re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}\b/g },
  { type: "IP address", re: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g },
  { type: "Date of birth", re: /\b(?:DOB|d\.o\.b\.|born(?: on)?)\s*:?\s*[\d/\-.]+\s*\d{2,4}/gi },
];

export function PrivacyScrubberTool() {
  const [text, setText] = useState("");
  const [scanned, setScanned] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [customTerms, setCustomTerms] = useState("");
  const [useBlock, setUseBlock] = useState(true);

  const findings: Finding[] = useMemo(() => {
    if (!scanned) return [];
    const out: Finding[] = [];
    for (const p of SCRUB_PATTERNS) {
      if (enabled[p.type] === false) continue;
      const re = new RegExp(p.re.source, p.re.flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        if (m[0].trim().length === 0) break;
        if (!p.validate || p.validate(m[0])) out.push({ type: p.type, value: m[0], start: m.index });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
    for (const term of customTerms.split(",").map((t) => t.trim()).filter(Boolean)) {
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        out.push({ type: "Custom", value: m[0], start: m.index });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
    return out.sort((a, b) => a.start - b.start);
  }, [scanned, text, enabled, customTerms]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of findings) c[f.type] = (c[f.type] ?? 0) + 1;
    return c;
  }, [findings]);

  const redacted = useMemo(() => {
    if (findings.length === 0) return text;
    const sorted = [...findings].sort((a, b) => b.start - a.start);
    let out = text;
    for (const f of sorted) {
      const repl = useBlock ? "█".repeat(Math.min(f.value.length, 12)) : `[${f.type.toUpperCase().replace(/\s+/g, "_")}]`;
      out = out.slice(0, f.start) + repl + out.slice(f.start + f.value.length);
    }
    return out;
  }, [text, findings, useBlock]);

  const foundTypes = SCRUB_PATTERNS.map((p) => p.type);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ps-text" className={labelCls}>Text to review</Label>
        <Textarea
          id="ps-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setScanned(false);
          }}
          rows={8}
          className={`${inputCls} font-mono text-xs`}
          placeholder="Paste the email, message or report you're about to share…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => setScanned(true)}
          disabled={!text.trim()}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
        >
          <Shield className="h-4 w-4" aria-hidden /> Scan for sensitive data
        </Button>
        <div className="space-y-1.5">
          <Input
            value={customTerms}
            onChange={(e) => {
              setCustomTerms(e.target.value);
              setScanned(false);
            }}
            className={`${inputCls} w-72 text-sm`}
            placeholder="Extra terms to hide, comma-separated"
          />
        </div>
      </div>

      {scanned && (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="mb-3 text-sm font-semibold text-zinc-100">
              {findings.length === 0
                ? "No sensitive data found — but double-check manually; detection is helpful, not perfect."
                : `${findings.length} item${findings.length === 1 ? "" : "s"} found. Choose what to redact:`}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {foundTypes.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-zinc-300">
                  <Switch
                    checked={enabled[t] !== false}
                    onCheckedChange={(v) => {
                      setEnabled({ ...enabled, [t]: v });
                      setScanned(true);
                    }}
                    aria-label={`Redact ${t}`}
                  />
                  {t} {counts[t] ? <span className="text-xs text-emerald-400">({counts[t]})</span> : <span className="text-xs text-zinc-600">(0)</span>}
                </label>
              ))}
            </div>
            {counts["Custom"] ? <p className="mt-2 text-xs text-emerald-400">Custom terms found: {counts["Custom"]}</p> : null}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Replace with</p>
              <p className="text-xs text-zinc-500">Blocks keep length; labels explain what was hidden</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <EyeOff className={`h-4 w-4 ${useBlock ? "text-emerald-400" : "text-zinc-600"}`} aria-hidden />
              <Switch checked={!useBlock} onCheckedChange={(v) => setUseBlock(!v)} aria-label="Toggle between blocks and labels" />
              <Eye className={`h-4 w-4 ${!useBlock ? "text-emerald-400" : "text-zinc-600"}`} aria-hidden />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className={labelCls}>Redacted output</Label>
              <CopyButton text={redacted} label="Copy safe text" />
            </div>
            <Textarea readOnly value={redacted} rows={8} className={`${inputCls} font-mono text-xs`} />
          </div>

          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={() => downloadText("redacted.txt", redacted)}
          >
            <Download className="h-4 w-4" aria-hidden /> Download redacted text
          </Button>
        </>
      )}
    </div>
  );
}
