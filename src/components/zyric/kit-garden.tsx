"use client";

/* ==========================================================================
   KIT: GARDEN & SMALLHOLDING I — 6 tools for growers. A rotational grazing
   move calendar, a frost-date seed-starting and succession calendar, a
   multi-year crop-rotation bed map, a plant spacing layout generator, a
   drip irrigation zone planner and a raised-bed soil mix calculator.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Wheat, Sprout, Repeat2, Ruler, Droplets, Layers } from "lucide-react";
import {
  BigStat,
  Field,
  Grid,
  KV,
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
function shortDate(s: string): string {
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ------------------------- 1. Rotational Grazing -------------------------- */

function GrazingTool() {
  const A = accentOf(9);
  const [herd, setHerd] = useState(40);
  const [grazeDays, setGrazeDays] = useState(2);
  const [restDays, setRestDays] = useState(24);
  const [paddocksHave, setPaddocksHave] = useState(13);
  const [start, setStart] = useState(() => iso(new Date()));

  const need = Math.ceil(restDays / Math.max(1, grazeDays)) + 1;
  const rotationLen = need * grazeDays;
  const moves = useMemo(() => {
    const out: { move: number; date: string; paddock: number; backOn: string }[] = [];
    for (let i = 0; i < Math.min(need * 2, 24); i++) {
      const d = addDays(new Date(start + "T00:00:00"), i * grazeDays);
      out.push({
        move: i + 1,
        date: iso(d),
        paddock: (i % need) + 1,
        backOn: iso(addDays(d, rotationLen)),
      });
    }
    return out;
  }, [start, grazeDays, need, rotationLen]);

  const tight = paddocksHave < need;

  return (
    <Split
      left={
        <Panel title="HERD & GRASS" accent={A}>
          <Row>
            <Field label="HERD SIZE (HEAD)" type="number" value={herd} onChange={(v) => setHerd(num(v))} />
            <Field label="FIRST MOVE" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="DAYS PER PADDOCK (GRAZE)" value={grazeDays} onChange={setGrazeDays} min={1} max={7} accent={A} />
            <Slider label="REST DAYS BEFORE RE-GRAZE" value={restDays} onChange={setRestDays} min={10} max={60} step={1} accent={A} />
            <Slider label="PADDOCKS YOU HAVE" value={paddocksHave} onChange={setPaddocksHave} min={2} max={40} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="PADDOCKS NEEDED" value={need} accent={A} hint="(rest ÷ graze) + 1" />
            <BigStat label="ROTATION LENGTH" value={rotationLen} unit="days" accent={A} />
            <BigStat label={tight ? "SHORT BY" : "SPARE"} value={tight ? need - paddocksHave : paddocksHave - need} accent={tight ? "#fbbf24" : A} hint={tight ? "subdivide or lengthen graze days" : "room to extend rest"} />
          </Grid>
          <Note>The Penn State formula: paddocks = (rest days ÷ graze days) + 1. The spare paddock is the one growing back while the wheel turns — never skip it.</Note>
        </Panel>
      }
      right={
        <Panel title="MOVE CALENDAR" accent={A}>
          <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {moves.map((m) => (
              <div key={m.move} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                <span className="w-10 shrink-0 font-mono text-[10px] text-zinc-500">#{m.move}</span>
                <span className="w-16 shrink-0 font-mono text-[11px] font-bold" style={{ color: A }}>{shortDate(m.date)}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-300">→ Paddock {m.paddock}</span>
                <span className="hidden font-mono text-[9px] text-zinc-600 sm:block">re-graze {shortDate(m.backOn)}</span>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY CALENDAR"
            text={moves.map((m) => `${m.date}: move to paddock ${m.paddock} (graze ${grazeDays} d, back on ${m.backOn})`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* -------------------- 2. Seed-Starting & Succession ----------------------- */

function SeedCalendarTool() {
  const A = accentOf(10);
  const [lastFrost, setLastFrost] = useState(() => {
    const d = addDays(new Date(), 120);
    return iso(d);
  });
  const [firstFrost, setFirstFrost] = useState(() => {
    const d = addDays(new Date(), 240);
    return iso(d);
  });
  const [crops, setCrops] = useState("Lettuce: 4: 2: 55: 14\nTomatoes: 6: 0: 80: 0\nBeans: 1: 3: 60: 10\nCarrots: -2: 14: 70: 21\nCucumbers: 3: 0: 65: 14\nPeas: 6: 14: 60: 0");

  const rows = useMemo(() => {
    const lf = new Date(lastFrost + "T00:00:00");
    const ff = new Date(firstFrost + "T00:00:00");
    return crops
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const p = l.split(":").map((s) => s.trim());
        const name = p[0] || "Crop";
        const weeksBefore = num(p[1] ?? "0"); // negative = after frost
        const interval = num(p[2] ?? "0"); // succession weeks (0 = none)
        const harvest = num(p[3] ?? "60"); // days to harvest
        const window = num(p[4] ?? "0"); // succession window weeks
        const sow = addDays(lf, Math.round(weeksBefore * 7));
        const out: { name: string; sow: string; plant: string; harvest: string; sowings: number } = {
          name,
          sow: iso(sow),
          plant: iso(addDays(sow, weeksBefore >= 0 ? 28 : 0)),
          harvest: iso(addDays(sow, harvest)),
          sowings: 1,
        };
        if (interval > 0 && window > 0) {
          out.sowings = Math.floor((window * 7) / Math.max(1, interval * 7)) + 1;
        }
        // clamp successive sowings before first frost
        if (out.sowings > 1) {
          let last = addDays(sow, (out.sowings - 1) * interval * 7);
          while (last.getTime() + harvest * 86400000 > ff.getTime() && out.sowings > 1) {
            out.sowings--;
            last = addDays(sow, (out.sowings - 1) * interval * 7);
          }
        }
        return out;
      });
  }, [lastFrost, firstFrost, crops]);

  return (
    <Split
      left={
        <Panel title="YOUR FROST DATES" accent={A}>
          <Row>
            <Field label="LAST SPRING FROST" type="date" value={lastFrost} onChange={setLastFrost} />
            <Field label="FIRST AUTUMN FROST" type="date" value={firstFrost} onChange={setFirstFrost} />
          </Row>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">CROPS — NAME : WEEKS BEFORE FROST : SUCCESSION WEEKS : DAYS TO HARVEST : WINDOW WEEKS</span>
          <textarea
            value={crops}
            onChange={(e) => setCrops(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Grid cols={2}>
            <BigStat label="CROPS PLANNED" value={rows.length} accent={A} />
            <BigStat label="TOTAL SOWINGS" value={rows.reduce((s, r) => s + r.sowings, 0)} accent={A} />
          </Grid>
          <Note>Weeks before the last frost: start tomatoes indoors (+6), sow carrots direct after (−2). Succession crops (lettuce, beans) repeat every N weeks until the harvest window closes before your first frost.</Note>
        </Panel>
      }
      right={
        <Panel title="DATED SOWING CALENDAR" accent={A}>
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div key={r.name} className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-zinc-200">{r.name}</span>
                  {r.sowings > 1 ? <Tag accent={A}>{r.sowings} sowings</Tag> : <Tag>sow once</Tag>}
                </div>
                <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[9px]">
                  <div><p className="text-zinc-600">first sow</p><p style={{ color: A }}>{shortDate(r.sow)}</p></div>
                  <div><p className="text-zinc-600">plant out</p><p className="text-zinc-300">{shortDate(r.plant)}</p></div>
                  <div><p className="text-zinc-600">harvest from</p><p className="text-zinc-300">{shortDate(r.harvest)}</p></div>
                </div>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY CALENDAR"
            text={rows
              .map((r) => `${r.name}: sow ${r.sow}${r.sowings > 1 ? ` then every ${crops.split(":")[2]?.trim() || ""} wk (×${r.sowings})` : ""}, plant out ${r.plant}, harvest from ${r.harvest}`)
              .join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------- 3. Crop-Rotation Bed Map ------------------------ */

const FAMILIES = ["Brassicas", "Legumes", "Roots", "Nightshades", "Alliums", "Squash", "Leaf"];

function CropRotationTool() {
  const A = accentOf(11);
  const [beds, setBeds] = useState(4);
  const [years, setYears] = useState(4);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [families, setFamilies] = useState("Brassicas\nLegumes\nRoots\nNightshades");

  const grid = useMemo(() => {
    const fam = families.split("\n").map((s) => s.trim()).filter(Boolean);
    const n = Math.max(1, fam.length);
    const rows: number[][] = [];
    for (let b = 0; b < beds; b++) {
      const row: number[] = [];
      for (let y = 0; y < years; y++) {
        row.push((b + y) % n);
      }
      rows.push(row);
    }
    const repeats: boolean[][] = rows.map((r) => r.map((v, i) => r.indexOf(v) !== i));
    return { fam, rows, repeats };
  }, [beds, years, families]);

  const followRule = (f: string) =>
    f === "Legumes" ? "feeds the soil — ideal before brassicas" :
    f === "Brassicas" ? "hungry — follows legumes, add compost" :
    f === "Roots" ? "fresh soil only — avoid after fresh manure" :
    f === "Nightshades" ? "heavy feeder — rotate far from tomatoes of last year" :
    "standard rotation";

  return (
    <Split
      left={
        <Panel title="BEDS & FAMILIES" accent={A}>
          <Row>
            <Field label="SEASON START YEAR" type="number" value={startYear} onChange={(v) => setStartYear(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="BEDS" value={beds} onChange={setBeds} min={2} max={8} accent={A} />
            <Slider label="YEARS TO PLAN" value={years} onChange={setYears} min={2} max={8} accent={A} />
          </div>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">FAMILIES IN ROTATION (ONE PER LINE)</span>
          <textarea
            value={families}
            onChange={(e) => setFamilies(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {FAMILIES.map((f) => (
              <span key={f} className="rounded border border-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500">{f}</span>
            ))}
          </div>
          <Note>Shift each family one bed along per year — no family returns to the same bed until the cycle completes, breaking pest and disease cycles.</Note>
        </Panel>
      }
      right={
        <Panel title="YEAR-BY-YEAR BED MAP" accent={A}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-left">
              <thead>
                <tr>
                  <th className="pb-1.5 pr-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">Bed</th>
                  {Array.from({ length: years }, (_, y) => (
                    <th key={y} className="pb-1.5 text-center font-mono text-[9px] uppercase text-zinc-600">{startYear + y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((r, bi) => (
                  <tr key={bi} className="border-t border-zinc-800/60">
                    <td className="py-1.5 pr-2 font-mono text-[11px] font-bold text-zinc-200">Bed {bi + 1}</td>
                    {r.map((f, yi) => (
                      <td key={yi} className="py-1.5 text-center">
                        <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                          style={grid.repeats[bi][yi] ? { color: "#fbbf24", background: "#fbbf2414" } : { color: A, background: `${A}0f` }}>
                          {grid.fam[f] ?? "?"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 space-y-0.5">
            {grid.fam.map((f) => (
              <KV key={f} k={f} v={<span className="font-mono text-[10px] text-zinc-500">{followRule(f)}</span>} />
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY MAP"
            text={grid.rows.map((r, bi) => `Bed ${bi + 1}: ` + r.map((f, y) => `${startYear + y} ${grid.fam[f]}`).join(" · ")).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------- 4. Spacing Layout Planner ----------------------- */

function SpacingLayoutTool() {
  const A = accentOf(12);
  const [len, setLen] = useState(10);
  const [wid, setWid] = useState(4);
  const [inRow, setInRow] = useState(0.3);
  const [between, setBetween] = useState(0.45);
  const [path, setPath] = useState(0.5);

  const calc = useMemo(() => {
    const rows = Math.max(1, Math.floor(wid / Math.max(0.05, between)) || 1);
    const perRow = Math.max(0, Math.floor(len / Math.max(0.05, inRow)));
    const total = perRow * rows;
    const density = total / Math.max(0.01, len * wid);
    return { rows, perRow, total, density };
  }, [len, wid, inRow, between]);

  return (
    <Split
      left={
        <Panel title="PLOT & PLANT" accent={A}>
          <Row>
            <Field label="PLOT LENGTH (M)" type="number" step={0.1} value={len} onChange={(v) => setLen(num(v))} />
            <Field label="PLOT WIDTH (M)" type="number" step={0.1} value={wid} onChange={(v) => setWid(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="SPACING IN THE ROW" value={inRow} onChange={setInRow} min={0.05} max={2} step={0.05} suffix=" m" accent={A} />
            <Slider label="SPACE BETWEEN ROWS" value={between} onChange={setBetween} min={0.1} max={2} step={0.05} suffix=" m" accent={A} />
            <Slider label="PATH WIDTH (EVERY 3 ROWS)" value={path} onChange={setPath} min={0} max={1} step={0.05} suffix=" m" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="PLANTS PER ROW" value={calc.perRow} accent={A} />
            <BigStat label="ROWS" value={calc.rows} accent={A} />
            <BigStat label="TOTAL PLANTS" value={calc.total} accent={A} />
          </Grid>
          <div className="mt-3">
            <BigStat label="DENSITY" value={fmt(calc.density, 1)} unit="plants / m²" accent={A} />
          </div>
        </Panel>
      }
      right={
        <Panel title="LAYOUT GRID (TOP VIEW)" accent={A}>
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
            <div className="space-y-1">
              {Array.from({ length: Math.min(calc.rows, 10) }, (_, r) => (
                <div key={r} className="flex gap-0.5">
                  {Array.from({ length: Math.min(calc.perRow, 24) }, (_, c) => (
                    <span
                      key={c}
                      className="h-2.5 flex-1 rounded-full"
                      style={{ background: `${A}${(r + c) % 2 === 0 ? "cc" : "88"}`, maxWidth: 18 }}
                    />
                  ))}
                  {calc.perRow > 24 ? <span className="font-mono text-[8px] text-zinc-600">+{calc.perRow - 24}</span> : null}
                </div>
              ))}
            </div>
            {calc.rows > 10 ? <p className="mt-1 font-mono text-[9px] text-zinc-600">…{calc.rows - 10} more rows below.</p> : null}
            <div className="mt-2 flex justify-between font-mono text-[9px] text-zinc-600">
              <span>{len} m long</span>
              <span>{wid} m wide</span>
            </div>
          </div>
          <Out
            className="mt-3"
            label="COPY LAYOUT"
            text={`Plot ${len} × ${wid} m · ${calc.rows} rows × ${calc.perRow} plants at ${inRow} m in-row, ${between} m between rows = ${calc.total} plants (${fmt(calc.density, 1)}/m²)`}
          />
          <Note>Dot grid is to scale-ish (capped display). Paths sit every third row — subtract them from width if you want exact walkways.</Note>
        </Panel>
      }
    />
  );
}

/* ------------------------- 5. Drip Irrigation Zones ------------------------ */

function DripZoneTool() {
  const A = accentOf(1);
  const [beds, setBeds] = useState(6);
  const [bedLen, setBedLen] = useState(12);
  const [spacing, setSpacing] = useState(0.3);
  const [flow, setFlow] = useState(2);
  const [zoneCap, setZoneCap] = useState(200);
  const [depth, setDepth] = useState(15);

  const calc = useMemo(() => {
    const perBed = Math.ceil(bedLen / Math.max(0.05, spacing));
    const total = perBed * beds;
    const emittersPerZone = Math.floor(zoneCap / Math.max(0.1, flow));
    const zones = Math.ceil(total / Math.max(1, emittersPerZone));
    const perZone = Math.ceil(total / Math.max(1, zones));
    const lph = perZone * flow;
    const litres = depth * 10; // mm → l/m² (1 mm = 1 l/m²)
    const runMin = (litres / Math.max(0.1, lph)) * 60;
    return { perBed, total, zones, perZone, lph, runMin, litres };
  }, [beds, bedLen, spacing, flow, zoneCap, depth]);

  return (
    <Split
      left={
        <Panel title="BEDS & SUPPLY" accent={A}>
          <Row>
            <Field label="BED LENGTH (M)" type="number" step={0.5} value={bedLen} onChange={(v) => setBedLen(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="BEDS ON LINE" value={beds} onChange={setBeds} min={1} max={20} accent={A} />
            <Slider label="EMITTER SPACING" value={spacing} onChange={setSpacing} min={0.15} max={0.6} step={0.05} suffix=" m" accent={A} />
            <Slider label="FLOW PER EMITTER" value={flow} onChange={setFlow} min={0.5} max={8} step={0.5} suffix=" l/h" accent={A} />
            <Slider label="ZONE FLOW CAPACITY" value={zoneCap} onChange={setZoneCap} min={50} max={1000} step={25} suffix=" l/h" hint="tap/timer/valve limit" accent={A} />
            <Slider label="TARGET WATER DEPTH" value={depth} onChange={setDepth} min={2} max={40} suffix=" mm" hint="10 mm ≈ 10 l per m² of bed" accent={A} />
          </div>
        </Panel>
      }
      right={
        <>
          <Grid cols={4}>
            <BigStat label="EMITTERS" value={calc.total} hint={`${calc.perBed}/bed`} accent={A} />
            <BigStat label="ZONES" value={calc.zones} hint={`≤ ${zoneCap} l/h each`} accent={A} />
            <BigStat label="ZONE FLOW" value={calc.lph} unit="l/h" accent={A} />
            <BigStat label="RUN TIME" value={fmt(calc.runMin, 0)} unit="min" hint={`${depth} mm target`} accent={A} />
          </Grid>
          <div className="mt-3">
            <Panel title="ZONE MAP" accent={A}>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: calc.zones }, (_, z) => {
                  const startBed = z * Math.floor(beds / calc.zones) + 1;
                  const endBed = z === calc.zones - 1 ? beds : (z + 1) * Math.floor(beds / calc.zones);
                  return (
                    <div key={z} className="min-w-0 flex-1 rounded border p-2" style={{ borderColor: `${A}44`, background: `${A}08`, minWidth: 90 }}>
                      <p className="font-mono text-[10px] font-black" style={{ color: A }}>ZONE {z + 1}</p>
                      <p className="font-mono text-[9px] text-zinc-500">beds {startBed}–{endBed}</p>
                      <p className="font-mono text-[9px] text-zinc-500">{Math.ceil(calc.perZone / Math.max(1, calc.perBed))} lines · {fmt(calc.perZone * flow, 0)} l/h</p>
                    </div>
                  );
                })}
              </div>
              <Note>Run each zone for ~{fmt(calc.runMin, 0)} minutes to deliver {depth} mm. Watering at {calc.lph} l/h keeps emission uniform; split zones if the far bed dribbles.</Note>
            </Panel>
          </div>
          <Out
            className="mt-3"
            label="COPY SPEC"
            text={`Drip plan: ${calc.total} emitters (${spacing} m spacing on ${beds} beds of ${bedLen} m) → ${calc.zones} zones @ ${calc.lph} l/h · run ${fmt(calc.runMin, 0)} min per ${depth} mm`}
          />
        </>
      }
    />
  );
}

/* ------------------------- 6. Raised-Bed Soil Mix -------------------------- */

function SoilMixTool() {
  const A = accentOf(2);
  const [beds, setBeds] = useState("Bed 1: 2.4: 1.2: 0.3\nBed 2: 2.4: 1.2: 0.3\nBed 3: 1.8: 0.9: 0.25");
  const [parts, setParts] = useState("Compost: 3\nTopsoil: 2\nCoarse sand: 1\nPerlite: 1");

  const calc = useMemo(() => {
    const rows = beds.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Bed", l: num(p[1] ?? "0"), w: num(p[2] ?? "0"), d: num(p[3] ?? "0") };
    });
    const mix = parts.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Component", part: num(p[1] ?? "1") };
    });
    const totalParts = mix.reduce((s, m) => s + m.part, 0) || 1;
    const litresBy = rows.map((r) => ({ ...r, litres: r.l * r.w * r.d * 1000 }));
    const totalL = litresBy.reduce((s, r) => s + r.litres, 0);
    const unit = totalL / totalParts;
    return { rows: litresBy, mix, totalParts, totalL, unit };
  }, [beds, parts]);

  const bulkaBag = calc.totalL / 1000;

  return (
    <Split
      left={
        <Panel title="BEDS TO FILL" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">BEDS — NAME : LENGTH : WIDTH : DEPTH (M)</span>
          <textarea
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">MIX RATIO — COMPONENT : PARTS</span>
          <textarea
            value={parts}
            onChange={(e) => setParts(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Grid cols={3}>
            <BigStat label="TOTAL SOIL" value={fmt(calc.totalL, 0)} unit="L" accent={A} />
            <BigStat label="CUBIC METRES" value={fmt(calc.totalL / 1000, 2)} unit="m³" accent={A} />
            <BigStat label="BULK BAGS" value={fmt(bulkaBag, 1)} hint="~1000 L each" accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="SHOPPING LIST" accent={A}>
          <div className="space-y-1.5">
            {calc.mix.map((m) => {
              const l = calc.unit * m.part;
              return (
                <div key={m.name} className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-zinc-200">{m.name}</span>
                    <span className="font-mono text-[11px] font-black" style={{ color: A }}>{fmt(l, 0)} L</span>
                  </div>
                  <div className="mt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full" style={{ width: `${(m.part / calc.totalParts) * 100}%`, background: A }} />
                    </div>
                  </div>
                  <p className="mt-0.5 font-mono text-[9px] text-zinc-600">{m.part} part{m.part !== 1 ? "s" : ""} of {calc.totalParts} · {fmt((l / 1000) * 1.3, 2)} m³ with 30% settling allowance</p>
                </div>
              );
            })}
          </div>
          <div className="mt-2 space-y-0.5">
            {calc.rows.map((r) => (
              <KV key={r.name} k={r.name} v={`${fmt(r.litres, 0)} L (${r.l}×${r.w}×${r.d} m)`} />
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY LIST"
            text={calc.mix.map((m) => `${m.name}: ${fmt(calc.unit * m.part, 0)} L`).join("\n") + `\nTotal: ${fmt(calc.totalL, 0)} L across ${calc.rows.length} bed(s)`}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const gardenMeta: ToolMeta[] = [
  {
    id: "grazing-rotation",
    name: "Rotational Grazing Planner",
    description: "Herd, graze and rest days → paddocks needed, rotation length and a dated move calendar.",
    category: "life",
    icon: Wheat,
    keywords: "rotational grazing paddocks how many rest days herd move calendar",
    badge: "new",
    component: GrazingTool,
  },
  {
    id: "seed-calendar",
    name: "Seed & Succession Calendar",
    description: "Your frost dates + crop list → dated sow, plant-out and harvest dates with succession rounds.",
    category: "life",
    icon: Sprout,
    keywords: "when to start seeds indoors succession planting calendar frost dates",
    badge: "new",
    component: SeedCalendarTool,
  },
  {
    id: "crop-rotation",
    name: "Crop Rotation Bed Map",
    description: "Beds × years → a family-rotation map that never plants the same family twice in one bed.",
    category: "life",
    icon: Repeat2,
    keywords: "crop rotation planner vegetable garden beds years families",
    badge: "new",
    component: CropRotationTool,
  },
  {
    id: "spacing-layout",
    name: "Plant Spacing Layout",
    description: "Plot size + spacing rules → plants per row, rows, totals and a scaled dot-grid plan.",
    category: "life",
    icon: Ruler,
    keywords: "orchard garden plant spacing layout planner rows plot",
    badge: "new",
    component: SpacingLayoutTool,
  },
  {
    id: "drip-zones",
    name: "Drip Irrigation Zones",
    description: "Beds, emitters and your supply limit → zones, flows and the run time for your target depth.",
    category: "life",
    icon: Droplets,
    keywords: "drip irrigation zone planner emitters flow run time litres",
    badge: "new",
    component: DripZoneTool,
  },
  {
    id: "soil-mix",
    name: "Raised-Bed Soil Mix",
    description: "Every bed's volume × your ratio → litres of compost, topsoil, sand and grit to buy.",
    category: "life",
    icon: Layers,
    keywords: "raised bed soil mix ratio planner volume litres parts compost",
    badge: "new",
    component: SoilMixTool,
  },
];
