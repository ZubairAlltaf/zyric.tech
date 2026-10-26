"use client";

/* ==========================================================================
   KIT: PLAY & KEEP — 4 tools for builds, beasts and campaigns. A Minecraft
   block budget by wall/floor/roof, a houseplant watering calendar, a D&D
   travel calendar with encounter checks, and a brick mosaic colour counter.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Boxes, Droplet, Swords, Grid2x2 } from "lucide-react";
import {
  BigStat,
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
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ------------------------- 1. Minecraft Block Planner ---------------------- */

function MinecraftTool() {
  const A = accentOf(2);
  const [L, setL] = useState(15);
  const [W, setW] = useState(9);
  const [H, setH] = useState(6);
  const [thick, setThick] = useState(1);
  const [roof, setRoof] = useState<"flat" | "gable" | "pyramid">("gable");
  const [doors, setDoors] = useState(2);
  const [windows, setWindows] = useState(6);

  const calc = useMemo(() => {
    // walls: outer shell perimeter layers
    const perimeter = 2 * (L + W) - 4; // corner-corrected
    const outer = perimeter * H;
    const innerPer = Math.max(0, perimeter - 8 * thick); // rough inner ring per extra layer
    const walls = Math.round((outer + Math.max(0, thick - 1) * innerPer * H) - (doors * 4 + windows * 6));
    const floor = L * W;
    const interiorW = Math.max(1, L - 2 * thick);
    const interiorL = Math.max(1, W - 2 * thick);
    let roofBlocks = 0;
    if (roof === "flat") roofBlocks = interiorW * interiorL;
    else if (roof === "gable") {
      // two sloped slabs + ridge, stepped approximation
      const span = Math.max(1, interiorL);
      roofBlocks = Math.ceil(span / 2) * interiorW * 2 + interiorW * 2;
    } else {
      // pyramid: concentric rings
      const s = Math.max(1, Math.min(interiorW, interiorL));
      let acc = 0;
      for (let r = s; r > 0; r -= 2) acc += r * r;
      roofBlocks = acc;
    }
    const total = walls + floor + roofBlocks;
    const stacks = total / 64;
    return { walls, floor, roofBlocks, total, stacks, doors, windows };
  }, [L, W, H, thick, roof, doors, windows]);

  const BUILD_ORDER = ["floor slab", "wall rings", "door & window holes", "cornice", "roof shell", "interior"];

  return (
    <Split
      left={
        <Panel title="BUILD DIMENSIONS" accent={A}>
          <Row>
            <Field label="LENGTH (BLOCKS)" type="number" value={L} onChange={(v) => setL(num(v))} />
            <Field label="WIDTH (BLOCKS)" type="number" value={W} onChange={(v) => setW(num(v))} />
            <Field label="WALL HEIGHT" type="number" value={H} onChange={(v) => setH(num(v))} />
          </Row>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">ROOF TYPE</span>
            <Seg value={roof} onChange={setRoof} accent={A} options={[{ v: "flat", label: "Flat" }, { v: "gable", label: "Gable" }, { v: "pyramid", label: "Pyramid" }] as const} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="WALL THICKNESS" value={thick} onChange={setThick} min={1} max={3} suffix=" blk" accent={A} />
            <Slider label="DOOR BLOCKS" value={doors} onChange={setDoors} min={0} max={8} accent={A} />
            <Slider label="WINDOW BLOCKS" value={windows} onChange={setWindows} min={0} max={30} accent={A} />
          </div>
          <Grid cols={4}>
            <BigStat label="TOTAL BLOCKS" value={fmt(calc.total, 0)} accent={A} />
            <BigStat label="STACKS" value={fmt(calc.stacks, 1)} hint="×64" accent={A} />
            <BigStat label="WALLS" value={fmt(calc.walls, 0)} accent={A} />
            <BigStat label="ROOF" value={fmt(calc.roofBlocks, 0)} hint={roof} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <>
          <Panel title="MATERIAL BREAKDOWN" accent={A}>
            <div className="space-y-2">
              {[
                { k: "Walls (minus openings)", v: calc.walls, note: `${doors} door + ${windows} window blocks removed` },
                { k: "Floor", v: calc.floor, note: `${L}×${W} slab` },
                { k: `Roof (${roof})`, v: calc.roofBlocks, note: roof === "gable" ? "slopes + ridge" : roof === "flat" ? "cap slab" : "stepped rings" },
              ].map((r) => (
                <div key={r.k} className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-zinc-200">{r.k}</span>
                    <span className="font-mono text-[12px] font-black" style={{ color: A }}>{fmt(r.v, 0)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full" style={{ width: `${(r.v / Math.max(1, calc.total)) * 100}%`, background: A }} />
                  </div>
                  <p className="mt-0.5 font-mono text-[9px] text-zinc-600">{r.note} · {fmt(r.v / 64, 2)} stacks</p>
                </div>
              ))}
            </div>
            <Out
              className="mt-3"
              label="COPY SHOPPING LIST"
              text={`Build ${L}×${W}×${H} (${thick}-blk walls, ${roof} roof)\nWalls: ${fmt(calc.walls, 0)} blocks\nFloor: ${fmt(calc.floor, 0)} blocks\nRoof: ${fmt(calc.roofBlocks, 0)} blocks\nTOTAL: ${fmt(calc.total, 0)} blocks = ${fmt(calc.stacks, 1)} stacks`}
            />
          </Panel>
          <div className="mt-3">
            <Panel title="BUILD ORDER" accent={A}>
              <div className="flex flex-wrap gap-1.5">
                {BUILD_ORDER.map((s, i) => (
                  <Tag key={s} accent={A}>{i + 1}. {s}</Tag>
                ))}
              </div>
              <Note>Openings are subtracted from wall count — doors eat 4 blocks, windows 6. If you&apos;re playing with tools that drop different drops (cobble vs stone), add a 10% buffer.</Note>
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ----------------------- 2. Houseplant Watering Calendar ------------------- */

function WateringCalendarTool() {
  const A = accentOf(3);
  const [plants, setPlants] = useState("Monstera: 7: 2026-10-20\nFiddle fig: 5: 2026-10-23\nSnake plant: 21: 2026-10-10\nPothos: 10: 2026-10-18\nCalathea: 4: 2026-10-24");
  const [days, setDays] = useState(14);

  const rows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return plants
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const p = l.split(":").map((s) => s.trim());
        const last = p[2] ? new Date(p[2] + "T00:00:00") : null;
        const interval = Math.max(1, num(p[1] ?? "7"));
        const next = last ? addDays(last, interval) : null;
        const dueIn = next ? Math.round((next.getTime() - today.getTime()) / 86400000) : null;
        const events: { date: string; overdue: boolean }[] = [];
        if (next) {
          for (let i = 0; i < 12; i++) {
            const d = addDays(next, i * interval);
            if ((d.getTime() - today.getTime()) / 86400000 > days) break;
            events.push({ date: iso(d), overdue: d < today });
          }
        }
        return {
          name: p[0] || "Plant",
          interval,
          last: p[2] || "",
          next: next ? iso(next) : "",
          dueIn,
          events,
        };
      })
      .sort((a, b) => (a.dueIn ?? 99) - (b.dueIn ?? 99));
  }, [plants, days]);

  const todayList = rows.filter((r) => (r.dueIn ?? 99) <= 0);
  const weekList = rows.filter((r) => (r.dueIn ?? 99) > 0 && (r.dueIn ?? 99) <= 7);

  return (
    <Split
      left={
        <Panel title="YOUR JUNGLE" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">PLANTS — NAME : EVERY N DAYS : LAST WATERED</span>
          <textarea
            value={plants}
            onChange={(e) => setPlants(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3">
            <Slider label="CALENDAR WINDOW" value={days} onChange={setDays} min={7} max={45} suffix=" days" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="DUE TODAY" value={todayList.length} accent={todayList.length ? "#f87171" : A} />
            <BigStat label="DUE THIS WEEK" value={weekList.length} accent={A} />
            <BigStat label="PLANTS" value={rows.length} accent={A} />
          </Grid>
          <Note>No app, no account, no notifications — type the last date, get the calendar. Update the last-watered date after each round and the whole wheel turns.</Note>
        </Panel>
      }
      right={
        <>
          <Panel title="TODAY & THIS WEEK" accent={A}>
            {todayList.length === 0 && weekList.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing thirsty in the next 7 days. Suspicious.</p>
            ) : (
              <div className="space-y-1">
                {[...todayList, ...weekList].map((r) => (
                  <div key={r.name} className="flex items-center gap-2 rounded border px-2 py-1.5"
                    style={{ borderColor: (r.dueIn ?? 0) <= 0 ? "#f8717155" : `${A}44`, background: (r.dueIn ?? 0) <= 0 ? "#f8717110" : `${A}08` }}>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold text-zinc-200">{r.name}</span>
                    <span className="font-mono text-[10px] text-zinc-500">every {r.interval}d</span>
                    <Tag accent={(r.dueIn ?? 0) <= 0 ? "#f87171" : A}>{(r.dueIn ?? 0) <= 0 ? "OVERDUE" : `in ${r.dueIn}d`}</Tag>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <div className="mt-3">
            <Panel title={`${days}-DAY CALENDAR`} accent={A}>
              <div className="space-y-1">
                {rows.map((r) => (
                  <div key={r.name} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                    <span className="w-20 shrink-0 truncate font-mono text-[10px] font-bold text-zinc-200">{r.name}</span>
                    <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                      {r.events.map((e) => (
                        <span key={e.date} className="rounded px-1 py-0.5 font-mono text-[9px]"
                          style={{ background: e.overdue ? "#f8717122" : `${A}14`, color: e.overdue ? "#f87171" : A }}>
                          {e.date.slice(5)}
                        </span>
                      ))}
                      {r.events.length === 0 ? <span className="font-mono text-[9px] text-zinc-600">no date — add last-watered</span> : null}
                    </div>
                  </div>
                ))}
              </div>
              <Out
                className="mt-3"
                label="COPY CALENDAR"
                text={rows.map((r) => `${r.name}: next ${r.next}${r.events.length > 1 ? `, then every ${r.interval} days` : ""}`).join("\n")}
              />
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* --------------------------- 3. D&D Travel Calendar ------------------------ */

function DnDTravelTool() {
  const A = accentOf(4);
  const [legs, setLegs] = useState("Road to Neverwinter: 90: 24: 1\nKryptgarden Forest: 45: 12: 0.7\nMountain pass: 60: 18: 0.5\nOld mine road: 30: 24: 1");
  const [restEvery, setRestEvery] = useState(5);
  const [start, setStart] = useState(() => iso(new Date()));
  const [encounterDc, setEncounterDc] = useState(12);

  const calc = useMemo(() => {
    const rows = legs.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Leg", miles: num(p[1] ?? "0"), pace: num(p[2] ?? "24"), terrain: num(p[3] ?? "1") };
    });
    let day = 0;
    let sinceRest = 0;
    let sinceEnc = 0;
    const out: { leg: string; from: string; days: number; arrive: string; encounter: boolean }[] = [];
    rows.forEach((r) => {
      const eff = Math.max(3, r.pace * r.terrain);
      const daysNeeded = Math.max(1, Math.ceil(r.miles / eff));
      const from = iso(addDays(new Date(start + "T00:00:00"), day));
      let enc = false;
      for (let d = 0; d < daysNeeded; d++) {
        day++;
        sinceRest++;
        sinceEnc++;
        if (sinceRest >= restEvery) { day++; sinceRest = 0; } // long rest day
        if (sinceEnc >= 3) { enc = true; sinceEnc = 0; } // encounter-check day
      }
      out.push({ leg: r.name, from, days: daysNeeded, arrive: iso(addDays(new Date(start + "T00:00:00"), day)), encounter: enc });
    });
    return { out, totalDays: day };
  }, [legs, restEvery, start, encounterDc]);

  return (
    <Split
      left={
        <Panel title="ROUTE & PACE" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">LEGS — NAME : MILES : PACE (MI/DAY) : TERRAIN FACTOR</span>
          <textarea
            value={legs}
            onChange={(e) => setLegs(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="DEPARTURE" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Slider label="REST DAY EVERY N DAYS" value={restEvery} onChange={setRestEvery} min={2} max={9} accent={A} />
            <Slider label="ENCOUNTER-CHECK RHYTHM" value={encounterDc} onChange={setEncounterDc} min={5} max={20} hint={`roll ≥ ${encounterDc} on check days`} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="LEGS" value={calc.out.length} accent={A} />
            <BigStat label="TOTAL DAYS" value={calc.totalDays} accent={A} />
            <BigStat label="ARRIVE" value={calc.out.length ? calc.out[calc.out.length - 1].arrive : "—"} accent={A} />
          </Grid>
          <Note>Effective pace = pace × terrain (1 = road, 0.7 = forest, 0.5 = mountains). Rest days every N travel days keep the party fresh — encounter-check days land every third day on the road.</Note>
        </Panel>
      }
      right={
        <Panel title="CAMPAIGN CALENDAR" accent={A}>
          <div className="space-y-1.5">
            {calc.out.map((r, i) => (
              <div key={i} className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-zinc-200">{r.leg}</span>
                  <div className="flex gap-1">
                    {r.encounter ? <Tag accent="#f87171">encounter check</Tag> : null}
                    <Tag accent={A}>arrive {r.arrive}</Tag>
                  </div>
                </div>
                <p className="mt-0.5 font-mono text-[9px] text-zinc-600">depart {r.from} · {r.days} travel day{r.days !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY CALENDAR"
            text={calc.out.map((r) => `${r.leg}: ${r.from} → ${r.arrive} (${r.days} d${r.encounter ? ", encounter checks" : ""})`).join("\n") + `\nJourney total: ${calc.totalDays} days`}
          />
        </Panel>
      }
    />
  );
}

/* --------------------------- 4. Brick Mosaic Planner ----------------------- */

function BrickMosaicTool() {
  const A = accentOf(5);
  const [w, setW] = useState(24);
  const [h, setH] = useState(16);
  const [colours, setColours] = useState("Sky: 5\nCloud white: 2\nGrass: 4\nTrunk brown: 1\nLeaf green: 3");
  const [rule, setRule] = useState<"rows" | "columns" | "diagonal" | "border">("rows");

  const calc = useMemo(() => {
    const list = colours.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Colour", band: Math.max(1, num(p[1] ?? "1")) };
    });
    const total = w * h;
    const counts = list.map(() => 0);
    const bandTotal = list.reduce((s, r) => s + r.band, 0) || 1;
    // build band lookup
    const bands: number[] = []; // index per row (or col) → colour idx
    if (rule === "border") {
      // ring pattern: outer bands use first colour, etc. by distance from edge
      const ring = (r: number, c: number) => Math.min(r, c, h - 1 - r, w - 1 - c);
      for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
        const d = ring(r, c);
        const idx = Math.min(list.length - 1, Math.floor((d / Math.max(1, Math.min(w, h) / 2)) * bandTotal));
        // map proportional distance → colour
        let acc = 0;
        let chosen = 0;
        for (let i = 0; i < list.length; i++) {
          acc += list[i].band;
          if (d * (bandTotal / Math.max(1, Math.floor(Math.min(w, h) / 2))) <= acc) { chosen = i; break; }
        }
        counts[chosen]++;
      }
    } else {
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          const line = rule === "rows" ? r : rule === "columns" ? c : (r + c) % Math.max(1, h);
          // band fill: line → colour via cumulative bands
          const pos = line % bandTotal;
          let acc = 0;
          let chosen = 0;
          for (let i = 0; i < list.length; i++) {
            acc += list[i].band;
            if (pos < acc) { chosen = i; break; }
          }
          counts[chosen]++;
        }
      }
    }
    return { list, counts, total, w, h };
  }, [w, h, colours, rule]);

  const HUES = ["#7FC8FF", "#ffffff", "#5EE39A", "#B9A6FF", "#FFD43B", "#FF7A3D", "#4ECDC4", "#FF9DE2"];

  return (
    <Split
      left={
        <Panel title="WALL SIZE & PATTERN" accent={A}>
          <Row>
            <Field label="WIDTH (STUDS)" type="number" value={w} onChange={(v) => setW(num(v))} />
            <Field label="HEIGHT (STUDS)" type="number" value={h} onChange={(v) => setH(num(v))} />
          </Row>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">PATTERN RULE</span>
            <Seg
              value={rule}
              onChange={setRule}
              accent={A}
              options={[
                { v: "rows", label: "Row bands" },
                { v: "columns", label: "Columns" },
                { v: "diagonal", label: "Diagonal" },
                { v: "border", label: "Concentric" },
              ] as const}
            />
          </div>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">COLOURS — NAME : BAND WIDTH</span>
          <textarea
            value={colours}
            onChange={(e) => setColours(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Grid cols={3}>
            <BigStat label="TOTAL BRICKS" value={calc.total} hint="1×1 plates" accent={A} />
            <BigStat label="COLOURS" value={calc.list.length} accent={A} />
            <BigStat label="CANVAS" value={`${calc.w}×${calc.h}`} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <>
          <Panel title="MOSAIC PREVIEW" accent={A}>
            <div className="inline-grid gap-px rounded border border-zinc-800 bg-zinc-950 p-1" style={{ gridTemplateColumns: `repeat(${Math.min(w, 36)}, 6px)` }}>
              {Array.from({ length: Math.min(w, 36) * Math.min(h, 24) }, (_, i) => {
                const r = Math.floor(i / Math.min(w, 36));
                const c = i % Math.min(w, 36);
                // recompute colour same as calc (visual approximation)
                const bandTotal = calc.list.reduce((s, x) => s + x.band, 0) || 1;
                let chosen = 0;
                if (rule === "border") {
                  const d = Math.min(r, c, h - 1 - r, w - 1 - c);
                  let acc = 0;
                  for (let k = 0; k < calc.list.length; k++) {
                    acc += calc.list[k].band;
                    if (d * (bandTotal / Math.max(1, Math.floor(Math.min(w, h) / 2))) <= acc) { chosen = k; break; }
                  }
                } else {
                  const line = rule === "rows" ? r : rule === "columns" ? c : (r + c) % Math.max(1, h);
                  const pos = line % bandTotal;
                  let acc = 0;
                  for (let k = 0; k < calc.list.length; k++) {
                    acc += calc.list[k].band;
                    if (pos < acc) { chosen = k; break; }
                  }
                }
                return <span key={i} className="inline-block h-[6px] w-[6px]" style={{ background: HUES[chosen % HUES.length] }} />;
              })}
            </div>
            {w > 36 || h > 24 ? <p className="mt-1 font-mono text-[9px] text-zinc-600">preview cropped — counts below are exact</p> : null}
          </Panel>
          <div className="mt-3">
            <Panel title="BRICKS PER COLOUR" accent={A}>
              <div className="space-y-0.5">
                {calc.list.map((r, i) => (
                  <KV key={r.name} k={r.name} v={`${calc.counts[i]} bricks (${((calc.counts[i] / calc.total) * 100).toFixed(0)}%)`} accent={A} />
                ))}
              </div>
              <Out
                className="mt-3"
                label="COPY COUNTS"
                text={calc.list.map((r, i) => `${r.name}: ${calc.counts[i]}`).join("\n") + `\nTotal ${calc.total} 1×1 bricks on a ${w}×${h} wall`}
              />
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const playMeta: ToolMeta[] = [
  {
    id: "minecraft-blocks",
    name: "Minecraft Build Planner",
    description: "Build size, wall thickness and roof type → block counts per part, in stacks.",
    category: "fun",
    icon: Boxes,
    keywords: "minecraft build block planner walls roof floor stacks castle",
    badge: "new",
    component: MinecraftTool,
  },
  {
    id: "watering-calendar",
    name: "Houseplant Watering Calendar",
    description: "Intervals + last-watered dates → who's thirsty today, this week, and the next round.",
    category: "fun",
    icon: Droplet,
    keywords: "houseplant watering schedule calendar rotation plants due",
    badge: "new",
    component: WateringCalendarTool,
  },
  {
    id: "dnd-travel",
    name: "D&D Travel Calendar",
    description: "Legs with pace and terrain → arrival dates, rest days and encounter-check days.",
    category: "fun",
    icon: Swords,
    keywords: "d&d travel planner days pace encounters campaign calendar",
    badge: "new",
    component: DnDTravelTool,
  },
  {
    id: "brick-mosaic",
    name: "Brick Mosaic Planner",
    description: "Grid + colour bands → exact brick counts per colour for your mosaic wall.",
    category: "fun",
    icon: Grid2x2,
    keywords: "brick mosaic planner colours grid rows counts lego wall",
    badge: "new",
    component: BrickMosaicTool,
  },
];
