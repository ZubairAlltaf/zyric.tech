"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputCls, labelCls } from "./hooks";

/* ------------------------------ number to words ------------------------------ */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

export function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "zero";
  const neg = n < 0;
  let rest = Math.floor(Math.abs(n));
  const chunks: number[] = [];
  while (rest > 0) {
    chunks.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i] === 0) continue;
    const c = chunks[i];
    let words = "";
    if (c >= 100) {
      words += `${ONES[Math.floor(c / 100)]} hundred`;
      if (c % 100 !== 0) words += " and ";
    }
    const tail = c % 100;
    if (tail > 0) {
      if (tail < 20) words += ONES[tail];
      else {
        words += TENS[Math.floor(tail / 10)];
        if (tail % 10 !== 0) words += `-${ONES[tail % 10]}`;
      }
    }
    parts.push(`${words}${SCALES[i] ? ` ${SCALES[i]}` : ""}`);
  }
  const words = parts.join(", ");
  return neg ? `minus ${words}` : words;
}

export function NumberWordsTool() {
  const [value, setValue] = useState("1250437.50");
  const [currency, setCurrency] = useState("USD $");

  const parsed = useMemo(() => {
    const v = Number(value.replace(/,/g, ""));
    if (!Number.isFinite(v) || Math.abs(v) >= 1e15) return null;
    return v;
  }, [value]);

  const curLabel = currency.split(" ").slice(1).join(" ") || "";
  const curName: Record<string, string> = {
    "USD $": "dollars", "EUR €": "euros", "GBP £": "pounds", "PKR ₨": "rupees",
    "BDT ৳": "taka", "INR ₹": "rupees", "AED د.إ": "dirhams", "": "",
  };
  const unit = curName[currency] ?? "";

  const words = useMemo(() => {
    if (parsed === null) return null;
    const intPart = Math.floor(Math.abs(parsed));
    const cents = Math.round((Math.abs(parsed) - intPart) * 100);
    let out = numberToWords(intPart);
    if (unit) out += ` ${unit}`;
    if (cents > 0) out += ` and ${numberToWords(cents)} cents`;
    return out;
  }, [parsed, unit]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
        <div className="space-y-1.5">
          <Label htmlFor="nw-val" className={labelCls}>Amount (numbers)</Label>
          <Input
            id="nw-val"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${inputCls} font-mono text-base`}
            placeholder="1250437.50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nw-cur" className={labelCls}>Currency (optional)</Label>
          <select
            id="nw-cur"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`${inputCls} h-9 w-full rounded-md border bg-zinc-900 px-2.5 text-sm`}
          >
            <option value="">None — plain words</option>
            <option value="USD $">USD $</option>
            <option value="EUR €">EUR €</option>
            <option value="GBP £">GBP £</option>
            <option value="PKR ₨">PKR ₨</option>
            <option value="BDT ৳">BDT ৳</option>
            <option value="INR ₹">INR ₹</option>
            <option value="AED د.إ">AED</option>
          </select>
        </div>
      </div>

      {words && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">In words (check-writing style)</p>
          <p className="mt-1 text-lg leading-relaxed text-emerald-300 first-letter:uppercase">{words}</p>
        </div>
      )}
      {parsed === null && value.trim() && (
        <p className="text-xs text-red-400">Enter a valid number (max 999 trillion).</p>
      )}
      <p className="text-xs leading-relaxed text-zinc-600">
        Handy for cheques, invoices and legal contracts — “{curLabel || "amount"} {value}” becomes legally unambiguous
        wording that banks and lawyers expect.
      </p>
    </div>
  );
}
