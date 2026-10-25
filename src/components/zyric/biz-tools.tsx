"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Printer, FileText, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage, inputCls, labelCls, todayStr, dateStrOffset } from "./hooks";

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

/* -------------------------------- Invoice Generator -------------------------- */

interface LineItem {
  desc: string;
  qty: string;
  rate: string;
}

interface InvoiceData {
  biz: string;
  bizDetails: string;
  client: string;
  clientDetails: string;
  number: string;
  date: string;
  due: string;
  items: LineItem[];
  taxPct: string;
  discountPct: string;
  currency: string;
  notes: string;
}

const DEFAULT_INVOICE: InvoiceData = {
  biz: "",
  bizDetails: "",
  client: "",
  clientDetails: "",
  number: "INV-001",
  date: todayStr(),
  due: dateStrOffset(14),
  items: [{ desc: "", qty: "1", rate: "0" }],
  taxPct: "0",
  discountPct: "0",
  currency: "$",
  notes: "Thank you for your business!",
};

const CURRENCIES = ["$", "€", "£", "₨", "৳", "₹", "AED ", "R$"];

export function InvoiceTool() {
  const [data, setData] = useLocalStorage<InvoiceData>("invoice-data", DEFAULT_INVOICE);
  const set = <K extends keyof InvoiceData>(k: K, v: InvoiceData[K]) => setData({ ...data, [k]: v });

  const totals = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
    const discount = subtotal * ((Number(data.discountPct) || 0) / 100);
    const taxable = subtotal - discount;
    const tax = taxable * ((Number(data.taxPct) || 0) / 100);
    return { subtotal, discount, tax, total: taxable + tax };
  }, [data.items, data.discountPct, data.taxPct]);

  const money = (n: number) =>
    `${data.currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const setItem = (i: number, patch: Partial<LineItem>) => {
    const items = data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    set("items", items);
  };

  const curName: Record<string, string> = {
    "$": "dollars", "€": "euros", "£": "pounds", "₨": "rupees", "৳": "taka", "₹": "rupees", "AED ": "dirhams", "R$": "reais",
  };

  const totalWords = `${numberToWords(Math.floor(totals.total))} ${curName[data.currency] ?? ""}${
    Math.round((totals.total % 1) * 100) > 0 ? ` and ${numberToWords(Math.round((totals.total % 1) * 100))} cents` : ""
  }`.trim();

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="iv-biz" className={labelCls}>From (your business)</Label>
          <Input id="iv-biz" value={data.biz} onChange={(e) => set("biz", e.target.value)} className={inputCls} placeholder="Zyric Studio" />
          <Textarea value={data.bizDetails} onChange={(e) => set("bizDetails", e.target.value)} rows={2} className={`${inputCls} text-xs`} placeholder="Address, email, tax number…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-client" className={labelCls}>Bill to (client)</Label>
          <Input id="iv-client" value={data.client} onChange={(e) => set("client", e.target.value)} className={inputCls} placeholder="Acme Ltd" />
          <Textarea value={data.clientDetails} onChange={(e) => set("clientDetails", e.target.value)} rows={2} className={`${inputCls} text-xs`} placeholder="Client address, email…" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="iv-num" className={labelCls}>Invoice #</Label>
          <Input id="iv-num" value={data.number} onChange={(e) => set("number", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-date" className={labelCls}>Date</Label>
          <Input id="iv-date" type="date" value={data.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-due" className={labelCls}>Due date</Label>
          <Input id="iv-due" type="date" value={data.due} onChange={(e) => set("due", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-cur" className={labelCls}>Currency</Label>
          <select id="iv-cur" value={data.currency} onChange={(e) => set("currency", e.target.value)} className={`${inputCls} h-9 w-full rounded-md border bg-zinc-900 px-2.5 text-sm`}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c.trim() || "AED"}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <FileText className="h-4 w-4 text-emerald-400" aria-hidden /> Line items
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => set("items", [...data.items, { desc: "", qty: "1", rate: "0" }])}
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add item
          </Button>
        </div>
        <div className="space-y-2">
          {data.items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_90px_32px] items-center gap-2">
              <Input value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} className={`${inputCls} text-sm`} placeholder={`Description ${i + 1}`} aria-label={`Item ${i + 1} description`} />
              <Input type="number" min="0" step="any" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} className={`${inputCls} text-sm`} placeholder="Qty" aria-label={`Item ${i + 1} quantity`} />
              <Input type="number" min="0" step="any" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} className={`${inputCls} text-sm`} placeholder="Rate" aria-label={`Item ${i + 1} rate`} />
              <button
                type="button"
                aria-label={`Remove item ${i + 1}`}
                onClick={() => set("items", data.items.filter((_, idx) => idx !== i))}
                disabled={data.items.length === 1}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="iv-disc" className={labelCls}>Discount %</Label>
          <Input id="iv-disc" type="number" min="0" step="any" value={data.discountPct} onChange={(e) => set("discountPct", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-tax" className={labelCls}>Tax / VAT %</Label>
          <Input id="iv-tax" type="number" min="0" step="any" value={data.taxPct} onChange={(e) => set("taxPct", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-notes" className={labelCls}>Notes on invoice</Label>
          <Input id="iv-notes" value={data.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} placeholder="Payment terms, bank details…" />
        </div>
      </div>

      {/* Invoice sheet */}
      <div className="print-area rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-zinc-100 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <p className="text-xl font-bold">{data.biz || "Your business name"}</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">{data.bizDetails}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-tight text-emerald-400">INVOICE</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-sm text-zinc-300">
              <Hash className="h-3 w-3" aria-hidden /> {data.number || "—"}
            </p>
            <p className="text-xs text-zinc-500">Issued {data.date} · Due {data.due}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Bill to</p>
          <p className="mt-1 font-semibold">{data.client || "Client name"}</p>
          <p className="whitespace-pre-wrap text-xs text-zinc-400">{data.clientDetails}</p>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, i) => (
              <tr key={i} className="border-b border-zinc-800/60">
                <td className="py-2 pr-2">{it.desc || `Item ${i + 1}`}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{it.qty}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{money(Number(it.rate) || 0)}</td>
                <td className="py-2 text-right tabular-nums">{money((Number(it.qty) || 0) * (Number(it.rate) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto max-w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span className="tabular-nums">{money(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-zinc-400">
              <span>Discount ({data.discountPct}%)</span>
              <span className="tabular-nums">−{money(totals.discount)}</span>
            </div>
          )}
          {totals.tax > 0 && (
            <div className="flex justify-between text-zinc-400">
              <span>Tax ({data.taxPct}%)</span>
              <span className="tabular-nums">{money(totals.tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-700 pt-2 text-base font-bold">
            <span>Total due</span>
            <span className="tabular-nums text-emerald-400">{money(totals.total)}</span>
          </div>
          <p className="pt-1 text-[11px] italic text-zinc-500 first-letter:uppercase">{totalWords} only</p>
        </div>

        {data.notes && (
          <p className="mt-5 border-t border-zinc-800 pt-3 text-xs text-zinc-400">{data.notes}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => window.print()} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
          <Printer className="h-4 w-4" aria-hidden /> Print / Save as PDF
        </Button>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <Switch checked={true} disabled aria-label="Autosave enabled" /> Auto-saved in this browser — come back anytime
        </label>
      </div>
    </div>
  );
}
