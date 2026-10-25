"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUp, Asterisk, Command, Dices, Search } from "lucide-react";
import {
  CATEGORIES,
  TOOLS,
  TOOL_COUNT,
  searchTools,
  type CategoryId,
  type ToolMeta,
} from "./registry";
import {
  BADGES,
  Burst,
  CAT_COLORS,
  ColorDot,
  FrameSticker,
  SectionHead,
  SpeechBubble,
  StickyNote,
  BadgeChip,
  chipBase,
} from "./bruts";

/* ==========================================================================
   HOME — ticker / hero / marquee / headliners / directory / footer
   ========================================================================== */

const INDEX_OF = new Map(TOOLS.map((t, i) => [t.id, i + 1]));

const CARD_SHADOWS = [
  "#FFD43B",
  "#FF9DE2",
  "#7FC8FF",
  "#5EE39A",
  "#FF7A3D",
  "#B9A6FF",
  "#C6F24E",
  "#4ECDC4",
  "#FF8A7A",
];

export interface HomeProps {
  onOpenTool: (id: string) => void;
  onSurprise: () => void;
  onOpenPalette: () => void;
  cat: CategoryId | "all";
  setCat: (c: CategoryId | "all") => void;
  query: string;
  setQuery: (q: string) => void;
  onCatJump: (c: CategoryId) => void;
}

/* ------------------------------- Ticker ----------------------------------- */

const TICKER_ITEMS = [
  "NO UPLOADS",
  "NO SIGN-UPS",
  "NO TRACKING",
  "ACTUALLY FREE",
  "RUNS 100% IN YOUR BROWSER",
  `${TOOL_COUNT} TOOLS & COUNTING`,
];

function TickerHalf() {
  return (
    <div className="flex w-max items-center">
      {TICKER_ITEMS.map((t, i) => (
        <span
          key={i}
          className="flex items-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#F3EFE6]"
        >
          <span className="px-4">{t}</span>
          <Asterisk className="h-3.5 w-3.5 text-[#FFD43B]" strokeWidth={3} />
        </span>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <div
      className="overflow-hidden border-b-[3px] border-[#141414] bg-[#141414] py-1.5"
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee">
        <TickerHalf />
        <TickerHalf />
      </div>
    </div>
  );
}

/* -------------------------------- Hero ------------------------------------ */

const letterVar = {
  hidden: { y: "112%" },
  show: (i: number) => ({
    y: "0%",
    transition: { type: "spring" as const, stiffness: 170, damping: 21, delay: 0.06 * i },
  }),
};

function Sticker({
  className,
  rotate,
  anim,
  delay = 0,
  children,
}: {
  className: string;
  rotate: string;
  anim: "wiggle" | "float";
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 15, delay }}
      className={`absolute z-10 ${className}`}
    >
      <div
        className={anim === "wiggle" ? "animate-wiggle" : "animate-float"}
        style={{ ["--wig" as string]: rotate } as React.CSSProperties}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Hero({
  onSurprise,
  onOpenPalette,
  onCatJump,
}: Pick<HomeProps, "onSurprise" | "onOpenPalette" | "onCatJump">) {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#141414] bg-[#141414] text-[#F3EFE6]">
      <div className="dots-light absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-[#F3EFE6]/50 sm:text-[10px]"
        >
          <span>ZYRIC.TECH — THE WEB&rsquo;S JUNK DRAWER</span>
          <span className="hidden sm:block">EST. 2026 — FREE FOREVER</span>
        </motion.div>

        {/* ---- Giant outlined wordmark + sticker chaos ---- */}
        <div className="relative select-none">
          <Sticker
            className="-top-7 right-[4%] hidden md:block lg:right-[10%]"
            rotate="-8deg"
            anim="wiggle"
            delay={0.7}
          >
            <Burst text="ACTUALLY FREE" bg="#FFD43B" size={104} spin />
          </Sticker>

          <Sticker
            className="bottom-[12%] left-0 hidden lg:block"
            rotate="2deg"
            anim="float"
            delay={0.85}
          >
            <SpeechBubble author="priya" rotate="0deg" className="w-48">
              my files never leave my laptop
            </SpeechBubble>
          </Sticker>

          <Sticker
            className="-top-4 left-[8%] hidden md:block lg:left-[14%]"
            rotate="-6deg"
            anim="wiggle"
            delay={1}
          >
            <FrameSticker lines={["WORK LOCAL", "STAY PRIVATE"]} bg="#5EE39A" rotate="0deg" />
          </Sticker>

          <h1
            className="text-stroke-cream font-brut uppercase leading-[0.85]"
            style={{ fontSize: "clamp(4.2rem, 19vw, 16.5rem)" }}
            aria-label="ZYRIC"
          >
            {"ZYRIC".split("").map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <motion.span
                  custom={i}
                  variants={letterVar}
                  initial="hidden"
                  animate="show"
                  whileHover={{ color: "#FFD43B" }}
                  className="inline-block"
                >
                  {ch}
                </motion.span>
              </span>
            ))}
          </h1>

          <Sticker
            className="-bottom-8 right-[2%] z-20 md:right-[6%]"
            rotate="-6deg"
            anim="wiggle"
            delay={0.9}
          >
            <StickyNote author="a reformed tab hoarder" rotate="0deg" className="w-40 sm:w-44">
              no more 47 open tabs!!!
            </StickyNote>
          </Sticker>
        </div>

        {/* ---- Sub-line ---- */}
        <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <motion.p
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 200, damping: 20 }}
            className="font-brut text-xl uppercase text-[#FFD43B] sm:text-3xl"
          >
            Tab hoarders, meet your match!
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F3EFE6]/60 sm:text-xs"
          >
            {TOOL_COUNT} tools · 12 shelves · 0 servers
          </motion.p>
        </div>

        {/* ---- Manifesto + CTAs ---- */}
        <div className="mt-12 grid gap-10 md:grid-cols-[1.25fr_1fr] md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 160, damping: 20 }}
          >
            <p className="max-w-xl text-base leading-relaxed text-[#F3EFE6]/80 sm:text-lg">
              A junk drawer of {TOOL_COUNT} free tools that run entirely in your browser. No
              uploads. No accounts. No &ldquo;sign up to see your result&rdquo; nonsense. Open a
              tool, get it done, close the tab — your data never leaves your device.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#toolbox"
                className="brut-lift inline-flex items-center gap-2 border-2 border-[#141414] bg-[#C6F24E] px-5 py-3.5 font-brut text-sm uppercase text-[#141414]"
                style={{ boxShadow: "5px 5px 0 #F3EFE6" }}
              >
                DIG THROUGH THE TOOLBOX
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </a>
              <button
                type="button"
                onClick={onSurprise}
                className="brut-lift inline-flex items-center gap-2 border-2 border-[#141414] bg-white px-5 py-3.5 font-brut text-sm uppercase text-[#141414]"
                style={{ boxShadow: "5px 5px 0 #FF9DE2" }}
              >
                <Dices className="h-4 w-4" strokeWidth={2.5} />
                SPIN THE DRAWER
              </button>
              <button
                type="button"
                onClick={onOpenPalette}
                aria-label="Quick search (Command K)"
                className="brut-lift inline-flex items-center gap-2 border-2 border-[#F3EFE6]/40 px-4 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#F3EFE6]/80 hover:border-[#FFD43B] hover:text-[#FFD43B]"
              >
                <Command className="h-3.5 w-3.5" />
                K — QUICK SEARCH
              </button>
            </div>
          </motion.div>

          {/* Stat block */}
          <motion.dl
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 160, damping: 20 }}
            className="grid grid-cols-2 gap-2.5 font-mono uppercase"
          >
            {[
              [String(TOOL_COUNT), "tools online"],
              ["12", "categories"],
              ["0", "files uploaded"],
              ["$0", "forever"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="border-2 border-[#F3EFE6]/25 px-4 py-3 transition-colors hover:border-[#FFD43B]"
              >
                <dt className="sr-only">{l}</dt>
                <dd className="font-brut text-2xl text-[#FFD43B] sm:text-3xl">{v}</dd>
                <dd className="mt-0.5 text-[9px] tracking-[0.18em] text-[#F3EFE6]/60">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ---- Category pills ---- */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.8 } } }}
          className="mt-12 flex flex-wrap gap-2"
        >
          {CATEGORIES.map((c) => (
            <motion.button
              key={c.id}
              type="button"
              variants={{
                hidden: { opacity: 0, scale: 0.7, rotate: -6 },
                show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 17 } },
              }}
              whileHover={{ y: -3 }}
              onClick={() => onCatJump(c.id)}
              className="brut-lift border-2 border-[#141414] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#141414]"
              style={{ background: CAT_COLORS[c.id] }}
            >
              {c.label}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------- Scrolling name index -------------------------- */

function NameMarquee({ onOpenTool }: { onOpenTool: (id: string) => void }) {
  const names = TOOLS.map((t) => t.name.toUpperCase());
  return (
    <div
      className="overflow-hidden border-b-[3px] border-[#141414] bg-[#FFD43B] py-2.5"
      aria-hidden="false"
    >
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {[0, 1].map((halfIdx) => (
          <div key={halfIdx} className="flex w-max items-center" aria-hidden={halfIdx === 1}>
            {names.map((n, i) => (
              <button
                key={i}
                type="button"
                tabIndex={halfIdx === 1 ? -1 : 0}
                onClick={() => onOpenTool(TOOLS[i].id)}
                className="group flex items-center"
              >
                <span className="px-3 font-brut text-sm uppercase text-[#141414] transition-colors group-hover:text-[#FF7A3D]">
                  {n}
                </span>
                <Asterisk className="h-3 w-3 text-[#141414]/70" strokeWidth={3} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Headliners --------------------------------- */

function Headliners({ onOpenTool }: { onOpenTool: (id: string) => void }) {
  const sig = TOOLS.filter((t) => t.category === "signature");
  return (
    <section id="headliners" className="relative border-b-[3px] border-[#141414] bg-[#141414] py-16 text-[#F3EFE6] sm:py-20">
      <div className="dots-light absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          dark
          accent="#FF9DE2"
          kicker="NOT ON ANY OTHER SITE — ONLY HERE"
          title="The Headliners"
          right={
            <div className="hidden md:block">
              <Burst text={`${sig.length} EXCLUSIVES`} bg="#FFD43B" size={96} />
            </div>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sig.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => onOpenTool(t.id)}
                initial={{ opacity: 0, y: 30, rotate: i % 2 ? 2.5 : -2.5 }}
                whileInView={{ opacity: 1, y: 0, rotate: i % 2 ? 1 : -1 }}
                viewport={{ once: true, margin: "-40px" }}
                whileHover={{ rotate: 0, y: -5 }}
                transition={{ type: "spring", stiffness: 210, damping: 19, delay: (i % 3) * 0.08 }}
                className="group relative border-[3px] border-[#141414] bg-[#F3EFE6] p-5 text-left"
                style={{ boxShadow: `7px 7px 0 ${CARD_SHADOWS[i % CARD_SHADOWS.length]}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center border-2 border-[#141414]"
                    style={{ background: CAT_COLORS[t.category] }}
                  >
                    <Icon className="h-5 w-5 text-[#141414]" strokeWidth={2.4} />
                  </span>
                  <span className={chipBase} style={{ background: "#FFD43B" }}>
                    ★ ONLY HERE
                  </span>
                </div>
                <h3 className="mt-4 font-brut text-lg uppercase leading-tight text-[#141414]">
                  {t.name}
                </h3>
                <p className="mt-2 text-sm leading-snug text-[#141414]/70">{t.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414]">
                  OPEN IT
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5"
                    strokeWidth={3}
                  />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Directory --------------------------------- */

function FilterPill({
  active,
  onClick,
  label,
  bg,
  fg = "#141414",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  bg: string;
  fg?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border-2 border-[#141414] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-150 ${
        active ? "brut-shadow-sm -translate-y-0.5" : "bg-white hover:-translate-y-0.5"
      }`}
      style={active ? { background: bg, color: fg } : undefined}
    >
      {label}
    </button>
  );
}

function ToolCard({ tool, onOpen }: { tool: ToolMeta; onOpen: (id: string) => void }) {
  const Icon = tool.icon;
  const idx = INDEX_OF.get(tool.id) ?? 0;
  const catLabel = CATEGORIES.find((c) => c.id === tool.category)?.label ?? "";
  return (
    <motion.button
      layout
      type="button"
      onClick={() => onOpen(tool.id)}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 330, damping: 26 }}
      className="group relative flex flex-col border-2 border-[#141414] bg-white p-4 text-left transition-shadow duration-150 brut-shadow-sm hover:shadow-[7px_7px_0_#141414]"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-10 w-10 items-center justify-center border-2 border-[#141414] transition-transform duration-150 group-hover:-rotate-6"
          style={{ background: CAT_COLORS[tool.category] }}
        >
          <Icon className="h-4.5 w-4.5 text-[#141414]" strokeWidth={2.4} />
        </span>
        <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#141414]/35">
          {String(idx).padStart(3, "0")}
        </span>
      </div>
      <h3 className="mt-3 font-brut text-[15px] uppercase leading-tight text-[#141414]">
        {tool.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-[#141414]/65">
        {tool.description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={chipBase} style={{ background: CAT_COLORS[tool.category] }}>
          {catLabel}
        </span>
        <BadgeChip badge={tool.badge} />
      </div>
    </motion.button>
  );
}

function Directory({
  onOpenTool,
  onSurprise,
  cat,
  setCat,
  query,
  setQuery,
}: Pick<HomeProps, "onOpenTool" | "onSurprise" | "cat" | "setCat" | "query" | "setQuery">) {
  const searched = query.trim() ? searchTools(query) : TOOLS;
  const filtered = cat === "all" ? searched : searched.filter((t) => t.category === cat);

  return (
    <section id="toolbox" className="relative bg-[#F3EFE6] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          accent="#C6F24E"
          kicker="THE FULL INDEX — EVERY LAST ONE"
          title="The Whole Toolbox"
          right={
            <div className="hidden md:block">
              <Burst text={`${TOOL_COUNT} TOOLS`} bg="#C6F24E" size={96} />
            </div>
          }
        />

        {/* Controls */}
        <div className="mb-9 flex flex-col gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#141414]/50"
              strokeWidth={2.5}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH THE DRAWER…"
              aria-label="Search tools"
              className="brut-shadow-sm w-full border-[3px] border-[#141414] bg-white py-3.5 pl-11 pr-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#141414] placeholder:text-[#141414]/40 focus:shadow-[6px_6px_0_#141414] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              active={cat === "all"}
              onClick={() => setCat("all")}
              label={`ALL · ${TOOLS.length}`}
              bg="#141414"
              fg="#F3EFE6"
            />
            {CATEGORIES.map((c) => (
              <FilterPill
                key={c.id}
                active={cat === c.id}
                onClick={() => setCat(cat === c.id ? "all" : c.id)}
                label={`${c.label} · ${TOOLS.filter((t) => t.category === c.id).length}`}
                bg={CAT_COLORS[c.id]}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((t) => (
                <ToolCard key={t.id} tool={t} onOpen={onOpenTool} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="border-[3px] border-dashed border-[#141414]/40 p-12 text-center">
            <p className="font-brut text-2xl uppercase text-[#141414]">
              Nothing in this drawer.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#141414]/60">
              Try another word — or pull the surprise lever.
            </p>
            <button
              type="button"
              onClick={onSurprise}
              className="brut-lift brut-shadow-sm mt-5 inline-flex items-center gap-2 border-2 border-[#141414] bg-[#FF9DE2] px-5 py-3 font-brut text-sm uppercase text-[#141414]"
            >
              <Dices className="h-4 w-4" strokeWidth={2.5} />
              SURPRISE ME
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------- Footer ----------------------------------- */

function Footer({ onCatJump }: Pick<HomeProps, "onCatJump">) {
  return (
    <footer className="relative overflow-hidden bg-[#141414] pt-14 text-[#F3EFE6]">
      <div className="dots-light absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-xs">
            <p className="font-brut text-2xl uppercase">
              ZYRIC<span className="text-[#FFD43B]">.</span>TECH
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#F3EFE6]/70">
              The web&rsquo;s junk drawer. {TOOL_COUNT} tools that respect your files, your
              privacy and your time.
            </p>
            <span className={`${chipBase} mt-4 inline-flex`} style={{ background: "#C6F24E" }}>
              NO CLOUD · NO NONSENSE
            </span>
          </div>

          <nav aria-label="Tool categories" className="grid grid-cols-2 gap-x-12 gap-y-2.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCatJump(c.id)}
                className="flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F3EFE6]/65 transition-colors hover:text-[#FFD43B]"
              >
                <ColorDot color={CAT_COLORS[c.id]} />
                {c.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#F3EFE6]/15 py-4 font-mono text-[9px] uppercase tracking-[0.18em] text-[#F3EFE6]/50">
          <span>© 2026 ZYRIC.TECH — MADE FOR THE BROWSER</span>
          <span className="hidden sm:block">EVERY TOOL RUNS ON YOUR DEVICE</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1.5 transition-colors hover:text-[#FFD43B]"
          >
            BACK TO TOP
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Giant cropped wordmark */}
        <div
          className="pointer-events-none relative h-[13vw] max-h-36 select-none overflow-hidden"
          aria-hidden="true"
        >
          <p
            className="text-stroke-cream font-brut absolute left-1/2 top-0 -translate-x-1/2 uppercase leading-[0.8]"
            style={{ fontSize: "clamp(5rem, 21vw, 19rem)" }}
          >
            ZYRIC
          </p>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------- Home ------------------------------------ */

export function Home(props: HomeProps) {
  return (
    <>
      <Hero
        onSurprise={props.onSurprise}
        onOpenPalette={props.onOpenPalette}
        onCatJump={props.onCatJump}
      />
      <NameMarquee onOpenTool={props.onOpenTool} />
      <Headliners onOpenTool={props.onOpenTool} />
      <Directory
        onOpenTool={props.onOpenTool}
        onSurprise={props.onSurprise}
        cat={props.cat}
        setCat={props.setCat}
        query={props.query}
        setQuery={props.setQuery}
      />
      <Footer onCatJump={props.onCatJump} />
    </>
  );
}

/* Badge map re-exported for the app chrome (kept here to avoid cycles) */
export { BADGES };
