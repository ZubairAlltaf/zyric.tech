"use client";

/* ==========================================================================
   KIT: ROTAS & GATHERINGS — 7 scheduling tools for groups. A conference
   session grid with clash detection, a carpool driver wheel with capacity
   maths, a craft-fair stall layout, parents' evening appointments, a
   community hall fairness allocator, an on-call rotation with blackout
   skipping, and a theatre rehearsal call board.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Building, Car, Store, Users, Landmark, PhoneCall, Drama } from "lucide-react";
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
function hhmm(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/* ------------------------- 1. Conference Scheduler ------------------------- */

function ConferenceTool() {
  const A = accentOf(6);
  const [sessions, setSessions] = useState("Opening keynote: 45: Ada\nAPIs 101: 30: Linus\nAPIs 201: 30: Linus\nDesign systems: 30: Grace\nLunch: 60: —\nSecurity panel: 45: Ada, Grace\nClosing: 20: Linus");
  const [rooms, setRooms] = useState(2);
  const [tracks, setTracks] = useState(2);
  const [dayStart, setDayStart] = useState("09:00");
  const [slotGap, setSlotGap] = useState(5);

  const grid = useMemo(() => {
    const list = sessions.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Session", mins: num(p[1] ?? "30"), speakers: p[2] || "—" };
    });
    const start = (() => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(dayStart.trim());
      return m ? Number(m[1]) * 60 + Number(m[2]) : 540;
    })();
    // greedy slot fill: sequential time slots, parallel rooms, avoid same speaker twice in a slot
    const slots: { at: number; rows: { name: string; mins: number; speakers: string; room: number; clash: boolean }[] }[] = [];
    let t = start;
    let queue = [...list];
    let guard = 0;
    while (queue.length && guard++ < 60) {
      const rows: typeof slots[number]["rows"] = [];
      const usedSpeakers = new Map<string, string>();
      for (let r = 0; r < rooms && queue.length; r++) {
        const s = queue[0];
        // check speaker conflicts within this slot
        const spk = s.speakers.split(",").map((x) => x.trim()).filter((x) => x && x !== "—");
        const clash = spk.some((p) => usedSpeakers.has(p));
        if (clash && rows.length > 0) break; // defer to next slot
        spk.forEach((p) => usedSpeakers.set(p, s.name));
        rows.push({ ...s, room: r + 1, clash });
        queue.shift();
      }
      const slotMax = Math.max(...rows.map((r) => r.mins));
      slots.push({ at: t, rows });
      t += slotMax + slotGap;
    }
    return { slots, end: t - slotGap };
  }, [sessions, rooms, tracks, dayStart, slotGap]);

  const clashes = grid.slots.flatMap((s) => s.rows.filter((r) => r.clash));

  return (
    <Split
      left={
        <Panel title="SESSIONS & ROOMS" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SESSIONS — NAME : MINUTES : SPEAKER(S)</span>
          <textarea
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="DOORS OPEN (HH:MM)" value={dayStart} onChange={setDayStart} />
          </Row>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="PARALLEL ROOMS" value={rooms} onChange={setRooms} min={1} max={6} accent={A} />
            <Slider label="TRACKS" value={tracks} onChange={setTracks} min={1} max={6} hint="labels only" accent={A} />
            <Slider label="CHANGEover GAP" value={slotGap} onChange={setSlotGap} min={0} max={20} suffix=" min" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="SESSIONS" value={grid.slots.reduce((s, x) => s + x.rows.length, 0)} accent={A} />
            <BigStat label="SLOTS" value={grid.slots.length} accent={A} />
            <BigStat label="DAY ENDS" value={hhmm(grid.end)} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <>
          {clashes.length > 0 ? (
            <p className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 font-mono text-[10px] text-amber-300">
              ⚠ {clashes.length} speaker clash{clashes.length !== 1 ? "es" : ""} deferred — the grid pushed their second session to a later slot.
            </p>
          ) : null}
          <Panel title="DAY GRID" accent={A}>
            <div className="space-y-1.5">
              {grid.slots.map((s, i) => (
                <div key={i}>
                  <p className="mono-kicker mb-1" style={{ color: A }}>{hhmm(s.at)}</p>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(rooms, 3)}, minmax(0,1fr))` }}>
                    {s.rows.map((r, j) => (
                      <div key={j} className="min-w-0 rounded border border-zinc-800 bg-zinc-950/60 p-1.5">
                        <p className="truncate font-mono text-[10px] font-bold text-zinc-200">{r.name}</p>
                        <p className="font-mono text-[9px] text-zinc-600">{r.mins} min · R{r.room} · {r.speakers}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Out
              className="mt-3"
              label="COPY PROGRAMME"
              text={grid.slots.map((s) => `${hhmm(s.at)}: ` + s.rows.map((r) => `${r.name} (R${r.room}, ${r.speakers})`).join(" | ")).join("\n")}
            />
          </Panel>
        </>
      }
    />
  );
}

/* ------------------------- 2. Carpool Driver Wheel ------------------------- */

function CarpoolTool() {
  const A = accentOf(7);
  const [people, setPeople] = useState("Priya: 0: 4\nSam: 1: 5\nLee: 0: 4\nAna: 1: 6\nTom: 0: 4");
  const [days, setDays] = useState(10);
  const [start, setStart] = useState(() => iso(new Date()));

  const plan = useMemo(() => {
    const rows = people.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Person", hasCar: p[1] === "1", seats: Math.max(1, num(p[2] ?? "4")) };
    });
    const drivers = rows.filter((r) => r.hasCar);
    const riders = rows.filter((r) => !r.hasCar);
    const capacity = drivers.reduce((s, d) => s + d.seats - 1, 0); // minus driver seat
    const out: { day: number; date: string; driver: string; passengers: string[]; seatsUsed: number; walk: number }[] = [];
    const load = new Map<string, number>(drivers.map((d) => [d.name, 0]));
    const riderQueue = [...riders];
    for (let d = 0; d < days; d++) {
      // least-loaded driver
      const driver = [...drivers].sort((a, b) => (load.get(a.name)! - load.get(b.name)!) || drivers.indexOf(a) - drivers.indexOf(b))[0];
      if (!driver) break;
      load.set(driver.name, (load.get(driver.name) ?? 0) + 1);
      const seats = driver.seats - 1;
      const passengers: string[] = [];
      let walked = 0;
      for (let s = 0; s < seats; s++) {
        if (riderQueue.length) passengers.push(riderQueue.shift()!.name);
        else walked++;
      }
      out.push({ day: d + 1, date: iso(addDays(new Date(start + "T00:00:00"), d)), driver: driver.name, passengers, seatsUsed: passengers.length, walk: walked });
      // rotate riders to the back
      if (riderQueue.length) riderQueue.push(riderQueue.shift()!);
    }
    return { out, drivers, riders, capacity };
  }, [people, days, start]);

  const driverLoads = plan.drivers.map((d) => ({ name: d.name, n: plan.out.filter((o) => o.driver === d.name).length }));

  return (
    <Split
      left={
        <Panel title="THE POOL" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">PEOPLE — NAME : HAS CAR (1/0) : SEATS</span>
          <textarea
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="FIRST COMMUTE" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3">
            <Slider label="DAYS TO PLAN" value={days} onChange={setDays} min={2} max={22} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="DRIVERS" value={plan.drivers.length} accent={A} />
            <BigStat label="RIDE SEATS / DAY" value={plan.capacity} hint={`${plan.riders.length} riders`} accent={A} />
            <BigStat label={plan.capacity < plan.riders.length ? "WALKING DAILY" : "EVERYONE RIDES"} value={plan.capacity < plan.riders.length ? plan.riders.length - plan.capacity : 0} unit={plan.capacity < plan.riders.length ? "ppl" : ""} accent={plan.capacity < plan.riders.length ? "#fbbf24" : A} />
          </Grid>
          <Note>No fares, no distances, no money — just who drives and who rides. Riders rotate through the car so nobody always sits in the back seat of the same Polo.</Note>
        </Panel>
      }
      right={
        <>
          <Panel title="DRIVER WHEEL" accent={A}>
            <div className="space-y-1">
              {plan.out.map((o) => (
                <div key={o.day} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                  <span className="w-14 shrink-0 font-mono text-[10px] text-zinc-500">{o.date.slice(5)}</span>
                  <span className="w-16 shrink-0 truncate font-mono text-[11px] font-black" style={{ color: A }}>{o.driver}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-zinc-400">
                    {o.passengers.join(", ") || "—"}
                    {o.walk > 0 ? <span className="text-amber-400"> · {o.walk} walking</span> : null}
                  </span>
                  <Tag accent={A}>{o.seatsUsed}/{(plan.drivers.find((d) => d.name === o.driver)?.seats ?? 1) - 1}</Tag>
                </div>
              ))}
            </div>
          </Panel>
          <div className="mt-3">
            <Panel title="FAIRNESS — DRIVES PER PERSON" accent={A}>
              {driverLoads.map((d) => (
                <div key={d.name} className="mb-2">
                  <Meter value={d.n} max={Math.max(...driverLoads.map((x) => x.n), 1)} accent={A} label={d.name} right={`${d.n} drives`} />
                </div>
              ))}
              <Out
                className="mt-2"
                label="COPY ROTA"
                text={plan.out.map((o) => `${o.date}: ${o.driver} drives — ${o.passengers.join(", ") || "no passengers"}`).join("\n")}
              />
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* --------------------------- 3. Craft Fair Stall --------------------------- */

function StallLayoutTool() {
  const A = accentOf(8);
  const [stallW, setStallW] = useState(3);
  const [stallD, setStallD] = useState(2);
  const [table, setTable] = useState<"180x75" | "120x60" | "60x60">("180x75");
  const [walkway, setWalkway] = useState(0.9);
  const [backdrop, setBackdrop] = useState(true);

  const calc = useMemo(() => {
    const dims = { "180x75": [1.8, 0.75], "120x60": [1.2, 0.6], "60x60": [0.6, 0.6] }[table];
    const tW = dims[0], tD = dims[1];
    // layout: back row along the back + sides if depth allows, keep front open
    const usableD = stallD - (backdrop ? 0.05 : 0);
    const backFit = Math.floor((stallW - 0.1) / (tW + 0.05));
    const rowsBehind = Math.floor((usableD - tD - walkway) / (tD + walkway)) + 1;
    const sideFit = Math.floor((stallD - tD - walkway) / (tW + 0.05)) > 0 && stallD > tW + walkway ? Math.floor(usableD / (tW + 0.1)) : 0;
    const tables = backFit + Math.max(0, (rowsBehind - 1) * backFit) + (sideFit > 0 ? 1 : 0);
    const frontOpen = stallD - rowsBehind * tD - Math.max(0, rowsBehind - 1) * walkway;
    return { tW, tD, backFit, rowsBehind, sideFit: sideFit > 0 ? 1 : 0, tables: Math.max(1, backFit + Math.max(0, rowsBehind - 1) * backFit), frontOpen };
  }, [stallW, stallD, table, walkway, backdrop]);

  return (
    <Split
      left={
        <Panel title="STALL & STOCK" accent={A}>
          <Row>
            <Field label="STALL WIDTH (M)" type="number" step={0.1} value={stallW} onChange={(v) => setStallW(num(v))} />
            <Field label="STALL DEPTH (M)" type="number" step={0.1} value={stallD} onChange={(v) => setStallD(num(v))} />
          </Row>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">TABLE SIZE</span>
            <div className="flex flex-wrap gap-1">
              {(["180x75", "120x60", "60x60"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTable(t)}
                  className="rounded px-2 py-1 font-mono text-[10px] font-bold"
                  style={t === table ? { background: A, color: "#0a0a0a" } : { border: "1px solid #3f3f46", color: "#a1a1aa" }}>
                  {t.replace("x", " × ")} cm
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <Slider label="CUSTOMER WALKWAY" value={walkway} onChange={setWalkway} min={0.6} max={1.5} step={0.05} suffix=" m" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="TABLES FIT" value={calc.tables} hint={`${fmt(calc.tW, 2)}×${fmt(calc.tD, 2)} m each`} accent={A} />
            <BigStat label="FRONT CLEARANCE" value={fmt(calc.frontOpen, 2)} unit="m" hint="server + browse space" accent={A} />
            <BigStat label="SIDE RAIL" value={calc.sideFit} hint="table along a side wall" accent={A} />
          </Grid>
          <Note>The front edge stays open — customers browse from the aisle, you work the gap. Backdrop runs along the back for banners and gridwall.</Note>
        </Panel>
      }
      right={
        <Panel title="TOP-DOWN LAYOUT" accent={A}>
          <div className="relative mx-auto rounded border border-zinc-700 bg-zinc-950/60" style={{ width: 240, height: 180 }}>
            {/* back tables */}
            {Array.from({ length: Math.max(0, calc.backFit) }, (_, i) => (
              <div key={`b${i}`} className="absolute flex items-center justify-center rounded-sm border font-mono text-[7px]"
                style={{
                  left: `${((0.05 + i * (calc.tW + 0.05)) / stallW) * 100}%`,
                  top: `${backdrop ? 6 : 2}%`,
                  width: `${(calc.tW / stallW) * 100}%`,
                  height: `${(calc.tD / stallD) * 100}%`,
                  borderColor: `${A}88`, background: `${A}1a`, color: "#d4d4d8",
                }}>
                table
              </div>
            ))}
            {/* second row if exists */}
            {calc.rowsBehind > 1
              ? Array.from({ length: Math.max(0, calc.backFit) }, (_, i) => (
                  <div key={`s${i}`} className="absolute flex items-center justify-center rounded-sm border font-mono text-[7px]"
                    style={{
                      left: `${((0.05 + i * (calc.tW + 0.05)) / stallW) * 100}%`,
                      top: `${((calc.tD + walkway) / stallD) * 100 + 6}%`,
                      width: `${(calc.tW / stallW) * 100}%`,
                      height: `${(calc.tD / stallD) * 100}%`,
                      borderColor: `${A}55`, background: `${A}0d`, color: "#a1a1aa",
                    }}>
                    table
                  </div>
                ))
              : null}
            {/* backdrop */}
            {backdrop ? <div className="absolute left-0 right-0 top-0 h-1.5 rounded-t" style={{ background: A }} /> : null}
            {/* aisle */}
            <div className="absolute bottom-1 left-1 right-1 rounded border border-dashed border-zinc-600 py-0.5 text-center font-mono text-[7px] uppercase tracking-[0.25em] text-zinc-600">
              customer aisle
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <KV k="back row" v={`${calc.backFit} table${calc.backFit !== 1 ? "s" : ""}`} />
            <KV k="second row" v={calc.rowsBehind > 1 ? `${calc.backFit} more behind walkway` : "none — keep it open"} />
            <KV k="total" v={`${calc.tables} tables`} accent={A} />
          </div>
          <Out
            className="mt-3"
            label="COPY LAYOUT"
            text={`Stall ${stallW}×${stallD} m\n${calc.tables} × ${calc.tW}×${calc.tD} m tables (${calc.backFit} back row${calc.rowsBehind > 1 ? ` + ${calc.backFit} second row` : ""})\nWalkway ${fmt(walkway, 2)} m · front clearance ${fmt(calc.frontOpen, 2)} m`}
          />
        </Panel>
      }
    />
  );
}

/* ---------------------- 4. Parents' Evening Appointments ------------------- */

function ParentsEveningTool() {
  const A = accentOf(9);
  const [teachers, setTeachers] = useState("Mr Byrne: 4\nMs Adeyemi: 3\nMs Chen: 5\nMr Okafor: 2");
  const [slotMin, setSlotMin] = useState(8);
  const [breakAfter, setBreakAfter] = useState(4);
  const [breakMin, setBreakMin] = useState(10);
  const [start, setStart] = useState("17:00");

  const plan = useMemo(() => {
    const rows = teachers.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Teacher", parents: Math.max(0, num(p[1] ?? "0")) };
    });
    const st = (() => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(start.trim());
      return m ? Number(m[1]) * 60 + Number(m[2]) : 1020;
    })();
    return rows.map((r) => {
      const slots: { n: number; from: string; to: string }[] = [];
      let t = st;
      let sinceBreak = 0;
      for (let i = 0; i < r.parents; i++) {
        slots.push({ n: i + 1, from: hhmm(t), to: hhmm(t + slotMin) });
        t += slotMin;
        sinceBreak++;
        if (breakAfter > 0 && sinceBreak >= breakAfter) {
          t += breakMin;
          sinceBreak = 0;
        }
      }
      return { ...r, slots, ends: hhmm(t) };
    });
  }, [teachers, slotMin, breakAfter, breakMin, start]);

  const latest = plan.reduce((m, r) => (r.ends > m ? r.ends : m), "00:00");
  const totalSlots = plan.reduce((s, r) => s + r.parents, 0);

  return (
    <Split
      left={
        <Panel title="EVENING SETUP" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">TEACHERS — NAME : PARENTS BOOKED</span>
          <textarea
            value={teachers}
            onChange={(e) => setTeachers(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="FIRST SLOT (HH:MM)" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="SLOT MINUTES" value={slotMin} onChange={setSlotMin} min={4} max={20} accent={A} />
            <Slider label="BREAK EVERY N SLOTS" value={breakAfter} onChange={setBreakAfter} min={0} max={8} hint="0 = no breaks" accent={A} />
            <Slider label="BREAK MINUTES" value={breakMin} onChange={setBreakMin} min={5} max={20} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="APPOINTMENTS" value={totalSlots} accent={A} />
            <BigStat label="LONGEST LINE" value={plan.reduce((m, r) => Math.max(m, r.parents), 0)} unit=" slots" accent={A} />
            <BigStat label="EVENING ENDS" value={latest} accent={A} />
          </Grid>
          <Note>Every teacher gets their own column — parents walk the room, teachers stay put. Breaks land mid-line so the last parent never meets a fried teacher.</Note>
        </Panel>
      }
      right={
        <Panel title="APPOINTMENT CARDS" accent={A}>
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.map((r) => (
              <div key={r.name} className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-black" style={{ color: A }}>{r.name}</span>
                  <span className="font-mono text-[9px] text-zinc-600">till {r.ends}</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {r.slots.map((s) => (
                    <div key={s.n} className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-zinc-500">#{s.n}</span>
                      <span className="text-zinc-300">{s.from}–{s.to}</span>
                    </div>
                  ))}
                  {r.slots.length === 0 ? <p className="font-mono text-[9px] text-zinc-600">no bookings</p> : null}
                </div>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY SCHEDULE"
            text={plan.map((r) => `${r.name}: ` + r.slots.map((s) => `#${s.n} ${s.from}`).join(", ")).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ----------------------- 5. Community Hall Allocator ----------------------- */

function HallAllocationTool() {
  const A = accentOf(10);
  const [groups, setGroups] = useState("Yoga: 3\nKarate: 2\nBook club: 1\nAm-dram: 4\nToddler group: 2\nChoir: 2");
  const [weeks, setWeeks] = useState(6);
  const [slotsPerWeek, setSlotsPerWeek] = useState(3);
  const [priority, setPriority] = useState(2);

  const plan = useMemo(() => {
    const rows = groups.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Group", wants: Math.max(0, num(p[1] ?? "1")) };
    });
    const slots = weeks * slotsPerWeek;
    // weighted round-robin: repeat names by wants, deal across weeks avoiding repeat slots
    const queue: string[] = [];
    rows.forEach((r) => { for (let i = 0; i < r.wants; i++) queue.push(r.name); });
    const grid: string[][] = Array.from({ length: weeks }, () => []);
    let w = 0;
    for (const name of queue) {
      let placed = false;
      for (let t = 0; t < weeks && !placed; t++) {
        const d = (w + t) % weeks;
        if (!grid[d].includes(name) && grid[d].length < slotsPerWeek) {
          grid[d].push(name);
          w = (d + 1) % weeks;
          placed = true;
        }
      }
      if (!placed) {
        for (let t = 0; t < weeks && !placed; t++) {
          const d = (w + t) % weeks;
          if (grid[d].length < slotsPerWeek) { grid[d].push(name); placed = true; }
        }
      }
    }
    const totalWanted = queue.length;
    const allocated = grid.flat().length;
    const got = rows.map((r) => ({ ...r, got: grid.flat().filter((x) => x === r.name).length }));
    const fairness = Math.min(...got.map((g) => g.got / Math.max(1, g.wants)));
    return { grid, got, totalWanted, allocated, shortfall: totalWanted - allocated, fairness, slots };
  }, [groups, weeks, slotsPerWeek, priority]);

  return (
    <Split
      left={
        <Panel title="GROUPS & HALL" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">GROUPS — NAME : SESSIONS WANTED OVER THE TERM</span>
          <textarea
            value={groups}
            onChange={(e) => setGroups(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="WEEKS" value={weeks} onChange={setWeeks} min={2} max={14} accent={A} />
            <Slider label="SLOTS PER WEEK" value={slotsPerWeek} onChange={setSlotsPerWeek} min={1} max={7} accent={A} />
            <Slider label="PRIORITY WEIGHT" value={priority} onChange={setPriority} min={1} max={3} hint="seeded into rotation" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="SLOTS AVAILABLE" value={plan.slots} accent={A} />
            <BigStat label="REQUESTED" value={plan.totalWanted} accent={A} />
            <BigStat label={plan.shortfall > 0 ? "TURNED AWAY" : "ALL PLACED"} value={plan.shortfall > 0 ? plan.shortfall : plan.allocated} accent={plan.shortfall > 0 ? "#fbbf24" : A} />
          </Grid>
          <div className="mt-2">
            <Meter value={plan.fairness * 100} max={100} accent={A} label="FAIRNESS INDEX" right={`${(plan.fairness * 100).toFixed(0)}% of wants met`} />
          </div>
          <Note>Wants are dealt across weeks so no group books two slots in one week while another gets none. When demand exceeds slots, the shortfall shows who to ring first.</Note>
        </Panel>
      }
      right={
        <>
          <Panel title="WEEK-BY-WEEK ALLOCATION" accent={A}>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(weeks, 4)}, minmax(0,1fr))` }}>
              {plan.grid.map((g, i) => (
                <div key={i} className="min-w-0 rounded border border-zinc-800 bg-zinc-950/60 p-2">
                  <p className="mono-kicker mb-1.5" style={{ color: A }}>WEEK {i + 1}</p>
                  <div className="space-y-1">
                    {g.map((name, j) => (
                      <div key={j} className="rounded bg-zinc-800/70 px-1.5 py-1 font-mono text-[10px] text-zinc-200">{name}</div>
                    ))}
                    {Array.from({ length: Math.max(0, slotsPerWeek - g.length) }, (_, k) => (
                      <div key={`e${k}`} className="rounded border border-dashed border-zinc-800 px-1.5 py-1 font-mono text-[9px] text-zinc-600">free</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="mt-3">
            <Panel title="GOT vs WANTED" accent={A}>
              {plan.got.map((g) => (
                <KV key={g.name} k={g.name} accent={g.got >= g.wants ? A : "#fbbf24"} v={`${g.got} / ${g.wants}`} />
              ))}
              <Out className="mt-3" label="COPY ALLOCATION" text={plan.grid.map((g, i) => `Week ${i + 1}: ${g.join(", ") || "empty"}`).join("\n")} />
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* --------------------------- 6. On-Call Rotation --------------------------- */

function OnCallTool() {
  const A = accentOf(11);
  const [team, setTeam] = useState("Alex\nBlanca\nChidi\nDivya\nEero");
  const [lengthDays, setLengthDays] = useState(7);
  const [weeks, setWeeks] = useState(10);
  const [blackouts, setBlackouts] = useState("Chidi: 2026-11-20 to 2026-11-28\nBlanca: 2026-12-01 to 2026-12-05");
  const [start, setStart] = useState(() => iso(new Date()));
  const [handover, setHandover] = useState("Mon");

  const parse = (s: string) => {
    const m = /^(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})$/.exec(s.trim());
    return m ? { from: new Date(m[1] + "T00:00:00"), to: new Date(m[2] + "T00:00:00") } : null;
  };

  const plan = useMemo(() => {
    const names = team.split("\n").map((s) => s.trim()).filter(Boolean);
    const blocked = blackouts.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":");
      return { name: (p[0] || "").trim(), range: parse(p.slice(1).join(":")) };
    });
    const load = new Map<string, number>(names.map((n) => [n, 0]));
    const out: { from: string; to: string; who: string; skipped: string[] }[] = [];
    const startD = new Date(start + "T00:00:00");
    // align first handover to weekday
    const target = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(handover);
    let offset = (target - startD.getDay() + 7) % 7;
    let cursor = offset;
    let guard = 0;
    let idx = 0;
    while (cursor < weeks * 7 && guard++ < 200) {
      const from = addDays(startD, cursor);
      const to = addDays(from, lengthDays - 1);
      // pick least-loaded person not blacked out
      const sorted = [...names].sort((a, b) => (load.get(a)! - load.get(b)!) || names.indexOf(a) - names.indexOf(b));
      let chosen = sorted[0];
      const skipped: string[] = [];
      for (const n of sorted) {
        const hit = blocked.some((b) => b.name === n && b.range && from <= b.range.to && to >= b.range.from);
        if (hit) skipped.push(n);
        else { chosen = n; break; }
        chosen = n === sorted[sorted.length - 1] ? sorted.find((x) => !skipped.includes(x)) ?? chosen : chosen;
      }
      // re-pick: first non-blocked by load order
      const free = sorted.find((n) => !skipped.includes(n));
      if (free) chosen = free;
      load.set(chosen, (load.get(chosen) ?? 0) + 1);
      out.push({ from: iso(from), to: iso(to), who: chosen, skipped });
      cursor += lengthDays;
      idx++;
    }
    return { out, load: [...load.entries()].sort((a, b) => b[1] - a[1]), names };
  }, [team, lengthDays, weeks, blackouts, start, handover]);

  const maxLoad = Math.max(...plan.load.map(([, n]) => n), 1);

  return (
    <Split
      left={
        <Panel title="TEAM & BLACKOUTS" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">TEAM — ONE NAME PER LINE</span>
          <textarea
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">BLACKOUTS — NAME : YYYY-MM-DD TO YYYY-MM-DD</span>
          <textarea
            value={blackouts}
            onChange={(e) => setBlackouts(e.target.value)}
            rows={3}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="ROTATION STARTS" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Slider label="SHIFT LENGTH" value={lengthDays} onChange={setLengthDays} min={1} max={14} suffix=" days" accent={A} />
            <Slider label="WEEKS TO PLAN" value={weeks} onChange={setWeeks} min={4} max={26} accent={A} />
          </div>
          <Row className="mt-3">
            <div>
              <span className="mono-kicker mb-1.5 block text-zinc-500">HANDOVER DAY</span>
              <div className="flex gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                  <button key={d} type="button" onClick={() => setHandover(d)}
                    className="rounded px-2 py-1 font-mono text-[10px] font-bold"
                    style={d === handover ? { background: A, color: "#0a0a0a" } : { border: "1px solid #3f3f46", color: "#a1a1aa" }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </Row>
        </Panel>
      }
      right={
        <>
          <Panel title="ON-CALL CALENDAR" accent={A}>
            <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
              {plan.out.map((o, i) => (
                <div key={i} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                  <span className="w-24 shrink-0 font-mono text-[10px] text-zinc-500">{o.from.slice(5)} → {o.to.slice(5)}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-black" style={{ color: A }}>{o.who}</span>
                  {o.skipped.length ? <Tag accent="#f87171">skipped {o.skipped.join(", ")}</Tag> : null}
                </div>
              ))}
            </div>
            <Out
              className="mt-3"
              label="COPY CALENDAR"
              text={plan.out.map((o) => `${o.from} → ${o.to}: ${o.who}${o.skipped.length ? ` (blackout: ${o.skipped.join(", ")})` : ""}`).join("\n")}
            />
          </Panel>
          <div className="mt-3">
            <Panel title="LOAD BALANCE" accent={A}>
              {plan.load.map(([n, l]) => (
                <div key={n} className="mb-2">
                  <Meter value={l} max={maxLoad} accent={A} label={n} right={`${l} shifts`} />
                </div>
              ))}
              <Note>Blackout shifts skip to the next available person — their load drops, and the wheel re-balances automatically. Nobody serves two consecutive shifts unless the maths forces it.</Note>
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ----------------------- 7. Theatre Rehearsal Board ------------------------ */

function RehearsalTool() {
  const A = accentOf(12);
  const [scenes, setScenes] = useState("Act 1 Sc 1: Sam, Maya, Ioan\nAct 1 Sc 3: Maya, Priya\nAct 2 Sc 1: Sam, Ioan, Rex\nAct 2 Sc 4: Maya, Rex\nAct 3 Sc 2: Sam, Maya, Priya, Ioan");
  const [rooms, setRooms] = useState(2);
  const [blocks, setBlocks] = useState(4);
  const [blockMin, setBlockMin] = useState(90);

  const plan = useMemo(() => {
    const rows = scenes.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":");
      return { name: (p[0] || "Scene").trim(), cast: (p.slice(1).join(":") || "").split(",").map((s) => s.trim()).filter(Boolean) };
    });
    // schedule: each block fills rooms with scenes whose cast doesn't collide
    const board: { block: number; rooms: { scene: string; cast: string[]; room: number }[] }[] = [];
    const queue = [...rows];
    for (let b = 0; b < blocks && queue.length; b++) {
      const roomRows: { scene: string; cast: string[]; room: number }[] = [];
      const busy = new Set<string>();
      const remaining: typeof queue = [];
      let room = 1;
      for (const s of queue) {
        const clash = s.cast.some((c) => busy.has(c));
        if (!clash && room <= rooms) {
          roomRows.push({ scene: s.name, cast: s.cast, room });
          s.cast.forEach((c) => busy.add(c));
          room++;
        } else remaining.push(s);
      }
      board.push({ block: b + 1, rooms: roomRows });
      queue.length = 0;
      queue.push(...remaining);
    }
    // idle calls per actor
    const allCast = [...new Set(rows.flatMap((r) => r.cast))];
    const idle = allCast.map((c) => ({
      name: c,
      in: board.filter((b) => b.rooms.some((r) => r.cast.includes(c))).length,
      of: board.length,
    })).sort((a, b) => a.in - b.in);
    return { board, allCast, idle, unscheduled: queue.length };
  }, [scenes, rooms, blocks]);

  return (
    <Split
      left={
        <Panel title="SCENES & CAST" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SCENES — NAME : CAST (COMMA SEPARATED)</span>
          <textarea
            value={scenes}
            onChange={(e) => setScenes(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="REHEARSAL ROOMS" value={rooms} onChange={setRooms} min={1} max={5} accent={A} />
            <Slider label="BLOCKS THIS SESSION" value={blocks} onChange={setBlocks} min={1} max={8} accent={A} />
            <Slider label="MINUTES PER BLOCK" value={blockMin} onChange={setBlockMin} min={30} max={150} step={15} suffix=" min" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="SCENES" value={scenes.split("\n").filter((s) => s.trim()).length} accent={A} />
            <BigStat label="ACTORS" value={plan.allCast.length} accent={A} />
            <BigStat label={plan.unscheduled > 0 ? "LEFT OVER" : "ALL CALLED"} value={plan.unscheduled > 0 ? plan.unscheduled : plan.board.reduce((s, b) => s + b.rooms.length, 0)} hint={plan.unscheduled > 0 ? "needs another session" : "across all blocks"} accent={plan.unscheduled > 0 ? "#fbbf24" : A} />
          </Grid>
          <Note>A scene takes a room when none of its cast is already called in that block — that&apos;s the whole rule. The idle table shows who gets a coffee while the others sweat.</Note>
        </Panel>
      }
      right={
        <>
          <Panel title="CALL BOARD" accent={A}>
            <div className="space-y-2">
              {plan.board.map((b) => (
                <div key={b.block}>
                  <p className="mono-kicker mb-1" style={{ color: A }}>BLOCK {b.block} · {hhmm(9 * 60 + (b.block - 1) * blockMin)}–{hhmm(9 * 60 + b.block * blockMin)}</p>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(rooms, 3)}, minmax(0,1fr))` }}>
                    {b.rooms.map((r) => (
                      <div key={r.room} className="min-w-0 rounded border border-zinc-800 bg-zinc-950/60 p-1.5">
                        <p className="truncate font-mono text-[10px] font-bold text-zinc-200">{r.scene}</p>
                        <p className="font-mono text-[9px] text-zinc-500">R{r.room} · {r.cast.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Out
              className="mt-3"
              label="COPY CALL BOARD"
              text={plan.board.map((b) => `Block ${b.block}: ` + b.rooms.map((r) => `${r.scene} (R${r.room}: ${r.cast.join("/")})`).join(" | ")).join("\n")}
            />
          </Panel>
          <div className="mt-3">
            <Panel title="IDLE CALLS" accent={A}>
              {plan.idle.map((p) => (
                <KV key={p.name} k={p.name} accent={p.in === 0 ? "#fbbf24" : undefined} v={`${p.in} of ${p.of} blocks`} />
              ))}
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const rotasMeta: ToolMeta[] = [
  {
    id: "conference-scheduler",
    name: "Conference Scheduler",
    description: "Sessions, rooms and speakers → a day grid that defers clashes instead of double-booking.",
    category: "business",
    icon: Building,
    keywords: "conference workshop session scheduler rooms tracks speakers clash",
    badge: "new",
    component: ConferenceTool,
  },
  {
    id: "carpool-rotation",
    name: "Carpool Driver Wheel",
    description: "Who has seats, who needs rides → a driver wheel with capacity maths and zero money talk.",
    category: "business",
    icon: Car,
    keywords: "carpool rotation schedule drivers passengers fairness commute",
    badge: "new",
    component: CarpoolTool,
  },
  {
    id: "stall-layout",
    name: "Craft Fair Stall Layout",
    description: "Stall size + table size → how many tables fit and where the customer walkway goes.",
    category: "business",
    icon: Store,
    keywords: "craft fair stall layout planner tables walkway market",
    badge: "new",
    component: StallLayoutTool,
  },
  {
    id: "parents-evening",
    name: "Parents' Evening Planner",
    description: "Teachers and bookings → staggered appointment cards with breaks that actually happen.",
    category: "business",
    icon: Users,
    keywords: "parents evening appointment planner teachers parents slots school",
    badge: "new",
    component: ParentsEveningTool,
  },
  {
    id: "hall-allocation",
    name: "Community Hall Allocator",
    description: "Groups × wanted sessions × weeks → a fairness-indexed allocation with the shortfall named.",
    category: "business",
    icon: Landmark,
    keywords: "community hall allocation planner groups slots fairness weeks",
    badge: "new",
    component: HallAllocationTool,
  },
  {
    id: "oncall-rotation",
    name: "On-Call Rotation",
    description: "Team, shift length and blackout dates → a dated on-call calendar that skips and re-balances.",
    category: "business",
    icon: PhoneCall,
    keywords: "on call rotation planner team blackout dates fairness pager",
    badge: "new",
    component: OnCallTool,
  },
  {
    id: "rehearsal-rotation",
    name: "Rehearsal Call Board",
    description: "Scenes, casts and rooms → which actors are called where, and who gets the coffee break.",
    category: "business",
    icon: Drama,
    keywords: "theatre rehearsal rotation planner scenes cast rooms blocks",
    badge: "new",
    component: RehearsalTool,
  },
];
