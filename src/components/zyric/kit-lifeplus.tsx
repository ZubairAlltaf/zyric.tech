"use client";

/* ==========================================================================
   KIT: LIFE+ — 12 more everyday machines. Home projects, habits, body math.
   Every tool composes kit.tsx primitives around its own bespoke visual:
   tile grids, roll strips, cube dot-grids, side-view diagrams, wall profiles.
   Educational estimates only — not professional advice.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  Candy,
  CarFront,
  CigaretteOff,
  Coffee,
  Fish,
  Grid3x3,
  Layers,
  MoonStar,
  Mountain,
  Tv,
  Wine,
} from "lucide-react";
import {
  BigStat,
  Btn,
  Check,
  Field,
  Grid,
  KV,
  Meter,
  Note,
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
import { todayStr, uid, useLocalStorage } from "./hooks";
import type { ToolMeta } from "./tool-types";

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/* --------------------------- 1. Flooring & tile --------------------------- */

export function FlooringTool() {
  const A = accentOf(0);
  const [unit, setUnit] = useState<"m" | "ft">("m");
  const [len, setLen] = useState("4.2");
  const [wid, setWid] = useState("3.4");
  const [tile, setTile] = useState<"60x60" | "30x30" | "45x45" | "20x20" | "custom">("60x60");
  const [tw, setTw] = useState("75");
  const [tl, setTl] = useState("75");
  const [waste, setWaste] = useState(10);
  const [perBox, setPerBox] = useState("6");
  const [price, setPrice] = useState("28");

  const toCm = unit === "ft" ? 30.48 : 100;
  const roomL = num(len) * toCm;
  const roomW = num(wid) * toCm;
  const tileW = tile === "custom" ? num(tw) : num(tile.split("x")[0]);
  const tileL = tile === "custom" ? num(tl) : num(tile.split("x")[1]);
  const cols = tileW > 0 && roomW > 0 ? Math.ceil(roomW / tileW) : 0;
  const rows = tileL > 0 && roomL > 0 ? Math.ceil(roomL / tileL) : 0;
  const whole = cols * rows;
  const exactW = tileW > 0 ? Math.floor(roomW / tileW) : 0;
  const exactL = tileL > 0 ? Math.floor(roomL / tileL) : 0;
  const cuts = Math.max(0, whole - exactW * exactL);
  const buy = Math.ceil(whole * (1 + waste / 100));
  const boxes = Math.ceil(buy / Math.max(1, num(perBox)));
  const cost = boxes * num(price);
  const roomArea = (roomL * roomW) / 10000;

  // proportional tile plan — group tiles when the grid would explode
  const f = Math.max(1, Math.ceil(Math.max(cols, rows) / 30));
  const dCols = Math.ceil(cols / f);
  const dRows = Math.ceil(rows / f);
  const cells = useMemo(() => {
    const out: { i: number; j: number; cut: boolean }[] = [];
    if (dCols * dRows > 1200) return out;
    for (let j = 0; j < dRows; j++)
      for (let i = 0; i < dCols; i++)
        out.push({ i, j, cut: (i + 1) * f > exactW || (j + 1) * f > exactL });
    return out;
  }, [dCols, dRows, f, exactW, exactL]);

  return (
    <div className="space-y-4">
      <Row>
        <Seg value={unit} onChange={setUnit} accent={A} options={[{ v: "m" as const, label: "meters" }, { v: "ft" as const, label: "feet" }]} />
        <Field label={`Room length (${unit})`} value={len} onChange={setLen} type="number" step={0.1} className="flex-1" />
        <Field label={`Room width (${unit})`} value={wid} onChange={setWid} type="number" step={0.1} className="flex-1" />
      </Row>
      <Row>
        <Seg value={tile} onChange={setTile} accent={A} options={[{ v: "20x20" as const, label: "20×20" }, { v: "30x30" as const, label: "30×30" }, { v: "45x45" as const, label: "45×45" }, { v: "60x60" as const, label: "60×60" }, { v: "custom" as const, label: "custom" }]} />
        {tile === "custom" ? (
          <>
            <Field label="Tile width (cm)" value={tw} onChange={setTw} type="number" className="w-24" />
            <Field label="Tile length (cm)" value={tl} onChange={setTl} type="number" className="w-24" />
          </>
        ) : null}
      </Row>
      <Split
        left={
          <div className="space-y-3">
            <Slider label="Waste allowance (cuts, breakage)" value={waste} onChange={setWaste} min={5} max={15} suffix="%" accent={A} />
            <Grid cols={2}>
              <Field label="Tiles per box" value={perBox} onChange={setPerBox} type="number" />
              <Field label="Price per box" value={price} onChange={setPrice} type="number" step={0.5} />
            </Grid>
            <KV k="room area" v={`${fmt(roomArea)} m²`} />
            <KV k="full tiles on the plan" v={`${fmt(whole)} pcs`} accent={A} />
            <KV k="cut tiles at the edges" v={`${fmt(cuts)} pcs`} />
            <KV k="per tile" v={`${fmt(tileW)} × ${fmt(tileL)} cm`} />
          </div>
        }
        right={
          <div className="space-y-3">
            <Grid cols={3}>
              <BigStat label="Tiles incl. waste" value={fmt(buy)} unit="pcs" accent={A} />
              <BigStat label="Boxes to buy" value={fmt(boxes)} accent="#FFD43B" />
              <BigStat label="Total cost" value={money(cost)} accent="#5EE39A" />
            </Grid>
            <Panel title="tile plan" accent={A} right={f > 1 ? <Tag accent={A}>1 square = {f}×{f} tiles</Tag> : undefined}>
              {cells.length === 0 ? (
                <p className="py-10 text-center font-mono text-xs text-zinc-600">grid too fine to draw — {fmt(whole)} tiles</p>
              ) : (
                <div className="flex justify-center">
                  <div
                    className="grid rounded border border-zinc-700"
                    style={{
                      width: `min(100%, ${Math.min(280, Math.round(260 * (roomW / Math.max(1, roomL))))}px)`,
                      aspectRatio: `${Math.max(1, roomW)} / ${Math.max(1, roomL)}`,
                      gridTemplateColumns: `repeat(${dCols}, 1fr)`,
                      gridTemplateRows: `repeat(${dRows}, 1fr)`,
                    }}
                  >
                    {cells.map((c) => (
                      <div
                        key={`${c.j}-${c.i}`}
                        title={`tile ${c.j * dCols + c.i + 1}`}
                        className="border border-zinc-950/80"
                        style={{
                          background: c.cut ? `${A}3d` : (c.i + c.j) % 2 === 0 ? "#27272a" : "#1c1c20",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>
        }
      />
      <Note>
        Order {fmt(boxes)} boxes — the accent squares are edge tiles that get cut. Buy all boxes from the same batch
        (caliber/shade codes differ per batch) and keep one tile spare for future repairs.
      </Note>
    </div>
  );
}

/* --------------------------- 2. Wallpaper --------------------------------- */

export function WallpaperCalcTool() {
  const A = accentOf(1);
  const [perim, setPerim] = useState("14");
  const [height, setHeight] = useState("2.6");
  const [rollLen, setRollLen] = useState("10");
  const [rollW, setRollW] = useState("0.53");
  const [repeat, setRepeat] = useState("0");
  const TRIM = 0.1; // cm of trim allowance per strip, in meters

  const repM = num(repeat) / 100;
  const h = num(height);
  const cutLen = repM > 0 ? Math.ceil((h + TRIM) / repM) * repM : h + TRIM;
  const strips = num(rollW) > 0 ? Math.ceil(num(perim) / num(rollW)) : 0;
  const perRoll = cutLen > 0 ? Math.floor(num(rollLen) / cutLen) : 0;
  const rolls = perRoll > 0 ? Math.ceil(strips / perRoll) : 0;
  const plainCut = h + TRIM;
  const perRollPlain = plainCut > 0 ? Math.floor(num(rollLen) / plainCut) : 0;
  const rollsPlain = perRollPlain > 0 ? Math.ceil(strips / perRollPlain) : 0;
  const patternCost = Math.max(0, rolls - rollsPlain);
  const wallArea = num(perim) * h;

  const segs = Math.max(0, perRoll);
  const remPct = num(rollLen) > 0 ? Math.max(0, 100 - (segs * cutLen * 100) / num(rollLen)) : 0;

  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Grid cols={2}>
              <Field label="Room perimeter (m)" value={perim} onChange={setPerim} type="number" step={0.1} hint="walk the walls, ignore doors" />
              <Field label="Wall height (m)" value={height} onChange={setHeight} type="number" step={0.05} />
            </Grid>
            <Grid cols={2}>
              <Field label="Roll length (m)" value={rollLen} onChange={setRollLen} type="number" step={0.1} hint="standard 10 m" />
              <Field label="Roll width (m)" value={rollW} onChange={setRollW} type="number" step={0.01} hint="standard 0.53 m" />
            </Grid>
            <Field label="Pattern repeat (cm)" value={repeat} onChange={setRepeat} type="number" step={1} hint="0 = plain / non-matching. On the roll label as 'repeat'." />
            <KV k="wall area" v={`${fmt(wallArea)} m²`} />
            <KV k="cut length per strip" v={`${fmt(cutLen, 2)} m — height rounded up to the next repeat + trim`} accent={A} />
            <KV k="strips needed" v={`${fmt(strips)} × ${fmt(num(rollW), 2)} m wide`} />
            <KV k="strips per roll" v={`${fmt(perRoll)}`} />
            {repM > 0 ? <KV k="extra rolls from pattern matching" v={`+${fmt(patternCost)}`} accent="#FF7A3D" /> : null}
          </div>
        }
        right={
          <div className="space-y-3">
            <Grid cols={2}>
              <BigStat label="Rolls needed" value={fmt(rolls)} accent={A} hint={repM > 0 ? "pattern-matched" : "plain match"} />
              <BigStat label="Buy this many" value={fmt(rolls + (rolls > 0 ? 1 : 0))} accent="#FFD43B" hint="+1 for repairs & mistakes" />
            </Grid>
            <Panel title="one roll, sliced" accent={A} right={<Tag accent={A}>{fmt(cutLen, 2)} m cuts</Tag>}>
              <div className="flex items-stretch justify-center gap-4">
                <div className="flex w-10 flex-col overflow-hidden rounded border border-zinc-700" style={{ height: 240 }}>
                  {Array.from({ length: segs }).map((_, i) => (
                    <div key={i} className="w-full" style={{ height: `${(cutLen / Math.max(0.1, num(rollLen))) * 100}%`, background: `${A}59`, borderBottom: "1px solid #0a0a0a" }} />
                  ))}
                  {remPct > 0 ? <div className="w-full flex-1 bg-zinc-800" /> : null}
                </div>
                <div className="flex flex-col justify-between py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  <span>roll start</span>
                  <span>{segs} strip{segs === 1 ? "" : "s"} per roll</span>
                  <span>{fmt(remPct, 0)}% offcut</span>
                </div>
              </div>
            </Panel>
          </div>
        }
      />
      <Note>
        Perimeter already includes windows/doors — papering around them wastes less than you think. Patterned paper
        forces each strip to start on the same point of the repeat, which is why the same room needs more rolls. Always
        buy one extra roll from the same batch: dye lots change and discontinued patterns are gone for good.
      </Note>
    </div>
  );
}

/* --------------------------- 3. Gravel & mulch ---------------------------- */

export function GravelCalcTool() {
  const A = accentOf(2);
  const [mode, setMode] = useState<"dims" | "area">("dims");
  const [len, setLen] = useState("6");
  const [wid, setWid] = useState("4");
  const [area, setArea] = useState("24");
  const [depth, setDepth] = useState(7);
  const [mat, setMat] = useState<"gravel" | "mulch" | "sand">("gravel");
  const [priceT, setPriceT] = useState("45");

  const DENSITY = { gravel: 1.5, mulch: 0.4, sand: 1.6 } as const;
  const a = mode === "dims" ? num(len) * num(wid) : num(area);
  const vol = a * (depth / 100); // m³
  const liters = vol * 1000;
  const tonnes = vol * DENSITY[mat];
  const bags = Math.ceil((tonnes * 1000) / 25);
  const cost = tonnes * num(priceT);
  const wheelbarrows = vol / 0.06; // ~60 L per load
  const depthPx = Math.min(depth, 25) * 2.9;

  return (
    <div className="space-y-4">
      <Row>
        <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "dims" as const, label: "length × width" }, { v: "area" as const, label: "I know the m²" }]} />
        {mode === "dims" ? (
          <>
            <Field label="Length (m)" value={len} onChange={setLen} type="number" step={0.1} className="flex-1" />
            <Field label="Width (m)" value={wid} onChange={setWid} type="number" step={0.1} className="flex-1" />
          </>
        ) : (
          <Field label="Area (m²)" value={area} onChange={setArea} type="number" step={0.5} className="flex-1" />
        )}
      </Row>
      <Row>
        <Field label="Depth (cm)" value={depth} onChange={(v) => setDepth(num(v))} type="number" className="w-28" />
        <Seg value={mat} onChange={setMat} accent={A} options={[{ v: "gravel" as const, label: "gravel 1.5 t/m³" }, { v: "mulch" as const, label: "mulch 0.4" }, { v: "sand" as const, label: "sand 1.6" }]} />
        <Field label="Bulk price / tonne" value={priceT} onChange={setPriceT} type="number" step={1} className="w-28" />
      </Row>
      <Row>
        <span className="mono-kicker text-zinc-500">depth presets</span>
        <Btn variant="ghost" accent={A} onClick={() => setDepth(5)}>5 cm top dressing</Btn>
        <Btn variant="ghost" accent={A} onClick={() => setDepth(10)}>10 cm path</Btn>
        <Btn variant="ghost" accent={A} onClick={() => setDepth(15)}>15 cm driveway</Btn>
      </Row>
      <Panel title="cross-section" accent={A} right={<Tag accent={A}>{fmt(a)} m² × {depth} cm</Tag>}>
        <div className="relative h-28 w-full overflow-hidden rounded border border-zinc-800 bg-zinc-950/70">
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-800" style={{ height: 22 }} />
          <div className="absolute left-0 right-0 bottom-[22px]" style={{ height: depthPx, background: mat === "mulch" ? "#5a3d2e" : `${A}45`, borderTop: `2px solid ${A}` }} />
          <span className="absolute left-2 top-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: A }}>
            {mat} layer {depth} cm
          </span>
          <span className="absolute bottom-1 left-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">ground</span>
        </div>
      </Panel>
      <Grid cols={3}>
        <BigStat label="Volume" value={fmt(vol, 2)} unit="m³" accent={A} hint={`${fmt(liters)} liters`} />
        <BigStat label="Weight approx." value={fmt(tonnes, 2)} unit="t" accent="#FFD43B" hint={`${fmt(tonnes * 1000)} kg — ${DENSITY[mat]} t/m³`} />
        <BigStat label="25 kg bags" value={fmt(bags)} accent="#5EE39A" hint={`${fmt(wheelbarrows, 1)} wheelbarrow loads`} />
      </Grid>
      <KV k="bulk cost" v={`${money(cost)} at ${money(num(priceT))}/t delivered`} accent={A} />
      <KV k="bagged cost" v={`${money(bags * 6)} if bags run $6 each — bulk usually wins above ~1 t`} />
      <Note>
        Mulch compacts and blows away — order 20% more than the raw volume. Driveway gravel: 10–15 cm deep over
        landscape fabric. Decorative top dressing: 5 cm is plenty. Bulk deliveries dump in one pile; have a tarp and a
        plan (and a shovel).
      </Note>
    </div>
  );
}

/* --------------------------- 4. Aquarium ----------------------------------- */

export function AquariumTool() {
  const A = accentOf(3);
  const [len, setLen] = useState("100");
  const [wid, setWid] = useState("40");
  const [hgt, setHgt] = useState("50");
  const [gravel, setGravel] = useState(4);
  const [salt, setSalt] = useState(false);

  const liters = (num(len) * num(wid) * num(hgt)) / 1000;
  const gallons = liters / 3.785;
  const waterKg = liters * (salt ? 1.025 : 1);
  const glassKg = liters * 0.15; // rule of thumb: dry glass ≈ 15% of water volume
  const gravelKg = (num(len) * num(wid) * gravel) / 1000 * 1.5;
  const fullKg = waterKg + glassKg + gravelKg;
  const maxFishCm = liters / (salt ? 4 : 2);
  const heaterLo = Math.round(liters * 0.5);
  const heaterHi = Math.round(liters * 1);
  const flowLo = liters * 4;
  const flowHi = liters * 6;

  const SPECIES: [string, number][] = [
    ["Neon tetra", 4],
    ["Guppy", 4],
    ["Harlequin rasbora", 5],
    ["Corydoras", 7],
    ["Angelfish", 15],
    ["Common goldfish", 30],
  ];

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Length (cm)" value={len} onChange={setLen} type="number" className="flex-1" />
        <Field label="Width (cm)" value={wid} onChange={setWid} type="number" className="flex-1" />
        <Field label="Height (cm)" value={hgt} onChange={setHgt} type="number" className="flex-1" />
      </Row>
      <Row>
        <Slider label="Gravel depth" value={gravel} onChange={setGravel} min={0} max={8} suffix=" cm" accent={A} />
        <Check label="Saltwater (heavier water, lighter stocking)" checked={salt} onChange={setSalt} />
      </Row>
      <Grid cols={3}>
        <BigStat label="Volume" value={fmt(liters)} unit="L" accent={A} hint={`${fmt(gallons, 1)} US gal`} />
        <BigStat label="Full weight" value={fmt(fullKg)} unit="kg" accent="#FF7A3D" hint="water + glass + gravel" />
        <BigStat label="Empty weight" value={fmt(glassKg)} unit="kg" accent="#7FC8FF" hint="glass rule of thumb" />
      </Grid>
      <Panel title="the tank" accent={A} right={<Tag accent={A}>{fmt(num(len))} × {fmt(num(wid))} × {fmt(num(hgt))} cm</Tag>}>
        <div className="flex justify-center">
          <div
            className="relative w-full overflow-hidden rounded-md border-2 border-zinc-600 bg-zinc-900"
            style={{
              maxWidth: `${Math.min(280, Math.round(240 * (Math.max(1, num(wid)) / Math.max(1, num(hgt)))))}px`,
              aspectRatio: `${Math.max(1, num(wid))} / ${Math.max(1, num(hgt))}`,
            }}
          >
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "90%",
                background: `linear-gradient(to top, ${A}2e, ${A}14)`,
                borderTop: `1px solid ${A}77`,
              }}
            />
            {gravel > 0 ? (
              <div className="absolute inset-x-0 bottom-0 bg-amber-900/50" style={{ height: `${(gravel / 8) * 12}%`, borderTop: "1px solid #b45309" }} />
            ) : null}
            <span className="absolute right-2 top-2 font-mono text-[10px] text-zinc-500">waterline</span>
            <span className="absolute bottom-1 right-2 font-mono text-[10px] text-amber-600">{fmt(gravel)} cm gravel · {fmt(gravelKg, 1)} kg</span>
          </div>
        </div>
      </Panel>
      <Split
        left={
          <Panel title="stocking guideline" accent={A}>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {salt ? "1 cm of fish per 4 L (saltwater)" : "1 cm of fish per 2 L (freshwater)"} → your budget:{" "}
              <span style={{ color: A }}>{fmt(maxFishCm)} cm of fish</span>
            </p>
            {SPECIES.map(([name, cm]) => {
              const count = Math.floor(maxFishCm / cm);
              return (
                <KV key={name} k={name} v={count > 0 ? `≈ ${count} × ${cm} cm` : "too small"} accent={count >= 3 ? A : undefined} />
              );
            })}
          </Panel>
        }
        right={
          <Panel title="gear sizing" accent={A}>
            <KV k="heater" v={`${heaterLo}–${heaterHi} W (0.5–1 W per L)`} accent={A} />
            <KV k="filter flow" v={`${fmt(flowLo, 0)}–${fmt(flowHi, 0)} L/h (4–6× volume)`} />
            <KV k="water weight" v={`${fmt(waterKg)} kg${salt ? " at 1.025 kg/L" : ""}`} />
            <KV k="furniture check" v={`stand + floor must hold ${fmt(fullKg + 15)}+ kg`} accent="#FF7A3D" />
            <Note>Stock slowly: a few fish per week lets the bacterial filter mature. The cm-rule assumes slim fish — heavy-bodied fish (goldfish, plecos) count double.</Note>
          </Panel>
        }
      />
    </div>
  );
}

/* --------------------------- 5. BAC estimator ------------------------------ */

export function BacTool() {
  const A = accentOf(4);
  const [sex, setSex] = useState<"m" | "f">("m");
  const [weight, setWeight] = useState("70");
  const [drinks, setDrinks] = useState(3);
  const [hours, setHours] = useState(1);

  const kg = num(weight);
  const r = sex === "m" ? 0.68 : 0.55;
  const grams = drinks * 14; // one US standard drink = 14 g pure alcohol
  const peak = kg > 0 ? grams / (r * kg) : 0; // g/kg of body water ≈ ‰
  const bac = Math.max(0, peak - 0.15 * hours); // ~0.15 ‰ metabolized per hour
  const zeroIn = bac / 0.15;
  const zeroAt = new Date(Date.now() + zeroIn * 3600 * 1000);
  const clock = `${String(zeroAt.getHours()).padStart(2, "0")}:${String(zeroAt.getMinutes()).padStart(2, "0")}`;

  const ZONES: [number, string, string][] = [
    [0.5, "#5EE39A", "0–0.5 ‰ — under most EU drive limits, but never really 'fine'"],
    [0.8, "#FFD43B", "0.5–0.8 ‰ — over EU limits; US legal limit sits at 0.8"],
    [1.5, "#FF7A3D", "0.8–1.5 ‰ — clearly impaired, judgment degrades before you notice"],
    [99, "#FF8A7A", "1.5+ ‰ — severe; hospital territory approaches at 3+"],
  ];
  const zone = ZONES.find(([lim]) => bac < lim) ?? ZONES[3];
  const zColor = zone[1];

  const SEG = [[0.5, "#5EE39A"], [0.3, "#FFD43B"], [0.7, "#FF7A3D"], [1.5, "#FF8A7A"]] as const;

  return (
    <div className="space-y-4">
      <Panel title="educational only — not legal or medical advice" accent="#FF7A3D">
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Widmark equation with population-average constants. Real BAC depends on food, hydration, medication and
          liver chemistry. <span className="font-bold text-zinc-200">Never drink and drive</span> — the only safe
          level behind a wheel is zero.
        </p>
      </Panel>
      <Split
        left={
          <div className="space-y-3">
            <Seg value={sex} onChange={setSex} accent={A} options={[{ v: "m" as const, label: "Male (r 0.68)" }, { v: "f" as const, label: "Female (r 0.55)" }]} />
            <Field label="Body weight (kg)" value={weight} onChange={setWeight} type="number" />
            <Slider label="Standard drinks" value={drinks} onChange={setDrinks} min={0.5} max={20} step={0.5} accent={A} />
            <Slider label="Hours since the first drink" value={hours} onChange={setHours} min={0} max={12} step={0.5} accent={A} suffix=" h" />
            <KV k="pure alcohol" v={`${fmt(grams)} g (${fmt(drinks, 1)} × 14 g)`} />
            <KV k="peak BAC (before elimination)" v={`${fmt(peak, 2)} ‰`} />
            <KV k="body water factor r" v={`${r}`} />
          </div>
        }
        right={
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-6 py-6 text-center">
              <p className="mono-kicker text-zinc-500">estimated BAC now</p>
              <p className="mt-1 font-brut text-5xl" style={{ color: bac <= 0 ? "#5EE39A" : zColor }}>
                {fmt(bac, 2)}
                <span className="ml-1 text-xl text-zinc-500">‰</span>
              </p>
              <p className="mt-2 font-mono text-[11px] text-zinc-500">{bac <= 0 ? "fully metabolized" : zone[2]}</p>
            </div>
            <Panel title="zone scale (g per liter of blood)" accent={zColor}>
              <div className="relative">
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {SEG.map(([w, c]) => (
                    <div key={c} className="h-full" style={{ width: `${(w / 3) * 100}%`, background: c }} />
                  ))}
                </div>
                <div className="absolute -top-1 h-5 w-0.5 bg-white" style={{ left: `${Math.min(100, (bac / 3) * 100)}%` }} />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] text-zinc-600">
                <span>0</span><span>0.5</span><span>0.8</span><span>1.5</span><span>3+</span>
              </div>
            </Panel>
            <Grid cols={2}>
              <BigStat label="Back to zero around" value={bac <= 0 ? "now" : clock} accent={A} hint={`${fmt(zeroIn, 1)} h at 0.15 ‰/h`} />
              <BigStat label="Per-drink rise" value={fmt(kg > 0 ? 14 / (r * kg) : 0, 2)} unit="‰" accent="#FFD43B" hint="then subtract 0.15 ‰ per hour" />
            </Grid>
          </div>
        }
      />
      <Note>
        One "standard drink" = 14 g alcohol: a 355 ml 5% beer, a 150 ml 12% wine, or a 45 ml 40% shot. Craft beers,
        generous pours and cocktails routinely count double. Coffee, cold showers and food do not speed the liver up —
        only time does.
      </Note>
    </div>
  );
}

/* --------------------------- 6. Caffeine coach ----------------------------- */

type CaffeineLog = { d: string; items: { id: string; name: string; mg: number }[] };

const DRINKS: { k: string; label: string; mg: number }[] = [
  { k: "espresso", label: "Espresso", mg: 75 },
  { k: "brewed", label: "Brewed coffee", mg: 95 },
  { k: "latte", label: "Latte", mg: 75 },
  { k: "energy", label: "Energy drink", mg: 80 },
  { k: "cola", label: "Cola", mg: 34 },
  { k: "tea", label: "Black tea", mg: 47 },
];

export function CaffeineCoachTool() {
  const A = accentOf(5);
  const [log, setLog] = useLocalStorage<CaffeineLog>("caffeine-day", { d: "", items: [] });
  const [bedtime, setBedtime] = useState("23:00");
  const [customName, setCustomName] = useState("Chai");
  const [customMg, setCustomMg] = useState("60");

  const items = Array.isArray(log.items) ? log.items : [];
  useEffect(() => {
    const t = todayStr();
    if (log.d !== t) setLog({ d: t, items: [] });
  }, [log.d, setLog]);

  const total = items.reduce((s, i) => s + i.mg, 0);
  const LIMIT = 400; // FDA safe daily max for healthy adults
  const HALF_LIFE = 5.5; // hours, population average

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const fmtMin = (mRaw: number) => {
    const m = ((mRaw % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };
  const bedMin = toMin(bedtime);
  const lastSafe = fmtMin(bedMin - HALF_LIFE * 60);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const dtBed = ((bedMin - nowMin) % 1440 + 1440) % 1440 || 1440;
  const cupNowAtBed = Math.round(95 * Math.pow(0.5, dtBed / 60 / HALF_LIFE));

  const add = (name: string, mg: number) =>
    setLog({ d: log.d || todayStr(), items: [...items, { id: uid(), name, mg }] });

  const DECAY = [0, 2, 4, 6, 8, 10, 12];

  return (
    <div className="space-y-4">
      <Panel title="tap to log a drink" accent={A}>
        <div className="flex flex-wrap gap-2">
          {DRINKS.map((d) => (
            <Btn key={d.k} variant="ghost" accent={A} onClick={() => add(d.label, d.mg)}>
              {d.label} · {d.mg} mg
            </Btn>
          ))}
        </div>
        <Row className="mt-3">
          <Field label="Custom drink" value={customName} onChange={setCustomName} className="flex-1" />
          <Field label="Caffeine (mg)" value={customMg} onChange={setCustomMg} type="number" className="w-24" />
          <Btn accent={A} onClick={() => add(customName || "Custom", Math.max(0, num(customMg)))}>Add</Btn>
        </Row>
      </Panel>
      <Split
        left={
          <div className="space-y-3">
            <Grid cols={2}>
              <BigStat label="Today's total" value={fmt(total)} unit="mg" accent={total > LIMIT ? "#FF8A7A" : A} hint="FDA safe daily max: 400 mg" />
              <BigStat label="Last safe coffee" value={lastSafe} accent="#FFD43B" hint={`${HALF_LIFE} h half-life before ${bedtime} bedtime`} />
            </Grid>
            <Meter value={total} max={LIMIT} accent={total > LIMIT ? "#FF8A7A" : A} label="daily budget" right={`${fmt(Math.max(0, LIMIT - total))} mg left`} />
            <Panel title="today's log" accent={A} right={<Btn variant="ghost" accent="#FF8A7A" onClick={() => setLog({ d: log.d, items: [] })}>Clear day</Btn>}>
              {items.length === 0 ? (
                <p className="py-4 text-center font-mono text-xs text-zinc-600">nothing logged yet — tap a chip above</p>
              ) : (
                items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-2 border-b border-zinc-800/60 py-1.5">
                    <span className="min-w-0 truncate text-sm text-zinc-300">{i.name}</span>
                    <span className="font-mono text-xs" style={{ color: A }}>{i.mg} mg</span>
                    <button
                      type="button"
                      onClick={() => setLog({ d: log.d, items: items.filter((x) => x.id !== i.id) })}
                      className="font-mono text-xs text-zinc-600 hover:text-zinc-300"
                      aria-label={`remove ${i.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </Panel>
          </div>
        }
        right={
          <div className="space-y-3">
            <Panel title="half-life decay of one cup" accent={A}>
              <div className="flex h-20 items-end gap-2">
                {DECAY.map((h) => {
                  const pctH = 100 * Math.pow(0.5, h / HALF_LIFE);
                  return (
                    <div key={h} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <span className="font-mono text-[9px] text-zinc-500">{Math.round(pctH)}%</span>
                      <div className="w-full rounded-t" style={{ height: `${Math.max(2, pctH)}%`, background: `${A}${h <= 4 ? "b3" : h <= 8 ? "66" : "2e"}` }} />
                      <span className="font-mono text-[9px] text-zinc-600">+{h}h</span>
                    </div>
                  );
                })}
              </div>
              <KV k="a 95 mg cup drunk right now" v={`≈ ${cupNowAtBed} mg still in your blood at bedtime`} accent={cupNowAtBed > 50 ? "#FF7A3D" : A} />
            </Panel>
            <Panel title="bedtime" accent={A}>
              <Field label="I go to bed at" value={bedtime} onChange={setBedtime} type="time" />
              <Note>
                Caffeine's 5.5 h half-life means a 17:30 coffee is still half-acted-on at 23:00. Sleep pressure builds
                via adenosine; caffeine just blocks the receptor — the tiredness is still there, waiting.
              </Note>
            </Panel>
          </div>
        }
      />
    </div>
  );
}

/* --------------------------- 7. Quit smoking savings ----------------------- */

export function QuitSmokingTool() {
  const A = accentOf(6);
  const [cigs, setCigs] = useState("15");
  const [packPrice, setPackPrice] = useState("8.50");
  const [packSize, setPackSize] = useState("20");
  const [rate, setRate] = useState(7);

  const packs = num(cigs) / Math.max(1, num(packSize));
  const daily = packs * num(packPrice);
  const weekly = daily * 7;
  const yearly = daily * 365;
  const tenY = daily * 3650;

  const m = daily * 30.4375; // monthly contribution
  const i = rate / 100 / 12;
  const fvAt = (years: number) => (i > 0 ? m * ((Math.pow(1 + i, 12 * years) - 1) / i) : m * 12 * years);
  const invested10 = fvAt(10);
  const bars = Array.from({ length: 10 }, (_, t) => fvAt(t + 1));
  const maxBar = Math.max(...bars, 1);

  const BUYS: [string, number][] = [
    ["fancy coffee runs ($4.50)", 4.5],
    ["months of phone plan ($35)", 35],
    ["new video games ($60)", 60],
    ["weekend getaways ($350)", 350],
  ];

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Cigarettes per day" value={cigs} onChange={setCigs} type="number" className="flex-1" />
        <Field label="Price per pack" value={packPrice} onChange={setPackPrice} type="number" step={0.5} className="flex-1" />
        <Field label="Cigarettes per pack" value={packSize} onChange={setPackSize} type="number" className="flex-1" />
      </Row>
      <Slider label="If invested instead — yearly return" value={rate} onChange={setRate} min={0} max={12} step={0.5} accent={A} suffix="%" />
      <Grid cols={4}>
        <BigStat label="Per day" value={money(daily)} accent="#a1a1aa" hint={`${fmt(packs, 2)} packs`} />
        <BigStat label="Per week" value={money(weekly)} accent="#7FC8FF" />
        <BigStat label="Per year" value={money(yearly)} accent={A} />
        <BigStat label="10 years, uninvested" value={money(tenY)} accent="#FF8A7A" />
      </Grid>
      <Panel title="10-year compound growth of the same money" accent={A} right={<Tag accent={A}>{money(m)}/mo at {rate}%</Tag>}>
        <div className="flex h-24 items-end gap-1.5">
          {bars.map((v, idx) => (
            <div key={idx} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t" style={{ height: `${Math.max(2, (v / maxBar) * 100)}%`, background: idx === bars.length - 1 ? A : `${A}55` }} />
              <span className="font-mono text-[9px] text-zinc-600">Y{idx + 1}</span>
            </div>
          ))}
        </div>
        <KV k="invested at market" v={money(invested10)} accent="#5EE39A" />
        <KV k="stuffed in a mattress" v={money(tenY)} />
        <KV k="compounding bonus" v={money(invested10 - tenY)} accent={A} />
      </Panel>
      <Panel title="one year of not smoking buys" accent={A}>
        {BUYS.map(([label, unitCost]) => {
          const n = yearly / unitCost;
          const v = n >= 1 ? `≈ ${Math.floor(n)} per year` : `1 every ${Math.ceil(1 / Math.max(0.01, n))} years`;
          return <KV key={label} k={label} v={yearly > 0 ? v : "—"} accent={A} />;
        })}
      </Panel>
      <Note>
        Every pack price here is pre-tax money you already earned — quitting is a raise you give yourself with zero
        extra hours. Cravings peak at 3–5 minutes; the 10-year bar above is what outlasting each one is worth.
      </Note>
    </div>
  );
}

/* --------------------------- 8. Sugar cubes -------------------------------- */

const SUGAR_PRESETS: { label: string; g: number; note: string }[] = [
  { label: "Cola 330 ml", g: 35, note: "10.6 g / 100 ml" },
  { label: "Orange juice 250 ml", g: 24, note: "9.6 g / 100 ml — yes, juice too" },
  { label: "Chocolate bar 45 g", g: 25, note: "typical milk chocolate" },
  { label: "Flavored yogurt 150 g", g: 15, note: "the 'healthy' ones are worst" },
  { label: "Iced tea 500 ml", g: 27, note: "5.4 g / 100 ml" },
  { label: "3-in-1 coffee sachet", g: 11, note: "mostly sugar, some creamer" },
  { label: "Cereal bowl 45 g", g: 14, note: "before the milk's lactose" },
  { label: "Ketchup tbsp (17 g)", g: 4, note: "one cube per squirt" },
];

export function SugarCubesTool() {
  const A = accentOf(7);
  const [grams, setGrams] = useState("35");
  const [active, setActive] = useState("Cola 330 ml");
  const CUBE = 4; // grams per cube
  const WHO = 25; // g/day free-sugar limit

  const g = num(grams);
  const cubes = g / CUBE;
  const full = Math.floor(cubes);
  const frac = cubes - full;
  const shown = Math.min(full, 120);
  const kcal = g * 3.9;
  const over = g > WHO;
  const pctOfDay = (g / WHO) * 100;

  return (
    <div className="space-y-4">
      <Panel title="pick a source" accent={A}>
        <div className="flex flex-wrap gap-2">
          {SUGAR_PRESETS.map((p) => (
            <Btn
              key={p.label}
              variant={active === p.label ? "solid" : "ghost"}
              accent={A}
              onClick={() => {
                setActive(p.label);
                setGrams(String(p.g));
              }}
            >
              {p.label}
            </Btn>
          ))}
        </div>
      </Panel>
      <Split
        left={
          <div className="space-y-3">
            <Field label="Sugar grams" value={grams} onChange={(v) => { setGrams(v); setActive("custom"); }} type="number" hint={active !== "custom" ? SUGAR_PRESETS.find((p) => p.label === active)?.note : "type anything — a label, a recipe, a binge"} />
            <Grid cols={3}>
              <BigStat label="Cubes" value={fmt(cubes, 1)} accent={A} hint={`${CUBE} g each`} />
              <BigStat label="Teaspoons" value={fmt(g / 4, 1)} accent="#7FC8FF" hint="1 tsp ≈ 4 g" />
              <BigStat label="Calories" value={fmt(kcal, 0)} unit="kcal" accent="#FFD43B" hint="pure sugar ≈ 3.9 kcal/g" />
            </Grid>
            <Meter
              value={Math.min(pctOfDay, 100)}
              accent={over ? "#FF8A7A" : "#5EE39A"}
              label="WHO free-sugar limit (25 g/day)"
              right={over ? `${fmt(pctOfDay, 0)}% of the limit` : `${fmt(WHO - g)} g left today`}
            />
            {over ? <p className="font-mono text-[11px] text-[#FF8A7A]">this one item is {fmt(pctOfDay, 0)}% of the entire WHO daily limit</p> : null}
          </div>
        }
        right={
          <Panel title={`${fmt(cubes, 1)} cubes of sugar`} accent={A} right={<Tag accent={over ? "#FF8A7A" : A}>{over ? "over WHO limit" : "within WHO limit"}</Tag>}>
            {g <= 0 ? (
              <p className="py-10 text-center font-mono text-xs text-zinc-600">enter grams to see the pile</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: shown }).map((_, i) => (
                  <div key={i} className="h-3.5 w-3.5 rounded-sm" style={{ background: i % 2 === 0 ? A : `${A}b3` }} />
                ))}
                {full > 120 ? <span className="self-center font-mono text-[10px] text-zinc-500">+{full - 120} more…</span> : null}
                {frac > 0 && full <= 120 ? (
                  <div className="relative h-3.5 w-3.5 overflow-hidden rounded-sm bg-zinc-800">
                    <div className="absolute inset-y-0 left-0" style={{ width: `${frac * 100}%`, background: `${A}66` }} />
                  </div>
                ) : null}
              </div>
            )}
            <Note>
              WHO advises under 25 g of free sugars a day (about 6 cubes) for real health benefits — a single can of
              cola blows through it. The cubes above are 4 g each: what you would pop into tea, stacked.
            </Note>
          </Panel>
        }
      />
    </div>
  );
}

/* --------------------------- 9. Commute cost ------------------------------- */

export function CommuteCostTool() {
  const A = accentOf(8);
  const [dist, setDist] = useState("12");
  const [days, setDays] = useState("22");
  const [l100, setL100] = useState("7.5");
  const [price, setPrice] = useState("1.75");
  const [parking, setParking] = useState("2");
  const [maint, setMaint] = useState(0.07);
  const [ticket, setTicket] = useState("4");

  const kmMonth = 2 * num(dist) * num(days);
  const fuel = (kmMonth / 100) * num(l100) * num(price);
  const wear = kmMonth * maint;
  const parkingM = num(parking) * num(days);
  const car = fuel + wear + parkingM;
  const transit = num(ticket) * num(days);
  const carY = car * 12;
  const transitY = transit * 12;
  const saveM = Math.abs(car - transit);
  const winner = transit < car ? "transit" : "car";
  const breakEven = num(days) > 0 ? car / num(days) : 0;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Distance one-way (km)" value={dist} onChange={setDist} type="number" step={0.5} className="flex-1" />
        <Field label="Commute days / month" value={days} onChange={setDays} type="number" className="flex-1" />
        <Field label="Fuel price / liter" value={price} onChange={setPrice} type="number" step={0.05} className="flex-1" />
      </Row>
      <Row>
        <Field label="Consumption (L/100 km)" value={l100} onChange={setL100} type="number" step={0.1} className="flex-1" />
        <Field label="Parking / day" value={parking} onChange={setParking} type="number" step={0.5} className="flex-1" />
        <Field label="Transit ticket / day" value={ticket} onChange={setTicket} type="number" step={0.5} className="flex-1" />
      </Row>
      <div className="min-w-0">
        <Slider label="Maintenance & tires (per km)" value={maint} onChange={setMaint} min={0.05} max={0.1} step={0.01} accent={A} suffix=" /km" />
        <span className="mt-1 block font-mono text-[10px] text-zinc-600">oil, brakes, tires, depreciation — 0.05 cheap hatchback → 0.10 SUV</span>
      </div>
      <Grid cols={2}>
        <BigStat label="Car / month" value={money(car)} accent="#FF8A7A" hint={`${fmt(kmMonth)} km · fuel ${money(fuel)} + wear ${money(wear)} + parking ${money(parkingM)}`} />
        <BigStat label="Transit / month" value={money(transit)} accent="#5EE39A" hint={`${num(ticket) > 0 ? money(num(ticket)) + " × " + num(days) + " days" : "free"}`} />
      </Grid>
      <Panel title="same scale, both options" accent={A}>
        <div className="space-y-3">
          <Meter value={car} max={Math.max(car, transit, 1)} accent="#FF8A7A" label="car" right={`${money(carY)} / year`} />
          <Meter value={transit} max={Math.max(car, transit, 1)} accent="#5EE39A" label="transit" right={`${money(transitY)} / year`} />
        </div>
      </Panel>
      <Grid cols={3}>
        <BigStat label="Verdict" value={winner === "transit" ? "Transit" : "Car"} accent={A} hint={`saves ${money(saveM)} / month`} />
        <BigStat label="Yearly savings" value={money(saveM * 12)} accent={A} hint="≈ a decent vacation fund" />
        <BigStat label="Break-even ticket" value={money(breakEven)} accent="#FFD43B" hint="transit above this price loses to the car" />
      </Grid>
      <Panel title="per unit costs" accent={A}>
        <KV k="car per km driven" v={money(kmMonth > 0 ? car / kmMonth : 0)} accent={A} />
        <KV k="car per commute day" v={money(num(days) > 0 ? car / num(days) : 0)} />
        <KV k="fuel share of car cost" v={car > 0 ? pct((fuel / car) * 100, 0) : "—"} />
        <KV k="monthly distance" v={`${fmt(kmMonth)} km (${fmt(2 * num(dist))} km round trip × ${num(days)} days)`} />
      </Panel>
      <Note>
        Car figure excludes the vehicle purchase itself — it is only what driving costs per month once you own it.
        Transit's real edge is often time: read or nap instead of gripping a wheel. If the difference is small, price
        in the parking spot at home that the car is hogging.
      </Note>
    </div>
  );
}

/* --------------------------- 10. Sleep debt -------------------------------- */

const NIGHT_DEFAULT = [7, 6.5, 8, 5.5, 7, 9, 6];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SleepDebtTool() {
  const A = accentOf(9);
  const [nights, setNights] = useLocalStorage<number[]>("sleep-debt-nights", NIGHT_DEFAULT);

  const week = DAYS.map((_, i) => {
    const raw = Array.isArray(nights) ? Number(nights[i]) : NaN;
    return Number.isFinite(raw) ? raw : NIGHT_DEFAULT[i];
  });
  const total = week.reduce((s, h) => s + h, 0);
  const TARGET = 8;
  const weekTarget = TARGET * 7;
  const debt = weekTarget - total; // positive = owed sleep
  const avg = total / 7;

  const severity =
    debt <= 0 ? { c: "#5EE39A", label: "banked" } :
    debt <= 3.5 ? { c: "#FFD43B", label: "mild debt" } :
    debt <= 7 ? { c: "#FF7A3D", label: "moderate debt" } :
    { c: "#FF8A7A", label: "severe debt" };

  const repay9 = Math.ceil(Math.max(0, debt) / 1); // 9 h = 1 h extra per night
  const repay10 = Math.ceil(Math.max(0, debt) / 2); // 10 h = 2 h extra per night

  const setNight = (i: number, v: string) => {
    const next = [...week];
    next[i] = Math.min(14, Math.max(0, num(v)));
    setNights(next);
  };

  return (
    <div className="space-y-4">
      <Row>
        <BigStat label="This week" value={fmt(total, 1)} unit="h" accent={A} hint="logged across 7 nights" />
        <BigStat label="Weekly debt" value={debt > 0 ? `+${fmt(debt, 1)}` : fmt(debt, 1)} unit="h" accent={severity.c} hint={severity.label + " · target 56 h (8 × 7)"} />
        <BigStat label="Average night" value={fmt(avg, 1)} unit="h" accent="#7FC8FF" hint={avg >= 8 ? "at target" : `${fmt(TARGET - avg, 1)} h short`} />
      </Row>
      <Panel title="log your 7 nights" accent={A} right={<Btn variant="ghost" accent="#FF8A7A" onClick={() => setNights(NIGHT_DEFAULT)}>Reset week</Btn>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {DAYS.map((d, i) => (
            <Field key={d} label={d} value={String(week[i])} onChange={(v) => setNight(i, v)} type="number" step={0.5} />
          ))}
        </div>
      </Panel>
      <Panel title="each night vs the 8 h target" accent={A}>
        <div className="space-y-2.5">
          {DAYS.map((d, i) => (
            <Meter
              key={d}
              value={week[i]}
              max={12}
              accent={week[i] >= TARGET ? "#5EE39A" : week[i] >= 6.5 ? "#FFD43B" : "#FF8A7A"}
              label={d}
              right={`${fmt(week[i], 1)} h ${week[i] >= TARGET ? "✓" : `−${fmt(TARGET - week[i], 1)}`}`}
            />
          ))}
        </div>
      </Panel>
      <Panel title="recovery plan" accent={severity.c}>
        {debt <= 0 ? (
          <p className="font-mono text-xs text-zinc-400">
            No debt — you banked {fmt(-debt, 1)} h. Keep the rhythm; sleep surpluses don't carry over forever.
          </p>
        ) : (
          <div>
            <KV k="gentle repair" v={`${repay9} night${repay9 === 1 ? "" : "s"} at 9 h (+1 h/night)`} accent={A} />
            <KV k="weekend assault" v={`${repay10} night${repay10 === 1 ? "" : "s"} at 10 h (+2 h/night)`} />
            <KV k="realistic pace" v={`${fmt(Math.ceil(debt / 1) / 7, 1)} weeks of 9 h nights to clear it fully`} />
          </div>
        )}
        <Note>
          Debt from short nights is repaid slowly — one extra hour per night, not one 14-hour weekend binge (which only
          wrecks your circadian rhythm further). Consistency beats heroics.
        </Note>
      </Panel>
    </div>
  );
}

/* --------------------------- 11. Ergonomic desk setup ---------------------- */

export function DeskSetupTool() {
  const A = accentOf(10);
  const [height, setHeight] = useState("175");

  const h = Math.min(220, Math.max(120, num(height)));
  const seat = Math.round(h * 0.25 * 2) / 2; // popliteal ≈ 25% of stature
  const desk = Math.round(h * 0.395 * 2) / 2; // seated elbow height
  const eye = Math.round((seat + h * 0.36) * 2) / 2; // seated eye height from floor
  const dist = Math.round(h * 0.4); // monitor distance ≈ arm's length
  const SCREEN_H = 34; // 27" 16:9 screen vertical ≈ 34 cm
  const monBottom = eye - SCREEN_H;
  const s = 2; // px per cm in the diagram

  const y = (cm: number) => 320 - cm * s;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Your height (cm)" value={height} onChange={setHeight} type="number" className="flex-1" />
        <Tag accent={A}>side view · 1 px = 0.5 cm</Tag>
      </Row>
      <Grid cols={4}>
        <BigStat label="Chair seat" value={fmt(seat, 1)} unit="cm" accent={A} hint="≈ height ÷ 4" />
        <BigStat label="Desk surface" value={fmt(desk, 1)} unit="cm" accent="#FFD43B" hint="elbow-level typing" />
        <BigStat label="Monitor top" value={fmt(eye, 1)} unit="cm" accent="#7FC8FF" hint="top edge at eye level" />
        <BigStat label="Screen distance" value={fmt(dist)} unit="cm" accent="#5EE39A" hint="≈ arm's length" />
      </Grid>
      <Panel title="your profile" accent={A}>
        <div className="relative mx-auto w-full overflow-hidden rounded border border-zinc-800 bg-zinc-950/70" style={{ height: 340 }}>
          {/* eye-level dashed line */}
          <div className="absolute left-0 right-0 border-t border-dashed" style={{ bottom: y(eye), borderColor: `${A}55` }}>
            <span className="absolute right-2 -top-4 font-mono text-[9px]" style={{ color: A }}>eye level {fmt(eye)} cm</span>
          </div>
          {/* floor */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-700" />
          {/* chair */}
          <div className="absolute rounded-sm bg-zinc-500" style={{ left: "6%", bottom: y(seat), width: 84, height: 6 }} />
          <div className="absolute rounded-sm bg-zinc-600" style={{ left: "6%", bottom: y(seat + 48), width: 6, height: 48 * s }} />
          <div className="absolute bg-zinc-700" style={{ left: "7%", bottom: 0, width: 4, height: y(0) - y(seat) }} />
          <div className="absolute bg-zinc-700" style={{ left: "13%", bottom: 0, width: 4, height: y(0) - y(seat) }} />
          {/* seated person */}
          <div className="absolute rounded-full bg-zinc-400" style={{ left: "14%", bottom: y(eye) + 6, width: 26, height: 26 }} />
          <div className="absolute rounded-sm bg-zinc-500" style={{ left: "14%", bottom: y(seat), width: 12, height: (eye - seat) * s }} />
          <div className="absolute rounded-sm bg-zinc-500" style={{ left: "15%", bottom: y(seat) - 4, width: 78, height: 9 }} />
          <div className="absolute rounded-sm bg-zinc-500" style={{ left: "calc(15% + 70px)", bottom: 0, width: 9, height: y(0) - y(seat) - 2 }} />
          {/* desk */}
          <div className="absolute rounded-sm bg-zinc-600" style={{ left: "42%", bottom: y(desk), width: 150, height: 6 }} />
          <div className="absolute bg-zinc-700" style={{ left: "43%", bottom: 0, width: 5, height: y(0) - y(desk) }} />
          <div className="absolute bg-zinc-700" style={{ left: "calc(42% + 143px)", bottom: 0, width: 5, height: y(0) - y(desk) }} />
          {/* keyboard on desk */}
          <div className="absolute rounded-sm bg-zinc-500" style={{ left: "44%", bottom: y(desk) + 6, width: 52, height: 4 }} />
          {/* monitor: top edge exactly at eye level */}
          <div className="absolute bg-zinc-700" style={{ left: "56%", bottom: y(desk) + 6, width: 8, height: Math.max(4, y(desk) - y(monBottom) - 6) }} />
          <div
            className="absolute rounded-sm border"
            style={{
              left: "56%",
              transform: "translateX(-46%)",
              bottom: y(monBottom),
              width: 60 * s * 0.85,
              height: SCREEN_H * s,
              background: `linear-gradient(160deg, #18181b, ${A}22)`,
              borderColor: `${A}88`,
            }}
          />
          {/* labels */}
          <span className="absolute font-mono text-[9px] text-zinc-500" style={{ left: "6%", bottom: y(seat) + 10 }}>seat {fmt(seat)}</span>
          <span className="absolute font-mono text-[9px] text-zinc-500" style={{ left: "42%", bottom: y(desk) + 12 }}>desk {fmt(desk)}</span>
          <span className="absolute font-mono text-[9px]" style={{ left: "48%", bottom: y(monBottom) + 2, color: A }}>top = eye</span>
        </div>
      </Panel>
      <Panel title="set it up like this" accent={A}>
        <KV k="chair height" v={`${fmt(seat, 1)} cm — feet flat, knees ≈ 90–100°`} accent={A} />
        <KV k="desk height" v={`${fmt(desk, 1)} cm — forearms parallel to floor, elbows 90–110°`} accent="#FFD43B" />
        <KV k="monitor" v={`top edge at ${fmt(eye, 1)} cm (eye level), ${dist}–${dist + 20} cm away`} accent="#7FC8FF" />
        <KV k="monitor center" v={`${fmt(eye - SCREEN_H / 2, 1)} cm — 15–20° below horizontal gaze`} />
        <KV k="keyboard" v="at desk edge, wrists floating — never bent up or down" />
        <KV k="lumbar" v="cushion at belt line; shoulders relaxed, not shrugged" />
      </Panel>
      <Note>
        Ratios from seated anthropometry (seat ≈ ¼ stature, seated eye ≈ seat + 0.36 × stature). Fixed desks too high?
        Raise the chair and add a footrest — raising the screen is free, raising the desk is not.
      </Note>
    </div>
  );
}

/* --------------------------- 12. TV size & mount --------------------------- */

export function TvSizeTool() {
  const A = accentOf(11);
  const [dist, setDist] = useState("3");
  const [res, setRes] = useState<"hd" | "4k">("4k");
  const [eye, setEye] = useState("105");
  const [size, setSize] = useState(65);

  const d = Math.max(0.5, num(dist));
  // SMPTE 30° minimum immersion / THX 40° cinematic max — HD pulls the window down (pixels show)
  const angles = res === "4k" ? { lo: 30, hi: 40 } : { lo: 22, hi: 30 };
  const toIn = (deg: number) => (2 * d * Math.tan((deg / 2) * (Math.PI / 180))) / 0.0254;
  const minIn = toIn(angles.lo);
  const maxIn = toIn(angles.hi);
  const eyeCm = num(eye);
  const wCm = size * 2.54 * 0.872;
  const hCm = size * 2.54 * 0.49;
  const center = eyeCm;
  const bottom = center - hCm / 2;
  const top = center + hCm / 2;
  const inRange = size >= minIn && size <= maxIn;
  const tilt = top > eyeCm + 25 ? (Math.atan((center - eyeCm) / (d * 100)) * 180) / Math.PI : 0;

  const SCALE = Math.min(1.7, 240 / Math.max(1, wCm), 270 / Math.max(1, top + 12));
  const yCm = (cm: number) => 26 + cm * SCALE;
  const STANDARD = [32, 43, 50, 55, 65, 75, 85];

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Viewing distance (m)" value={dist} onChange={setDist} type="number" step={0.1} className="flex-1" />
        <Seg value={res} onChange={setRes} accent={A} options={[{ v: "hd" as const, label: "1080p HD" }, { v: "4k" as const, label: "4K" }]} />
        <Field label="Seated eye level (cm)" value={eye} onChange={setEye} type="number" className="flex-1" hint="sofa eye height, typically 100–115" />
      </Row>
      <Grid cols={3}>
        <BigStat label="Recommended size" value={`${fmt(minIn, 0)}–${fmt(maxIn, 0)}″`} accent={A} hint={`${angles.lo}°–${angles.hi}° viewing angle at ${fmt(d, 1)} m`} />
        <BigStat label="Sweet spot" value={`${fmt((minIn + maxIn) / 2, 0)}″`} accent="#FFD43B" hint="middle of the window" />
        <BigStat
          label={`${size}″ screen center`}
          value={fmt(center, 0)}
          unit="cm"
          accent="#7FC8FF"
          hint={`bottom ${fmt(bottom, 0)} · top ${fmt(top, 0)} cm`}
        />
      </Grid>
      <Panel title="pick a size" accent={A} right={inRange ? <Tag accent="#5EE39A">fits your window</Tag> : <Tag accent="#FF8A7A">{size < minIn ? "smaller than recommended" : "bigger than recommended"}</Tag>}>
        <div className="flex flex-wrap gap-2">
          {STANDARD.map((sIn) => (
            <Btn key={sIn} variant={size === sIn ? "solid" : "ghost"} accent={sIn >= minIn && sIn <= maxIn ? A : "#52525b"} onClick={() => setSize(sIn)}>
              {sIn}″
            </Btn>
          ))}
        </div>
      </Panel>
      <Panel title="wall profile, drawn to scale" accent={A} right={<Tag accent={A}>{size}″ · {fmt(wCm, 0)} × {fmt(hCm, 0)} cm</Tag>}>
        <div className="relative mx-auto w-full overflow-hidden rounded border border-zinc-800 bg-zinc-950/70" style={{ height: 320 }}>
          {/* eye line */}
          <div className="absolute left-0 right-0 border-t border-dashed" style={{ bottom: yCm(eyeCm), borderColor: `${A}55` }}>
            <span className="absolute right-2 -top-4 font-mono text-[9px]" style={{ color: A }}>eye {fmt(eyeCm, 0)} cm</span>
          </div>
          {/* floor */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-700" />
          {/* TV */}
          <div
            className="absolute rounded-sm border"
            style={{
              left: "34%",
              transform: "translateX(-50%)",
              bottom: yCm(Math.max(0, bottom)),
              width: Math.min(240, wCm * SCALE),
              height: hCm * SCALE,
              background: `linear-gradient(155deg, #101014, ${A}1f)`,
              borderColor: `${A}88`,
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold" style={{ color: `${A}cc` }}>
              {size}″
            </span>
          </div>
          {/* labels on the TV column */}
          <span className="absolute font-mono text-[9px] text-zinc-500" style={{ left: "2%", bottom: yCm(Math.max(0, top)) }}>top {fmt(top, 0)}</span>
          <span className="absolute font-mono text-[9px]" style={{ left: "2%", bottom: yCm(center) - 2, color: A }}>center {fmt(center, 0)}</span>
          <span className="absolute font-mono text-[9px] text-zinc-500" style={{ left: "2%", bottom: yCm(Math.max(0, bottom)) }}>bottom {fmt(bottom, 0)}</span>
          {/* sofa + viewer */}
          <div className="absolute rounded-sm bg-zinc-600" style={{ right: "4%", bottom: yCm(0), width: 100, height: Math.max(4, 42 * SCALE) }} />
          <div className="absolute rounded-sm bg-zinc-700" style={{ right: "4%", bottom: yCm(42), width: 12, height: 52 * SCALE }} />
          <div className="absolute rounded-full bg-zinc-400" style={{ right: "calc(4% + 28px)", bottom: yCm(eyeCm), width: 22, height: 22 }} />
          {tilt > 0 ? (
            <span className="absolute font-mono text-[9px] text-[#FF7A3D]" style={{ right: "6%", bottom: yCm(eyeCm) + 26 }}>
              mount {fmt(tilt, 0)}° above eye — tilt TV down
            </span>
          ) : null}
        </div>
      </Panel>
      <Note>
        Sizes inside the angle window fill your field of view without pixels showing (4K tolerates closer, larger
        screens; 1080p does not). Mount the screen center at seated eye level — sofas sit lower than you think, and a
        TV hung over the fireplace forces a permanent chin-up. Bottom edge below 60 cm and above-eye tops both strain
        the neck.
      </Note>
    </div>
  );
}

/* ============================== REGISTRY =================================== */

export const lifePlusMeta: ToolMeta[] = [
  {
    id: "flooring",
    name: "Flooring & Tile Calculator",
    description: "Tiles, boxes and cost for a room — with a proportional tile plan and waste allowance.",
    category: "life",
    icon: Grid3x3,
    keywords: "tile floor flooring room calculator boxes waste ceramic",
    badge: "new",
    component: FlooringTool,
  },
  {
    id: "wallpaper-calc",
    name: "Wallpaper Calculator",
    description: "Strips per roll, rolls needed, and the pattern-repeat penalty visualized.",
    category: "life",
    icon: Layers,
    keywords: "wallpaper roll pattern repeat strips room decorating",
    badge: "new",
    component: WallpaperCalcTool,
  },
  {
    id: "gravel-calc",
    name: "Gravel & Mulch Volume",
    description: "Depth × area → m³, tonnes, 25 kg bags and bulk-vs-bagged cost for landscaping.",
    category: "life",
    icon: Mountain,
    keywords: "gravel mulch sand volume tonnes bags garden landscaping soil",
    badge: "new",
    component: GravelCalcTool,
  },
  {
    id: "aquarium-calc",
    name: "Aquarium Volume & Stocking",
    description: "Tank liters, gallons, real full weight, fish budget, heater and filter sizing.",
    category: "life",
    icon: Fish,
    keywords: "aquarium fish tank liters gallons weight stocking heater filter",
    badge: "new",
    component: AquariumTool,
  },
  {
    id: "bac-estimator",
    name: "BAC Estimator",
    description: "Widmark-formula blood alcohol estimate with color zones and time-to-zero. Educational only.",
    category: "life",
    icon: Wine,
    keywords: "bac blood alcohol drinks widmark sober sobering educational",
    badge: "new",
    component: BacTool,
  },
  {
    id: "caffeine-coach",
    name: "Caffeine Coach",
    description: "Log drinks against the 400 mg daily cap and see your last safe coffee before bed.",
    category: "life",
    icon: Coffee,
    keywords: "caffeine coffee mg limit sleep half-life espresso energy drink",
    badge: "new",
    component: CaffeineCoachTool,
  },
  {
    id: "quit-smoking",
    name: "Quit Smoking Savings",
    description: "What cigarettes cost per day, year and decade — plus the compound-interest version of quitting.",
    category: "life",
    icon: CigaretteOff,
    keywords: "smoking quit cigarettes savings money packs compound health",
    badge: "new",
    component: QuitSmokingTool,
  },
  {
    id: "sugar-cubes",
    name: "Sugar Cube Counter",
    description: "Turn any drink or snack into a pile of 4 g sugar cubes against the WHO daily limit.",
    category: "life",
    icon: Candy,
    keywords: "sugar cubes cola juice who limit teaspoons health snack",
    badge: "new",
    component: SugarCubesTool,
  },
  {
    id: "commute-cost",
    name: "Commute Cost Calculator",
    description: "Car (fuel, wear, parking) vs transit ticket — monthly, yearly, with a break-even fare.",
    category: "life",
    icon: CarFront,
    keywords: "commute car transit fuel parking monthly cost drive bus",
    badge: "new",
    component: CommuteCostTool,
  },
  {
    id: "sleep-debt",
    name: "Sleep Debt Tracker",
    description: "Log 7 nights, see the debt against 8 h targets, and get a paced recovery plan.",
    category: "health",
    icon: MoonStar,
    keywords: "sleep debt hours tracker recovery nights rest fatigue",
    badge: "new",
    component: SleepDebtTool,
  },
  {
    id: "desk-setup",
    name: "Ergonomic Desk Setup",
    description: "Chair, desk and monitor heights computed from your height — drawn as a scaled side view.",
    category: "health",
    icon: Armchair,
    keywords: "ergonomics desk chair monitor height posture office setup",
    badge: "new",
    component: DeskSetupTool,
  },
  {
    id: "tv-size",
    name: "TV Size & Mount Planner",
    description: "Viewing distance + resolution → size window, and a to-scale wall profile for mounting.",
    category: "health",
    icon: Tv,
    keywords: "tv size mount height viewing distance 4k screen thx",
    badge: "new",
    component: TvSizeTool,
  },
];
