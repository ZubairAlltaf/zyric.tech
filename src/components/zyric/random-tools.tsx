"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dices, Coins, Hash, ListChecks, RotateCcw } from "lucide-react";
import { inputCls, labelCls } from "./hooks";

/* ------------------------------- Coin Flip --------------------------------- */

function coinFace(n: number) {
  return n === 0 ? "Heads" : "Tails";
}

export function CoinFlipTool() {
  const [result, setResult] = useState<number | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => {
      const n = Math.floor(Math.random() * 2);
      setResult(n);
      setHistory((h) => [n, ...h].slice(0, 12));
      setFlipping(false);
    }, 500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={flip}
          aria-label="Flip the coin"
          className={`flex h-28 w-28 items-center justify-center rounded-full border-2 text-xl font-bold transition-all ${
            flipping
              ? "animate-spin border-amber-400 bg-amber-500/20 text-amber-200"
              : result === null
              ? "border-zinc-600 bg-zinc-800 text-zinc-300 hover:border-amber-400"
              : "border-amber-400 bg-amber-500/15 text-amber-300 shadow-[0_0_28px_rgba(245,158,11,0.25)]"
          }`}
          style={flipping ? { animationDuration: "0.5s" } : undefined}
        >
          {flipping ? "?" : result === null ? "Flip" : coinFace(result)}
        </button>
        <p className="text-sm text-zinc-400">
          {result === null ? "Click the coin to flip" : `Result: ${coinFace(result)}`}
        </p>
        {history.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {history.map((h, i) => (
              <span
                key={i}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  h === 0
                    ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-600/40 bg-zinc-700/30 text-zinc-300"
                }`}
              >
                {coinFace(h)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Dice ------------------------------------ */

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function DiceTool() {
  const [count, setCount] = useState(2);
  const [dice, setDice] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setTimeout(() => {
      setDice(Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1));
      setRolling(false);
    }, 400);
  };

  const total = dice.reduce((s, d) => s + d, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dice-count" className={labelCls}>Number of dice</Label>
          <Input
            id="dice-count"
            type="number"
            min={1}
            max={6}
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(6, Number(e.target.value) || 1)))
            }
            className={`${inputCls} w-24`}
          />
        </div>
        <Button
          onClick={roll}
          className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
        >
          <Dices className="h-4 w-4" aria-hidden /> Roll dice
        </Button>
      </div>
      {dice.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <div className={`flex flex-wrap justify-center gap-3 ${rolling ? "animate-pulse" : ""}`}>
            {dice.map((d, i) => (
              <span
                key={i}
                className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-emerald-500/40 bg-emerald-950/30 text-5xl text-emerald-200"
                aria-label={`Die ${i + 1}: ${d}`}
              >
                {DICE_FACES[d - 1]}
              </span>
            ))}
          </div>
          <p className="text-sm text-zinc-400">
            Total: <span className="font-bold text-emerald-400">{total}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Random Number ------------------------------ */

export function RandomNumberTool() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState(1);
  const [unique, setUnique] = useState(false);
  const [nums, setNums] = useState<number[]>([]);

  const pick = () => {
    const lo = Number(min), hi = Number(max);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return;
    const span = hi - lo + 1;
    if (unique && count > span) return;
    const out: number[] = [];
    const seen = new Set<number>();
    while (out.length < count) {
      const n = lo + Math.floor(Math.random() * span);
      if (unique && seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
    setNums(out);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="rn-min" className={labelCls}>Min</Label>
          <Input id="rn-min" type="number" value={min}
            onChange={(e) => setMin(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rn-max" className={labelCls}>Max</Label>
          <Input id="rn-max" type="number" value={max}
            onChange={(e) => setMax(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rn-count" className={labelCls}>How many</Label>
          <Input id="rn-count" type="number" min={1} max={100} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className={inputCls} />
        </div>
        <div className="flex items-end">
          <Button
            onClick={pick}
            className="w-full bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
          >
            <Hash className="h-4 w-4" aria-hidden /> Randomize
          </Button>
        </div>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={unique}
          onChange={(e) => setUnique(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-500"
        />
        No repeats (unique numbers)
      </label>
      {nums.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {nums.map((n, i) => (
            <span
              key={i}
              className="rounded-xl border border-emerald-800/50 bg-emerald-950/25 px-5 py-3 text-2xl font-bold text-emerald-300"
            >
              {n.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- List Picker ------------------------------- */

export function ListPickerTool() {
  const [raw, setRaw] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const items = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const pick = () => {
    if (items.length < 2 || picking) return;
    setPicking(true);
    const interval = setInterval(() => {
      setWinner(items[Math.floor(Math.random() * items.length)]);
    }, 80);
    setTimeout(() => {
      clearInterval(interval);
      setWinner(items[Math.floor(Math.random() * items.length)]);
      setPicking(false);
    }, 900);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="lp-input" className={labelCls}>
          Options — one per line ({items.length})
        </Label>
        <Textarea
          id="lp-input"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"Pizza\nBurgers\nSushi\nBiryani"}
          className={`min-h-36 resize-y text-sm ${inputCls}`}
        />
      </div>
      <Button
        onClick={pick}
        disabled={items.length < 2 || picking}
        className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
      >
        <ListChecks className="h-4 w-4" aria-hidden />
        {picking ? "Picking…" : "Pick a random option"}
      </Button>
      {winner && (
        <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/25 p-6 text-center">
          <p className={labelCls}>Winner</p>
          <p className={`mt-1 text-3xl font-bold text-emerald-300 ${picking ? "animate-pulse" : ""}`}>
            {winner}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Tabbed wrapper ----------------------------- */

const RANDOM_TABS = [
  { id: "coin", label: "Coin flip", icon: Coins, C: CoinFlipTool },
  { id: "dice", label: "Dice roller", icon: Dices, C: DiceTool },
  { id: "number", label: "Random numbers", icon: Hash, C: RandomNumberTool },
  { id: "list", label: "Pick from list", icon: ListChecks, C: ListPickerTool },
];

export function RandomPickerTool() {
  const [tab, setTab] = useState("coin");
  const active = RANDOM_TABS.find((t) => t.id === tab) ?? RANDOM_TABS[0];
  const Active = active.C;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Random tool mode">
        {RANDOM_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              tab === t.id
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>
      <div key={active.id}>
        <Active />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
        <RotateCcw className="h-3 w-3" aria-hidden />
        Switch modes freely — every draw is fresh randomness from your browser.
      </p>
    </div>
  );
}
