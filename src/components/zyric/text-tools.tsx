"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Pin,
  PinOff,
  StickyNote,
  RotateCcw,
} from "lucide-react";
import { CopyButton, Stat, inputCls, labelCls, uid, useLocalStorage } from "./hooks";

/* ---------------------------------- Notes --------------------------------- */

interface Note {
  id: string;
  text: string;
  color: number;
  pinned: boolean;
  updatedAt: number;
}

const NOTE_COLORS = [
  { name: "Zinc", card: "border-zinc-700 bg-zinc-800/60", dot: "bg-zinc-400" },
  { name: "Emerald", card: "border-emerald-800/60 bg-emerald-950/40", dot: "bg-emerald-400" },
  { name: "Amber", card: "border-amber-800/60 bg-amber-950/40", dot: "bg-amber-400" },
  { name: "Rose", card: "border-rose-800/60 bg-rose-950/40", dot: "bg-rose-400" },
  { name: "Teal", card: "border-teal-800/60 bg-teal-950/40", dot: "bg-teal-400" },
  { name: "Violet", card: "border-violet-800/60 bg-violet-950/40", dot: "bg-violet-400" },
];

export function NotesTool() {
  const [notes, setNotes] = useLocalStorage<Note[]>("notes", []);

  const addNote = () => {
    const note: Note = {
      id: uid(),
      text: "",
      color: Math.floor(Math.random() * NOTE_COLORS.length),
      pinned: false,
      updatedAt: Date.now(),
    };
    setNotes([note, ...notes]);
  };

  const update = (id: string, patch: Partial<Note>) =>
    setNotes(notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));

  const remove = (id: string) => setNotes(notes.filter((n) => n.id !== id));

  const sorted = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }),
    [notes]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {notes.length === 0
            ? "Create your first note — it saves automatically in this browser."
            : `${notes.length} note${notes.length > 1 ? "s" : ""} · saved locally, auto-saves as you type`}
        </p>
        <Button
          onClick={addNote}
          size="sm"
          className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" aria-hidden /> New note
        </Button>
      </div>

      {notes.length === 0 ? (
        <button
          type="button"
          onClick={addNote}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center transition-colors hover:border-emerald-600/50"
        >
          <StickyNote className="h-9 w-9 text-zinc-600" aria-hidden />
          <span className="font-medium text-zinc-200">No notes yet</span>
          <span className="text-sm text-zinc-500">
            Click here to create a note — everything stays on your device.
          </span>
        </button>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((note) => {
            const c = NOTE_COLORS[note.color % NOTE_COLORS.length];
            return (
              <div key={note.id} className={`flex flex-col rounded-xl border ${c.card} p-3`}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => update(note.id, { pinned: !note.pinned })}
                      aria-label={note.pinned ? "Unpin note" : "Pin note"}
                      className={`rounded-md p-1.5 transition-colors hover:bg-white/5 ${
                        note.pinned ? "text-amber-400" : "text-zinc-500"
                      }`}
                    >
                      {note.pinned ? <Pin className="h-3.5 w-3.5" aria-hidden /> : <PinOff className="h-3.5 w-3.5" aria-hidden />}
                    </button>
                    <button
                      type="button"
                      onClick={() => update(note.id, { color: (note.color + 1) % NOTE_COLORS.length })}
                      aria-label={`Change color (current: ${NOTE_COLORS[note.color % NOTE_COLORS.length].name})`}
                      className="rounded-md p-1.5 transition-colors hover:bg-white/5"
                    >
                      <span className={`block h-3 w-3 rounded-full ${c.dot}`} aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(note.id)}
                    aria-label="Delete note"
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <Textarea
                  value={note.text}
                  onChange={(e) => update(note.id, { text: e.target.value })}
                  placeholder="Start typing…"
                  aria-label="Note content"
                  className="min-h-36 resize-y border-0 bg-transparent p-1 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-0"
                />
                <p className="mt-1 text-right text-[10px] text-zinc-600">
                  {new Date(note.updatedAt).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Word Counter ------------------------------ */

export function WordCounterTool() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    const sentences = trimmed ? trimmed.split(/[.!?…]+[.!?… ]*$/m).join("").split(/[.!?…]+/).filter((s) => s.trim()) : [];
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()) : [];
    const readMin = words.length / 200;
    const speakMin = words.length / 130;
    const fmt = (m: number) =>
      m < 1 ? `${Math.max(1, Math.round(m * 60))} sec` : `${Math.round(m)} min`;
    return {
      words: words.length,
      chars: text.length,
      charsNoSpace: text.replace(/\s/g, "").length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      reading: fmt(readMin),
      speaking: fmt(speakMin),
    };
  }, [text]);

  return (
    <div className="space-y-5">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here — counts update live…"
        aria-label="Text to analyze"
        className={`min-h-48 resize-y text-sm ${inputCls}`}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Words" value={String(stats.words)} />
        <Stat label="Characters" value={String(stats.chars)} />
        <Stat label="No spaces" value={String(stats.charsNoSpace)} />
        <Stat label="Sentences" value={String(stats.sentences)} />
        <Stat label="Paragraphs" value={String(stats.paragraphs)} />
        <Stat label="Reading time" value={stats.reading} hint="~200 wpm" />
        <Stat label="Speaking time" value={stats.speaking} hint="~130 wpm" />
        <Stat label="Longest word" value={(() => {
          const w = text.trim().split(/\s+/).filter(Boolean);
          if (!w.length) return "—";
          return w.reduce((a, b) => (b.replace(/\W/g, "").length > a.replace(/\W/g, "").length ? b : a), "").slice(0, 14);
        })()} />
      </div>
      <div className="flex gap-2">
        <CopyButton text={text} label="Copy text" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setText("")}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ Case Converter ----------------------------- */

const words = (s: string) =>
  s.split(/[^a-zA-Z0-9]+/).filter(Boolean);

const CASES: { name: string; fn: (s: string) => string; example: string }[] = [
  { name: "UPPERCASE", fn: (s) => s.toUpperCase(), example: "HELLO WORLD" },
  { name: "lowercase", fn: (s) => s.toLowerCase(), example: "hello world" },
  {
    name: "Title Case",
    fn: (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    example: "Hello World",
  },
  {
    name: "Sentence case",
    fn: (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()),
    example: "Hello world. Again world",
  },
  {
    name: "camelCase",
    fn: (s) => words(s).map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join(""),
    example: "helloWorld",
  },
  {
    name: "PascalCase",
    fn: (s) => words(s).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(""),
    example: "HelloWorld",
  },
  {
    name: "snake_case",
    fn: (s) => words(s).map((w) => w.toLowerCase()).join("_"),
    example: "hello_world",
  },
  {
    name: "kebab-case",
    fn: (s) => words(s).map((w) => w.toLowerCase()).join("-"),
    example: "hello-world",
  },
  {
    name: "aLtErNaTe",
    fn: (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(""),
    example: "hElLo WoRlD",
  },
];

export function CaseConverterTool() {
  const [text, setText] = useState("");
  const [active, setActive] = useState("UPPERCASE");
  const current = CASES.find((c) => c.name === active) ?? CASES[0];
  const output = text ? current.fn(text) : "";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="case-input" className={labelCls}>
          Your text
        </Label>
        <Textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text to convert…"
          className={`min-h-28 resize-y text-sm ${inputCls}`}
        />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose case">
        {CASES.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setActive(c.name)}
            aria-pressed={active === c.name}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              active === c.name
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className={labelCls}>Result ({active})</Label>
          <div className="flex gap-2">
            <CopyButton text={output} label="Copy result" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setText(output)}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              Use as input
            </Button>
          </div>
        </div>
        <div className="min-h-20 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm break-words whitespace-pre-wrap text-zinc-100">
          {output || <span className="text-zinc-600">Result appears here…</span>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Lorem Ipsum -------------------------------- */

const LOREM_BANK = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui",
  "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
];

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

function makeSentence() {
  const len = 7 + randInt(8);
  const w = Array.from({ length: len }, () => LOREM_BANK[randInt(LOREM_BANK.length)]);
  const s = w.join(" ");
  return s[0].toUpperCase() + s.slice(1) + ".";
}

export function LoremTool() {
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState("paragraphs");
  const [startLorem, setStartLorem] = useState(true);
  const [output, setOutput] = useState("");

  const generate = () => {
    let result = "";
    if (unit === "words") {
      const w = Array.from({ length: count }, () => LOREM_BANK[randInt(LOREM_BANK.length)]);
      result = (startLorem ? "Lorem ipsum " : "") + w.join(" ");
      result = result[0].toUpperCase() + result.slice(1) + ".";
    } else if (unit === "sentences") {
      const parts = Array.from({ length: count }, makeSentence);
      result = (startLorem ? "Lorem ipsum dolor sit amet. " : "") + parts.join(" ");
    } else {
      const paras = Array.from(
        { length: count },
        () => Array.from({ length: 4 + randInt(3) }, makeSentence).join(" ")
      );
      if (startLorem && paras.length) {
        paras[0] = "Lorem ipsum dolor sit amet. " + paras[0];
      }
      result = paras.join("\n\n");
    }
    setOutput(result);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="lorem-count" className={labelCls}>Amount</Label>
          <Input
            id="lorem-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className={inputCls}
          />
        </div>
        <div className="space-y-2">
          <Label className={labelCls}>Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className={`w-full ${inputCls}`} aria-label="Unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              <SelectItem value="paragraphs">Paragraphs</SelectItem>
              <SelectItem value="sentences">Sentences</SelectItem>
              <SelectItem value="words">Words</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={generate}
            className="w-full bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Generate
          </Button>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={startLorem}
          onChange={(e) => setStartLorem(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
        />
        Start with &ldquo;Lorem ipsum dolor sit amet&rdquo;
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className={labelCls}>Output</Label>
          <CopyButton text={output} label="Copy" />
        </div>
        <div className="max-h-80 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
          {output || <span className="text-zinc-600">Click Generate to create placeholder text…</span>}
        </div>
      </div>
    </div>
  );
}
