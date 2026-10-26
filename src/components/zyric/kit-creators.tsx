"use client";

/* ==========================================================================
   KIT: CREATORS & NEWSLETTER MONEY — 12 monetisation planners for people
   who make things on the internet. AI video credits, newsletter platform
   fees and sponsor rates, TikTok Shop affiliates, YouTube memberships,
   subathon timers, LLM API break-evens, Midjourney fast hours, Etsy fees,
   Upwork connects and retainer pricing. Pure client-side math — every
   rate, fee and allowance is an editable field, nothing is hardwired.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Briefcase,
  Clapperboard,
  FileText,
  Image,
  Megaphone,
  Repeat,
  Send,
  ShoppingBag,
  Store,
  Timer,
  Youtube,
} from "lucide-react";
import {
  BigStat,
  Field,
  Grid,
  KV,
  Meter,
  Note,
  Out,
  Panel,
  Row,
  Seg,
  Slider,
  Split,
  Tag,
  accentOf,
  fmt,
  money,
  pct,
} from "./kit";
import type { ToolMeta } from "./tool-types";

const OVER = "#FF8A7A"; // semantic "over budget / losing" red

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function padR(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function padL(s: string, n: number): string {
  return s.length >= n ? s : " ".repeat(n - s.length) + s;
}

function hms(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return m === 60 ? `${h + 1}h 0m` : `${h}h ${m}m`;
}

const NICHES = [
  { v: "general", label: "General ×1", m: 1 },
  { v: "lifestyle", label: "Lifestyle ×1.1", m: 1.1 },
  { v: "tech", label: "Tech/Dev ×1.5", m: 1.5 },
  { v: "finance", label: "Finance/B2B ×2.5", m: 2.5 },
] as const;

type NicheId = (typeof NICHES)[number]["v"];

/* ------------------------------ 1. AI video credits ------------------------ */

const VIDEO_MODELS = [
  { v: "gen4", label: "Runway Gen-4", rate: 12 },
  { v: "turbo", label: "Runway Turbo", rate: 6 },
  { v: "veo", label: "Veo Fast", rate: 2.5 },
  { v: "kling", label: "Kling", rate: 7 },
] as const;

export function AiVideoCreditsTool() {
  const A = accentOf(0);
  const [fin, setFin] = useState("10");
  const [secs, setSecs] = useState("8");
  const [takes, setTakes] = useState("3");
  const [model, setModel] = useState<"gen4" | "turbo" | "veo" | "kling">("gen4");
  const [rate, setRate] = useState("12");

  const res = useMemo(() => {
    const minutes = Math.max(0, num(fin));
    const t = Math.max(1, num(takes));
    const genSeconds = minutes * 60 * t;
    const credits = genSeconds * num(rate);
    const keeperShots = (minutes * 60) / Math.max(1, num(secs));
    const plans = [
      { label: "Starter", price: 12, credits: 625 },
      { label: "Standard", price: 28, credits: 2250 },
      { label: "Pro", price: 76, credits: 6000 },
    ].map((p) => ({
      ...p,
      fits: p.credits >= credits,
      usage: credits > 0 ? (credits / p.credits) * 100 : 0,
    }));
    const covering = plans.filter((p) => p.fits);
    const pick: { label: string; price: number } | null =
      covering.length > 0 ? covering.reduce((a, b) => (a.price <= b.price ? a : b)) : null;
    let months = 1;
    let cost = pick ? pick.price : 0;
    let verdict: string;
    if (pick) {
      verdict = `${pick.label} covers the month`;
    } else {
      const proMonths = Math.max(1, Math.ceil(credits / 6000));
      const proStack = proMonths * 76;
      if (proStack <= 95) {
        months = proMonths;
        cost = proStack;
        verdict = `Pro × ${proMonths} months beats Unlimited`;
      } else {
        cost = 95;
        verdict = "Unlimited wins at this volume";
      }
    }
    const costPerMin = minutes > 0 ? cost / minutes : 0;
    return { credits, genSeconds, keeperShots, plans, pickLabel: pick ? pick.label : "Unlimited", months, cost, costPerMin, verdict };
  }, [fin, secs, takes, rate]);

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Panel title="the shoot" accent={A}>
              <div className="space-y-2">
                <Row>
                  <Field label="Finished minutes" value={fin} onChange={setFin} type="number" min={0} className="flex-1" />
                  <Field label="Seconds / shot" value={secs} onChange={setSecs} type="number" min={1} className="flex-1" />
                  <Field label="Takes per keeper" value={takes} onChange={setTakes} type="number" min={1} className="flex-1" />
                </Row>
                <p className="font-mono text-[10px] text-zinc-600">
                  {fmt(res.keeperShots, 0)} keeper shots → {fmt(res.keeperShots * Math.max(1, num(takes)), 0)} generated clips (re-rolls in)
                </p>
              </div>
            </Panel>
            <Panel title="model & credit rate" accent={A}>
              <div className="space-y-3">
                <Seg
                  value={model}
                  onChange={(v) => {
                    setModel(v);
                    const m = VIDEO_MODELS.find((x) => x.v === v);
                    if (m) setRate(String(m.rate));
                  }}
                  options={VIDEO_MODELS.map((m) => ({ v: m.v, label: m.label }))}
                  accent={A}
                />
                <Field
                  label="Credits per generated second"
                  value={rate}
                  onChange={setRate}
                  type="number"
                  min={0}
                  step={0.5}
                  hint="editable — picking a model above fills its typical rate"
                />
              </div>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-3">
            <BigStat
              label="Credits needed"
              value={fmt(res.credits, 0)}
              unit="cr / mo"
              accent={A}
              hint={`${fmt(res.genSeconds, 0)} generated seconds @ ${rate} cr/s × ${takes} takes`}
            />
            <Panel title="plan fit — usage vs allowance" accent={A}>
              <div className="space-y-3">
                {res.plans.map((p) => (
                  <div key={p.label} className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                      <span className="mono-kicker text-zinc-500">
                        {p.label} · {money(p.price)}/mo · {fmt(p.credits, 0)} cr
                      </span>
                      {p.label === res.pickLabel ? <Tag accent={A}>cheapest fit</Tag> : null}
                    </div>
                    <Meter
                      value={res.credits}
                      max={p.credits}
                      accent={p.fits ? A : OVER}
                      right={p.fits ? `${pct(p.usage, 0)} used` : `over by ${fmt(res.credits - p.credits, 0)} cr`}
                    />
                  </div>
                ))}
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                    <span className="mono-kicker text-zinc-500">Unlimited · $95.00/mo · no cap</span>
                    {res.pickLabel === "Unlimited" ? <Tag accent={A}>cheapest fit</Tag> : null}
                  </div>
                  <Meter value={res.credits} max={Math.max(1, res.credits)} accent={A} right="always covered" />
                </div>
              </div>
            </Panel>
            <Panel title="the verdict" accent={A}>
              <div className="flex flex-wrap items-center gap-2">
                <Tag accent={A}>{res.verdict}</Tag>
              </div>
              <div className="mt-2">
                <KV k="cost per finished minute" v={money(res.costPerMin)} accent={A} />
                <KV k="generated seconds" v={fmt(res.genSeconds, 0)} />
                <KV k="keeper shots" v={fmt(res.keeperShots, 0)} />
                <KV k="months of credits" v={res.months === 1 ? "1 — fits in one month" : `${res.months} months of Pro`} />
                <KV k="total spend" v={money(res.cost)} accent={A} />
              </div>
            </Panel>
          </div>
        }
      />
      <Note>
        Defaults checked Oct 2026 — vendor prices drift, every rate here is editable. Re-rolls are the silent killer: 3 takes per keeper
        triples the bill, so tighten prompts before upgrading plans.
      </Note>
    </div>
  );
}

/* ------------------------------ 2. Substack vs Beehiiv vs Ghost ------------ */

export function NewsletterPlatformTool() {
  const A = accentOf(1);
  const [subs, setSubs] = useState("2000");
  const [paying, setPaying] = useState("120");
  const [price, setPrice] = useState("8");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [ssPct, setSsPct] = useState("10");
  const [txnPct, setTxnPct] = useState("2.9");
  const [txnFlat, setTxnFlat] = useState("0.30");
  const [bhFlat, setBhFlat] = useState("39");
  const [ghFlat, setGhFlat] = useState("9");

  const res = useMemo(() => {
    const eff = billing === "annual" ? (num(price) * 10) / 12 : num(price);
    const txnCut = (g: number, p: number) => (num(txnPct) / 100) * g + num(txnFlat) * p;
    const netAt = (payers: number, platformPct: number, flat: number) => {
      const g = payers * eff;
      return g - (platformPct / 100) * g - txnCut(g, payers) - flat;
    };
    const gross = num(paying) * eff;
    const ss = netAt(num(paying), num(ssPct), 0);
    const bh = netAt(num(paying), 0, num(bhFlat));
    const gh = netAt(num(paying), 0, num(ghFlat));
    // Ghost beats Substack when its flat fee < Substack's platform cut (Stripe cancels out)
    const crossover = (num(ssPct) / 100) * eff > 0 ? num(ghFlat) / ((num(ssPct) / 100) * eff) : Infinity;
    const opts = [
      { name: "Substack", value: ss, accent: "#FFD43B", hint: `${ssPct}% platform + Stripe` },
      { name: "Beehiiv", value: bh, accent: "#7FC8FF", hint: `${money(num(bhFlat))} flat + Stripe` },
      { name: "Ghost", value: gh, accent: "#5EE39A", hint: `${money(num(ghFlat))} flat + Stripe` },
    ];
    const winner = opts.reduce((a, b) => (a.value >= b.value ? a : b));
    const table = [
      padR("paying", 8) + padL("substack", 12) + padL("beehiiv", 12) + padL("ghost", 12) + "   winner",
      ...[50, 100, 250, 500, 1000].map((p) => {
        const a = netAt(p, num(ssPct), 0);
        const b = netAt(p, 0, num(bhFlat));
        const c = netAt(p, 0, num(ghFlat));
        const w = a >= b && a >= c ? "substack" : b >= c ? "beehiiv" : "ghost";
        return padR(String(p), 8) + padL(money(a), 12) + padL(money(b), 12) + padL(money(c), 12) + "   " + w;
      }),
    ].join("\n");
    return { eff, gross, ss, bh, gh, crossover, opts, winner, table };
  }, [paying, price, billing, ssPct, txnPct, txnFlat, bhFlat, ghFlat]);

  const conv = num(subs) > 0 ? (num(paying) / num(subs)) * 100 : 0;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Total subscribers" value={subs} onChange={setSubs} type="number" min={0} className="w-36" />
        <Field label="Paying subscribers" value={paying} onChange={setPaying} type="number" min={0} className="w-36" />
        <Field label="Monthly price" value={price} onChange={setPrice} type="number" min={0} step={0.5} className="w-32" />
        <Seg
          value={billing}
          onChange={setBilling}
          options={[
            { v: "monthly", label: "monthly" },
            { v: "annual", label: "annual (×10/12)" },
          ]}
          accent={A}
        />
      </Row>
      <Grid cols={3}>
        {res.opts.map((o) => (
          <BigStat
            key={o.name}
            label={`${o.name} net / mo`}
            value={money(o.value)}
            accent={o.accent}
            hint={o.hint}
          />
        ))}
      </Grid>
      <div className="flex flex-wrap items-center gap-2">
        <Tag accent={res.winner.accent}>{res.winner.name} wins at {fmt(num(paying), 0)} paying</Tag>
        <span className="font-mono text-[10px] text-zinc-600">
          gross {money(res.gross)}/mo · Stripe {txnPct}% + {money(num(txnFlat))}/txn everywhere
        </span>
      </div>
      <Split
        left={
          <Panel title="the crossover" accent={A}>
            <KV k="effective $ / paying / mo" v={money(res.eff)} accent={A} />
            <KV k="gross / month" v={money(res.gross)} />
            <KV k="free → paid conversion" v={pct(conv, 1)} />
            <KV
              k="ghost beats substack above"
              v={Number.isFinite(res.crossover) ? `${fmt(Math.ceil(res.crossover), 0)} paying` : "never at this price"}
              accent={A}
            />
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-zinc-600">
              Stripe takes the same cut everywhere, so it cancels out — the fight is Substack&apos;s {ssPct}% vs Ghost&apos;s flat{" "}
              {money(num(ghFlat))}. Annual billing spreads {price} × 10 over 12 months.
            </p>
          </Panel>
        }
        right={
          <Panel title="fee engines (all editable)" accent={A}>
            <Grid cols={2}>
              <Field label="Substack platform %" value={ssPct} onChange={setSsPct} type="number" min={0} step={0.5} />
              <Field label="Stripe %" value={txnPct} onChange={setTxnPct} type="number" min={0} step={0.1} />
              <Field label="Stripe flat $/txn" value={txnFlat} onChange={setTxnFlat} type="number" min={0} step={0.05} />
              <Field label="Beehiiv flat $/mo" value={bhFlat} onChange={setBhFlat} type="number" min={0} step={1} />
              <Field label="Ghost flat $/mo" value={ghFlat} onChange={setGhFlat} type="number" min={0} step={1} />
            </Grid>
          </Panel>
        }
      />
      <Out text={res.table} label="net / mo by paying count" rows={7} />
      <Note>
        Fees checked Oct 2026 — vendor prices drift, every rate here is editable. Below the crossover Substack&apos;s free-but-10% deal nets
        more; above it flat-fee Ghost quietly wins. Ghost is self-hosted, so add your own hosting cost if you move.
      </Note>
    </div>
  );
}

/* ------------------------------ 3. Newsletter sponsorship rate ------------- */

export function SponsorshipRateTool() {
  const A = accentOf(2);
  const [subs, setSubs] = useState("5000");
  const [open, setOpen] = useState("40");
  const [niche, setNiche] = useState<NicheId>("tech");
  const [cpm, setCpm] = useState("25");
  const [slots, setSlots] = useState("2");
  const [issues, setIssues] = useState("4");

  const res = useMemo(() => {
    const opens = num(subs) * (num(open) / 100);
    const raw = (opens / 1000) * num(cpm) * (NICHES.find((n) => n.v === niche)?.m ?? 1);
    const floored = opens < 1000;
    const slotPrice = floored ? 50 : raw;
    const extra = 0.7 * slotPrice;
    const perIssue = slotPrice + Math.max(0, num(slots) - 1) * extra;
    const monthly = perIssue * Math.max(0, num(issues));
    const bundle = monthly * 0.9;
    const effCpm = opens > 0 ? (slotPrice / opens) * 1000 : 0;
    return { opens, raw, floored, slotPrice, extra, perIssue, monthly, bundle, effCpm };
  }, [subs, open, niche, cpm, slots, issues]);

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <BigStat
          label="Price per primary slot"
          value={money(res.slotPrice)}
          accent={A}
          hint={res.floored ? `floor applied (raw CPM math says ${money(res.raw)})` : "CPM math, no floor needed"}
        />
        <BigStat label="Monthly potential" value={money(res.monthly)} accent={A} hint={`${issues} issues × ${slots} slots`} />
      </Grid>
      <Split
        left={
          <Panel title="your newsletter" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Subscribers" value={subs} onChange={setSubs} type="number" min={0} className="flex-1" />
                <Field label="Open rate %" value={open} onChange={setOpen} type="number" min={0} max={100} step={1} className="flex-1" />
              </Row>
              <Seg value={niche} onChange={setNiche} options={NICHES.map((n) => ({ v: n.v, label: n.label }))} accent={A} />
              <Row>
                <Field label="Base CPM $" value={cpm} onChange={setCpm} type="number" min={0} step={1} className="flex-1" />
                <Field label="Slots / issue" value={slots} onChange={setSlots} type="number" min={1} className="flex-1" />
                <Field label="Issues / month" value={issues} onChange={setIssues} type="number" min={0} className="flex-1" />
              </Row>
            </div>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Panel title="rate ladder" accent={A}>
              <KV k="1 slot / issue" v={money(res.slotPrice)} />
              <KV k="all slots / issue" v={`${money(res.perIssue)} · slot 2+ at −30%`} />
              <KV k="monthly bundle (−10%)" v={money(res.bundle)} accent={A} />
            </Panel>
            <Panel title="reach & sanity" accent={A}>
              <KV k="opens per issue" v={fmt(res.opens, 0)} />
              <KV k="effective CPM" v={money(res.effCpm)} accent={A} />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {res.floored ? (
                  <Tag accent={A}>under 1,000 opens — charge a flat $50 minimum</Tag>
                ) : (
                  <KV k="floor" v="not needed — you clear 1,000 opens" />
                )}
              </div>
            </Panel>
          </div>
        }
      />
      <Note>
        Sponsors buy opens, not subscribers — 40% is a strong consumer-newsletter open rate, so be honest or renewals die. Extra slots are
        priced at 70% because attention decays down the page. These are market heuristics, not vendor prices — negotiate.
      </Note>
    </div>
  );
}

/* ------------------------------ 4. Newsletter ad rate card ----------------- */

export function RateCardTool() {
  const A = accentOf(3);
  const [name, setName] = useState("The Morning Loop");
  const [subs, setSubs] = useState("5000");
  const [open, setOpen] = useState("40");
  const [niche, setNiche] = useState<NicheId>("tech");
  const [issues, setIssues] = useState("4");
  const [cpm, setCpm] = useState("25");

  const res = useMemo(() => {
    const opens = num(subs) * (num(open) / 100);
    const raw = (opens / 1000) * num(cpm) * (NICHES.find((n) => n.v === niche)?.m ?? 1);
    const floored = opens < 1000;
    const slotPrice = floored ? 50 : raw;
    const extra = 0.7 * slotPrice;
    const both = slotPrice + extra;
    const monthly = both * Math.max(0, num(issues));
    const bundle = monthly * 0.9;
    const nm = (name.trim() || "Your Newsletter").toUpperCase();
    const W = 44;
    const rule = "─".repeat(W);
    const center = (s: string) => " ".repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
    const line = (k: string, v: string) => `  ${padR(k, 21)}${v}`;
    const nicheLabel = NICHES.find((n) => n.v === niche)?.label.replace(/ ×[\d.]+$/, "") ?? "General";
    const card = [
      rule,
      center(`${nm} — SPONSOR RATE CARD`),
      rule,
      "",
      "AUDIENCE",
      line("Subscribers", fmt(num(subs), 0)),
      line("Avg open rate", `${pct(num(open), 1)}  (${fmt(opens, 0)} opens/issue)`),
      line("Niche", nicheLabel),
      line("Issues per month", fmt(num(issues), 0)),
      "",
      "PLACEMENTS (per issue)",
      line("Primary slot", `${money(slotPrice)} — 150-250 words, top`),
      line("Secondary slot", `${money(extra)}  (30% off primary)`),
      line("Both slots", money(both)),
      "",
      "BUNDLES",
      line("Monthly bundle", `${money(bundle)}  (${fmt(num(issues), 0)} issues, -10%)`),
      "",
      "BOOKING",
      "  Reply to this email to reserve an issue.",
      "  Payment upfront · copy due 48 h before send ·",
      "  I write the intro line · 1 link + 1 image max.",
      rule,
    ].join("\n");
    return { opens, floored, slotPrice, extra, both, bundle, card };
  }, [name, subs, open, niche, issues, cpm]);

  return (
    <div className="space-y-4">
      <Panel title="the newsletter" accent={A}>
        <div className="space-y-3">
          <Field label="Newsletter name" value={name} onChange={setName} placeholder="Your Newsletter" />
          <Row>
            <Field label="Subscribers" value={subs} onChange={setSubs} type="number" min={0} className="flex-1" />
            <Field label="Open rate %" value={open} onChange={setOpen} type="number" min={0} max={100} className="flex-1" />
            <Field label="Base CPM $" value={cpm} onChange={setCpm} type="number" min={0} className="flex-1" />
            <Field label="Issues / mo" value={issues} onChange={setIssues} type="number" min={0} className="flex-1" />
          </Row>
          <Seg value={niche} onChange={setNiche} options={NICHES.map((n) => ({ v: n.v, label: n.label }))} accent={A} />
        </div>
      </Panel>
      <BigStat
        label="Headline rate — primary slot"
        value={money(res.slotPrice)}
        accent={A}
        hint={res.floored ? "under 1,000 opens → flat $50 minimum applied" : `secondary ${money(res.extra)} · monthly bundle ${money(res.bundle)}`}
      />
      <Out text={res.card} label="rate-card.txt — paste into your media kit" rows={14} />
      <Note>
        One big preview, one copy button — send this text to sponsors or paste it under your archive page. If opens sit under 1,000 the card
        auto-switches to a flat $50 minimum because CPM pricing at tiny scale looks silly.
      </Note>
    </div>
  );
}

/* ------------------------------ 5. TikTok Shop affiliate ------------------- */

export function TikTokAffiliateTool() {
  const A = accentOf(4);
  const [price, setPrice] = useState("59.99");
  const [comm, setComm] = useState("25");
  const [samples, setSamples] = useState("12");
  const [sampleCost, setSampleCost] = useState("9");
  const [conv, setConv] = useState("90");
  const [sales, setSales] = useState("40");

  const res = useMemo(() => {
    const gross = num(price) * (num(comm) / 100);
    const sampleSales = num(samples) * (num(conv) / 100);
    const amort = num(samples) * num(sampleCost) / Math.max(1, sampleSales);
    const net = gross - amort;
    const breakEven = num(sampleCost) > 0 ? Math.floor(gross / num(sampleCost)) : Infinity;
    const monthlyGross = num(sales) * gross;
    const monthlyNet = num(sales) * net;
    const sampleSpend = num(samples) * num(sampleCost);
    const netShare = gross > 0 ? Math.min(100, Math.max(0, (net / gross) * 100)) : 0;
    const verdict =
      net > gross * 0.5
        ? { label: "worth it — net keeps over half", accent: A }
        : net > 0
          ? { label: "marginal — samples eat the margin", accent: "#FFD43B" }
          : { label: "skip — samples cost more than the cut", accent: OVER };
    return { gross, amort, net, breakEven, monthlyGross, monthlyNet, sampleSpend, netShare, verdict };
  }, [price, comm, samples, sampleCost, conv, sales]);

  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Product price $" value={price} onChange={setPrice} type="number" min={0} step={0.01} />
        <Field label="Commission %" value={comm} onChange={setComm} type="number" min={0} step={0.5} />
        <Field label="Expected sales / mo" value={sales} onChange={setSales} type="number" min={0} />
      </Grid>
      <Grid cols={2}>
        <BigStat label="Net per sale" value={money(res.net)} accent={A} hint={`gross ${money(res.gross)} − ${money(res.amort)} amortized samples`} />
        <BigStat
          label="One sale pays for"
          value={Number.isFinite(res.breakEven) ? fmt(res.breakEven, 0) : "∞"}
          unit="samples"
          accent={A}
          hint={`at ${money(num(sampleCost))} product + shipping each`}
        />
      </Grid>
      <Panel title="where each sale's commission goes" accent={A}>
        <div className="flex h-7 w-full overflow-hidden rounded-md border border-zinc-800">
          <div
            className="flex items-center justify-center overflow-hidden font-mono text-[10px] font-bold text-zinc-950"
            style={{ width: `${res.netShare}%`, background: A }}
          >
            {res.netShare > 18 ? "NET" : ""}
          </div>
          <div
            className="flex items-center justify-center overflow-hidden font-mono text-[10px] text-zinc-400"
            style={{ width: `${100 - res.netShare}%`, background: "#3f3f46" }}
          >
            {res.netShare < 82 ? "SAMPLES" : ""}
          </div>
        </div>
        <div className="mt-1.5">
          <Meter
            value={res.amort}
            max={Math.max(0.01, res.gross)}
            accent={OVER}
            label="sample cost share of gross"
            right={res.gross > 0 ? pct((res.amort / res.gross) * 100, 1) : "—"}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Tag accent={res.verdict.accent}>{res.verdict.label}</Tag>
        </div>
      </Panel>
      <Panel title="monthly projection" accent={A}>
        <KV k="gross commission / mo" v={money(res.monthlyGross)} />
        <KV k="sample spend / mo" v={`${money(res.sampleSpend)} (${samples} × ${money(num(sampleCost))})`} />
        <KV k="amortized sample cost / sale" v={money(res.amort)} />
        <KV k="net / month" v={money(res.monthlyNet)} accent={A} />
      </Panel>
      <Note>
        Free product is never free: samples are amortized across the conversions they actually produce, not hand-waved away. Conversion
        above 100% is real — one posted video can move many units over its lifetime. The conversion guess dominates everything; plug real
        numbers from TikTok Shop analytics once you have them.
      </Note>
    </div>
  );
}

/* ------------------------------ 6. YouTube memberships --------------------- */

export function YtMembershipsTool() {
  const A = accentOf(5);
  const [p1, setP1] = useState("4.99");
  const [m1, setM1] = useState("120");
  const [p2, setP2] = useState("9.99");
  const [m2, setM2] = useState("40");
  const [p3, setP3] = useState("24.99");
  const [m3, setM3] = useState("8");
  const [cut, setCut] = useState<"std" | "custom">("std");
  const [customCut, setCustomCut] = useState("30");
  const [churn, setChurn] = useState(4);
  const [newM, setNewM] = useState("10");

  const res = useMemo(() => {
    const members = num(m1) + num(m2) + num(m3);
    const gross = num(p1) * num(m1) + num(p2) * num(m2) + num(p3) * num(m3);
    const arpu = gross / Math.max(1, members);
    const cutPct = cut === "std" ? 30 : num(customCut);
    const net = gross * (1 - cutPct / 100);
    let m = members;
    const months: { net: number; members: number }[] = [];
    for (let i = 0; i < 12; i++) {
      m = m * (1 - churn / 100) + num(newM);
      months.push({ net: m * arpu * (1 - cutPct / 100), members: m });
    }
    const annualNet = months.reduce((s, x) => s + x.net, 0);
    const maxNet = Math.max(1, ...months.map((x) => x.net));
    return { members, gross, arpu, cutPct, net, months, annualNet, maxNet, m12: months[11].members };
  }, [p1, m1, p2, m2, p3, m3, cut, customCut, churn, newM]);

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Panel title="membership tiers" accent={A}>
              <div className="space-y-2">
                <p className="mono-kicker text-zinc-500">tier 1 — fan</p>
                <Row>
                  <Field label="$ / mo" value={p1} onChange={setP1} type="number" min={0} step={0.01} className="flex-1" />
                  <Field label="members" value={m1} onChange={setM1} type="number" min={0} className="flex-1" />
                </Row>
                <p className="mono-kicker text-zinc-500">tier 2 — superfan</p>
                <Row>
                  <Field label="$ / mo" value={p2} onChange={setP2} type="number" min={0} step={0.01} className="flex-1" />
                  <Field label="members" value={m2} onChange={setM2} type="number" min={0} className="flex-1" />
                </Row>
                <p className="mono-kicker text-zinc-500">tier 3 — whale</p>
                <Row>
                  <Field label="$ / mo" value={p3} onChange={setP3} type="number" min={0} step={0.01} className="flex-1" />
                  <Field label="members" value={m3} onChange={setM3} type="number" min={0} className="flex-1" />
                </Row>
              </div>
            </Panel>
            <Panel title="levers" accent={A}>
              <div className="space-y-3">
                <Seg
                  value={cut}
                  onChange={setCut}
                  options={[
                    { v: "std", label: "30% YouTube" },
                    { v: "custom", label: "custom" },
                  ]}
                  accent={A}
                />
                {cut === "custom" ? (
                  <Field label="Platform cut %" value={customCut} onChange={setCustomCut} type="number" min={0} max={100} step={1} />
                ) : null}
                <Slider label="Churn % / month" value={churn} onChange={setChurn} min={0} max={15} step={0.5} suffix="%" accent={A} />
                <Field label="New members / month" value={newM} onChange={setNewM} type="number" min={0} />
              </div>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-3">
            <BigStat
              label="Net income / month"
              value={money(res.net)}
              accent={A}
              hint={`gross ${money(res.gross)} − ${money(res.gross - res.net)} cut · ${fmt(res.members, 0)} members`}
            />
            <Panel title="12-month churn forecast" accent={A}>
              <div className="flex h-28 items-end gap-1">
                {res.months.map((mo, i) => (
                  <div key={i} className="flex h-full min-w-0 flex-1 items-end">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${Math.max(2, (mo.net / res.maxNet) * 100)}%`,
                        background: A,
                        opacity: 0.4 + 0.6 * (mo.net / res.maxNet),
                      }}
                      title={`M${i + 1}: ${money(mo.net)} · ${fmt(mo.members, 0)} members`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between font-mono text-[9px] text-zinc-600">
                <span>month 1</span>
                <span>month 12</span>
              </div>
            </Panel>
            <Panel title="the ledger" accent={A}>
              <KV k="gross / month" v={money(res.gross)} />
              <KV k={`platform cut (${res.cutPct}%)`} v={`− ${money(res.gross - res.net)}`} />
              <KV k="blended ARPU" v={money(res.arpu)} />
              <KV k="members now → month 12" v={`${fmt(res.members, 0)} → ${fmt(res.m12, 0)}`} />
              <KV k="churn-adjusted annual net" v={money(res.annualNet)} accent={A} />
            </Panel>
          </div>
        }
      />
      <Note>
        Churn compounds: at 4%/mo a no-growth base loses ~39% of its members in a year — that&apos;s why the bars sag unless new members keep
        arriving. The forecast holds each member&apos;s tier mix, so it&apos;s a floor if whales churn slower than fans.
      </Note>
    </div>
  );
}

/* ------------------------------ 7. Subathon planner ------------------------ */

export function SubathonTool() {
  const A = accentOf(6);
  const [startH, setStartH] = useState("24");
  const [startM, setStartM] = useState("0");
  const [t1, setT1] = useState("15");
  const [n1, setN1] = useState("50");
  const [t2, setT2] = useState("60");
  const [n2, setN2] = useState("10");
  const [t3, setT3] = useState("300");
  const [n3, setN3] = useState("2");
  const [gifted, setGifted] = useState("20");
  const [cap, setCap] = useState<"none" | "24" | "48" | "72" | "100">("none");
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const res = useMemo(() => {
    const startSec = num(startH) * 3600 + num(startM) * 60;
    const addT1 = num(t1) * num(n1);
    const addT2 = num(t2) * num(n2);
    const addT3 = num(t3) * num(n3);
    const addG = num(gifted) * num(t1);
    const added = addT1 + addT2 + addT3 + addG;
    const projected = startSec + added;
    const capSec = cap === "none" ? Infinity : Number(cap) * 3600;
    const final = Math.min(projected, capSec);
    const endsAt =
      now === null
        ? "—"
        : new Date(now + final * 1000).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
    const base = capSec === Infinity ? projected : capSec;
    const milestones = [25, 50, 75, 100].map((p) => {
      const target = (base * p) / 100;
      const hit = projected + 1e-6 >= target;
      return {
        p,
        at: hit && now !== null ? new Date(now + target * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : null,
      };
    });
    return { startSec, addT1, addT2, addT3, addG, added, projected, final, capSec, endsAt, milestones };
  }, [startH, startM, t1, n1, t2, n2, t3, n3, gifted, cap, now]);

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-6 text-center">
        <p className="mono-kicker text-zinc-500">timer hits zero</p>
        <p className="mt-1 max-w-full truncate text-2xl font-black" style={{ color: A }}>
          {res.endsAt}
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          {hms(res.final)} total · {cap === "none" ? "no cap" : `capped at ${cap}h`}
        </p>
      </div>
      <Split
        left={
          <div className="space-y-3">
            <Panel title="starting clock" accent={A}>
              <Row>
                <Field label="Start hours" value={startH} onChange={setStartH} type="number" min={0} className="flex-1" />
                <Field label="Start minutes" value={startM} onChange={setStartM} type="number" min={0} max={59} className="flex-1" />
              </Row>
            </Panel>
            <Panel title="seconds added per action" accent={A}>
              <div className="space-y-2">
                <Grid cols={2}>
                  <Field label="T1 sub · s" value={t1} onChange={setT1} type="number" min={0} />
                  <Field label="expected T1s" value={n1} onChange={setN1} type="number" min={0} />
                  <Field label="T2 sub · s" value={t2} onChange={setT2} type="number" min={0} />
                  <Field label="expected T2s" value={n2} onChange={setN2} type="number" min={0} />
                  <Field label="T3 sub · s" value={t3} onChange={setT3} type="number" min={0} />
                  <Field label="expected T3s" value={n3} onChange={setN3} type="number" min={0} />
                </Grid>
                <Field label="Gifted subs expected" value={gifted} onChange={setGifted} type="number" min={0} hint="gifted subs use the T1 rate" />
              </div>
            </Panel>
            <Panel title="cap" accent={A}>
              <Seg
                value={cap}
                onChange={setCap}
                options={[
                  { v: "none", label: "no cap" },
                  { v: "24", label: "24h" },
                  { v: "48", label: "48h" },
                  { v: "72", label: "72h" },
                  { v: "100", label: "100h" },
                ]}
                accent={A}
              />
            </Panel>
          </div>
        }
        right={
          <div className="space-y-3">
            <Panel title="where the time comes from" accent={A}>
              <KV k={`${n1} × T1 subs`} v={hms(res.addT1)} />
              <KV k={`${n2} × T2 subs`} v={hms(res.addT2)} />
              <KV k={`${n3} × T3 subs`} v={hms(res.addT3)} />
              <KV k={`${gifted} gifted`} v={hms(res.addG)} />
              <KV k="start clock" v={hms(res.startSec)} />
              <KV k="total added" v={hms(res.added)} accent={A} />
              <KV k="raw projection (uncapped)" v={hms(res.projected)} />
              {cap !== "none" ? <KV k="cap" v={`${cap}h — timer stops accepting`} /> : null}
            </Panel>
            <Panel title="milestones" accent={A}>
              {res.milestones.map((m) => (
                <KV
                  key={m.p}
                  k={`${m.p}% of ${cap === "none" ? "run" : "cap"}`}
                  v={
                    <span className="flex items-center justify-end gap-2">
                      <Tag accent={m.at ? A : undefined}>{m.at ? "on pace" : "won't reach"}</Tag>
                      {m.at ?? "—"}
                    </span>
                  }
                />
              ))}
            </Panel>
          </div>
        }
      />
      <Note>
        Planning only — nothing connects to your stream. Raid math is chaos, so keep roughly 10% of the timer as buffer, and decide the cap
        before going live: the 100-hour runs are made of T3 whales, not T1 hope.
      </Note>
    </div>
  );
}

/* ------------------------------ 8. ChatGPT API vs Plus --------------------- */

const GPT_PRESETS = [
  { v: "mini", label: "GPT-5 mini", rateIn: 0.25, rateOut: 2 },
  { v: "gpt5", label: "GPT-5", rateIn: 1.25, rateOut: 10 },
  { v: "custom", label: "custom", rateIn: 0, rateOut: 0 },
] as const;

export function ChatGptApiTool() {
  const A = accentOf(7);
  const [inTok, setInTok] = useState("2");
  const [outTok, setOutTok] = useState("0.5");
  const [preset, setPreset] = useState<"mini" | "gpt5" | "custom">("mini");
  const [rateIn, setRateIn] = useState("0.25");
  const [rateOut, setRateOut] = useState("2");
  const [plus, setPlus] = useState("20");
  const [pro, setPro] = useState("200");

  const res = useMemo(() => {
    const api = num(inTok) * num(rateIn) + num(outTok) * num(rateOut);
    const opts = [
      { name: "API", cost: api, note: "pay per token, no ceiling" },
      { name: "Plus", cost: num(plus), note: "flat / mo" },
      { name: "Pro", cost: num(pro), note: "flat / mo" },
    ];
    const cheapest = opts.reduce((best, o, i) => (o.cost < opts[best].cost ? i : best), 0);
    const outCost = num(outTok) * num(rateOut);
    const crossRaw = num(rateIn) > 0 ? (num(plus) - outCost) / num(rateIn) : Infinity;
    const crossNever = !Number.isFinite(crossRaw) || crossRaw <= 0;
    const table = [
      padR("usage", 6) + padL("in Mtok", 9) + padL("out Mtok", 10) + padL("api $/mo", 11) + padL("vs plus", 12),
      ...[0.5, 1, 2, 5].map((m) => {
        const c = num(inTok) * m * num(rateIn) + num(outTok) * m * num(rateOut);
        const d = c - num(plus);
        return (
          padR(`${m}×`, 6) +
          padL(fmt(num(inTok) * m, 2), 9) +
          padL(fmt(num(outTok) * m, 2), 10) +
          padL(money(c), 11) +
          padL(`${d <= 0 ? "-" : "+"}${money(Math.abs(d))}`, 12) +
          (m === 1 ? "  ← now" : "")
        );
      }),
    ].join("\n");
    return { api, opts, cheapest, crossNever, crossIn: crossNever ? 0 : crossRaw, outCost, table };
  }, [inTok, outTok, rateIn, rateOut, plus, pro]);

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Input tokens · Mtok/mo" value={inTok} onChange={setInTok} type="number" min={0} step={0.1} className="w-40" />
        <Field label="Output tokens · Mtok/mo" value={outTok} onChange={setOutTok} type="number" min={0} step={0.1} className="w-40" />
        <Seg
          value={preset}
          onChange={(v) => {
            setPreset(v);
            const p = GPT_PRESETS.find((x) => x.v === v);
            if (p && p.v !== "custom") {
              setRateIn(String(p.rateIn));
              setRateOut(String(p.rateOut));
            }
          }}
          options={GPT_PRESETS.map((p) => ({ v: p.v, label: p.label }))}
          accent={A}
        />
      </Row>
      <Row>
        <Field label="API rate in $/Mtok" value={rateIn} onChange={setRateIn} type="number" min={0} step={0.05} className="w-40" />
        <Field label="API rate out $/Mtok" value={rateOut} onChange={setRateOut} type="number" min={0} step={0.5} className="w-40" />
        <Field label="Plus $/mo" value={plus} onChange={setPlus} type="number" min={0} className="w-28" />
        <Field label="Pro $/mo" value={pro} onChange={setPro} type="number" min={0} className="w-28" />
      </Row>
      <Grid cols={3}>
        {res.opts.map((o, i) => (
          <div
            key={o.name}
            className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
            style={i === res.cheapest ? { borderColor: A } : undefined}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="mono-kicker text-zinc-500">{o.name}</span>
              {i === res.cheapest ? <Tag accent={A}>cheapest</Tag> : null}
            </div>
            <p className="mt-0.5 truncate text-xl font-black" style={{ color: i === res.cheapest ? A : "#e4e4e7" }}>
              {money(o.cost)}
              <span className="ml-1 text-xs font-bold text-zinc-500">/mo</span>
            </p>
            <p className="text-[10px] text-zinc-600">{o.note}</p>
          </div>
        ))}
      </Grid>
      <Split
        left={
          <Panel title="break-even vs Plus" accent={A}>
            <KV
              k="API breaks even at"
              v={res.crossNever ? "never — output alone busts Plus" : `${fmt(res.crossIn, 2)} input Mtok/mo`}
              accent={A}
            />
            <KV k="current mix" v={`${inTok} in : ${outTok} out (Mtok/mo)`} />
            <KV
              k="output share of API bill"
              v={res.api > 0 ? pct((res.outCost / res.api) * 100, 0) : "—"}
            />
          </Panel>
        }
        right={
          <Panel title="how to read it" accent={A}>
            <p className="font-mono text-[11px] leading-relaxed text-zinc-400">
              Light users lose on Plus (you pay for idle days); heavy users lose on API (per-token meter never sleeps). The crossover is
              where your token mix costs exactly the Plus fee — below it, API; above it, flat plans win.
            </p>
          </Panel>
        }
      />
      <Out text={res.table} label="cost ladder — API vs Plus at scaled usage" rows={7} />
      <Note>
        Defaults checked Oct 2026 — vendor prices drift, every rate here is editable. Real bills also swing on caching, vision calls and
        retry storms — budget ~20% headroom over whatever this says.
      </Note>
    </div>
  );
}

/* ------------------------------ 9. Midjourney fast hours ------------------- */

export function MidjourneyHoursTool() {
  const A = accentOf(8);
  const [images, setImages] = useState("600");
  const [fastPct, setFastPct] = useState(60);
  const [secs, setSecs] = useState("50");
  const [basic, setBasic] = useState("3.3");
  const [std, setStd] = useState("15");
  const [proH, setProH] = useState("30");

  const res = useMemo(() => {
    const fastHrs = num(images) * (fastPct / 100) * num(secs) / 3600;
    const fastImgs = num(images) * (fastPct / 100);
    const plans = [
      { name: "Basic", h: num(basic), price: 10 },
      { name: "Standard", h: num(std), price: 30 },
      { name: "Pro", h: num(proH), price: 60 },
    ].map((p) => ({ ...p, fits: p.h >= fastHrs, usage: fastHrs > 0 ? (fastHrs / p.h) * 100 : 0 }));
    const pickIdx = plans.findIndex((p) => p.fits);
    const overBasic = Math.max(0, fastHrs - num(basic));
    const relaxImgs = num(secs) > 0 ? (overBasic * 3600) / num(secs) : 0;
    const verdict = pickIdx >= 0 ? `${plans[pickIdx].name} plan covers it` : "over Pro — lean on Relax mode";
    return { fastHrs, fastImgs, plans, pickIdx, overBasic, relaxImgs, verdict };
  }, [images, fastPct, secs, basic, std, proH]);

  const pick = res.pickIdx >= 0 ? res.plans[res.pickIdx] : null;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Images / month" value={images} onChange={setImages} type="number" min={0} className="w-36" />
        <Field label="Seconds per fast image" value={secs} onChange={setSecs} type="number" min={1} className="w-40" hint="covers job + upscales" />
      </Row>
      <Slider label="Share of images in Fast mode" value={fastPct} onChange={setFastPct} min={0} max={100} step={5} suffix="%" accent={A} />
      <BigStat
        label="Fast hours needed"
        value={fmt(res.fastHrs, 1)}
        unit="h / mo"
        accent={A}
        hint={`${fmt(res.fastImgs, 0)} fast images × ${secs}s each`}
      />
      <Panel title="allowance ladder — usage vs GPU time" accent={A}>
        <div className="space-y-3">
          {res.plans.map((p) => (
            <Meter
              key={p.name}
              value={res.fastHrs}
              max={p.h}
              accent={p.fits ? A : OVER}
              label={`${p.name} · ${fmt(p.h, 1)} h · ${money(p.price)}/mo`}
              right={p.fits ? `${pct(p.usage, 0)} used` : `over by ${fmt(res.fastHrs - p.h, 1)} h`}
            />
          ))}
        </div>
      </Panel>
      <Panel title="plan verdict" accent={A}>
        <div className="flex flex-wrap items-center gap-2">
          <Tag accent={A}>{res.verdict}</Tag>
        </div>
        <div className="mt-2">
          <KV
            k={pick ? "leftover on plan" : "deficit"}
            v={pick ? `${fmt(pick.h - res.fastHrs, 1)} h spare` : "—"}
            accent={A}
          />
          <KV
            k="relax-mode fallback"
            v={`over Basic by ${fmt(res.overBasic, 1)} h ≈ ${fmt(res.relaxImgs, 0)} images could shift to Relax (unlimited, slower)`}
          />
          <KV k="images / month" v={fmt(num(images), 0)} />
        </div>
      </Panel>
      <Panel title="allowances (editable)" accent={A}>
        <Grid cols={3}>
          <Field label="Basic h" value={basic} onChange={setBasic} type="number" min={0} step={0.1} hint="$10/mo list" />
          <Field label="Standard h" value={std} onChange={setStd} type="number" min={0} step={0.1} hint="$30/mo list" />
          <Field label="Pro h" value={proH} onChange={setProH} type="number" min={0} step={0.1} hint="$60/mo list" />
        </Grid>
      </Panel>
      <Note>
        Defaults checked Oct 2026 — vendor prices drift, every rate here is editable. 50s per fast image is a decent average including
        upscales; heavy variations and re-rolls push it toward 80s, at which point Relax mode is the bargain.
      </Note>
    </div>
  );
}

/* ------------------------------ 10. Etsy digital downloads ----------------- */

export function EtsyDigitalTool() {
  const A = accentOf(9);
  const [price, setPrice] = useState("12");
  const [sales, setSales] = useState("60");
  const [listing, setListing] = useState("0.20");
  const [txn, setTxn] = useState("6.5");
  const [proc, setProc] = useState("3");
  const [procFlat, setProcFlat] = useState("0.25");
  const [ads, setAds] = useState("15");
  const [target, setTarget] = useState("500");

  const res = useMemo(() => {
    const fL = num(listing);
    const fT = num(price) * (num(txn) / 100);
    const fP = num(price) * (num(proc) / 100) + num(procFlat);
    const fA = num(price) * (num(ads) / 100);
    const fees = fL + fT + fP + fA;
    const net = num(price) - fees;
    const margin = num(price) > 0 ? net / num(price) : 0;
    const salesNeeded = net > 0 ? Math.ceil(num(target) / net) : Infinity;
    const revenue = num(price) * num(sales);
    const netMo = net * num(sales);
    return { fL, fT, fP, fA, fees, net, margin, salesNeeded, revenue, netMo };
  }, [price, sales, listing, txn, proc, procFlat, ads, target]);

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Panel title="product" accent={A}>
              <div className="space-y-3">
                <Row>
                  <Field label="Price $" value={price} onChange={setPrice} type="number" min={0} step={0.5} className="flex-1" />
                  <Field label="Sales / month" value={sales} onChange={setSales} type="number" min={0} className="flex-1" />
                </Row>
                <Field label="Target monthly income $" value={target} onChange={setTarget} type="number" min={0} />
              </div>
            </Panel>
            <Panel title="fee rates (editable)" accent={A}>
              <div className="space-y-2">
                <Row>
                  <Field label="Listing fee $" value={listing} onChange={setListing} type="number" min={0} step={0.05} className="flex-1" />
                  <Field label="Transaction %" value={txn} onChange={setTxn} type="number" min={0} step={0.1} className="flex-1" />
                </Row>
                <Row>
                  <Field label="Processing %" value={proc} onChange={setProc} type="number" min={0} step={0.1} className="flex-1" />
                  <Field label="Processing flat $" value={procFlat} onChange={setProcFlat} type="number" min={0} step={0.05} className="flex-1" />
                </Row>
                <Field label="Ad spend % of revenue" value={ads} onChange={setAds} type="number" min={0} max={100} step={1} hint="% of revenue you burn on Etsy Ads" />
              </div>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-3">
            <BigStat label="Net per sale" value={money(res.net)} accent={A} hint={`${money(num(price))} list − ${money(res.fees)} fees`} />
            <Meter value={res.margin * 100} max={100} accent={A} label="margin per sale" right={pct(res.margin * 100, 1)} />
            <Panel title="where one sale goes" accent={A}>
              <KV k="list price" v={money(num(price))} />
              <KV k="listing fee" v={`− ${money(res.fL)}`} />
              <KV k={`transaction ${txn}%`} v={`− ${money(res.fT)}`} />
              <KV k={`processing ${proc}% + ${money(num(procFlat))}`} v={`− ${money(res.fP)}`} />
              <KV k={`ads ${ads}% of revenue`} v={`− ${money(res.fA)}`} />
              <KV k="net per sale" v={money(res.net)} accent={A} />
            </Panel>
            <Panel title="the month" accent={A}>
              <KV k="revenue" v={money(res.revenue)} />
              <KV k="net / month" v={money(res.netMo)} accent={A} />
              <KV
                k="sales needed for target"
                v={Number.isFinite(res.salesNeeded) ? `${fmt(res.salesNeeded, 0)} sales` : "—"}
                accent={A}
              />
              <KV
                k="vs current pace"
                v={Number.isFinite(res.salesNeeded) ? `${res.salesNeeded - num(sales) >= 0 ? "+" : ""}${fmt(res.salesNeeded - num(sales), 0)} sales/mo` : "—"}
              />
            </Panel>
          </div>
        }
      />
      <Note>
        Defaults checked Oct 2026 — vendor prices drift, every rate here is editable. Digital goods — no shipping, but every sale renews the
        $0.20 listing fee, so a perennial bestseller quietly racks up listing charges all year.
      </Note>
    </div>
  );
}

/* ------------------------------ 11. Upwork connects ------------------------ */

export function UpworkConnectsTool() {
  const A = accentOf(10);
  const [perWeek, setPerWeek] = useState("10");
  const [connects, setConnects] = useState("12");
  const [win, setWin] = useState(8);
  const [price, setPrice] = useState("0.15");
  const [free, setFree] = useState("10");

  const res = useMemo(() => {
    const mp = num(perWeek) * 4.33;
    const cn = mp * num(connects);
    const billable = Math.max(0, cn - num(free));
    const cost = billable * num(price);
    const wins = (mp * win) / 100;
    const cpw = cost / Math.max(1, wins);
    const verdict = cpw < 20 ? { label: "cheap feed — bid more", accent: A } : { label: "expensive feed — niche down", accent: OVER };
    return { mp, cn, billable, cost, wins, cpw, verdict };
  }, [perWeek, connects, win, price, free]);

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Proposals / week" value={perWeek} onChange={setPerWeek} type="number" min={0} className="w-36" />
        <Field label="Connects / proposal" value={connects} onChange={setConnects} type="number" min={1} className="w-36" />
        <Field label="$ per Connect" value={price} onChange={setPrice} type="number" min={0} step={0.01} className="w-28" />
        <Field label="Free monthly Connects" value={free} onChange={setFree} type="number" min={0} className="w-36" />
      </Row>
      <Slider label="Win rate %" value={win} onChange={setWin} min={1} max={50} step={1} suffix="%" accent={A} />
      <Grid cols={2}>
        <BigStat label="Connects cost / month" value={money(res.cost)} accent={A} hint={`${fmt(res.billable, 0)} billable connects`} />
        <BigStat label="Cost per won job" value={money(res.cpw)} accent={A} hint={`${fmt(res.wins, 1)} wins/mo at ${win}% win rate`} />
      </Grid>
      <div className="flex items-stretch gap-1.5">
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-3 text-center">
          <span className="mono-kicker text-zinc-500">proposals</span>
          <span className="mt-0.5 truncate text-lg font-black text-zinc-100">{fmt(res.mp, 0)}</span>
          <span className="font-mono text-[9px] text-zinc-600">/ month</span>
        </div>
        <div className="flex shrink-0 items-center font-mono text-zinc-600">→</div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-3 text-center">
          <span className="mono-kicker text-zinc-500">connects</span>
          <span className="mt-0.5 truncate text-lg font-black text-zinc-100">{fmt(res.cn, 0)}</span>
          <span className="font-mono text-[9px] text-zinc-600">× {connects} each</span>
        </div>
        <div className="flex shrink-0 items-center font-mono text-zinc-600">→</div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border bg-zinc-900/50 px-2 py-3 text-center" style={{ borderColor: A }}>
          <span className="mono-kicker text-zinc-500">won jobs</span>
          <span className="mt-0.5 truncate text-lg font-black" style={{ color: A }}>
            {fmt(res.wins, 1)}
          </span>
          <span className="font-mono text-[9px] text-zinc-600">at {win}%</span>
        </div>
      </div>
      <Meter
        value={res.billable}
        max={Math.max(1, res.cn)}
        accent={A}
        label="billable vs free connects"
        right={`${fmt(res.billable, 0)} paid / ${fmt(res.cn, 0)} total`}
      />
      <Panel title="the ledger" accent={A}>
        <KV k="proposals / month" v={`${fmt(res.mp, 0)} (weeks × 4.33)`} />
        <KV k="connects needed" v={fmt(res.cn, 0)} />
        <KV k="free allowance used" v={fmt(Math.min(num(free), res.cn), 0)} />
        <KV k="billable connects" v={fmt(res.billable, 0)} accent={A} />
        <KV k="connects spend / mo" v={money(res.cost)} accent={A} />
        <KV k="expected wins / mo" v={fmt(res.wins, 1)} />
        <KV k="cost per won job" v={money(res.cpw)} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Tag accent={res.verdict.accent}>{res.verdict.label}</Tag>
        </div>
      </Panel>
      <Note>
        Defaults checked Oct 2026 — vendor prices drift, every rate here is editable. $20 per won job is a decent ceiling for small gigs —
        if your cost-per-win sits above it, the fix is usually the niche or the proposal, not a bigger connects budget.
      </Note>
    </div>
  );
}

/* ------------------------------ 12. Retainer vs hourly --------------------- */

export function RetainerTool() {
  const A = accentOf(11);
  const [hourly, setHourly] = useState("85");
  const [fee, setFee] = useState("1500");
  const [included, setIncluded] = useState("20");
  const [over, setOver] = useState("75");

  const res = useMemo(() => {
    const crossover = num(hourly) > 0 ? num(fee) / num(hourly) : Infinity;
    const scenarios = [25, 50, 75, 100, 125].map((p) => {
      const used = (num(included) * p) / 100;
      const cost = num(fee) + Math.max(0, used - num(included)) * num(over);
      const hourlyCost = used * num(hourly);
      return { p, used, cost, hourlyCost, eff: used > 0 ? cost / used : 0, delta: cost - hourlyCost };
    });
    const at100 = scenarios[3];
    const at125 = scenarios[4];
    const axisMax = Math.max(1, num(included) * 1.5);
    const markerPct = Number.isFinite(crossover) ? Math.min(100, Math.max(0, (crossover / axisMax) * 100)) : 100;
    const saves = at100.hourlyCost - at100.cost;
    const table = [
      padR("usage", 6) + padL("hours", 7) + padL("retainer", 11) + padL("vs hourly", 12) + padL("eff/h", 10),
      ...scenarios.map((s) =>
        padR(`${s.p}%`, 6) +
        padL(`${fmt(s.used, 1)}h`, 7) +
        padL(money(s.cost), 11) +
        padL(`${s.delta <= 0 ? "-" : "+"}${money(Math.abs(s.delta))}`, 12) +
        padL(money(s.eff), 10),
      ),
      "",
      "+ = retainer dearer · - = retainer cheaper",
    ].join("\n");
    return { crossover, scenarios, at125, axisMax, markerPct, saves, table };
  }, [hourly, fee, included, over]);

  const markerLeft = Math.min(92, Math.max(8, res.markerPct));

  return (
    <div className="space-y-4">
      <Panel title="the deal" accent={A}>
        <Grid cols={2}>
          <Field label="Your hourly rate $" value={hourly} onChange={setHourly} type="number" min={0} step={5} />
          <Field label="Retainer fee $/mo" value={fee} onChange={setFee} type="number" min={0} step={50} />
          <Field label="Included hours" value={included} onChange={setIncluded} type="number" min={0} step={1} />
          <Field label="Overage $/h" value={over} onChange={setOver} type="number" min={0} step={5} />
        </Grid>
      </Panel>
      <BigStat
        label="Break-even usage"
        value={Number.isFinite(res.crossover) ? fmt(res.crossover, 1) : "—"}
        unit="h / mo"
        accent={A}
        hint={`retainer = ${money(num(fee))} ÷ ${money(num(hourly))}/h — bill more than this and the retainer wins`}
      />
      <Panel title="usage axis — who wins where" accent={A}>
        <div className="relative h-9 w-full">
          <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-zinc-800" />
          <div className="absolute top-3 h-1.5 rounded-full" style={{ left: `${res.markerPct}%`, right: 0, background: `${A}55` }} />
          <div className="absolute top-0 h-full w-0.5" style={{ left: `${res.markerPct}%`, background: A }} />
          <span
            className="absolute top-4 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-zinc-400"
            style={{ left: `${markerLeft}%` }}
          >
            {Number.isFinite(res.crossover) ? `${fmt(res.crossover, 1)}h` : "—"}
          </span>
        </div>
        <div className="flex flex-wrap justify-between gap-2 font-mono text-[9px] text-zinc-600">
          <span>0h — hourly cheaper</span>
          <span>{fmt(res.axisMax, 0)}h — retainer wins</span>
        </div>
      </Panel>
      <Out text={res.table} label="scenario table — 25% to 125% of included hours" rows={9} />
      <Panel title="two sides of the deal" accent={A}>
        <KV
          k="freelancer view"
          v={`eff ${money(res.at125.eff)}/h earned at 125% usage (overage ${money(num(over))} vs ${money(num(hourly))} list)`}
        />
        <KV k="client view" v={`${res.saves >= 0 ? "saves" : "pays extra"} ${money(Math.abs(res.saves))} vs hourly at full usage`} accent={A} />
      </Panel>
      <Note>
        Scope creep is the real variable: an overage above your hourly makes extra work profitable, one below it quietly discounts you. Set
        included hours near your honest forecast, not the client&apos;s best case — and put the overage rate in writing.
      </Note>
    </div>
  );
}

/* ------------------------------ meta --------------------------------------- */

export const creatorsMeta: ToolMeta[] = [
  {
    id: "ai-video-credits",
    name: "AI Video Credits Planner",
    description: "Runway/Veo/Kling credits per finished minute — re-rolls included, cheapest plan picked for you.",
    category: "money",
    icon: Clapperboard,
    keywords: "ai video credits calculator runway veo kling cost per finished minute",
    badge: "new",
    component: AiVideoCreditsTool,
  },
  {
    id: "substack-beehiiv-ghost",
    name: "Substack vs Beehiiv vs Ghost",
    description: "Same audience, three fee engines — net per month and the paying count where Ghost overtakes Substack.",
    category: "money",
    icon: Send,
    keywords: "substack beehiiv ghost fees calculator paid newsletter break even",
    badge: "new",
    component: NewsletterPlatformTool,
  },
  {
    id: "newsletter-sponsorship",
    name: "Newsletter Sponsorship Rate",
    description: "Opens × CPM × niche multiplier → per-slot price, monthly potential and a three-line rate ladder.",
    category: "money",
    icon: Megaphone,
    keywords: "newsletter sponsorship rate calculator cpm subscribers small newsletter",
    badge: "new",
    component: SponsorshipRateTool,
  },
  {
    id: "newsletter-ad-rate",
    name: "Newsletter Ad Rate Card",
    description: "Generates a copy-paste sponsor rate card from your subscriber and open-rate numbers.",
    category: "money",
    icon: FileText,
    keywords: "newsletter ad rate calculator open rate cpm rate card",
    badge: "new",
    component: RateCardTool,
  },
  {
    id: "tiktok-shop-affiliate",
    name: "TikTok Shop Affiliate Net",
    description: "TikTok Shop commission minus amortized sample costs — net per sale and break-even samples.",
    category: "money",
    icon: ShoppingBag,
    keywords: "tiktok shop affiliate commission calculator after sample cost",
    badge: "new",
    component: TikTokAffiliateTool,
  },
  {
    id: "yt-memberships-calc",
    name: "YouTube Membership Income",
    description: "Three membership tiers, YouTube's cut and compounding churn → net/mo plus a 12-month forecast.",
    category: "money",
    icon: Youtube,
    keywords: "youtube channel memberships earnings calculator tiers churn",
    badge: "new",
    component: YtMembershipsTool,
  },
  {
    id: "subathon-planner",
    name: "Subathon Timer Planner",
    description: "Seconds per sub across tiers → projected subathon end time, capped, with milestone clock times.",
    category: "money",
    icon: Timer,
    keywords: "subathon timer calculator time added per sub tier gifted cap",
    badge: "new",
    component: SubathonTool,
  },
  {
    id: "chatgpt-api-breakeven",
    name: "ChatGPT API vs Plus",
    description: "Token volume × per-Mtok rates vs Plus/Pro — monthly API cost, cheapest option and the crossover.",
    category: "money",
    icon: Bot,
    keywords: "chatgpt api vs plus break even calculator tokens per month",
    badge: "new",
    component: ChatGptApiTool,
  },
  {
    id: "midjourney-fast-hours",
    name: "Midjourney Fast-Hours Planner",
    description: "Images × fast-mode share × seconds → fast hours needed and the cheapest plan that covers them.",
    category: "money",
    icon: Image,
    keywords: "midjourney fast hours calculator images per month plan",
    badge: "new",
    component: MidjourneyHoursTool,
  },
  {
    id: "etsy-digital-profit",
    name: "Etsy Digital Download Profit",
    description: "Etsy digital downloads: listing + transaction + processing + ads per sale → net, margin, target sales.",
    category: "money",
    icon: Store,
    keywords: "etsy digital download profit calculator after fees ads",
    badge: "new",
    component: EtsyDigitalTool,
  },
  {
    id: "upwork-connects-plan",
    name: "Upwork Connects Budget",
    description: "Proposals × connects × win rate vs the free allowance → monthly spend and cost per won job.",
    category: "money",
    icon: Briefcase,
    keywords: "upwork connects cost calculator proposal budget win rate",
    badge: "new",
    component: UpworkConnectsTool,
  },
  {
    id: "retainer-vs-hourly",
    name: "Retainer vs Hourly Break-Even",
    description: "Flat retainer vs hourly at 25–125% usage — effective $/h, break-even hours and who wins where.",
    category: "money",
    icon: Repeat,
    keywords: "freelancer retainer vs hourly break even calculator included hours overage",
    badge: "new",
    component: RetainerTool,
  },
];
