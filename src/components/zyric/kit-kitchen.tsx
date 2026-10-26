"use client";

/* ==========================================================================
   KIT: KITCHEN MATHS — 8 cooking tools. A servings × pan-size recipe scaler,
   a backwards sourdough bake-day schedule, a cake-tier serving solver, a
   batch-cook freezer rotation, a spice blend scaler with a salt cap, a
   stage-by-stage pour-over planner, a slow-cooker conversion table and a
   multi-jar pickling brine calculator.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Scale, Clock4, Cake, Snowflake, Blend, Coffee, Soup, FlaskConical } from "lucide-react";
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
function hhmm(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function nice(n: number): string {
  if (n >= 100) return String(Math.round(n / 5) * 5);
  if (n >= 10) return String(Math.round(n));
  const steps = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9];
  return String(steps.reduce((best, s) => (Math.abs(s - n) < Math.abs(best - n) ? s : best), n));
}

/* --------------------- 1. Recipe Scaler: Servings × Pan -------------------- */

function RecipePanScalerTool() {
  const A = accentOf(8);
  const [ingredients, setIngredients] = useState("Flour: 500 g\nWater: 325 g\nSalt: 10 g\nOlive oil: 30 ml\nCheese: 200 g");
  const [origServ, setOrigServ] = useState(4);
  const [targServ, setTargServ] = useState(6);
  const [origPan, setOrigPan] = useState("24");
  const [targPan, setTargPan] = useState("28");
  const [shape, setShape] = useState<"round" | "rect">("round");

  const factor = useMemo(() => {
    const o = num(origPan), t = num(targPan);
    const areaO = shape === "round" ? Math.PI * (o / 2) ** 2 : o * o; // rect treats input as side
    const areaT = shape === "round" ? Math.PI * (t / 2) ** 2 : t * t;
    const serv = targServ / Math.max(1, origServ);
    return (serv * (areaT / Math.max(1, areaO)));
  }, [origServ, targServ, origPan, targPan, shape]);

  const rows = useMemo(
    () =>
      ingredients
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const m = /^(.+?):\s*([\d.]+)\s*(g|kg|ml|l|tbsp|tsp|cups?|pcs?)?$/i.exec(l);
          if (!m) return { name: l, orig: "", scaled: "", ok: false };
          const amount = num(m[2]);
          const unit = (m[3] || "").toLowerCase();
          const scaled = amount * factor;
          const display = unit === "kg" ? nice(scaled) + " kg" : unit === "l" ? nice(scaled / 1000) + " l" : unit === "cups" || unit === "cup" ? nice(scaled) + " cups" : `${nice(scaled)} ${unit}`;
          return { name: m[1].trim(), orig: m[2] + " " + (m[3] || ""), scaled: display, ok: true };
        }),
    [ingredients, factor]
  );

  return (
    <Split
      left={
        <Panel title="RECIPE & PANS" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">INGREDIENTS — NAME : AMOUNT UNIT</span>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="ORIGINAL SERVES" type="number" value={origServ} onChange={(v) => setOrigServ(num(v))} />
            <Field label="TARGET SERVES" type="number" value={targServ} onChange={(v) => setTargServ(num(v))} />
          </Row>
          <Row className="mt-3">
            <div>
              <span className="mono-kicker mb-1.5 block text-zinc-500">PAN SHAPE</span>
              <Seg value={shape} onChange={setShape} accent={A} options={[{ v: "round", label: "Round" }, { v: "rect", label: "Square" }] as const} />
            </div>
            <Field label={shape === "round" ? "ORIGINAL Ø (CM)" : "ORIGINAL SIDE (CM)"} type="number" value={origPan} onChange={setOrigPan} />
            <Field label={shape === "round" ? "TARGET Ø (CM)" : "TARGET SIDE (CM)"} type="number" value={targPan} onChange={setTargPan} />
          </Row>
          <Grid cols={2}>
            <BigStat label="SCALE FACTOR" value={"×" + fmt(factor, 2)} hint="servings × pan area" accent={A} />
            <BigStat label="PAN AREA RATIO" value={"×" + fmt(factor / (targServ / Math.max(1, origServ)), 2)} hint="the pan's own share" accent={A} />
          </Grid>
          <Note>Two levers multiply together: more mouths AND a different pan. Baking times usually drop slightly in wider, shallower pans — start checking 10% early.</Note>
        </Panel>
      }
      right={
        <Panel title="SCALED INGREDIENTS" accent={A}>
          <div className="space-y-1">
            {rows.map((r, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 border-b border-zinc-800/60 py-1.5">
                <span className="min-w-0 truncate font-mono text-[11px] text-zinc-300">{r.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-zinc-600 line-through decoration-zinc-700">{r.orig}</span>
                <span className="w-24 shrink-0 text-right font-mono text-[12px] font-black" style={{ color: A }}>{r.scaled}</span>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY SCALED RECIPE"
            text={rows.map((r) => `${r.name}: ${r.scaled || r.orig}`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------- 2. Sourdough Bake-Day Schedule ---------------------- */

function SourdoughTool() {
  const A = accentOf(9);
  const [bakeAt, setBakeAt] = useState("18:30");
  const [ratio, setRatio] = useState(20);
  const [feedGap, setFeedGap] = useState(5);
  const [bulkH, setBulkH] = useState(5);
  const [proofH, setProofH] = useState(12);
  const [foldN, setFoldN] = useState(4);

  const plan = useMemo(() => {
    const t = (() => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(bakeAt.trim());
      return m ? Number(m[1]) * 60 + Number(m[2]) : 1110;
    })();
    const steps: { at: string; label: string; detail: string }[] = [];
    const back = (mins: number) => t - mins;
    // build backwards
    const proofStart = back(proofH * 60 + 60); // + shaping hour
    const shapeAt = proofStart + 0;
    const bulkStart = proofStart - 60 - bulkH * 60;
    const folds = Array.from({ length: foldN }, (_, i) => bulkStart + ((i + 1) * (bulkH * 60)) / (foldN + 1));
    const feed2 = bulkStart - 60;
    const feed1 = feed2 - feedGap * 60;
    const start = feed1;
    steps.push({ at: hhmm(start), label: "Feed starter (1st)", detail: `${ratio}:1 — flour : water : starter` });
    steps.push({ at: hhmm(feed2), label: "Feed starter (2nd)", detail: `peak for mixing ${feedGap} h later` });
    steps.push({ at: hhmm(bulkStart), label: "Mix & start bulk", detail: `${bulkH} h bulk ferment` });
    folds.forEach((f, i) => steps.push({ at: hhmm(f), label: `Fold ${i + 1}`, detail: "stretch & fold, 4 corners" }));
    steps.push({ at: hhmm(shapeAt), label: "Shape & into banneton", detail: "tight ball, seam up" });
    steps.push({ at: hhmm(proofStart), label: "Cold proof in fridge", detail: `${proofH} h` });
    steps.push({ at: hhmm(t - 60), label: "Oven & dutch oven preheat", detail: "250 °C, 1 h" });
    steps.push({ at: hhmm(t), label: "BAKE", detail: "20 min lid on · 25 min lid off" });
    return steps;
  }, [bakeAt, ratio, feedGap, bulkH, proofH, foldN]);

  const startAt = plan[0]?.at ?? "—";

  return (
    <Split
      left={
        <Panel title="BAKE DAY TARGETS" accent={A}>
          <Row>
            <Field label="LOAVES OUT OF OVEN (HH:MM)" value={bakeAt} onChange={setBakeAt} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="HYDRATION / FEED RATIO" value={ratio} onChange={setRatio} min={10} max={40} suffix="% water" accent={A} />
            <Slider label="HOURS BETWEEN FEEDS" value={feedGap} onChange={setFeedGap} min={3} max={10} accent={A} />
            <Slider label="BULK FERMENT" value={bulkH} onChange={setBulkH} min={3} max={10} step={0.5} suffix=" h" accent={A} />
            <Slider label="COLD PROOF" value={proofH} onChange={setProofH} min={8} max={20} suffix=" h" accent={A} />
            <Slider label="FOLDS DURING BULK" value={foldN} onChange={setFoldN} min={2} max={6} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="DAY STARTS" value={startAt} hint="first feed" accent={A} />
            <BigStat label="TOTAL STAGES" value={plan.length} accent={A} />
            <BigStat label="ACTIVE WORK" value={fmt(1 + foldN * 0.1 + 1, 1)} unit="h" hint="feeds + folds + shaping" accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="BACKWARDS TIMELINE" accent={A}>
          <div className="space-y-1">
            {plan.map((s, i) => {
              const isBake = s.label === "BAKE";
              return (
                <div key={i} className="flex items-center gap-2.5" style={isBake ? { background: `${A}10`, borderRadius: 6, padding: "4px 6px" } : undefined}>
                  <span className="w-12 shrink-0 font-mono text-[11px] font-black" style={{ color: isBake ? A : "#a1a1aa" }}>{s.at}</span>
                  <div className="min-w-0 flex-1 border-b border-zinc-800/60 pb-1.5">
                    <p className="font-mono text-[11px] font-bold text-zinc-200">{s.label}</p>
                    <p className="font-mono text-[9px] text-zinc-600">{s.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Out
            className="mt-3"
            label="COPY SCHEDULE"
            text={plan.map((s) => `${s.at} — ${s.label} (${s.detail})`).join("\n")}
          />
          <Note>Everything counts down from the moment the loaf goes in. Feed times assume your starter peaks {feedGap} h after feeding — adjust to your kitchen, not the internet&apos;s.</Note>
        </Panel>
      }
    />
  );
}

/* ------------------------- 3. Cake-Tier Serving Solver --------------------- */

function CakeTierSolverTool() {
  const A = accentOf(10);
  const [guests, setGuests] = useState(80);
  const [diameters, setDiameters] = useState("10\n15\n20\n25\n30");
  const [standard, setStandard] = useState<"party" | "wedding">("party");

  const servingsOf = (d: number) => {
    // portion area standards (cm² per serving): party ~24, wedding ~12
    const area = Math.PI * (d / 2) ** 2;
    const per = standard === "wedding" ? 12 : 24;
    return Math.max(0, Math.floor(area / per));
  };

  const solutions = useMemo(() => {
    const sizes = diameters.split("\n").map((s) => num(s.trim())).filter((d) => d > 0).sort((a, b) => b - a);
    const results: { tiers: number[]; servings: number; waste: number }[] = [];
    // search all combos of up to 4 tiers (with repetition)
    const search = (start: number, chosen: number[], sum: number) => {
      if (chosen.length > 0 && sum >= guests && chosen.length <= 4) {
        results.push({ tiers: [...chosen], servings: sum, waste: sum - guests });
      }
      if (chosen.length >= 4 || start >= sizes.length) return;
      for (let i = start; i < sizes.length; i++) {
        const s = servingsOf(sizes[i]);
        if (sum + s <= guests + servingsOf(sizes[0])) search(i + 1, [...chosen, sizes[i]], sum + s);
      }
    };
    search(0, [], 0);
    results.sort((a, b) => a.waste - b.waste || a.tiers.length - b.tiers.length);
    const seen = new Set<string>();
    return results.filter((r) => {
      const k = r.tiers.join("-");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 6);
  }, [guests, diameters, standard]);

  const single = (() => {
    const sizes = diameters.split("\n").map((s) => num(s.trim())).filter((d) => d > 0).sort((a, b) => b - a);
    return sizes.map((d) => ({ d, s: servingsOf(d) }));
  })();

  return (
    <Split
      left={
        <Panel title="CAKE BRIEF" accent={A}>
          <div className="space-y-3">
            <Slider label="GUESTS TO SERVE" value={guests} onChange={setGuests} min={10} max={300} step={5} accent={A} />
          </div>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">PORTION STANDARD</span>
            <Seg value={standard} onChange={setStandard} accent={A} options={[{ v: "party", label: "Party (generous)" }, { v: "wedding", label: "Wedding (finger)" }] as const} />
          </div>
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">TIER DIAMETERS AVAILABLE (CM, ONE PER LINE)</span>
          <textarea
            value={diameters}
            onChange={(e) => setDiameters(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-2 grid grid-cols-5 gap-1">
            {single.map((s) => (
              <div key={s.d} className="rounded border border-zinc-800 bg-zinc-950/60 p-1 text-center">
                <p className="font-mono text-[9px] text-zinc-600">Ø{s.d}</p>
                <p className="font-mono text-[11px] font-black" style={{ color: A }}>{s.s}</p>
              </div>
            ))}
          </div>
        </Panel>
      }
      right={
        <Panel title="TIER COMBOS — LEAST WASTE FIRST" accent={A}>
          {solutions.length === 0 ? (
            <p className="text-sm text-zinc-500">No combo covers {guests} with those tiers — add a bigger tier.</p>
          ) : (
            <div className="space-y-2">
              {solutions.map((s, i) => (
                <div key={i} className="rounded border p-2.5" style={{ borderColor: i === 0 ? `${A}66` : "#27272a", background: i === 0 ? `${A}0a` : "transparent" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-end gap-1">
                      {[...s.tiers].sort((a, b) => b - a).map((t, ti) => (
                        <div key={ti} className="rounded-t border border-b-0 border-zinc-600 bg-zinc-800" style={{ width: Math.max(18, t * 1.1), height: 12 + ti * 6 }} title={`Ø${t}`} />
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[11px] font-black" style={{ color: A }}>{s.servings} servings</p>
                      <p className="font-mono text-[9px] text-zinc-600">waste {s.waste} · {s.tiers.length} tier{s.tiers.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-zinc-400">{[...s.tiers].sort((a, b) => b - a).map((t) => `Ø${t}`).join(" + ")}</p>
                </div>
              ))}
            </div>
          )}
          <Out
            className="mt-3"
            label="COPY BEST COMBO"
            text={solutions[0] ? `${guests} guests → ${solutions[0].tiers.map((t) => `Ø${t} cm`).join(" + ")} = ${solutions[0].servings} servings (${standard} portions)` : ""}
          />
        </Panel>
      }
    />
  );
}

/* --------------------- 4. Batch-Cook Freezer Rotation ---------------------- */

function FreezerRotationTool() {
  const A = accentOf(11);
  const [dishes, setDishes] = useState("Chilli: 8: 90\nLentil soup: 6: 120\nLasagne: 6: 60\nCurry: 8: 90");
  const [eatPerWeek, setEatPerWeek] = useState(3);
  const [start, setStart] = useState(() => iso(new Date()));

  const plan = useMemo(() => {
    const rows = dishes.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Dish", servings: num(p[1] ?? "4"), life: num(p[2] ?? "90") };
    });
    let day = 1;
    const out: { name: string; cook: string; first: string; last: string; eatDays: string[]; useBy: string; servings: number }[] = [];
    rows.forEach((r) => {
      const cookD = addDays(new Date(start + "T00:00:00"), day);
      const useBy = addDays(cookD, r.life);
      const eatSpanDays = Math.floor((r.servings / Math.max(1, eatPerWeek)) * 7);
      const eatDays: string[] = [];
      for (let i = 0; i < Math.min(r.servings, 12); i++) {
        eatDays.push(iso(addDays(cookD, Math.round((i * eatSpanDays) / Math.max(1, r.servings)))));
      }
      out.push({
        name: r.name,
        cook: iso(cookD),
        first: eatDays[0],
        last: eatDays[eatDays.length - 1],
        eatDays,
        useBy: iso(useBy),
        servings: r.servings,
      });
      day += 2; // cook days spaced
    });
    return { out, rows };
  }, [dishes, eatPerWeek, start]);

  return (
    <Split
      left={
        <Panel title="BATCH DAY" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">DISHES — NAME : SERVINGS : FREEZER-LIFE DAYS</span>
          <textarea
            value={dishes}
            onChange={(e) => setDishes(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="FIRST COOK DAY" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3">
            <Slider label="FREEZER MEALS PER WEEK" value={eatPerWeek} onChange={setEatPerWeek} min={1} max={7} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="DISHES" value={plan.rows.length} accent={A} />
            <BigStat label="SERVINGS" value={plan.rows.reduce((s, r) => s + r.servings, 0)} accent={A} />
            <BigStat label="WEEKS COVERED" value={fmt(plan.rows.reduce((s, r) => s + r.servings, 0) / Math.max(1, eatPerWeek), 0)} unit="wk" accent={A} />
          </Grid>
          <Note>Cook days stagger 2 apart so no single Sunday boils over. Each dish&apos;s eat dates stay inside its freezer life — the last serving always lands before the use-by.</Note>
        </Panel>
      }
      right={
        <Panel title="COOK → EAT → USE-BY" accent={A}>
          <div className="space-y-1.5">
            {plan.out.map((r) => (
              <div key={r.name} className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-zinc-200">{r.name}</span>
                  <Tag accent={A}>use-by {shortUk(r.useBy)}</Tag>
                </div>
                <p className="mt-0.5 font-mono text-[9px] text-zinc-500">cook {shortUk(r.cook)} → eat {shortUk(r.first)} to {shortUk(r.last)}</p>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {r.eatDays.map((d, i) => (
                    <span key={i} className="h-1.5 w-4 rounded-full" style={{ background: `${A}${i % 2 ? "cc" : "77"}` }} title={shortUk(d)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY PLAN"
            text={plan.out.map((r) => `${r.name}: cook ${r.cook}, ${r.servings} servings, eat through ${r.last}, use-by ${r.useBy}`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

function shortUk(s: string): string {
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* --------------------------- 5. Spice Blend Scaler ------------------------- */

function SpiceScalerTool() {
  const A = accentOf(12);
  const [blend, setBlend] = useState("Paprika: 3\nCumin: 3\nCoriander: 2\nGarlic powder: 1\nOregano: 1\nCayenne: 0.5\nSalt: 0.5");
  const [batch, setBatch] = useState(120);
  const [saltCap, setSaltCap] = useState(8);

  const rows = useMemo(() => {
    const list = blend.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { name: p[0] || "Spice", part: num(p[1] ?? "1") };
    });
    const total = list.reduce((s, r) => s + r.part, 0) || 1;
    return list.map((r) => ({ ...r, grams: (batch * r.part) / total }));
  }, [blend, batch]);

  const salt = rows.find((r) => /salt/i.test(r.name));
  const saltPct = salt ? (salt.grams / batch) * 100 : 0;
  const over = saltPct > saltCap;

  return (
    <Split
      left={
        <Panel title="BLEND RATIO" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SPICES — NAME : PARTS (DECIMALS FINE)</span>
          <textarea
            value={blend}
            onChange={(e) => setBlend(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Slider label="BATCH WEIGHT" value={batch} onChange={setBatch} min={20} max={500} step={5} suffix=" g" accent={A} />
            <Slider label="MAX SALT" value={saltCap} onChange={setSaltCap} min={0} max={25} suffix=" %" accent={A} />
          </div>
          <Grid cols={2}>
            <BigStat label="BATCH" value={batch} unit="g" accent={A} />
            <BigStat label="SALT SHARE" value={fmt(saltPct, 1)} unit="%" accent={over ? "#f87171" : A} hint={over ? `over your ${saltCap}% cap` : "inside the cap"} />
          </Grid>
          {over && salt ? (
            <p className="mt-2 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 font-mono text-[10px] text-amber-300">
              Salt sits at {fmt(saltPct, 1)}% against your {saltCap}% cap — drop the salt part from {fmt(salt.part, 2)} to {fmt((saltCap * (totalParts(rows) - salt.part)) / Math.max(1, 100 - saltCap), 2)} parts to land exactly on the cap.
            </p>
          ) : null}
        </Panel>
      }
      right={
        <Panel title="WEIGH-OUT CARD" accent={A}>
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.name} className="flex items-center gap-2 border-b border-zinc-800/60 py-1.5">
                <div className="h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full" style={{ width: `${(r.part / Math.max(...rows.map((x) => x.part))) * 100}%`, background: /salt/i.test(r.name) ? "#f87171" : A }} />
                </div>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-300">{r.name}</span>
                <span className="font-mono text-[10px] text-zinc-600">{r.part} pt</span>
                <span className="w-16 shrink-0 text-right font-mono text-[12px] font-black" style={{ color: /salt/i.test(r.name) ? "#f87171" : A }}>{fmt(r.grams, 1)} g</span>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY WEIGH-OUT"
            text={rows.map((r) => `${r.name}: ${fmt(r.grams, 1)} g`).join("\n") + `\nTotal ${batch} g`}
          />
        </Panel>
      }
    />
  );
}

function totalParts(rows: { part: number }[]): number {
  return rows.reduce((s, r) => s + r.part, 0) || 1;
}

/* ------------------------- 6. Pour-Over Brew Planner ----------------------- */

function PouroverTool() {
  const A = accentOf(1);
  const [dose, setDose] = useState(18);
  const [ratio, setRatio] = useState(16);
  const [bloomPct, setBloomPct] = useState(33);
  const [pours, setPours] = useState(3);
  const [bloomSec, setBloomSec] = useState(40);

  const total = dose * ratio;
  const bloom = Math.round((total * bloomPct) / 100);
  const main = total - bloom;
  const perMain = pours > 1 ? Math.round(main / (pours - 1)) : 0;

  const stages = useMemo(() => {
    const out: { t: string; label: string; water: number; cum: number }[] = [];
    let t = 0;
    let cum = 0;
    out.push({ t: "0:00", label: "Bloom", water: bloom, cum: bloom });
    cum = bloom;
    t = bloomSec;
    for (let i = 1; i < pours; i++) {
      cum += perMain;
      out.push({ t: `0:${String(t).padStart(2, "0")}`, label: `Pour ${i}`, water: perMain, cum });
      t += 30;
    }
    out.push({ t: `0:${String(t).padStart(2, "0")}`, label: "Drawdown begins", water: 0, cum: total });
    return out;
  }, [bloom, perMain, pours, bloomSec, total]);

  return (
    <Split
      left={
        <Panel title="BREW RECIPE" accent={A}>
          <div className="space-y-3">
            <Slider label="DOSE" value={dose} onChange={setDose} min={10} max={40} suffix=" g" accent={A} />
            <Slider label="RATIO" value={ratio} onChange={setRatio} min={12} max={20} suffix=" : 1" hint={`${fmt(total, 0)} g water total`} accent={A} />
            <Slider label="BLOOM" value={bloomPct} onChange={setBloomPct} min={15} max={50} suffix="%" hint={`${bloom} g`} accent={A} />
            <Slider label="MAIN POURS" value={pours} onChange={setPours} min={1} max={5} hint="after the bloom" accent={A} />
            <Slider label="BLOOM TIME" value={bloomSec} onChange={setBloomSec} min={25} max={60} step={5} suffix=" s" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="WATER TOTAL" value={total} unit="g" accent={A} />
            <BigStat label="BLOOM" value={bloom} unit="g" accent={A} />
            <BigStat label="PER MAIN POUR" value={perMain} unit="g" accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="POUR SCHEDULE" accent={A}>
          <div className="space-y-1.5">
            {stages.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-12 shrink-0 font-mono text-[11px] font-black" style={{ color: A }}>{s.t}</span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full" style={{ width: `${(s.cum / total) * 100}%`, background: A, opacity: s.water === 0 ? 0.3 : 1 }} />
                </div>
                <span className="w-20 shrink-0 text-right font-mono text-[10px] text-zinc-400">
                  {s.water > 0 ? `+${s.water} g` : ""} {s.water > 0 ? `(${s.cum})` : `(${total} g in)`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <KV k="grind cue" v={<span className="font-mono text-[10px] text-zinc-400">medium-fine · 2:30–3:30 drawdown</span>} />
            <KV k="agitation" v={<span className="font-mono text-[10px] text-zinc-400">gentle circles, no stir</span>} />
          </div>
          <Out
            className="mt-3"
            label="COPY RECIPE"
            text={`${dose} g · 1:${ratio} → ${total} g water\nBloom ${bloom} g at 0:00 (${bloomSec} s)\n` + stages.filter((s) => s.water > 0 && s.label !== "Bloom").map((s) => `${s.label}: ${s.water} g at ${s.t}`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------- 7. Slow-Cooker Converter ------------------------ */

function SlowCookerTool() {
  const A = accentOf(2);
  const [ovenH, setOvenH] = useState(1);
  const [ovenM, setOvenM] = useState(30);
  const [temp, setTemp] = useState<"low" | "med" | "high">("med");
  const [dish, setDish] = useState<"stew" | "roast" | "soup">("stew");

  const result = useMemo(() => {
    const mins = ovenH * 60 + ovenM;
    // oven temp band factor: hot ovens cook faster, so less slow time
    const tempF = temp === "low" ? 1.15 : temp === "med" ? 1 : 0.9;
    // dish factor: roasts want lower/slower, soups are forgiving
    const dishF = dish === "roast" ? 1.1 : dish === "soup" ? 0.95 : 1;
    const low = mins * 4.2 * tempF * dishF;
    const high = mins * 2.2 * tempF * dishF;
    return {
      low: Math.round(low / 30) * 30,
      high: Math.round(high / 30) * 30,
    };
  }, [ovenH, ovenM, temp, dish]);

  const fmtDur = (m: number) => `${Math.floor(m / 60)}–${Math.round((m / 60) * 1.15)} h`;

  return (
    <div className="space-y-4">
      <Panel title="RECIPE AS WRITTEN" accent={A}>
        <Row>
          <Field label="OVEN HOURS" type="number" value={ovenH} onChange={(v) => setOvenH(num(v))} />
          <Field label="OVEN MINUTES" type="number" value={ovenM} onChange={(v) => setOvenM(num(v))} />
          <div>
            <span className="mono-kicker mb-1.5 block text-zinc-500">OVEN HEAT</span>
            <Seg value={temp} onChange={setTemp} accent={A} options={[{ v: "low", label: "Low" }, { v: "med", label: "Medium" }, { v: "high", label: "Hot" }] as const} />
          </div>
          <div>
            <span className="mono-kicker mb-1.5 block text-zinc-500">DISH</span>
            <Seg value={dish} onChange={setDish} accent={A} options={[{ v: "stew", label: "Stew" }, { v: "roast", label: "Roast" }, { v: "soup", label: "Soup" }] as const} />
          </div>
        </Row>
      </Panel>
      <Grid cols={2}>
        <div className="rounded-lg border-2 p-4" style={{ borderColor: `${A}66`, background: `${A}0a` }}>
          <p className="mono-kicker text-zinc-500">COOKER LOW</p>
          <p className="mt-1 font-mono text-3xl font-black" style={{ color: A }}>{fmtDur(result.low)}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-500">≈ {fmt(result.low / 60, 1)} h centre point · add liquid per recipe</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mono-kicker text-zinc-500">COOKER HIGH</p>
          <p className="mt-1 font-mono text-3xl font-black text-zinc-200">{fmtDur(result.high)}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-500">≈ {fmt(result.high / 60, 1)} h centre point · check earlier on first try</p>
        </div>
      </Grid>
      <Out
        label="COPY CONVERSION"
        text={`Oven ${ovenH}h ${ovenM}m at ${temp} heat (${dish}) → slow cooker LOW ${fmtDur(result.low)} or HIGH ${fmtDur(result.high)}. Ranges — every cooker runs differently.`}
      />
      <Note>Standard published conversion bands, widened honestly: ovens vary, cookers vary, and meat thickness matters more than any table. Treat these as starting points and probe the centre.</Note>
    </div>
  );
}

/* --------------------------- 8. Pickling Brine ----------------------------- */

function BrineTool() {
  const A = accentOf(3);
  const [jars, setJars] = useState("2 × 500 ml\n1 × 1 l\n4 × 250 ml");
  const [saltPct, setSaltPct] = useState(3.5);
  const [headspace, setHeadspace] = useState(2);
  const [produce, setProduce] = useState(35);

  const calc = useMemo(() => {
    const list = jars.split("\n").map((l) => l.trim()).filter(Boolean).flatMap((l) => {
      const m = /^(\d+)\s*×\s*(\d+)\s*(ml|l)$/i.exec(l);
      if (!m) {
        const m2 = /^(\d+)\s*(ml|l)$/i.exec(l);
        if (!m2) return [];
        return [{ count: 1, ml: m2[2].toLowerCase() === "l" ? num(m2[1]) * 1000 : num(m2[1]) }];
      }
      return [{ count: Number(m[1]), ml: m[3].toLowerCase() === "l" ? num(m[2]) * 1000 : num(m[2]) }];
    });
    const totalMl = list.reduce((s, j) => s + j.count * j.ml, 0);
    const jarCount = list.reduce((s, j) => s + j.count, 0);
    const brinePerMl = (ml: number) => ml * (1 - headspace / 100) * (1 - produce / 100);
    const brineMl = brinePerMl(totalMl);
    const saltG = (brineMl * saltPct) / 100; // ~1 ml ≈ 1 g water
    return { list, totalMl, jarCount, brineMl, saltG, brinePerMl };
  }, [jars, saltPct, headspace, produce]);

  return (
    <Split
      left={
        <Panel title="JARS & BRINE STRENGTH" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">JARS — e.g. &quot;2 × 500 ml&quot; PER LINE</span>
          <textarea
            value={jars}
            onChange={(e) => setJars(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3 space-y-3">
            <Slider label="SALT BY WEIGHT" value={saltPct} onChange={setSaltPct} min={1} max={10} step={0.5} suffix=" %" hint="2–5% typical · 3.5% all-purpose" accent={A} />
            <Slider label="HEADSPACE" value={headspace} onChange={setHeadspace} min={0} max={10} suffix="%" accent={A} />
            <Slider label="PRODUCE ALLOWANCE" value={produce} onChange={setProduce} min={10} max={70} suffix="%" hint="how much of the jar the vegetables fill" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="JARS" value={calc.jarCount} accent={A} />
            <BigStat label="BRINE NEEDED" value={fmt(calc.brineMl / 1000, 2)} unit="L" accent={A} />
            <BigStat label="SALT" value={fmt(calc.saltG, 1)} unit="g" accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <>
          <Panel title="PER JAR" accent={A}>
            <div className="space-y-1.5">
              {calc.list.map((j, i) => {
                const brine = calc.brinePerMl(j.ml);
                return (
                  <div key={i} className="flex items-center justify-between gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                    <span className="font-mono text-[11px] text-zinc-300">{j.count} × {j.ml} ml</span>
                    <span className="font-mono text-[10px] text-zinc-500">{fmt(brine, 0)} ml brine</span>
                    <span className="font-mono text-[10px] font-black" style={{ color: A }}>{fmt((brine * saltPct) / 100, 1)} g salt</span>
                  </div>
                );
              })}
            </div>
          </Panel>
          <div className="mt-3">
            <Panel title="TOTAL MIX (ONE POT)" accent={A}>
              <KV k="water" v={`${fmt(calc.brineMl, 0)} ml`} accent={A} />
              <KV k="salt" v={`${fmt(calc.saltG, 1)} g`} accent={A} />
              <KV k="strength" v={`${saltPct}% by weight`} />
              <KV k="covers" v={`${calc.jarCount} jars (${fmt(calc.totalMl / 1000, 1)} L total volume)`} />
              <Out
                className="mt-3"
                label="COPY BRINE"
                text={`Brine for ${calc.jarCount} jars: dissolve ${fmt(calc.saltG, 1)} g salt in ${fmt(calc.brineMl, 0)} ml water (${saltPct}% w/w). Headspace ${headspace}%, produce fills ${produce}% of each jar.`}
              />
              <Note>Salt % is by weight of water — dissolve fully, submerge everything, and keep it under the brine. Percentages here are the maths, not a safety certification for canning.</Note>
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const kitchenMeta: ToolMeta[] = [
  {
    id: "recipe-pan-scaler",
    name: "Recipe + Pan Scaler",
    description: "Servings AND pan size scale together — every ingredient re-weighed for your actual tin.",
    category: "life",
    icon: Scale,
    keywords: "scale recipe different pan size servings converter ingredients",
    badge: "new",
    component: RecipePanScalerTool,
  },
  {
    id: "sourdough-schedule",
    name: "Sourdough Bake-Day Schedule",
    description: "Pick your bake time — feeds, folds, shaping and proof count backwards to the minute.",
    category: "life",
    icon: Clock4,
    keywords: "sourdough feeding bake day schedule backwards starter bulk proof",
    badge: "new",
    component: SourdoughTool,
  },
  {
    id: "cake-tier-solver",
    name: "Cake-Tier Serving Solver",
    description: "Guest count + your tier sizes → combinations that serve everyone with least waste.",
    category: "life",
    icon: Cake,
    keywords: "how many servings cake tiers size chart wedding party portions",
    badge: "new",
    component: CakeTierSolverTool,
  },
  {
    id: "freezer-rotation",
    name: "Batch-Cook Freezer Plan",
    description: "Batch sizes and freezer life → cook days, eat dates and use-bys that never collide.",
    category: "life",
    icon: Snowflake,
    keywords: "batch cook freezer rotation planner meals servings use by",
    badge: "new",
    component: FreezerRotationTool,
  },
  {
    id: "spice-scaler",
    name: "Spice Blend Scaler",
    description: "Blend parts × batch weight → grams per spice, with a salt cap that warns when you cross it.",
    category: "life",
    icon: Blend,
    keywords: "spice blend ratio scaler grams batch salt percent rub",
    badge: "new",
    component: SpiceScalerTool,
  },
  {
    id: "pourover-planner",
    name: "Pour-Over Brew Planner",
    description: "Dose, ratio, bloom and pours → a timed pour schedule you can follow mid-brew.",
    category: "life",
    icon: Coffee,
    keywords: "pour over coffee brew planner pour stages bloom schedule v60",
    badge: "new",
    component: PouroverTool,
  },
  {
    id: "slowcooker-convert",
    name: "Slow-Cooker Converter",
    description: "Oven time, heat and dish type → honest LOW and HIGH ranges for the slow cooker.",
    category: "life",
    icon: Soup,
    keywords: "slow cooker conversion time oven recipe converter crockpot",
    badge: "new",
    component: SlowCookerTool,
  },
  {
    id: "brine-planner",
    name: "Pickling Brine Planner",
    description: "Any jar collection + salt % → exact water and salt per jar and for the one big pot.",
    category: "life",
    icon: FlaskConical,
    keywords: "pickling brine planner jars salt percent water ferment cucumber",
    badge: "new",
    component: BrineTool,
  },
];
