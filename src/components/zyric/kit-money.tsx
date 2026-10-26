"use client";

/* ==========================================================================
   KIT: MONEY & FINANCE — 20 calculators that keep every cent on your device.
   ========================================================================== */

import { useMemo, useState } from "react";
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
  Split,
  Tag,
  accentOf,
  money,
  pct,
} from "./kit";

function num(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------ 1. Compound interest ----------------------- */

export function CompoundInterestTool() {
  const A = accentOf(0);
  const [p, setP] = useState("10000");
  const [r, setR] = useState("8");
  const [y, setY] = useState("10");
  const [mo, setMo] = useState("100");
  const res = useMemo(() => {
    const rate = num(r) / 100 / 12;
    const months = num(y) * 12;
    let bal = num(p);
    let contributed = num(p);
    for (let i = 0; i < months; i++) {
      bal = bal * (1 + rate) + num(mo);
      contributed += num(mo);
    }
    return { bal, contributed, earned: bal - contributed };
  }, [p, r, y, mo]);
  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Field label="Starting amount" value={p} onChange={setP} type="number" />
            <Field label="Monthly deposit" value={mo} onChange={setMo} type="number" />
            <Row><Field label="Annual return %" value={r} onChange={setR} type="number" className="flex-1" /><Field label="Years" value={y} onChange={setY} type="number" className="flex-1" /></Row>
          </div>
        }
        right={
          <div className="space-y-3">
            <BigStat label="Final balance" value={money(res.bal)} accent={A} />
            <Grid cols={2}>
              <BigStat label="You put in" value={money(res.contributed)} accent="#7FC8FF" />
              <BigStat label="Growth (free money)" value={money(res.earned)} accent="#5EE39A" />
            </Grid>
            <Meter value={res.earned} max={Math.max(1, res.bal)} accent="#5EE39A" label="growth share" right={pct((res.earned / Math.max(1, res.bal)) * 100)} />
          </div>
        }
      />
      <Note>Monthly compounding. The dark art: time in the market usually beats size of deposits — watch the green share grow with the years slider.</Note>
    </div>
  );
}

/* ------------------------------ 2. Savings goal ---------------------------- */

export function SavingsGoalTool() {
  const A = accentOf(1);
  const [goal, setGoal] = useState("5000");
  const [have, setHave] = useState("1200");
  const [mo, setMo] = useState("250");
  const months = num(mo) > 0 ? Math.ceil((num(goal) - num(have)) / num(mo)) : 0;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return (
    <div className="space-y-4">
      <Split left={
        <div className="space-y-3">
          <Field label="Goal amount" value={goal} onChange={setGoal} type="number" />
          <Field label="Already saved" value={have} onChange={setHave} type="number" />
          <Field label="Monthly contribution" value={mo} onChange={setMo} type="number" />
        </div>
      } right={
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-7">
            <p className="mono-kicker text-zinc-500">time to finish line</p>
            <p className="mt-1 font-brut text-4xl" style={{ color: A }}>{months > 0 ? `${yrs ? `${yrs}y ` : ""}${rem}m` : "done!"}</p>
            <p className="mt-1 font-mono text-xs text-zinc-600">{months} payments</p>
          </div>
          <Meter value={num(have)} max={Math.max(1, num(goal))} accent={A} label="progress" right={pct((num(have) / Math.max(1, num(goal))) * 100, 0)} />
          <KV k="still needed" v={money(Math.max(0, num(goal) - num(have)))} accent={A} />
        </div>
      } />
      <Note>Simple linear math on purpose — no forecast voodoo, just the honest calendar answer.</Note>
    </div>
  );
}

/* ------------------------------ 3. Retirement ------------------------------ */

export function RetirementTool() {
  const A = accentOf(2);
  const [age, setAge] = useState("30");
  const [retire, setRetire] = useState("65");
  const [bal, setBal] = useState("25000");
  const [mo, setMo] = useState("500");
  const [r, setR] = useState("7");
  const res = useMemo(() => {
    const rate = num(r) / 100 / 12;
    const months = Math.max(0, (num(retire) - num(age)) * 12);
    let b = num(bal);
    for (let i = 0; i < months; i++) b = b * (1 + rate) + num(mo);
    return { b, months };
  }, [age, retire, bal, mo, r]);
  const nest = res.b;
  const income = nest > 0 ? (nest * 0.04) / 12 : 0;
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Current age" value={age} onChange={setAge} type="number" />
        <Field label="Retire at" value={retire} onChange={setRetire} type="number" />
        <Field label="Current balance" value={bal} onChange={setBal} type="number" />
        <Field label="Monthly saving" value={mo} onChange={setMo} type="number" />
      </Grid>
      <Row><Field label="Expected annual return %" value={r} onChange={setR} type="number" className="flex-1" /></Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">projected nest egg at {retire}</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{money(nest, "")}</p>
        <p className="mt-2 font-mono text-xs text-zinc-500">≈ {money(income)}/month forever at a 4% withdrawal rate</p>
      </div>
      <Note>Compounded monthly at your assumed return. The 4% rule is a classic (imperfect) rule of thumb — treat it as a compass, not a promise.</Note>
    </div>
  );
}

/* ------------------------------ 4. Mortgage amortization ------------------- */

export function MortgageTool() {
  const A = accentOf(3);
  const [price, setPrice] = useState("300000");
  const [down, setDown] = useState("60000");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("30");
  const res = useMemo(() => {
    const principal = Math.max(0, num(price) - num(down));
    const n = num(years) * 12;
    const i = num(rate) / 100 / 12;
    const pmt = i > 0 ? (principal * i) / (1 - Math.pow(1 + i, -n)) : principal / Math.max(1, n);
    const total = pmt * n;
    return { principal, pmt, total, interest: total - principal };
  }, [price, down, rate, years]);
  const milestones = useMemo(() => {
    const n = num(years) * 12;
    const i = num(rate) / 100 / 12;
    const bal0 = res.principal;
    const out: { year: number; paidPct: number }[] = [];
    let bal = bal0;
    let paid = 0;
    for (let m = 1; m <= n; m++) {
      const interest = bal * i;
      paid += res.pmt - interest;
      bal = bal + interest - res.pmt;
      if (m % 60 === 0 || m === n) out.push({ year: Math.round(m / 12), paidPct: (paid / bal0) * 100 });
    }
    return out;
  }, [res, rate, years]);
  return (
    <div className="space-y-4">
      <Grid cols={4}>
        <Field label="Home price" value={price} onChange={setPrice} type="number" />
        <Field label="Down payment" value={down} onChange={setDown} type="number" />
        <Field label="Rate %" value={rate} onChange={setRate} type="number" step="0.1" />
        <Field label="Years" value={years} onChange={setYears} type="number" />
      </Grid>
      <Grid cols={3}>
        <BigStat label="Monthly payment" value={money(res.pmt)} accent={A} />
        <BigStat label="Loan amount" value={money(res.principal)} accent="#7FC8FF" />
        <BigStat label="Total interest" value={money(res.interest)} accent="#FF8A7A" />
      </Grid>
      <Panel title="principal paid by year" accent={A}>
        <div className="space-y-2">
          {milestones.map((m) => (
            <Meter key={m.year} value={m.paidPct} max={100} accent={A} label={`Year ${m.year}`} right={pct(m.paidPct, 0)} />
          ))}
        </div>
      </Panel>
      <Note>Early payments are mostly interest — the bars crawl, then fly. Extra principal in year one is worth triple in year twenty.</Note>
    </div>
  );
}

/* ------------------------------ 5. Rent vs buy ----------------------------- */

export function RentVsBuyTool() {
  const A = accentOf(4);
  const [rent, setRent] = useState("1800");
  const [price, setPrice] = useState("350000");
  const [down, setDown] = useState("70000");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("7");
  const res = useMemo(() => {
    const principal = num(price) - num(down);
    const n = num(years) * 12;
    const i = num(rate) / 100 / 12;
    const pmt = i > 0 ? (principal * i) / (1 - Math.pow(1 + i, -n)) : 0;
    const buyCost = num(down) + pmt * n + num(price) * 0.03; // +3% running costs
    const rentCost = num(rent) * n * 1.03; // +3% rent growth avg
    const equity = Math.max(0, num(price) * (1 + 0.03) ** num(years) - principal * 0.85);
    return { buyCost, rentCost, pmt, equity, buyNet: buyCost - equity };
  }, [rent, price, down, rate, years]);
  const buyWins = res.buyNet < res.rentCost;
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Monthly rent" value={rent} onChange={setRent} type="number" />
        <Field label="Home price" value={price} onChange={setPrice} type="number" />
        <Field label="Down payment" value={down} onChange={setDown} type="number" />
        <Field label="Rate % (mortgage)" value={rate} onChange={setRate} type="number" step="0.1" />
      </Grid>
      <Field label="Years staying put" value={years} onChange={setYears} type="number" />
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 text-center">
        <p className="mono-kicker text-zinc-500">verdict over {years} years</p>
        <p className="mt-2 font-brut text-3xl" style={{ color: buyWins ? "#5EE39A" : "#FF8A7A" }}>{buyWins ? "BUYING WINS" : "RENTING WINS"}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-zinc-800 p-3"><p className="mono-kicker text-zinc-500">true buy cost (after equity)</p><p className="mt-1 text-xl font-black" style={{ color: A }}>{money(res.buyNet)}</p></div>
          <div className="rounded border border-zinc-800 p-3"><p className="mono-kicker text-zinc-500">total rent paid</p><p className="mt-1 text-xl font-black text-zinc-200">{money(res.rentCost)}</p></div>
        </div>
      </div>
      <Note>Assumes 3%/yr home appreciation, 3% running costs, and ~15% principal paid over the window. Moving often flips the math to renting fast.</Note>
    </div>
  );
}

/* ------------------------------ 6. Salary → hourly ------------------------- */

export function SalaryHourlyTool() {
  const A = accentOf(5);
  const [salary, setSalary] = useState("65000");
  const [hours, setHours] = useState("40");
  const [weeks, setWeeks] = useState("52");
  const [vacation, setVacation] = useState("15");
  const effWeeks = Math.max(1, num(weeks) - num(vacation) / 5);
  const hourly = num(salary) / (effWeeks * num(hours));
  return (
    <div className="space-y-4">
      <Grid cols={4}>
        <Field label="Annual salary" value={salary} onChange={setSalary} type="number" />
        <Field label="Hours / week" value={hours} onChange={setHours} type="number" />
        <Field label="Weeks / year" value={weeks} onChange={setWeeks} type="number" />
        <Field label="Vacation days" value={vacation} onChange={setVacation} type="number" />
      </Grid>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">your time is worth</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{money(hourly)}</p>
        <p className="font-mono text-xs text-zinc-500">per hour · {effWeeks.toFixed(0)} working weeks</p>
      </div>
      <Grid cols={4}>
        <BigStat label="Per day" value={money(hourly * num(hours))} accent="#7FC8FF" />
        <BigStat label="Per week" value={money(hourly * num(hours) * 5)} accent="#5EE39A" />
        <BigStat label="Per month" value={money(num(salary) / 12)} accent="#FF9DE2" />
        <BigStat label="Per minute" value={money(hourly / 60)} accent="#B9A6FF" />
      </Grid>
      <Note>Vacation days shrink your real hourly rate — salaried folk often underestimate this.</Note>
    </div>
  );
}

/* ------------------------------ 7. Freelance rate -------------------------- */

export function FreelanceRateTool() {
  const A = accentOf(6);
  const [target, setTarget] = useState("60000");
  const [weeks, setWeeks] = useState("46");
  const [billable, setBillable] = useState("60");
  const [expenses, setExpenses] = useState("8000");
  const [tax, setTax] = useState("30");
  const res = useMemo(() => {
    const grossNeeded = (num(target) + num(expenses)) / (1 - num(tax) / 100);
    const billableHours = num(weeks) * 40 * (num(billable) / 100);
    return { grossNeeded, billableHours, rate: billableHours > 0 ? grossNeeded / billableHours : 0 };
  }, [target, weeks, billable, expenses, tax]);
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Take-home target" value={target} onChange={setTarget} type="number" />
        <Field label="Business expenses / yr" value={expenses} onChange={setExpenses} type="number" />
        <Field label="Working weeks" value={weeks} onChange={setWeeks} type="number" />
        <Field label="Billable % of hours" value={billable} onChange={setBillable} type="number" />
      </Grid>
      <Field label="Tax + insurance %" value={tax} onChange={setTax} type="number" />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">minimum hourly rate</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{money(res.rate)}</p>
        <p className="mt-1 font-mono text-xs text-zinc-500">{Math.round(res.billableHours)} billable hours × {money(res.rate)}</p>
      </div>
      <Panel title="the chain" accent={A}>
        <KV k="gross revenue needed" v={money(res.grossNeeded)} accent={A} />
        <KV k="billable hours available" v={`${Math.round(res.billableHours)} h`} />
        <KV k="non-billable reality" v={pct(100 - num(billable), 0) + " of your week"} accent="#FF8A7A" />
      </Panel>
    </div>
  );
}

/* ------------------------------ 8. 50/30/20 budget ------------------------- */

export function BudgetSplitTool() {
  const A = accentOf(7);
  const [income, setIncome] = useState("4000");
  const [needs, setNeeds] = useState("2200");
  const [wants, setWants] = useState("900");
  const [savings, setSavings] = useState("400");
  const take = num(income);
  const buckets = [
    { label: "Needs 50%", v: num(needs), cap: take * 0.5, c: "#5EE39A" },
    { label: "Wants 30%", v: num(wants), cap: take * 0.3, c: "#FFD43B" },
    { label: "Savings 20%", v: num(savings), cap: take * 0.2, c: "#7FC8FF" },
  ];
  const spent = num(needs) + num(wants) + num(savings);
  return (
    <div className="space-y-4">
      <Field label="Monthly take-home" value={income} onChange={setIncome} type="number" />
      <Grid cols={3}>
        <Field label="Needs (rent, food, bills)" value={needs} onChange={setNeeds} type="number" />
        <Field label="Wants (fun, dining)" value={wants} onChange={setWants} type="number" />
        <Field label="Savings & debt" value={savings} onChange={setSavings} type="number" />
      </Grid>
      <Panel title="your split vs the classic 50/30/20" accent={A}>
        <div className="space-y-3">
          {buckets.map((b) => (
            <div key={b.label}>
              <Meter value={b.v} max={Math.max(1, b.cap)} accent={b.v <= b.cap ? b.c : "#FF8A7A"} label={b.label} right={`${money(b.v)} / ${money(b.cap)}`} />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <KV k="allocated" v={money(spent)} />
          <KV k={spent > take ? "OVER budget by" : "left unassigned"} v={money(Math.abs(take - spent))} accent={spent > take ? "#FF8A7A" : "#5EE39A"} />
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------ 9. Roommate rent splitter ------------------ */

export function RentSplitterTool() {
  const A = accentOf(8);
  const [rent, setRent] = useState("2400");
  const [people, setPeople] = useState(3);
  const [weights, setWeights] = useState<number[]>([1, 1, 1]);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const shares = weights.map((w) => (w / total) * num(rent));
  const setP = (n: number) => {
    setPeople(n);
    setWeights((w) => (n > w.length ? [...w, ...Array(n - w.length).fill(1)] : w.slice(0, n)));
  };
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Total rent" value={rent} onChange={setRent} type="number" className="flex-1" />
        <Slider label="Roommates" value={people} onChange={setP} min={2} max={6} accent={A} />
      </Row>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {weights.map((w, i) => (
          <Panel key={i} title={`Room ${i + 1} — weight ${w}`} accent={A}>
            <Slider label="Fairness weight" value={w} onChange={(v) => setWeights((ws) => ws.map((x, j) => (j === i ? v : x)))} min={1} max={5} accent={A} />
            <p className="mt-3 text-center font-brut text-3xl" style={{ color: A }}>{money(shares[i], "")}</p>
            <p className="text-center font-mono text-[10px] text-zinc-500">per month</p>
          </Panel>
        ))}
      </div>
      <Note>Weight 2 = pays double (bigger room, own bathroom). Weights normalize, so totals always match the rent exactly.</Note>
    </div>
  );
}

/* ------------------------------ 10. Subscription audit --------------------- */

type Sub = { id: number; name: string; price: number };
export function SubscriptionAuditTool() {
  const A = accentOf(9);
  const [subs, setSubs] = useState<Sub[]>([
    { id: 1, name: "Streaming", price: 15 },
    { id: 2, name: "Music", price: 11 },
    { id: 3, name: "Cloud storage", price: 3 },
  ]);
  const monthly = subs.reduce((a, s) => a + s.price, 0);
  const yearly = monthly * 12;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {subs.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <input value={s.name} onChange={(e) => setSubs((x) => x.map((y) => (y.id === s.id ? { ...y, name: e.target.value } : y)))} className="min-w-0 flex-1 border-none bg-transparent text-sm text-zinc-100 focus:outline-none" placeholder="Service" />
            <span className="font-mono text-xs text-zinc-500">$</span>
            <input type="number" value={s.price} onChange={(e) => setSubs((x) => x.map((y) => (y.id === s.id ? { ...y, price: parseFloat(e.target.value) || 0 } : y)))} className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm text-zinc-100 focus:outline-none" />
            <button type="button" onClick={() => setSubs((x) => x.filter((y) => y.id !== s.id))} className="px-1 font-mono text-xs text-zinc-600 hover:text-rose-400" aria-label="remove">✕</button>
          </div>
        ))}
      </div>
      <Btn accent={A} onClick={() => setSubs((x) => [...x, { id: Date.now(), name: "", price: 0 }])}>+ Add subscription</Btn>
      <Grid cols={3}>
        <BigStat label="Monthly bleed" value={money(monthly)} accent={A} />
        <BigStat label="Yearly bleed" value={money(yearly)} accent="#FF8A7A" />
        <BigStat label="5-year bleed" value={money(yearly * 5)} accent="#FF9DE2" />
      </Grid>
      <Note>Cancelled one? Ring-fence the same amount into savings for a month — that is your “raise”.</Note>
    </div>
  );
}

/* ------------------------------ 11. Debt snowball -------------------------- */

type Debt = { id: number; name: string; bal: number; apr: number; min: number };
export function DebtSnowballTool() {
  const A = accentOf(10);
  const [debts, setDebts] = useState<Debt[]>([
    { id: 1, name: "Credit card", bal: 3200, apr: 22, min: 95 },
    { id: 2, name: "Store card", bal: 850, apr: 28, min: 35 },
    { id: 3, name: "Personal loan", bal: 5400, apr: 11, min: 180 },
  ]);
  const [extra, setExtra] = useState("150");
  const plan = useMemo(() => {
    const list = debts.map((d) => ({ ...d })).filter((d) => d.bal > 0);
    list.sort((a, b) => a.bal - b.bal); // snowball = smallest first
    let month = 0;
    let budget = debts.reduce((a, d) => a + d.min, 0) + num(extra);
    let totalInterest = 0;
    while (list.some((d) => d.bal > 0) && month < 600) {
      month++;
      let pool = budget;
      for (const d of list) {
        if (d.bal <= 0) continue;
        const interest = (d.bal * (d.apr / 100)) / 12;
        totalInterest += interest;
        d.bal += interest;
      }
      for (const d of list) {
        if (d.bal <= 0 || pool <= 0) continue;
        const pay = Math.min(pool, Math.max(d.min, pool * 0.9));
        d.bal -= pay;
        pool -= pay;
      }
    }
    return { months: month, interest: totalInterest };
  }, [debts, extra]);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {debts.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <input value={d.name} onChange={(e) => setDebts((x) => x.map((y) => (y.id === d.id ? { ...y, name: e.target.value } : y)))} className="min-w-0 flex-1 border-none bg-transparent text-sm text-zinc-100 focus:outline-none" />
            <input type="number" value={d.bal} onChange={(e) => setDebts((x) => x.map((y) => (y.id === d.id ? { ...y, bal: parseFloat(e.target.value) || 0 } : y)))} className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm text-zinc-100 focus:outline-none" title="balance" />
            <input type="number" value={d.apr} onChange={(e) => setDebts((x) => x.map((y) => (y.id === d.id ? { ...y, apr: parseFloat(e.target.value) || 0 } : y)))} className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm text-zinc-100 focus:outline-none" title="APR %" />
            <input type="number" value={d.min} onChange={(e) => setDebts((x) => x.map((y) => (y.id === d.id ? { ...y, min: parseFloat(e.target.value) || 0 } : y)))} className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm text-zinc-100 focus:outline-none" title="minimum payment" />
          </div>
        ))}
      </div>
      <Field label="Extra payment per month" value={extra} onChange={setExtra} type="number" />
      <Grid cols={3}>
        <BigStat label="Debt-free in" value={plan.months} unit="mo" accent={A} />
        <BigStat label="Interest paid" value={money(plan.interest)} accent="#FF8A7A" />
        <BigStat label="Total monthly" value={money(debts.reduce((a, d) => a + d.min, 0) + num(extra))} accent="#7FC8FF" />
      </Grid>
      <Note>Smallest-balance-first (snowball). Every freed minimum rolls into the next debt — momentum is the strategy.</Note>
    </div>
  );
}

/* ------------------------------ 12. Card minimum trap ---------------------- */

export function CardMinimumTool() {
  const A = accentOf(11);
  const [bal, setBal] = useState("4500");
  const [apr, setApr] = useState("22");
  const [mode, setMode] = useState<"min" | "fixed">("min");
  const [fixed, setFixed] = useState("200");
  const sim = useMemo(() => {
    let b = num(bal);
    const i = num(apr) / 100 / 12;
    let months = 0;
    let paid = 0;
    while (b > 0 && months < 1200) {
      months++;
      const pay = mode === "min" ? Math.max(25, b * 0.02) : Math.min(num(fixed), b + b * i);
      const interest = b * i;
      paid += Math.min(pay, b + interest);
      b = b + interest - pay;
    }
    return { months, paid };
  }, [bal, apr, mode, fixed]);
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Card balance" value={bal} onChange={setBal} type="number" />
        <Field label="APR %" value={apr} onChange={setApr} type="number" step="0.1" />
      </Grid>
      <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "min" as const, label: "Pay 2% minimum" }, { v: "fixed" as const, label: "Pay fixed amount" }]} />
      {mode === "fixed" ? <Field label="Fixed monthly payment" value={fixed} onChange={setFixed} type="number" /> : null}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 text-center">
        <p className="font-brut text-4xl" style={{ color: sim.months >= 1200 ? "#FF8A7A" : A }}>
          {sim.months >= 1200 ? "never (math says 100+ yrs)" : `${sim.months} months`}
        </p>
        <p className="mt-2 font-mono text-xs text-zinc-500">total paid: {money(sim.paid)} · interest: {money(Math.max(0, sim.paid - num(bal)))}</p>
      </div>
      <Note>The 2% minimum is designed to feel safe and cost you a decade. Bumping the payment is the cheapest raise you will ever give yourself.</Note>
    </div>
  );
}

/* ------------------------------ 13. Inflation ------------------------------ */

export function InflationTool() {
  const A = accentOf(0);
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("3");
  const [years, setYears] = useState("10");
  const loss = num(amount) / Math.pow(1 + num(rate) / 100, num(years));
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Money today" value={amount} onChange={setAmount} type="number" />
        <Field label="Inflation %" value={rate} onChange={setRate} type="number" step="0.1" />
        <Field label="Years" value={years} onChange={setYears} type="number" />
      </Grid>
      <div className="flex items-center justify-center gap-8 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">today</p>
          <p className="mt-1 font-brut text-3xl text-zinc-200">{money(num(amount))}</p>
        </div>
        <span className="font-brut text-2xl text-zinc-600">→</span>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">real buying power in {years}y</p>
          <p className="mt-1 font-brut text-3xl" style={{ color: "#FF8A7A" }}>{money(loss)}</p>
        </div>
      </div>
      <Grid cols={2}>
        <BigStat label="Purchasing power lost" value={pct(((num(amount) - loss) / Math.max(1, num(amount))) * 100)} accent="#FF8A7A" />
        <BigStat label="Value evaporated" value={money(num(amount) - loss)} accent={A} />
      </Grid>
      <Note>Cash under the mattress is a slow leak. At 3% inflation, prices double roughly every 24 years.</Note>
    </div>
  );
}

/* ------------------------------ 14. Margin & markup ------------------------ */

export function MarginTool() {
  const A = accentOf(1);
  const [cost, setCost] = useState("40");
  const [price, setPrice] = useState("100");
  const margin = num(price) > 0 ? ((num(price) - num(cost)) / num(price)) * 100 : 0;
  const markup = num(cost) > 0 ? ((num(price) - num(cost)) / num(cost)) * 100 : 0;
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Cost to you" value={cost} onChange={setCost} type="number" />
        <Field label="Sale price" value={price} onChange={setPrice} type="number" />
      </Grid>
      <div className="flex items-end justify-center gap-8 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">profit margin</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: margin >= 30 ? "#5EE39A" : margin > 0 ? A : "#FF8A7A" }}>{pct(margin)}</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">markup on cost</p>
          <p className="mt-1 font-brut text-4xl text-zinc-200">{pct(markup)}</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">profit / unit</p>
          <p className="mt-1 font-brut text-4xl text-zinc-200">{money(num(price) - num(cost))}</p>
        </div>
      </div>
      <Note>Margin is profit ÷ price, markup is profit ÷ cost — 50% margin = 100% markup. Mixing them up is how shops “profit” themselves broke.</Note>
    </div>
  );
}

/* ------------------------------ 15. Break-even ----------------------------- */

export function BreakEvenTool() {
  const A = accentOf(2);
  const [fixed, setFixed] = useState("5000");
  const [price, setPrice] = useState("50");
  const [unitCost, setUnitCost] = useState("20");
  const units = num(price) - num(unitCost) > 0 ? Math.ceil(num(fixed) / (num(price) - num(unitCost))) : 0;
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Fixed costs / month" value={fixed} onChange={setFixed} type="number" />
        <Field label="Price per unit" value={price} onChange={setPrice} type="number" />
        <Field label="Variable cost / unit" value={unitCost} onChange={setUnitCost} type="number" />
      </Grid>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">break-even point</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{units || "∞"}</p>
        <p className="mt-1 font-mono text-xs text-zinc-500">{units ? `units per month · ${money(units * num(price))} revenue` : "price must exceed unit cost"}</p>
      </div>
      <Grid cols={3}>
        <BigStat label="Margin / unit" value={money(num(price) - num(unitCost))} accent="#5EE39A" />
        <BigStat label="Daily target (÷30)" value={Math.ceil(units / 30)} accent="#7FC8FF" />
        <BigStat label="Revenue at BE" value={money(units * num(price))} accent="#FF9DE2" />
      </Grid>
    </div>
  );
}

/* ------------------------------ 16. ROI ------------------------------------ */

export function RoiTool() {
  const A = accentOf(3);
  const [invested, setInvested] = useState("10000");
  const [returned, setReturned] = useState("14500");
  const [months, setMonths] = useState("18");
  const gain = num(returned) - num(invested);
  const roi = num(invested) > 0 ? (gain / num(invested)) * 100 : 0;
  const annualized = num(months) > 0 ? (Math.pow(1 + Math.max(-0.9999, roi / 100), 12 / num(months)) - 1) * 100 : 0;
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Amount invested" value={invested} onChange={setInvested} type="number" />
        <Field label="Amount returned" value={returned} onChange={setReturned} type="number" />
        <Field label="Holding months" value={months} onChange={setMonths} type="number" />
      </Grid>
      <div className="flex items-end justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">total ROI</p>
          <p className="mt-1 font-brut text-5xl" style={{ color: roi >= 0 ? "#5EE39A" : "#FF8A7A" }}>{pct(roi)}</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">annualized</p>
          <p className="mt-1 font-brut text-5xl text-zinc-200">{pct(annualized)}</p>
        </div>
      </div>
      <KV k="net gain" v={money(gain)} accent={gain >= 0 ? "#5EE39A" : "#FF8A7A"} />
    </div>
  );
}

/* ------------------------------ 17. Crypto profit -------------------------- */

export function CryptoProfitTool() {
  const A = accentOf(4);
  const [qty, setQty] = useState("0.5");
  const [buy, setBuy] = useState("42000");
  const [sell, setSell] = useState("61000");
  const [fee, setFee] = useState("0.5");
  const [taxRate, setTaxRate] = useState("20");
  const res = useMemo(() => {
    const cost = num(qty) * num(buy);
    const gross = num(qty) * num(sell);
    const fees = (cost + gross) * (num(fee) / 100);
    const profit = gross - cost - fees;
    const tax = profit > 0 ? profit * (num(taxRate) / 100) : 0;
    return { cost, gross, fees, profit, tax, net: profit - tax };
  }, [qty, buy, sell, fee, taxRate]);
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Coins held" value={qty} onChange={setQty} type="number" step="0.0001" />
        <Field label="Buy price" value={buy} onChange={setBuy} type="number" />
        <Field label="Sell price" value={sell} onChange={setSell} type="number" />
        <Field label="Exchange fee %" value={fee} onChange={setFee} type="number" step="0.1" />
      </Grid>
      <Field label="Tax on gains %" value={taxRate} onChange={setTaxRate} type="number" />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">after everything, you keep</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: res.net >= 0 ? "#5EE39A" : "#FF8A7A" }}>{money(res.net, "")}</p>
      </div>
      <Panel title="full ledger" accent={A}>
        <KV k="gross exit" v={money(res.gross)} /><KV k="entry cost" v={money(res.cost)} />
        <KV k="fees both ways" v={money(res.fees)} accent="#FF8A7A" /><KV k="estimated tax" v={money(res.tax)} accent="#FF8A7A" />
        <KV k="roi" v={res.cost > 0 ? pct((res.net / res.cost) * 100) : "—"} accent={A} />
      </Panel>
    </div>
  );
}

/* ------------------------------ 18. Stock averaging ------------------------ */

export function StockAverageTool() {
  const A = accentOf(5);
  const [trades, setTrades] = useState([
    { id: 1, qty: 10, price: 120 },
    { id: 2, qty: 15, price: 95 },
  ]);
  const [target, setTarget] = useState("100");
  const totalQty = trades.reduce((a, t) => a + t.qty, 0);
  const totalCost = trades.reduce((a, t) => a + t.qty * t.price, 0);
  const avg = totalQty > 0 ? totalCost / totalQty : 0;
  const pl = (num(target) - avg) * totalQty;
  const needQty = num(target) > 0 ? Math.max(0, Math.ceil(((avg - num(target)) * totalQty) / Math.max(0.01, num(target) - avg) || 0)) : 0;
  void needQty;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {trades.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
            <span className="mono-kicker w-16 text-zinc-500">buy #{t.id}</span>
            <input type="number" value={t.qty} onChange={(e) => setTrades((x) => x.map((y) => (y.id === t.id ? { ...y, qty: parseFloat(e.target.value) || 0 } : y)))} className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm text-zinc-100 focus:outline-none" title="shares" />
            <span className="text-xs text-zinc-600">shares @</span>
            <input type="number" value={t.price} onChange={(e) => setTrades((x) => x.map((y) => (y.id === t.id ? { ...y, price: parseFloat(e.target.value) || 0 } : y)))} className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm text-zinc-100 focus:outline-none" title="price" />
            <button type="button" onClick={() => setTrades((x) => x.filter((y) => y.id !== t.id))} className="px-1 font-mono text-xs text-zinc-600 hover:text-rose-400">✕</button>
          </div>
        ))}
      </div>
      <Btn accent={A} onClick={() => setTrades((x) => [...x, { id: Date.now(), qty: 0, price: 0 }])}>+ Add buy</Btn>
      <Grid cols={3}>
        <BigStat label="Average cost" value={money(avg)} accent={A} />
        <BigStat label="Total shares" value={totalQty} accent="#7FC8FF" />
        <BigStat label="Total invested" value={money(totalCost)} accent="#FF9DE2" />
      </Grid>
      <Field label="Current / target price" value={target} onChange={setTarget} type="number" />
      <BigStat label="Position P/L" value={money(pl)} accent={pl >= 0 ? "#5EE39A" : "#FF8A7A"} hint={`at ${money(num(target))} per share`} />
    </div>
  );
}

/* ------------------------------ 19. Commission ----------------------------- */

export function CommissionTool() {
  const A = accentOf(6);
  const [sales, setSales] = useState("45000");
  const [rate, setRate] = useState("4");
  const [base, setBase] = useState("2000");
  const [tiered, setTiered] = useState(false);
  const res = useMemo(() => {
    const s = num(sales);
    if (!tiered) return { total: s * (num(rate) / 100) + num(base), breakdown: [[`Straight ${num(rate)}% on ${money(s, "")}`, s * (num(rate) / 100)]] as [string, number][] };
    const rows: [string, number][] = [];
    let commission = 0;
    const t1 = Math.min(s, 10000), t2 = Math.min(Math.max(0, s - 10000), 40000), t3 = Math.max(0, s - 50000);
    if (t1 > 0) { rows.push([`First ${money(10000, "")} @ 2%`, t1 * 0.02]); commission += t1 * 0.02; }
    if (t2 > 0) { rows.push([`${money(10000, "")}–${money(50000, "")} @ 5%`, t2 * 0.05]); commission += t2 * 0.05; }
    if (t3 > 0) { rows.push([`Above ${money(50000, "")} @ 8%`, t3 * 0.08]); commission += t3 * 0.08; }
    return { total: commission + num(base), breakdown: rows };
  }, [sales, rate, base, tiered]);
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Sales this period" value={sales} onChange={setSales} type="number" />
        <Field label="Commission %" value={rate} onChange={setRate} type="number" step="0.1" />
        <Field label="Base salary" value={base} onChange={setBase} type="number" />
      </Grid>
      <Seg value={tiered ? "y" : "n"} onChange={(v) => setTiered(v === "y")} accent={A} options={[{ v: "y", label: "Tiered (2/5/8%)" }, { v: "n", label: "Flat rate" }]} />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-7">
        <p className="mono-kicker text-zinc-500">paycheck</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{money(res.total, "")}</p>
      </div>
      <Panel title="how it built up" accent={A}>
        {res.breakdown.map(([k, v]) => <KV key={k} k={k} v={money(v)} />)}
        <KV k="base" v={money(num(base))} />
      </Panel>
    </div>
  );
}

/* ------------------------------ 20. Overtime pay --------------------------- */

export function OvertimeTool() {
  const A = accentOf(7);
  const [rate, setRate] = useState("25");
  const [hours, setHours] = useState("46");
  const [mult, setMult] = useState("1.5");
  const [dt, setDt] = useState("2");
  const reg = Math.min(num(hours), 40);
  const ot = Math.max(0, Math.min(num(hours) - 40, 12));
  const dth = Math.max(0, num(hours) - 52);
  const pay = reg * num(rate) + ot * num(rate) * num(mult) + dth * num(rate) * num(dt);
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Base hourly rate" value={rate} onChange={setRate} type="number" />
        <Field label="Hours worked this week" value={hours} onChange={setHours} type="number" />
      </Grid>
      <Row>
        <Seg value={String(mult)} onChange={(v) => setMult(v)} accent={A} options={[{ v: "1.5", label: "1.5× OT" }, { v: "2", label: "2× OT" }]} />
        <Field label="Double-time after (h)" value={dt} onChange={setDt} type="number" className="w-40" />
      </Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-7">
        <p className="mono-kicker text-zinc-500">gross pay this week</p>
        <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{money(pay, "")}</p>
      </div>
      <Panel title="stacked layers" accent={A}>
        <KV k={`regular ${reg}h`} v={money(reg * num(rate))} />
        <KV k={`overtime ${ot}h @ ${mult}×`} v={money(ot * num(rate) * num(mult))} accent={A} />
        <KV k={`double-time ${dth}h`} v={money(dth * num(rate) * num(dt))} accent="#FF8A7A" />
      </Panel>
      <Note>US-style: 40h regular, OT beyond that, double-time past the cap you set. Adjust to your local rules.</Note>
    </div>
  );
}
