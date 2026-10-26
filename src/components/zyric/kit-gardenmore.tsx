"use client";

/* ==========================================================================
   KIT: GARDEN & HOME II — 5 hands-on household tools. A picket fence bay
   calculator, a plywood cutting layout with kerf, a fairness-weighted chore
   rotation, a pantry/freezer use-first list, and a beekeeper inspection
   calendar across multiple apiaries.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Fence, Grid3X3, Brush, PackageOpen, Bug } from "lucide-react";
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
function shortDate(s: string): string {
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* --------------------------- 1. Picket Fence Layout ------------------------ */

function PicketFenceTool() {
  const A = accentOf(3);
  const [run, setRun] = useState(24);
  const [picketW, setPicketW] = useState(0.09);
  const [gap, setGap] = useState(0.05);
  const [postSpacing, setPostSpacing] = useState(2.4);
  const [gateW, setGateW] = useState(0.9);

  const calc = useMemo(() => {
    const usable = Math.max(0, run - gateW);
    const bays = Math.max(1, Math.ceil(usable / Math.max(0.5, postSpacing)));
    const bayLen = usable / bays;
    const perBay = Math.max(1, Math.floor((bayLen - 0.1) / (picketW + gap))); // minus rail cover
    const pickets = perBay * bays;
    const actualGap = (bayLen - 0.1 - perBay * picketW) / Math.max(1, perBay - 1);
    const posts = bays + 1 + 1; // + gate post pair counted once extra
    return { bays, bayLen, perBay, pickets, actualGap, posts, usable };
  }, [run, picketW, gap, postSpacing, gateW]);

  return (
    <Split
      left={
        <Panel title="FENCE RUN" accent={A}>
          <Row>
            <Field label="TOTAL RUN (M)" type="number" step={0.1} value={run} onChange={(v) => setRun(num(v))} />
            <Field label="GATE WIDTH (M)" type="number" step={0.05} value={gateW} onChange={(v) => setGateW(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="PICKET WIDTH" value={picketW} onChange={setPicketW} min={0.05} max={0.2} step={0.005} suffix=" m" accent={A} />
            <Slider label="IDEAL GAP" value={gap} onChange={setGap} min={0.02} max={0.15} step={0.005} suffix=" m" accent={A} />
            <Slider label="MAX POST SPACING" value={postSpacing} onChange={setPostSpacing} min={1.2} max={3.6} step={0.1} suffix=" m" accent={A} />
          </div>
          <Grid cols={4}>
            <BigStat label="PICKETS" value={calc.pickets} accent={A} />
            <BigStat label="POSTS" value={calc.posts} accent={A} />
            <BigStat label="BAYS" value={calc.bays} hint={`${fmt(calc.bayLen, 2)} m each`} accent={A} />
            <BigStat label="ACTUAL GAP" value={fmt(calc.actualGap * 100, 1)} unit="cm" hint="evened per bay" accent={A} />
          </Grid>
          <Note>Bays = run minus the gate, split at your max post spacing. The tool evenens the gap inside each bay so the run finishes flush — the last picket never gets squeezed.</Note>
        </Panel>
      }
      right={
        <Panel title="BAY DIAGRAM" accent={A}>
          <div className="space-y-1.5">
            {Array.from({ length: Math.min(calc.bays, 12) }, (_, b) => (
              <div key={b} className="flex items-center gap-1.5">
                <span className="w-10 shrink-0 font-mono text-[9px] text-zinc-600">Bay {b + 1}</span>
                <div className="flex h-6 min-w-0 flex-1 items-stretch gap-px overflow-hidden rounded border border-zinc-800">
                  {Array.from({ length: Math.min(calc.perBay, 30) }, (_, p) => (
                    <span key={p} className="flex-1" style={{ background: `${A}bb`, maxWidth: 10, flexGrow: picketW, flexBasis: 0 }} />
                  ))}
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[9px] text-zinc-500">{calc.perBay} pk</span>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded border border-dashed border-zinc-600 px-2 py-1">
              <span className="w-10 shrink-0 font-mono text-[9px] text-zinc-600">Gate</span>
              <div className="h-4 min-w-0 flex-1 rounded bg-zinc-800" style={{ maxWidth: 120 }} />
              <span className="font-mono text-[9px] text-zinc-500">{fmt(gateW, 2)} m opening</span>
            </div>
          </div>
          {calc.bays > 12 ? <p className="mt-1 font-mono text-[9px] text-zinc-600">…{calc.bays - 12} more identical bays.</p> : null}
          <Out
            className="mt-3"
            label="COPY CUT LIST"
            text={`Fence: ${fmt(run, 1)} m run, ${gateW} m gate\nBays: ${calc.bays} × ${fmt(calc.bayLen, 2)} m\nPickets: ${calc.pickets} × ${fmt(picketW * 100, 1)} cm (${calc.perBay}/bay, ${fmt(calc.actualGap * 100, 1)} cm gaps)\nPosts: ${calc.posts} (max ${fmt(postSpacing, 1)} m spacing)`}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------- 2. Plywood Cutting Layout ----------------------- */

function PlywoodTool() {
  const A = accentOf(4);
  const [sheetL, setSheetL] = useState(244);
  const [sheetW, setSheetW] = useState(122);
  const [kerf, setKerf] = useState(0.3);
  const [panels, setPanels] = useState("Side: 80: 40: 2\nBack: 160: 40: 1\nShelf: 76: 38: 3\nDoor: 79: 39: 2");

  const layout = useMemo(() => {
    const list = panels
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const p = l.split(":").map((s) => s.trim());
        return { name: p[0] || "Panel", l: num(p[1] ?? "0"), w: num(p[2] ?? "0"), qty: num(p[3] ?? "1") };
      });
    const flat: { name: string; l: number; w: number }[] = [];
    list.forEach((p) => { for (let i = 0; i < p.qty; i++) flat.push({ name: p.name, l: p.l, w: p.w }); });
    flat.sort((a, b) => b.l - a.l); // guillotine-ish: tallest first
    const sheets: { usedL: number; cells: { name: string; l: number; w: number; x: number; y: number }[] }[] = [];
    let cur = { usedL: 0, cells: [] as { name: string; l: number; w: number; x: number; y: number }[] };
    for (const p of flat) {
      const L = Math.max(p.l, p.w); // allow rotation: long edge along the cut
      const W = Math.min(p.l, p.w);
      // simple shelf packing: rows across the sheet
      const rowY = cur.cells.reduce((max, c) => Math.max(max, c.y + c.l + kerf), 0);
      let x = cur.cells.filter((c) => Math.abs(c.y - (rowY === 0 ? 0 : rowY)) < 0.01).reduce((sum, c) => sum + c.w + kerf, 0);
      if (x + W > sheetW || rowY + L > sheetL) {
        sheets.push(cur);
        cur = { usedL: 0, cells: [] };
        x = 0;
      }
      const baseY = rowY;
      cur.cells.push({ name: p.name, l: L, w: W, x, y: baseY });
    }
    if (cur.cells.length) sheets.push(cur);
    return { sheets: sheets.length, list, flat, sheetCells: [...sheets, cur] };
  }, [panels, sheetL, sheetW, kerf]);

  return (
    <Split
      left={
        <Panel title="SHEET & PANELS" accent={A}>
          <Row>
            <Field label="SHEET LENGTH (CM)" type="number" value={sheetL} onChange={(v) => setSheetL(num(v))} />
            <Field label="SHEET WIDTH (CM)" type="number" value={sheetW} onChange={(v) => setSheetW(num(v))} />
            <Field label="BLADE KERF (CM)" type="number" step={0.1} value={kerf} onChange={(v) => setKerf(num(v))} />
          </Row>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">PANELS — NAME : LENGTH : WIDTH : QTY</span>
          <textarea
            value={panels}
            onChange={(e) => setPanels(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Grid cols={3}>
            <BigStat label="SHEETS NEEDED" value={Math.max(1, layout.sheets)} accent={A} />
            <BigStat label="PANELS" value={layout.flat.length} accent={A} />
            <BigStat label="AREA USED" value={fmt((layout.flat.reduce((s, p) => s + p.l * p.w, 0) / ((sheetL * sheetW) * Math.max(1, layout.sheets))) * 100, 0)} unit="%" accent={A} />
          </Grid>
          <Note>First-fit shelf packing with kerf gaps; panels may rotate so their long edge lies along the cut. Real-world: always cut list order, measure twice.</Note>
        </Panel>
      }
      right={
        <Panel title="CUT DIAGRAMS" accent={A}>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {layout.sheetCells.filter((s) => s.cells.length > 0).map((s, si) => (
              <div key={si}>
                <p className="mono-kicker mb-1" style={{ color: A }}>SHEET {si + 1}</p>
                <div className="relative rounded border border-zinc-700 bg-zinc-950" style={{ aspectRatio: `${sheetW} / ${sheetL}`, maxHeight: 220 }}>
                  {s.cells.map((c, ci) => (
                    <div
                      key={ci}
                      className="absolute flex items-center justify-center overflow-hidden rounded-sm border font-mono text-[8px] font-bold"
                      style={{
                        left: `${(c.x / sheetW) * 100}%`,
                        top: `${(c.y / sheetL) * 100}%`,
                        width: `${(c.w / sheetW) * 100}%`,
                        height: `${(c.l / sheetL) * 100}%`,
                        borderColor: `${A}66`,
                        background: `${A}1a`,
                        color: "#e4e4e7",
                      }}
                    >
                      <span className="truncate px-0.5">{c.name} {c.l}×{c.w}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY CUT LIST"
            text={layout.sheetCells
              .filter((s) => s.cells.length > 0)
              .map((s, si) => `Sheet ${si + 1}: ` + s.cells.map((c) => `${c.name} (${c.l}×${c.w})`).join(", "))
              .join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------------- 3. Chore Rotation ----------------------------- */

function ChoreRotationTool() {
  const A = accentOf(5);
  const [people, setPeople] = useState("Sam\nAlex\nJordan\nRiley");
  const [chores, setChores] = useState("Dishes: 2: 7\nBins: 3: 7\nBathroom: 5: 7\nCooking: 2: 7\nVacuum: 3: 7");
  const [weeks, setWeeks] = useState(6);

  const rota = useMemo(() => {
    const ps = people.split("\n").map((s) => s.trim()).filter(Boolean);
    const cs = chores.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Chore", weight: num(p[1] ?? "1"), freq: num(p[2] ?? "7") };
    });
    // weighted round-robin: heaviest chore passes to the person with the least load
    const load = new Map<string, number>(ps.map((p) => [p, 0]));
    const grid: { week: number; rows: { chore: string; who: string; weight: number }[] }[] = [];
    for (let w = 0; w < weeks; w++) {
      const rows = cs.map((c) => {
        // pick person with min (load + wobble so it rotates)
        const sorted = [...ps].sort((a, b) => (load.get(a)! - load.get(b)!) || (ps.indexOf(a) - ps.indexOf(b)));
        const who = sorted[0];
        load.set(who, load.get(who)! + c.weight);
        return { chore: c.name, who, weight: c.weight };
      });
      grid.push({ week: w + 1, rows });
    }
    return { grid, ps, load: [...load.entries()].sort((a, b) => a[1] - b[1]), maxLoad: Math.max(...[...load.values()], 1) };
  }, [people, chores, weeks]);

  return (
    <Split
      left={
        <Panel title="HOUSE & CHORES" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">PEOPLE</span>
          <textarea value={people} onChange={(e) => setPeople(e.target.value)} rows={4} spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none" />
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">CHORES — NAME : DIFFICULTY 1-5 : EVERY N DAYS</span>
          <textarea value={chores} onChange={(e) => setChores(e.target.value)} rows={5} spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none" />
          <div className="mt-3">
            <Slider label="WEEKS TO PLAN" value={weeks} onChange={setWeeks} min={2} max={12} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="CHORE SLOTS" value={rota.grid.length * chores.split("\n").filter((s) => s.trim()).length} accent={A} />
            <BigStat label="PEOPLE" value={rota.ps.length} accent={A} />
            <BigStat label="FAIRNESS SPREAD" value={fmt(rota.maxLoad - rota.load[0][1], 0)} unit="pts" hint="lower is fairer" accent={A} />
          </Grid>
          <Note>The least-loaded person takes the next chore — difficulty points accumulate, so nobody stacks three bathrooms while someone only ever does dishes.</Note>
        </Panel>
      }
      right={
        <>
          <Panel title="WEEKLY ROTATION" accent={A}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-left">
                <thead>
                  <tr>
                    <th className="pb-1.5 pr-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">Chore</th>
                    {rota.grid.map((g) => (
                      <th key={g.week} className="pb-1.5 text-center font-mono text-[9px] uppercase text-zinc-600">W{g.week}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rota.grid[0]?.rows.map((r, ri) => (
                    <tr key={ri} className="border-t border-zinc-800/60">
                      <td className="py-1.5 pr-2 font-mono text-[11px] font-bold text-zinc-200">{r.chore}</td>
                      {rota.grid.map((g) => (
                        <td key={g.week} className="py-1.5 text-center">
                          <span className="rounded px-1 py-0.5 font-mono text-[10px] font-bold" style={{ color: A }}>{g.rows[ri].who}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="mt-3">
            <Panel title="FAIRNESS LEDGER" accent={A}>
              {rota.load.map(([p, l]) => (
                <div key={p} className="mb-2">
                  <Meter value={l} max={rota.maxLoad} accent={A} label={p} right={`${fmt(l, 0)} pts`} />
                </div>
              ))}
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ----------------------- 4. Pantry & Freezer Use-First --------------------- */

function PantryTool() {
  const A = accentOf(6);
  const [items, setItems] = useState("Chicken stock: 2026-10-20: 180\nBerries: 2026-11-02: 90\nChilli con carne: 2026-09-15: 120\nBread: 2026-10-27: 21\nMilk: 2026-10-28: 7\nLeftover curry: 2026-10-30: 60");

  const rows = useMemo(() => {
    const today = new Date();
    return items
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const p = l.split(":").map((s) => s.trim());
        const name = p[0] || "Item";
        const dateStr = p[1] || "";
        const shelf = num(p[2] ?? "0");
        const d = new Date(dateStr + "T00:00:00");
        const useBy = Number.isNaN(d.getTime()) ? null : addDays(d, shelf);
        const daysLeft = useBy ? Math.round((useBy.getTime() - today.getTime()) / 86400000) : null;
        return { name, date: dateStr, useBy, daysLeft, valid: useBy !== null };
      })
      .filter((r) => r.valid)
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  }, [items]);

  const urgent = rows.filter((r) => (r.daysLeft ?? 99) <= 7);
  const soon = rows.filter((r) => (r.daysLeft ?? 99) > 7 && (r.daysLeft ?? 99) <= 30);

  return (
    <Split
      left={
        <Panel title="WHAT&apos;S IN THERE" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">ITEMS — NAME : DATE (BOUGHT/MADE/FROZEN) : SHELF-LIFE DAYS</span>
          <textarea
            value={items}
            onChange={(e) => setItems(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Grid cols={3}>
            <BigStat label="TRACKED" value={rows.length} accent={A} />
            <BigStat label="USE THIS WEEK" value={urgent.length} accent={urgent.length ? "#fbbf24" : A} />
            <BigStat label="USE THIS MONTH" value={soon.length} accent={A} />
          </Grid>
          <Note>Shelf-life days are yours to set — the tool adds them to your date and sorts by what dies first. No app, no barcode scanner, no login.</Note>
        </Panel>
      }
      right={
        <Panel title="EAT-ME ORDER" accent={A}>
          <div className="space-y-1.5">
            {rows.map((r, i) => {
              const dl = r.daysLeft ?? 0;
              const color = dl <= 3 ? "#f87171" : dl <= 7 ? "#fbbf24" : dl <= 30 ? A : "#a1a1aa";
              return (
                <div key={i} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                  <span className="w-5 shrink-0 font-mono text-[10px] text-zinc-600">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[11px] font-bold text-zinc-200">{r.name}</p>
                    <p className="font-mono text-[9px] text-zinc-600">{r.date} + shelf → {r.useBy ? shortDate(iso(r.useBy)) : "?"}</p>
                  </div>
                  <Tag accent={color}>{dl <= 0 ? "TODAY" : dl === 1 ? "1 day" : `${dl} days`}</Tag>
                </div>
              );
            })}
          </div>
          <Out
            className="mt-3"
            label="COPY USE-FIRST LIST"
            text={rows.map((r, i) => `${i + 1}. ${r.name} — use by ${r.useBy ? shortDate(iso(r.useBy)) : "?"} (${r.daysLeft} days)`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------- 5. Beekeeper Inspection Calendar -------------------- */

function HiveInspectionTool() {
  const A = accentOf(7);
  const [yards, setYards] = useState("Home apiary: 4\nVillage field: 6\nOrchard corner: 2");
  const [interval, setInterval_] = useState(10);
  const [start, setStart] = useState(() => iso(new Date()));
  const [windowH, setWindowH] = useState(90);

  const plan = useMemo(() => {
    const ys = yards.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Yard", hives: num(p[1] ?? "1") };
    });
    const totalHives = ys.reduce((s, y) => s + y.hives, 0);
    const visitsPerRound = Math.ceil(totalHives / Math.max(1, Math.floor(windowH / 15))) || 1;
    const out: { visit: number; date: string; yard: string; hives: number; note: string }[] = [];
    let day = 0;
    let visit = 0;
    // cycle yards: each visit inspects one yard's hives (or a chunk)
    let yardIdx = 0;
    const rounds = 3; // show 3 full rounds
    for (let r = 0; r < rounds; r++) {
      ys.forEach((y) => {
        visit++;
        out.push({
          visit,
          date: iso(addDays(new Date(start + "T00:00:00"), day)),
          yard: y.name,
          hives: y.hives,
          note: r === 0 ? "full inspection" : r === 1 ? "quick check" : "full inspection",
        });
        day += interval;
        yardIdx++;
      });
    }
    return { out, ys, totalHives, visitsPerRound };
  }, [yards, interval, start, windowH]);

  return (
    <Split
      left={
        <Panel title="APIARIES" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">YARDS — NAME : HIVES</span>
          <textarea value={yards} onChange={(e) => setYards(e.target.value)} rows={4} spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none" />
          <Row className="mt-3">
            <Field label="FIRST INSPECTION" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="DAYS BETWEEN YARD VISITS" value={interval} onChange={(v) => setInterval_(Number(v))} min={5} max={21} accent={A} />
            <Slider label="MINUTES PER HIVE" value={windowH} onChange={setWindowH} min={30} max={180} step={15} suffix=" min budget" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="HIVES" value={plan.totalHives} accent={A} />
            <BigStat label="YARDS" value={plan.ys.length} accent={A} />
            <BigStat label="VISITS SHOWN" value={plan.out.length} hint={`${plan.visitsPerRound} per round`} accent={A} />
          </Grid>
          <Note>Each visit covers one yard. Rotate through yards every {interval} days so no colony waits longer than {plan.ys.length * interval} days between looks.</Note>
        </Panel>
      }
      right={
        <Panel title="VISIT CALENDAR" accent={A}>
          <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {plan.out.map((v) => (
              <div key={v.visit} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                <span className="w-16 shrink-0 font-mono text-[11px] font-bold" style={{ color: A }}>{shortDate(v.date)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] text-zinc-200">{v.yard}</p>
                  <p className="font-mono text-[9px] text-zinc-600">{v.hives} hive{v.hives !== 1 ? "s" : ""} · {v.hives * 15} min · {v.note}</p>
                </div>
                <Tag accent={A}>#{v.visit}</Tag>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY CALENDAR"
            text={plan.out.map((v) => `${v.date}: ${v.yard} — ${v.hives} hives (${v.note})`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const gardenMoreMeta: ToolMeta[] = [
  {
    id: "picket-fence",
    name: "Picket Fence Layout",
    description: "Run, pickets and gate → bays, posts, picket count and even gaps that finish flush.",
    category: "life",
    icon: Fence,
    keywords: "picket fence layout planner boards posts gate gap bays",
    badge: "new",
    component: PicketFenceTool,
  },
  {
    id: "plywood-layout",
    name: "Plywood Cutting Layout",
    description: "Sheet size + panel list + kerf → sheets needed and a visual cut diagram per sheet.",
    category: "life",
    icon: Grid3X3,
    keywords: "plywood sheet cutting layout planner panels kerf diagram",
    badge: "new",
    component: PlywoodTool,
  },
  {
    id: "chore-rotation",
    name: "Chore Rotation Chart",
    description: "Difficulty-weighted chore wheel — the least-loaded person takes the next job, fair to the point.",
    category: "life",
    icon: Brush,
    keywords: "chore rotation chart fair household chores schedule family",
    badge: "new",
    component: ChoreRotationTool,
  },
  {
    id: "pantry-usefirst",
    name: "Pantry Use-First List",
    description: "Dates + shelf-life → your freezer and pantry sorted by what expires first, today flagged.",
    category: "life",
    icon: PackageOpen,
    keywords: "pantry freezer use first rotation planner expiry food waste",
    badge: "new",
    component: PantryTool,
  },
  {
    id: "hive-inspection",
    name: "Hive Inspection Rota",
    description: "Multiple yards, one interval → a dated inspection calendar so no colony gets missed.",
    category: "life",
    icon: Bug,
    keywords: "beekeeper hive inspection rotation planner yards calendar",
    badge: "new",
    component: HiveInspectionTool,
  },
];
