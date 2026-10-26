"use client";

/* ==========================================================================
   KIT: TEACHERS & CLASSROOM — 9 planning machines for school & campus life.
   Trips, parties, reading groups, exam pacing, thesis defence, fundraisers,
   society events, lab rotas and fair group marks. One accent per tool, real
   maths, everything computed client-side. Part of the zyric.tech fleet.
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  BookOpen,
  Bus,
  Cake,
  DollarSign,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Ticket,
  Timer,
} from "lucide-react";
import {
  Area,
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

const WARN = "#FFB020";
const GOOD = "#5EE39A";
const BAD = "#FF8A7A";

/** Field string → safe number with a fallback. */
function num(v: string, fb: number): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : fb;
}

/** seconds → "m:ss" (or "h:mm:ss" past an hour). */
function mmss(sec: number): string {
  if (!Number.isFinite(sec)) return "—";
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const two = (x: number) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(r)}` : `${m}:${two(r)}`;
}

/** "HH:MM" start + offset seconds → wall clock "HH:MM". */
function clockAt(start: string, sec: number): string {
  const p = start.split(":").map((x) => parseInt(x, 10));
  if (p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return "—";
  const total = p[0] * 60 + p[1] + Math.round(sec / 60);
  const day = Math.floor(total / 1440);
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}${day > 0 ? ` +${day}d` : ""}`;
}

/** money that never prints "$-4.00". */
function cash(n: number): string {
  return n < 0 ? `−${money(-n)}` : money(n);
}

/** "Group A, Group B" (or blank) → exactly `count` names. */
function parseGroups(raw: string, count: number): string[] {
  const parsed = raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push((parsed[i] || `Group ${String.fromCharCode(65 + (i % 26))}`).slice(0, 14));
  }
  return out;
}

const nowHM = () => new Date().toTimeString().slice(0, 5);

/* ---------------------------- 1. Field trip cost --------------------------- */

export function FieldTripPlanner() {
  const A = accentOf(0);
  const [students, setStudents] = useState("28");
  const [adults, setAdults] = useState("3");
  const [ratio, setRatio] = useState("10");
  const [busCap, setBusCap] = useState("60");
  const [busPrice, setBusPrice] = useState("180");
  const [sAdm, setSAdm] = useState("8");
  const [aAdm, setAAdm] = useState("12");
  const [freeAdults, setFreeAdults] = useState("2");
  const [subsidy, setSubsidy] = useState("50");

  const S = Math.max(0, num(students, 28));
  const AD = Math.max(0, num(adults, 3));
  const N = Math.max(1, num(ratio, 10));
  const cap = Math.max(1, num(busCap, 60));
  const perBus = Math.max(0, num(busPrice, 180));
  const sAd = Math.max(0, num(sAdm, 8));
  const aAd = Math.max(0, num(aAdm, 12));
  const free = Math.max(0, num(freeAdults, 2));
  const sub = Math.max(0, num(subsidy, 50));

  const plan = (studs: number) => {
    const req = Math.ceil(studs / N);
    const buses = Math.ceil((studs + AD) / cap);
    const transport = buses * perBus;
    const paidAdults = Math.max(0, Math.min(AD, req) - free);
    const admissions = studs * sAd + paidAdults * aAd;
    const total = transport + admissions;
    return {
      req,
      buses,
      transport,
      paidAdults,
      admissions,
      total,
      per: studs > 0 ? (total - sub) / studs : 0,
    };
  };
  const main = plan(S);
  const drop = plan(Math.max(0, S - 3));
  const understaffed = AD < main.req;

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="who is going" accent={A} className="h-full">
            <Row>
              <Field label="Students" value={students} onChange={setStudents} type="number" min={0} className="w-24" />
              <Field label="Adults attending" value={adults} onChange={setAdults} type="number" min={0} className="w-24" />
              <Field label="1 adult per" value={ratio} onChange={setRatio} type="number" min={1} className="w-20" hint="students" />
            </Row>
            <Row className="mt-3">
              <Field label="Bus seats" value={busCap} onChange={setBusCap} type="number" min={1} className="w-24" />
              <Field label="Cost per bus" value={busPrice} onChange={setBusPrice} type="number" min={0} className="w-28" />
            </Row>
          </Panel>
        }
        right={
          <Panel title="tickets & money" accent={A} className="h-full">
            <Row>
              <Field label="Student admission" value={sAdm} onChange={setSAdm} type="number" min={0} step={0.5} className="w-28" />
              <Field label="Adult admission" value={aAdm} onChange={setAAdm} type="number" min={0} step={0.5} className="w-28" />
            </Row>
            <Row className="mt-3">
              <Field label="Free adult places" value={freeAdults} onChange={setFreeAdults} type="number" min={0} className="w-28" hint="e.g. 1 per 10 paying" />
              <Field label="Subsidy pot" value={subsidy} onChange={setSubsidy} type="number" min={0} className="w-28" hint="taken off the total" />
            </Row>
          </Panel>
        }
      />

      <Grid cols={3}>
        <BigStat label="Buses needed" value={main.buses} unit={`× ${fmt(cap, 0)} seats`} accent={A} hint={`${money(main.transport)} transport`} />
        <BigStat
          label="Adults required"
          value={main.req}
          unit={`1 : ${fmt(N, 0)}`}
          accent={understaffed ? WARN : A}
          hint={understaffed ? `you have ${fmt(AD, 0)} — recruit more` : `${fmt(AD, 0)} attending ✓`}
        />
        <BigStat label="Per student" value={cash(main.per)} accent={A} hint={sub > 0 ? `subsidy −${money(sub)} applied` : "before any subsidy"} />
      </Grid>

      {understaffed ? <Tag accent={WARN}>understaffed — ratio 1:{fmt(N, 0)} needs {main.req} adults, you have {fmt(AD, 0)}</Tag> : null}

      <Panel title="cost breakdown" accent={A}>
        <KV k={`Buses (${main.buses} × ${money(perBus)})`} v={money(main.transport)} />
        <KV k={`Student admissions × ${fmt(S, 0)}`} v={money(S * sAd)} />
        <KV k={`Paid adult admissions × ${fmt(main.paidAdults, 0)}`} v={money(main.paidAdults * aAd)} />
        <KV k="Total cost" v={money(main.total)} accent={A} />
        {sub > 0 ? <KV k="Subsidy" v={`−${money(sub)}`} accent={GOOD} /> : null}
        <KV k="Per student" v={cash(main.per)} accent={A} />
      </Panel>

      <Panel title="what if 3 drop out" accent={A}>
        <KV k="Students" v={`${fmt(Math.max(0, S - 3), 0)} (from ${fmt(S, 0)})`} />
        <KV k="Buses" v={`${drop.buses} (from ${main.buses})`} />
        <KV k="3 fewer students → per-student" v={cash(drop.per)} accent={drop.per < main.per ? GOOD : undefined} />
        <KV k="Saving per student" v={main.per - drop.per > 0.005 ? money(main.per - drop.per) : "nothing — bus cost dominates"} accent={GOOD} />
        <Note>Buses are the step cost: losing 3 students only saves real money if it frees a whole bus or lets an adult stay home.</Note>
      </Panel>
    </div>
  );
}

/* --------------------------- 2. Class party snacks ------------------------- */

type Allergen = "none" | "nuts" | "gluten" | "dairy";
type Snack = { name: string; pack: string; price: string; allergen: Allergen };

const ALLERGEN_OPTS: readonly { v: Allergen; label: string }[] = [
  { v: "none", label: "none" },
  { v: "nuts", label: "nuts" },
  { v: "gluten", label: "gluten" },
  { v: "dairy", label: "dairy" },
];
const ALLERGEN_WORD: Record<Allergen, string> = { none: "", nuts: "nut-free", gluten: "gluten-free", dairy: "dairy-free" };

export function ClassPartySnacks() {
  const A = accentOf(1);
  const [kids, setKids] = useState("24");
  const [adults, setAdults] = useState("2");
  const [minutes, setMinutes] = useState("45");
  const [budget, setBudget] = useState("40");
  const [nutFree, setNutFree] = useState("2");
  const [glutenFree, setGlutenFree] = useState("1");
  const [dairyFree, setDairyFree] = useState("0");
  const [target, setTarget] = useState(3);
  const [snacks, setSnacks] = useState<Snack[]>([
    { name: "Biscuits", pack: "20", price: "3.20", allergen: "gluten" },
    { name: "Fruit gummies", pack: "30", price: "2.80", allergen: "none" },
    { name: "Cheese crackers", pack: "16", price: "3.60", allergen: "dairy" },
  ]);
  const setSnack = (i: number, patch: Partial<Snack>) => setSnacks(snacks.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const kidsN = Math.max(0, num(kids, 24));
  const adultsN = Math.max(0, num(adults, 2));
  const heads = Math.max(1, kidsN + adultsN);
  const budgetN = Math.max(1, num(budget, 40));
  const minutesN = Math.max(0, num(minutes, 45));
  const needPieces = heads * target * 1.1;
  const share = needPieces / Math.max(1, snacks.length);

  const rows = snacks.map((s) => {
    const packN = Math.max(1, Math.round(num(s.pack, 1)));
    const priceN = Math.max(0, num(s.price, 0));
    const packs = Math.max(1, Math.ceil(share / packN));
    return { ...s, packN, packs, cost: packs * priceN, pieces: packs * packN };
  });
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalPacks = rows.reduce((a, r) => a + r.packs, 0);
  const totalPieces = rows.reduce((a, r) => a + r.pieces, 0);
  const perChild = totalPieces / heads;
  const spare = budgetN - totalCost;
  const over = spare < 0;
  const allergyCount = (a: Allergen) =>
    a === "nuts" ? Math.max(0, num(nutFree, 2)) : a === "gluten" ? Math.max(0, num(glutenFree, 1)) : a === "dairy" ? Math.max(0, num(dairyFree, 0)) : 0;

  const list = [
    `CLASS PARTY SHOPPING LIST`,
    `${heads} heads (${kidsN} kids + ${adultsN} adults) · ${fmt(minutesN, 0)}-min party`,
    `Target ${target} pieces/child +10% buffer → ${Math.ceil(needPieces)} pieces (~${fmt(share, 0)} per snack)`,
    ``,
    `SAFE FOR EVERYONE`,
    ...(rows.filter((r) => r.allergen === "none").map((r) => `  + ${r.name}: ${r.packs} packs × ${r.packN} = ${r.pieces} pieces · ${money(r.cost)}`)),
    ...(rows.every((r) => r.allergen !== "none") ? ["  (none — every snack carries an allergen)"] : []),
    ``,
    `ALLERGEN WATCH`,
    ...rows
      .filter((r) => r.allergen !== "none")
      .map((r) => {
        const c = allergyCount(r.allergen);
        return `  ! ${r.name} (${r.allergen}) — not for ${fmt(c, 0)} ${ALLERGEN_WORD[r.allergen]} ${c === 1 ? "child" : "children"} · ${r.packs} packs · ${money(r.cost)}`;
      }),
    ...(rows.every((r) => r.allergen === "none") ? ["  (no allergens flagged)"] : []),
    ``,
    `TOTAL: ${totalPacks} packs · ${money(totalCost)} vs ${money(budgetN)} budget → ${over ? `${money(-spare)} OVER` : `${money(spare)} spare`}`,
    `Pieces per child: ${totalPieces} ÷ ${heads} = ${fmt(perChild, 1)}`,
  ].join("\n");

  return (
    <div className="space-y-4">
      <Panel title="the class" accent={A}>
        <Row>
          <Field label="Children" value={kids} onChange={setKids} type="number" min={0} className="w-24" />
          <Field label="Adults" value={adults} onChange={setAdults} type="number" min={0} className="w-20" />
          <Field label="Party minutes" value={minutes} onChange={setMinutes} type="number" min={0} className="w-24" />
          <Field label="Budget" value={budget} onChange={setBudget} type="number" min={0} className="w-24" />
        </Row>
        <Row className="mt-3">
          <Field label="Nut-free kids" value={nutFree} onChange={setNutFree} type="number" min={0} className="w-24" />
          <Field label="Gluten-free" value={glutenFree} onChange={setGlutenFree} type="number" min={0} className="w-24" />
          <Field label="Dairy-free" value={dairyFree} onChange={setDairyFree} type="number" min={0} className="w-24" />
          <div className="w-44 min-w-0 pb-1">
            <Slider label="Pieces per child" value={target} onChange={setTarget} min={1} max={6} accent={A} />
          </div>
        </Row>
      </Panel>

      <Grid cols={3}>
        {rows.map((r, i) => (
          <div key={i} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="mono-kicker" style={{ color: A }}>
                SNACK {i + 1}
              </span>
              <Tag accent={r.allergen === "none" ? GOOD : WARN}>{r.allergen === "none" ? "safe" : r.allergen}</Tag>
            </div>
            <Field label="Name" value={r.name} onChange={(v) => setSnack(i, { name: v })} className="mb-2" />
            <Row>
              <Field label="Pack size" value={r.pack} onChange={(v) => setSnack(i, { pack: v })} type="number" min={1} className="w-20" />
              <Field label="Price / pack" value={r.price} onChange={(v) => setSnack(i, { price: v })} type="number" min={0} step={0.1} className="w-24" />
            </Row>
            <div className="mt-2">
              <Seg value={r.allergen} onChange={(v) => setSnack(i, { allergen: v })} options={ALLERGEN_OPTS} accent={A} />
            </div>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">
              buy {r.packs} × {r.packN} = {r.pieces} pcs · {money(r.cost)}
            </p>
          </div>
        ))}
      </Grid>

      <Grid cols={3}>
        <BigStat label="Packs to buy" value={totalPacks} accent={A} hint={`${totalPieces} pieces total`} />
        <BigStat label="Total cost" value={money(totalCost)} accent={A} hint={`${money(totalCost / Math.max(1, heads))} per head`} />
        <BigStat label="Budget left" value={cash(spare)} accent={over ? BAD : GOOD} hint={`of ${money(budgetN)}`} />
      </Grid>

      <Meter value={totalCost} max={budgetN} accent={over ? BAD : A} label="budget" right={`${money(totalCost)} / ${money(budgetN)}`} />
      {over ? <Tag accent={BAD}>over budget by {money(-spare)} — drop a snack or fundraise more</Tag> : null}

      <Split
        left={
          <Panel title="pieces maths" accent={A} className="h-full">
            <KV k="Heads" v={`${kidsN} kids + ${adultsN} adults = ${heads}`} />
            <KV k="Target per child" v={`${target} pieces`} />
            <KV k="Needed (+10% buffer)" v={`${fmt(needPieces, 0)} pieces → ~${fmt(share, 0)} per snack`} />
            <KV k="Actually bought" v={`${totalPieces} pieces`} accent={A} />
            <KV k="Pieces per child" v={fmt(perChild, 1)} accent={A} />
            <Note>The 10% buffer absorbs spillage, the bag that won't open, and the one child who eats four.</Note>
          </Panel>
        }
        right={<Out text={list} label="shopping list — copy for the parent chat" rows={16} />}
      />
    </div>
  );
}

/* --------------------------- 3. Reading rotations -------------------------- */

export function ReadingRotations() {
  const A = accentOf(2);
  const [groups, setGroups] = useState(4);
  const [stations, setStations] = useState(4);
  const [roundMin, setRoundMin] = useState(15);
  const [trans, setTrans] = useState(2);
  const [rounds, setRounds] = useState(4);
  const [teacher, setTeacher] = useState(1);
  const [nameRaw, setNameRaw] = useState("Group A, Group B, Group C, Group D");

  const names = useMemo(() => parseGroups(nameRaw, groups), [nameRaw, groups]);
  const totalMin = rounds * roundMin + Math.max(0, rounds - 1) * trans;
  const repeats = rounds > stations;
  const early = rounds < stations;
  const stationOpts = useMemo(
    () => Array.from({ length: stations }, (_, i) => ({ v: String(i + 1), label: `S${i + 1}` })),
    [stations],
  );
  /** cyclic: seat of group g in round r — no repeats until the cycle completes */
  const groupAt = (r: number, s: number): string | null => {
    for (let g = 0; g < groups; g++) if ((g + r) % stations === s) return names[g];
    return null;
  };
  const colW = 9;
  const sheet = [
    `READING ROTATIONS — ${groups} groups × ${stations} stations`,
    `Rounds: ${rounds} × ${roundMin} min + ${trans} min transitions ≈ ${fmt(totalMin, 0)} min total`,
    `★ teacher-led table: Station ${teacher}`,
    ``,
    "ROUND   ".padEnd(8) + Array.from({ length: stations }, (_, s) => `S${s + 1}${s + 1 === teacher ? "★" : ""}`.padEnd(colW)).join(""),
    ...Array.from({ length: rounds }, (_, r) =>
      `R${r + 1}`.padEnd(8) + Array.from({ length: stations }, (_, s) => (groupAt(r, s) ?? "—").slice(0, 8).padEnd(colW)).join(""),
    ),
    ...(repeats ? ["", `Note: ${rounds} rounds > ${stations} stations — the cycle repeats.`] : []),
  ].join("\n");

  return (
    <div className="space-y-4">
      <Panel title="session shape" accent={A}>
        <Grid cols={2}>
          <Slider label="Groups" value={groups} onChange={setGroups} min={2} max={8} accent={A} />
          <Slider
            label="Stations"
            value={stations}
            onChange={(v) => {
              setStations(v);
              setRounds(v);
              setTeacher((t) => Math.min(t, v));
            }}
            min={2}
            max={8}
            accent={A}
          />
          <Slider label="Minutes per round" value={roundMin} onChange={setRoundMin} min={5} max={30} suffix=" min" accent={A} />
          <Slider label="Transition between rounds" value={trans} onChange={setTrans} min={0} max={5} suffix=" min" accent={A} />
          <Slider label="Rounds to run" value={rounds} onChange={setRounds} min={1} max={8} accent={A} />
          <div className="min-w-0 self-end pb-1">
            <span className="mono-kicker mb-1.5 block text-zinc-500">Teacher-led table</span>
            <Seg value={String(teacher)} onChange={(v) => setTeacher(Number(v))} options={stationOpts} accent={A} />
          </div>
        </Grid>
        <div className="mt-3">
          <Area label="Group names (comma separated)" rows={2} value={nameRaw} onChange={setNameRaw} />
        </div>
      </Panel>

      <Grid cols={3}>
        <BigStat label="Session length" value={fmt(totalMin, 0)} unit="min" accent={A} hint={`rounds of ${roundMin} + ${trans} min`} />
        <BigStat label="Full cycle" value={stations} unit="rounds" accent={A} hint={`you scheduled ${rounds}`} />
        <BigStat label="Rounds run" value={rounds} accent={A} hint={repeats ? "cycle repeats" : early ? `ends ${stations - rounds} early` : "exactly one cycle"} />
      </Grid>

      {early ? <Tag accent={WARN}>schedule ends before the cycle completes — some stations stay unseen by some groups</Tag> : null}

      <Panel title="live timetable" accent={A} right={<Tag accent={A}>★ = teacher table</Tag>}>
        <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60">
          <div className="grid text-[10px]" style={{ gridTemplateColumns: `44px repeat(${stations}, minmax(0, 1fr))` }}>
            <div className="border-b border-r border-zinc-800 px-1 py-1.5 text-center font-mono text-zinc-600">rnd</div>
            {Array.from({ length: stations }, (_, s) => (
              <div
                key={`h${s}`}
                className={`min-w-0 truncate border-b border-zinc-800 px-1 py-1.5 text-center font-mono font-bold uppercase tracking-wide ${s < stations - 1 ? "border-r" : ""} ${
                  s + 1 === teacher ? "text-zinc-100" : "text-zinc-500"
                }`}
                style={s + 1 === teacher ? { background: `${A}14` } : undefined}
              >
                S{s + 1}
                {s + 1 === teacher ? " ★" : ""}
              </div>
            ))}
            {Array.from({ length: rounds }, (_, r) => [
              <div key={`l${r}`} className="border-b border-r border-zinc-800 px-1 py-2 text-center font-mono text-zinc-500">
                R{r + 1}
              </div>,
              ...Array.from({ length: stations }, (_, s) => {
                const g = groupAt(r, s);
                return (
                  <div
                    key={`${r}-${s}`}
                    className={`min-w-0 border-b border-zinc-800 px-1 py-2 text-center ${s < stations - 1 ? "border-r" : ""}`}
                    style={s + 1 === teacher ? { background: `${A}14` } : undefined}
                  >
                    <span className="block truncate text-zinc-200">{g ?? "—"}</span>
                  </div>
                );
              }),
            ]).flatMap((row) => row)}
          </div>
        </div>
      </Panel>

      <Out text={sheet} label="printable rotation sheet" rows={13} />

      <Note>
        Seat = (group + round) mod {stations} — no group repeats a station before completing the cycle
        {repeats ? "; with more rounds than stations the pattern simply cycles round again." : "."} Swap the ★ column to whichever table you actually run.
      </Note>
    </div>
  );
}

/* --------------------------- 4. Exam time-per-mark ------------------------- */

type QGroup = { marks: string; count: string };

export function ExamTimePerMark() {
  const A = accentOf(3);
  const [minutes, setMinutes] = useState("90");
  const [reserve, setReserve] = useState("10");
  const [start, setStart] = useState(nowHM);
  const [groups, setGroups] = useState<QGroup[]>([
    { marks: "2", count: "10" },
    { marks: "5", count: "6" },
    { marks: "10", count: "3" },
  ]);
  const setGroup = (i: number, patch: Partial<QGroup>) => setGroups(groups.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  const M = Math.max(1, num(minutes, 90));
  const R = Math.min(M, Math.max(0, num(reserve, 10)));
  const totalMarks = groups.reduce((a, g) => a + Math.max(0, num(g.marks, 0)) * Math.max(0, Math.round(num(g.count, 0))), 0);
  const availRaw = M - R;
  const avail = Math.max(0, availRaw);
  const secPerMark = totalMarks > 0 ? (avail * 60) / totalMarks : 0;
  const reservePct = (R / M) * 100;
  const thin = reservePct < 10 && avail > 0;
  const dead = avail <= 0;

  let cum = 0;
  let qn = 0;
  const sched = groups.map((g, i) => {
    const m = Math.max(0, num(g.marks, 0));
    const c = Math.max(0, Math.round(num(g.count, 0)));
    const sec = m * secPerMark * c;
    const from = cum;
    cum += sec;
    const qFrom = qn + 1;
    qn += c;
    return { i, m, c, sec, from, to: cum, qFrom, qTo: qn };
  });
  const examSec = M * 60;
  const segColors = [A, `${A}b0`, `${A}70`];

  return (
    <div className="space-y-4">
      <Panel title="the paper" accent={A}>
        <Row>
          <Field label="Total minutes" value={minutes} onChange={setMinutes} type="number" min={1} className="w-24" />
          <Field label="Reserve for checking" value={reserve} onChange={setReserve} type="number" min={0} className="w-24" hint="banked for the end" />
          <Field label="Starts at" value={start} onChange={setStart} type="time" className="w-28" />
          <div className="pb-0.5">
            <Btn variant="ghost" accent={A} onClick={() => setStart(nowHM())}>
              now
            </Btn>
          </div>
        </Row>
      </Panel>

      <Panel title="question groups — marks × count" accent={A}>
        {sched.map((s) => (
          <Row key={s.i} className="mb-3 last:mb-0">
            <span className="mono-kicker w-16 shrink-0 pb-2" style={{ color: A }}>
              TYPE {s.i + 1}
            </span>
            <Field label="Marks each" value={groups[s.i].marks} onChange={(v) => setGroup(s.i, { marks: v })} type="number" min={0} className="w-20" />
            <Field label="How many" value={groups[s.i].count} onChange={(v) => setGroup(s.i, { count: v })} type="number" min={0} className="w-20" />
            <span className="min-w-0 truncate pb-2.5 font-mono text-[10px] text-zinc-500">{mmss(s.m * secPerMark)} per question</span>
          </Row>
        ))}
      </Panel>

      <Grid cols={3}>
        <BigStat label="Pace" value={mmss(secPerMark)} unit="per mark" accent={A} hint={`${fmt(totalMarks, 0)} marks in ${mmss(avail * 60)} of writing`} />
        <BigStat label="Reserve" value={mmss(R * 60)} unit={pct(reservePct, 0)} accent={thin ? WARN : GOOD} hint="held for checking" />
        <BigStat label="Pens down" value={clockAt(start, examSec)} accent={A} hint={`started ${start}`} />
      </Grid>

      <div className="min-w-0">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="mono-kicker text-zinc-500">the {fmt(M, 0)} minutes</span>
          <span className="font-mono text-[10px] font-bold text-zinc-400">{mmss(examSec)} total</span>
        </div>
        <div className="flex h-6 w-full overflow-hidden rounded-md border border-zinc-800">
          {sched.map((s, i) => (
            <div key={i} className="h-full min-w-0" style={{ width: `${(s.sec / examSec) * 100}%`, background: segColors[i % 3] }} title={`Q${s.qFrom}–Q${s.qTo}`} />
          ))}
          <div
            className="h-full min-w-0"
            style={{
              width: `${(R * 60 * 100) / examSec}%`,
              background: `repeating-linear-gradient(45deg, ${WARN}55 0 5px, transparent 5px 10px)`,
              borderLeft: `1px dashed ${WARN}`,
            }}
            title="reserve"
          />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {sched.map((s, i) => (
            <span key={i} className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-zinc-500">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: segColors[i % 3] }} />
              {s.c}×{s.m}-mark · {mmss(s.sec)}
            </span>
          ))}
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
            <span className="h-2 w-2 shrink-0 rounded-sm border" style={{ borderColor: WARN }} />
            reserve · {mmss(R * 60)}
          </span>
        </div>
      </div>

      <Panel title="question schedule — running clock" accent={A}>
        {sched.map((s) => (
          <KV
            key={s.i}
            k={`${s.c} × ${s.m}-mark · Q${s.qFrom}${s.c > 1 ? `–Q${s.qTo}` : ""}`}
            v={`${mmss(s.from)} → ${mmss(s.to)} · clock ${clockAt(start, s.from)}–${clockAt(start, s.to)}`}
          />
        ))}
        <KV k="Whole paper" v={`${mmss(0)} → ${mmss(examSec)} · last ${mmss(R * 60)} = checking`} accent={A} />
      </Panel>

      {dead ? (
        <Tag accent={BAD}>overrun — reserve swallows the whole paper, leaving no time for questions</Tag>
      ) : thin ? (
        <Tag accent={WARN}>reserve is thin — {pct(reservePct, 0)} of the paper</Tag>
      ) : (
        <Tag accent={GOOD}>healthy buffer — {pct(reservePct, 0)} of the paper held back</Tag>
      )}

      <Note>Reserve is checking time — top students lose marks rushing the end. Around 10% of the paper is the classic cushion.</Note>
    </div>
  );
}

/* ------------------------- 5. Thesis defence timing ------------------------ */

const DEFENCE_SECTIONS = [
  { name: "Intro", w: 0.15 },
  { name: "Methods", w: 0.25 },
  { name: "Results", w: 0.35 },
  { name: "Discussion", w: 0.15 },
  { name: "Close", w: 0.1 },
] as const;

type PaceKey = "careful" | "normal" | "brisk" | "custom";
type StopKey = "none" | "15" | "30" | "custom";

const PACE_OPTS: readonly { v: PaceKey; label: string }[] = [
  { v: "careful", label: "careful 1.5" },
  { v: "normal", label: "normal 1.0" },
  { v: "brisk", label: "brisk 0.75" },
  { v: "custom", label: "custom" },
];
const STOP_OPTS: readonly { v: StopKey; label: string }[] = [
  { v: "none", label: "none" },
  { v: "15", label: "+15 min" },
  { v: "30", label: "+30 min" },
  { v: "custom", label: "custom" },
];

export function ThesisDefenceTiming() {
  const A = accentOf(4);
  const [slides, setSlides] = useState("25");
  const [paceKey, setPaceKey] = useState<PaceKey>("normal");
  const [customPace, setCustomPace] = useState("1.2");
  const [qa, setQa] = useState("10");
  const [stopKey, setStopKey] = useState<StopKey>("none");
  const [customStop, setCustomStop] = useState("45");
  const [start, setStart] = useState(nowHM);

  const N = Math.max(1, Math.round(num(slides, 25)));
  const pace = paceKey === "careful" ? 1.5 : paceKey === "normal" ? 1 : paceKey === "brisk" ? 0.75 : Math.max(0.25, num(customPace, 1.2));
  const qaMin = Math.max(0, num(qa, 10));
  const talkMin = N * pace;
  const total = talkMin + qaMin;
  const stopMin = stopKey === "none" ? null : stopKey === "15" ? 15 : stopKey === "30" ? 30 : Math.max(1, num(customStop, 45));
  const over = stopMin !== null && total > stopMin;
  const overBy = over ? total - (stopMin as number) : 0;
  const cut = over ? Math.ceil(overBy / pace) : 0;

  const secSlides = DEFENCE_SECTIONS.map((s) => Math.round(N * s.w));
  secSlides[2] += N - secSlides.reduce((a, b) => a + b, 0);
  const alloc = DEFENCE_SECTIONS.map((s) => Math.round(cut * s.w));
  if (cut > 0) alloc[2] += cut - alloc.reduce((a, b) => a + b, 0);

  const cutSheet = over
    ? [
        `DEFENCE OVERRUN — cut ${cut} slide${cut === 1 ? "" : "s"}`,
        `Talk ${mmss(talkMin * 60)} + Q&A ${mmss(qaMin * 60)} = ${mmss(total * 60)} vs hard stop ${mmss(stopMin! * 60)}`,
        `Overrun ${mmss(overBy * 60)} at ${fmt(pace, 2)} min/slide`,
        ``,
        ...DEFENCE_SECTIONS.map((s, i) => {
          const c = Math.min(alloc[i], secSlides[i]);
          return `  ${s.name.padEnd(12)}${String(secSlides[i]).padStart(3)} slides → cut ${c} → ${secSlides[i] - c}`;
        }),
        ``,
        `New talk ≈ ${mmss(Math.max(0, talkMin - overBy) * 60)} + Q&A ${mmss(qaMin * 60)} = ${mmss(Math.max(0, total - overBy) * 60)}`,
      ].join("\n")
    : "";

  return (
    <div className="space-y-4">
      <Panel title="the talk" accent={A}>
        <Row>
          <Field label="Slides" value={slides} onChange={setSlides} type="number" min={1} className="w-20" />
          <Field label="Q&A minutes" value={qa} onChange={setQa} type="number" min={0} className="w-20" />
          <Field label="Starts at" value={start} onChange={setStart} type="time" className="w-28" />
          <div className="pb-0.5">
            <Btn variant="ghost" accent={A} onClick={() => setStart(nowHM())}>
              now
            </Btn>
          </div>
        </Row>
        <div className="mt-3 space-y-2.5">
          <div className="min-w-0">
            <span className="mono-kicker mb-1 block text-zinc-500">Pace — minutes per slide</span>
            <Seg value={paceKey} onChange={setPaceKey} options={PACE_OPTS} accent={A} />
          </div>
          {paceKey === "custom" ? (
            <Field label="Custom minutes per slide" value={customPace} onChange={setCustomPace} type="number" min={0.25} step={0.05} className="w-32" />
          ) : null}
          <div className="min-w-0">
            <span className="mono-kicker mb-1 block text-zinc-500">Hard stop — minutes from start</span>
            <Seg value={stopKey} onChange={setStopKey} options={STOP_OPTS} accent={A} />
          </div>
          {stopKey === "custom" ? (
            <Field label="Custom hard stop (minutes)" value={customStop} onChange={setCustomStop} type="number" min={1} className="w-32" />
          ) : null}
        </div>
      </Panel>

      <Grid cols={3}>
        <BigStat label="Talk length" value={mmss(talkMin * 60)} accent={A} hint={`${N} slides × ${fmt(pace, 2)} min`} />
        <BigStat label="With Q&A" value={mmss(total * 60)} accent={A} hint={`+ ${mmss(qaMin * 60)} of questions`} />
        <BigStat label="Committee releases you" value={clockAt(start, total * 60)} accent={A} hint={`start ${start}`} />
      </Grid>

      <Panel title="section timing" accent={A} right={<span className="font-mono text-[10px] text-zinc-500">{mmss(talkMin * 60)} of talk</span>}>
        {DEFENCE_SECTIONS.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3 border-b border-zinc-800/60 py-2 last:border-0">
            <span className="w-24 min-w-0 shrink-0 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">{s.name}</span>
            <div className="min-w-0 flex-1">
              <Meter value={s.w * talkMin} max={Math.max(talkMin, 0.001)} accent={i === 2 ? A : `${A}88`} />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-[11px] font-bold" style={{ color: A }}>
              {mmss(s.w * talkMin * 60)}
            </span>
            <span className="w-14 shrink-0 text-right font-mono text-[10px] text-zinc-600">{secSlides[i]} sl.</span>
          </div>
        ))}
      </Panel>

      {over ? (
        <>
          <Tag accent={WARN}>hard stop breached by {mmss(overBy * 60)} — cut {cut} slides</Tag>
          <Out text={cutSheet} label="cut list" rows={10} />
        </>
      ) : stopMin !== null ? (
        <Tag accent={GOOD}>fits the hard stop with {mmss(((stopMin as number) - total) * 60)} to spare</Tag>
      ) : (
        <Tag accent={A}>no hard stop set — set one, committees love them</Tag>
      )}

      <Note>1–2 min/slide is the classic rule — your committee will cut you off at the hard stop. Results carries 35% of the talk for a reason: lead with your evidence.</Note>
    </div>
  );
}

/* --------------------------- 6. Fundraiser profit -------------------------- */

export function FundraiserProfit() {
  const A = accentOf(5);
  const [ordered, setOrdered] = useState("200");
  const [costUnit, setCostUnit] = useState("1.20");
  const [price, setPrice] = useState("2.50");
  const [sell, setSell] = useState(85);

  const ord = Math.max(1, Math.round(num(ordered, 200)));
  const cu = Math.max(0, num(costUnit, 1.2));
  const pr = Math.max(0, num(price, 2.5));
  const sold = (ord * sell) / 100;
  const revenue = sold * pr;
  const cost = ord * cu;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const breakEven = pr > 0 ? cost / (ord * pr) : 1;
  const unsold = ord - sold;
  const belowCost = pr <= cu;
  const scenario = (f: number) => (ord * f * pr) / 100 - cost;

  return (
    <div className="space-y-4">
      <Panel title="the sale" accent={A}>
        <Row>
          <Field label="Items ordered" value={ordered} onChange={setOrdered} type="number" min={1} className="w-24" />
          <Field label="Cost per unit" value={costUnit} onChange={setCostUnit} type="number" min={0} step={0.05} className="w-24" />
          <Field label="Sale price" value={price} onChange={setPrice} type="number" min={0} step={0.05} className="w-24" />
        </Row>
      </Panel>

      <Panel title="expected sell-through" accent={A}>
        <Slider label="How much actually sells" value={sell} onChange={setSell} min={0} max={100} step={5} suffix="%" accent={A} />
        <p className="mt-2 font-mono text-[10px] text-zinc-600">Chocolate sales die at 70%. School-run optimism is not a forecast.</p>
      </Panel>

      <Panel
        title="profit at expected sell-through"
        accent={A}
        right={<Tag accent={profit >= 0 ? GOOD : BAD}>{profit >= 0 ? "in the black" : "in the red"}</Tag>}
      >
        <p className="truncate text-4xl font-black leading-tight" style={{ color: profit >= 0 ? A : BAD }}>
          {cash(profit)}
        </p>
        <p className="mt-1 font-mono text-[10px] text-zinc-500">
          {fmt(sold, 0)} of {fmt(ord, 0)} sold × {money(pr)} = {money(revenue)} revenue − {money(cost)} cost
        </p>
      </Panel>

      <Grid cols={3}>
        {[70, 85, 100].map((f) => {
          const p = scenario(f);
          return <BigStat key={f} label={`at ${f}% sold`} value={cash(p)} accent={p >= 0 ? A : BAD} hint={f === sell ? "your scenario" : `vs your ${sell}%`} />;
        })}
      </Grid>

      <Panel title="risk & margin" accent={A}>
        <Meter value={Math.max(0, margin)} max={100} accent={margin >= 0 ? A : BAD} label="profit margin" right={pct(margin, 1)} />
        <div className="mt-3">
          <KV
            k="Break-even sell-through"
            v={
              <span className="inline-flex items-center gap-1.5">
                {pct(breakEven * 100, 1)}
                {belowCost ? <Tag accent={BAD}>price ≤ cost</Tag> : sell >= breakEven * 100 ? <Tag accent={GOOD}>cleared</Tag> : <Tag accent={WARN}>not yet</Tag>}
              </span>
            }
          />
          <KV k="Unsold stock" v={`${fmt(unsold, 0)} items left over — ${money(unsold * cu)} of cost at risk`} accent={BAD} />
          <KV k="Revenue if all sold" v={money(ord * pr)} />
          <KV k="Total outlay" v={money(cost)} />
        </div>
      </Panel>

      <Note>Unsold stock is silent money — every leftover item is cost you must recover at the next sale. Break-even sits at {pct(breakEven * 100, 1)} sell-through; below that, you are paying to run the stall.</Note>
    </div>
  );
}

/* ------------------------ 7. Society ticket break-even --------------------- */

export function SocietyTicketBreakeven() {
  const A = accentOf(6);
  const [venue, setVenue] = useState("120");
  const [cater, setCater] = useState("6");
  const [fee, setFee] = useState("150");
  const [other, setOther] = useState("40");
  const [capacity, setCapacity] = useState("80");
  const [price, setPrice] = useState("8");
  const [att, setAtt] = useState("0.75");

  const venueN = Math.max(0, num(venue, 120));
  const caterN = Math.max(0, num(cater, 6));
  const feeN = Math.max(0, num(fee, 150));
  const otherN = Math.max(0, num(other, 40));
  const cap = Math.max(1, Math.round(num(capacity, 80)));
  const pr = Math.max(0, num(price, 8));
  const frac = Math.max(0.05, num(att, 0.75));

  const fixed = venueN + feeN + otherN;
  /** price covering fixed + catering at a given turnout fraction, rounded up to £0.50 */
  const priceAt = (f: number) => {
    const heads = cap * f;
    return heads > 0 ? Math.ceil(((fixed + heads * caterN) / heads) * 2) / 2 : 0;
  };
  const p50 = priceAt(0.5);
  const heads = Math.round(cap * frac);
  const profit = pr * heads - fixed - heads * caterN;
  const covers50 = pr >= p50;
  const attOpts: readonly { v: string; label: string }[] = [
    { v: "0.5", label: "50%" },
    { v: "0.75", label: "75%" },
    { v: "1", label: "100%" },
  ];

  return (
    <div className="space-y-4">
      <Panel title="fixed costs — paid whether anyone comes or not" accent={A}>
        <Row>
          <Field label="Venue hire" value={venue} onChange={setVenue} type="number" min={0} className="w-24" />
          <Field label="Performer / DJ fee" value={fee} onChange={setFee} type="number" min={0} className="w-28" />
          <Field label="Other fixed" value={other} onChange={setOther} type="number" min={0} className="w-24" />
        </Row>
        <Row className="mt-3">
          <Field label="Room capacity" value={capacity} onChange={setCapacity} type="number" min={1} className="w-24" />
          <Field label="Catering per head" value={cater} onChange={setCater} type="number" min={0} step={0.5} className="w-24" />
          <Field label="Your ticket price" value={price} onChange={setPrice} type="number" min={0} step={0.5} className="w-24" />
        </Row>
      </Panel>

      <Grid cols={3}>
        <BigStat label="Break-even @ 50%" value={money(p50)} accent={A} hint={`${fmt(cap * 0.5, 0)} paying heads`} />
        <BigStat label="Break-even @ 75%" value={money(priceAt(0.75))} accent={A} hint={`${fmt(cap * 0.75, 0)} paying heads`} />
        <BigStat label="Break-even @ 100%" value={money(priceAt(1))} accent={A} hint={`${fmt(cap, 0)} paying heads`} />
      </Grid>

      <Panel title="your price vs the room" accent={A}>
        <Row className="mb-2">
          <span className="mono-kicker text-zinc-500">Assume turnout</span>
          <Seg value={att} onChange={setAtt} options={attOpts} accent={A} />
        </Row>
        <KV k="Fixed costs" v={money(fixed)} />
        <KV k={`Attendance at ${pct(frac * 100, 0)}`} v={`${heads} of ${fmt(cap, 0)} seats`} />
        <KV k="Ticket revenue" v={money(pr * heads)} />
        <KV k="Fixed + catering" v={money(fixed + heads * caterN)} />
        <KV k="Profit at your price" v={cash(profit)} accent={profit >= 0 ? GOOD : BAD} />
        <KV k="Cheapest safe price" v={`${money(p50)} — covers even a half-empty room`} accent={A} />
      </Panel>

      {covers50 ? (
        <Tag accent={GOOD}>your {money(pr)} ticket covers break-even even at 50% turnout</Tag>
      ) : pr >= priceAt(frac) ? (
        <Tag accent={WARN}>{money(pr)} covers {pct(frac * 100, 0)} turnout but falls short if only half show</Tag>
      ) : (
        <Tag accent={BAD}>{money(pr)} falls short at {pct(frac * 100, 0)} turnout — you need {money(priceAt(frac))}</Tag>
      )}

      <Note>The DJ gets paid even for an empty floor. Price above the 50% number and even a flop cannot bankrupt the society — price below it and you are gambling on full attendance.</Note>
    </div>
  );
}

/* ------------------------------ 8. Lab group rota -------------------------- */

export function LabRotaPlanner() {
  const A = accentOf(7);
  const [groups, setGroups] = useState(5);
  const [sets, setSets] = useState(4);
  const [weeks, setWeeks] = useState(6);
  const [nameRaw, setNameRaw] = useState("Group A, Group B, Group C, Group D, Group E");

  const names = useMemo(() => parseGroups(nameRaw, groups), [nameRaw, groups]);
  const setOf = (g: number, w: number) => (g + w) % sets;
  const usage = Array.from({ length: sets }, (_, s) => names.filter((_, g) => g % sets === s).length);
  const maxUse = Math.ceil(groups / sets);
  const minUse = Math.min(...usage);

  const colW = 8;
  const sheet = [
    `LAB GROUP ROTA — ${groups} groups × ${sets} equipment sets × ${weeks} weeks`,
    `Full cycle: ${sets} weeks — after that the pattern repeats`,
    ``,
    "WEEK    ".padEnd(8) + names.map((n) => n.slice(0, 7).padEnd(colW)).join(""),
    ...Array.from({ length: weeks }, (_, w) =>
      `Wk ${w + 1}   `.padEnd(8) + Array.from({ length: groups }, (_, g) => `Set ${setOf(g, w) + 1}`.padEnd(colW)).join(""),
    ),
    ``,
    `Balance check: each set serves ${minUse}–${maxUse} groups per week ✓`,
  ].join("\n");

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="the lab" accent={A} className="h-full">
            <div className="space-y-4">
              <Slider label="Groups" value={groups} onChange={setGroups} min={2} max={10} accent={A} />
              <Slider label="Equipment sets" value={sets} onChange={setSets} min={2} max={10} accent={A} />
              <Slider label="Weeks to plan" value={weeks} onChange={setWeeks} min={1} max={12} suffix=" wks" accent={A} />
              <Area label="Group names (comma separated)" rows={3} value={nameRaw} onChange={setNameRaw} />
            </div>
          </Panel>
        }
        right={
          <Panel title="fairness check" accent={A} className="h-full">
            <BigStat label="Weeks until full cycle" value={sets} unit="weeks" accent={A} hint="every group sees every set" />
            <div className="mt-3 space-y-2.5">
              {usage.map((u, i) => (
                <Meter key={i} value={u} max={maxUse} accent={A} label={`Set ${i + 1}`} right={`${u} group${u === 1 ? "" : "s"} / week`} />
              ))}
            </div>
            <div className="mt-3">
              <Tag accent={GOOD}>balanced — spread never more than one group apart</Tag>
            </div>
          </Panel>
        }
      />

      <Out text={sheet} label="printable rota" rows={14} />

      <Note>
        Sets are placeholders — swap the labels for your real equipment (microscopes, circuits, titration kits…). Seat = (group + week) mod {sets} guarantees no group
        repeats a set before the full cycle completes.
      </Note>
    </div>
  );
}

/* -------------------------- 9. Group mark fair split ----------------------- */

export function GroupMarkFairSplit() {
  const A = accentOf(8);
  const [mark, setMark] = useState("72");
  const [members, setMembers] = useState(4);
  const [scores, setScores] = useState<number[]>([5, 4, 4, 2, 3, 3]);
  const [weight, setWeight] = useState(30);
  const [capPct, setCapPct] = useState(10);

  const markN = Math.max(0, num(mark, 72));
  const w = weight / 100;
  const capAmt = (markN * capPct) / 100;
  const lo = markN - capAmt;
  const hi = markN + capAmt;
  const sc = scores.slice(0, members);
  const avg = sc.reduce((a, b) => a + b, 0) / Math.max(1, members);
  const calc = sc.map((s) => {
    const norm = avg > 0 ? s / avg : 1;
    const raw = markN * (1 - w) + markN * w * norm;
    const fin = Math.min(hi, Math.max(lo, raw));
    return { s, raw, fin, clamped: raw < lo - 1e-9 || raw > hi + 1e-9 };
  });

  const summary = [
    `GROUP MARK FAIR SPLIT`,
    `Group mark ${fmt(markN, 0)} · peer weighting ${weight}% · cap ±${capPct}%`,
    `Peer average ${fmt(avg, 1)}/5 across ${members} members`,
    ``,
    ...calc.map((c, i) => `Member ${i + 1}  peer ${fmt(c.s, 1)}/5 → ${fmt(c.fin, 1)}${c.clamped ? "  (capped)" : ""}`),
    ``,
    `Formula: ${fmt(markN, 0)}×${fmt((1 - w) * 100, 0)}% + ${fmt(markN, 0)}×${weight}%×(peer ÷ ${fmt(avg, 1)}), clamped ${fmt(lo, 1)}–${fmt(hi, 1)}`,
  ].join("\n");

  return (
    <div className="space-y-4">
      <Panel title="the group" accent={A}>
        <Row>
          <Field label="Group mark" value={mark} onChange={setMark} type="number" min={0} max={100} className="w-24" />
          <div className="w-44 min-w-0">
            <Slider label="Members" value={members} onChange={setMembers} min={2} max={6} accent={A} />
          </div>
        </Row>
      </Panel>

      <Panel title="peer scores — 1 (coasted) to 5 (carried it)" accent={A}>
        <Grid cols={2}>
          {sc.map((s, i) => (
            <Slider
              key={i}
              label={`Member ${i + 1}`}
              value={s}
              onChange={(v) => setScores(scores.map((x, j) => (j === i ? v : x)))}
              min={1}
              max={5}
              step={0.5}
              suffix="/5"
              accent={A}
            />
          ))}
        </Grid>
      </Panel>

      <Panel title="weighting & fairness cap" accent={A}>
        <Grid cols={2}>
          <Slider label="Peer weighting" value={weight} onChange={setWeight} min={0} max={50} suffix="%" accent={A} />
          <Slider label="Fairness cap (±)" value={capPct} onChange={setCapPct} min={0} max={30} suffix="%" accent={A} />
        </Grid>
      </Panel>

      <Panel title="adjusted marks" accent={A} right={<span className="font-mono text-[10px] text-zinc-500">avg peer {fmt(avg, 1)}/5</span>}>
        {calc.map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-3 border-b border-zinc-800/60 py-2 last:border-0">
            <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              Member {i + 1} · peer {fmt(c.s, 1)}/5
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="w-14 text-right font-mono text-[10px] text-zinc-600">raw {fmt(c.raw, 1)}</span>
              {c.clamped ? <Tag accent={WARN}>capped</Tag> : null}
              <span className="text-sm font-bold" style={{ color: c.clamped ? WARN : A }}>
                {fmt(c.fin, 1)}
              </span>
            </span>
          </div>
        ))}
      </Panel>

      <Out text={summary} label="copy the split for the group chat" rows={11} />

      <Note>
        final = group×{fmt((1 - w) * 100, 0)}% + group×{weight}%×(peer ÷ avg), clamped ±{capPct}% ({fmt(lo, 1)}–{fmt(hi, 1)}). The formula is on the table before
        anyone opens their laptop — fairness by transparency, not judgement.
      </Note>
    </div>
  );
}

/* ------------------------------ 9-b. META ---------------------------------- */

export const teachersMeta: ToolMeta[] = [
  {
    id: "field-trip-planner",
    name: "Field Trip Cost Planner",
    description: "Buses, ratios, admissions and subsidy in — a fair per-student price out, plus the what-if when 3 students drop.",
    category: "study",
    icon: Bus,
    keywords: "field trip cost per student calculator bus seats adult ratio",
    badge: "new",
    component: FieldTripPlanner,
  },
  {
    id: "class-party-snacks",
    name: "Class Party Snack Planner",
    description: "Pack sizes, pieces-per-child maths, a budget meter and an allergen-aware shopping list for the class party.",
    category: "study",
    icon: Cake,
    keywords: "class party snack planner calculator children allergies pack sizes budget",
    badge: "new",
    component: ClassPartySnacks,
  },
  {
    id: "reading-rotations",
    name: "Reading Group Rotations",
    description: "A cyclic station timetable for guided reading — no group repeats a station until the whole cycle completes.",
    category: "study",
    icon: BookOpen,
    keywords: "reading groups rotation planner stations timer classroom",
    badge: "new",
    component: ReadingRotations,
  },
  {
    id: "exam-time-per-mark",
    name: "Exam Time-per-Mark Planner",
    description: "Turn marks into minutes: a pace per mark, a running clock per question group, and reserve kept for checking.",
    category: "study",
    icon: Timer,
    keywords: "exam time per mark calculator minutes per question paper revision",
    badge: "new",
    component: ExamTimePerMark,
  },
  {
    id: "thesis-defence-timing",
    name: "Thesis Defence Timing",
    description: "Slides × pace + Q&A against your hard stop — per-section minutes and exactly which slides to cut when you overrun.",
    category: "study",
    icon: GraduationCap,
    keywords: "thesis defense presentation timing calculator slides minutes qa",
    badge: "new",
    component: ThesisDefenceTiming,
  },
  {
    id: "fundraiser-profit",
    name: "School Fundraiser Profit",
    description: "Profit at your expected sell-through, the break-even point, and the leftover stock that is your real risk.",
    category: "study",
    icon: DollarSign,
    keywords: "school fundraiser profit calculator unsold items sell through",
    badge: "new",
    component: FundraiserProfit,
  },
  {
    id: "society-ticket-breakeven",
    name: "Society Ticket Break-Even",
    description: "Venue + DJ + catering vs door price — the break-even ticket at 50/75/100% turnout and your profit at any price.",
    category: "study",
    icon: Ticket,
    keywords: "student society event ticket break even calculator venue hire capacity",
    badge: "new",
    component: SocietyTicketBreakeven,
  },
  {
    id: "lab-rota-planner",
    name: "Lab Group Rota",
    description: "A printable weeks × groups equipment rota with a fairness check — nobody repeats a set before the cycle ends.",
    category: "study",
    icon: FlaskConical,
    keywords: "lab group rota planner equipment groups weeks science classroom",
    badge: "new",
    component: LabRotaPlanner,
  },
  {
    id: "group-contribution-split",
    name: "Group Mark Fair Split",
    description: "Adjust one group mark by peer scores — transparent formula, live maths, and a hard fairness cap nobody can argue with.",
    category: "study",
    icon: HeartHandshake,
    keywords: "university group project contribution splitter peer marks fairness",
    badge: "new",
    component: GroupMarkFairSplit,
  },
];
