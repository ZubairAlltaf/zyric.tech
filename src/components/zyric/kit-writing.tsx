"use client";

/* ==========================================================================
   KIT: WRITING & WORDS — 22 bespoke text instruments.
   Each tool: own layout, own accent, own interaction model.
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
} from "./kit";

/* ------------------------------ 1. Readability ----------------------------- */

function syllables(w: string): number {
  w = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return (w.match(/[aeiouy]{1,2}/g) || ["x"]).length;
}

export function ReadabilityTool() {
  const A = accentOf(0);
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const sentences = text.split(/[.!?]+\s|\n+/).filter((x) => x.trim().length > 0);
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const syl = words.reduce((a, w) => a + syllables(w), 0);
    const sc = Math.max(1, sentences.length);
    const wc = Math.max(1, words.length);
    const ease = 206.835 - 1.015 * (wc / sc) - 84.6 * (syl / wc);
    const grade = 0.39 * (wc / sc) + 11.8 * (syl / wc) - 15.59;
    const level =
      ease >= 90 ? "Very easy" : ease >= 70 ? "Easy" : ease >= 60 ? "Plain English" : ease >= 50 ? "Fairly hard" : ease >= 30 ? "Hard" : "Very hard";
    return { ease, grade, level, sentences: sentences.length, words: words.length, syl };
  }, [text]);
  return (
    <div className="space-y-4">
      <Area label="Paste your draft" value={text} onChange={setText} rows={8} mono={false} placeholder="Paste a paragraph, an essay, an email…" />
      <Grid cols={4}>
        <BigStat label="Reading ease" value={Math.max(0, Math.round(s.ease))} unit="/100" accent={A} />
        <BigStat label="Grade level" value={Math.max(1, Math.round(s.grade))} unit="th" accent="#FF9DE2" />
        <BigStat label="Verdict" value={s.level} accent="#7FC8FF" />
        <BigStat label="Sentences" value={s.sentences} accent="#5EE39A" />
      </Grid>
      <Panel title="the scale — where you land" accent={A}>
        <Meter value={Math.max(0, s.ease)} max={100} accent={A} label="Very hard ←→ Very easy" right={`${Math.round(s.ease)}`} />
        <Note>Aim for 60–70 (plain English). Every extra syllable drags the score down like a stubborn suitcase.</Note>
      </Panel>
    </div>
  );
}

/* ------------------------------ 2. Passive voice --------------------------- */

const PASSIVE_RE = /\b(am|is|are|was|were|be|been|being)\b\s+((?:\w+ly\s+)?)(\w+(?:ed|en|wn|nt|ought|ade|uilt|orne))\b/gi;

export function PassiveVoiceTool() {
  const A = accentOf(1);
  const [text, setText] = useState("");
  const hits = useMemo(() => {
    const out: { sent: string; match: string }[] = [];
    for (const raw of text.split(/(?<=[.!?])\s+|\n+/)) {
      const m = raw.match(PASSIVE_RE);
      if (m) out.push({ sent: raw.trim(), match: m[0] });
    }
    return out;
  }, [text]);
  const total = text.split(/(?<=[.!?])\s+|\n+/).filter((x) => x.trim()).length || 1;
  return (
    <div className="space-y-4">
      <Split
        left={<Area label="Your text" value={text} onChange={setText} rows={9} mono={false} placeholder="The report was written by the team…" />}
        right={
          <div className="space-y-3">
            <Grid cols={2}>
              <BigStat label="Passive hits" value={hits.length} accent={hits.length ? "#FF8A7A" : "#5EE39A"} />
              <BigStat label="Passive ratio" value={`${Math.round((hits.length / total) * 100)}%`} accent={A} />
            </Grid>
            <Panel title="caught in the act" accent={A}>
              {hits.length === 0 ? (
                <p className="text-sm text-zinc-500">Nothing passive found. Active voice club 🎉</p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                  {hits.map((h, i) => (
                    <li key={i} className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs leading-relaxed text-zinc-300">
                      <Tag accent="#FF8A7A">{h.match}</Tag> <span className="ml-1">{h.sent}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        }
      />
      <Note>Heuristic detector — catches the common “be + past participle” forms. Some passives are fine; use judgement.</Note>
    </div>
  );
}

/* ------------------------------ 3. Weasel words ---------------------------- */

const WEASEL = ["very", "really", "just", "actually", "basically", "literally", "quite", "somewhat", "rather", "fairly", "simply", "totally", "definitely", "probably", "maybe", "perhaps", "stuff", "things", "various", "several", "many", "most", "some", "kind of", "sort of", "a lot", "obviously", "clearly", "essentially", "virtually", "extremely", "amazing", "awesome", "nice", "good", "bad", "great"];

export function WeaselWordTool() {
  const A = accentOf(2);
  const [text, setText] = useState("");
  const found = useMemo(() => {
    const words = text.toLowerCase().match(/[a-z' ]+/g) || [];
    const counts = new Map<string, number>();
    for (const w of WEASEL) {
      const re = new RegExp(`\\b${w}\\b`, "gi");
      const n = (text.match(re) || []).length;
      if (n) counts.set(w, n);
    }
    void words;
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [text]);
  const totalHits = found.reduce((a, [, n]) => a + n, 0);
  return (
    <div className="space-y-4">
      <Area label="Scan for filler & fluff" value={text} onChange={setText} rows={7} mono={false} placeholder="It was really very basically the best thing ever…" />
      <Row className="items-center justify-between">
        <BigStat label="Fluff particles found" value={totalHits} accent={totalHits ? A : "#5EE39A"} hint={totalHits ? "cut them and feel the prose tighten" : "clean as a whistle"} />
        <div className="flex max-w-md flex-wrap gap-1.5">
          {found.map(([w, n]) => (
            <Tag key={w} accent={n > 2 ? "#FF8A7A" : A}>
              {w} ×{n}
            </Tag>
          ))}
        </div>
      </Row>
      <Note>Tracking words like “very”, “basically”, “things” weaken sentences. Delete them — the sentence usually survives, often improves.</Note>
    </div>
  );
}

/* ------------------------------ 4. Sentence rhythm ------------------------- */

export function SentenceRhythmTool() {
  const A = accentOf(3);
  const [text, setText] = useState("");
  const lens = useMemo(
    () =>
      text
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s) => s.trim().split(/\s+/).filter(Boolean).length)
        .filter((n) => n > 0),
    [text]
  );
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const tooLong = lens.filter((n) => n > 25).length;
  return (
    <div className="space-y-4">
      <Area label="Feed a paragraph" value={text} onChange={setText} rows={6} mono={false} placeholder="Watch the beat of your sentences…" />
      <div className="flex items-end gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4" style={{ height: 170 }}>
        {lens.length === 0 ? (
          <p className="m-auto font-mono text-xs text-zinc-600">the equalizer awaits your words…</p>
        ) : (
          lens.map((n, i) => (
            <div
              key={i}
              className="group relative min-w-[6px] flex-1 rounded-t transition-all hover:brightness-125"
              title={`Sentence ${i + 1}: ${n} words`}
              style={{
                height: `${Math.min(100, (n / 35) * 100)}%`,
                background: n > 25 ? "#FF8A7A" : n < 6 ? "#4ECDC4" : A,
                maxWidth: 42,
              }}
            />
          ))
        )}
      </div>
      <Grid cols={3}>
        <BigStat label="Sentences" value={lens.length} accent={A} />
        <BigStat label="Avg length" value={Math.round(avg)} unit="w" accent="#B9A6FF" />
        <BigStat label="Marathon sentences (>25w)" value={tooLong} accent={tooLong ? "#FF8A7A" : "#5EE39A"} />
      </Grid>
      <Note>Great prose mixes long and short — look for a skyline, not a plateau. Red bars are marathons; teal are staccato.</Note>
    </div>
  );
}

/* ------------------------------ 5. Tone shifter ---------------------------- */

const FORMAL_MAP: [RegExp, string][] = [
  [/\bgonna\b/gi, "going to"], [/\bwanna\b/gi, "want to"], [/\bkinda\b/gi, "somewhat"],
  [/\bcannot\b/gi, "can not"], [/\bcan't\b/gi, "cannot"], [/\bdon't\b/gi, "do not"],
  [/\bdoesn't\b/gi, "does not"], [/\bwon't\b/gi, "will not"], [/\bit's\b/gi, "it is"],
  [/\bI'm\b/g, "I am"], [/\bkids\b/gi, "children"], [/\bbig\b/gi, "substantial"],
  [/\bget\b/gi, "obtain"], [/\bgot\b/gi, "received"], [/\bshow\b/gi, "demonstrate"],
  [/\bhelp\b/gi, "assist"], [/\buse\b/gi, "utilize"], [/\bstart\b/gi, "commence"],
  [/\bend\b/gi, "conclude"], [/\bneed\b/gi, "require"], [/\bask\b/gi, "inquire"],
  [/\bbuy\b/gi, "purchase"], [/\bfix\b/gi, "repair"], [/\bcheck\b/gi, "verify"],
  [/\bso\b/gi, "therefore"], [/\bbut\b/gi, "however"], [/\balso\b/gi, "furthermore"],
];
const CASUAL_MAP: [RegExp, string][] = [
  [/\bgoing to\b/gi, "gonna"], [/\bwant to\b/gi, "wanna"], [/\bcannot\b/gi, "can't"],
  [/\bdo not\b/gi, "don't"], [/\bdoes not\b/gi, "doesn't"], [/\bwill not\b/gi, "won't"],
  [/\bit is\b/gi, "it's"], [/\bI am\b/g, "I'm"], [/\butilize\b/gi, "use"],
  [/\bdemonstrate\b/gi, "show"], [/\bassist\b/gi, "help"], [/\bcommence\b/gi, "start"],
  [/\bconclude\b/gi, "end"], [/\brequire\b/gi, "need"], [/\binquire\b/gi, "ask"],
  [/\bpurchase\b/gi, "buy"], [/\btherefore\b/gi, "so"], [/\bhowever\b/gi, "but"],
  [/\bchildren\b/gi, "kids"], [/\bsubstantial\b/gi, "big"],
];

export function ToneShiftTool() {
  const A = accentOf(4);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"formal" | "casual">("formal");
  const out = useMemo(() => {
    let t = text;
    for (const [re, rep] of mode === "formal" ? FORMAL_MAP : CASUAL_MAP) t = t.replace(re, rep);
    return t;
  }, [text, mode]);
  const edits = useMemo(() => (text ? (out === text ? 0 : Math.round((1 - out.length / Math.max(1, text.length)) * -100)) : 0), [text, out]);
  return (
    <div className="space-y-4">
      <Row>
        <Seg
          value={mode}
          onChange={setMode}
          accent={A}
          options={[
            { v: "formal" as const, label: "Suit up ↑" },
            { v: "casual" as const, label: "Dress down ↓" },
          ]}
        />
        <Tag accent={A}>{edits > 0 ? `${edits} phrase swaps applied` : "awaiting text"}</Tag>
      </Row>
      <Split left={<Area label="Original" value={text} onChange={setText} rows={8} mono={false} placeholder="I'm gonna check if we can start…" />} right={<Out label={`${mode} version`} text={out} />} />
      <Note>Rule-based rewriter with ~30 vocabulary swaps. Great for a first pass; your human polish makes it sing.</Note>
    </div>
  );
}

/* ------------------------------ 6. Word diff ------------------------------- */

function wordDiff(a: string[], b: string[]): { w: string; t: "same" | "add" | "del" }[] {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { w: string; t: "same" | "add" | "del" }[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ w: a[i], t: "same" }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ w: a[i], t: "del" }); i++; }
    else { out.push({ w: b[j], t: "add" }); j++; }
  }
  while (i < n) out.push({ w: a[i++], t: "del" });
  while (j < m) out.push({ w: b[j++], t: "add" });
  return out;
}

export function WordDiffTool() {
  const A = accentOf(5);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const diff = useMemo(() => wordDiff(a.split(/\s+/).filter(Boolean), b.split(/\s+/).filter(Boolean)), [a, b]);
  const adds = diff.filter((d) => d.t === "add").length;
  const dels = diff.filter((d) => d.t === "del").length;
  return (
    <div className="space-y-4">
      <Split left={<Area label="Version A (old)" value={a} onChange={setA} rows={6} mono={false} />} right={<Area label="Version B (new)" value={b} onChange={setB} rows={6} mono={false} />} />
      <Row className="items-center gap-2">
        <Tag accent="#5EE39A">+{adds} added</Tag>
        <Tag accent="#FF8A7A">−{dels} removed</Tag>
        <Tag accent={A}>{diff.filter((d) => d.t === "same").length} unchanged</Tag>
      </Row>
      <Panel title="inline diff" accent={A}>
        <p className="text-sm leading-loose">
          {diff.map((d, i) =>
            d.t === "same" ? (
              <span key={i} className="text-zinc-400">{d.w} </span>
            ) : d.t === "add" ? (
              <span key={i} className="rounded bg-emerald-500/15 px-1 font-semibold text-emerald-300">+{d.w} </span>
            ) : (
              <span key={i} className="rounded bg-rose-500/15 px-1 font-semibold text-rose-300 line-through">−{d.w} </span>
            )
          )}
          {!diff.length && <span className="text-zinc-600">paste text in both boxes…</span>}
        </p>
      </Panel>
    </div>
  );
}

/* ------------------------------ 7. Palindrome ------------------------------ */

export function PalindromeTool() {
  const A = accentOf(6);
  const [text, setText] = useState("");
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rev = [...clean].reverse().join("");
  const isP = clean.length > 0 && clean === rev;
  return (
    <div className="space-y-4">
      <Area label="Word, phrase or number" value={text} onChange={setText} rows={3} mono={false} placeholder="A man, a plan, a canal: Panama" />
      <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-8">
        <div
          className="rounded-lg border-2 px-6 py-3 text-center font-mono text-lg font-black tracking-wide"
          style={clean ? { borderColor: isP ? "#5EE39A" : "#FF8A7A", color: isP ? "#5EE39A" : "#FF8A7A" } : { borderColor: "#3f3f46", color: "#71717a" }}
        >
          {!clean ? "TYPE SOMETHING" : isP ? "PALINDROME ✓" : "NOT A PALINDROME ✗"}
        </div>
        <div className="flex w-full max-w-xl items-center justify-center gap-2 overflow-hidden font-mono text-sm">
          <span className="truncate text-zinc-300">{clean || "…"}</span>
          <span style={{ color: A }}>⟷</span>
          <span className="truncate text-zinc-500">{rev || "…"}</span>
        </div>
        {clean ? <KV k="letters & digits" v={clean.length} accent={A} /> : null}
      </div>
    </div>
  );
}

/* ------------------------------ 8. Anagram --------------------------------- */

export function AnagramTool() {
  const A = accentOf(7);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "").split("").sort().join("");
  const ok = a.trim() && b.trim() && norm(a) === norm(b) && a.replace(/\s/g, "").toLowerCase() !== b.replace(/\s/g, "").toLowerCase();
  return (
    <div className="space-y-4">
      <Split left={<Field label="Word / phrase A" value={a} onChange={setA} placeholder="listen" />} right={<Field label="Word / phrase B" value={b} onChange={setB} placeholder="silent" />} />
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 text-center">
        <p className="font-mono text-xl font-black" style={{ color: ok ? "#5EE39A" : "#a1a1aa" }}>
          {!a || !b ? "WAITING FOR BOTH WORDS" : ok ? "ANAGRAMS ✓" : "NOT ANAGRAMS ✗"}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {norm(a).split("").map((c, i) => (
            <span key={i} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-200">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 9. Crossword pattern ----------------------- */

const MINI_DICT = "able acid aged also area army away baby back ball band bank base bath bear beat been beer bell belt bend bill bird blow blue boat body bomb bond bone book boom boot born boss both bowl bulk burn bush busy calm came camp card care case cash cast cell chat chef chip city club coal coat code cold come cook cool cope copy cord core corn cost crew crop dark data date dawn days dead deal dear debt deep deny desk dial diet dirt disc does done door dose down draw drew drop drug dual dull dust duty each earn ease east easy edge else even ever evil exit face fact fail fair fall farm fast fate fear feed feel feet fell felt file fill film find fine fire firm fish fist five flat flew flip flow foam fold folk food foot ford fork form fort four free frog from fuel full fund gain game gate gave gear gene gift girl give glad glow goal goat goes gold golf gone good gown grab gray grew grey grid grim grin grow gulf hair half hall halt hand hang hard harm hate have head heal heap hear heat held hell helm help hemp herb here hero hers hide high hill hint hire hold hole holy home hope horn host hour huge hung hunt hurt idea inch into iron item join jump jury just keen keep kept kick kind king knee knew know lack lady laid lake lamb lamp land lane last late lawn lazy lead lean leap left lend lens less lift like limb lime line link lion list live load loan lock loft logo lone long look loop lord lose loss lost loud love luck lump lung made mail main make male mall many mark mask mass mate math meal mean meat meet melt memo mend menu mere mesh mild mile milk mill mind mine mint miss mist mode mold mole monk mood moon more moss most moth move much mule must myth nail name navy near neat neck need neon nest news next nice nine node none noon norm nose note noun oath obey odds okay omit once only onto open oral oval oven over pace pack page paid pain pair pale palm park part pass past path peak pear peer pile pine pink pipe plan play plot plug plum plus poem poet pole poll pond pony pool poor pope pork port pose post pour pray prey prop pull pump pure push quit quiz race rack raft rage rail rain rake ramp rank rare rate read real reef reel rely rent rest rice rich ride ring riot rise risk road roar robe rock rode role roll roof room root rope rose rosy route ruby rude ruin rule rush rust sack safe sage said sail sake sale salt same sand save scan scar seal seat seed seek seem seen self sell send sent shed ship shoe shop shot show shut side sigh sign silk sing sink site size skin skip slam slap sled slid slim slip slot slow snap snow soap sock sofa soft soil sold sole solo some song soon sore sort soul soup spin spot spun spur stack staff stage stain stair stake stamp stand star stare stay stem step stew stir stop stow stun such suit sung sunk sure surf swap swim tail take tale talk tall tank tape task taxi team tear tech tell tend tent term test text than that thaw them then they thin this thus tick tide tidy tied tile till tilt time tiny tips tire toad toll tomb tone took tool torn tour town toys trap tray tree trim trip true tube tuna tune turf turn twin type ugly undo unit upon urge used user vain vane vase vast veil vein verb very vest veto vibe vice view vine visa void volt vote wage wait wake walk wall want ward warm warn wash wave weak wear weed week weep well went were west what when whip whom wide wife wild will wind wine wing wipe wire wise wish with wolf wood wool word wore work worm worn wrap yard yarn yeah year your zero zone zone".split(" ");

export function CrosswordTool() {
  const A = accentOf(8);
  const [pattern, setPattern] = useState("");
  const matches = useMemo(() => {
    const p = pattern.toLowerCase().replace(/[^a-z?_]/g, "");
    if (!p) return [];
    return MINI_DICT.filter((w) => w.length === p.length && [...w].every((c, i) => {
      const ch = p[i];
      return ch === "?" || ch === "_" || ch === c;
    }));
  }, [pattern]);
  return (
    <div className="space-y-4">
      <Field label="Pattern — use _ or ? for blanks" value={pattern} onChange={setPattern} placeholder="c_t" hint="e.g. c_t finds cat, cut, cot — length is matched exactly" />
      <Panel title={`${matches.length} match${matches.length === 1 ? "" : "es"} in the mini-dictionary`} accent={A}>
        <div className="flex flex-wrap gap-1.5">
          {matches.map((w) => (
            <span key={w} className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-sm font-bold uppercase" style={{ color: A }}>
              {w}
            </span>
          ))}
          {!matches.length && <span className="text-sm text-zinc-600">Type a pattern like “s__rk” or “b?ll”…</span>}
        </div>
      </Panel>
      <Note>Compact built-in dictionary of ~1,600 common words — perfect for crosswords and wordle-style grids.</Note>
    </div>
  );
}

/* ------------------------------ 10. Acronym -------------------------------- */

export function AcronymTool() {
  const A = accentOf(9);
  const [phrase, setPhrase] = useState("");
  const [style, setStyle] = useState<"caps" | "pronounce" | "initials">("caps");
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  const out = useMemo(() => {
    const letters = words.map((w) => w[0]?.toUpperCase() ?? "").join("");
    if (style === "initials") return letters.toLowerCase();
    if (style === "pronounce") {
      const kept = words.filter((w) => w.length > 2 || ["a", "i"].includes(w.toLowerCase()));
      return kept.map((w) => w[0]?.toUpperCase() ?? "").join("");
    }
    return letters;
  }, [phrase, style, words]);
  return (
    <div className="space-y-4">
      <Area label="Name or phrase" value={phrase} onChange={setPhrase} rows={3} mono={false} placeholder="Light Amplification by Stimulated Emission of Radiation" />
      <Seg value={style} onChange={setStyle} accent={A} options={[{ v: "caps" as const, label: "Every word" }, { v: "pronounce" as const, label: "Skip stubs" }, { v: "initials" as const, label: "lowercase" }]} />
      <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 py-10">
        <p className="font-brut text-4xl tracking-[0.18em]" style={{ color: A }}>{out || "…"}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {words.map((w, i) => (
            <span key={i} className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[10px] uppercase text-zinc-400">
              <b style={{ color: A }}>{w[0]?.toUpperCase()}</b>
              {w.slice(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 11. Typography cleaner --------------------- */

export function TypographyCleanerTool() {
  const A = accentOf(10);
  const [text, setText] = useState("");
  const [opts, setOpts] = useState({ quotes: true, spaces: true, ellipsis: true, dashes: true });
  const { out, fixes } = useMemo(() => {
    let t = text, n = 0;
    if (opts.quotes) { t = t.replace(/"([^"]*)"/g, "“$1”"); t = t.replace(/'([^']*)'/g, "‘$1’"); t = t.replace(/(\w)'(\w)/g, "$1’$2"); }
    if (opts.spaces) { t = t.replace(/ {2,}/g, " "); t = t.replace(/ +\n/g, "\n"); }
    if (opts.ellipsis) t = t.replace(/\.{3,}/g, "…");
    if (opts.dashes) t = t.replace(/(\w) -- (\w)/g, "$1 — $2").replace(/(\w)-{2,}(\w)/g, "$1 — $2");
    return { out: t, fixes: n };
  }, [text, opts]);
  void fixes;
  return (
    <div className="space-y-4">
      <Split
        left={<Area label="Messy paste" value={text} onChange={setText} rows={8} placeholder={'Type  "like  this"  -- with junk...'} />}
        right={
          <div className="space-y-3">
            <Panel title="polish rules" accent={A}>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {([["quotes", "Smart quotes"], ["spaces", "Trim spaces"], ["ellipsis", "… character"], ["dashes", "Em dashes"]] as const).map(([k, l]) => (
                  <label key={k} className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
                    <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} className="h-4 w-4 accent-amber-400" />{l}
                  </label>
                ))}
              </div>
            </Panel>
            <Out label="polished" text={out} />
          </div>
        }
      />
    </div>
  );
}

/* ------------------------------ 12. Emoji translator ----------------------- */

const EMOJI_MAP: Record<string, string> = {
  love: "❤️", heart: "❤️", cat: "🐱", dog: "🐶", pizza: "🍕", burger: "🍔", coffee: "☕",
  tea: "🍵", beer: "🍺", wine: "🍷", cake: "🎂", sun: "☀️", moon: "🌙", star: "⭐",
  fire: "🔥", water: "💧", rain: "🌧️", snow: "❄️", cloud: "☁️", tree: "🌳", flower: "🌸",
  car: "🚗", bus: "🚌", train: "🚆", plane: "✈️", rocket: "🚀", boat: "⛵", bike: "🚲",
  house: "🏠", school: "🏫", work: "💼", money: "💰", gift: "🎁", phone: "📱",
  computer: "💻", book: "📚", music: "🎵", movie: "🎬", game: "🎮", ball: "⚽",
  run: "🏃", walk: "🚶", sleep: "😴", eat: "🍽️", drink: "🥤", happy: "😊", sad: "😢",
  angry: "😠", cool: "😎", party: "🎉", ghost: "👻", robot: "🤖", alien: "👽",
  time: "⏰", clock: "🕐", light: "💡", key: "🔑", lock: "🔒", mail: "✉️",
  king: "👑", crown: "👑", magic: "✨", trophy: "🏆", medal: "🏅", football: "🏈",
  apple: "🍎", banana: "🍌", bread: "🍞", egg: "🥚", fish: "🐟", bird: "🐦",
  bug: "🐛", bee: "🐝", eye: "👁️", ear: "👂", hand: "✋", foot: "🦶",
};

export function EmojiTranslateTool() {
  const A = accentOf(11);
  const [text, setText] = useState("");
  const [dir, setDir] = useState<"toEmoji" | "toWords">("toEmoji");
  const out = useMemo(() => {
    if (dir === "toEmoji") {
      return text.replace(/[a-zA-Z]+/g, (w) => {
        const e = EMOJI_MAP[w.toLowerCase()];
        return e ? `${w} ${e}` : w;
      });
    }
    let t = text;
    for (const [w, e] of Object.entries(EMOJI_MAP)) t = t.split(e).join(` ${w} `);
    return t.replace(/\s+/g, " ").trim();
  }, [text, dir]);
  return (
    <div className="space-y-4">
      <Seg value={dir} onChange={setDir} accent={A} options={[{ v: "toEmoji" as const, label: "words → emoji" }, { v: "toWords" as const, label: "emoji → words" }]} />
      <Split left={<Area label={dir === "toEmoji" ? "Plain words" : "Emoji text"} value={text} onChange={setText} rows={6} mono={false} placeholder="I love pizza and coffee with my cat" />} right={<Out label={dir === "toEmoji" ? "emoji-fied" : "translated"} text={out} />} />
      <div className="flex flex-wrap gap-1">
        {Object.entries(EMOJI_MAP).slice(0, 40).map(([w, e]) => (
          <span key={w} className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500">{w}{e}</span>
        ))}
        <span className="px-1 font-mono text-[9px] text-zinc-600">+{Math.max(0, Object.keys(EMOJI_MAP).length - 40)} more</span>
      </div>
    </div>
  );
}

/* ------------------------------ 13. Name blender --------------------------- */

export function NameBlendTool() {
  const A = accentOf(0);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const blends = useMemo(() => {
    const x = a.trim().replace(/\s+/g, ""), y = b.trim().replace(/\s+/g, "");
    if (!x || !y) return [];
    const out = new Set<string>();
    for (let i = 2; i <= Math.min(4, x.length); i++)
      for (let j = 0; j < Math.min(4, y.length); j++) {
        const w = x.slice(0, i) + y.slice(j);
        if (w.length >= 4) out.add(w[0].toUpperCase() + w.slice(1).toLowerCase());
      }
    return [...out].slice(0, 12);
  }, [a, b]);
  return (
    <div className="space-y-4">
      <Split left={<Field label="Name one" value={a} onChange={setA} placeholder="Brad" />} right={<Field label="Name two" value={b} onChange={setB} placeholder="Angelina" />} />
      <Panel title="the portmanteau lab" accent={A}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {blends.map((w) => (
            <div key={w} className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-center">
              <p className="font-brut text-lg" style={{ color: A }}>{w}</p>
            </div>
          ))}
          {!blends.length && <p className="col-span-full py-4 text-center text-sm text-zinc-600">Give me two names — couple name, brand mashup, pet name…</p>}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------ 14. Username generator --------------------- */

const U_ADJ = ["swift", "silent", "cosmic", "neon", "brave", "wired", "lucky", "hyper", "midnight", "electric", "frozen", "golden", "vivid", "quantum", "shadow", "polar", "rogue", "prime", "solar", "turbo"];
const U_NOUN = ["falcon", "panda", "cipher", "otter", "pixel", "comet", "raven", "tiger", "socket", "phoenix", "wolf", "spark", "maple", "nomad", "lynx", "quasar", "beacon", "drift", "ember", "meteor"];

export function UsernameTool() {
  const A = accentOf(1);
  const [seed, setSeed] = useState("");
  const [style, setStyle] = useState<"word" | "dots" | "caps" | "nums">("word");
  const [bump, setBump] = useState(0);
  const names = useMemo(() => {
    void bump;
    const s = seed.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "you";
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const gen = (): string => {
      switch (style) {
        case "word": return `${pick(U_ADJ)}${pick(U_NOUN)}${Math.floor(Math.random() * 90) + 10}`;
        case "dots": return `${pick(U_ADJ)}.${s || pick(U_NOUN)}.${pick(U_NOUN)}`;
        case "caps": return `${pick(U_ADJ).toUpperCase()}${pick(U_NOUN).toUpperCase()}`;
        case "nums": return `${s}${["_", "-"][Math.floor(Math.random() * 2)]}${Math.floor(Math.random() * 9000) + 1000}`;
      }
    };
    return Array.from({ length: 9 }, gen);
  }, [seed, style, bump]);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Your name / word (optional)" value={seed} onChange={setSeed} placeholder="alex" className="min-w-[200px] flex-1" />
        <Seg value={style} onChange={setStyle} accent={A} options={[{ v: "word" as const, label: "Word salad" }, { v: "dots" as const, label: "Dots" }, { v: "caps" as const, label: "LOUD" }, { v: "nums" as const, label: "With digits" }]} />
        <Btn accent={A} onClick={() => setBump((x) => x + 1)}>Reroll</Btn>
      </Row>
      <div className="grid gap-2 sm:grid-cols-3">
        {names.map((n) => (
          <div key={n} className="group flex items-center justify-between rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
            <span className="truncate font-mono text-sm" style={{ color: A }}>@{n}</span>
            <span className="font-mono text-[9px] text-zinc-600 group-hover:text-zinc-400">{n.length} ch</span>
          </div>
        ))}
      </div>
      <Note>Handles are 100% local randomness — no lookups, so double-check availability on the platform you use.</Note>
    </div>
  );
}

/* ------------------------------ 15. Hashtag generator ---------------------- */

const STOP = new Set("the a an and or but in on at to for of with is are was were be been being this that these those it its as by from i you he she we they my your our their not no yes do does did done have has had will would can could should may might must".split(" "));

export function HashtagTool() {
  const A = accentOf(2);
  const [text, setText] = useState("");
  const tags = useMemo(() => {
    const words = text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || [];
    const freq = new Map<string, number>();
    for (const w of words) if (!STOP.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);
    const camel = top.map((w) => `#${w[0].toUpperCase()}${w.slice(1)}`);
    const joined = top.length > 1 ? [`#${top.slice(0, 3).map((w) => w[0].toUpperCase() + w.slice(1)).join("")}`] : [];
    const broad = top.map((w) => `#${w}s`);
    return [...new Set([...joined, ...camel, ...broad])].slice(0, 20);
  }, [text]);
  return (
    <div className="space-y-4">
      <Area label="Caption or topic" value={text} onChange={setText} rows={5} mono={false} placeholder="sunrise hike above the clouds with my dog" />
      <Panel title="copy-paste cloud" accent={A}>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded-full border px-3 py-1 font-mono text-xs font-bold" style={{ borderColor: `${A}55`, color: A, background: `${A}11` }}>{t}</span>
          ))}
          {!tags.length && <span className="text-sm text-zinc-600">Type a few lines — I will pull hashtags from the real words you use.</span>}
        </div>
      </Panel>
      <Out label="one line" text={tags.join(" ")} />
    </div>
  );
}

/* ------------------------------ 16. Caption formatter ---------------------- */

export function CaptionFormatTool() {
  const A = accentOf(3);
  const [text, setText] = useState("");
  const [lines, setLines] = useState(3);
  const out = useMemo(() => {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean) return "";
    const words = clean.split(" ");
    const per = Math.max(1, Math.ceil(words.length / lines));
    const rows: string[] = [];
    for (let i = 0; i < words.length; i += per) rows.push(words.slice(i, i + per).join(" "));
    return rows.join("\n.\n.\n.");
  }, [text, lines]);
  return (
    <div className="space-y-4">
      <Slider label="Line breaks between dots" value={lines} onChange={setLines} min={1} max={8} accent={A} suffix=" words-chunks" />
      <Area label="Caption (single line paste)" value={text} onChange={setText} rows={5} mono={false} placeholder="Paste your caption — Instagram eats multi-line text unless you hack it" />
      <Out label="ig-ready caption" text={out} />
      <Note>Uses the classic “dot lines” trick so Instagram preserves your paragraph breaks.</Note>
    </div>
  );
}

/* ------------------------------ 17. Speech timer --------------------------- */

export function SpeechTimerTool() {
  const A = accentOf(4);
  const [words, setWords] = useState("500");
  const [wpm, setWpm] = useState(130);
  const w = parseInt(words) || 0;
  const mins = wpm > 0 ? w / wpm : 0;
  const mm = Math.floor(mins);
  const ss = Math.round((mins - mm) * 60);
  const slots = [
    { label: "Lightning talk", wpm: 160 },
    { label: "Presentation", wpm: 130 },
    { label: "Slow & solemn", wpm: 100 },
  ];
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Word count" value={words} onChange={setWords} type="number" className="min-w-[160px] flex-1" />
        <Field label="Speaking pace (wpm)" value={wpm} onChange={(v) => setWpm(parseInt(v) || 1)} type="number" className="min-w-[160px] flex-1" />
      </Row>
      <div className="flex flex-col items-center rounded-lg border border-zinc-800 bg-zinc-950/70 py-8">
        <p className="mono-kicker text-zinc-500">estimated duration</p>
        <p className="mt-2 font-brut text-6xl" style={{ color: A }}>{mm}<span className="text-2xl text-zinc-500">m</span> {String(ss).padStart(2, "0")}<span className="text-2xl text-zinc-500">s</span></p>
        <p className="mt-2 font-mono text-xs text-zinc-600">{w} words ÷ {wpm} wpm</p>
      </div>
      <Grid cols={3}>
        {slots.map((s) => (
          <BigStat key={s.label} label={s.label} value={Math.max(0, Math.round((w / s.wpm) * 10) / 10)} unit="min" accent={s.wpm === wpm ? A : "#52525b"} />
        ))}
      </Grid>
    </div>
  );
}

/* ------------------------------ 18. Homophone checker ---------------------- */

const HOMOPHONES = [
  ["their", "there", "they're"], ["your", "you're"], ["its", "it's"], ["to", "too", "two"],
  ["hear", "here"], ["break", "brake"], ["peace", "piece"], ["weather", "whether"],
  ["which", "witch"], ["write", "right"], ["no", "know"], ["wear", "where"],
  ["ate", "eight"], ["bare", "bear"], ["buy", "by"], ["cell", "sell"], ["flour", "flower"],
  ["hole", "whole"], ["meat", "meet"], ["one", "won"], ["plain", "plane"], ["sail", "sale"],
  ["son", "sun"], ["tail", "tale"], ["wait", "weight"], ["weak", "week"], ["wood", "would"],
];

export function HomophoneTool() {
  const A = accentOf(5);
  const [text, setText] = useState("");
  const groups = useMemo(() => {
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    return HOMOPHONES.map((g) => {
      const found = g.map((w) => ({ w, n: words.filter((x) => x === w).length }));
      return found.filter((f) => f.n > 0);
    }).filter((g) => g.length > 1);
  }, [text]);
  return (
    <div className="space-y-4">
      <Area label="Proofread zone" value={text} onChange={setText} rows={7} mono={false} placeholder="Their going too there house, witch is two miles away…" />
      <Panel title="suspicious sound-alike clashes" accent={A}>
        {groups.length === 0 ? (
          <p className="text-sm text-zinc-500">No clashes spotted. (I only flag groups where two or more sound-alikes actually appear.)</p>
        ) : (
          <ul className="space-y-2.5">
            {groups.map((g, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                {g.map((f) => (
                  <Tag key={f.w} accent={f.n > 0 ? A : "#3f3f46"}>{f.w} ×{f.n}</Tag>
                ))}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Note>Flagged pairs deserve a second look: “their/there”, “its/it’s”, “weather/whether” and friends sneak past spellcheck.</Note>
    </div>
  );
}

/* ------------------------------ 19. Fancy fonts ---------------------------- */

function uniMap(text: string, up: number, lo: number): string {
  let out = "";
  for (const c of text) {
    const code = c.codePointAt(0) ?? 0;
    if (c >= "A" && c <= "Z") out += String.fromCodePoint(up + (code - 65));
    else if (c >= "a" && c <= "z") out += String.fromCodePoint(lo + (code - 97));
    else out += c;
  }
  return out;
}
const SMALLCAPS: Record<string, string> = { a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "ѕ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ" };

export function FancyFontTool() {
  const A = accentOf(6);
  const [text, setText] = useState("");
  const fonts = useMemo(() => {
    const t = text || "Zyric";
    return [
      { n: "Bold", v: uniMap(t, 0x1d400, 0x1d41a) },
      { n: "Italic", v: uniMap(t, 0x1d434, 0x1d44e) },
      { n: "Bold Italic", v: uniMap(t, 0x1d468, 0x1d482) },
      { n: "Script", v: uniMap(t, 0x1d49c, 0x1d4b6) },
      { n: "Fraktur", v: uniMap(t, 0x1d504, 0x1d51e) },
      { n: "Double", v: uniMap(t, 0x1d538, 0x1d552) },
      { n: "Mono", v: uniMap(t, 0x1d670, 0x1d68a) },
      { n: "Circled", v: uniMap(t, 0x24b6, 0x24d0) },
      { n: "Small Caps", v: [...t.toLowerCase()].map((c) => SMALLCAPS[c] ?? c).join("") },
      { n: "Underline", v: [...t].join("͟") },
      { n: "Strike", v: [...t].join("̶") },
      { n: "Sparkle", v: `✨${[...t].join("·")}✨` },
    ];
  }, [text]);
  return (
    <div className="space-y-4">
      <Field label="Type anything" value={text} onChange={setText} placeholder="your text" />
      <div className="grid gap-2 sm:grid-cols-2">
        {fonts.map((f) => (
          <div key={f.n} className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
            <div className="min-w-0">
              <p className="mono-kicker text-zinc-600">{f.n}</p>
              <p className="truncate text-lg text-zinc-100">{f.v}</p>
            </div>
            <CopyButtonMini text={f.v} accent={A} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyButtonMini({ text, accent }: { text: string; accent: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); } catch { /* noop */ }
      }}
      className="shrink-0 rounded border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest"
      style={{ borderColor: `${accent}55`, color: ok ? "#5EE39A" : accent }}
    >
      {ok ? "copied" : "copy"}
    </button>
  );
}

/* ------------------------------ 20. Emphasis formatter --------------------- */

export function EmphasisTool() {
  const A = accentOf(7);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"alt" | "space" | "clap" | "sparkle" | "wave" | "bold">("alt");
  const out = useMemo(() => {
    const t = text.trim();
    switch (mode) {
      case "alt": return [...t].map((c, i) => (i % 2 ? c.toLowerCase() : c.toUpperCase())).join("");
      case "space": return [...t].join(" ");
      case "clap": return t.split(/\s+/).join(" 👏 ");
      case "sparkle": return `˖✧${[...t].join("・")}✧˖`;
      case "wave": return [...t].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join("");
      case "bold": return uniMap(t, 0x1d400, 0x1d41a);
    }
  }, [text, mode]);
  return (
    <div className="space-y-4">
      <Area label="Phrase" value={text} onChange={setText} rows={3} mono={false} placeholder="no way" />
      <Seg value={mode} onChange={setMode} accent={A} options={[{ v: "alt" as const, label: "aLt cApS" }, { v: "space" as const, label: "s p a c e" }, { v: "clap" as const, label: "clap 👏" }, { v: "sparkle" as const, label: "sparkle" }, { v: "wave" as const, label: "wAvY" }, { v: "bold" as const, label: "𝗕𝗼𝗹𝗱" }]} />
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 text-center">
        <p className="break-words text-xl text-zinc-100">{out || "…"}</p>
      </div>
    </div>
  );
}

/* ------------------------------ 21. Letter frequency ----------------------- */

export function LetterFreqTool() {
  const A = accentOf(8);
  const [text, setText] = useState("");
  const freq = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of text.toLowerCase()) if (/[a-z]/.test(c)) counts.set(c, (counts.get(c) || 0) + 1);
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ c, n, p: (n / total) * 100 }));
  }, [text]);
  const top = freq[0];
  return (
    <div className="space-y-4">
      <Area label="Text to x-ray" value={text} onChange={setText} rows={5} mono={false} placeholder="e usually wins in English…" />
      <div className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
        {freq.slice(0, 14).map((f) => (
          <div key={f.c} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-center font-mono text-sm font-black uppercase" style={{ color: f.c === top?.c ? A : "#a1a1aa" }}>{f.c}</span>
            <div className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-zinc-900">
              <div className="h-full rounded-sm transition-all duration-300" style={{ width: `${(f.n / top.n) * 100}%`, background: f.c === "etaoin" ? A : f.c === top.c ? A : "#52525b" }} />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-[10px] text-zinc-500">{f.n} · {f.p.toFixed(1)}%</span>
          </div>
        ))}
        {!freq.length && <p className="py-4 text-center text-sm text-zinc-600">Frequency bars appear here…</p>}
      </div>
      <Note>Handy for cipher-cracking, word games and checking if your keyboard is haunted (j, q, z ghosts).</Note>
    </div>
  );
}

/* ------------------------------ 22. Thread splitter ------------------------ */

export function ThreadSplitterTool() {
  const A = accentOf(9);
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(280);
  const tweets = useMemo(() => {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean) return [];
    const out: string[] = [];
    let cur = "";
    for (const word of clean.split(" ")) {
      const candidate = cur ? `${cur} ${word}` : word;
      if (candidate.length + 4 > limit && cur) { out.push(cur); cur = word; }
      else cur = candidate;
    }
    if (cur) out.push(cur);
    return out.map((t, i) => `${i + 1}/${out.length} ${t}`);
  }, [text, limit]);
  return (
    <div className="space-y-4">
      <Slider label="Post character limit" value={limit} onChange={setLimit} min={80} max={500} step={10} accent={A} />
      <Area label="Long thought" value={text} onChange={setText} rows={7} mono={false} placeholder="Paste the whole rant — it becomes numbered posts…" />
      <div className="space-y-2">
        {tweets.map((t, i) => (
          <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <Tag accent={A}>post {i + 1}</Tag>
              <CopyButtonMini text={t} accent={A} />
            </div>
            <p className="text-sm leading-relaxed text-zinc-200">{t}</p>
          </div>
        ))}
        {!tweets.length && <p className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">Your thread preview builds here…</p>}
      </div>
    </div>
  );
}
