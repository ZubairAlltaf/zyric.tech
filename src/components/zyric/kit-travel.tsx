"use client";

/* ==========================================================================
   KIT: TRAVEL — 4 trip-planning machines. Rail-pass windows, luggage loads,
   Interrail validity maps, road-trip splits. Every tool composes kit.tsx
   primitives around its own bespoke visual: day-chip strips, stacked load
   bars, mini month calendars, cost composition bars. Real math, fully
   offline, user-entered data only — no APIs.
   ========================================================================== */

import { useState, useMemo } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Car,
  Fuel,
  Hotel,
  Luggage,
  Map as MapIcon,
  Receipt,
  Route,
  Scale,
  Train,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
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

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const al = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${h}${al}`;
}

/* UTC day helpers (tool 3) — date math without timezone surprises. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayFloor(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function parseYMD(s: string): number | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const c = new Date(t);
  return c.getUTCMonth() === +m[2] - 1 && c.getUTCDate() === +m[3] ? t : null;
}

function parseMD(s: string): { mo: number; d: number } | null {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const mo = +m[1];
  const d = +m[2];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { mo, d };
}

function validUTC(y: number, mo: number, d: number): number | null {
  const t = Date.UTC(y, mo - 1, d);
  const c = new Date(t);
  return c.getUTCMonth() === mo - 1 && c.getUTCDate() === d ? t : null;
}

function addMonthsUTC(t: number, months: number): number {
  const d = new Date(t);
  const dom = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const dim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dom, dim));
  return d.getTime();
}

function fmtDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/* ========================================================================= */
/* 1. JR PASS WINDOW OPTIMISER — amber                                       */
/* ========================================================================= */

type JRLeg = { day: string; fare: string; label: string };
type JRPassKey = "7" | "14" | "21";

const JR_PASS_DEFAULT: Record<JRPassKey, number> = { "7": 50000, "14": 80000, "21": 100000 };

export function JrPassTool() {
  const A = accentOf(0);
  const [pass, setPass] = useState<JRPassKey>("7");
  const [passPrice, setPassPrice] = useState("50000");
  const [tripLenS, setTripLenS] = useState("10");
  const [legRows, setLegRows] = useState<JRLeg[]>([
    { day: "3", fare: "14170", label: "Tokyo → Kyoto" },
    { day: "5", fare: "11930", label: "Kyoto → Hiroshima" },
    { day: "6", fare: "10740", label: "Hiroshima → Osaka" },
    { day: "7", fare: "14400", label: "Osaka → Tokyo" },
    { day: "", fare: "", label: "" },
    { day: "", fare: "", label: "" },
  ]);

  const pickPass = (p: JRPassKey) => {
    setPass(p);
    setPassPrice(String(JR_PASS_DEFAULT[p]));
  };
  const updLeg = (i: number, patch: Partial<JRLeg>) =>
    setLegRows((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const calc = useMemo(() => {
    const tripLen = Math.max(1, Math.round(num(tripLenS)));
    const passLen = Number(pass);
    const price = num(passPrice);
    const legs = legRows
      .map((l, i) => ({
        i,
        day: Math.round(num(l.day)),
        fare: num(l.fare),
        label: l.label.trim() || `Leg ${i + 1}`,
      }))
      .filter((l) => l.day >= 1 && l.fare > 0);
    const maxStart = tripLen - passLen;
    let bestStart = -1;
    let bestCovered = 0;
    if (maxStart >= 1) {
      for (let s = 1; s <= maxStart; s++) {
        const end = s + passLen - 1;
        const covered = legs.reduce((sum, l) => (l.day >= s && l.day <= end ? sum + l.fare : sum), 0);
        // >= on ties: prefer the LATEST window that still covers the max —
        // activating later keeps your first trip days flexible.
        if (covered > 0 && covered >= bestCovered) {
          bestCovered = covered;
          bestStart = s;
        }
      }
    }
    const hasWindow = bestStart > 0;
    const bestEnd = hasWindow ? bestStart + passLen - 1 : 0;
    const outside = legs.filter((l) => !hasWindow || l.day < bestStart || l.day > bestEnd);
    const outsideTotal = outside.reduce((s, l) => s + l.fare, 0);
    const savings = bestCovered - price;
    return { tripLen, passLen, price, legs, hasWindow, bestStart, bestEnd, bestCovered, outside, outsideTotal, savings };
  }, [tripLenS, pass, passPrice, legRows]);

  const buy = calc.hasWindow && calc.savings > 0;
  const verdict = buy
    ? { label: "buy the pass", c: "#5EE39A" }
    : calc.hasWindow
      ? { label: "pay per leg", c: "#FFD43B" }
      : { label: "trip shorter than pass", c: "#a1a1aa" };

  const shown = Math.min(calc.tripLen, 60);
  const legByDay = new Map(calc.legs.map((l) => [l.day, l]));

  const flagLines: string[] = [];
  if (!calc.hasWindow) {
    flagLines.push(`trip (${calc.tripLen} days) is shorter than the ${calc.passLen}-day pass —`);
    flagLines.push("no activation window can cover any leg:");
  } else {
    flagLines.push(`outside the best window (days ${calc.bestStart}–${calc.bestEnd}):`);
  }
  for (const l of calc.outside) flagLines.push(`  ${l.label} · day ${l.day} · ${money(l.fare, "¥")}`);
  flagLines.push(
    calc.outside.length
      ? `pay separately: ${money(calc.outsideTotal, "¥")}`
      : "nothing to pay separately — every leg is covered",
  );

  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={pass}
          onChange={pickPass}
          accent={A}
          options={[
            { v: "7" as const, label: "7-day ¥50,000" },
            { v: "14" as const, label: "14-day ¥80,000" },
            { v: "21" as const, label: "21-day ¥100,000" },
          ]}
        />
        <Field label="Pass price (¥)" value={passPrice} onChange={setPassPrice} type="number" min={0} step={1000} className="w-32" />
        <Field label="Trip length (days)" value={tripLenS} onChange={setTripLenS} type="number" min={1} max={60} className="w-32" />
      </Row>

      <Panel
        title="TRIP MAP — BEST ACTIVATION WINDOW"
        accent={A}
        right={
          <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
            <Route className="h-3.5 w-3.5" aria-hidden /> {calc.legs.length} legs
          </span>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: shown }, (_, k) => {
            const d = k + 1;
            const inWin = calc.hasWindow && d >= calc.bestStart && d <= calc.bestEnd;
            const leg = legByDay.get(d);
            return (
              <div
                key={d}
                className="relative flex h-7 w-7 items-center justify-center rounded font-mono text-[10px] font-bold"
                style={{
                  background: inWin ? A : "#18181b",
                  color: inWin ? "#0a0a0a" : leg && !inWin ? "#FF7A3D" : "#71717a",
                  boxShadow: leg ? `inset 0 0 0 1.5px ${inWin ? "#0a0a0a55" : "#FF7A3D"}` : undefined,
                }}
              >
                {d}
              </div>
            );
          })}
          {calc.tripLen > shown ? (
            <span className="self-center font-mono text-[10px] text-zinc-600">+{calc.tripLen - shown} more days</span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ background: A }} /> pass window
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ boxShadow: `inset 0 0 0 1.5px ${A}` }} /> travel day (covered)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ boxShadow: "inset 0 0 0 1.5px #FF7A3D" }} /> leg outside window
          </span>
        </div>
        {calc.hasWindow ? (
          <Note>
            Activate the pass on <span style={{ color: A }}>day {calc.bestStart}</span> of your trip — it then runs through
            day {calc.bestEnd}.
          </Note>
        ) : (
          <Note>Shorten the trip or pick a shorter pass to open a valid window.</Note>
        )}
      </Panel>

      <Split
        left={
          <Panel title="LEGS — DAY + FARE" accent={A} right={<Wallet className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
            <div className="space-y-2.5">
              {legRows.map((l, i) => (
                <Row key={i} className="gap-2">
                  <Field label="Day" value={l.day} onChange={(v) => updLeg(i, { day: v })} type="number" min={1} max={60} placeholder="—" className="w-16" />
                  <Field label="Fare ¥" value={l.fare} onChange={(v) => updLeg(i, { fare: v })} type="number" min={0} step={100} placeholder="0" className="w-28" />
                  <Field label="Leg label" value={l.label} onChange={(v) => updLeg(i, { label: v })} placeholder="e.g. Tokyo → Kyoto" className="min-w-0 flex-1" />
                </Row>
              ))}
            </div>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Grid cols={2}>
              <BigStat
                label="Best window"
                value={calc.hasWindow ? `days ${calc.bestStart}–${calc.bestEnd}` : "—"}
                accent={A}
                hint={calc.hasWindow ? "activate on this day" : "no window fits"}
              />
              <BigStat
                label="Savings vs per-leg"
                value={money(calc.savings, "¥")}
                accent={calc.savings > 0 ? "#5EE39A" : "#a1a1aa"}
                hint={calc.savings > 0 ? "pass wins" : "per-leg wins"}
              />
            </Grid>
            <Panel title="MATH" accent={A} right={<Tag accent={verdict.c}>{verdict.label}</Tag>}>
              <KV k="covered by pass" v={money(calc.bestCovered, "¥")} accent={A} />
              <KV k="pass price" v={money(calc.price, "¥")} />
              <KV k="pay separately" v={money(calc.outsideTotal, "¥")} accent={calc.outsideTotal > 0 ? "#FF7A3D" : undefined} />
              <KV k="legs with fares" v={`${calc.legs.length} of 6 rows`} />
            </Panel>
            <Out text={flagLines.join("\n")} label="legs outside window" rows={6} />
          </div>
        }
      />

      <Note>
        Fares are examples — enter your real fares. Pass prices checked Oct 2026, editable. The pass covers unlimited
        travel on days s…s+{calc.passLen - 1}; every start day is brute-forced to find the cheapest window for you.
      </Note>
    </div>
  );
}

/* ========================================================================= */
/* 2. LUGGAGE WEIGHT SPLITTER — pink                                         */
/* ========================================================================= */

type LGTrav = { name: string; allow: string };
type LGBag = { label: string; kg: string };

export function LuggageWeightTool() {
  const A = accentOf(1);
  const [travs, setTravs] = useState<LGTrav[]>([
    { name: "Traveller 1", allow: "23" },
    { name: "Traveller 2", allow: "23" },
    { name: "Traveller 3", allow: "23" },
  ]);
  const [bags, setBags] = useState<LGBag[]>([
    { label: "Bag A", kg: "21" },
    { label: "Bag B", kg: "18" },
    { label: "Bag C", kg: "26" },
    { label: "Bag D", kg: "12" },
  ]);

  const updTrav = (i: number, patch: Partial<LGTrav>) =>
    setTravs((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const updBag = (i: number, patch: Partial<LGBag>) =>
    setBags((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const calc = useMemo(() => {
    const tr = travs.map((t, i) => ({ i, name: t.name.trim() || `Traveller ${i + 1}`, allow: Math.max(0, num(t.allow)) }));
    const bg = bags
      .map((b, i) => ({ i, label: b.label.trim() || `Bag ${String.fromCharCode(65 + i)}`, kg: Math.max(0, num(b.kg)) }))
      .filter((b) => b.kg > 0);
    const totalAllow = tr.reduce((s, t) => s + t.allow, 0);
    const totalBags = bg.reduce((s, b) => s + b.kg, 0);
    const over = totalBags - totalAllow;
    const ok = over <= 1e-9;

    const rem = tr.map((t) => t.allow);
    const assigned = tr.map(() => ({ kg: 0, parts: [] as { bagIdx: number; kg: number }[] }));
    const moves: string[] = [];
    const order = [...bg].sort((a, b) => b.kg - a.kg);

    if (ok) {
      // first-fit decreasing, strict: pour each bag into whoever has most room left
      for (const b of order) {
        let left = b.kg;
        const parts: { t: number; kg: number }[] = [];
        while (left > 1e-9) {
          let ti = -1;
          let best = 0;
          rem.forEach((r, i) => {
            if (r > best + 1e-9) {
              best = r;
              ti = i;
            }
          });
          if (ti < 0) break;
          const take = Math.min(left, rem[ti]);
          parts.push({ t: ti, kg: take });
          rem[ti] -= take;
          left -= take;
        }
        for (const p of parts) {
          assigned[p.t].kg += p.kg;
          assigned[p.t].parts.push({ bagIdx: b.i, kg: p.kg });
        }
        if (left > 1e-9) {
          moves.push(`${b.label} (${fmt(b.kg, 1)} kg) → no room — pool is full`);
        } else if (parts.length === 1) {
          moves.push(`${b.label} (${fmt(b.kg, 1)} kg) → ${tr[parts[0].t].name}`);
        } else {
          moves.push(
            `${b.label} (${fmt(b.kg, 1)} kg) → split ${parts.map((p) => `${fmt(p.kg, 1)} kg → ${tr[p.t].name}`).join(", ")}`,
          );
        }
      }
    } else {
      // pool over: fill travellers in order of remaining allowance, let them go over
      for (const b of order) {
        let ti = 0;
        rem.forEach((r, i) => {
          if (r > rem[ti]) ti = i;
        });
        assigned[ti].kg += b.kg;
        assigned[ti].parts.push({ bagIdx: b.i, kg: b.kg });
        rem[ti] -= b.kg;
        moves.push(`${b.label} (${fmt(b.kg, 1)} kg) → ${tr[ti].name}`);
      }
      moves.push(`pool is ${fmt(over, 1)} kg over — remove ${fmt(over, 1)} kg or pay for an extra bag`);
    }

    const rows = tr.map((t) => ({
      name: t.name,
      allow: t.allow,
      kg: assigned[t.i].kg,
      parts: assigned[t.i].parts,
      rem: rem[t.i],
      over: rem[t.i] < -1e-9 ? -rem[t.i] : 0,
      spare: Math.max(0, rem[t.i]),
    }));
    return { tr, totalAllow, totalBags, over, ok, rows, moves };
  }, [travs, bags]);

  const poolAccent = calc.ok ? "#5EE39A" : "#FFD43B";
  const scaleFor = (allow: number, kg: number) => 96 / Math.max(allow, kg, 1);

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="TRAVELLERS & ALLOWANCE" accent={A} right={<Users className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
            <div className="space-y-2.5">
              {travs.map((t, i) => (
                <Row key={i} className="gap-2">
                  <Field label="Name" value={t.name} onChange={(v) => updTrav(i, { name: v })} placeholder={`Traveller ${i + 1}`} className="min-w-0 flex-1" />
                  <Field label="Allowance kg" value={t.allow} onChange={(v) => updTrav(i, { allow: v })} type="number" min={0} step={1} className="w-24" />
                </Row>
              ))}
            </div>
          </Panel>
        }
        right={
          <Panel title="BAGS" accent={A} right={<Luggage className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
            <div className="space-y-2.5">
              {bags.map((b, i) => (
                <Row key={i} className="gap-2">
                  <Field label="Bag" value={b.label} onChange={(v) => updBag(i, { label: v })} placeholder={`Bag ${String.fromCharCode(65 + i)}`} className="min-w-0 flex-1" />
                  <Field label="Weight kg" value={b.kg} onChange={(v) => updBag(i, { kg: v })} type="number" min={0} step={0.5} className="w-24" />
                </Row>
              ))}
            </div>
          </Panel>
        }
      />

      <Grid cols={2}>
        <BigStat
          label="Pooled load"
          value={`${fmt(calc.totalBags, 1)} / ${fmt(calc.totalAllow, 1)}`}
          unit="kg"
          accent={poolAccent}
          hint={calc.ok ? "pooled allowance covers every bag" : `pool is ${fmt(calc.over, 1)} kg over`}
        />
        <BigStat
          label="Bags checked"
          value={bags.filter((b) => num(b.kg) > 0).length}
          accent={A}
          hint={`${fmt(calc.totalBags, 1)} kg to place across ${calc.tr.length} travellers`}
        />
      </Grid>

      <Panel title="LOAD BARS — WHO CARRIES WHAT" accent={A} right={<Scale className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
        <Grid cols={3}>
          {calc.rows.map((t) => {
            const sc = scaleFor(t.allow, t.kg);
            return (
              <div key={t.name} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400">{t.name}</span>
                  <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color: t.over > 0 ? "#FF7A3D" : A }}>
                    {fmt(t.kg, 1)}/{fmt(t.allow, 0)}kg
                  </span>
                </div>
                <div className="relative h-24 w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                  <div className="absolute inset-x-0 bottom-0 flex flex-col-reverse">
                    {t.parts.map((p, j) => (
                      <div
                        key={j}
                        className="w-full"
                        style={{ height: p.kg * sc, background: hexA(A, Math.max(0.3, 1 - p.bagIdx * 0.18)) }}
                      />
                    ))}
                  </div>
                  <div
                    className="absolute inset-x-0 border-t border-dashed"
                    style={{ bottom: Math.min(96, t.allow * sc), borderColor: t.over > 0 ? "#FF7A3D" : "#52525b" }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">
                  {t.over > 0 ? `${fmt(t.over, 1)} kg OVER allowance` : `${fmt(t.spare, 1)} kg spare`}
                </p>
              </div>
            );
          })}
        </Grid>
        <Note>
          Dashed line = each traveller&apos;s own allowance. One colour shade per bag; a bar split into shades means a bag
          was split across travellers.
        </Note>
      </Panel>

      <Split
        left={
          <Panel title="PER-TRAVELLER" accent={A}>
            {calc.rows.map((t) => (
              <KV
                key={t.name}
                k={t.name}
                v={
                  t.over > 0 ? (
                    <span style={{ color: "#FF7A3D" }}>{fmt(t.kg, 1)} kg · {fmt(t.over, 1)} over</span>
                  ) : (
                    <>
                      {fmt(t.kg, 1)} / {fmt(t.allow, 1)} kg · <span style={{ color: A }}>{fmt(t.spare, 1)} spare</span>
                    </>
                  )
                }
              />
            ))}
          </Panel>
        }
        right={<Out text={calc.moves.join("\n") || "add a bag"} label="move plan" rows={7} />}
      />

      <Note>
        <span className="text-amber-400">Airlines differ on sharing allowance — check yours;</span> low-cost carriers
        often price per bag, not per kilo. Bags are placed first-fit decreasing: heaviest bag to whoever has the most
        room left.
      </Note>
    </div>
  );
}

/* ========================================================================= */
/* 3. INTERRAIL TRAVEL-DAYS PLANNER — sky                                    */
/* ========================================================================= */

const IR_PASSES = {
  "4x1": { days: 4, months: 1 },
  "5x1": { days: 5, months: 1 },
  "6x1": { days: 6, months: 1 },
  "7x1": { days: 7, months: 1 },
  "8x1": { days: 8, months: 1 },
  "10x1": { days: 10, months: 1 },
  "15x1": { days: 15, months: 1 },
  "15x2": { days: 15, months: 2 },
  "22x2": { days: 22, months: 2 },
  "30x2": { days: 30, months: 2 },
} as const;
type IRPassKey = keyof typeof IR_PASSES;

export function InterrailDaysTool() {
  const A = accentOf(2);
  const [passKey, setPassKey] = useState<IRPassKey>("7x1");
  const [startS, setStartS] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateArea, setDateArea] = useState("05-02\n05-09\n05-16\n05-23\n05-30\n06-06");

  const calc = useMemo(() => {
    const pass = IR_PASSES[passKey];
    const nowYear = new Date().getUTCFullYear();
    let startT = parseYMD(startS);
    if (startT === null) {
      const md = parseMD(startS);
      if (md) startT = validUTC(nowYear, md.mo, md.d);
    }
    const startDay = startT !== null ? dayFloor(startT) : 0;
    const endDay = startT !== null ? dayFloor(addMonthsUTC(startT, pass.months)) : 0;

    const lines = dateArea.split("\n").map((s) => s.trim()).filter(Boolean);
    const bad: string[] = [];
    const days = new Set<number>();
    for (const line of lines) {
      let t = parseYMD(line);
      if (t === null) {
        const md = parseMD(line);
        if (md) {
          const y = startT !== null ? new Date(startT).getUTCFullYear() : nowYear;
          let cand = validUTC(y, md.mo, md.d);
          if (cand === null) {
            bad.push(line);
            continue;
          }
          if (startT !== null && cand < startDay) {
            const nxt = validUTC(y + 1, md.mo, md.d);
            if (nxt === null) {
              bad.push(line);
              continue;
            }
            cand = nxt;
          }
          t = cand;
        }
      }
      if (t === null) {
        bad.push(line);
        continue;
      }
      days.add(dayFloor(t));
    }
    const all = [...days].sort((a, b) => a - b);
    const inside = all.filter((t) => t >= startDay && t <= endDay);
    const outside = all.filter((t) => t < startDay || t > endDay);
    return { pass, startT, startDay, endDay, all, inside, outside, bad, used: inside.length };
  }, [passKey, startS, dateArea]);

  const remaining = calc.pass.days - calc.used;
  const startT = calc.startT;
  const verdict = calc.startT === null
    ? { label: "set a valid start date", c: "#a1a1aa" }
    : calc.outside.length > 0
      ? { label: "date outside validity", c: "#FF7A3D" }
      : calc.used > calc.pass.days
        ? { label: "over your travel days", c: "#FFD43B" }
        : calc.all.length === 0
          ? { label: "add travel dates", c: "#a1a1aa" }
          : { label: "fits your pass", c: "#5EE39A" };

  const listLines: string[] = [];
  calc.all.forEach((t, i) => {
    const d = new Date(t);
    const out = t < calc.startDay || t > calc.endDay;
    listLines.push(
      `${i + 1}. ${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}${out ? " — OUTSIDE validity" : ""}`,
    );
  });
  for (const b of calc.bad) listLines.push(`?  not understood: "${b}"`);
  if (calc.all.length === 0 && calc.bad.length === 0) listLines.push("enter planned travel dates, one per line");

  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={passKey}
          onChange={setPassKey}
          accent={A}
          options={[
            { v: "4x1" as const, label: "4d / 1mo" },
            { v: "5x1" as const, label: "5d / 1mo" },
            { v: "6x1" as const, label: "6d / 1mo" },
            { v: "7x1" as const, label: "7d / 1mo" },
            { v: "8x1" as const, label: "8d / 1mo" },
            { v: "10x1" as const, label: "10d / 1mo" },
            { v: "15x1" as const, label: "15d / 1mo" },
            { v: "15x2" as const, label: "15d / 2mo" },
            { v: "22x2" as const, label: "22d / 2mo" },
            { v: "30x2" as const, label: "30d / 2mo" },
          ]}
        />
        <Field
          label="Validity start (YYYY-MM-DD or MM-DD)"
          value={startS}
          onChange={setStartS}
          placeholder="2026-05-01"
          className="w-64"
        />
      </Row>

      <Panel title="VALIDITY MAP" accent={A} right={<MapIcon className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
        {startT === null ? (
          <Note>Enter a valid start date above (e.g. 2026-05-01 or 05-01) to draw the validity window.</Note>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: calc.pass.months }, (_, m) => {
              const s = new Date(startT);
              const y = s.getUTCFullYear() + Math.floor((s.getUTCMonth() + m) / 12);
              const mo = (s.getUTCMonth() + m) % 12;
              const dim = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
              return (
                <div key={m} className="min-w-0">
                  <p className="mono-kicker mb-1.5 text-zinc-500">
                    {MONTHS[mo]} {y} {m === 0 ? "· starts here" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: dim }, (_, k) => {
                      const t = Date.UTC(y, mo, k + 1);
                      const isTravel = calc.all.includes(t);
                      const inVal = t >= calc.startDay && t <= calc.endDay;
                      const isStart = t === calc.startDay;
                      return (
                        <div
                          key={k}
                          className="flex h-6 w-6 items-center justify-center rounded font-mono text-[9px] font-bold"
                          style={{
                            background: isTravel && inVal ? A : isTravel ? "transparent" : "#18181b",
                            color: isTravel && inVal ? "#0a0a0a" : isTravel ? "#FF7A3D" : inVal ? "#a1a1aa" : "#3f3f46",
                            boxShadow: isStart ? `0 0 0 1.5px ${isTravel && inVal ? "#0a0a0a" : A}` : isTravel && !inVal ? "inset 0 0 0 1.5px #FF7A3D" : undefined,
                            opacity: inVal ? 1 : 0.45,
                          }}
                        >
                          {k + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded" style={{ background: A }} /> travel day (uses the pass)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded" style={{ boxShadow: `inset 0 0 0 1.5px ${A}` }} /> validity start
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded" style={{ boxShadow: "inset 0 0 0 1.5px #FF7A3D" }} /> travel day outside validity
              </span>
            </div>
          </div>
        )}
      </Panel>

      <Split
        left={
          <div className="space-y-3">
            <Area
              label="PLANNED TRAVEL DATES — ONE PER LINE"
              value={dateArea}
              onChange={setDateArea}
              rows={7}
              placeholder={"05-02\n05-09\n2026-05-16"}
            />
            <Grid cols={2}>
              <BigStat label="Travel days used" value={calc.used} unit={`of ${calc.pass.days}`} accent={A} />
              <BigStat
                label="Days remaining"
                value={remaining}
                accent={remaining >= 0 ? "#5EE39A" : "#FFD43B"}
                hint={remaining < 0 ? "needs a bigger pass" : "spare days you can still spend"}
              />
            </Grid>
            <Meter value={Math.min(calc.used, calc.pass.days)} max={calc.pass.days} accent={A} label="pass usage" right={`${calc.used} / ${calc.pass.days} travel days`} />
          </div>
        }
        right={
          <div className="space-y-3">
            <Panel title="VERDICT" accent={A} right={<CalendarCheck className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
              <div className="mb-2">
                <Tag accent={verdict.c}>{verdict.label}</Tag>
              </div>
              <KV k="pass" v={`${calc.pass.days} days in ${calc.pass.months} month${calc.pass.months > 1 ? "s" : ""}`} accent={A} />
              <KV k="validity window" v={calc.startT !== null ? `${fmtDate(calc.startDay)} → ${fmtDate(calc.endDay)}` : "—"} />
              <KV k="distinct travel days" v={`${calc.all.length} entered · ${calc.used} inside`} />
              <KV k="outside validity" v={`${calc.outside.length} date${calc.outside.length === 1 ? "" : "s"}`} accent={calc.outside.length > 0 ? "#FF7A3D" : undefined} />
              <KV k="unparsed lines" v={`${calc.bad.length}`} accent={calc.bad.length > 0 ? "#FF7A3D" : undefined} />
            </Panel>
            <Out text={listLines.join("\n")} label="sorted travel days" rows={8} />
          </div>
        }
      />

      <Note>
        Planning tool for the pre-purchase decision — the Interrail app handles booking after you buy. Dates are
        day-granular: a “travel day” runs midnight to midnight, and MM-DD rolls to next year when it would fall before
        the start date.
      </Note>
    </div>
  );
}

/* ========================================================================= */
/* 4. ROAD TRIP COST SPLIT — mint                                            */
/* ========================================================================= */

export function RoadTripSplitTool() {
  const A = accentOf(3);
  const [carsS, setCarsS] = useState(1);
  const [kmS, setKmS] = useState("1200");
  const [burnS, setBurnS] = useState("8");
  const [fuelPS, setFuelPS] = useState("1.75");
  const [tollsS, setTollsS] = useState("40");
  const [nightsS, setNightsS] = useState("2");
  const [roomPS, setRoomPS] = useState("110");
  const [peopleS, setPeopleS] = useState(4);
  const [driversS, setDriversS] = useState(2);

  const c = useMemo(() => {
    const cars = Math.max(1, Math.round(carsS));
    const km = Math.max(0, num(kmS));
    const burn = Math.max(0, num(burnS));
    const fuelP = Math.max(0, num(fuelPS));
    const tolls = Math.max(0, num(tollsS));
    const nights = Math.max(0, num(nightsS));
    const roomP = Math.max(0, num(roomPS));
    const people = Math.max(1, Math.round(peopleS));
    const drivers = Math.min(people, Math.max(1, Math.round(driversS)));
    const liters = (cars * km * burn) / 100;
    const fuelTotal = liters * fuelP;
    const tollsTotal = tolls * cars;
    const rooms = Math.ceil(people / 2);
    const hotelTotal = rooms * nights * roomP;
    const total = fuelTotal + tollsTotal + hotelTotal;
    const perPerson = total / people;
    return {
      cars, km, burn, fuelP, tolls, nights, roomP, people, drivers,
      liters, fuelTotal, tollsTotal, rooms, hotelTotal, total, perPerson,
      perCar: cars > 1 ? total / cars : 0,
      kmPerDriver: km / drivers,
    };
  }, [carsS, kmS, burnS, fuelPS, tollsS, nightsS, roomPS, peopleS, driversS]);

  const mix = [
    { name: "Fuel", v: c.fuelTotal, icon: Fuel, a: 1 },
    { name: "Tolls", v: c.tollsTotal, icon: Receipt, a: 0.55 },
    { name: "Hotel", v: c.hotelTotal, icon: Hotel, a: 0.28 },
  ].filter((m) => m.v > 0);

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Panel title="ROUTE & CARS" accent={A} right={<Car className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
              <div className="space-y-3">
                <Slider label="Cars" value={carsS} onChange={setCarsS} min={1} max={4} accent={A} />
                <Row className="gap-2">
                  <Field label="Total km (all cars)" value={kmS} onChange={setKmS} type="number" min={0} step={50} className="min-w-0 flex-1" />
                  <Field label="Tolls per car ($)" value={tollsS} onChange={setTollsS} type="number" min={0} step={5} className="w-28" />
                </Row>
              </div>
            </Panel>
            <Panel title="FUEL" accent={A} right={<Fuel className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
              <Row className="gap-2">
                <Field label="Consumption (L/100km)" value={burnS} onChange={setBurnS} type="number" min={0} step={0.5} className="min-w-0 flex-1" />
                <Field label="Fuel price ($/L)" value={fuelPS} onChange={setFuelPS} type="number" min={0} step={0.05} className="w-28" />
              </Row>
            </Panel>
            <Panel title="STAY & CREW" accent={A} right={<Hotel className="h-3.5 w-3.5 text-zinc-600" aria-hidden />}>
              <div className="space-y-3">
                <Row className="gap-2">
                  <Field label="Hotel nights" value={nightsS} onChange={setNightsS} type="number" min={0} step={1} className="min-w-0 flex-1" />
                  <Field label="Price ($/room/night)" value={roomPS} onChange={setRoomPS} type="number" min={0} step={5} className="w-32" />
                </Row>
                <Slider label="People" value={peopleS} onChange={setPeopleS} min={1} max={9} accent={A} />
                <Slider label="Drivers" value={Math.min(driversS, peopleS)} onChange={setDriversS} min={1} max={peopleS} accent={A} />
                <KV k="rooms per night (auto)" v={`${c.rooms} = ceil(${c.people}/2)`} accent={A} />
              </div>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-3">
            <Grid cols={2}>
              <BigStat label="Trip total" value={money(c.total)} accent={A} hint={`${c.cars} car${c.cars > 1 ? "s" : ""} · ${fmt(c.km, 0)} km`} />
              <BigStat label="Per person" value={money(c.perPerson)} accent="#5EE39A" hint={`${c.people} people split evenly`} />
            </Grid>

            <Panel title="COST MIX" accent={A}>
              <div className="flex h-4 w-full min-w-0 overflow-hidden rounded-full bg-zinc-800">
                {mix.map((m) => (
                  <div
                    key={m.name}
                    style={{
                      width: `${Math.max(2, (m.v / Math.max(1, c.total)) * 100)}%`,
                      background: hexA(A, m.a),
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                {mix.map((m) => (
                  <div key={m.name} className="flex items-center gap-2 font-mono text-[11px]">
                    <m.icon className="h-3.5 w-3.5 shrink-0" style={{ color: hexA(A, m.a) }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-zinc-400">{m.name}</span>
                    <span className="shrink-0 font-bold" style={{ color: hexA(A, Math.min(1, m.a + 0.3)) }}>
                      {money(m.v)}
                    </span>
                    <span className="w-12 shrink-0 text-right text-zinc-600">{pct((m.v / Math.max(1, c.total)) * 100, 0)}</span>
                  </div>
                ))}
                {mix.length === 0 ? <p className="text-xs text-zinc-600">enter route costs to see the mix</p> : null}
              </div>
            </Panel>

            <Panel title="BREAKDOWN" accent={A}>
              <KV k="fuel" v={`${money(c.fuelTotal)} · ${fmt(c.liters, 0)} L`} accent={A} />
              <KV k={`tolls × ${c.cars} car${c.cars > 1 ? "s" : ""}`} v={money(c.tollsTotal)} />
              <KV k="hotel" v={`${money(c.hotelTotal)} · ${c.rooms} room${c.rooms > 1 ? "s" : ""} × ${fmt(c.nights, 0)} nights`} />
              <KV k="km per driver" v={`${fmt(c.kmPerDriver, 0)} km (${c.drivers} drivers)`} />
              {c.cars > 1 ? <KV k="per car (all-in)" v={money(c.perCar)} accent={A} /> : null}
              <KV k="check" v={`${c.people} × ${money(c.perPerson)} = ${money(c.perPerson * c.people)}`} />
            </Panel>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
              {Array.from({ length: Math.min(c.cars, 6) }, (_, i) => (
                <Car key={i} className="h-4 w-4" style={{ color: A }} aria-hidden />
              ))}
              {c.cars > 6 ? <span className="font-mono text-[10px] text-zinc-500">+{c.cars - 6}</span> : null}
              <span className="ml-auto truncate font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                {c.drivers} driver{c.drivers > 1 ? "s" : ""} share the wheel
              </span>
            </div>
          </div>
        }
      />

      <Note>
        Driver time isn&apos;t charged — tip them instead. Drivers pay the same per-person share as everyone else;
        their hours behind the wheel are their contribution. Rooms auto-fill at two people per room.
      </Note>
    </div>
  );
}

/* ========================================================================= */
/* META                                                                      */
/* ========================================================================= */

export const travelMeta: ToolMeta[] = [
  {
    id: "jr-pass-optimizer",
    name: "JR Pass Window Optimiser",
    description: "Brute-forces every activation window so the pass covers your most expensive days — savings vs buying legs separately.",
    category: "life",
    icon: Train,
    keywords: "jr pass activation window calculator best 7 days inside trip savings",
    badge: "new",
    component: JrPassTool,
  },
  {
    id: "luggage-weight-split",
    name: "Luggage Weight Splitter",
    description: "Pools the family's checked-bag kilos, assigns bags first-fit and suggests exactly what to move when someone is over.",
    category: "life",
    icon: Luggage,
    keywords: "family luggage weight splitter airline allowance kg per person bags",
    badge: "new",
    component: LuggageWeightTool,
  },
  {
    id: "interrail-days",
    name: "Interrail Travel-Days Planner",
    description: "Pick a pass, list your planned travel days, and see if they fit inside the validity window before you buy.",
    category: "life",
    icon: CalendarDays,
    keywords: "interrail eurail travel days planner within validity passes",
    badge: "new",
    component: InterrailDaysTool,
  },
  {
    id: "roadtrip-splitter",
    name: "Road Trip Cost Split",
    description: "Fuel, tolls and rooms for the whole trip, split fairly per person — drivers pay the same, time is their contribution.",
    category: "life",
    icon: Car,
    keywords: "road trip cost splitter friends fuel tolls hotel per person",
    badge: "new",
    component: RoadTripSplitTool,
  },
];
