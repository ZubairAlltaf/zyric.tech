"use client";

/* ==========================================================================
   KIT: EXTRAS — 13 rapid-fire utilities that push the drawer past 250.
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  Area,
  BigStat,
  Btn,
  Field,
  Grid,
  KV,
  Meter,
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

/* ------------------------------ Morse code --------------------------------- */

const MORSE: Record<string, string> = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
  i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
  q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
  y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.",
};
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export function MorseTool() {
  const A = accentOf(0);
  const [text, setText] = useState("");
  const [dir, setDir] = useState<"enc" | "dec">("enc");
  const out = useMemo(() => {
    if (dir === "enc") return text.toLowerCase().split("").map((c) => (c === " " ? "/" : MORSE[c] ?? "")).filter(Boolean).join(" ");
    return text.trim().split(/\s+/).map((t) => (t === "/" ? " " : MORSE_REV[t] ?? "?")).join("");
  }, [text, dir]);
  return (
    <div className="space-y-4">
      <Seg value={dir} onChange={setDir} accent={A} options={[{ v: "enc" as const, label: "Text → Morse" }, { v: "dec" as const, label: "Morse → Text" }]} />
      <Split left={<Area label={dir === "enc" ? "Plain text" : "Morse ( . − / )"} value={text} onChange={setText} rows={5} placeholder={dir === "enc" ? "sos" : "... --- ..."} />} right={<Out label={dir === "enc" ? "morse" : "decoded"} text={out} />} />
      <Note>SOS = ... --- ... — the only Morse most of us will ever need, until a lighthouse befriends you.</Note>
    </div>
  );
}

/* ------------------------------ Caesar cipher ------------------------------ */

export function CaesarTool() {
  const A = accentOf(1);
  const [text, setText] = useState("");
  const [shift, setShift] = useState(3);
  const enc = useMemo(() => text.replace(/[a-z]/gi, (c) => {
    const base = c === c.toLowerCase() ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
  }), [text, shift]);
  const rows = Array.from({ length: 25 }, (_, i) => {
    const s = i + 1;
    const t = text.replace(/[a-z]/gi, (c) => {
      const base = c === c.toLowerCase() ? 97 : 65;
      return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26 + 26) % 26 + base);
    });
    return { s, t };
  });
  return (
    <div className="space-y-4">
      <Slider label="Shift (ROT-N)" value={shift} onChange={setShift} min={1} max={25} accent={A} />
      <Split left={<Area label="Plain text" value={text} onChange={setText} rows={4} placeholder="attack at dawn" />} right={<Out label={`ROT${shift}`} text={enc} />} />
      <Panel title="brute-force all 25 shifts — find the readable one" accent={A}>
        <div className="max-h-44 space-y-1 overflow-y-auto">
          {rows.map((r) => (
            <p key={r.s} className="font-mono text-xs text-zinc-400">
              <span style={{ color: r.s === shift ? A : "#52525b" }}>ROT{String(r.s).padStart(2, "0")}</span> {r.t || "—"}
            </p>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------ NATO alphabet ------------------------------ */

const NATO: Record<string, string> = { a: "Alfa", b: "Bravo", c: "Charlie", d: "Delta", e: "Echo", f: "Foxtrot", g: "Golf", h: "Hotel", i: "India", j: "Juliett", k: "Kilo", l: "Lima", m: "Mike", n: "November", o: "Oscar", p: "Papa", q: "Quebec", r: "Romeo", s: "Sierra", t: "Tango", u: "Uniform", v: "Victor", w: "Whiskey", x: "X-ray", y: "Yankee", z: "Zulu", "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine" };

export function NatoTool() {
  const A = accentOf(2);
  const [text, setText] = useState("");
  const words = text.toLowerCase().split("").map((c) => (c === " " ? null : NATO[c] ?? c)).filter(Boolean) as string[];
  return (
    <div className="space-y-4">
      <Field label="Spell it out" value={text} onChange={setText} placeholder="zyric" />
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4" style={{ minHeight: 80 }}>
        {words.map((w, i) => (
          <span key={i} className="rounded border px-2 py-1 font-mono text-xs font-bold" style={{ borderColor: `${A}55`, color: A }}>{w}</span>
        ))}
        {!words.length && <p className="m-auto text-sm text-zinc-600">Alfa Bravo Charlie appears here…</p>}
      </div>
      <Out label="one line" text={words.join(" ")} />
    </div>
  );
}

/* ------------------------------ Text repeater ------------------------------ */

export function RepeaterTool() {
  const A = accentOf(3);
  const [text, setText] = useState("");
  const [times, setTimes] = useState(5);
  const [sep, setSep] = useState<"newline" | "space" | "none">("newline");
  const out = useMemo(() => {
    if (!text) return "";
    const j = sep === "newline" ? "\n" : sep === "space" ? " " : "";
    return Array(Math.min(500, Math.max(1, times))).fill(text).join(j);
  }, [text, times, sep]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Text" value={text} onChange={setText} placeholder="never gonna give you up" className="min-w-[200px] flex-1" />
        <Slider label="Repeats (max 500)" value={times} onChange={setTimes} min={1} max={100} accent={A} />
        <Seg value={sep} onChange={setSep} accent={A} options={[{ v: "newline" as const, label: "Lines" }, { v: "space" as const, label: "Spaces" }, { v: "none" as const, label: "Glued" }]} />
      </Row>
      <Out label={`${Math.min(500, times)} copies`} text={out} />
    </div>
  );
}

/* ------------------------------ Syllable counter --------------------------- */

function sylCount(w: string): number {
  w = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return (cleaned.match(/[aeiouy]{1,2}/g) || ["x"]).length;
}

export function SyllableTool() {
  const A = accentOf(4);
  const [text, setText] = useState("");
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const counts = words.map((w) => sylCount(w));
    const total = counts.reduce((a, b) => a + b, 0);
    const hard = words.filter((_, i) => counts[i] >= 4);
    return { words: words.length, total, avg: words.length ? total / words.length : 0, hard };
  }, [text]);
  return (
    <div className="space-y-4">
      <Area label="Text to count" value={text} onChange={setText} rows={5} mono={false} placeholder="supercalifragilisticexpialidocious" />
      <Grid cols={4}>
        <BigStat label="Total syllables" value={stats.total} accent={A} />
        <BigStat label="Words" value={stats.words} accent="#7FC8FF" />
        <BigStat label="Avg per word" value={fmt(stats.avg, 1)} accent="#5EE39A" />
        <BigStat label="4+ syllable words" value={stats.hard.length} accent="#FF8A7A" />
      </Grid>
      {stats.hard.length ? (
        <Panel title="the mouthfuls" accent={A}>
          <div className="flex flex-wrap gap-1.5">{stats.hard.map((w) => <Tag key={w} accent="#FF8A7A">{w}</Tag>)}</div>
        </Panel>
      ) : null}
      <Note>Heuristic vowel-group counting — good enough for rap audits and haiku policing.</Note>
    </div>
  );
}

/* ------------------------------ Birthday paradox --------------------------- */

export function BirthdayTool() {
  const A = accentOf(5);
  const [people, setPeople] = useState(23);
  const [days, setDays] = useState(365);
  const p = useMemo(() => {
    let acc = 1;
    for (let i = 0; i < people; i++) acc *= (days - i) / days;
    return (1 - acc) * 100;
  }, [people, days]);
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="People in the room" value={people} onChange={setPeople} min={2} max={100} accent={A} />
        <Slider label="Days in a year" value={days} onChange={setDays} min={10} max={365} accent={A} />
      </Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
        <p className="mono-kicker text-zinc-500">chance two share a birthday</p>
        <p className="mt-2 font-brut text-6xl" style={{ color: p > 50 ? "#5EE39A" : A }}>{fmt(p, 1)}%</p>
        <div className="mt-4 w-64"><Meter value={p} max={100} accent={p > 50 ? "#5EE39A" : A} right={`${fmt(p, 1)}%`} /></div>
      </div>
      <Note>23 people → 50.7%. Intuition fails because pairs grow quadratically (23 people = 253 pairings).</Note>
    </div>
  );
}

/* ------------------------------ Gas vs EV ---------------------------------- */

export function GasVsEvTool() {
  const A = accentOf(6);
  const [kmYear, setKmYear] = useState("15000");
  const [l100, setL100] = useState("7.5");
  const [fuelPrice, setFuelPrice] = useState("1.75");
  const [kwh100, setKwh100] = useState("17");
  const [elecPrice, setElecPrice] = useState("0.30");
  const km = parseFloat(kmYear) || 0;
  const gasCost = (km / 100) * (parseFloat(l100) || 0) * (parseFloat(fuelPrice) || 0);
  const evCost = (km / 100) * (parseFloat(kwh100) || 0) * (parseFloat(elecPrice) || 0);
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label=" km / year" value={kmYear} onChange={setKmYear} type="number" />
        <Field label="Petrol car L/100km" value={l100} onChange={setL100} type="number" step="0.1" />
        <Field label="Fuel price / liter" value={fuelPrice} onChange={setFuelPrice} type="number" step="0.01" />
        <Field label="EV kWh/100km" value={kwh100} onChange={setKwh100} type="number" step="0.1" />
        <Field label="Electricity / kWh" value={elecPrice} onChange={setElecPrice} type="number" step="0.01" />
      </Grid>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-5 text-center">
          <p className="mono-kicker text-zinc-500">⛽ petrol per year</p>
          <p className="mt-1 font-brut text-4xl text-zinc-200">${fmt(gasCost, 0)}</p>
        </div>
        <div className="rounded-lg border p-5 text-center" style={{ borderColor: `${A}55`, background: `${A}0a` }}>
          <p className="mono-kicker text-zinc-500">🔌 EV per year</p>
          <p className="mt-1 font-brut text-4xl" style={{ color: A }}>${fmt(evCost, 0)}</p>
        </div>
      </div>
      <BigStat label="Yearly saving with EV" value={`$${fmt(gasCost - evCost, 0)}`} accent={gasCost - evCost > 0 ? "#5EE39A" : "#FF8A7A"} hint={`≈ $${fmt((gasCost - evCost) * 5, 0)} over 5 years`} />
      <Note>Energy cost only — depreciation, tires and the "fun of downshifting" excluded.</Note>
    </div>
  );
}

/* ------------------------------ Simple interest ---------------------------- */

export function SimpleInterestTool() {
  const A = accentOf(7);
  const [p, setP] = useState("5000");
  const [r, setR] = useState("5");
  const [y, setY] = useState("3");
  const P = parseFloat(p) || 0, R = parseFloat(r) || 0, Y = parseFloat(y) || 0;
  const interest = (P * R * Y) / 100;
  return (
    <div className="space-y-4">
      <Grid cols={3}>
        <Field label="Principal" value={p} onChange={setP} type="number" />
        <Field label="Rate % / year" value={r} onChange={setR} type="number" step="0.1" />
        <Field label="Years" value={y} onChange={setY} type="number" />
      </Grid>
      <div className="flex items-end justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center"><p className="mono-kicker text-zinc-500">interest</p><p className="mt-1 font-brut text-4xl" style={{ color: A }}>${fmt(interest)}</p></div>
        <div className="text-center"><p className="mono-kicker text-zinc-500">total</p><p className="mt-1 font-brut text-4xl text-zinc-200">${fmt(P + interest)}</p></div>
      </div>
      <KV k="per year" v={`$${fmt(Y > 0 ? interest / Y : 0)}`} accent={A} />
      <Note>Flat, no compounding — how short-term loans and classroom math pretend the world works.</Note>
    </div>
  );
}

/* ------------------------------ Duration adder ----------------------------- */

export function DurationTool() {
  const A = accentOf(8);
  const [list, setList] = useState("1:25\n0:45\n2:10\n0:30");
  const total = useMemo(() => {
    let secs = 0;
    for (const line of list.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const parts = line.split(":").map((x) => parseInt(x) || 0);
      if (parts.length === 3) secs += parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) secs += parts[0] * 60 + parts[1];
      else secs += parts[0];
    }
    return secs;
  }, [list]);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return (
    <div className="space-y-4">
      <Area label="Durations (h:mm:ss or m:ss, one per line)" value={list} onChange={setList} rows={7} />
      <div className="flex items-end justify-center gap-8 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">total</p>
          <p className="mt-1 font-brut text-5xl" style={{ color: A }}>{h}<span className="text-xl text-zinc-500">h</span> {String(m).padStart(2, "0")}<span className="text-xl text-zinc-500">m</span> {String(s).padStart(2, "0")}<span className="text-xl text-zinc-500">s</span></p>
        </div>
        <div className="text-center">
          <p className="mono-kicker text-zinc-500">in minutes</p>
          <p className="mt-1 font-brut text-3xl text-zinc-200">{fmt(total / 60, 1)}</p>
        </div>
      </div>
      <Note>Perfect for playlists, edit timelines, workout circuits and "how long is this meeting block really".</Note>
    </div>
  );
}

/* ------------------------------ Reading time ------------------------------- */

export function ReadingTimeTool() {
  const A = accentOf(9);
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(220);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const mins = words / Math.max(1, wpm);
  const label = mins < 1 ? "< 1 min" : `${Math.round(mins)} min`;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Word count auto-detected" value={words} onChange={() => {}} className="flex-1" hint="paste the article below" />
        <Slider label="Reading pace (wpm)" value={wpm} onChange={setWpm} min={100} max={400} step={10} accent={A} />
      </Row>
      <Area label="Paste the article" value={text} onChange={setText} rows={8} mono={false} />
      <BigStat label="Estimated reading time" value={label} accent={A} hint={`${words.toLocaleString()} words ÷ ${wpm} wpm · speaking aloud ≈ ${words ? Math.max(1, Math.round(words / 130)) : 0} min`} />
      <Note>The "N min read" badge every blog shows, computed before you publish.</Note>
    </div>
  );
}

/* ------------------------------ Px to Rem ---------------------------------- */

export function PxRemTool() {
  const A = accentOf(10);
  const [px, setPx] = useState("16");
  const [root, setRoot] = useState("16");
  const rem = (parseFloat(px) || 0) / Math.max(1, parseFloat(root) || 16);
  const back = (parseFloat(px) || 0) * (parseFloat(root) || 16);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Pixels" value={px} onChange={setPx} type="number" className="flex-1" />
        <Field label="Root size (px)" value={root} onChange={setRoot} type="number" className="flex-1" />
      </Row>
      <div className="flex items-end justify-center gap-10 rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <div className="text-center"><p className="mono-kicker text-zinc-500">px → rem</p><p className="mt-1 font-brut text-4xl" style={{ color: A }}>{fmt(rem, 4)}rem</p></div>
        <div className="text-center"><p className="mono-kicker text-zinc-500">rem → px (if it were rem)</p><p className="mt-1 font-brut text-4xl text-zinc-200">{fmt(back, 2)}px</p></div>
      </div>
      <Note>Rem scales with the user's browser settings — px does not. Accessibility teams thank you for using rem.</Note>
    </div>
  );
}

/* ------------------------------ Group splitter ----------------------------- */

export function GroupSplitterTool() {
  const A = accentOf(11);
  const [names, setNames] = useState("");
  const [groupCount, setGroupCount] = useState(3);
  const [seed, setSeed] = useState(0);
  const groups = useMemo(() => {
    void seed;
    const list = names.split(/[\n,]+/).map((n) => n.trim()).filter(Boolean);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    const out: string[][] = Array.from({ length: groupCount }, () => []);
    list.forEach((n, i) => out[i % groupCount].push(n));
    return out;
  }, [names, groupCount, seed]);
  return (
    <div className="space-y-4">
      <Row>
        <Slider label="Groups" value={groupCount} onChange={setGroupCount} min={2} max={10} accent={A} />
        <Btn accent={A} onClick={() => setSeed((s) => s + 1)}>Re-shuffle</Btn>
      </Row>
      <Area label="Names (one per line or comma-separated)" value={names} onChange={setNames} rows={6} mono={false} placeholder={"Ada\nGrace\nAlan\nKatherine\nLinus\nMargaret"} />
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => (
          <Panel key={i} title={`Group ${i + 1} · ${g.length}`} accent={A}>
            <ul className="space-y-1 text-sm text-zinc-200">{g.map((n) => <li key={n}>• {n}</li>)}{!g.length && <li className="text-zinc-600">—</li>}</ul>
          </Panel>
        ))}
      </div>
      <Note>Fair shuffle, round-robin deal — classroom-tested, favoritism-proof (mostly).</Note>
    </div>
  );
}

/* ------------------------------ ISO week number ---------------------------- */

export function WeekNumberTool() {
  const A = accentOf(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const info = useMemo(() => {
    const d = new Date(date + "T12:00:00");
    if (isNaN(d.getTime())) return null;
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const fDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - fDayNum + 3);
    const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
    const start = new Date(target.getTime() - 3 * 86400000);
    const end = new Date(target.getTime() + 3 * 86400000);
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    const leap = (d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || d.getFullYear() % 400 === 0;
    return { week, year: target.getUTCFullYear(), start, end, dayOfYear, leap, weekday: d.toLocaleDateString("en-US", { weekday: "long" }) };
  }, [date]);
  return (
    <div className="space-y-4">
      <Field label="Date" value={date} onChange={setDate} type="date" />
      {info ? (
        <>
          <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
            <p className="mono-kicker text-zinc-500">ISO week number</p>
            <p className="mt-2 font-brut text-7xl" style={{ color: A }}>{info.week}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">of {info.year} · {info.weekday}</p>
          </div>
          <Grid cols={4}>
            <BigStat label="Week starts" value={info.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} accent="#7FC8FF" />
            <BigStat label="Week ends" value={info.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })} accent="#5EE39A" />
            <BigStat label="Day of year" value={info.dayOfYear} accent="#FF9DE2" />
            <BigStat label="Leap year" value={info.leap ? "Yes" : "No"} accent="#FF8A7A" />
          </Grid>
        </>
      ) : (
        <p className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-6 text-center text-sm text-zinc-600">Pick a date…</p>
      )}
      <Note>ISO-8601: weeks start Monday; week 1 contains the first Thursday of the year.</Note>
    </div>
  );
}