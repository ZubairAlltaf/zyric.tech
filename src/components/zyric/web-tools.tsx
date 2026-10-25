"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Clock9,
  Network,
  Tags,
  MousePointerClick,
  Globe2,
  Ratio,
  Trash2,
  Save,
  CalendarClock,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage, CopyButton, labelCls, inputCls, Stat, uid } from "./hooks";

/* ---------------------------- Crontab Explainer ---------------------------- */

const CRON_FIELDS = [
  { name: "Minute", min: 0, max: 59, unit: "minute" },
  { name: "Hour", min: 0, max: 23, unit: "hour" },
  { name: "Day of month", min: 1, max: 31, unit: "day of the month" },
  { name: "Month", min: 1, max: 12, unit: "month" },
  { name: "Day of week", min: 0, max: 6, unit: "day of the week" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseCronField(expr: string, min: number, max: number): Set<number> | null {
  const out = new Set<number>();
  for (const part of expr.trim().split(",")) {
    if (!part) return null;
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart !== undefined ? parseInt(stepPart, 10) : 1;
    if (!Number.isInteger(step) || step < 1) return null;
    let lo = min;
    let hi = max;
    if (rangePart !== "*" && rangePart !== "") {
      if (rangePart.includes("-")) {
        const [a, b] = rangePart.split("-").map(Number);
        if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
        lo = a;
        hi = b;
      } else {
        const v = Number(rangePart);
        if (!Number.isInteger(v)) return null;
        if (stepPart !== undefined) {
          lo = v;
          hi = max;
        } else {
          lo = v;
          hi = v;
        }
      }
    }
    if (lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

function describeField(values: Set<number>, min: number, max: number, unit: string, names?: string[]): string {
  const sorted = [...values].sort((a, b) => a - b);
  const label = (v: number) => (names ? names[v - min] ?? String(v) : String(v));
  const joinList = (arr: string[]) => (arr.length <= 1 ? arr[0] : `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`);
  if (sorted.length === max - min + 1) return `every ${unit}`;
  if (sorted.length === 1) return names ? `on ${label(sorted[0])}` : `at ${unit} ${label(sorted[0])}`;
  const runsContiguous = sorted[sorted.length - 1] - sorted[0] === sorted.length - 1;
  if (sorted.length <= 4 && !runsContiguous) {
    return names ? `on ${joinList(sorted.map(label))}` : `at ${unit} ${joinList(sorted.map(label))}`;
  }
  if (runsContiguous) return `between ${label(sorted[0])} and ${label(sorted[sorted.length - 1])}`;
  const stepLen = sorted.length > 1 ? sorted[1] - sorted[0] : 1;
  if (sorted.length > 6 && stepLen > 1 && sorted.every((v, i) => i === 0 || v - sorted[i - 1] === stepLen)) {
    return `every ${stepLen} ${unit}s starting ${label(sorted[0])}`;
  }
  return names ? `on ${joinList(sorted.slice(0, 6).map(label))}${sorted.length > 6 ? ` … (${sorted.length} total)` : ""}` : `${unit}s: ${sorted.slice(0, 8).join(", ")}${sorted.length > 8 ? "…" : ""}`;
}

export function CronTool() {
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");

  const parsed = useMemo(() => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) {
      return { error: "A cron expression has exactly 5 fields (minute hour day month weekday).", sets: [] as (Set<number> | null)[] };
    }
    const sets: (Set<number> | null)[] = [];
    let error: string | null = null;
    for (let i = 0; i < 5; i++) {
      const s = parseCronField(parts[i], CRON_FIELDS[i].min, CRON_FIELDS[i].max);
      if (!s || s.size === 0) {
        error = `“${parts[i]}” is not valid for ${CRON_FIELDS[i].name} (${CRON_FIELDS[i].min}–${CRON_FIELDS[i].max}).`;
        break;
      }
      sets.push(s);
    }
    return { error, sets };
  }, [expr]);

  const nextRuns = useMemo(() => {
    if (parsed.error || parsed.sets.length < 5 || parsed.sets.some((s) => s === null)) return [];
    const [mins, hours, doms, months, dows] = parsed.sets as Set<number>[];
    const out: Date[] = [];
    const t = new Date();
    t.setSeconds(0, 0);
    t.setMinutes(t.getMinutes() + 1);
    const domRestricted = doms.size !== 31;
    const dowRestricted = dows.size !== 7;
    for (let i = 0; i < 527040 && out.length < 5; i++) {
      if (mins.has(t.getMinutes()) && hours.has(t.getHours()) && months.has(t.getMonth() + 1)) {
        const domOk = doms.has(t.getDate());
        const dowOk = dows.has(t.getDay());
        if (domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk) out.push(new Date(t));
      }
      t.setMinutes(t.getMinutes() + 1);
    }
    return out;
  }, [parsed]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="cron-expr" className={labelCls}>Cron expression</Label>
          <Input
            id="cron-expr"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            className={`${inputCls} font-mono text-base tracking-wider`}
            placeholder="*/15 9-17 * * 1-5"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Every 15 min", v: "*/15 * * * *" },
            { label: "Daily 9am", v: "0 9 * * *" },
            { label: "Weekdays 9-5", v: "*/15 9-17 * * 1-5" },
            { label: "Monthly", v: "0 0 1 * *" },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setExpr(p.v)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {parsed.error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{parsed.error}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="mono-kicker text-zinc-500">what it means</p>
            <ul className="space-y-2.5">
              {CRON_FIELDS.map((f, i) => {
                const s = parsed.sets[i];
                if (!s) return null;
                return (
                  <li key={f.name} className="flex gap-3 text-sm">
                    <span className="w-24 shrink-0 font-mono text-xs text-zinc-500">{f.name}</span>
                    <span className="text-zinc-200">
                      {describeField(
                        s,
                        f.min,
                        f.max,
                        f.unit,
                        i === 3 ? MONTHS : i === 4 ? WEEKDAYS : undefined
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="mono-kicker flex items-center gap-2 text-zinc-500">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden /> next 5 runs (device time)
            </p>
            {nextRuns.length === 0 ? (
              <p className="text-sm text-zinc-500">No matching time within the next year.</p>
            ) : (
              <ol className="space-y-2">
                {nextRuns.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] text-emerald-300">
                      {i + 1}
                    </span>
                    {d.toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- IP Subnet Calculator -------------------------- */

function ipToUint32(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let out = 0;
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255 || !/^\d{1,3}$/.test(p)) return null;
    out = (out << 8) | n;
  }
  return out >>> 0;
}

function uint32ToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

export function SubnetTool() {
  const [input, setInput] = useState("192.168.1.10/24");

  const calc = useMemo(() => {
    const [ipStr, cidrStr] = input.trim().split("/");
    const ip = ipToUint32(ipStr ?? "");
    const cidr = Number(cidrStr);
    if (ip === null) return { error: "Enter a valid IPv4 address, e.g. 192.168.1.10." };
    if (!/^\d{1,2}$/.test(cidrStr ?? "") || !Number.isInteger(cidr) || cidr < 0 || cidr > 32)
      return { error: "Add a CIDR suffix between /0 and /32, e.g. 192.168.1.10/24." };
    const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = Math.pow(2, 32 - cidr);
    const usable = cidr >= 31 ? total : total - 2;
    const firstHost = cidr >= 31 ? network : network + 1;
    const lastHost = cidr >= 31 ? broadcast : broadcast - 1;
    const o1 = (ip >>> 24) & 255;
    const cls = o1 < 128 ? "A" : o1 < 192 ? "B" : o1 < 224 ? "C" : o1 < 240 ? "D (multicast)" : "E (reserved)";
    const isPrivate =
      o1 === 10 || (o1 === 172 && ((ip >>> 16) & 255) >= 16 && ((ip >>> 16) & 255) <= 31) || (o1 === 192 && ((ip >>> 16) & 255) === 168);
    return { cidr, ip, mask, network, broadcast, total, usable, firstHost, lastHost, cls, isPrivate };
  }, [input]);

  const rows = "error" in calc
    ? null
    : [
        ["Network address", uint32ToIp(calc.network) + "/" + calc.cidr],
        ["Subnet mask", uint32ToIp(calc.mask)],
        ["Wildcard mask", uint32ToIp(~calc.mask >>> 0)],
        ["Broadcast address", uint32ToIp(calc.broadcast)],
        ["First usable host", uint32ToIp(calc.firstHost)],
        ["Last usable host", uint32ToIp(calc.lastHost)],
        ["Total addresses", calc.total.toLocaleString()],
        ["Usable hosts", calc.usable.toLocaleString()],
        ["Address class", calc.cls],
        ["Scope", calc.isPrivate ? "Private (RFC 1918)" : "Public"],
        ["Binary mask", uint32ToIp(calc.mask).split(".").map((o) => Number(o).toString(2).padStart(8, "0")).join(".")],
      ];

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="subnet-in" className={labelCls}>IPv4 address with CIDR</Label>
        <Input
          id="subnet-in"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`${inputCls} font-mono text-base`}
          placeholder="192.168.1.10/24"
          spellCheck={false}
        />
      </div>
      {"error" in calc ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{calc.error}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Network" value={uint32ToIp(calc.network) + "/" + calc.cidr} />
            <Stat label="Usable range" value={`${uint32ToIp(calc.firstHost)} – ${uint32ToIp(calc.lastHost)}`} />
            <Stat label="Usable hosts" value={calc.usable.toLocaleString()} hint={`${calc.total.toLocaleString()} total addresses`} />
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {rows?.map(([k, v], i) => (
              <div key={k} className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm ${i % 2 ? "bg-zinc-900/40" : "bg-zinc-900/70"}`}>
                <span className="text-zinc-400">{k}</span>
                <span className="break-all font-mono text-xs text-emerald-300">{v}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* --------------------------- Meta Tag Generator ---------------------------- */

export function MetaTagTool() {
  const [title, setTitle] = useState("My Portfolio — Frontend Developer");
  const [desc, setDesc] = useState("I build fast, accessible websites. Explore my projects, blog and open-source work.");
  const [url, setUrl] = useState("https://example.com");
  const [image, setImage] = useState("https://example.com/cover.png");
  const [card, setCard] = useState("summary_large_image");

  const html = useMemo(() => {
    const safe = (s: string) => s.replace(/"/g, "&quot;");
    return [
      `<title>${safe(title)}</title>`,
      `<meta name="description" content="${safe(desc)}" />`,
      `<link rel="canonical" href="${safe(url)}" />`,
      ``,
      `<!-- Open Graph -->`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${safe(title)}" />`,
      `<meta property="og:description" content="${safe(desc)}" />`,
      `<meta property="og:url" content="${safe(url)}" />`,
      `<meta property="og:image" content="${safe(image)}" />`,
      ``,
      `<!-- Twitter / X -->`,
      `<meta name="twitter:card" content="${card}" />`,
      `<meta name="twitter:title" content="${safe(title)}" />`,
      `<meta name="twitter:description" content="${safe(desc)}" />`,
      `<meta name="twitter:image" content="${safe(image)}" />`,
    ].join("\n");
  }, [title, desc, url, image, card]);

  const titleState = title.length === 0 ? "empty" : title.length <= 60 ? "ok" : "long";
  const descState = desc.length === 0 ? "empty" : desc.length <= 160 ? "ok" : "long";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="mt-title" className={labelCls}>Page title</Label>
              <span className={`font-mono text-[11px] ${titleState === "ok" ? "text-emerald-400" : "text-amber-400"}`}>{title.length}/60</span>
            </div>
            <Input id="mt-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="mt-desc" className={labelCls}>Meta description</Label>
              <span className={`font-mono text-[11px] ${descState === "ok" ? "text-emerald-400" : "text-amber-400"}`}>{desc.length}/160</span>
            </div>
            <Input id="mt-desc" value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mt-url" className={labelCls}>Canonical URL</Label>
            <Input id="mt-url" value={url} onChange={(e) => setUrl(e.target.value)} className={`${inputCls} font-mono text-xs`} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mt-img" className={labelCls}>Social image URL</Label>
            <Input id="mt-img" value={image} onChange={(e) => setImage(e.target.value)} className={`${inputCls} font-mono text-xs`} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>Twitter card type</Label>
            <Select value={card} onValueChange={setCard}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                <SelectItem value="summary">summary — small square</SelectItem>
                <SelectItem value="summary_large_image">summary_large_image — big banner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="mono-kicker mb-3 text-zinc-500">search preview</p>
            <div className="space-y-1">
              <p className="w-fit rounded-sm bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">{url || "https://…"}</p>
              <p className="text-lg leading-snug text-[#8ab4f8]">{title || "Page title"}</p>
              <p className="text-sm leading-relaxed text-zinc-400">{desc || "Meta description appears here…"}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2">
              <span className="mono-kicker text-zinc-500">html head</span>
              <CopyButton text={html} label="Copy HTML" />
            </div>
            <pre className="max-h-64 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed text-emerald-300">{html}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ UTM Builder ------------------------------- */

interface SavedUtm {
  id: string;
  url: string;
  label: string;
  at: number;
}

export function UtmTool() {
  const [base, setBase] = useState("https://example.com/launch");
  const [source, setSource] = useState("newsletter");
  const [medium, setMedium] = useState("email");
  const [campaign, setCampaign] = useState("spring-sale");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useLocalStorage<SavedUtm[]>("utm-links", []);

  const finalUrl = useMemo(() => {
    try {
      const u = new URL(base.trim());
      if (source.trim()) u.searchParams.set("utm_source", source.trim());
      if (medium.trim()) u.searchParams.set("utm_medium", medium.trim());
      if (campaign.trim()) u.searchParams.set("utm_campaign", campaign.trim());
      if (term.trim()) u.searchParams.set("utm_term", term.trim());
      if (content.trim()) u.searchParams.set("utm_content", content.trim());
      return u.toString();
    } catch {
      return null;
    }
  }, [base, source, medium, campaign, term, content]);

  const save = () => {
    if (!finalUrl) return;
    setSaved((prev) => [{ id: uid(), url: finalUrl, label: `${campaign || "campaign"} · ${source || "source"}`, at: Date.now() }, ...prev].slice(0, 30));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="utm-base" className={labelCls}>Landing page URL</Label>
          <Input id="utm-base" value={base} onChange={(e) => setBase(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="https://yoursite.com/page" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="utm-src" className={labelCls}>utm_source *</Label>
            <Input id="utm-src" value={source} onChange={(e) => setSource(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="newsletter" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utm-med" className={labelCls}>utm_medium *</Label>
            <Input id="utm-med" value={medium} onChange={(e) => setMedium(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utm-camp" className={labelCls}>utm_campaign</Label>
            <Input id="utm-camp" value={campaign} onChange={(e) => setCampaign(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="spring-sale" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utm-term" className={labelCls}>utm_term</Label>
            <Input id="utm-term" value={term} onChange={(e) => setTerm(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="paid keyword" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="utm-content" className={labelCls}>utm_content</Label>
            <Input id="utm-content" value={content} onChange={(e) => setContent(e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="header-cta vs footer-cta" />
          </div>
        </div>
        {finalUrl ? (
          <div className="space-y-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
            <p className="mono-kicker text-emerald-300">tracked url</p>
            <p className="break-all font-mono text-xs text-zinc-200">{finalUrl}</p>
            <div className="flex gap-2 pt-1">
              <CopyButton text={finalUrl} label="Copy URL" />
              <Button type="button" size="sm" variant="outline" onClick={save} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
                <Save className="h-3.5 w-3.5" aria-hidden /> Save link
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            Base URL must include the protocol, e.g. https://yoursite.com/page
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <p className="mono-kicker text-zinc-500">saved links ({saved.length})</p>
        {saved.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
            Build a URL and hit “Save link” — it stays in this browser.
          </p>
        ) : (
          <ul className="space-y-2">
            {saved.map((s) => (
              <li key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-200">{s.label}</p>
                  <button
                    type="button"
                    onClick={() => setSaved((prev) => prev.filter((x) => x.id !== s.id))}
                    aria-label={`Delete ${s.label}`}
                    className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">{s.url}</p>
                <div className="mt-2"><CopyButton text={s.url} label="Copy" /></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Time Zone Converter -------------------------- */

const ZONES = [
  "UTC", "Asia/Karachi", "Asia/Dhaka", "Asia/Kolkata", "Asia/Dubai", "Asia/Riyadh", "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Jakarta", "Asia/Bangkok", "Asia/Tehran", "Asia/Istanbul", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Istanbul", "Europe/Moscow", "Europe/Amsterdam", "Europe/Zurich", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo", "America/Mexico_City", "Australia/Sydney", "Australia/Melbourne", "Australia/Perth", "Pacific/Auckland", "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg", "Africa/Nairobi",
];

function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - instant.getTime();
}

function instantInZone(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}

function localOffsetLabel(ms: number): string {
  const sign = ms >= 0 ? "+" : "−";
  const mins = Math.round(Math.abs(ms) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}

function zonedToInstant(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off1 = tzOffsetMs(new Date(guess), tz);
  const off2 = tzOffsetMs(new Date(guess - off1), tz);
  return new Date(guess - off2);
}

export function TimezoneTool() {
  const [dtLocal, setDtLocal] = useState(() => {
    const n = new Date();
    const p = (x: number) => String(x).padStart(2, "0");
    return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`;
  });
  const [fromTz, setFromTz] = useState("Asia/Karachi");
  const [toTz, setToTz] = useState("America/New_York");
  const [localTz, setLocalTz] = useState<string | null>(null);

  // Resolve the visitor's own zone after hydration (keeps SSR output stable)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setLocalTz(new Intl.DateTimeFormat().resolvedOptions().timeZone);
      } catch {
        /* Intl unavailable */
      }
    });
  }, []);

  const result = useMemo(() => {
    const m = dtLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m.map(Number);
    const instant = zonedToInstant(y, mo, d, h, mi, fromTz);
    const fromOff = tzOffsetMs(instant, fromTz);
    const toOff = tzOffsetMs(instant, toTz);
    const diffMin = Math.round((toOff - fromOff) / 60000);
    return { instant, fromOff, toOff, diffMin };
  }, [dtLocal, fromTz, toTz]);

  const useNow = () => {
    const n = new Date();
    const p = (x: number) => String(x).padStart(2, "0");
    setDtLocal(`${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`);
  };

  const diffText = result
    ? result.diffMin === 0
      ? "Same time in both zones"
      : `${toTz} is ${Math.abs(result.diffMin) >= 60 ? `${Math.floor(Math.abs(result.diffMin) / 60)}h` : ""}${Math.abs(result.diffMin) % 60 ? `${Math.abs(result.diffMin) % 60}m` : ""} ${result.diffMin > 0 ? "ahead of" : "behind"} ${fromTz}`
    : "";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-1.5">
          <Label className={labelCls}>From zone</Label>
          <Select value={fromTz} onValueChange={setFromTz}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72 border-zinc-700 bg-zinc-900 text-zinc-100">
              {localTz && localTz !== fromTz && <SelectItem value={localTz}>{localTz} (this device)</SelectItem>}
              {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden items-end pb-1.5 sm:flex">
          <button type="button" onClick={() => { setFromTz(toTz); setToTz(fromTz); }} aria-label="Swap zones" className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-300">
            <Globe2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>To zone</Label>
          <Select value={toTz} onValueChange={setToTz}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72 border-zinc-700 bg-zinc-900 text-zinc-100">
              {localTz && localTz !== toTz && <SelectItem value={localTz}>{localTz} (this device)</SelectItem>}
              {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="tz-dt" className={labelCls}>Date & time (in “from” zone)</Label>
          <Input id="tz-dt" type="datetime-local" value={dtLocal} onChange={(e) => setDtLocal(e.target.value)} className={`${inputCls} font-mono`} />
        </div>
        <Button type="button" variant="outline" onClick={useNow} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
          Use current time
        </Button>
      </div>

      {result ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <p className="mono-kicker text-emerald-300">{fromTz} · {localOffsetLabel(result.fromOff)}</p>
            <p className="mt-1.5 font-display text-lg font-semibold text-zinc-50">{instantInZone(result.instant, fromTz)}</p>
          </div>
          <div className="rounded-2xl border border-teal-500/25 bg-teal-500/5 p-4">
            <p className="mono-kicker text-teal-300">{toTz} · {localOffsetLabel(result.toOff)}</p>
            <p className="mt-1.5 font-display text-lg font-semibold text-zinc-50">{instantInZone(result.instant, toTz)}</p>
          </div>
          <p className="sm:col-span-2 text-center text-sm text-zinc-400">{diffText}</p>
        </div>
      ) : (
        <p className="text-sm text-red-400">Pick a valid date and time.</p>
      )}
    </div>
  );
}

/* --------------------------- Aspect Ratio Calculator ----------------------- */

const RATIO_PRESETS: [number, number][] = [
  [1, 1], [4, 3], [3, 2], [16, 9], [21, 9], [9, 16], [2, 3], [5, 4],
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function AspectTool() {
  const [w, setW] = useState("1920");
  const [h, setH] = useState("1080");
  const [solveSide, setSolveSide] = useState<"width" | "height">("width");
  const [ratioW, setRatioW] = useState("16");
  const [ratioH, setRatioH] = useState("9");
  const [knownSide, setKnownSide] = useState("1200");

  const wi = Number(w);
  const hi = Number(h);
  const dimsValid = Number.isInteger(wi) && wi > 0 && Number.isInteger(hi) && hi > 0;
  const g = dimsValid ? gcd(wi, hi) : 1;
  const rw = dimsValid ? wi / g : 0;
  const rh = dimsValid ? hi / g : 0;

  const rwi = Number(ratioW);
  const rhi = Number(ratioH);
  const ksi = Number(knownSide);
  const ratioValid = Number.isInteger(rwi) && rwi > 0 && Number.isInteger(rhi) && rhi > 0;
  const solved = ratioValid && Number.isInteger(ksi) && ksi > 0
    ? solveSide === "width"
      ? Math.round((ksi * rwi) / rhi)
      : Math.round((ksi * rhi) / rwi)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="mono-kicker text-zinc-500">from dimensions → ratio</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ar-w" className={labelCls}>Width (px)</Label>
            <Input id="ar-w" value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, ""))} className={`${inputCls} font-mono`} inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ar-h" className={labelCls}>Height (px)</Label>
            <Input id="ar-h" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ""))} className={`${inputCls} font-mono`} inputMode="numeric" />
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
          <p className="font-display text-2xl font-bold text-emerald-300">{dimsValid ? `${rw}:${rh}` : "—"}</p>
          <p className="text-xs text-zinc-500">{dimsValid ? `decimal ratio ${(wi / hi).toFixed(4)}` : "Enter positive whole dimensions"}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RATIO_PRESETS.map(([a, b]) => (
            <button
              key={`${a}-${b}`}
              type="button"
              onClick={() => { setRatioW(String(a)); setRatioH(String(b)); }}
              className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${
                ratioValid && rwi === a && rhi === b
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300"
              }`}
            >
              {a}:{b}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className="mono-kicker text-zinc-500">from ratio → missing dimension</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ar-rw" className={labelCls}>Ratio width</Label>
            <Input id="ar-rw" value={ratioW} onChange={(e) => setRatioW(e.target.value.replace(/\D/g, ""))} className={`${inputCls} font-mono`} inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ar-rh" className={labelCls}>Ratio height</Label>
            <Input id="ar-rh" value={ratioH} onChange={(e) => setRatioH(e.target.value.replace(/\D/g, ""))} className={`${inputCls} font-mono`} inputMode="numeric" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={solveSide === "width" ? "default" : "outline"} onClick={() => setSolveSide("width")} className={solveSide === "width" ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400" : "border-zinc-700 bg-zinc-900 text-zinc-300"}>
            Solve height
          </Button>
          <Button type="button" size="sm" variant={solveSide === "height" ? "default" : "outline"} onClick={() => setSolveSide("height")} className={solveSide === "height" ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400" : "border-zinc-700 bg-zinc-900 text-zinc-300"}>
            Solve width
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ar-known" className={labelCls}>Known side (px)</Label>
          <Input id="ar-known" value={knownSide} onChange={(e) => setKnownSide(e.target.value.replace(/\D/g, ""))} className={`${inputCls} font-mono`} inputMode="numeric" />
        </div>
        <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 px-4 py-3">
          <p className="font-display text-2xl font-bold text-teal-300">{solved !== null ? `${solved}px` : "—"}</p>
          <p className="text-xs text-zinc-500">
            {ratioValid && solved !== null
              ? solveSide === "width"
                ? `height for width ${ksi}px at ${rwi}:${rhi}`
                : `width for height ${ksi}px at ${rwi}:${rhi}`
              : "Enter a ratio and a known side"}
          </p>
        </div>
        <div
          className="flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/60"
          style={{ aspectRatio: dimsValid ? `${wi} / ${hi}` : "16 / 9", maxHeight: 160 }}
        >
          <span className="font-mono text-xs text-zinc-400">{dimsValid ? `${wi} × ${hi}` : "preview"}</span>
        </div>
      </div>
    </div>
  );
}
