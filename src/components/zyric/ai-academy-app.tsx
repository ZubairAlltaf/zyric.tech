"use client";

/* ==========================================================================
   THE AI ACADEMY — zyric.tech's third wing: complete, free roadmaps that take
   a student from absolute zero to provable AI skill.
   Own identity: electric indigo + acid cyan on cream, syllabus cards,
   punch-hole progress stamps. Not a tool screen — a school building.
   Progress is saved on-device only (localStorage). No accounts, ever.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, BrainCircuit, CheckCircle2, Clock, Code2, Compass, ExternalLink,
  GraduationCap, Layers, RotateCcw, Route, Rocket, Sparkles, Trophy, X, Zap,
} from "lucide-react";
import {
  STEP_KIND_META, TOTAL_MINS, TOTAL_STEPS, TRACKS, trackStats,
  type RoadTrack, type TrackId,
} from "./ai-roadmap-data";

/* ------------------------------ palette ----------------------------------- */

const INK = "#141414";
const DEEP = "#241B4D";
const MID = "#372B7E";
const NEON = "#7C5CFF";
const CYAN = "#5CE1E6";
const CREAM = "#F3EFE6";
const PAPER = "#FFFDF6";

const TRACK_ICON: Record<string, typeof Bot> = {
  Bot, Sparkles, BrainCircuit, Code2, Rocket,
};

const LEVEL_META: Record<RoadTrack["level"], { label: string; note: string }> = {
  beginner:  { label: "start here",      note: "no code, no math — just curiosity" },
  confident: { label: "next level",      note: "light math, heavy practice" },
  builder:   { label: "build & ship",    note: "you can code, let's make things" },
};

/* ------------------------------ progress ---------------------------------- */

const PROGRESS_KEY = "zyric-ai-academy-v1";

function readProgress(): Record<string, true> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
}

function stepKey(t: TrackId, s: number, k: number): string {
  return `${t}:${s}:${k}`;
}

function trackDone(t: RoadTrack, prog: Record<string, true>): number {
  let done = 0;
  t.stages.forEach((st, si) => st.steps.forEach((_, ki) => { if (prog[stepKey(t.id, si, ki)]) done += 1; }));
  return done;
}

function useCountUp(target: number, ms = 1100) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function hoursOf(mins: number): string {
  return `${Math.round(mins / 60)}h`;
}

/* ------------------------------ stamp -------------------------------------- */

function FreeStamp({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-block rotate-6 rounded-full border-[2.5px] font-mono font-bold uppercase tracking-[0.1em] ${small ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]"}`}
      style={{ borderColor: CYAN, color: CYAN, background: "rgba(92,225,230,0.12)" }}
    >
      100% free
    </span>
  );
}

/* ------------------------------ syllabus card ------------------------------ */

function SyllabusCard({
  track, index, done, onOpen,
}: {
  track: RoadTrack; index: number; done: number; onOpen: () => void;
}) {
  const Icon = TRACK_ICON[track.icon] ?? Sparkles;
  const { steps, mins } = trackStats(track);
  const pct = Math.round((done / steps) * 100);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.28, delay: Math.min(index % 6, 4) * 0.04 }}
      className="group relative flex flex-col"
    >
      {/* punch holes — a syllabus page torn from a binder */}
      <span aria-hidden className="absolute -left-[9px] top-6 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-[#141414] bg-[#F3EFE6]" />
      <span aria-hidden className="absolute -right-[9px] top-6 z-10 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-[#141414] bg-[#F3EFE6]" />

      <div className="relative flex flex-1 flex-col border-[3px] border-[#141414] brut-shadow bg-[#F3EFE6] transition-transform duration-200 group-hover:-translate-y-1">
        {/* head */}
        <div className="flex items-start justify-between gap-2 border-b-[3px] border-dashed border-[#141414]/30 px-3.5 pb-2.5 pt-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#141414]/50">
              roadmap {String(index + 1).padStart(2, "0")} · {LEVEL_META[track.level].label}
            </p>
            <h3 className="mt-0.5 font-brut text-[15px] uppercase leading-tight tracking-tight text-[#141414]">
              {track.title}
            </h3>
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center border-[2.5px] border-[#141414]"
            style={{ background: track.color }}
          >
            <Icon className="h-4.5 w-4.5 text-[#141414]" strokeWidth={2.5} />
          </span>
        </div>

        {/* tagline */}
        <p className="min-w-0 flex-1 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#141414]/75">
          {track.tagline}
        </p>

        {/* meta chips */}
        <div className="flex flex-wrap gap-1.5 px-3.5">
          <span className="border-2 border-[#141414] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#141414]" style={{ background: track.color }}>
            {track.weeks} weeks
          </span>
          <span className="inline-flex items-center gap-1 border-2 border-[#141414]/25 bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#141414]/70">
            <Clock className="h-3 w-3" strokeWidth={2.5} /> ~{hoursOf(mins)}
          </span>
          <span className="inline-flex items-center gap-1 border-2 border-[#141414]/25 bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#141414]/70">
            <Route className="h-3 w-3" strokeWidth={2.5} /> {steps} steps
          </span>
          <FreeStamp small />
        </div>

        {/* progress + open */}
        <div className="mt-3 border-t-[3px] border-dashed border-[#141414]/30 px-3.5 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full border-2 border-[#141414]/20 bg-white">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: track.color }} />
            </div>
            <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#141414]/50">
              {done}/{steps}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#141414]/40">
              {LEVEL_META[track.level].note}
            </span>
            <button
              type="button"
              onClick={onOpen}
              className="brut-lift border-2 border-[#141414] bg-[#141414] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#F3EFE6] hover:bg-[#7C5CFF] hover:text-[#141414]"
            >
              open roadmap
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------ detail modal ------------------------------- */

function AcademyDetail({
  track, prog, onToggle, onClose, onResetTrack,
}: {
  track: RoadTrack;
  prog: Record<string, true>;
  onToggle: (k: string) => void;
  onClose: () => void;
  onResetTrack: (t: TrackId) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { steps, mins } = trackStats(track);
  const done = trackDone(track, prog);
  const pct = Math.round((done / steps) * 100);

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
        className="brut-shadow-lg max-h-[94vh] w-full max-w-4xl overflow-y-auto border-[3px] border-[#141414] bg-[#F3EFE6]"
      >
        {/* sticky head */}
        <div className="sticky top-0 z-10 border-b-[3px] border-[#141414] px-4 py-3 sm:px-6" style={{ background: DEEP }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#F3EFE6]/60">
                the ai academy · {LEVEL_META[track.level].label} · {track.weeks} weeks · ~{hoursOf(mins)}
              </p>
              <h2 className="font-brut text-lg uppercase leading-tight text-[#F3EFE6] sm:text-2xl">{track.title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close roadmap" className="brut-lift shrink-0 border-2 border-[#141414] bg-[#5CE1E6] p-1.5">
              <X className="h-4 w-4 text-[#141414]" strokeWidth={3} />
            </button>
          </div>
          {/* progress rail */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full border-2 border-[#F3EFE6]/25 bg-[#141414]/30">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: track.color }} />
            </div>
            <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#5CE1E6]">
              {done}/{steps} · {pct}%
            </span>
          </div>
        </div>

        <div className="space-y-5 px-4 py-5 sm:px-6">
          {/* outcomes */}
          <div className="border-[3px] border-[#141414] bg-white p-3.5">
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414]/60">
              after this roadmap you can…
            </p>
            <ul className="space-y-1.5">
              {track.outcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[#141414]/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: track.color }} strokeWidth={2.5} />
                  {o}
                </li>
              ))}
            </ul>
          </div>

          {/* stages */}
          {track.stages.map((stage, si) => {
            const stageDone = stage.steps.filter((_, ki) => prog[stepKey(track.id, si, ki)]).length;
            return (
              <section key={si}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-brut text-base uppercase tracking-tight text-[#141414] sm:text-lg">
                    <span className="mr-2 inline-block -rotate-2 border-2 border-[#141414] px-1.5 font-mono text-[10px] font-bold" style={{ background: track.color }}>
                      {String(si + 1).padStart(2, "0")}
                    </span>
                    {stage.title}
                  </h3>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#141414]/45">
                    {stageDone}/{stage.steps.length} done
                  </span>
                </div>
                <p className="mb-2.5 text-[12px] italic leading-relaxed text-[#141414]/55">goal — {stage.goal}</p>

                <ol className="space-y-2">
                  {stage.steps.map((step, ki) => {
                    const key = stepKey(track.id, si, ki);
                    const isDone = !!prog[key];
                    const kind = STEP_KIND_META[step.kind];
                    return (
                      <li
                        key={ki}
                        className={`border-[3px] border-[#141414] px-3 py-2.5 transition-colors ${isDone ? "bg-[#EAF7E4]" : "bg-white"}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => onToggle(key)}
                            aria-label={isDone ? "Mark step as not done" : "Mark step as done"}
                            aria-pressed={isDone}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-[2.5px] border-[#141414] font-mono text-[10px] font-bold transition-colors ${isDone ? "bg-[#5EE39A]" : "bg-white hover:bg-[#FFD43B]"}`}
                          >
                            {isDone ? <CheckCircle2 className="h-4 w-4 text-[#141414]" strokeWidth={3} /> : ki + 1}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`font-brut text-[13.5px] uppercase leading-tight tracking-tight ${isDone ? "text-[#141414]/50 line-through" : "text-[#141414]"}`}
                              >
                                {step.label}
                              </span>
                              <span
                                className="border-2 border-[#141414] px-1 py-0 font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-[#141414]"
                                style={{ background: `${kind.color}` }}
                              >
                                {kind.label}
                              </span>
                              <span className="inline-flex items-center gap-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#141414]/45">
                                <Clock className="h-2.5 w-2.5" strokeWidth={2.5} /> {step.mins}m
                              </span>
                            </div>
                            <p className="mt-1 text-[12px] leading-relaxed text-[#141414]/70">{step.detail}</p>
                            {step.link ? (
                              <a
                                href={step.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="brut-lift mt-2 inline-flex items-center gap-1 border-2 border-[#141414] bg-[#141414] px-2 py-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#F3EFE6] hover:bg-[#5CE1E6] hover:text-[#141414]"
                              >
                                official page <ExternalLink className="h-2.5 w-2.5" strokeWidth={2.5} />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}

          {/* reset + disclaimer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-[#141414]/20 pt-3">
            <button
              type="button"
              onClick={() => onResetTrack(track.id)}
              className="brut-lift inline-flex items-center gap-1.5 border-2 border-[#141414] bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#141414] hover:bg-[#FF9DE2]"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} /> reset this track
            </button>
            <p className="max-w-md font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-[#141414]/40">
              roadmap {track.title} · all resources are free tiers or free courses at the time of writing — always confirm on the official page. links are official only, never affiliate.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ main wing ---------------------------------- */

const STARTERS: { id: string; label: string; note: string; track: TrackId; icon: typeof Compass }[] = [
  { id: "new", label: "TOTAL BEGINNER", note: "never touched AI", track: "zero-ai", icon: Compass },
  { id: "user", label: "I USE AI A BIT", note: "want pro-level prompts", track: "prompt-craft", icon: Zap },
  { id: "coder", label: "I CAN CODE", note: "teach me ML & building", track: "ml-foundations", icon: Code2 },
];

export function AiAcademyApp() {
  const [prog, setProg] = useState<Record<string, true>>({});
  const [openTrack, setOpenTrack] = useState<TrackId | null>(null);

  useEffect(() => { setProg(readProgress()); }, []);

  const toggle = useCallback((key: string) => {
    setProg((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

  const resetTrack = useCallback((id: TrackId) => {
    setProg((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (k.startsWith(`${id}:`)) delete next[k];
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

  const totalDone = useMemo(() => TRACKS.reduce((a, t) => a + trackDone(t, prog), 0), [prog]);
  const countedSteps = useCountUp(TOTAL_STEPS);
  const countedHours = useCountUp(Math.round(TOTAL_MINS / 60));
  const open = openTrack ? TRACKS.find((t) => t.id === openTrack) ?? null : null;

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
      {/* ============================ hero ============================ */}
      <section className="relative overflow-hidden border-b-[3px] border-[#141414]" style={{ background: DEEP }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "repeating-linear-gradient(-45deg, #F3EFE6 0 1px, transparent 1px 16px)" }} />
        <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[3px] border-dashed opacity-20" style={{ borderColor: CYAN }} />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border-2 border-[#F3EFE6]/30 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#5CE1E6]">
              <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.5} /> the school wing of zyric
            </span>
            <FreeStamp />
          </div>

          <h1 className="mt-4 font-brut text-[44px] uppercase leading-[0.95] tracking-tight text-[#F3EFE6] sm:text-[64px] lg:text-[84px]">
            THE
            <span className="mx-2 inline-block -rotate-2 border-[3px] px-3" style={{ borderColor: NEON, color: CYAN, background: MID }}>AI ACADEMY</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#F3EFE6]/75 sm:text-base">
            Five complete roadmaps from <span className="font-bold text-[#5CE1E6]">absolute zero to provable AI skill</span> —
            every step free, every link an official page, every checkbox saved on your device. No accounts,
            no paywalls, no &ldquo;premium paths&rdquo;. Just the syllabus and the grind.
          </p>

          {/* counter strip */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "roadmaps", v: String(TRACKS.length), c: CYAN },
              { k: "guided steps", v: String(countedSteps), c: "#B9A6FF" },
              { k: "focused hours", v: `${countedHours}+`, c: "#FFD43B" },
              { k: "cost of the degree", v: "$0", c: "#5EE39A" },
            ].map((s) => (
              <div key={s.k} className="border-[3px] border-[#141414] bg-[#F3EFE6] px-3 py-2.5">
                <p className="font-brut text-xl leading-none sm:text-2xl" style={{ color: INK }}>{s.v}</p>
                <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: INK, opacity: 0.5 }}>{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= where do I start ======================= */}
      <section className="border-b-[3px] border-[#141414] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 font-brut text-xl uppercase tracking-tight sm:text-2xl">
              <Compass className="h-5 w-5 -rotate-6" strokeWidth={2.8} /> where do I start?
            </h2>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#141414]/40">pick your flavor of zero</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STARTERS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOpenTrack(s.track)}
                  className="brut-lift group flex items-center gap-3 border-[3px] border-[#141414] bg-[#F3EFE6] px-4 py-3.5 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-[2.5px] border-[#141414]" style={{ background: CYAN }}>
                    <Icon className="h-5 w-5 text-[#141414]" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-brut text-sm uppercase leading-tight text-[#141414]">{s.label}</span>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[#141414]/50">{s.note} → open {TRACKS.find((t) => t.id === s.track)?.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== overall progress ===================== */}
      <section className="border-b-[3px] border-[#141414]" style={{ background: PAPER }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#141414]/60">
                  your academy progress — saved on this device only
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: MID }}>
                  {totalDone}/{TOTAL_STEPS} · {Math.round((totalDone / TOTAL_STEPS) * 100)}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border-[2.5px] border-[#141414]/25 bg-white">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(totalDone / TOTAL_STEPS) * 100}%`, background: `linear-gradient(90deg, ${NEON}, ${CYAN})` }} />
              </div>
            </div>
            {totalDone > 0 && (
              <span className="inline-flex items-center gap-1.5 border-2 border-[#141414] bg-[#FFD43B] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#141414]">
                <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} /> {totalDone} steps conquered
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ============================ grid ============================ */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ background: CREAM }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 font-brut text-xl uppercase tracking-tight sm:text-2xl">
            <Layers className="h-5 w-5" strokeWidth={2.8} /> the syllabi
          </h2>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#141414]/40">
            do them in order, or jump where you dare
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TRACKS.map((t, i) => (
            <SyllabusCard
              key={t.id}
              track={t}
              index={i}
              done={trackDone(t, prog)}
              onOpen={() => setOpenTrack(t.id)}
            />
          ))}
        </div>
      </section>

      {/* ========================= disclaimer ========================= */}
      <footer className="border-t-[3px] border-[#141414] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6 lg:px-8">
          <p className="max-w-xl font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-[#141414]/45">
            the ai academy links only official provider pages for genuinely free courses and free tiers — availability and limits can change, always verify on the official page. no affiliates, no tracking, progress never leaves your device.
          </p>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#141414]/40">
            <GraduationCap className="h-4 w-4" /> zyric academy · tuition $0, forever
          </span>
        </div>
      </footer>

      {open && (
        <AcademyDetail
          track={open}
          prog={prog}
          onToggle={toggle}
          onClose={() => setOpenTrack(null)}
          onResetTrack={resetTrack}
        />
      )}
    </motion.main>
  );
}
