"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stat, inputCls, labelCls } from "./hooks";

/* ---------------------------- Percentage Calc ------------------------------ */

export function PercentageTool() {
  const [aOf, setAOf] = useState({ a: "15", b: "200" });
  const [isWhat, setIsWhat] = useState({ a: "30", b: "150" });
  const [change, setChange] = useState({ a: "80", b: "100" });

  const r1 = useMemo(() => {
    const a = Number(aOf.a), b = Number(aOf.b);
    return Number.isFinite(a) && Number.isFinite(b) ? (a / 100) * b : NaN;
  }, [aOf]);

  const r2 = useMemo(() => {
    const a = Number(isWhat.a), b = Number(isWhat.b);
    return Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? (a / b) * 100 : NaN;
  }, [isWhat]);

  const r3 = useMemo(() => {
    const a = Number(change.a), b = Number(change.b);
    return Number.isFinite(a) && Number.isFinite(b) && a !== 0 ? ((b - a) / Math.abs(a)) * 100 : NaN;
  }, [change]);

  const fmt = (n: number) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";

  return (
    <div className="space-y-4">
      {[
        {
          title: "What is X% of Y?",
          a: aOf, setA: setAOf, la: "X (%)", lb: "Y",
          result: fmt(r1), suffix: "",
        },
        {
          title: "X is what percent of Y?",
          a: isWhat, setA: setIsWhat, la: "X", lb: "Y",
          result: fmt(r2), suffix: "%",
        },
        {
          title: "Percentage change from X to Y",
          a: change, setA: setChange, la: "From (X)", lb: "To (Y)",
          result: r3 > 0 ? `+${fmt(r3)}` : fmt(r3), suffix: "%",
        },
      ].map((m, i) => (
        <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <p className="mb-3 text-sm font-semibold text-zinc-100">{m.title}</p>
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`p-${i}-a`} className={labelCls}>{m.la}</Label>
              <Input
                id={`p-${i}-a`}
                type="number"
                step="any"
                value={m.a.a}
                onChange={(e) => m.setA({ ...m.a, a: e.target.value })}
                className={`${inputCls} w-28`}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`p-${i}-b`} className={labelCls}>{m.lb}</Label>
              <Input
                id={`p-${i}-b`}
                type="number"
                step="any"
                value={m.a.b}
                onChange={(e) => m.setA({ ...m.a, b: e.target.value })}
                className={`${inputCls} w-28`}
              />
            </div>
            <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-2">
              <span className="text-lg font-bold text-emerald-400">
                {m.result}
                {m.suffix}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Loan/EMI -------------------------------- */

export function LoanTool() {
  const [amount, setAmount] = useState("500000");
  const [rate, setRate] = useState("12");
  const [months, setMonths] = useState("36");

  const res = useMemo(() => {
    const P = Number(amount), annual = Number(rate), n = Number(months);
    if (!Number.isFinite(P) || !Number.isFinite(annual) || !Number.isFinite(n) || P <= 0 || n <= 0)
      return null;
    const r = annual / 100 / 12;
    const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    return {
      emi,
      total,
      interest: total - P,
      totalRatio: total / P,
    };
  }, [amount, rate, months]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="loan-p" className={labelCls}>Loan amount</Label>
          <Input id="loan-p" type="number" min="0" step="any" value={amount}
            onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loan-r" className={labelCls}>Interest rate (% / year)</Label>
          <Input id="loan-r" type="number" min="0" step="any" value={rate}
            onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loan-n" className={labelCls}>Tenure (months)</Label>
          <Input id="loan-n" type="number" min="1" step="1" value={months}
            onChange={(e) => setMonths(e.target.value)} className={inputCls} />
        </div>
      </div>
      {res ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/25 px-4 py-4">
              <p className={labelCls}>Monthly payment</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{fmt(res.emi)}</p>
            </div>
            <Stat label="Total interest" value={fmt(res.interest)} />
            <Stat label="Total repayment" value={fmt(res.total)} />
          </div>
          <p className="text-xs text-zinc-500">
            You repay {fmt(res.totalRatio)}× the borrowed amount over {Number(months)} months
            ({(Number(months) / 12).toFixed(1)} years). Estimates only — confirm exact terms with your lender.
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Enter valid values to see the breakdown.</p>
      )}
    </div>
  );
}

/* ----------------------------------- BMI ----------------------------------- */

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", cls: "bg-amber-500/15 text-amber-300 border-amber-600/40" };
  if (bmi < 25) return { label: "Normal weight", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-600/40" };
  if (bmi < 30) return { label: "Overweight", cls: "bg-orange-500/15 text-orange-300 border-orange-600/40" };
  return { label: "Obese", cls: "bg-rose-500/15 text-rose-300 border-rose-600/40" };
}

export function BmiTool() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [kg, setKg] = useState("70");
  const [cm, setCm] = useState("170");
  const [lb, setLb] = useState("155");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("7");

  const result = useMemo(() => {
    let w = 0, h = 0; // kg, m
    if (unit === "metric") {
      w = Number(kg);
      h = Number(cm) / 100;
    } else {
      w = Number(lb) * 0.45359237;
      h = (Number(ft) * 12 + Number(inch)) * 0.0254;
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    const bmi = w / (h * h);
    const cat = bmiCategory(bmi);
    const lo = 18.5 * h * h, hi = 24.9 * h * h;
    const show = (v: number) =>
      unit === "metric"
        ? `${v.toFixed(1)} kg`
        : `${(v / 0.45359237).toFixed(1)} lb`;
    return { bmi, cat, range: `${show(lo)} – ${show(hi)}` };
  }, [unit, kg, cm, lb, ft, inch]);

  return (
    <div className="space-y-5">
      <RadioGroup
        value={unit}
        onValueChange={(v) => setUnit(v as "metric" | "imperial")}
        className="flex w-fit gap-2"
      >
        {["metric", "imperial"].map((u) => (
          <div key={u} className="flex items-center">
            <RadioGroupItem value={u} id={`bmi-${u}`} className="peer sr-only" />
            <Label
              htmlFor={`bmi-${u}`}
              className="cursor-pointer rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-sm capitalize text-zinc-400 transition-all peer-data-[state=checked]:border-emerald-400/60 peer-data-[state=checked]:bg-emerald-500/15 peer-data-[state=checked]:text-emerald-300 hover:border-zinc-500"
            >
              {u}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        {unit === "metric" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="bmi-kg" className={labelCls}>Weight (kg)</Label>
              <Input id="bmi-kg" type="number" min="0" step="any" value={kg}
                onChange={(e) => setKg(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bmi-cm" className={labelCls}>Height (cm)</Label>
              <Input id="bmi-cm" type="number" min="0" step="any" value={cm}
                onChange={(e) => setCm(e.target.value)} className={inputCls} />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="bmi-lb" className={labelCls}>Weight (lb)</Label>
              <Input id="bmi-lb" type="number" min="0" step="any" value={lb}
                onChange={(e) => setLb(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bmi-ft" className={labelCls}>Height (ft)</Label>
                <Input id="bmi-ft" type="number" min="0" step="1" value={ft}
                  onChange={(e) => setFt(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bmi-in" className={labelCls}>(in)</Label>
                <Input id="bmi-in" type="number" min="0" max="11" step="1" value={inch}
                  onChange={(e) => setInch(e.target.value)} className={inputCls} />
              </div>
            </div>
          </>
        )}
      </div>

      {result ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div>
            <p className={labelCls}>Your BMI</p>
            <p className="text-4xl font-bold text-zinc-50">{result.bmi.toFixed(1)}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${result.cat.cls}`}>
            {result.cat.label}
          </span>
          <div className="sm:ml-auto">
            <p className={labelCls}>Healthy weight range</p>
            <p className="text-sm font-medium text-zinc-200">{result.range}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Enter valid weight and height.</p>
      )}
      <p className="text-xs text-zinc-500">
        BMI is a rough screening metric and doesn&apos;t account for muscle mass, age, or body composition.
      </p>
    </div>
  );
}

/* ------------------------------- Age Calculator ---------------------------- */

export function AgeTool() {
  const [dob, setDob] = useState("1995-06-15");
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));

  const res = useMemo(() => {
    if (!dob || !asOf) return null;
    const birth = new Date(dob + "T00:00:00");
    const ref = new Date(asOf + "T00:00:00");
    if (isNaN(birth.getTime()) || isNaN(ref.getTime()) || birth > ref) return null;

    let years = ref.getFullYear() - birth.getFullYear();
    let months = ref.getMonth() - birth.getMonth();
    let days = ref.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor((ref.getTime() - birth.getTime()) / 86400000);
    const totalHours = totalDays * 24;

    // next birthday
    let next = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
    if (next <= new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())) {
      next = new Date(ref.getFullYear() + 1, birth.getMonth(), birth.getDate());
    }
    const daysToBd = Math.ceil(
      (next.getTime() - new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime()) / 86400000
    );

    return { years, months, days, totalDays, totalHours, daysToBd };
  }, [dob, asOf]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="age-dob" className={labelCls}>Date of birth</Label>
          <Input id="age-dob" type="date" value={dob} max="2100-12-31"
            onChange={(e) => setDob(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="age-asof" className={labelCls}>Age as of</Label>
          <Input id="age-asof" type="date" value={asOf}
            onChange={(e) => setAsOf(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
        </div>
      </div>
      {res ? (
        <>
          <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/25 p-5 text-center">
            <p className={labelCls}>Age</p>
            <p className="mt-1 text-3xl font-bold text-zinc-50">
              {res.years} <span className="text-lg text-zinc-400">years</span> {res.months}{" "}
              <span className="text-lg text-zinc-400">months</span> {res.days}{" "}
              <span className="text-lg text-zinc-400">days</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Total days" value={res.totalDays.toLocaleString()} />
            <Stat label="Total hours" value={res.totalHours.toLocaleString()} />
            <Stat label="Days to next birthday" value={String(res.daysToBd)}
              hint={res.daysToBd === 0 ? "It's today! 🎂" : undefined} />
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Pick a valid birth date (before the &ldquo;as of&rdquo; date).</p>
      )}
    </div>
  );
}

/* ------------------------------ Date Difference ---------------------------- */

export function DateDiffTool() {
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const res = useMemo(() => {
    if (!from || !to) return null;
    const a = new Date(from + "T00:00:00");
    const b = new Date(to + "T00:00:00");
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    const ms = Math.abs(b.getTime() - a.getTime());
    const days = Math.round(ms / 86400000);
    return {
      days,
      weeks: Math.floor(days / 7),
      remDays: days % 7,
      hours: days * 24,
      minutes: days * 24 * 60,
      months: (days / 30.44).toFixed(1),
    };
  }, [from, to]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dd-from" className={labelCls}>From date</Label>
          <Input id="dd-from" type="date" value={from}
            onChange={(e) => setFrom(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-to" className={labelCls}>To date</Label>
          <Input id="dd-to" type="date" value={to}
            onChange={(e) => setTo(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
        </div>
      </div>
      {res ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 rounded-xl border border-emerald-800/50 bg-emerald-950/25 px-4 py-4 sm:col-span-1">
            <p className={labelCls}>Difference</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {res.days.toLocaleString()} days
            </p>
            <p className="text-xs text-zinc-500">
              = {res.weeks} week{res.weeks !== 1 ? "s" : ""} {res.remDays} day{res.remDays !== 1 ? "s" : ""}
            </p>
          </div>
          <Stat label="≈ Months" value={res.months} />
          <Stat label="Hours" value={res.hours.toLocaleString()} />
          <Stat label="Minutes" value={res.minutes.toLocaleString()} />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Pick both dates.</p>
      )}
    </div>
  );
}
