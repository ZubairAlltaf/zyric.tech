"use client";

/* ==========================================================================
   KIT: SPORT & TRAINING II — 4 more field-side tools. A soccer station
   rotation timetable, a race pace band with per-segment hill adjustments,
   a multi-leg canoe/kayak day planner with portages, and a round-robin
   fixture generator with venues, slots and rest checks.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Timer, Watch, Anchor, Trophy } from "lucide-react";
import {
  BigStat,
  Btn,
  Field,
  Grid,
  KV,
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
function clock(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  return `${h > 0 ? `${h}:` : ""}${h > 0 ? String(m % 60).padStart(2, "0") : m % 60}`;
}

/* ------------------------- 1. Soccer Station Rotation --------------------- */

function SoccerRotationTool() {
  const A = accentOf(11);
  const [groups, setGroups] = useState(4);
  const [stations, setStations] = useState(4);
  const [stationMin, setStationMin] = useState(12);
  const [waterMin, setWaterMin] = useState(3);
  const [start, setStart] = useState("16:00");

  const round = useMemo(() => {
    const rows: { r: number; pairs: { g: number; s: number; from: string; to: string }[]; end: string }[] = [];
    let t = 0;
    const total = groups * (stationMin + waterMin) - waterMin;
    for (let r = 0; r < stations; r++) {
      const pairs = Array.from({ length: Math.min(groups, stations) }, (_, g) => ({
        g,
        s: (g + r) % stations,
        from: clock(t),
        to: clock(t + stationMin),
      }));
      t += stationMin + waterMin;
      rows.push({ r, pairs, end: clock(t - waterMin) });
    }
    return { rows, total };
  }, [groups, stations, stationMin, waterMin]);

  const groupNames = Array.from({ length: groups }, (_, i) => `Team ${String.fromCharCode(65 + i)}`);

  return (
    <Split
      left={
        <Panel title="SESSION SHAPE" accent={A}>
          <Row>
            <Field label="WARM-UP START (HH:MM)" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="GROUPS" value={groups} onChange={setGroups} min={2} max={10} accent={A} />
            <Slider label="STATIONS" value={stations} onChange={setStations} min={2} max={10} accent={A} />
            <Slider label="MINUTES PER STATION" value={stationMin} onChange={setStationMin} min={5} max={25} accent={A} />
            <Slider label="WATER / TRANSITION" value={waterMin} onChange={setWaterMin} min={0} max={8} suffix=" min" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="ROTATIONS" value={round.rows.length} accent={A} />
            <BigStat label="SESSION LENGTH" value={clock(round.total)} unit="min" accent={A} />
            <BigStat label="ENDS AT" value={round.rows.length ? round.rows[round.rows.length - 1].end : "—"} accent={A} />
          </Grid>
          <Note>Group A starts at Station 1; each rotation everything slides one station right, so every group hits every station exactly once — with a water break between each.</Note>
        </Panel>
      }
      right={
        <Panel title="ROTATION TIMETABLE" accent={A}>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">Slot</th>
                <th className="pb-1.5 font-mono text-[9px] uppercase text-zinc-600">Clock</th>
                {groupNames.slice(0, 6).map((g) => (
                  <th key={g} className="pb-1.5 text-center font-mono text-[9px] uppercase text-zinc-600">{g.replace("Team ", "")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {round.rows.map((r) => (
                <tr key={r.r} className="border-t border-zinc-800/60">
                  <td className="py-1.5 font-mono text-[10px] text-zinc-500">S{r.r + 1}</td>
                  <td className="py-1.5 font-mono text-[10px] text-zinc-400">{r.pairs[0]?.from}–{r.pairs[0]?.to}</td>
                  {r.pairs.map((p) => (
                    <td key={p.g} className="py-1.5 text-center">
                      <span className="rounded px-1.5 py-0.5 font-mono text-[10px] font-black" style={{ background: `${A}14`, color: A }}>
                        ST{p.s + 1}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {groups > 6 ? <p className="mt-1 font-mono text-[10px] text-zinc-600">Showing teams A–F; {groups - 6} more follow the same pattern.</p> : null}
          <Out
            className="mt-3"
            label="COPY TIMETABLE"
            text={round.rows
              .map((r) => `Slot ${r.r + 1} (${r.pairs[0]?.from}): ` + r.pairs.map((p) => `${groupNames[p.g]}→ST${p.s + 1}`).join(", "))
              .join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------------- 2. Race Pace Band Splits --------------------- */

function PaceBandTool() {
  const A = accentOf(12);
  const [dist, setDist] = useState(21.1);
  const [hours, setHours] = useState(2);
  const [mins, setMins] = useState(0);
  const [unit, setUnit] = useState<"km" | "mi">("km");
  const [hill, setHill] = useState(6);
  const [fatigue, setFatigue] = useState(4);

  const plan = useMemo(() => {
    const totalSec = (hours * 3600 + mins * 60);
    const n = Math.round(unit === "km" ? dist : dist * 1.609344);
    // segment factors: hills slow the middle third, fatigue slows the last third
    const weights: number[] = [];
    for (let i = 1; i <= n; i++) {
      let f = 1;
      const frac = i / n;
      if (frac > 0.3 && frac < 0.62) f += hill / 100; // climbing third
      if (frac > 0.66) f += fatigue / 100 * ((frac - 0.66) / 0.34) * 2; // fading finish
      weights.push(f);
    }
    const wSum = weights.reduce((s, w) => s + w, 0);
    let acc = 0;
    return weights.map((w, i) => {
      const seg = (totalSec * w) / wSum;
      acc += seg;
      const t = Math.round(acc);
      return {
        seg: i + 1,
        paceSec: Math.round(seg),
        cum: `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
        flag: w > 1.03 ? "up" : w < 0.99 ? "push" : "steady",
      };
    });
  }, [dist, hours, mins, unit, hill, fatigue]);

  const avgSec = Math.round((hours * 3600 + mins * 60) / Math.max(1, unit === "km" ? dist : dist * 1.609344));

  return (
    <Split
      left={
        <Panel title="TARGET & COURSE" accent={A}>
          <Row>
            <Field label={`RACE DISTANCE (${unit})`} type="number" step={0.1} value={dist} onChange={(v) => setDist(num(v))} />
            <Field label="TARGET HOURS" type="number" value={hours} onChange={(v) => setHours(num(v))} />
            <Field label="TARGET MINUTES" type="number" value={mins} onChange={(v) => setMins(num(v))} />
          </Row>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">SPLIT UNIT</span>
            <Seg value={unit} onChange={setUnit} accent={A} options={[{ v: "km", label: "Per KM" }, { v: "mi", label: "Per Mile" }] as const} />
          </div>
          <div className="mt-3 space-y-3">
            <Slider label="HILL SLOWDOWN (MIDDLE THIRD)" value={hill} onChange={setHill} min={0} max={20} suffix="%" accent={A} />
            <Slider label="FATIGUE FADE (LAST THIRD)" value={fatigue} onChange={setFatigue} min={0} max={20} suffix="%" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="AVG PACE" value={`${Math.floor(avgSec / 60)}:${String(avgSec % 60).padStart(2, "0")}`} unit={`/ ${unit}`} accent={A} />
            <BigStat label="SPLITS" value={plan.length} accent={A} />
            <BigStat label="FINISH" value={`${hours}:${String(mins).padStart(2, "0")}:00`} accent={A} />
          </Grid>
          <Note>The band re-normalises every split so the segment adjustments still land exactly on your target time — bank time on the downhills, spend it on the climbs.</Note>
        </Panel>
      }
      right={
        <Panel title="PRINTABLE PACE BAND" accent={A}>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-6">
            {plan.map((p) => (
              <div key={p.seg} className="rounded border border-zinc-800 bg-zinc-950/60 p-1 text-center" style={p.flag === "up" ? { borderColor: `${A}66` } : undefined}>
                <p className="font-mono text-[9px] text-zinc-600">{p.seg}</p>
                <p className="font-mono text-[11px] font-black" style={{ color: A }}>{p.cum}</p>
                <p className="font-mono text-[8px] uppercase text-zinc-600">{p.flag}</p>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY SPLITS"
            text={plan.map((p) => `${p.seg}\t${p.cum}\t${p.flag}`).join("\n")}
          />
          <Note>Print, tape around your wrist, tick each split as you pass the marker.</Note>
        </Panel>
      }
    />
  );
}

/* ------------------------- 3. Canoe & Kayak Day Planner -------------------- */

function PaddleTripTool() {
  const A = accentOf(1);
  const [legs, setLegs] = useState("Lake crossing 6 0 15\nRiver run 9 15 20\nPortage around weir 0.4 0 45\nLower rapids 5 10 15");
  const [speed, setSpeed] = useState(5);
  const [current, setCurrent] = useState(1.5);
  const [start, setStart] = useState("09:00");

  const rows = useMemo(() => {
    let t = 0;
    const parse = (s: string) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
      return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
    };
    return legs
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const p = l.split(/\s+/);
        const name = p[0];
        const km = num(p[1] ?? "0");
        const cur = num(p[2] ?? "0");
        const portage = num(p[3] ?? "0");
        const effSpeed = Math.max(0.5, speed + (km > 0 ? cur : 0));
        const paddle = km > 0 ? (km / effSpeed) * 60 : 0;
        const from = t;
        t += paddle + portage;
        return {
          name,
          km,
          cur,
          portage,
          paddle,
          from: `${Math.floor((parse(start) + from) / 60) % 24}:${String(Math.round((parse(start) + from) % 60)).padStart(2, "0")}`,
          arrive: `${Math.floor((parse(start) + t) / 60) % 24}:${String(Math.round((parse(start) + t) % 60)).padStart(2, "0")}`,
        };
      });
  }, [legs, speed, current, start]);

  const totalKm = rows.reduce((s, r) => s + r.km, 0);
  const totalMin = rows.reduce((s, r) => s + r.paddle + r.portage, 0);

  return (
    <Split
      left={
        <Panel title="YOUR DAY" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">LEGS — NAME, KM, CURRENT (+/−), PORTAGE MIN</span>
          <textarea
            value={legs}
            onChange={(e) => setLegs(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="PUT-IN TIME (HH:MM)" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="YOUR FLAT-WATER SPEED" value={speed} onChange={setSpeed} min={2} max={9} step={0.5} suffix=" km/h" accent={A} />
            <Slider label="DEFAULT CURRENT" value={current} onChange={setCurrent} min={-3} max={4} step={0.5} suffix=" km/h" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="DISTANCE" value={fmt(totalKm, 1)} unit="km" accent={A} />
            <BigStat label="ON WATER" value={clock(rows.reduce((s, r) => s + r.paddle, 0))} hint="h:mm paddling" accent={A} />
            <BigStat label="TOTAL DAY" value={clock(totalMin)} hint="h:mm including carries" accent={A} />
          </Grid>
          <Note>Format per line: <b>name km current portage-min</b>. Current adds to your speed on moving water (positive = downstream push, negative = upstream grind).</Note>
        </Panel>
      }
      right={
        <Panel title="RIVER CLOCK" accent={A}>
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                <span className="w-12 shrink-0 font-mono text-[10px]" style={{ color: A }}>{r.from}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] font-bold text-zinc-200">{r.name}</p>
                  <p className="font-mono text-[9px] text-zinc-600">
                    {r.km > 0 ? `${fmt(r.km, 1)} km @ ${fmt(Math.max(0.5, speed + r.cur), 1)} km/h` : "carry"}
                    {r.portage > 0 && r.km > 0 ? ` · ${r.portage} min portage` : r.portage > 0 ? ` · ${r.portage} min portage` : ""}
                  </p>
                </div>
                <Tag accent={A}>{r.arrive}</Tag>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY DAY PLAN"
            text={rows.map((r) => `${r.from} — ${r.name}${r.km > 0 ? ` (${fmt(r.km, 1)} km)` : ""} → arrive ${r.arrive}`).join("\n") + `\nTotal: ${fmt(totalKm, 1)} km, ${clock(totalMin)} min door to door`}
          />
        </Panel>
      }
    />
  );
}

/* --------------------- 4. Round-Robin Fixture Generator -------------------- */

function RoundRobinTool() {
  const A = accentOf(2);
  const [teams, setTeams] = useState(6);
  const [venues, setVenues] = useState(2);
  const [slots, setSlots] = useState(3);
  const [restH, setRestH] = useState(1);

  const ROUNDS = teams % 2 === 0 ? teams - 1 : teams;

  const fixtures = useMemo(() => {
    const names = Array.from({ length: teams }, (_, i) => `Team ${i + 1}`);
    const list = teams % 2 === 0 ? names : [...names, "BYE"];
    const n = list.length;
    const rounds: { r: number; games: { a: string; b: string; venue: number; slot: number; restOk: boolean }[] }[] = [];
    let lastSlotOf = new Map<string, number>();
    let slotCursor = 0;
    for (let r = 0; r < n - 1; r++) {
      const games: { a: string; b: string; venue: number; slot: number; restOk: boolean }[] = [];
      for (let i = 0; i < n / 2; i++) {
        const a = list[i];
        const b = list[n - 1 - i];
        if (a === "BYE" || b === "BYE") continue;
        const venue = games.length % venues;
        const absSlot = slotCursor;
        const slot = absSlot % slots;
        // rest check: gap since each team's last game, in slots
        const lastA = lastSlotOf.get(a) ?? -99;
        const lastB = lastSlotOf.get(b) ?? -99;
        const gap = Math.min(absSlot - lastA, absSlot - lastB);
        const restOk = lastA < 0 || lastB < 0 ? true : gap >= 1;
        games.push({ a, b, venue, slot, restOk });
        lastSlotOf.set(a, absSlot);
        lastSlotOf.set(b, absSlot);
        slotCursor++;
      }
      rounds.push({ r, games });
      list.splice(1, 0, list.pop()!); // circle method rotate
    }
    return rounds;
  }, [teams, venues, slots]);

  const totalGames = fixtures.reduce((s, r) => s + r.games.length, 0);

  return (
    <Split
      left={
        <Panel title="LEAGUE SETUP" accent={A}>
          <div className="space-y-3">
            <Slider label="TEAMS" value={teams} onChange={setTeams} min={3} max={14} accent={A} />
            <Slider label="VENUES (COURTS / PITCHES)" value={venues} onChange={setVenues} min={1} max={6} accent={A} />
            <Slider label="SLOTS PER DAY" value={slots} onChange={setSlots} min={1} max={8} accent={A} />
            <Slider label="MIN HOURS BETWEEN GAMES" value={restH} onChange={setRestH} min={0} max={4} hint="back-to-back slots are flagged" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="ROUNDS" value={ROUNDS} accent={A} />
            <BigStat label="GAMES" value={totalGames} accent={A} />
            <BigStat label="GAME DAYS" value={Math.ceil(totalGames / (venues * slots))} accent={A} />
          </Grid>
          <Note>Circle method: one team stays fixed, the rest rotate — everyone plays everyone once{teams % 2 === 0 ? "" : ", with byes when your count is odd"}. Venues spread as evenly as the maths allows.</Note>
        </Panel>
      }
      right={
        <Panel title="FIXTURE LIST" accent={A}>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {fixtures.map((r) => (
              <div key={r.r}>
                <p className="mono-kicker mb-1" style={{ color: A }}>ROUND {r.r + 1}</p>
                <div className="space-y-1">
                  {r.games.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border bg-zinc-950/60 px-2 py-1" style={{ borderColor: g.restOk ? "#27272a" : "#f8717155" }}>
                      <span className="font-mono text-[10px] text-zinc-500">V{g.venue + 1} · S{g.slot + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-200">{g.a} <b style={{ color: A }}>vs</b> {g.b}</span>
                      {!g.restOk ? <span className="font-mono text-[8px] text-red-400">tight rest</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY FIXTURES"
            text={fixtures
              .map((r) => `Round ${r.r + 1}\n` + r.games.map((g) => `  Venue ${g.venue + 1}, Slot ${g.slot + 1}: ${g.a} vs ${g.b}`).join("\n"))
              .join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const sportMoreMeta: ToolMeta[] = [
  {
    id: "soccer-rotation",
    name: "Soccer Station Rotation",
    description: "Groups × stations × minutes → a training-session rotation where every team hits every station.",
    category: "health",
    icon: Timer,
    keywords: "soccer training session station rotation planner groups drill",
    badge: "new",
    component: SoccerRotationTool,
  },
  {
    id: "pace-band",
    name: "Race Pace Band",
    description: "Target time + hill fade → per-km/mile splits that still land exactly on your finish.",
    category: "health",
    icon: Watch,
    keywords: "race pace band splits planner hills target time marathon",
    badge: "new",
    component: PaceBandTool,
  },
  {
    id: "paddle-trip",
    name: "Canoe & Kayak Day Planner",
    description: "Legs with current and portages → a river clock: leave times, arrival times and the day total.",
    category: "health",
    icon: Anchor,
    keywords: "canoe kayak trip paddle time planner portages current breaks",
    badge: "new",
    component: PaddleTripTool,
  },
  {
    id: "roundrobin-fixtures",
    name: "Round-Robin Fixtures",
    description: "Teams, venues and slots → a full fixture list with byes and a rest-gap check.",
    category: "health",
    icon: Trophy,
    keywords: "round robin tournament fixture generator venues time slots rest",
    badge: "new",
    component: RoundRobinTool,
  },
];
