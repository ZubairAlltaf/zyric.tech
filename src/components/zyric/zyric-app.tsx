"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  HardDrive,
  Gem,
  Command as CommandIcon,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CATEGORIES, TOOLS, TOOL_COUNT, searchTools, type ToolMeta } from "./registry";
import { inputCls } from "./hooks";

const BADGE_STYLE: Record<string, string> = {
  new: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  local: "border-teal-500/40 bg-teal-500/10 text-teal-300",
  saved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  unique: "border-amber-500/40 bg-amber-500/10 text-amber-300",
};

const BADGE_TEXT: Record<string, string> = {
  new: "New",
  local: "Private",
  saved: "Auto-saves",
  unique: "Signature",
};

/* ------------------------------- Brand mark -------------------------------- */

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-[0_0_18px_rgba(16,185,129,0.3)] ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]" aria-hidden>
        <path
          d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* -------------------------------- SearchBox -------------------------------- */

function SearchBox({
  value,
  onChange,
  autoFocus = false,
  placeholder = `Search ${TOOL_COUNT} tools…`,
  inputRef,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Search tools"
        className={`h-11 rounded-xl border-zinc-800 bg-zinc-900/70 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/25 ${inputCls}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* --------------------------------- Cards ----------------------------------- */

function ToolCard({
  tool,
  onOpen,
  index,
  accent = false,
}: {
  tool: ToolMeta;
  onOpen: () => void;
  index: number;
  accent?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.3) }}
      whileHover={{ y: -3 }}
      className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border p-5 text-left transition-colors ${
        accent
          ? "border-amber-500/15 bg-gradient-to-b from-amber-500/[0.06] to-zinc-900/40 hover:border-amber-500/40"
          : "border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-900/25 hover:border-emerald-500/40"
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          accent ? "via-amber-400/70" : "via-emerald-400/70"
        }`}
      />
      <div className="flex w-full items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105 ${
            accent
              ? "border-amber-500/25 bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20"
              : "border-zinc-700/60 bg-zinc-800/70 text-zinc-300 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 group-hover:text-emerald-300"
          }`}
        >
          <tool.icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {tool.badge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${BADGE_STYLE[tool.badge]}`}
          >
            {BADGE_TEXT[tool.badge]}
          </span>
        )}
      </div>
      <div>
        <h3 className={`font-semibold transition-colors ${accent ? "text-amber-100 group-hover:text-amber-300" : "text-zinc-100 group-hover:text-emerald-300"}`}>
          {tool.name}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
      </div>
      <span
        className={`mt-auto inline-flex translate-x-0 items-center gap-1 text-xs font-medium transition-all group-hover:translate-x-0.5 ${
          accent ? "text-amber-400" : "text-emerald-400"
        }`}
      >
        Open <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </motion.button>
  );
}

function SectionHeader({
  icon: Icon,
  kicker,
  title,
  blurb,
  count,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  blurb: string;
  count?: number;
  accent?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
          accent
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-zinc-800 bg-zinc-900 text-emerald-400"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className={`mono-kicker ${accent ? "text-amber-500/80" : "text-zinc-600"}`}>{kicker}</p>
        <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-50">{title}</h2>
        <p className="hidden text-xs text-zinc-500 sm:block">{blurb}</p>
      </div>
      {count !== undefined && (
        <span
          className={`ml-auto shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-xs ${
            accent ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-zinc-800 bg-zinc-900 text-zinc-400"
          }`}
        >
          {count}
        </span>
      )}
    </div>
  );
}

/* --------------------------------- Home ------------------------------------ */

function HomeView({
  onOpen,
  query,
  setQuery,
  onOpenPalette,
}: {
  onOpen: (id: string) => void;
  query: string;
  setQuery: (v: string) => void;
  onOpenPalette: () => void;
}) {
  const results = useMemo(() => searchTools(query), [query]);
  const searching = query.trim().length > 0;
  const sigTools = useMemo(() => TOOLS.filter((t) => t.category === "signature"), []);

  return (
    <div className="space-y-14 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-900/20 px-6 py-14 sm:px-10 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-200px] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-emerald-500/[0.13] blur-[120px]" />
          <div className="absolute right-[-120px] top-[80px] h-[240px] w-[240px] rounded-full bg-teal-500/[0.09] blur-[90px]" />
          <div className="dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_65%_at_50%_0%,black_25%,transparent_100%)]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mono-kicker text-emerald-400/90"
          >
            {"// "}
            {TOOL_COUNT} tools · 0 uploads · 0 accounts
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-zinc-50 sm:text-6xl"
          >
            Every tool you need.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Nothing you don&rsquo;t.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base"
          >
            A hand-built collection of everyday tools — notes, trackers, calculators, CSS
            generators, file checkers and a set of signature problem-solvers you won&rsquo;t
            find anywhere else. Everything runs right here in your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mx-auto mt-8 max-w-xl"
          >
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder={`Search ${TOOL_COUNT} tools… try “expense”, “cron”, “qr”…`}
            />
            <div className="mt-2.5 flex items-center justify-center gap-4 text-[11px] text-zinc-600">
              <span>
                Press{" "}
                <button
                  type="button"
                  onClick={onOpenPalette}
                  className="rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                >
                  ⌘K
                </button>{" "}
                for the launcher
              </span>
              <span aria-hidden>·</span>
              <span>
                or{" "}
                <kbd className="rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                  /
                </kbd>{" "}
                to search
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden /> 100% private — data never leaves your device
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" aria-hidden /> Instant — no page reloads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-teal-400" aria-hidden /> Saves locally on this browser
            </span>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 sm:grid-cols-4"
          >
            {[
              { v: String(TOOL_COUNT), l: "tools & counting" },
              { v: String(CATEGORIES.length), l: "categories" },
              { v: "0", l: "files uploaded" },
              { v: "$0", l: "forever" },
            ].map((s) => (
              <div key={s.l} className="bg-zinc-950/80 px-4 py-4">
                <p className="font-display text-2xl font-bold text-zinc-50">{s.v}</p>
                <p className="mono-kicker mt-0.5 text-zinc-600">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Search results or categories */}
      {searching ? (
        <section aria-label="Search results">
          <p className="mb-4 text-sm text-zinc-400">
            {results.length} tool{results.length !== 1 ? "s" : ""} matching{" "}
            <span className="font-semibold text-emerald-400">“{query.trim()}”</span>
          </p>
          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((t, i) => (
                <ToolCard key={t.id} tool={t} index={i} accent={t.category === "signature"} onOpen={() => onOpen(t.id)} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center text-sm text-zinc-500">
              Nothing found for &ldquo;{query.trim()}&rdquo;. Try &ldquo;notes&rdquo;, &ldquo;bmi&rdquo;,
              &ldquo;timer&rdquo; or &ldquo;qr&rdquo;.
            </p>
          )}
        </section>
      ) : (
        <>
          {/* Signature showcase */}
          <section aria-labelledby="sig-showcase">
            <SectionHeader
              icon={Gem}
              kicker="signature — exclusive to zyric"
              title="Signature tools"
              blurb="Built in-house to solve problems no other free tool handles properly"
              count={sigTools.length}
              accent
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sigTools.map((t, i) => (
                <ToolCard key={t.id} tool={t} index={i} accent onOpen={() => onOpen(t.id)} />
              ))}
            </div>
          </section>

          {CATEGORIES.filter((cat) => cat.id !== "signature").map((cat) => {
            const tools = TOOLS.filter((t) => t.category === cat.id);
            return (
              <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
                <SectionHeader
                  icon={cat.icon}
                  kicker={cat.id}
                  title={cat.label}
                  blurb={cat.blurb}
                  count={tools.length}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((t, i) => (
                    <ToolCard key={t.id} tool={t} index={i} onOpen={() => onOpen(t.id)} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

/* -------------------------------- Tool view -------------------------------- */

function ToolView({ tool, onBack }: { tool: ToolMeta; onBack: () => void }) {
  const Tool = tool.component;
  return (
    <motion.div
      key={tool.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pb-10"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All tools
      </button>
      <div className="mb-7 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
          <tool.icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {tool.name}
            {tool.badge && (
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_STYLE[tool.badge]}`}>
                {BADGE_TEXT[tool.badge]}
              </span>
            )}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {tool.description}{" "}
            <span className="text-zinc-500">Runs fully in your browser — nothing is uploaded.</span>
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-7">
        <Tool />
      </div>
    </motion.div>
  );
}

/* -------------------------------- Sidebar ---------------------------------- */

function SidebarNav({
  activeId,
  onOpen,
  query,
  setQuery,
}: {
  activeId: string | null;
  onOpen: (id: string) => void;
  query: string;
  setQuery: (v: string) => void;
}) {
  const results = useMemo(() => searchTools(query), [query]);
  const searching = query.trim().length > 0;

  const itemCls = (active: boolean) =>
    `relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
      active
        ? "bg-emerald-500/10 font-medium text-emerald-300"
        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
    }`;

  const renderItem = (t: ToolMeta) => (
    <button key={t.id} type="button" onClick={() => onOpen(t.id)} aria-current={activeId === t.id ? "page" : undefined} className={itemCls(activeId === t.id)}>
      {activeId === t.id && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald-400" aria-hidden />
      )}
      <t.icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{t.name}</span>
    </button>
  );

  return (
    <nav aria-label="Tool categories" className="flex h-full flex-col gap-5">
      <div className="px-1">
        <SearchBox value={query} onChange={setQuery} placeholder="Search…" />
      </div>
      <ScrollArea className="flex-1 px-1">
        <div className="space-y-5 pb-4">
          {searching ? (
            <div className="space-y-1">
              <p className="mono-kicker px-2 text-zinc-600">results ({results.length})</p>
              {results.map(renderItem)}
            </div>
          ) : (
            CATEGORIES.map((cat) => {
              const tools = TOOLS.filter((t) => t.category === cat.id);
              return (
                <div key={cat.id}>
                  <p className="mono-kicker mb-1.5 flex items-center justify-between px-2 text-zinc-600">
                    <span className="flex items-center gap-2">
                      <cat.icon className="h-3 w-3" aria-hidden />
                      {cat.label}
                    </span>
                    <span className="font-mono">{tools.length}</span>
                  </p>
                  <div className="space-y-0.5">{tools.map(renderItem)}</div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
        <p className="mono-kicker flex items-center gap-1.5 text-emerald-500/90">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> local-first
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Notes, entries and settings are saved in this browser only — never uploaded.
        </p>
      </div>
    </nav>
  );
}

/* ----------------------------- Command palette ------------------------------ */

function CommandPalette({
  open,
  setOpen,
  onOpenTool,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  onOpenTool: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchTools(q), [q]);
  const sig = results.filter((t) => t.category === "signature");
  const rest = results.filter((t) => t.category !== "signature");

  const pick = (id: string) => {
    setOpen(false);
    setQ("");
    onOpenTool(id);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="border-zinc-800 bg-zinc-950 text-zinc-100">
      <CommandInput
        placeholder={`Search ${TOOL_COUNT} tools…`}
        value={q}
        onValueChange={setQ}
        className="text-zinc-100 placeholder:text-zinc-500"
      />
      <CommandList>
        <CommandEmpty className="py-8 text-center text-sm text-zinc-500">
          No tool matches “{q}”.
        </CommandEmpty>
        {sig.length > 0 && (
          <CommandGroup heading="Signature tools">
            {sig.map((t) => (
              <CommandItem
                key={t.id}
                value={`${t.name} ${t.keywords}`}
                onSelect={() => pick(t.id)}
                className="gap-3 rounded-lg text-zinc-200 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-300"
              >
                <t.icon className="h-4 w-4 text-amber-400" aria-hidden />
                <span>{t.name}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-amber-500/80">signature</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {rest.length > 0 && (
          <CommandGroup heading="All tools">
            {rest.map((t) => (
              <CommandItem
                key={t.id}
                value={`${t.name} ${t.keywords}`}
                onSelect={() => pick(t.id)}
                className="gap-3 rounded-lg text-zinc-200 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-300"
              >
                <t.icon className="h-4 w-4 text-emerald-400" aria-hidden />
                <span>{t.name}</span>
                <span className="ml-auto hidden text-[11px] text-zinc-600 sm:block">{t.description.slice(0, 40)}…</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="surprise me random tool"
            onSelect={() => pick(TOOLS[Math.floor(Math.random() * TOOLS.length)].id)}
            className="gap-3 rounded-lg text-zinc-200 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-300"
          >
            <Shuffle className="h-4 w-4 text-teal-400" aria-hidden /> Surprise me — open a random tool
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/* ---------------------------------- App ------------------------------------ */

const POPULAR = ["notes", "expense-tracker", "submission-checker", "password", "qr", "invoice"];

export default function ZyricApp() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);
  const year = new Date().getFullYear();

  const active = useMemo(() => TOOLS.find((t) => t.id === activeId) ?? null, [activeId]);

  // Mount the palette lazily (keeps SSR output clean); ⌘K / Ctrl+K toggles it, "/" too
  const togglePalette = () => {
    setPaletteMounted(true);
    setPaletteOpen((o) => !o);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen((o) => !o);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        e.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openTool = (id: string) => {
    setActiveId(id);
    setMobileOpen(false);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backHome = () => {
    setActiveId(null);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {paletteMounted && <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} onOpenTool={openTool} />}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="shrink-0 border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav activeId={activeId} onOpen={openTool} query={query} setQuery={setQuery} />
            </SheetContent>
          </Sheet>

          <button type="button" onClick={backHome} className="flex items-center gap-2.5" aria-label="zyric.tech — home">
            <LogoMark className="h-8 w-8" />
            <span className="flex flex-col text-left leading-tight">
              <span className="font-display text-sm font-bold tracking-tight text-zinc-50">
                zyric<span className="text-emerald-400">.tech</span>
              </span>
              <span className="mono-kicker text-zinc-600">free tools, zero uploads</span>
            </span>
          </button>

          {/* Launcher (desktop) */}
          <button
            type="button"
            onClick={togglePalette}
            className="mx-auto hidden h-9 w-full max-w-sm items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 text-sm text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400 lg:flex"
            aria-label="Open tool launcher"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            <span className="flex-1 text-left">Search {TOOL_COUNT} tools…</span>
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePalette}
              aria-label="Open tool launcher"
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white lg:hidden"
            >
              <Search className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden bg-emerald-500 font-medium text-zinc-950 shadow-[0_0_16px_rgba(16,185,129,0.25)] hover:bg-emerald-400 sm:inline-flex"
            >
              <button type="button" onClick={backHome}>
                {active ? "All tools" : `Browse ${TOOL_COUNT}`}
              </button>
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 py-6 lg:block">
          <SidebarNav activeId={activeId} onOpen={openTool} query={query} setQuery={setQuery} />
        </aside>

        <main className="min-w-0 flex-1 py-8">
          <AnimatePresence mode="wait">
            {active ? (
              <ToolView key={active.id} tool={active} onBack={backHome} />
            ) : (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <HomeView onOpen={openTool} query={query} setQuery={setQuery} onOpenPalette={togglePalette} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/70 bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="font-display text-sm font-bold tracking-tight text-zinc-50">
                zyric<span className="text-emerald-400">.tech</span>
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-zinc-500">
              {TOOL_COUNT} free tools that run entirely in your browser. No accounts, no uploads,
              no tracking — bookmark it and it&rsquo;s yours.
            </p>
            <p className="mono-kicker text-zinc-700">all processing local · {year}</p>
          </div>
          <div>
            <p className="mono-kicker mb-3 text-zinc-600">signature</p>
            <ul className="space-y-2 text-sm">
              {TOOLS.filter((t) => t.category === "signature")
                .slice(0, 6)
                .map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => openTool(t.id)} className="text-zinc-400 transition-colors hover:text-emerald-300">
                      {t.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <p className="mono-kicker mb-3 text-zinc-600">popular</p>
            <ul className="space-y-2 text-sm">
              {POPULAR.map((id) => {
                const t = TOOLS.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <li key={t.id}>
                    <button type="button" onClick={() => openTool(t.id)} className="text-zinc-400 transition-colors hover:text-emerald-300">
                      {t.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="mono-kicker mb-3 text-zinc-600">the fine print</p>
            <ul className="space-y-2 text-xs leading-relaxed text-zinc-500">
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                Your data never leaves your device — saved tools live in this browser&rsquo;s local storage.
              </li>
              <li className="flex gap-2">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                No servers in the loop — tools keep working even when you&rsquo;re offline.
              </li>
              <li className="flex gap-2">
                <CommandIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" aria-hidden />
                Press ⌘K anywhere to jump to any of the {TOOL_COUNT} tools.
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800/60 py-4 text-center">
          <p className="font-mono text-[11px] text-zinc-700">
            © {year} zyric.tech — built by hand, runs on your machine.
          </p>
        </div>
      </footer>
    </div>
  );
}
