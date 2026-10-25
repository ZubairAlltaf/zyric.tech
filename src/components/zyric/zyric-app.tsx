"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Asterisk,
  Command as CommandIcon,
  Dices,
  Menu,
  X,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CATEGORIES, TOOLS, TOOL_COUNT, type ToolMeta } from "./registry";
import { CAT_COLORS, chipBase } from "./bruts";
import { Home, Ticker } from "./home";
import {
  CustomCursor,
  GrainOverlay,
  Magnetic,
  Preloader,
  ScrambleText,
  ScrollProgress,
  launchConfetti,
} from "./experience";

/* ==========================================================================
   ZYRIC APP — brutal chrome around 75 dark machine islands
   ========================================================================== */

/**
 * Deterministic tool scoring — Zyric ranks results itself (cmdk's DOM reordering
 * is unreliable under React 19, so we render a pre-ranked flat list instead).
 * Order: name-prefix > name-substring > keyword/substring > all-words > subsequence.
 */
function scoreTool(t: ToolMeta, raw: string): number {
  const s = raw.toLowerCase().trim();
  if (!s) return 1;
  const name = t.name.toLowerCase();
  const hay = `${t.name} ${t.keywords} ${t.category}`.toLowerCase();
  if (name.startsWith(s)) return 100;
  if (name.includes(s)) return 80;
  if (hay.includes(s)) return 60;
  const words = s.split(/\s+/);
  if (words.length > 1 && words.every((w) => hay.includes(w))) return 40;
  let i = 0;
  for (let c = 0; c < name.length && i < s.length; c++) {
    if (name[c] === s[i]) i++;
  }
  if (i === s.length) return 20;
  i = 0;
  for (let c = 0; c < hay.length && i < s.length; c++) {
    if (hay[c] === s[i]) i++;
  }
  return i === s.length ? 10 : 0;
}

function rankTools(query: string): ToolMeta[] {
  return TOOLS.map((t, i) => ({ t, score: scoreTool(t, query), i }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.t);
}

function jumpTo(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------------------------- Nav ----------------------------------- */

function Nav({
  onHome,
  onOpenPalette,
  onOpenMenu,
  onSurprise,
}: {
  onHome: () => void;
  onOpenPalette: () => void;
  onOpenMenu: () => void;
  onSurprise: () => void;
}) {
  const clicks = useRef(0);
  const clickTimer = useRef<number | null>(null);
  const [egg, setEgg] = useState(false);

  const onLogo = () => {
    onHome();
    clicks.current += 1;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      clicks.current = 0;
    }, 900);
    if (clicks.current >= 5) {
      clicks.current = 0;
      launchConfetti(window.innerWidth / 2, 46);
      setEgg(true);
      window.setTimeout(() => setEgg(false), 1500);
    }
  };

  useEffect(
    () => () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
    },
    []
  );

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[#141414] bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onLogo}
          className="group flex items-center gap-2"
          aria-label="Zyric home"
          title="(psst — click me 5 times)"
        >
          <span className="font-brut text-[26px] uppercase leading-none tracking-tight text-[#141414]">
            ZYRIC
          </span>
          <Asterisk
            className="h-5 w-5 animate-spin-slow text-[#FF7A3D] transition-transform duration-300 group-hover:scale-125"
            strokeWidth={3.2}
          />
          <span
            className={`${chipBase} rotate-2 transition-colors ${egg ? "!bg-[#FF9DE2]" : ""}`}
            style={{ background: egg ? undefined : "#FFD43B" }}
          >
            {egg ? "★ NICE!" : `${TOOL_COUNT} TOOLS`}
          </span>
        </button>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          <button
            type="button"
            onClick={() => jumpTo("headliners")}
            className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414] underline-offset-4 hover:underline hover:decoration-[#FF7A3D] hover:decoration-[3px]"
          >
            <ScrambleText text="THE HEADLINERS" />
          </button>
          <button
            type="button"
            onClick={() => jumpTo("toolbox")}
            className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414] underline-offset-4 hover:underline hover:decoration-[#C6F24E] hover:decoration-[3px]"
          >
            <ScrambleText text="THE TOOLBOX" />
          </button>
          <button
            type="button"
            onClick={onSurprise}
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414] underline-offset-4 hover:underline hover:decoration-[#FF9DE2] hover:decoration-[3px]"
          >
            <Dices className="h-3.5 w-3.5" strokeWidth={2.5} />
            <ScrambleText text="SURPRISE ME" />
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <Magnetic strength={0.25} className="hidden sm:inline-block">
            <button
              type="button"
              onClick={onOpenPalette}
              className="brut-lift brut-shadow-xs inline-flex items-center gap-2 border-2 border-[#141414] bg-[#141414] px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F3EFE6] hover:bg-[#FFD43B] hover:text-[#141414]"
            >
              <CommandIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
              K · SEARCH
            </button>
          </Magnetic>
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="brut-lift brut-shadow-xs border-2 border-[#141414] bg-[#FFD43B] p-2 md:hidden"
          >
            <Menu className="h-5 w-5 text-[#141414]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Mobile menu -------------------------------- */

function MobileMenu({
  open,
  onClose,
  onHome,
  onSurprise,
  onCatJump,
}: {
  open: boolean;
  onClose: () => void;
  onHome: () => void;
  onSurprise: () => void;
  onCatJump: (c: (typeof CATEGORIES)[number]["id"]) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const act = (fn: () => void) => () => {
    onClose();
    window.setTimeout(fn, 80);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#141414] text-[#F3EFE6]"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="dots-light absolute inset-0" aria-hidden="true" />
          <div className="relative flex h-16 items-center justify-between border-b-[3px] border-[#F3EFE6]/15 px-4 sm:px-6">
            <button
              type="button"
              onClick={act(onHome)}
              className="font-brut text-2xl uppercase tracking-tight"
            >
              ZYRIC
              <span className="ml-2 inline-block rotate-2 border-2 border-[#141414] bg-[#FFD43B] px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#141414]">
                {TOOL_COUNT} TOOLS
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="border-2 border-[#F3EFE6]/40 p-2 text-[#F3EFE6]"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <nav
            className="relative flex-1 overflow-y-auto px-4 py-8 sm:px-6"
            aria-label="Mobile"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
              }}
              className="flex flex-col gap-5"
            >
              {[
                { label: "The Headliners", color: "#FFD43B", fn: () => jumpTo("headliners") },
                { label: "The Whole Toolbox", color: "#F3EFE6", fn: () => jumpTo("toolbox") },
                { label: "Surprise Me", color: "#FF9DE2", fn: onSurprise },
              ].map((l) => (
                <motion.button
                  key={l.label}
                  type="button"
                  variants={{
                    hidden: { x: -28, opacity: 0 },
                    show: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 220, damping: 20 } },
                  }}
                  onClick={act(() => {
                    onClose();
                    window.setTimeout(l.fn, 120);
                  })}
                  className="text-left font-brut text-4xl uppercase leading-none"
                  style={{ color: l.color }}
                >
                  {l.label}
                </motion.button>
              ))}

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
                }}
                className="mt-6 grid grid-cols-1 gap-2.5 border-t-2 border-[#F3EFE6]/15 pt-6 sm:grid-cols-2"
              >
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={act(() => onCatJump(c.id))}
                    className="flex items-center gap-3 border-2 border-[#F3EFE6]/15 px-3 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F3EFE6]/80 hover:border-[#F3EFE6]/40"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 border border-[#141414]"
                      style={{ background: CAT_COLORS[c.id] }}
                    />
                    {c.label}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </nav>

          <div className="relative border-t-[3px] border-[#F3EFE6]/15 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#F3EFE6]/45 sm:px-6">
            NO UPLOADS · NO SIGN-UPS · RUNS ON YOUR DEVICE
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ---------------------------- Command palette ------------------------------ */

function PaletteItems({
  results,
  onOpenTool,
  close,
}: {
  results: ToolMeta[];
  onOpenTool: (id: string) => void;
  close: () => void;
}) {
  const pick = (t: ToolMeta) => () => {
    close();
    onOpenTool(t.id);
  };
  return (
    <CommandGroup
      heading={results.length === TOOLS.length ? "Browse everything — type to filter" : `Top matches · ${results.length}`}
    >
      {results.map((t) => {
        const Icon = t.icon;
        const isSig = t.category === "signature";
        return (
          <CommandItem key={t.id} value={`${t.name} ${t.keywords}`} onSelect={pick(t)}>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[#141414]"
              style={{ background: CAT_COLORS[t.category] }}
            >
              <Icon className="h-3.5 w-3.5 text-[#141414]" strokeWidth={2.5} />
            </span>
            <span className={isSig ? "font-bold" : undefined}>{t.name}</span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-[#141414]/45">
              {isSig ? "★ signature" : t.category}
            </span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

/* -------------------------------- Tool view -------------------------------- */

function Screw({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 h-3 w-3 rounded-full border-2 border-zinc-700 bg-zinc-800 ${className}`}
    >
      <span className="absolute left-1/2 top-1/2 h-[1.5px] w-[72%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-zinc-500" />
    </span>
  );
}

function ToolView({
  tool,
  onBack,
  onOpenTool,
}: {
  tool: ToolMeta;
  onBack: () => void;
  onOpenTool: (id: string) => void;
}) {
  const idx = TOOLS.findIndex((t) => t.id === tool.id);
  const n = TOOLS.length;
  const prev = TOOLS[(idx - 1 + n) % n];
  const next = TOOLS[(idx + 1) % n];
  const catLabel = CATEGORIES.find((c) => c.id === tool.category)?.label ?? "";
  const Tool = tool.component;
  const serial = `ZYR-${String(idx + 1).padStart(3, "0")}·26`;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="brut-lift brut-shadow-sm inline-flex items-center gap-2 border-2 border-[#141414] bg-white px-4 py-2.5 font-brut text-xs uppercase text-[#141414]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          BACK TO THE PILE
        </button>
        <div className="flex items-center gap-3">
          <span className={chipBase} style={{ background: CAT_COLORS[tool.category] }}>
            {catLabel}
          </span>
          <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#141414]/50">
            № {String(idx + 1).padStart(3, "0")} / {n}
          </span>
        </div>
      </div>

      {/* Rubber-stamp title */}
      <motion.h1
        initial={{ scale: 1.9, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 17 }}
        className="origin-left font-brut text-3xl uppercase leading-tight text-[#141414] sm:text-4xl"
      >
        {tool.name}
      </motion.h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#141414]/70">
        {tool.description}
      </p>

      {/* The machine island — wipes down like a factory shutter */}
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)", y: 8 }}
        animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1], delay: 0.08 }}
        className="brut-shadow-lg relative mt-7 border-[3px] border-[#141414] bg-zinc-950 text-zinc-100"
      >
        <Screw className="left-2 top-2" />
        <Screw className="right-2 top-2" />
        <Screw className="bottom-2 left-2" />
        <Screw className="bottom-2 right-2" />

        <div className="flex items-center justify-between gap-3 border-b-2 border-zinc-800 px-4 py-2.5">
          <span className="mono-kicker text-zinc-500">the machine — runs on your device</span>
          <span className="hidden items-center gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600 sm:flex">
            <span>SN {serial}</span>
            <span className="h-3 w-px bg-zinc-700" />
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 border border-black bg-[#FF8A7A]" />
              <span className="h-2.5 w-2.5 border border-black bg-[#FFD43B]" />
              <span className="h-2.5 w-2.5 border border-black bg-[#5EE39A]" />
            </span>
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <Tool />
        </div>
      </motion.div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenTool(prev.id)}
          className="group inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#141414]/60 hover:text-[#141414]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          {prev.name}
        </button>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-[#141414]/35 md:block">
          tip — use ← → keys to walk the drawer
        </span>
        <button
          type="button"
          onClick={() => onOpenTool(next.id)}
          className="group inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#141414]/60 hover:text-[#141414]"
        >
          {next.name}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.main>
  );
}

/* --------------------------------- App ------------------------------------- */

export default function ZyricApp() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [cat, setCat] = useState<"all" | (typeof CATEGORIES)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  const paletteResults = useMemo(() => rankTools(paletteQuery), [paletteQuery]);

  const openPalette = useCallback(() => {
    setPaletteMounted(true);
    setPaletteQuery("");
    setPaletteOpen(true);
  }, []);

  const openTool = useCallback((id: string) => {
    setActiveToolId(id);
    setMenuOpen(false);
    scrollToTop();
  }, []);

  const backToPile = useCallback(() => {
    setActiveToolId(null);
    jumpTo("toolbox");
  }, []);

  const goHome = useCallback(() => {
    setActiveToolId(null);
    setMenuOpen(false);
    scrollToTop();
  }, []);

  const surprise = useCallback(() => {
    const pool = TOOLS.filter((t) => t.id !== activeToolId);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) openTool(pick.id);
  }, [activeToolId, openTool]);

  const catJump = useCallback(
    (c: (typeof CATEGORIES)[number]["id"]) => {
      setActiveToolId(null);
      setCat(c);
      setMenuOpen(false);
      jumpTo("toolbox");
    },
    []
  );

  const activeTool = activeToolId ? TOOLS.find((t) => t.id === activeToolId) ?? null : null;

  /* Keyboard: Cmd/Ctrl+K anywhere, "/" when not typing, ←/→ walks the drawer */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "/" && !paletteOpen) {
        const el = e.target as HTMLElement | null;
        const typing =
          el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setPaletteMounted(true);
          setPaletteOpen(true);
        }
        return;
      }
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && activeToolId) {
        const el = e.target as HTMLElement | null;
        const typing =
          el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable);
        if (typing) return;
        const idx = TOOLS.findIndex((t) => t.id === activeToolId);
        const n = TOOLS.length;
        const nextTool =
          e.key === "ArrowRight" ? TOOLS[(idx + 1) % n] : TOOLS[(idx - 1 + n) % n];
        if (nextTool) {
          e.preventDefault();
          openTool(nextTool.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, activeToolId, openTool]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3EFE6] text-[#141414]">
      <Preloader />
      <CustomCursor />
      <GrainOverlay />
      <ScrollProgress />
      <Ticker />
      <Nav
        onHome={goHome}
        onOpenPalette={openPalette}
        onOpenMenu={() => setMenuOpen(true)}
        onSurprise={surprise}
      />

      <AnimatePresence mode="wait">
        {activeTool ? (
          <ToolView
            key={`tool-${activeTool.id}`}
            tool={activeTool}
            onBack={backToPile}
            onOpenTool={openTool}
          />
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <Home
              onOpenTool={openTool}
              onSurprise={surprise}
              onOpenPalette={openPalette}
              cat={cat}
              setCat={setCat}
              query={query}
              setQuery={setQuery}
              onCatJump={catJump}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onHome={goHome}
        onSurprise={surprise}
        onCatJump={catJump}
      />

      {paletteMounted ? (
        <CommandDialog
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          shouldFilter={false}
          className="brut-palette left-1/2 top-[10%] w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 translate-y-0"
        >
          <CommandInput
            placeholder={`SEARCH ${TOOL_COUNT} TOOLS…`}
            onValueChange={setPaletteQuery}
          />
          <CommandList className="max-h-[340px]">
            <CommandEmpty className="py-8 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414]/50">
              Nothing in this drawer — try another word.
            </CommandEmpty>
            <PaletteItems
              results={paletteResults}
              onOpenTool={openTool}
              close={() => setPaletteOpen(false)}
            />
          </CommandList>
          <div className="flex items-center justify-between border-t-2 border-[#141414] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#141414]/50">
            <span>↵ OPEN · ESC CLOSE</span>
            <span>{paletteResults.length} / {TOOL_COUNT} TOOLS</span>
          </div>
        </CommandDialog>
      ) : null}
    </div>
  );
}
