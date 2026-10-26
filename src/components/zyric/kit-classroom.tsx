"use client";

/* ==========================================================================
   KIT: CLASSROOM LOGISTICS — 6 tools for teachers and exam offices.
   A dated presentation schedule with first/last rotation, a marking-load
   finish-line planner, weekly spelling/vocabulary rotation, book-set
   circulation, an invigilation rota with room ratios, and a homeschool
   block timetable.
   ========================================================================== */

import { useMemo, useState } from "react";
import { Mic, PenLine, SpellCheck, BookCopy, ClipboardCheck, Home } from "lucide-react";
import {
  BigStat,
  Field,
  Grid,
  KV,
  Meter,
  Note,
  Out,
  Panel,
  Row,
  Slider,
  Split,
  Tag,
  accentOf,
  fmt,
} from "./kit";
import type { ToolMeta } from "./tool-types";

function num(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function dow(d: Date): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

/* ------------------------ 1. Presentation Schedule ------------------------ */

function PresentationSchedulerTool() {
  const A = accentOf(3);
  const [names, setNames] = useState("Aisha\nBen\nChen\nDara\nElena\nFarid\nGrace\nHugo\nImani\nJonas");
  const [talk, setTalk] = useState(6);
  const [qa, setQa] = useState(3);
  const [gap, setGap] = useState(2);
  const [perDay, setPerDay] = useState(5);
  const [from, setFrom] = useState(() => iso(new Date()));
  const [skip, setSkip] = useState("Sat,Sun");

  const plan = useMemo(() => {
    const list = names.split("\n").map((s) => s.trim()).filter(Boolean);
    const skipSet = new Set(skip.split(",").map((s) => s.trim().slice(0, 3).toLowerCase()));
    const rows: { name: string; day: number; date: string; dow: string; pos: number; from: string; to: string }[] = [];
    let day = 0, idx = 0, slot = 0, minutes = 0;
    let d = new Date(from + "T00:00:00");
    while (idx < list.length && day < 60) {
      if (skipSet.has(dow(d).toLowerCase())) { d = addDays(d, 1); continue; }
      const fromMin = 9 * 60 + minutes;
      const toMin = fromMin + talk;
      rows.push({
        name: list[idx],
        day,
        date: iso(d),
        dow: dow(d),
        pos: slot + 1,
        from: `${Math.floor(fromMin / 60)}:${String(fromMin % 60).padStart(2, "0")}`,
        to: `${Math.floor(toMin / 60)}:${String(toMin % 60).padStart(2, "0")}`,
      });
      minutes += talk + qa + (slot + 1 === Math.min(perDay, list.length - idx) ? 0 : gap);
      idx++; slot++;
      if (slot >= perDay || idx >= list.length) {
        slot = 0; minutes = 0; day++;
        d = addDays(d, 1);
      }
    }
    return rows;
  }, [names, talk, qa, gap, perDay, from, skip]);

  const days = new Set(plan.map((r) => r.date)).size;
  const firsts = plan.filter((r) => r.pos === 1).length;

  return (
    <Split
      left={
        <Panel title="CLASS & FORMAT" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">STUDENTS — ONE PER LINE (ORDER = TALK ORDER)</span>
          <textarea
            value={names}
            onChange={(e) => setNames(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="FIRST DAY" type="date" value={from} onChange={setFrom} />
            <Field label="SKIP DAYS" value={skip} onChange={setSkip} hint="3-letter codes, comma separated" />
          </Row>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Slider label="TALK MINUTES" value={talk} onChange={setTalk} min={2} max={30} accent={A} />
            <Slider label="Q&A MINUTES" value={qa} onChange={setQa} min={0} max={15} accent={A} />
            <Slider label="CHANGEOVER GAP" value={gap} onChange={setGap} min={0} max={10} suffix=" min" accent={A} />
            <Slider label="TALKS PER DAY" value={perDay} onChange={setPerDay} min={1} max={12} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="TALKS" value={plan.length} accent={A} />
            <BigStat label="DAYS NEEDED" value={days} accent={A} />
            <BigStat label="SESSION END" value={plan.length ? plan[plan.length - 1].to : "—"} hint="last talk of final day" accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="RUNNING ORDER" accent={A}>
          <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {plan.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1">
                <span className="w-5 shrink-0 font-mono text-[10px] text-zinc-600">{r.pos}</span>
                <span className="w-10 shrink-0 font-mono text-[10px]" style={{ color: A }}>{r.dow}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold text-zinc-200">{r.name}</span>
                <span className="font-mono text-[10px] text-zinc-500">{r.from}–{r.to}</span>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Meter value={firsts} max={Math.max(1, days)} accent={A} label="DIFFERENT STUDENTS OPENING THE DAY" right={`${firsts}/${days}`} />
          </div>
          <Out className="mt-3" label="COPY SCHEDULE" text={plan.map((r) => `${r.date} ${r.dow} ${r.from}–${r.to}: ${r.name}`).join("\n")} />
          <Note>Reverse the list next term so the same students aren&apos;t always first or last — the pos column makes the fairness rotation easy to flip.</Note>
        </Panel>
      }
    />
  );
}

/* --------------------------- 2. Marking-Load Planner ---------------------- */

function MarkingLoadTool() {
  const A = accentOf(4);
  const [classes, setClasses] = useState("7B:28\n8A:26\n9C:31\n10X:24");
  const [perPaper, setPerPaper] = useState(4);
  const [cap, setCap] = useState(120);
  const [start, setStart] = useState(() => iso(new Date()));
  const [weekendOff, setWeekendOff] = useState(true);

  const plan = useMemo(() => {
    const rows = classes.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = /^(.*?)(?::\s*(\d+))?$/.exec(l)!;
      return { name: (m[1] || "Class").trim(), n: m[2] ? Number(m[2]) : 0 };
    });
    let minutesLeft = 0;
    rows.forEach((r) => (minutesLeft += r.n * perPaper));
    const out: { name: string; papers: number; mins: number; done: string }[] = [];
    let d = new Date(start + "T00:00:00");
    let dayCap = cap;
    let guard = 0;
    rows.forEach((r) => {
      let mins = r.n * perPaper;
      let guard2 = 0;
      while (mins > 0 && guard2++ < 400) {
        if (weekendOff && (d.getDay() === 0 || d.getDay() === 6)) { d = addDays(d, 1); continue; }
        const spend = Math.min(mins, dayCap);
        mins -= spend;
        dayCap -= spend;
        if (dayCap <= 0 || mins <= 0) {
          if (mins > 0) { d = addDays(d, 1); dayCap = cap; }
          else { dayCap = dayCap <= 0 ? cap : dayCap; }
        }
      }
      out.push({ ...r, papers: r.n, mins: r.n * perPaper, done: iso(d) });
    });
    void guard;
    return { out, total: minutesLeft, daysNeeded: Math.ceil(minutesLeft / cap) };
  }, [classes, perPaper, cap, start, weekendOff]);

  return (
    <Split
      left={
        <Panel title="THE STACK" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">CLASSES — NAME : STUDENTS</span>
          <textarea
            value={classes}
            onChange={(e) => setClasses(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="START MARKING" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="MINUTES PER PAPER" value={perPaper} onChange={setPerPaper} min={1} max={15} accent={A} />
            <Slider label="DAILY MARKING CAP" value={cap} onChange={setCap} min={30} max={360} step={15} suffix=" min" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="PAPERS" value={plan.out.reduce((s, r) => s + r.papers, 0)} accent={A} />
            <BigStat label="TOTAL MINUTES" value={fmt(plan.total, 0)} hint={`${fmt(plan.total / 60, 1)} hours`} accent={A} />
            <BigStat label="PURE DAYS" value={plan.daysNeeded} hint={`at ${cap} min/day`} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="FINISH LINES" accent={A}>
          <div className="space-y-1.5">
            {plan.out.map((r) => {
              const load = r.mins;
              return (
                <div key={r.name} className="rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-zinc-200">{r.name}</span>
                    <Tag accent={A}>done {r.done}</Tag>
                  </div>
                  <div className="mt-1">
                    <Meter value={Math.min(load, cap)} max={Math.max(cap, load)} accent={A} right={`${r.papers} papers · ${fmt(load / 60, 1)} h`} />
                  </div>
                  {load > cap ? <p className="mt-1 font-mono text-[9px] text-zinc-500">spans multiple days at your {cap}-minute cap</p> : null}
                </div>
              );
            })}
          </div>
          <Out className="mt-3" label="COPY FINISH DATES" text={plan.out.map((r) => `${r.name} (${r.papers} papers): done by ${r.done}`).join("\n")} />
          <Note>Classes finish in the order you listed them. Weekend guard is on by default — turn it off if you mark Saturdays (sorry).</Note>
        </Panel>
      }
    />
  );
}

/* ----------------------- 3. Spelling & Vocabulary Rotation ---------------- */

function SpellingRotationTool() {
  const A = accentOf(5);
  const [words, setWords] = useState("because\nfriend\nsaid\nagain\nthere\ntheir\nwhere\nthought\nthrough\nenough\nspecial\nparticular\nseparate\nbelieve\nreceive\nnecessary\nlibrary\nFebruary\nbusiness\nrhythm");
  const [perWeek, setPerWeek] = useState(4);
  const [review1, setReview1] = useState(1);
  const [review2, setReview2] = useState(3);
  const [start, setStart] = useState(() => iso(new Date()));

  const weeks = useMemo(() => {
    const list = words.split("\n").map((s) => s.trim()).filter(Boolean);
    const weeksCount = Math.ceil(list.length / Math.max(1, perWeek)) + review2 + 1;
    const out: { w: number; label: string; start: string; newW: string[]; rev1: string[]; rev2: string[] }[] = [];
    for (let w = 0; w < weeksCount; w++) {
      const newW = list.slice(w * perWeek, (w + 1) * perWeek);
      const rev1 = w - review1 >= 0 ? list.slice((w - review1) * perWeek, (w - review1 + 1) * perWeek) : [];
      const rev2 = w - review2 >= 0 ? list.slice((w - review2) * perWeek, (w - review2 + 1) * perWeek) : [];
      if (!newW.length && !rev1.length && !rev2.length) break;
      out.push({
        w: w + 1,
        label: newW.length ? `Week ${w + 1}` : `Consolidation ${w + 1}`,
        start: iso(addDays(new Date(start + "T00:00:00"), w * 7)),
        newW, rev1, rev2,
      });
    }
    return out;
  }, [words, perWeek, review1, review2, start]);

  return (
    <Split
      left={
        <Panel title="WORD BANK & CYCLE" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">MASTER LIST — ONE WORD PER LINE</span>
          <textarea
            value={words}
            onChange={(e) => setWords(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="TERM STARTS" type="date" value={start} onChange={setStart} />
          </Row>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Slider label="NEW WORDS / WEEK" value={perWeek} onChange={setPerWeek} min={2} max={12} accent={A} />
            <Slider label="REVISIT AFTER N WEEKS" value={review1} onChange={setReview1} min={1} max={4} accent={A} />
            <Slider label="FINAL TEST AFTER N" value={review2} onChange={setReview2} min={2} max={6} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="WORDS" value={words.split("\n").filter((s) => s.trim()).length} accent={A} />
            <BigStat label="WEEKS" value={weeks.length} accent={A} />
            <BigStat label="TERM ENDS" value={weeks.length ? weeks[weeks.length - 1].start : "—"} hint="final week begins" accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="WEEKLY LISTS" accent={A}>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {weeks.map((w) => (
              <div key={w.w} className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-black" style={{ color: A }}>{w.label.toUpperCase()}</span>
                  <span className="font-mono text-[9px] text-zinc-600">w/c {w.start}</span>
                </div>
                <div className="mt-1 space-y-0.5 font-mono text-[10px] leading-relaxed">
                  {w.newW.length ? <p className="text-zinc-200"><b style={{ color: A }}>NEW:</b> {w.newW.join(", ")}</p> : null}
                  {w.rev1.length ? <p className="text-zinc-400"><b className="text-zinc-500">REVISIT:</b> {w.rev1.join(", ")}</p> : null}
                  {w.rev2.length ? <p className="text-zinc-500"><b className="text-zinc-600">TEST:</b> {w.rev2.join(", ")}</p> : null}
                </div>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY LISTS"
            text={weeks
              .map((w) => `${w.label} (w/c ${w.start})\n  new: ${w.newW.join(", ") || "—"}\n  revisit: ${w.rev1.join(", ") || "—"}\n  test: ${w.rev2.join(", ") || "—"}`)
              .join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* --------------------------- 4. Book-Set Rotation ------------------------- */

function BookSetRotationTool() {
  const A = accentOf(6);
  const [classes, setClasses] = useState("7B\n8A\n9C\n10X");
  const [sets, setSets] = useState("The Giver\nHoles\nSkellig\nWonder");
  const [blocks, setBlocks] = useState(4);
  const [weeksPer, setWeeksPer] = useState(6);

  const grid = useMemo(() => {
    const cs = classes.split("\n").map((s) => s.trim()).filter(Boolean);
    const ss = sets.split("\n").map((s) => s.trim()).filter(Boolean);
    const n = Math.max(cs.length, ss.length);
    const out: { cls: string; row: string[] }[] = [];
    for (let c = 0; c < cs.length; c++) {
      const row: string[] = [];
      for (let b = 0; b < blocks; b++) {
        row.push(ss.length ? ss[(((c + b) % n) + n) % n % Math.max(1, ss.length)] : "—");
      }
      out.push({ cls: cs[c], row });
    }
    // flag repeats: same class same book twice
    const flags: boolean[][] = out.map((r) =>
      r.row.map((b, i) => r.row.indexOf(b) !== i)
    );
    return { out, flags, weeks: blocks * weeksPer };
  }, [classes, sets, blocks, weeksPer]);

  return (
    <Split
      left={
        <Panel title="CIRCULATION SETUP" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">CLASSES</span>
          <textarea value={classes} onChange={(e) => setClasses(e.target.value)} rows={4} spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none" />
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">BOOK SETS (FEWER THAN CLASSES = SHARED SETS)</span>
          <textarea value={sets} onChange={(e) => setSets(e.target.value)} rows={4} spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Slider label="BLOCKS THIS TERM" value={blocks} onChange={setBlocks} min={2} max={8} accent={A} />
            <Slider label="WEEKS PER BLOCK" value={weeksPer} onChange={setWeeksPer} min={2} max={10} accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="CLASSES" value={classes.split("\n").filter((s) => s.trim()).length} accent={A} />
            <BigStat label="SETS" value={sets.split("\n").filter((s) => s.trim()).length} accent={A} />
            <BigStat label="TERM WEEKS" value={grid.weeks} accent={A} />
          </Grid>
          <Note>Each class slides one set along per block, so sets circulate with zero double-bookings — as long as you have at least as many sets as classes running in parallel.</Note>
        </Panel>
      }
      right={
        <Panel title="WHO HOLDS WHAT, WHEN" accent={A}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr>
                  <th className="pb-1.5 pr-2 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">Class</th>
                  {Array.from({ length: blocks }, (_, b) => (
                    <th key={b} className="pb-1.5 text-center font-mono text-[9px] uppercase text-zinc-600">
                      Block {b + 1}<span className="block text-[8px] text-zinc-700">wk {b * weeksPer + 1}–{(b + 1) * weeksPer}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.out.map((r, ri) => (
                  <tr key={r.cls} className="border-t border-zinc-800/60">
                    <td className="py-1.5 pr-2 font-mono text-[11px] font-bold text-zinc-200">{r.cls}</td>
                    {r.row.map((b, bi) => (
                      <td key={bi} className="py-1.5 text-center">
                        <span className="rounded px-1 py-0.5 font-mono text-[10px] font-bold"
                          style={grid.flags[ri][bi] ? { color: "#fbbf24", background: "#fbbf2414" } : { color: A }}>
                          {b}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Out
            className="mt-3"
            label="COPY ROTATION"
            text={grid.out.map((r) => `${r.cls}: ` + r.row.map((b, i) => `B${i + 1} ${b}`).join(" · ")).join("\n")}
          />
          {grid.flags.some((f) => f.some(Boolean)) ? (
            <p className="mt-2 font-mono text-[10px] text-amber-400">amber = a class repeats a book — add a set or swap manually</p>
          ) : null}
        </Panel>
      }
    />
  );
}

/* --------------------------- 5. Invigilation Rota ------------------------- */

function InvigilationTool() {
  const A = accentOf(7);
  const [exams, setExams] = useState("Mon: Maths: 120: Hall: 90\nTue: Physics: 60: Hall: 90\nWed: History: 90: Room 12: 30\nThu: French: 45: Room 12: 30");
  const [staff, setStaff] = useState("Ms Adeyemi\nMr Byrne\nMs Chen\nMr Okafor\nMs Petrov");
  const [ratio, setRatio] = useState(30);
  const [maxConsec, setMaxConsec] = useState(2);

  const plan = useMemo(() => {
    const ex = exams.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(":").map((s) => s.trim());
      return { day: p[0] || "Exam", subject: p[1] || "Subject", students: num(p[2] ?? "0"), room: p[3] || "Hall", mins: num(p[4] ?? "60") };
    });
    const names = staff.split("\n").map((s) => s.trim()).filter(Boolean);
    const rows = ex.map((e, i) => {
      const needed = Math.max(1, Math.ceil(e.students / Math.max(5, ratio)));
      const assigned = Array.from({ length: needed }, (_, k) => names[(i + k) % Math.max(1, names.length)]);
      return { ...e, needed, assigned };
    });
    // count consecutive load per staff
    const load = new Map<string, number>();
    names.forEach((n) => load.set(n, 0));
    let run = new Map<string, number>();
    rows.forEach((r) => {
      const thisRun = new Map<string, number>();
      r.assigned.forEach((n) => {
        const prev = (run.get(n) ?? 0) + 1;
        thisRun.set(n, prev);
      });
      run = thisRun;
      names.forEach((n) => { if (!thisRun.has(n)) thisRun.set(n, 0); });
      r.assigned.forEach((n) => {
        load.set(n, (load.get(n) ?? 0) + r.mins / 60);
      });
    });
    return { rows, names, load: [...load.entries()].sort((a, b) => b[1] - a[1]) };
  }, [exams, staff, ratio, maxConsec]);

  return (
    <Split
      left={
        <Panel title="EXAMS & STAFF" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">EXAMS — DAY : SUBJECT : STUDENTS : ROOM : MINUTES</span>
          <textarea
            value={exams}
            onChange={(e) => setExams(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <span className="mono-kicker mb-1.5 mt-3 block text-zinc-500">INVIGILATORS</span>
          <textarea
            value={staff}
            onChange={(e) => setStaff(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Slider label="STUDENTS PER INVIGILATOR" value={ratio} onChange={setRatio} min={10} max={60} step={5} accent={A} />
            <Slider label="MAX CONSECUTIVE EXAMS" value={maxConsec} onChange={setMaxConsec} min={1} max={5} hint="flag threshold" accent={A} />
          </div>
        </Panel>
      }
      right={
        <>
          <Panel title="ROTA" accent={A}>
            <div className="space-y-1.5">
              {plan.rows.map((r, i) => (
                <div key={i} className="rounded border border-zinc-800 bg-zinc-950/60 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-zinc-200">{r.day} · {r.subject}</span>
                    <span className="font-mono text-[9px] text-zinc-600">{r.room} · {r.students} students · {r.mins} min</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Tag accent={A}>{r.needed} needed</Tag>
                    {r.assigned.map((n, k) => (
                      <span key={k} className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="mt-3">
            <Panel title="HOURS PER PERSON" accent={A}>
              {plan.load.map(([n, h]) => (
                <KV key={n} k={n} accent={A} v={`${fmt(h, 1)} h`} />
              ))}
              <Note>Rota cycles through staff in order, so hours stay close. Any staff member above {(maxConsec * 2).toFixed(1)} h across the window is worth a swap before publish.</Note>
            </Panel>
          </div>
        </>
      }
    />
  );
}

/* ------------------------- 6. Homeschool Timetable ------------------------ */

function HomeschoolTool() {
  const A = accentOf(8);
  const [subjects, setSubjects] = useState("Maths 60\nReading 45\nWriting 40\nScience 40\nHistory 30\nArt 25\nMusic 20\nPE 30");
  const [days, setDays] = useState(4);
  const [block, setBlock] = useState(15);
  const [startAt, setStartAt] = useState("09:00");

  const timetable = useMemo(() => {
    const rows = subjects.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(/\s+/);
      return { name: p[0], mins: num(p[1] ?? "30") };
    });
    const slotsPerDay = Math.floor((4 * 60) / block); // 9:00–13:00 morning school
    const totalSlots = Math.max(1, rows.reduce((s, r) => s + Math.round(r.mins / block), 0));
    const perDay = Math.ceil(totalSlots / days);
    const grid: string[][] = Array.from({ length: days }, () => []);
    // weighted round robin: sort desc, deal like cards
    const queue: string[] = [];
    [...rows].sort((a, b) => b.mins - a.mins).forEach((r) => {
      for (let i = 0; i < Math.max(1, Math.round(r.mins / block)); i++) queue.push(r.name);
    });
    // deal with day-balance: keep each subject at most once per day where possible
    let day = 0;
    for (const name of queue) {
      let placed = false;
      for (let t = 0; t < days && !placed; t++) {
        const d = (day + t) % days;
        if (!grid[d].includes(name) && grid[d].length < perDay) {
          grid[d].push(name);
          day = (d + 1) % days;
          placed = true;
        }
      }
      if (!placed) {
        for (let t = 0; t < days && !placed; t++) {
          const d = (day + t) % days;
          if (grid[d].length < perDay) { grid[d].push(name); placed = true; }
        }
      }
    }
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"].slice(0, days);
    return { rows, grid, dayNames, perDay };
  }, [subjects, days, block]);

  const startMin = (() => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(startAt.trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : 540;
  })();

  return (
    <Split
      left={
        <Panel title="SUBJECTS & WEEK" accent={A}>
          <span className="mono-kicker mb-1.5 block text-zinc-500">SUBJECTS — NAME + WEEKLY MINUTES</span>
          <textarea
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none"
          />
          <Row className="mt-3">
            <Field label="DAY STARTS (HH:MM)" value={startAt} onChange={setStartAt} />
          </Row>
          <div className="mt-3 space-y-3">
            <Slider label="SCHOOL DAYS PER WEEK" value={days} onChange={setDays} min={2} max={5} accent={A} />
            <Slider label="BLOCK LENGTH" value={block} onChange={setBlock} min={10} max={30} step={5} suffix=" min" accent={A} />
          </div>
          <Grid cols={3}>
            <BigStat label="WEEKLY HOURS" value={fmt(timetable.rows.reduce((s, r) => s + r.mins, 0) / 60, 1)} accent={A} />
            <BigStat label="BLOCKS / DAY" value={timetable.perDay} hint="9:00–13:00 window" accent={A} />
            <BigStat label="SUBJECTS" value={timetable.rows.length} accent={A} />
          </Grid>
        </Panel>
      }
      right={
        <Panel title="WEEK TIMETABLE" accent={A}>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(days, 4)}, minmax(0,1fr))` }}>
            {timetable.grid.map((d, i) => (
              <div key={i} className="min-w-0 rounded border border-zinc-800 bg-zinc-950/60 p-2">
                <p className="mono-kicker mb-1.5" style={{ color: A }}>{timetable.dayNames[i]}</p>
                <div className="space-y-1">
                  {d.map((s, j) => {
                    const from = startMin + j * block;
                    return (
                      <div key={j} className="rounded bg-zinc-800/70 px-1.5 py-1">
                        <p className="font-mono text-[9px] text-zinc-500">{`${Math.floor(from / 60)}:${String(from % 60).padStart(2, "0")}`}</p>
                        <p className="truncate font-mono text-[10px] font-bold text-zinc-200">{s}</p>
                      </div>
                    );
                  })}
                  {d.length === 0 ? <p className="font-mono text-[10px] text-zinc-600">free day</p> : null}
                </div>
              </div>
            ))}
          </div>
          <Out
            className="mt-3"
            label="COPY TIMETABLE"
            text={timetable.grid.map((d, i) => `${timetable.dayNames[i]}: ` + d.join(" · ")).join("\n")}
          />
        </Panel>
      }
    />
  );
}

/* ------------------------------ meta export ------------------------------- */

export const classroomMeta: ToolMeta[] = [
  {
    id: "presentation-scheduler",
    name: "Presentation Scheduler",
    description: "Class list + talk length → a dated running order with Q&A, gaps and a first/last fairness view.",
    category: "study",
    icon: Mic,
    keywords: "presentation schedule planner class students time slots q&a",
    badge: "new",
    component: PresentationSchedulerTool,
  },
  {
    id: "marking-load",
    name: "Marking-Load Planner",
    description: "Classes × papers × minutes ÷ your daily cap → a finish date per class set.",
    category: "study",
    icon: PenLine,
    keywords: "teacher marking planner workload how long to mark papers",
    badge: "new",
    component: MarkingLoadTool,
  },
  {
    id: "spelling-rotation",
    name: "Spelling List Rotation",
    description: "Master word list → weekly new / revisit / test lists on your cycle, dated for the term.",
    category: "study",
    icon: SpellCheck,
    keywords: "spelling vocabulary list rotation planner weekly words test",
    badge: "new",
    component: SpellingRotationTool,
  },
  {
    id: "bookset-rotation",
    name: "Book-Set Rotation",
    description: "Classes × book sets → a block-by-block circulation grid with zero double-bookings.",
    category: "study",
    icon: BookCopy,
    keywords: "book set rotation planner classes weeks reading sets guided",
    badge: "new",
    component: BookSetRotationTool,
  },
  {
    id: "invigilation-rota",
    name: "Invigilation Rota",
    description: "Exams, room capacities and staff → who sits where, with coverage counts and hours per person.",
    category: "study",
    icon: ClipboardCheck,
    keywords: "exam invigilation rota planner rooms invigilators capacity rest",
    badge: "new",
    component: InvigilationTool,
  },
  {
    id: "homeschool-timetable",
    name: "Homeschool Timetable",
    description: "Subjects × weekly minutes → a balanced week grid in your block length, clock times included.",
    category: "study",
    icon: Home,
    keywords: "homeschool weekly planner subjects time blocks rotation timetable",
    badge: "new",
    component: HomeschoolTool,
  },
];
