"use client";

/* ==========================================================================
   KIT: CALCULATORS PLUS — 14 heavier calculators: body, cycles, work, ads,
   sky and money. Real formulas only (Mifflin-St Jeor, NOAA solar equations,
   ISO-8601 calendar math, compound interest), every screen composed bespoke
   from the shared kit atoms. 100% client-side.
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Baby,
  CalendarDays,
  CalendarHeart,
  ClipboardList,
  Flame,
  Moon,
  MousePointerClick,
  Percent,
  Repeat,
  Sunrise,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  BigStat,
  Btn,
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

/* ------------------------------ shared helpers ----------------------------- */

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseYMD(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() + n);
  return t;
}

/** Whole-day difference, DST-proof: positive when b is after a. */
function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtShort(d: Date): string {
  return `${MON[d.getMonth()]} ${d.getDate()}`;
}

function fmtHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

function toMin(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return NaN;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return NaN;
  return h * 60 + mm;
}

/** Small pill-button used by the preset-chip tools. */
function Chip({ label, onClick, accent, on = false }: { label: string; onClick: () => void; accent: string; on?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors hover:brightness-125 active:scale-[0.98]"
      style={
        on
          ? { background: accent, color: "#0a0a0a", borderColor: accent }
          : { borderColor: `${accent}55`, color: "#d4d4d8", background: `${accent}0d` }
      }
    >
      {label}
    </button>
  );
}

/** Read-only computed value styled like a Field — for solve-any-two tools. */
function ReadOnlyNum({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mono-kicker mb-1.5 block text-zinc-500">{label}</span>
      <input
        readOnly
        value={value}
        tabIndex={-1}
        className="w-full cursor-default rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm font-bold text-zinc-100"
        aria-label={label}
      />
      {hint ? <span className="mt-1 block text-[10px] text-zinc-600">{hint}</span> : null}
    </label>
  );
}

/* ============================== 1. Calorie deficit ========================== */

const ACTIVITY = {
  sedentary: { f: 1.2, label: "desk-bound" },
  light: { f: 1.375, label: "light 1–3×/wk" },
  moderate: { f: 1.55, label: "moderate 3–5×/wk" },
  active: { f: 1.725, label: "active 6–7×/wk" },
} as const;
type ActKey = keyof typeof ACTIVITY;
const KCAL_PER_KG = 7700; // ~energy in 1 kg of body fat

export function CalorieDeficitTool() {
  const A = accentOf(0);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("30");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("85");
  const [goal, setGoal] = useState("75");
  const [act, setAct] = useState<ActKey>("moderate");
  const [loss, setLoss] = useState(0.5);

  const res = useMemo(() => {
    const w = num(weight);
    const bmr = 10 * w + 6.25 * num(height) - 5 * num(age) + (sex === "male" ? 5 : -161);
    const tdee = bmr * ACTIVITY[act].f;
    const deficit = (loss * KCAL_PER_KG) / 7;
    const target = tdee - deficit;
    const toLose = w - num(goal);
    const days = toLose > 0 && deficit > 0 ? Math.round((toLose * KCAL_PER_KG) / deficit) : null;
    return { bmr, tdee, deficit, target, days, toLose };
  }, [weight, height, age, sex, act, loss, goal]);

  const floor = sex === "male" ? 1500 : 1200;
  const tooLow = res.target < floor;

  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={sex}
          onChange={setSex}
          accent={A}
          options={[
            { v: "male" as const, label: "Male" },
            { v: "female" as const, label: "Female" },
          ]}
        />
        <Seg
          value={act}
          onChange={setAct}
          accent={A}
          options={(Object.keys(ACTIVITY) as ActKey[]).map((k) => ({ v: k, label: ACTIVITY[k].label }))}
        />
      </Row>
      <Grid cols={4}>
        <Field label="Age" value={age} onChange={setAge} type="number" />
        <Field label="Height (cm)" value={height} onChange={setHeight} type="number" />
        <Field label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
        <Field label="Goal weight (kg)" value={goal} onChange={setGoal} type="number" />
      </Grid>
      <Slider
        label="Target pace — lose per week"
        value={loss}
        onChange={setLoss}
        min={0.1}
        max={1}
        step={0.1}
        suffix=" kg"
        accent={A}
      />
      <Grid cols={3}>
        <BigStat label="Maintenance (TDEE)" value={fmt(res.tdee, 0)} unit="kcal" accent="#7FC8FF" hint={`BMR ${fmt(res.bmr, 0)} kcal`} />
        <BigStat label="Daily target" value={fmt(res.target, 0)} unit="kcal" accent={A} hint={`eat this to lose ${loss} kg/wk`} />
        <BigStat label="Daily deficit" value={fmt(res.deficit, 0)} unit="kcal" accent="#FF8A7A" hint={`${pct((res.deficit / Math.max(1, res.tdee)) * 100, 0)} of maintenance`} />
      </Grid>
      <Meter value={res.deficit} max={Math.max(1, res.tdee)} accent="#FF8A7A" label="deficit share of daily burn" right={pct((res.deficit / Math.max(1, res.tdee)) * 100, 0)} />
      <Panel title="timeline" accent={A}>
        <KV k="to lose" v={`${fmt(res.toLose, 1)} kg`} />
        <KV k="at this pace" v={res.days !== null ? (res.days >= 60 ? `${fmt(res.days / 30.44, 1)} months` : `${res.days} days`) : "set a goal weight below current"} accent={A} />
        <KV k="weekly burn gap" v={`${fmt(res.deficit * 7, 0)} kcal`} />
        <KV k="energy in 1 kg fat" v={`${fmt(KCAL_PER_KG, 0)} kcal`} />
      </Panel>
      {tooLow ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-rose-400">▲ below the {floor} kcal floor</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rose-200/70">
            {fmt(res.target, 0)} kcal is under the commonly cited minimum for {sex === "male" ? "men" : "women"}. Very low intakes risk nutrient gaps,
            muscle loss and rebound. Slow down: a smaller deficit you can keep beats a crash.
          </p>
        </div>
      ) : null}
      <Note>
        Mifflin-St Jeor BMR × activity factor = TDEE; 1 kg of body fat ≈ 7,700 kcal, so the daily deficit is pace × 7,700 ÷ 7. Real weight loss
        plateaus as your TDEE drops — recompute every few kilos.
      </Note>
    </div>
  );
}

/* ============================== 2. Ovulation ================================ */

export function OvulationTool() {
  const A = accentOf(1);
  const [lmp, setLmp] = useState(() => ymd(addDays(new Date(), -10)));
  const [cycle, setCycle] = useState(28);

  const base = parseYMD(lmp);
  const today = new Date();
  const strip = base
    ? (() => {
        const elapsed = Math.max(0, daysBetween(base, today));
        const k = Math.floor(elapsed / cycle);
        const start = addDays(base, k * cycle);
        const nextPeriod = addDays(base, (k + 1) * cycle);
        const ovul = addDays(nextPeriod, -14); // luteal phase ≈ 14 days
        return {
          start,
          nextPeriod,
          ovul,
          ovulDay: cycle - 13,
          cycleDayToday: daysBetween(start, today) + 1,
        };
      })()
    : null;

  const days = Array.from({ length: cycle }, (_, i) => i + 1);
  const isPeriod = (d: number) => d <= 4;
  const fertileFrom = strip ? strip.ovulDay - 5 : 0;
  const fertileTo = strip ? strip.ovulDay + 1 : 0;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="First day of last period" value={lmp} onChange={setLmp} type="date" />
        <div className="min-w-[180px] flex-1">
          <Slider label="Cycle length" value={cycle} onChange={setCycle} min={21} max={35} suffix=" days" accent={A} />
        </div>
      </Row>
      {strip ? (
        <>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            {days.map((d) => {
              const fer = d >= fertileFrom && d <= fertileTo;
              const ov = d === strip.ovulDay;
              const per = isPeriod(d);
              const isToday = d === strip.cycleDayToday;
              return (
                <span
                  key={d}
                  title={`Day ${d} — ${fmtDate(addDays(strip.start, d - 1))}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[9px] font-bold"
                  style={{
                    borderColor: ov ? A : fer ? `${A}88` : per ? "#FF8A7A66" : "#3f3f46",
                    background: ov ? A : fer ? `${A}26` : per ? "#FF8A7A1a" : "transparent",
                    color: ov ? "#0a0a0a" : fer ? A : per ? "#FF8A7A" : "#71717a",
                    boxShadow: isToday ? "0 0 0 1.5px #e4e4e7" : undefined,
                  }}
                >
                  {d}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#FF8A7A55" }} /> period</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: `${A}45` }} /> fertile window</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: A }} /> ovulation</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-zinc-300" /> today (day {strip.cycleDayToday})</span>
          </div>
          <Grid cols={3}>
            <BigStat label="Ovulation day" value={fmtShort(strip.ovul)} accent={A} hint={`day ${strip.ovulDay} of cycle · in ${Math.max(0, daysBetween(today, strip.ovul))} d`} />
            <BigStat label="Fertile window" value={`${fmtShort(addDays(strip.ovul, -5))} → ${fmtShort(addDays(strip.ovul, 1))}`} accent="#7FC8FF" hint="sperm survive ~5 days" />
            <BigStat label="Next period" value={fmtShort(strip.nextPeriod)} accent="#FF8A7A" hint={`in ${Math.max(0, daysBetween(today, strip.nextPeriod))} days`} />
          </Grid>
          <Panel title="cycle facts" accent={A}>
            <KV k="today is cycle day" v={`${strip.cycleDayToday} of ${cycle}`} accent={A} />
            <KV k="luteal phase used" v="14 days (ovulation = next period − 14)" />
            <KV k="cycles per year" v={fmt(365 / cycle, 1)} />
            <KV k="strip covers" v={`${fmtDate(strip.start)} → ${fmtDate(addDays(strip.nextPeriod, -1))}`} />
          </Panel>
        </>
      ) : (
        <Note>Pick the first day of your last period to draw the cycle strip.</Note>
      )}
      <Note>
        The calendar method assumes a stable luteal phase of ~14 days — ovulation lands 14 days before the next period regardless of cycle length.
        Cycles still drift with stress, sleep and illness, so this is a map, not a guarantee. Not contraception.
      </Note>
    </div>
  );
}

/* ============================== 3. Pregnancy week =========================== */

const TRI_BOUNDS: [string, number, number][] = [
  ["1st trimester", 0, 97],
  ["2nd trimester", 98, 195],
  ["3rd trimester", 196, 279],
];

export function PregnancyWeekTool() {
  const A = accentOf(2);
  const [lmp, setLmp] = useState(() => ymd(addDays(new Date(), -70)));
  const lmpD = parseYMD(lmp);
  const gd = lmpD ? daysBetween(lmpD, new Date()) : -1;
  const ok = gd >= 0 && gd <= 300;
  const week = Math.floor(gd / 7);
  const due = lmpD ? addDays(lmpD, 280) : null;
  const tri = gd < 98 ? 0 : gd < 196 ? 1 : 2;

  return (
    <div className="space-y-4">
      <Field label="First day of last menstrual period (LMP)" value={lmp} onChange={setLmp} type="date" />
      {ok && lmpD && due ? (
        <>
          <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-7">
            <p className="mono-kicker text-zinc-500">gestational age today</p>
            <p className="mt-1 font-brut text-5xl" style={{ color: A }}>
              {week}
              <span className="text-2xl text-zinc-500">w</span> {gd % 7}
              <span className="text-2xl text-zinc-500">d</span>
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-600">{gd} days since LMP · day {gd + 1} of 280</p>
          </div>
          <Grid cols={3}>
            <BigStat label="Due date (40w)" value={fmtShort(due)} accent={A} hint={fmtDate(due)} />
            <BigStat label="Days remaining" value={Math.max(0, 280 - gd)} unit="days" accent="#5EE39A" hint={`≈ ${fmt(Math.max(0, 280 - gd) / 7, 1)} weeks`} />
            <BigStat label="Trimester" value={["First", "Second", "Third"][tri]} accent="#7FC8FF" hint={`weeks ${tri === 0 ? "1–13" : tri === 1 ? "14–27" : "28–40"}`} />
          </Grid>
          <Panel title="trimester progress" accent={A}>
            {TRI_BOUNDS.map(([name, from, to]) => {
              const len = to - from + 1;
              const done = Math.min(Math.max(gd - from + 1, 0), len);
              return (
                <div key={name} className="mb-3 last:mb-0">
                  <Meter value={done} max={len} accent={A} label={name} right={pct((done / len) * 100, 0)} />
                </div>
              );
            })}
            <Meter value={gd} max={280} accent="#7FC8FF" label="overall to 40 weeks" right={`${week}/40 wks`} />
          </Panel>
          <Panel title="key dates" accent={A}>
            <KV k="estimated conception" v={fmtDate(addDays(lmpD, 14))} />
            <KV k="1st trimester ends (13w6d)" v={fmtDate(addDays(lmpD, 97))} />
            <KV k="2nd trimester ends (27w6d)" v={fmtDate(addDays(lmpD, 195))} />
            <KV k="full term begins (37w)" v={fmtDate(addDays(lmpD, 259))} accent={A} />
            <KV k="due date (40w)" v={fmtDate(due)} accent={A} />
          </Panel>
        </>
      ) : (
        <Note>{gd < 0 ? "That LMP is in the future — pick a date on or before today." : "Over 300 days since LMP — double-check the date or talk to a clinician."}</Note>
      )}
      <Note>
        Gestational age counts from the LMP, not conception — week 1 starts before there is even an embryo. Naegele&apos;s rule: due date = LMP + 280
        days. Only ~4% of babies arrive exactly on the day; ±2 weeks is normal.
      </Note>
    </div>
  );
}

/* ============================== 4. Timesheet ================================ */

type TRow = { id: number; day: string; in: string; out: string; brk: string };

export function TimesheetTool() {
  const A = accentOf(3);
  const [rows, setRows] = useState<TRow[]>([
    { id: 1, day: "Mon", in: "09:00", out: "17:30", brk: "30" },
    { id: 2, day: "Tue", in: "09:00", out: "17:30", brk: "30" },
    { id: 3, day: "Wed", in: "09:00", out: "17:30", brk: "30" },
    { id: 4, day: "Thu", in: "09:00", out: "17:30", brk: "30" },
    { id: 5, day: "Fri", in: "09:00", out: "15:00", brk: "30" },
  ]);
  const [threshold, setThreshold] = useState("40");

  const upd = (id: number, patch: Partial<TRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const rowMin = (r: TRow): number | null => {
    const i = toMin(r.in);
    const o = toMin(r.out);
    if (Number.isNaN(i) || Number.isNaN(o)) return null;
    let m = o - i;
    if (m < 0) m += 1440; // overnight shift
    return Math.max(0, m - num(r.brk));
  };

  const perRow = rows.map((r) => rowMin(r));
  const totalMin = perRow.reduce<number>((a, m) => a + (m ?? 0), 0);
  const workedDays = perRow.filter((m) => m !== null && m > 0).length;
  const thMin = Math.max(0, num(threshold) * 60);
  const otMin = Math.max(0, totalMin - thMin);

  const inputCls =
    "rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="hidden gap-2 px-3 sm:flex">
        <span className="mono-kicker w-14 shrink-0 text-zinc-500">day</span>
        <span className="mono-kicker w-28 text-zinc-500">in</span>
        <span className="mono-kicker w-28 text-zinc-500">out</span>
        <span className="mono-kicker w-24 text-zinc-500">break (min)</span>
        <span className="mono-kicker ml-auto w-16 text-right text-zinc-500">worked</span>
        <span className="w-7 shrink-0" />
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <input value={r.day} onChange={(e) => upd(r.id, { day: e.target.value })} className={`${inputCls} w-14 text-left`} aria-label="day label" />
            <input type="time" value={r.in} onChange={(e) => upd(r.id, { in: e.target.value })} className={`${inputCls} w-28`} aria-label="clock in" />
            <span className="text-xs text-zinc-600">→</span>
            <input type="time" value={r.out} onChange={(e) => upd(r.id, { out: e.target.value })} className={`${inputCls} w-28`} aria-label="clock out" />
            <input type="number" min={0} value={r.brk} onChange={(e) => upd(r.id, { brk: e.target.value })} className={`${inputCls} w-20 text-right`} aria-label="break minutes" />
            <span className="ml-auto w-16 text-right font-mono text-xs font-bold" style={{ color: A }}>
              {perRow[i] !== null ? fmtHM(perRow[i] as number) : "—"}
            </span>
            <button
              type="button"
              onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
              className="w-6 shrink-0 text-center font-mono text-xs text-zinc-600 hover:text-rose-400"
              aria-label="remove row"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <Row>
        <Btn accent={A} onClick={() => setRows((rs) => [...rs, { id: Date.now(), day: `Day ${rs.length + 1}`, in: "09:00", out: "17:00", brk: "30" }])}>
          + Add day
        </Btn>
        <Field label="Overtime after (h/week)" value={threshold} onChange={setThreshold} type="number" className="w-28" />
      </Row>
      <Grid cols={3}>
        <BigStat label="Weekly total" value={fmt(totalMin / 60, 2)} unit="h" accent={A} hint={fmtHM(totalMin)} />
        <BigStat label="Overtime" value={fmt(otMin / 60, 2)} unit="h" accent={otMin > 0 ? "#FF8A7A" : "#71717a"} hint={otMin > 0 ? `${fmtHM(otMin)} beyond ${threshold}h` : `under the ${threshold}h line`} />
        <BigStat label="Days worked" value={workedDays} accent="#7FC8FF" hint={`avg ${fmtHM(workedDays ? totalMin / workedDays : 0)}/day`} />
      </Grid>
      <Panel title="per-day breakdown" accent={A}>
        {rows.map((r, i) => (
          <KV key={r.id} k={`${r.day || "day"} · ${r.in || "?"}–${r.out || "?"}`} v={perRow[i] !== null ? fmtHM(perRow[i] as number) : "incomplete"} />
        ))}
        <KV k="total" v={fmtHM(totalMin)} accent={A} />
      </Panel>
      <Note>
        Out before in counts as an overnight shift (pub close → breakfast, we see you). Unpaid breaks are subtracted in full — most labor laws count a
        30-minute break only if you actually took it.
      </Note>
    </div>
  );
}

/* ============================== 5. Raise amount ============================= */

export function RaiseAmountTool() {
  const A = accentOf(4);
  const [mode, setMode] = useState<"percent" | "amount">("percent");
  const [cur, setCur] = useState("60000");
  const [pctIn, setPctIn] = useState("5");
  const [amtIn, setAmtIn] = useState("65000");
  const [hours, setHours] = useState("40");

  const c = num(cur);
  const raisePct = mode === "percent" ? num(pctIn) : c > 0 ? ((num(amtIn) - c) / c) * 100 : 0;
  const newSal = c * (1 + raisePct / 100);
  const gain = newSal - c;
  const hourlyGain = gain / Math.max(1, num(hours) * 52);
  const g = 1 + raisePct / 100;
  let fiveYr = 0;
  for (let k = 1; k <= 5; k++) fiveYr += c * (Math.pow(g, k) - 1);
  const finalSal = c * Math.pow(g, 5);

  return (
    <div className="space-y-4">
      <Seg
        value={mode}
        onChange={setMode}
        accent={A}
        options={[
          { v: "percent" as const, label: "I know the %" },
          { v: "amount" as const, label: "I know the new salary" },
        ]}
      />
      <Grid cols={3}>
        <Field label="Current yearly salary" value={cur} onChange={setCur} type="number" />
        {mode === "percent" ? (
          <Field label="Raise %" value={pctIn} onChange={setPctIn} type="number" step={0.1} />
        ) : (
          <Field label="New yearly salary" value={amtIn} onChange={setAmtIn} type="number" />
        )}
        <Field label="Hours / week" value={hours} onChange={setHours} type="number" />
      </Grid>
      <Grid cols={2}>
        <BigStat label="Extra per year" value={money(gain)} accent={A} hint={`new salary ${money(newSal)}`} />
        <BigStat label="Extra per month" value={money(gain / 12)} accent="#5EE39A" hint={`per paycheck (×2): ${money(gain / 26)}`} />
        <BigStat label="Extra per hour" value={money(hourlyGain)} accent="#7FC8FF" hint={`based on ${hours}h × 52 weeks`} />
        <BigStat label="Compounded over 5 years" value={money(fiveYr)} accent="#FF9DE2" hint="if the same raise repeats yearly" />
      </Grid>
      <Panel title="the ledger" accent={A}>
        <KV k="current salary" v={money(c)} />
        <KV k="raise" v={pct(raisePct, 2)} accent={A} />
        <KV k="new salary" v={money(newSal)} accent={A} />
        <KV k="salary after 5 yearly raises" v={money(finalSal)} />
        <KV k="cumulative extra, years 1–5" v={money(fiveYr)} accent="#FF9DE2" />
        <KV k="new monthly gross" v={money(newSal / 12)} />
      </Panel>
      <Note>
        The 5-year figure assumes the same raise % lands every year and compounds (year 2 builds on year 1&apos;s salary). Inflation is the silent
        rival — at 3% inflation, a 5% raise is really a ~2% raise in buying power.
      </Note>
    </div>
  );
}

/* ============================== 6. Markup & margin ========================== */

type MmMode = "cost-price" | "cost-margin" | "price-margin";

export function MarkupMarginTool() {
  const A = accentOf(5);
  const [mode, setMode] = useState<MmMode>("cost-price");
  const [cost, setCost] = useState("60");
  const [price, setPrice] = useState("100");
  const [margin, setMargin] = useState("40");

  const m = num(margin) / 100;
  let c: number;
  let p: number;
  if (mode === "cost-price") {
    c = num(cost);
    p = num(price);
  } else if (mode === "cost-margin") {
    c = num(cost);
    p = m >= 1 ? NaN : c / (1 - m); // margin ≥ 100% is impossible
  } else {
    p = num(price);
    c = p * (1 - m);
  }
  const profit = p - c;
  const marginPct = p > 0 ? (profit / p) * 100 : NaN;
  const markupPct = c > 0 ? (profit / c) * 100 : NaN;
  const valid = Number.isFinite(profit) && c > 0 && p > 0;

  return (
    <div className="space-y-4">
      <Seg
        value={mode}
        onChange={setMode}
        accent={A}
        options={[
          { v: "cost-price" as const, label: "Cost + Price" },
          { v: "cost-margin" as const, label: "Cost + Margin" },
          { v: "price-margin" as const, label: "Price + Margin" },
        ]}
      />
      <Grid cols={3}>
        {mode === "price-margin" ? (
          <ReadOnlyNum label="Cost (computed)" value={valid ? money(c) : "—"} hint="derived from price and margin" />
        ) : (
          <Field label="Cost (what you pay)" value={cost} onChange={setCost} type="number" />
        )}
        {mode === "cost-margin" ? (
          <ReadOnlyNum label="Price (computed)" value={Number.isFinite(p) ? money(p) : "impossible"} hint="derived from cost and margin" />
        ) : (
          <Field label="Price (what they pay)" value={price} onChange={setPrice} type="number" />
        )}
        {mode === "cost-price" ? (
          <ReadOnlyNum label="Margin % (computed)" value={valid ? pct(marginPct, 2) : "—"} hint="derived from cost and price" />
        ) : (
          <Field label="Margin %" value={margin} onChange={setMargin} type="number" step={0.5} />
        )}
      </Grid>
      <Grid cols={2}>
        <BigStat label="Margin" value={valid ? pct(marginPct, 2) : "—"} accent={A} hint="profit ÷ price" />
        <BigStat label="Markup" value={valid ? pct(markupPct, 2) : "—"} accent="#FF9DE2" hint="profit ÷ cost" />
      </Grid>
      <Panel title="the trio" accent={A}>
        <KV k="cost" v={valid ? money(c) : "—"} />
        <KV k="price" v={valid ? money(p) : "—"} />
        <KV k="profit per unit" v={valid ? money(profit) : "—"} accent={A} />
        <KV k="margin" v={valid ? pct(marginPct, 2) : "—"} />
        <KV k="markup" v={valid ? pct(markupPct, 2) : "—"} />
        <KV k="as multiplier" v={valid ? `price = cost × ${fmt(p / c, 3)}` : "—"} />
      </Panel>
      {mode === "cost-margin" && m >= 1 ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200/80">
          A 100% margin would mean giving the product away for free — the price needed is infinite. Stay under 100.
        </div>
      ) : null}
      <Note>
        The classic mix-up, in one line: <strong className="text-zinc-400">margin is profit over price, markup is profit over cost.</strong> Cost $60,
        price $100 → $40 profit = 40% margin but 66.7% markup. If a supplier says &quot;40% markup&quot; and you hear &quot;40% margin&quot;, your
        pricing is 17% off. Same $40, two names — never confuse them in a quote.
      </Note>
    </div>
  );
}

/* ============================== 7. CPM ====================================== */

type CpmMode = "cost-imp" | "cost-cpm" | "imp-cpm";
const CHANNEL_SIZES: [string, number][] = [
  ["nano · 25k", 25000],
  ["blog · 100k", 100000],
  ["portal · 500k", 500000],
  ["viral · 2M", 2000000],
];

export function CpmTool() {
  const A = accentOf(6);
  const [mode, setMode] = useState<CpmMode>("cost-imp");
  const [cost, setCost] = useState("500");
  const [imp, setImp] = useState("250000");
  const [cpm, setCpm] = useState("2");

  const C = num(cost);
  const I = num(imp);
  const R = num(cpm);
  let out: { cost: number; imp: number; cpm: number };
  if (mode === "cost-imp") out = { cost: C, imp: I, cpm: I > 0 ? (C / I) * 1000 : NaN };
  else if (mode === "cost-cpm") out = { cost: C, imp: R > 0 ? (C / R) * 1000 : NaN, cpm: R };
  else out = { cost: I > 0 ? (R * I) / 1000 : NaN, imp: I, cpm: R };
  const valid = out.cost > 0 && out.imp > 0 && Number.isFinite(out.cpm);

  return (
    <div className="space-y-4">
      <Seg
        value={mode}
        onChange={setMode}
        accent={A}
        options={[
          { v: "cost-imp" as const, label: "Spend + Impressions" },
          { v: "cost-cpm" as const, label: "Spend + CPM" },
          { v: "imp-cpm" as const, label: "Impressions + CPM" },
        ]}
      />
      <Grid cols={3}>
        {mode === "imp-cpm" ? (
          <ReadOnlyNum label="Total spend (computed)" value={Number.isFinite(out.cost) ? money(out.cost) : "—"} hint="derived from impressions and CPM" />
        ) : (
          <Field label="Total spend" value={cost} onChange={setCost} type="number" />
        )}
        {mode === "cost-cpm" ? (
          <ReadOnlyNum label="Impressions (computed)" value={Number.isFinite(out.imp) ? fmt(Math.round(out.imp), 0) : "—"} hint="derived from spend and CPM" />
        ) : (
          <Field label="Impressions" value={imp} onChange={setImp} type="number" />
        )}
        {mode === "cost-imp" ? (
          <ReadOnlyNum label="CPM (computed)" value={Number.isFinite(out.cpm) ? `$${fmt(out.cpm, 2)}` : "—"} hint="cost per 1,000 impressions" />
        ) : (
          <Field label="CPM" value={cpm} onChange={setCpm} type="number" step={0.01} />
        )}
      </Grid>
      <Grid cols={3}>
        <BigStat label="Spend" value={Number.isFinite(out.cost) ? money(out.cost) : "—"} accent={mode === "imp-cpm" ? A : "#52525b"} />
        <BigStat label="Impressions" value={Number.isFinite(out.imp) ? fmt(Math.round(out.imp), 0) : "—"} accent={mode === "cost-cpm" ? A : "#52525b"} />
        <BigStat label="CPM" value={Number.isFinite(out.cpm) ? `$${fmt(out.cpm, 2)}` : "—"} accent={mode === "cost-imp" ? A : "#52525b"} hint="per 1,000 views" />
      </Grid>
      <Panel title="channel-size presets — what this budget buys" accent={A}>
        <div className="mb-3 flex flex-wrap gap-2">
          {CHANNEL_SIZES.map(([label, n]) => (
            <Chip
              key={label}
              label={label}
              accent={A}
              onClick={() => {
                setImp(String(n));
                if (mode === "cost-cpm") setMode("imp-cpm");
              }}
            />
          ))}
        </div>
        {CHANNEL_SIZES.map(([label, n]) => (
          <KV key={label} k={label} v={Number.isFinite(out.cpm) ? `${fmt(n, 0)} impressions = ${money((n / 1000) * out.cpm)}` : "—"} />
        ))}
      </Panel>
      <Note>
        CPM is the ad-world&apos;s rent: what 1,000 eyeballs cost, whatever they do afterwards. It prices awareness — compare it with CPC when you want
        clicks and CPA when you want sales. Display ads run ~$1–5 CPM, social $5–15, premium video $20+. If a network quotes &quot;$2 CPM&quot;, that
        is $2,000 per million impressions — sanity-check big quotes with this.
      </Note>
    </div>
  );
}

/* ============================== 8. Churn & LTV ============================== */

export function ChurnLtvTool() {
  const A = accentOf(7);
  const [customers, setCustomers] = useState("500");
  const [churn, setChurn] = useState("5");
  const [arpu, setArpu] = useState("25");
  const [cac, setCac] = useState("75");

  const N = num(customers);
  const ch = num(churn);
  const rev = num(arpu);
  const C = num(cac);

  const lostPerMonth = (N * ch) / 100;
  const lifetime = ch > 0 ? 100 / ch : NaN; // months
  const ltv = rev * lifetime;
  const ratio = C > 0 && Number.isFinite(ltv) ? ltv / C : NaN;
  const verdict = !Number.isFinite(ratio)
    ? null
    : ratio >= 3
      ? { label: "healthy", color: "#5EE39A", note: "LTV ≥ 3× CAC — classic SaaS green zone" }
      : ratio >= 1
        ? { label: "thin margin", color: "#FFD43B", note: "you profit per customer, but growth will feel expensive" }
        : { label: "burning cash", color: "#FF8A7A", note: "each customer costs more than they bring back" };

  return (
    <div className="space-y-4">
      <Grid cols={4}>
        <Field label="Active customers" value={customers} onChange={setCustomers} type="number" />
        <Field label="Monthly churn %" value={churn} onChange={setChurn} type="number" step={0.1} />
        <Field label="ARPU / month" value={arpu} onChange={setArpu} type="number" />
        <Field label="CAC (cost to acquire)" value={cac} onChange={setCac} type="number" hint="0 = skip the ratio" />
      </Grid>
      <Grid cols={3}>
        <BigStat label="Lost per month" value={fmt(lostPerMonth, 1)} unit="cust" accent="#FF8A7A" hint={`${fmt(lostPerMonth * 12, 0)}/year — a leaky bucket`} />
        <BigStat label="Avg customer lifetime" value={Number.isFinite(lifetime) ? fmt(lifetime, 1) : "—"} unit="mo" accent="#7FC8FF" hint="100 ÷ churn%" />
        <BigStat label="LTV" value={Number.isFinite(ltv) ? money(ltv) : "—"} accent={A} hint={`${money(rev)} × ${fmt(lifetime, 1)} mo`} />
      </Grid>
      {verdict ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div className="min-w-0">
            <p className="mono-kicker text-zinc-500">LTV : CAC verdict</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{verdict.note}</p>
          </div>
          <Tag accent={verdict.color}>{`${fmt(ratio, 2)}× — ${verdict.label}`}</Tag>
        </div>
      ) : null}
      <Meter value={Number.isFinite(ratio) ? Math.min(ratio, 5) : 0} max={5} accent={verdict?.color ?? A} label="LTV:CAC (3× target)" right={Number.isFinite(ratio) ? `${fmt(ratio, 2)}×` : "—"} />
      <Meter value={Math.min(ch, 12)} max={12} accent="#FF8A7A" label="monthly churn (lower is better)" right={pct(ch, 1)} />
      <Panel title="leak report" accent={A}>
        <KV k="revenue lost per month" v={money(lostPerMonth * rev)} accent="#FF8A7A" />
        <KV k="customers lost per year" v={fmt(lostPerMonth * 12, 0)} />
        <KV k="CAC payback" v={rev > 0 ? `${fmt(C / rev, 1)} months of ARPU` : "—"} />
        <KV k="survivors in 12 months" v={fmt(N * Math.pow(1 - ch / 100, 12), 0)} accent={A} />
      </Panel>
      <Note>
        Simple LTV = ARPU × (1 ÷ churn) — no gross margin, no discounting, so treat it as an optimistic ceiling. Real-world LTV uses gross-margin
        ARPU, and churn under ~2%/month is where durable SaaS lives. Cut churn before you pour money into CAC.
      </Note>
    </div>
  );
}

/* ============================== 9. Sun times (NOAA) ========================= */

const RAD = Math.PI / 180;

function jdToUnix(jd: number): number {
  return Math.round((jd - 2440587.5) * 86400000);
}

interface SunResult {
  rise: Date | null;
  set: Date | null;
  noon: Date;
  dayLenMin: number;
  decl: number;
  polar: "midnight sun" | "polar night" | null;
}

/* Standard NOAA / "sunrise equation" algorithm, pure JS.
   Assumptions: sea-level horizon, solar disc + refraction = −0.833°,
   circular orbit (equation of center included; accuracy ≈ ±1–2 min). */
function sunTimes(date: Date, lat: number, lng: number): SunResult {
  // Days since J2000 mean solar noon for this calendar date
  const jd = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000 + 2440587.5;
  const n = Math.ceil(jd - 2451545.0 + 0.0008);
  // Mean solar time at the longitude → solar mean anomaly → equation of center
  // (lng is east-positive: solar noon happens lng/15 hours earlier in UTC)
  const Js = n - lng / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360; // ecliptic longitude
  // Transit (solar noon) as a Julian date
  const Jtransit = 2451545.0 + Js + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  // Declination, then the hour angle ω0 where the sun crosses −0.833° altitude
  const sinDelta = Math.sin(lambda * RAD) * Math.sin(23.44 * RAD);
  const cosDelta = Math.sqrt(1 - sinDelta * sinDelta);
  const decl = Math.asin(sinDelta) / RAD;
  const latR = lat * RAD;
  const cosOmega = (Math.sin(-0.833 * RAD) - Math.sin(latR) * sinDelta) / (Math.cos(latR) * cosDelta);
  const noon = new Date(jdToUnix(Jtransit));
  if (Math.abs(cosOmega) > 1 || !Number.isFinite(cosOmega)) {
    const midnightSun = !Number.isFinite(cosOmega) ? Math.sin(latR) * sinDelta > 0 : cosOmega < -1;
    return { rise: null, set: null, noon, dayLenMin: midnightSun ? 1440 : 0, decl, polar: midnightSun ? "midnight sun" : "polar night" };
  }
  const omega = Math.acos(cosOmega) / RAD;
  return {
    rise: new Date(jdToUnix(Jtransit - omega / 360)),
    set: new Date(jdToUnix(Jtransit + omega / 360)),
    noon,
    dayLenMin: ((2 * omega) / 15) * 60,
    decl,
    polar: null,
  };
}

function fmtClock(d: Date, tz: number): string {
  const t = new Date(d.getTime() + tz * 3600000);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}

const CITIES = [
  { name: "Karachi", lat: 24.8607, lng: 67.0011, tz: 5 },
  { name: "London", lat: 51.5074, lng: -0.1278, tz: 0 },
  { name: "New York", lat: 40.7128, lng: -74.006, tz: -5 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, tz: 9 },
];

export function SunTimesTool() {
  const A = accentOf(8);
  const [date, setDate] = useState(() => ymd(new Date()));
  const [lat, setLat] = useState("24.8607");
  const [lng, setLng] = useState("67.0011");
  const [tz, setTz] = useState("5");

  const d = parseYMD(date) ?? new Date();
  const latN = Math.max(-89.5, Math.min(89.5, num(lat)));
  const lngN = Math.max(-180, Math.min(180, num(lng)));
  const tzN = num(tz);
  const res = useMemo(() => sunTimes(d, latN, lngN), [d.getTime(), latN, lngN]);
  const city = CITIES.find((c) => Math.abs(c.lat - latN) < 0.01 && Math.abs(c.lng - lngN) < 0.01)?.name ?? "custom location";
  const tzLabel = `UTC${tzN >= 0 ? "+" : "−"}${Math.abs(tzN)}`;
  const summary =
    `Zyric sun report — ${fmtDate(d)}\n` +
    `${city} (${latN.toFixed(2)}°, ${lngN.toFixed(2)}°) · ${tzLabel}\n` +
    (res.polar
      ? `${res.polar[0].toUpperCase()}${res.polar.slice(1)} — the sun does not ${res.polar === "midnight sun" ? "set" : "rise"} today.\n`
      : `Sunrise ${fmtClock(res.rise as Date, tzN)} · Solar noon ${fmtClock(res.noon, tzN)} · Sunset ${fmtClock(res.set as Date, tzN)}\n`) +
    `Day length ${fmtHM(res.dayLenMin)} · Sun declination ${res.decl >= 0 ? "+" : ""}${res.decl.toFixed(2)}°\n` +
    "Computed on-device with NOAA solar equations.";

  return (
    <div className="space-y-4">
      <Grid cols={4}>
        <Field label="Date" value={date} onChange={setDate} type="date" />
        <Field label="Latitude (°, + = north)" value={lat} onChange={setLat} type="number" step={0.0001} />
        <Field label="Longitude (°, + = east)" value={lng} onChange={setLng} type="number" step={0.0001} />
        <Field label="UTC offset (h)" value={tz} onChange={setTz} type="number" step={0.5} hint="clock offset at the location" />
      </Grid>
      <Row>
        {CITIES.map((c) => (
          <Btn key={c.name} variant="ghost" accent={A} onClick={() => { setLat(String(c.lat)); setLng(String(c.lng)); setTz(String(c.tz)); }}>
            {c.name}
          </Btn>
        ))}
        <Tag accent={A}>{city}</Tag>
      </Row>
      <Grid cols={2}>
        <BigStat label="Sunrise" value={res.rise && !res.polar ? fmtClock(res.rise, tzN) : res.polar === "midnight sun" ? "↑ no set" : "—"} accent="#FFB347" hint={res.polar ? res.polar : "first light over the horizon"} />
        <BigStat label="Sunset" value={res.set && !res.polar ? fmtClock(res.set, tzN) : res.polar === "polar night" ? "↓ no rise" : "—"} accent="#FF7A3D" hint={res.polar ? res.polar : "sun dips below −0.833°"} />
      </Grid>
      <Panel title="solar details" accent={A}>
        <KV k="solar noon" v={`${fmtClock(res.noon, tzN)} — shadow-shortest moment`} accent={A} />
        <KV k="day length" v={fmtHM(res.dayLenMin)} />
        <KV k="sun declination" v={`${res.decl >= 0 ? "+" : ""}${res.decl.toFixed(2)}° · +23.44° midsummer, −23.44° midwinter`} />
        <KV k="equation of time baked in" v="yes — transit drifts ±16 min across the year" />
      </Panel>
      <Out label="copyable report" text={summary} />
      <Note>
        NOAA solar equations with the −0.833° horizon (refraction + solar radius), sea-level assumption — mountains and buildings shift real
        sunrise by minutes. Times render in the UTC offset you type (presets set standard time; add +1 manually during daylight saving).
      </Note>
    </div>
  );
}

function todayYMDLocal(): string {
  return ymd(new Date());
}

/* ============================== 10. Moon phase ============================== */

const SYNODIC = 29.53058867; // mean synodic month, days
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14); // known new moon: 2000-01-06 18:14 UTC
const PHASES = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];

export function MoonPhaseTool() {
  const A = accentOf(9);
  const [date, setDate] = useState(() => todayYMDLocal());
  const d = parseYMD(date) ?? new Date();
  const ageRaw = ((d.getTime() - NEW_MOON_REF) / 86400000) % SYNODIC;
  const age = (ageRaw + SYNODIC) % SYNODIC;
  const p = age / SYNODIC;
  const illum = (1 - Math.cos(2 * Math.PI * p)) / 2;
  const idx = Math.floor(p * 8 + 0.5) % 8;
  const waxing = p <= 0.5;

  // CSS moon: a lit disc with a shadow disc sliding across it.
  const R = 64;
  const cover = (p <= 0.5 ? 4 * R * p : 4 * R * (1 - p)); // 0 = fully dark, 2R = fully lit
  const dx = (waxing ? -1 : 1) * cover;

  const toFull = ((SYNODIC / 2 - age) % SYNODIC + SYNODIC) % SYNODIC || SYNODIC;
  const toNew = (SYNODIC - age) % SYNODIC || SYNODIC;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Date" value={date} onChange={setDate} type="date" className="flex-1" />
        <Tag accent={A}>{waxing ? "waxing →" : "← waning"}</Tag>
      </Row>
      <div className="flex flex-col items-center gap-6 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8 sm:flex-row sm:justify-center sm:gap-12">
        <div
          className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border border-zinc-700"
          style={{ background: "#e9e5da", boxShadow: `0 0 60px ${A}22, inset -6px -8px 18px rgba(0,0,0,0.25)` }}
          role="img"
          aria-label={`${PHASES[idx]}, ${fmt(illum * 100, 0)} percent illuminated`}
        >
          <span className="absolute rounded-full bg-black/10" style={{ left: "22%", top: "24%", width: 18, height: 18 }} />
          <span className="absolute rounded-full bg-black/10" style={{ left: "58%", top: "50%", width: 13, height: 13 }} />
          <span className="absolute rounded-full bg-black/10" style={{ left: "34%", top: "64%", width: 9, height: 9 }} />
          <span
            className="absolute inset-0 rounded-full transition-transform duration-500"
            style={{ background: "#0b0a09", transform: `translateX(${dx}px)` }}
          />
        </div>
        <div className="text-center sm:text-left">
          <p className="mono-kicker text-zinc-500">phase</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{PHASES[idx]}</p>
          <p className="mt-2 font-mono text-xs text-zinc-500">{waxing ? "growing toward full" : "shrinking toward new"}</p>
        </div>
      </div>
      <Grid cols={3}>
        <BigStat label="Illumination" value={pct(illum * 100, 1)} accent={A} hint="of the visible disc" />
        <BigStat label="Moon age" value={fmt(age, 1)} unit="days" accent="#7FC8FF" hint="since the last new moon" />
        <BigStat label="Lunar day" value={`day ${Math.floor(age) + 1} / ${Math.ceil(SYNODIC)}`} accent="#FF9DE2" hint="one synodic month ≈ 29.53 d" />
      </Grid>
      <Panel title="what comes next" accent={A}>
        <KV k="next full moon" v={`${fmtDate(addDays(d, Math.round(toFull)))} · in ${fmt(toFull, 1)} d`} accent={A} />
        <KV k="next new moon" v={`${fmtDate(addDays(d, Math.round(toNew)))} · in ${fmt(toNew, 1)} d`} />
        <KV k="synodic month used" v={`${SYNODIC} days (mean)`} />
        <KV k="phase fraction" v={`${fmt(p * 100, 1)}% through the cycle`} />
      </Panel>
      <Note>
        Drawn with two overlapping CSS circles — the shadow disc slides across the lit one. Times are the classic mean-synodic approximation
        (±0.5 day vs true orbit; the Moon&apos;s ellipse wobbles it). Northern-hemisphere view: waxing lights the right side.
      </Note>
    </div>
  );
}

/* ============================== 11. Weekday finder ========================== */

function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7; // Mon = 0
  t.setUTCDate(t.getUTCDate() - day + 3); // shift to that week's Thursday
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const fday = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - fday + 3);
  return 1 + Math.round((t.getTime() - firstThu.getTime()) / (7 * 86400000));
}

export function WeekdayFinderTool() {
  const A = accentOf(10);
  const [date, setDate] = useState(() => todayYMDLocal());
  const [n, setN] = useState("30");
  const today = new Date();
  const d = parseYMD(date);
  const delta = d ? daysBetween(today, d) : null;
  const doy = d ? Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) / 86400000) + 1 : 0;
  const leap = d ? (d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || d.getFullYear() % 400 === 0 : false;
  const dim = d ? new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() : 0;
  const nn = Math.round(num(n));
  const target = addDays(today, nn);

  return (
    <div className="space-y-4">
      <Field label="Any date" value={date} onChange={setDate} type="date" />
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 py-7 text-center">
        <p className="mono-kicker text-zinc-500">that lands on a</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{d ? WEEKDAYS[d.getDay()] : "—"}</p>
        {delta !== null ? (
          <p className="mt-1 font-mono text-xs text-zinc-600">
            {delta === 0 ? "today" : delta > 0 ? `${delta} days from today` : `${-delta} days ago`}
          </p>
        ) : null}
      </div>
      <Grid cols={3}>
        <BigStat label="ISO week number" value={d ? isoWeek(d) : "—"} accent="#7FC8FF" hint="ISO-8601, weeks start Monday" />
        <BigStat label="Day of year" value={d ? doy : "—"} accent="#5EE39A" hint={d ? `${doy}/${leap ? 366 : 365}` : undefined} />
        <BigStat label="Quarter" value={d ? `Q${Math.floor(d.getMonth() / 3) + 1}` : "—"} accent="#FF9DE2" hint={d ? `${d.getFullYear()}` : undefined} />
      </Grid>
      <Panel title="date dossier" accent={A}>
        <KV k="full weekday" v={d ? WEEKDAYS[d.getDay()] : "—"} accent={A} />
        <KV k="ISO-8601 date" v={d ? ymd(d) : "—"} />
        <KV k="days in month" v={d ? `${dim}` : "—"} />
        <KV k="leap year" v={d ? (leap ? "yes" : "no") : "—"} />
        <KV k="unix timestamp" v={d ? String(Math.floor(d.getTime() / 1000)) : "—"} />
      </Panel>
      <Panel title="quick shift — N days from today" accent={A}>
        <Field label="N (negative goes back)" value={n} onChange={setN} type="number" className="max-w-[220px]" />
        <div className="mt-2">
          <KV k={`today ${nn >= 0 ? "+" : "−"} ${Math.abs(nn)} days`} v={fmtDate(target)} accent={A} />
          <KV k="weekday" v={WEEKDAYS[target.getDay()]} />
          <KV k="ISO week" v={isoWeek(target)} />
        </div>
      </Panel>
      <Note>
        ISO-8601 weeks run Monday–Sunday and week 1 is the one containing the year&apos;s first Thursday — so Dec 29 can already be week 1 of next
        year. All math runs on your device&apos;s calendar, no network.
      </Note>
    </div>
  );
}

/* ============================== 12. Electricity cost ======================== */

const APPLIANCES: [string, number, number][] = [
  ["AC", 1500, 6],
  ["Fridge", 150, 24],
  ["PC + monitor", 400, 8],
  ["LED bulb", 10, 5],
  ["TV", 100, 4],
  ["Kettle", 2000, 0.5],
  ["Washer", 500, 1],
  ["Fan", 75, 8],
];

export function ElectricityCostTool() {
  const A = accentOf(11);
  const [watts, setWatts] = useState("1500");
  const [hpd, setHpd] = useState("6");
  const [dpm, setDpm] = useState("30");
  const [rate, setRate] = useState("0.15");

  const W = num(watts);
  const H = num(hpd);
  const D = num(dpm);
  const R = num(rate);
  const kwhDay = (W * H) / 1000;
  const kwhMo = kwhDay * D;
  const costDay = kwhDay * R;
  const costMo = kwhMo * R;
  const costYr = costMo * 12;
  const cost247 = ((W * 24) / 1000) * R * D;

  return (
    <div className="space-y-4">
      <Panel title="appliance presets — tap to load" accent={A}>
        <div className="flex flex-wrap gap-2">
          {APPLIANCES.map(([name, w, h]) => (
            <Chip key={name} label={`${name} · ${w}W`} accent={A} onClick={() => { setWatts(String(w)); setHpd(String(h)); }} />
          ))}
        </div>
      </Panel>
      <Grid cols={4}>
        <Field label="Power (watts)" value={watts} onChange={setWatts} type="number" />
        <Field label="Hours / day" value={hpd} onChange={setHpd} type="number" step={0.5} />
        <Field label="Days / month" value={dpm} onChange={setDpm} type="number" />
        <Field label="Rate per kWh" value={rate} onChange={setRate} type="number" step={0.01} hint="check your bill" />
      </Grid>
      <Grid cols={3}>
        <BigStat label="Per day" value={money(costDay)} accent="#7FC8FF" hint={`${fmt(kwhDay, 2)} kWh`} />
        <BigStat label="Per month" value={money(costMo)} accent={A} hint={`${fmt(kwhMo, 1)} kWh`} />
        <BigStat label="Per year" value={money(costYr)} accent="#FF9DE2" hint={`${fmt(kwhMo * 12, 0)} kWh`} />
      </Grid>
      <Meter value={costMo} max={Math.max(costMo, cost247)} accent={A} label="usage vs running it 24/7" right={cost247 > 0 ? pct((costMo / cost247) * 100, 0) : "—"} />
      <Panel title="unit economics" accent={A}>
        <KV k="cost per hour of use" v={money((W / 1000) * R)} />
        <KV k="energy per day" v={`${fmt(kwhDay, 2)} kWh`} />
        <KV k="if it ran 24/7" v={`${money(cost247)}/mo`} accent="#FF8A7A" />
        <KV k="1 kWh = 1,000 W for 1 h" v={`= ${money(R)}`} />
        <KV k="yearly at 24/7" v={money(cost247 * 12)} accent="#FF8A7A" />
      </Panel>
      <Note>
        Nameplate watts overstate reality for fridges and ACs (compressors cycle), so treat those as estimates. Context: a 10W LED bulb for 5 h/day
        costs pennies a month, while a 1500W AC at 6 h/day can outpay the fridge thirty-fold — the big numbers live with the big watts.
      </Note>
    </div>
  );
}

/* ============================== 13. APY ↔ APR =============================== */

type AaDir = "apr2apy" | "apy2apr";
type AaFreq = "1" | "4" | "12" | "365";
const FREQS: [AaFreq, string][] = [
  ["365", "Daily"],
  ["12", "Monthly"],
  ["4", "Quarterly"],
  ["1", "Yearly"],
];

export function ApyAprTool() {
  const A = accentOf(12);
  const [dir, setDir] = useState<AaDir>("apr2apy");
  const [freq, setFreq] = useState<AaFreq>("12");
  const [rate, setRate] = useState("5");

  const n = Number(freq);
  const r = num(rate) / 100;
  const apr = dir === "apr2apy" ? r : n * (Math.pow(1 + r, 1 / n) - 1);
  const apy = Math.pow(1 + apr / n, n) - 1;
  const gap = (apy - apr) * 100;

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Seg
              value={dir}
              onChange={setDir}
              accent={A}
              options={[
                { v: "apr2apy" as const, label: "APR → APY" },
                { v: "apy2apr" as const, label: "APY → APR" },
              ]}
            />
            <Seg value={freq} onChange={setFreq} accent={A} options={FREQS.map(([v, label]) => ({ v, label }))} />
            <Field
              label={dir === "apr2apy" ? "Nominal APR %" : "Effective APY %"}
              value={rate}
              onChange={setRate}
              type="number"
              step={0.01}
              hint={dir === "apr2apy" ? "the rate in the loan contract" : "the yield the bank advertises"}
            />
          </div>
        }
        right={
          <div className="space-y-3">
            <BigStat
              label={dir === "apr2apy" ? "Effective APY" : "Nominal APR"}
              value={pct((dir === "apr2apy" ? apy : apr) * 100, 3)}
              accent={A}
              hint={`compounded ${FREQS.find(([v]) => v === freq)?.[1].toLowerCase()}`}
            />
            <BigStat label="Nominal ↔ effective gap" value={`${gap >= 0 ? "+" : ""}${fmt(gap, 3)} pp`} accent={Math.abs(gap) > 0.001 ? "#FF8A7A" : "#71717a"} hint="percentage points the compounding adds" />
            <Meter value={Math.abs(gap)} max={Math.max(0.6, Math.abs(gap) * 1.2)} accent="#FF8A7A" label="gap size (5% at daily ≈ +0.13 pp)" right={`${fmt(gap, 3)} pp`} />
          </div>
        }
      />
      <Panel title={`the same nominal ${pct(apr * 100, 2)} APR, compounded differently`} accent={A}>
        {FREQS.map(([v, label]) => {
          const n2 = Number(v);
          const apy2 = Math.pow(1 + apr / n2, n2) - 1;
          const on = v === freq;
          return <KV key={v} k={`${label.toLowerCase()} (n=${n2})`} v={pct(apy2 * 100, 3)} accent={on ? A : undefined} />;
        })}
        <KV k="continuous (e^(r)−1, for fun)" v={pct((Math.exp(apr) - 1) * 100, 3)} />
      </Panel>
      <Note>
        APR is the nominal yearly rate; APY (EAR) is what you actually feel once compounding kicks in. At 5%: yearly compounding stays 5.000%, monthly
        becomes 5.116%, daily 5.127%. Borrowers want small gaps, savers want big ones — now you can check both sides of the same coin.
      </Note>
    </div>
  );
}

/* ============================== 14. Rule of 72 ============================== */

type R72Mode = "rate" | "goal";
type R72Method = "simple" | "precise";
const R72_RATES = Array.from({ length: 15 }, (_, i) => i + 1);

export function Rule72Tool() {
  const A = accentOf(13);
  const [mode, setMode] = useState<R72Mode>("rate");
  const [method, setMethod] = useState<R72Method>("precise");
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState("10");

  const rr = num(years);
  const yearsToDouble = method === "simple" ? 72 / rate : Math.log(2) / Math.log(1 + rate / 100);
  const requiredRate = method === "simple" ? 72 / rr : (Math.pow(2, 1 / Math.max(rr, 0.01)) - 1) * 100;
  const yearsToTriple = method === "simple" ? 115 / rate : Math.log(3) / Math.log(1 + rate / 100);

  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={mode}
          onChange={setMode}
          accent={A}
          options={[
            { v: "rate" as const, label: "Rate → years to double" },
            { v: "goal" as const, label: "Years → rate needed" },
          ]}
        />
        <Seg
          value={method}
          onChange={setMethod}
          accent={A}
          options={[
            { v: "simple" as const, label: "Rule of 72" },
            { v: "precise" as const, label: "Precise ln math" },
          ]}
        />
      </Row>
      {mode === "rate" ? (
        <Slider label="Annual growth rate" value={rate} onChange={setRate} min={0.5} max={20} step={0.25} suffix="%" accent={A} />
      ) : (
        <Field label="I want my money to double in (years)" value={years} onChange={setYears} type="number" className="max-w-[260px]" />
      )}
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-7">
        <p className="mono-kicker text-zinc-500">{mode === "rate" ? "your money doubles in" : "you need this annual rate"}</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>
          {mode === "rate" ? `${fmt(yearsToDouble, 2)} y` : pct(requiredRate, 2)}
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-600">
          {mode === "rate"
            ? `${method === "simple" ? "72 ÷ " + rate : "ln2 ÷ ln(1+" + rate / 100 + ")"}`
            : `${method === "simple" ? "72 ÷ " + rr : "2^(1/" + rr + ") − 1"}`}
        </p>
      </div>
      {mode === "rate" ? (
        <Grid cols={3}>
          <BigStat label="Years to triple" value={`${fmt(yearsToTriple, 2)} y`} accent="#7FC8FF" hint={method === "simple" ? "rule of 115" : "ln3 ÷ ln(1+r)"} />
          <BigStat label="Doublings in 30 y" value={fmt(30 / Math.max(yearsToDouble, 0.01), 1)} accent="#5EE39A" hint="×2 every cycle" />
          <BigStat label="1,000 becomes" value={fmt(1000 * Math.pow(2, 30 / Math.max(yearsToDouble, 0.01)), 0)} accent="#FF9DE2" hint="after 30 years of that rate" />
        </Grid>
      ) : (
        <Grid cols={2}>
          <BigStat label="Sanity check — doubling at that rate" value={`${fmt(method === "simple" ? 72 / requiredRate : Math.log(2) / Math.log(1 + requiredRate / 100), 2)} y`} accent="#7FC8FF" />
          <BigStat label="vs Rule-of-72 answer" value={pct(72 / rr, 2)} accent="#FF9DE2" hint="what the mental shortcut says" />
        </Grid>
      )}
      <Panel title="cheat sheet — 1% to 15%" accent={A}>
        <div className="max-h-72 overflow-y-auto rounded-md border border-zinc-800">
          <div className="sticky top-0 grid grid-cols-3 gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-1.5">
            <span className="mono-kicker text-zinc-500">rate</span>
            <span className="mono-kicker text-right text-zinc-500">72 ÷ r</span>
            <span className="mono-kicker text-right text-zinc-500">precise</span>
          </div>
          {R72_RATES.map((r2) => {
            const on = Math.abs(r2 - (mode === "rate" ? rate : requiredRate)) < 0.5;
            return (
              <div key={r2} className={`grid grid-cols-3 gap-2 px-3 py-1.5 font-mono text-xs ${on ? "bg-zinc-800/60" : ""}`}>
                <span className="text-zinc-300">{r2}%</span>
                <span className="text-right text-zinc-500">{fmt(72 / r2, 2)} y</span>
                <span className="text-right" style={{ color: on ? A : "#a1a1aa" }}>{fmt(Math.log(2) / Math.log(1 + r2 / 100), 2)} y</span>
              </div>
            );
          })}
        </div>
      </Panel>
      <Note>
        Rule of 72 is a 400-year-old mental-math hack — exact at 8% (9 years), decent between 4–15%, and it slowly over-promises at high rates (20%:
        shortcut says 3.6 y, truth is 3.8). The precise column is ln(2)/ln(1+r); the inverse is the compound-interest power move — want to double in
        6 years? You need ~12.2%, not 12%.
      </Note>
    </div>
  );
}

/* ============================== meta registry =============================== */

export const calcPlusMeta: ToolMeta[] = [
  {
    id: "calorie-deficit",
    name: "Calorie Deficit Calculator",
    description: "TDEE from your stats, pick a weekly loss pace, get the daily kcal target — with safety floors.",
    category: "calculators",
    icon: Flame,
    keywords: "calorie deficit tdee bmr weight loss kcal mifflin st jeor calculator",
    badge: "new",
    component: CalorieDeficitTool,
  },
  {
    id: "ovulation",
    name: "Ovulation Calculator",
    description: "Last period + cycle length → fertile window, ovulation day and next period, drawn on a live cycle strip.",
    category: "calculators",
    icon: CalendarHeart,
    keywords: "ovulation fertile window period cycle tracker pregnancy calendar calculator",
    badge: "new",
    component: OvulationTool,
  },
  {
    id: "pregnancy-week",
    name: "Pregnancy Week Calculator",
    description: "LMP date → current week + days, trimester progress meters, due date and days remaining.",
    category: "calculators",
    icon: Baby,
    keywords: "pregnancy week due date trimester lmp naegele gestational calculator",
    badge: "new",
    component: PregnancyWeekTool,
  },
  {
    id: "timesheet",
    name: "Timesheet Calculator",
    description: "Clock in/out rows with breaks → daily hours, weekly total and overtime against your threshold.",
    category: "calculators",
    icon: ClipboardList,
    keywords: "timesheet hours worked overtime weekly payroll shift calculator",
    badge: "new",
    component: TimesheetTool,
  },
  {
    id: "raise-amount",
    name: "Raise Calculator",
    description: "New salary by % or amount → yearly, monthly and hourly gains plus the 5-year compounding total.",
    category: "calculators",
    icon: TrendingUp,
    keywords: "raise salary increase percent hourly yearly pay bump calculator",
    badge: "new",
    component: RaiseAmountTool,
  },
  {
    id: "markup",
    name: "Markup & Margin Solver",
    description: "Give any two of cost, price, margin % → the full trio plus markup %. Markup ≠ margin, finally clear.",
    category: "calculators",
    icon: Percent,
    keywords: "markup margin cost price profit pricing solver calculator",
    badge: "new",
    component: MarkupMarginTool,
  },
  {
    id: "cpm",
    name: "CPM Calculator",
    description: "Any two of spend, impressions, CPM → the third, with preset channel sizes for quick media budgets.",
    category: "calculators",
    icon: MousePointerClick,
    keywords: "cpm impressions advertising cost per mille media budget ads calculator",
    badge: "new",
    component: CpmTool,
  },
  {
    id: "churn-ltv",
    name: "Churn & LTV Analyzer",
    description: "Customers, churn %, ARPU → monthly losses, average lifetime, LTV and the LTV:CAC verdict badge.",
    category: "calculators",
    icon: Users,
    keywords: "churn ltv cac arpu retention saas lifetime value calculator",
    badge: "new",
    component: ChurnLtvTool,
  },
  {
    id: "sun-times",
    name: "Sunrise & Sunset Calculator",
    description: "NOAA-precision sunrise, sunset, day length and solar noon for any date, latitude and longitude.",
    category: "calculators",
    icon: Sunrise,
    keywords: "sunrise sunset solar noon day length declination noaa sun calculator",
    badge: "new",
    component: SunTimesTool,
  },
  {
    id: "moon-phase",
    name: "Moon Phase Now",
    description: "Phase name, illumination % and moon age for any date — drawn live with pure CSS circles.",
    category: "calculators",
    icon: Moon,
    keywords: "moon phase lunar full moon new moon illumination calendar",
    badge: "new",
    component: MoonPhaseTool,
  },
  {
    id: "weekday-finder",
    name: "Weekday Finder",
    description: "Weekday, ISO week number, day-of-year for any date, plus an N-days-from-today converter.",
    category: "calculators",
    icon: CalendarDays,
    keywords: "weekday day of year iso week number calendar date finder calculator",
    badge: "new",
    component: WeekdayFinderTool,
  },
  {
    id: "electricity-cost",
    name: "Appliance Electricity Cost",
    description: "Watts × hours × your tariff → daily, monthly and yearly running cost for any appliance.",
    category: "calculators",
    icon: Zap,
    keywords: "electricity cost appliance watts kwh energy bill running cost calculator",
    badge: "new",
    component: ElectricityCostTool,
  },
  {
    id: "apy-apr",
    name: "APY ↔ APR Converter",
    description: "Two-way APY/APR conversion across daily, monthly, quarterly and yearly compounding — see the real yield.",
    category: "calculators",
    icon: ArrowLeftRight,
    keywords: "apy apr ear effective nominal interest compound conversion calculator",
    badge: "new",
    component: ApyAprTool,
  },
  {
    id: "rule-72",
    name: "Doubling Time (Rule of 72)",
    description: "Years to double at any rate — Rule of 72 vs precise log math, with an inverse goal-seeking mode.",
    category: "calculators",
    icon: Repeat,
    keywords: "rule of 72 doubling time compound interest investment years calculator",
    badge: "new",
    component: Rule72Tool,
  },
];
