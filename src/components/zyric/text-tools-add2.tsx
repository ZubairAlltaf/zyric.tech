"use client";

import { useMemo, useState } from "react";
import { BarChart3, Type, FlipHorizontal, Omega, UserRound, RefreshCw, Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage, CopyButton, labelCls, inputCls, uid } from "./hooks";

/* --------------------------- Word Frequency Counter ------------------------ */

const STOPWORDS = new Set(
  "the a an and or but if then else for to of in on at by with from as is are was were be been being it its this that these those he she they them his her their we you your i me my our us not no so do does did done have has had will would can could should shall may might must about into over under again further once here there when where why how all any both each few more most other some such than too very just also".split(" ")
);

function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function WordFreqTool() {
  const [text, setText] = useState("");
  const [skipStop, setSkipStop] = useState(true);
  const [minLen, setMinLen] = useState(3);

  const analysis = useMemo(() => {
    const words = (text.toLowerCase().match(/[a-zà-öø-ÿ']+/gi) ?? []).map((w) => w.replace(/^'+|'+$/g, "")).filter(Boolean);
    const counts = new Map<string, number>();
    for (const w of words) {
      if (w.length < minLen) continue;
      if (skipStop && STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
    return { total: words.length, unique: counts.size, top: sorted, max: sorted[0]?.[1] ?? 1 };
  }, [text, skipStop, minLen]);

  const csv = () => {
    const rows = [["word", "count"], ...analysis.top];
    downloadText("word-frequency.csv", rows.map((r) => r.join(",")).join("\n"), "text/csv");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="wf-text" className={labelCls}>Your text</Label>
          <Textarea id="wf-text" value={text} onChange={(e) => setText(e.target.value)} className={`${inputCls} min-h-56 font-mono text-sm`} placeholder="Paste an article, essay or transcript…" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="wf-stop" checked={skipStop} onCheckedChange={setSkipStop} aria-label="Skip common words" />
            <Label htmlFor="wf-stop" className="text-sm text-zinc-300">Skip common words</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="wf-min" className="text-sm text-zinc-300">Min length</Label>
            <Input id="wf-min" value={String(minLen)} onChange={(e) => setMinLen(Math.min(8, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} className={`${inputCls} h-8 w-14 text-center font-mono`} inputMode="numeric" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-center">
            <p className="font-display text-xl font-bold text-zinc-50">{analysis.total.toLocaleString()}</p>
            <p className="text-[11px] text-zinc-500">total words</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-center">
            <p className="font-display text-xl font-bold text-emerald-300">{analysis.unique.toLocaleString()}</p>
            <p className="text-[11px] text-zinc-500">unique words</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-center">
            <p className="font-display text-xl font-bold text-teal-300">{analysis.total ? ((analysis.unique / analysis.total) * 100).toFixed(0) + "%" : "—"}</p>
            <p className="text-[11px] text-zinc-500">variety</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="mono-kicker text-zinc-500">top words</p>
          {analysis.top.length > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={csv} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
              <Download className="h-3.5 w-3.5" aria-hidden /> CSV
            </Button>
          )}
        </div>
        {analysis.top.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
            Type or paste text to see which words dominate.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {analysis.top.map(([word, count], i) => (
              <li key={word} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-right font-mono text-[11px] text-zinc-600">{i + 1}</span>
                <span className="w-28 shrink-0 truncate text-sm text-zinc-200">{word}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${(count / analysis.max) * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-emerald-300">{count}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Character Limit Checker ---------------------- */

const LIMITS: { name: string; limit: number; note?: string }[] = [
  { name: "X (Twitter) post", limit: 280 },
  { name: "SMS — single segment", limit: 160, note: "longer texts split into segments" },
  { name: "Instagram caption", limit: 2200 },
  { name: "LinkedIn post", limit: 3000 },
  { name: "Facebook post", limit: 5000 },
  { name: "SEO title tag", limit: 60, note: "Google truncates ~60 chars" },
  { name: "Meta description", limit: 160, note: "Google truncates ~160 chars" },
  { name: "YouTube title", limit: 100 },
  { name: "Pinterest description", limit: 500 },
  { name: "Reddit title", limit: 300 },
];

export function CharLimitsTool() {
  const [text, setText] = useState("");
  const len = [...text].length;
  const smsSegments = len === 0 ? 0 : Math.ceil(len / (/[^\u0000-\u007F]/.test(text) ? 70 : 160));

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="cl-text" className={labelCls}>Your post, title or message</Label>
          <span className="font-mono text-xs text-zinc-500">{len.toLocaleString()} chars · {text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : "0"} words</span>
        </div>
        <Textarea id="cl-text" value={text} onChange={(e) => setText(e.target.value)} className={`${inputCls} min-h-28 text-sm`} placeholder="Paste your copy — every limit updates live…" />
        <p className="font-mono text-[11px] text-zinc-600">SMS segments: {smsSegments}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {LIMITS.map((l) => {
          const pct = Math.min(100, (len / l.limit) * 100);
          const state = len <= l.limit * 0.8 ? "ok" : len <= l.limit ? "warn" : "over";
          return (
            <div key={l.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-zinc-200">{l.name}</p>
                <p className={`font-mono text-xs ${state === "ok" ? "text-emerald-400" : state === "warn" ? "text-amber-400" : "text-red-400"}`}>
                  {len}/{l.limit}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${state === "ok" ? "bg-emerald-500" : state === "warn" ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {l.note && <p className="mt-1 text-[11px] text-zinc-600">{l.note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- Text Reverser ---------------------------- */

const FLIP_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  A: "∀", B: "ᗺ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I", J: "ſ", K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Ό", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
  "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "'", "?": "¿", "!": "¡", "'": ",", "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "&": "⅋", "_": "‾",
};

const REVERSE_MODES = [
  { id: "chars", label: "Characters" },
  { id: "words", label: "Word order" },
  { id: "lines", label: "Line order" },
  { id: "each-line", label: "Each line" },
  { id: "flip", label: "Upside down" },
] as const;

type ReverseMode = (typeof REVERSE_MODES)[number]["id"];

function applyReverse(text: string, mode: ReverseMode): string {
  switch (mode) {
    case "chars":
      return [...text].reverse().join("");
    case "words":
      return text.split(/(\s+)/).reverse().join("");
    case "lines":
      return text.split("\n").reverse().join("\n");
    case "each-line":
      return text.split("\n").map((l) => [...l].reverse().join("")).join("\n");
    case "flip":
      return [...text].reverse().map((c) => FLIP_MAP[c] ?? c).join("");
  }
}

export function TextReverserTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ReverseMode>("chars");
  const out = applyReverse(text, mode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {REVERSE_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m.id
                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tr-in" className={labelCls}>Input</Label>
          <Textarea id="tr-in" value={text} onChange={(e) => setText(e.target.value)} className={`${inputCls} min-h-40 text-sm`} placeholder="Type anything…" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className={labelCls}>Output</Label>
            <CopyButton text={out} label="Copy" />
          </div>
          <div className="min-h-40 whitespace-pre-wrap break-words rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-emerald-300">{out || <span className="text-zinc-600">Result appears here…</span>}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Symbol Picker ------------------------------ */

const SYMBOL_GROUPS: { name: string; items: string[] }[] = [
  { name: "Arrows", items: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "⇑", "⇓", "⇔", "↵", "⇧", "⌘", "⌥", "⌫", "⏎", "➔", "➜", "↪", "↩", "⤴", "⤵"] },
  { name: "Math", items: ["±", "×", "÷", "≈", "≠", "≤", "≥", "√", "∑", "∏", "∞", "∫", "π", "µ", "Δ", "°", "∴", "∝", "∈", "∉", "⊂", "⊃", "∨", "∧"] },
  { name: "Currency", items: ["$", "€", "£", "¥", "₹", "₨", "৳", "₽", "₿", "¢", "₩", "₫", "₱", "₺", "₴", "₦", "₡", "ₖ"] },
  { name: "Punctuation", items: ["…", "—", "–", "“", "”", "‘", "’", "«", "»", "‹", "›", "¡", "¿", "•", "‣", "·", "¶", "§", "†", "‡", "‰", "©", "®", "™"] },
  { name: "Stars & Shapes", items: ["★", "☆", "✦", "✧", "✩", "✪", "♥", "♡", "♦", "♠", "♣", "♢", "♤", "♧", "○", "◌", "◉", "◎", "☐", "☑", "☒", "✓", "✗", "⌂"] },
  { name: "Greek", items: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "Ω"] },
  { name: "Brackets", items: ["〔", "〕", "《", "》", "〈", "〉", "【", "】", "〖", "〗", "⌈", "⌉", "⌊", "⌋", "⟨", "⟩", "⁅", "⁆", "❨", "❩", "❰", "❱"] },
  { name: "Blocks", items: ["░", "▒", "▓", "█", "▄", "▀", "▌", "▐", "■", "□", "▪", "▫", "▬", "▮", "⊶", "⊷", "⋯", "⁝", "⣿", "⠿"] },
];

export function SymbolPickerTool() {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (ch: string) => {
    try {
      await navigator.clipboard.writeText(ch);
      setCopied(ch);
      setTimeout(() => setCopied((c) => (c === ch ? null : c)), 1200);
    } catch {
      /* clipboard blocked */
    }
  };

  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="sym-q" className={labelCls}>Filter symbols</Label>
        <Input id="sym-q" value={query} onChange={(e) => setQuery(e.target.value)} className={inputCls} placeholder="arrow, star, euro, alpha…" />
      </div>
      <div className="space-y-5">
        {SYMBOL_GROUPS.map((g) => {
          const items = q ? g.items.filter((c) => c.includes(q)) : g.items;
          const nameMatch = g.name.toLowerCase().includes(q);
          if (q && !nameMatch && items.length === 0) return null;
          return (
            <div key={g.name}>
              <p className="mono-kicker mb-2 text-zinc-500">{g.name.toLowerCase()}</p>
              <div className="flex flex-wrap gap-1.5">
                {(nameMatch && q ? g.items : items).map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    onClick={() => copy(c)}
                    aria-label={`Copy ${c}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-base transition-all ${
                      copied === c
                        ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:border-emerald-500/50 hover:bg-zinc-800 hover:text-emerald-300"
                    }`}
                  >
                    {copied === c ? "✓" : c}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-600">Click any symbol to copy it. Try searching “star”, “alpha” or “₹”.</p>
    </div>
  );
}

/* ---------------------------- Mock User Data Generator ---------------------- */

const FIRST_NAMES = ["Aarav", "Sofia", "Liam", "Maya", "Noah", "Zara", "Ethan", "Aisha", "Lucas", "Amara", "Omar", "Elena", "Ravi", "Ines", "Kofi", "Yuki", "Mateo", "Leila", "Arjun", "Freya", "Hassan", "Nora", "Diego", "Priya", "Felix", "Sana", "Jonas", "Tara", "Idris", "Clara"];
const LAST_NAMES = ["Khan", "Silva", "Nguyen", "Okafor", "Fernandez", "Haddad", "Kowalski", "Tanaka", "Meyer", "Ali", "Petrov", "Rossi", "Andersen", "Chowdhury", "Diallo", "Novak", "Rahman", "Lopez", "Berg", "Iqbal"];
const JOBS = ["Product Designer", "Frontend Developer", "Data Analyst", "Marketing Lead", "Founder", "Copywriter", "DevOps Engineer", "Product Manager", "QA Engineer", "Growth Marketer", "UX Researcher", "Sales Manager"];
const COMPANIES = ["Nimbus Labs", "PixelForge", "Datawise", "Northbeam", "Loopwork", "Brightside", "Quantica", "Fieldnote", "Stackline", "Wavecrest", "Orbit Digital", "Craftbase"];
const COUNTRIES: Record<string, { dial: string; digits: number; cities: string[] }> = {
  PK: { dial: "+92", digits: 10, cities: ["Karachi", "Lahore", "Islamabad", "Faisalabad"] },
  BD: { dial: "+880", digits: 10, cities: ["Dhaka", "Chattogram", "Sylhet", "Khulna"] },
  IN: { dial: "+91", digits: 10, cities: ["Mumbai", "Bengaluru", "Pune", "Delhi"] },
  US: { dial: "+1", digits: 10, cities: ["Austin", "Denver", "Portland", "Seattle"] },
  UK: { dial: "+44", digits: 10, cities: ["Manchester", "Leeds", "Bristol", "London"] },
  AE: { dial: "+971", digits: 9, cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
};
const AVATAR_COLORS = ["#10b981", "#14b8a6", "#f59e0b", "#38bdf8", "#a78bfa", "#fb7185", "#4ade80", "#fbbf24"];

interface MockUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  job: string;
  company: string;
  city: string;
  color: string;
}

export function MockDataTool() {
  const [count, setCount] = useState(8);
  const [country, setCountry] = useState("PK");
  const [users, setUsers] = useState<MockUser[]>([]);
  const [saved, setSaved] = useLocalStorage<MockUser[]>("mock-users", []);

  const generate = () => {
    const c = COUNTRIES[country];
    const out: MockUser[] = [];
    for (let i = 0; i < count; i++) {
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const num = Math.floor(Math.random() * 900 + 100);
      const uname = `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 90 + 10)}`;
      let phone = c.dial + " ";
      for (let d = 0; d < c.digits; d++) phone += Math.floor(Math.random() * 10);
      out.push({
        id: uid(),
        name: `${first} ${last}`,
        username: uname,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${num}@example.com`,
        phone,
        job: JOBS[Math.floor(Math.random() * JOBS.length)],
        company: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
        city: c.cities[Math.floor(Math.random() * c.cities.length)],
        color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      });
    }
    setUsers(out);
  };

  const initials = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const exportJson = () => downloadText("mock-users.json", JSON.stringify(users, null, 2), "application/json");
  const exportCsv = () => {
    const rows = [["name", "username", "email", "phone", "job", "company", "city"], ...users.map((u) => [u.name, u.username, u.email, u.phone.replace(/,/g, ""), u.job, u.company.replace(/,/g, ""), u.city])];
    downloadText("mock-users.csv", rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n"), "text/csv");
  };

  const list = users.length > 0 ? users : saved;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="md-count" className={labelCls}>How many</Label>
          <Input id="md-count" value={String(count)} onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} className={`${inputCls} h-9 w-20 text-center font-mono`} inputMode="numeric" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="md-country" className={labelCls}>Phone format</Label>
          <select
            id="md-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={`h-9 rounded-md border border-zinc-700 bg-zinc-900/70 px-2.5 text-sm text-zinc-100 focus-visible:border-emerald-500/60 ${inputCls}`}
          >
            {Object.keys(COUNTRIES).map((k) => (
              <option key={k} value={k}>{k} ({COUNTRIES[k].dial})</option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={generate} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
          <RefreshCw className="h-4 w-4" aria-hidden /> Generate
        </Button>
        {users.length > 0 && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setSaved(users)} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
              Keep this batch
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportJson} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
              JSON
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv} className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300">
              CSV
            </Button>
          </>
        )}
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-12 text-center text-sm text-zinc-500">
          Generate believable demo users for mockups and tests — names, emails, phones and avatars, all invented on your device.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((u) => (
            <div key={u.id} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-zinc-950"
                style={{ backgroundColor: u.color }}
                aria-hidden
              >
                {initials(u.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">{u.name}</p>
                <p className="truncate text-xs text-zinc-400">@{u.username} · {u.job}</p>
                <p className="truncate text-xs text-zinc-500">{u.email}</p>
                <p className="truncate font-mono text-[11px] text-zinc-600">{u.phone} · {u.city}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-zinc-600">
        All data is randomly invented — safe for demos, prototypes and UI tests. Emails use example.com on purpose.
      </p>
    </div>
  );
}
