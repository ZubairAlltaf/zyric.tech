"use client";

/*
 * INVOICE PRO — a small-business invoicing app, still 100% client-side.
 * Features: logo upload (auto-downscaled), status stamps (draft/sent/paid),
 * saved-invoice vault with load/duplicate/delete, client picker from history,
 * auto next-invoice-number, line items with reorder, discount/tax/shipping,
 * amount paid + balance due, payment details block, totals in words,
 * JSON backup (export/import all invoices), and print-to-PDF.
 * Migrates the legacy single-invoice "invoice-data" format automatically.
 */

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Printer, FileText, Hash, Upload, Download, Copy, ChevronDown, ChevronUp, BadgeCheck, Save, FolderOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inputCls, labelCls, todayStr, dateStrOffset, uid, selectTriggerCls } from "./hooks";
import { numberToWords } from "./biz-tools";

/* --------------------------------- types ----------------------------------- */

interface LineItem {
  desc: string;
  qty: string;
  rate: string;
}

type Status = "draft" | "sent" | "paid";

interface InvoiceData {
  id: string;
  biz: string;
  bizDetails: string;
  logo: string | null;
  client: string;
  clientDetails: string;
  number: string;
  date: string;
  due: string;
  currency: string;
  status: Status;
  items: LineItem[];
  taxPct: string;
  discountPct: string;
  shipping: string;
  amountPaid: string;
  notes: string;
  paymentDetails: string;
}

const CURRENCIES = ["$", "€", "£", "₨", "৳", "₹", "AED ", "R$"];

const CUR_NAME: Record<string, string> = {
  "$": "dollars", "€": "euros", "£": "pounds", "₨": "rupees", "৳": "taka", "₹": "rupees", "AED ": "dirhams", "R$": "reais",
};

function blankInvoice(): InvoiceData {
  return {
    id: uid(),
    biz: "",
    bizDetails: "",
    logo: null,
    client: "",
    clientDetails: "",
    number: "INV-001",
    date: todayStr(),
    due: dateStrOffset(14),
    items: [{ desc: "", qty: "1", rate: "0" }],
    taxPct: "0",
    discountPct: "0",
    shipping: "0",
    amountPaid: "0",
    currency: "$",
    status: "draft",
    notes: "Thank you for your business!",
    paymentDetails: "",
  };
}

/* ------------------------------- migration --------------------------------- */

const CUR_KEY = "invoice-pro-current";
const VAULT_KEY = "invoice-pro-saved";
const LEGACY_KEY = "invoice-data";

function migrateLegacy(): InvoiceData | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as Partial<InvoiceData>;
    localStorage.removeItem(LEGACY_KEY);
    return { ...blankInvoice(), ...old, id: uid(), logo: old.logo ?? null, status: old.status ?? "draft", shipping: old.shipping ?? "0", amountPaid: old.amountPaid ?? "0", paymentDetails: old.paymentDetails ?? "" };
  } catch {
    return null;
  }
}

function loadInitial(): InvoiceData {
  try {
    const raw = localStorage.getItem(CUR_KEY);
    if (raw) return JSON.parse(raw) as InvoiceData;
  } catch {
    /* fall through */
  }
  return migrateLegacy() ?? blankInvoice();
}

/* --------------------------------- component ------------------------------- */

export function InvoiceTool() {
  const [data, setData] = useState<InvoiceData>(loadInitial);
  const [vault, setVault] = useState<InvoiceData[]>(() => {
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      return raw ? (JSON.parse(raw) as InvoiceData[]) : [];
    } catch {
      return [];
    }
  });
  const [flash, setFlash] = useState("");

  // persist current invoice (logo excluded from the localStorage write to stay light)
  useEffect(() => {
    try {
      localStorage.setItem(CUR_KEY, JSON.stringify({ ...data, logo: data.logo && data.logo.length > 8000 ? null : data.logo }));
    } catch {
      /* ignore */
    }
  }, [data]);

  const set = <K extends keyof InvoiceData>(k: K, v: InvoiceData[K]) => setData((d) => ({ ...d, [k]: v }));

  const money = (n: number) =>
    `${data.currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totals = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
    const discount = subtotal * ((Number(data.discountPct) || 0) / 100);
    const taxable = subtotal - discount;
    const tax = taxable * ((Number(data.taxPct) || 0) / 100);
    const shipping = Number(data.shipping) || 0;
    const total = taxable + tax + shipping;
    const paid = Number(data.amountPaid) || 0;
    return { subtotal, discount, tax, shipping, total, paid, balance: total - paid };
  }, [data.items, data.discountPct, data.taxPct, data.shipping, data.amountPaid]);

  const totalWords = `${numberToWords(Math.floor(totals.total))} ${CUR_NAME[data.currency] ?? ""}${
    Math.round((totals.total % 1) * 100) > 0 ? ` and ${numberToWords(Math.round((totals.total % 1) * 100))} cents` : ""
  }`.trim();

  const setItem = (i: number, patch: Partial<LineItem>) =>
    set("items", data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const moveItem = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= data.items.length) return;
    const items = [...data.items];
    [items[i], items[j]] = [items[j], items[i]];
    set("items", items);
  };

  const nextNumber = () => {
    const m = data.number.match(/^(.*?)(\d+)$/);
    if (!m) return;
    const next = String(Number(m[2]) + 1).padStart(m[2].length, "0");
    set("number", `${m[1]}${next}`);
  };

  const say = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2200);
  };

  /* ------------------------------ vault actions ---------------------------- */

  const saveToVault = () => {
    const entry: InvoiceData = { ...data, id: uid(), logo: data.logo && data.logo.length > 60000 ? null : data.logo };
    const next = [entry, ...vault].slice(0, 30);
    setVault(next);
    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify(next));
    } catch {
      say("Storage full — invoice saved without logo");
      return;
    }
    say("Saved to your invoice vault");
  };

  const loadFromVault = (id: string) => {
    const found = vault.find((v) => v.id === id);
    if (found) {
      setData({ ...found, id: uid() });
      say("Loaded — current invoice replaced");
    }
  };

  const duplicateVault = (id: string) => {
    const found = vault.find((v) => v.id === id);
    if (!found) return;
    const copy = { ...found, id: uid(), status: "draft" as Status, number: found.number + "-COPY" };
    const next = [copy, ...vault];
    setVault(next);
    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const deleteVault = (id: string) => {
    const next = vault.filter((v) => v.id !== id);
    setVault(next);
    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ current: data, vault }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.download = `zyric-invoices-${todayStr()}.json`;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importAll = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { current?: InvoiceData; vault?: InvoiceData[] };
        if (parsed.current) setData(parsed.current);
        if (Array.isArray(parsed.vault)) {
          const merged = [...parsed.vault, ...vault.filter((v) => !parsed.vault?.some((p) => p.id === v.id))].slice(0, 30);
          setVault(merged);
          try {
            localStorage.setItem(VAULT_KEY, JSON.stringify(merged));
          } catch {
            /* ignore */
          }
        }
        say("Backup restored");
      } catch {
        say("That file isn't a Zyric invoice backup");
      }
    };
    reader.readAsText(f);
  };

  /* ------------------------------- logo upload ----------------------------- */

  const onLogo = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 320;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        set("logo", canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  };

  /* ------------------------------ client history --------------------------- */

  const clientHistory = useMemo(() => {
    const names = new Set<string>();
    vault.forEach((v) => v.client.trim() && names.add(v.client.trim()));
    if (data.client.trim()) names.delete(data.client.trim());
    return [...names].slice(0, 8);
  }, [vault, data.client]);

  const statusStyle: Record<Status, string> = {
    draft: "border-zinc-500 text-zinc-400",
    sent: "border-amber-500 text-amber-400",
    paid: "border-emerald-500 text-emerald-400",
  };

  return (
    <div className="space-y-5">
      {/* vault bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <FolderOpen className="h-4 w-4 text-emerald-400" aria-hidden />
        <span className="text-sm font-semibold text-zinc-100">Vault: {vault.length} saved</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={saveToVault} className="h-8 border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
            <Save className="h-3.5 w-3.5" aria-hidden /> Save copy
          </Button>
          <Button variant="outline" size="sm" onClick={exportAll} className="h-8 border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
            <Download className="h-3.5 w-3.5" aria-hidden /> Backup
          </Button>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-300 hover:bg-zinc-800">
            <Upload className="h-3.5 w-3.5" aria-hidden /> Restore
            <input type="file" accept="application/json" className="hidden" onChange={(e) => importAll(e.target.files?.[0])} aria-label="Restore invoice backup" />
          </label>
        </div>
        {vault.length > 0 && (
          <div className="flex w-full flex-wrap gap-1.5 pt-1">
            {vault.slice(0, 8).map((v) => (
              <span key={v.id} className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-3 pr-1.5 text-xs text-zinc-300">
                <button type="button" onClick={() => loadFromVault(v.id)} className="hover:text-emerald-300" aria-label={`Load invoice ${v.number}`}>
                  <span className="font-medium">{v.number}</span>
                  {v.client && <span className="text-zinc-500"> · {v.client.slice(0, 18)}</span>}
                  <span className={`ml-1.5 text-[10px] uppercase ${v.status === "paid" ? "text-emerald-400" : v.status === "sent" ? "text-amber-400" : "text-zinc-600"}`}>{v.status}</span>
                </button>
                <button type="button" onClick={() => duplicateVault(v.id)} aria-label={`Duplicate ${v.number}`} className="rounded-full p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200">
                  <Copy className="h-3 w-3" aria-hidden />
                </button>
                <button type="button" onClick={() => deleteVault(v.id)} aria-label={`Delete ${v.number}`} className="rounded-full p-1 text-zinc-600 hover:bg-zinc-800 hover:text-red-400">
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}
        {flash && <p className="w-full text-xs text-emerald-400">{flash}</p>}
      </div>

      {/* parties */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="iv-biz" className={labelCls}>From (your business)</Label>
          <Input id="iv-biz" value={data.biz} onChange={(e) => set("biz", e.target.value)} className={inputCls} placeholder="Zyric Studio" />
          <Textarea value={data.bizDetails} onChange={(e) => set("bizDetails", e.target.value)} rows={2} className={`${inputCls} text-xs`} placeholder="Address, email, tax number…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-client" className={labelCls}>Bill to (client)</Label>
          <div className="flex gap-2">
            <Input id="iv-client" value={data.client} onChange={(e) => set("client", e.target.value)} className={inputCls} placeholder="Acme Ltd" list="iv-client-history" />
            <datalist id="iv-client-history">
              {clientHistory.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {clientHistory.length > 0 && (
              <Select onValueChange={(c) => {
                const found = vault.find((v) => v.client === c);
                set("client", c);
                if (found?.clientDetails) set("clientDetails", found.clientDetails);
              }}>
                <SelectTrigger className="w-10 shrink-0 border-zinc-700 bg-zinc-900 px-2 text-zinc-400" aria-label="Pick a past client">
                  <Users className="h-4 w-4" aria-hidden />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                  {clientHistory.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Textarea value={data.clientDetails} onChange={(e) => set("clientDetails", e.target.value)} rows={2} className={`${inputCls} text-xs`} placeholder="Client address, email…" />
        </div>
      </div>

      {/* meta */}
      <div className="grid gap-3 sm:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="iv-num" className={labelCls}>Invoice #</Label>
          <div className="flex gap-1">
            <Input id="iv-num" value={data.number} onChange={(e) => set("number", e.target.value)} className={inputCls} />
            <Button variant="outline" size="icon" onClick={nextNumber} aria-label="Increment invoice number" title="Next number" className="h-9 w-9 shrink-0 border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-emerald-300">
              <Hash className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-date" className={labelCls}>Issue date</Label>
          <Input id="iv-date" type="date" value={data.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-due" className={labelCls}>Due date</Label>
          <Input id="iv-due" type="date" value={data.due} onChange={(e) => set("due", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Currency</Label>
          <Select value={data.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger className={`w-full ${selectTriggerCls}`} aria-label="Invoice currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c.trim() || "AED"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Status</Label>
          <div className="flex gap-1">
            {(["draft", "sent", "paid"] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("status", s)}
                aria-pressed={data.status === s}
                className={`flex-1 rounded-md border px-2 py-2 text-[11px] font-semibold uppercase transition-colors ${
                  data.status === s ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* logo */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        {data.logo ? (
          <div className="flex items-center gap-3">
            { }
            <img src={data.logo} alt="Invoice logo" className="h-10 w-auto max-w-40 rounded border border-zinc-700 bg-white object-contain p-0.5" />
            <Button variant="outline" size="sm" onClick={() => set("logo", null)} className="h-8 border-zinc-700 bg-zinc-900 text-xs text-zinc-400 hover:text-red-400">
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
            </Button>
          </div>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("iv-logo-input")?.click()} className="h-8 border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
              <Upload className="h-3.5 w-3.5" aria-hidden /> Upload logo
            </Button>
            <input id="iv-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} aria-label="Upload logo" />
            <span className="text-xs text-zinc-600">Optional — appears top-left of the invoice.</span>
          </>
        )}
      </div>

      {/* line items */}
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
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} className={`${inputCls} min-w-0 flex-1 text-sm`} placeholder={`Description ${i + 1}`} aria-label={`Item ${i + 1} description`} />
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                <Input type="number" min="0" step="any" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} className={`${inputCls} w-full text-sm sm:w-20`} placeholder="Qty" aria-label={`Item ${i + 1} quantity`} />
                <Input type="number" min="0" step="any" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} className={`${inputCls} w-full text-sm sm:w-28`} placeholder="Rate" aria-label={`Item ${i + 1} rate`} />
                <span className="flex h-9 items-center justify-end rounded-md border border-zinc-800 bg-zinc-950/50 px-2 font-mono text-xs tabular-nums text-emerald-400 sm:w-28">
                  {money((Number(it.qty) || 0) * (Number(it.rate) || 0))}
                </span>
              </div>
              <div className="flex items-center gap-0.5 self-end sm:self-center">
                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} aria-label={`Move item ${i + 1} up`} className="rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30">
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button type="button" onClick={() => moveItem(i, 1)} disabled={i === data.items.length - 1} aria-label={`Move item ${i + 1} down`} className="rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30">
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
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
            </div>
          ))}
        </div>
      </div>

      {/* money adjustments */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="iv-disc" className={labelCls}>Discount %</Label>
          <Input id="iv-disc" type="number" min="0" step="any" value={data.discountPct} onChange={(e) => set("discountPct", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-tax" className={labelCls}>Tax / VAT %</Label>
          <Input id="iv-tax" type="number" min="0" step="any" value={data.taxPct} onChange={(e) => set("taxPct", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-ship" className={labelCls}>Shipping</Label>
          <Input id="iv-ship" type="number" min="0" step="any" value={data.shipping} onChange={(e) => set("shipping", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-paid" className={labelCls}>Amount paid</Label>
          <Input id="iv-paid" type="number" min="0" step="any" value={data.amountPaid} onChange={(e) => set("amountPaid", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iv-paydetails" className={labelCls}>Payment details</Label>
          <Input id="iv-paydetails" value={data.paymentDetails} onChange={(e) => set("paymentDetails", e.target.value)} className={inputCls} placeholder="Bank · IBAN · PayPal…" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="iv-notes" className={labelCls}>Notes on invoice</Label>
        <Textarea id="iv-notes" value={data.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={`${inputCls} text-sm`} placeholder="Payment terms, thanks, late fees…" />
      </div>

      {/* invoice sheet */}
      <div className="print-area rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-zinc-100 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            {data.logo ? (
               
              <img src={data.logo} alt="" className="mb-2 h-12 w-auto max-w-48 object-contain" />
            ) : null}
            <p className="text-xl font-bold">{data.biz || "Your business name"}</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">{data.bizDetails}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-tight text-emerald-400">INVOICE</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-sm text-zinc-300">
              <Hash className="h-3 w-3" aria-hidden /> {data.number || "—"}
            </p>
            <p className="text-xs text-zinc-500">Issued {data.date} · Due {data.due}</p>
            <span className={`mt-1 inline-block rounded border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusStyle[data.status]}`}>
              {data.status}
            </span>
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

        <div className="ml-auto mt-4 max-w-64 space-y-1.5 text-sm">
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
          {totals.shipping > 0 && (
            <div className="flex justify-between text-zinc-400">
              <span>Shipping</span>
              <span className="tabular-nums">{money(totals.shipping)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-700 pt-2 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums text-emerald-400">{money(totals.total)}</span>
          </div>
          {totals.paid > 0 && (
            <>
              <div className="flex justify-between text-zinc-400">
                <span>Amount paid</span>
                <span className="tabular-nums">−{money(totals.paid)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-700 pt-2 text-base font-bold">
                <span>Balance due</span>
                <span className={`tabular-nums ${totals.balance <= 0 ? "text-emerald-400" : "text-amber-400"}`}>{money(Math.max(0, totals.balance))}</span>
              </div>
            </>
          )}
          <p className="pt-1 text-[11px] italic text-zinc-500 first-letter:uppercase">{totalWords} only</p>
        </div>

        {data.paymentDetails && (
          <div className="mt-5 border-t border-zinc-800 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Payment details</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-300">{data.paymentDetails}</p>
          </div>
        )}
        {data.notes && <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-400">{data.notes}</p>}
        {data.status === "paid" && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <BadgeCheck className="h-4 w-4" aria-hidden /> Paid in full — thank you!
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => window.print()} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
          <Printer className="h-4 w-4" aria-hidden /> Print / Save as PDF
        </Button>
        <span className="text-xs text-zinc-500">Auto-saved in this browser as you type — vault copies persist too.</span>
      </div>
    </div>
  );
}
