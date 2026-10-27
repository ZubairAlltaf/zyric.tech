"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";
import { inputCls, labelCls, selectTriggerCls, CopyButton } from "./hooks";

/* ---------------------------- Currency Converter --------------------------- */

const RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, PKR: 278, BDT: 120, INR: 84,
  JPY: 150, CAD: 1.36, AUD: 1.52, SAR: 3.75, AED: 3.67, CNY: 7.2,
};
const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", PKR: "₨", BDT: "৳", INR: "₹",
  JPY: "¥", CAD: "C$", AUD: "A$", SAR: "﷼", AED: "د.إ", CNY: "¥",
};

export function CurrencyTool() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("PKR");

  const result = useMemo(() => {
    const v = Number(amount);
    if (!Number.isFinite(v)) return null;
    const f = RATES[from], t = RATES[to];
    return (v / f) * t;
  }, [amount, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-5">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="cur-amt" className={labelCls}>Amount</Label>
          <Input
            id="cur-amt"
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
          />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="From currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {Object.keys(RATES).map((c) => (
                <SelectItem key={c} value={c}>
                  {SYMBOLS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap currencies"
          className="mb-0.5 h-10 w-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/60 hover:bg-zinc-800 hover:text-emerald-300"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </Button>
        <div className="space-y-1.5">
          <Label className={labelCls}>Converted</Label>
          <div className="flex h-9 items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-3">
            {result !== null ? (
              <span className="truncate text-sm font-semibold text-emerald-400">
                {SYMBOLS[to]} {result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-sm text-zinc-600">—</span>
            )}
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="To currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {Object.keys(RATES).map((c) => (
                <SelectItem key={c} value={c}>
                  {SYMBOLS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {result !== null && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center text-sm text-zinc-300">
          {SYMBOLS[from]}{Number(amount).toLocaleString()} {from} ={" "}
          <span className="font-semibold text-emerald-400">
            {SYMBOLS[to]}{result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}
          </span>
          <span className="ml-2 text-xs text-zinc-500">
            (1 {from} ≈ {(RATES[to] / RATES[from]).toFixed(4)} {to})
          </span>
        </div>
      )}
      <p className="text-xs text-zinc-500">
        Offline reference rates for quick estimates — not live market rates. For exact figures
        (transfers, invoicing), check a live source.
      </p>
    </div>
  );
}
