"use client";

/* ==========================================================================
   KIT: HEALTH & BODY — 14 fitness & wellness instruments.
   Educational estimates only — not medical advice.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BigStat,
  Btn,
  Field,
  Grid,
  KV,
  Meter,
  Note,
  Panel,
  Row,
  Seg,
  Slider,
  Tag,
  accentOf,
  fmt,
} from "./kit";
import { useLocalStorage } from "./hooks";

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------ 1. TDEE / calories ------------------------- */

export function TdeeTool() {
  const A = accentOf(0);
  const [sex, setSex] = useState<"m" | "f">("m");
  const [age, setAge] = useState("30");
  const [cm, setCm] = useState("175");
  const [kg, setKg] = useState("72");
  const [act, setAct] = useState<"1.2" | "1.375" | "1.55" | "1.725" | "1.9">("1.55");
  const bmr = 10 * num(kg) + 6.25 * num(cm) - 5 * num(age) + (sex === "m" ? 5 : -161);
  const tdee = bmr * parseFloat(act);
  return (
    <div className="space-y-4">
      <Seg value={sex} onChange={setSex} accent={A} options={[{ v: "m" as const, label: "Male" }, { v: "f" as const, label: "Female" }]} />
      <Grid cols={3}>
        <Field label="Age" value={age} onChange={setAge} type="number" />
        <Field label="Height (cm)" value={cm} onChange={setCm} type="number" />
        <Field label="Weight (kg)" value={kg} onChange={setKg} type="number" />
      </Grid>
      <Seg value={act} onChange={setAct} accent={A} options={[{ v: "1.2" as const, label: "Sedentary" }, { v: "1.375" as const, label: "Light" }, { v: "1.55" as const, label: "Moderate" }, { v: "1.725" as const, label: "Very active" }, { v: "1.9" as const, label: "Athlete" }]} />
      <div className="flex items-end justify-center gap-8 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">maintain weight</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{Math.round(tdee)} kcal</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">lose ~0.5 kg/wk</p>
          <p className="mt-1 font-brut text-4xl text-zinc-300">{Math.round(tdee - 500)}</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">gain muscle</p>
          <p className="mt-1 font-brut text-4xl text-zinc-300">{Math.round(tdee + 300)}</p>
        </div>
      </div>
      <KV k="BMR (Mifflin-St Jeor)" v={`${Math.round(bmr)} kcal — burns at absolute rest`} accent={A} />
      <Note>Estimates from population averages. Real metabolism varies ±15% — track two weeks of real eating and adjust.</Note>
    </div>
  );
}

/* ------------------------------ 2. Macro splitter -------------------------- */

export function MacroTool() {
  const A = accentOf(1);
  const [kcal, setKcal] = useState("2200");
  const [style, setStyle] = useState<"balanced" | "lowcarb" | "highprotein">("balanced");
  const split = { balanced: [0.4, 0.3, 0.3], lowcarb: [0.25, 0.55, 0.2], highprotein: [0.35, 0.35, 0.3] }[style];
  const [carbP, fatP, protP] = split;
  const k = num(kcal);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Daily calories" value={kcal} onChange={setKcal} type="number" className="flex-1" />
        <Seg value={style} onChange={setStyle} accent={A} options={[{ v: "balanced" as const, label: "Balanced" }, { v: "lowcarb" as const, label: "Low carb" }, { v: "highprotein" as const, label: "High protein" }]} />
      </Row>
      <div className="space-y-3">
        <Meter value={carbP} max={1} accent="#FFD43B" label={`Carbs ${Math.round((k * carbP) / 4)} g`} right={`${Math.round(carbP * 100)}% of kcal`} />
        <Meter value={protP} max={1} accent="#5EE39A" label={`Protein ${Math.round((k * protP) / 4)} g`} right={`${Math.round(protP * 100)}% of kcal`} />
        <Meter value={fatP} max={1} accent="#FF8A7A" label={`Fat ${Math.round((k * fatP) / 9)} g`} right={`${Math.round(fatP * 100)}% of kcal`} />
      </div>
      <Grid cols={3}>
        <BigStat label="Carbs" value={`${Math.round((k * carbP) / 4)} g`} accent="#FFD43B" hint="4 kcal/g" />
        <BigStat label="Protein" value={`${Math.round((k * protP) / 4)} g`} accent="#5EE39A" hint="4 kcal/g" />
        <BigStat label="Fat" value={`${Math.round((k * fatP) / 9)} g`} accent="#FF8A7A" hint="9 kcal/g" />
      </Grid>
    </div>
  );
}

/* ------------------------------ 3. Body fat (Navy) ------------------------- */

export function BodyFatTool() {
  const A = accentOf(2);
  const [sex, setSex] = useState<"m" | "f">("m");
  const [cm, setCm] = useState("175");
  const [neck, setNeck] = useState("38");
  const [waist, setWaist] = useState("85");
  const [hip, setHip] = useState("95");
  const bf = useMemo(() => {
    const h = num(cm), n = num(neck), w = num(waist), hp = num(hip);
    if (!h || !n) return 0;
    if (sex === "m") return 495 / (1.0324 - 0.19077 * Math.log10(Math.max(1, w - n)) + 0.15456 * Math.log10(h)) - 450;
    return 495 / (1.29579 - 0.35004 * Math.log10(Math.max(1, w + hp - n)) + 0.221 * Math.log10(h)) - 450;
  }, [sex, cm, neck, waist, hip]);
  const cat = bf < 10 ? "Essential" : bf < 14 ? "Athletic" : bf < 18 ? "Fit" : bf < 25 ? "Average" : "Above average";
  return (
    <div className="space-y-4">
      <Seg value={sex} onChange={setSex} accent={A} options={[{ v: "m" as const, label: "Male" }, { v: "f" as const, label: "Female" }]} />
      <Grid cols={2}>
        <Field label="Height (cm)" value={cm} onChange={setCm} type="number" />
        <Field label="Neck (cm)" value={neck} onChange={setNeck} type="number" />
        <Field label="Waist (cm, at navel)" value={waist} onChange={setWaist} type="number" />
        {sex === "f" ? <Field label="Hips (cm, widest)" value={hip} onChange={setHip} type="number" /> : null}
      </Grid>
      <div className="flex items-end justify-center gap-8 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">estimated body fat</p>
          <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{fmt(bf, 1)}%</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">bracket</p>
          <p className="mt-1 font-brut text-3xl text-zinc-200">{cat}</p>
        </div>
      </div>
      <Note>US Navy tape method, ±3% accuracy. Measure relaxed, first thing in the morning, same spot weekly.</Note>
    </div>
  );
}

/* ------------------------------ 4. Ideal weight ---------------------------- */

export function IdealWeightTool() {
  const A = accentOf(3);
  const [cm, setCm] = useState("175");
  const h = num(cm) / 100;
  const bmiMin = 18.5 * h * h;
  const bmiMax = 24.9 * h * h;
  const devine = sexFix(50 + 0.9 * (num(cm) - 152.4));
  const hamwi = sexFix(48 + 2.7 * ((num(cm) - 152.4) / 2.54));
  return (
    <div className="space-y-4">
      <Field label="Height (cm)" value={cm} onChange={setCm} type="number" />
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: `${A}55`, background: `${A}0a` }}>
        <p className="mono-kicker text-zinc-500">healthy weight band (BMI 18.5–24.9)</p>
        <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{Math.round(bmiMin)} – {Math.round(bmiMax)} kg</p>
      </div>
      <Panel title="classic formulas (for reference only)" accent={A}>
        <KV k="Devine (1974)" v={`${fmt(devine, 1)} kg`} accent={A} />
        <KV k="Hamwi (1964)" v={`${fmt(hamwi, 1)} kg`} />
      </Panel>
      <Note>Formulas ignore muscle, frame and age. The BMI band is the honest range — anywhere inside it, your body does not care about the exact number.</Note>
    </div>
  );
}

function sexFix(v: number) {
  return v;
}

/* ------------------------------ 5. Protein needs --------------------------- */

export function ProteinTool() {
  const A = accentOf(4);
  const [kg, setKg] = useState("72");
  const [goal, setGoal] = useState<"maintain" | "build" | "cut" | "endurance">("build");
  const perKg = { maintain: 0.8, build: 1.8, cut: 2.2, endurance: 1.4 }[goal];
  const grams = num(kg) * perKg;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Weight (kg)" value={kg} onChange={setKg} type="number" className="flex-1" />
        <Seg value={goal} onChange={setGoal} accent={A} options={[{ v: "maintain" as const, label: "Maintain" }, { v: "build" as const, label: "Build muscle" }, { v: "cut" as const, label: "Cutting" }, { v: "endurance" as const, label: "Endurance" }]} />
      </Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">daily protein target</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{Math.round(grams)} g</p>
        <p className="mt-1 font-mono text-xs text-zinc-500">{perKg} g per kg bodyweight</p>
      </div>
      <Panel title="what that looks like on a plate" accent={A}>
        <KV k="chicken breast (31g/100g)" v={`${Math.round((grams / 31) * 100)} g`} accent={A} />
        <KV k="greek yogurt (10g/100g)" v={`${Math.round((grams / 10) * 100)} g`} />
        <KV k="eggs (6g each)" v={`${Math.round(grams / 6)} eggs`} />
        <KV k="lentils cooked (9g/100g)" v={`${Math.round((grams / 9) * 100)} g`} />
      </Panel>
    </div>
  );
}

/* ------------------------------ 6. One rep max ----------------------------- */

export function OneRepMaxTool() {
  const A = accentOf(5);
  const [w, setW] = useState("100");
  const [r, setR] = useState(5);
  const epley = num(w) * (1 + r / 30);
  const brzycki = num(w) * (36 / (37 - Math.min(36, r - 1)));
  const avg = (epley + brzycki) / 2;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Weight lifted (kg)" value={w} onChange={setW} type="number" className="flex-1" />
        <Slider label="Reps completed" value={r} onChange={setR} min={1} max={12} accent={A} />
      </Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">estimated 1RM (avg of 2 formulas)</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{Math.round(avg)} kg</p>
      </div>
      <Grid cols={4}>
        <BigStat label="95% ×2 reps" value={`${Math.round(avg * 0.95)}`} unit="kg" accent="#7FC8FF" />
        <BigStat label="90% ×4 reps" value={`${Math.round(avg * 0.9)}`} unit="kg" accent="#5EE39A" />
        <BigStat label="80% ×8 reps" value={`${Math.round(avg * 0.8)}`} unit="kg" accent="#FF9DE2" />
        <BigStat label="70% ×12 reps" value={`${Math.round(avg * 0.7)}`} unit="kg" accent="#B9A6FF" />
      </Grid>
      <Note>Epley & Brzycki agree within ~3% below 8 reps — testing actual 1RM is only for experienced lifters with a spotter.</Note>
    </div>
  );
}

/* ------------------------------ 7. Running pace ---------------------------- */

export function PaceTool() {
  const A = accentOf(6);
  const [dist, setDist] = useState("10");
  const [h, setH] = useState("0");
  const [m, setM] = useState("50");
  const totalMin = num(h) * 60 + num(m);
  const pace = num(dist) > 0 ? totalMin / num(dist) : 0;
  const kph = pace > 0 ? 60 / pace : 0;
  const pm = Math.floor(pace);
  const ps = Math.round((pace - pm) * 60);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Distance (km)" value={dist} onChange={setDist} type="number" className="flex-1" />
        <Field label="Hours" value={h} onChange={setH} type="number" className="w-24" />
        <Field label="Minutes" value={m} onChange={setM} type="number" className="w-24" />
      </Row>
      <div className="flex items-end justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">pace per km</p>
          <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{pm}:{String(ps).padStart(2, "0")}</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">speed</p>
          <p className="mt-1 font-brut text-5xl text-zinc-200">{fmt(kph, 1)}<span className="text-lg text-zinc-500"> km/h</span></p>
        </div>
      </div>
      <Panel title="race benchmarks at this pace" accent={A}>
        <KV k="5K" v={`${Math.floor((pace * 5) / 60)}:${String(Math.round((pace * 5) % 60)).padStart(2, "0")}`} accent={A} />
        <KV k="10K" v={`${Math.floor((pace * 10) / 60)}:${String(Math.round((pace * 10) % 60)).padStart(2, "0")}`} />
        <KV k="Half marathon" v={`${Math.floor((pace * 21.1) / 60)}:${String(Math.round((pace * 21.1) % 60)).padStart(2, "0")}`} />
        <KV k="Marathon" v={`${Math.floor((pace * 42.2) / 60)}:${String(Math.round((pace * 42.2) % 60)).padStart(2, "0")}`} />
      </Panel>
    </div>
  );
}

/* ------------------------------ 8. Race predictor -------------------------- */

export function RacePredictTool() {
  const A = accentOf(7);
  const [h, setH] = useState("0");
  const [m, setM] = useState("25");
  const [dist, setDist] = useState("5");
  const t = num(h) * 3600 + num(m) * 60;
  const predict = (d: number) => (t * Math.pow(d / Math.max(1, num(dist)), 1.06)) / 60;
  const races: [string, number][] = [["5K", 5], ["10K", 10], ["Half", 21.1], ["Marathon", 42.2]];
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Raced distance (km)" value={dist} onChange={setDist} type="number" className="flex-1" />
        <Field label="Hours" value={h} onChange={setH} type="number" className="w-24" />
        <Field label="Minutes" value={m} onChange={setM} type="number" className="w-24" />
      </Row>
      <Panel title="Riegel prediction — same effort, longer race" accent={A}>
        {races.map(([name, d]) => {
          const mins = predict(d);
          return <KV key={name} k={name} v={`${Math.floor(mins / 60)}:${String(Math.round(mins % 60)).padStart(2, "0")}:${String(Math.round(((mins % 1) * 60) % 60)).padStart(2, "0")}`} accent={d === num(dist) ? A : undefined} />;
        })}
      </Panel>
      <Note>Exponent 1.06 assumes decent endurance training. Marathon predictions are optimistic for first-timers — add 5–10 min reality tax.</Note>
    </div>
  );
}

/* ------------------------------ 9. Steps converter ------------------------- */

export function StepsTool() {
  const A = accentOf(8);
  const [steps, setSteps] = useState("10000");
  const [cm, setCm] = useState("175");
  const stride = num(cm) * 0.415;
  const km = (num(steps) * stride) / 100000;
  const kcal = num(steps) * 0.04;
  const minutes = num(steps) / 110;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Steps" value={steps} onChange={setSteps} type="number" className="flex-1" />
        <Field label="Height (cm)" value={cm} onChange={setCm} type="number" className="w-36" />
      </Row>
      <Grid cols={4}>
        <BigStat label="Distance" value={fmt(km, 2)} unit="km" accent={A} />
        <BigStat label="Calories" value={Math.round(kcal)} unit="kcal" accent="#FF8A7A" />
        <BigStat label="Walking time" value={`${Math.round(minutes)}`} unit="min" accent="#7FC8FF" />
        <BigStat label="Stride" value={Math.round(stride)} unit="cm" accent="#5EE39A" />
      </Grid>
      <Meter value={num(steps)} max={10000} accent={A} label="toward the 10K myth" right={`${num(steps).toLocaleString()} / 10,000`} />
      <Note>10,000 steps came from a 1965 Japanese pedometer ad, not science. ~7,000 captures most of the health benefit.</Note>
    </div>
  );
}

/* ------------------------------ 10. Fasting window ------------------------- */

export function FastingTool() {
  const A = accentOf(9);
  const [plan, setPlan] = useState<"16:8" | "14:10" | "18:6" | "20:4">("16:8");
  const [start, setStart] = useState("12:00");
  const [h, m] = start.split(":").map(Number);
  const fastH = parseInt(plan.split(":")[0]);
  const eatH = parseInt(plan.split(":")[1]);
  const toT = (min: number) => `${String(Math.floor(((min % 1440) + 1440) % 1440 / 60)).padStart(2, "0")}:${String(((min % 1440) + 1440) % 1440 % 60).padStart(2, "0")}`;
  const eatStart = h * 60 + m;
  const eatEnd = eatStart + eatH * 60;
  return (
    <div className="space-y-4">
      <Row>
        <Seg value={plan} onChange={setPlan} accent={A} options={[{ v: "14:8" as never, label: "14:10" }, { v: "16:8" as never, label: "16:8" }, { v: "18:6" as never, label: "18:6" }, { v: "20:4" as never, label: "20:4" }]} />
        <Field label="Eating window opens at" value={start} onChange={setStart} type="time" className="w-44" />
      </Row>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6">
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          <span>{toT(eatStart)}</span><span style={{ color: A }}>eating window</span><span>{toT(eatEnd)}</span>
        </div>
        <div className="flex h-8 w-full overflow-hidden rounded-md">
          <div className="flex items-center justify-center bg-zinc-800 font-mono text-[10px] text-zinc-400" style={{ width: `${(fastH / 24) * 100 * (24 / 24)}` }} />
        </div>
        <div className="mt-2 flex h-8 w-full overflow-hidden rounded-md">
          <div className="flex items-center justify-center font-mono text-[10px] font-bold text-zinc-900" style={{ width: `${(eatH / 24) * 100}%`, background: A }}>EAT {eatH}h</div>
          <div className="flex flex-1 items-center justify-center bg-zinc-800 font-mono text-[10px] text-zinc-400">FAST {fastH}h</div>
        </div>
        <div className="mt-3 grid gap-1 font-mono text-xs text-zinc-400">
          <p>🍽 eat: {toT(eatStart)} → {toT(eatEnd)}</p>
          <p>🚫 fast: {toT(eatEnd)} → {toT(eatStart + 1440)}</p>
        </div>
      </div>
      <Note>Pick the window you can hold for months, not the most extreme one. Black coffee, tea and water are fine during the fast.</Note>
    </div>
  );
}

/* ------------------------------ 11. Due date ------------------------------- */

export function DueDateTool() {
  const A = accentOf(10);
  const [lmp, setLmp] = useState(() => new Date().toISOString().slice(0, 10));
  const base = new Date(lmp + "T12:00:00");
  const due = new Date(base.getTime() + 280 * 86400000);
  const now = new Date();
  const daysPreg = Math.max(0, Math.floor((now.getTime() - base.getTime()) / 86400000));
  const weeks = Math.floor(daysPreg / 7);
  const days = daysPreg % 7;
  const daysLeft = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000));
  const trimester = daysPreg < 91 ? "First" : daysPreg < 189 ? "Second" : "Third";
  return (
    <div className="space-y-4">
      <Field label="First day of last period (LMP)" value={lmp} onChange={setLmp} type="date" />
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: `${A}55`, background: `${A}0a` }}>
        <p className="mono-kicker text-zinc-500">estimated due date (Naegele)</p>
        <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{due.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>
      <Grid cols={3}>
        <BigStat label="Progress" value={weeks} unit={`w ${days}d`} accent={A} />
        <BigStat label="Days to go" value={daysLeft} accent="#7FC8FF" />
        <BigStat label="Trimester" value={trimester} accent="#5EE39A" />
      </Grid>
      <Meter value={Math.min(100, (daysPreg / 280) * 100)} accent={A} label="40-week journey" right={`${Math.round((daysPreg / 280) * 100)}%`} />
      <Note>Full term spans 37–42 weeks — only ~4% of babies arrive exactly on their due date. Trimesters: 0–13, 14–27, 28+.</Note>
    </div>
  );
}

/* ------------------------------ 12. Heart rate zones ----------------------- */

export function HrZonesTool() {
  const A = accentOf(11);
  const [age, setAge] = useState("30");
  const [rest, setRest] = useState("60");
  const max = 208 - 0.7 * num(age);
  const zones: [string, number, number, string][] = [
    ["Z1 Recovery", 0.5, 0.6, "Easy spin, fat burn, active rest"],
    ["Z2 Endurance", 0.6, 0.7, "Conversational base miles — the bread and butter"],
    ["Z3 Tempo", 0.7, 0.8, "Comfortably hard, marathon effort"],
    ["Z4 Threshold", 0.8, 0.9, "Hard intervals, ~1h race pace"],
    ["Z5 VO2max", 0.9, 1.0, "All-out sprints, 30s–4min"],
  ];
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Age" value={age} onChange={setAge} type="number" className="flex-1" />
        <Field label="Resting HR" value={rest} onChange={setRest} type="number" className="w-32" />
      </Row>
      <BigStat label="Estimated max HR (Tanaka)" value={Math.round(max)} unit="bpm" accent={A} />
      <div className="space-y-2">
        {zones.map(([name, lo, hi, desc]) => {
          const loBpm = Math.round(rest + (max - num(rest)) * lo);
          const hiBpm = Math.round(rest + (max - num(rest)) * hi);
          return (
            <div key={name} className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-100">{name}</span>
                <span className="font-mono text-sm" style={{ color: A }}>{loBpm}–{hiBpm} bpm</span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">{desc}</p>
            </div>
          );
        })}
      </div>
      <Note>Karvonen zones (uses your resting HR — more personal than plain % of max). Max HR via Tanaka: 208 − 0.7×age.</Note>
    </div>
  );
}

/* ------------------------------ 13. Interval timer ------------------------- */

export function IntervalTimerTool() {
  const A = accentOf(0);
  const [work, setWork] = useState(40);
  const [rest_, setRest] = useState(20);
  const [rounds, setRounds] = useState(8);
  const [phase, setPhase] = useState<"idle" | "work" | "rest" | "done">("idle");
  const [left, setLeft] = useState(0);
  const [round, setRound] = useState(1);
  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    const t = setTimeout(() => {
      if (left > 1) {
        setLeft(left - 1);
        return;
      }
      if (phase === "work") {
        if (round >= rounds) {
          setPhase("done");
          setLeft(0);
          return;
        }
        setPhase("rest");
        setLeft(rest_);
      } else {
        setRound(round + 1);
        setPhase("work");
        setLeft(work);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, left, round, rounds, work, rest_]);
  const start = () => { setRound(1); setPhase("work"); setLeft(work); };
  const stop = () => { setPhase("idle"); setLeft(0); setRound(1); };
  const color = phase === "work" ? "#5EE39A" : phase === "rest" ? "#7FC8FF" : A;
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Work (sec)" value={work} onChange={setWork} min={5} max={300} step={5} accent="#5EE39A" />
        <Slider label="Rest (sec)" value={rest_} onChange={setRest} min={5} max={120} step={5} accent="#7FC8FF" />
        <Slider label="Rounds" value={rounds} onChange={setRounds} min={2} max={20} accent={A} />
      </Row>
      <button type="button" onClick={phase === "idle" || phase === "done" ? start : stop} className="flex w-full flex-col items-center justify-center rounded-lg border-2 py-12" style={{ borderColor: color, background: `${color}0d` }}>
        <span className="mono-kicker text-zinc-500">{phase === "idle" ? "tap to start" : phase === "done" ? "complete 💪 — tap to restart" : `round ${round}/${rounds} · ${phase}`}</span>
        <span className="mt-2 font-brut text-7xl tabular-nums" style={{ color }}>{phase === "idle" ? `${work}s` : phase === "done" ? "✓" : left}</span>
        <span className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">{phase === "idle" || phase === "done" ? "ready" : "tap anywhere to stop"}</span>
      </button>
      <div className="flex gap-1.5">
        {Array.from({ length: rounds }, (_, i) => (
          <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i < round - 1 ? color : i === round - 1 && phase !== "idle" && phase !== "done" ? color : "#3f3f46" }} />
        ))}
      </div>
      <Note>Tabata classic: 20s on / 10s off ×8. Keep the phone screen on — audio cues come later.</Note>
    </div>
  );
}

/* ------------------------------ 14. Medicine schedule ---------------------- */

type Med = { id: number; name: string; times: string; taken: string };
export function MedicineTool() {
  const A = accentOf(1);
  const [meds, setMeds] = useLocalStorage<Med[]>("kit-meds", []);
  const [name, setName] = useState("");
  const [times, setTimes] = useState("08:00");
  const today = new Date().toISOString().slice(0, 10);
  const mark = (m: Med) => setMeds(meds.map((x) => (x.id === m.id ? { ...x, taken: today } : x)));
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Medicine" value={name} onChange={setName} placeholder="Vitamin D" className="min-w-[140px] flex-1" />
        <Field label="Daily time" value={times} onChange={setTimes} type="time" className="w-36" />
        <Btn accent={A} onClick={() => { if (name.trim()) { setMeds([{ id: Date.now(), name: name.trim(), times, taken: "" }, ...meds]); setName(""); } }}>Add</Btn>
      </Row>
      <div className="space-y-2">
        {meds.map((m) => {
          const takenToday = m.taken === today;
          return (
            <div key={m.id} className={`flex items-center justify-between gap-3 rounded border px-3 py-3 ${takenToday ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900/60"}`}>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${takenToday ? "text-zinc-500 line-through" : "text-zinc-100"}`}>{m.name}</p>
                <p className="font-mono text-[10px] text-zinc-500">daily at {m.times}</p>
              </div>
              {takenToday ? (
                <Tag accent="#5EE39A">✓ taken today</Tag>
              ) : (
                <button type="button" onClick={() => mark(m)} className="rounded border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800" style={{ borderColor: `${A}55`, color: A }}>taken</button>
              )}
            </div>
          );
        })}
        {!meds.length && <p className="rounded border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">Add your medicines — resets every day, stored on this device only.</p>}
      </div>
      <Note>Simple daily checklist, not a replacement for pharmacy reminders. Resets at midnight — taken status is per-day.</Note>
    </div>
  );
}