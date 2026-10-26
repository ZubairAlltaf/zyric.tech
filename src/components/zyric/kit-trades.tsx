"use client";

/* ==========================================================================
   KIT: TRADES & SMALL BUSINESS — 8 earn-a-living machines for people who
   work with their hands. Food truck, coffee shop, bakery, welding shop,
   scaffolding, moving day, house cleaning, laundromat. Real break-even
   math, editable defaults, prominent disclaimers where the trade demands
   one. Every screen composed differently — no shared template.
   ========================================================================== */

import { useState, useMemo } from "react";
import {
  Boxes,
  Clock,
  Coffee,
  Croissant,
  DollarSign,
  Flame,
  Hammer,
  Home,
  Package,
  Ruler,
  Sparkles,
  TrendingUp,
  Truck,
  WashingMachine,
} from "lucide-react";
import {
  BigStat,
  Check,
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

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Snap to a tidy step — welders and tradesfolk set knobs, not decimals. */
function snap(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/* ------------------------- 1. Food truck festival pitch -------------------- */

export function FoodTruckPitchTool() {
  const A = accentOf(0);
  const [feeFlat, setFeeFlat] = useState("150");
  const [pitchPct, setPitchPct] = useState(10);
  const [hours, setHours] = useState("10");
  const [wage, setWage] = useState("18");
  const [fuel, setFuel] = useState("40");
  const [ticket, setTicket] = useState("12");
  const [foodPct, setFoodPct] = useState(30);
  const [wastePct, setWastePct] = useState(5);
  const [realistic, setRealistic] = useState(200);

  const fixed = num(feeFlat) + num(hours) * num(wage) + num(fuel);
  const marginShare = 1 - foodPct / 100 - wastePct / 100 - pitchPct / 100;
  const viable = marginShare > 0 && fixed > 0;
  const netPer = num(ticket) * marginShare;
  const be = viable ? Math.ceil(fixed / netPer) : Infinity;
  const profit = (n: number) => n * netPer - fixed;
  const minTurnover = viable ? fixed / marginShare : Infinity;
  const take = realistic * num(ticket);

  const verdict = !viable
    ? { label: "CHECK YOUR NUMBERS", c: "#FF8A7A" }
    : realistic > be * 1.3
      ? { label: "TAKE THE PITCH", c: "#5EE39A" }
      : realistic > be
        ? { label: "THIN MARGIN — ONE BAD HOUR SINKS IT", c: A }
        : { label: "WALK AWAY", c: "#FF8A7A" };

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-4">
            <Panel title="the deal" accent={A}>
              <Row>
                <Field label="Pitch fee (flat $)" value={feeFlat} onChange={setFeeFlat} type="number" min={0} className="flex-1" />
                <Field label="Staff hours on site" value={hours} onChange={setHours} type="number" min={0} className="flex-1" />
                <Field label="Wage $/hr" value={wage} onChange={setWage} type="number" min={0} className="flex-1" />
                <Field label="Fuel + gas, there & back $" value={fuel} onChange={setFuel} type="number" min={0} className="flex-1" />
              </Row>
              <div className="mt-3">
                <Slider label="Organiser's cut (% of turnover)" value={pitchPct} onChange={setPitchPct} min={0} max={25} suffix="%" accent={A} />
              </div>
            </Panel>
            <Panel title="the food" accent={A}>
              <Row>
                <Field label="Average ticket $" value={ticket} onChange={setTicket} type="number" min={0} step={0.5} className="flex-1" />
              </Row>
              <div className="mt-3 space-y-3">
                <Slider label="Food cost" value={foodPct} onChange={setFoodPct} min={15} max={50} suffix="%" accent={A} />
                <Slider label="Waste & unsold" value={wastePct} onChange={setWastePct} min={0} max={20} suffix="%" accent={A} />
                <Slider label="Realistic portions this event" value={realistic} onChange={setRealistic} min={20} max={500} step={10} accent={A} />
              </div>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-4">
            <Grid cols={2}>
              <BigStat
                label="Portions to break even"
                value={viable ? fmt(be, 0) : "—"}
                unit={viable ? "portions" : undefined}
                accent={A}
                hint={`fixed ${money(fixed)} · ${money(netPer)} net per portion`}
              />
              <BigStat
                label="Profit at your realistic day"
                value={money(profit(realistic))}
                accent={viable && profit(realistic) >= 0 ? "#5EE39A" : "#FF8A7A"}
                hint={`${realistic} portions × ${money(num(ticket))} ticket`}
              />
            </Grid>
            <Panel
              title="fixed costs vs the day's take"
              accent={A}
              right={<TrendingUp className="h-3.5 w-3.5" style={{ color: A }} />}
            >
              <Meter
                value={take > 0 ? fixed : 0}
                max={take > 0 ? take : 1}
                accent={A}
                label="what the fixed bill eats"
                right={take > 0 ? `${pct((fixed / take) * 100)} of take` : "—"}
              />
              <div className="mt-3">
                <KV k="fixed for the day" v={money(fixed)} accent={A} />
                <KV k="net per portion (after all %s)" v={money(netPer)} />
                <KV
                  k="minimum turnover to break even"
                  v={viable ? money(minTurnover) : "%s exceed 100% — never"}
                  accent={viable ? undefined : "#FF8A7A"}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Tag accent={verdict.c}>{verdict.label}</Tag>
                <span className="text-[10px] text-zinc-600">rule: pitch only if realistic portions &gt; break-even × 1.3</span>
              </div>
            </Panel>
            <Panel title="if the crowd shows" accent={A}>
              <KV k="90 portions — slow day" v={money(profit(90))} accent={profit(90) < 0 ? "#FF8A7A" : undefined} />
              <KV k="200 portions — decent day" v={money(profit(200))} accent={profit(200) < 0 ? "#FF8A7A" : undefined} />
              <KV k="270 portions — slammed" v={money(profit(270))} accent={profit(270) < 0 ? "#FF8A7A" : undefined} />
            </Panel>
          </div>
        }
      />
      <Note>
        “Take” is turnover, not pocketed cash — the organiser’s %, food cost and waste all come off every ticket before the fixed bill is covered. If the festival also wants insurance, generator hire or a vendor licence, fold them into the flat fee.
      </Note>
    </div>
  );
}

/* --------------------------- 2. Coffee shop break-even --------------------- */

export function CoffeeBreakEvenTool() {
  const A = accentOf(1);
  const [rent, setRent] = useState("1800");
  const [wages, setWages] = useState("3200");
  const [other, setOther] = useState("400");
  const [price, setPrice] = useState("4.50");
  const [cost, setCost] = useState("1.10");
  const [wastePct, setWastePct] = useState(4);
  const [days, setDays] = useState(24);
  const [cups, setCups] = useState("120");

  const fixed = num(rent) + num(wages) + num(other);
  const contribution = num(price) * (1 - wastePct / 100) - num(cost);
  const viable = contribution > 0 && fixed > 0;
  const beMo = viable ? Math.ceil(fixed / contribution) : Infinity;
  const beDay = viable ? Math.ceil(beMo / Math.max(1, days)) : Infinity;
  const profitAt = (c: number) => c * contribution - fixed / Math.max(1, days);
  const realCups = num(cups);

  return (
    <div className="space-y-4">
      <Panel title="monthly overheads" accent={A}>
        <Grid cols={3}>
          <Field label="Rent $/mo" value={rent} onChange={setRent} type="number" min={0} />
          <Field label="Wages $/mo" value={wages} onChange={setWages} type="number" min={0} />
          <Field label="Other fixed $/mo" value={other} onChange={setOther} type="number" min={0} hint="power, insurance, loan repayments…" />
        </Grid>
      </Panel>
      <Panel title="the cup" accent={A}>
        <Row>
          <Field label="Cup price $" value={price} onChange={setPrice} type="number" min={0} step={0.25} className="flex-1" />
          <Field label="Beans + cup + misc, per cup $" value={cost} onChange={setCost} type="number" min={0} step={0.05} className="flex-1" />
        </Row>
        <div className="mt-3 space-y-3">
          <Slider label="Waste (spilled, remade, expired)" value={wastePct} onChange={setWastePct} min={0} max={15} step={0.5} suffix="%" accent={A} />
          <Slider label="Trading days per month" value={days} onChange={setDays} min={15} max={31} accent={A} />
        </div>
      </Panel>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-6 text-center">
        <p className="mono-kicker text-zinc-500">break-even</p>
        <p className="mt-1 font-brut text-5xl sm:text-6xl" style={{ color: A }}>
          {viable ? fmt(beDay, 0) : "—"}
          <span className="ml-2 text-xl text-zinc-500">cups / day</span>
        </p>
        <p className="mt-1 text-[11px] text-zinc-600">
          {viable
            ? `${fmt(beMo, 0)} cups a month ÷ ${days} trading days · every cup clears ${money(contribution)} after waste`
            : "contribution per cup must be positive — price up or cost down"}
        </p>
        <div className="mx-auto mt-4 max-w-md">
          <Meter
            value={Math.max(0, realCups)}
            max={Math.max(1, realCups, viable ? beDay : 0)}
            accent={A}
            label="your realistic day vs break-even"
            right={viable ? `${fmt(realCups, 0)} vs ${fmt(beDay, 0)} cups/day` : "—"}
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {viable && realCups >= beDay * 1.25 ? <Tag accent="#5EE39A">COMFORTABLY ABOVE WATER</Tag> : null}
          {viable && realCups >= beDay && realCups < beDay * 1.25 ? <Tag accent={A}>ABOVE WATER — BUT TIGHT</Tag> : null}
          {viable && realCups < beDay ? <Tag accent="#FF8A7A">UNDER WATER AT THIS VOLUME</Tag> : null}
        </div>
      </div>
      <Panel title="profit per trading day at volume" accent={A} right={<Coffee className="h-3.5 w-3.5" style={{ color: A }} />}>
        <KV k="80 cups — dead Tuesday" v={money(profitAt(80))} accent={profitAt(80) < 0 ? "#FF8A7A" : undefined} />
        <KV k="150 cups — steady day" v={money(profitAt(150))} accent={profitAt(150) < 0 ? "#FF8A7A" : undefined} />
        <KV k="250 cups — weekend rush" v={money(profitAt(250))} accent={profitAt(250) < 0 ? "#FF8A7A" : undefined} />
        <KV k="each extra cup adds" v={money(contribution)} accent={A} />
      </Panel>
      <Note>
        The waste % is the one new operators forget: every spilled latte, remade flat white and bag of expired beans comes off the ticket price before rent gets paid. 4% is typical; past 8% it is a training or prep problem, not a pricing problem.
      </Note>
    </div>
  );
}

/* ------------------------------ 3. Bakery loaf cost ------------------------ */

interface Ingredient {
  name: string;
  grams: string;
  perKg: string;
}

export function BakeryLoafCostTool() {
  const A = accentOf(2);
  const [yieldN, setYieldN] = useState(4);
  const [wastePct, setWastePct] = useState(3);
  const [marginPct, setMarginPct] = useState(60);
  const [items, setItems] = useState<Ingredient[]>([
    { name: "Flour (strong white)", grams: "500", perKg: "0.80" },
    { name: "Water", grams: "320", perKg: "0" },
    { name: "Yeast (dried)", grams: "7", perKg: "4.50" },
    { name: "Salt", grams: "10", perKg: "0.50" },
  ]);

  const update = (i: number, patch: Partial<Ingredient>) =>
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const costs = items.map((it) => (num(it.grams) / 1000) * num(it.perKg));
  const batchCost = costs.reduce((a, b) => a + b, 0);
  const costPerLoaf = (batchCost * (1 + wastePct / 100)) / Math.max(1, yieldN);
  const sell = marginPct < 100 ? costPerLoaf / (1 - marginPct / 100) : Infinity;

  const gridCols = "grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem] items-end gap-2";

  return (
    <div className="space-y-4">
      <Panel title="the recipe — per batch" accent={A}>
        <div className="space-y-2">
          <div className={gridCols}>
            <span className="mono-kicker text-zinc-500">ingredient</span>
            <span className="mono-kicker text-right text-zinc-500">grams</span>
            <span className="mono-kicker text-right text-zinc-500">$ / kg</span>
          </div>
          {items.map((it, i) => (
            <div key={i} className={gridCols}>
              <Field label={`Ingredient ${i + 1}`} value={it.name} onChange={(v) => update(i, { name: v })} />
              <Field label="g" value={it.grams} onChange={(v) => update(i, { grams: v })} type="number" min={0} />
              <Field label="per kg" value={it.perKg} onChange={(v) => update(i, { perKg: v })} type="number" min={0} step={0.05} />
            </div>
          ))}
        </div>
        <Row className="mt-3">
          <Slider label="Batch yield" value={yieldN} onChange={setYieldN} min={1} max={24} suffix=" loaves" accent={A} />
          <Slider label="Waste & trim" value={wastePct} onChange={setWastePct} min={0} max={15} suffix="%" accent={A} />
          <Slider label="Target margin" value={marginPct} onChange={setMarginPct} min={0} max={90} suffix="%" accent={A} />
        </Row>
      </Panel>
      <Split
        left={
          <div className="space-y-3">
            <Grid cols={2}>
              <BigStat label="True cost per loaf" value={money(costPerLoaf)} accent={A} hint={`${fmt(yieldN, 0)} loaves · ${pct(wastePct, 0)} trim factored in`} />
              <BigStat label="Price at target margin" value={money(sell)} accent="#5EE39A" hint={`${pct(marginPct, 0)} margin on the sell price`} />
            </Grid>
            <Panel title="the batch ledger" accent={A}>
              <KV k="ingredients per batch" v={money(batchCost)} accent={A} />
              <KV k="waste allowance" v={money(batchCost * (wastePct / 100))} />
              <KV k="per slice (12 slices)" v={money(costPerLoaf / 12)} />
              <KV k="you keep per loaf" v={money(sell - costPerLoaf)} accent={sell > 0 ? "#5EE39A" : undefined} />
            </Panel>
          </div>
        }
        right={
          <Panel title="where the money goes" accent={A}>
            <div className="space-y-2.5">
              {items.map((it, i) => (
                <Meter
                  key={i}
                  value={costs[i]}
                  max={Math.max(batchCost, 0.0001)}
                  accent={A}
                  label={it.name || `ingredient ${i + 1}`}
                  right={`${money(costs[i])}${batchCost > 0 ? ` · ${pct((costs[i] / batchCost) * 100)}` : ""}`}
                />
              ))}
            </div>
            <Note>
              Bars show each ingredient’s share of the raw batch cost. Flour should dominate — if it does not, check your grams.
            </Note>
          </Panel>
        }
      />
      <Note>
        Home bakery: ingredient cost is only the start — don’t forget oven energy, tins, paper liners and your time. Real-world bakers price at 3× ingredient cost or more; the margin slider is your floor, not your ambition.
      </Note>
    </div>
  );
}

/* ------------------------------ 4. Welder settings ------------------------- */

type WeldProcess = "MIG" | "TIG" | "Stick";
type WeldMetal = "steel" | "stainless" | "aluminium";
type WeldJoint = "butt" | "fillet" | "lap";

const RODS = [
  { mm: 1.6, lo: 35, hi: 55, minT: 0, maxT: 2 },
  { mm: 2.5, lo: 70, hi: 100, minT: 2, maxT: 3 },
  { mm: 3.2, lo: 100, hi: 140, minT: 3, maxT: 6 },
  { mm: 4.0, lo: 140, hi: 180, minT: 6, maxT: 10 },
  { mm: 5.0, lo: 180, hi: 230, minT: 10, maxT: 99 },
];

export function WelderSettingsTool() {
  const A = accentOf(3);
  const [process, setProcess] = useState<WeldProcess>("MIG");
  const [metal, setMetal] = useState<WeldMetal>("steel");
  const [thickness, setThickness] = useState(3);
  const [joint, setJoint] = useState<WeldJoint>("butt");

  const settings = useMemo(() => {
    const jointF = joint === "fillet" ? 1.1 : joint === "lap" ? 1.05 : 1;
    if (process === "Stick") {
      const rod = RODS.find((r) => thickness >= r.minT && thickness < r.maxT) ?? RODS[RODS.length - 1];
      return { kind: "stick" as const, rod, ampsLo: rod.lo, ampsHi: rod.hi };
    }
    if (process === "TIG") {
      const base = (metal === "aluminium" ? thickness * 50 : thickness * 35) * jointF;
      const filler = thickness <= 1.5 ? "1.0–1.6 mm" : thickness <= 4.5 ? "1.6–2.4 mm" : "2.4–3.2 mm";
      const alloy = metal === "steel" ? "ER70S-2/6" : metal === "stainless" ? "ER308L" : "ER4043";
      return {
        kind: "tig" as const,
        ampsLo: snap(base * 0.85, 5),
        ampsHi: snap(base * 1.15, 5),
        filler: `${filler} ${alloy}`,
        mode: metal === "aluminium" ? "AC balanced" : "DCEN",
      };
    }
    const base = thickness * 40 * (metal === "aluminium" ? 1.4 : 1) * jointF;
    const ampsLo = snap(base * 0.85, 5);
    const ampsHi = snap(base * 1.15, 5);
    return {
      kind: "mig" as const,
      ampsLo,
      ampsHi,
      voltsLo: Math.round((14 + ampsLo / 25) * 10) / 10,
      voltsHi: Math.round((14 + ampsHi / 25) * 10) / 10,
      wireLo: snap(base * 0.85 * 1.7, 10),
      wireHi: snap(base * 1.15 * 1.7, 10),
    };
  }, [process, metal, thickness, joint]);

  const gas =
    process === "Stick"
      ? "None — flux-coated rod shields itself"
      : process === "TIG"
        ? metal === "aluminium"
          ? "100% argon — AC, balance ~70% EN"
          : "100% argon — DCEN"
        : metal === "steel"
          ? "C25 mix — 75% argon / 25% CO₂"
          : metal === "stainless"
            ? "Tri-mix — 98% argon / 2% CO₂"
            : "100% argon + spool gun";

  const lines: string[] = [`WELDER SETTINGS — ${process} · ${metal} · ${thickness} mm · ${joint} joint`];
  if (settings.kind === "stick") lines.push(`Rod: ${settings.rod.mm} mm E7018`, `Amps: ${settings.ampsLo}–${settings.ampsHi} A`);
  if (settings.kind === "tig") lines.push(`Amps: ${settings.ampsLo}–${settings.ampsHi} A (${settings.mode})`, `Filler: ${settings.filler}`);
  if (settings.kind === "mig")
    lines.push(
      `Amps: ${settings.ampsLo}–${settings.ampsHi} A`,
      `Volts: ${settings.voltsLo}–${settings.voltsHi} V`,
      `Wire (0.030"): ${settings.wireLo}–${settings.wireHi} in/min`,
    );
  lines.push(`Gas: ${gas}`, "Starting points only — test on scrap first.");

  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={process}
          onChange={setProcess}
          accent={A}
          options={[
            { v: "MIG" as const, label: "MIG" },
            { v: "TIG" as const, label: "TIG" },
            { v: "Stick" as const, label: "Stick" },
          ]}
        />
        <Seg
          value={metal}
          onChange={setMetal}
          accent={A}
          options={[
            { v: "steel" as const, label: "Mild steel" },
            { v: "stainless" as const, label: "Stainless" },
            { v: "aluminium" as const, label: "Aluminium" },
          ]}
        />
        <Seg
          value={joint}
          onChange={setJoint}
          accent={A}
          options={[
            { v: "butt" as const, label: "Butt" },
            { v: "fillet" as const, label: "Fillet" },
            { v: "lap" as const, label: "Lap" },
          ]}
        />
      </Row>
      <Slider label="Metal thickness" value={thickness} onChange={setThickness} min={0.5} max={12} step={0.5} suffix=" mm" accent={A} />

      <Panel title="before you strike an arc" accent="#FFB020" className="border-amber-500/50 bg-amber-500/10" right={<Hammer className="h-4 w-4 text-amber-400" />}>
        <p className="text-sm font-semibold text-amber-200">
          Starting points only — every machine, wire and joint differs. Test on scrap first. Not professional advice.
        </p>
      </Panel>

      <Panel title={`faceplate · ${process} · ${metal} · ${thickness} mm · ${joint}`} accent={A}>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <div className="min-w-0">
            <p className="mono-kicker text-zinc-500">amps</p>
            <p className="font-brut text-4xl" style={{ color: A }}>
              {settings.ampsLo}–{settings.ampsHi}
              <span className="ml-1 text-base text-zinc-500">A</span>
            </p>
          </div>
          {settings.kind === "mig" ? (
            <>
              <div className="min-w-0">
                <p className="mono-kicker text-zinc-500">volts</p>
                <p className="font-brut text-4xl text-zinc-200">
                  {settings.voltsLo}–{settings.voltsHi}
                  <span className="ml-1 text-base text-zinc-500">V</span>
                </p>
              </div>
              <div className="min-w-0">
                <p className="mono-kicker text-zinc-500">wire speed</p>
                <p className="font-brut text-4xl text-zinc-200">
                  {settings.wireLo}–{settings.wireHi}
                  <span className="ml-1 text-base text-zinc-500">ipm</span>
                </p>
              </div>
            </>
          ) : null}
        </div>
        <div className="mt-3">
          {settings.kind === "mig" ? (
            <KV
              k="wire speed, metric (0.030″ wire)"
              v={`${fmt(settings.wireLo / 39.37, 1)}–${fmt(settings.wireHi / 39.37, 1)} m/min`}
            />
          ) : null}
          {settings.kind === "tig" ? (
            <>
              <KV k="mode" v={settings.mode} accent={A} />
              <KV k="filler rod" v={settings.filler} />
            </>
          ) : null}
          {settings.kind === "stick" ? (
            <KV k="rod — E7018" v={`${settings.rod.mm} mm (${(settings.rod.mm / 25.4).toFixed(2)}″) selected for ${thickness} mm`} accent={A} />
          ) : null}
          <KV k="shielding gas" v={gas} />
          <KV k="amps rule of thumb" v={settings.kind === "stick" ? "rod table — see 7018 chart" : `thickness × ${settings.kind === "tig" ? (metal === "aluminium" ? "50 (AC)" : "35") : metal === "aluminium" ? "40 × 1.4" : "40"}`} />
        </div>
        {metal === "aluminium" && process === "MIG" ? (
          <Note>
            Aluminium on MIG wants ~1.4× the amps, pure argon and a spool gun — and it still fights you. Brush the oxide off with a stainless brush right before you weld.
          </Note>
        ) : null}
        {metal === "aluminium" && process === "TIG" ? (
          <Note>
            AC balanced cleans the oxide as you go. Ball the tungsten tip, keep the filler warm, and never let the alumina dirt into the puddle.
          </Note>
        ) : null}
      </Panel>

      <Out label="shop-card summary" text={lines.join("\n")} rows={8} />
    </div>
  );
}

/* --------------------------- 5. Scaffolding boards ------------------------- */

export function ScaffoldingBoardsTool() {
  const A = accentOf(4);
  const [length, setLength] = useState(6);
  const [width, setWidth] = useState(0.8);
  const [lifts, setLifts] = useState(1);
  const [bay, setBay] = useState(1.8);
  const [boardW, setBoardW] = useState<"225" | "150">("225");

  const bays = Math.max(1, Math.ceil(length / Math.max(0.6, bay)));
  const bw = boardW === "225" ? 0.225 : 0.15;
  const rows = Math.max(1, Math.ceil(width / bw));
  const perLift = bays * rows;
  const boards = perLift * lifts;
  const standards = (bays + 1) * 2 * lifts;
  const ledgers = bays * lifts * 2;
  const tubes = standards + ledgers;
  const clamps = tubes * 3;
  const covered = rows * bw;

  return (
    <div className="space-y-4">
      <Panel title="the deck" accent={A} right={<Ruler className="h-3.5 w-3.5" style={{ color: A }} />}>
        <Row>
          <Slider label="Platform length" value={length} onChange={setLength} min={2} max={20} step={0.5} suffix=" m" accent={A} />
          <Slider label="Platform width" value={width} onChange={setWidth} min={0.6} max={1.2} step={0.05} suffix=" m" accent={A} />
          <Slider label="Bay length" value={bay} onChange={setBay} min={1.2} max={2.4} step={0.1} suffix=" m" accent={A} />
          <Slider label="Lifts" value={lifts} onChange={setLifts} min={1} max={6} accent={A} />
        </Row>
        <div className="mt-3">
          <Seg
            value={boardW}
            onChange={setBoardW}
            accent={A}
            options={[
              { v: "225" as const, label: "225 mm standard" },
              { v: "150" as const, label: "150 mm narrow" },
            ]}
          />
        </div>
      </Panel>
      <Split
        left={
          <Panel title="plan view — boards per lift" accent={A}>
            <div className="mx-auto w-full max-w-[280px] space-y-2">
              {Array.from({ length: Math.min(lifts, 3) }).map((_, li) => (
                <div key={li} className="rounded border border-zinc-700 bg-zinc-950/60 p-1.5">
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(bays, 8) }).map((_, bi) => (
                      <div key={bi} className="min-w-0 flex-1 space-y-1">
                        {Array.from({ length: rows }).map((_, ri) => (
                          <div key={ri} className="h-1.5 rounded-sm" style={{ background: `${A}66` }} />
                        ))}
                      </div>
                    ))}
                  </div>
                  {bays > 8 ? <p className="mt-1 text-center font-mono text-[9px] text-zinc-600">+{bays - 8} more bays</p> : null}
                </div>
              ))}
              {lifts > 3 ? <p className="text-center font-mono text-[9px] text-zinc-600">+{lifts - 3} more lifts, same layout</p> : null}
              <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                <span>{fmt(length, 1)} m long</span>
                <span>{rows} boards across</span>
              </div>
            </div>
          </Panel>
        }
        right={
          <div className="space-y-4">
            <BigStat
              label="Deck boards to hire"
              value={fmt(boards, 0)}
              unit="boards"
              accent={A}
              hint={`${bays} bays × ${rows} across × ${lifts} lift${lifts === 1 ? "" : "s"}`}
            />
            <Meter
              value={width}
              max={covered}
              accent={A}
              label="deck fill — platform width vs boards laid"
              right={`${fmt(width, 2)} m of ${fmt(covered, 2)} m (${pct((width / covered) * 100)})`}
            />
            <Panel title="the frame" accent={A}>
              <KV k="bays" v={fmt(bays, 0)} />
              <KV k="boards per lift" v={fmt(perLift, 0)} accent={A} />
              <KV k="standards (uprights)" v={fmt(standards, 0)} />
              <KV k="ledgers" v={fmt(ledgers, 0)} />
              <KV k="tubes total" v={fmt(tubes, 0)} accent={A} />
              <KV k="clamps (≈3 per tube)" v={`≈ ${fmt(clamps, 0)}`} />
            </Panel>
          </div>
        }
      />
      <Note>
        Rough estimate for ordering conversations — your hire company confirms the final list. Real decks also add toe boards, braces, base plates and guard rails, and 225 mm boards are laid at roughly a 0.22 m pitch across the width.
      </Note>
    </div>
  );
}

/* ----------------------------- 6. Moving boxes ----------------------------- */

export function MovingBoxesTool() {
  const A = accentOf(5);
  const [bedrooms, setBedrooms] = useState(2);
  const [living, setLiving] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [offices, setOffices] = useState(0);
  const [booksM, setBooksM] = useState("4");
  const [fragile, setFragile] = useState("6");
  const [truck, setTruck] = useState<"10ft" | "15ft" | "20ft">("15ft");

  const books = Math.ceil(num(booksM) * 3);
  const small = bedrooms * 4 + living * 2 + kitchens * 8 + bathrooms * 2;
  const med = bedrooms * 8 + living * 4 + kitchens * 4 + offices * 3;
  const large = living * 2;
  const totalBoxes = small + med + large + books;
  const cf = small * 3 + med * 4.5 + large * 6 + books * 3;
  const cap = truck === "10ft" ? 300 : truck === "15ft" ? 450 : 600;
  const fill = cap > 0 ? (cf / cap) * 100 : 0;
  const paper = small * 25 + med * 35 + large * 45 + books * 20 + num(fragile) * 8;
  const tape = Math.ceil(totalBoxes / 8);

  const segs = [
    { k: "small", n: small, cfv: small * 3, bg: `${A}cc` },
    { k: "medium", n: med, cfv: med * 4.5, bg: `${A}77` },
    { k: "large", n: large, cfv: large * 6, bg: `${A}44` },
    { k: "books", n: books, cfv: books * 3, bg: "#52525b" },
  ].filter((s) => s.n > 0);

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="rooms" accent={A} right={<Home className="h-3.5 w-3.5" style={{ color: A }} />}>
            <Grid cols={2}>
              <Slider label="Bedrooms" value={bedrooms} onChange={setBedrooms} min={0} max={6} accent={A} />
              <Slider label="Living rooms" value={living} onChange={setLiving} min={0} max={3} accent={A} />
              <Slider label="Kitchens" value={kitchens} onChange={setKitchens} min={0} max={2} accent={A} />
              <Slider label="Bathrooms" value={bathrooms} onChange={setBathrooms} min={0} max={4} accent={A} />
              <Slider label="Offices" value={offices} onChange={setOffices} min={0} max={3} accent={A} />
            </Grid>
            <Row className="mt-3">
              <Field label="Books — linear metres of shelf" value={booksM} onChange={setBooksM} type="number" min={0} step={0.5} hint="3 small boxes per metre" className="flex-1" />
              <Field label="Fragile items (glass, art, TVs)" value={fragile} onChange={setFragile} type="number" min={0} hint="each adds ~20% more paper" className="flex-1" />
            </Row>
          </Panel>
        }
        right={
          <Panel title="the truck" accent={A} right={<Truck className="h-3.5 w-3.5" style={{ color: A }} />}>
            <Seg
              value={truck}
              onChange={setTruck}
              accent={A}
              options={[
                { v: "10ft" as const, label: "10 ft · 300 cf" },
                { v: "15ft" as const, label: "15 ft · 450 cf" },
                { v: "20ft" as const, label: "20 ft · 600 cf" },
              ]}
            />
            <div className="mt-4">
              <Meter value={cf} max={cap} accent={A} label="truck fill" right={`${pct(fill, 0)} of ${fmt(cap, 0)} cu ft`} />
            </div>
            <div className="mt-2 flex h-5 w-full overflow-hidden rounded border border-zinc-700">
              {segs.map((s) => (
                <div
                  key={s.k}
                  className="h-full"
                  style={{ width: `${cf > 0 ? (s.cfv * 100) / cf : 0}%`, background: s.bg }}
                  title={`${s.k}: ${s.n} boxes`}
                />
              ))}
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              {segs.map((s) => `${s.k} ${s.n}`).join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {fill > 100 ? <Tag accent="#FF8A7A">TOO MUCH FOR ONE TRUCK</Tag> : fill > 90 ? <Tag accent={A}>PACKED TO THE RAFTERS</Tag> : <Tag accent="#5EE39A">FITS — ROOM FOR ODD SHAPES</Tag>}
            </div>
          </Panel>
        }
      />
      <Grid cols={4}>
        <BigStat label="Small boxes" value={fmt(small, 0)} accent={A} hint={`${fmt(small * 3, 0)} cu ft · books/dishes`} />
        <BigStat label="Medium boxes" value={fmt(med, 0)} accent={A} hint={`${fmt(med * 4.5, 0)} cu ft · general`} />
        <BigStat label="Large boxes" value={fmt(large, 0)} accent={A} hint={`${fmt(large * 6, 0)} cu ft · light/bulky`} />
        <BigStat label="Book boxes" value={fmt(books, 0)} accent="#52525b" hint={`${fmt(books * 3, 0)} cu ft · ${fmt(num(booksM), 1)} m of shelf`} />
      </Grid>
      <Panel title="supplies" accent={A} right={<Package className="h-3.5 w-3.5" style={{ color: A }} />}>
        <KV k="total cubic feet" v={`${fmt(cf, 0)} cu ft`} accent={A} />
        <KV k="packing tape rolls" v={`${tape} roll${tape === 1 ? "" : "s"} (1 per ~8 boxes)`} />
        <KV k="packing paper sheets" v={`${fmt(paper, 0)} sheets`} />
        <KV k="fragile wrap allowance" v={`+${fmt(num(fragile) * 8, 0)} sheets (~20% extra each)`} />
      </Panel>
      <Note>
        Books never go in large boxes — spines fail and the box gives out around 40 lb. Heavy dishes, tins and tools go in small boxes too; your back will send its thanks.
      </Note>
    </div>
  );
}

/* ----------------------------- 7. Cleaning job pricer ---------------------- */

type Pets = "none" | "one" | "twoPlus";
type Freq = "oneoff" | "weekly" | "fortnightly" | "monthly";

const EXTRAS: Record<"oven" | "windows" | "fridge" | "laundry", { label: string; hrs: number }> = {
  oven: { label: "Oven deep clean", hrs: 1 },
  windows: { label: "Interior windows", hrs: 0.75 },
  fridge: { label: "Inside fridge", hrs: 0.5 },
  laundry: { label: "Laundry", hrs: 0.5 },
};

export function CleaningPricerTool() {
  const A = accentOf(6);
  const [rooms, setRooms] = useState(3);
  const [baths, setBaths] = useState(1);
  const [pets, setPets] = useState<Pets>("none");
  const [freq, setFreq] = useState<Freq>("oneoff");
  const [extras, setExtras] = useState({ oven: false, windows: false, fridge: false, laundry: false });
  const [rate, setRate] = useState("25");
  const [minCharge, setMinCharge] = useState("60");

  const petHours = pets === "none" ? 0 : pets === "one" ? 0.25 : 0.4;
  const extraHours =
    (extras.oven ? EXTRAS.oven.hrs : 0) +
    (extras.windows ? EXTRAS.windows.hrs : 0) +
    (extras.fridge ? EXTRAS.fridge.hrs : 0) +
    (extras.laundry ? EXTRAS.laundry.hrs : 0);
  const hours = rooms * 0.5 + baths * 0.4 + petHours + extraHours;
  const discount = freq === "weekly" ? 0.9 : freq === "fortnightly" ? 0.95 : 1;
  const base = hours * num(rate) * discount;
  const price = Math.max(num(minCharge), base);
  const minApplies = base < num(minCharge);
  const low = price * 0.85;
  const high = price * 1.15;
  const effective = hours > 0 ? price / hours : 0;

  const quote = [
    `CLEANING QUOTE — ${rooms} room${rooms === 1 ? "" : "s"}, ${baths} bath${baths === 1 ? "" : "s"}${pets !== "none" ? `, ${pets === "one" ? "1 pet" : "2+ pets"}` : ""}`,
    extras.oven ? "+ oven deep clean" : "",
    extras.windows ? "+ interior windows" : "",
    extras.fridge ? "+ inside fridge" : "",
    extras.laundry ? "+ laundry" : "",
    `${freq === "oneoff" ? "one-off" : freq} visit · ~${fmt(hours, 2)} h on site`,
    `Price: ${money(price)} (range ${money(low)}–${money(high)})`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-4">
            <Panel title="the job" accent={A} right={<Clock className="h-3.5 w-3.5" style={{ color: A }} />}>
              <Row>
                <Slider label="Rooms" value={rooms} onChange={setRooms} min={1} max={8} accent={A} />
                <Slider label="Bathrooms" value={baths} onChange={setBaths} min={1} max={4} accent={A} />
              </Row>
              <div className="mt-3 flex flex-wrap gap-3">
                <div>
                  <p className="mono-kicker mb-1.5 text-zinc-500">pets</p>
                  <Seg
                    value={pets}
                    onChange={setPets}
                    accent={A}
                    options={[
                      { v: "none" as const, label: "None" },
                      { v: "one" as const, label: "1" },
                      { v: "twoPlus" as const, label: "2+" },
                    ]}
                  />
                </div>
                <div className="min-w-0">
                  <p className="mono-kicker mb-1.5 text-zinc-500">frequency</p>
                  <Seg
                    value={freq}
                    onChange={setFreq}
                    accent={A}
                    options={[
                      { v: "oneoff" as const, label: "One-off" },
                      { v: "weekly" as const, label: "Weekly" },
                      { v: "fortnightly" as const, label: "Fortnightly" },
                      { v: "monthly" as const, label: "Monthly" },
                    ]}
                  />
                </div>
              </div>
              <p className="mono-kicker mt-4 mb-2 text-zinc-500">extras</p>
              <div className="space-y-2">
                {(Object.keys(EXTRAS) as (keyof typeof EXTRAS)[]).map((k) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <Check
                      label={EXTRAS[k].label}
                      checked={extras[k]}
                      onChange={(v) => setExtras((e) => ({ ...e, [k]: v }))}
                    />
                    <Tag accent={A}>+{fmt(EXTRAS[k].hrs, 2)} h</Tag>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="your money" accent={A}>
              <Row>
                <Field label="Target hourly rate $" value={rate} onChange={setRate} type="number" min={1} step={0.5} className="flex-1" />
                <Field label="Minimum charge $" value={minCharge} onChange={setMinCharge} type="number" min={0} className="flex-1" />
              </Row>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-4">
            <div className="rounded-lg border px-4 py-4" style={{ borderColor: `${A}55`, background: `${A}0d` }}>
              <p className="mono-kicker" style={{ color: A }}>
                your price for this job
              </p>
              <p className="mt-1 font-brut text-5xl" style={{ color: A }}>
                {money(price)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                quote range {money(low)} – {money(high)} (±15%)
              </p>
              {minApplies ? (
                <div className="mt-2">
                  <Tag accent="#FF8A7A">MINIMUM CHARGE KICKED IN</Tag>
                </div>
              ) : null}
            </div>
            <Panel title="the maths" accent={A}>
              <KV k="hours on the job" v={`${fmt(hours, 2)} h`} accent={A} />
              <KV k="rooms & baths" v={`${fmt(rooms * 0.5 + baths * 0.4, 2)} h`} />
              <KV k="pets & extras" v={`${fmt(petHours + extraHours, 2)} h`} />
              <KV k="frequency discount" v={discount < 1 ? `${Math.round((1 - discount) * 100)}% off — regular client` : "none (one-off)"} />
              <KV k="before minimum charge" v={money(base)} />
              <KV k="effective $/hr" v={hours > 0 ? money(effective) : "—"} accent={effective >= num(rate) ? "#5EE39A" : "#FF8A7A"} />
            </Panel>
            <Out label="job sheet / client text" text={quote} rows={7} />
          </div>
        }
      />
      <Note>
        You set the rate — this prices your time, not a company’s upsell. Supplies, travel and insurance come on top; nudge the hourly rate up a dollar or two if you carry them. Regular-client discounts are how you buy a predictable week.
      </Note>
    </div>
  );
}

/* ----------------------------- 8. Laundromat break-even -------------------- */

export function LaundromatBreakEvenTool() {
  const A = accentOf(7);
  const [own, setOwn] = useState<"owned" | "leased">("owned");
  const [machines, setMachines] = useState(12);
  const [washes, setWashes] = useState(6);
  const [price, setPrice] = useState("3.50");
  const [cost, setCost] = useState("0.90");
  const [rent, setRent] = useState("1500");
  const [other, setOther] = useState("300");
  const [machineCost, setMachineCost] = useState("9000");
  const [lease, setLease] = useState("600");

  const perWash = num(price) - num(cost);
  const fixed = num(rent) + num(other) + (own === "leased" ? num(lease) : 0);
  const dailyWashes = machines * washes;
  const monthlyContrib = dailyWashes * perWash * 30.4;
  const monthlyProfit = monthlyContrib - fixed;
  const bePerMachine = perWash > 0 && machines > 0 ? fixed / (machines * perWash * 30.4) : Infinity;
  const invested = machines * num(machineCost);
  const payback = own === "owned" && monthlyProfit > 0 ? invested / monthlyProfit : Infinity;
  const leasePerWash = dailyWashes > 0 ? num(lease) / (dailyWashes * 30.4) : 0;

  const verdict =
    perWash <= 0
      ? { label: "PRICE DOES NOT COVER SOAP & POWER", c: "#FF8A7A" }
      : washes >= bePerMachine * 1.3
        ? { label: "STRONG LOCATION", c: "#5EE39A" }
        : washes >= bePerMachine
          ? { label: "ABOVE BREAK-EVEN", c: A }
          : { label: "UNDER WATER", c: "#FF8A7A" };

  return (
    <div className="space-y-4">
      <Panel title="the shop" accent={A} right={<WashingMachine className="h-3.5 w-3.5" style={{ color: A }} />}>
        <Row>
          <div>
            <p className="mono-kicker mb-1.5 text-zinc-500">ownership</p>
            <Seg
              value={own}
              onChange={setOwn}
              accent={A}
              options={[
                { v: "owned" as const, label: "Owned" },
                { v: "leased" as const, label: "Leased" },
              ]}
            />
          </div>
          <Slider label="Machines" value={machines} onChange={setMachines} min={1} max={40} accent={A} />
          <Slider label="Washes per machine per day" value={washes} onChange={setWashes} min={0} max={12} step={0.5} accent={A} />
        </Row>
      </Panel>
      <Panel title="money in & money fixed" accent={A}>
        <Grid cols={4}>
          <Field label="Price per wash $" value={price} onChange={setPrice} type="number" min={0} step={0.25} />
          <Field label="Utilities + soap per wash $" value={cost} onChange={setCost} type="number" min={0} step={0.05} />
          <Field label="Rent $/mo" value={rent} onChange={setRent} type="number" min={0} />
          <Field label="Other fixed $/mo" value={other} onChange={setOther} type="number" min={0} />
        </Grid>
        <Row className="mt-3">
          {own === "leased" ? (
            <Field label="Lease $/mo per fleet or total" value={lease} onChange={setLease} type="number" min={0} hint="counts inside fixed costs below" className="flex-1" />
          ) : (
            <Field label="Machine cost per unit $" value={machineCost} onChange={setMachineCost} type="number" min={0} step={100} hint="commercial washer, installed" className="flex-1" />
          )}
        </Row>
      </Panel>
      <Grid cols={2}>
        <BigStat
          label="Break-even washes / machine / day"
          value={Number.isFinite(bePerMachine) ? fmt(bePerMachine, 1) : "—"}
          unit="washes"
          accent={A}
          hint={`fixed ${money(fixed)}/mo · each wash clears ${money(perWash)}`}
        />
        <BigStat
          label={own === "owned" ? "Monthly profit" : "Monthly margin after lease"}
          value={money(monthlyProfit)}
          accent={monthlyProfit >= 0 ? "#5EE39A" : "#FF8A7A"}
          hint={`${fmt(dailyWashes, 0)} washes/day × ${money(perWash)} × 30.4 days − ${money(fixed)} fixed`}
        />
      </Grid>
      <Meter
        value={washes}
        max={Math.max(0.5, washes, Number.isFinite(bePerMachine) ? bePerMachine : washes)}
        accent={A}
        label="utilisation — actual vs break-even volume"
        right={Number.isFinite(bePerMachine) ? `${fmt(washes, 1)} vs BE ${fmt(bePerMachine, 1)} washes/machine/day` : "—"}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Tag accent={verdict.c}>{verdict.label}</Tag>
        <span className="text-[10px] text-zinc-600">healthy laundromats run 1.3× break-even volume or better</span>
      </div>
      <Split
        left={
          <Panel title="monthly picture" accent={A} right={<TrendingUp className="h-3.5 w-3.5" style={{ color: A }} />}>
            <KV k="wash revenue" v={money(dailyWashes * num(price) * 30.4)} accent={A} />
            <KV k="soap + power + water" v={money(dailyWashes * num(cost) * 30.4)} />
            <KV k="rent + other fixed" v={money(fixed)} />
            <KV k="profit" v={money(monthlyProfit)} accent={monthlyProfit >= 0 ? "#5EE39A" : "#FF8A7A"} />
            <KV k="contribution per wash" v={money(perWash)} />
          </Panel>
        }
        right={
          <Panel title={own === "owned" ? "the payback" : "the lease drag"} accent={A} right={<DollarSign className="h-3.5 w-3.5" style={{ color: A }} />}>
            {own === "owned" ? (
              <>
                <KV k="total invested in machines" v={money(invested)} accent={A} />
                <KV k="payback at this profit" v={Number.isFinite(payback) ? `${fmt(payback, 1)} months` : "no payback at this profit"} accent={Number.isFinite(payback) ? undefined : "#FF8A7A"} />
                <KV k="profit per machine per month" v={money(machines > 0 ? monthlyProfit / machines : 0)} />
                <KV k="years to payback" v={Number.isFinite(payback) ? fmt(payback / 12, 1) : "—"} />
              </>
            ) : (
              <>
                <KV k="monthly lease drag" v={money(num(lease))} accent={A} />
                <KV k="lease cost per wash" v={dailyWashes > 0 ? money(leasePerWash) : "—"} />
                <KV k="lease as % of wash revenue" v={dailyWashes * num(price) * 30.4 > 0 ? pct((num(lease) / (dailyWashes * num(price) * 30.4)) * 100) : "—"} />
                <KV k="fixed covered by lease" v="yes — already inside break-even above" />
              </>
            )}
          </Panel>
        }
      />
      <Note>
        Uses 30.4 days per month as the average. Dryers are a separate profit line (typically 30–40% of wash revenue), and vendored soap adds a little more — this sheet is deliberately just the wash side, done honestly.
      </Note>
    </div>
  );
}

/* ============================== meta registry =============================== */

export const tradesMeta: ToolMeta[] = [
  {
    id: "food-truck-pitch",
    name: "Food Truck Festival Pitch",
    description:
      "Pitch fee, staff and fuel vs per-portion margin — portions to break even, profit scenarios and an honest take-it-or-leave-it verdict.",
    category: "business",
    icon: Truck,
    keywords: "food truck festival pitch break even calculator pitch fee percentage turnover",
    badge: "new",
    component: FoodTruckPitchTool,
  },
  {
    id: "coffee-breakeven-cups",
    name: "Coffee Shop Break-Even",
    description:
      "Rent, wages and per-cup costs → the cups-per-day your shop must pull before it makes a cent, with profit at three busy-ness levels.",
    category: "business",
    icon: Coffee,
    keywords: "coffee shop break even cups per day calculator rent waste",
    badge: "new",
    component: CoffeeBreakEvenTool,
  },
  {
    id: "bakery-loaf-cost",
    name: "Bakery Loaf Cost",
    description:
      "Weigh every ingredient into a batch, add trim waste and target margin → true cost per loaf, per slice and the price to charge.",
    category: "business",
    icon: Croissant,
    keywords: "bakery recipe cost calculator per loaf ingredient waste margin",
    badge: "new",
    component: BakeryLoafCostTool,
  },
  {
    id: "welder-settings",
    name: "Welder Settings Guide",
    description:
      "Thickness, metal and joint → starting amps, volts, wire speed, rod size and shielding gas for MIG, TIG and stick. Scrap-test first.",
    category: "business",
    icon: Flame,
    keywords: "welder settings calculator metal thickness amps volts mig tig",
    badge: "new",
    component: WelderSettingsTool,
  },
  {
    id: "scaffolding-boards",
    name: "Scaffolding Board Count",
    description:
      "Platform length, width and lifts → deck boards, tubes and clamps, with a plan-view diagram for the hire-company conversation.",
    category: "business",
    icon: Ruler,
    keywords: "scaffolding board quantity calculator platform length lifts",
    badge: "new",
    component: ScaffoldingBoardsTool,
  },
  {
    id: "moving-boxes-calc",
    name: "Moving Boxes Calculator",
    description:
      "Room-by-room box counts, book math, fragile-paper allowance and truck fill — how many small, medium and large boxes your move needs.",
    category: "business",
    icon: Boxes,
    keywords: "moving boxes calculator rooms books heavy items cubic feet",
    badge: "new",
    component: MovingBoxesTool,
  },
  {
    id: "cleaning-price-calc",
    name: "Cleaning Job Pricer",
    description:
      "Price your own cleaning hours: rooms, baths, pets and extras → hours, fair rate with regular-client discount, minimum charge and quote range.",
    category: "business",
    icon: Sparkles,
    keywords: "house cleaning price calculator rooms bathrooms pets cleaner rate",
    badge: "new",
    component: CleaningPricerTool,
  },
  {
    id: "laundromat-breakeven",
    name: "Laundromat Break-Even",
    description:
      "Machines, price per wash and rent → break-even washes per machine per day, utilisation meter and payback months on the fleet.",
    category: "business",
    icon: WashingMachine,
    keywords: "laundromat wash price break even machines per day payback",
    badge: "new",
    component: LaundromatBreakEvenTool,
  },
];
