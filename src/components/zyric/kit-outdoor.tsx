"use client";

/* ==========================================================================
   KIT: OUTDOOR — 6 farm / garden / trail planning machines.
   Water on the trail, C:N chemistry, greenhouse airflow, honey in the jars,
   hay in the barn, rain off the roof. One accent per tool, every screen its
   own composition: disclaimers up front, bottle strips, zoned ratio rulers,
   fan arrays, harvest waterfalls, herd ledgers and roof-to-tank flows.
   Planning estimates only — weather, animals and soil get a vote too.
   ========================================================================== */

import { useState, useMemo } from "react";
import {
  CalendarDays,
  CloudRain,
  Coins,
  Droplets,
  Hexagon,
  Leaf,
  Milk,
  Mountain,
  Package,
  Recycle,
  Thermometer,
  Wheat,
  Wind,
} from "lucide-react";
import {
  BigStat,
  Btn,
  Field,
  fmt,
  Grid,
  KV,
  Meter,
  money,
  Note,
  Out,
  Panel,
  pct,
  Row,
  Seg,
  Slider,
  Split,
  Tag,
  accentOf,
} from "./kit";
import type { ToolMeta } from "./tool-types";

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/* --------------------------- 1. Hiking water carry ------------------------ */

type RefillId = "0" | "1" | "2" | "3" | "4" | "5" | "6";
type MarginId = "0" | "25" | "50";

const REFILL_OPTS: { v: RefillId; label: string }[] = [
  { v: "0", label: "0" },
  { v: "1", label: "1" },
  { v: "2", label: "2" },
  { v: "3", label: "3" },
  { v: "4", label: "4" },
  { v: "5", label: "5" },
  { v: "6", label: "6" },
];

const MARGIN_OPTS: { v: MarginId; label: string }[] = [
  { v: "0", label: "none" },
  { v: "25", label: "+25%" },
  { v: "50", label: "+50%" },
];

export function HikingWaterTool() {
  const A = accentOf(0);
  const [dist, setDist] = useState("12");
  const [ascent, setAscent] = useState("600");
  const [tempC, setTempC] = useState(22);
  const [alt, setAlt] = useState("500");
  const [hoursRaw, setHoursRaw] = useState("10");
  const [hoursTouched, setHoursTouched] = useState(false);
  const [refillsId, setRefillsId] = useState<RefillId>("1");
  const [marginId, setMarginId] = useState<MarginId>("25");

  const naismith = num(dist) * 0.75 + num(ascent) / 600;
  const hours = hoursTouched ? num(hoursRaw) : naismith;

  const calc = useMemo(() => {
    const a = num(ascent);
    const al = num(alt);
    const rate =
      0.4 + Math.max(0, tempC - 20) * 0.04 + a / 10000 + Math.max(0, al - 2500) * 0.0001;
    const mult = marginId === "0" ? 1 : marginId === "25" ? 1.25 : 1.5;
    const legs = Number(refillsId) + 1;
    const totalL = rate * hours * mult;
    const perLeg = totalL / legs;
    const bottlesTotal = Math.ceil(totalL / 0.75);
    const bottlesLeg = Math.ceil(perLeg / 0.75);
    return { rate, mult, legs, totalL, perLeg, bottlesTotal, bottlesLeg };
  }, [ascent, alt, tempC, hours, refillsId, marginId]);

  const shownBottles = calc.bottlesTotal <= 48;
  const basePer = Math.floor(calc.bottlesTotal / calc.legs);
  const rem = calc.bottlesTotal % calc.legs;

  const plan = [
    "HIKE WATER PLAN",
    `${fmt(num(dist), 1)} km · ${fmt(num(ascent), 0)} m ascent · ${tempC}°C · ${fmt(num(alt), 0)} m altitude`,
    `Pace ........ ${fmt(calc.rate, 2)} L/h`,
    `Time ........ ${fmt(hours, 1)} h${hoursTouched ? "" : " (Naismith)"}`,
    `Margin ...... ${marginId === "0" ? "none" : `+${marginId}%`}`,
    `Total ....... ${fmt(calc.totalL, 2)} L`,
    `Per leg ..... ${fmt(calc.perLeg, 2)} L × ${calc.legs} leg${calc.legs > 1 ? "s" : ""} (${refillsId} refill${Number(refillsId) === 1 ? "" : "s"})`,
    `Bottles ..... ${calc.bottlesTotal} × 0.75 L`,
    `Pack ........ +${fmt(calc.perLeg, 1)} kg water on a 10 kg base`,
  ].join("\n");

  return (
    <div className="space-y-4">
      {/* PROMINENT disclaimer — deliberately the first thing on screen */}
      <Panel
        title="READ THIS BEFORE YOU TRUST A NUMBER"
        accent={A}
        className="border-[#FFD43B]/50 bg-[#FFD43B]/[0.07]"
        right={<Tag accent={A}>not medical advice</Tag>}
      >
        <p className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-[#FFD43B]">
          <Thermometer className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Planning estimate only — heat, humidity and your body change everything. Drink
            when thirsty, not by numbers. Not medical advice.
          </span>
        </p>
      </Panel>

      <Split
        left={
          <Panel
            title="ROUTE & CONDITIONS"
            accent={A}
            right={<Mountain className="h-3.5 w-3.5" style={{ color: A }} />}
          >
            <div className="space-y-3">
              <Row>
                <Field label="DISTANCE KM" value={dist} onChange={setDist} type="number" min={0} step={0.5} className="w-28 sm:w-36" />
                <Field label="ASCENT M" value={ascent} onChange={setAscent} type="number" min={0} step={50} className="w-28 sm:w-36" />
                <Field label="ALTITUDE M" value={alt} onChange={setAlt} type="number" min={0} step={100} className="w-28 sm:w-36" />
              </Row>
              <Slider label="TEMPERATURE °C" value={tempC} onChange={setTempC} min={-5} max={40} step={1} suffix=" °C" accent={A} />
              <Field
                label="ESTIMATED HOURS ON TRAIL"
                value={hoursTouched ? hoursRaw : fmt(naismith, 1)}
                onChange={(v) => {
                  setHoursRaw(v);
                  setHoursTouched(true);
                }}
                type="number"
                min={0}
                step={0.5}
                hint={`Naismith auto ≈ km×0.75 + m÷600 = ${fmt(naismith, 1)} h`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Btn accent={A} variant="ghost" onClick={() => setHoursTouched(false)}>
                  use naismith auto
                </Btn>
                <span className="text-[10px] text-zinc-600">edit the field to override</span>
              </div>
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <div>
                  <p className="mono-kicker mb-1 text-zinc-500">REFILL POINTS ON ROUTE</p>
                  <Seg value={refillsId} onChange={setRefillsId} options={REFILL_OPTS} accent={A} />
                </div>
                <div>
                  <p className="mono-kicker mb-1 text-zinc-500">SAFETY MARGIN</p>
                  <Seg value={marginId} onChange={setMarginId} options={MARGIN_OPTS} accent={A} />
                </div>
              </div>
            </div>
          </Panel>
        }
        right={
          <Panel title="WATER LOAD" accent={A} right={<Droplets className="h-3.5 w-3.5" style={{ color: A }} />}>
            <div className="space-y-3">
              <BigStat label="TOTAL WATER TO PLAN FOR" value={fmt(calc.totalL, 2)} unit="L" accent={A} hint={`${fmt(calc.rate, 2)} L/h × ${fmt(hours, 1)} h × ${calc.mult}× margin`} />
              <div>
                <KV k="per leg" v={`${fmt(calc.perLeg, 2)} L`} accent={A} />
                <KV k="carry weight" v={`${fmt(calc.perLeg, 2)} kg`} accent={A} />
                <KV k="hours on trail" v={fmt(hours, 1)} />
                <KV k="thirst rate" v={`${fmt(calc.rate, 2)} L/h`} />
                <KV k="0.75 L bottles" v={`${calc.bottlesTotal} total · ${calc.bottlesLeg}/leg`} />
              </div>
              <Meter value={calc.perLeg} max={10} accent={A} label="water weight vs 10 kg base pack" right={`${fmt(calc.perLeg, 2)} / 10 kg`} />
              {shownBottles ? (
                <div className="flex flex-wrap items-end gap-4 pt-1">
                  {Array.from({ length: calc.legs }, (_, leg) => {
                    const count = basePer + (leg < rem ? 1 : 0);
                    return (
                      <div key={leg} className={`min-w-0 ${leg > 0 ? "border-l border-dashed border-zinc-700 pl-4" : ""}`}>
                        <div className="flex flex-wrap items-end gap-1">
                          {Array.from({ length: count }, (_, b) => (
                            <div
                              key={b}
                              className="h-7 w-3.5 rounded-t-sm rounded-b-md border"
                              style={{ borderColor: `${A}55`, background: `linear-gradient(to top, ${A}cc 85%, ${A}33 85%)` }}
                            />
                          ))}
                        </div>
                        <p className="mono-kicker mt-1 text-zinc-600">
                          leg {leg + 1} · {count} btl{leg > 0 ? " · after refill" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">{calc.bottlesTotal} × 0.75 L bottles — that is a expedition, consider a filter.</p>
              )}
            </div>
          </Panel>
        }
      />

      <Out text={plan} label="trip sheet" rows={9} />
      <Note>
        Basis: 0.4 L/h baseline, +0.04 L/h per °C above 20 °C, +0.1 L/h per 1000 m of ascent
        (climbing is thirsty work), plus a high-altitude bump above 2500 m. Refills split the
        load — carry filters or tablets if you count on them.
      </Note>
    </div>
  );
}

/* --------------------------- 2. Compost C:N ratio ------------------------- */

const CN_PRESETS = [
  { v: "straw", label: "Straw", c: 40, n: 0.4 },
  { v: "leaves", label: "Dry leaves", c: 45, n: 0.8 },
  { v: "grass", label: "Grass clippings", c: 40, n: 2.4 },
  { v: "food", label: "Food scraps", c: 40, n: 2.0 },
  { v: "coffee", label: "Coffee grounds", c: 45, n: 2.0 },
  { v: "manure", label: "Cow manure", c: 35, n: 1.8 },
  { v: "chips", label: "Wood chips", c: 48, n: 0.3 },
] as const;

type PresetId = (typeof CN_PRESETS)[number]["v"];
type BalId = "grass" | "coffee" | "straw" | "leaves";

const presetMap = Object.fromEntries(
  CN_PRESETS.map((p) => [p.v, { label: p.label, c: p.c, n: p.n }]),
) as Record<PresetId, { label: string; c: number; n: number }>;

const BAL_OPTS: { v: BalId; label: string }[] = [
  { v: "grass", label: "grass clippings" },
  { v: "coffee", label: "coffee grounds" },
  { v: "straw", label: "straw" },
  { v: "leaves", label: "dry leaves" },
];

const CN_ZONES = [
  { lo: 0, hi: 20, label: "slimy", color: "#3f3f46" },
  { lo: 20, hi: 25, label: "fine", color: "#71717a" },
  { lo: 25, hi: 35, label: "IDEAL", color: "#FF9DE2" },
  { lo: 35, hi: 60, label: "slow", color: "#a1a1aa" },
];

function cnZone(r: number): { label: string; tone: string } {
  if (r < 20) return { label: "Slimy / slow, add browns", tone: "#a1a1aa" };
  if (r < 25) return { label: "Fine — it will compost", tone: "#d4d4d8" };
  if (r <= 35) return { label: "Ideal — hot pile ahead", tone: "#FF9DE2" };
  if (r <= 60) return { label: "Slow, add greens", tone: "#d4d4d8" };
  return { label: "Dormant, add greens", tone: "#a1a1aa" };
}

export function CompostCnTool() {
  const A = accentOf(1);
  const [rows, setRows] = useState<{ p: PresetId; kg: string }[]>([
    { p: "straw", kg: "5" },
    { p: "leaves", kg: "4" },
    { p: "grass", kg: "3" },
    { p: "food", kg: "2" },
  ]);
  const [balId, setBalId] = useState<BalId>("grass");

  const upd = (i: number, patch: Partial<{ p: PresetId; kg: string }>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const calc = useMemo(() => {
    let C = 0;
    let N = 0;
    const per = rows.map((r) => {
      const kg = num(r.kg);
      const p = presetMap[r.p];
      const cKg = (kg * p.c) / 100;
      const nKg = (kg * p.n) / 100;
      C += cKg;
      N += nKg;
      return { ...r, label: p.label, kg, cKg, nKg };
    });
    const ratio = N > 0 ? C / N : 0;
    const zone = cnZone(ratio);
    const bal = presetMap[balId];
    const denom = 30 * (bal.n / 100) - bal.c / 100;
    const x = denom !== 0 ? (C - 30 * N) / denom : NaN;
    const addValid = Number.isFinite(x) && x > 0;
    return { per, C, N, ratio, zone, bal, x, addValid };
  }, [rows, balId]);

  const markerPct = Math.min(100, Math.max(0, (calc.ratio / 60) * 100));

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="INGREDIENTS BY WEIGHT" accent={A} right={<Recycle className="h-3.5 w-3.5" style={{ color: A }} />}>
            <div className="space-y-4">
              {calc.per.map((r, i) => (
                <div key={i} className="min-w-0 space-y-2 border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="mono-kicker text-zinc-500">BUCKET {i + 1}</span>
                    <span className="truncate font-mono text-[10px] text-zinc-600">
                      C {fmt(r.cKg, 2)} kg · N {fmt(r.nKg, 3)} kg
                    </span>
                  </div>
                  <Seg value={r.p} onChange={(v) => upd(i, { p: v })} options={CN_PRESETS} accent={A} />
                  <Row>
                    <Field label="KG" value={r.kg} onChange={(v) => upd(i, { kg: v })} type="number" min={0} step={0.5} className="w-24" />
                    <span className="truncate pb-2 text-[10px] text-zinc-600">
                      {fmt(r.kg, 1)} kg × C {presetMap[r.p].c}% / N {presetMap[r.p].n}%
                    </span>
                  </Row>
                </div>
              ))}
            </div>
          </Panel>
        }
        right={
          <div className="space-y-4">
            <Panel title="PILE VERDICT" accent={A}>
              <div className="space-y-3">
                <BigStat label="C:N RATIO" value={fmt(calc.ratio, 1)} unit=": 1" accent={A} hint={`C ${fmt(calc.C, 2)} kg · N ${fmt(calc.N, 3)} kg in the mix`} />
                <div className="flex flex-wrap items-center gap-2">
                  <Tag accent={calc.zone.tone}>{calc.zone.label}</Tag>
                  {calc.ratio >= 25 && calc.ratio <= 35 ? <Tag accent={A}>in the 25–35 window</Tag> : null}
                </div>
                {/* zoned ruler, 0–60 scale with the 25–35 ideal band in accent */}
                <div className="min-w-0 pt-1">
                  <div className="relative h-3 w-full rounded-full">
                    {CN_ZONES.map((z) => (
                      <div
                        key={z.label}
                        className="absolute top-0 h-full first:rounded-l-full last:rounded-r-full"
                        style={{
                          left: `${(z.lo / 60) * 100}%`,
                          width: `${((z.hi - z.lo) / 60) * 100}%`,
                          background: z.color,
                        }}
                      />
                    ))}
                    <div
                      className="absolute -top-1.5 h-6 w-1 rounded-full border border-zinc-950 bg-white transition-all duration-300"
                      style={{ left: `calc(${markerPct}% - 2px)` }}
                    />
                  </div>
                  <div className="relative mt-1 h-4 font-mono text-[9px] text-zinc-600">
                    <span className="absolute left-0">0</span>
                    <span className="absolute" style={{ left: "33.3%", transform: "translateX(-50%)" }}>20</span>
                    <span className="absolute" style={{ left: "41.7%", transform: "translateX(-50%)" }}>25</span>
                    <span className="absolute" style={{ left: "58.3%", transform: "translateX(-50%)" }}>35</span>
                    <span className="absolute right-0">60+</span>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="BALANCER SOLVER — HIT 30:1"
              accent={A}
              right={<Leaf className="h-3.5 w-3.5" style={{ color: A }} />}
            >
              <div className="space-y-3">
                <Seg value={balId} onChange={setBalId} options={BAL_OPTS} accent={A} />
                {calc.addValid ? (
                  <div>
                    <KV k={`add ${calc.bal.label}`} v={`+ ${fmt(calc.x, 1)} kg`} accent={A} />
                    <KV k="result" v="30 : 1 exactly" accent={A} />
                    <KV k="solver" v="(C − 30·N) ÷ (30·Nbal − Cbal)" />
                  </div>
                ) : (
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {calc.ratio <= 30
                      ? "Already at or below 30:1 — no balancer needed, build the pile."
                      : `${presetMap[balId].label.toLowerCase()} is too carbon-heavy to pull this pile down — switch to a green balancer.`}
                  </p>
                )}
              </div>
            </Panel>

            <Panel title="MIX LEDGER" accent={A}>
              <div>
                {calc.per.map((r, i) => (
                  <KV
                    key={i}
                    k={r.label}
                    v={
                      <span className="truncate">
                        {fmt(r.kg, 1)} kg → C {fmt(r.cKg, 2)} · N {fmt(r.nKg, 3)}
                      </span>
                    }
                  />
                ))}
                <KV k="totals" v={`C ${fmt(calc.C, 2)} kg · N ${fmt(calc.N, 3)} kg`} accent={A} />
              </div>
            </Panel>
          </div>
        }
      />
      <Note>
        Ratios are by weight from published average analyses, so a fluffy kg of straw and a
        soggy kg of grounds count the same. The ratio only starts the fire — chop materials
        small, keep the pile as damp as a wrung sponge, and turn it when the core cools.
      </Note>
    </div>
  );
}

/* --------------------------- 3. Greenhouse fan size ----------------------- */

export function GreenhouseCfmTool() {
  const A = accentOf(2);
  const [len, setLen] = useState("6");
  const [wid, setWid] = useState("3");
  const [hgt, setHgt] = useState("2.4");
  const [ach, setAch] = useState(1.0);
  const [cap, setCap] = useState("1600");

  const calc = useMemo(() => {
    const vol = num(len) * num(wid) * num(hgt);
    const cfm = vol * ach * 35.31; // m³/h → ft³/h → per minute
    const capacity = num(cap);
    const fans = capacity > 0 ? Math.ceil(cfm / capacity) : 0;
    const achieved = vol > 0 && capacity > 0 ? (fans * capacity) / (vol * 35.31) : 0;
    return { vol, cfm, fans, achieved, perFan: fans > 0 ? cfm / fans : 0 };
  }, [len, wid, hgt, ach, cap]);

  const achZone =
    ach < 0.75
      ? "still air — mould and heat pockets"
      : ach < 1.5
        ? "basic ventilation, temperate sites"
        : ach < 2
          ? "good airflow for warm spells"
          : "hot climate / shade cloth territory";

  const fanCircles = Math.min(calc.fans, 12);

  return (
    <div className="space-y-4">
      <Grid cols={2} className="lg:grid-cols-2">
        <BigStat label="CFM NEEDED" value={fmt(calc.cfm, 0)} unit="CFM" accent={A} hint={`${fmt(calc.vol, 1)} m³ × ${ach} air changes/h × 35.31`} />
        <BigStat label="AIR TO MOVE" value={fmt(calc.vol * ach, 0)} unit="m³/h" accent={A} hint="house volume refreshed every hour" />
      </Grid>

      <Split
        left={
          <Panel title="GREENHOUSE DIMENSIONS" accent={A} right={<Wind className="h-3.5 w-3.5" style={{ color: A }} />}>
            <div className="space-y-3">
              <Row>
                <Field label="LENGTH M" value={len} onChange={setLen} type="number" min={0} step={0.5} className="w-24 sm:w-28" />
                <Field label="WIDTH M" value={wid} onChange={setWid} type="number" min={0} step={0.5} className="w-24 sm:w-28" />
                <Field label="AVG HEIGHT M" value={hgt} onChange={setHgt} type="number" min={0} step={0.1} className="w-24 sm:w-28" />
              </Row>
              <Row>
                <Field label="FAN CAPACITY CFM EACH" value={cap} onChange={setCap} type="number" min={0} step={100} className="w-32 sm:w-40" />
              </Row>
              <Slider label="AIR CHANGES PER HOUR" value={ach} onChange={(v) => setAch(Number(v.toFixed(1)))} min={0.5} max={2.5} step={0.1} suffix=" ACH" accent={A} />
              <p className="text-[10px] text-zinc-600">1 ≈ basic · 2+ for hot climates or under shade cloth</p>
            </div>
          </Panel>
        }
        right={
          <Panel title="FAN SHOPPING LIST" accent={A}>
            <div className="space-y-3">
              <div>
                <KV k="fans required" v={`${calc.fans > 0 ? calc.fans : "—"}`} accent={A} />
                <KV k="volume" v={`${fmt(calc.vol, 1)} m³`} />
                <KV k="per fan" v={`${fmt(calc.perFan, 0)} CFM of the load`} />
                <KV k="ACH with those fans" v={calc.fans > 0 ? fmt(calc.achieved, 2) : "—"} accent={A} />
              </div>
              {calc.fans > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {Array.from({ length: fanCircles }, (_, i) => (
                    <div
                      key={i}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2"
                      style={{ borderColor: `${A}66`, background: `${A}14` }}
                      title={`fan ${i + 1}`}
                    >
                      <Wind className="h-5 w-5" style={{ color: A }} />
                    </div>
                  ))}
                  {calc.fans > 12 ? <Tag accent={A}>+{calc.fans - 12} more</Tag> : null}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">Set a fan capacity to size the array.</p>
              )}
            </div>
          </Panel>
        }
      />

      <Panel title="ACH GUIDANCE — WHERE YOU SIT" accent={A}>
        <div className="min-w-0 space-y-2">
          <div className="relative h-3 w-full rounded-full" style={{ background: `linear-gradient(90deg, #3f3f46 0%, ${A} 55%, ${A}cc 100%)` }}>
            <div
              className="absolute -top-1.5 h-6 w-1 rounded-full border border-zinc-950 bg-white transition-all duration-300"
              style={{ left: `calc(${((ach - 0.5) / 2) * 100}% - 2px)` }}
            />
            <div className="absolute -top-1.5 h-6 w-px bg-zinc-950/60" style={{ left: "25%" }} />
            <div className="absolute -top-1.5 h-6 w-px bg-zinc-950/60" style={{ left: "75%" }} />
          </div>
          <div className="flex justify-between font-mono text-[9px] text-zinc-600">
            <span>0.5</span>
            <span>1.0 basic</span>
            <span>2.0 hot</span>
            <span>2.5</span>
          </div>
          <p className="text-[11px] font-semibold" style={{ color: A }}>
            {ach} ACH — {achZone}
          </p>
        </div>
      </Panel>

      <Note>
        Ridge vents work with fans, not instead of them: plan intake free-area ≈ 1.5× the fan
        opening area (a 24-inch fan ≈ 0.29 m², so two fans want roughly 0.9 m² of open vents or
        louvres). Starved fans just stir hot air. Exhaust high on one wall, intake low on the
        other, and the breeze crosses the plants instead of short-circuiting along the ridge.
      </Note>
    </div>
  );
}

/* --------------------------- 4. Honey harvest estimator ------------------- */

type FrameId = "deep" | "medium" | "shallow";

const FRAME_OPTS: { v: FrameId; label: string }[] = [
  { v: "deep", label: "deep ≈2.7 kg" },
  { v: "medium", label: "medium ≈1.9 kg" },
  { v: "shallow", label: "shallow ≈1.4 kg" },
];

const FRAME_KG: Record<FrameId, number> = { deep: 2.7, medium: 1.9, shallow: 1.4 };

export function HoneyHarvestTool() {
  const A = accentOf(3);
  const [hives, setHives] = useState("3");
  const [frames, setFrames] = useState("20");
  const [frameId, setFrameId] = useState<FrameId>("deep");
  const [fill, setFill] = useState(80);
  const [loss, setLoss] = useState(15);
  const [stores, setStores] = useState(20);

  const calc = useMemo(() => {
    const h = num(hives);
    const f = num(frames);
    const fk = FRAME_KG[frameId];
    const gross = h * f * fk * (fill / 100);
    const net = gross * (1 - loss / 100);
    const harvest = net * (1 - stores / 100);
    return {
      fk,
      gross,
      net,
      harvest,
      storesKept: net - harvest,
      perHive: h > 0 ? harvest / h : 0,
      jars340: Math.ceil(harvest / 0.34),
      jars454: Math.ceil(harvest / 0.454),
      jars1k: Math.ceil(harvest / 1),
    };
  }, [hives, frames, frameId, fill, loss, stores]);

  const wf = [
    { k: "Gross in frames", v: calc.gross, w: 100, strong: true },
    { k: `After extraction loss (−${pct(loss, 0)})`, v: calc.net, w: calc.gross > 0 ? (calc.net / calc.gross) * 100 : 0, strong: false },
    { k: `Harvest after winter stores (−${pct(stores, 0)})`, v: calc.harvest, w: calc.gross > 0 ? (calc.harvest / calc.gross) * 100 : 0, strong: true },
  ];

  return (
    <div className="space-y-4">
      <Split
        left={
          <Panel title="HIVE & FRAME SETUP" accent={A} right={<Hexagon className="h-3.5 w-3.5" style={{ color: A }} />}>
            <div className="space-y-3">
              <Row>
                <Field label="HIVES" value={hives} onChange={setHives} type="number" min={0} step={1} className="w-20 sm:w-24" />
                <Field label="FRAMES HARVESTED PER HIVE" value={frames} onChange={setFrames} type="number" min={0} step={1} className="w-28 sm:w-36" />
              </Row>
              <div>
                <p className="mono-kicker mb-1 text-zinc-500">FRAME TYPE</p>
                <Seg value={frameId} onChange={setFrameId} options={FRAME_OPTS} accent={A} />
              </div>
              <Slider label="FRAME FILL" value={fill} onChange={setFill} min={40} max={100} step={5} suffix=" %" accent={A} />
              <Slider label="EXTRACTION LOSS" value={loss} onChange={setLoss} min={5} max={40} step={1} suffix=" %" accent={A} />
              <Slider label="WINTER STORES TO LEAVE" value={stores} onChange={setStores} min={0} max={50} step={5} suffix=" %" accent={A} />
            </div>
          </Panel>
        }
        right={
          <div className="space-y-4">
            <BigStat label="HARVEST TO THE JAR" value={fmt(calc.harvest, 1)} unit="kg" accent={A} hint={`${fmt(calc.gross, 1)} kg gross → ${fmt(calc.net, 1)} kg after losses`} />
            <Panel title="FROM GROSS TO HARVEST" accent={A}>
              <div className="space-y-2.5">
                {wf.map((r) => (
                  <div key={r.k} className="min-w-0">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="mono-kicker truncate text-zinc-500">{r.k}</span>
                      <span className="shrink-0 font-mono text-xs font-bold" style={{ color: r.strong ? A : undefined }}>
                        {fmt(r.v, 1)} kg
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, r.w)}%`, background: r.strong ? A : "#52525b" }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        }
      />

      <Panel
        title="JARS TO WASH"
        accent={A}
        right={<Package className="h-3.5 w-3.5" style={{ color: A }} />}
      >
        <Grid cols={3}>
          <BigStat label="340 G JARS" value={calc.jars340} unit="jars" accent={A} hint="classic round preserve jar" />
          <BigStat label="454 G JARS" value={calc.jars454} unit="jars" accent={A} hint="1 lb hex or squat jar" />
          <BigStat label="1 KG TUBS" value={calc.jars1k} unit="tubs" accent={A} hint="the farmers-market size" />
        </Grid>
        <div className="mt-3">
          <KV k="per hive average" v={`${fmt(calc.perHive, 1)} kg`} accent={A} />
          <KV k="stores kept in hive" v={`${fmt(calc.storesKept, 1)} kg`} />
          <KV k="frame weight used" v={`${fmt(calc.fk, 1)} kg full at ${fill}% fill`} />
        </div>
      </Panel>

      <Note>
        Leave enough for winter — bees eat first, you harvest second. In short-season areas the
        stores share should climb, not shrink: a hive that overwinters on syrup costs more than
        the honey you took. Fill % varies hugely by flow strength and frame draw.
      </Note>
    </div>
  );
}

/* --------------------------- 5. Goat feed cost ---------------------------- */

export function GoatFeedTool() {
  const A = accentOf(4);
  const [adults, setAdults] = useState("4");
  const [milking, setMilking] = useState("2");
  const [kids, setKids] = useState("1");
  const [hayA, setHayA] = useState("1.8");
  const [hayM, setHayM] = useState("2.5");
  const [hayK, setHayK] = useState("0.9");
  const [grA, setGrA] = useState("0.3");
  const [grM, setGrM] = useState("1.0");
  const [grK, setGrK] = useState("0.2");
  const [hayPrice, setHayPrice] = useState("8");
  const [grPrice, setGrPrice] = useState("0.45");
  const [lPerDoe, setLPerDoe] = useState("3");

  const calc = useMemo(() => {
    const a = num(adults);
    const m = num(milking);
    const k = num(kids);
    const hayKg = a * num(hayA) + m * num(hayM) + k * num(hayK);
    const grainKg = a * num(grA) + m * num(grM) + k * num(grK);
    const hayCost = (hayKg * num(hayPrice)) / 20;
    const grainCost = grainKg * num(grPrice);
    const daily = hayCost + grainCost;
    const milkDay = m * num(lPerDoe);
    const milkingCost = (m * num(hayM) * num(hayPrice)) / 20 + m * num(grM) * num(grPrice);
    const perL = milkDay > 0 ? milkingCost / milkDay : 0;
    const hayShare = daily > 0 ? (hayCost / daily) * 100 : 0;
    return {
      head: a + m + k,
      hayKg,
      grainKg,
      hayCost,
      grainCost,
      daily,
      balesWeek: (hayKg * 7) / 20,
      milkDay,
      milkingCost,
      perL,
      hayShare,
    };
  }, [adults, milking, kids, hayA, hayM, hayK, grA, grM, grK, hayPrice, grPrice, lPerDoe]);

  const classes = [
    { k: "adults", head: num(adults), hay: num(hayA), grain: num(grA) },
    { k: "milking does", head: num(milking), hay: num(hayM), grain: num(grM) },
    { k: "kids", head: num(kids), hay: num(hayK), grain: num(grK) },
  ];

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <BigStat label="FEED COST PER DAY" value={money(calc.daily)} accent={A} hint={`${fmt(calc.daily * 7, 2)} per week · herd of ${fmt(calc.head, 0)}`} />
        <BigStat label="FEED COST PER LITRE" value={calc.milkDay > 0 ? money(calc.perL) : "—"} accent={A} hint={calc.milkDay > 0 ? `${fmt(calc.milkDay, 1)} L/day from milking does` : "set does & litres per doe"} />
      </Grid>

      <Split
        left={
          <div className="space-y-4">
            <Panel title="HERD" accent={A}>
              <Grid cols={2}>
                <Field label="ADULT GOATS" value={adults} onChange={setAdults} type="number" min={0} step={1} />
                <Field label="MILKING DOES" value={milking} onChange={setMilking} type="number" min={0} step={1} />
                <Field label="KIDS" value={kids} onChange={setKids} type="number" min={0} step={1} />
                <Field label="MILK L/DOE/DAY" value={lPerDoe} onChange={setLPerDoe} type="number" min={0} step={0.5} hint="house average across the lactation" />
              </Grid>
            </Panel>
            <Panel title="RATION KG/DAY EACH" accent={A} right={<Wheat className="h-3.5 w-3.5" style={{ color: A }} />}>
              <div className="space-y-2">
                <p className="mono-kicker text-zinc-500">HAY</p>
                <Grid cols={3}>
                  <Field label="ADULT" value={hayA} onChange={setHayA} type="number" min={0} step={0.1} />
                  <Field label="MILKING" value={hayM} onChange={setHayM} type="number" min={0} step={0.1} />
                  <Field label="KID" value={hayK} onChange={setHayK} type="number" min={0} step={0.1} />
                </Grid>
                <p className="mono-kicker pt-1 text-zinc-500">GRAIN</p>
                <Grid cols={3}>
                  <Field label="ADULT" value={grA} onChange={setGrA} type="number" min={0} step={0.1} />
                  <Field label="MILKING" value={grM} onChange={setGrM} type="number" min={0} step={0.1} />
                  <Field label="KID" value={grK} onChange={setGrK} type="number" min={0} step={0.1} />
                </Grid>
              </div>
            </Panel>
            <Panel title="PRICES" accent={A}>
              <Row>
                <Field label="HAY $ PER 20 KG BALE" value={hayPrice} onChange={setHayPrice} type="number" min={0} step={0.5} className="w-36" />
                <Field label="GRAIN $ PER KG" value={grPrice} onChange={setGrPrice} type="number" min={0} step={0.05} className="w-32" />
              </Row>
            </Panel>
          </div>
        }
        right={
          <div className="space-y-4">
            <Panel title="FEED LEDGER" accent={A}>
              <div>
                {classes.map((c) => (
                  <KV
                    key={c.k}
                    k={`${c.k} ×${fmt(c.head, 0)}`}
                    v={<span className="truncate">{fmt(c.head * c.hay, 1)} hay + {fmt(c.head * c.grain, 1)} grain kg/day</span>}
                  />
                ))}
                <KV k="hay total" v={`${fmt(calc.hayKg, 1)} kg/day`} accent={A} />
                <KV k="grain total" v={`${fmt(calc.grainKg, 1)} kg/day`} accent={A} />
                <KV k="bales per week" v={fmt(calc.balesWeek, 2)} />
                <KV k="monthly (30 d)" v={money(calc.daily * 30)} accent={A} />
              </div>
              <div className="pt-3">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="mono-kicker text-zinc-500">COST SPLIT</span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    hay {pct(calc.hayShare, 0)} · grain {pct(100 - calc.hayShare, 0)}
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, calc.hayShare)}%`, background: A }} />
                </div>
              </div>
            </Panel>

            <Panel title="DAIRY MATHS" accent={A} right={<Coins className="h-3.5 w-3.5" style={{ color: A }} />}>
              <div>
                <KV k="milk per day" v={`${fmt(calc.milkDay, 1)} L`} accent={A} />
                <KV k="milking does' feed" v={`${money(calc.milkingCost)}/day`} />
                <KV k="cost per litre" v={calc.milkDay > 0 ? money(calc.perL) : "—"} accent={A} />
                <KV k="feed-only margin at $2/L" v={calc.milkDay > 0 ? money((2 - calc.perL) * calc.milkDay) + "/day" : "—"} />
              </div>
            </Panel>
          </div>
        }
      />

      <Note>
        Mineral block + fresh water not included — and neither are hoof trims, vaccines,
        bedding or the fence they will test daily. Bale price assumes decent grass hay;
        milking does eat first with everyone else watching.
      </Note>
    </div>
  );
}

/* --------------------------- 6. Rainwater catchment ----------------------- */

type RainMode = "monthly" | "annual";
type CoefId = "metal" | "tile" | "shingle" | "gravel";

const RAIN_MODES: { v: RainMode; label: string }[] = [
  { v: "monthly", label: "monthly mm" },
  { v: "annual", label: "annual mm" },
];

const COEF_OPTS: { v: CoefId; label: string }[] = [
  { v: "metal", label: "metal 0.95" },
  { v: "tile", label: "tile 0.90" },
  { v: "shingle", label: "shingle 0.85" },
  { v: "gravel", label: "flat gravel 0.80" },
];

const COEF: Record<CoefId, number> = { metal: 0.95, tile: 0.9, shingle: 0.85, gravel: 0.8 };

export function RainwaterTool() {
  const A = accentOf(5);
  const [area, setArea] = useState("100");
  const [mode, setMode] = useState<RainMode>("monthly");
  const [amount, setAmount] = useState("80");
  const [coefId, setCoefId] = useState<CoefId>("metal");
  const [flush, setFlush] = useState("0.5");
  const [tank, setTank] = useState("5000");
  const [useDay, setUseDay] = useState("200");

  const calc = useMemo(() => {
    const a = num(area);
    const mm = num(amount);
    const c = COEF[coefId];
    const gross = a * mm * c; // 1 mm on 1 m² = 1 L
    const flushL = a * num(flush) * (mode === "monthly" ? 1 : 12);
    const net = Math.max(0, gross - flushL);
    const monthlyL = mode === "monthly" ? net : net / 12;
    const annualL = mode === "monthly" ? net * 12 : net;
    const days = num(useDay) > 0 ? num(tank) / num(useDay) : Infinity;
    const fillMonths = monthlyL > 0 ? num(tank) / monthlyL : Infinity;
    return { gross, flushL, net, monthlyL, annualL, days, fillMonths, perMm: a * c };
  }, [area, amount, mode, coefId, flush, tank, useDay]);

  const fillPct = num(tank) > 0 ? Math.min(100, (calc.monthlyL / num(tank)) * 100) : 0;
  const fillText = !Number.isFinite(calc.fillMonths)
    ? "never — net yield ≤ 0"
    : `${fmt(calc.fillMonths, 2)} mo (~${fmt(calc.fillMonths * 4.345, 0)} wk)`;

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <BigStat
          label={mode === "monthly" ? "NET CAPTURE — TYPICAL MONTH" : "NET CAPTURE — MONTHLY AVG"}
          value={fmt(calc.monthlyL, 0)}
          unit="L"
          accent={A}
          hint={`${fmt(calc.perMm, 0)} L per mm of rain on this roof`}
        />
        <BigStat
          label="DAYS OF SUPPLY — FULL TANK"
          value={Number.isFinite(calc.days) ? fmt(calc.days, 1) : "—"}
          unit="days"
          accent={A}
          hint={`${fmt(num(tank), 0)} L tank ÷ ${fmt(num(useDay), 0)} L/day household use`}
        />
      </Grid>

      <Split
        left={
          <Panel title="ROOF & RAIN" accent={A} right={<CloudRain className="h-3.5 w-3.5" style={{ color: A }} />}>
            <div className="space-y-3">
              <Row>
                <Field label="ROOF AREA M²" value={area} onChange={setArea} type="number" min={0} step={5} className="w-28 sm:w-32" />
                <Field label={mode === "monthly" ? "RAINFALL MM / MONTH" : "RAINFALL MM / YEAR"} value={amount} onChange={setAmount} type="number" min={0} step={5} className="w-32 sm:w-40" />
              </Row>
              <div>
                <p className="mono-kicker mb-1 text-zinc-500">RAINFALL MODE</p>
                <Seg value={mode} onChange={setMode} options={RAIN_MODES} accent={A} />
              </div>
              <div>
                <p className="mono-kicker mb-1 text-zinc-500">ROOF MATERIAL (RUNOFF COEFFICIENT)</p>
                <Seg value={coefId} onChange={setCoefId} options={COEF_OPTS} accent={A} />
              </div>
            </div>
          </Panel>
        }
        right={
          <Panel title="TANK & HOUSEHOLD" accent={A}>
            <div className="space-y-3">
              <Row>
                <Field label="FIRST-FLUSH DIVERSION L/M²" value={flush} onChange={setFlush} type="number" min={0} step={0.1} className="w-28 sm:w-36" hint="dust & bird fouling skimmed per m²" />
              </Row>
              <Row>
                <Field label="TANK SIZE L" value={tank} onChange={setTank} type="number" min={0} step={500} className="w-28 sm:w-32" />
                <Field label="HOUSEHOLD USE L/DAY" value={useDay} onChange={setUseDay} type="number" min={0} step={10} className="w-28 sm:w-32" />
              </Row>
              <div>
                <KV k="annual litres" v={Number.isFinite(calc.annualL) ? `${fmt(calc.annualL, 0)} L` : "—"} accent={A} />
                <KV k="gross before flush" v={`${fmt(calc.gross, 0)} L`} />
                <KV k="first-flush loss" v={`−${fmt(calc.flushL, 0)} L`} />
                <KV k="fill time" v={fillText} accent={A} />
              </div>
              <Meter
                value={Number.isFinite(calc.days) ? Math.min(calc.days, 30) : 30}
                max={30}
                accent={A}
                label="tank vs 30-day use"
                right={Number.isFinite(calc.days) ? `${fmt(calc.days, 1)} / 30 days` : "∞"}
              />
            </div>
          </Panel>
        }
      />

      <Panel title="ROOF → TANK FLOW" accent={A}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 basis-40">
            <div
              className="mx-auto h-12 w-full max-w-[200px]"
              style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)", background: `${A}40` }}
            />
            <p className="mono-kicker mt-1 text-center text-zinc-500">
              roof · {fmt(num(area), 0)} m² · {fmt(calc.gross, 0)} L gross
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-600">−{fmt(calc.flushL, 0)} L flush →</span>
          <div className="min-w-0 flex-1 basis-40 text-center">
            <div className="relative mx-auto h-32 w-16 max-w-full overflow-hidden rounded-b-2xl border-2 border-zinc-700 bg-zinc-950/60">
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                style={{ height: `${fillPct}%`, background: `${A}30`, borderTop: `2px solid ${A}` }}
              />
              {[25, 50, 75].map((t) => (
                <div key={t} className="absolute left-0 h-px w-3 bg-zinc-700" style={{ bottom: `${t}%` }} />
              ))}
            </div>
            <p className="mono-kicker mt-1 text-zinc-500">
              tank · fills to {pct(fillPct, 0)} of capacity per {mode === "monthly" ? "month" : "avg month"}
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-600">tap →</span>
          <div className="min-w-0 flex-1 basis-40 text-center">
            <p className="font-mono text-lg font-black" style={{ color: A }}>
              {Number.isFinite(calc.days) ? `${fmt(calc.days, 0)} d` : "—"}
            </p>
            <p className="mono-kicker mt-1 text-zinc-500">
              <CalendarDays className="mr-1 inline h-3 w-3" style={{ color: A }} />
              of supply at {fmt(num(useDay), 0)} L/day
            </p>
          </div>
        </div>
      </Panel>

      <Note>
        Neutral estimate — not tied to any tank seller&apos;s range. 1 mm of rain on 1 m² of
        roof yields 1 litre before losses; the coefficient covers splash and overshoot, and the
        first flush diverts the dirty start of each storm. Real supply swings with storm
        timing, gutter losses and whether the rain actually falls when you need it.
      </Note>
    </div>
  );
}

/* ------------------------------ Meta registry ----------------------------- */

export const outdoorMeta: ToolMeta[] = [
  {
    id: "hiking-water-carry",
    name: "Hiking Water Carry",
    description: "Litres to carry for a hike from distance, climb, heat and refills — with per-leg loads and pack weight.",
    category: "life",
    icon: Droplets,
    keywords: "how much water to carry hiking calculator distance elevation temperature",
    badge: "new",
    component: HikingWaterTool,
  },
  {
    id: "compost-cn-ratio",
    name: "Compost C:N Ratio",
    description: "Weigh your browns and greens, read the C:N ratio off a zoned ruler, and solve the kg needed to hit 30:1.",
    category: "life",
    icon: Recycle,
    keywords: "compost carbon nitrogen ratio calculator ingredients by weight 30 to 1",
    badge: "new",
    component: CompostCnTool,
  },
  {
    id: "greenhouse-cfm",
    name: "Greenhouse Fan Size",
    description: "Size exhaust fans from house volume and air changes per hour — CFM, fan count and intake area.",
    category: "life",
    icon: Wind,
    keywords: "greenhouse ventilation fan calculator cfm volume air changes",
    badge: "new",
    component: GreenhouseCfmTool,
  },
  {
    id: "honey-harvest",
    name: "Honey Harvest Estimator",
    description: "Frames × hives → gross honey, minus extraction loss and winter stores, down to the jar count.",
    category: "life",
    icon: Hexagon,
    keywords: "honey harvest calculator frames kg per hive jars extraction",
    badge: "new",
    component: HoneyHarvestTool,
  },
  {
    id: "goat-feed-cost",
    name: "Goat Feed Cost",
    description: "Daily hay and grain cost for the whole herd, bales per week, and feed cost per litre of milk.",
    category: "life",
    icon: Milk,
    keywords: "goat feed cost per day calculator hay grain milk",
    badge: "new",
    component: GoatFeedTool,
  },
  {
    id: "rainwater-catchment",
    name: "Rainwater Catchment",
    description: "Roof area × rainfall → litres harvested, first-flush losses, tank fill time and days of supply.",
    category: "life",
    icon: CloudRain,
    keywords: "rainwater tank catchment calculator roof area rainfall litres",
    badge: "new",
    component: RainwaterTool,
  },
];
