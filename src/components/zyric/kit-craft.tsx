"use client";

/* ==========================================================================
   KIT: CRAFT ROOM — 6 maker tools. A circle-skirt fabric planner with panel
   layout, a crochet blanket colour-rotation grid, a photo-wall coordinate
   planner, a beading pattern counter, a weaving warp calculator and an
   envelope template generator for any card size.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Scissors, Palette, Image, CircleDot, Atom, Mail } from "lucide-react";
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

/* --------------------------- 1. Circle Skirt Planner ----------------------- */

function CircleSkirtTool() {
  const A = accentOf(4);
  const [waist, setWaist] = useState(72);
  const [length, setLength] = useState(60);
  const [fullness, setFullness] = useState<"half" | "threequarter" | "full">("full");
  const [fabricW, setFabricW] = useState(150);
  const [seam, setSeam] = useState(1.5);

  const calc = useMemo(() => {
    const frac = fullness === "full" ? 1 : fullness === "threequarter" ? 0.75 : 0.5;
    const waistR = waist / (2 * Math.PI * frac);
    const hemR = waistR + length + seam;
    const flatHem = hemR * 2;
    const panels = flatHem > fabricW ? (frac === 1 ? 2 : 1) : 1;
    // fabric length: for full skirt cut as two half-circles side by side
    const cutLen = panels === 2 ? hemR + 2 * seam + hemR * 0 + length : hemR * 2 + 2 * seam;
    const fabricLen = panels === 2 ? hemR + length + 3 * seam : Math.min(flatHem + 2 * seam, hemR + length + 3 * seam);
    return { waistR, hemR, flatHem, panels, cutLen, fabricLen, frac, fabricLen2: fabricLen };
  }, [waist, length, fullness, fabricW, seam]);

  return (
    <Split
      left={
        <Panel title="MEASUREMENTS" accent={A}>
          <Row>
            <Field label="WAIST (CM)" type="number" value={waist} onChange={(v) => setWaist(num(v))} />
            <Field label="SKIRT LENGTH (CM)" type="number" value={length} onChange={(v) => setLength(num(v))} />
            <Field label="SEAM ALLOWANCE (CM)" type="number" step={0.5} value={seam} onChange={(v) => setSeam(num(v))} />
          </Row>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">FULLNESS</span>
            <Seg
              value={fullness}
              onChange={setFullness}
              accent={A}
              options={[
                { v: "half", label: "Half circle" },
                { v: "threequarter", label: "¾ circle" },
                { v: "full", label: "Full circle" },
              ] as const}
            />
          </div>
          <div className="mt-3">
            <Slider label="FABRIC WIDTH" value={fabricW} onChange={setFabricW} min={90} max={280} step={5} suffix=" cm" accent={A} />
          </div>
          <Grid cols={4}>
            <BigStat label="WAIST RADIUS" value={fmt(calc.waistR, 1)} unit="cm" accent={A} />
            <BigStat label="HEM RADIUS" value={fmt(calc.hemR, 1)} unit="cm" accent={A} />
            <BigStat label="PANELS" value={calc.panels} hint={calc.flatHem > fabricW ? "hem exceeds width" : "cuts in one"} accent={A} />
            <BigStat label="FABRIC TO BUY" value={fmt(Math.max(calc.fabricLen, calc.fabricLen2) / 100, 2)} unit="m" accent={A} />
          </Grid>
          <Note>Waist radius = waist ÷ (2π × fullness fraction). Full-circle skirts usually need two half-circles seamed at the sides unless your fabric is very wide — that&apos;s the panel split you see.</Note>
        </Panel>
      }
      right={
        <Panel title="CUT PLAN" accent={A}>
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="relative mx-auto" style={{ width: 150, height: 150 }}>
              {/* fabric rectangle */}
              <div className="absolute inset-0 rounded border border-zinc-700 bg-zinc-900" />
              {/* skirt shape (quarter/half arcs approximated with border-radius) */}
              <div
                className="absolute border-2"
                style={{
                  left: "12%",
                  top: "12%",
                  width: "76%",
                  height: "76%",
                  borderColor: A,
                  borderRadius: fullness === "full" ? "50%" : fullness === "threequarter" ? "50% 50% 50% 0" : "50%",
                  background: `${A}14`,
                }}
              />
              <div className="absolute rounded-full bg-zinc-950" style={{ left: "47%", top: "47%", width: "6%", height: "6%", border: "1px solid #52525b" }} />
            </div>
            <div className="mt-2 space-y-0.5">
              <KV k="cut" v={calc.panels === 2 ? `2 half-circles ${fmt(calc.hemR, 0)} cm radius` : `1 full piece ${fmt(calc.flatHem, 0)} cm across`} accent={A} />
              <KV k="waist hole" v={`Ø ${fmt(calc.waistR * 2, 1)} cm`} />
              <KV k="fabric length" v={`${fmt(Math.max(calc.fabricLen, calc.fabricLen2), 0)} cm (+ hem & seams)`} />
              <KV k="fabric width needed" v={`${fmt(Math.min(calc.flatHem, fabricW), 0)} cm of ${fabricW} cm`} />
            </div>
          </div>
          <Out
            className="mt-3"
            label="COPY PLAN"
            text={`Circle skirt (${fullness}): waist ${waist} cm, length ${length} cm\nWaist radius ${fmt(calc.waistR, 1)} cm · hem radius ${fmt(calc.hemR, 1)} cm\n${calc.panels === 2 ? "Cut 2 half-circles" : "Cut 1 piece"} from ${fmt(Math.max(calc.fabricLen, calc.fabricLen2), 0)} × ${fabricW} cm`}
          />
        </Panel>
      }
    />
  );
}

/* ---------------------- 2. Crochet Colour Rotation ------------------------- */

function CrochetColourTool() {
  const A = accentOf(5);
  const [blanketW, setBlanketW] = useState(120);
  const [blanketH, setBlanketH] = useState(150);
  const [square, setSquare] = useState(12);
  const [colours, setColours] = useState("Rust\nCream\nSage\nMustard");
  const [rule, setRule] = useState<"repeat" | "diagonal" | "random-seeded">("repeat");

  const grid = useMemo(() => {
    const cols = Math.ceil(blanketW / Math.max(1, square));
    const rows = Math.ceil(blanketH / Math.max(1, square));
    const list = colours.split("\n").map((s) => s.trim()).filter(Boolean);
    const n = Math.max(1, list.length);
    const cell: number[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let r = 0; r < rows * cols; r++) {
      const row = Math.floor(r / cols);
      const col = r % cols;
      if (rule === "repeat") cell.push((row + col) % n);
      else if (rule === "diagonal") cell.push((col + 2 * row) % n);
      else cell.push(Math.floor(rnd() * n));
    }
    const counts = list.map((_, i) => cell.filter((c) => c === i).length);
    return { cols, rows, cell, list, counts, total: rows * cols };
  }, [blanketW, blanketH, square, colours, rule]);

  const PALETTE = ["#FFD43B", "#FF9DE2", "#7FC8FF", "#5EE39A", "#FF7A3D", "#B9A6FF", "#C6F24E", "#4ECDC4"];

  return (
    <Split
      left={
        <Panel title="BLANKET & COLOURS" accent={A}>
          <Row>
            <Field label="BLANKET WIDTH (CM)" type="number" value={blanketW} onChange={(v) => setBlanketW(num(v))} />
            <Field label="BLANKET HEIGHT (CM)" type="number" value={blanketH} onChange={(v) => setBlanketH(num(v))} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="SQUARE SIZE" value={square} onChange={setSquare} min={4} max={30} suffix=" cm" accent={A} />
          </div>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">COLOURS (ONE PER LINE)</span>
          <textarea
            value={colours}
            onChange={(e) => setColours(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">SEQUENCE RULE</span>
            <Seg
              value={rule}
              onChange={setRule}
              accent={A}
              options={[
                { v: "repeat", label: "Stripes" },
                { v: "diagonal", label: "Diagonal" },
                { v: "random-seeded", label: "Scatter" },
              ] as const}
            />
          </div>
          <Grid cols={3}>
            <BigStat label="GRID" value={`${grid.cols}×${grid.rows}`} accent={A} />
            <BigStat label="SQUARES" value={grid.total} accent={A} />
            <BigStat label="COLOURS" value={grid.list.length} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <>
          <Panel title="COLOUR MAP" accent={A}>
            <div
              className="grid gap-px overflow-hidden rounded border border-zinc-800"
              style={{ gridTemplateColumns: `repeat(${Math.min(grid.cols, 20)}, 1fr)`, maxWidth: 280 }}
            >
              {grid.cell.slice(0, Math.min(grid.rows, 22) * Math.min(grid.cols, 20)).map((c, i) => (
                <span key={i} className="aspect-square" style={{ background: PALETTE[c % PALETTE.length] }} title={grid.list[c] ?? ""} />
              ))}
            </div>
            {grid.rows > 22 || grid.cols > 20 ? <p className="mt-1 font-mono text-[9px] text-zinc-600">preview cropped — pattern repeats by the rule</p> : null}
          </Panel>
          <div className="mt-3">
            <Panel title="SQUARES PER COLOUR" accent={A}>
              <div className="space-y-1">
                {grid.list.map((c, i) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-300">{c}</span>
                    <span className="font-mono text-[11px] font-black" style={{ color: A }}>{grid.counts[i]}</span>
                    <span className="font-mono text-[9px] text-zinc-600">{((grid.counts[i] / grid.total) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <Out
                className="mt-3"
                label="COPY COUNTS"
                text={grid.list.map((c, i) => `${c}: ${grid.counts[i]} squares`).join("\n") + `\nGrid ${grid.cols}×${grid.rows} of ${square} cm squares`}
              />
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* --------------------------- 3. Photo Wall Planner ------------------------- */

function PhotoWallTool() {
  const A = accentOf(6);
  const [wallW, setWallW] = useState(300);
  const [wallH, setWallH] = useState(220);
  const [frames, setFrames] = useState("A3 landscape: 42: 30\nA3 portrait: 30: 42\nA4 portrait: 21: 30\n20×20: 20: 20\nA4 landscape: 30: 21\nA3 landscape: 42: 30");
  const [gap, setGap] = useState(8);

  const layout = useMemo(() => {
    const list = frames.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Frame", w: num(p[1] ?? "30"), h: num(p[2] ?? "40") };
    });
    // row packing: sort by height desc, fill rows up to wall width
    const sorted = [...list].sort((a, b) => b.h - a.h);
    const rows: { y: number; h: number; items: { name: string; w: number; h: number; x: number }[] }[] = [];
    let y = 0;
    let cur: typeof sorted = [];
    let curW = 0;
    const flush = () => {
      if (!cur.length) return;
      const rh = Math.max(...cur.map((c) => c.h));
      let x = 0;
      const items = cur.map((c) => {
        const it = { name: c.name, w: c.w, h: c.h, x };
        x += c.w + gap;
        return it;
      });
      rows.push({ y, h: rh, items });
      y += rh + gap;
      cur = [];
      curW = 0;
    };
    for (const f of sorted) {
      if (curW + f.w > wallW && cur.length) flush();
      cur.push(f);
      curW += f.w + gap;
    }
    flush();
    const totalH = y - gap;
    return { rows, totalH, fits: totalH <= wallH, count: list.length };
  }, [wallW, wallH, frames, gap]);

  return (
    <Split
      left={
        <Panel title="WALL & FRAMES" accent={A}>
          <Row>
            <Field label="WALL WIDTH (CM)" type="number" value={wallW} onChange={(v) => setWallW(num(v))} />
            <Field label="WALL HEIGHT (CM)" type="number" value={wallH} onChange={(v) => setWallH(num(v))} />
          </Row>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">FRAMES — NAME : WIDTH : HEIGHT (CM)</span>
          <textarea
            value={frames}
            onChange={(e) => setFrames(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3">
            <Slider label="GAP BETWEEN FRAMES" value={gap} onChange={setGap} min={2} max={20} suffix=" cm" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="FRAMES" value={layout.count} accent={A} />
            <BigStat label="LAYOUT HEIGHT" value={fmt(layout.totalH, 0)} unit="cm" accent={layout.fits ? A : "#f87171"} hint={layout.fits ? `fits ${wallH} cm wall` : `overflows ${wallH} cm wall`} />
            <BigStat label="ROWS" value={layout.rows.length} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="HANG MAP — X,Y FROM TOP-LEFT" accent={A}>
          <div className="relative rounded border border-zinc-700 bg-zinc-950/60" style={{ aspectRatio: `${wallW} / ${wallH}` }}>
            {layout.rows.flatMap((r, ri) =>
              r.items.map((it, ii) => (
                <div
                  key={`${ri}-${ii}`}
                  className="absolute flex items-center justify-center rounded-sm border font-mono text-[7px]"
                  style={{
                    left: `${(it.x / wallW) * 100}%`,
                    top: `${(r.y / wallH) * 100}%`,
                    width: `${(it.w / wallW) * 100}%`,
                    height: `${(it.h / wallH) * 100}%`,
                    borderColor: `${A}88`,
                    background: `${A}12`,
                    color: "#d4d4d8",
                    overflow: "hidden",
                  }}
                >
                  <span className="truncate px-0.5">{it.name}</span>
                </div>
              ))
            )}
          </div>
          <Out
            className="mt-3"
            label="COPY COORDINATES (CM FROM TOP-LEFT)"
            text={layout.rows
              .flatMap((r, ri) => r.items.map((it) => `${it.name}: x ${it.x.toFixed(0)}, y ${(r.y + (r.h - it.h) / 2).toFixed(0)} (${it.w}×${it.h})`))
              .join("\n")}
          />
          <Note>Rows centre each frame vertically within the row band. Hang at eye height (~145 cm to frame centre) and shift the whole group up by (wallH − layoutH) ÷ 2.</Note>
        </Panel>
      }
    />
  );
}

/* ----------------------------- 4. Beading Plan ----------------------------- */

function BeadingTool() {
  const A = accentOf(7);
  const [length, setLength] = useState(19);
  const [beadMm, setBeadMm] = useState(4);
  const [pattern, setPattern] = useState("Gold: 1\nTeal: 2\nMatte black: 1");
  const [strands, setStrands] = useState(1);

  const calc = useMemo(() => {
    const beads = Math.max(1, Math.floor((length * 10) / Math.max(0.5, beadMm)));
    const list = pattern.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Bead", n: Math.max(1, num(p[1] ?? "1")) };
    });
    const cycle = list.reduce((s, r) => s + r.n, 0) || 1;
    const cycles = beads / cycle;
    return {
      beads,
      list,
      cycle,
      per: list.map((r) => ({ ...r, count: Math.ceil(r.n * cycles) * strands })),
      cycles,
      strandTotal: beads * strands,
    };
  }, [length, beadMm, pattern, strands]);

  return (
    <Split
      left={
        <Panel title="BRACELET SPEC" accent={A}>
          <div className="space-y-3">
            <Slider label="FINISHED LENGTH" value={length} onChange={setLength} min={10} max={60} suffix=" cm" accent={A} />
            <Slider label="BEAD SIZE" value={beadMm} onChange={setBeadMm} min={2} max={12} step={0.5} suffix=" mm" accent={A} />
            <Slider label="STRANDS / LAYERS" value={strands} onChange={setStrands} min={1} max={5} accent={A} />
          </div>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">PATTERN REPEAT — COLOUR : COUNT IN REPEAT</span>
          <textarea
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Grid cols={3}>
            <BigStat label="BEADS PER STRAND" value={calc.beads} accent={A} />
            <BigStat label="FULL REPEATS" value={fmt(calc.cycles, 1)} hint={`${calc.cycle}-bead cycle`} accent={A} />
            <BigStat label="TOTAL TO BUY" value={calc.strandTotal} hint={`${strands} strand${strands > 1 ? "s" : ""} + spares`} accent={A} />
          </Grid>
          <Note>Buy ~10% extra for breakage and misfits. Clasp and crimps add ~1.5 cm — the bead count here is beads only, strung tight.</Note>
        </Panel>
      }
      right={
        <>
          <Panel title="STRINGING PATTERN" accent={A}>
            <div className="flex flex-wrap gap-0.5" style={{ maxWidth: 320 }}>
              {Array.from({ length: Math.min(calc.beads, 60) }, (_, i) => {
                let acc = 0;
                let idx = 0;
                const pos = i % calc.cycle;
                for (let j = 0; j < calc.list.length; j++) {
                  acc += calc.list[j].n;
                  if (pos < acc) { idx = j; break; }
                }
                const HUES = ["#FFD43B", "#4ECDC4", "#e4e4e7", "#FF7A3D", "#B9A6FF", "#5EE39A"];
                return (
                  <span
                    key={i}
                    className="inline-block h-3.5 w-3.5 rounded-full border border-black/30"
                    style={{ background: HUES[idx % HUES.length] }}
                    title={calc.list[idx]?.name}
                  />
                );
              })}
            </div>
            {calc.beads > 60 ? <p className="mt-1 font-mono text-[9px] text-zinc-600">showing first 60 of {calc.beads} — pattern repeats every {calc.cycle}</p> : null}
          </Panel>
          <div className="mt-3">
            <Panel title="BEADS PER COLOUR" accent={A}>
              <div className="space-y-0.5">
                {calc.per.map((r) => (
                  <KV key={r.name} k={r.name} v={`${r.count} ×`} accent={A} />
                ))}
              </div>
              <Out
                className="mt-3"
                label="COPY SHOPPING LIST"
                text={calc.per.map((r) => `${r.name}: ${r.count}`).join("\n") + `\n(${calc.beads}/strand × ${strands} strands)`}
              />
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ----------------------------- 5. Weaving Warp ----------------------------- */

function WarpTool() {
  const A = accentOf(8);
  const [loomW, setLoomW] = useState(45);
  const [sett, setSett] = useState(8);
  const [lengthCm, setLengthCm] = useState(180);
  const [hem, setHem] = useState(4);
  const [waste, setWaste] = useState(50);
  const [shrink, setShrink] = useState(8);

  const calc = useMemo(() => {
    const ends = Math.round(loomW * sett);
    const onLoom = lengthCm + hem * 2 + waste;
    const totalM = (ends * (onLoom / 100)) / 1; // total metres of yarn across all ends
    const perEnd = onLoom / 100;
    const finishedW = loomW * (1 - shrink / 100);
    const finishedL = lengthCm * (1 - shrink / 100);
    return { ends, onLoom, totalM, perEnd, finishedW, finishedL };
  }, [loomW, sett, lengthCm, hem, waste, shrink]);

  return (
    <div className="space-y-4">
      <Panel title="LOOM & PROJECT" accent={A}>
        <Row>
          <Field label="WEAVING WIDTH (CM)" type="number" value={loomW} onChange={(v) => setLoomW(num(v))} />
          <Field label="SETT (ENDS / CM)" type="number" step={0.5} value={sett} onChange={(v) => setSett(num(v))} />
          <Field label="PROJECT LENGTH (CM)" type="number" value={lengthCm} onChange={(v) => setLengthCm(num(v))} />
        </Row>
        <Row className="mt-3">
          <Field label="HEM AT EACH END (CM)" type="number" value={hem} onChange={(v) => setHem(num(v))} />
          <Field label="LOOM WASTE (CM)" type="number" value={waste} onChange={(v) => setWaste(num(v))} hint="loom + ties + sampling" />
        </Row>
        <div className="mt-3">
          <Slider label="EXPECTED SHRINKAGE" value={shrink} onChange={setShrink} min={0} max={20} suffix="%" hint="wet finishing takes its cut" accent={A} />
        </div>
      </Panel>
      <Grid cols={4}>
        <BigStat label="WARP ENDS" value={calc.ends} hint={`${sett}/cm × ${fmt(loomW, 0)} cm`} accent={A} />
        <BigStat label="YARN ON LOOM" value={fmt(calc.onLoom, 0)} unit="cm" hint="length + hems + waste" accent={A} />
        <BigStat label="TOTAL YARN" value={fmt(calc.totalM, 0)} unit="m" hint={`${calc.ends} ends × ${fmt(calc.perEnd, 2)} m`} accent={A} />
        <BigStat label="FINISHED SIZE" value={`${fmt(calc.finishedW, 0)}×${fmt(calc.finishedL, 0)}`} unit="cm" hint={`after ${shrink}% shrink`} accent={A} />
      </Grid>
      <Panel title="WARPING PLAN" accent={A}>
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
            <p className="mono-kicker mb-1" style={{ color: A }}>IF WARPING BACK-TO-FRONT</p>
            <KV k="ends to count" v={calc.ends} />
            <KV k="loops per bout (÷2)" v={Math.ceil(calc.ends / 2)} />
            <KV k="cross" v={`${calc.ends} ends — lease sticks in`} />
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
            <p className="mono-kicker mb-1" style={{ color: A }}>YARN ESTIMATE</p>
            <KV k="warp" v={`${fmt(calc.totalM, 0)} m`} accent={A} />
            <KV k="+ 10% insurance" v={`${fmt(calc.totalM * 1.1, 0)} m`} />
            <KV k="≈ 50 g cones (120 m/g)" v={`${fmt((calc.totalM * 1.1) / (50 * 120), 1)} cones`} />
          </div>
        </div>
        <Out
          className="mt-3"
          label="COPY SPEC"
          text={`Warp: ${calc.ends} ends @ ${sett} ends/cm over ${fmt(loomW, 0)} cm\nOn-loom length ${fmt(calc.onLoom, 0)} cm (project ${lengthCm} + hems ${hem * 2} + waste ${waste})\nYarn: ${fmt(calc.totalM, 0)} m (buy ${fmt(calc.totalM * 1.1, 0)} m)\nFinished: ~${fmt(calc.finishedW, 0)} × ${fmt(calc.finishedL, 0)} cm after wet finishing`}
        />
        <Note>Sett depends on yarn and weave structure — 8/cm suits a medium cotton plain weave. Sample first: 15 minutes of sampling saves 3 metres of regret.</Note>
      </Panel>
    </div>
  );
}

/* --------------------------- 6. Envelope Planner --------------------------- */

function EnvelopeTool() {
  const A = accentOf(9);
  const [cardW, setCardW] = useState(15);
  const [cardH, setCardH] = useState(10.5);
  const [flap, setFlap] = useState<"point" | "square" | "round">("point");
  const [clearance, setClearance] = useState(0.3);
  const [seam, setSeam] = useState(1);

  const calc = useMemo(() => {
    const bodyW = cardW + clearance * 2;
    const bodyH = cardH + clearance * 2;
    const flapH = flap === "point" ? bodyW * 0.45 : flap === "square" ? bodyW * 0.35 : bodyW * 0.4;
    const sidePocket = bodyH * 0.18;
    const bottomPocket = bodyH * 0.32;
    const blankW = bodyW + sidePocket * 2 + seam * 2;
    const blankH = bodyH + bottomPocket + flapH + seam * 2;
    return { bodyW, bodyH, flapH, sidePocket, bottomPocket, blankW, blankH };
  }, [cardW, cardH, flap, clearance, seam]);

  return (
    <Split
      left={
        <Panel title="CARD & PAPER" accent={A}>
          <Row>
            <Field label="CARD WIDTH (CM)" type="number" step={0.1} value={cardW} onChange={(v) => setCardW(num(v))} />
            <Field label="CARD HEIGHT (CM)" type="number" step={0.1} value={cardH} onChange={(v) => setCardH(num(v))} />
          </Row>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">FLAP STYLE</span>
            <Seg value={flap} onChange={setFlap} accent={A} options={[{ v: "point", label: "Point" }, { v: "square", label: "Square" }, { v: "round", label: "Round" }] as const} />
          </div>
          <Row className="mt-3">
            <Field label="CLEARANCE (CM)" type="number" step={0.1} value={clearance} onChange={(v) => setClearance(num(v))} hint="wiggle room for the card" />
            <Field label="SEAM / GLUE FLAP (CM)" type="number" step={0.5} value={seam} onChange={(v) => setSeam(num(v))} />
          </Row>
          <Grid cols={3}>
            <BigStat label="BLANK SIZE" value={`${fmt(calc.blankW, 1)}×${fmt(calc.blankH, 1)}`} unit="cm" accent={A} />
            <BigStat label="BODY" value={`${fmt(calc.bodyW, 1)}×${fmt(calc.bodyH, 1)}`} accent={A} />
            <BigStat label="FLAP DEPTH" value={fmt(calc.flapH, 1)} unit="cm" hint={flap} accent={A} />
          </Grid>
          <Note>Body = card + clearance each side. Side pockets fold in, bottom folds up, flap folds down. Score at the fold lines and the geometry takes care of itself.</Note>
        </Panel>
      }
      right={
        <Panel title="TEMPLATE DIAGRAM" accent={A}>
          <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="relative mx-auto" style={{ width: 240, height: 300 }}>
              {/* flap */}
              <div
                className="absolute border-2"
                style={{
                  left: `${(calc.sidePocket / calc.blankW) * 100}%`,
                  top: 0,
                  width: `${(calc.bodyW / calc.blankW) * 100}%`,
                  height: `${(calc.flapH / calc.blankH) * 100}%`,
                  borderColor: A,
                  background: `${A}14`,
                  borderRadius: flap === "point" ? "0 0 50% 50% / 0 0 100% 100%" : flap === "round" ? "0 0 24px 24px" : 0,
                  transform: "rotate(180deg)",
                }}
              />
              {/* body */}
              <div
                className="absolute border-2"
                style={{
                  left: `${(calc.sidePocket / calc.blankW) * 100}%`,
                  top: `${(calc.flapH / calc.blankH) * 100}%`,
                  width: `${(calc.bodyW / calc.blankW) * 100}%`,
                  height: `${(calc.bodyH / calc.blankH) * 100}%`,
                  borderColor: A,
                }}
              />
              {/* side pockets */}
              {[0, 1].map((s) => (
                <div
                  key={s}
                  className="absolute border-2"
                  style={{
                    left: s === 0 ? 0 : undefined,
                    right: s === 1 ? 0 : undefined,
                    top: `${(calc.flapH / calc.blankH) * 100}%`,
                    width: `${(calc.sidePocket / calc.blankW) * 100}%`,
                    height: `${(calc.bodyH / calc.blankH) * 100}%`,
                    borderColor: `${A}77`,
                    background: `${A}0a`,
                  }}
                />
              ))}
              {/* bottom pocket */}
              <div
                className="absolute border-2"
                style={{
                  left: `${(calc.sidePocket / calc.blankW) * 100}%`,
                  top: `${((calc.flapH + calc.bodyH) / calc.blankH) * 100}%`,
                  width: `${(calc.bodyW / calc.blankW) * 100}%`,
                  height: `${(calc.bottomPocket / calc.blankH) * 100}%`,
                  borderColor: `${A}77`,
                  background: `${A}0a`,
                }}
              />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <KV k="side pockets" v={`${fmt(calc.sidePocket, 1)} cm deep`} />
            <KV k="bottom pocket" v={`${fmt(calc.bottomPocket, 1)} cm deep`} />
            <KV k="flap" v={`${fmt(calc.flapH, 1)} cm — ${flap}`} />
          </div>
          <Out
            className="mt-3"
            label="COPY TEMPLATE SPEC"
            text={`Envelope for ${cardW}×${cardH} cm card (${flap} flap)\nCut blank: ${fmt(calc.blankW, 1)} × ${fmt(calc.blankH, 1)} cm\nBody ${fmt(calc.bodyW, 1)}×${fmt(calc.bodyH, 1)} · flap ${fmt(calc.flapH, 1)} · sides ${fmt(calc.sidePocket, 1)} · bottom ${fmt(calc.bottomPocket, 1)} cm`}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const craftMeta: ToolMeta[] = [
  {
    id: "circle-skirt",
    name: "Circle Skirt Planner",
    description: "Waist, length and fullness → radii, panels and exact fabric to buy for your cloth width.",
    category: "life",
    icon: Scissors,
    keywords: "circle skirt fabric planner waist length panels half full",
    badge: "new",
    component: CircleSkirtTool,
  },
  {
    id: "crochet-colours",
    name: "Crochet Colour Rotation",
    description: "Blanket size + square gauge → squares per colour and a row-by-row colour map.",
    category: "life",
    icon: Palette,
    keywords: "crochet blanket colour pattern planner squares granny stripe",
    badge: "new",
    component: CrochetColourTool,
  },
  {
    id: "photo-wall",
    name: "Photo Wall Planner",
    description: "Wall size + frame list → a hang map with x,y coordinates you can tape to the wall.",
    category: "life",
    icon: Image,
    keywords: "photo wall layout planner frames gallery spacing coordinates",
    badge: "new",
    component: PhotoWallTool,
  },
  {
    id: "beading-plan",
    name: "Beading Pattern Planner",
    description: "Length, bead size and your repeat → beads per colour, visualised as you'd string them.",
    category: "life",
    icon: CircleDot,
    keywords: "beading pattern planner beads per colour bracelet length repeat",
    badge: "new",
    component: BeadingTool,
  },
  {
    id: "warp-plan",
    name: "Weaving Warp Planner",
    description: "Loom width, sett, project length → warp ends, yarn metres and a finished-size forecast.",
    category: "life",
    icon: Atom,
    keywords: "weaving warp planner loom width sett ends yarn length",
    badge: "new",
    component: WarpTool,
  },
  {
    id: "envelope-planner",
    name: "Envelope Template Planner",
    description: "Any card size + flap style → a cut-and-score blank with every pocket dimensioned.",
    category: "life",
    icon: Mail,
    keywords: "envelope template planner card size paper flap fold handmade",
    badge: "new",
    component: EnvelopeTool,
  },
];
