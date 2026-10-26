"use client";

/* ==========================================================================
   KIT: FUN & WEIRD — 18 party tricks, games and nonsense engines.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BigStat,
  Btn,
  Field,
  Grid,
  Note,
  Panel,
  Row,
  Seg,
  Tag,
  accentOf,
  fmt,
} from "./kit";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ------------------------------ 1. Western zodiac -------------------------- */

const ZODIAC: [string, string, string, [number, number]][] = [
  ["Capricorn", "♑", "Disciplined realist who climbs everything", [12, 22]],
  ["Aquarius", "♒", "Rebel inventor, allergic to boring", [1, 20]],
  ["Pisces", "♓", "Dreamy empath swimming in feelings", [2, 19]],
  ["Aries", "♈", "First through every wall, apology later", [3, 21]],
  ["Taurus", "♉", "Stubborn comfort connoisseur", [4, 20]],
  ["Gemini", "♊", "Two brains, both talking at once", [5, 21]],
  ["Cancer", "♋", "Emotional fortress with snacks inside", [6, 21]],
  ["Leo", "♌", "Main character energy, generous with it", [7, 23]],
  ["Virgo", "♍", "Details you missed, alphabetized", [8, 23]],
  ["Libra", "♎", "Diplomat who cannot pick a restaurant", [9, 23]],
  ["Scorpio", "♏", "Intense, loyal, knows your secrets", [10, 23]],
  ["Sagittarius", "♐", "Blunt adventurer, bags half-packed", [11, 22]],
];

export function ZodiacTool() {
  const A = accentOf(0);
  const [date, setDate] = useState("1995-08-20");
  const [, m, d] = date.split("-").map(Number);
  const sign = useMemo(() => {
    let s = ZODIAC[0];
    for (const z of ZODIAC) {
      const [zm, zd] = z[3];
      if (m === zm && d >= zd) s = z;
      else if (m > zm) s = z;
    }
    return s;
  }, [m, d]);
  return (
    <div className="space-y-4">
      <Field label="Birthday" value={date} onChange={setDate} type="date" />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
        <p className="text-7xl">{sign[1]}</p>
        <p className="mt-3 font-brut text-4xl" style={{ color: A }}>{sign[0]}</p>
        <p className="mt-2 max-w-xs text-center text-sm text-zinc-400">{sign[2]}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {ZODIAC.map((z) => (
          <div key={z[0]} className={`rounded border px-2 py-2.5 text-center ${z[0] === sign[0] ? "border-zinc-500 bg-zinc-800/60" : "border-zinc-800 bg-zinc-950/50"}`}>
            <p className="text-xl">{z[1]}</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase text-zinc-400">{z[0]}</p>
          </div>
        ))}
      </div>
      <Note>Star signs: entertainment-grade personality science. Entertain responsibly.</Note>
    </div>
  );
}

/* ------------------------------ 2. Chinese zodiac -------------------------- */

const CZODIAC: [string, string, string][] = [
  ["Rat", "🐀", "Quick-witted resourceful hoarder"], ["Ox", "🐂", "Reliable force of stubborn nature"],
  ["Tiger", "🐅", "Brave, impulsive, magnetic"], ["Rabbit", "🐇", "Gentle diplomat with a fast mind"],
  ["Dragon", "🐉", "Born leader, allergic to subtle"], ["Snake", "🐍", "Quiet strategist, deep thinker"],
  ["Horse", "🐎", "Free spirit allergic to desks"], ["Goat", "🐐", "Kind artist who worries beautifully"],
  ["Monkey", "🐒", "Clever trickster, solves everything"], ["Rooster", "🐓", "Punctual perfectionist, loud feathers"],
  ["Dog", "🐕", "Loyal guardian of everyone"], ["Pig", "🐖", "Generous epicurean, loves life"],
];
const CZ_ELEMS = ["Metal", "Water", "Wood", "Fire", "Earth"];

export function ChineseZodiacTool() {
  const A = accentOf(1);
  const [year, setYear] = useState("1996");
  const y = parseInt(year) || 2000;
  const animal = CZODIAC[(y - 1900) % 12];
  const elem = CZ_ELEMS[Math.floor(((y - 1900) % 10) / 2)];
  return (
    <div className="space-y-4">
      <Field label="Birth year" value={year} onChange={setYear} type="number" />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
        <p className="text-7xl">{animal[1]}</p>
        <p className="mt-3 font-brut text-3xl" style={{ color: A }}>{elem} {animal[0]}</p>
        <p className="mt-2 text-sm text-zinc-400">{animal[2]}</p>
        <Tag accent={A}>{y} · year of the {animal[0].toLowerCase()}</Tag>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {CZODIAC.map((z) => (
          <div key={z[0]} className={`rounded border px-2 py-3 text-center ${z[0] === animal[0] ? "border-zinc-500 bg-zinc-800/60" : "border-zinc-800 bg-zinc-950/50"}`}>
            <p className="text-2xl">{z[1]}</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase text-zinc-400">{z[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 3. Name compatibility ---------------------- */

export function NameCompatTool() {
  const A = accentOf(2);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [spin, setSpin] = useState(0);
  const score = useMemo(() => {
    void spin;
    if (!a.trim() || !b.trim()) return null;
    const seed = [...(a + b).toLowerCase()].reduce((acc, c) => acc + c.charCodeAt(0), 0) + spin * 7;
    return 40 + (seed * 9301 + 49297) % 60;
  }, [a, b, spin]);
  const verdict = score === null ? "" : score > 85 ? "Written in the stars ✨" : score > 70 ? "Strong cosmic signal 📡" : score > 55 ? "Solid with effort 💪" : "Chaotic fun 🎢";
  return (
    <div className="space-y-4">
      <Split2 left={<Field label="Name one" value={a} onChange={setA} placeholder="Romeo" />} right={<Field label="Name two" value={b} onChange={setB} placeholder="Juliet" />} />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
        {score !== null ? (
          <>
            <p className="font-brut text-7xl" style={{ color: A }}>{score}%</p>
            <p className="mt-2 text-lg text-zinc-200">{verdict}</p>
            <Btn variant="ghost" accent={A} onClick={() => setSpin((s) => s + 1)}>Consult the stars again</Btn>
          </>
        ) : (
          <p className="text-sm text-zinc-600">Two names walk into a love calculator…</p>
        )}
      </div>
      <Note>100% deterministic nonsense: the same two names always give the same answer. Blame the algorithm, not us.</Note>
    </div>
  );
}

function Split2({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

/* ------------------------------ 4-7. Social game packs --------------------- */

const WYR = [
  "have unlimited free flights forever… but only to places you have already been",
  "speak every language fluently but lose the ability to sing",
  "know the answer to any one question, once a year",
  "be the funniest person in the room but nobody takes you seriously",
  "have a pause button for life but only 10 total hours of it",
  "find your dream job but never be allowed to tell anyone what you do",
  "always know when someone is lying but they know when you are too",
  "eat any food with zero calories but it always tastes slightly of cardboard",
  "teleport once a day but always arrive slightly damp",
  "remember every dream vividly but cannot distinguish one from memory",
];
const TRUTHS = [
  "What is the pettiest reason you have ever ended a friendship?",
  "What is the most embarrassing thing in your search history right now?",
  "Who in this room would survive longest in a zombie apocalypse and why?",
  "What is a lie you told that spiraled completely out of control?",
  "What is the weirdest thing you have done when home alone?",
];
const DARES = [
  "Text the 5th person in your contacts: “the pigeons know what you did”.",
  "Speak in an accent until your next turn.",
  "Let the group post any emoji (just one) as your status.",
  "Do your best impression of another player — they judge the accuracy.",
  "Show the last photo in your camera roll. No context allowed.",
];
const NHIE = [
  "…ever pretended to know a song and vibed for 3 minutes",
  "…have used a stranger’s WiFi without asking while making eye contact with their house",
  "…rehearsed a conversation that never happened (full dialogue, both parts)",
  "…googled “how to look awake” at 3 a.m.",
  "…waved back at someone who was not waving at you and committed to the bit",
];
const ICE = [
  "What trivial hill are you fully prepared to die on?",
  "What is the best day of your life so far — small ones count double?",
  "Which app would you delete forever if it meant one person never sees your history?",
  "What hobby would you pick up if money were irrelevant for one year?",
  "What is the most useless talent you are secretly proud of?",
];

export function PartyPackTool({ kind }: { kind: "wyr" | "truthdare" | "nhie" | "ice" }) {
  const A = accentOf(kind === "wyr" ? 3 : kind === "truthdare" ? 4 : kind === "nhie" ? 5 : 6);
  const [item, setItem] = useState("");
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<"truth" | "dare">("truth");
  const next = () => {
    if (kind === "wyr") setItem(`Would you rather ${pick(WYR)}?`);
    else if (kind === "nhie") setItem(`Never have I ever ${pick(NHIE)}`);
    else if (kind === "ice") setItem(pick(ICE));
    else setItem(mode === "truth" ? pick(TRUTHS) : pick(DARES));
    setCount((c) => c + 1);
  };
  const titles = { wyr: "WOULD YOU RATHER", truthdare: "TRUTH OR DARE", nhie: "NEVER HAVE I EVER", ice: "ICE BREAKERS" };
  return (
    <div className="space-y-4">
      <Row className="items-center justify-between">
        {kind === "truthdare" ? (
          <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "truth" as const, label: "Truth 🫢" }, { v: "dare" as const, label: "Dare 😈" }]} />
        ) : <Tag accent={A}>{titles[kind]}</Tag>}
        <span className="font-mono text-[10px] text-zinc-600">card #{count}</span>
      </Row>
      <button type="button" onClick={next} className="flex min-h-[180px] w-full items-center justify-center rounded-lg border-2 p-8 text-center transition-all hover:scale-[1.01]" style={{ borderColor: A, background: `${A}0a` }}>
        <span className="text-xl font-bold leading-relaxed text-zinc-100">{item || `Tap to draw a ${kind === "wyr" ? "dilemma" : "card"}`}</span>
      </button>
      <Btn accent={A} onClick={next}>Next card</Btn>
      <Note>House rules: answer honestly or take a consequence. The host is the referee, the phone is the dealer.</Note>
    </div>
  );
}

export function WouldYouRatherTool() {
  return <PartyPackTool kind="wyr" />;
}
export function TruthDareTool() {
  return <PartyPackTool kind="truthdare" />;
}
export function NeverHaveIEverTool() {
  return <PartyPackTool kind="nhie" />;
}
export function IceBreakerTool() {
  return <PartyPackTool kind="ice" />;
}

/* ------------------------------ 8. Story prompts --------------------------- */

export function StoryPromptTool() {
  const A = accentOf(7);
  const [seed, setSeed] = useState(0);
  const WHO = ["a retired locksmith", "twin museum guards", "a cartographer who lost her compass", "the last beekeeper on Mars", "a librarian who catalogues silences", "an over-caffeinated wedding DJ", "a ghost with imposter syndrome", "a professional apology-writer"];
  const WHERE = ["in a hotel that only exists on Tuesdays", "at the world's most aggressive farmers market", "inside a lighthouse that keeps moving", "on the last train before the tracks end", "in a city where it rains upward", "at a funeral for a beloved vending machine", "in the archives of a forgotten satellite"];
  const WHAT = ["must return a borrowed shadow", "discovers a door billed monthly", "finds a map to a place that maps forbid", "has to return the moon by Friday", "inherits a curse with excellent customer service", "wins a contest they never entered", "must teach a robot to lie convincingly", "receives mail addressed to who they were ten years ago"];
  const prompt = seed === 0 ? "" : `${pick(WHO)} ${pick(WHAT)}, ${pick(WHERE)}.`;
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex min-h-[170px] w-full items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-white/5" style={{ borderColor: `${A}66` }}>
        <span className="text-xl font-bold leading-relaxed text-zinc-100">{prompt || "Tap for a story prompt…"}</span>
      </button>
      <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Another one</Btn>
      <Note>Formula: character + impossible errand + absurd venue. Twists write themselves from there.</Note>
    </div>
  );
}

/* ------------------------------ 9. Name generator -------------------------- */

export function BandNameTool() {
  const A = accentOf(8);
  const [seed, setSeed] = useState(0);
  const [mode, setMode] = useState<"band" | "team" | "startup">("band");
  const B1 = ["Velvet", "Neon", "Midnight", "Broken", "Electric", "Silent", "Cosmic", "Rabid", "Golden", "Feral", "Paper", "Glitter"];
  const B2 = ["Cactus", "Syndicate", "Wolves", "Tangerines", "Machina", "Parlour", "Static", "Bishops", "Pandas", "Jetsam", "Halos", "Cranes"];
  const T1 = ["Thunder", "Rapid", "Iron", "Frostbite", "Crimson", "Blazing", "Shadow", "Golden", "Savage", "Titan"];
  const T2 = ["Foxes", "Titans", "Kraken", "Bulls", "Comets", "Phoenix", "Vipers", "Wolves", "Bolts", "Harriers"];
  const S1 = ["Byte", "Loop", "Nova", "Pixel", "Wave", "Cloud", "Forge", "Stack", "Drift", "Pulse"];
  const S2 = ["ly", "base", "kit", "hub", "wise", "craft", "naut", "flow", "grid", "scale"];
  const name = useMemo(() => {
    void seed;
    if (mode === "band") return `${pick(B1)} ${pick(B2)}`;
    if (mode === "team") return `${pick(T1)} ${pick(T2)}`;
    return `${pick(S1)}${pick(S2)}`;
  }, [seed, mode]);
  return (
    <div className="space-y-4">
      <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "band" as const, label: "🎸 Band" }, { v: "team" as const, label: "🏟 Team" }, { v: "startup" as const, label: "🚀 Startup" }]} />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-12">
        <p className="font-brut text-4xl" style={{ color: A }}>{name}</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">pitches itself, honestly</p>
      </div>
      <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Generate</Btn>
    </div>
  );
}

/* ------------------------------ 10. Shakespearean -------------------------- */

export function ShakespeareTool() {
  const A = accentOf(9);
  const [mode, setMode] = useState<"compliment" | "insult">("compliment");
  const [seed, setSeed] = useState(0);
  const C1 = ["thou gleaming", "thou gentle", "thou golden", "thou honey-tongued", "thou celestial", "thou valiant"];
  const C2 = ["sun-shining", "rose-hued", "star-encrusted", "quill-wielding", "amber-eyed", "laughter-bearing"];
  const C3 = ["knight of my heart", "beacon of the realm", "treasure of the seven seas", "poet of the common room", "goddess of small mercies", "monarch of good vibes"];
  const I1 = ["thou beslubbering", "thou churlish", "thou droning", "thou frothy", "thou puny", "thou villainous"];
  const I2 = ["beetle-headed", "clay-brained", "fen-sucked", "milk-livered", "onion-eyed", "toad-spotted"];
  const I3 = ["knave", "canker-blossom", "malt-worm", "foot-licker", "death-token", "scut"];
  const line = useMemo(() => {
    void seed;
    if (mode === "compliment") return `${pick(C1)} ${pick(C2)} ${pick(C3)}!`;
    return `${pick(I1)} ${pick(I2)} ${pick(I3)}!`;
  }, [seed, mode]);
  return (
    <div className="space-y-4">
      <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "compliment" as const, label: "🌹 Compliment" }, { v: "insult" as const, label: "🗡 Insult" }]} />
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10 text-center">
        <p className="max-w-md font-brut text-2xl leading-relaxed" style={{ color: A }}>{line}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">authentic-ish elizabethan energy</p>
      </div>
      <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Speak again</Btn>
      <Note>Insult construction follows the genuine Shakespearean three-beat pattern. Engage thy enemies with style.</Note>
    </div>
  );
}

/* ------------------------------ 11. Magic 8 ball --------------------------- */

export function Magic8Tool() {
  const A = accentOf(10);
  const [answer, setAnswer] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const ANSWERS = ["It is certain.", "Without a doubt.", "Yes, decisively.", "Signs point to yes.", "Reply hazy — ask after coffee.", "Ask your mother.", "Better not tell you now.", "Concentrate and ask again.", "Outlook not so good.", "My sources say no.", "Absolutely not, and you know why.", "The answer is within you (probably no)."];
  const shake8 = () => {
    setShake(true);
    setTimeout(() => {
      setAnswer(pick(ANSWERS));
      setShake(false);
    }, 450);
  };
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <button type="button" onClick={shake8} className={`relative flex h-52 w-52 items-center justify-center rounded-full border-4 border-zinc-800 bg-zinc-900 transition-transform ${shake ? "animate-[brut-wiggle_0.15s_ease-in-out_3]" : ""}`}>
        <span className="absolute top-6 h-16 w-24 rounded-full bg-white/5 blur-md" aria-hidden />
        <span className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-950 px-3 text-center">
          <span className="text-xs font-bold leading-relaxed" style={{ color: answer ? A : "#3f3f46" }}>{answer ?? "8"}</span>
        </span>
      </button>
      <Btn accent={A} onClick={shake8}>Shake the orb</Btn>
      <Note>The classic fortune-telling toy, physics-free but spiritually accurate.</Note>
    </div>
  );
}

/* ------------------------------ 12. Lottery -------------------------------- */

export function LotteryTool() {
  const A = accentOf(11);
  const [max, setMax] = useState(49);
  const [count, setCount] = useState(6);
  const [lines, setLines] = useState(4);
  const [seed, setSeed] = useState(0);
  const tickets = useMemo(() => {
    void seed;
    return Array.from({ length: lines }, () => {
      const nums = new Set<number>();
      while (nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
      return [...nums].sort((a, b) => a - b);
    });
  }, [max, count, lines, seed]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Pool (1–N)" value={max} onChange={(v) => setMax(Math.max(count + 1, Math.min(99, parseInt(v) || 49)))} type="number" className="w-32" />
        <Field label="Numbers per line" value={count} onChange={(v) => setCount(Math.max(1, Math.min(10, parseInt(v) || 6)))} type="number" className="w-32" />
        <Field label="Lines" value={lines} onChange={(v) => setLines(Math.max(1, Math.min(8, parseInt(v) || 4)))} type="number" className="w-32" />
      </Row>
      <div className="space-y-2">
        {tickets.map((t, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
            {t.map((n) => (
              <span key={n} className="flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-sm font-black" style={{ borderColor: A, color: A }}>{n}</span>
            ))}
          </div>
        ))}
      </div>
      <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Draw new tickets</Btn>
      <Note>The house edge does not care about your numbers — but matching birthdays with a friend is still fun.</Note>
    </div>
  );
}

/* ------------------------------ 13. Rock paper scissors -------------------- */

export function RpsTool() {
  const A = accentOf(0);
  const MOVES = ["rock", "paper", "scissors"] as const;
  const EMOJI = { rock: "✊", paper: "✋", scissors: "✌️" } as const;
  const [mine, setMine] = useState<(typeof MOVES)[number] | null>(null);
  const [cpu, setCpu] = useState<(typeof MOVES)[number] | null>(null);
  const [score, setScore] = useState({ w: 0, l: 0, d: 0 });
  const play = (m: (typeof MOVES)[number]) => {
    const c = pick([...MOVES]);
    setMine(m);
    setCpu(c);
    if (m === c) setScore((s) => ({ ...s, d: s.d + 1 }));
    else if ((m === "rock" && c === "scissors") || (m === "paper" && c === "rock") || (m === "scissors" && c === "paper")) setScore((s) => ({ ...s, w: s.w + 1 }));
    else setScore((s) => ({ ...s, l: s.l + 1 }));
  };
  const verdict = mine && cpu ? (mine === cpu ? "Draw." : (mine === "rock" && cpu === "scissors") || (mine === "paper" && cpu === "rock") || (mine === "scissors" && cpu === "paper") ? "You win!" : "CPU wins.") : "";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {MOVES.map((m) => (
          <button key={m} type="button" onClick={() => play(m)} className="rounded-lg border-2 border-zinc-700 bg-zinc-900 py-6 text-4xl transition-all hover:scale-105 hover:border-zinc-500 active:scale-95">
            {EMOJI[m]}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-8 rounded-lg border border-zinc-800 bg-zinc-950/70 py-6">
        <div className="text-center"><p className="mono-kicker text-zinc-500">you</p><p className="text-4xl">{mine ? EMOJI[mine] : "—"}</p></div>
        <p className="font-brut text-xl" style={{ color: A }}>{verdict || "VS"}</p>
        <div className="text-center"><p className="mono-kicker text-zinc-500">cpu</p><p className="text-4xl">{cpu ? EMOJI[cpu] : "—"}</p></div>
      </div>
      <Grid cols={3}>
        <BigStat label="Wins" value={score.w} accent="#5EE39A" />
        <BigStat label="Losses" value={score.l} accent="#FF8A7A" />
        <BigStat label="Draws" value={score.d} accent="#7FC8FF" />
      </Grid>
    </div>
  );
}

/* ------------------------------ 14. Memory match --------------------------- */

const MEM_ICONS = ["🍕", "🚀", "🐙", "🎧", "🌵", "⚡", "🍩", "🦊"];

export function MemoryGameTool() {
  const A = accentOf(1);
  const build = () => {
    const pairs = [...MEM_ICONS.slice(0, 6), ...MEM_ICONS.slice(0, 6)];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return pairs.map((icon, i) => ({ id: i, icon, flipped: false, matched: false }));
  };
  const [cards, setCards] = useState(build);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const won = cards.every((c) => c.matched);
  const flip = (id: number) => {
    if (open.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    const nextCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(nextCards);
    const nextOpen = [...open, id];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextOpen.map((x) => nextCards.find((c) => c.id === x));
      if (a && b && a.icon === b.icon) {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true, flipped: true } : c)));
          setOpen([]);
        }, 300);
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c)));
          setOpen([]);
        }, 700);
      }
    }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((c) => (
          <button key={c.id} type="button" onClick={() => flip(c.id)} className={`flex aspect-square items-center justify-center rounded-lg border-2 text-3xl transition-all ${c.flipped || c.matched ? "border-zinc-600 bg-zinc-800" : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"}`} style={c.matched ? { borderColor: A } : undefined}>
            <span className={c.flipped || c.matched ? "" : "opacity-20"}>{c.flipped || c.matched ? c.icon : "★"}</span>
          </button>
        ))}
      </div>
      <Row className="items-center justify-between">
        <BigStat label="Moves" value={moves} accent={A} />
        {won ? <Tag accent="#5EE39A">solved in {moves} moves — {moves <= 10 ? "savage memory" : "solid work"}</Tag> : null}
        <Btn variant="ghost" accent={A} onClick={() => { setCards(build()); setOpen([]); setMoves(0); }}>Shuffle & restart</Btn>
      </Row>
    </div>
  );
}

/* ------------------------------ 15. Reaction test -------------------------- */

export function ReactionTool() {
  const A = accentOf(2);
  const [state, setState] = useState<"idle" | "waiting" | "go" | "result">("idle");
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const begin = () => {
    setState("waiting");
    timer.current = setTimeout(() => {
      t0.current = performance.now();
      setState("go");
    }, 800 + Math.random() * 2200);
  };
  const click = () => {
    if (state === "idle" || state === "result") begin();
    else if (state === "waiting") {
      if (timer.current) clearTimeout(timer.current);
      setState("idle");
    } else if (state === "go") {
      const d = Math.round(performance.now() - t0.current);
      setMs(d);
      setBest((b) => (b === null ? d : Math.min(b, d)));
      setState("result");
    }
  };
  return (
    <div className="space-y-4">
      <button type="button" onClick={click} className="flex h-64 w-full items-center justify-center rounded-lg border-2 text-center transition-colors" style={{ borderColor: state === "go" ? "#5EE39A" : "#3f3f46", background: state === "go" ? "#5EE39A1a" : state === "waiting" ? "#FF8A7A0d" : "transparent" }}>
        <span className="font-brut text-3xl" style={{ color: state === "go" ? "#5EE39A" : "#a1a1aa" }}>
          {state === "idle" && "CLICK TO START"}
          {state === "waiting" && "WAIT FOR GREEN…"}
          {state === "go" && "CLICK NOW!"}
          {state === "result" && `${ms} ms — click to retry`}
        </span>
      </button>
      <Grid cols={2}>
        <BigStat label="Last" value={ms || "—"} unit="ms" accent={A} />
        <BigStat label="Personal best" value={best ?? "—"} unit="ms" accent="#5EE39A" />
      </Grid>
      <Note>Average human: ~250 ms. F1 drivers: ~150 ms. Clicking early = penalty (that is on you).</Note>
    </div>
  );
}

/* ------------------------------ 16. Aim trainer ---------------------------- */

export function AimTrainerTool() {
  const A = accentOf(3);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [hits, setHits] = useState(0);
  const [started, setStarted] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const move = () => {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    setTarget({ x: 10 + Math.random() * (r.width - 60), y: 10 + Math.random() * (r.height - 60) });
  };
  const onHit = () => {
    if (!started) return;
    setHits((h) => h + 1);
    setTimes((t) => [...t, performance.now()]);
    if (hits + 1 >= 10) { setTarget(null); return; }
    move();
  };
  const avgMs = times.length > 1 ? (times[times.length - 1] - times[0]) / (times.length - 1) : 0;
  return (
    <div className="space-y-4">
      <div ref={boxRef} className="relative h-72 w-full overflow-hidden rounded-lg border-2 border-zinc-800 bg-zinc-950/80">
        {target ? (
          <button type="button" onClick={onHit} aria-label="hit target" className="absolute h-11 w-11 rounded-full border-2 transition-transform hover:scale-90" style={{ left: target.x, top: target.y, borderColor: A, background: `${A}33` }} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Btn accent={A} onClick={() => { setStarted(Date.now()); setHits(0); setTimes([]); move(); }}>
              {hits >= 10 ? "Go again" : "Start 10 targets"}
            </Btn>
          </div>
        )}
      </div>
      <Grid cols={3}>
        <BigStat label="Targets hit" value={hits} unit="/10" accent={A} />
        <BigStat label="Avg reaction" value={avgMs ? Math.round(avgMs) : "—"} unit="ms" accent="#7FC8FF" />
        <BigStat label="Status" value={hits >= 10 ? "Complete!" : started ? "Firing…" : "Ready"} accent="#5EE39A" />
      </Grid>
      <Note>Mouse or finger — the clock runs from first hit to last. Under 600 ms average means you have gamer reflexes.</Note>
    </div>
  );
}

/* ------------------------------ 17. CPS test ------------------------------- */

export function CpsTool() {
  const A = accentOf(4);
  const [clicks, setClicks] = useState<number[]>([]);
  const running = clicks.length > 0 && performance.now() - clicks[0] < 5000;
  const [now, setNow] = useState(performance.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(t);
  }, [running]);
  const elapsed = clicks.length ? Math.min(5000, now - clicks[0]) / 1000 : 0;
  const cps = elapsed > 0.2 ? clicks.length / elapsed : 0;
  const left = clicks.length ? Math.max(0, 5 - elapsed) : 5;
  const click = () => {
    const t = performance.now();
    setClicks((c) => (c.length && t - c[0] > 5000 ? [t] : [...c, t]));
  };
  const grade = cps === 0 ? "" : cps < 4 ? "Casual clicker" : cps < 6 ? "Average human" : cps < 8 ? "Fast fingers" : "Butterfly-click legend";
  return (
    <div className="space-y-4">
      <button type="button" onClick={click} className="flex h-56 w-full flex-col items-center justify-center rounded-lg border-2 border-zinc-700 bg-zinc-900/60 active:scale-[0.99]" style={{ borderColor: running ? `${A}88` : undefined }}>
        <span className="font-brut text-6xl tabular-nums" style={{ color: A }}>{clicks.length}</span>
        <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{clicks.length === 0 ? "click to start · 5 second test" : `${left.toFixed(1)}s left`}</span>
      </button>
      <Grid cols={3}>
        <BigStat label="Clicks / second" value={fmt(cps, 1)} accent={A} />
        <BigStat label="Total clicks" value={clicks.length} accent="#7FC8FF" />
        <BigStat label="Rank" value={grade || "—"} accent="#5EE39A" />
      </Grid>
      {clicks.length && !running ? <Btn variant="ghost" accent={A} onClick={() => setClicks([])}>Reset</Btn> : null}
      <Note>World-class jitter-clickers hit 10+ CPS. If your wrist hurts, you have learned enough for today.</Note>
    </div>
  );
}

/* ------------------------------ 18. Emoji story ---------------------------- */

export function EmojiStoryTool() {
  const A = accentOf(5);
  const [seed, setSeed] = useState(0);
  const POOL = "🌙🌊🦑🕯️👑🍎🪞🐍🐦‍⬛🎬🚪⛵🔥🧊🦋🍄🌰🗿💉🧵🔒🪐🎹🥀🦴🧭☂️🎭🫧🪁🧊🍈🪬".split(/(?=[\s\S])/u).filter(Boolean);
  const story = useMemo(() => {
    void seed;
    return Array.from({ length: 9 }, () => pick(POOL)).join(" ");
  }, [seed]);
  const templates = ["A journey that starts with joy and ends in mystery…", "Someone lost something. The rain knows where it is.", "The feast was fine until the third guest arrived.", "A door opens both ways. Only one of you notices.", "Nothing explodes. Somehow that is the twist."];
  const gloss = seed === 0 ? "" : pick(templates);
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-12">
        <p className="text-5xl tracking-[0.2em]" style={{ letterSpacing: "0.15em" }}>{story || "…"}</p>
        <p className="mt-5 text-sm italic text-zinc-500">{gloss}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">decode it your way — post it, let replies do the work</p>
      </div>
      <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>New emoji plot</Btn>
    </div>
  );
}
