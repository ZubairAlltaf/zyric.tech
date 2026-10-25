"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Sparkles,
  ArrowDown,
  ExternalLink,
  Globe,
  Smartphone,
  LayoutGrid,
  Star,
  Download,
  Gift,
  SearchX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FREE_TOOLS, TOTAL_DOWNLOADS, type Tool } from "@/data/tools";
import { ToolCard } from "./tool-card";
import { CompareSection, EcosystemSection, FaqSection, SiteFooter } from "./sections";

type FreeFilter = "all" | "completely-free" | "freemium";
type PlatformFilter = "all" | "web" | "android";

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Zyric Tools Hub home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.25)]">
            <Sparkles className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold text-zinc-50">Zyric Tools Hub</span>
            <span className="text-[11px] text-zinc-500">zyric.tech · free tools directory</span>
          </span>
        </a>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {[
            { label: "Free Tools", href: "#tools" },
            { label: "Compare", href: "#compare" },
            { label: "Ecosystem", href: "#ecosystem" },
            { label: "FAQ", href: "#faq" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-400 transition-colors hover:text-emerald-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Button
          asChild
          size="sm"
          className="bg-emerald-500 font-medium text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
        >
          <a
            href="https://qamarix.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit qamarix.com — opens in a new tab"
          >
            qamarix.com
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  const stats = [
    { icon: LayoutGrid, value: "6", label: "Free tools & platforms" },
    { icon: Download, value: TOTAL_DOWNLOADS, label: "App downloads" },
    { icon: Star, value: "4.4★", label: "Top rating (AyBay)" },
    { icon: Gift, value: "৳0", label: "To get started" },
  ];
  return (
    <section className="relative overflow-hidden pb-14 pt-16 sm:pb-20 sm:pt-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute right-[-140px] top-[120px] h-[320px] w-[320px] rounded-full bg-teal-500/10 blur-[110px]" />
        <div className="absolute left-[-120px] top-[260px] h-[280px] w-[280px] rounded-full bg-amber-500/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(63 63 70 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(63 63 70 / 0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 20%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 20%, black 40%, transparent 100%)",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" aria-hidden />
            zyric.tech · Qamarix ecosystem
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl"
        >
          Every free tool from{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            zyric.tech
          </span>
          , in one place
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          A hand-crafted directory of the Qamarix ecosystem — the AyBay income &amp;
          expense tracker, Hishab business accounting, Quran Words, community
          platforms, and more. All free tiers, prices, and features, clearly
          organized.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="bg-emerald-500 font-semibold text-zinc-950 shadow-[0_0_28px_rgba(16,185,129,0.4)] hover:bg-emerald-400"
          >
            <a href="#tools">
              Browse free tools
              <ArrowDown className="h-4 w-4" aria-hidden />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-zinc-700 bg-zinc-900/40 text-zinc-200 backdrop-blur hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <a
              href="https://aybay.qamarix.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Try AyBay instantly
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </motion.div>
        <motion.dl
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-4 backdrop-blur"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="flex flex-col items-center gap-1">
                <s.icon className="h-4 w-4 text-emerald-400" aria-hidden />
                <span className="text-xl font-bold text-zinc-50 sm:text-2xl">
                  {s.value}
                </span>
                <span className="text-center text-[11px] leading-tight text-zinc-500">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.2)]"
          : "border-zinc-700/80 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function ToolsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [freeFilter, setFreeFilter] = useState<FreeFilter>("all");
  const [platform, setPlatform] = useState<PlatformFilter>("all");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(FREE_TOOLS.flatMap((t) => t.categories)))],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FREE_TOOLS.filter((t) => {
      if (category !== "All" && !t.categories.includes(category)) return false;
      if (freeFilter !== "all" && t.freeType !== freeFilter) return false;
      if (platform !== "all" && !t.platforms.includes(platform)) return false;
      if (q) {
        const haystack = [
          t.name,
          t.nameBn,
          t.tagline,
          t.description,
          ...t.categories,
          ...t.features.map((f) => f.name),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, category, freeFilter, platform]);

  const hasActiveFilters =
    query !== "" ||
    category !== "All" ||
    freeFilter !== "all" ||
    platform !== "all";

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setFreeFilter("all");
    setPlatform("all");
  };

  return (
    <section id="tools" className="scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            The catalog
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            Six free tools, zero guesswork
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Search by name or feature, filter by category, price model, or
            platform. Every card links straight to the official tool.
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative mx-auto max-w-xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, features, or Bengali names…"
              aria-label="Search free tools"
              className="h-11 border-zinc-700/80 bg-zinc-900/50 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="group"
              aria-label="Filter by category"
            >
              <FilterChip active={category === "All"} onClick={() => setCategory("All")}>
                All categories
              </FilterChip>
              {categories
                .filter((c) => c !== "All")
                .map((c) => (
                  <FilterChip
                    key={c}
                    active={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </FilterChip>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                Free model
              </span>
              <FilterChip
                active={freeFilter === "all"}
                onClick={() => setFreeFilter("all")}
              >
                All
              </FilterChip>
              <FilterChip
                active={freeFilter === "completely-free"}
                onClick={() => setFreeFilter("completely-free")}
              >
                100% free
              </FilterChip>
              <FilterChip
                active={freeFilter === "freemium"}
                onClick={() => setFreeFilter("freemium")}
              >
                Freemium
              </FilterChip>
              <span className="ml-2 text-[11px] uppercase tracking-wide text-zinc-600">
                Platform
              </span>
              <FilterChip
                active={platform === "all"}
                onClick={() => setPlatform("all")}
              >
                All
              </FilterChip>
              <FilterChip active={platform === "web"} onClick={() => setPlatform("web")}>
                <Globe className="mr-1 inline h-3 w-3" aria-hidden /> Web
              </FilterChip>
              <FilterChip
                active={platform === "android"}
                onClick={() => setPlatform("android")}
              >
                <Smartphone className="mr-1 inline h-3 w-3" aria-hidden /> Android
              </FilterChip>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-500" aria-live="polite">
            Showing {filtered.length} of {FREE_TOOLS.length} free tools
            {hasActiveFilters && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="underline decoration-dotted underline-offset-4 transition-colors hover:text-emerald-300"
                >
                  Reset filters
                </button>
              </>
            )}
          </p>
        </div>

        {filtered.length > 0 ? (
          <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((tool: Tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-md rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center"
          >
            <SearchX className="mx-auto h-8 w-8 text-zinc-600" aria-hidden />
            <h3 className="mt-4 font-semibold text-zinc-200">No tools match</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Try a different keyword or loosen the filters — e.g. search
              &ldquo;budget&rdquo;, &ldquo;quiz&rdquo;, or &ldquo;হিসাব&rdquo;.
            </p>
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="mt-5 border-zinc-700 bg-transparent text-zinc-300 hover:border-emerald-500/50 hover:bg-zinc-800 hover:text-white"
            >
              Reset all filters
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function ToolsHub() {
  return (
    <div
      id="top"
      className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased"
    >
      <Header />
      <main className="flex-1">
        <Hero />
        <ToolsExplorer />
        <CompareSection />
        <EcosystemSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
