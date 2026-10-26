"use client";

/* ==========================================================================
   AI-LEARNER KIT — ten tools for students walking the AI Academy roadmaps.
   Everything runs on-device: prompt scoring, deck generation, quota math,
   gap checks, quizzes and planners. One bespoke screen per tool, no clones.
   ========================================================================== */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, CalendarDays, ClipboardCheck, Coins, Compass, ExternalLink,
  Gauge, GraduationCap, Layers, LayoutTemplate, NotebookPen, RotateCcw,
  Shuffle, Target, ThumbsDown, ThumbsUp,
} from "lucide-react";
import {
  Area, BigStat, Btn, Check, Field, Grid, KV, Meter, Note, Out, Panel, Row,
  Seg, Slider, Split, Tag, accentOf, fmt,
} from "./kit";
import type { ToolMeta } from "./tool-types";
import { TRACKS } from "./ai-roadmap-data";

/* shared helpers ------------------------------------------------------------ */

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function saveLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DOT = (ok: boolean | "warn") =>
  ok === true ? "#5EE39A" : ok === "warn" ? "#FFD43B" : "#FF8A7A";

/* ========================================================================== */
/* 01 · PROMPT GRADER — paste a prompt, get a brutally honest score            */
/* ========================================================================== */

const SAMPLE_BAD = "write about photosynthesis";

function PromptGrader() {
  const [text, setText] = useState(SAMPLE_BAD);
  const accent = accentOf(0);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const checks = useMemo<{ label: string; weight: number; pass: boolean | "warn"; tip: string }[]>(() => {
    const t = text.toLowerCase();
    const has = (re: RegExp) => re.test(t);
    return [
      {
        label: "role assigned", weight: 15,
        pass: has(/\b(you are|act as|as an? [a-z]|role\s*:)\b/),
        tip: "Give the model a persona — “You are a patient biology teacher for first-year students.”",
      },
      {
        label: "clear task verb", weight: 20,
        pass: has(/\b(write|summar|explain|analyz|list|generate|creat|translat|rewrite|compare|classify|extract|draft|outline|solve|convert)\w*/),
        tip: "Start with a verb the machine can execute: explain / summarize / rewrite / list…",
      },
      {
        label: "context given", weight: 20,
        pass: words >= 45,
        tip: "Paste the actual material or facts it should work from — 45+ words of setup is a good habit.",
      },
      {
        label: "output format", weight: 15,
        pass: has(/\b(json|table|bullet|markdown|steps|format|sections|headings|csv|numbered|list)\b/),
        tip: "Say what shape you want back: “as a 5-row table”, “markdown with H2 headings”, “exactly 3 bullets”.",
      },
      {
        label: "audience / level", weight: 10,
        pass: has(/\b(audience|beginner|expert|for (a|my) |level|grade|student|reader|eli5|simple)\b/),
        tip: "Name the reader: “for a 14-year-old”, “for my professor” — vocabulary follows automatically.",
      },
      {
        label: "constraints", weight: 10,
        pass: has(/\b(don'?t|do not|avoid|must|should|at least|at most|max(imum)?|min(imum)?|no more than|only|exactly|under \d+)\b/),
        tip: "Add guardrails: length, tone, what to avoid, what to never invent.",
      },
      {
        label: "example shown", weight: 5,
        pass: has(/\b(example|e\.g\.|such as|for instance|like this:)\b/),
        tip: "One worked example steers style better than three paragraphs of description.",
      },
      {
        label: "sensible length", weight: 5,
        pass: words >= 25 && words <= 900 ? true : "warn",
        tip: "Under 25 words is usually too thin; over 900 and the task probably needs splitting.",
      },
    ];
  }, [text, words]);

  const totalW = checks.reduce((a, c) => a + c.weight, 0);
  const earned = checks.reduce((a, c) => a + (c.pass === true ? c.weight : c.pass === "warn" ? c.weight / 2 : 0), 0);
  const score = Math.round((earned / totalW) * 100);
  const grade = score >= 85 ? "A · sends itself" : score >= 70 ? "B · solid" : score >= 50 ? "C · patchy" : "D · the model is guessing";
  const failed = checks.filter((c) => c.pass !== true);

  return (
    <div className="space-y-3">
      <Split
        left={
          <Panel title="your prompt — pasted straight from your chat" accent={accent}>
            <Area value={text} onChange={setText} rows={9} placeholder="paste any prompt here — the grader reads it live…" />
            <Row className="mt-3">
              <BigStat label="words" value={words} accent={accent} />
              <BigStat label="checks failed" value={failed.length} accent={failed.length ? "#FF8A7A" : "#5EE39A"} />
              <Btn variant="ghost" accent={accent} onClick={() => setText(SAMPLE_BAD)}>
                <RotateCcw className="h-3.5 w-3.5" /> load a bad sample
              </Btn>
            </Row>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Panel title="the verdict" accent={accent}>
              <div className="flex items-end justify-between gap-3">
                <BigStat label="score" value={score} unit="/100" accent={accent} />
                <Tag accent={score >= 70 ? "#5EE39A" : score >= 50 ? "#FFD43B" : "#FF8A7A"}>{grade}</Tag>
              </div>
              <div className="mt-3"><Meter value={score} accent={accent} /></div>
            </Panel>
            <Panel title="checklist — what a good prompt carries" accent={accent}>
              <div className="space-y-1.5">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-start gap-2 border-b border-zinc-800/60 pb-1.5 last:border-0 last:pb-0">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DOT(c.pass) }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200">{c.label}</p>
                      {c.pass !== true && <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{c.tip}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        }
      />
      <Note>
        Heuristic grading, 100% on-device — same ideas the official OpenAI / Google / Anthropic prompting
        guides teach: role, task, context, format, audience, constraints, examples. Grade high, then run
        the prompt for real and iterate.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 02 · PROMPT SCAFFOLD — blueprint builder: role → task → context → format    */
/* ========================================================================== */

type ScaffoldPreset = "explain" | "notes" | "code" | "rewrite" | "brainstorm";

const SCAFFOLD_PRESETS: Record<ScaffoldPreset, { role: string; task: string; format: string; rules: string }> = {
  explain: {
    role: "a patient teacher who explains hard things with everyday analogies",
    task: "Explain the topic below to me step by step.",
    format: "Short intro, then numbered steps, then a 2-line summary. End with 3 quiz questions.",
    rules: "No jargon without defining it. Max 400 words. If unsure, say so instead of inventing.",
  },
  notes: {
    role: "a study-notes editor who turns raw material into exam-ready notes",
    task: "Turn my raw notes below into structured revision notes.",
    format: "H2 headings per topic, bullets under each, bold key terms, 5 flashcard Q&As at the end.",
    rules: "Only use facts from my notes — never add outside claims. Keep my wording where it's already clear.",
  },
  code: {
    role: "a senior developer doing a careful code review",
    task: "Review the code below and then show an improved version.",
    format: "First a numbered list of issues (severity + why), then the full corrected code in one block.",
    rules: "Don't rewrite for style alone — fix bugs, edge cases and performance. Explain each change in one line.",
  },
  rewrite: {
    role: "a sharp copy editor",
    task: "Rewrite the text below to be clearer and tighter while keeping my voice.",
    format: "Give the rewritten version first, then a bullet list of what you changed and why.",
    rules: "Keep my meaning exactly — don't add claims. Match the original length ±20%.",
  },
  brainstorm: {
    role: "a fast idea machine who trades quality for coverage first, then filters",
    task: "Generate ideas for the goal below, then rank the best three.",
    format: "20 ideas as a numbered list (one line each), then 'Top 3' with one sentence of reasoning per pick.",
    rules: "No repeats with different wording. Mix safe and weird ideas. No evaluation during the first 20.",
  },
};

function PromptScaffold() {
  const accent = accentOf(1);
  const [preset, setPreset] = useState<ScaffoldPreset>("explain");
  const [role, setRole] = useState(SCAFFOLD_PRESETS.explain.role);
  const [task, setTask] = useState(SCAFFOLD_PRESETS.explain.task);
  const [ctx, setCtx] = useState("");
  const [format, setFormat] = useState(SCAFFOLD_PRESETS.explain.format);
  const [rules, setRules] = useState(SCAFFOLD_PRESETS.explain.rules);

  const applyPreset = (p: ScaffoldPreset) => {
    setPreset(p);
    setRole(SCAFFOLD_PRESETS[p].role);
    setTask(SCAFFOLD_PRESETS[p].task);
    setFormat(SCAFFOLD_PRESETS[p].format);
    setRules(SCAFFOLD_PRESETS[p].rules);
  };

  const out = useMemo(() => {
    const parts: string[] = [];
    if (role.trim()) parts.push(`You are ${role.trim().replace(/^you are /i, "")}.`);
    if (task.trim()) parts.push(`TASK\n${task.trim()}`);
    if (ctx.trim()) parts.push(`CONTEXT — use only this:\n${ctx.trim()}`);
    if (format.trim()) parts.push(`OUTPUT FORMAT\n${format.trim()}`);
    if (rules.trim()) parts.push(`RULES\n${rules.trim()}`);
    return parts.join("\n\n");
  }, [role, task, ctx, format, rules]);

  const filled = [role, task, ctx, format, rules].filter((x) => x.trim()).length;

  return (
    <div className="space-y-3">
      <Row>
        <Seg
          value={preset}
          onChange={(v) => applyPreset(v)}
          accent={accent}
          options={[
            { v: "explain" as const, label: "explain a topic" },
            { v: "notes" as const, label: "make study notes" },
            { v: "code" as const, label: "code help" },
            { v: "rewrite" as const, label: "rewrite text" },
            { v: "brainstorm" as const, label: "brainstorm" },
          ]}
        />
      </Row>
      <Split
        left={
          <Panel title="the blueprint — fill what you need" accent={accent}>
            <div className="space-y-2.5">
              <Field label="① role — who the model becomes" value={role} onChange={setRole} />
              <Field label="② task — the one job, starting with a verb" value={task} onChange={setTask} />
              <Area label="③ context — paste the actual material (optional but powerful)" value={ctx} onChange={setCtx} rows={5} placeholder="your notes, the code, the text to work on…" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label="④ output format" value={format} onChange={setFormat} />
                <Field label="⑤ rules & guardrails" value={rules} onChange={setRules} />
              </div>
            </div>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Panel title="assembled prompt — copy into any chat" accent={accent} right={<Tag accent={accent}>{filled}/5 blocks</Tag>}>
              <Out text={out} label="ready to paste" rows={16} />
            </Panel>
            <Panel title="why blocks beat vibes" accent={accent}>
              <p className="text-[11.5px] leading-relaxed text-zinc-400">
                Every block removes one way for the model to guess wrong. The role sets vocabulary,
                the task sets direction, the context kills hallucinations, the format makes answers
                machine-consistent, and the rules put fences around creativity. Five blocks, first-try answers.
              </p>
            </Panel>
          </div>
        }
      />
    </div>
  );
}

/* ========================================================================== */
/* 03 · TOKEN ESTIMATOR — will your prompt fit the free tiers?                 */
/* ========================================================================== */

type TierId = "gemini" | "groq" | "chatgpt" | "claude";

const TIERS: { id: TierId; name: string; limit: string; reqCap: number; note: string; link: string }[] = [
  { id: "gemini", name: "Gemini API · free tier", limit: "≈1,500 requests/day", reqCap: 1500, note: "biggest free allowance for API building — per-minute token caps also apply", link: "https://ai.google.dev/pricing" },
  { id: "groq", name: "Groq · free tier", limit: "varies by model · often ~1k–14k req/day", reqCap: 1000, note: "absurdly fast tokens; conservative daily cap assumed here", link: "https://console.groq.com/docs/rate-limits" },
  { id: "chatgpt", name: "ChatGPT · free plan", limit: "limited messages per few hours", reqCap: 80, note: "fine for chat study, too tight for app building", link: "https://chatgpt.com/pricing" },
  { id: "claude", name: "Claude · free plan", limit: "message caps vary with load", reqCap: 40, note: "great quality free chats; capacity-based caps", link: "https://claude.ai/pricing" },
];

function TokenEstimator() {
  const accent = accentOf(2);
  const [text, setText] = useState("Paste the text of one prompt here — the estimator works out how many tokens it burns and whether your daily habit fits the free tiers.");
  const [perDay, setPerDay] = useState(30);
  const [systemMult, setSystemMult] = useState(3);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const estLow = Math.max(1, Math.round(words * 1.15));
  const estHigh = Math.max(estLow, Math.ceil(chars / 3.2));
  const estMid = Math.round((estLow + estHigh) / 2);
  const perRequest = estMid * systemMult; // prompt + history/system overhead factor
  const monthly = perRequest * perDay * 30;

  return (
    <div className="space-y-3">
      <Split
        left={
          <Panel title="one prompt — the text you'd send" accent={accent}>
            <Area value={text} onChange={setText} rows={8} />
            <Row className="mt-3">
              <BigStat label="chars" value={fmt(chars, 0)} accent={accent} />
              <BigStat label="words" value={fmt(words, 0)} accent={accent} />
              <BigStat label="est. tokens" value={`${estLow}–${estHigh}`} accent={accent} hint="mid estimate on the right" />
            </Row>
            <div className="mt-3 space-y-3">
              <Slider label="requests you make per day" value={perDay} onChange={setPerDay} min={1} max={1500} accent={accent} />
              <Slider
                label="× overhead for system prompt + chat history"
                value={systemMult} onChange={setSystemMult} min={1} max={10}
                accent={accent}
                hint="chats aren't one-shot: history rides along with every message"
              />
            </div>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Grid cols={3}>
              <BigStat label="tokens / request" value={fmt(perRequest, 0)} accent={accent} />
              <BigStat label="tokens / month" value={monthly > 1e6 ? `${(monthly / 1e6).toFixed(1)}M` : fmt(monthly, 0)} accent={accent} />
              <BigStat label="burn rate" value={fmt((perRequest * perDay) / 1000, 1)} unit="k tok/day" accent={accent} />
            </Grid>
            <Panel title="does your habit fit the free tiers?" accent={accent}>
              <div className="space-y-1">
                {TIERS.map((t) => {
                  const fits = perDay <= t.reqCap;
                  const tight = !fits && perDay <= t.reqCap * 2;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2 border-b border-zinc-800/60 py-1.5 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-200">{t.name}</p>
                        <p className="text-[10px] text-zinc-500">{t.limit} · {t.note}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Tag accent={fits ? "#5EE39A" : tight ? "#FFD43B" : "#FF8A7A"}>
                          {fits ? "fits" : tight ? "tight" : "no"}
                        </Tag>
                        <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Note>
              Token counts are heuristics (words × 1.15 low, chars ÷ 3.2 high) — real tokenizers vary by
              model. Free-tier limits are typical published values and change often; the link on each row
              goes to the official pricing/limits page. Check before you build.
            </Note>
          </div>
        }
      />
    </div>
  );
}

/* ========================================================================== */
/* 04 · FREE MODEL PICKER — three questions, one verdict, zero invoices        */
/* ========================================================================== */

type PickPurpose = "study" | "writing" | "code" | "research" | "images";
type PickPrivacy = "any" | "local";

interface PickModel {
  name: string; link: string; purposes: PickPurpose[];
  localCapable?: boolean; generous: boolean; why: string;
}

const PICK_MODELS: PickModel[] = [
  { name: "Google Gemini (free)", link: "https://gemini.google.com", purposes: ["study", "writing", "code", "research", "images"], generous: true, why: "the widest free toolbelt: chat, image understanding, image generation and a huge research context" },
  { name: "ChatGPT (free)", link: "https://chatgpt.com", purposes: ["study", "writing", "code", "research"], generous: true, why: "the all-rounder with voice mode and file uploads on the free plan" },
  { name: "Claude (free)", link: "https://claude.ai", purposes: ["writing", "code", "study"], generous: false, why: "arguably the best free writing partner — careful, structured prose" },
  { name: "GitHub Copilot (free tier)", link: "https://github.com/features/copilot", purposes: ["code"], generous: true, why: "completions + chat inside VS Code without paying, once you have a GitHub account" },
  { name: "NotebookLM (free)", link: "https://notebooklm.google.com", purposes: ["study", "research"], generous: true, why: "grounded in YOUR sources — study guides and audio overviews with fewer hallucinations" },
  { name: "Perplexity (free)", link: "https://www.perplexity.ai", purposes: ["research"], generous: true, why: "answers with cited web sources, so you can verify every claim" },
  { name: "Bing Image Creator (free)", link: "https://www.bing.com/create", purposes: ["images"], generous: true, why: "free DALL·E-powered image generation with a Microsoft account" },
  { name: "Groq playground (free)", link: "https://console.groq.com", purposes: ["code", "study"], generous: false, why: "open models at silly speeds — great for building, not just chatting" },
  { name: "Ollama (local, free)", link: "https://ollama.com", purposes: ["study", "writing", "code", "research", "images"], localCapable: true, generous: true, why: "runs models on your own machine — nothing leaves your laptop, no caps at all" },
];

function FreeModelPicker() {
  const accent = accentOf(3);
  const [purpose, setPurpose] = useState<PickPurpose>("study");
  const [privacy, setPrivacy] = useState<PickPrivacy>("any");
  const [usage, setUsage] = useState(2);

  const ranked = useMemo(() => {
    const scored = PICK_MODELS.map((m) => {
      let s = 0;
      if (m.purposes.includes(purpose)) s += 3;
      if (privacy === "local") s += m.localCapable ? 5 : -4;
      if (usage >= 4 && m.generous) s += 2;
      if (usage <= 2 && m.purposes.length >= 4) s += 1;
      return { m, s };
    });
    return scored.sort((a, b) => b.s - a.s).slice(0, 3);
  }, [purpose, privacy, usage]);

  const win = ranked[0];

  return (
    <div className="space-y-3">
      <Grid cols={3}>
        <Panel title="what's it for?" accent={accent}>
          <Seg
            value={purpose} onChange={setPurpose} accent={accent}
            options={[
              { v: "study" as const, label: "study" }, { v: "writing" as const, label: "writing" },
              { v: "code" as const, label: "code" }, { v: "research" as const, label: "research" },
              { v: "images" as const, label: "images" },
            ]}
          />
        </Panel>
        <Panel title="where can your data go?" accent={accent}>
          <Seg
            value={privacy} onChange={setPrivacy} accent={accent}
            options={[
              { v: "any" as const, label: "cloud is fine" },
              { v: "local" as const, label: "keep it on-device" },
            ]}
          />
          {privacy === "local" && <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">Local means installing Ollama — needs ~8GB+ RAM, works offline, zero caps.</p>}
        </Panel>
        <Panel title="how heavy is your usage?" accent={accent}>
          <Slider label="daily intensity" value={usage} onChange={setUsage} min={1} max={5} accent={accent} hint={usage <= 2 ? "light — caps won't bother you" : usage === 3 ? "medium — watch the caps" : "heavy — pick generous caps"} />
        </Panel>
      </Grid>

      <Panel title="the verdict" accent={accent}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="mono-kicker text-zinc-500">run, don't walk, to</p>
            <p className="mt-1 font-brut text-2xl uppercase tracking-tight" style={{ color: accent }}>{win.m.name}</p>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-zinc-400">{win.m.why}</p>
            <a href={win.m.link} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] hover:underline" style={{ color: accent }}>
              open official page <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="shrink-0 space-y-1.5 sm:w-64">
            {ranked.slice(1).map((r, i) => (
              <div key={r.m.name} className="flex items-center gap-2 border border-zinc-800 bg-zinc-950/60 px-2.5 py-2">
                <span className="font-mono text-[10px] font-bold text-zinc-600">#{i + 2}</span>
                <a href={r.m.link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-300 hover:text-zinc-100">
                  {r.m.name}
                </a>
                <ExternalLink className="h-3 w-3 shrink-0 text-zinc-600" />
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <Note>
        Static matching over real free offerings — no sign-ups, no tracking, and the machine has no
        sponsors. Every link is the official page. Free plans change their caps often; the picker tells
        you who to check, not who to trust blindly.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 05 · FLASHCARD MAKER — paste notes, walk out with a quizable deck           */
/* ========================================================================== */

interface Card { q: string; a: string }

function parseCards(raw: string): Card[] {
  const out: Card[] = [];
  for (const line of raw.split("\n")) {
    const s = line.trim().replace(/^[-•*]\s*/, "");
    if (s.length < 3) continue;
    const m = s.match(/^(.{1,120}?)\s*(?:\s[-–—]|\s*:|\t)\s*(.+)$/);
    if (m) {
      out.push({ q: m[1].trim(), a: m[2].trim() });
    } else {
      // no separator → cloze the most "term-like" word
      const ws = s.split(/\s+/).filter((w) => /^[A-Za-z][A-Za-z-]{3,}$/.test(w));
      const pick = ws.sort((a, b) => b.length - a.length)[0];
      if (pick) out.push({ q: s.replace(pick, "_____"), a: pick });
    }
    if (out.length >= 60) break;
  }
  return out;
}

function csvEscape(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

function FlashcardMaker() {
  const accent = accentOf(4);
  const [raw, setRaw] = useState(
    "Mitochondria - the organelle that produces ATP, the cell's energy currency\nOsmosis: movement of water across a semipermeable membrane from low to high solute concentration\nEnzymes are biological catalysts that speed up reactions without being consumed",
  );
  const [deck, setDeck] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState(0);

  const preview = useMemo(() => parseCards(raw), [raw]);
  const done = idx >= deck.length;
  const card = !done ? deck[idx] : null;

  const generate = () => {
    setDeck(preview);
    setIdx(0); setFlipped(false); setKnown(0); setAgain(0);
  };

  const answer = (ok: boolean) => {
    if (ok) setKnown((k) => k + 1); else setAgain((a) => a + 1);
    setFlipped(false);
    setIdx((i) => i + 1);
  };

  const csv = deck.map((c) => `${csvEscape(c.q)},${csvEscape(c.a)}`).join("\n");

  return (
    <div className="space-y-3">
      {deck.length === 0 ? (
        <Split
          left={
            <Panel title="your notes — one card per line" accent={accent}>
              <Area value={raw} onChange={setRaw} rows={10} placeholder={"term - definition\nterm: definition\nor any sentence (a keyword gets cloze'd out)"} />
              <Row className="mt-3">
                <Btn accent={accent} onClick={generate} disabled={preview.length === 0}>
                  <Layers className="h-3.5 w-3.5" /> build {preview.length} cards
                </Btn>
                <Tag accent={accent}>{preview.length} cards detected</Tag>
              </Row>
              <Note>
                Lines with “-”, “:” or a tab become Q/A pairs. Plain sentences become cloze deletions —
                the longest term gets blanked out. Max 60 cards per deck, all parsed on your device.
              </Note>
            </Panel>
          }
          right={
            <Panel title="deck preview" accent={accent}>
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {preview.map((c, i) => (
                  <div key={i} className="border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5">
                    <p className="text-xs font-semibold text-zinc-200">{c.q}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{c.a}</p>
                  </div>
                ))}
                {preview.length === 0 && <p className="text-xs text-zinc-600">type some notes to see cards here…</p>}
              </div>
            </Panel>
          }
        />
      ) : (
        <Split
          left={
            <Panel title={done ? "deck finished" : `card ${idx + 1} of ${deck.length}`} accent={accent}>
              {!done && card ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="flex min-h-36 w-full flex-col items-center justify-center gap-2 border border-zinc-700 bg-zinc-950/80 px-4 py-6 text-center transition-colors hover:border-zinc-500"
                  >
                    <span className="mono-kicker text-zinc-600">{flipped ? "answer" : "question — tap to flip"}</span>
                    <span className={`text-base leading-relaxed ${flipped ? "text-zinc-300" : "font-bold text-zinc-100"}`}>
                      {flipped ? card.a : card.q}
                    </span>
                  </button>
                  <Row className="mt-3">
                    <Btn accent="#FF8A7A" onClick={() => answer(false)}><ThumbsDown className="h-3.5 w-3.5" /> again</Btn>
                    <Btn accent="#5EE39A" onClick={() => answer(true)}><ThumbsUp className="h-3.5 w-3.5" /> known</Btn>
                    <span className="ml-auto self-center font-mono text-[10px] text-zinc-600">known {known} · again {again}</span>
                  </Row>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="font-brut text-3xl" style={{ color: accent }}>{Math.round((known / deck.length) * 100)}%</p>
                  <p className="mt-1 text-xs text-zinc-500">known first try — {known}/{deck.length} ({again} needed a repeat)</p>
                  <Row className="mt-3 justify-center">
                    <Btn variant="ghost" accent={accent} onClick={() => { setDeck(shuffle(deck)); setIdx(0); setFlipped(false); setKnown(0); setAgain(0); }}>
                      <Shuffle className="h-3.5 w-3.5" /> shuffle & retry
                    </Btn>
                    <Btn variant="ghost" accent={accent} onClick={() => setDeck([])}>new deck</Btn>
                  </Row>
                </div>
              )}
              <div className="mt-3"><Meter value={Math.min(idx, deck.length)} max={deck.length} accent={accent} /></div>
            </Panel>
          }
          right={
            <Panel title="export — Anki import ready" accent={accent}>
              <Out text={csv} label="deck.csv (front,back)" rows={14} />
              <Note>
                Anki: File → Import → paste this CSV. Front=question, Back=answer. Or keep using the
                flip mode here — your notes never leave the browser.
              </Note>
            </Panel>
          }
        />
      )}
    </div>
  );
}

/* ========================================================================== */
/* 06 · SKILL GAP CHECK — four axes, one prescription: your next roadmap       */
/* ========================================================================== */

const GAP_AXES: { id: string; label: string; items: string[] }[] = [
  { id: "use", label: "using AI daily", items: [
    "I have a free AI assistant I use most days",
    "I've used AI to summarize or explain something for a real course",
    "I can tell when an answer is probably wrong (hallucination radar)",
    "I use at least one specialty tool (NotebookLM, Perplexity, image gen)",
  ]},
  { id: "prompt", label: "prompting", items: [
    "I structure prompts: role, task, context, format",
    "I've used few-shot examples on purpose",
    "I keep a personal library of prompts that work",
    "I iterate: test, tweak, re-test — instead of accepting the first draft",
  ]},
  { id: "code", label: "coding", items: [
    "I can write a working Python or JavaScript function",
    "I've used a notebook (Colab / Jupyter) with real data",
    "I know what pandas or arrays do without googling basic syntax",
    "I've finished at least one small coding project",
  ]},
  { id: "data", label: "math & data", items: [
    "I'm comfortable with mean, median, spread",
    "I can read a basic plot or chart and say what's wrong with it",
    "Vectors and matrices don't scare me",
    "I understand what overfitting means well enough to explain it",
  ]},
];

const GAP_KEY = "zyric-skill-gap-v1";

function SkillGapCheck() {
  const accent = accentOf(5);
  const [marks, setMarks] = useState<Record<string, boolean>>(() => loadLS(GAP_KEY, {}));
  useEffect(() => { saveLS(GAP_KEY, marks); }, [marks]);

  const axisScore = (id: string) => {
    const ax = GAP_AXES.find((a) => a.id === id)!;
    return ax.items.filter((_, i) => marks[`${id}:${i}`]).length / ax.items.length;
  };

  const totalItems = GAP_AXES.reduce((a, x) => a + x.items.length, 0);
  const totalDone = Object.values(marks).filter(Boolean).length;

  const verdict = useMemo(() => {
    const s = Object.fromEntries(GAP_AXES.map((a) => [a.id, axisScore(a.id)]));
    let pick: string;
    if (s.use < 0.5) pick = "zero-ai";
    else if (s.prompt < 0.5) pick = "prompt-craft";
    else if (s.code < 0.5) pick = "ml-foundations";
    else if (s.data < 0.5) pick = "ml-foundations";
    else pick = "ai-builder";
    return TRACKS.find((t) => t.id === pick)!;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks]);

  return (
    <div className="space-y-3">
      <Grid cols={2}>
        {GAP_AXES.map((ax) => {
          const sc = Math.round(axisScore(ax.id) * 100);
          return (
            <Panel key={ax.id} title={ax.label} accent={accent} right={<Tag accent={sc >= 75 ? "#5EE39A" : sc >= 50 ? "#FFD43B" : "#FF8A7A"}>{sc}%</Tag>}>
              <div className="space-y-2">
                {ax.items.map((it, i) => (
                  <Check
                    key={i}
                    label={it}
                    checked={!!marks[`${ax.id}:${i}`]}
                    onChange={(v) => setMarks((m) => ({ ...m, [`${ax.id}:${i}`]: v }))}
                  />
                ))}
              </div>
              <div className="mt-2.5"><Meter value={sc} accent={accent} /></div>
            </Panel>
          );
        })}
      </Grid>

      <Panel title="your prescription" accent={accent} right={<Tag accent={accent}>{totalDone}/{totalItems} honest checks</Tag>}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className="shrink-0 border-2 border-zinc-700 px-3 py-2"
            style={{ background: `${verdict.color}14` }}
          >
            <p className="mono-kicker text-zinc-500">start here →</p>
            <p className="mt-0.5 font-brut text-lg uppercase leading-tight" style={{ color: verdict.color }}>{verdict.title}</p>
            <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-zinc-500">{verdict.tagline}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mono-kicker mb-1.5 text-zinc-500">your first three moves on that roadmap</p>
            <ol className="space-y-1">
              {verdict.stages[0].steps.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-zinc-700 font-mono text-[9px] text-zinc-500">{i + 1}</span>
                  {s.label}
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-zinc-700" />
                  <span className="text-zinc-600">{s.mins}m</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
              Open the AI Academy wing from the top nav to tick these off with saved progress.
            </p>
          </div>
          <Btn variant="ghost" accent={accent} onClick={() => setMarks({})} className="shrink-0">
            <RotateCcw className="h-3.5 w-3.5" /> reset
          </Btn>
        </div>
      </Panel>
    </div>
  );
}

/* ========================================================================== */
/* 07 · AI GLOSSARY QUIZ — ten questions, one streak, terms that stick         */
/* ========================================================================== */

const GLOSSARY: [string, string][] = [
  ["LLM", "A language model trained on huge text corpora to predict the next token — the engine behind chatbots."],
  ["Token", "The chunk of text (often ~4 characters) a model actually reads and writes. You pay or queue in tokens."],
  ["Prompt", "The full input you hand a model — instructions, context, examples and format all included."],
  ["Hallucination", "When a model states something false with total confidence — plausible text, invented facts."],
  ["Context window", "How much text (prompt + history + documents) a model can consider at once, measured in tokens."],
  ["Fine-tuning", "Continuing training on your own examples so a model adapts its style or skill to your task."],
  ["Embedding", "A list of numbers that represents meaning — similar texts end up close together in vector space."],
  ["RAG", "Retrieval-Augmented Generation: fetch relevant documents first, then let the model answer using them."],
  ["Few-shot", "Including a handful of worked input→output examples in the prompt to steer the model's behavior."],
  ["System prompt", "Standing instructions that set behavior for the whole conversation, before the user's turn."],
  ["Temperature", "A knob for randomness: low = focused and repeatable, high = varied and creative."],
  ["Overfitting", "When a model memorizes the training data — great on it, useless on anything new."],
  ["Supervised learning", "Training from labeled examples: show inputs with correct answers, let it learn the mapping."],
  ["Neural network", "Layers of simple units whose weighted connections are learned from data — the T in GPT."],
  ["Gradient descent", "Nudging model weights downhill along the error slope until predictions stop improving."],
  ["GPU", "The chip that made modern AI feasible — thousands of cores doing matrix math in parallel."],
  ["Open weights", "Model parameters published for anyone to download and run — not always open-source licenses."],
  ["Multimodal", "A model that handles more than text: images, audio or video alongside words."],
  ["Chain-of-thought", "Asking the model to reason step by step before answering — usually lifts accuracy on hard tasks."],
  ["Inference", "Running a trained model to get outputs — as opposed to training it."],
  ["Benchmark", "A standard test set for comparing model ability — saturates, leaks, and still everywhere."],
  ["Vector database", "A store that finds nearest embeddings fast — the 'memory' inside most RAG systems."],
  ["Agent", "A model wired into tools and loops so it can act (search, run code, call APIs), not just reply."],
  ["Dataset", "The curated examples a model learns from — its diet decides its strengths and biases."],
];

const QUIZ_LEN = 10;

function GlossaryQuiz() {
  const accent = accentOf(6);
  const [seed, setSeed] = useState(0);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const quiz = useMemo(() => {
    const defs = shuffle(GLOSSARY).slice(0, QUIZ_LEN);
    return defs.map(([term, def]) => {
      const wrong = shuffle(GLOSSARY.filter(([t]) => t !== term)).slice(0, 3).map(([t]) => t);
      const options = shuffle([term, ...wrong]);
      return { term, def, options, correct: options.indexOf(term) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const q = quiz[qi];
  const finished = qi >= quiz.length;

  const pick = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.correct) {
      setScore((s) => s + 1);
      setStreak((s) => { const n = s + 1; setBest((b) => Math.max(b, n)); return n; });
    } else {
      setStreak(0);
    }
  };

  const next = () => { setChosen(null); setQi((i) => i + 1); };
  const restart = () => { setSeed((s) => s + 1); setQi(0); setChosen(null); setScore(0); setStreak(0); setBest(0); };

  return (
    <div className="space-y-3">
      <Panel
        title={finished ? "round over" : `question ${qi + 1} of ${quiz.length}`}
        accent={accent}
        right={
          <div className="flex gap-1.5">
            <Tag accent="#FFD43B">score {score}</Tag>
            <Tag accent={streak >= 3 ? "#5EE39A" : "#7a7a7a"}>streak {streak}</Tag>
          </div>
        }
      >
        {finished ? (
          <div className="py-6 text-center">
            <p className="font-brut text-4xl" style={{ color: accent }}>{score}/{quiz.length}</p>
            <p className="mt-1.5 text-xs text-zinc-500">
              {score === quiz.length ? "flawless — you've been doing the readings" : score >= 7 ? "sharp — the terms are sticking" : "re-run it — repetition is the whole trick"} · best streak {best}
            </p>
            <Btn accent={accent} onClick={restart} className="mt-3"><RotateCcw className="h-3.5 w-3.5" /> new round</Btn>
          </div>
        ) : (
          <div>
            <p className="mono-kicker text-zinc-500">which term is this?</p>
            <p className="mt-1.5 min-h-16 border border-zinc-800 bg-zinc-950/70 px-3 py-3 text-sm leading-relaxed text-zinc-200">
              {q.def}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correct;
                const chosenThis = chosen === i;
                const reveal = chosen !== null;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={reveal}
                    className="border px-3 py-2.5 text-left text-xs font-bold transition-all disabled:cursor-default"
                    style={{
                      borderColor: reveal && isCorrect ? "#5EE39A" : chosenThis ? "#FF8A7A" : "#3f3f46",
                      background: reveal && isCorrect ? "rgba(94,227,154,0.12)" : chosenThis ? "rgba(255,138,122,0.10)" : "rgba(9,9,11,0.6)",
                      color: reveal && isCorrect ? "#5EE39A" : chosenThis ? "#FF8A7A" : "#e4e4e7",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {chosen !== null && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] text-zinc-500">
                  {chosen === q.correct ? "correct — log it and move on" : `it was “${q.term}” — you'll see it again`}
                </p>
                <Btn accent={accent} onClick={next}>{qi + 1 === quiz.length ? "see result" : "next"} <ArrowRight className="h-3.5 w-3.5" /></Btn>
              </div>
            )}
            <div className="mt-3"><Meter value={qi + (chosen !== null ? 1 : 0)} max={quiz.length} accent={accent} /></div>
          </div>
        )}
      </Panel>
      <Note>
        24 terms from the roadmaps, definition → term, fresh shuffle every round. If a definition feels
        fuzzy, that's your cue to revisit the matching Academy stage.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 08 · FREE TIER TRACKER — mission control for the zero-budget AI stack       */
/* ========================================================================== */

const FREE_TIERS: { name: string; what: string; cap: number; unit: string; link: string }[] = [
  { name: "Gemini API (free tier)", what: "chat + building apps on Google's models", cap: 1500, unit: "req/day", link: "https://ai.google.dev/pricing" },
  { name: "Groq (free tier)", what: "ludicrous-speed open models (Llama, Mixtral…)", cap: 1000, unit: "req/day (conservative)", link: "https://console.groq.com/docs/rate-limits" },
  { name: "GitHub Models", what: "try frontier models free with your GitHub account", cap: 60, unit: "req/min, varies", link: "https://github.com/marketplace/models" },
  { name: "Colab (free)", what: "free GPU notebooks for training & embeddings", cap: 8, unit: "GPU hrs/day (varies)", link: "https://colab.research.google.com" },
  { name: "Kaggle Notebooks", what: "free GPU/TPU weekly quota, real datasets", cap: 30, unit: "GPU hrs/week", link: "https://www.kaggle.com/code" },
  { name: "Hugging Face Spaces", what: "free CPU app hosting for demos", cap: 1, unit: "free CPU Space", link: "https://huggingface.co/spaces" },
  { name: "Vercel Hobby", what: "host your AI web apps (non-commercial)", cap: 100, unit: "GB bandwidth/day", link: "https://vercel.com/pricing" },
  { name: "Netlify Free", what: "static + serverless hosting tier", cap: 100, unit: "GB bandwidth/mo", link: "https://www.netlify.com/pricing/" },
];

function FreeTierTracker() {
  const accent = accentOf(7);
  const [prompts, setPrompts] = useState(40);
  const [gpu, setGpu] = useState(4);
  const [apps, setApps] = useState(2);

  const verdictFor = (t: (typeof FREE_TIERS)[number]) => {
    if (t.unit.startsWith("req")) {
      const r = prompts / t.cap;
      return r <= 1 ? { label: "fits", c: "#5EE39A" } : r <= 2 ? { label: "tight", c: "#FFD43B" } : { label: "over", c: "#FF8A7A" };
    }
    if (t.unit.startsWith("GPU hrs/day")) {
      const r = gpu / t.cap;
      return r <= 1 ? { label: "fits", c: "#5EE39A" } : r <= 1.5 ? { label: "tight", c: "#FFD43B" } : { label: "over", c: "#FF8A7A" };
    }
    if (t.unit.startsWith("GPU hrs/week")) {
      const r = (gpu * 7) / t.cap;
      return r <= 1 ? { label: "fits", c: "#5EE39A" } : r <= 1.5 ? { label: "tight", c: "#FFD43B" } : { label: "over", c: "#FF8A7A" };
    }
    if (t.unit.startsWith("free CPU")) {
      return apps >= 1 ? { label: "fits ×1", c: "#5EE39A" } : { label: "spare", c: "#7a7a7a" };
    }
    // bandwidth-ish hosting rows: assume tiny demo apps
    return apps <= 3 ? { label: "fits", c: "#5EE39A" } : { label: "tight", c: "#FFD43B" };
  };

  const overCount = FREE_TIERS.filter((t) => verdictFor(t).label === "over").length;

  return (
    <div className="space-y-3">
      <Panel title="your planned week — drag the dials" accent={accent}>
        <Grid cols={3}>
          <Slider label="API prompts / day" value={prompts} onChange={setPrompts} min={5} max={2000} step={5} accent={accent} />
          <Slider label="GPU hours / day" value={gpu} onChange={setGpu} min={0} max={12} step={1} accent={accent} hint="training, embeddings, notebooks" />
          <Slider label="demo apps to host" value={apps} onChange={setApps} min={0} max={6} accent={accent} />
        </Grid>
      </Panel>

      <Grid cols={2}>
        {FREE_TIERS.map((t) => {
          const v = verdictFor(t);
          return (
            <div key={t.name} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-zinc-100">{t.name}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{t.what}</p>
                  <p className="mt-1 font-mono text-[10px] text-zinc-600">cap ≈ {fmt(t.cap, 0)} {t.unit}</p>
                </div>
                <Tag accent={v.c}>{v.label}</Tag>
              </div>
              <a href={t.link} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-300">
                official limits <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          );
        })}
      </Grid>

      <Note>
        {overCount === 0
          ? "Your plan fits inside the free stack — every row green or yellow means ship without a card."
          : `${overCount} row${overCount > 1 ? "s" : ""} marked “over” — trim the plan, pick a different provider for that job, or accept slower queues.`}
        Caps are typical published values at the time of writing and move often — the link on every card
        goes to the official page. No card required anywhere on this board.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* 09 · LEARNING JOURNAL — one line a day keeps the forgetting away            */
/* ========================================================================== */

interface Entry { date: string; mins: number; tags: string[]; text: string }

const JOURNAL_KEY = "zyric-ai-journal-v1";
const JOURNAL_TAGS = ["course", "read", "watch", "practice", "build", "prove"] as const;

function LearningJournal() {
  const accent = accentOf(8);
  const [entries, setEntries] = useState<Entry[]>(() => loadLS(JOURNAL_KEY, []));
  const [mins, setMins] = useState(30);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [goal, setGoal] = useState(() => loadLS(`${JOURNAL_KEY}-goal`, 300));

  useEffect(() => { saveLS(JOURNAL_KEY, entries); }, [entries]);
  useEffect(() => { saveLS(`${JOURNAL_KEY}-goal`, goal); }, [goal]);

  const add = () => {
    if (!text.trim() && mins === 0) return;
    setEntries((e) => [{ date: todayISO(), mins, tags: [...tags], text: text.trim() }, ...e]);
    setText(""); setTags([]); setMins(30);
  };

  const remove = (i: number) => setEntries((e) => e.filter((_, j) => j !== i));

  const streak = useMemo(() => {
    const days = new Set(entries.map((e) => e.date));
    let n = 0;
    const d = new Date();
    if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1); // yesterday counts
    while (days.has(d.toISOString().slice(0, 10))) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [entries]);

  const weekMins = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return entries.filter((e) => new Date(`${e.date}T00:00:00`) >= cutoff).reduce((a, e) => a + e.mins, 0);
  }, [entries]);

  const totalHours = Math.round(entries.reduce((a, e) => a + e.mins, 0) / 60);

  const markdown = useMemo(() => [
    "# My AI Learning Journal",
    "",
    ...entries.map((e) => `- **${e.date}** (${e.mins}m${e.tags.length ? ` · ${e.tags.join(", ")}` : ""}) — ${e.text || "—"}`),
  ].join("\n"), [entries]);

  return (
    <div className="space-y-3">
      <Grid cols={3}>
        <BigStat label="day streak" value={streak} unit={streak === 1 ? "day" : "days"} accent={streak >= 3 ? "#FF7A3D" : accent} hint={streak === 0 ? "log today to light it" : "don't break the chain"} />
        <BigStat label="this week" value={weekMins} unit="/ goal" accent={accent} hint={`weekly goal ${goal}m`} />
        <BigStat label="all-time" value={totalHours} unit="hrs" accent={accent} hint={`${entries.length} entries`} />
      </Grid>

      <Panel title="log today — what did you actually do?" accent={accent}>
        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <Slider label="minutes today" value={mins} onChange={setMins} min={5} max={240} step={5} accent={accent} />
            <div>
              <span className="mono-kicker mb-1.5 block text-zinc-500">kind of work</span>
              <div className="flex flex-wrap gap-1.5">
                {JOURNAL_TAGS.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTags((ts) => (on ? ts.filter((x) => x !== t) : [...ts, t]))}
                      className="border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors"
                      style={{
                        borderColor: on ? accent : "#3f3f46",
                        background: on ? `${accent}22` : "transparent",
                        color: on ? accent : "#a1a1aa",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <Slider label="weekly goal (minutes)" value={goal} onChange={setGoal} min={60} max={1200} step={30} accent={accent} />
          </div>
          <div>
            <Area value={text} onChange={setText} rows={4} placeholder="what did you learn? what broke? what's next tomorrow? (one honest line beats a page of nothing)" />
            <Row className="mt-2">
              <Btn accent={accent} onClick={add}>add entry</Btn>
              <Meter value={weekMins} max={goal} accent={accent} label="week goal" right={`${Math.round((weekMins / goal) * 100)}%`} />
            </Row>
          </div>
        </div>
      </Panel>

      <Split
        left={
          <Panel title="the ledger" accent={accent}>
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {entries.length === 0 && <p className="text-xs text-zinc-600">empty — first entry is the hardest, it's downhill after that.</p>}
              {entries.map((e, i) => (
                <div key={i} className="group flex items-start gap-2 border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5">
                  <span className="shrink-0 font-mono text-[10px] text-zinc-600">{e.date}</span>
                  <span className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-zinc-300">
                    {e.text || <span className="italic text-zinc-600">—</span>}
                    {e.tags.length > 0 && <span className="ml-1.5 font-mono text-[9px] uppercase text-zinc-600">{e.tags.join(" · ")}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[10px]" style={{ color: accent }}>{e.mins}m</span>
                  <button type="button" onClick={() => remove(i)} aria-label="delete entry" className="shrink-0 text-zinc-700 opacity-0 transition-opacity hover:text-[#FF8A7A] group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
          </Panel>
        }
        right={
          <Panel title="export — markdown for your notes app" accent={accent}>
            <Out text={markdown} label="journal.md" rows={14} />
          </Panel>
        }
      />
    </div>
  );
}

/* ========================================================================== */
/* 10 · SYLLABUS SPLITTER — exam date in, spaced day-by-day plan out           */
/* ========================================================================== */

function SyllabusSplitter() {
  const accent = accentOf(9);
  const [topics, setTopics] = useState("Photosynthesis light reactions\nCalvin cycle\nCell respiration glycolysis\nKrebs cycle\nElectron transport chain\nMendelian genetics\nDNA replication\nTranscription & translation\nMutations\nEvolution mechanisms");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [hoursDay, setHoursDay] = useState(2);
  const [reviewWindow, setReviewWindow] = useState(5);

  const plan = useMemo(() => {
    const items = topics.split("\n").map((t) => t.trim().replace(/^[-•*]\s*/, "")).filter((t) => t.length > 1);
    const days = Math.ceil((new Date(`${examDate}T00:00:00`).getTime() - new Date(todayISO() + "T00:00:00").getTime()) / 86400000);
    if (items.length === 0 || days < 2) return { items, days, lines: [] as string[], warn: "pick an exam date at least 2 days out and list some topics" };

    const learnDays = Math.max(1, days - reviewWindow);
    const minsPerTopic = 45;
    const loadMins = items.length * minsPerTopic;
    const capacity = learnDays * hoursDay * 60;
    const perDayTopics = Math.max(1, Math.ceil(items.length / learnDays));

    const lines: string[] = [];
    let ti = 0;
    const learned: string[][] = []; // topics per learn day
    for (let d = 1; d <= learnDays && ti < items.length; d++) {
      const dayTopics: string[] = [];
      for (let k = 0; k < perDayTopics && ti < items.length; k++, ti++) dayTopics.push(items[ti]);
      learned.push(dayTopics);
      const date = new Date(); date.setDate(date.getDate() + d - 1);
      lines.push(`Day ${d} · ${date.toISOString().slice(0, 10)} — LEARN: ${dayTopics.join(" · ")}`);
      // same-day review line
      if (learned.length >= 3) {
        const r = learned[learned.length - 3];
        lines.push(`          ↳ quick review (3-day): ${r.join(", ")}`);
      }
    }
    for (let d = learnDays + 1; d <= days; d++) {
      const back = days - d; // days before exam
      const focus = items.filter((_, idx) => (idx + back) % 3 === 0).slice(0, 4);
      const date = new Date(); date.setDate(date.getDate() + d - 1);
      lines.push(`Day ${d} · ${date.toISOString().slice(0, 10)} — REVIEW${focus.length ? `: ${focus.join(" · ")}` : " (skim everything weak)"}`);
    }
    const warn = capacity < loadMins
      ? `tight: ${items.length} topics ≈ ${Math.round(loadMins / 60)}h but you've allotted ${Math.round(capacity / 60)}h before review week — raise daily hours or start earlier`
      : "";
    return { items, days, lines, warn };
  }, [topics, examDate, hoursDay, reviewWindow]);

  const outText = plan.lines.length
    ? [`Exam: ${examDate} · ${plan.days} days · ${plan.items.length} topics · ${hoursDay}h/day`, "", ...plan.lines].join("\n")
    : "";

  return (
    <div className="space-y-3">
      <Split
        left={
          <Panel title="the syllabus — one topic per line, in course order" accent={accent}>
            <Area value={topics} onChange={setTopics} rows={10} />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="exam date" type="date" value={examDate} onChange={setExamDate} />
              <Slider label="hours / day" value={hoursDay} onChange={setHoursDay} min={1} max={8} accent={accent} />
              <Slider label="review-only window" value={reviewWindow} onChange={setReviewWindow} min={2} max={14} accent={accent} hint="final days = no new topics" />
            </div>
          </Panel>
        }
        right={
          <div className="space-y-3">
            <Panel title="your day-by-day plan" accent={accent} right={<Tag accent={accent}>{plan.days} days · {plan.items.length} topics</Tag>}>
              {plan.lines.length ? (
                <Out text={outText} label="copy into your calendar" rows={16} />
              ) : (
                <p className="text-xs text-zinc-500">{plan.warn}</p>
              )}
            </Panel>
            {plan.warn && plan.lines.length > 0 && (
              <Panel title="honest warning" accent="#FF8A7A">
                <p className="text-[11.5px] leading-relaxed text-zinc-400">{plan.warn}</p>
              </Panel>
            )}
            <Note>
              Learning days front-load new topics at ~45 minutes each; the review window re-surfaces older
              topics on a 3-day rhythm — the spacing effect doing its thing. Adjust hours until the warning
              disappears, then follow the plan.
            </Note>
          </div>
        }
      />
    </div>
  );
}

/* ========================================================================== */
/* META — registry wiring                                                      */
/* ========================================================================== */

export const aiKitMeta: ToolMeta[] = [
  {
    id: "prompt-grader",
    name: "Prompt Grader",
    description: "Paste any prompt, get a live 0–100 score across 8 checks with fixes for every fail.",
    category: "study",
    icon: ClipboardCheck,
    keywords: "prompt grading score improve chatgpt gemini claude engineering feedback",
    badge: "new",
    component: PromptGrader,
  },
  {
    id: "prompt-scaffold",
    name: "Prompt Scaffold",
    description: "Five presets × five blueprint blocks assemble first-try prompts with copy-paste output.",
    category: "writing",
    icon: LayoutTemplate,
    keywords: "prompt builder template role task context format structured scaffold",
    badge: "new",
    component: PromptScaffold,
  },
  {
    id: "token-estimator",
    name: "Token Estimator",
    description: "Estimate tokens per prompt and check whether your usage habit fits each free tier.",
    category: "study",
    icon: Coins,
    keywords: "tokens estimate free tier limits quota api chatgpt gemini groq claude",
    badge: "new",
    component: TokenEstimator,
  },
  {
    id: "model-picker",
    name: "Free Model Picker",
    description: "Three questions about purpose, privacy and usage — one verdict with official links.",
    category: "study",
    icon: Compass,
    keywords: "which ai should i use chatgpt gemini claude ollama perplexity comparison free",
    badge: "new",
    component: FreeModelPicker,
  },
  {
    id: "flashcard-maker",
    name: "Flashcard Maker",
    description: "Paste notes, get an auto-generated flip-card deck with Again/Known scoring and Anki CSV export.",
    category: "study",
    icon: Layers,
    keywords: "flashcards generate from notes cloze anki export deck quiz memorize",
    badge: "new",
    component: FlashcardMaker,
  },
  {
    id: "skill-gap-check",
    name: "Skill Gap Check",
    description: "Sixteen honest self-checks across four axes — leaves with your next roadmap prescribed.",
    category: "study",
    icon: Target,
    keywords: "skill assessment gap analysis self check ai level beginner roadmap pick",
    badge: "new",
    component: SkillGapCheck,
  },
  {
    id: "ai-glossary-quiz",
    name: "AI Glossary Quiz",
    description: "Definition → term rounds over 24 core AI words with streaks, scores and fresh shuffles.",
    category: "study",
    icon: GraduationCap,
    keywords: "glossary quiz terminology llm rag embedding tokens definitions game learn",
    badge: "new",
    component: GlossaryQuiz,
  },
  {
    id: "free-tier-tracker",
    name: "Free Tier Tracker",
    description: "The zero-budget AI stack on one board: drag your planned usage, see which tiers fit.",
    category: "money",
    icon: Gauge,
    keywords: "free tier tracker quota colab kaggle vercel netlify hugging face budget",
    badge: "new",
    component: FreeTierTracker,
  },
  {
    id: "learning-journal",
    name: "Learning Journal",
    description: "One honest line a day: streaks, weekly goal meter, tags and markdown export — all on-device.",
    category: "study",
    icon: NotebookPen,
    keywords: "learning journal log streak study tracker daily habit export markdown",
    badge: "new",
    component: LearningJournal,
  },
  {
    id: "study-planner",
    name: "Syllabus Splitter",
    description: "Exam date + topic list in, spaced day-by-day plan out with honest feasibility warnings.",
    category: "study",
    icon: CalendarDays,
    keywords: "study plan syllabus exam countdown spaced repetition schedule distribute topics",
    badge: "new",
    component: SyllabusSplitter,
  },
];
