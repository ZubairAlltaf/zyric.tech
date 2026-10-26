"use client";

/* ==========================================================================
   KIT: SEO PLUS — 10 search-engine & social-metadata instruments.
   Pixel heuristics, schema builders, redirect compilers, favicon plumbing.
   100% client-side: nothing is fetched, nothing leaves the browser —
   you paste your own metadata and every tool does the math locally.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Code2,
  Image,
  Languages,
  ListOrdered,
  Plus,
  Ruler,
  Search,
  Share2,
  Star,
  Timer,
  Trash2,
} from "lucide-react";
import {
  Area,
  BigStat,
  Btn,
  Check,
  Field,
  Grid,
  KV,
  Meter,
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

/* ------------------------------ shared helpers ----------------------------- */

/** Ellipsize to at most `max` characters, trimming ragged edges. */
function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/** Rough advance width of one character, scaled around an average px/char. */
function charW(ch: string, per: number): number {
  if ("iljt.,'’|!():;[]f".includes(ch)) return per * 0.45;
  if ("mwMW@".includes(ch)) return per * 1.55;
  if (ch === " ") return per * 0.5;
  if (ch >= "A" && ch <= "Z") return per * 1.2;
  return per;
}

function pxWidth(text: string, per: number): number {
  let w = 0;
  for (const ch of text) w += charW(ch, per);
  return Math.round(w);
}

/** Truncate under `maxPx` measured width, appending an ellipsis when cut. */
function truncatePx(text: string, per: number, maxPx: number): string {
  if (pxWidth(text, per) <= maxPx) return text;
  let out = "";
  let w = 0;
  const ell = pxWidth("…", per);
  for (const ch of text) {
    const cw = charW(ch, per);
    if (w + cw > maxPx - ell) break;
    out += ch;
    w += cw;
  }
  return `${out.trimEnd()}…`;
}

const EN_STOPWORDS = new Set(
  (
    "a,an,and,are,as,at,be,but,by,for,from,has,have,he,her,his,how,i,in,is,it,its,of,on,or," +
    "that,the,to,was,were,will,with,you,your,this,these,those,they,them,we,our,us,can,do," +
    "does,did,not,no,so,if,then,than,there,here,what,when,where,which,who,why,all,any,each," +
    "more,most,other,some,such,only,own,same,too,very,just,also,into,over,up,down,out,about," +
    "after,before,again,once"
  ).split(","),
);

/** Strict-enough absolute-URL check for schema/hreflang/redirect inputs. */
const URL_OK = (s: string): boolean => /^https?:\/\/\S+\.\S+/i.test(s.trim());

/** Tiny shared icon button for row builders (move up / down / delete). */
function IconBtn({
  children,
  onClick,
  label,
  disabled = false,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded border border-zinc-800 p-1.5 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 ${
        danger ? "hover:border-[#FF8A7A66] hover:text-[#FF8A7A]" : ""
      }`}
    >
      {children}
    </button>
  );
}

/** Render the og:image slot of a share card with a graceful offline fallback. */
function ogImage(
  src: string,
  ratio: string,
  accent: string,
  label: string,
  ok: boolean,
  onErr: () => void,
) {
  return (
    <div className="relative w-full overflow-hidden bg-zinc-900" style={{ aspectRatio: ratio }}>
      {src.trim() && ok ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-pasted URL preview, intentionally plain
        <img src={src.trim()} alt="" className="h-full w-full object-cover" onError={onErr} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
          <Image className="h-5 w-5" style={{ color: accent }} />
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            {src.trim() && !ok ? "unreachable — check the URL" : label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ 1. SERP preview ---------------------------- */

export function SerpPreviewTool() {
  const A = accentOf(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [url, setUrl] = useState("https://zyric.tech/tools/serp-preview");
  const [title, setTitle] = useState(
    "SERP Preview — Test Your Google Title & Meta Description Pixels",
  );
  const [desc, setDesc] = useState(
    "See exactly how your snippet renders on Google before you ship. Pixel-width meters, mobile vs desktop truncation and status tags — all client-side, nothing fetched.",
  );

  const mobile = device === "mobile";
  const titleLimit = mobile ? 560 : 600;
  const descLimit = mobile ? 680 : 920;

  const parsed = useMemo(() => {
    try {
      const u = new URL(url.includes("://") ? url : `https://${url}`);
      const host = u.hostname.replace(/^www\./, "");
      const crumbs = u.pathname
        .split("/")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p.replace(/[-_]+/g, " "));
      return { host, crumb: [host, ...crumbs].join(" › ") };
    } catch {
      return { host: "example.com", crumb: "example.com" };
    }
  }, [url]);

  const shownTitleRaw = title.trim() || "Your page title appears here in the results";
  const shownDescRaw =
    desc.trim() ||
    "Your meta description is what searchers read before they click. Keep the promise of the title and give them one reason to choose this result.";
  const titlePx = pxWidth(shownTitleRaw, 11.5);
  const descPx = pxWidth(shownDescRaw, 7.5);
  const shownTitle = truncatePx(shownTitleRaw, 11.5, titleLimit);
  const shownDesc = truncatePx(shownDescRaw, 7.5, descLimit);

  const status = (px: number, limit: number): { label: string; color: string } =>
    px <= limit
      ? { label: "OK", color: "#5EE39A" }
      : px <= limit * 1.3
        ? { label: "Truncated", color: "#FF7A3D" }
        : { label: `Too long — cut ~${fmt(px - limit)}px`, color: "#FF8A7A" };
  const tStat = status(titlePx, titleLimit);
  const dStat = status(descPx, descLimit);

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Field label="Page URL (drives the breadcrumb line)" value={url} onChange={setUrl} />
            <Field
              label="Title tag"
              value={title}
              onChange={setTitle}
              hint="bold ≈ 11.5 px/char average"
            />
            <Area label="Meta description" value={desc} onChange={setDesc} rows={5} mono={false} />
          </div>
        }
        right={
          <div className="space-y-3">
            <Row className="items-center">
              <Seg
                value={device}
                onChange={setDevice}
                accent={A}
                options={[
                  { v: "desktop", label: "Desktop" },
                  { v: "mobile", label: "Mobile" },
                ]}
              />
              <Tag accent={tStat.color}>title: {tStat.label}</Tag>
              <Tag accent={dStat.color}>desc: {dStat.label}</Tag>
            </Row>
            <Meter
              value={titlePx}
              max={titleLimit}
              accent={titlePx > titleLimit ? "#FF8A7A" : A}
              label={`title width (${device})`}
              right={`${titlePx} / ${titleLimit} px`}
            />
            <Meter
              value={descPx}
              max={descLimit}
              accent={descPx > descLimit ? "#FF8A7A" : A}
              label={`description width (${device})`}
              right={`${descPx} / ${descLimit} px`}
            />
            <div
              className={`rounded-lg border border-zinc-800 bg-zinc-950/80 ${
                mobile ? "p-5" : "p-4"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-zinc-950"
                  style={{ background: A }}
                >
                  {parsed.host.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-xs text-zinc-300">{parsed.host}</p>
                  <p className="truncate text-[11px] text-zinc-500">{parsed.crumb}</p>
                </div>
              </div>
              <p
                className={`mt-2 leading-snug text-[#8AB4F8] ${mobile ? "text-[22px]" : "text-[20px]"}`}
              >
                {shownTitle}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{shownDesc}</p>
            </div>
          </div>
        }
      />
      <Note>
        Heuristic widths: bold title ≈ 11.5 px/char, snippet ≈ 7.5 px/char, mobile cuts earlier
        (560/680 px vs 600/920 px). Google blends font, emoji and bolding — treat these as ±10%,
        and put the keyword before the truncation point.
      </Note>
    </div>
  );
}

/* ------------------------------ 2. OG share preview ------------------------ */

export function OgPreviewTool() {
  const A = accentOf(1);
  const [site, setSite] = useState("Zyric Tools");
  const [title, setTitle] = useState("10 Free Browser Tools That Replace Your SEO Stack");
  const [desc, setDesc] = useState(
    "SERP previews, schema builders, redirect compilers — every tool runs locally in your browser. No sign-up, no uploads, nothing leaves your machine.",
  );
  const [img, setImg] = useState("");
  const [link, setLink] = useState("https://zyric.tech/tools");
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [img]);

  const host = useMemo(() => {
    try {
      return new URL(link.includes("://") ? link : `https://${link}`).hostname.replace(
        /^www\./,
        "",
      );
    } catch {
      return link.trim() || "your-site.com";
    }
  }, [link]);

  const cardHead = (name: string, accent: string, meta: string) => (
    <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
        {name}
      </span>
      <span className="font-mono text-[10px] text-zinc-600">{meta}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <Row>
        <Field label="og:site_name" value={site} onChange={setSite} className="min-w-[160px] flex-1" />
        <Field label="og:url (shown as the host)" value={link} onChange={setLink} className="min-w-[180px] flex-1" />
      </Row>
      <Field label="og:title" value={title} onChange={setTitle} />
      <Area label="og:description" value={desc} onChange={setDesc} rows={3} mono={false} />
      <Field
        label="og:image URL (loaded in-browser only — nothing is fetched server-side)"
        value={img}
        onChange={setImg}
        placeholder="https://your-site.com/og.png (1200×630 ideal)"
      />
      <Grid cols={2}>
        {/* Facebook */}
        <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
          {cardHead("facebook", "#7FC8FF", "1.91:1 · title 2 lines")}
          <div className="p-3">
            <div className="overflow-hidden rounded-md border border-zinc-800">
              {ogImage(img, "1.91 / 1", "#7FC8FF", "og:image missing", imgOk, () => setImgOk(false))}
              <div className="bg-zinc-950/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{host}</p>
                <p className="text-sm font-semibold leading-snug text-zinc-100">{clamp(title, 88)}</p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-400">{clamp(desc, 120)}</p>
              </div>
            </div>
          </div>
        </div>
        {/* X / Twitter */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          {cardHead("x / twitter", A, "2:1 · site_name ignored")}
          <div className="p-3">
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              {ogImage(img, "2 / 1", A, "og:image missing", imgOk, () => setImgOk(false))}
              <div className="bg-zinc-950/80 px-3 py-2">
                <p className="text-sm font-bold leading-snug text-zinc-100">{clamp(title, 70)}</p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-400">{clamp(desc, 100)}</p>
                <p className="mt-1.5 font-mono text-[10px] text-zinc-600">{host}</p>
              </div>
            </div>
          </div>
        </div>
        {/* WhatsApp */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
          {cardHead("whatsapp", "#25D366", "2:1 · title 1 line")}
          <div className="p-3">
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              {ogImage(img, "2 / 1", "#25D366", "og:image missing", imgOk, () => setImgOk(false))}
              <div className="bg-zinc-950/80 px-3 py-2">
                <p className="truncate text-sm font-bold text-zinc-100">{clamp(title, 45)}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-zinc-400">{clamp(desc, 110)}</p>
                <p className="mt-1.5 text-right font-mono text-[10px] text-[#25D366]">{host}</p>
              </div>
            </div>
          </div>
        </div>
        {/* LinkedIn */}
        <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
          {cardHead("linkedin", "#B9A6FF", "1.91:1 · hides description")}
          <div className="p-3">
            <div className="overflow-hidden rounded-md border border-zinc-800">
              {ogImage(img, "1.91 / 1", "#B9A6FF", "og:image missing", imgOk, () => setImgOk(false))}
              <div className="bg-zinc-950/80 px-3 py-2">
                <p className="text-sm font-semibold leading-snug text-zinc-100">{clamp(title, 100)}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-zinc-600">
                  {site.trim() || host} · {host}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Grid>
      <Note>
        Privacy-first: no URL is fetched for you — paste your own tag values, and the image URL is
        only loaded by your browser to preview. Platforms cache OG data for days; after deploying,
        force a refresh with each platform&apos;s sharing debugger.
      </Note>
    </div>
  );
}

/* ------------------------------ 3. Keyword density ------------------------- */

export function KeywordDensityTool() {
  const A = accentOf(2);
  const [text, setText] = useState(
    "Cold brew coffee is coffee steeped in cold water for twelve hours. The slow steep makes cold brew smooth, low in acid and naturally sweet. Brew a big batch of coffee concentrate on Sunday, then dilute the coffee with water or milk all week. Coffee lovers rate cold brew coffee above iced coffee because cold brew keeps its flavor.",
  );
  const [stop, setStop] = useState(true);

  const stats = useMemo(() => {
    const words = text.toLowerCase().match(/[a-z0-9''’-]+/g) ?? [];
    const total = words.length;
    const grams = (n: number) => {
      const m = new Map<string, number>();
      for (let i = 0; i + n <= words.length; i++) {
        const g = words.slice(i, i + n);
        if (stop && g.some((w) => EN_STOPWORDS.has(w))) continue;
        if (g.some((w) => w.length < 2)) continue;
        const key = g.join(" ");
        m.set(key, (m.get(key) ?? 0) + 1);
      }
      const denom = Math.max(1, total - n + 1);
      return [...m.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 10)
        .map(([term, count]) => ({ term, count, density: (count / denom) * 100 }));
    };
    const singles = grams(1);
    return {
      total,
      unique: new Set(words).size,
      singles,
      pairs: grams(2),
      triples: grams(3),
      top: singles[0]?.density ?? 0,
    };
  }, [text, stop]);

  const stuffing = stats.top > 3;
  const table = (title: string, rows: { term: string; count: number; density: number }[]) => {
    const maxC = rows[0]?.count ?? 1;
    return (
      <Panel title={title} accent={A}>
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-zinc-600">nothing yet — paste content above</p>
        ) : (
          <div>
            {rows.map((r) => (
              <div key={r.term} className="flex items-center gap-2 border-b border-zinc-800/60 py-1.5 last:border-b-0">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-200">{r.term}</span>
                <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(r.count / maxC) * 100}%`, background: A }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-[10px] text-zinc-500">
                  {r.count}× · {pct(r.density)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    );
  };

  return (
    <div className="space-y-4">
      <Area label="Paste your content" value={text} onChange={setText} rows={7} mono={false} />
      <Row className="items-center">
        <Check label="Filter common English stop words" checked={stop} onChange={setStop} />
        {stuffing ? <Tag accent="#FF8A7A">over-optimization risk</Tag> : <Tag accent="#5EE39A">density in the natural zone</Tag>}
      </Row>
      <Grid cols={3}>
        <BigStat label="Word count" value={fmt(stats.total)} accent={A} hint="tokens matched" />
        <BigStat label="Unique words" value={fmt(stats.unique)} accent={A} hint="vocabulary size" />
        <BigStat label="Top term density" value={pct(stats.top)} accent={stuffing ? "#FF8A7A" : "#5EE39A"} hint={stats.singles[0]?.term ?? "—"} />
      </Grid>
      {stuffing && stats.singles[0] ? (
        <Panel title="over-optimization warning" accent="#FF8A7A">
          <p className="text-xs leading-relaxed text-zinc-300">
            <span className="font-bold" style={{ color: "#FF8A7A" }}>
              “{stats.singles[0].term}”
            </span>{" "}
            runs at{" "}
            <span className="font-bold" style={{ color: "#FF8A7A" }}>
              {pct(stats.singles[0].density)}
            </span>{" "}
            — above the ≈3% natural ceiling. Swap a few mentions for synonyms or pronouns before
            publishing; stuffing reads as spam to both users and ranking systems.
          </p>
        </Panel>
      ) : null}
      <Grid cols={3}>
        {table("1-word terms", stats.singles)}
        {table("2-word phrases", stats.pairs)}
        {table("3-word phrases", stats.triples)}
      </Grid>
      <Note>
        Density = occurrences ÷ total words (n-grams use n-gram slots as the denominator). The
        healthy zone is roughly 0.5–2.5%. Phrases beat single words — they match long-tail queries
        and read naturally.
      </Note>
    </div>
  );
}

/* ------------------------------ 4. Hreflang generator ---------------------- */

type HfRow = { locale: string; url: string };

function localeIssue(locale: string, rows: HfRow[], self: number): string {
  const l = locale.trim();
  if (!l) return "required — e.g. en-US, pt-BR or x-default";
  if (l === "x-default") return "";
  if (!/^[A-Za-z]{2,3}(-[A-Za-z]{2})?$/.test(l)) return "use ll or ll-CC format (de, de-DE, pt-BR)";
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(l))
    return "convention: lowercase language + uppercase region — “en-us” → en-US";
  if (rows.some((r, i) => i !== self && r.locale.trim().toLowerCase() === l.toLowerCase()))
    return "duplicate locale — each may appear once";
  return "";
}

function urlIssue(url: string): string {
  const u = url.trim();
  if (!u) return "absolute URL required (https://…)";
  if (!URL_OK(u)) return "must be a fully-qualified https://… URL";
  return "";
}

export function HreflangGenTool() {
  const A = accentOf(3);
  const [rows, setRows] = useState<HfRow[]>([
    { locale: "en-US", url: "https://example.com/" },
    { locale: "de-DE", url: "https://example.com/de/" },
  ]);
  const PRESETS = ["en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "pt-BR", "ja-JP", "x-default"];
  const inp =
    "min-w-0 rounded border border-zinc-700 bg-zinc-950/70 px-2 py-1.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none";

  const setRow = (i: number, patch: Partial<HfRow>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const build = useMemo(() => {
    const issues = rows.map((r, i) => [localeIssue(r.locale, rows, i), urlIssue(r.url)] as const);
    const ok = rows.filter((_, i) => !issues[i][0] && !issues[i][1]);
    const block = ok
      .map((r) => `<link rel="alternate" hreflang="${r.locale.trim()}" href="${r.url.trim()}" />`)
      .join("\n");
    return {
      block: block || "<!-- add at least one valid locale + URL pair -->",
      okCount: ok.length,
      issueCount: issues.filter(([a, b]) => a || b).length,
      hasDefault: rows.some((r) => r.locale.trim() === "x-default"),
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <Row className="items-center">
        <span className="mono-kicker text-zinc-500">common presets</span>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setRows((rs) => [...rs, { locale: p, url: "" }])}
            className="rounded border border-zinc-700 px-2 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            +{p}
          </button>
        ))}
      </Row>
      <Split
        left={
          <Panel
            title={`locales (${rows.length})`}
            accent={A}
            right={
              <Btn variant="ghost" accent={A} onClick={() => setRows((rs) => [...rs, { locale: "", url: "" }])}>
                <Plus className="h-3.5 w-3.5" /> add row
              </Btn>
            }
          >
            <div className="space-y-3">
              {rows.map((r, i) => {
                const li = localeIssue(r.locale, rows, i);
                const ui = urlIssue(r.url);
                return (
                  <div key={i} className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={r.locale}
                        onChange={(e) => setRow(i, { locale: e.target.value })}
                        placeholder="en-US"
                        aria-label="locale code"
                        className={`${inp} w-24`}
                      />
                      <span className="text-zinc-600">→</span>
                      <input
                        value={r.url}
                        onChange={(e) => setRow(i, { url: e.target.value })}
                        placeholder="https://example.com/de/"
                        aria-label="page URL"
                        className={`${inp} flex-1`}
                      />
                      <IconBtn
                        label="remove row"
                        danger
                        onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                    {li || ui ? (
                      <p className="mt-1 text-[10px]" style={{ color: "#FF8A7A" }}>
                        {[li, ui].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Out label="hreflang link block" text={build.block} rows={8} />
            <Panel title="validator" accent={A}>
              <KV k="valid rows" v={build.okCount} accent="#5EE39A" />
              <KV k="issues" v={build.issueCount} accent={build.issueCount ? "#FF8A7A" : undefined} />
              <KV
                k="x-default present"
                v={<Tag accent={build.hasDefault ? "#5EE39A" : "#FF7A3D"}>{build.hasDefault ? "yes" : "no"}</Tag>}
              />
              {!build.hasDefault && build.okCount > 0 ? (
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                  Tip: add an <span className="font-mono text-zinc-300">x-default</span> row pointing
                  at your language/region selector — it catches everyone the other tags miss.
                </p>
              ) : null}
            </Panel>
          </div>
        }
      />
      <Note>
        Hreflang needs mutual return links — every page you list should link back to all the
        others, each with its own canonical. These tags go in the &lt;head&gt; of every localized
        version (or in your XML sitemap as xhtml:link entries).
      </Note>
    </div>
  );
}

/* ------------------------------ 5. FAQ schema ------------------------------ */

type QA = { q: string; a: string };

export function SchemaFaqTool() {
  const A = accentOf(4);
  const [rows, setRows] = useState<QA[]>([
    {
      q: "Is this tool really free?",
      a: "Yes — every Zyric tool runs entirely in your browser. There is no account, no upload and no usage limit.",
    },
    {
      q: "Do you store the text I paste?",
      a: "Never. Processing happens locally on your device and nothing is transmitted to any server.",
    },
  ]);

  const setRow = (i: number, patch: Partial<QA>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRows((rs) => {
      const j = i + d;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const lens = rows.map((r) => r.a.trim().length);
  const avg = rows.length ? Math.round(lens.reduce((s, n) => s + n, 0) / rows.length) : 0;

  const json = useMemo(() => {
    const mainEntity = rows
      .filter((r) => r.q.trim() && r.a.trim())
      .map((r) => ({
        "@type": "Question",
        name: r.q.trim(),
        acceptedAnswer: { "@type": "Answer", text: r.a.trim() },
      }));
    return JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity }, null, 2);
  }, [rows]);

  const answerAccent = (n: number) => (n < 40 ? "#FF8A7A" : n > 320 ? "#FF7A3D" : "#5EE39A");
  const answerHint = (n: number) =>
    n < 40 ? "too thin — aim for ≈160 chars" : n <= 320 ? "in the sweet spot (target ≈160)" : "long — display may trim it";

  return (
    <div className="space-y-4">
      <Row className="items-center">
        <Btn accent={A} onClick={() => setRows((rs) => [...rs, { q: "", a: "" }])}>
          <Plus className="h-3.5 w-3.5" /> add question
        </Btn>
        <Tag accent={A}>{rows.length} questions</Tag>
        <Tag accent={A}>avg answer {avg} chars</Tag>
        {rows.length < 2 ? <Tag accent="#FF8A7A">2+ questions required for rich results</Tag> : null}
      </Row>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1.5">
              <span className="mono-kicker" style={{ color: A }}>
                Q{i + 1}
              </span>
              <div className="flex items-center gap-1">
                <IconBtn label="move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="delete question" danger onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            </div>
            <div className="space-y-3 p-3">
              <Field label="Question" value={r.q} onChange={(v) => setRow(i, { q: v })} placeholder="What does this tool do?" />
              <Area
                label="Answer"
                value={r.a}
                onChange={(v) => setRow(i, { a: v })}
                rows={3}
                mono={false}
                placeholder="One clear paragraph — 40–320 characters."
              />
              <Meter
                value={lens[i]}
                max={360}
                accent={answerAccent(lens[i])}
                label="answer length"
                right={`${lens[i]} chars — ${answerHint(lens[i])}`}
              />
            </div>
          </div>
        ))}
      </div>
      <Out label="faqpage json-ld" text={json} rows={12} />
      <Note>
        Paste into a{" "}
        <span className="font-mono text-zinc-500">&lt;script type=&quot;application/ld+json&quot;&gt;</span>{" "}
        block before &lt;/body&gt;. Google only grants FAQ rich results when the questions are
        visible on the page and written by the site (not user-generated forum threads).
      </Note>
    </div>
  );
}

/* ------------------------------ 6. HowTo schema ---------------------------- */

type Step = { name: string; text: string; image: string };

export function SchemaHowToTool() {
  const A = accentOf(5);
  const [name, setName] = useState("How to make cold brew coffee");
  const [desc, setDesc] = useState(
    "A smooth, low-acid concentrate you can batch once a week — no special gear needed.",
  );
  const [hours, setHours] = useState(12);
  const [mins, setMins] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { name: "Grind the beans", text: "Coarsely grind 100 g of coffee — sea-salt texture, not powder.", image: "" },
    { name: "Combine with water", text: "Stir the grounds into 1 L of filtered water in a large jar.", image: "" },
    { name: "Steep and strain", text: "Refrigerate for 12 hours, then strain through a paper filter.", image: "" },
  ]);

  const setStep = (i: number, patch: Partial<Step>) =>
    setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) =>
    setSteps((ss) => {
      const j = i + d;
      if (j < 0 || j >= ss.length) return ss;
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const iso = useMemo(() => {
    let d = "PT";
    if (hours > 0) d += `${hours}H`;
    if (mins > 0) d += `${mins}M`;
    return d === "PT" ? "" : d;
  }, [hours, mins]);

  const json = useMemo(() => {
    const obj: Record<string, unknown> = { "@context": "https://schema.org", "@type": "HowTo" };
    if (name.trim()) obj.name = name.trim();
    if (desc.trim()) obj.description = desc.trim();
    if (iso) obj.totalTime = iso;
    obj.step = steps
      .filter((s) => s.name.trim() || s.text.trim())
      .map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name.trim(),
        text: s.text.trim(),
        ...(s.image.trim() && URL_OK(s.image) ? { image: s.image.trim() } : {}),
      }));
    return JSON.stringify(obj, null, 2);
  }, [name, desc, steps, iso]);

  const issues: string[] = [];
  if (!name.trim()) issues.push("name is required");
  if (!desc.trim()) issues.push("description is recommended — it feeds the snippet");
  if (!steps.some((s) => s.name.trim() || s.text.trim())) issues.push("at least one step is required");
  steps.forEach((s, i) => {
    if (s.image.trim() && !URL_OK(s.image)) issues.push(`step ${i + 1}: image must be a full https:// URL (it is dropped until fixed)`);
  });

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="the craft" accent={A}>
            <div className="space-y-3">
              <Field label="HowTo name" value={name} onChange={setName} placeholder="How to…" />
              <Area label="Short description" value={desc} onChange={setDesc} rows={3} mono={false} />
              <Row>
                <Field
                  label="Total time — hours"
                  type="number"
                  value={hours}
                  onChange={(v) => setHours(Math.max(0, Math.min(96, Number(v) || 0)))}
                  min={0}
                  max={96}
                  className="w-28"
                />
                <Field
                  label="Minutes"
                  type="number"
                  value={mins}
                  onChange={(v) => setMins(Math.max(0, Math.min(59, Number(v) || 0)))}
                  min={0}
                  max={59}
                  className="w-28"
                />
                <div className="min-w-0">
                  <span className="mono-kicker mb-1.5 block text-zinc-500">ISO 8601 duration</span>
                  <Tag accent={iso ? "#5EE39A" : "#FF7A3D"}>
                    <Timer className="mr-1 inline h-3 w-3" />
                    {iso || "PT… — set a time"}
                  </Tag>
                </div>
              </Row>
              {issues.length ? (
                <ul className="space-y-1 text-[11px] leading-relaxed" style={{ color: "#FF8A7A" }}>
                  {issues.map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-emerald-300">All checks passed — schema is ready.</p>
              )}
            </div>
          </Panel>
        }
        right={
          <Panel
            title={`steps (${steps.length})`}
            accent={A}
            right={
              <Btn variant="ghost" accent={A} onClick={() => setSteps((ss) => [...ss, { name: "", text: "", image: "" }])}>
                <Plus className="h-3.5 w-3.5" /> add step
              </Btn>
            }
          >
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="rounded-md border border-zinc-800 bg-zinc-950/50 p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: A }}>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-zinc-950" style={{ background: A }}>
                        {i + 1}
                      </span>
                      step {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <IconBtn label="move up" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="move down" disabled={i === steps.length - 1} onClick={() => move(i, 1)}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="delete step" danger onClick={() => setSteps((ss) => ss.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Field label="Step name" value={s.name} onChange={(v) => setStep(i, { name: v })} placeholder="Grind the beans" />
                    <Area label="Step text" value={s.text} onChange={(v) => setStep(i, { text: v })} rows={2} mono={false} placeholder="One concrete instruction." />
                    <Field label="Image URL (optional)" value={s.image} onChange={(v) => setStep(i, { image: v })} placeholder="https://…/step-1.jpg" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        }
      />
      <Out label="howto json-ld" text={json} rows={12} />
      <Note>
        totalTime uses ISO 8601 duration format (PT12H30M = 12 h 30 min). Google retired the
        HowTo rich result for most sites in 2023, but the markup still powers assistants and voice
        answers — worth shipping if your steps are genuinely instructional.
      </Note>
    </div>
  );
}

/* ------------------------------ 7. Redirect rules -------------------------- */

type Red = { from: string; to: string; code: "301" | "302" };

function normPath(p: string): string {
  const s = p.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const lead = s.startsWith("/") ? s : `/${s}`;
  return lead.length > 1 ? lead.replace(/\/+$/, "") : lead;
}

export function RedirectRulesTool() {
  const A = accentOf(6);
  const [rows, setRows] = useState<Red[]>([
    { from: "/old-pricing", to: "/pricing", code: "301" },
    { from: "/blog/2023-guide", to: "/guides/evergreen", code: "301" },
  ]);
  const [fmtTab, setFmtTab] = useState<"htaccess" | "nginx" | "vercel" | "netlify">("htaccess");

  const setRow = (i: number, patch: Partial<Red>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setCodeAll = (code: "301" | "302") => setRows((rs) => rs.map((r) => ({ ...r, code })));

  const usable = useMemo(() => {
    const out: { from: string; to: string; code: "301" | "302" }[] = [];
    for (const r of rows) {
      const from = normPath(r.from);
      const to = normPath(r.to);
      if (from && to && from !== to) out.push({ from, to, code: r.code });
    }
    return out;
  }, [rows]);

  const outputs = useMemo(() => {
    const none = "# add a valid old → new pair above";
    return {
      htaccess: usable.length
        ? `RewriteEngine On\n${usable.map((r) => `Redirect ${r.code} ${r.from} ${r.to}`).join("\n")}`
        : none,
      nginx: usable.length
        ? usable.map((r) => `location = ${r.from} { return ${r.code} ${r.to}; }`).join("\n")
        : none,
      vercel: usable.length
        ? JSON.stringify(
            { redirects: usable.map((r) => ({ source: r.from, destination: r.to, permanent: r.code === "301" })) },
            null,
            2,
          )
        : none,
      netlify: usable.length
        ? usable
            .map((r) => `[[redirects]]\nfrom = "${r.from}"\nto = "${r.to}"\nstatus = ${r.code}\nforce = true`)
            .join("\n\n")
        : none,
    };
  }, [usable]);

  const count = (code: "301" | "302") => rows.filter((r) => r.code === code).length;

  return (
    <div className="space-y-4">
      <Row className="items-center">
        <span className="mono-kicker text-zinc-500">bulk status</span>
        <Btn variant="ghost" accent={A} onClick={() => setCodeAll("301")}>
          all → 301 permanent
        </Btn>
        <Btn variant="ghost" accent={A} onClick={() => setCodeAll("302")}>
          all → 302 temporary
        </Btn>
        <Tag accent={A}>{rows.length} rows · {count("301")}× 301 · {count("302")}× 302</Tag>
        <Btn
          accent={A}
          onClick={() => setRows((rs) => [...rs, { from: "", to: "", code: "301" }])}
        >
          <Plus className="h-3.5 w-3.5" /> add redirect
        </Btn>
      </Row>
      <div className="space-y-3">
        {rows.map((r, i) => {
          const nf = normPath(r.from);
          const nt = normPath(r.to);
          const bad = (r.from.trim() && !nf) || (r.to.trim() && !nt) || (nf && nt && nf === nt);
          return (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={r.from}
                  onChange={(e) => setRow(i, { from: e.target.value })}
                  placeholder="/old-path"
                  aria-label="old path"
                  className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950/70 px-2 py-1.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
                <span className="text-zinc-600">→</span>
                <input
                  value={r.to}
                  onChange={(e) => setRow(i, { to: e.target.value })}
                  placeholder="/new-path or https://…"
                  aria-label="new path"
                  className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950/70 px-2 py-1.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
                <Seg
                  value={r.code}
                  onChange={(v) => setRow(i, { code: v })}
                  accent={r.code === "301" ? A : "#FF7A3D"}
                  options={[
                    { v: "301", label: "301" },
                    { v: "302", label: "302" },
                  ]}
                />
                <IconBtn label="delete redirect" danger onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-zinc-600">
                {bad ? (
                  <span style={{ color: "#FF8A7A" }}>
                    {nf && nt && nf === nt
                      ? "source and destination are identical"
                      : "invalid — paths must start with / (or be full URLs)"}
                  </span>
                ) : (
                  <>
                    normalized → {nf || "—"} ➜ {nt || "—"}
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
      <Row className="items-center">
        <Seg
          value={fmtTab}
          onChange={setFmtTab}
          accent={A}
          options={[
            { v: "htaccess", label: ".htaccess" },
            { v: "nginx", label: "nginx.conf" },
            { v: "vercel", label: "vercel.json" },
            { v: "netlify", label: "netlify.toml" },
          ]}
        />
        <Tag accent="#5EE39A">{usable.length} valid of {rows.length}</Tag>
      </Row>
      <Out
        label={fmtTab === "htaccess" ? ".htaccess (Apache)" : fmtTab === "nginx" ? "nginx.conf" : fmtTab === "vercel" ? "vercel.json" : "netlify.toml"}
        text={outputs[fmtTab]}
        rows={10}
      />
      <Note>
        Trailing slashes are normalized away (except the root “/”). Use 301 for forever moves —
        link equity transfers; 302 tells crawlers the change is temporary. vercel.json goes at the
        project root, netlify.toml with force = true wins over static files. Verify with
        <span className="font-mono text-zinc-500"> curl -I https://yoursite.com/old-path</span>.
      </Note>
    </div>
  );
}

/* ------------------------------ 8. Head tags builder ----------------------- */

export function HeadTagsTool() {
  const A = accentOf(7);
  const [canonical, setCanonical] = useState("https://zyric.tech/tools/serp-preview");
  const [author, setAuthor] = useState("Zyric");
  const [charset, setCharset] = useState<"utf-8" | "windows-1252">("utf-8");
  const [viewport, setViewport] = useState<"responsive" | "fixed" | "none">("responsive");
  const [robots, setRobots] = useState({ index: true, follow: true, nosnippet: false, noarchive: false });
  const toggle = (k: keyof typeof robots) => (v: boolean) => setRobots((r) => ({ ...r, [k]: v }));

  const robotsContent = [
    robots.index ? "index" : "noindex",
    robots.follow ? "follow" : "nofollow",
    ...(robots.nosnippet ? ["nosnippet"] : []),
    ...(robots.noarchive ? ["noarchive"] : []),
  ].join(", ");

  const explain: string[] = [
    robots.index
      ? "Search engines may include this page in results."
      : "noindex — this page is excluded from search results entirely.",
    robots.follow
      ? "Links on the page are crawled and can pass equity."
      : "nofollow — crawlers ignore the links on this page.",
    ...(robots.nosnippet ? ["nosnippet — no text snippet or video preview under the result."] : []),
    ...(robots.noarchive ? ["noarchive — Google removes the “Cached” copy."] : []),
  ];
  if (!robots.index && (robots.nosnippet || robots.noarchive))
    explain.push("With noindex set, the extras barely matter — the page is out of the index anyway.");
  if (!robots.index && canonical.trim())
    explain.push("A canonical on a noindex page sends mixed signals — prefer one signal or the other.");

  const head = useMemo(() => {
    const lines = [`<meta charset="${charset}" />`];
    if (viewport === "responsive") lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1" />`);
    if (viewport === "fixed") lines.push(`<meta name="viewport" content="width=1024" />`);
    lines.push(`<meta name="robots" content="${robotsContent}" />`);
    if (author.trim()) lines.push(`<meta name="author" content="${author.trim()}" />`);
    if (canonical.trim()) lines.push(`<link rel="canonical" href="${canonical.trim()}" />`);
    return lines.join("\n");
  }, [charset, viewport, robotsContent, author, canonical]);

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Panel title="robots directives" accent={A}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Check label="index" checked={robots.index} onChange={toggle("index")} />
            <Check label="follow" checked={robots.follow} onChange={toggle("follow")} />
            <Check label="nosnippet" checked={robots.nosnippet} onChange={toggle("nosnippet")} />
            <Check label="noarchive" checked={robots.noarchive} onChange={toggle("noarchive")} />
          </div>
          <ul className="mt-3 space-y-1.5 border-t border-zinc-800 pt-3 text-xs leading-relaxed text-zinc-300">
            {explain.map((line) => (
              <li key={line} className="flex gap-2">
                <span style={{ color: A }}>▸</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="document meta" accent={A}>
          <div className="space-y-3">
            <Field label="Canonical URL (absolute, exactly one per page)" value={canonical} onChange={setCanonical} placeholder="https://yoursite.com/page" />
            <Field label="Author" value={author} onChange={setAuthor} placeholder="Your name or brand" />
            <div>
              <span className="mono-kicker mb-1.5 block text-zinc-500">charset</span>
              <Seg
                value={charset}
                onChange={setCharset}
                accent={A}
                options={[
                  { v: "utf-8", label: "UTF-8" },
                  { v: "windows-1252", label: "Windows-1252" },
                ]}
              />
            </div>
            <div>
              <span className="mono-kicker mb-1.5 block text-zinc-500">viewport</span>
              <Seg
                value={viewport}
                onChange={setViewport}
                accent={A}
                options={[
                  { v: "responsive", label: "Responsive" },
                  { v: "fixed", label: "Fixed 1024" },
                  { v: "none", label: "None" },
                ]}
              />
            </div>
          </div>
        </Panel>
      </Grid>
      <Out label="<head> snippet" text={head} rows={7} />
      <Note>
        Canonical rules of thumb: absolute URL, self-referencing is correct and recommended, and it
        must appear exactly once — two conflicting canonical tags make Google pick one for you.
        Keep charset first; everything else may follow in any order.
      </Note>
    </div>
  );
}

/* ------------------------------ 9. Favicon snippets ------------------------ */

export function FaviconSnippetsTool() {
  const A = accentOf(8);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [err, setErr] = useState("");
  const [site, setSite] = useState("");
  const [ver, setVer] = useState("2");
  const [themeColor, setThemeColor] = useState("#0a0a0a");

  useEffect(() => {
    if (!file) {
      setPreview("");
      setErr("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPreview("");
      setErr("that file isn’t an image — drop a PNG, SVG or ICO");
      return;
    }
    setErr("");
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const base = site.trim().replace(/\/+$/, "");
  const abs = (p: string) => (base ? `${base}${p}` : p);
  const v = ver.trim() ? `?v=${ver.trim()}` : "";
  const html = [
    `<link rel="icon" type="image/png" sizes="16x16" href="${abs("/favicon-16x16.png")}${v}" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${abs("/favicon-32x32.png")}${v}" />`,
    `<link rel="shortcut icon" href="${abs("/favicon.ico")}${v}" />`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${abs("/apple-touch-icon.png")}${v}" />`,
    `<link rel="icon" type="image/png" sizes="192x192" href="${abs("/android-chrome-192x192.png")}${v}" />`,
    `<link rel="icon" type="image/png" sizes="512x512" href="${abs("/android-chrome-512x512.png")}${v}" />`,
    `<link rel="mask-icon" href="${abs("/safari-pinned-tab.svg")}${v}" color="${themeColor}" />`,
    `<link rel="manifest" href="${abs("/site.webmanifest")}${v}" />`,
    `<meta name="theme-color" content="${themeColor}" />`,
  ].join("\n");

  const CHECKLIST = [
    "Export PNGs at 16, 32, 180, 192 and 512 px, plus a legacy favicon.ico (32 px).",
    "Drop them in public/ (Next.js) or your web root — filenames must match the tags exactly.",
    "mask-icon needs a solid-color SVG silhouette (the pinned-tab shape).",
    "site.webmanifest must list the 192 + 512 icons with a name and theme color.",
    "Replacing the icon? Bump the ?v= query — browsers cache favicons aggressively.",
    "Verify in a private window; cached old icons will gaslight you otherwise.",
  ];

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <label className="flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 text-center text-xs text-zinc-400 transition-colors hover:border-zinc-500">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Image className="h-5 w-5 shrink-0" style={{ color: A }} />
              <span className="min-w-0 break-words">
                {file ? file.name : "click to choose your master icon — 1024×1024 PNG is ideal (previewed locally only)"}
              </span>
            </label>
            {err ? (
              <p className="text-[11px]" style={{ color: "#FF8A7A" }}>
                {err}
              </p>
            ) : null}
            {preview ? (
              <Panel title="your icon at real sizes" accent={A}>
                <div className="flex items-end gap-5">
                  {[
                    [16, "16px — tab"],
                    [32, "32px — bookmark"],
                    [64, "64px — hi-dpi"],
                  ].map(([px, label]) => (
                    <div key={label} className="text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                      <img
                        src={preview}
                        alt={`icon at ${px}px`}
                        className="rounded border border-zinc-800 bg-zinc-900 object-contain"
                        style={{ width: `${px}px`, height: `${px}px` }}
                      />
                      <p className="mt-1 font-mono text-[9px] text-zinc-600">{label}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}
            <Row>
              <Field
                label="Site URL (optional — empty = root-relative paths)"
                value={site}
                onChange={setSite}
                placeholder="https://yoursite.com"
                className="min-w-[200px] flex-1"
              />
              <Field label="Cache-bust version" value={ver} onChange={setVer} className="w-24" hint="appended as ?v=" />
              <Field label="Theme color (hex)" value={themeColor} onChange={setThemeColor} className="w-32" hint="mask-icon + browser chrome" />
            </Row>
          </div>
        }
        right={
          <div className="space-y-3">
            <Out label="favicon <link> block" text={html} rows={11} />
            <Panel title="deployment checklist" accent={A}>
              <ol className="space-y-1.5 text-xs leading-relaxed text-zinc-300">
                {CHECKLIST.map((c, i) => (
                  <li key={c} className="flex gap-2">
                    <span className="font-mono text-[10px] font-bold" style={{ color: A }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{c}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        }
      />
      <Note>
        Your image never leaves the browser — it is only previewed from a local object URL. Generate
        the size set with the Image kit next door (crop + convert), then deploy with the checklist.
      </Note>
    </div>
  );
}

/* ------------------------------ 10. Platform sizes ------------------------- */

type SizeEntry = {
  name: string;
  w: number;
  h: number;
  tag: string;
  note: string;
  safe?: string;
  box?: { t: number; b: number; l: number; r: number };
};

const SIZES: SizeEntry[] = [
  { name: "Instagram post", w: 1080, h: 1080, tag: "feed · 1:1", note: "The classic square — still the safest default for the grid." },
  { name: "Instagram portrait", w: 1080, h: 1350, tag: "feed · 4:5", note: "Tallest feed crop — takes ~14% more screen than 1:1." },
  {
    name: "Instagram story / reel",
    w: 1080,
    h: 1920,
    tag: "story · 9:16",
    safe: "keep 250px top & 320px bottom clear — profile UI + caption zone",
    box: { t: 13, b: 17, l: 0, r: 0 },
    note: "Full-screen vertical canvas; exports as 9:16.",
  },
  { name: "X / Twitter post", w: 1600, h: 900, tag: "timeline · 16:9", note: "In-card crop is 2:1 — 1600×900 survives it cleanly." },
  { name: "X header", w: 1500, h: 500, tag: "profile · 3:1", safe: "the avatar circle overlaps the bottom-left corner", note: "Desktop shows a thin strip on mobile — center what matters." },
  {
    name: "YouTube banner",
    w: 2560,
    h: 1440,
    tag: "channel art",
    safe: "min safe area 1546×423 — all critical content lives inside it",
    box: { t: 35.3, b: 35.3, l: 19.8, r: 19.8 },
    note: "One file, three devices: TV sees all 2560×1440, desktop a strip, mobile the safe area.",
  },
  { name: "YouTube thumbnail", w: 1280, h: 720, tag: "video · 16:9", note: "Under 2 MB, JPG/PNG — faces plus three words outperform." },
  { name: "Facebook cover", w: 820, h: 312, tag: "page · 2.63:1", safe: "mobile crops to ≈640×360 around the center", note: "Design center-out; the edges vanish on phones." },
  { name: "LinkedIn banner", w: 1584, h: 396, tag: "profile · 4:1", safe: "the avatar sits bottom-left of the personal banner", note: "Ultra-wide strip — keep text right of the avatar zone." },
  {
    name: "TikTok video",
    w: 1080,
    h: 1920,
    tag: "video · 9:16",
    safe: "right rail ≈120px + bottom caption zone stay clear",
    box: { t: 8, b: 18, l: 0, r: 12 },
    note: "Same 9:16 canvas as stories — shoot once, crop twice.",
  },
];

export function PlatformSizesTool() {
  const A = accentOf(9);
  const [q, setQ] = useState("");
  const filtered = SIZES.filter((e) =>
    `${e.name} ${e.tag} ${e.note} ${e.safe ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Row className="items-center">
        <Field label="Search formats" value={q} onChange={setQ} placeholder="story, banner, 9:16…" className="min-w-[200px] flex-1" />
        <Tag accent={A}>
          {filtered.length} / {SIZES.length} formats
        </Tag>
      </Row>
      {filtered.length === 0 ? (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-8 text-center text-sm text-zinc-600">
          No format matches “{q}” — try “story”, “banner” or “9:16”.
        </p>
      ) : (
        <Grid cols={3}>
          {filtered.map((e) => {
            const ratio = e.w / e.h;
            return (
              <div key={e.name} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-bold text-zinc-100">{e.name}</p>
                  <p className="shrink-0 font-mono text-[10px] font-bold" style={{ color: A }}>
                    {e.w}×{e.h}
                  </p>
                </div>
                <p className="mono-kicker mt-0.5 text-zinc-600">{e.tag}</p>
                <div className="mt-2 flex min-h-[72px] items-center justify-center rounded border border-zinc-800/70 bg-zinc-950/60 p-2">
                  <div
                    className="relative overflow-hidden rounded-sm border"
                    style={{
                      aspectRatio: `${e.w} / ${e.h}`,
                      width: ratio > 1.2 ? "100%" : ratio > 0.8 ? 96 : 56,
                      background: `linear-gradient(135deg, ${A}2e, ${A}08)`,
                      borderColor: `${A}55`,
                    }}
                  >
                    {e.box ? (
                      <div
                        className="absolute border border-dashed"
                        style={{ top: `${e.box.t}%`, bottom: `${e.box.b}%`, left: `${e.box.l}%`, right: `${e.box.r}%`, borderColor: `${A}aa` }}
                      />
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold" style={{ color: A }}>
                      {e.w}:{e.h}
                    </span>
                  </div>
                </div>
                {e.safe ? (
                  <p className="mt-1.5 text-[10px] leading-snug" style={{ color: A }}>
                    ▢ safe area: {e.safe}
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] leading-snug text-zinc-600">{e.note}</p>
              </div>
            );
          })}
        </Grid>
      )}
      <Note>
        Dimensions verified against 2026 platform docs. Platforms shift crops without notice —
        when in doubt, add ~5% padding around any text so a surprise crop can&apos;t clip it. The
        dashed overlay on each preview approximates the safe zone.
      </Note>
    </div>
  );
}

/* ------------------------------ meta --------------------------------------- */

export const seoPlusMeta: ToolMeta[] = [
  {
    id: "serp-preview",
    name: "Google SERP Preview",
    description:
      "Live pixel-width SERP snippet mock — desktop vs mobile truncation, title & description meters, status tags.",
    category: "web",
    icon: Search,
    keywords: "serp preview google title meta description pixel width snippet truncate breadcrumb",
    badge: "new",
    component: SerpPreviewTool,
  },
  {
    id: "og-preview",
    name: "Social Share Preview",
    description:
      "Facebook, X, WhatsApp and LinkedIn share-card mocks from your pasted OG tags — no fetching, privacy-first.",
    category: "web",
    icon: Share2,
    keywords: "open graph preview facebook twitter whatsapp linkedin social share card og image twitter card",
    badge: "new",
    component: OgPreviewTool,
  },
  {
    id: "keyword-density",
    name: "Keyword Density Analyzer",
    description:
      "Top words, 2- and 3-word phrases with counts and density %, stop-word filter and over-optimization warnings.",
    category: "web",
    icon: BarChart3,
    keywords: "keyword density analyzer word count n-gram phrases stop words stuffing seo content",
    badge: "new",
    component: KeywordDensityTool,
  },
  {
    id: "hreflang-gen",
    name: "Hreflang Tag Generator",
    description:
      "Row-by-row hreflang link builder with locale validation, preset chips, duplicate detection and x-default hints.",
    category: "web",
    icon: Languages,
    keywords: "hreflang generator alternate locale international seo x-default link tags multilingual",
    badge: "new",
    component: HreflangGenTool,
  },
  {
    id: "schema-faq",
    name: "FAQ Schema Builder",
    description:
      "Reorderable Q&A builder that emits valid FAQPage JSON-LD with answer-length sweet-spot meters.",
    category: "web",
    icon: CircleHelp,
    keywords: "faq schema builder json ld faqpage structured data rich results questions answers",
    badge: "new",
    component: SchemaFaqTool,
  },
  {
    id: "schema-howto",
    name: "HowTo Schema Builder",
    description:
      "Step-based HowTo schema builder with reordering, optional step images and an ISO 8601 total-time helper.",
    category: "web",
    icon: ListOrdered,
    keywords: "howto schema builder json ld steps iso 8601 duration structured data tutorial",
    badge: "new",
    component: SchemaHowToTool,
  },
  {
    id: "redirect-rules",
    name: "Redirect Rule Generator",
    description:
      "Old→new path rows compiled live to .htaccess, nginx.conf, vercel.json and netlify.toml with 301/302 control.",
    category: "web",
    icon: ArrowRightLeft,
    keywords: "redirect generator htaccess nginx vercel netlify 301 302 rules permanent temporary",
    badge: "new",
    component: RedirectRulesTool,
  },
  {
    id: "head-tags",
    name: "Head Tags Builder",
    description:
      "Canonical, robots directives with plain-english explanations, author, viewport and charset — one head block.",
    category: "web",
    icon: Code2,
    keywords: "head tags builder canonical robots meta viewport charset author noindex nosnippet noarchive",
    badge: "new",
    component: HeadTagsTool,
  },
  {
    id: "favicon-snippets",
    name: "Favicon HTML Checklist",
    description:
      "Pick an icon, get every favicon link tag (16→512, mask-icon, manifest, theme-color) plus a deployment checklist.",
    category: "web",
    icon: Star,
    keywords: "favicon html tags apple touch icon manifest theme color checklist cache busting deployment",
    badge: "new",
    component: FaviconSnippetsTool,
  },
  {
    id: "platform-sizes",
    name: "Social Image Size Cheat Sheet 2026",
    description:
      "Searchable cheat sheet of social image dimensions with proportion-correct previews and safe-area overlays.",
    category: "web",
    icon: Ruler,
    keywords: "social media image sizes 2026 cheat sheet instagram tiktok youtube linkedin facebook dimensions safe area",
    badge: "new",
    component: PlatformSizesTool,
  },
];
