"use client";

/* ==========================================================================
   KIT: SPORT & TRAINING I — 5 planning tools for runners, swimmers, hikers
   and lifters. A week-by-week marathon long-run builder, a multi-day
   backpacking leg splitter, a swim-set send-off generator, a progressive
   overload table with deload flags, and a run/walk progression plan.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Flag, Mountain, Waves, Dumbbell, Footprints } from "lucide-react";
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
} from "./kit";
import type { ToolMeta } from "./tool-types";

function num(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function fmtClock(totalMin: number): string {
  const m = Math.round(totalMin);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m % 60}m`;
}

/* --------------------- 1. Marathon Long-Run Progression ------------------- */

function MarathonLongRunTool() {
  const A = accentOf(6);
  const [current, setCurrent] = useState(8);
  const [peak, setPeak] = useState(20);
  const [weeks, setWeeks] = useState(16);
  const [cutback, setCutback] = useState(3);
  const [taper, setTaper] = useState(3);
  const [race, setRace] = useState(() => iso(addDays(new Date(), weeks * 7)));

  const plan = useMemo(() => {
    const buildWeeks = Math.max(0, weeks - taper);
    const jump = (peak - current) / Math.max(1, buildWeeks - Math.ceil(buildWeeks / cutback));
    const rows: { w: number; lr: number; total: number; kind: "build" | "cutback" | "taper" | "race" }[] = [];
    let lr = current;
    let sinceCut = 0;
    for (let w = 1; w <= weeks; w++) {
      if (w > buildWeeks) {
        const t = Math.round((peak * (weeks - w)) / Math.max(1, taper) * 10) / 10;
        rows.push({ w, lr: w === weeks ? 26.2 : Math.max(6, t + 3), total: Math.max(10, Math.round(t * 2.4)), kind: w === weeks ? "race" : "taper" });
      } else {
        sinceCut++;
        if (sinceCut >= cutback && lr < peak) {
          rows.push({ w, lr: Math.max(current, Math.round(lr - jump)), total: Math.round((lr - jump) * 2.6), kind: "cutback" });
          sinceCut = 0;
        } else {
          lr = Math.min(peak, Math.round((lr + jump) * 10) / 10);
          rows.push({ w, lr, total: Math.round(lr * 2.6), kind: "build" });
        }
      }
    }
    return rows;
  }, [current, peak, weeks, cutback, taper]);

  const peakRow = plan.reduce((m, r) => (r.kind === "build" && r.lr > (m?.lr ?? 0) ? r : m), plan[0]);

  return (
    <Split
      left={
        <Panel title="RACE SETUP" accent={A}>
          <Row>
            <Field label="CURRENT LONG RUN (MI)" type="number" value={current} onChange={(v) => setCurrent(num(v))} />
            <Field label="PEAK LONG RUN (MI)" type="number" value={peak} onChange={(v) => setPeak(num(v))} />
            <Field label="RACE DAY" type="date" value={race} onChange={setRace} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="WEEKS TO RACE" value={weeks} onChange={setWeeks} min={6} max={30} accent={A} />
            <Slider label="CUTBACK EVERY N WEEKS" value={cutback} onChange={setCutback} min={2} max={5} accent={A} />
            <Slider label="TAPER WEEKS" value={taper} onChange={setTaper} min={1} max={4} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="PEAK WEEK" value={peakRow ? `W${peakRow.w}` : "—"} hint={`${peak} mi long run`} accent={A} />
            <BigStat label="PEAK MILEAGE" value={peakRow ? peakRow.total : "—"} unit="mi" accent={A} />
            <BigStat label="TOTAL PLAN MI" value={fmt(plan.reduce((s, r) => s + r.total, 0), 0)} accent={A} />
          </Grid>
          <Note>Jumps stay ≤ ~2 miles; every {cutback}rd week drops back to consolidate; the last {taper} weeks taper into race day. Long runs land on the plan&apos;s week, not the calendar date.</Note>
        </Panel>
      }
      right={
        <Panel title="WEEK BY WEEK" accent={A}>
          <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {plan.map((r) => {
              const color = r.kind === "race" ? A : r.kind === "taper" ? "#a1a1aa" : r.kind === "cutback" ? "#71717a" : A;
              return (
                <div key={r.w} className="flex items-center gap-2 rounded px-1 py-0.5" style={r.kind === "race" ? { background: `${A}14` } : undefined}>
                  <span className="w-8 shrink-0 font-mono text-[10px] text-zinc-600">W{r.w}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full" style={{ width: `${(r.lr / peak) * 100}%`, background: color, opacity: r.kind === "cutback" ? 0.5 : 1 }} />
                  </div>
                  <span className="w-24 shrink-0 text-right font-mono text-[11px] font-bold" style={{ color }}>
                    {r.kind === "race" ? "RACE 26.2" : `${r.lr} mi`}
                  </span>
                  <span className="hidden w-16 shrink-0 text-right font-mono text-[10px] text-zinc-600 sm:block">{r.total} tot</span>
                </div>
              );
            })}
          </div>
          <Out
            className="mt-3"
            label="COPY PLAN"
            text={plan.map((r) => `W${r.w} (${r.kind}): long run ${r.kind === "race" ? "26.2 (race)" : r.lr} mi · ~${r.total} mi total`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------- 2. Multi-Day Backpacking Splitter ------------------ */

function BackpackingSplitterTool() {
  const A = accentOf(7);
  const [distance, setDistance] = useState(85);
  const [ascent, setAscent] = useState(3500);
  const [capDist, setCapDist] = useState(18);
  const [capAsc, setCapAsc] = useState(900);
  const [restEvery, setRestEvery] = useState(4);
  const [paceH, setPaceH] = useState(4.5);

  const days = useMemo(() => {
    const rows: { d: number; km: number; asc: number; hours: number; rest: boolean }[] = [];
    let left = distance, leftAsc = ascent, d = 0;
    let guard = 0;
    while (left > 0.01 && guard++ < 60) {
      d++;
      const rest = restEvery > 0 && d % (restEvery + 1) === 0;
      if (rest) {
        rows.push({ d, km: 0, asc: 0, hours: 0, rest: true });
        continue;
      }
      let km = Math.min(capDist, left);
      // trim day so ascent cap is also respected (scale by whichever binds first)
      const ascIfFull = (km / Math.max(0.01, distance)) * ascent;
      if (ascIfFull > capAsc) km = (capAsc / ascent) * distance;
      km = Math.min(km, left);
      const asc = (km / Math.max(0.01, distance)) * ascent;
      const hours = km / Math.max(0.5, paceH) + asc / 600; // +1h per 600 m climb
      rows.push({ d, km: Math.round(km * 10) / 10, asc: Math.round(asc), hours, rest: false });
      left -= km;
      leftAsc -= asc;
    }
    return rows;
  }, [distance, ascent, capDist, capAsc, restEvery, paceH]);

  const walking = days.filter((r) => !r.rest);

  return (
    <Split
      left={
        <Panel title="ROUTE & LIMITS" accent={A}>
          <Row>
            <Field label="TOTAL DISTANCE (KM)" type="number" value={distance} onChange={(v) => setDistance(num(v))} />
            <Field label="TOTAL ASCENT (M)" type="number" value={ascent} onChange={(v) => setAscent(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="MAX KM PER DAY" value={capDist} onChange={setCapDist} min={5} max={45} accent={A} />
            <Slider label="MAX ASCENT PER DAY" value={capAsc} onChange={setCapAsc} min={200} max={2500} step={50} suffix=" m" accent={A} />
            <Slider label="REST DAY EVERY N WALKING DAYS" value={restEvery} onChange={setRestEvery} min={0} max={6} hint="0 = no rest days" accent={A} />
            <Slider label="YOUR PACE (KM/H)" value={paceH} onChange={setPaceH} min={2} max={7} step={0.5} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="TRIP DAYS" value={days.length} accent={A} />
            <BigStat label="WALKING DAYS" value={walking.length} accent={A} />
            <BigStat label="AVG DAY" value={walking.length ? fmt(distance / walking.length, 1) : "—"} unit="km" accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="LEG BY LEG" accent={A}>
          <div className="space-y-1.5">
            {days.map((r) => (
              <div key={r.d} className="flex items-center gap-2 rounded border px-2 py-1.5" style={{ borderColor: r.rest ? "#3f3f46" : `${A}44`, background: r.rest ? "#18181b" : `${A}08` }}>
                <span className="w-8 shrink-0 font-mono text-[10px] font-black" style={{ color: r.rest ? "#71717a" : A }}>D{r.d}</span>
                {r.rest ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">rest day — resupply, swim, zero miles</span>
                ) : (
                  <>
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full" style={{ width: `${(r.km / capDist) * 100}%`, background: A }} />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-[11px] font-bold text-zinc-200">{r.km} km</span>
                    <span className="w-16 shrink-0 text-right font-mono text-[10px] text-zinc-500">↑{r.asc} m</span>
                    <span className="hidden w-14 shrink-0 text-right font-mono text-[10px] text-zinc-500 sm:block">{fmtClock(r.hours)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY ITINERARY"
            text={days.map((r) => `Day ${r.d}: ${r.rest ? "REST" : `${r.km} km · ↑${r.asc} m · ~${fmtClock(r.hours)}`}`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------------- 3. Swim-Set Interval Planner ------------------ */

function SwimIntervalsTool() {
  const A = accentOf(8);
  const [dist, setDist] = useState(100);
  const [reps, setReps] = useState(6);
  const [paceSec, setPaceSec] = useState(105); // per 100
  const [restSec, setRestSec] = useState(20);
  const [sets, setSets] = useState(3);

  const per = useMemo(() => {
    const swim = (paceSec * dist) / 100;
    const sendoff = Math.round((swim + restSec) / 5) * 5;
    return { swim: Math.round(swim), sendoff };
  }, [dist, paceSec, restSec]);

  const totalMin = (per.sendoff * reps * sets) / 60;
  const metres = dist * reps * sets;

  const schedule = useMemo(() => {
    const out: { rep: number; leave: string }[] = [];
    let t = 0;
    for (let i = 1; i <= Math.min(reps, 20); i++) {
      out.push({ rep: i, leave: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` });
      t += per.sendoff;
    }
    return out;
  }, [reps, per]);

  return (
    <Split
      left={
        <Panel title="SET BUILDER" accent={A}>
          <Row>
            <Field label="REP DISTANCE (M)" type="number" value={dist} onChange={(v) => setDist(num(v))} />
            <Field label="REPS PER SET" type="number" value={reps} onChange={(v) => setReps(num(v))} />
            <Field label="SETS" type="number" value={sets} onChange={(v) => setSets(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between"><span className="mono-kicker text-zinc-500">PACE PER 100 M</span><span className="font-mono text-xs font-bold" style={{ color: A }}>{Math.floor(paceSec / 60)}:{String(paceSec % 60).padStart(2, "0")}</span></div>
              <input type="range" min={60} max={180} step={5} value={paceSec} onChange={(e) => setPaceSec(Number(e.target.value))} className="w-full" style={{ accentColor: A }} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between"><span className="mono-kicker text-zinc-500">REST PER REP</span><span className="font-mono text-xs font-bold" style={{ color: A }}>{restSec}s</span></div>
              <input type="range" min={5} max={60} step={5} value={restSec} onChange={(e) => setRestSec(Number(e.target.value))} className="w-full" style={{ accentColor: A }} />
            </div>
          </div>
          <Grid cols={4}>
            <BigStat label="SWIM / REP" value={`${Math.floor(per.swim / 60)}:${String(per.swim % 60).padStart(2, "0")}`} accent={A} />
            <BigStat label="SEND-OFF" value={`${Math.floor(per.sendoff / 60)}:${String(per.sendoff % 60).padStart(2, "0")}`} hint="rounded to 5s" accent={A} />
            <BigStat label="SET TOTAL" value={fmt((per.sendoff * reps) / 60, 1)} unit="min" accent={A} />
            <BigStat label="SESSION" value={fmt(totalMin, 0)} unit={`min · ${fmt(metres, 0)} m`} accent={A} />
          </Grid>
          <Note>Send-off = swim time + rest, rounded to the nearest 5 s so the clock repeats are easy to hold. Leave times below show when to push off each rep.</Note>
        </Panel>
      }
      right={
        <Panel title="SEND-OFF CLOCK" accent={A}>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {schedule.map((s) => (
              <div key={s.rep} className="rounded border border-zinc-800 bg-zinc-950/60 p-1.5 text-center">
                <p className="font-mono text-[9px] text-zinc-600">REP {s.rep}</p>
                <p className="font-mono text-sm font-black" style={{ color: A }}>{s.leave}</p>
              </div>
            ))}
          </div>
          {reps > 20 ? <p className="mt-2 font-mono text-[10px] text-zinc-600">…repeats every {Math.floor(per.sendoff / 60)}:{String(per.sendoff % 60).padStart(2, "0")} for all {reps} reps × {sets} sets.</p> : null}
          <Out
            className="mt-3"
            label="COPY SET"
            text={`${sets} × ${reps} × ${dist} m @ ${Math.floor(per.sendoff / 60)}:${String(per.sendoff % 60).padStart(2, "0")} send-off (pace ${Math.floor(paceSec / 60)}:${String(paceSec % 60).padStart(2, "0")}/100, rest ${restSec}s)\nSession: ~${Math.round(totalMin)} min · ${metres.toLocaleString()} m`}
          />
        </Panel>
      }
    />
  );
}

/* ----------------------- 4. Progressive-Overload Planner ------------------ */

function OverloadPlannerTool() {
  const A = accentOf(9);
  const [lifts, setLifts] = useState("Squat 100 2.5\nBench 65 1.25\nDeadlift 120 2.5\nPress 45 1.25");
  const [weeks, setWeeks] = useState(8);
  const [deload, setDeload] = useState(4);
  const [scheme, setScheme] = useState<"5x5" | "3x8" | "531">("5x5");

  const plan = useMemo(() => {
    const rows = lifts.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(/\s+/);
      return { name: p[0] || "Lift", w: num(p[1] ?? "0"), inc: num(p[2] ?? "2.5") };
    });
    const out = rows.map((r) => {
      const weeksOut: { w: number; w2: number; deload: boolean }[] = [];
      let w = r.w;
      for (let i = 1; i <= weeks; i++) {
        const isDeload = deload > 0 && i % deload === 0 && i !== weeks;
        if (isDeload) {
          weeksOut.push({ w: Math.round(w * 0.85 * 4) / 4, w2: w, deload: true });
        } else {
          weeksOut.push({ w, w2: w, deload: false });
          w += r.inc;
        }
      }
      return { ...r, weeksOut, final: w - r.inc };
    });
    return out;
  }, [lifts, weeks, deload]);

  const repsLabel = scheme === "5x5" ? "5×5" : scheme === "3x8" ? "3×8" : "5/3/1 + AMRAP";

  return (
    <div className="space-y-4">
      <Panel title="LIFTS & SCHEME" accent={A}>
        <Row>
          <div className="min-w-0">
            <span className="mono-kicker mb-1.5 block text-zinc-500">REP SCHEME</span>
            <Seg
              value={scheme}
              onChange={setScheme}
              accent={A}
              options={[
                { v: "5x5", label: "5×5" },
                { v: "3x8", label: "3×8" },
                { v: "531", label: "5/3/1" },
              ] as const}
            />
          </div>
          <Field label="LIFT · START WEIGHT · JUMP (KG)" value={lifts} onChange={setLifts} className="min-w-0 flex-1" hint='One line each, e.g. "Squat 100 2.5"' />
        </Row>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Slider label="WEEKS" value={weeks} onChange={setWeeks} min={4} max={16} accent={A} />
          <Slider label="DELOAD EVERY N WEEKS (−15%)" value={deload} onChange={setDeload} min={0} max={6} hint="0 = never deload" accent={A} />
        </div>
      </Panel>
      <Panel title="LOADING TABLE (KG)" accent={A}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr>
                <th className="pb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">Lift</th>
                {Array.from({ length: weeks }, (_, i) => (
                  <th key={i} className="pb-1.5 text-center font-mono text-[9px] uppercase text-zinc-600">W{i + 1}</th>
                ))}
                <th className="pb-1.5 text-right font-mono text-[9px] uppercase text-zinc-600">Gain</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((r) => (
                <tr key={r.name} className="border-t border-zinc-800/60">
                  <td className="py-1.5 pr-2 font-mono text-[11px] font-bold text-zinc-200">{r.name}</td>
                  {r.weeksOut.map((c, i) => (
                    <td key={i} className="py-1.5 text-center">
                      <span
                        className="rounded px-1 py-0.5 font-mono text-[10px] font-bold"
                        style={c.deload ? { color: "#fbbf24", background: "#fbbf2414" } : { color: A }}
                      >
                        {c.w}
                      </span>
                    </td>
                  ))}
                  <td className="py-1.5 text-right font-mono text-[10px] text-zinc-500">+{fmt(r.final - r.w, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-[10px] text-zinc-600">scheme: {repsLabel} · amber = deload week (−15%)</p>
        <Out
          className="mt-3"
          label="COPY TABLE"
          text={plan
            .map((r) => `${r.name}: ` + r.weeksOut.map((c, i) => `W${i + 1} ${c.w}${c.deload ? "(deload)" : ""}`).join(" · "))
            .join("\n")}
        />
      </Panel>
    </div>
  );
}

/* --------------------- 5. Run/Walk Interval Progression ------------------- */

function RunWalkPlanTool() {
  const A = accentOf(10);
  const [runStart, setRunStart] = useState(1);
  const [walk, setWalk] = useState(2);
  const [session, setSession] = useState(30);
  const [weeks, setWeeks] = useState(9);
  const [step, setStep] = useState(0.5);

  const weeksPlan = useMemo(() => {
    const out: { w: number; run: number; cycles: number; cont: boolean }[] = [];
    let run = runStart;
    for (let w = 1; w <= weeks; w++) {
      const cycle = run + walk;
      const cycles = Math.round(session / cycle);
      const cont = run >= session;
      out.push({ w, run, cycles, cont });
      run = Math.round((run + step) * 2) / 2;
    }
    return out;
  }, [runStart, walk, session, weeks, step]);

  const finishWeek = weeksPlan.find((r) => r.cont)?.w ?? null;

  return (
    <Split
      left={
        <Panel title="WHERE YOU ARE NOW" accent={A}>
          <div className="space-y-3">
            <Slider label="FIRST WEEK: RUN MINUTES" value={runStart} onChange={setRunStart} min={0.5} max={10} step={0.5} suffix=" min" accent={A} />
            <Slider label="WALK BREAK" value={walk} onChange={setWalk} min={0.5} max={5} step={0.5} suffix=" min" accent={A} />
            <Slider label="SESSION LENGTH" value={session} onChange={setSession} min={15} max={60} step={5} suffix=" min" accent={A} />
            <Slider label="WEEKS TO PLAN" value={weeks} onChange={setWeeks} min={4} max={16} accent={A} />
            <Slider label="RUN-TIME JUMP PER WEEK" value={step} onChange={setStep} min={0.5} max={2} step={0.5} suffix=" min" accent={A} />
          </div>
          <Grid cols={2}>
            <BigStat label="RUNS CONTINUOUS IN" value={finishWeek ? `Week ${finishWeek}` : "beyond plan"} accent={A} />
            <BigStat label="FINAL RUN BOUT" value={weeksPlan[weeksPlan.length - 1].run} unit="min" accent={A} />
          </Grid>
          <Note>Each week holds the run/walk ratio but stretches the run bout by the jump. Session length stays fixed — you simply run more of it.</Note>
        </Panel>
      }
      right={
        <Panel title="WEEKLY INTERVALS" accent={A}>
          <div className="space-y-1.5">
            {weeksPlan.map((r) => {
              const hit = r.cont;
              return (
                <div key={r.w} className="flex items-center gap-2 rounded border px-2 py-1.5" style={{ borderColor: hit ? A : "#27272a", background: hit ? `${A}10` : "transparent" }}>
                  <span className="w-7 shrink-0 font-mono text-[10px] font-black" style={{ color: hit ? A : "#71717a" }}>W{r.w}</span>
                  <span className="min-w-0 flex-1 font-mono text-[11px] text-zinc-200">
                    {hit ? `${session} min continuous — done!` : `${r.cycles} × (run ${r.run} / walk ${walk})`}
                  </span>
                  <span className="hidden shrink-0 font-mono text-[10px] text-zinc-600 sm:block">
                    {hit ? "100%" : `${Math.round(((r.run * r.cycles) / session) * 100)}% run`}
                  </span>
                  {hit ? <Tag accent={A}>graduated</Tag> : null}
                </div>
              );
            })}
          </div>
          <Out
            className="mt-3"
            label="COPY PLAN"
            text={weeksPlan.map((r) => `Week ${r.w}: ${r.cont ? `${session} min continuous` : `${r.cycles} × (run ${r.run} min / walk ${walk} min)`}`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const sportMeta: ToolMeta[] = [
  {
    id: "marathon-longrun",
    name: "Marathon Long-Run Builder",
    description: "Your current long run + race date → a week-by-week progression with cutback weeks and taper.",
    category: "health",
    icon: Flag,
    keywords: "marathon long run progression plan cutback weeks taper race",
    badge: "new",
    component: MarathonLongRunTool,
  },
  {
    id: "backpacking-splitter",
    name: "Backpacking Itinerary Splitter",
    description: "Total distance + ascent → day-by-day legs capped by your distance and climb limits, with rest days.",
    category: "health",
    icon: Mountain,
    keywords: "multi day backpacking itinerary planner daily distance camps rest",
    badge: "new",
    component: BackpackingSplitterTool,
  },
  {
    id: "swim-intervals",
    name: "Swim Set Interval Planner",
    description: "Reps × distance × pace + rest → send-off times, leave clock and session totals.",
    category: "health",
    icon: Waves,
    keywords: "swim workout interval planner pace per 100 rest send off sets",
    badge: "new",
    component: SwimIntervalsTool,
  },
  {
    id: "overload-planner",
    name: "Progressive Overload Planner",
    description: "Lifts, jumps and deload rhythm → a week-by-week loading table for every barbell move.",
    category: "health",
    icon: Dumbbell,
    keywords: "progressive overload planner weights weeks deload strength program",
    badge: "new",
    component: OverloadPlannerTool,
  },
  {
    id: "run-walk-plan",
    name: "Run/Walk Progression",
    description: "From run/walk intervals to continuous running — a weekly plan built from your current bout.",
    category: "health",
    icon: Footprints,
    keywords: "run walk interval plan beginner weeks progression couch",
    badge: "new",
    component: RunWalkPlanTool,
  },
];
