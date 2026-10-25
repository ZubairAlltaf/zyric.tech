"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useMotionValue, useScroll, useSpring } from "framer-motion";

/* ==========================================================================
   ZYRIC EXPERIENCE — the signature layer
   Preloader · CustomCursor · Magnetic · ScrambleText · Grain · Progress ·
   Confetti easter egg. Everything pointer-fine aware + reduced-motion aware.
   ========================================================================== */

/** True only for precise pointers (mouse/trackpad) with motion allowed. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => setFine(mq.matches && !rm.matches);
    const micro = () => queueMicrotask(upd);
    micro();
    mq.addEventListener("change", micro);
    rm.addEventListener("change", micro);
    return () => {
      mq.removeEventListener("change", micro);
      rm.removeEventListener("change", micro);
    };
  }, []);
  return fine;
}

/* --------------------------------- Preloader --------------------------------
   Black boot screen: ZYRIC letters stamp in while a counter runs 0→100 with
   rotating "boot lines". Curtains lift, session-flagged so it plays once.
---------------------------------------------------------------------------- */

const BOOT_LINES = [
  "SHARPENING PENCILS…",
  "POLISHING PIXELS…",
  "COUNTING THE DRAWER…",
  "CALIBRATING SQUIGGLES…",
  "WARMING UP THE MACHINE…",
  "TIGHTENING THE SCREWS…",
];

export function Preloader() {
  const [phase, setPhase] = useState<"boot" | "exit" | "done">("boot");
  const [count, setCount] = useState(0);
  const [line, setLine] = useState(0);
  const fine = useFinePointer();

  useEffect(() => {
    if (phase !== "boot") return;
    queueMicrotask(() => {
      if (sessionStorage.getItem("zyric-booted")) setPhase("done");
    });
  }, [phase]);

  useEffect(() => {
    if (phase !== "boot") return;
    document.body.style.overflow = "hidden";
    let raf = 0;
    const li = window.setInterval(
      () => setLine((l) => (l + 1) % BOOT_LINES.length),
      240
    );
    const t0 = performance.now();
    const DUR = fine ? 1150 : 480;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / DUR);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else window.setTimeout(() => setPhase("exit"), 130);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(li);
      document.body.style.overflow = "";
    };
  }, [phase, fine]);

  useEffect(() => {
    if (phase !== "exit") return;
    sessionStorage.setItem("zyric-booted", "1");
    const t = window.setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
    }, 640);
    return () => window.clearTimeout(t);
  }, [phase]);

  const skip = useCallback(() => {
    setCount(100);
    setPhase("exit");
  }, []);

  if (phase === "done") return null;

  return (
    <motion.div
      role="presentation"
      onClick={skip}
      initial={{ y: 0 }}
      animate={phase === "exit" ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[200] flex cursor-pointer flex-col justify-between overflow-hidden bg-[#141414] p-5 text-[#F3EFE6] sm:p-8"
    >
      <div className="dots-light absolute inset-0" aria-hidden="true" />

      <div className="relative flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-[#F3EFE6]/50">
        <span>ZYRIC.TECH OS — v2.6</span>
        <span className="hidden sm:block">FREE FOREVER</span>
      </div>

      <div className="relative select-none text-center" aria-hidden="true">
        <p
          className="text-stroke-cream font-brut uppercase leading-[0.85]"
          style={{ fontSize: "clamp(3.4rem, 14vw, 12rem)" }}
        >
          {"ZYRIC".split("").map((ch, i) => {
            const lit = count >= (i + 1) * 19;
            return (
              <motion.span
                key={i}
                className="inline-block"
                style={{ color: lit ? "#FFD43B" : undefined, WebkitTextStroke: lit ? "0px" : undefined }}
                initial={{ opacity: 0, y: 26, rotate: -8 }}
                animate={lit ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 0.25, y: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 17 }}
              >
                {ch}
              </motion.span>
            );
          })}
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[#F3EFE6]/60">
          {BOOT_LINES[line]}
        </p>
      </div>

      <div className="relative flex items-end justify-between gap-6">
        <p className="max-w-[220px] font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-[#F3EFE6]/40">
          Click anywhere to skip
        </p>
        <p className="font-brut text-6xl leading-none text-[#FFD43B] tabular-nums sm:text-8xl">
          {String(count).padStart(3, "0")}
          <span className="text-2xl sm:text-4xl">%</span>
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 h-[6px] bg-[#FFD43B] transition-[width] duration-100 ease-linear"
        style={{ width: `${count}%` }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

/* ------------------------------- CustomCursor --------------------------------
   Brutalist cursor: a hard square dot (instant) + a trailing square ring
   (lerped). mix-blend-difference keeps it visible on cream AND ink. Ring
   flips to a filled yellow diamond over interactive elements and hides over
   text fields so the native caret cursor takes over.
---------------------------------------------------------------------------- */

const ACT_SELECTOR =
  "a, button, [role='button'], [role='menuitem'], [role='option'], label, summary, [data-cursor='act'], [cmdk-item]";
const FIELD_SELECTOR = "input, textarea, select, [contenteditable='true'], [contenteditable='']";

export function CustomCursor() {
  const fine = useFinePointer();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fine) return;
    document.body.classList.add("zyric-fine");

    const pos = { x: -200, y: -200 };
    const ring = { x: -200, y: -200 };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const t = e.target as Element | null;
      const mode = t?.closest?.(FIELD_SELECTOR)
        ? "hide"
        : t?.closest?.(ACT_SELECTOR)
          ? "act"
          : "idle";
      if (dotRef.current) {
        dotRef.current.dataset.mode = mode;
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      }
      if (ringRef.current) ringRef.current.dataset.mode = mode;
    };

    const loop = () => {
      ring.x += (pos.x - ring.x) * 0.17;
      ring.y += (pos.y - ring.y) * 0.17;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x.toFixed(1)}px, ${ring.y.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      document.body.classList.remove("zyric-fine");
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine]);

  if (!fine) return null;
  return (
    <>
      <div ref={ringRef} data-mode="idle" className="zyric-ring" aria-hidden="true">
        <span className="zi" />
      </div>
      <div ref={dotRef} data-mode="idle" className="zyric-dot" aria-hidden="true">
        <span className="zi" />
      </div>
    </>
  );
}

/* --------------------------------- Magnetic ----------------------------------
   Child drifts toward the cursor, springs back on leave. Desktop touch.
---------------------------------------------------------------------------- */

export function Magnetic({
  children,
  strength = 0.32,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 190, damping: 15, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 190, damping: 15, mass: 0.5 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy, ...style }}
      className={className ?? "inline-block"}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------- ScrambleText --------------------------------
   Decode effect — glyphs churn then settle left→right. trigger "hover"
   replays on every mouseenter; "mount" plays once after a beat.
---------------------------------------------------------------------------- */

const GLYPHS = "#$%&*+=<>/?@!?%";

export function ScrambleText({
  text,
  className,
  trigger = "hover",
}: {
  text: string;
  className?: string;
  trigger?: "hover" | "mount";
}) {
  const [disp, setDisp] = useState(text);
  const timer = useRef<number | null>(null);
  const running = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const scramble = useCallback(() => {
    if (running.current) return;
    running.current = true;
    let frame = 0;
    const total = Math.max(10, text.length * 1.7);
    const step = () => {
      frame += 1;
      const reveal = Math.floor((frame / total) * text.length);
      setDisp(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " " || i < reveal) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("")
      );
      if (reveal < text.length) timer.current = window.setTimeout(step, 26);
      else running.current = false;
    };
    step();
  }, [text]);

  useEffect(() => {
    if (trigger !== "mount") return;
    const t = window.setTimeout(scramble, 350);
    return () => window.clearTimeout(t);
  }, [trigger, scramble]);

  return (
    <span className={className} onMouseEnter={trigger === "hover" ? scramble : undefined}>
      {disp}
    </span>
  );
}

/* ------------------------------ ScrollProgress ------------------------------- */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 32, mass: 0.4 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[70] h-[4px] w-full origin-left bg-[#FFD43B]"
      style={{ scaleX }}
    />
  );
}

/* ------------------------------- GrainOverlay --------------------------------
   Animated film grain — SVG turbulence tile, steps() jitter. Pure texture.
---------------------------------------------------------------------------- */

export function GrainOverlay() {
  return <div aria-hidden="true" className="zyric-grain" />;
}

/* --------------------------------- Confetti ----------------------------------
   Hard-square brutalist confetti burst from a viewport point.
---------------------------------------------------------------------------- */

const CONFETTI_COLORS = [
  "#FFD43B",
  "#FF9DE2",
  "#7FC8FF",
  "#5EE39A",
  "#FF7A3D",
  "#B9A6FF",
  "#C6F24E",
  "#FFFFFF",
];

export function launchConfetti(x: number, y: number) {
  if (typeof document === "undefined") return;
  const n = 34;
  for (let i = 0; i < n; i++) {
    const el = document.createElement("span");
    const size = 6 + Math.random() * 9;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};border:1.5px solid #141414;z-index:9999;pointer-events:none;`;
    document.body.appendChild(el);
    const ang = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 200;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - 90;
    el.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 300}px)) rotate(${Math.random() * 560 - 280}deg)`,
          opacity: 0,
        },
      ],
      { duration: 750 + Math.random() * 550, easing: "cubic-bezier(.16,.6,.4,1)" }
    ).onfinish = () => el.remove();
  }
}
