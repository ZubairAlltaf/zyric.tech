"use client";

/* ==========================================================================
   KIT: DEV & CODE — 22 developer instruments. Terminal-flavored screens.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
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
} from "./kit";

/* ------------------------------ 1. JWT decoder ----------------------------- */

function b64url(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return s;
}

export function JwtDecoderTool() {
  const A = accentOf(0);
  const [token, setToken] = useState("");
  const parts = useMemo(() => {
    const segs = token.trim().split(".");
    if (segs.length < 2) return null;
    try {
      const header = JSON.parse(atob(b64url(segs[0])));
      const payload = JSON.parse(atob(b64url(segs[1])));
      return { header, payload, sig: segs[2] ?? "" };
    } catch {
      return null;
    }
  }, [token]);
  const exp = parts?.payload?.exp ? new Date(parts.payload.exp * 1000) : null;
  const expired = exp ? exp.getTime() < Date.now() : null;
  return (
    <div className="space-y-4">
      <Area label="Paste the JWT (decoded locally — nothing leaves this tab)" value={token} onChange={setToken} rows={5} placeholder="eyJhbGciOi…" />
      {token && !parts ? <p className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">Not a parseable JWT — need header.payload segments.</p> : null}
      {parts ? (
        <Split
          left={<Panel title="header" accent={A}><pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">{JSON.stringify(parts.header, null, 2)}</pre></Panel>}
          right={<Panel title="payload" accent={A}><pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">{JSON.stringify(parts.payload, null, 2)}</pre></Panel>}
        />
      ) : null}
      {exp ? (
        <Row className="items-center">
          <BigStat label="Expires" value={exp.toLocaleString()} accent={expired ? "#FF8A7A" : "#5EE39A"} />
          <Tag accent={expired ? "#FF8A7A" : "#5EE39A"}>{expired ? "EXPIRED" : "STILL VALID"}</Tag>
        </Row>
      ) : null}
      <Note>Signature is shown but never verified — verification needs your secret, which this tool deliberately never asks for.</Note>
    </div>
  );
}

/* ------------------------------ 2. Query params ---------------------------- */

export function QueryParamsTool() {
  const A = accentOf(1);
  const [url, setUrl] = useState("");
  const parsed = useMemo(() => {
    try {
      const u = new URL(url.trim());
      const params = [...u.searchParams.entries()];
      return { ok: true as const, host: u.host, path: u.pathname, hash: u.hash, params };
    } catch {
      return { ok: false as const };
    }
  }, [url]);
  return (
    <div className="space-y-4">
      <Field label="Full URL" value={url} onChange={setUrl} placeholder="https://shop.com/search?q=shoes&size=42&sort=price#results" />
      {parsed.ok ? (
        <div className="space-y-3">
          <Grid cols={3}>
            <BigStat label="Host" value={parsed.host} accent={A} />
            <BigStat label="Path" value={parsed.path} accent="#4ECDC4" />
            <BigStat label="Params" value={parsed.params.length} accent="#FF9DE2" />
          </Grid>
          <Panel title="parameters" accent={A}>
            {parsed.params.length === 0 ? (
              <p className="text-sm text-zinc-500">No query parameters.</p>
            ) : (
              <div className="space-y-1">
                {parsed.params.map(([k, v], i) => (
                  <KV key={i} k={k} v={<span className="break-all font-mono text-xs">{v || <i className="text-zinc-600">empty</i>}</span>} accent={A} />
                ))}
              </div>
            )}
          </Panel>
          {parsed.hash ? <KV k="fragment" v={parsed.hash} /> : null}
        </div>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Paste a full URL above — every param gets pulled apart with types and all.</p>
      )}
    </div>
  );
}

/* ------------------------------ 3. UA parser ------------------------------- */

export function UaParserTool() {
  const A = accentOf(2);
  const [ua, setUa] = useState(() => (typeof navigator !== "undefined" ? navigator.userAgent : ""));
  const info = useMemo(() => {
    const u = ua;
    const browser =
      /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) && /Version\//.test(u) ? "Safari" : /Firefox\//.test(u) ? "Firefox" : "Unknown";
    const os = /Windows/.test(u) ? "Windows" : /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Mac OS X/.test(u) ? "macOS" : /Linux/.test(u) ? "Linux" : "Unknown";
    const isBot = /bot|crawl|spider|slurp|bing/i.test(u);
    const mobile = /Mobi|Android|iPhone/.test(u);
    const engine = /Gecko\/|Firefox/.test(u) ? "Gecko" : /AppleWebKit/.test(u) ? "WebKit/Blink" : "Unknown";
    return { browser, os, isBot, mobile, engine };
  }, [ua]);
  return (
    <div className="space-y-4">
      <Area label="User agent string" value={ua} onChange={setUa} rows={4} />
      <Grid cols={3}>
        <BigStat label="Browser" value={info.browser} accent={A} />
        <BigStat label="Engine" value={info.engine} accent="#4ECDC4" />
        <BigStat label="OS" value={info.os} accent="#FF9DE2" />
      </Grid>
      <Row>
        <Tag accent={info.mobile ? "#5EE39A" : "#3f3f46"}>{info.mobile ? "MOBILE" : "DESKTOP"}</Tag>
        <Tag accent={info.isBot ? "#FF8A7A" : "#3f3f46"}>{info.isBot ? "BOT-LIKE" : "HUMAN-ISH"}</Tag>
      </Row>
    </div>
  );
}

/* ------------------------------ 4. HTTP status codes ----------------------- */

const HTTP_CODES: [number, string, string, string][] = [
  [200, "OK", "2xx", "All good — request succeeded."],
  [201, "Created", "2xx", "New resource born (usually after POST)."],
  [204, "No Content", "2xx", "Success, nothing to send back."],
  [301, "Moved Permanently", "3xx", "Resource lives somewhere else now — update your links."],
  [302, "Found", "3xx", "Temporary redirect — follow it."],
  [304, "Not Modified", "3xx", "Cache is still fresh, save the bytes."],
  [400, "Bad Request", "4xx", "Malformed request — the server could not read it."],
  [401, "Unauthorized", "4xx", "Who are you? Log in or send a token."],
  [403, "Forbidden", "4xx", "I know who you are. You still cannot come in."],
  [404, "Not Found", "4xx", "Nothing lives at this address."],
  [409, "Conflict", "4xx", "Request fights the current state (e.g. duplicate)."],
  [418, "I'm a teapot", "4xx", "Short and stout. RFC 2324 joke status."],
  [422, "Unprocessable", "4xx", "Readable but semantically wrong (failed validation)."],
  [429, "Too Many Requests", "4xx", "Slow down — rate limit hit."],
  [500, "Internal Server Error", "5xx", "The server tripped over its own shoelaces."],
  [502, "Bad Gateway", "5xx", "Upstream server gave garbage or died."],
  [503, "Service Unavailable", "5xx", "Overloaded or down for maintenance."],
  [504, "Gateway Timeout", "5xx", "Upstream took too long to answer."],
];

export function HttpStatusTool() {
  const A = accentOf(3);
  const [filter, setFilter] = useState("all");
  const rows = HTTP_CODES.filter(([, , cat]) => filter === "all" || cat === filter);
  const color = (cat: string) => (cat === "2xx" ? "#5EE39A" : cat === "3xx" ? "#7FC8FF" : cat === "4xx" ? "#FFD43B" : "#FF8A7A");
  return (
    <div className="space-y-4">
      <Seg value={filter} onChange={setFilter} accent={A} options={[{ v: "all" as const, label: "All" }, { v: "2xx" as const, label: "2xx OK" }, { v: "3xx" as const, label: "3xx Redirect" }, { v: "4xx" as const, label: "4xx Client" }, { v: "5xx" as const, label: "5xx Server" }]} />
      <div className="space-y-1.5">
        {rows.map(([code, name, cat, desc]) => (
          <div key={code} className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
            <span className="w-12 shrink-0 font-mono text-lg font-black" style={{ color: color(cat) }}>{code}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100">{name}</p>
              <p className="text-xs text-zinc-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 5. Keycode detector ------------------------ */

export function KeycodeTool() {
  const A = accentOf(4);
  const [last, setLast] = useState<{ key: string; code: string; kc: number; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      setLast({ key: e.key, code: e.code, kc: e.keyCode, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey });
      setLog((l) => [`${e.key} → ${e.code} (${e.keyCode})`, ...l].slice(0, 8));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex min-h-[130px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950/70 px-4 py-8 text-center">
        {last ? (
          <>
            <p className="font-brut text-5xl" style={{ color: A }}>{last.key === " " ? "Space" : last.key}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 font-mono text-xs text-zinc-400">
              <Tag accent={A}>code: {last.code}</Tag>
              <Tag>keyCode: {last.kc}</Tag>
              {last.ctrl && <Tag accent="#FF9DE2">ctrl</Tag>}
              {last.shift && <Tag accent="#FF9DE2">shift</Tag>}
              {last.alt && <Tag accent="#FF9DE2">alt</Tag>}
              {last.meta && <Tag accent="#FF9DE2">meta</Tag>}
            </div>
          </>
        ) : (
          <p className="font-mono text-sm text-zinc-500">press any key…</p>
        )}
      </div>
      <Panel title="recent presses" accent={A}>
        {log.length ? (
          <ul className="space-y-1 font-mono text-xs text-zinc-400">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
        ) : (
          <p className="text-sm text-zinc-600">History shows here.</p>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------ 6. Placeholder URLs ------------------------ */

export function PlaceholderUrlTool() {
  const A = accentOf(5);
  const [w, setW] = useState(800);
  const [h, setH] = useState(400);
  const [text, setText] = useState("");
  const [bg, setBg] = useState("#1a1a1a");
  const [fg, setFg] = useState("#FFD43B");
  const [gray, setGray] = useState(false);
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (gray) { params.set("grayscale", ""); }
    if (text) params.set("text", encodeURIComponent(text));
    if (!gray) { params.set("bgcolor", bg.replace("#", "")); params.set("color", fg.replace("#", "")); }
    return `https://placehold.co/${w}x${h}${gray ? "" : `/${bg.replace("#", "")}/${fg.replace("#", "")}`}.png${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  }, [w, h, text, bg, fg, gray]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Width" value={w} onChange={(v) => setW(Math.max(16, parseInt(v) || 16))} type="number" className="min-w-[110px] flex-1" />
        <Field label="Height" value={h} onChange={(v) => setH(Math.max(16, parseInt(v) || 16))} type="number" className="min-w-[110px] flex-1" />
        <Field label="Label (optional)" value={text} onChange={setText} className="min-w-[140px] flex-[2]" />
      </Row>
      <Row>
        <Check label="Grayscale" checked={gray} onChange={setGray} />
        <label className="flex items-center gap-2 text-xs text-zinc-300">BG<input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-10 rounded border border-zinc-700 bg-transparent" /></label>
        <label className="flex items-center gap-2 text-xs text-zinc-300">FG<input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-8 w-10 rounded border border-zinc-700 bg-transparent" /></label>
      </Row>
      <div className="flex items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
        <img src={url} alt="placeholder preview" className="max-h-52 max-w-full" />
      </div>
      <Out label="drop into your html/css" text={url} />
    </div>
  );
}

/* ------------------------------ 7. SVG optimizer --------------------------- */

export function SvgOptimizerTool() {
  const A = accentOf(6);
  const [svg, setSvg] = useState("");
  const result = useMemo(() => {
    if (!svg.trim()) return { out: "", saved: 0 };
    let t = svg;
    t = t.replace(/<!--[\s\S]*?-->/g, "");
    t = t.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
    t = t.replace(/<title>[\s\S]*?<\/title>/gi, "");
    t = t.replace(/\s(metadata|xmlns:xlink|sodipodi:\w+|inkscape:\w+)="[^"]*"/g, "");
    t = t.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
    return { out: t, saved: svg.length ? Math.max(0, Math.round((1 - t.length / svg.length) * 100)) : 0 };
  }, [svg]);
  return (
    <div className="space-y-4">
      <Split left={<Area label="SVG source" value={svg} onChange={setSvg} rows={9} placeholder="<svg …/>" />} right={
        <div className="space-y-3">
          <BigStat label="Size shaved" value={result.saved} unit="%" accent={result.saved > 20 ? "#5EE39A" : A} hint="comments, metadata, whitespace" />
          <Out label="optimized" text={result.out} />
        </div>
      } />
      <Note>Safe structural cleanup — no path geometry is touched. For max compression pair with SVGO before shipping.</Note>
    </div>
  );
}

/* ------------------------------ 8. Favicon grabber ------------------------- */

export function FaviconGrabTool() {
  const A = accentOf(7);
  const [site, setSite] = useState("");
  const [size, setSize] = useState(64);
  const clean = site.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const sources = clean
    ? [
        { label: "Google s2", url: `https://www.google.com/s2/favicons?domain=${clean}&sz=${size}` },
        { label: "DuckDuckGo", url: `https://icons.duckduckgo.com/ip3/${clean}.ico` },
        { label: "Favicon.im", url: `https://favicon.im/${clean}?larger=true` },
      ]
    : [];
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Domain" value={site} onChange={setSite} placeholder="github.com" className="min-w-[220px] flex-1" />
        <Seg value={String(size)} onChange={(v) => setSize(parseInt(v))} accent={A} options={[{ v: "32", label: "32" }, { v: "64", label: "64" }, { v: "128", label: "128" }, { v: "256", label: "256" }]} />
      </Row>
      <Grid cols={3}>
        {sources.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
            <img src={s.url} alt={`${clean} favicon via ${s.label}`} width={size} height={size} className="rounded" style={{ width: Math.min(size, 96) }} />
            <p className="mono-kicker text-zinc-500">{s.label}</p>
          </div>
        ))}
        {!sources.length && <p className="col-span-full py-8 text-center text-sm text-zinc-600">Type a domain — three favicon providers get queried right from your browser.</p>}
      </Grid>
      <Note>These load live from public favicon CDNs — free, keyless. Right-click any result to save it.</Note>
    </div>
  );
}

/* ------------------------------ 9. Nano ID --------------------------------- */

export function NanoIdTool() {
  const A = accentOf(8);
  const [len, setLen] = useState(21);
  const [count, setCount] = useState(6);
  const [seed, setSeed] = useState(0);
  const ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";
  const ids = useMemo(() => {
    void seed;
    return Array.from({ length: count }, () => {
      let s = "";
      const arr = new Uint8Array(len);
      crypto.getRandomValues(arr);
      for (let i = 0; i < len; i++) s += ALPHA[arr[i] % ALPHA.length];
      return s;
    });
  }, [len, count, seed]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Length" value={len} onChange={(v) => setLen(Math.max(6, Math.min(64, parseInt(v) || 21)))} type="number" className="min-w-[110px] flex-1" />
        <Field label="How many" value={count} onChange={(v) => setCount(Math.max(1, Math.min(20, parseInt(v) || 6)))} type="number" className="min-w-[110px] flex-1" />
        <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Regenerate</Btn>
      </Row>
      <div className="space-y-1.5">
        {ids.map((id, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <code className="min-w-0 truncate font-mono text-sm" style={{ color: A }}>{id}</code>
            <span className="shrink-0 font-mono text-[9px] text-zinc-600">{id.length} ch</span>
          </div>
        ))}
      </div>
      <Note>Crypto-random like UUID, but shorter and URL-friendly — the default is 21 characters (~149 bits).</Note>
    </div>
  );
}

/* ------------------------------ 10. HTML entities -------------------------- */

export function HtmlEntitiesTool() {
  const A = accentOf(9);
  const [text, setText] = useState("");
  const [dir, setDir] = useState<"enc" | "dec">("enc");
  const out = useMemo(() => {
    if (!text) return "";
    if (dir === "enc") return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
    const el = document.createElement("textarea");
    el.innerHTML = text;
    return el.value;
  }, [text, dir]);
  return (
    <div className="space-y-4">
      <Seg value={dir} onChange={setDir} accent={A} options={[{ v: "enc" as const, label: "Encode" }, { v: "dec" as const, label: "Decode" }]} />
      <Split left={<Area label={dir === "enc" ? "Raw text / HTML" : "Escaped HTML"} value={text} onChange={setText} rows={8} />} right={<Out label={dir === "enc" ? "escaped" : "unescaped"} text={out} />} />
    </div>
  );
}

/* ------------------------------ 11. URL parser ----------------------------- */

export function UrlParserTool() {
  const A = accentOf(10);
  const [url, setUrl] = useState("");
  const p = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return { ok: true as const, parts: Object.entries({ protocol: u.protocol, host: u.host, hostname: u.hostname, port: u.port || "(default)", pathname: u.pathname, search: u.search || "(none)", hash: u.hash || "(none)", origin: u.origin }) };
    } catch {
      return { ok: false as const };
    }
  }, [url]);
  return (
    <div className="space-y-4">
      <Field label="URL anatomy" value={url} onChange={setUrl} placeholder="https://user:pass@sub.site.co.uk:8443/path/to/page?x=1#frag" />
      {p.ok ? (
        <Panel title="every part" accent={A}>
          <div className="space-y-0.5">
            {p.parts.map(([k, v]) => (
              <KV key={k} k={k} v={<span className="break-all font-mono text-xs">{v}</span>} accent={A} />
            ))}
          </div>
        </Panel>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Anatomy chart appears once the URL parses…</p>
      )}
    </div>
  );
}

/* ------------------------------ 12. Markdown TOC --------------------------- */

export function MarkdownTocTool() {
  const A = accentOf(11);
  const [md, setMd] = useState("");
  const toc = useMemo(() => {
    const lines = md.split("\n");
    const out: { level: number; text: string; anchor: string }[] = [];
    let inCode = false;
    for (const line of lines) {
      if (line.trim().startsWith("```")) { inCode = !inCode; continue; }
      if (inCode) continue;
      const m = line.match(/^(#{1,6})\s+(.*)$/);
      if (m) {
        const text = m[2].replace(/[*_`]/g, "").trim();
        const anchor = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        out.push({ level: m[1].length, text, anchor });
      }
    }
    return out;
  }, [md]);
  const slug = (t: string) => t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  return (
    <div className="space-y-4">
      <Split
        left={<Area label="Markdown" value={md} onChange={setMd} rows={10} placeholder={"# One\n## Two\n### Three"} />}
        right={
          <div className="space-y-3">
            <Out label="TOC with links" text={toc.map((h) => `${"  ".repeat(h.level - 1)}- [${h.text}](#${h.anchor})`).join("\n")} />
            <Out label="plain list" copy={false} text={toc.map((h) => `${"│  ".repeat(Math.max(0, h.level - 1))}├ ${h.text}`).join("\n")} />
          </div>
        }
      />
      <Note>Anchors follow GitHub-style slugging ({slug("My Section!")}). Depths 1–6 supported, code fences skipped.</Note>
    </div>
  );
}

/* ------------------------------ 13. JS minifier (naive) -------------------- */

export function JsMinifyTool() {
  const A = accentOf(0);
  const [code, setCode] = useState("");
  const result = useMemo(() => {
    if (!code.trim()) return { out: "", saved: 0 };
    let t = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");
    t = t.replace(/\n\s*/g, "\n").replace(/\n{2,}/g, "\n").trim();
    return { out: t, saved: code.length ? Math.round((1 - t.length / code.length) * 100) : 0 };
  }, [code]);
  return (
    <div className="space-y-4">
      <BigStat label="Bytes saved (conservative strip)" value={result.saved} unit="%" accent={result.saved > 10 ? "#5EE39A" : A} />
      <Split left={<Area label="JavaScript" value={code} onChange={setCode} rows={10} />} right={<Out label="minified-ish" text={result.out} />} />
      <Note>Strips comments and indentation only — never rename variables or break code. For production use a real minifier.</Note>
    </div>
  );
}

/* ------------------------------ 14. CSS specificity ------------------------ */

export function SpecificityTool() {
  const A = accentOf(1);
  const [sel, setSel] = useState("");
  const score = useMemo(() => {
    const s = sel.trim();
    if (!s) return null;
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const classes = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(\([^)]*\))?/g) || []).length;
    const els = (s.match(/(^|[\s>+~])([a-z][\w-]*|\*)/gi) || []).filter((m) => !m.trim().startsWith(".") && !m.includes("[")).length;
    const pseudoEls = (s.match(/::[\w-]+/g) || []).length;
    return { ids, classes, els: els + pseudoEls };
  }, [sel]);
  return (
    <div className="space-y-4">
      <Field label="CSS selector" value={sel} onChange={setSel} placeholder="nav#main ul.menu li:nth-child(2) a::before" />
      {score ? (
        <div className="flex items-center justify-center gap-6 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
          {[["IDS", score.ids], ["CLASSES", score.classes], ["ELEMENTS", score.els]].map(([label, n], i) => (
            <div key={label as string} className="text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg border-2 text-3xl font-black" style={{ borderColor: [A, "#FF9DE2", "#7FC8FF"][i], color: [A, "#FF9DE2", "#7FC8FF"][i] }}>{n as number}</div>
              <p className="mono-kicker text-zinc-500">{label}</p>
            </div>
          ))}
          <p className="w-full pt-3 text-center font-mono text-sm text-zinc-400">specificity: ({score.ids}, {score.classes}, {score.els})</p>
        </div>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Type a selector to see its (ids, classes, elements) weight…</p>
      )}
      <Note>Higher tuple wins; inline styles and !important sit above the whole game. Same tuple? Last rule takes the crown.</Note>
    </div>
  );
}

/* ------------------------------ 15. Git cheat sheet ------------------------ */

const GIT_CMDS: [string, string, string][] = [
  ["git status", "Show what changed and what is staged", "basics"],
  ["git log --oneline --graph", "Compact history with branches drawn", "basics"],
  ["git switch -c feature/x", "Create and hop onto a new branch", "branches"],
  ["git merge --abort", "Undo a conflicted merge, safely", "branches"],
  ["git stash push -m msg", "Park dirty work with a label", "rescue"],
  ["git stash pop", "Bring parked work back", "rescue"],
  ["git reset --soft HEAD~1", "Undo last commit, keep changes staged", "rescue"],
  ["git restore <file>", "Throw away local changes to a file", "rescue"],
  ["git revert <sha>", "Neutralize an old commit with a new one", "history"],
  ["git rebase -i HEAD~3", "Interactive rewrite of last 3 commits", "history"],
  ["git cherry-pick <sha>", "Copy one commit onto this branch", "history"],
  ["git bisect start", "Binary-search the commit that broke things", "history"],
  ["git remote -v", "List remotes and their URLs", "remote"],
  ["git push -u origin <branch>", "Push and set upstream tracking", "remote"],
  ["git fetch --prune", "Sync and delete stale remote branches", "remote"],
  ["git blame -L 10,20 <file>", "Who touched lines 10–20 and when", "inspect"],
  ["git diff --staged", "Preview exactly what you are about to commit", "inspect"],
  ["git worktree add ../hotfix hotfix", "Two branches checked out at once", "pro"],
];

export function GitCheatTool() {
  const A = accentOf(2);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const rows = GIT_CMDS.filter(([c, d, k]) => (cat === "all" || k === cat) && `${c} ${d}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Search" value={q} onChange={setQ} placeholder="stash, undo, branch…" className="min-w-[200px] flex-1" />
        <Seg value={cat} onChange={setCat} accent={A} options={[{ v: "all", label: "All" }, { v: "basics", label: "Basics" }, { v: "branches", label: "Branches" }, { v: "rescue", label: "Rescue" }, { v: "history", label: "History" }, { v: "remote", label: "Remote" }, { v: "inspect", label: "Inspect" }, { v: "pro", label: "Pro" }]} />
      </Row>
      <div className="space-y-1.5">
        {rows.map(([cmd, desc]) => (
          <div key={cmd} className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <code className="text-sm font-bold" style={{ color: A }}>{cmd}</code>
            <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
          </div>
        ))}
        {!rows.length && <p className="py-6 text-center text-sm text-zinc-600">No command matches…</p>}
      </div>
    </div>
  );
}

/* ------------------------------ 16. SemVer compare ------------------------- */

function parseVer(v: string): number[] | null {
  const m = v.trim().replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
}

export function SemVerTool() {
  const A = accentOf(3);
  const [a, setA] = useState("1.2.3");
  const [b, setB] = useState("1.10.0");
  const va = parseVer(a);
  const vb = parseVer(b);
  const cmp = va && vb ? va[0] - vb[0] || va[1] - vb[1] || va[2] - vb[2] : null;
  const verdict = cmp === null ? null : cmp > 0 ? "A is newer" : cmp < 0 ? "B is newer" : "Identical";
  const diff = va && vb ? vb.map((n, i) => n - va[i]) : null;
  return (
    <div className="space-y-4">
      <Split left={<Field label="Version A" value={a} onChange={setA} placeholder="1.2.3" />} right={<Field label="Version B" value={b} onChange={setB} placeholder="1.10.0" />} />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="font-brut text-3xl" style={{ color: verdict === "Identical" ? "#a1a1aa" : A }}>{verdict ?? "unparseable — use major.minor.patch"}</p>
        {diff && verdict !== "Identical" ? (
          <p className="mt-2 font-mono text-xs text-zinc-500">Δ major {diff[0] > 0 ? "+" : ""}{diff[0]} · minor {diff[1] > 0 ? "+" : ""}{diff[1]} · patch {diff[2] > 0 ? "+" : ""}{diff[2]}</p>
        ) : null}
      </div>
      <Note>Numeric compare left→right: 1.10.0 beats 1.2.9 (ten beats two), prereleases like 2.0.0-beta are ignored for the compare.</Note>
    </div>
  );
}

/* ------------------------------ 17. Chmod calculator ----------------------- */

const CHMOD_PERMS = [
  { label: "Owner", read: 4, write: 2, exec: 1 },
  { label: "Group", read: 4, write: 2, exec: 1 },
  { label: "Others", read: 4, write: 2, exec: 1 },
];

export function ChmodTool() {
  const A = accentOf(4);
  const [state, setState] = useState([[true, true, false], [true, false, false], [true, false, false]]);
  const octal = state.map((g) => g.reduce((a, on, i) => a + (on ? CHMOD_PERMS[i] && [4, 2, 1][i] : 0), 0));
  const permStr = state.map((g, gi) => g.map((on, i) => (on ? "rwx"[i] : "-")).join("") ).join("") && state.map((g) => g.map((on, i) => (on ? "rwx"[i] : "-")).join("")).join("");
  void CHMOD_PERMS;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {["Owner", "Group", "Others"].map((who, gi) => (
          <Panel key={who} title={who} accent={[A, "#FF9DE2", "#7FC8FF"][gi]}>
            <div className="space-y-2">
              {["read (4)", "write (2)", "execute (1)"].map((p, pi) => (
                <Check key={p} label={p} checked={state[gi][pi]} onChange={(v) => setState((s) => s.map((g, i) => (i === gi ? g.map((x, j) => (j === pi ? v : x)) : g)))} />
              ))}
            </div>
          </Panel>
        ))}
      </div>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-6">
        <p className="mono-kicker text-zinc-500">your chmod</p>
        <p className="mt-2 font-brut text-5xl" style={{ color: A }}>{octal.join("")}</p>
        <code className="mt-2 font-mono text-sm text-zinc-400">chmod {octal.join("")} file · {permStr}</code>
      </div>
      <Note>Presets: 755 = folders & scripts · 644 = files · 600 = private keys · 777 = never (unless you enjoy chaos).</Note>
    </div>
  );
}

/* ------------------------------ 18. ASCII table ---------------------------- */

export function AsciiTableTool() {
  const A = accentOf(5);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const out: { dec: number; hex: string; char: string }[] = [];
    for (let i = 32; i < 127; i++) out.push({ dec: i, hex: i.toString(16).toUpperCase().padStart(2, "0"), char: String.fromCharCode(i) });
    return out.filter((r) => (q ? `${r.dec} ${r.hex} ${r.char}`.toLowerCase().includes(q.toLowerCase()) : true));
  }, [q]);
  return (
    <div className="space-y-4">
      <Field label="Find (decimal, hex or char)" value={q} onChange={setQ} placeholder="65 · 41 · A" />
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-6">
        {rows.map((r) => (
          <div key={r.dec} className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-center">
            <p className="font-mono text-lg font-black" style={{ color: A }}>{r.char === " " ? "␠" : r.char}</p>
            <p className="font-mono text-[9px] text-zinc-500">{r.dec} · 0x{r.hex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 19. Bitwise playground --------------------- */

export function BitwiseTool() {
  const A = accentOf(6);
  const [a, setA] = useState("12");
  const [b, setB] = useState("10");
  const [op, setOp] = useState<"and" | "or" | "xor" | "shl" | "shr">("and");
  const na = parseInt(a) || 0;
  const nb = parseInt(b) || 0;
  const res = op === "and" ? na & nb : op === "or" ? na | nb : op === "xor" ? na ^ nb : op === "shl" ? na << Math.min(31, nb) : na >> Math.min(31, nb);
  const bin = (n: number) => (n >>> 0).toString(2).padStart(8, "0").slice(-32);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="A" value={a} onChange={setA} type="number" className="min-w-[100px] flex-1" />
        <Seg value={op} onChange={setOp} accent={A} options={[{ v: "and" as const, label: "A & B" }, { v: "or" as const, label: "A | B" }, { v: "xor" as const, label: "A ^ B" }, { v: "shl" as const, label: "A << B" }, { v: "shr" as const, label: "A >> B" }]} />
        <Field label="B" value={b} onChange={setB} type="number" className="min-w-[100px] flex-1" />
      </Row>
      <Panel title="binary view" accent={A}>
        <div className="space-y-1 font-mono text-xs text-zinc-400">
          <p>A&nbsp;&nbsp;<span className="text-zinc-200">{bin(na)}</span> <span className="text-zinc-600">({na})</span></p>
          <p>B&nbsp;&nbsp;<span className="text-zinc-200">{bin(nb)}</span> <span className="text-zinc-600">({nb})</span></p>
          <p className="border-t border-zinc-800 pt-1" style={{ color: A }}>{op.toUpperCase()} <span className="font-bold">{bin(res)}</span> <span className="text-zinc-600">= {res}</span></p>
        </div>
      </Panel>
      <Grid cols={4}>
        <BigStat label="Decimal" value={res} accent={A} />
        <BigStat label="Hex" value={`0x${(res >>> 0).toString(16).toUpperCase()}`} accent="#B9A6FF" />
        <BigStat label="Bits on" value={(res >>> 0).toString(2).split("").filter((c) => c === "1").length} accent="#5EE39A" />
        <BigStat label="Binary" value={(res >>> 0).toString(2)} accent="#FF9DE2" />
      </Grid>
    </div>
  );
}

/* ------------------------------ 20. Device info ---------------------------- */

export function DeviceInfoTool() {
  const A = accentOf(7);
  const [info, setInfo] = useState<Record<string, string>>({});
  useEffect(() => {
    queueMicrotask(() => {
      const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
      let gpu = "—";
      try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl") as WebGLRenderingContext | null;
        const dbg = gl?.getExtension("WEBGL_debug_renderer_info");
        if (gl && dbg) gpu = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
      } catch { /* blocked */ }
      setInfo({
        "Viewport": `${window.innerWidth} × ${window.innerHeight}`,
        "Screen": `${screen.width} × ${screen.height} @ ${window.devicePixelRatio}x`,
        "CPU threads": String(nav.hardwareConcurrency ?? "—"),
        "RAM (approx)": nav.deviceMemory ? `${nav.deviceMemory} GB` : "—",
        "Language": navigator.language,
        "Platform": navigator.platform || "—",
        "Touch points": String(navigator.maxTouchPoints ?? 0),
        "Online": navigator.onLine ? "yes" : "no",
        "GPU": gpu,
        "Color depth": `${screen.colorDepth}-bit`,
        "Cookies": navigator.cookieEnabled ? "enabled" : "blocked",
        "Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    });
  }, []);
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <BigStat label="Viewport" value={info.Viewport ?? "…"} accent={A} />
        <BigStat label="Pixel ratio" value={info.Screen ?? "…"} accent="#4ECDC4" />
        <BigStat label="Threads" value={info["CPU threads"] ?? "…"} accent="#FF9DE2" />
      </Grid>
      <Panel title="everything your browser volunteers" accent={A}>
        <div className="space-y-0.5">
          {Object.entries(info).slice(3).map(([k, v]) => (
            <KV key={k} k={k} v={v} />
          ))}
        </div>
      </Panel>
      <Note>This is exactly what any website sees on arrival — measured live, stored nowhere.</Note>
    </div>
  );
}

/* ------------------------------ 21. Shortcut recorder ---------------------- */

export function ShortcutRecorderTool() {
  const A = accentOf(8);
  const [combo, setCombo] = useState<{ ctrl: boolean; alt: boolean; shift: boolean; meta: boolean; key: string; code: string } | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
      setCombo({ ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey, key: e.key, code: e.code });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const code = combo
    ? `${combo.meta ? "metaKey && " : ""}${combo.ctrl ? "ctrlKey && " : ""}${combo.alt ? "altKey && " : ""}${combo.shift ? "shiftKey && " : ""}(e.key === "${combo.key}")`
    : "";
  return (
    <div className="space-y-4">
      <div className="flex min-h-[110px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950/70 px-4">
        {combo ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {combo.meta && <Key label="⌘ / Win" A={A} />}
            {combo.ctrl && <Key label="Ctrl" A={A} />}
            {combo.alt && <Key label="Alt" A={A} />}
            {combo.shift && <Key label="Shift" A={A} />}
            <Key label={combo.key === " " ? "Space" : combo.key.toUpperCase()} A="#5EE39A" />
          </div>
        ) : (
          <p className="font-mono text-sm text-zinc-500">press your dream shortcut…</p>
        )}
      </div>
      {combo ? <Out label="javascript condition" text={`if (${code}) {\n  // your move\n}`} /> : null}
    </div>
  );
}

function Key({ label, A }: { label: string; A: string }) {
  return (
    <span className="rounded border-2 px-3 py-1.5 font-mono text-sm font-black" style={{ borderColor: A, color: A, boxShadow: `2px 2px 0 ${A}55` }}>
      {label}
    </span>
  );
}

/* ------------------------------ 22. Port lookup ---------------------------- */

const PORTS: [number, string, string][] = [
  [20, "FTP data", "File transfer (data channel)"], [21, "FTP", "File transfer control"],
  [22, "SSH / SFTP", "Secure shell — remote login"], [23, "Telnet", "Insecure remote login (retired)"],
  [25, "SMTP", "Sending email between servers"], [53, "DNS", "Name → IP resolution"],
  [67, "DHCP", "Auto IP assignment"], [80, "HTTP", "The plain web"],
  [110, "POP3", "Mail download (old school)"], [143, "IMAP", "Mail sync (keeps server copy)"],
  [443, "HTTPS", "The encrypted web"], [465, "SMTPS", "SMTP over TLS"],
  [587, "SMTP submission", "Mail clients sending via your provider"], [993, "IMAPS", "IMAP over TLS"],
  [1433, "SQL Server", "Microsoft database"], [3306, "MySQL / MariaDB", "Popular open-source DB"],
  [3389, "RDP", "Windows remote desktop"], [5432, "PostgreSQL", "Open-source relational DB"],
  [6379, "Redis", "In-memory cache / broker"], [8080, "HTTP alt", "Dev servers and proxies"],
  [9200, "Elasticsearch", "Search engine API"], [27017, "MongoDB", "Document database"],
];

export function PortTool() {
  const A = accentOf(9);
  const [q, setQ] = useState("");
  const rows = PORTS.filter(([n, name, d]) => `${n} ${name} ${d}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <Field label="Port number or name" value={q} onChange={setQ} placeholder="443 · mysql" />
      <div className="space-y-1.5">
        {rows.map(([n, name, d]) => (
          <div key={n} className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <span className="w-16 shrink-0 font-mono text-lg font-black" style={{ color: A }}>{n}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100">{name}</p>
              <p className="text-xs text-zinc-500">{d}</p>
            </div>
          </div>
        ))}
        {!rows.length && <p className="py-6 text-center text-sm text-zinc-600">Not in the well-known list…</p>}
      </div>
    </div>
  );
}
