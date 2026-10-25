"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  CornerDownLeft,
  HardDrive,
  BadgeCheck,
  Gem,
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

function SearchBox({
  value,
  onChange,
  autoFocus = false,
  placeholder = `Search ${TOOL_COUNT} tools… try “expense”, “qr”, “password”…`,
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
        className={`h-11 rounded-full border-zinc-700/80 bg-zinc-900/70 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/25 ${inputCls}`}
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

function ToolCard({ tool, onOpen, index }: { tool: ToolMeta; onOpen: () => void; index: number }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25) }}
      className="group relative flex flex-col items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-600/50 hover:bg-zinc-900 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
      <div className="flex w-full items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
          <tool.icon className="h-5 w-5" aria-hidden />
        </span>
        {tool.badge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE_STYLE[tool.badge]}`}
          >
            {BADGE_TEXT[tool.badge]}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-zinc-50 transition-colors group-hover:text-emerald-300">
          {tool.name}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
        Open tool <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </motion.button>
  );
}

function HomeView({
  onOpen,
  query,
  setQuery,
}: {
  onOpen: (id: string) => void;
  query: string;
  setQuery: (v: string) => void;
}) {
  const results = useMemo(() => searchTools(query), [query]);
  const searching = query.trim().length > 0;
  const sigTools = useMemo(() => TOOLS.filter((t) => t.category === "signature"), []);

  return (
    <div className="space-y-12 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center sm:px-10 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-180px] h-[380px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[110px]" />
          <div className="absolute right-[-100px] top-[60px] h-[240px] w-[240px] rounded-full bg-teal-500/10 blur-[90px]" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(63 63 70 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(63 63 70 / 0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse 75% 70% at 50% 0%, black 30%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 70% at 50% 0%, black 30%, transparent 100%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            {TOOL_COUNT} free tools · no sign-up · no limits
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-5 text-3xl font-bold tracking-tight text-zinc-50 sm:text-5xl"
          >
            Every tool you need,{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              one tab away
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base"
          >
            zyric.tech is a growing box of free everyday tools — notes, trackers, calculators, image tools,
            generators and a set of signature problem-solvers you won’t find anywhere else. Everything runs right
            here in your browser.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mx-auto mt-7 max-w-xl"
          >
            <SearchBox value={query} onChange={setQuery} placeholder={`Search ${TOOL_COUNT} tools… try “expense”, “qr”, “password”…`} />
            <p className="mt-2 hidden text-xs text-zinc-600 sm:block">
              Tip: press <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px]">/</kbd> anywhere to search
            </p>
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
                <ToolCard key={t.id} tool={t} index={i} onOpen={() => onOpen(t.id)} />
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
          <section aria-labelledby="cat-signature-showcase">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Gem className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 id="cat-signature-showcase" className="text-lg font-semibold text-zinc-50">
                  Signature tools — only here
                </h2>
                <p className="text-xs text-zinc-500">
                  Built in-house to solve problems no other free tool handles properly
                </p>
              </div>
              <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
                {sigTools.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sigTools.map((t, i) => (
                <ToolCard key={t.id} tool={t} index={i} onOpen={() => onOpen(t.id)} />
              ))}
            </div>
          </section>

          {CATEGORIES.filter((cat) => cat.id !== "signature").map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat.id);
          return (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-emerald-400">
                  <cat.icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 id={`cat-${cat.id}`} className="text-lg font-semibold text-zinc-50">
                    {cat.label}
                  </h2>
                  <p className="text-xs text-zinc-500">{cat.blurb}</p>
                </div>
                <span className="ml-auto rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-400">
                  {tools.length}
                </span>
              </div>
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
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-emerald-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All tools
      </button>
      <div className="mb-7 flex items-start gap-4">
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
          <tool.icon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-zinc-50 sm:text-3xl">
            {tool.name}
            {tool.badge && (
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_STYLE[tool.badge]}`}>
                {BADGE_TEXT[tool.badge]}
              </span>
            )}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {tool.description}{" "}
            <span className="text-zinc-500">
              Runs fully in your browser — nothing is uploaded.
            </span>
          </p>
        </div>
      </div>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-8">
        <Tool />
      </div>
    </motion.div>
  );
}

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

  return (
    <nav aria-label="Tool categories" className="flex h-full flex-col gap-5">
      <div className="px-1">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search…"
        />
      </div>
      <ScrollArea className="flex-1 px-1" >
        <div className="space-y-5 pb-4">
          {searching ? (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Results ({results.length})
              </p>
              {results.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpen(t.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    activeId === t.id
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
                  }`}
                >
                  <t.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          ) : (
            CATEGORIES.map((cat) => {
              const tools = TOOLS.filter((t) => t.category === cat.id);
              return (
                <div key={cat.id}>
                  <p className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    <cat.icon className="h-3 w-3" aria-hidden />
                    {cat.label}
                  </p>
                  <div className="space-y-0.5">
                    {tools.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onOpen(t.id)}
                        aria-current={activeId === t.id ? "page" : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          activeId === t.id
                            ? "bg-emerald-500/15 font-medium text-emerald-300"
                            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
                        }`}
                      >
                        <t.icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
          <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
          Everything stays local
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Notes, entries and settings are saved in this browser only — never uploaded.
        </p>
      </div>
    </nav>
  );
}

export default function ZyricApp() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const active = useMemo(() => TOOLS.find((t) => t.id === activeId) ?? null, [activeId]);

  // "/" to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="shrink-0 border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] border-zinc-800 bg-zinc-950 p-4 text-zinc-100"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav
                activeId={activeId}
                onOpen={openTool}
                query={query}
                setQuery={setQuery}
              />
            </SheetContent>
          </Sheet>

          <button
            type="button"
            onClick={backHome}
            className="flex items-center gap-2.5"
            aria-label="zyric.tech — home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.25)]">
              <Sparkles className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="flex flex-col text-left leading-tight">
              <span className="text-sm font-bold text-zinc-50">zyric<span className="text-emerald-400">.tech</span></span>
              <span className="text-[10px] text-zinc-500">free tools for everything</span>
            </span>
          </button>

          <div className="mx-auto hidden w-full max-w-md lg:block">
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder={`Search ${TOOL_COUNT} tools…`}
              inputRef={searchRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const results = searchTools(query);
                  if (results.length > 0) openTool(results[0].id);
                }
              }}
            />
          </div>

          <Button
            asChild
            size="sm"
            className="ml-auto hidden bg-emerald-500 font-medium text-zinc-950 shadow-[0_0_18px_rgba(16,185,129,0.3)] hover:bg-emerald-400 sm:inline-flex lg:ml-0"
          >
            <button type="button" onClick={backHome}>
              {active ? "All tools" : `Browse ${TOOL_COUNT} tools`}
            </button>
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 sm:px-6 lg:px-8">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 py-6 lg:block">
          <SidebarNav
            activeId={activeId}
            onOpen={openTool}
            query={query}
            setQuery={setQuery}
          />
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
                <HomeView onOpen={openTool} query={query} setQuery={setQuery} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800 bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <p className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
            <span className="font-semibold text-zinc-300">zyric<span className="text-emerald-400">.tech</span></span>
            — {TOOL_COUNT} free tools, built for everyone.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
            All tools run locally in your browser. Your data stays on your device.
          </p>
        </div>
      </footer>
    </div>
  );
}
