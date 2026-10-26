"use client";

/* ==========================================================================
   KIT: LIFE & HOME — 21 everyday-life machines. Kitchen, house, road, pets.
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  Area,
  BigStat,
  Btn,
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
} from "./kit";
import { useLocalStorage } from "./hooks";

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------ 1. Recipe scaler --------------------------- */

export function RecipeScalerTool() {
  const A = accentOf(0);
  const [recipe, setRecipe] = useState("250 g flour\n2 eggs\n300 ml milk\n1 tsp salt\n0.5 cup sugar");
  const [serves, setServes] = useState(4);
  const [want, setWant] = useState(6);
  const factor = want / Math.max(1, serves);
  const out = useMemo(
    () =>
      recipe
        .split("\n")
        .map((line) =>
          line.replace(/(\d+\.?\d*)/, (m) => {
            const scaled = parseFloat(m) * factor;
            return scaled >= 10 ? String(Math.round(scaled)) : String(Math.round(scaled * 100) / 100);
          })
        )
        .join("\n"),
    [recipe, factor]
  );
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Recipe serves" value={serves} onChange={setServes} min={1} max={24} accent="#7FC8FF" />
        <Slider label="You need it for" value={want} onChange={setWant} min={1} max={60} accent={A} />
        <Tag accent={A}>×{fmt(factor)}</Tag>
      </Row>
      <Split left={<Area label="Original recipe (one line per item)" value={recipe} onChange={setRecipe} rows={9} />} right={<Out label="scaled recipe" text={out} />} />
      <Note>The first number on each line gets scaled. Units ride along untouched — 250 g flour at ×1.5 becomes 375 g flour.</Note>
    </div>
  );
}

/* ------------------------------ 2. Cooking converter ----------------------- */

const CUPS_ML = 240;
const TBSB_ML = 15;
const TSP_ML = 5;

export function CookingConverterTool() {
  const A = accentOf(1);
  const [amount, setAmount] = useState("2");
  const [unit, setUnit] = useState<"cup" | "tbsp" | "tsp" | "ml" | "floz">("cup");
  const ml = { cup: CUPS_ML, tbsp: TBSB_ML, tsp: TSP_ML, ml: 1, floz: 29.57 }[unit] * num(amount);
  const grams = (name: string, d: number) => Math.round(ml * d * 10) / 10;
  const rows: [string, string][] = [
    ["milliliters", `${fmt(ml)} ml`],
    ["cups", `${fmt(ml / CUPS_ML)} cups`],
    ["tablespoons", `${fmt(ml / TBSB_ML)} tbsp`],
    ["teaspoons", `${fmt(ml / TSP_ML)} tsp`],
    ["fluid ounces", `${fmt(ml / 29.57)} fl oz`],
  ];
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Amount" value={amount} onChange={setAmount} type="number" className="flex-1" />
        <Seg value={unit} onChange={setUnit} accent={A} options={[{ v: "cup" as const, label: "cup" }, { v: "tbsp" as const, label: "tbsp" }, { v: "tsp" as const, label: "tsp" }, { v: "ml" as const, label: "ml" }, { v: "floz" as const, label: "fl oz" }]} />
      </Row>
      <Grid cols={3}>
        {rows.map(([k, v]) => (
          <BigStat key={k} label={k} value={v} accent={k === "milliliters" ? A : "#52525b"} />
        ))}
      </Grid>
      <Panel title="weight, if you have a scale (you should)" accent={A}>
        <KV k="water / milk" v={`${grams("water", 1)} g`} accent={A} />
        <KV k="flour" v={`${grams("flour", 0.53)} g`} />
        <KV k="sugar (granulated)" v={`${grams("sugar", 0.85)} g`} />
        <KV k="butter" v={`${grams("butter", 0.96)} g`} />
        <KV k="honey / syrup" v={`${grams("honey", 1.42)} g`} />
      </Panel>
    </div>
  );
}

/* ------------------------------ 3. Coffee ratio ---------------------------- */

export function CoffeeRatioTool() {
  const A = accentOf(2);
  const [water, setWater] = useState("500");
  const [ratio, setRatio] = useState(16);
  const [cups, setCups] = useState("2");
  const coffee = num(water) / ratio;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Water (ml)" value={water} onChange={setWater} type="number" className="flex-1" />
        <Field label="Cups you want" value={cups} onChange={setCups} type="number" className="flex-1" />
      </Row>
      <Slider label="Ratio (1 : X)" value={ratio} onChange={setRatio} min={10} max={20} accent={A} />
      <div className="flex items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">grind this much</p>
          <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{fmt(coffee)}<span className="text-xl text-zinc-500">g</span></p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">per cup</p>
          <p className="mt-1 font-brut text-3xl text-zinc-200">{fmt(coffee / Math.max(1, num(cups)))} g</p>
        </div>
      </div>
      <Grid cols={3}>
        <BigStat label="Strong / espresso-ish" value={`${fmt(num(water) / 12)} g`} accent="#FF8A7A" hint="1:12" />
        <BigStat label="Balanced pour-over" value={`${fmt(num(water) / 16)} g`} accent={A} hint="1:16" />
        <BigStat label="Light & tea-like" value={`${fmt(num(water) / 18)} g`} accent="#7FC8FF" hint="1:18" />
      </Grid>
      <Note>Weighing beats scooping. Grind size matters more than price of beans: coarse for French press, fine for espresso.</Note>
    </div>
  );
}

/* ------------------------------ 4. Pasta portions -------------------------- */

export function PastaPortionTool() {
  const A = accentOf(3);
  const [people, setPeople] = useState(4);
  const [type, setType] = useState<"dry" | "fresh" | "kids">("dry");
  const per = { dry: 100, fresh: 130, kids: 60 }[type];
  const total = people * per;
  const bunch = type === "dry" ? total / 125 : 0;
  return (
    <div className="space-y-4">
      <Seg value={type} onChange={setType} accent={A} options={[{ v: "dry" as const, label: "Dry pasta" }, { v: "fresh" as const, label: "Fresh pasta" }, { v: "kids" as const, label: "Kids" }]} />
      <Slider label="Hungry mouths" value={people} onChange={setPeople} min={1} max={12} accent={A} />
      <div className="flex items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">weigh out</p>
          <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{total}<span className="text-xl text-zinc-500">g</span></p>
        </div>
        {bunch > 0 ? (
          <div className="text-center">
            <p className="mono-kicker text-zinc-500">no scale? that is</p>
            <p className="mt-1 font-brut text-3xl text-zinc-200">{fmt(bunch)} bundles</p>
            <p className="mt-1 text-[10px] text-zinc-600">(dried bunch ≈ 125 g, ~2.2 cm across)</p>
          </div>
        ) : null}
      </div>
      <Note>Italian nonna rule: dry 100 g per adult main, fresh 130 g (it weighs more wet), kids 60 g. Salt the water like the sea.</Note>
    </div>
  );
}

/* ------------------------------ 5. Grocery estimator ----------------------- */

export function GroceryEstimatorTool() {
  const A = accentOf(4);
  const [people, setPeople] = useState(3);
  const [meals, setMeals] = useState(21);
  const [style, setStyle] = useState<"budget" | "standard" | "organic">("standard");
  const perMeal = { budget: 2.5, standard: 5, organic: 8.5 }[style];
  const total = people * meals * perMeal;
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="People" value={people} onChange={setPeople} min={1} max={10} accent={A} />
        <Slider label="Meals to cover / week" value={meals} onChange={setMeals} min={1} max={35} accent={A} />
      </Row>
      <Seg value={style} onChange={setStyle} accent={A} options={[{ v: "budget" as const, label: "Budget" }, { v: "standard" as const, label: "Standard" }, { v: "organic" as const, label: "Organic-ish" }]} />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">weekly grocery budget</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>${fmt(total)}</p>
        <p className="mt-1 font-mono text-xs text-zinc-500">≈ ${fmt(total * 4.3)} monthly · ${fmt((total / people / Math.max(1, meals)) * 100)}/100 per person-meal</p>
      </div>
      <Grid cols={3}>
        <BigStat label="Per person / week" value={`$${fmt(total / people)}`} accent="#7FC8FF" />
        <BigStat label="Per meal (all)" value={`$${fmt(total / Math.max(1, meals))}`} accent="#5EE39A" />
        <BigStat label="Monthly estimate" value={`$${fmt(total * 4.3)}`} accent="#FF9DE2" />
      </Grid>
      <Note>Ballpark averages for home cooking — eating out triples it, meal-prep Sundays halve it.</Note>
    </div>
  );
}

/* ------------------------------ 6. Meal planner ---------------------------- */

type Meal = { id: number; day: string; dish: string };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MealPlannerTool() {
  const A = accentOf(5);
  const [meals, setMeals] = useLocalStorage<Meal[]>("kit-meals", []);
  const [draft, setDraft] = useState("");
  const [day, setDay] = useState(DAYS[0]);
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={day} onChange={setDay} accent={A} options={DAYS.map((d) => ({ v: d, label: d }))} />
        <Field label="Dish" value={draft} onChange={setDraft} placeholder="lentil soup" className="min-w-[180px] flex-1" />
        <Btn accent={A} onClick={() => { if (draft.trim()) { setMeals([...meals, { id: Date.now(), day, dish: draft.trim() }]); setDraft(""); } }}>Plan it</Btn>
      </Row>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {DAYS.map((d) => {
          const rows = meals.filter((m) => m.day === d);
          return (
            <Panel key={d} title={d} accent={rows.length ? A : undefined}>
              {rows.length === 0 ? (
                <p className="text-xs text-zinc-600">—</p>
              ) : (
                <ul className="space-y-1.5">
                  {rows.map((m) => (
                    <li key={m.id} className="group flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm text-zinc-200">{m.dish}</span>
                      <button type="button" onClick={() => setMeals(meals.filter((x) => x.id !== m.id))} className="shrink-0 font-mono text-[10px] text-zinc-700 hover:text-rose-400">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
      <Note>Saved on your device automatically. Write the protein first (chicken, beans, fish) then rotate sides — planning gets 10× faster.</Note>
    </div>
  );
}

/* ------------------------------ 7. Cleaning schedule ----------------------- */

const CHORES = [
  { t: "Bathroom scrub", f: 7 }, { t: "Bed sheets", f: 7 }, { t: "Vacuum floors", f: 4 },
  { t: "Kitchen deep wipe", f: 3 }, { t: "Fridge purge", f: 10 }, { t: "Trash bins", f: 5 },
  { t: "Dust surfaces", f: 6 }, { t: "Mirrors & glass", f: 12 }, { t: "Mop hard floors", f: 5 },
  { t: "Wash towels", f: 5 },
];

export function CleaningScheduleTool() {
  const A = accentOf(6);
  const [lastDone, setLastDone] = useLocalStorage<Record<string, number>>("kit-cleaning", {});
  const done = (t: string) => setLastDone({ ...lastDone, [t]: Date.now() });
  const daysSince = (t: string) => (lastDone[t] ? Math.floor((Date.now() - lastDone[t]) / 86400000) : null);
  const sorted = [...CHORES].sort((a, b) => {
    const da = daysSince(a.t) ?? 99, db = daysSince(b.t) ?? 99;
    return db / b.f - da / a.f;
  });
  return (
    <div className="space-y-2.5">
      {sorted.map((c) => {
        const since = daysSince(c.t);
        const overdue = since === null || since >= c.f;
        return (
          <div key={c.t} className={`flex items-center justify-between gap-3 rounded border px-3 py-2.5 ${overdue ? "border-zinc-700 bg-zinc-900" : "border-zinc-800 bg-zinc-950/40 opacity-60"}`}>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100">{c.t}</p>
              <p className="font-mono text-[10px] text-zinc-500">every {c.f} days{since !== null ? ` · last ${since}d ago` : " · never logged"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Meter value={Math.min(100, ((since ?? c.f) / c.f) * 100)} accent={overdue ? "#FF8A7A" : "#5EE39A"} />
              <button type="button" onClick={() => done(c.t)} className="rounded border border-zinc-700 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-800" style={{ color: overdue ? A : "#71717a" }}>
                done
              </button>
            </div>
          </div>
        );
      })}
      <Note>Sorted by urgency. Hit “done” and the timer resets — your cleaning brain, outsourced. Stored on-device.</Note>
    </div>
  );
}

/* ------------------------------ 8. Laundry symbols ------------------------- */

const SYMBOLS: { g: string; items: [string, string][] }[] = [
  { g: "Wash", items: [["🛆", "Do not wash"], ["🆒", "Machine wash 30°"], ["♨", "Hot wash 60°"], ["🖐", "Hand wash only"]] },
  { g: "Bleach", items: [["△", "Any bleach OK"], ["△̸", "Non-chlorine only"], ["✕", "Do not bleach"], ["—", "No bleach symbol = careful"]] },
  { g: "Dry", items: [["▢", "Tumble dry low"], ["◉", "Tumble dry high"], ["⬚", "Dry flat"], ["🚫", "Do not tumble dry"]] },
  { g: "Iron", items: [["•", "Low heat 110°"], ["••", "Medium 150°"], ["•••", "High 200°"], ["⌫", "Do not iron"]] },
];

export function LaundryTool() {
  const A = accentOf(7);
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">Decode the hieroglyphs on your tag — the universal care language:</p>
      {SYMBOLS.map((g) => (
        <Panel key={g.g} title={g.g.toLowerCase()} accent={A}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {g.items.map(([sym, meaning]) => (
              <div key={meaning} className="rounded border border-zinc-800 bg-zinc-950/60 p-3 text-center">
                <p className="text-2xl">{sym}</p>
                <p className="mt-1 text-[11px] leading-tight text-zinc-400">{meaning}</p>
              </div>
            ))}
          </div>
        </Panel>
      ))}
      <Note>Crossed-out anything = do not. Dots = heat level. Squares with circles = tumble dry. The tag is a contract with your clothes.</Note>
    </div>
  );
}

/* ------------------------------ 9. Plant watering -------------------------- */

type Plant = { id: number; name: string; every: number; last: number };
export function PlantWateringTool() {
  const A = accentOf(8);
  const [plants, setPlants] = useLocalStorage<Plant[]>("kit-plants", [
    { id: 1, name: "Monstera", every: 7, last: Date.now() - 5 * 86400000 },
    { id: 2, name: "Cactus", every: 21, last: Date.now() - 10 * 86400000 },
    { id: 3, name: "Basil", every: 2, last: Date.now() - 3 * 86400000 },
  ]);
  const [name, setName] = useState("");
  const [every, setEvery] = useState(7);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="New plant" value={name} onChange={setName} placeholder="Fern" className="min-w-[160px] flex-1" />
        <Slider label="Water every (days)" value={every} onChange={setEvery} min={1} max={30} accent={A} />
        <Btn accent={A} onClick={() => { if (name.trim()) { setPlants([...plants, { id: Date.now(), name: name.trim(), every, last: Date.now() }]); setName(""); } }}>Add</Btn>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((p) => {
          const since = Math.floor((Date.now() - p.last) / 86400000);
          const thirsty = since >= p.every;
          return (
            <div key={p.id} className={`rounded-lg border p-4 ${thirsty ? "border-amber-500/40 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
              <div className="flex items-center justify-between">
                <p className="font-brut text-lg text-zinc-100">{p.name}</p>
                <span className="text-2xl">{thirsty ? "🥵" : since / p.every > 0.6 ? "🤔" : "😌"}</span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-zinc-500">every {p.every}d · last {since}d ago</p>
              <div className="mt-2"><Meter value={Math.min(100, (since / p.every) * 100)} accent={thirsty ? "#FF8A7A" : "#5EE39A"} right={`${Math.min(100, Math.round((since / p.every) * 100))}%`} /></div>
              <button type="button" onClick={() => setPlants(plants.map((x) => (x.id === p.id ? { ...x, last: Date.now() } : x)))} className="mt-3 w-full rounded border border-zinc-700 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800" style={{ color: A }}>
                watered now
              </button>
            </div>
          );
        })}
      </div>
      <Note>Thirsty plants glow amber. Overwatering kills more houseplants than drought — stick to the schedule, poke a finger in the soil first.</Note>
    </div>
  );
}

/* ------------------------------ 10. Paint coverage ------------------------- */

export function PaintTool() {
  const A = accentOf(9);
  const [w, setW] = useState("4");
  const [l, setL] = useState("5");
  const [h, setH] = useState("2.7");
  const [doors, setDoors] = useState("1");
  const [win, setWin] = useState("2");
  const [coats, setCoats] = useState(2);
  const walls = 2 * (num(w) + num(l)) * num(h) - num(doors) * 2 - num(win) * 1.5;
  const liters = (walls * coats) / 10;
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Room width (m)" value={w} onChange={setW} type="number" />
        <Field label="Room length (m)" value={l} onChange={setL} type="number" />
        <Field label="Ceiling height (m)" value={h} onChange={setH} type="number" />
        <Field label="Doors" value={doors} onChange={setDoors} type="number" />
        <Field label="Windows" value={win} onChange={setWin} type="number" />
        <Field label="Coats" value={coats} onChange={(v) => setCoats(Math.max(1, Math.min(4, parseInt(v) || 1)))} type="number" />
      </Grid>
      <div className="flex items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">wall area</p>
          <p className="mt-1 font-brut text-4xl text-zinc-200">{fmt(walls)} m²</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">paint needed</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{fmt(liters)} L</p>
        </div>
      </div>
      <Panel title="buy by the can" accent={A}>
        <KV k="1 L cans" v={Math.ceil(liters)} accent={A} />
        <KV k="2.5 L cans" v={Math.ceil(liters / 2.5)} />
        <KV k="5 L cans" v={Math.ceil(liters / 5)} />
      </Panel>
      <Note>Standard coverage: 10 m² per liter. Dark-over-light or fresh plaster? Add a coat and a prayer.</Note>
    </div>
  );
}

/* ------------------------------ 11. Moving boxes --------------------------- */

export function MovingBoxesTool() {
  const A = accentOf(10);
  const [rooms, setRooms] = useState(2);
  const [people, setPeople] = useState(3);
  const [hoard, setHoard] = useState<"minimal" | "normal" | "collector">("normal");
  const mult = { minimal: 0.7, normal: 1, collector: 1.6 }[hoard];
  const boxes = Math.round((rooms * 12 + people * 8) * mult);
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Rooms" value={rooms} onChange={setRooms} min={1} max={8} accent={A} />
        <Slider label="People" value={people} onChange={setPeople} min={1} max={8} accent={A} />
      </Row>
      <Seg value={hoard} onChange={setHoard} accent={A} options={[{ v: "minimal" as const, label: "Minimalist" }, { v: "normal" as const, label: "Normal human" }, { v: "collector" as const, label: "Everything sparkles" }]} />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">boxes to buy</p>
        <p className="mt-1 font-brut text-6xl" style={{ color: A }}>{boxes}</p>
      </div>
      <Grid cols={3}>
        <BigStat label="Small (books)" value={Math.round(boxes * 0.3)} accent="#7FC8FF" />
        <BigStat label="Medium (mixed)" value={Math.round(boxes * 0.45)} accent={A} />
        <BigStat label="Large (light stuff)" value={Math.round(boxes * 0.25)} accent="#FF9DE2" />
      </Grid>
      <Note>Plus ~20% spare. Books in small boxes — your spine will thank you at the third flight of stairs.</Note>
    </div>
  );
}

/* ------------------------------ 12. TV distance ---------------------------- */

export function TvTool() {
  const A = accentOf(11);
  const [inches, setInches] = useState(55);
  const [res, setRes] = useState<"hd" | "4k">("4k");
  const min = inches * (res === "4k" ? 1 : 1.5) * 2.54 * 0.85;
  const max = inches * (res === "4k" ? 1 : 1.5) * 2.54 * 1.6;
  const cm = (v: number) => `${fmt(v / 100, 1)} m`;
  return (
    <div className="space-y-4">
      <Slider label="TV size (inches)" value={inches} onChange={setInches} min={24} max={85} accent={A} suffix='"' />
      <Seg value={res} onChange={setRes} accent={A} options={[{ v: "hd" as const, label: "1080p" }, { v: "4k" as const, label: "4K" }]} />
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-6 py-8 text-center">
        <p className="mono-kicker text-zinc-500">sweet spot</p>
        <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{cm(min)} – {cm(max)}</p>
        <p className="mt-2 font-mono text-xs text-zinc-500">from your sofa to the screen</p>
      </div>
      <Grid cols={2}>
        <BigStat label="Screen width" value={cm(inches * 2.54 * 0.87)} accent="#7FC8FF" />
        <BigStat label="Screen height" value={cm(inches * 2.54 * 0.49)} accent="#5EE39A" />
      </Grid>
      <Note>4K lets you sit closer without seeing pixels. Bigger ≠ better if your neck has to watch it.</Note>
    </div>
  );
}

/* ------------------------------ 13. Fuel cost splitter --------------------- */

export function FuelSplitterTool() {
  const A = accentOf(0);
  const [km, setKm] = useState("450");
  const [l100, setL100] = useState("7.5");
  const [price, setPrice] = useState("1.75");
  const [riders, setRiders] = useState(3);
  const [fair, setFair] = useState(true);
  const totalFuel = (num(km) / 100) * num(l100) * num(price);
  const wearTolls = fair ? num(km) * 0.06 : 0;
  const grand = totalFuel + wearTolls;
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Trip distance (km)" value={km} onChange={setKm} type="number" />
        <Field label="Consumption (L/100km)" value={l100} onChange={setL100} type="number" step="0.1" />
        <Field label="Fuel price / liter" value={price} onChange={setPrice} type="number" step="0.01" />
      </Grid>
      <Row>
        <Slider label="People in the car" value={riders} onChange={setRiders} min={1} max={8} accent={A} />
        <Seg value={fair ? "y" : "n"} onChange={(v) => setFair(v === "y")} accent={A} options={[{ v: "y", label: "Include wear & tolls" }, { v: "n", label: "Fuel only" }]} />
      </Row>
      <div className="flex items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">trip cost</p>
          <p className="mt-1 font-brut text-4xl text-zinc-200">${fmt(grand)}</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">each pays</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: A }}>${fmt(grand / riders)}</p>
        </div>
      </div>
      <Panel title="the receipt" accent={A}>
        <KV k="fuel burn" v={`${fmt((num(km) / 100) * num(l100))} L`} />
        <KV k="fuel cost" v={`$${fmt(totalFuel)}`} />
        {fair ? <KV k="wear + tolls est." v={`$${fmt(wearTolls)}`} accent="#FF9DE2" /> : null}
      </Panel>
    </div>
  );
}

/* ------------------------------ 14. Packing list --------------------------- */

type PItem = { id: number; label: string; cat: string; packed: boolean };
const PACK_PRESETS: Record<string, string[]> = {
  Beach: ["Swimsuit", "Sunscreen SPF50", "Sunglasses", "Flip flops", "Beach towel", "Hat"],
  City: ["Comfortable shoes", "Power bank", "Umbrella", "Day backpack", "Metro card"],
  Business: ["Laptop + charger", "Blazer", "Dress shoes", "Business cards", "Toiletry bag"],
  Camping: ["Tent", "Sleeping bag", "Headlamp", "First aid kit", "Water filter", "Rain shell"],
  "Snow trip": ["Thermal base layers", "Ski goggles", "Gloves", "Wool socks", "Lip balm"],
};

export function PackingTool() {
  const A = accentOf(1);
  const [items, setItems] = useLocalStorage<PItem[]>("kit-packing", []);
  const [preset, setPreset] = useState<string>("Beach");
  const [draft, setDraft] = useState("");
  const addPreset = () => {
    const list = PACK_PRESETS[preset] || [];
    setItems([...items, ...list.filter((l) => !items.some((i) => i.label === l)).map((label, i) => ({ id: Date.now() + i, label, cat: preset, packed: false }))]);
  };
  const packed = items.filter((i) => i.packed).length;
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={preset} onChange={setPreset} accent={A} options={Object.keys(PACK_PRESETS).map((k) => ({ v: k, label: k }))} />
        <Btn accent={A} onClick={addPreset}>+ Add starter list</Btn>
      </Row>
      <Row>
        <Field label="Custom item" value={draft} onChange={setDraft} placeholder="boarding passes" className="min-w-[180px] flex-1" />
        <Btn variant="ghost" accent={A} onClick={() => { if (draft.trim()) { setItems([{ id: Date.now(), label: draft.trim(), cat: "custom", packed: false }, ...items]); setDraft(""); } }}>Add</Btn>
      </Row>
      <Meter value={packed} max={Math.max(1, items.length)} accent={A} label="packing progress" right={`${packed}/${items.length}`} />
      <div className="grid gap-1.5 sm:grid-cols-2">
        {items.map((i) => (
          <label key={i.id} className={`flex cursor-pointer items-center gap-2.5 rounded border px-3 py-2 text-sm ${i.packed ? "border-zinc-800 bg-zinc-950/40 text-zinc-600 line-through" : "border-zinc-700 bg-zinc-900/60 text-zinc-200"}`}>
            <input type="checkbox" checked={i.packed} onChange={() => setItems(items.map((x) => (x.id === i.id ? { ...x, packed: !x.packed } : x)))} className="h-4 w-4 accent-amber-400" />
            <span className="min-w-0 truncate">{i.label}</span>
            <span className="ml-auto shrink-0 font-mono text-[9px] uppercase text-zinc-600">{i.cat}</span>
          </label>
        ))}
        {!items.length && <p className="col-span-full rounded border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">Pick a trip type or add your own items…</p>}
      </div>
    </div>
  );
}

/* ------------------------------ 15. Meeting cost --------------------------- */

export function MeetingCostTool() {
  const A = accentOf(2);
  const [people, setPeople] = useState(8);
  const [minutes, setMinutes] = useState(45);
  const [salary, setSalary] = useState("75000");
  const [freq, setFreq] = useState<"once" | "weekly" | "monthly">("weekly");
  const perMin = (num(salary) / 52 / 40) / 60;
  const cost = people * minutes * perMin;
  const mult = { once: 1, weekly: 52, monthly: 12 }[freq];
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Attendees" value={people} onChange={setPeople} min={2} max={30} accent={A} />
        <Slider label="Duration (min)" value={minutes} onChange={setMinutes} min={5} max={120} step={5} accent={A} />
      </Row>
      <Row>
        <Field label="Avg salary" value={salary} onChange={setSalary} type="number" className="flex-1" />
        <Seg value={freq} onChange={setFreq} accent={A} options={[{ v: "once" as const, label: "One-off" }, { v: "weekly" as const, label: "Weekly" }, { v: "monthly" as const, label: "Monthly" }]} />
      </Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">{freq === "once" ? "this meeting costs" : `this meeting costs per year (×${mult})`}</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: cost * mult > 25000 ? "#FF8A7A" : A }}>${fmt(cost * mult, 0)}</p>
        <p className="mt-1 font-mono text-xs text-zinc-500">${fmt(cost)} per occurrence · ${fmt(cost / people)} per person</p>
      </div>
      <Note>Calculated from loaded salary ÷ 52 weeks ÷ 40 h. That weekly sync everyone mutes through? It has a price tag now.</Note>
    </div>
  );
}

/* ------------------------------ 16. Gift budget ---------------------------- */

export function GiftBudgetTool() {
  const A = accentOf(3);
  const [budget, setBudget] = useState("300");
  const [people, setPeople] = useState(6);
  const [close, setClose] = useState("3");
  const total = num(budget);
  const closeN = Math.min(people, parseInt(close) || 0);
  const others = people - closeN;
  const closeAmt = closeN > 0 ? (total * 0.6) / closeN : 0;
  const otherAmt = others > 0 ? (total * 0.4) / others : 0;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Total gift budget" value={budget} onChange={setBudget} type="number" className="flex-1" />
        <Slider label="People on the list" value={people} onChange={setPeople} min={1} max={30} accent={A} />
        <Slider label="Close inner circle" value={closeN} onChange={setClose} min={0} max={people} accent={A} />
      </Row>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-5 text-center" style={{ borderColor: `${A}55`, background: `${A}0d` }}>
          <p className="mono-kicker text-zinc-500">inner circle ({closeN})</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: A }}>${fmt(closeAmt)}</p>
          <p className="font-mono text-[10px] text-zinc-500">each · 60% of budget</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-5 text-center">
          <p className="mono-kicker text-zinc-500">everyone else ({others})</p>
          <p className="mt-1 font-brut text-4xl text-zinc-200">${fmt(otherAmt)}</p>
          <p className="font-mono text-[10px] text-zinc-500">each · 40% of budget</p>
        </div>
      </div>
      <Meter value={60} accent={A} label="budget split" right="60 / 40 rule" />
      <Note>Thoughtfulness scales inversely with price. The card matters more than the number on the receipt.</Note>
    </div>
  );
}

/* ------------------------------ 17. Party food ----------------------------- */

export function PartyFoodTool() {
  const A = accentOf(4);
  const [guests, setGuests] = useState(12);
  const [hours, setHours] = useState(3);
  const [booze, setBooze] = useState<"none" | "light" | "full">("light");
  const snacks = guests * hours * 6;
  const mains = Math.ceil(guests * 0.75);
  const drinks = booze === "none" ? guests * hours * 0.6 : booze === "light" ? guests * hours * 1.2 : guests * hours * 2;
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Guests" value={guests} onChange={setGuests} min={2} max={60} accent={A} />
        <Slider label="Hours of party" value={hours} onChange={setHours} min={1} max={8} accent={A} />
      </Row>
      <Seg value={booze} onChange={setBooze} accent={A} options={[{ v: "none" as const, label: "Sober curious" }, { v: "light" as const, label: "Light drinks" }, { v: "full" as const, label: "Full send" }]} />
      <Grid cols={3}>
        <BigStat label="Snack portions" value={Math.round(snacks)} accent={A} hint="~6 bites/hour/guest" />
        <BigStat label="Main servings" value={mains} accent="#5EE39A" hint="75% eat a full plate" />
        <BigStat label="Drinks" value={Math.round(drinks)} accent="#7FC8FF" hint={booze === "none" ? "water + sodas" : "incl. 2 waters/person"} />
      </Grid>
      <Panel title="shopping shortcuts" accent={A}>
        <KV k="chips & dips bowls" v={`${Math.ceil(guests / 4)} big bowls`} accent={A} />
        <KV k="pizza-equivalents" v={`${Math.ceil((mains * 3) / 8)} large pies`} />
        <KV k="ice" v={`${Math.round(drinks * 0.2)} kg`} accent="#7FC8FF" />
      </Panel>
      <Note>Golden rule: twice the ice you think, half the homemade appetizers. Guests remember the vibe, not the vol-au-vents.</Note>
    </div>
  );
}

/* ------------------------------ 18. Utility bill splitter ------------------ */

export function BillSplitterTool() {
  const A = accentOf(5);
  const [total, setTotal] = useState("180");
  const [usage, setUsage] = useState<number[]>([40, 35, 25]);
  const sum = usage.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-4">
      <Field label="Total utility bill" value={total} onChange={setTotal} type="number" />
      <div className="space-y-3">
        {usage.map((u, i) => (
          <div key={i}>
            <Slider label={`Housemate ${i + 1} — usage share`} value={u} onChange={(v) => setUsage(usage.map((x, j) => (j === i ? v : x)))} min={0} max={100} accent={A} suffix="%" />
            <p className="mt-1 text-right font-mono text-xs" style={{ color: A }}>${fmt((u / sum) * num(total))}</p>
          </div>
        ))}
      </div>
      <Row>
        <Btn variant="ghost" accent={A} onClick={() => setUsage([...usage, Math.round(100 / (usage.length + 1))])}>+ Housemate</Btn>
        {usage.length > 1 ? <Btn variant="ghost" accent="#FF8A7A" onClick={() => setUsage(usage.slice(0, -1))}>− Remove last</Btn> : null}
        <Btn variant="ghost" accent="#7FC8FF" onClick={() => setUsage(usage.map(() => Math.round(100 / usage.length)))}>Equalize</Btn>
      </Row>
      <Note>Share the bill by real usage, not by heads. The equalize button restores world peace in one click.</Note>
    </div>
  );
}

/* ------------------------------ 19. Baby age ------------------------------- */

export function BabyAgeTool() {
  const A = accentOf(6);
  const [birth, setBirth] = useState("2025-06-15");
  const b = new Date(birth + "T12:00:00");
  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - b.getTime()) / 86400000));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);
  const milestones: [string, number, string][] = [
    ["Smiles at you", 42, "days"],
    ["First laugh", 90, "days"],
    ["Sits up", 180, "days"],
    ["Crawling", 270, "days"],
    ["First word", 365, "days"],
    ["First steps", 395, "days"],
  ];
  return (
    <div className="space-y-4">
      <Field label="Date of birth" value={birth} onChange={setBirth} type="date" />
      <Grid cols={4}>
        <BigStat label="Days" value={days} accent={A} />
        <BigStat label="Weeks" value={weeks} accent="#7FC8FF" />
        <BigStat label="Months" value={months} accent="#5EE39A" />
        <BigStat label="Years" value={years} accent="#FF9DE2" />
      </Grid>
      <Panel title="milestone radar — where you are" accent={A}>
        {milestones.map(([name, at, unit]) => {
          const reached = days >= at;
          return (
            <div key={name} className="flex items-center justify-between gap-3 border-b border-zinc-800/60 py-1.5">
              <span className="text-sm text-zinc-300">{name}</span>
              <Tag accent={reached ? "#5EE39A" : "#3f3f46"}>{reached ? "✓ passed" : `~${at} ${unit}`}</Tag>
            </div>
          );
        })}
      </Panel>
      <Note>Every baby runs on their own firmware — milestones are medians, not deadlines. This tracker is for the memory book.</Note>
    </div>
  );
}

/* ------------------------------ 20. Pet portions --------------------------- */

export function PetPortionTool() {
  const A = accentOf(7);
  const [species, setSpecies] = useState<"dog" | "cat">("dog");
  const [weight, setWeight] = useState("15");
  const [state, setState] = useState<"lean" | "normal" | "chonky">("normal");
  const [activity, setActivity] = useState<"low" | "normal" | "high">("normal");
  const kcal = useMemo(() => {
    const w = num(weight);
    const rer = 70 * Math.pow(w, 0.75);
    const stateF = { lean: 1.2, normal: 1, chonky: 0.8 }[state];
    const actF = { low: 0.9, normal: 1, high: 1.2 }[activity];
    return Math.round(rer * stateF * actF * (species === "dog" ? 1 : 0.9));
  }, [weight, state, activity, species]);
  const cups = kcal / (species === "dog" ? 350 : 300);
  return (
    <div className="space-y-4">
      <Seg value={species} onChange={setSpecies} accent={A} options={[{ v: "dog" as const, label: "🐕 Dog" }, { v: "cat" as const, label: "🐈 Cat" }]} />
      <Grid cols={3}>
        <Field label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
        <Field label="Body condition" value={state} onChange={(v) => setState(v as typeof state)} placeholder="normal" />
        <Field label="Activity" value={activity} onChange={(v) => setActivity(v as typeof activity)} placeholder="normal" />
      </Grid>
      <div className="flex items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">daily calories</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{kcal} kcal</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">≈ standard kibble</p>
          <p className="mt-1 font-brut text-4xl text-zinc-200">{fmt(cups)} cups</p>
        </div>
      </div>
      <Panel title="split across meals" accent={A}>
        <KV k="2 meals/day" v={`${Math.round(kcal / 2)} kcal each`} accent={A} />
        <KV k="3 meals/day" v={`${Math.round(kcal / 3)} kcal each`} />
        <KV k="treats budget (10%)" v={`${Math.round(kcal * 0.1)} kcal`} accent="#FF8A7A" />
      </Panel>
      <Note>“Chonky” reduces the target — vets see too many. Weigh food, not feelings.</Note>
    </div>
  );
}

/* ------------------------------ 21. Sleep cycles --------------------------- */

export function SleepCycleTool() {
  const A = accentOf(8);
  const [mode, setMode] = useState<"wakeAt" | "sleepNow">("sleepNow");
  const [time, setTime] = useState("06:30");
  const [fallAsleep, setFallAsleep] = useState(14);
  const CYCLE = 90;
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fmtT = (min: number) => {
    const m = ((min % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };
  const options = useMemo(() => {
    if (mode === "wakeAt") {
      const wake = toMin(time);
      return [6, 5, 4, 3].map((c) => ({ cycles: c, time: fmtT(wake - c * CYCLE - fallAsleep) }));
    }
    const now = new Date();
    const start = now.getHours() * 60 + now.getMinutes() + fallAsleep;
    return [3, 4, 5, 6].map((c) => ({ cycles: c, time: fmtT(start + c * CYCLE) }));
  }, [mode, time, fallAsleep]);
  return (
    <div className="space-y-4">
      <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "sleepNow" as const, label: "If I sleep now…" }, { v: "wakeAt" as const, label: "I must wake at…" }]} />
      {mode === "wakeAt" ? <Field label="Wake-up time" value={time} onChange={setTime} type="time" /> : null}
      <Slider label="Time to fall asleep (min)" value={fallAsleep} onChange={setFallAsleep} min={0} max={40} accent={A} />
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((o) => (
          <div key={o.cycles} className="rounded-lg border p-4 text-center" style={{ borderColor: o.cycles >= 5 ? `${A}88` : "#3f3f46", background: o.cycles >= 5 ? `${A}0f` : "transparent" }}>
            <p className="font-brut text-3xl" style={{ color: o.cycles >= 5 ? A : "#a1a1aa" }}>{o.time}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">{o.cycles} cycles · {fmt(o.cycles * 1.5, 1)} h</p>
          </div>
        ))}
      </div>
      <Note>Waking between 90-min sleep cycles feels like surfacing gently. Full send = 6 cycles (9 h); zombie mode = 3.</Note>
    </div>
  );
}
