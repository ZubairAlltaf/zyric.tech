"use client";

/* ==========================================================================
   KIT: STUDY & BRAIN — 18 learning machines. Flashcards, math, memory, speed.
   ========================================================================== */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  BigStat,
  Btn,
  Field,
  Grid,
  KV,
  Note,
  Out,
  Panel,
  Row,
  Seg,
  Slider,
  Split,
  Tag,
  accentOf,
  fmt,
} from "./kit";
import { useLocalStorage } from "./hooks";

/* ------------------------------ 1. Flashcards ------------------------------ */

type Card = { id: number; q: string; a: string; box: number };
export function FlashcardsTool() {
  const A = accentOf(0);
  const [cards, setCards] = useLocalStorage<Card[]>("kit-cards", []);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const deck = cards.filter((c) => c.box < 3);
  const card = deck[idx % Math.max(1, deck.length)];
  const grade = (good: boolean) => {
    if (!card) return;
    setCards(cards.map((c) => (c.id === card.id ? { ...c, box: good ? Math.min(3, c.box + 1) : 0 } : c)));
    setFlip(false);
    setIdx((i) => (i + 1) % Math.max(1, deck.length));
  };
  return (
    <div className="space-y-4">
      <Split
        left={
          <div className="space-y-3">
            <Field label="Question / front" value={q} onChange={setQ} placeholder="Capital of Peru?" />
            <Field label="Answer / back" value={a} onChange={setA} placeholder="Lima" />
            <Btn accent={A} onClick={() => { if (q.trim() && a.trim()) { setCards([{ id: Date.now(), q: q.trim(), a: a.trim(), box: 0 }, ...cards]); setQ(""); setA(""); } }}>+ Add card</Btn>
            <p className="font-mono text-[10px] text-zinc-600">{cards.length} cards · {deck.length} in rotation · boxes: leitner-style</p>
          </div>
        }
        right={
          <div>
            {card ? (
              <button type="button" onClick={() => setFlip(!flip)} className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 p-6 text-center transition-colors" style={{ borderColor: A, background: `${A}0a` }}>
                <span className="mono-kicker text-zinc-500">{flip ? "ANSWER" : "QUESTION"} · click to flip</span>
                <span className="text-xl font-bold leading-relaxed text-zinc-100">{flip ? card.a : card.q}</span>
                {flip ? (
                  <span className="mt-3 flex gap-2">
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); grade(true); }} className="rounded border border-emerald-500/50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10">knew it ↑</span>
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); grade(false); }} className="rounded border border-rose-500/50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-500/10">again ↺</span>
                  </span>
                ) : null}
              </button>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-zinc-800"><p className="text-sm text-zinc-600">Add your first card…</p></div>
            )}
          </div>
        }
      />
    </div>
  );
}

/* ------------------------------ 2. Spaced repetition ----------------------- */

export function SpacedRepetitionTool() {
  const A = accentOf(1);
  const [studyDate, setStudyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const intervals = [1, 3, 7, 14, 30, 60];
  const base = new Date(studyDate + "T12:00:00");
  return (
    <div className="space-y-4">
      <Field label="First study date" value={studyDate} onChange={setStudyDate} type="date" />
      <div className="relative ml-2 border-l-2 border-dashed border-zinc-700 pl-6">
        {intervals.map((d, i) => {
          const dt = new Date(base.getTime() + d * 86400000);
          return (
            <div key={d} className="relative pb-6">
              <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 text-[9px] font-black" style={{ borderColor: A, color: A, background: "#0a0a0a" }}>{i + 1}</span>
              <p className="text-sm font-bold text-zinc-100">Review #{i + 1}</p>
              <p className="font-mono text-xs text-zinc-500">{dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · +{d} day{d > 1 ? "s" : ""}</p>
              {i === 0 && <p className="mt-1 text-[11px] text-zinc-600">Miss a review? Restart the ladder from step 1 — no guilt, just reset.</p>}
            </div>
          );
        })}
      </div>
      <Note>The classic expanding ladder (1-3-7-14-30-60). Recall right before forgetting is what etches memory — five short touches beat one long cram.</Note>
    </div>
  );
}

/* ------------------------------ 3. GPA ------------------------------------- */

type Course = { id: number; name: string; credits: number; grade: string };
const GRADE_POINTS: Record<string, number> = { "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, D: 1.0, F: 0 };

export function GpaTool() {
  const A = accentOf(2);
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: "Calculus", credits: 4, grade: "A" },
    { id: 2, name: "History", credits: 3, grade: "B+" },
  ]);
  const totalCredits = courses.reduce((a, c) => a + c.credits, 0);
  const points = courses.reduce((a, c) => a + c.credits * (GRADE_POINTS[c.grade] ?? 0), 0);
  const gpa = totalCredits > 0 ? points / totalCredits : 0;
  return (
    <div className="space-y-4">
      {courses.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
          <input value={c.name} onChange={(e) => setCourses(courses.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))} className="min-w-0 flex-1 border-none bg-transparent text-sm text-zinc-100 focus:outline-none" placeholder="Course" />
          <input type="number" value={c.credits} onChange={(e) => setCourses(courses.map((x) => (x.id === c.id ? { ...x, credits: parseFloat(e.target.value) || 0 } : x)))} className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right font-mono text-sm text-zinc-100 focus:outline-none" title="credits" />
          <select value={c.grade} onChange={(e) => setCourses(courses.map((x) => (x.id === c.id ? { ...x, grade: e.target.value } : x)))} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-sm text-zinc-100 focus:outline-none">
            {Object.keys(GRADE_POINTS).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button type="button" onClick={() => setCourses(courses.filter((x) => x.id !== c.id))} className="px-1 font-mono text-xs text-zinc-600 hover:text-rose-400">✕</button>
        </div>
      ))}
      <Btn accent={A} onClick={() => setCourses([...courses, { id: Date.now(), name: "", credits: 3, grade: "A" }])}>+ Course</Btn>
      <div className="flex items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-7">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">GPA</p>
          <p className="mt-1 font-brut text-5xl" style={{ color: gpa >= 3.5 ? "#5EE39A" : gpa >= 2.5 ? A : "#FF8A7A" }}>{fmt(gpa)}</p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">credits</p>
          <p className="mt-1 font-brut text-5xl text-zinc-200">{totalCredits}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 4. Grade needed ---------------------------- */

export function GradeNeededTool() {
  const A = accentOf(3);
  const [current, setCurrent] = useState("78");
  const [weight, setWeight] = useState("30");
  const [target, setTarget] = useState("85");
  const need = useMemo(() => {
    const cw = Math.max(0, 100 - (parseFloat(weight) || 0));
    const cur = (parseFloat(current) || 0) * (cw / 100);
    const tgt = parseFloat(target) || 0;
    return (tgt - cur) / Math.max(0.01, (parseFloat(weight) || 0) / 100);
  }, [current, weight, target]);
  const possible = need <= 100;
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Current grade %" value={current} onChange={setCurrent} type="number" />
        <Field label="Final exam weight %" value={weight} onChange={setWeight} type="number" />
        <Field label="Target grade %" value={target} onChange={setTarget} type="number" />
      </Grid>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-8 text-center">
        <p className="mono-kicker text-zinc-500">you need on the final</p>
        <p className="mt-2 font-brut text-6xl" style={{ color: !possible ? "#FF8A7A" : need <= 70 ? "#5EE39A" : A }}>{possible ? `${Math.max(0, Math.round(need))}%` : ">100% 😬"}</p>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          {!possible ? "mathematically out of reach — talk to your teacher about extra credit" : need <= 70 ? "very doable. breathe." : need <= 95 ? "tight but possible — full focus mode" : "only with a miracle curve"}
        </p>
      </div>
      <Note>Formula: (target − current×(1−w)) ÷ w. The % you need scales brutally with exam weight.</Note>
    </div>
  );
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------ 5. Reading speed --------------------------- */

const READING_SAMPLE = "The library at midnight had a different sound than the library at noon. During the day, noise bounced off the tall shelves in bright, chaotic echoes. At night, the same shelves absorbed everything. Even footsteps became suggestions rather than statements. Mira walked slowly between the stacks, dragging her fingertip along the spines, feeling the tiny ridges of cloth and paper and dust. Somewhere in aisle nine, a clock she had never noticed before was ticking. She found the book on the third shelf, exactly where the note had promised. The cover was cold, as if it had been waiting outside in winter. Inside the front cover, in pencil, someone had written: returned twice, kept forever the third time. Mira understood the warning perfectly. Some books are doors. She opened it.";

export function ReadingSpeedTool() {
  const A = accentOf(4);
  const [started, setStarted] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const words = READING_SAMPLE.split(/\s+/).length;
  const seconds = started ? ((done ? performance.now() : 0) - started) / 1000 : 0;
  const wpm = seconds > 0 ? Math.round((words / seconds) * 60) : 0;
  const level = wpm === 0 ? "" : wpm < 150 ? "Average reader" : wpm < 250 ? "Above average" : wpm < 400 ? "Fast reader" : "Speed demon";
  return (
    <div className="space-y-4">
      <Row className="items-center justify-between">
        <Tag accent={A}>{words} words · read at your natural pace</Tag>
        {!started ? <Btn accent={A} onClick={() => { setStarted(performance.now()); setDone(false); }}>Start timer</Btn> : !done ? <Btn accent="#5EE39A" onClick={() => { setDone(true); }}>I finished</Btn> : <Btn variant="ghost" accent={A} onClick={() => { setStarted(null); setDone(false); }}>Reset</Btn>}
      </Row>
      <Panel title="the passage" accent={A}>
        <p className="text-sm leading-loose text-zinc-300">{READING_SAMPLE}</p>
      </Panel>
      {done && started ? (
        <Grid cols={3}>
          <BigStat label="Your speed" value={wpm} unit="wpm" accent={A} />
          <BigStat label="Time taken" value={`${Math.round(seconds)}s`} accent="#7FC8FF" />
          <BigStat label="Level" value={level} accent="#5EE39A" />
        </Grid>
      ) : null}
      <Note>Average adult: 200–250 wpm. Anything over 400 usually means skimming — great for scanning, bad for textbooks.</Note>
    </div>
  );
}

/* ------------------------------ 6. Assignment planner ---------------------- */

export function AssignmentPlannerTool() {
  const A = accentOf(3);
  const [name, setName] = useState("");
  const [due, setDue] = useState("");
  const [hours, setHours] = useState("6");
  const [today] = useState(() => new Date());
  const dueDate = due ? new Date(due + "T23:59:00") : null;
  const daysLeft = dueDate ? Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / 86400000)) : 0;
  const h = parseFloat(hours) || 0;
  const perDay = daysLeft > 0 ? h / daysLeft : h;
  const panic = perDay > 4;
  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Field label="Assignment" value={name} onChange={setName} placeholder="Essay on climate policy" />
        <Field label="Due date" value={due} onChange={setDue} type="date" />
        <Field label="Estimated hours of work" value={hours} onChange={setHours} type="number" />
      </Grid>
      {dueDate ? (
        <>
          <div className="flex items-center justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
            <div className="text-center">
              <p className="mono-kicker text-zinc-500">days left</p>
              <p className="mt-1 font-brut text-5xl" style={{ color: daysLeft <= 2 ? "#FF8A7A" : A }}>{daysLeft}</p>
            </div>
            <div className="text-center">
              <p className="mono-kicker text-zinc-500">work per day</p>
              <p className="mt-1 font-brut text-5xl text-zinc-200">{fmt(perDay, 1)}h</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag accent={panic ? "#FF8A7A" : "#5EE39A"}>{panic ? "CODE RED — start today" : daysLeft <= 1 ? "do it in one sitting" : "comfortable pace"}</Tag>
            {daysLeft > 3 ? <Tag>finish 1 day early = free insurance</Tag> : null}
            <Tag>{h}h total ÷ {daysLeft}d</Tag>
          </div>
          {name ? <p className="text-sm text-zinc-400">“{name}” — {daysLeft} days, {fmt(perDay, 1)} hours a day. Small daily chunks beat a 3 a.m. monster.</p> : null}
        </>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Fill the fields — get your daily work budget…</p>
      )}
    </div>
  );
}

/* ------------------------------ 7. Cornell notes --------------------------- */

export function CornellTool() {
  const A = accentOf(5);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const cues = useMemo(
    () =>
      notes
        .split(/[.!?\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 12)
        .slice(0, 8)
        .map((s) => {
          const words = s.split(/\s+/);
          return words.length > 5 ? `${words.slice(0, 4).join(" ")}…?` : `${s}?`;
        }),
    [notes]
  );
  const summary = useMemo(() => {
    const sents = notes.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 20);
    return sents.slice(0, 2).join(". ") + (sents.length ? "." : "");
  }, [notes]);
  return (
    <div className="space-y-4">
      <Field label="Topic / title" value={topic} onChange={setTopic} placeholder="Photosynthesis" />
      <Split
        left={<Area label="Notes column — write freely during class" value={notes} onChange={setNotes} rows={10} mono={false} />}
        right={
          <div className="space-y-3">
            <Panel title="cue column — auto-drafted questions" accent={A}>
              <ul className="space-y-1.5 text-xs text-zinc-300">{cues.map((c, i) => <li key={i}>• {c}</li>)}{!cues.length && <li className="text-zinc-600">Notes appear → questions generate…</li>}</ul>
            </Panel>
            <Out label="summary strip (2 lines)" text={summary} />
          </div>
        }
      />
      <Note>The Cornell method: notes right, cues left, summary bottom. Cover the right side and quiz yourself with the cues — retention doubles.</Note>
    </div>
  );
}

/* ------------------------------ 8. Citation generator ---------------------- */

export function CitationTool() {
  const A = accentOf(6);
  const [f, setF] = useState({ author: "", year: "", title: "", source: "", url: "" });
  const [style, setStyle] = useState<"apa" | "mla" | "chicago">("apa");
  const cite = useMemo(() => {
    const last = f.author.trim().split(" ").slice(-1)[0] || "Author";
    const first = f.author.trim().split(" ").slice(0, -1).join(" ");
    const fi = first ? first.split(" ").map((x) => x[0] + ".").join(" ") : "";
    const y = f.year || "n.d.";
    const t = f.title || "Title";
    const s = f.source || "Source";
    if (style === "apa") return `${last}, ${fi || last} (${y}). ${t}. ${s}.${f.url ? ` ${f.url}` : ""}`;
    if (style === "mla") return `${last}, ${first || last}. "${t}." ${s}, ${y}.${f.url ? ` ${f.url}.` : ""}`;
    return `${last}, ${first || last}. "${t}." ${s} (${y}).${f.url ? ` ${f.url}.` : ""}`;
  }, [f, style]);
  return (
    <div className="space-y-4">
      <Seg value={style} onChange={setStyle} accent={A} options={[{ v: "apa" as const, label: "APA 7" }, { v: "mla" as const, label: "MLA 9" }, { v: "chicago" as const, label: "Chicago" }]} />
      <Grid cols={2}>
        <Field label="Author (first last)" value={f.author} onChange={(v) => setF({ ...f, author: v })} placeholder="Ada Lovelace" />
        <Field label="Year" value={f.year} onChange={(v) => setF({ ...f, year: v })} placeholder="2024" />
      </Grid>
      <Field label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} placeholder="Notes on the Analytical Engine" />
      <Grid cols={2}>
        <Field label="Source / journal / site" value={f.source} onChange={(v) => setF({ ...f, source: v })} placeholder="Scientific Memoirs" />
        <Field label="URL (if web)" value={f.url} onChange={(v) => setF({ ...f, url: v })} placeholder="https://…" />
      </Grid>
      <Out label="your citation" text={cite} />
      <Note>Auto-formatting from raw fields. Always spot-check against your school&rsquo;s current style guide — punctuation pedants lurk there.</Note>
    </div>
  );
}

/* ------------------------------ 9. Mnemonic maker -------------------------- */

export function MnemonicTool() {
  const A = accentOf(7);
  const [letters, setLetters] = useState("HOMES");
  const words = letters.replace(/[^a-zA-Z]/g, "").toUpperCase().split("");
  const [seed, setSeed] = useState(0);
  const BANK: Record<string, string[]> = {
    A: ["angry", "amber", "apple", "anchor", "arrow", "aurora"], B: ["brave", "bright", "banana", "beacon", "breeze"], C: ["calm", "cosmic", "cactus", "candle", "crystal"],
    D: ["daring", "dawn", "delta", "drift", "dune"], E: ["eager", "ember", "eagle", "echo", "evening"], F: ["fierce", "falcon", "forest", "frost", "fable"],
    G: ["gentle", "golden", "garden", "geyser", "gusto"], H: ["happy", "hammer", "harbor", "heron", "hollow"], I: ["icy", "ivory", "island", "iris", "ivory"],
    J: ["jolly", "jasmine", "jaguar", "jigsaw"], K: ["kind", "koala", "kettle", "knight"], L: ["lucky", "lantern", "lagoon", "lynx"], M: ["mighty", "maple", "meadow", "meteor"],
    N: ["noble", "night", "nomad", "nest"], O: ["open", "ocean", "orbit", "otter"], P: ["proud", "panda", "pebble", "phoenix"], Q: ["quiet", "quartz", "quest", "quill"],
    R: ["royal", "river", "raven", "reef"], S: ["swift", "solar", "storm", "summit"], T: ["tidy", "tiger", "timber", "tundra"], U: ["upbeat", "umbra", "unity", "urchin"],
    V: ["vivid", "valley", "velvet", "vulture"], W: ["wise", "willow", "wolf", "wander"], X: ["xenon", "xylo"], Y: ["youthful", "yarn", "yonder"], Z: ["zealous", "zen", "zephyr"],
  };
  const line = useMemo(() => {
    void seed;
    return words.map((l) => {
      const bank = BANK[l] || [l.toLowerCase()];
      return bank[Math.floor(Math.random() * bank.length)];
    });
  }, [letters, seed]);
  return (
    <div className="space-y-4">
      <Field label="Letters to remember (e.g. HOMES for the Great Lakes)" value={letters} onChange={setLetters} />
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 text-center">
        <p className="text-3xl font-black tracking-[0.3em]" style={{ color: A }}>{words.join(" ")}</p>
        <p className="mt-4 text-xl capitalize text-zinc-100">{line.join(" · ")}</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">first letters map to your letters</p>
      </div>
      <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Spin another</Btn>
      <Note>Mnemonics stick best when the words form a vivid scene. Picture it: a happy heron guarding a harbor…</Note>
    </div>
  );
}

/* ------------------------------ 10. Times table explorer ------------------- */

export function TimesTableTool() {
  const A = accentOf(8);
  const [n, setN] = useState(7);
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((i) => i === n || true);
  void rows;
  return (
    <div className="space-y-4">
      <Slider label="Focus number" value={n} onChange={setN} min={1} max={12} accent={A} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((i) => {
          const highlight = i === n || n === i * 1 ? false : i % n === 0;
          return (
            <div key={i} className="rounded-lg border px-3 py-4 text-center" style={{ borderColor: highlight ? `${A}66` : "#3f3f46", background: i === 1 && n === 1 ? `${A}11` : "transparent" }}>
              <p className="font-mono text-xs text-zinc-500">{n} × {i}</p>
              <p className="mt-1 text-2xl font-black text-zinc-100">{n * i}</p>
            </div>
          );
        })}
      </div>
      <Panel title="patterns worth spotting" accent={A}>
        <KV k="doubles" v={`×2 always: ${n}, ${n * 2}, ${n * 4}…`} accent={A} />
        <KV k="last digits" v={Array.from({ length: 10 }, (_, i) => ((n * (i + 1)) % 10)).join(" ")} />
        <KV k="sum of digits" v={`×9 trick: digits of 9×k sum to 9 (9×${n}=${9 * n})`} />
      </Panel>
    </div>
  );
}

/* ------------------------------ 11. Prime factorizer ----------------------- */

export function PrimeTool() {
  const A = accentOf(9);
  const [n, setN] = useState("360");
  const num2 = Math.min(1e12, Math.max(2, Math.floor(parseFloat(n) || 0)));
  const factors = useMemo(() => {
    let x = num2;
    const out: number[] = [];
    for (let d = 2; d * d <= x; d++) while (x % d === 0) { out.push(d); x /= d; }
    if (x > 1) out.push(x);
    return out;
  }, [num2]);
  const isPrime = factors.length === 1;
  const grouped = useMemo(() => {
    const m = new Map<number, number>();
    for (const f of factors) m.set(f, (m.get(f) || 0) + 1);
    return [...m.entries()];
  }, [factors]);
  return (
    <div className="space-y-4">
      <Field label="Number (up to 10¹²)" value={n} onChange={setN} type="number" />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">{isPrime ? "prime — indivisible" : "prime factorization"}</p>
        <p className="mt-2 font-brut text-4xl" style={{ color: A }}>
          {isPrime ? `${num2} ✓` : grouped.map(([b, e], i) => (
            <span key={b}>{i > 0 ? " × " : ""}{b}{e > 1 ? <sup>{e}</sup> : null}</span>
          ))}
        </p>
      </div>
      <Grid cols={4}>
        <BigStat label="Total factors" value={factors.length} accent={A} />
        <BigStat label="Distinct primes" value={grouped.length} accent="#7FC8FF" />
        <BigStat label="Largest factor" value={Math.max(...factors)} accent="#5EE39A" />
        <BigStat label="Digit sum" value={String(num2).split("").reduce((a, d) => a + parseInt(d), 0)} accent="#FF9DE2" />
      </Grid>
    </div>
  );
}

/* ------------------------------ 12. Quadratic solver ----------------------- */

export function QuadraticTool() {
  const A = accentOf(10);
  const [a, setA] = useState("1");
  const [b, setB] = useState("-3");
  const [c, setC] = useState("2");
  const na = parseFloat(a) || 0, nb = parseFloat(b) || 0, nc = parseFloat(c) || 0;
  const disc = nb * nb - 4 * na * nc;
  const roots = disc >= 0 ? [(-nb + Math.sqrt(disc)) / (2 * na), (-nb - Math.sqrt(disc)) / (2 * na)] : null;
  const vertexX = -nb / (2 * na);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-center gap-2 font-mono text-lg text-zinc-300">
        <Field label="a" value={a} onChange={setA} type="number" className="w-24" />
        <span className="pb-2">x² +</span>
        <Field label="b" value={b} onChange={setB} type="number" className="w-24" />
        <span className="pb-2">x +</span>
        <Field label="c" value={c} onChange={setC} type="number" className="w-24" />
        <span className="pb-2">= 0</span>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6">
        <KV k="discriminant b²−4ac" v={fmt(disc)} accent={disc >= 0 ? "#5EE39A" : "#FF8A7A"} />
        <KV k="verdict" v={disc > 0 ? "two real roots" : disc === 0 ? "one repeated root" : "complex roots (no x-axis crossing)"} />
        {roots ? (
          <>
            <KV k="x₁" v={fmt(roots[0], 4)} accent={A} />
            <KV k="x₂" v={fmt(roots[1], 4)} accent={A} />
          </>
        ) : (
          <>
            <KV k="real part" v={fmt(vertexX, 4)} accent={A} />
            <KV k="imaginary part" v={`± ${fmt(Math.sqrt(-disc) / (2 * na), 4)}i`} accent={A} />
          </>
        )}
        <KV k="vertex" v={`(${fmt(vertexX, 3)}, ${fmt(na * vertexX * vertexX + nb * vertexX + nc, 3)})`} />
        <KV k="opens" v={na > 0 ? "upward ∪" : "downward ∩"} />
      </div>
      <Note>Full work shown: discriminant, roots (real or complex), and the vertex — everything a homework check needs.</Note>
    </div>
  );
}

/* ------------------------------ 13. Triangle solver ------------------------ */

export function TriangleTool() {
  const A = accentOf(11);
  const [a, setA] = useState("3");
  const [b, setB] = useState("4");
  const [c, setC] = useState("5");
  const na = parseFloat(a) || 0, nb = parseFloat(b) || 0, nc = parseFloat(c) || 0;
  const valid = na + nb > nc && nb + nc > na && na + nc > nb && na > 0 && nb > 0 && nc > 0;
  const s = (na + nb + nc) / 2;
  const area = valid ? Math.sqrt(s * (s - na) * (s - nb) * (s - nc)) : 0;
  const angA = valid ? (Math.acos((nb * nb + nc * nc - na * na) / (2 * nb * nc)) * 180) / Math.PI : 0;
  const angB = valid ? (Math.acos((na * na + nc * nc - nb * nb) / (2 * na * nc)) * 180) / Math.PI : 0;
  const angC = 180 - angA - angB;
  const type = valid ? (Math.abs(angA - 90) < 0.1 || Math.abs(angB - 90) < 0.1 || Math.abs(angC - 90) < 0.1 ? "Right triangle" : angA > 90 || angB > 90 || angC > 90 ? "Obtuse" : "Acute") : "—";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Side a" value={a} onChange={setA} type="number" />
        <Field label="Side b" value={b} onChange={setB} type="number" />
        <Field label="Side c" value={c} onChange={setC} type="number" />
      </div>
      {valid ? (
        <>
          <Grid cols={4}>
            <BigStat label="Area" value={fmt(area, 3)} accent={A} />
            <BigStat label="Perimeter" value={fmt(na + nb + nc, 3)} accent="#7FC8FF" />
            <BigStat label="Type" value={type} accent="#5EE39A" />
            <BigStat label="Semi-perimeter" value={fmt(s, 3)} accent="#FF9DE2" />
          </Grid>
          <Panel title="angles (law of cosines)" accent={A}>
            <KV k="∠ A (opposite a)" v={`${fmt(angA, 1)}°`} accent={A} />
            <KV k="∠ B (opposite b)" v={`${fmt(angB, 1)}°`} />
            <KV k="∠ C (opposite c)" v={`${fmt(angC, 1)}°`} />
          </Panel>
        </>
      ) : (
        <p className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-4 text-center text-sm text-rose-300">Invalid triangle — the triangle inequality says any two sides together must beat the third.</p>
      )}
    </div>
  );
}

/* ------------------------------ 14. Probability ---------------------------- */

export function ProbabilityTool() {
  const A = accentOf(0);
  const [sides, setSides] = useState(6);
  const [dice, setDice] = useState(2);
  const [target, setTarget] = useState(7);
  const [trials, setTrials] = useState(10000);
  const theoretical = useMemo(() => {
    let ways = 0;
    const total = Math.pow(sides, dice);
    for (let i = 0; i < total; i++) {
      let sum = 0, x = i;
      for (let d = 0; d < dice; d++) { sum += (x % sides) + 1; x = Math.floor(x / sides); }
      if (sum === target) ways++;
    }
    return total > 0 && total < 5e6 ? (ways / total) * 100 : null;
  }, [sides, dice, target]);
  const [empirical, setEmpirical] = useState<number | null>(null);
  const roll = () => {
    let hits = 0;
    for (let t = 0; t < trials; t++) {
      let sum = 0;
      for (let d = 0; d < dice; d++) sum += Math.floor(Math.random() * sides) + 1;
      if (sum === target) hits++;
    }
    setEmpirical((hits / trials) * 100);
  };
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Dice count" value={dice} onChange={setDice} min={1} max={4} accent={A} />
        <Slider label="Sides per die" value={sides} onChange={setSides} min={2} max={20} accent={A} />
        <Slider label="Target sum" value={target} onChange={setTarget} min={dice} max={dice * sides} accent={A} />
      </Row>
      <Grid cols={2}>
        <BigStat label="Theoretical" value={theoretical === null ? "too big" : `${fmt(theoretical, 2)}%`} accent={A} hint={theoretical === null ? "" : `1 in ${theoretical > 0 ? fmt(100 / theoretical, 1) : "∞"}`} />
        <BigStat label="Monte Carlo" value={empirical === null ? "—" : `${fmt(empirical, 2)}%`} accent="#7FC8FF" hint={`${trials.toLocaleString()} simulated rolls`} />
      </Grid>
      <Row>
        <Btn accent={A} onClick={roll}>Roll {trials.toLocaleString()} dice</Btn>
        <Slider label="Trials" value={trials} onChange={setTrials} min={1000} max={100000} step={1000} accent="#7FC8FF" />
      </Row>
      <Note>Law of large numbers, live: the simulated % walks toward the theoretical one as trials grow.</Note>
    </div>
  );
}

/* ------------------------------ 15. Scientific calculator ------------------ */

function safeEval(expr: string): number {
  const cleaned = expr
    .replace(/\bpi\b/g, "Math.PI").replace(/\be\b/g, "Math.E")
    .replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|abs|log10|log|exp|round|floor|ceil)\b/g, "Math.$1")
    .replace(/\bln\(/g, "Math.log(").replace(/\^/g, "**");
  if (!/^[-+*/%().,0-9\s]|Math\./.test(cleaned) && !/Math\./.test(cleaned)) throw new Error("bad");
  if (/[a-zA-Z_$]/.test(cleaned.replace(/Math\.(PI|E|sin|cos|tan|asin|acos|atan|sqrt|abs|log10|log|exp|round|floor|ceil)/g, ""))) throw new Error("bad");
  return Function(`"use strict"; return (${cleaned});`)() as number;
}

export function SciCalcTool() {
  const A = accentOf(1);
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");
  const compute = () => {
    try {
      const r = safeEval(expr);
      setHistory((h) => [`${expr} = ${fmt(r, 8)}`, ...h].slice(0, 8));
      setExpr(String(r));
      setError("");
    } catch {
      setError("Cannot parse that — try sqrt(16) + 2^10");
    }
  };
  const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "(", ")"];
  const fns = ["sin(", "cos(", "tan(", "sqrt(", "log(", "ln(", "pi", "^", "+", "e"];
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-4">
        <input value={expr} onChange={(e) => { setExpr(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") compute(); }} placeholder="2^10 / sqrt(64) + sin(pi/2)" className="w-full border-none bg-transparent text-right font-mono text-2xl text-zinc-100 focus:outline-none" />
        {error ? <p className="mt-1 text-right font-mono text-xs text-rose-400">{error}</p> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {fns.map((f) => (
          <button key={f} type="button" onClick={() => setExpr(expr + f)} className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-zinc-300 hover:bg-zinc-800">{f.replace("(", "")}</button>
        ))}
        <button type="button" onClick={() => setExpr(expr.slice(0, -1))} className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-rose-300 hover:bg-zinc-800">⌫</button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((k) => (
          <button key={k} type="button" onClick={() => setExpr(expr + k)} className="rounded border border-zinc-700 bg-zinc-900 py-3 font-mono text-lg text-zinc-100 hover:bg-zinc-800">{k}</button>
        ))}
        <button type="button" onClick={compute} className="col-span-4 rounded py-3 font-mono text-sm font-black uppercase tracking-widest" style={{ background: A, color: "#0a0a0a" }}>=</button>
      </div>
      {history.length ? (
        <Panel title="history" accent={A}>
          <ul className="space-y-1 font-mono text-xs text-zinc-400">{history.map((h, i) => <li key={i}>{h}</li>)}</ul>
        </Panel>
      ) : null}
    </div>
  );
}

/* ------------------------------ 16. Graph plotter -------------------------- */

export function GraphPlotterTool() {
  const A = accentOf(2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fn, setFn] = useState("sin(x) * x / 3");
  const [range, setRange] = useState(10);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = (cv.width = cv.clientWidth * 2);
    const H = (cv.height = cv.clientHeight * 2);
    ctx.scale(1, 1);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += W / 20) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy <= H; gy += H / 20) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    const cx = W / 2, cy = H / 2;
    ctx.strokeStyle = "#52525b";
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    let expr = fn.replace(/\bpi\b/g, "Math.PI").replace(/\be\b/g, "Math.E")
      .replace(/\b(sin|cos|tan|sqrt|abs|log|exp)\b/g, "Math.$1").replace(/\^/g, "**");
    if (/[a-wy-zA-WY-Z_$]/.test(expr.replace(/Math\.(PI|E|sin|cos|tan|sqrt|abs|log|exp)/g, "").replace(/x/g, ""))) return;
    let f: (x: number) => number;
    try {
      f = Function("x", `"use strict"; return (${expr});`) as (x: number) => number;
    } catch {
      return;
    }
    ctx.strokeStyle = A;
    ctx.lineWidth = 3;
    ctx.beginPath();
    let pen = false;
    for (let px = 0; px <= W; px += 2) {
      const x = ((px - W / 2) / W) * (range * 2);
      let y: number;
      try { y = f(x); } catch { pen = false; continue; }
      if (!Number.isFinite(y)) { pen = false; continue; }
      const py = cy - (y / range) * (H / 2);
      if (py < -H || py > H * 2) { pen = false; continue; }
      if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [fn, range, A]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="y = f(x) — supports sin cos tan sqrt abs log exp pi ^" value={fn} onChange={setFn} className="min-w-[220px] flex-1" />
        <Slider label="X range ±" value={range} onChange={setRange} min={2} max={50} accent={A} />
      </Row>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <canvas ref={canvasRef} className="h-[300px] w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        {["sin(x)", "cos(x)*x", "x^2", "sqrt(abs(x))", "sin(1/x)", "x^3 - 3*x"].map((s) => (
          <button key={s} type="button" onClick={() => setFn(s)} className="rounded border border-zinc-700 px-2.5 py-1 font-mono text-[10px] text-zinc-400 hover:bg-zinc-800">{s}</button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 17. Periodic table ------------------------- */

const ELEMENTS: [number, string, string, number][] = [
  [1, "H", "Hydrogen", 1.008], [2, "He", "Helium", 4.003], [3, "Li", "Lithium", 6.94], [4, "Be", "Beryllium", 9.012],
  [5, "B", "Boron", 10.81], [6, "C", "Carbon", 12.011], [7, "N", "Nitrogen", 14.007], [8, "O", "Oxygen", 15.999],
  [9, "F", "Fluorine", 18.998], [10, "Ne", "Neon", 20.18], [11, "Na", "Sodium", 22.99], [12, "Mg", "Magnesium", 24.305],
  [13, "Al", "Aluminium", 26.982], [14, "Si", "Silicon", 28.085], [15, "P", "Phosphorus", 30.974], [16, "S", "Sulfur", 32.06],
  [17, "Cl", "Chlorine", 35.45], [18, "Ar", "Argon", 39.948], [19, "K", "Potassium", 39.098], [20, "Ca", "Calcium", 40.078],
  [26, "Fe", "Iron", 55.845], [27, "Co", "Cobalt", 58.933], [28, "Ni", "Nickel", 58.693], [29, "Cu", "Copper", 63.546],
  [30, "Zn", "Zinc", 65.38], [35, "Br", "Bromine", 79.904], [47, "Ag", "Silver", 107.868], [50, "Sn", "Tin", 118.71],
  [53, "I", "Iodine", 126.904], [78, "Pt", "Platinum", 195.084], [79, "Au", "Gold", 196.967], [80, "Hg", "Mercury", 200.592],
  [82, "Pb", "Lead", 207.2], [92, "U", "Uranium", 238.029],
];

export function PeriodicTool() {
  const A = accentOf(3);
  const [q, setQ] = useState("");
  const rows = ELEMENTS.filter(([, sym, name, mass]) => `${sym} ${name} ${mass}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <Field label="Search 34 key elements" value={q} onChange={setQ} placeholder="gold · au · 79" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {rows.map(([n, sym, name, mass]) => (
          <div key={n} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] text-zinc-500">{n}</span>
              <span className="font-mono text-[9px] text-zinc-600">{mass}</span>
            </div>
            <p className="mt-1 text-2xl font-black" style={{ color: A }}>{sym}</p>
            <p className="text-[11px] text-zinc-400">{name}</p>
          </div>
        ))}
      </div>
      <Note>A hand-picked set of the 34 elements everyone actually looks up. Mass in u, atomic number top-left.</Note>
    </div>
  );
}

/* ------------------------------ 18. Typing test ---------------------------- */

const TYPE_WORDS = "time year people way day man thing woman life child world school state family student group country problem hand part place case week company system program question work government number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guide moment air teacher force education".split(" ");

export function TypingTestTool() {
  const A = accentOf(4);
  const [started, setStarted] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [round, setRound] = useState(0);
  const words = useMemo(() => Array.from({ length: 40 }, () => TYPE_WORDS[Math.floor(Math.random() * TYPE_WORDS.length)]).join(" "), [round]);
  const target = words;
  const correct = useMemo(() => {
    let c = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) c++;
    return c;
  }, [typed, target]);
  const elapsed = started ? (Date.now() - started) / 1000 : 0;
  const wpm = elapsed > 0.5 ? Math.round((correct / 5) / (elapsed / 60)) : 0;
  const acc = typed.length ? Math.round((correct / typed.length) * 100) : 100;
  const done = typed.length >= target.length;
  const onType = (v: string) => {
    if (!started) setStarted(Date.now());
    setTyped(v);
  };
  const reset = () => {
    setTyped("");
    setStarted(null);
    setRound((r) => r + 1);
  };
  return (
    <div className="space-y-4">
      <Panel title="type the text — timer starts on first key" accent={A}>
        <p className="font-mono text-sm leading-relaxed">
          {target.split("").map((ch, i) => (
            <span key={i} style={{ color: i < typed.length ? (typed[i] === ch ? "#5EE39A" : "#FF8A7A") : "#52525b", background: i === typed.length ? `${A}22` : undefined }}>{ch}</span>
          ))}
        </p>
        <textarea value={typed} onChange={(e) => onType(e.target.value)} rows={3} className="mt-3 w-full rounded border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 focus:outline-none" placeholder="start typing here…" />
      </Panel>
      <Grid cols={4}>
        <BigStat label="Speed" value={wpm} unit="wpm" accent={A} />
        <BigStat label="Accuracy" value={`${acc}%`} accent="#5EE39A" />
        <BigStat label="Time" value={`${Math.round(elapsed)}s`} accent="#7FC8FF" />
        <BigStat label="Progress" value={`${Math.round((typed.length / target.length) * 100)}%`} accent="#FF9DE2" />
      </Grid>
      {done ? (
        <Row>
          <Btn accent={A} onClick={reset}>New words</Btn>
          <Tag accent="#5EE39A">finished — {wpm} wpm at {acc}% accuracy</Tag>
        </Row>
      ) : typed.length > 0 ? (
        <Btn variant="ghost" accent={A} onClick={reset}>Restart</Btn>
      ) : null}
    </div>
  );
}
