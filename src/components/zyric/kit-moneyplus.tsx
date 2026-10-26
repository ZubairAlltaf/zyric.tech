"use client";

/* ==========================================================================
   KIT: MONEY+ — 9 more money machines. Membership break-evens, wash-club
   math, the full subscription audit, sinking-fund envelopes, delivery batch
   and route economics, sitter splits, shoe mileage and a whole-garage-sale
   pricer. One accent per tool, real math, everything on-device.
   Budgeting estimates only — not financial or medical advice.
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  Baby,
  CalendarDays,
  Car,
  Dumbbell,
  Footprints,
  ListChecks,
  PiggyBank,
  Receipt,
  Repeat,
  Route,
  Store,
  Tag as TagIcon,
  Truck,
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

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_OPTS: { v: string; label: string }[] = MONTHS.map((m, i) => ({ v: String(i), label: m }));

type SubCycle = "monthly" | "yearly";
type SubStatus = "used" | "idle" | "cancel";
type Cond = "new" | "likenew" | "used" | "worn";

const COND_MULT: Record<Cond, number> = { new: 0.7, likenew: 0.5, used: 0.3, worn: 0.15 };
const COND_OPTS: readonly { v: Cond; label: string }[] = [
  { v: "new", label: "new ×0.7" },
  { v: "likenew", label: "like-new ×0.5" },
  { v: "used", label: "used ×0.3" },
  { v: "worn", label: "worn ×0.15" },
];

/* --------------------------- 1. Membership worth-it ------------------------ */

export function MembershipWorthTool() {
  const A = accentOf(0);
  const [fee, setFee] = useState("45");
  const [join, setJoin] = useState("50");
  const [ppv, setPpv] = useState("12");
  const [pack, setPack] = useState("200");
  const [incl, setIncl] = useState("10");
  const [visits, setVisits] = useState("6");
  const [away, setAway] = useState("1");

  const res = useMemo(() => {
    const activeMonths = Math.min(12, Math.max(0, 12 - num(away)));
    const mAnnual = num(fee) * activeMonths + num(join);
    const visitsYr = Math.max(0, num(visits)) * activeMonths;
    const payg = visitsYr * num(ppv);
    const packs = Math.ceil(visitsYr / Math.max(1, num(incl)));
    const packAnnual = packs * num(pack);
    const opts = [
      {
        name: "MEMBERSHIP",
        per: mAnnual / Math.max(1, visitsYr),
        annual: mAnnual,
        accent: A,
        note: `${fmt(activeMonths, 0)} active mo + joining fee`,
      },
      {
        name: "PAY-PER-VISIT",
        per: num(ppv),
        annual: payg,
        accent: "#5EE39A",
        note: `${fmt(visitsYr, 0)} visits × ${money(num(ppv))}`,
      },
      {
        name: "CLASS PACKS",
        per: packAnnual / Math.max(1, visitsYr),
        annual: packAnnual,
        accent: "#7FC8FF",
        note: `${packs} pack${packs === 1 ? "" : "s"} of ${fmt(num(incl), 0)}`,
      },
    ];
    const best = opts.reduce((b, o, i) => (o.annual < opts[b].annual ? i : b), 0);
    const crossover = num(ppv) > 0 ? num(fee) / num(ppv) : Infinity;
    return { activeMonths, visitsYr, opts, best, crossover, mAnnual };
  }, [fee, join, ppv, pack, incl, visits, away]);

  const ledgerText =
    res.opts
      .map(
        (o, i) =>
          `${pad(o.name, 15)}${pad(money(o.per) + "/visit", 17)}${pad(money(o.annual) + "/yr", 16)}${
            i === res.best ? " ◀ best" : "       "
          }${o.note}`
      )
      .join("\n") +
    `\n\n${pad("CROSSOVER", 15)}membership beats pay-per-visit from ${
      Number.isFinite(res.crossover) ? `${fmt(res.crossover, 1)} visits/mo` : "—"
    }` +
    `\n${pad("FROZEN TIME", 15)}${fmt(num(away), 0)} mo/yr away — you pay for ${fmt(res.activeMonths, 0)}`;

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="the deal" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Membership $/mo" value={fee} onChange={setFee} type="number" className="min-w-0 flex-1" />
                <Field label="Joining fee $" value={join} onChange={setJoin} type="number" className="w-24" />
              </Row>
              <Row>
                <Field label="Pay-per-visit $" value={ppv} onChange={setPpv} type="number" className="min-w-0 flex-1" />
                <Field label="Class pack $" value={pack} onChange={setPack} type="number" className="w-24" />
              </Row>
              <Row>
                <Field label="Visits included / pack" value={incl} onChange={setIncl} type="number" className="w-32" />
                <Field label="Realistic visits / mo" value={visits} onChange={setVisits} type="number" className="w-32" />
                <Field label="Months away / yr" value={away} onChange={setAway} type="number" className="w-28" />
              </Row>
            </div>
          </Panel>
        }
        right={
          <Panel title="the verdict" accent={A}>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <Tag accent={res.opts[res.best].accent}>best: {res.opts[res.best].name.toLowerCase()}</Tag>
                <Tag accent={A}>{money(res.opts[res.best].annual)}/yr</Tag>
              </div>
              <KV
                k="crossover"
                v={Number.isFinite(res.crossover) ? `${fmt(res.crossover, 1)}+ visits/mo` : "—"}
                accent={A}
              />
              <KV k="visits / yr" v={fmt(res.visitsYr, 0)} />
              <KV k="active months" v={`${fmt(res.activeMonths, 0)} of 12`} />
              <KV k="membership all-in" v={money(res.mAnnual)} accent={A} />
            </div>
          </Panel>
        }
      />
      <Grid cols={3}>
        {res.opts.map((o) => (
          <BigStat
            key={o.name}
            label={`${o.name.toLowerCase()} / visit`}
            value={money(o.per)}
            accent={o.accent}
            hint={`${money(o.annual)}/yr all-in`}
          />
        ))}
      </Grid>
      <Panel
        title="the annual ledger"
        accent={A}
        right={<Tag accent={res.opts[res.best].accent}>{res.opts[res.best].name.toLowerCase()} wins</Tag>}
      >
        <Out label="annual cost by option" text={ledgerText} rows={8} />
      </Panel>
      <Note>
        Be honest about the visits number — the monthly plan is only a bargain if you actually show up. The same engine
        works for coworking desks, pools, climbing walls and car washes.
      </Note>
    </div>
  );
}

/* --------------------------- 2. Car wash worth-it -------------------------- */

export function CarwashWorthTool() {
  const A = accentOf(1);
  const [plan, setPlan] = useState("30");
  const [single, setSingle] = useState("12");
  const [book, setBook] = useState("50");
  const [washes, setWashes] = useState(4);

  const res = useMemo(() => {
    const planM = Math.max(0, num(plan));
    const singleM = washes * num(single);
    const bookM = Math.ceil(washes / 5) * num(book);
    const crossover = num(single) > 0 ? planM / num(single) : Infinity;
    const opts = [
      { name: "unlimited plan", m: planM },
      { name: "single washes", m: singleM },
      { name: "book of 5", m: bookM },
    ];
    const best = opts.reduce((b, o, i) => (o.m < opts[b].m ? i : b), 0);
    return { planM, singleM, bookM, crossover, opts, best };
  }, [plan, single, book, washes]);

  const barMax = Math.max(2, washes, Number.isFinite(res.crossover) ? res.crossover * 2 : 0);

  return (
    <div className="space-y-4">
      <Panel title="how often does it actually get dirty?" accent={A}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="mono-kicker text-zinc-500">washes per month</p>
            <p className="font-brut text-4xl" style={{ color: A }}>
              {washes}
            </p>
          </div>
          <p className="font-mono text-[11px] text-zinc-500">
            ≈ one wash every {washes > 0 ? fmt(30 / washes, 1) : "∞"} days
          </p>
        </div>
        <div className="mt-3">
          <Slider label="drag your reality" value={washes} onChange={setWashes} min={0} max={20} suffix=" washes/mo" accent={A} />
        </div>
        <div className="mt-3 flex min-h-[14px] flex-wrap items-center gap-1.5">
          {Array.from({ length: Math.min(20, washes) }).map((_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: A }} />
          ))}
          {washes > 20 ? <span className="font-mono text-[10px] text-zinc-500">+{washes - 20}</span> : null}
          {washes === 0 ? <span className="font-mono text-[10px] text-zinc-600">a dust-covered car, apparently</span> : null}
        </div>
      </Panel>
      <Grid cols={3}>
        <BigStat
          label="unlimited plan / mo"
          value={money(res.planM)}
          accent={A}
          hint={res.best === 0 ? "◀ best at this slider" : `${money(res.planM * 12)}/yr`}
        />
        <BigStat
          label="single washes / mo"
          value={money(res.singleM)}
          accent={A}
          hint={res.best === 1 ? "◀ best at this slider" : `${money(res.singleM * 12)}/yr`}
        />
        <BigStat
          label="book of 5 / mo"
          value={money(res.bookM)}
          accent={A}
          hint={res.best === 2 ? "◀ best at this slider" : `${money(res.bookM * 12)}/yr`}
        />
      </Grid>
      <Panel title="the crossover" accent={A}>
        <div className="space-y-3">
          <div className="relative h-3 w-full rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (washes / barMax) * 100)}%`, background: A }}
            />
            {Number.isFinite(res.crossover) && res.crossover > 0 ? (
              <div
                className="absolute -top-1 h-5 border-l-2 border-dashed"
                style={{ left: `${Math.min(100, (res.crossover / barMax) * 100)}%`, borderColor: "#5EE39A" }}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag accent={A}>best now: {res.opts[res.best].name}</Tag>
            <Tag accent="#5EE39A">
              {Number.isFinite(res.crossover)
                ? `unlimited pays off at ${fmt(res.crossover, 1)}+ washes/mo`
                : "set a single-wash price"}
            </Tag>
          </div>
          <KV
            k="crossover point"
            v={Number.isFinite(res.crossover) ? `${fmt(res.crossover, 1)} washes/mo` : "—"}
            accent={A}
          />
          <KV k="annual at slider" v={`${money(res.opts[res.best].m * 12)}/yr (${res.opts[res.best].name})`} />
          <KV k="days between washes" v={washes > 0 ? `≈ ${fmt(30 / washes, 1)} days` : "—"} />
        </div>
      </Panel>
      <Note>
        Book math assumes you finish the book inside the month — most wash books expire before you do. Same engine as
        the gym calculator, just soapier.
      </Note>
    </div>
  );
}

/* --------------------------- 3. Subscription cost audit -------------------- */

const CYCLE_OPTS: readonly { v: SubCycle; label: string }[] = [
  { v: "monthly", label: "monthly" },
  { v: "yearly", label: "yearly" },
];
const STATUS_OPTS: readonly { v: SubStatus; label: string }[] = [
  { v: "used", label: "used" },
  { v: "idle", label: "shared-idle" },
  { v: "cancel", label: "cancel-candidate" },
];

type Sub = { name: string; price: string; cycle: SubCycle; month: number; users: string; status: SubStatus };

export function SubsCostAuditTool() {
  const A = accentOf(2);
  const [rows, setRows] = useState<Sub[]>([
    { name: "Netflix", price: "15.49", cycle: "monthly", month: 0, users: "4", status: "used" },
    { name: "Spotify", price: "11.99", cycle: "monthly", month: 2, users: "1", status: "cancel" },
    { name: "Domain", price: "15", cycle: "yearly", month: 7, users: "1", status: "used" },
    { name: "Cloud storage", price: "9.99", cycle: "monthly", month: 6, users: "2", status: "idle" },
  ]);
  const [household, setHousehold] = useState("2");
  const [now] = useState(() => new Date());

  const setRow = (i: number, patch: Partial<Sub>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const res = useMemo(() => {
    const monthlyEach = rows.map((r) => (r.cycle === "yearly" ? num(r.price) / 12 : num(r.price)));
    const monthlyTotal = monthlyEach.reduce((a, b) => a + b, 0);
    const annualTotal = rows.reduce((a, r, i) => a + monthlyEach[i] * 12, 0);
    const people = Math.max(1, num(household));
    const perPerson = monthlyTotal / people;
    const cal = rows
      .map((r, i) => ({ r, delta: ((((r.month - now.getMonth()) % 12) + 12) % 12) }))
      .sort((a, b) => a.delta - b.delta || num(b.r.price) - num(a.r.price))
      .slice(0, 3)
      .map(({ r, delta }) => {
        const d = new Date(now.getFullYear(), now.getMonth() + delta, 1);
        const when = d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
        return `${when}  ${pad(r.name || "untitled", 16)} ${money(num(r.price))}`;
      })
      .join("\n");
    const cancels = rows
      .map((r, i) => ({ name: r.name || "untitled", annual: monthlyEach[i] * 12, status: r.status }))
      .filter((c) => c.status === "cancel")
      .sort((a, b) => b.annual - a.annual)
      .slice(0, 3);
    const candMonthly = rows.reduce((a, r, i) => a + (r.status === "cancel" ? monthlyEach[i] : 0), 0);
    return { monthlyEach, monthlyTotal, annualTotal, perPerson, cal, cancels, candMonthly };
  }, [rows, household, now]);

  const cancelText = res.cancels.length
    ? res.cancels.map((c, i) => `${i + 1}. cancel ${pad(c.name, 16)} → save ${money(c.annual)}/yr`).join("\n")
    : "no cancel-candidates flagged — mark idle subs above to rank them.";

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <BigStat label="monthly bleed" value={money(res.monthlyTotal)} accent={A} hint="every active sub, normalised" />
        <BigStat label="annual bleed" value={money(res.annualTotal)} accent={A} hint="what leaves per year" />
      </Grid>
      <Panel title="household split" accent={A}>
        <Row>
          <Field label="People sharing" value={household} onChange={setHousehold} type="number" min={1} className="w-28" />
          <div className="min-w-0 flex-1">
            <KV k="per person / mo" v={money(res.perPerson)} accent={A} />
            <KV k="per person / yr" v={money(res.perPerson * 12)} />
          </div>
        </Row>
      </Panel>
      <Panel title="the ledger — 4 subscriptions" accent={A}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((r, i) => {
            const stripe = r.status === "cancel" ? "#FF5C5C" : r.status === "idle" ? "#FFD43B" : A;
            return (
              <div
                key={i}
                className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                style={{ borderLeft: `3px solid ${stripe}` }}
              >
                <Row>
                  <Field label="name" value={r.name} onChange={(v) => setRow(i, { name: v })} className="min-w-0 flex-1" />
                  <Field
                    label={r.cycle === "yearly" ? "price / yr" : "price / mo"}
                    value={r.price}
                    onChange={(v) => setRow(i, { price: v })}
                    type="number"
                    step={0.01}
                    className="w-24"
                  />
                  <Field
                    label="users"
                    value={r.users}
                    onChange={(v) => setRow(i, { users: v })}
                    type="number"
                    min={1}
                    className="w-16"
                  />
                </Row>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Seg value={r.cycle} onChange={(v) => setRow(i, { cycle: v })} options={CYCLE_OPTS} accent={A} />
                  <Seg value={r.status} onChange={(v) => setRow(i, { status: v })} options={STATUS_OPTS} accent={stripe} />
                </div>
                <div className="mt-2">
                  <p className="mono-kicker mb-1 block text-zinc-600">renewal month</p>
                  <Seg value={String(r.month)} onChange={(v) => setRow(i, { month: Number(v) })} options={MONTH_OPTS} accent={A} />
                </div>
                <p className="mt-2 font-mono text-[10px] text-zinc-500">
                  = {money(res.monthlyEach[i])}/mo · {money(res.monthlyEach[i] * 12)}/yr
                </p>
              </div>
            );
          })}
        </div>
      </Panel>
      <Split
        left={
          <Panel title="renewal radar — next 3" accent={A} right={<CalendarDays className="h-3.5 w-3.5 text-zinc-600" />}>
            <Out label="upcoming renewals" text={res.cal || "—"} rows={5} />
            <Note>Monthly plans renew every month — this radar marks the anchor month you set for each row.</Note>
          </Panel>
        }
        right={
          <Panel title="cancel first" accent={A}>
            <Out label="cancel ranking" text={cancelText} rows={4} />
            <div className="mt-3">
              <Meter
                value={res.candMonthly}
                max={Math.max(0.01, res.monthlyTotal)}
                accent="#FF5C5C"
                label="candidate share of the bleed"
                right={pct(res.monthlyTotal > 0 ? (res.candMonthly / res.monthlyTotal) * 100 : 0, 0)}
              />
            </div>
          </Panel>
        }
      />
      <Note>
        The simple auditor in the catalog counts the bleed; this one adds renewal dates, a per-person share and a
        ranked hit list. Kill the top candidate first — it funds the rest.
      </Note>
    </div>
  );
}

/* --------------------------- 4. Sinking fund planner ----------------------- */

type Bill = { name: string; amount: string; month: number; saved: string };

export function SinkingFundTool() {
  const A = accentOf(3);
  const [bills, setBills] = useState<Bill[]>([
    { name: "Car insurance", amount: "620", month: 4, saved: "200" },
    { name: "Holiday gifts", amount: "400", month: 11, saved: "60" },
    { name: "Car service", amount: "350", month: 8, saved: "0" },
  ]);
  const [start, setStart] = useState("300");

  const setBill = (i: number, patch: Partial<Bill>) =>
    setBills((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const res = useMemo(() => {
    const per = bills.map((b) => Math.max(0, num(b.amount) - num(b.saved)) / 12);
    const totalMonthly = per.reduce((a, b) => a + b, 0);
    const due = Array.from({ length: 12 }, () => 0);
    bills.forEach((b) => {
      const m = Math.min(11, Math.max(0, Math.round(b.month)));
      due[m] += num(b.amount);
    });
    let bal = num(start);
    const sim: { m: number; due: number; bal: number }[] = [];
    for (let m = 0; m < 12; m++) {
      bal += totalMonthly - due[m];
      sim.push({ m, due: due[m], bal });
    }
    const min = sim.reduce((a, s) => (s.bal < a.bal ? s : a), sim[0]);
    const shorts = sim.filter((s) => s.bal < -0.005);
    return {
      per,
      totalMonthly,
      sim,
      min,
      shorts,
      dueTotal: due.reduce((a, b) => a + b, 0),
      toSave: per.reduce((a, b) => a + b, 0) * 12,
    };
  }, [bills, start]);

  const table =
    "MON  DUE           BALANCE\n" +
    res.sim
      .map(
        (s) =>
          `${pad(MONTHS[s.m].toUpperCase(), 4)} ${pad(money(s.due), 13)} ${pad(money(s.bal), 13)}${
            s.bal < -0.005 ? "  ← short" : s.m === res.min.m ? "  ← lowest" : ""
          }`
      )
      .join("\n");

  return (
    <div className="space-y-4">
      <Panel title="the envelopes" accent={A} right={<Tag accent={A}>{bills.length} bills</Tag>}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bills.map((b, i) => (
            <div key={i} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <Field label="bill" value={b.name} onChange={(v) => setBill(i, { name: v })} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="annual $" value={b.amount} onChange={(v) => setBill(i, { amount: v })} type="number" />
                <Field label="already saved $" value={b.saved} onChange={(v) => setBill(i, { saved: v })} type="number" />
              </div>
              <div className="mt-2">
                <p className="mono-kicker mb-1 block text-zinc-600">due month</p>
                <Seg value={String(b.month)} onChange={(v) => setBill(i, { month: Number(v) })} options={MONTH_OPTS} accent={A} />
              </div>
              <div className="mt-2">
                <Meter
                  value={num(b.saved)}
                  max={Math.max(1, num(b.amount))}
                  accent={A}
                  label="envelope fill"
                  right={pct((num(b.saved) / Math.max(1, num(b.amount))) * 100, 0)}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] text-zinc-500">put aside {money(res.per[i])}/mo</p>
            </div>
          ))}
        </div>
      </Panel>
      <Row>
        <Field label="Starting balance $" value={start} onChange={setStart} type="number" className="w-32" />
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <Tag accent="#5EE39A">set aside {money(res.totalMonthly)}/mo total</Tag>
        </div>
      </Row>
      <Grid cols={2}>
        <BigStat label="set aside / month" value={money(res.totalMonthly)} accent={A} hint="all envelopes combined" />
        <BigStat
          label="lowest balance"
          value={money(res.min.bal)}
          accent={res.shorts.length ? "#FFD43B" : "#5EE39A"}
          hint={`lowest point · ${MONTHS[res.min.m]}`}
        />
      </Grid>
      <div className="flex flex-wrap items-center gap-2">
        {res.shorts.length ? (
          <Tag accent="#FFD43B">shortfall in {res.shorts.map((s) => MONTHS[s.m]).join(", ")}</Tag>
        ) : (
          <Tag accent="#5EE39A">fully funded — balance never dips negative</Tag>
        )}
        <Tag accent={A}>{money(res.dueTotal)} due this year</Tag>
        <Tag accent={A}>{money(res.toSave)} still to save</Tag>
      </div>
      <Panel title="month by month" accent={A}>
        <Out label="12-month simulation" text={table} rows={14} />
      </Panel>
      <Note>
        Each bill gets its own envelope — generic savers can&apos;t do due dates. The simulation drops the full bill
        amount in its month, so a thin starting balance shows up exactly when it would hurt.
      </Note>
    </div>
  );
}

/* --------------------------- 5. Spark batch pay check ---------------------- */

function Leader({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`shrink-0 ${strong ? "text-xs font-black text-zinc-100" : "text-[11px] text-zinc-500"}`}>{k}</span>
      <span className="min-w-0 flex-1 -translate-y-0.5 border-b border-dotted border-zinc-700" />
      <span className={`shrink-0 font-mono text-xs ${strong ? "font-black text-zinc-100" : "text-zinc-300"}`}>{v}</span>
    </div>
  );
}

export function SparkBatchPayTool() {
  const A = accentOf(4);
  const [total, setTotal] = useState("18.50");
  const [stops, setStops] = useState("2");
  const [miles, setMiles] = useState("11");
  const [wait, setWait] = useState("10");
  const [speed, setSpeed] = useState("25");
  const [minHr, setMinHr] = useState("18");

  const res = useMemo(() => {
    const driveMin = num(speed) > 0 ? (num(miles) / num(speed)) * 60 : 0;
    const totalMin = driveMin + Math.max(0, num(wait));
    const hr = totalMin > 0 ? num(total) / (totalMin / 60) : 0;
    const perMile = num(miles) > 0 ? num(total) / num(miles) : 0;
    const perStop = num(stops) > 0 ? num(total) / num(stops) : 0;
    const zone = hr >= num(minHr) + 2 ? 2 : hr >= num(minHr) ? 1 : 0;
    return { driveMin, totalMin, hr, perMile, perStop, zone, accept: zone >= 1 && num(total) > 0 };
  }, [total, stops, miles, wait, speed, minHr]);

  const zoneColor = res.zone === 2 ? "#5EE39A" : res.zone === 1 ? "#FFD43B" : "#FF5C5C";

  return (
    <div className="space-y-4">
      <Panel title="the offer on the table" accent={A}>
        <Grid cols={3}>
          <Field label="Batch total $" value={total} onChange={setTotal} type="number" step={0.01} />
          <Field label="Stops" value={stops} onChange={setStops} type="number" min={1} />
          <Field label="Miles (incl return)" value={miles} onChange={setMiles} type="number" step={0.1} />
        </Grid>
        <div className="mt-3">
          <Grid cols={3}>
            <Field label="Wait at store (min)" value={wait} onChange={setWait} type="number" min={0} />
            <Field label="Avg speed (mph)" value={speed} onChange={setSpeed} type="number" min={1} />
            <Field label="Your minimum $/hr" value={minHr} onChange={setMinHr} type="number" hint="your accept threshold" />
          </Grid>
        </div>
      </Panel>
      <Split
        left={
          <div className="space-y-3">
            <BigStat
              label="$ / hour (wait included)"
              value={money(res.hr)}
              accent={zoneColor}
              hint={`vs your ${money(num(minHr))}/hr floor`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Tag accent={zoneColor}>{res.accept ? "ACCEPT" : "DECLINE"}</Tag>
              <Tag accent={A}>{res.accept ? "beats your floor" : "under your floor"}</Tag>
            </div>
            <KV k="$ / mile" v={money(res.perMile)} accent={A} />
            <KV k="$ / stop" v={money(res.perStop)} />
            <KV
              k="time breakdown"
              v={`${fmt(res.driveMin, 0)}m drive · ${fmt(num(wait), 0)}m wait · ${fmt(res.totalMin, 0)}m total`}
            />
          </div>
        }
        right={
          <div className="space-y-3">
            <div className="mx-auto w-full max-w-[340px] rounded-lg border border-zinc-800 bg-zinc-950/80 font-mono">
              <div className="border-b border-dashed border-zinc-700 px-4 py-3 text-center">
                <Receipt className="mx-auto h-4 w-4" style={{ color: A }} />
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">batch ticket</p>
                <p className="text-[9px] text-zinc-600">zyric · per-hour reality check</p>
              </div>
              <div className="space-y-2 px-4 py-3">
                <Leader k="batch payout" v={money(num(total))} />
                <Leader k="stops" v={fmt(num(stops), 0)} />
                <Leader k="miles incl return" v={fmt(num(miles), 1)} />
                <Leader k="drive time" v={`${fmt(res.driveMin, 0)} min`} />
                <Leader k="wait at store" v={`${fmt(num(wait), 0)} min`} />
                <Leader k="time on task" v={`${fmt(res.totalMin, 0)} min`} />
              </div>
              <div className="border-t border-dashed border-zinc-700 px-4 py-3">
                <Leader k="$ / mile" v={money(res.perMile)} />
                <Leader k="$ / stop" v={money(res.perStop)} />
                <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-dashed border-zinc-700 pt-2">
                  <span className="text-xs font-black uppercase text-zinc-300">$ / hour</span>
                  <span className="text-xl font-black" style={{ color: zoneColor }}>
                    {money(res.hr)}
                  </span>
                </div>
                <div className="mt-3 text-center">
                  <span
                    className="inline-block -rotate-2 rounded border-2 px-3 py-1 text-sm font-black uppercase tracking-[0.2em]"
                    style={{ borderColor: zoneColor, color: zoneColor }}
                  >
                    {res.accept ? "accept" : "decline"}
                  </span>
                </div>
              </div>
            </div>
            <Meter
              value={Math.max(0, num(wait))}
              max={Math.max(1, res.totalMin)}
              accent={A}
              label="wait share of the batch"
              right={pct(res.totalMin > 0 ? (Math.max(0, num(wait)) / res.totalMin) * 100 : 0, 0)}
            />
          </div>
        }
      />
      <Note>
        Waiting is unpaid — the app doesn&apos;t count it, this ticket does. Judge the batch by its true hourly rate,
        not the headline payout.
      </Note>
    </div>
  );
}

/* --------------------------- 6. Multi-drop route cost ---------------------- */

export function MultidropRouteCostTool() {
  const A = accentOf(5);
  const [drops, setDrops] = useState("6");
  const [miles, setMiles] = useState("85");
  const [mpg, setMpg] = useState("28");
  const [fuel, setFuel] = useState("1.75");
  const [tolls, setTolls] = useState("3.50");
  const [vcost, setVcost] = useState("0.18");
  const [minCh, setMinCh] = useState("12");

  const res = useMemo(() => {
    const litres = num(mpg) > 0 ? (num(miles) / num(mpg)) * 3.785 : 0;
    const fuelCost = litres * num(fuel);
    const vehCost = num(miles) * num(vcost);
    const tollCost = num(tolls);
    const total = fuelCost + vehCost + tollCost;
    const perDrop = total / Math.max(1, num(drops));
    const shortfall = Math.max(0, perDrop - num(minCh));
    return {
      litres,
      fuelCost,
      vehCost,
      tollCost,
      total,
      perDrop,
      shortfall,
      covered: shortfall <= 0.005,
      revenue: num(drops) * num(minCh),
    };
  }, [drops, miles, mpg, fuel, tolls, vcost, minCh]);

  const segs = [
    { k: "fuel", v: res.fuelCost, c: A },
    { k: "vehicle wear", v: res.vehCost, c: "#7FC8FF" },
    { k: "tolls", v: res.tollCost, c: "#FFD43B" },
  ];

  return (
    <div className="space-y-4">
      <Panel title="the route sheet" accent={A}>
        <Grid cols={4}>
          <Field label="Drops" value={drops} onChange={setDrops} type="number" min={1} />
          <Field label="Route miles" value={miles} onChange={setMiles} type="number" step={0.1} />
          <Field label="MPG" value={mpg} onChange={setMpg} type="number" min={1} />
          <Field label="Fuel $/litre" value={fuel} onChange={setFuel} type="number" step={0.01} hint="US gal = 3.785 L" />
        </Grid>
        <div className="mt-3">
          <Grid cols={3}>
            <Field label="Tolls $" value={tolls} onChange={setTolls} type="number" step={0.01} />
            <Field
              label="Vehicle $/mile"
              value={vcost}
              onChange={setVcost}
              type="number"
              step={0.01}
              hint="tyres · service · depreciation"
            />
            <Field label="Your minimum charge $/drop" value={minCh} onChange={setMinCh} type="number" step={0.01} />
          </Grid>
        </div>
      </Panel>
      <Panel title="where the money goes" accent={A}>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          {segs.map((s) => (
            <div key={s.k} style={{ width: `${res.total > 0 ? (s.v / res.total) * 100 : 0}%`, background: s.c }} />
          ))}
        </div>
        <div className="mt-3 space-y-0.5">
          {segs.map((s) => (
            <KV
              key={s.k}
              k={s.k}
              v={
                <span className="flex items-center justify-end gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.c }} />
                  {money(s.v)} · {pct(res.total > 0 ? (s.v / res.total) * 100 : 0, 0)}
                </span>
              }
            />
          ))}
          <KV k="route total" v={money(res.total)} accent={A} />
        </div>
      </Panel>
      <Grid cols={2}>
        <BigStat label="cost per drop" value={money(res.perDrop)} accent={A} hint={`across ${fmt(num(drops), 0)} drops`} />
        <BigStat label="route total cost" value={money(res.total)} accent={A} hint={`${fmt(num(miles), 0)} mi · ${fmt(res.litres, 1)} L`} />
      </Grid>
      <Panel title="the charge question" accent={A}>
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <Tag accent={res.covered ? "#5EE39A" : "#FF5C5C"}>
            {res.covered
              ? `charge covers costs — margin ${money(res.revenue - res.total)}/route`
              : `shortfall ${money(res.shortfall)} per drop`}
          </Tag>
        </div>
        <KV k="break-even per drop" v={money(res.perDrop)} accent={A} />
        <KV k="revenue at min charge" v={money(res.revenue)} />
        <KV k="margin" v={money(res.revenue - res.total)} accent={res.covered ? "#5EE39A" : "#FF5C5C"} />
      </Panel>
      <Note>
        Manual miles = no maps API needed — works offline. Add ~10% to the odometer figure for depot detours and wrong
        turns.
      </Note>
    </div>
  );
}

/* --------------------------- 7. Babysitter cost split ---------------------- */

export function BabysitterSplitTool() {
  const A = accentOf(6);
  const [rate, setRate] = useState("18");
  const [sur, setSur] = useState("2");
  const [fee, setFee] = useState("10");
  const [mode, setMode] = useState<"family" | "child">("family");
  const [fams, setFams] = useState([
    { name: "Aldana house", kids: "2", hours: "3" },
    { name: "Baker house", kids: "1", hours: "2" },
    { name: "Chen house", kids: "3", hours: "4" },
  ]);

  const setFam = (i: number, patch: Partial<{ name: string; kids: string; hours: string }>) =>
    setFams((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  const res = useMemo(() => {
    const parsed = fams.map((f) => ({
      name: f.name,
      kids: Math.max(0, Math.round(num(f.kids))),
      hours: Math.max(0, num(f.hours)),
    }));
    const famCost = parsed.map((p) => num(rate) * p.hours + Math.max(0, p.kids - 1) * num(sur) * p.hours);
    const totalKids = parsed.reduce((a, p) => a + p.kids, 0);
    const feeShare = parsed.map((p) =>
      mode === "family" ? num(fee) / Math.max(1, parsed.length) : totalKids > 0 ? (num(fee) * p.kids) / totalKids : 0
    );
    const shares = famCost.map((c, i) => c + feeShare[i]);
    const grand = shares.reduce((a, b) => a + b, 0);
    const naive = grand / Math.max(1, parsed.length);
    return { parsed, feeShare, shares, grand, naive };
  }, [fams, rate, sur, fee, mode]);

  return (
    <div className="space-y-4">
      <Panel title="the sitting" accent={A}>
        <Row>
          <Field label="Hourly rate $" value={rate} onChange={setRate} type="number" step={0.5} className="w-28" />
          <Field label="Extra-child surcharge $/hr" value={sur} onChange={setSur} type="number" step={0.5} className="w-32" />
          <Field label="Travel / booking fee $" value={fee} onChange={setFee} type="number" step={0.5} className="w-28" />
        </Row>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mono-kicker text-zinc-500">shared fee split</span>
          <Seg
            value={mode}
            onChange={setMode}
            accent={A}
            options={[
              { v: "family" as const, label: "per family" },
              { v: "child" as const, label: "per child" },
            ]}
          />
        </div>
      </Panel>
      <Panel title="the families" accent={A}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {fams.map((f, i) => (
            <div key={i} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <Field label="family" value={f.name} onChange={(v) => setFam(i, { name: v })} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="children" value={f.kids} onChange={(v) => setFam(i, { kids: v })} type="number" min={0} />
                <Field label="hours used" value={f.hours} onChange={(v) => setFam(i, { hours: v })} type="number" step={0.5} min={0} />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {Array.from({ length: Math.min(6, Math.max(0, Math.round(num(f.kids)))) }).map((_, k) => (
                  <span key={k} className="h-2 w-2 rounded-full" style={{ background: A }} />
                ))}
                <span className="ml-auto font-mono text-[10px] text-zinc-500">{money(res.shares[i])}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Grid cols={3}>
        {res.parsed.map((p, i) => (
          <BigStat
            key={i}
            label={p.name || `family ${i + 1}`}
            value={money(res.shares[i])}
            accent={A}
            hint={`${p.kids} kid${p.kids === 1 ? "" : "s"} · ${fmt(p.hours, 1)} h · fee ${money(res.feeShare[i])}`}
          />
        ))}
      </Grid>
      <Panel title="vs the lazy even split" accent={A}>
        {res.parsed.map((p, i) => {
          const d = res.shares[i] - res.naive;
          return (
            <KV
              key={i}
              k={`${p.name || `family ${i + 1}`} — ${p.kids} kids · ${fmt(p.hours, 1)} h`}
              v={
                <span className="flex items-center justify-end gap-2">
                  <span>{money(res.shares[i])}</span>
                  <Tag accent={d <= 0 ? "#5EE39A" : "#FF8A7A"}>
                    {d <= 0 ? "−" : "+"}
                    {money(Math.abs(d))} vs even
                  </Tag>
                </span>
              }
            />
          );
        })}
        <div className="mt-2">
          <KV k="total pool (incl fee)" v={money(res.grand)} accent={A} />
          <KV k="naive even split each" v={money(res.naive)} />
        </div>
      </Panel>
      <Note>
        Families with more kids pay the surcharge — not the neighbors. The booking/travel fee splits evenly, or by
        headcount if you flip the switch above.
      </Note>
    </div>
  );
}

/* --------------------------- 8. Running shoe mileage ----------------------- */

export function ShoeMileageTool() {
  const A = accentOf(7);
  const [km, setKm] = useState("40");
  const [rot, setRot] = useState("2");
  const [life, setLife] = useState(700);
  const [price, setPrice] = useState("140");
  const [anchor] = useState(() => new Date());

  const res = useMemo(() => {
    const r = Math.max(1, Math.round(num(rot)));
    const perShoe = num(km) > 0 ? num(km) / r : 0;
    const weeks = perShoe > 0 ? life / perShoe : 0;
    const pairsYr = life > 0 ? (num(km) * 52) / life : 0;
    return { r, perShoe, weeks, pairsYr, costYr: pairsYr * num(price), perKm: life > 0 ? num(price) / life : 0 };
  }, [km, rot, life, price]);

  const dateAfter = (weeks: number) => new Date(anchor.getTime() + weeks * 7 * 86400000);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const schedule = Array.from(
    { length: 6 },
    (_, i) => `#${i + 1}  ${pad(`~ ${fmtDate(dateAfter(res.weeks * (i + 1)))}`, 26)}${i === 0 ? "◀ next replacement" : ""}`
  ).join("\n");

  return (
    <div className="space-y-4">
      <Panel title="read this first" accent="#FFD43B" className="border-[#FFD43B55]">
        <p className="text-xs font-semibold leading-relaxed text-[#FFD43B]">
          Estimate for budgeting only — midsoles die by hours and weight, not just km. Listen to your legs. Not medical
          advice.
        </p>
      </Panel>
      <Split
        left={
          <Panel title="your running life" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="Km per week (all shoes)" value={km} onChange={setKm} type="number" className="min-w-0 flex-1" />
                <Field label="Price per pair $" value={price} onChange={setPrice} type="number" className="w-28" />
              </Row>
              <div>
                <p className="mono-kicker mb-1.5 block text-zinc-500">shoes in rotation</p>
                <Seg
                  value={rot}
                  onChange={setRot}
                  accent={A}
                  options={[
                    { v: "1", label: "1 pair" },
                    { v: "2", label: "2 pairs" },
                    { v: "3", label: "3 pairs" },
                    { v: "4", label: "4 pairs" },
                  ]}
                />
              </div>
              <Slider label="lifespan per pair" value={life} onChange={setLife} min={400} max={900} step={50} suffix=" km" accent={A} />
              <Meter value={life} max={900} accent={A} label="lifespan window" right={`${life} km`} />
            </div>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Grid cols={2}>
              <BigStat
                label="next replacement"
                value={fmtDate(dateAfter(res.weeks))}
                accent={A}
                hint={`≈ ${fmt(res.weeks, 0)} weeks away`}
              />
              <BigStat label="shoe cost / year" value={money(res.costYr)} accent={A} hint={`${fmt(res.pairsYr, 1)} pairs`} />
            </Grid>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <KV k="pairs per year" v={fmt(res.pairsYr, 2)} accent={A} />
              <KV k="cycle length" v={`${fmt(res.weeks, 1)} wk ≈ ${fmt(res.weeks / 4.345, 1)} mo`} />
              <KV k="km per shoe per week" v={fmt(res.perShoe, 1)} />
              <KV k="cost per km" v={money(res.perKm)} accent={A} />
              <div className="mt-2 flex items-center gap-2 pt-1">
                {Array.from({ length: res.r }).map((_, i) => (
                  <Footprints key={i} className="h-4 w-4" style={{ color: A }} aria-hidden />
                ))}
                <span className="font-mono text-[10px] text-zinc-500">in rotation</span>
              </div>
            </div>
          </div>
        }
      />
      <Panel title="rotation schedule" accent={A} right={<Repeat className="h-3.5 w-3.5 text-zinc-600" />}>
        <Out label="next 6 replacement dates" text={schedule} rows={7} />
      </Panel>
      <Note>
        Rotation shares the km — {fmt(num(km), 0)} km/wk across {res.r} pair{res.r === 1 ? "" : "s"} means each pair
        takes {fmt(res.perShoe, 1)} km/week. All current pairs are assumed to start fresh together; replacements are
        staggered one cycle apart.
      </Note>
    </div>
  );
}

/* --------------------------- 9. Garage sale pricer ------------------------- */

export function GarageSalePricerTool() {
  const A = accentOf(8);
  const [rows, setRows] = useState([
    { name: "Clothes", count: "12", orig: "28", cond: "used" as Cond },
    { name: "Books", count: "18", orig: "14", cond: "likenew" as Cond },
    { name: "Electronics", count: "4", orig: "80", cond: "used" as Cond },
    { name: "Kitchen", count: "9", orig: "22", cond: "worn" as Cond },
  ]);
  const [sell, setSell] = useState(60);

  const setRow = (i: number, patch: Partial<{ name: string; count: string; orig: string; cond: Cond }>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const res = useMemo(() => {
    const sug = rows.map((r) => Math.round(num(r.orig) * COND_MULT[r.cond] * 2) / 2);
    const expected = rows.reduce((a, r, i) => a + num(r.count) * sug[i] * (sell / 100), 0);
    const donation = rows.reduce((a, r, i) => a + num(r.count) * sug[i] * (1 - sell / 100), 0);
    const unsold = rows.reduce((a, r) => a + num(r.count) * (1 - sell / 100), 0);
    const items = rows.reduce((a, r) => a + num(r.count), 0);
    return { sug, expected, donation, unsold, items };
  }, [rows, sell]);

  const listText =
    rows.map((r, i) => `${pad(r.name || "lot", 14)}: ${fmt(num(r.count), 0)} items @ $${res.sug[i].toFixed(2)}`).join("\n") +
    `\n\n${pad("EXPECTED TAKE", 14)}: ${money(res.expected)}` +
    `\n${pad("DONATION PILE", 14)}: ${money(res.donation)} (${fmt(res.unsold, 0)} items)`;

  return (
    <div className="space-y-4">
      <Panel title="the tag wall" accent={A} right={<TagIcon className="h-3.5 w-3.5 text-zinc-600" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((r, i) => (
            <div key={i} className="min-w-0 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-3">
              <div className="flex items-start gap-2">
                <span className="mt-6 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-zinc-600 bg-zinc-950" />
                <Field label="lot" value={r.name} onChange={(v) => setRow(i, { name: v })} className="min-w-0 flex-1" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="count" value={r.count} onChange={(v) => setRow(i, { count: v })} type="number" min={0} />
                <Field label="avg original $" value={r.orig} onChange={(v) => setRow(i, { orig: v })} type="number" min={0} />
              </div>
              <div className="mt-2">
                <p className="mono-kicker mb-1 block text-zinc-600">condition</p>
                <Seg value={r.cond} onChange={(v) => setRow(i, { cond: v })} options={COND_OPTS} accent={A} />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-dashed border-zinc-800 pt-2">
                <span className="mono-kicker text-zinc-500">ask</span>
                <span className="truncate text-xl font-black" style={{ color: A }}>
                  ${res.sug[i].toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Split
        left={
          <Panel title="sell-through" accent={A}>
            <Slider label="% of tags that actually sell" value={sell} onChange={setSell} min={0} max={100} suffix="%" accent={A} />
            <div className="mt-3">
              <Meter value={sell} max={100} accent={A} label="sell-through" right={pct(sell, 0)} />
            </div>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">
              first-timers: 50–60% is a strong day. Everything unsold goes to donation.
            </p>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <BigStat
              label="expected take"
              value={money(res.expected)}
              accent={A}
              hint={`at ${sell}% sell-through on ${fmt(res.items, 0)} items`}
            />
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2">
              <KV k="donation-pile value" v={money(res.donation)} accent={A} />
              <KV k="unsold items" v={fmt(res.unsold, 0)} />
              <KV k="avg per item sold" v={money(res.expected / Math.max(1, res.items))} />
            </div>
          </div>
        }
      />
      <Panel title="the tag sheet" accent={A}>
        <Out label="copy-ready price list" text={listText} rows={9} />
      </Panel>
      <Note>
        Bundle deals move clothes — 5 for $10 beats $2.50 each, and whatever&apos;s left becomes the charity receipt.
        Round everything to the nearest half dollar: nobody at a garage sale has exact change.
      </Note>
    </div>
  );
}

/* ------------------------------ META -------------------------------------- */

export const moneyPlusMeta: ToolMeta[] = [
  {
    id: "membership-worth-it",
    name: "Membership Worth-It",
    description:
      "Gym membership vs pay-per-visit vs class packs — true cost per visit, break-even visits and the honest annual bill.",
    category: "money",
    icon: Dumbbell,
    keywords: "gym membership worth it calculator visits per month break even",
    badge: "new",
    component: MembershipWorthTool,
  },
  {
    id: "carwash-worth-it",
    name: "Car Wash Worth-It",
    description:
      "Is the unlimited wash club worth it? Drag the washes-per-month slider and see exactly where the plan pays for itself.",
    category: "money",
    icon: Car,
    keywords: "car wash membership worth it calculator washes per month",
    badge: "new",
    component: CarwashWorthTool,
  },
  {
    id: "subs-cost-audit",
    name: "Subscription Cost Audit",
    description:
      "Full household subscription audit — monthly + annual bleed, per-person share, renewal radar and a ranked cancel-first list.",
    category: "money",
    icon: ListChecks,
    keywords: "how much do i spend on subscriptions calculator total monthly annual renewal cancel",
    badge: "new",
    component: SubsCostAuditTool,
  },
  {
    id: "sinking-fund-calc",
    name: "Sinking Fund Planner",
    description:
      "Split the year's lumpy bills into monthly envelopes, then simulate all 12 months to catch shortfalls before they bite.",
    category: "money",
    icon: PiggyBank,
    keywords: "sinking fund calculator annual bills monthly save multiple",
    badge: "new",
    component: SinkingFundTool,
  },
  {
    id: "spark-batch-pay",
    name: "Spark Batch Pay Check",
    description:
      "Should you take that Spark batch? Real $/hour with stops, miles and unpaid wait time weighed against your minimum.",
    category: "money",
    icon: Truck,
    keywords: "walmart spark batch pay per mile calculator accept decline",
    badge: "new",
    component: SparkBatchPayTool,
  },
  {
    id: "multidrop-route-cost",
    name: "Multi-Drop Route Cost",
    description:
      "True cost of a multi-drop route — fuel in litres, vehicle wear and tolls — broken down per drop against your minimum charge.",
    category: "money",
    icon: Route,
    keywords: "multi drop delivery route cost calculator fuel tolls per drop minimum charge",
    badge: "new",
    component: MultidropRouteCostTool,
  },
  {
    id: "babysitter-split",
    name: "Babysitter Cost Split",
    description:
      "Split one sitter across families fairly — hours, extra-kid surcharges and the shared booking fee, not a lazy even split.",
    category: "money",
    icon: Baby,
    keywords: "babysitter cost splitter families hours children surcharge",
    badge: "new",
    component: BabysitterSplitTool,
  },
  {
    id: "running-shoe-mileage",
    name: "Running Shoe Mileage",
    description:
      "When do the shoes die? Rotation math, staggered replacement dates and the true annual cost of your km per week.",
    category: "money",
    icon: Footprints,
    keywords: "running shoes replacement mileage calculator km per week rotation",
    badge: "new",
    component: ShoeMileageTool,
  },
  {
    id: "garage-sale-pricing",
    name: "Garage Sale Pricer",
    description:
      "Price a whole garage sale by category — condition multipliers, expected take, sell-through and the donation-pile receipt.",
    category: "money",
    icon: Store,
    keywords: "garage sale pricing calculator items profit donation leftover",
    badge: "new",
    component: GarageSalePricerTool,
  },
];
