"use client";

/* ==========================================================================
   KIT: MUSIC & PERFORMANCE — 5 tools for singers, practisers and ensembles.
   A voice-fit key finder with live transposed chords, a dated tempo ladder,
   a weighted skill rotation, an ensemble transposition chart and a stage
   seating planner. No two screens alike: a keyboard-shaped range picker,
   a stepped ladder table, a week grid, an instrument ledger and a stage map.
   ========================================================================== */

import { useMemo, useState } from "react";
import { FlipHorizontal2, Gauge, CalendarClock, ListMusic, LayoutGrid } from "lucide-react";
import {
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
import type { ToolMeta } from "./tool-types";

/* ------------------------------ shared helpers ---------------------------- */

const NOTE_PC: Record<string, number> = {
  c: 0, "c#": 1, db: 1, d: 2, "d#": 3, eb: 3, e: 4, f: 5,
  "f#": 6, gb: 6, g: 7, "g#": 8, ab: 8, a: 9, "a#": 10, bb: 10, b: 11,
};
const PC_NAME = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

/** "Bb3" / "f#4" → MIDI number (C4 = 60). Returns null when unparseable. */
function toMidi(s: string): number | null {
  const m = /^([a-g](?:#|b)?)\s*(-?\d)$/i.exec(s.trim());
  if (!m) return null;
  const pc = NOTE_PC[m[1].toLowerCase()];
  if (pc === undefined) return null;
  return (Number(m[2]) + 1) * 12 + pc;
}

function midiName(midi: number): string {
  return `${SHARP[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

function transposeChord(tok: string, semis: number): string {
  const m = /^([A-G](?:#|b)?)(.*)$/.exec(tok.trim());
  if (!m) return tok;
  const pc = NOTE_PC[m[1].toLowerCase()];
  if (pc === undefined) return tok;
  const root = SHARP[((pc + semis) % 12 + 12) % 12];
  return root + m[2];
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ------------------------- 1. Vocal-Range Key Finder ---------------------- */

function VocalKeyTool() {
  const A = accentOf(1);
  const [sLow, setSLow] = useState("G3");
  const [sHigh, setSHigh] = useState("D5");
  const [nLow, setNLow] = useState("B3");
  const [nHigh, setNHigh] = useState("F#5");
  const [keyPc, setKeyPc] = useState(0); // concert key pitch class
  const [chords, setChords] = useState("C G Am F\nDm7 G7 Csus4");

  const fit = useMemo(() => {
    const sl = toMidi(sLow), sh = toMidi(sHigh), nl = toMidi(nLow), nh = toMidi(nHigh);
    if (sl === null || sh === null || nl === null || nh === null || sh <= sl || nh <= nl)
      return { list: [] as { shift: number; capo: number }[], err: true };
    const out: { shift: number; capo: number }[] = [];
    for (let shift = -6; shift <= 6; shift++) {
      const lo = nl + shift, hi = nh + shift;
      if (lo >= sl && hi <= sh) out.push({ shift, capo: ((shift % 12) + 12) % 12 });
    }
    out.sort((a, b) => Math.abs(a.shift) - Math.abs(b.shift));
    return { list: out, err: false };
  }, [sLow, sHigh, nLow, nHigh]);

  const chordList = chords.split(/[\n,]+/).flatMap((l) => l.trim().split(/\s+/)).filter(Boolean);

  return (
    <Split
      left={
        <Panel title="RANGES" accent={A}>
          <Grid cols={2}>
            <Field label="Singer low (e.g. G3)" value={sLow} onChange={setSLow} />
            <Field label="Singer high" value={sHigh} onChange={setSHigh} />
            <Field label="Song low note" value={nLow} onChange={setNLow} />
            <Field label="Song high note" value={nHigh} onChange={setNHigh} />
          </Grid>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">SONG&apos;S ORIGINAL KEY</span>
            <div className="flex flex-wrap gap-1">
              {PC_NAME.map((n, i) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setKeyPc(i)}
                  className="rounded px-2 py-1 font-mono text-[10px] font-bold"
                  style={
                    i === keyPc
                      ? { background: A, color: "#0a0a0a" }
                      : { border: "1px solid #3f3f46", color: "#a1a1aa" }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <span className="mono-kicker mb-1.5 block text-zinc-500">CHORD LIST (ONE BAR PER TOKEN)</span>
            <div className="flex flex-wrap gap-1.5">
              {chordList.map((c, i) => (
                <span key={i} className="rounded border border-zinc-700 bg-zinc-950/70 px-2 py-1 font-mono text-[11px] text-zinc-200">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <Note>Pitch format: note name + octave, e.g. A2, C4, F#5. The tool tries every key within ±6 semitones and keeps the ones where the whole melody sits inside your voice.</Note>
        </Panel>
      }
      right={
        <Panel title="KEYS THAT FIT YOUR VOICE" accent={A}>
          {fit.err ? (
            <p className="text-sm text-zinc-500">Enter four valid notes (e.g. G3, D5, B3, F#5) with low below high.</p>
          ) : fit.list.length === 0 ? (
            <p className="text-sm text-zinc-500">No key within ±6 semitones fits that range — the song may simply sit outside your voice.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {fit.list.slice(0, 5).map((f) => {
                  const k = ((keyPc + f.shift) % 12 + 12) % 12;
                  return (
                    <div key={f.shift} className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-lg font-black" style={{ color: A }}>
                          {PC_NAME[k]} major
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {f.shift === 0 ? "no change" : `${f.shift > 0 ? "+" : ""}${f.shift} semitones`}
                          {f.capo > 0 && f.capo < 7 ? ` · capo ${f.capo}` : ""}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {chordList.map((c, i) => (
                          <span key={i} className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px] font-bold" style={{ color: A }}>
                            {transposeChord(c, f.shift)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Out
                label="FULL TRANSPOSED CHORD SHEET (BEST FIT)"
                text={fit.list[0]
                  ? `Key: ${PC_NAME[((keyPc + fit.list[0].shift) % 12 + 12) % 12]}\n\n` +
                    chordList.map((c) => transposeChord(c, fit.list[0].shift)).join("  ")
                  : ""}
              />
            </>
          )}
        </Panel>
      }
    />
  );
}

/* --------------------------- 2. Practice Tempo Ladder --------------------- */

function TempoLadderTool() {
  const A = accentOf(2);
  const [start, setStart] = useState(60);
  const [target, setTarget] = useState(120);
  const [step, setStep] = useState(5);
  const [sessions, setSessions] = useState(3);
  const [gap, setGap] = useState(2);
  const [from, setFrom] = useState(() => iso(new Date()));

  const stages = useMemo(() => {
    const out: { bpm: number; from: string; to: string }[] = [];
    let bpm = start;
    let day = 0;
    let guard = 0;
    while (bpm < target && guard++ < 60) {
      const next = Math.min(target, Math.round(bpm * (1 + step / 100)));
      const f = iso(addDays(new Date(from), day));
      day += sessions * gap;
      const t = iso(addDays(new Date(from), day - 1));
      out.push({ bpm: next, from: f, to: t });
      bpm = next;
    }
    return out;
  }, [start, target, step, sessions, gap, from]);

  const weeks = stages.length ? Math.ceil((stages.length * sessions * gap) / 7) : 0;

  return (
    <Split
      left={
        <Panel title="LADDER SETTINGS" accent={A}>
          <Row>
            <Field label="START BPM" type="number" value={start} onChange={(v) => setStart(Number(v))} />
            <Field label="TARGET BPM" type="number" value={target} onChange={(v) => setTarget(Number(v))} />
            <Field label="FIRST SESSION DATE" type="date" value={from} onChange={setFrom} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="STEP PER STAGE" value={step} onChange={setStep} min={1} max={15} suffix="%" accent={A} />
            <Slider label="SESSIONS PER STAGE" value={sessions} onChange={setSessions} min={1} max={10} accent={A} />
            <Slider label="DAYS BETWEEN SESSIONS" value={gap} onChange={setGap} min={1} max={4} suffix=" d" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="STAGES" value={stages.length} accent={A} />
            <BigStat label="TOTAL SESSIONS" value={stages.length * sessions} accent={A} />
            <BigStat label="WEEKS" value={weeks} accent={A} />
          </Grid>
          <Note>Geometric progression: each stage multiplies the previous tempo by (1 + step%). Small steps stick; big steps slip.</Note>
        </Panel>
      }
      right={
        <Panel title="YOUR DATED LADDER" accent={A}>
          {stages.length === 0 ? (
            <p className="text-sm text-zinc-500">Target must be above start.</p>
          ) : (
            <div className="space-y-1.5">
              {stages.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-right font-mono text-[10px] text-zinc-600">{i + 1}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full" style={{ width: `${(s.bpm / target) * 100}%`, background: A }} />
                  </div>
                  <span className="w-14 shrink-0 font-mono text-xs font-black" style={{ color: A }}>{s.bpm} BPM</span>
                  <span className="hidden w-40 shrink-0 text-right font-mono text-[10px] text-zinc-500 sm:block">
                    {s.from} → {s.to}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Out
            className="mt-3"
            label="COPY PLAN"
            text={stages.map((s, i) => `Stage ${i + 1}: ${s.bpm} BPM — ${s.from} to ${s.to} (${sessions} sessions)`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------------- 3. Practice Rotation ------------------------- */

function PracticeRotationTool() {
  const A = accentOf(3);
  const [skills, setSkills] = useState("Scales 3\nSight-reading 2\nRepertoire 4\nTechnique 2\nTheory 1");
  const [minutes, setMinutes] = useState(120);
  const [days, setDays] = useState(5);

  const plan = useMemo(() => {
    const rows = skills
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const m = /^(.*?)(?:\s+(\d+))?$/.exec(l)!;
        return { name: m[1].trim(), w: m[2] ? Math.max(1, Number(m[2])) : 1 };
      });
    const total = rows.reduce((s, r) => s + r.w, 0) || 1;
    const slots: string[] = [];
    const perSkill = new Map<string, number>();
    const daySlots: string[][] = Array.from({ length: days }, () => []);
    // weighted allocation in minute blocks of 10
    const blocks = Math.floor(minutes / 10);
    rows.forEach((r) => {
      const n = Math.max(1, Math.round((r.w / total) * blocks));
      perSkill.set(r.name, n);
    });
    // round-robin spread so no skill repeats on the same or adjacent day where possible
    let cursor = 0;
    const pool: { name: string; n: number }[] = rows.map((r) => ({ name: r.name, n: perSkill.get(r.name) ?? 1 }));
    const flat: string[] = [];
    pool.forEach((p) => { for (let i = 0; i < p.n; i++) flat.push(p.name); });
    // interleave: sort not needed; place greedily avoiding same skill in current day
    for (const name of flat) {
      let placed = false;
      for (let tries = 0; tries < days && !placed; tries++) {
        const d = (cursor + tries) % days;
        if (!daySlots[d].includes(name)) {
          daySlots[d].push(name);
          cursor = d + 1;
          placed = true;
        }
      }
      if (!placed) {
        const d = cursor % days;
        daySlots[d].push(name);
        cursor = d + 1;
      }
      slots.push(name);
    }
    return { rows, daySlots, perSkill };
  }, [skills, minutes, days]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].slice(0, plan.daySlots.length);

  return (
    <Split
      left={
        <Panel title="SKILLS & TIME" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SKILLS — ONE PER LINE, WEIGHT AFTER THE NAME</span>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="WEEKLY MINUTES" type="number" value={minutes} onChange={(v) => setMinutes(Number(v))} />
          </Row>
          <div className="mt-3">
            <Slider label="PRACTICE DAYS PER WEEK" value={days} onChange={setDays} min={2} max={7} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="SKILLS" value={plan.rows.length} accent={A} />
            <BigStat label="10-MIN BLOCKS" value={Math.floor(minutes / 10)} accent={A} />
            <BigStat label="DAYS" value={days} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="WEEK GRID" accent={A}>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(days, 3)}, minmax(0, 1fr))` }}>
            {plan.daySlots.map((d, i) => (
              <div key={i} className="min-w-0 rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
                <p className="mono-kicker mb-1.5" style={{ color: A }}>{dayNames[i]}</p>
                <div className="space-y-1">
                  {d.map((s, j) => (
                    <div key={j} className="rounded bg-zinc-800/70 px-1.5 py-1 font-mono text-[10px] text-zinc-200">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-0.5">
            {plan.rows.map((r) => (
              <KV
                key={r.name}
                k={r.name}
                accent={A}
                v={`${plan.perSkill.get(r.name) ?? 0} blocks · ${(((plan.perSkill.get(r.name) ?? 0) * 10) / minutes * 100).toFixed(0)}%`}
              />
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY WEEK"
            text={plan.daySlots.map((d, i) => `${dayNames[i]}: ${d.join(" · ") || "rest"}`).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------ 4. Ensemble Transposition Chart ----------------- */

const TRANSPOSERS = [
  { id: "c", label: "C (flute, piano, violin)", off: 0 },
  { id: "bb", label: "Bb (clarinet, trumpet, tenor sax)", off: 2 },
  { id: "a", label: "A (clarinet)", off: 3 },
  { id: "eb", label: "Eb (alto & bari sax)", off: 9 },
  { id: "f", label: "F (horn)", off: 7 },
  { id: "g", label: "G (alto flute)", off: 5 },
] as const;

function EnsembleTransposeTool() {
  const A = accentOf(4);
  const [concertKey, setConcertKey] = useState(0);
  const [notes, setNotes] = useState("C D E F G A B");
  const [picked, setPicked] = useState<string[]>(["bb", "eb", "f"]);

  const noteList = notes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const rows = TRANSPOSERS.filter((t) => picked.includes(t.id)).map((t) => {
    const key = ((concertKey + t.off) % 12 + 12) % 12;
    const written = noteList.map((n) => {
      const m = toMidi(n);
      if (m === null) return `?(${n})`;
      return SHARP[((m + t.off) % 12 + 12) % 12];
    });
    return { ...t, keyName: PC_NAME[key], written };
  });

  return (
    <div className="space-y-4">
      <Panel title="CONCERT PITCH SOURCE" accent={A}>
        <Row>
          <div>
            <span className="mono-kicker mb-1.5 block text-zinc-500">CONCERT KEY</span>
            <div className="flex flex-wrap gap-1">
              {PC_NAME.map((n, i) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConcertKey(i)}
                  className="rounded px-2 py-1 font-mono text-[10px] font-bold"
                  style={i === concertKey ? { background: A, color: "#0a0a0a" } : { border: "1px solid #3f3f46", color: "#a1a1aa" }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </Row>
        <div className="mt-3">
          <span className="mono-kicker mb-1.5 block text-zinc-500">CONCERT NOTES (SPACE OR COMMA SEPARATED)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
        </div>
        <div className="mt-3">
          <span className="mono-kicker mb-1.5 block text-zinc-500">ENSEMBLE</span>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {TRANSPOSERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className="flex items-center gap-2 rounded border px-2 py-1.5 text-left font-mono text-[10px]"
                style={
                  picked.includes(t.id)
                    ? { borderColor: A, color: A, background: `${A}14` }
                    : { borderColor: "#3f3f46", color: "#a1a1aa" }
                }
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: picked.includes(t.id) ? A : "#3f3f46" }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>
      <Panel title="WRITTEN PARTS" accent={A}>
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Pick at least one instrument.</p>
        ) : (
          <div className="space-y-2.5">
            {rows.map((r) => (
              <div key={r.id} className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-zinc-300">{r.label}</span>
                  <Tag accent={A}>written key {r.keyName}</Tag>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {r.written.map((w, i) => (
                    <span key={i} className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px] font-black" style={{ color: A }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <Note>Written pitch = concert pitch raised by each instrument&apos;s fixed interval (Bb +2, A +3, G +5, F +7, Eb +9). Octaves are pitch-class only — octave keys are handled by the player.</Note>
      </Panel>
    </div>
  );
}

/* --------------------------- 5. Stage Seating Planner --------------------- */

function StageSeatingTool() {
  const A = accentOf(5);
  const [sections, setSections] = useState("Violin I:10\nViolin II:10\nViola:8\nCello:6\nFlute:2\nClarinet:2\nTrumpet:2\nTrombone:1");
  const [perStand, setPerStand] = useState(2);
  const [stageW, setStageW] = useState(9);
  const [stageD, setStageD] = useState(6);
  const [chairW, setChairW] = useState(0.9);

  const plan = useMemo(() => {
    const rows = sections
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const m = /^(.*?)(?::\s*(\d+))?$/.exec(l)!;
        return { name: (m[1] || "Section").trim(), count: m[2] ? Number(m[2]) : 1 };
      });
    const chairsPerRow = Math.max(1, Math.floor(stageW / chairW));
    // pack sections front to back in the order given (strings first convention)
    const layout: { row: number; cells: { name: string; chairs: number }[]; used: number }[] = [];
    let current = { row: 1, cells: [] as { name: string; chairs: number }[], used: 0 };
    let stands = 0;
    for (const s of rows) {
      const secStands = Math.ceil(s.count / perStand);
      stands += secStands;
      const chairs = secStands * perStand; // stands occupy chair-equivalent slots
      if (current.used + chairs > chairsPerRow && current.cells.length > 0) {
        layout.push(current);
        current = { row: current.row + 1, cells: [], used: 0 };
      }
      current.cells.push({ name: s.name, chairs });
      current.used += chairs;
    }
    if (current.cells.length) layout.push(current);
    return { rows, layout, chairsPerRow, stands, totalChairs: rows.reduce((s, r) => s + r.count, 0) };
  }, [sections, perStand, stageW, stageD, chairW]);

  return (
    <Split
      left={
        <Panel title="SECTIONS & STAGE" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SECTIONS — NAME : COUNT, FRONT LINE FIRST</span>
          <textarea
            value={sections}
            onChange={(e) => setSections(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="STAGE WIDTH (M)" type="number" step={0.1} value={stageW} onChange={(v) => setStageW(Number(v))} />
            <Field label="STAGE DEPTH (M)" type="number" step={0.1} value={stageD} onChange={(v) => setStageD(Number(v))} />
            <Field label="CHAIR SLOT (M)" type="number" step={0.05} value={chairW} onChange={(v) => setChairW(Number(v))} />
          </Row>
          <div className="mt-3">
            <Slider label="PLAYERS PER STAND" value={perStand} onChange={setPerStand} min={1} max={4} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="PLAYERS" value={plan.totalChairs} accent={A} />
            <BigStat label="MUSIC STANDS" value={plan.stands} accent={A} />
            <BigStat label="ROWS NEEDED" value={plan.layout.length} hint={`${stageD} m deep`} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="STAGE MAP (AUDIENCE VIEW)" accent={A}>
          <div className="space-y-1.5">
            {plan.layout.map((r) => (
              <div key={r.row} className="flex gap-1.5">
                <span className="w-4 shrink-0 pt-1 font-mono text-[9px] text-zinc-600">{r.row}</span>
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {r.cells.map((c, i) => (
                    <div
                      key={i}
                      className="min-w-0 rounded border px-1.5 py-1 font-mono text-[9px] leading-tight"
                      style={{
                        borderColor: `${A}55`,
                        background: `${A}0f`,
                        color: "#e4e4e7",
                        flexGrow: c.chairs,
                        flexBasis: `${(c.chairs / plan.chairsPerRow) * 100}%`,
                      }}
                    >
                      <b style={{ color: A }}>{c.name}</b> · {c.chairs} chairs
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-2 rounded bg-zinc-800/60 py-1 text-center font-mono text-[9px] tracking-[0.3em] text-zinc-500">
              AUDIENCE
            </div>
          </div>
          <Out
            className="mt-3"
            label="COPY PLAN"
            text={plan.layout
              .map((r) => `Row ${r.row}: ` + r.cells.map((c) => `${c.name} ×${c.chairs}`).join(" | "))
              .join("\n")}
          />
          <Note>Row capacity = stage width ÷ chair slot ({fmt(plan.chairsPerRow, 1)} chairs). Sections fill front-to-back in the order you list them — strings first is the classical convention.</Note>
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const musicMeta: ToolMeta[] = [
  {
    id: "vocal-key-transposer",
    name: "Vocal Key Finder",
    description: "Singer range + song range + chords → every key that fits your voice, with transposed chords and capo.",
    category: "fun",
    icon: FlipHorizontal2,
    keywords: "what key should i sing vocal range transpose chords capo song key",
    badge: "new",
    component: VocalKeyTool,
  },
  {
    id: "tempo-ladder",
    name: "Practice Tempo Ladder",
    description: "Start BPM to target BPM in small geometric steps — a dated metronome ladder you can actually follow.",
    category: "fun",
    icon: Gauge,
    keywords: "practice tempo ladder metronome plan bpm increase sessions",
    badge: "new",
    component: TempoLadderTool,
  },
  {
    id: "practice-rotation",
    name: "Practice Rotation Planner",
    description: "Weighted skills × weekly minutes → a week grid that hits your priorities without repeating a skill daily.",
    category: "fun",
    icon: CalendarClock,
    keywords: "music practice rotation planner instruments skills week minutes",
    badge: "new",
    component: PracticeRotationTool,
  },
  {
    id: "transpose-ensemble",
    name: "Ensemble Transposer",
    description: "Concert key + notes → written key and notes for Bb, Eb, F, A, G and C instruments at once.",
    category: "fun",
    icon: ListMusic,
    keywords: "transposing instruments concert pitch to bb eb chart ensemble parts",
    badge: "new",
    component: EnsembleTransposeTool,
  },
  {
    id: "orchestra-seating",
    name: "Stage Seating Planner",
    description: "Sections + stage size → rows, music stands and a printable stage map from the audience view.",
    category: "fun",
    icon: LayoutGrid,
    keywords: "orchestra band seating layout planner stage chairs stands rows",
    badge: "new",
    component: StageSeatingTool,
  },
];
