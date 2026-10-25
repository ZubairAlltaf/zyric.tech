"use client";

import { useMemo, useState } from "react";
import { Percent, Landmark, Users, Tag, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Stat, inputCls, labelCls } from "./hooks";

const money = (n: number, symbol = "$") =>
  Number.isFinite(n)
    ? `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

function NumField({
  id,
  label,
  value,
  onChange,
  prefix,
  step = "any",
  min = "0",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  step?: string;
  min?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={labelCls}>{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">{prefix}</span>
        )}
        <Input
          id={id}
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </div>
  );
}

function ResultBox({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent ? "border-emerald-800/60 bg-emerald-950/30" : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${accent ? "text-emerald-400" : "text-zinc-50"}`}>{value}</p>
    </div>
  );
}

/* ------------------------------ Discount Calculator -------------------------- */

export function DiscountTool() {
  const [price, setPrice] = useState("100");
  const [disc, setDisc] = useState("25");
  const [extraDisc, setExtraDisc] = useState("0");
  const [tax, setTax] = useState("0");

  const r = useMemo(() => {
    const p = Number(price);
    const d1 = Number(disc);
    const d2 = Number(extraDisc);
    const t = Number(tax);
    if (![p, d1, d2, t].every(Number.isFinite)) return null;
    const afterFirst = p * (1 - d1 / 100);
    const afterSecond = afterFirst * (1 - d2 / 100);
    const saved = p - afterSecond;
    const taxAmount = afterSecond * (t / 100);
    return {
      final: afterSecond + taxAmount,
      saved,
      savedPct: p > 0 ? (saved / p) * 100 : 0,
      taxAmount,
      effective: p > 0 ? 100 - (afterSecond / p) * 100 : 0,
    };
  }, [price, disc, extraDisc, tax]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumField id="dc-price" label="Original price" value={price} onChange={setPrice} prefix="$" />
        <NumField id="dc-disc" label="Discount %" value={disc} onChange={setDisc} step="any" />
        <NumField id="dc-extra" label="Extra discount % (stacked)" value={extraDisc} onChange={setExtraDisc} step="any" />
        <NumField id="dc-tax" label="Sales tax / VAT %" value={tax} onChange={setTax} step="any" />
      </div>

      {r && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultBox label="You pay" value={money(r.final)} accent />
            <ResultBox label="You save" value={money(r.saved)} />
            <ResultBox label="Effective discount" value={`${r.effective.toFixed(1)}%`} />
          </div>
          {Number(extraDisc) > 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-xs leading-relaxed text-zinc-400">
              <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" aria-hidden />
              Stacked discounts multiply instead of adding: {disc}% then {extraDisc}% gives{" "}
              {r.effective.toFixed(1)}% off — not {(Number(disc) + Number(extraDisc)).toFixed(0)}%. This is how stores
              actually apply “extra 20% off already-reduced items”.
            </p>
          )}
          {Number(tax) > 0 && (
            <p className="text-xs text-zinc-500">Includes {money(r.taxAmount)} tax applied after discounts.</p>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------- VAT / GST Calculator ------------------------ */

export function VatTool() {
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("17");
  const [addMode, setAddMode] = useState(true);

  const r = useMemo(() => {
    const a = Number(amount);
    const t = Number(rate);
    if (![a, t].every(Number.isFinite)) return null;
    if (addMode) {
      const tax = a * (t / 100);
      return { net: a, tax, gross: a + tax };
    }
    const net = a / (1 + t / 100);
    return { net, tax: a - net, gross: a };
  }, [amount, rate, addMode]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumField id="vat-amount" label={addMode ? "Amount before tax" : "Amount including tax"} value={amount} onChange={setAmount} prefix="$" />
        <NumField id="vat-rate" label="Tax rate (VAT / GST / sales tax)" value={rate} onChange={setRate} step="any" />
      </div>

      <div className="flex gap-2">
        {[
          { mode: true, label: "Add tax", icon: <Landmark className="h-3.5 w-3.5" aria-hidden /> },
          { mode: false, label: "Remove tax", icon: <Percent className="h-3.5 w-3.5" aria-hidden /> },
        ].map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => setAddMode(m.mode)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              addMode === m.mode
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {r && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultBox label="Net (before tax)" value={money(r.net)} />
          <ResultBox label={`Tax (${rate}%)`} value={money(r.tax)} />
          <ResultBox label="Gross (total)" value={money(r.gross)} accent />
        </div>
      )}

      <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 text-xs leading-relaxed text-zinc-500">
        “Remove tax” is the mode you need when a supplier quotes an all-inclusive price and your bookkeeping needs the
        net amount and the tax portion separated — e.g. 120 at 20% VAT means 100 net + 20 tax, not 120 + 24.
      </p>
    </div>
  );
}

/* ---------------------------------- Tip Calculator -------------------------- */

export function TipTool() {
  const [bill, setBill] = useState("85");
  const [tip, setTip] = useState("12.5");
  const [people, setPeople] = useState("2");
  const [roundUp, setRoundUp] = useState(false);

  const r = useMemo(() => {
    const b = Number(bill);
    const t = Number(tip);
    const p = Math.max(1, Math.floor(Number(people) || 1));
    if (![b, t].every(Number.isFinite) || b <= 0) return null;
    const tipAmount = b * (t / 100);
    let total = b + tipAmount;
    let per = total / p;
    if (roundUp) per = Math.ceil(per);
    total = per * p;
    const roundedTip = total - b;
    return { tipAmount, total, per, p, roundedTip };
  }, [bill, tip, people, roundUp]);

  const QUICK = [0, 5, 10, 12.5, 15, 20];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumField id="tip-bill" label="Bill amount" value={bill} onChange={setBill} prefix="$" />
        <NumField id="tip-pct" label="Tip %" value={tip} onChange={setTip} step="any" />
        <NumField id="tip-people" label="Split between" value={people} onChange={setPeople} step="1" min="1" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setTip(String(q))}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              Number(tip) === q
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {q === 0 ? "No tip" : `${q}%`}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-zinc-300">
          <Switch checked={roundUp} onCheckedChange={setRoundUp} aria-label="Round up per person" />
          <Users className="h-3.5 w-3.5 text-teal-400" aria-hidden /> Round up per person
        </label>
      </div>

      {r && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultBox label={`Each pays (${r.p} ${r.p === 1 ? "person" : "people"})`} value={money(r.per)} accent />
            <ResultBox label="Total bill" value={money(r.total)} />
            <ResultBox label={roundUp ? "Tip (after rounding)" : "Tip amount"} value={money(roundUp ? r.roundedTip : r.tipAmount)} />
          </div>
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <Receipt className="h-3.5 w-3.5" aria-hidden />
            {money(r.per)} each covers their share of the {money(Number(bill))} bill plus tip.
          </p>
        </>
      )}
    </div>
  );
}
