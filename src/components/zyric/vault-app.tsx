"use client";

/* ==========================================================================
   THE VAULT — zyric.tech's separate wing for always-open student & dev offers.
   Own identity: money-vault green, claim-ticket cards, rubber stamps, barcode
   strips. Not a tool screen — a different side of the machine entirely.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck, Barcode, BookOpen, BrainCircuit, Briefcase, Database, ExternalLink,
  GraduationCap, Layers, Palette, Rocket, Search, Server, Sparkles, Star, Ticket, Vault, X,
} from "lucide-react";
import {
  OFFERS, VAULT_CATEGORIES, VERIFY_LABELS,
  type Offer, type VaultCategory,
} from "./vault-data";

/* ------------------------------ palette ----------------------------------- */

const INK = "#141414";
const VAULT_GREEN = "#0E3B2E";
const GREEN_MID = "#14523F";
const LIME = "#C6F24E";
const MINT = "#5EE39A";
const CREAM = "#F3EFE6";

const CAT_ICON: Record<VaultCategory, typeof Server> = {
  cloud: Server, ai: BrainCircuit, code: Sparkles, design: Palette,
  domains: Layers, hosting: Database, data: Database, learn: BookOpen,
  productivity: Briefcase, money: Rocket,
};

/* ------------------------------ helpers ----------------------------------- */

const FAV_KEY = "zyric-vault-favs";

function readFavs(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}

function useCountUp(target: number, ms = 1100) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, ms]);
  return n;
}

function money(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

/* role presets — quick stacks for a kind of person */
const ROLES: { id: string; label: string; icon: typeof Rocket; cats: VaultCategory[] | null; note: string }[] = [
  { id: "all", label: "EVERYTHING", icon: Layers, cats: null, note: "All 68 offers — the full stash" },
  { id: "student", label: "STUDENT", icon: GraduationCap, cats: null, note: "Sorted for coursework & campus life" },
  { id: "indie", label: "INDIE HACKER", icon: Rocket, cats: ["hosting", "cloud", "code", "ai", "data", "domains"], note: "Ship your side project for $0" },
  { id: "startup", label: "STARTUP", icon: Briefcase, cats: ["cloud", "ai", "money", "hosting", "productivity"], note: "Run a company on free credits" },
  { id: "ml", label: "ML BUILDER", icon: BrainCircuit, cats: ["ai", "data", "cloud"], note: "GPUs, notebooks & model hubs" },
];

/* ------------------------------ barcode ----------------------------------- */

function BarcodeStrip({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-5 w-full ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #141414 0 2px, transparent 2px 5px, #141414 5px 6px, transparent 6px 11px, #141414 11px 14px, transparent 14px 17px)",
        opacity: 0.75,
      }}
    />
  );
}

/* stamp: rotated ALWAYS OPEN badge */
function AlwaysStamp({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-block -rotate-6 rounded-full border-[2.5px] border-[#14523F] font-mono font-bold uppercase tracking-[0.1em] text-[#14523F] ${small ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]"}`}
      style={{ background: "rgba(94,227,154,0.14)" }}
    >
      always open
    </span>
  );
}

/* ------------------------------ ticket card -------------------------------- */

function TicketCard({
  offer, saved, onSave, onOpen, featured = false, index = 0,
}: {
  offer: Offer; saved: boolean; onSave: () => void; onOpen: () => void; featured?: boolean; index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.28, delay: Math.min(index % 8, 5) * 0.03 }}
      className="group relative flex flex-col"
    >
      {/* punch holes for the perforated ticket look */}
      <span aria-hidden className="absolute -left-[9px] top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-[#141414] bg-[#F3EFE6]" />
      <span aria-hidden className="absolute -right-[9px] top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-[#141414] bg-[#F3EFE6]" />

      <div
        className={`relative flex flex-1 flex-col border-[3px] border-[#141414] ${featured ? "brut-shadow-lg" : "brut-shadow"} bg-[#F3EFE6] transition-transform duration-200 group-hover:-translate-y-1`}
        style={featured ? { background: "#EAF7E4" } : undefined}
      >
        {/* head row */}
        <div className="flex items-start justify-between gap-2 border-b-[3px] border-dashed border-[#141414]/30 px-3.5 pb-2.5 pt-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#141414]/50">
              {offer.provider}
            </p>
            <h3 className="mt-0.5 font-brut text-[15px] uppercase leading-tight tracking-tight text-[#141414]">
              {offer.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onSave}
            aria-label={saved ? "Remove from stash" : "Save to stash"}
            className={`brut-lift shrink-0 border-2 border-[#141414] p-1.5 transition-colors ${saved ? "bg-[#FFD43B]" : "bg-white hover:bg-[#FFD43B]/60"}`}
          >
            <Star className={`h-3.5 w-3.5 ${saved ? "fill-[#141414]" : ""}`} strokeWidth={2.5} />
          </button>
        </div>

        {/* body */}
        <p className="min-w-0 flex-1 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#141414]/75">
          {offer.what}
        </p>

        {/* chips */}
        <div className="flex flex-wrap gap-1.5 px-3.5">
          <span className="border-2 border-[#141414] bg-[#C6F24E] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#141414]">
            {offer.value}
          </span>
          <span className="border-2 border-[#141414]/25 bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#141414]/70">
            {VERIFY_LABELS[offer.verify]}
          </span>
          <AlwaysStamp small />
        </div>

        {/* barcode + actions */}
        <div className="mt-3 border-t-[3px] border-dashed border-[#141414]/30 px-3.5 py-2.5">
          <BarcodeStrip className="mb-2.5" />
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#141414]/40">
              №{String(index + 1).padStart(3, "0")} · no expiry
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onOpen}
                className="brut-lift border-2 border-[#141414] bg-white px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#141414] hover:bg-[#FFD43B]"
              >
                How to claim
              </button>
              <a
                href={offer.link}
                target="_blank"
                rel="noopener noreferrer"
                className="brut-lift inline-flex items-center gap-1 border-2 border-[#141414] bg-[#141414] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#F3EFE6] hover:bg-[#C6F24E] hover:text-[#141414]"
              >
                Open <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------ detail modal ------------------------------- */

function VaultDetail({ offer, saved, onSave, onClose, index }: {
  offer: Offer; saved: boolean; onSave: () => void; onClose: () => void; index: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#141414]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="brut-shadow-lg max-h-[92vh] w-full max-w-2xl overflow-y-auto border-[3px] border-[#141414] bg-[#F3EFE6]"
      >
        {/* head */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-[3px] border-[#141414] px-4 py-3 sm:px-6" style={{ background: VAULT_GREEN }}>
          <div className="min-w-0">
            <p className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#F3EFE6]/60">
              the vault · {offer.provider}
            </p>
            <h2 className="font-brut text-lg uppercase leading-tight text-[#F3EFE6] sm:text-xl">{offer.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="brut-lift shrink-0 border-2 border-[#141414] bg-[#FFD43B] p-1.5">
            <X className="h-4 w-4 text-[#141414]" strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap gap-1.5">
            <span className="border-2 border-[#141414] bg-[#C6F24E] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]">{offer.value}</span>
            <span className="inline-flex items-center gap-1 border-2 border-[#141414] bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
              <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.5} /> {VERIFY_LABELS[offer.verify]}
            </span>
            <AlwaysStamp />
          </div>

          <p className="text-sm leading-relaxed text-[#141414]/80">{offer.what}</p>
          <div className="border-[3px] border-[#141414] bg-white p-3 text-[12.5px] leading-relaxed">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#141414]/50">who qualifies · </span>
            {offer.who}
          </div>

          {/* steps */}
          <div>
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414]/60">claim it — step by step</p>
            <ol className="space-y-2">
              {offer.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 border-[3px] border-[#141414] bg-white px-3 py-2 text-[12.5px] leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-[#141414] bg-[#C6F24E] font-mono text-[10px] font-bold">{i + 1}</span>
                  <span className="min-w-0">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <BarcodeStrip />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSave}
              className={`brut-lift inline-flex items-center gap-1.5 border-2 border-[#141414] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${saved ? "bg-[#FFD43B]" : "bg-white hover:bg-[#FFD43B]/60"}`}
            >
              <Star className={`h-3.5 w-3.5 ${saved ? "fill-[#141414]" : ""}`} strokeWidth={2.5} />
              {saved ? "in your stash" : "save to stash"}
            </button>
            <a
              href={offer.link} target="_blank" rel="noopener noreferrer"
              className="brut-lift inline-flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#F3EFE6] hover:bg-[#C6F24E] hover:text-[#141414]"
            >
              claim on {offer.provider} <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
            </a>
          </div>

          <p className="border-t-2 border-dashed border-[#141414]/20 pt-2.5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-[#141414]/40">
            ticket №{String(index + 1).padStart(3, "0")} · offers change — always confirm on the official page. zyric is not affiliated; no referral links, ever.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ main wing ---------------------------------- */

export function VaultApp() {
  const [cat, setCat] = useState<VaultCategory | "all">("all");
  const [role, setRole] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"value" | "az">("value");
  const [favs, setFavs] = useState<string[]>([]);
  const [stashOnly, setStashOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => { setFavs(readFavs()); }, []);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  const roleDef = ROLES.find((r) => r.id === role) ?? ROLES[0];

  const list = useMemo(() => {
    let out = OFFERS.slice();
    if (stashOnly) out = out.filter((o) => favs.includes(o.id));
    if (roleDef.cats) out = out.filter((o) => roleDef.cats!.includes(o.category));
    if (cat !== "all") out = out.filter((o) => o.category === cat);
    const s = q.trim().toLowerCase();
    if (s) {
      out = out.filter((o) =>
        `${o.provider} ${o.title} ${o.what} ${o.value} ${o.who}`.toLowerCase().includes(s));
    }
    out.sort((a, b) => (sort === "value" ? b.valueScore - a.valueScore || a.provider.localeCompare(b.provider) : a.provider.localeCompare(b.provider) || b.valueScore - a.valueScore));
    return out;
  }, [cat, roleDef, q, sort, stashOnly, favs]);

  const totalValue = useMemo(() => OFFERS.reduce((a, o) => a + o.valueScore, 0), []);
  const counted = useCountUp(totalValue);
  const openOffer = openId ? OFFERS.find((o) => o.id === openId) ?? null : null;
  const openIndex = openOffer ? OFFERS.indexOf(openOffer) : 0;
  const featured = OFFERS.filter((o) => o.featured);

  return (
    <motion.main
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1"
    >
      {/* ============================ hero ============================ */}
      <section className="relative overflow-hidden border-b-[3px] border-[#141414]" style={{ background: VAULT_GREEN }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #F3EFE6 0 1px, transparent 1px 14px)" }} />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border-2 border-[#F3EFE6]/30 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#C6F24E]">
              <Vault className="h-3.5 w-3.5" strokeWidth={2.5} /> the other side of zyric
            </span>
            <AlwaysStamp />
          </div>

          <h1 className="mt-4 font-brut text-[44px] uppercase leading-[0.95] tracking-tight text-[#F3EFE6] sm:text-[64px] lg:text-[84px]">
            THE
            <span className="mx-2 inline-block -rotate-2 border-[3px] border-[#C6F24E] px-3 text-[#C6F24E]" style={{ background: GREEN_MID }}>VAULT</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#F3EFE6]/75 sm:text-base">
            Student packs, cloud credits, free IDEs, domains, GPUs and learning passes — the offers that
            <span className="font-bold text-[#C6F24E]"> stay open all year</span>. No expiry chases, no affiliate links,
            no sign-ups here — just the stash and the exact steps to claim each one.
          </p>

          {/* counter strip */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "value waiting", v: money(counted) + "+", c: LIME },
              { k: "offers", v: String(OFFERS.length), c: MINT },
              { k: "categories", v: String(VAULT_CATEGORIES.length), c: "#FFD43B" },
              { k: "cost to browse", v: "$0", c: "#FF9DE2" },
            ].map((s) => (
              <div key={s.k} className="border-[3px] border-[#141414] bg-[#F3EFE6] px-3 py-2.5">
                <p className="font-brut text-xl leading-none sm:text-2xl" style={{ color: INK }}>{s.v}</p>
                <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: INK, opacity: 0.5 }}>{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= featured rail ======================= */}
      <section className="border-b-[3px] border-[#141414] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 font-brut text-xl uppercase tracking-tight sm:text-2xl">
              <Ticket className="h-5 w-5 -rotate-6" strokeWidth={2.8} /> headliner tickets
            </h2>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#141414]/40">the 10 everyone asks about</span>
          </div>
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {featured.map((o, i) => (
              <div key={o.id} className="w-[300px] shrink-0 snap-start sm:w-[340px]">
                <TicketCard offer={o} featured index={i} saved={favs.includes(o.id)} onSave={() => toggleFav(o.id)} onOpen={() => setOpenId(o.id)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== filters ========================== */}
      <section className="sticky top-16 z-30 border-b-[3px] border-[#141414]" style={{ background: CREAM }}>
        <div className="mx-auto max-w-7xl space-y-2.5 px-4 py-3 sm:px-6 lg:px-8">
          {/* roles */}
          <div className="flex flex-wrap items-center gap-1.5">
            {ROLES.map((r) => (
              <button
                key={r.id} type="button" onClick={() => { setRole(r.id); setCat("all"); }}
                className={`brut-lift inline-flex items-center gap-1.5 border-2 border-[#141414] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${role === r.id ? "bg-[#141414] text-[#F3EFE6]" : "bg-white text-[#141414] hover:bg-[#C6F24E]/40"}`}
              >
                <r.icon className="h-3.5 w-3.5" strokeWidth={2.5} /> {r.label}
              </button>
            ))}
            <button
              type="button" onClick={() => setStashOnly((v) => !v)}
              className={`brut-lift ml-auto inline-flex items-center gap-1.5 border-2 border-[#141414] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${stashOnly ? "bg-[#FFD43B]" : "bg-white hover:bg-[#FFD43B]/50"}`}
            >
              <Star className={`h-3.5 w-3.5 ${stashOnly ? "fill-[#141414]" : ""}`} strokeWidth={2.5} /> my stash ({favs.length})
            </button>
          </div>

          {/* categories + search + sort */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button" onClick={() => setCat("all")}
              className={`border-2 border-[#141414] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${cat === "all" ? "bg-[#C6F24E]" : "bg-white hover:bg-[#C6F24E]/40"}`}
            >all</button>
            {VAULT_CATEGORIES.map((c) => {
              const Ico = CAT_ICON[c.id];
              const n = OFFERS.filter((o) => o.category === c.id).length;
              return (
                <button
                  key={c.id} type="button" onClick={() => setCat(c.id)} title={c.blurb}
                  className={`inline-flex items-center gap-1 border-2 border-[#141414] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${cat === c.id ? "bg-[#C6F24E]" : "bg-white hover:bg-[#C6F24E]/40"}`}
                >
                  <Ico className="h-3 w-3" strokeWidth={2.5} /> {c.label} <span className="opacity-50">{n}</span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 border-2 border-[#141414] bg-white px-2 py-1">
                <Search className="h-3.5 w-3.5 text-[#141414]/50" strokeWidth={2.5} />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)} placeholder="search the stash…"
                  className="w-32 bg-transparent font-mono text-[10px] uppercase tracking-[0.06em] outline-none placeholder:text-[#141414]/35 sm:w-44"
                />
              </label>
              <button
                type="button" onClick={() => setSort((s) => (s === "value" ? "az" : "value"))}
                className="brut-lift border-2 border-[#141414] bg-white px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] hover:bg-[#FFD43B]/50"
                title="Toggle sorting"
              >
                {sort === "value" ? "↓ biggest value" : "↓ A–Z"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ grid ============================ */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ background: CREAM }}>
        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414]/50">
          {roleDef.note} — showing <span className="text-[#141414]">{list.length}</span> ticket{list.length === 1 ? "" : "s"}
        </p>
        {list.length === 0 ? (
          <div className="border-[3px] border-dashed border-[#141414]/30 py-16 text-center">
            <p className="font-brut text-xl uppercase text-[#141414]/60">empty shelf</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#141414]/40">clear the search or pick another category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((o, i) => (
              <TicketCard key={o.id} offer={o} index={i} saved={favs.includes(o.id)} onSave={() => toggleFav(o.id)} onOpen={() => setOpenId(o.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ========================= disclaimer ========================= */}
      <footer className="border-t-[3px] border-[#141414] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6 lg:px-8">
          <p className="max-w-xl font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-[#141414]/45">
            the vault lists publicly published offers with official links only — values are typical listed amounts and can change without notice. verify every offer on its official page. no affiliates, no tracking.
          </p>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#141414]/40">
            <Barcode className="h-4 w-4" /> zyric vault · always open
          </span>
        </div>
      </footer>

      {openOffer && (
        <VaultDetail
          offer={openOffer} index={openIndex} saved={favs.includes(openOffer.id)}
          onSave={() => toggleFav(openOffer.id)} onClose={() => setOpenId(null)}
        />
      )}
    </motion.main>
  );
}
